import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Shown (and retried by itself) when the API isn't answering yet - for example
// for a second after it restarts. Without this the browser would show a bare
// "This page isn't working" in the middle of a Google sign-in.
const STARTING_PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta http-equiv="refresh" content="2"><title>Nexus is starting</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
font-family:system-ui,sans-serif;background:#f9fafb;color:#374151;text-align:center}
b{color:#7c3aed}</style></head><body><div><p><b>Nexus</b> is getting ready…</p>
<p style="color:#6b7280;font-size:14px">This page will try again by itself.</p></div></body></html>`

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 2009,
    // Google's redirect address is registered for this port, so never drift to another.
    strictPort: true,
    // The API runs beside Vite in development (`npm run dev` starts both).
    // `xfwd` keeps the browser's host so the Google sign-in comes back here.
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        xfwd: true,
        configure(proxy) {
          proxy.on('error', (err, req, res) => {
            if (!res || res.headersSent || typeof res.writeHead !== 'function') return
            const page = String(req.headers.accept || '').includes('text/html')
            res.writeHead(503, {
              'Content-Type': page ? 'text/html; charset=utf-8' : 'application/json',
              'Retry-After': '2',
            })
            res.end(page ? STARTING_PAGE : JSON.stringify({
              error: { code: 'API_STARTING', message: 'Nexus is starting up. One moment…' },
            }))
          })
        },
      },
    },
  },
})
