// The site owner's control room (/delealone). Everything here sits behind two
// passwords that live only in the server's environment.

import crypto from 'node:crypto'
import { Router } from 'express'
import mongoose from 'mongoose'
import { Audit, Event, Paper, User } from '../models.js'
import { env, need } from '../lib/env.js'
import { fail, wrap } from '../lib/errors.js'
import {
  COOKIE, DELE_SECONDS, IMPERSONATE_SECONDS, clearCookie, clientIp, readCookie, setCookie, startSession,
} from '../lib/session.js'
import { forget, limit } from '../lib/throttle.js'
import { findCourse, pqKey, titleOf } from '../lib/courses.js'
import { describePaper, nextVersion, parseSubmission } from '../lib/papers.js'
import { destroyFiles } from '../lib/cloudinary.js'
import { announcePaper } from '../lib/notify.js'

const router = Router()

/* -------------------------------- sign in --------------------------------- */

const digest = value => crypto.createHash('sha256').update(String(value ?? '')).digest()
const same = (a, b) => crypto.timingSafeEqual(digest(a), digest(b))

router.post('/login', wrap(async (req, res) => {
  const first = need('DELEALONE_PASSWORD_1', 'The owner area')
  const second = need('DELEALONE_PASSWORD_2', 'The owner area')

  const ip = clientIp(req)
  const perPerson = `dele:${ip}`
  await limit('dele:everyone', { max: 60, windowSec: 3600, what: 'attempts' })
  await limit(perPerson, { max: 5, windowSec: 15 * 60, what: 'attempts' })

  const { password1, password2 } = req.body || {}
  if (!password1 || !password2) {
    throw fail(400, 'NEED_BOTH', 'Enter both passwords - this area needs password 1 and password 2.')
  }

  // Both are always compared, so the timing never says which one was wrong.
  const firstOk = same(password1, first)
  const secondOk = same(password2, second)
  if (!(firstOk && secondOk)) {
    throw fail(401, 'WRONG_PASSWORDS', "Those two passwords don't match. Check both and try again.")
  }

  await forget(perPerson)
  setCookie(res, COOKIE.dele, { dele: true }, DELE_SECONDS)
  res.json({ ok: true })
}))

router.post('/logout', wrap(async (req, res) => {
  clearCookie(res, COOKIE.dele)
  res.json({ ok: true })
}))

// "Stop viewing as this person" is available to the impersonated session itself,
// so it deliberately sits ABOVE the owner-cookie check.
router.post('/impersonate/stop', wrap(async (req, res) => {
  for (const role of ['student', 'admin']) {
    if (readCookie(req, COOKIE[role])?.imp) clearCookie(res, COOKIE[role])
  }
  res.json({ ok: true, url: '/delealone' })
}))

const needDele = (req, res, next) => {
  try {
    if (!readCookie(req, COOKIE.dele)?.dele) {
      throw fail(401, 'DELE_SIGNED_OUT', 'Your owner session has ended. Enter your two passwords again.')
    }
    next()
  } catch (err) {
    next(err)
  }
}

router.get('/me', needDele, (req, res) => res.json({ ok: true }))

router.use(needDele)

/* -------------------------------- overview -------------------------------- */

const whoKey = { $ifNull: [{ $toString: '$userId' }, { $concat: ['anon:', { $ifNull: ['$anonId', '?'] }] }] }

