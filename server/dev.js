// Local API server. `npm run dev` starts this next to Vite, and Vite proxies
// /api to it (see vite.config.js). In production the same app runs as a Netlify
// Function instead - see netlify/functions/api.mjs.

import { createApp } from './app.js'
import { connectDb } from './db.js'
import { ensureSeeded } from './seed.js'
import { env } from './lib/env.js'

const port = Number(env('API_PORT') || 8787)

createApp().listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`)

  // Connect now rather than on the first request, so a sign-in right after a
  // restart doesn't have to wait for (or trip over) the database handshake.
  connectDb()
    .then(ensureSeeded)
    .then(() => console.log('[api] database ready'))
    .catch(err => console.error('[api] database not ready yet:', err.message))
})
