import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useSession } from '../lib/session'
import './ImpersonationBanner.css'

// Shown on every page while the site owner is "logged in as" someone else.
// The session stops by itself after 10 minutes; this just makes it obvious and
// gives a way back.
export default function ImpersonationBanner() {
  const { impersonating } = useSession()
  const [left, setLeft] = useState(0)

  useEffect(() => {
    if (!impersonating?.expiresAt) return
    const tick = () => setLeft(Math.max(0, Math.round((new Date(impersonating.expiresAt) - Date.now()) / 1000)))
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

  const mm = String(Math.floor(left / 60)).padStart(1, '0')
  const ss = String(left % 60).padStart(2, '0')

  return (
    <div className="imp-bar" role="status">
      <span>
        You are viewing Nexus as <b>{impersonating.email}</b> ({impersonating.role}). Ends in {mm}:{ss}.
      </span>
      <button type="button" onClick={stop}>Back to owner area</button>
    </div>
  )
}
