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
    assert.equal(set.json.me.faculty, 'Computing & Applied Sciences')
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
    assert.equal(mine.uploader.label, 'Uploader') // stayed mysterious: no name given
    assert.equal(mine.title, 'PHY 101 2023/2024') // not public yet, so no version

    // A guest who gives a name is credited as "Name (Uploader)"; a bad name is refused.
    const named = await guest.call('POST', '/api/papers', {
      courseCode: 'PHY 101', session: '2022/2023', uploaderName: 'John Doe', files: [fileFor(2)],
    })
    assert.equal(named.status, 201)
    const namedRow = (await owner.call('GET', '/api/dele/papers?status=pending')).json.papers.find(p => p.id === named.json.id)
    assert.equal(namedRow.uploader.label, 'John Doe (Uploader)')
    assert.equal(namedRow.uploader.signedIn, false)

    const tooShort = await guest.call('POST', '/api/papers', {
      courseCode: 'PHY 101', session: '2022/2023', uploaderName: 'J', files: [fileFor(3)],
    })
    assert.equal(tooShort.json.error.code, 'BAD_USERNAME')

    const approved = await owner.call('PATCH', `/api/dele/papers/${sent.json.id}`, { status: 'approved' })
    assert.equal(approved.json.paper.status, 'approved')
    assert.equal(approved.json.paper.title, 'PHY 101 2023/2024 v2') // the original is v1; this joins as v2

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

  it('numbers only public versions, and lets the owner choose which is v1', async () => {
    const send = name => owner.call('POST', '/api/dele/papers', {
      courseCode: 'COS 101', session: '2021/2022', files: [fileFor(1, name)],
    })
    const listed = async () => (await owner.call('GET', '/api/dele/papers?course=cos101')).json.papers

    const first = (await send('v-a.jpg')).json.paper
    const second = (await send('v-b.jpg')).json.paper
    assert.equal(first.title, 'COS 101 2021/2022')
    assert.equal(second.title, 'COS 101 2021/2022 v2')

    // Make the second one v1: they swap places.
    let r = await owner.call('PATCH', `/api/dele/papers/${second.id}`, { version: 1 })
    assert.equal(r.status, 200)
    assert.equal(r.json.paper.title, 'COS 101 2021/2022')
    let rows = await listed()
    assert.equal(rows.find(p => p.id === first.id).title, 'COS 101 2021/2022 v2')
    assert.equal(rows.find(p => p.id === first.id).publicVersions, 2)

    r = await owner.call('PATCH', `/api/dele/papers/${second.id}`, { version: 5 })
    assert.equal(r.status, 400)
    assert.equal(r.json.error.code, 'BAD_VERSION')

    // Hiding a public paper closes the gap: the one left is plain again.
    await owner.call('PATCH', `/api/dele/papers/${second.id}`, { status: 'rejected' })
    rows = await listed()
    assert.equal(rows.find(p => p.id === first.id).title, 'COS 101 2021/2022')
    assert.equal(rows.find(p => p.id === second.id).title, 'COS 101 2021/2022')

    // A paper students can't see has no version to choose.
    r = await owner.call('PATCH', `/api/dele/papers/${second.id}`, { version: 1 })
    assert.equal(r.status, 400)
    assert.equal(r.json.error.code, 'NOT_PUBLIC')

    // Approving it again puts it last, as v2.
    r = await owner.call('PATCH', `/api/dele/papers/${second.id}`, { status: 'approved' })
    assert.equal(r.json.paper.title, 'COS 101 2021/2022 v2')

    // Deleting v1 promotes v2.
    await owner.call('DELETE', `/api/dele/papers/${first.id}`)
    rows = await listed()
    assert.equal(rows.find(p => p.id === second.id).title, 'COS 101 2021/2022')
    await owner.call('DELETE', `/api/dele/papers/${second.id}`)
  })

  it('lists every course with all of its papers for the Compare scroll', async () => {
    const r = await owner.call('GET', '/api/dele/compare/all')
    assert.equal(r.status, 200)

    const phy = r.json.courses.find(c => c.key === 'phy101')
    assert.equal(phy.code, 'PHY 101')
    assert.ok(phy.papers.length >= 2)
    assert.ok(phy.papers.every(p => p.courseKey === 'phy101'))

    const keys = r.json.courses.map(c => c.key)
    assert.deepEqual(keys, [...keys].sort())
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

  it('names signed-out visitors by what they are doing, and drops stray events', async () => {
    const visitor = browser()
    const usageNames = async () =>
      (await owner.call('GET', '/api/dele/overview?days=7')).json.usage.map(u => u.who)

    // The sign-in screens are recorded and named.
    await visitor.call('POST', '/api/events', { anonId: 'signin-student', events: [{ type: 'active', seconds: 15, path: '/auth' }] })
    await visitor.call('POST', '/api/events', { anonId: 'signin-staff', events: [{ type: 'active', seconds: 15, path: '/admin' }] })

    // Leftovers with no session, from anywhere else, are not recorded at all.
    await visitor.call('POST', '/api/events', {
      anonId: 'stray',
      events: [
        { type: 'read', seconds: 1 },
        { type: 'active', seconds: 15, path: '/' },
        { type: 'link', label: 'Lynklens', url: 'https://lynklens.com' },
      ],
    })

    const names = await usageNames()
    assert.ok(names.includes('Student signing in'))
    assert.ok(names.includes('Admin signing in'))
    assert.ok(!names.includes('Uploader'))
    assert.ok(!names.some(name => /not logged in|not signed in/i.test(name)))

    // The open upload page is the one place a stranger legitimately uses Nexus:
    // "Uploader" if they stay mysterious, "Name (Uploader)" if they gave a name.
    await visitor.call('POST', '/api/events', { anonId: 'uploader-mystery', events: [{ type: 'active', seconds: 15, path: '/upload' }] })
    await visitor.call('POST', '/api/events', {
      anonId: 'uploader-named', uploaderName: 'Jane Doe', events: [{ type: 'active', seconds: 15, path: '/upload' }],
    })
    // A name sent from any other page is ignored.
    await visitor.call('POST', '/api/events', {
      anonId: 'signin-named', uploaderName: 'Sneaky', events: [{ type: 'active', seconds: 15, path: '/auth' }],
    })

    const usage = (await owner.call('GET', '/api/dele/overview?days=7')).json.usage
    const jane = usage.find(u => u.who === 'Jane Doe')
    assert.equal(jane.role, 'uploader')
    assert.ok(usage.some(u => u.who === 'Uploader' && u.role === null))
    assert.ok(!usage.some(u => u.who === 'Sneaky'))
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

describe('deleting an account for good', () => {
  const email = '202500099@topfaith.edu.ng'

  it('needs the password, then lets the same email sign up as a brand-new user', async () => {
    const me = browser()
    await me.call('POST', '/api/auth/signup', signupBody({ email }))
    await verify(email)
    await me.call('POST', '/api/auth/login', { role: 'student', email, password: 'correct-horse' })

    const wrong = await me.call('DELETE', '/api/student/account', { password: 'not-my-password' })
    assert.equal(wrong.status, 400)
    assert.equal(wrong.json.error.code, 'WRONG_PASSWORD')
    assert.equal(await User.countDocuments({ email, role: 'student' }), 1)

    const gone = await me.call('DELETE', '/api/student/account', { password: 'correct-horse' })
    assert.equal(gone.status, 200)
    assert.equal(await User.countDocuments({ email }), 0)
    assert.equal((await me.call('GET', '/api/me')).json.student, null)

    // Same email, fresh start: unverified again, with none of the old details.
    const again = await browser().call('POST', '/api/auth/signup', signupBody({ email, username: 'Fresh', programme: 'Mathematics' }))
    assert.equal(again.status, 201)
    const user = await User.findOne({ email })
    assert.equal(user.status, 'unverified')
    assert.equal(user.username, 'Fresh')
    assert.equal(user.programme, 'Mathematics')
  })

  it('removes their history but keeps the papers they sent, without their name', async () => {
    const who = '202500098@topfaith.edu.ng'
    const s = browser()
    await s.call('POST', '/api/auth/signup', signupBody({ email: who }))
    await verify(who)
    await s.call('POST', '/api/auth/login', { role: 'student', email: who, password: 'correct-horse' })

    const sent = await s.call('POST', '/api/papers', {
      courseCode: 'STA 111', session: '2021/2022',
      files: [{
        url: 'https://res.cloudinary.com/democloud/image/upload/v1/nexus/papers/b/page-1.jpg',
        publicId: 'nexus/papers/b/page-1', resourceType: 'image', format: 'jpg', bytes: 10, name: 'page-1.jpg', kind: 'page', page: 1,
      }],
    })
    assert.equal(sent.status, 201)

    // The owner erases the account from the Users page.
    const owner = browser()
    await owner.call('POST', '/api/dele/login', { password1: 'first-pass', password2: 'second-pass' })
    const target = (await owner.call('GET', `/api/dele/users?q=${who}`)).json.users[0]
    const erased = await owner.call('DELETE', `/api/dele/users/${target.id}`)
    assert.equal(erased.status, 200)
    assert.equal(await User.countDocuments({ email: who }), 0)

    const paper = await Paper.findById(sent.json.id)
    assert.ok(paper, 'the paper is kept for students')
    assert.equal(paper.uploaderId, null)
    assert.equal(paper.uploaderEmail, null)
  })
})

describe('changing course of study and level', () => {
  const email = '202500077@topfaith.edu.ng'
  const s = browser()

  it('keeps the course list unless asked to replace it', async () => {
    await s.call('POST', '/api/auth/signup', signupBody({ email }))
    await verify(email)
    await s.call('POST', '/api/auth/login', { role: 'student', email, password: 'correct-horse' })
    await s.call('PUT', '/api/student/courses', { courses: ['PHY 101'] })

    const kept = await s.call('PUT', '/api/student/programme', { programme: 'Mathematics', level: '200' })
    assert.equal(kept.status, 200)
    assert.equal(kept.json.me.programme, 'Mathematics')
    assert.equal(kept.json.me.level, '200')
    assert.deepEqual(kept.json.me.courses, ['PHY 101'])
  })

  it('can replace the course list with the new programme and level', async () => {
    const replaced = await s.call('PUT', '/api/student/programme', {
      programme: 'Computer Science', level: '100', resetCourses: true,
    })
    assert.ok(replaced.json.me.courses.includes('COS 101'))
    assert.ok(!replaced.json.me.courses.includes('PHY 101') || replaced.json.me.courses.length > 1)
  })

  it('explains a course or level that does not exist', async () => {
    const bad = await s.call('PUT', '/api/student/programme', { programme: 'Mathematics', level: '900' })
    assert.equal(bad.status, 400)
    assert.equal(bad.json.error.code, 'BAD_LEVEL')
    assert.match(bad.json.error.message, /levels/)

    const unknown = await s.call('PUT', '/api/student/programme', { programme: 'Underwater Basket Weaving', level: '100' })
    assert.equal(unknown.json.error.code, 'BAD_PROGRAMME')
  })
})

describe('sessions last 6 months and start again when you come back', () => {
  const DAYS = 24 * 60 * 60
  const decode = token => JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms))

  it('keeps a student signed in for 180 days and renews on return', async () => {
    const email = '202500055@topfaith.edu.ng'
    const s = browser()
    await s.call('POST', '/api/auth/signup', signupBody({ email }))
    await verify(email)
    await s.call('POST', '/api/auth/login', { role: 'student', email, password: 'correct-horse' })

    const first = decode(s.jar.get('nx_s'))
    assert.equal(first.exp - first.iat, 180 * DAYS)

    await pause(1100)
    await s.call('GET', '/api/me') // opening the app again
    const second = decode(s.jar.get('nx_s'))
    assert.ok(second.iat > first.iat, 'the clock was restarted')
    assert.equal(second.exp - second.iat, 180 * DAYS)
  })

  it('does the same for the owner area', async () => {
    const owner = browser()
    await owner.call('POST', '/api/dele/login', { password1: 'first-pass', password2: 'second-pass' })
    const first = decode(owner.jar.get('nx_d'))
    assert.equal(first.exp - first.iat, 180 * DAYS)

    await pause(1100)
    assert.equal((await owner.call('GET', '/api/dele/me')).status, 200)
    const second = decode(owner.jar.get('nx_d'))
    assert.ok(second.iat > first.iat)
    assert.equal(second.exp - second.iat, 180 * DAYS)
  })

  it('never stretches a "log in as" session beyond its 10 minutes', async () => {
    const owner = browser()
    await owner.call('POST', '/api/dele/login', { password1: 'first-pass', password2: 'second-pass' })
    const target = (await owner.call('GET', '/api/dele/users?role=student')).json.users.find(u => u.status === 'verified')
    await owner.call('POST', '/api/dele/impersonate', { userId: target.id })

    await pause(1100)
    await owner.call('GET', '/api/me')
    const token = decode(owner.jar.get('nx_s'))
    assert.equal(token.exp - token.iat, 10 * 60)
    assert.equal(token.imp, true)
  })
})

describe('owner-made staff accounts', () => {
  const body = {
    name: 'Dr. Test Admin',
    email: 'admin.test@topfaith.edu.ng',
    department: 'Software Engineering',
    password: 'owner-made-pass',
  }

  it('needs the owner session', async () => {
    const r = await browser().call('POST', '/api/dele/users/staff', body)
    assert.equal(r.status, 401)
  })

  it('refuses addresses that cannot be staff, with clear reasons', async () => {
    const owner = browser()
    await owner.call('POST', '/api/dele/login', { password1: 'first-pass', password2: 'second-pass' })

    const gmail = await owner.call('POST', '/api/dele/users/staff', { ...body, email: 'someone@gmail.com' })
    assert.equal(gmail.json.error.code, 'BAD_EMAIL')

    const student = await owner.call('POST', '/api/dele/users/staff', { ...body, email: '202500001@topfaith.edu.ng' })
    assert.equal(student.json.error.code, 'STUDENT_EMAIL_ON_ADMIN')

    const dept = await owner.call('POST', '/api/dele/users/staff', { ...body, department: 'Nowhere' })
    assert.equal(dept.json.error.code, 'BAD_DEPARTMENT')

    const weak = await owner.call('POST', '/api/dele/users/staff', { ...body, password: 'short' })
    assert.equal(weak.json.error.code, 'BAD_DETAILS')
  })

  it('creates a verified admin who can sign in at /admin straight away', async () => {
    const owner = browser()
    await owner.call('POST', '/api/dele/login', { password1: 'first-pass', password2: 'second-pass' })

    const made = await owner.call('POST', '/api/dele/users/staff', body)
    assert.equal(made.status, 201)
    assert.equal(made.json.user.status, 'verified')

    const row = await User.findOne({ email: body.email, role: 'admin' })
    assert.equal(row.createdByOwner, true)
    assert.equal(row.faculty, 'Computing & Applied Sciences')

    const staff = browser()
    const login = await staff.call('POST', '/api/auth/login', { role: 'admin', email: body.email, password: body.password })
    assert.equal(login.status, 200)
    assert.equal(login.json.next, 'home') // the department was set, so no extra question
    const me = (await staff.call('GET', '/api/me')).json
    assert.equal(me.admin.department, 'Software Engineering')

    const again = await owner.call('POST', '/api/dele/users/staff', body)
    assert.equal(again.status, 409)
    assert.equal(again.json.error.code, 'ACCOUNT_EXISTS')

    const listed = (await owner.call('GET', `/api/dele/users?q=${body.email}`)).json.users[0]
    assert.equal(listed.createdByOwner, true)
  })
})
