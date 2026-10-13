// "Who am I" plus everything a signed-in person can change about themselves.
//
//   GET  /api/me                    both sessions + pending sign-up
//   /api/student/...                student-only
//   /api/admin/...                  admin-only

import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { User } from '../models.js'
import { fail, wrap } from '../lib/errors.js'
import {
  COOKIE, SHORT_SECONDS, clearCookie, needUser, readCookie, renewCookie, sessionUser, setCookie,
} from '../lib/session.js'
import { adminShape, eraseAccount, studentShape } from '../lib/accounts.js'
import { baseCourseCodes, hasCourse, levelsOfProgramme, programmes } from '../lib/courses.js'
import { checkSchoolEmail, emailProblem, passwordProblem, roleProblem, usernameProblem } from '../../src/lib/schoolEmail.js'
import { FACULTIES, facultyOf } from '../../src/data/faculties.js'

export const meRouter = Router()

const FIVE_MINUTES = 5 * 60 * 1000

meRouter.get('/', wrap(async (req, res) => {
  const [student, admin] = await Promise.all([sessionUser(req, 'student'), sessionUser(req, 'admin')])

  // A sign-up that still needs its Google step (works from any device: the
  // state lives on the account, not in this browser).
  let pending = null
  const ticket = readCookie(req, COOKIE.pending)
  if (ticket?.uid) {
    const user = await User.findById(ticket.uid).select('email role status')
    if (user && user.status === 'unverified') pending = { email: user.email, role: user.role }
    else clearCookie(res, COOKIE.pending)
  }

  // "Last seen", written at most every few minutes.
  for (const found of [student, admin]) {
    const seen = found?.user.lastSeenAt?.getTime() || 0
    if (found && Date.now() - seen > FIVE_MINUTES) {
      await User.updateOne({ _id: found.user._id }, { lastSeenAt: new Date() })
    }
  }

  // Coming back restarts the 6-month clock (only for accounts that still exist).
  if (student) renewCookie(req, res, COOKIE.student)
  if (admin) renewCookie(req, res, COOKIE.admin)

  const impersonated = [student, admin].find(found => found?.impersonated)

  res.json({
    student: student ? studentShape(student.user) : null,
    admin: admin ? adminShape(admin.user) : null,
    pending,
    impersonating: impersonated
      ? { role: impersonated.user.role, email: impersonated.user.email, expiresAt: impersonated.expiresAt }
      : null,
  })
}))

/* ------------------------- routes both roles share ------------------------ */

