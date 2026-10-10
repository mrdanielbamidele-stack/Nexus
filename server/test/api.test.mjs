// End-to-end check of the API against a throwaway in-memory MongoDB.
//   npm run test:api
//   (with mongod already installed, set MONGOMS_SYSTEM_BINARY to its path to skip a big download)
//
// Google itself can't be reached from a test, so "continue with Google" is
// simulated by marking the account verified in the database - everything
// around it (rules, cookies, messages, moderation) is exercised for real.

import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { MongoMemoryServer } from 'mongodb-memory-server'

let mongod
let server
let base
let User
let Paper

before(async () => {
  mongod = await MongoMemoryServer.create()
  Object.assign(process.env, {
    MONGODB_URI: `${mongod.getUri()}tos_portal`,
    SESSION_SECRET: 'test-secret-test-secret-test-secret-123',
    DELEALONE_PASSWORD_1: 'first-pass',
    DELEALONE_PASSWORD_2: 'second-pass',
    CLOUDINARY_CLOUD_NAME: 'democloud',
    CLOUDINARY_API_KEY: '123456',
    CLOUDINARY_API_SECRET: 'abcdefg',
    GOOGLE_CLIENT_ID: 'client-id.apps.googleusercontent.com',
    GOOGLE_CLIENT_SECRET: 'client-secret',
  })
  delete process.env.APP_URL

  const { createApp } = await import('../app.js')
  const models = await import('../models.js')
  User = models.User
  Paper = models.Paper

  await new Promise(resolve => {
    server = createApp().listen(0, resolve)
  })
  base = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  server?.close()
  const mongoose = (await import('mongoose')).default
  await mongoose.disconnect()
  await mongod?.stop()
})