router.get('/overview', wrap(async (req, res) => {
  const days = Math.min(90, Math.max(1, Number(req.query.days) || 14))
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const inWindow = { at: { $gte: since } }
  const recently = new Date(Date.now() - 3 * 60 * 1000)

  const [
    userCounts, paperCounts, totals, topDownloaders, topPapersRaw, viewers, links, perDay, activeDays, usage, onlineNow,
  ] = await Promise.all([
    User.aggregate([{ $group: { _id: { role: '$role', status: '$status' }, n: { $sum: 1 } } }]),
    Paper.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    Event.aggregate([
      { $match: inWindow },
      { $group: { _id: '$type', n: { $sum: 1 }, seconds: { $sum: '$seconds' } } },
    ]),
    Event.aggregate([
      { $match: { ...inWindow, type: 'download' } },
      {
        $group: {
          _id: whoKey, downloads: { $sum: 1 }, name: { $last: '$name' }, email: { $last: '$email' },
          role: { $last: '$role' }, last: { $max: '$at' },
        },
      },
      { $sort: { downloads: -1 } },
      { $limit: 10 },
    ]),
    Event.aggregate([
      { $match: { ...inWindow, paperId: { $ne: null } } },
      {
        $group: {
          _id: '$paperId',
          title: { $last: '$title' },
          downloads: { $sum: { $cond: [{ $eq: ['$type', 'download'] }, 1, 0] } },
          opens: { $sum: { $cond: [{ $eq: ['$type', 'open'] }, 1, 0] } },
          seconds: { $sum: { $cond: [{ $eq: ['$type', 'read'] }, '$seconds', 0] } },
        },
      },
      { $addFields: { score: { $add: ['$downloads', '$opens'] } } },
      { $sort: { score: -1, seconds: -1 } },
      { $limit: 12 },
    ]),
    Event.aggregate([
      { $match: { ...inWindow, type: 'read', paperId: { $ne: null } } },
      {
        $group: {
          _id: { who: whoKey, paper: '$paperId' },
          seconds: { $sum: '$seconds' }, name: { $last: '$name' }, email: { $last: '$email' },
          role: { $last: '$role' }, title: { $last: '$title' }, last: { $max: '$at' },
        },
      },
      { $sort: { last: -1 } },
      { $limit: 40 },
    ]),
    Event.aggregate([
      { $match: { ...inWindow, type: 'link' } },
      { $group: { _id: { label: '$label', url: '$url' }, clicks: { $sum: 1 }, last: { $max: '$at' } } },
      { $sort: { clicks: -1 } },
      { $limit: 20 },
    ]),
    Event.aggregate([
      { $match: { ...inWindow, type: { $in: ['download', 'open'] } } },
      {
        $group: {
          _id: { day: { $dateToString: { format: '%Y-%m-%d', date: '$at' } }, type: '$type' },
          n: { $sum: 1 },
        },
      },
    ]),
    Event.aggregate([
      { $match: { ...inWindow, type: 'active' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$at' } },
          people: { $addToSet: whoKey },
          seconds: { $sum: '$seconds' },
        },
      },
    ]),
    Event.aggregate([
      { $match: { ...inWindow, type: 'active' } },
      {
        $group: {
          _id: whoKey, seconds: { $sum: '$seconds' }, name: { $last: '$name' }, email: { $last: '$email' },
          role: { $last: '$role' }, last: { $max: '$at' },
        },
      },
      { $sort: { seconds: -1 } },
      { $limit: 15 },
    ]),
    Event.aggregate([
      { $match: { type: 'active', at: { $gte: recently } } },
      { $group: { _id: whoKey } },
      { $count: 'n' },
    ]),
  ])

  const count = (role, status) => userCounts.find(u => u._id.role === role && u._id.status === status)?.n || 0
  const total = type => totals.find(t => t._id === type) || { n: 0, seconds: 0 }
  const papersBy = status => paperCounts.find(p => p._id === status)?.n || 0

  // One row per day in the window, even quiet ones.
  const series = []
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const active = activeDays.find(d => d._id === day)
    series.push({
      day,
      downloads: perDay.find(d => d._id.day === day && d._id.type === 'download')?.n || 0,
      opens: perDay.find(d => d._id.day === day && d._id.type === 'open')?.n || 0,
      people: active?.people.length || 0,
      seconds: active?.seconds || 0,
    })
  }

  res.json({
    days,
    users: {
      students: count('student', 'verified'),
      studentsUnverified: count('student', 'unverified'),
      admins: count('admin', 'verified'),
      adminsUnverified: count('admin', 'unverified'),
      onlineNow: onlineNow[0]?.n || 0,
    },
    papers: {
      approved: papersBy('approved'),
      pending: papersBy('pending'),
      rejected: papersBy('rejected'),
    },
    activity: {
      downloads: total('download').n,
      opens: total('open').n,
      readSeconds: total('read').seconds,
      activeSeconds: total('active').seconds,
      linkClicks: total('link').n,
    },
    series,
    topDownloaders: topDownloaders.map(d => ({
      who: d.name || d.email || 'Not logged in', email: d.email || null, role: d.role || null,
      downloads: d.downloads, last: d.last,
    })),
    topPapers: topPapersRaw.map(p => ({
      id: String(p._id), title: p.title || 'Deleted paper', downloads: p.downloads, opens: p.opens, seconds: p.seconds,
    })),
    viewers: viewers.map(v => ({
      who: v.name || v.email || 'Not logged in', email: v.email || null, role: v.role || null,
      title: v.title || 'Deleted paper', seconds: v.seconds, last: v.last,
    })),
    links: links.map(l => ({ label: l._id.label || 'Link', url: l._id.url || '', clicks: l.clicks, last: l.last })),
    usage: usage.map(u => ({
      who: u.name || u.email || 'Not logged in', email: u.email || null, role: u.role || null,
      seconds: u.seconds, last: u.last,
    })),
  })
}))

