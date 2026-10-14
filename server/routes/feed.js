// Notifications (the bell), background push subscriptions and analytics events.

import { Router } from 'express'
import mongoose from 'mongoose'
import { Event, Notification, Paper, PushSub } from '../models.js'
import { fail, wrap } from '../lib/errors.js'
import { clientIp, whoIsThis } from '../lib/session.js'
import { limit } from '../lib/throttle.js'
import { pqKey } from '../lib/courses.js'
import { usernameProblem } from '../../src/lib/schoolEmail.js'

/* ------------------------------ notifications ----------------------------- */

export const notificationsRouter = Router()

notificationsRouter.get('/', wrap(async (req, res) => {
  const rows = await Notification.find().sort({ createdAt: -1 }).limit(100)
  res.json({
    items: rows.map(n => ({
      id: String(n._id),
      course_id: n.courseId,
      kind: n.kind,
      body: n.body,
      url: n.url,
      created_at: n.createdAt.toISOString(),
    })),
  })
}))

/* ---------------------------------- push ---------------------------------- */

export const pushRouter = Router()

pushRouter.post('/subscribe', wrap(async (req, res) => {
  await limit(`push:${clientIp(req)}`, { max: 60, windowSec: 3600, what: 'notification sign-ups' })

  const { endpoint, keys, courses } = req.body || {}
  if (typeof endpoint !== 'string' || !endpoint.startsWith('https://') || !keys?.p256dh || !keys?.auth) {
    throw fail(400, 'BAD_SUBSCRIPTION', "Your browser's notification details were incomplete. Turn notifications off and on again.")
  }

  const courseKeys = [...new Set((Array.isArray(courses) ? courses : []).map(c => pqKey(String(c))).filter(Boolean))].slice(0, 80)

  await PushSub.findOneAndUpdate(
    { endpoint },
    {
      endpoint,
      p256dh: String(keys.p256dh),
      auth: String(keys.auth),
      courseKeys,
      userAgent: String(req.headers['user-agent'] || '').slice(0, 200),
    },
    { upsert: true }
  )
  res.json({ ok: true })
}))

pushRouter.post('/unsubscribe', wrap(async (req, res) => {
  if (typeof req.body?.endpoint === 'string') await PushSub.deleteOne({ endpoint: req.body.endpoint })
  res.json({ ok: true })
}))

/* -------------------------------- analytics ------------------------------- */

export const eventsRouter = Router()

const TYPES = new Set(['open', 'read', 'download', 'link', 'active'])
const short = (value, max) => (typeof value === 'string' ? value.slice(0, max) : undefined)

// Someone who isn't signed in only counts on the pages made for them: the
// sign-in screens (/auth for students, /admin for staff) and the open /upload
// page. Anything else arriving without a session is a leftover - e.g. a "log in
// as" session that ran out while a paper was still open - and is dropped.
const SIGNED_OUT_PATHS = new Set(['/auth', '/admin', '/upload'])

eventsRouter.post('/', wrap(async (req, res) => {
  await limit(`events:${clientIp(req)}`, { max: 900, windowSec: 3600, what: 'requests' })

  const incoming = Array.isArray(req.body?.events) ? req.body.events.slice(0, 30) : []
  if (!incoming.length) return res.json({ ok: true })

  const found = await whoIsThis(req, req.body?.as === 'admin' ? 'admin' : 'student')
  // The site owner looking around as someone else shouldn't pollute the numbers.
  if (found?.impersonated) return res.json({ ok: true, skipped: true })

  // Resolve paper titles on the server instead of trusting the browser.
  const ids = [...new Set(incoming.map(e => e?.paperId).filter(id => mongoose.isValidObjectId(id)))]
  const papers = ids.length ? await Paper.find({ _id: { $in: ids } }).select('courseCode courseKey session version') : []
  const byId = new Map(papers.map(p => [String(p._id), p]))

  // A guest on /upload may have given a name there: "Name (Uploader)". Without
  // one they are just "Uploader". Signed-in people always use their account.
  const given = String(req.body?.uploaderName ?? '').trim()
  const guestName = !found && given && !usernameProblem(given) ? given : null

  const docs = []
  for (const e of incoming) {
    if (!TYPES.has(e?.type)) continue
    if (!found && !(e.type === 'active' && SIGNED_OUT_PATHS.has(e.path))) continue
    const paper = byId.get(String(e.paperId))
    const seconds = e.type === 'read' || e.type === 'active'
      ? Math.max(0, Math.min(300, Math.round(Number(e.seconds) || 0)))
      : 0

    const asGuest = guestName && e.path === '/upload'

    docs.push({
      type: e.type,
      userId: found?.user._id || null,
      role: found?.user.role || (asGuest ? 'uploader' : undefined),
      name: found?.user.username || (asGuest ? guestName : undefined),
      email: found?.user.email,
      anonId: short(req.body?.anonId, 64),
      paperId: paper?._id || null,
      courseKey: paper?.courseKey,
      title: paper ? `${paper.courseCode} ${paper.session}${paper.version > 1 ? ` v${paper.version}` : ''}` : undefined,
      seconds,
      label: short(e.label, 80),
      url: short(e.url, 300),
      path: short(e.path, 200),
    })
  }

  if (docs.length) await Event.insertMany(docs)
  res.json({ ok: true })
}))