// A browser: remembers cookies between calls.
function browser() {
  const jar = new Map()
  async function call(method, path, body) {
    const cookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ')
    const res = await fetch(base + path, {
      method,
      redirect: 'manual',
      headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    for (const line of res.headers.getSetCookie()) {
      const [pair] = line.split(';')
      const at = pair.indexOf('=')
      const name = pair.slice(0, at)
      const value = pair.slice(at + 1)
      if (!value || /Expires=Thu, 01 Jan 1970/i.test(line)) jar.delete(name)
      else jar.set(name, value)
    }
    const text = await res.text()
    let json = null
    try { json = JSON.parse(text) } catch { /* redirects have no body */ }
    return { status: res.status, json, location: res.headers.get('location') }
  }
  return { call, jar }
}

const STUDENT = '202500062@topfaith.edu.ng'
const STAFF = 'bamidele@topfaith.edu.ng'

const verify = email => User.updateMany({ email }, { status: 'verified', verifiedAt: new Date() })

const signupBody = (overrides = {}) => ({
  role: 'student',
  email: STUDENT,
  password: 'correct-horse',
  username: 'Daniel',
  programme: 'Computer Science',
  level: '100',
  ...overrides,
})

describe('the school email rule', () => {
  it('turns away any address that is not @topfaith.edu.ng', async () => {
    const b = browser()
    const r = await b.call('POST', '/api/auth/signup', signupBody({ email: 'someone@gmail.com' }))
    assert.equal(r.status, 400)
    assert.equal(r.json.error.code, 'BAD_EMAIL')
    assert.match(r.json.error.message, /@topfaith\.edu\.ng/)

    const sub = await b.call('POST', '/api/auth/signup', signupBody({ email: '202500062@mail.topfaith.edu.ng' }))
    assert.equal(sub.status, 400)
  })

  it('does not let a number-first (student) email create an admin account', async () => {
    const r = await browser().call('POST', '/api/auth/signup', { ...signupBody(), role: 'admin' })
    assert.equal(r.status, 400)
    assert.equal(r.json.error.code, 'STUDENT_EMAIL_ON_ADMIN')
    assert.match(r.json.error.message, /starts with a number/)
  })

  it('rejects non-school emails on sign in and forgot password too', async () => {
    const b = browser()
    const login = await b.call('POST', '/api/auth/login', { role: 'student', email: 'x@yahoo.com', password: 'whatever1' })
    assert.equal(login.json.error.code, 'BAD_EMAIL')
    const forgot = await b.call('POST', '/api/auth/forgot', { role: 'student', email: 'x@yahoo.com' })
    assert.equal(forgot.json.error.code, 'BAD_EMAIL')
  })
})

describe('student sign up -> Google verification -> sign in', () => {
  const b = browser()

  it('creates an unverified account and remembers the pending step', async () => {
    const r = await b.call('POST', '/api/auth/signup', signupBody())
    assert.equal(r.status, 201)
    assert.equal(r.json.next, 'verify')

    const me = await b.call('GET', '/api/me')
    assert.equal(me.json.student, null)
    assert.equal(me.json.pending.email, STUDENT)
  })

  it('asks before replacing an unverified sign-up, then replaces it', async () => {
    const again = await browser().call('POST', '/api/auth/signup', signupBody({ username: 'Dele', password: 'brand-new-pass' }))
    assert.equal(again.status, 409)
    assert.equal(again.json.error.code, 'UNVERIFIED_EXISTS')

    const replaced = await browser().call('POST', '/api/auth/signup', signupBody({ username: 'Dele', password: 'brand-new-pass', overwrite: true }))
    assert.equal(replaced.status, 201)

    const user = await User.findOne({ email: STUDENT, role: 'student' })
    assert.equal(user.username, 'Dele')
    assert.equal(user.status, 'unverified')
  })

  it('sends an unverified account back to Google when it signs in (from any device)', async () => {
    const otherDevice = browser()
    const r = await otherDevice.call('POST', '/api/auth/login', { role: 'student', email: STUDENT, password: 'brand-new-pass' })
    assert.equal(r.status, 200)
    assert.equal(r.json.next, 'verify')
    assert.equal((await otherDevice.call('GET', '/api/me')).json.student, null)
  })

  it('refuses a wrong password with a helpful message', async () => {
    const r = await browser().call('POST', '/api/auth/login', { role: 'student', email: STUDENT, password: 'nope-nope' })
    assert.equal(r.status, 401)
    assert.equal(r.json.error.code, 'WRONG_PASSWORD')
    assert.match(r.json.error.message, /Forgot password/)
  })

  it('signs in once verified and starts with the programme courses', async () => {
    await verify(STUDENT)
    const s = browser()
    const r = await s.call('POST', '/api/auth/login', { role: 'student', email: STUDENT, password: 'brand-new-pass' })
    assert.equal(r.json.next, 'home')

    const me = (await s.call('GET', '/api/me')).json.student
    assert.equal(me.email, STUDENT)
    assert.equal(me.regNumber, '202500062')
    assert.ok(me.courses.includes('COS 101'))

    // "All courses are removable": empty the whole list.
    const cleared = await s.call('PUT', '/api/student/courses', { courses: [] })
    assert.equal(cleared.status, 200)
    assert.deepEqual(cleared.json.me.courses, [])

    const added = await s.call('PUT', '/api/student/courses', { courses: ['PHY 101', 'NOT A COURSE'] })
    assert.deepEqual(added.json.me.courses, ['PHY 101'])
  })

  it('says the account already exists instead of creating a second one', async () => {
    const r = await browser().call('POST', '/api/auth/signup', signupBody())
    assert.equal(r.status, 409)
    assert.equal(r.json.error.code, 'ACCOUNT_EXISTS')
  })

  it('changes the password only with the right current one', async () => {
    const s = browser()
    await s.call('POST', '/api/auth/login', { role: 'student', email: STUDENT, password: 'brand-new-pass' })

    const bad = await s.call('POST', '/api/student/password', { current: 'wrong', next: 'another-pass-1' })
    assert.equal(bad.json.error.code, 'WRONG_PASSWORD')

    const ok = await s.call('POST', '/api/student/password', { current: 'brand-new-pass', next: 'another-pass-1' })
    assert.equal(ok.status, 200)

    const relog = await browser().call('POST', '/api/auth/login', { role: 'student', email: STUDENT, password: 'another-pass-1' })
    assert.equal(relog.json.next, 'home')
  })
})

describe('one person, two separate accounts (student and admin)', () => {
  it('asks "are you sure?" before a staff email becomes a student account', async () => {
    const b = browser()
    const r = await b.call('POST', '/api/auth/signup', signupBody({ email: STAFF }))
    assert.equal(r.status, 409)
    assert.equal(r.json.error.code, 'CONFIRM_STAFF_AS_STUDENT')
    assert.match(r.json.error.message, /not as an admin/)

    const confirmed = await b.call('POST', '/api/auth/signup', signupBody({ email: STAFF, confirmStaffAsStudent: true }))
    assert.equal(confirmed.status, 201)
    await verify(STAFF)
  })

  it('says there is only a student account when signing in to /admin', async () => {
    const r = await browser().call('POST', '/api/auth/login', { role: 'admin', email: STAFF, password: 'correct-horse' })
    assert.equal(r.status, 404)
    assert.equal(r.json.error.code, 'NO_ADMIN_ACCOUNT')
    assert.match(r.json.error.message, /only a student account/)
  })

  it('lets the same email also create an admin account, with its own password', async () => {
    const a = browser()
    const created = await a.call('POST', '/api/auth/signup', {
      role: 'admin', email: STAFF, password: 'admin-password-1', username: 'Dr. Bamidele',
    })
    assert.equal(created.status, 201)
    await verify(STAFF)

    const login = await a.call('POST', '/api/auth/login', { role: 'admin', email: STAFF, password: 'admin-password-1' })
    assert.equal(login.json.next, 'department') // asks which department they mostly work with

    // The student password does not open the admin account.
    const mixed = await browser().call('POST', '/api/auth/login', { role: 'admin', email: STAFF, password: 'correct-horse' })
    assert.equal(mixed.json.error.code, 'WRONG_PASSWORD')

    const bad = await a.call('PUT', '/api/admin/department', { department: 'Made Up Department' })
    assert.equal(bad.status, 400)
    const set = await a.call('PUT', '/api/admin/department', { department: 'Software Engineering' })
    assert.equal(set.json.me.faculty, 'Computing & Information Sciences')
    assert.equal(set.json.me.needsDepartment, false)

    // Admin and student sessions are separate cookies of the same browser.
    await a.call('POST', '/api/auth/login', { role: 'student', email: STAFF, password: 'correct-horse' })
    const me = (await a.call('GET', '/api/me')).json
    assert.equal(me.admin.department, 'Software Engineering')
    assert.equal(me.student.email, STAFF)
  })

  it('says there is only an admin account when a student sign in finds none', async () => {
    const only = 'only.admin@topfaith.edu.ng'
    await browser().call('POST', '/api/auth/signup', { role: 'admin', email: only, password: 'admin-password-1', username: 'Only Admin' })
    const r = await browser().call('POST', '/api/auth/login', { role: 'student', email: only, password: 'admin-password-1' })
    assert.equal(r.json.error.code, 'NO_STUDENT_ACCOUNT')
    assert.match(r.json.error.message, /only an admin account/)
  })
})

describe('Google round trip guards', () => {
  it('points verify at Google only when a sign-up is pending, school accounts first', async () => {
    const none = await browser().call('GET', '/api/auth/google/start?purpose=verify')
    assert.equal(none.status, 302)
    assert.match(none.location, /^\/auth\?error=/)

    const b = browser()
    await b.call('POST', '/api/auth/signup', signupBody({ email: '202500071@topfaith.edu.ng' }))
    const start = await b.call('GET', '/api/auth/google/start?purpose=verify')
    assert.equal(start.status, 302)
    assert.match(start.location, /^https:\/\/accounts\.google\.com\//)
    assert.match(start.location, /hd=topfaith\.edu\.ng/)
  })

  it('refuses a callback that did not start from this browser', async () => {
    const r = await browser().call('GET', '/api/auth/google/callback?code=abc&state=forged')
    assert.equal(r.status, 302)
    assert.match(decodeURIComponent(r.location), /expired|different browser/i)
  })
})

describe('forgot password', () => {
  it('only opens the Google step for an account that exists', async () => {
    const missing = await browser().call('POST', '/api/auth/forgot', { role: 'student', email: '202599999@topfaith.edu.ng' })
    assert.equal(missing.status, 404)
    assert.equal(missing.json.error.code, 'NO_ACCOUNT')

    const found = await browser().call('POST', '/api/auth/forgot', { role: 'student', email: STUDENT })
    assert.equal(found.status, 200)
    assert.match(found.json.url, /purpose=reset/)
  })

  it('will not set a password without the Google proof', async () => {
    const r = await browser().call('POST', '/api/auth/reset', { password: 'sneaky-password' })
    assert.equal(r.status, 401)
    assert.equal(r.json.error.code, 'RESET_EXPIRED')
  })
})

describe('the owner area (/delealone)', () => {
  const owner = browser()
  const fileFor = (n, name = `page-${n}.jpg`) => ({
    url: `https://res.cloudinary.com/democloud/image/upload/v1/nexus/papers/batch/${name}`,
    publicId: `nexus/papers/batch/${name.replace(/\.\w+$/, '')}`,
    resourceType: 'image', format: 'jpg', bytes: 1000, name, kind: 'page', page: n,
  })

  it('needs both passwords', async () => {
    assert.equal((await owner.call('GET', '/api/dele/overview')).status, 401)

    const wrong = await owner.call('POST', '/api/dele/login', { password1: 'first-pass', password2: 'nope' })
    assert.equal(wrong.status, 401)
    assert.equal(wrong.json.error.code, 'WRONG_PASSWORDS')

    const ok = await owner.call('POST', '/api/dele/login', { password1: 'first-pass', password2: 'second-pass' })
    assert.equal(ok.status, 200)
    assert.equal((await owner.call('GET', '/api/dele/me')).status, 200)
  })

  it('signs uploads, queues a student upload, and publishes it only once approved', async () => {
    const guest = browser() // not logged in at all

    const signed = await guest.call('POST', '/api/papers/sign', { files: [{ name: 'page-1.jpg', kind: 'page' }] })
    assert.equal(signed.status, 200)
    assert.equal(signed.json.cloudName, 'democloud')
    assert.ok(signed.json.tickets[0].signature)

    const badType = await guest.call('POST', '/api/papers/sign', { files: [{ name: 'virus.exe', kind: 'document' }] })
    assert.equal(badType.json.error.code, 'BAD_FILE_TYPE')

    const foreign = await guest.call('POST', '/api/papers', {
      courseCode: 'PHY 101', session: '2023/2024',
      files: [{ ...fileFor(1), url: 'https://evil.example/x.jpg' }],
    })
    assert.equal(foreign.json.error.code, 'BAD_FILE')

    const sent = await guest.call('POST', '/api/papers', { courseCode: 'PHY 101', session: '2023/2024', files: [fileFor(1)] })
    assert.equal(sent.status, 201)
    assert.equal(sent.json.status, 'pending')

    // Not visible to students yet. (The original PHY 101 paper is, as v1.)
    const before = (await guest.call('GET', '/api/papers')).json.courses.phy101.years
    assert.deepEqual(Object.keys(before), ['20232024'])

    const list = (await owner.call('GET', '/api/dele/papers?status=pending')).json.papers
    const mine = list.find(p => p.id === sent.json.id)
    assert.equal(mine.uploader.label, 'Not logged in')
    assert.equal(mine.title, 'PHY 101 2023/2024 v2') // the original is v1, this one auto-numbers to v2

    const approved = await owner.call('PATCH', `/api/dele/papers/${sent.json.id}`, { status: 'approved' })
    assert.equal(approved.json.paper.status, 'approved')

    const after = (await guest.call('GET', '/api/papers')).json.courses.phy101.years
    assert.deepEqual(Object.keys(after).sort(), ['20232024', '20232024-v2'])

    // ...and a notification was created for that course.
    const notes = (await guest.call('GET', '/api/notifications')).json.items
    assert.ok(notes.some(n => n.course_id === 'PHY 101' && /v2/.test(n.body)))
  })

  it('auto-approves the owner\'s own uploads and attributes signed-in uploaders', async () => {
    const student = browser()
    await student.call('POST', '/api/auth/login', { role: 'student', email: STUDENT, password: 'another-pass-1' })
    const sent = await student.call('POST', '/api/papers', {
      courseCode: 'MTH 101', session: '2022/2023', files: [fileFor(1, 'page-1.jpg')],
    })
    const row = await Paper.findById(sent.json.id)
    assert.equal(row.uploaderEmail, STUDENT)

    const listed = (await owner.call('GET', '/api/dele/papers?course=mth101')).json.papers
    assert.match(listed.find(p => p.id === sent.json.id).uploader.label, /Dele|Daniel/)

    const mine = await owner.call('POST', '/api/dele/papers', {
      courseCode: 'MTH 101', session: '2022/2023', files: [fileFor(1, 'page-2.jpg')],
    })
    assert.equal(mine.json.paper.status, 'approved')
    assert.equal(mine.json.paper.uploader.name, 'Dele (owner)')
  })

  it('groups every upload for a course in Compare', async () => {
    const r = await owner.call('GET', '/api/dele/compare?course=phy101')
    assert.equal(r.status, 200)
    assert.ok(r.json.papers.length >= 2)
    assert.equal(r.json.course.code, 'PHY 101')

    const courses = (await owner.call('GET', '/api/dele/compare/courses')).json.courses
    assert.ok(courses.find(c => c.key === 'phy101').total >= 2)
  })

  it('records usage and reports it', async () => {
    const reader = browser()
    await reader.call('POST', '/api/auth/login', { role: 'student', email: STUDENT, password: 'another-pass-1' })
    const paper = await Paper.findOne({ courseKey: 'phy101', version: 2 })

    await reader.call('POST', '/api/events', {
      anonId: 'device-1',
      events: [
        { type: 'open', paperId: String(paper._id) },
        { type: 'read', paperId: String(paper._id), seconds: 75 },
        { type: 'download', paperId: String(paper._id) },
        { type: 'link', label: 'Lynklens', url: 'https://lynklens.com' },
        { type: 'active', seconds: 30, path: '/' },
      ],
    })

    const overview = (await owner.call('GET', '/api/dele/overview?days=7')).json
    assert.equal(overview.activity.downloads, 1)
    assert.equal(overview.activity.readSeconds, 75)
    assert.equal(overview.activity.linkClicks, 1)
    assert.equal(overview.topDownloaders[0].email, STUDENT)
    assert.equal(overview.viewers[0].title, 'PHY 101 2023/2024 v2')
    assert.ok(overview.users.students >= 1)
  })

  it('can log in as a user for a limited, recorded session', async () => {
    const users = (await owner.call('GET', `/api/dele/users?q=${STUDENT}`)).json.users
    const target = users.find(u => u.role === 'student')

    const r = await owner.call('POST', '/api/dele/impersonate', { userId: target.id })
    assert.equal(r.status, 200)

    const me = (await owner.call('GET', '/api/me')).json
    assert.equal(me.student.email, STUDENT)
    assert.equal(me.impersonating.email, STUDENT)
    assert.ok(new Date(me.impersonating.expiresAt) - Date.now() <= 10 * 60 * 1000)

    // The owner can't change that person's password while viewing as them.
    const blocked = await owner.call('POST', '/api/student/password', { current: 'x', next: 'y-new-password' })
    assert.equal(blocked.json.error.code, 'IMPERSONATED')

    // Viewing as someone doesn't count as their usage.
    const skipped = await owner.call('POST', '/api/events', { events: [{ type: 'active', seconds: 30 }] })
    assert.equal(skipped.json.skipped, true)

    await owner.call('POST', '/api/dele/impersonate/stop')
    assert.equal((await owner.call('GET', '/api/me')).json.student, null)
  })
})
