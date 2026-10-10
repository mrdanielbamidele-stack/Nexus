// Sessions are signed tokens in httpOnly cookies - the browser's JavaScript can
// never read them, and every one carries its own expiry.
//
//   nx_s  student session          nx_a  admin session
//   nx_p  signed up, not verified  nx_r  allowed to set a new password
//   nx_f  started "forgot password" nx_e  started an email change
//   nx_o  Google round-trip guard  nx_d  /delealone session

import jwt from 'jsonwebtoken'
import { env, isProd, need } from './env.js'
import { fail } from './errors.js'
import { User } from '../models.js'

export const COOKIE = {
  student: 'nx_s',
  admin: 'nx_a',
  pending: 'nx_p',
  reset: 'nx_r',
  forgot: 'nx_f',
  emailChange: 'nx_e',
  oauth: 'nx_o',
  dele: 'nx_d',
}

export const DAY = 24 * 60 * 60
export const SESSION_SECONDS = 30 * DAY
export const PENDING_SECONDS = 14 * DAY
export const SHORT_SECONDS = 10 * 60 // reset / forgot / email change / google round trip
export const DELE_SECONDS = 6 * 60 * 60
export const IMPERSONATE_SECONDS = 10 * 60

function secret() {
  const value = need('SESSION_SECRET', 'Signing in')
  if (value.length < 16) {
    console.error('[config] SESSION_SECRET is too short - use at least 32 random characters')
    throw fail(503, 'NOT_CONFIGURED', "Signing in isn't switched on yet. This is a setup problem on our side.")
  }
  return value
}

export const sign = (payload, seconds) => jwt.sign(payload, secret(), { expiresIn: seconds })

export function verify(token) {
  if (!token) return null
  try {
    return jwt.verify(token, secret())
  } catch (err) {
    if (err?.code === 'NOT_CONFIGURED') throw err
    return null
  }
}

const cookieOptions = () => ({ httpOnly: true, secure: isProd(), sameSite: 'lax', path: '/' })

export function setCookie(res, name, payload, seconds) {
  res.cookie(name, sign(payload, seconds), { ...cookieOptions(), maxAge: seconds * 1000 })
}

export const clearCookie = (res, name) => res.clearCookie(name, cookieOptions())

export const readCookie = (req, name) => verify(req.cookies?.[name])

/* ---------------------------- signed-in person ---------------------------- */

// The verified account behind the student/admin cookie, or null.
export async function sessionUser(req, role) {
  const token = readCookie(req, COOKIE[role])
  if (!token?.uid || token.role !== role) return null

  const user = await User.findById(token.uid)
  if (!user || user.role !== role || user.status !== 'verified') return null

  return { user, impersonated: Boolean(token.imp), expiresAt: token.exp ? new Date(token.exp * 1000) : null }
}

export const needUser = role => async (req, res, next) => {
  try {
    const found = await sessionUser(req, role)
    if (!found) {
      throw fail(
        401,
        'SIGNED_OUT',
        role === 'admin'
          ? 'Your admin session has ended. Please sign in again.'
          : 'Your session has ended. Please sign in again.'
      )
    }
    req.user = found.user
    req.impersonated = found.impersonated
    next()
  } catch (err) {
    next(err)
  }
}

// Whoever is signed in, if anyone. `prefer` says which account to try first
// (the admin pages prefer the admin account, the student pages the student one).
export async function whoIsThis(req, prefer = 'student') {
  const order = prefer === 'admin' ? ['admin', 'student'] : ['student', 'admin']
  for (const role of order) {
    const found = await sessionUser(req, role)
    if (found) return found
  }
  return null
}

export function startSession(res, user, { seconds = SESSION_SECONDS, impersonated = false } = {}) {
  const payload = { uid: String(user._id), role: user.role }
  if (impersonated) payload.imp = true
  setCookie(res, COOKIE[user.role], payload, seconds)
  clearCookie(res, COOKIE.pending)
}

export function clientIp(req) {
  return (
    req.headers['x-nf-client-connection-ip'] ||
    String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.ip ||
    'unknown'
  )
}

// Where the site lives, as the browser sees it (used to build the Google
// redirect address). APP_URL wins when set.
export function siteOrigin(req) {
  const configured = env('APP_URL').replace(/\/+$/, '')
  if (configured) return configured
  const proto = String(req.headers['x-forwarded-proto'] || req.protocol || 'http').split(',')[0].trim()
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'localhost').split(',')[0].trim()
  return `${proto}://${host}`
}
