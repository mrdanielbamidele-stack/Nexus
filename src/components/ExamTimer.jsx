import { useEffect, useRef, useState } from 'react'
import { formatDuration } from '../lib/campaignTimer'
import './ExamTimer.css'

const THIRTY_MIN = 30 * 60
const FIVE_MIN   = 5 * 60

// Floating, always-visible exam countdown. Turns amber inside the last 30
// minutes and red inside the last 5, and pops a one-time warning toast at each
// threshold. Re-arms itself if the countdown jumps back up (a retake).
export default function ExamTimer({ remaining, hidden = false }) {
  const [toast, setToast] = useState(null)
  const warned = useRef({ thirty: false, five: false })

  useEffect(() => {
    if (remaining == null) return

    // Re-arm warnings when a fresh attempt resets the clock.
    if (remaining > THIRTY_MIN) {
      warned.current.thirty = false
      warned.current.five = false
      return
    }
    if (remaining <= FIVE_MIN && remaining > 0 && !warned.current.five) {
      warned.current.five = true
      warned.current.thirty = true
      setToast('Less than 5 minutes remaining - finish and submit now')
    } else if (remaining <= THIRTY_MIN && !warned.current.thirty) {
      warned.current.thirty = true
      setToast('Less than 30 minutes remaining')
    }
  }, [remaining])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 8000)
    return () => clearTimeout(id)
  }, [toast])

  if (hidden || remaining == null) return null

  const danger = remaining <= FIVE_MIN
  const warn   = !danger && remaining <= THIRTY_MIN
  const stateCls = danger ? 'is-danger' : warn ? 'is-warn' : ''

  return (
    <>
      <div className={`exam-timer ${stateCls}`} role="timer" aria-live="off">
        ⏱
        <div className="exam-timer-body">
          <span className="exam-timer-label">Time left</span>
          <span className="exam-timer-value">{formatDuration(remaining)}</span>
        </div>
      </div>
      {toast && (
        <div className={`exam-timer-toast ${danger ? 'is-danger' : 'is-warn'}`} role="alert">
          {toast}
        </div>
      )}
    </>
  )
}
