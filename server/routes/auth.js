// Sign up, sign in, "Continue with Google", forgot/reset password.
//
// The life of an account:
//   sign up  -> UNVERIFIED account (+ a "pending" cookie)
//   Google   -> proves the school email -> VERIFIED and signed in
//   sign in  -> email + password; an unverified account is sent back to Google
//   forgot   -> Google proves the email again -> choose a new password

import crypto from 'node:crypto'
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { User } from '../models.js'
import { fail, wrap } from '../lib/errors.js'
import {
  COOKIE, PENDING_SECONDS, SHORT_SECONDS,
  clearCookie, clientIp, readCookie, sessionUser, setCookie, sign, startSession, verify,
} from '../lib/session.js'
import { forget, limit } from '../lib/throttle.js'
import { authUrl, identity } from '../lib/google.js'
import { baseCourseCodes, levelsOfProgramme, programmes } from '../lib/courses.js'
import {
  nextStepFor, noAccountError, parseRole, roleName, shapeOf,
} from '../lib/accounts.js'
import {
  checkSchoolEmail, emailProblem, passwordProblem, roleProblem, usernameProblem,
} from '../../src/lib/schoolEmail.js'

const router = Router()

const authPath = role => (role === 'admin' ? '/admin' : '/auth')
const homePath = user => (user.role === 'admin' ? '/admin' : '/')

async function markVerified(user) {
  if (user.status === 'verified') return
  user.status = 'verified'
  user.verifiedAt = new Date()
  await user.save()
}

// Read, validate and return the school email, or throw the explanation.
function schoolEmailOrThrow(raw, role) {
  const checked = checkSchoolEmail(raw)
  if (!checked.ok) throw fail(400, 'BAD_EMAIL', emailProblem(checked.reason))
  const problem = roleProblem(role, checked.kind)
  if (problem) throw fail(400, 'STUDENT_EMAIL_ON_ADMIN', problem)
  return checked
}

/* --------------------------------- sign up -------------------------------- */

router.post('/signup', wrap(async (req, res) => {
  const body = req.body || {}
  const role = parseRole(body.role)
  await limit(`signup:${clientIp(req)}`, { max: 20, windowSec: 3600, what: 'sign-up attempts' })

  const checked = schoolEmailOrThrow(body.email, role)
  const email = checked.email

  const nameProblem = usernameProblem(body.username)
  if (nameProblem) throw fail(400, 'BAD_USERNAME', nameProblem)

  const passProblem = passwordProblem(body.password)
  if (passProblem) throw fail(400, 'BAD_PASSWORD', passProblem)

  let programme
  let level
  if (role === 'student') {
    programme = String(body.programme || '')
    level = String(body.level || '')
    if (!programmes().includes(programme)) {
      throw fail(400, 'BAD_PROGRAMME', 'Choose your course of study from the list.')
    }
    if (!levelsOfProgramme(programme).includes(level)) {
      throw fail(400, 'BAD_LEVEL', `Choose your level. ${programme} has levels ${levelsOfProgramme(programme).join(', ')}.`)
    }

    // A staff email can hold a student account too - but make sure it's on purpose.
    if (checked.kind === 'staff' && body.confirmStaffAsStudent !== true) {
      throw fail(
        409,
        'CONFIRM_STAFF_AS_STUDENT',
        `${email} is a staff email (it starts with a letter). Are you sure you want to sign up as a student and not as an admin?`,
        { email }
      )
    }
  }

  const existing = await User.findOne({ email, role })

  if (existing?.status === 'verified') {
    throw fail(
      409,
      'ACCOUNT_EXISTS',
      `There is already a ${roleName(role)} account for ${email}. Sign in instead, or use "Forgot password" if you can't remember the password.`,
      { email, role }
    )
  }

  if (existing && body.overwrite !== true) {
    throw fail(
      409,
      'UNVERIFIED_EXISTS',
      `A sign-up for ${email} was started earlier but never finished. Should these new details replace the old ones?`,
      { email, role }
    )
  }

  const fields = {
    email,
    role,
    username: String(body.username).trim(),
    passwordHash: await bcrypt.hash(String(body.password), 10),
    status: 'unverified',
  }
  if (role === 'student') {
    Object.assign(fields, {
      regNumber: checked.local,
      programme,
      level,
      courses: baseCourseCodes(programme, level),
    })
  }

  let user
  try {
    user = existing ? Object.assign(existing, fields) : new User(fields)
    await user.save()
  } catch (err) {
    if (err?.code === 11000) {
      throw fail(409, 'ACCOUNT_EXISTS', `There is already a ${roleName(role)} account for ${email}. Please sign in instead.`)
    }
    throw err
  }

  setCookie(res, COOKIE.pending, { uid: String(user._id), role }, PENDING_SECONDS)
  res.status(201).json({ next: 'verify', email, role })
}))

