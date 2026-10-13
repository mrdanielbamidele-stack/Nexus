// Shared account helpers: what the browser is told about a user, and the
// explanations for "that account isn't there".

import { fail } from './errors.js'
import { Event, Paper, Throttle, User } from '../models.js'
import { roleProblem } from '../../src/lib/schoolEmail.js'

const escapeRegex = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Remove an account completely, so the same email can sign up again as a
// brand-new person: the account, its usage history and its sign-in lockouts.
// Papers it uploaded stay (students are using them) but no longer name anyone.
export async function eraseAccount(user) {
  await Promise.all([
    Event.deleteMany({ userId: user._id }),
    Paper.updateMany(
      { uploaderId: user._id },
      { $set: { uploaderId: null, uploaderName: null, uploaderEmail: null, uploaderRole: null } }
    ),
    Throttle.deleteMany({ _id: new RegExp(`^login:.*:${escapeRegex(user.email)}$`) }),
  ])
  await User.deleteOne({ _id: user._id })
}

export const roleName = role => (role === 'admin' ? 'admin' : 'student')

export function parseRole(value) {
  if (value === 'student' || value === 'admin') return value
  throw fail(400, 'BAD_ROLE', 'Something went wrong with that form. Refresh the page and try again.')
}

export function studentShape(user) {
  return {
    id: String(user._id),
    role: 'student',
    email: user.email,
    username: user.username,
    regNumber: user.regNumber || user.email.split('@')[0],
    programme: user.programme,
    level: user.level,
    courses: user.courses || [],
  }
}

export function adminShape(user) {
  return {
    id: String(user._id),
    role: 'admin',
    email: user.email,
    username: user.username,
    faculty: user.faculty || null,
    department: user.department || null,
    needsDepartment: !user.department,
  }
}

export const shapeOf = user => (user.role === 'admin' ? adminShape(user) : studentShape(user))

// Where a person should land after signing in.
export const nextStepFor = user => (user.role === 'admin' && !user.department ? 'department' : 'home')

// "There is no <role> account for this email" - said in the way that helps most:
// if the OTHER kind of account exists, tell them so and point at creating one.
export async function noAccountError(email, role, kind) {
  if (role === 'admin' && kind === 'student') {
    return fail(400, 'STUDENT_EMAIL_ON_ADMIN', roleProblem('admin', 'student'), { email, role })
  }

  const otherRole = role === 'admin' ? 'student' : 'admin'
  const other = await User.exists({ email, role: otherRole })

  if (other) {
    return fail(
      404,
      role === 'admin' ? 'NO_ADMIN_ACCOUNT' : 'NO_STUDENT_ACCOUNT',
      `There is only ${otherRole === 'admin' ? 'an admin' : 'a student'} account associated with ${email}, ` +
        `not ${role === 'admin' ? 'an admin' : 'a student'} account. ` +
        `Create ${role === 'admin' ? 'an admin' : 'a student'} account to continue.`,
      { email, role, hasOther: true }
    )
  }

  return fail(
    404,
    'NO_ACCOUNT',
    `We couldn't find ${role === 'admin' ? 'an admin' : 'a student'} account for ${email}. ` +
      'Check the spelling, or create an account.',
    { email, role }
  )
}
