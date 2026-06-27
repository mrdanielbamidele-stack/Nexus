import { useEffect, useRef, useState } from 'react'
import { addActiveSeconds, getCourseTime } from './campaignTimer'

// Pause the clock after this long without any interaction.
const IDLE_MS = 20000

// Live study clock for the test pages. Counts one second at a time while the
// student is active (tab visible AND they've interacted within IDLE_MS). When
// they stop answering -idle or tab hidden -it pauses; it resumes on the next
// interaction or when they return. Accumulated time is persisted per course via
// campaignTimer, so leaving and coming back continues where it left off.
export function useStudyTimer(courseCode, enabled = true) {
  const [elapsed, setElapsed] = useState(0)
  const [paused, setPaused]   = useState(false)
  const lastActivity = useRef(Date.now())

  useEffect(() => {
    if (!enabled || !courseCode) return

    setElapsed(getCourseTime(courseCode))
    lastActivity.current = Date.now()

    const bump = () => { lastActivity.current = Date.now() }
    const events = ['keydown', 'pointerdown', 'mousemove', 'input', 'touchstart', 'wheel']
    events.forEach(e => window.addEventListener(e, bump, { passive: true }))

    const id = setInterval(() => {
      const idle = Date.now() - lastActivity.current > IDLE_MS
      if (idle || document.hidden) {
        setPaused(true)
        return
      }
      setPaused(false)
      addActiveSeconds(courseCode, 1)
      setElapsed(prev => prev + 1)
    }, 1000)

    return () => {
      clearInterval(id)
      events.forEach(e => window.removeEventListener(e, bump))
    }
  }, [courseCode, enabled])

  return { elapsed, paused }
}