/* --------------------------------- papers --------------------------------- */

router.get('/papers', wrap(async (req, res) => {
  const filter = {}
  if (['pending', 'approved', 'rejected'].includes(req.query.status)) filter.status = req.query.status
  if (req.query.course) filter.courseKey = pqKey(String(req.query.course))

  const papers = await Paper.find(filter).sort({ createdAt: -1 }).limit(300)
  res.json({ papers: papers.map(describePaper) })
}))

router.get('/next-version', wrap(async (req, res) => {
  const course = findCourse(req.query.course)
  if (!course) throw fail(400, 'BAD_COURSE', 'Choose the course first.')
  const session = String(req.query.session || '')
  const version = await nextVersion(pqKey(course.code), session)
  res.json({ version, title: titleOf({ courseCode: course.code, session, version }) })
}))

// Anything the owner uploads is approved on the spot.
router.post('/papers', wrap(async (req, res) => {
  const fields = parseSubmission(req.body)
  const version = await nextVersion(fields.courseKey, fields.session)

  const paper = await Paper.create({
    ...fields,
    version,
    status: 'approved',
    source: 'dele',
    uploaderName: 'Dele (owner)',
    reviewedAt: new Date(),
  })

  await announcePaper(paper)
  res.status(201).json({ paper: describePaper(paper) })
}))

router.patch('/papers/:id', wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw fail(404, 'NO_PAPER', "That paper doesn't exist any more.")
  const status = req.body?.status
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    throw fail(400, 'BAD_STATUS', 'Choose approve or reject.')
  }

  const paper = await Paper.findById(req.params.id)
  if (!paper) throw fail(404, 'NO_PAPER', "That paper doesn't exist any more - refresh the list.")

  const becameLive = status === 'approved' && paper.status !== 'approved'

  if (becameLive) {
    // Two approved papers can't share "PHY 101 2023/2024" - the later one becomes the next version.
    const clash = await Paper.exists({
      _id: { $ne: paper._id }, courseKey: paper.courseKey, session: paper.session,
      version: paper.version, status: 'approved',
    })
    if (clash) paper.version = await nextVersion(paper.courseKey, paper.session)
  }

  paper.status = status
  paper.reviewedAt = new Date()
  await paper.save()

  if (becameLive) await announcePaper(paper)
  res.json({ paper: describePaper(paper) })
}))

router.delete('/papers/:id', wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw fail(404, 'NO_PAPER', "That paper doesn't exist any more.")
  const paper = await Paper.findByIdAndDelete(req.params.id)
  if (!paper) throw fail(404, 'NO_PAPER', "That paper was already deleted - refresh the list.")

  // Uploaded files are removed from Cloudinary too; the original static PDFs stay on disk.
  if (paper.source !== 'seed') await destroyFiles(paper.files)
  res.json({ ok: true })
}))

/* --------------------------------- compare -------------------------------- */

router.get('/compare/courses', wrap(async (req, res) => {
  const rows = await Paper.aggregate([
    {
      $group: {
        _id: '$courseKey',
        code: { $last: '$courseCode' },
        total: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
      },
    },
    { $sort: { pending: -1, code: 1 } },
  ])

  res.json({
    courses: rows.map(r => ({
      key: r._id, code: r.code, title: findCourse(r.code)?.title || '',
      total: r.total, pending: r.pending, approved: r.approved, rejected: r.rejected,
    })),
  })
}))