/* --------------------------------- sign in -------------------------------- */

router.post('/login', wrap(async (req, res) => {
  const body = req.body || {}
  const role = parseRole(body.role)
  const checked = schoolEmailOrThrow(body.email, role)
  const email = checked.email

  const attemptKey = `login:${clientIp(req)}:${email}`
  await limit(attemptKey, { max: 8, windowSec: 15 * 60, what: 'sign-in attempts' })

  if (!body.password) throw fail(400, 'NO_PASSWORD', 'Enter your password.')

  const user = await User.findOne({ email, role })
  if (!user) throw await noAccountError(email, role, checked.kind)

  const matches = await bcrypt.compare(String(body.password), user.passwordHash)
  if (!matches) {
    throw fail(
      401,
      'WRONG_PASSWORD',
      `That password isn't right for ${email}. Check it and try again, or use "Forgot password" to set a new one.`
    )
  }

  await forget(attemptKey)

  // Right password, but the school email was never confirmed with Google.
  if (user.status !== 'verified') {
    setCookie(res, COOKIE.pending, { uid: String(user._id), role }, PENDING_SECONDS)
    return res.json({ next: 'verify', email, role })
  }

  user.lastLoginAt = new Date()
  await user.save()
  startSession(res, user)
  res.json({ next: nextStepFor(user), me: shapeOf(user) })
}))

router.post('/logout', wrap(async (req, res) => {
  const role = req.body?.role
  const names = role === 'admin' ? [COOKIE.admin] : role === 'student' ? [COOKIE.student] : [COOKIE.student, COOKIE.admin]
  for (const name of [...names, COOKIE.pending, COOKIE.reset]) clearCookie(res, name)
  res.json({ ok: true })
}))

/* ---------------------------- forgot / reset ------------------------------ */

router.post('/forgot', wrap(async (req, res) => {
  const body = req.body || {}
  const role = parseRole(body.role)
  const checked = schoolEmailOrThrow(body.email, role)
  const email = checked.email
  await limit(`forgot:${clientIp(req)}`, { max: 10, windowSec: 3600, what: 'password reset attempts' })

  const user = await User.findOne({ email, role })
  if (!user) throw await noAccountError(email, role, checked.kind)

  setCookie(res, COOKIE.forgot, { role, email }, SHORT_SECONDS)
  res.json({ url: '/api/auth/google/start?purpose=reset' })
}))

router.post('/reset', wrap(async (req, res) => {
  const ticket = readCookie(req, COOKIE.reset)
  if (!ticket?.uid) {
    throw fail(
      401,
      'RESET_EXPIRED',
      'That password reset has timed out. Start again from "Forgot password" - it only takes a moment.'
    )
  }

  const problem = passwordProblem(req.body?.password)
  if (problem) throw fail(400, 'BAD_PASSWORD', problem)

  const user = await User.findById(ticket.uid)
  if (!user) throw fail(404, 'NO_ACCOUNT', "We couldn't find that account any more. Please sign up again.")

  user.passwordHash = await bcrypt.hash(String(req.body.password), 10)
  user.status = 'verified' // Google already proved the email
  user.verifiedAt ||= new Date()
  user.lastLoginAt = new Date()
  await user.save()

  clearCookie(res, COOKIE.reset)
  startSession(res, user)
  res.json({ next: nextStepFor(user), me: shapeOf(user) })
}))

/* ------------------------------ Google OAuth ------------------------------ */

function redirectWithError(res, err, role) {
  const message = err?.status && err?.message
    ? err.message
    : 'Something went wrong while signing in with Google. Please try again.'
  if (!err?.status) console.error('[auth] google flow failed:', err)
  res.redirect(`${authPath(role)}?error=${encodeURIComponent(message)}`)
}

// Step 1: send the person to Google.
router.get('/google/start', wrap(async (req, res) => {
  const purpose = String(req.query.purpose || 'login')
  let role = req.query.role === 'admin' ? 'admin' : 'student'

  try {
    let loginHint

    if (purpose === 'verify') {
      const pending = readCookie(req, COOKIE.pending)
      if (!pending) {
        throw fail(
          401,
          'NO_PENDING',
          'Your sign-up session has ended. Sign in with your school email and password and we will pick up where you left off.'
        )
      }
      role = pending.role
      loginHint = (await User.findById(pending.uid).select('email'))?.email
    } else if (purpose === 'reset') {
      const forgot = readCookie(req, COOKIE.forgot)
      if (!forgot) throw fail(401, 'NO_FORGOT', 'Start again from "Forgot password" - that request has timed out.')
      role = forgot.role
      loginHint = forgot.email
    } else if (purpose === 'email-change') {
      const change = readCookie(req, COOKIE.emailChange)
      if (!change) throw fail(401, 'NO_EMAIL_CHANGE', 'That email change has timed out. Start again from Settings.')
      role = change.role
      loginHint = change.newEmail
    } else if (purpose !== 'login') {
      throw fail(400, 'BAD_PURPOSE', 'Something went wrong with that button. Refresh the page and try again.')
    }

    // The nonce ties the Google round trip to THIS browser.
    const nonce = crypto.randomBytes(16).toString('hex')
    setCookie(res, COOKIE.oauth, { nonce }, SHORT_SECONDS)
    const state = sign({ purpose, role, nonce }, SHORT_SECONDS)

    res.redirect(authUrl(req, { state, loginHint }))
  } catch (err) {
    redirectWithError(res, err, role)
  }
}))

