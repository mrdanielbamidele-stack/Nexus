// Usage tracking: which papers are opened, read (and for how long) and
// downloaded, which links are clicked, and how long people keep Nexus open.
// Everything is batched and sent to /api/events; failures are silent because
// tracking must never get in the way of studying.

import { isDemo } from './demo'
import { uploaderName } from './uploader'

const ANON_KEY = 'nexus_anon'
const FLUSH_MS = 20000
const BEAT_SECONDS = 15
const MAX_BATCH = 30

let queue = []
let timer = 0

function anonId() {
  try {
    let id = localStorage.getItem(ANON_KEY)
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36)
      localStorage.setItem(ANON_KEY, id)
    }
    return id
  } catch {
    return ''
  }
}

const area = () => (location.pathname.startsWith('/admin') ? 'admin' : 'student')

function send(useBeacon) {
  clearTimeout(timer)
  timer = 0
  if (!queue.length) return

  const events = queue.splice(0, MAX_BATCH)
  // The name a signed-out visitor gave on /upload (the server only uses it for
  // them, and only for events from that page).
  const body = JSON.stringify({ events, anonId: anonId(), as: area(), uploaderName: uploaderName() })

  try {
    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon('/api/events', new Blob([body], { type: 'application/json' }))
    } else {
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
        credentials: 'same-origin',
      }).catch(() => {})
    }
  } catch {
    /* tracking is best effort */
  }

  if (queue.length) timer = setTimeout(() => send(false), 1000)
}

// type: 'open' | 'read' | 'download' | 'link' | 'active'
export function track(type, data = {}) {
  // The site owner's own clicks in /delealone aren't "usage".
  if (isDemo || location.pathname.startsWith('/delealone')) return

  // Seconds pile up into one event per paper/page instead of one per tick.
  if (type === 'read' || type === 'active') {
    const same = queue.find(e => e.type === type && e.paperId === data.paperId && e.path === data.path)
    if (same) same.seconds += data.seconds || 0
    else queue.push({ type, ...data })
  } else {
    queue.push({ type, ...data })
  }

  if (!timer) timer = setTimeout(() => send(false), FLUSH_MS)
}

// Called once at start-up.
export function startTracking() {
  if (isDemo || typeof window === 'undefined') return

  // Time on the platform: a tick for every few seconds the tab is visible.
  setInterval(() => {
    if (document.visibilityState === 'visible' && document.hasFocus()) {
      track('active', { seconds: BEAT_SECONDS, path: location.pathname.split('/').slice(0, 2).join('/') || '/' })
    }
  }, BEAT_SECONDS * 1000)

  // Every outside link / mailto / WhatsApp tap, without touching each component.
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href]')
    if (!link) return
    const href = link.getAttribute('href') || ''
    const outside = /^(https?:)?\/\//i.test(href) || href.startsWith('mailto:') || href.startsWith('tel:')
    if (!outside) return

    const label = (link.getAttribute('aria-label') || link.textContent || '').replace(/\s+/g, ' ').trim()
    track('link', { label: label.slice(0, 60) || href, url: link.href })
  }, { capture: true })

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') send(true)
  })
  window.addEventListener('pagehide', () => send(true))
}
