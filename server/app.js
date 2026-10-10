// The whole API as an Express app. server/dev.js serves it locally;
// netlify/functions/api.mjs serves the same app as a Netlify Function.

import express, { Router } from 'express'
import cookieParser from 'cookie-parser'
import { connectDb } from './db.js'
import { ensureSeeded } from './seed.js'
import { env } from './lib/env.js'
import { errorHandler, fail, notFoundHandler, wrap } from './lib/errors.js'
import authRoutes from './routes/auth.js'
import { adminRouter, meRouter, studentRouter } from './routes/account.js'
import paperRoutes from './routes/papers.js'
import chatRoutes from './routes/chat.js'
import deleRoutes from './routes/dele.js'
import { eventsRouter, notificationsRouter, pushRouter } from './routes/feed.js'

// Cookies are SameSite=Lax already; this also refuses state-changing requests
// that a different website initiated.
function sameSiteOnly(req, res, next) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next()

  const origin = req.headers.origin
  if (!origin) return next()

  let originHost
  try {
    originHost = new URL(origin).host
  } catch {
    return next(fail(403, 'BAD_ORIGIN', 'That request was blocked. Refresh the page and try again.'))
  }

  const allowed = new Set([
    String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim(),
  ])
  const configured = env('APP_URL')
  if (configured) {
    try { allowed.add(new URL(configured).host) } catch { /* ignore a malformed APP_URL */ }
  }

  if (!allowed.has(originHost)) {
    return next(fail(403, 'BAD_ORIGIN', 'That request came from another website, so it was blocked.'))
  }
  next()
}

export function createApp() {
  const app = express()
  app.set('trust proxy', true)
  app.disable('x-powered-by')

  const api = Router()
  api.use((req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })
  api.use(express.json({ limit: '1mb' }))
  api.use(cookieParser())
  api.use(sameSiteOnly)

  // A setup check that never needs the database to be reachable.
  api.get('/health', wrap(async (req, res) => {
    const has = name => Boolean(env(name))
    let database = false
    try {
      await connectDb()
      database = true
    } catch { /* reported below */ }

    res.json({
      ok: true,
      database,
      configured: {
        mongodb: has('MONGODB_URI'),
        session: has('SESSION_SECRET'),
        google: has('GOOGLE_CLIENT_ID') && has('GOOGLE_CLIENT_SECRET'),
        cloudinary: has('CLOUDINARY_CLOUD_NAME') && has('CLOUDINARY_API_KEY') && has('CLOUDINARY_API_SECRET'),
        owner: has('DELEALONE_PASSWORD_1') && has('DELEALONE_PASSWORD_2'),
        push: (has('VITE_VAPID_PUBLIC_KEY') || has('VAPID_PUBLIC_KEY')) && has('VAPID_PRIVATE_KEY'),
        chat: has('OPENROUTER_API_KEY'),
      },
    })
  }))

  // Everything below needs the database.
  api.use(wrap(async (req, res, next) => {
    try {
      await connectDb()
      await ensureSeeded()
    } catch (err) {
      if (err?.code === 'NOT_CONFIGURED') throw err
      console.error('[api] database unavailable:', err.message)
      throw fail(
        503,
        'DB_DOWN',
        "Nexus can't reach its database right now. Please try again in a minute. If it keeps happening, tell us through Contact."
      )
    }
    next()
  }))

  api.use('/auth', authRoutes)
  api.use('/me', meRouter)
  api.use('/student', studentRouter)
  api.use('/admin', adminRouter)
  api.use('/papers', paperRoutes)
  api.use('/notifications', notificationsRouter)
  api.use('/push', pushRouter)
  api.use('/events', eventsRouter)
  api.use('/chat', chatRoutes)
  api.use('/dele', deleRoutes)

  // Locally the app is reached at /api/*; as a Netlify Function the same
  // routes arrive under /.netlify/functions/api/*.
  app.use('/api', api)
  app.use('/.netlify/functions/api', api)

  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}
