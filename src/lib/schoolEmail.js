// The one rule for who may have an account on Nexus: a @topfaith.edu.ng address.
//
// This file is imported by BOTH the browser (to give instant feedback) and the
// server (which is the real gatekeeper). Keep it free of browser/Node APIs.
//
//   starts with a number  -> student   (202500062@topfaith.edu.ng)
//   starts with a letter  -> staff     (bamidele@topfaith.edu.ng)

export const SCHOOL_DOMAIN = 'topfaith.edu.ng'
export const EXAMPLE_STUDENT_EMAIL = `202500062@${SCHOOL_DOMAIN}`
export const EXAMPLE_STAFF_EMAIL = `bamidele@${SCHOOL_DOMAIN}`

export const normalizeEmail = raw => String(raw ?? '').trim().toLowerCase()

// { ok: true, email, local, kind: 'student' | 'staff' }
// { ok: false, reason: 'EMPTY' | 'MALFORMED' | 'WRONG_DOMAIN' }
export function checkSchoolEmail(raw) {
  const email = normalizeEmail(raw)
  if (!email) return { ok: false, reason: 'EMPTY' }

  const at = email.indexOf('@')
  if (at < 1 || at !== email.lastIndexOf('@')) return { ok: false, reason: 'MALFORMED' }

  const local = email.slice(0, at)
  const domain = email.slice(at + 1)
  if (domain !== SCHOOL_DOMAIN) return { ok: false, reason: 'WRONG_DOMAIN' }
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(local)) return { ok: false, reason: 'MALFORMED' }

  return { ok: true, email, local, kind: /^[0-9]/.test(local) ? 'student' : 'staff' }
}

// Plain-language explanation for a failed check.
export function emailProblem(reason) {
  switch (reason) {
    case 'EMPTY':
      return `Enter your school email`
    case 'WRONG_DOMAIN':
      return `Nexus only accepts school emails ending in @${SCHOOL_DOMAIN}. Other addresses, like Gmail or Yahoo, can't be used.`
    default:
      return `That doesn't look like the school email.`
  }
}

// Student sign-ups need a number-first email; admin sign-ups a letter-first one.
// Returns null when the email fits the role, otherwise what to tell the person.
export function roleProblem(role, kind) {
  if (role === 'admin' && kind === 'student') {
    return `Admin accounts are for staff, and staff emails start with a letter (like ${EXAMPLE_STAFF_EMAIL}). `
      + 'Yours starts with a number, so it is a student email. Please sign up as a student instead.'
  }
  return null
}

export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 72 // bcrypt only reads the first 72 bytes

export function passwordProblem(password) {
  const value = String(password ?? '')
  if (value.length < PASSWORD_MIN) return `Your password needs at least ${PASSWORD_MIN} characters.`
  if (value.length > PASSWORD_MAX) return `Your password can be at most ${PASSWORD_MAX} characters.`
  if (!value.trim()) return 'Your password can\'t be only spaces.'
  return null
}

export const hasEmoji = text => /\p{Extended_Pictographic}/u.test(text)

export function usernameProblem(name) {
  const value = String(name ?? '').trim()
  if (!value) return 'Please choose a username.'
  if (value.length < 2) return 'Your username needs at least 2 characters.'
  if (value.length > 30) return 'Your username can be at most 30 characters.'
  if (hasEmoji(value)) return 'Your username can\'t contain emojis.'
  return null
}