function sharedRoutes(router, role) {
  const shape = role === 'admin' ? adminShape : studentShape

  router.patch('/profile', needUser(role), wrap(async (req, res) => {
    const problem = usernameProblem(req.body?.username)
    if (problem) throw fail(400, 'BAD_USERNAME', problem)

    const value = String(req.body.username).trim()
    req.user.username = value.charAt(0).toUpperCase() + value.slice(1)
    await req.user.save()
    res.json({ me: shape(req.user) })
  }))

  router.post('/password', needUser(role), wrap(async (req, res) => {
    if (req.impersonated) {
      throw fail(403, 'IMPERSONATED', "You're viewing this account as the site owner, so its password can't be changed.")
    }

    const { current, next } = req.body || {}
    if (!(await bcrypt.compare(String(current || ''), req.user.passwordHash))) {
      throw fail(400, 'WRONG_PASSWORD', "Your current password isn't right. Check it and try again.")
    }
    const problem = passwordProblem(next)
    if (problem) throw fail(400, 'BAD_PASSWORD', problem)
    if (current === next) {
      throw fail(400, 'SAME_PASSWORD', 'Your new password is the same as the old one. Choose a different one.')
    }

    req.user.passwordHash = await bcrypt.hash(String(next), 10)
    await req.user.save()
    res.json({ ok: true })
  }))

  // Delete the account for good. The password is asked for again so a borrowed
  // phone or an open tab can't do it by accident.
  router.delete('/account', needUser(role), wrap(async (req, res) => {
    if (req.impersonated) {
      throw fail(403, 'IMPERSONATED', "You're viewing this account as the site owner. Delete it from the Users page instead.")
    }

    if (!(await bcrypt.compare(String(req.body?.password || ''), req.user.passwordHash))) {
      throw fail(
        400,
        'WRONG_PASSWORD',
        "That password isn't right, so the account was not deleted. Type your current password to confirm."
      )
    }

    await eraseAccount(req.user)
    for (const name of [COOKIE[role], COOKIE.pending, COOKIE.reset, COOKIE.forgot, COOKIE.emailChange]) {
      clearCookie(res, name)
    }
    res.json({ ok: true })
  }))

  // Changing the email is re-verified with Google, so the new address is proven
  // to belong to them. This only opens that door; the callback finishes it.
  router.post('/email', needUser(role), wrap(async (req, res) => {
    if (req.impersonated) {
      throw fail(403, 'IMPERSONATED', "You're viewing this account as the site owner, so its email can't be changed.")
    }

    const checked = checkSchoolEmail(req.body?.email)
    if (!checked.ok) throw fail(400, 'BAD_EMAIL', emailProblem(checked.reason))

    const problem = roleProblem(role, checked.kind)
    if (problem) throw fail(400, 'STUDENT_EMAIL_ON_ADMIN', problem)

    if (checked.email === req.user.email) {
      throw fail(400, 'SAME_EMAIL', 'That is already the email on this account.')
    }
    if (await User.exists({ email: checked.email, role })) {
      throw fail(409, 'EMAIL_TAKEN', `There is already a ${role} account using ${checked.email}.`)
    }

    setCookie(res, COOKIE.emailChange, { uid: String(req.user._id), role, newEmail: checked.email }, SHORT_SECONDS)
    res.json({ url: '/api/auth/google/start?purpose=email-change' })
  }))
}

/* --------------------------------- student -------------------------------- */

export const studentRouter = Router()
sharedRoutes(studentRouter, 'student')

// Every course can be added or removed - nothing is locked to the programme.
// Change course of study and level. With `resetCourses` the course list becomes
// that programme + level's courses; without it the list is left exactly as is.
studentRouter.put('/programme', needUser('student'), wrap(async (req, res) => {
  const programme = String(req.body?.programme || '')
  const level = String(req.body?.level || '')

  if (!programmes().includes(programme)) {
    throw fail(400, 'BAD_PROGRAMME', 'Choose your course of study from the list.')
  }
  const levels = levelsOfProgramme(programme)
  if (!levels.includes(level)) {
    throw fail(400, 'BAD_LEVEL', `Choose a level. ${programme} has these levels: ${levels.join(', ')}.`)
  }

  req.user.programme = programme
  req.user.level = level
  if (req.body?.resetCourses === true) req.user.courses = baseCourseCodes(programme, level)

  await req.user.save()
  res.json({ me: studentShape(req.user) })
}))

studentRouter.put('/courses', needUser('student'), wrap(async (req, res) => {
  const list = req.body?.courses
  if (!Array.isArray(list) || list.length > 80) {
    throw fail(400, 'BAD_COURSES', "We couldn't read that course list. Refresh the page and try again.")
  }

  const seen = new Set()
  const courses = []
  for (const code of list) {
    if (typeof code !== 'string' || !hasCourse(code) || seen.has(code)) continue
    seen.add(code)
    courses.push(code)
  }

  req.user.courses = courses
  await req.user.save()
  res.json({ me: studentShape(req.user) })
}))

/* ---------------------------------- admin --------------------------------- */

export const adminRouter = Router()
sharedRoutes(adminRouter, 'admin')

adminRouter.put('/department', needUser('admin'), wrap(async (req, res) => {
  const department = String(req.body?.department || '')
  const faculty = facultyOf(department)
  if (!faculty) {
    throw fail(
      400,
      'BAD_DEPARTMENT',
      `Choose one of the listed departments (${FACULTIES.length} faculties are available).`
    )
  }

  req.user.department = department
  req.user.faculty = faculty
  await req.user.save()
  res.json({ me: adminShape(req.user) })
}))
