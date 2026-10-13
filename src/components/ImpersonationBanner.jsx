import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useSession } from '../lib/session'
import './ImpersonationBanner.css'

// The owner's "log in as" sessions last this long (see IMPERSONATE_SECONDS on the server).
const SESSION_SECONDS = 10 * 60

const secondsLeft = expiresAt =>
  expiresAt ? Math.max(0, Math.round((new Date(expiresAt) - Date.now()) / 1000)) : 0

// Shown while the site owner is "logged in as" someone else. The session stops
// by itself when time runs out; this makes it obvious and gives a way back.
//
//   variant="card"   in the sidebar, under the nav (desktop)
//   variant="strip"  a slim bar across the top, phones only - there the sidebar
//                    is a hidden drawer, so the reminder would otherwise be out of sight
export default function ImpersonationBanner({ variant = 'strip' }) {
  const { impersonating } = useSession()
  // Start from the real time left, so the bar doesn't animate in from empty.
  const [left, setLeft] = useState(() => secondsLeft(impersonating?.expiresAt))

  useEffect(() => {
    if (!impersonating?.expiresAt) return
    const tick = () => setLeft(secondsLeft(impersonating.expiresAt))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [impersonating?.expiresAt])

  // Time's up: the cookie has already expired, so just return to the owner area.
  useEffect(() => {
    if (impersonating && left === 0 && new Date(impersonating.expiresAt) <= Date.now()) {
      window.location.assign('/delealone')
    }
  }, [impersonating, left])

  if (!impersonating) return null

  async function stop() {
    try {
      const { url } = await api('/dele/impersonate/stop', { method: 'POST' })
      window.location.assign(url)
    } catch {
      window.location.assign('/delealone')
    }
  }

  const time = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`
  const as = impersonating.role === 'admin' ? 'an admin' : 'a student'
  const low = left < 60

  if (variant === 'card') {
    return (
      <section className="imp-card" aria-label="You are viewing Nexus as another account">
        <p className="imp-lead">Viewing as {as}</p>
        <p className="imp-who" title={impersonating.email}>{impersonating.email}</p>

        <div className="imp-track" aria-hidden="true">
          <span className={low ? 'low' : ''} style={{ width: `${Math.min(100, (left / SESSION_SECONDS) * 100)}%` }} />
        </div>
        <p className={`imp-left${low ? ' low' : ''}`}>{time} left</p>

        <button type="button" onClick={stop}>Back to owner area</button>
      </section>
    )
  }

  return (
    <div className="imp-bar" role="region" aria-label="You are viewing Nexus as another account">
      <span>
        Viewing as {as}: <b>{impersonating.email}</b> · {time} left
      </span>
      <button type="button" onClick={stop}>Back to owner area</button>
    </div>
  )
}