// Every upload for one course, oldest session first, one long list.
router.get('/compare', wrap(async (req, res) => {
  const key = pqKey(String(req.query.course || ''))
  if (!key) throw fail(400, 'BAD_COURSE', 'Choose a course to compare.')

  const papers = await Paper.find({ courseKey: key }).sort({ session: -1, version: 1, createdAt: 1 })
  const course = findCourse(key)

  res.json({
    course: { key, code: course?.code || papers[0]?.courseCode || key, title: course?.title || '' },
    papers: papers.map(describePaper),
  })
}))

/* ---------------------------------- users --------------------------------- */

router.get('/users', wrap(async (req, res) => {
  const filter = {}
  if (req.query.role === 'student' || req.query.role === 'admin') filter.role = req.query.role

  const q = String(req.query.q || '').trim().slice(0, 60)
  if (q) {
    const pattern = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$or = [{ email: pattern }, { username: pattern }]
  }

  const users = await User.find(filter).sort({ createdAt: -1 }).limit(200)
  const ids = users.map(u => u._id)

  const stats = ids.length
    ? await Event.aggregate([
        { $match: { userId: { $in: ids } } },
        {
          $group: {
            _id: '$userId',
            downloads: { $sum: { $cond: [{ $eq: ['$type', 'download'] }, 1, 0] } },
            readSeconds: { $sum: { $cond: [{ $eq: ['$type', 'read'] }, '$seconds', 0] } },
            activeSeconds: { $sum: { $cond: [{ $eq: ['$type', 'active'] }, '$seconds', 0] } },
          },
        },
      ])
    : []
  const statsOf = id => stats.find(s => String(s._id) === String(id)) || {}

  res.json({
    users: users.map(u => ({
      id: String(u._id),
      email: u.email,
      role: u.role,
      username: u.username,
      status: u.status,
      programme: u.programme || null,
      level: u.level || null,
      department: u.department || null,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt || null,
      lastSeenAt: u.lastSeenAt || null,
      downloads: statsOf(u._id).downloads || 0,
      readSeconds: statsOf(u._id).readSeconds || 0,
      activeSeconds: statsOf(u._id).activeSeconds || 0,
    })),
  })
}))

// Open the site as this person for 10 minutes.
router.post('/impersonate', wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.body?.userId)) {
    throw fail(400, 'BAD_USER', 'Choose a person from the list.')
  }
  const user = await User.findById(req.body.userId)
  if (!user) throw fail(404, 'NO_USER', "That account doesn't exist any more - refresh the list.")
  if (user.status !== 'verified') {
    throw fail(409, 'UNVERIFIED', `${user.email} hasn't verified with Google yet, so there is no signed-in view to open.`)
  }

  await Audit.create({
    action: 'impersonate', targetId: user._id, targetEmail: user.email, targetRole: user.role, ip: clientIp(req),
  })

  startSession(res, user, { seconds: IMPERSONATE_SECONDS, impersonated: true })
  res.json({ url: user.role === 'admin' ? '/admin' : '/', minutes: IMPERSONATE_SECONDS / 60 })
}))

router.delete('/users/:id', wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw fail(404, 'NO_USER', "That account doesn't exist any more.")
  const user = await User.findByIdAndDelete(req.params.id)
  if (!user) throw fail(404, 'NO_USER', 'That account was already deleted - refresh the list.')
  await Audit.create({ action: 'delete-user', targetId: user._id, targetEmail: user.email, targetRole: user.role, ip: clientIp(req) })
  res.json({ ok: true })
}))

// Reads a few env names so setup problems are visible from the dashboard.
router.get('/health', wrap(async (req, res) => {
  const has = name => Boolean(env(name))
  res.json({
    mongodb: has('MONGODB_URI'),
    session: has('SESSION_SECRET'),
    google: has('GOOGLE_CLIENT_ID') && has('GOOGLE_CLIENT_SECRET'),
    cloudinary: has('CLOUDINARY_CLOUD_NAME') && has('CLOUDINARY_API_KEY') && has('CLOUDINARY_API_SECRET'),
    push: (has('VITE_VAPID_PUBLIC_KEY') || has('VAPID_PUBLIC_KEY')) && has('VAPID_PRIVATE_KEY'),
    chat: has('OPENROUTER_API_KEY'),
  })
}))

export default router