// Step 2: Google sends them back here.
router.get('/google/callback', wrap(async (req, res) => {
  const state = verify(String(req.query.state || ''))
  const role = state?.role === 'admin' ? 'admin' : 'student'

  try {
    if (req.query.error) {
      throw fail(
        400,
        'GOOGLE_CANCELLED',
        'The Google sign-in was cancelled. Tap "Continue with Google" whenever you\'re ready to try again.'
      )
    }

    const guard = readCookie(req, COOKIE.oauth)
    if (!state || !guard || guard.nonce !== state.nonce) {
      throw fail(
        400,
        'BAD_STATE',
        'That Google sign-in has expired, or it was opened in a different browser. Please start again.'
      )
    }
    clearCookie(res, COOKIE.oauth)

    const who = await identity(req, String(req.query.code || ''))
    const target = await finishGoogle(req, res, state.purpose, role, who)
    res.redirect(target)
  } catch (err) {
    redirectWithError(res, err, role)
  }
}))

async function finishGoogle(req, res, purpose, role, who) {
  if (purpose === 'verify') {
    const pending = readCookie(req, COOKIE.pending)
    const user = pending && (await User.findById(pending.uid))
    if (!user) {
      throw fail(
        401,
        'NO_PENDING',
        'Your sign-up session has ended. Sign in with your school email and password and we will pick up where you left off.'
      )
    }
    if (user.email !== who.email) {
      throw fail(
        403,
        'WRONG_GOOGLE_ACCOUNT',
        `You signed in with ${who.email}, but this sign-up is for ${user.email}. ` +
          `Tap "Continue with Google" again and choose ${user.email}.`
      )
    }
    await markVerified(user)
    user.lastLoginAt = new Date()
    await user.save()
    startSession(res, user)
    return homePath(user)
  }

  if (purpose === 'login') {
    const user = await User.findOne({ email: who.email, role })
    if (!user) throw await noAccountError(who.email, role, who.kind)
    await markVerified(user) // Google just proved they own this email
    user.lastLoginAt = new Date()
    await user.save()
    startSession(res, user)
    return homePath(user)
  }

  if (purpose === 'reset') {
    const forgot = readCookie(req, COOKIE.forgot)
    if (!forgot) throw fail(401, 'NO_FORGOT', 'That password reset has timed out. Start again from "Forgot password".')
    if (who.email !== forgot.email) {
      throw fail(
        403,
        'WRONG_GOOGLE_ACCOUNT',
        `You signed in with ${who.email}, but the account you're resetting is ${forgot.email}. ` +
          `Start again and choose ${forgot.email}.`
      )
    }
    const user = await User.findOne({ email: forgot.email, role: forgot.role })
    if (!user) throw await noAccountError(forgot.email, forgot.role, who.kind)

    clearCookie(res, COOKIE.forgot)
    setCookie(res, COOKIE.reset, { uid: String(user._id) }, SHORT_SECONDS)
    return `${authPath(role)}?step=reset`
  }

  if (purpose === 'email-change') {
    const change = readCookie(req, COOKIE.emailChange)
    const found = change && (await sessionUser(req, change.role))
    if (!found || String(found.user._id) !== change.uid) {
      throw fail(401, 'SIGNED_OUT', 'Your session ended before the email could be changed. Sign in and try again.')
    }
    if (who.email !== change.newEmail) {
      throw fail(
        403,
        'WRONG_GOOGLE_ACCOUNT',
        `You signed in with ${who.email}, but you asked to change your email to ${change.newEmail}. ` +
          `Start again and choose ${change.newEmail}.`
      )
    }
    if (await User.exists({ email: who.email, role: found.user.role, _id: { $ne: found.user._id } })) {
      throw fail(409, 'EMAIL_TAKEN', `There is already a ${found.user.role} account using ${who.email}.`)
    }

    found.user.email = who.email
    if (found.user.role === 'student' && who.kind === 'student') found.user.regNumber = who.email.split('@')[0]
    await found.user.save()
    clearCookie(res, COOKIE.emailChange)

    return found.user.role === 'admin' ? '/admin/settings?emailChanged=1' : '/settings?section=account&emailChanged=1'
  }

  throw fail(400, 'BAD_PURPOSE', 'Something went wrong with that button. Refresh the page and try again.')
}

export default router
