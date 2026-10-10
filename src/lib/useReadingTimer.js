import { useEffect } from 'react'
import { getReading, saveReading } from './readingProgress'
import { track } from './track'

// Pause the clock after this long without any interaction.
const IDLE_MS = 60000

// Save to storage every N counted seconds (and whenever the tab is hidden/closed).
const SAVE_EVERY = 5

// Counts the seconds a student is actually reading a paper: the tab must be
// visible and focused, and they must have scrolled, clicked or typed within the
// last IDLE_MS. Walking away with the tab open stops the clock, which is what
// separates reading from a peek (see PEEK_SECONDS in readingProgress.js).
//
// Pass trackIdle=false when the paper sits in an iframe (Word files) - the
// iframe swallows input events, so we can only go by visibility/focus.
export function useReadingTimer(courseCode, year, trackIdle = true, paperId = null) {
  useEffect(() => {
    let unsaved = 0
    let lastActivity = Date.now()

    const bump = () => { lastActivity = Date.now() }
    const events = ['pointerdown', 'pointermove', 'wheel', 'keydown', 'touchstart', 'touchmove']
    events.forEach(e => window.addEventListener(e, bump, { passive: true }))
    // scroll doesn't bubble, so catch it on the way down to reach the reader's own scroller.
    window.addEventListener('scroll', bump, { passive: true, capture: true })

    // Add only the new seconds to what's stored (rather than writing our own
    // running total), so another tab reading the same paper isn't overwritten.
    const flush = () => {
      if (!unsaved) return
      saveReading(courseCode, year, { seconds: getReading(courseCode, year).seconds + unsaved })
      // The same seconds also go to the owner's usage numbers.
      if (paperId) track('read', { paperId, seconds: unsaved })
      unsaved = 0
    }

    const id = setInterval(() => {
      const watching = document.visibilityState === 'visible' && document.hasFocus()
      const active = !trackIdle || Date.now() - lastActivity < IDLE_MS
      if (!watching || !active) return

      unsaved += 1
      if (unsaved >= SAVE_EVERY) flush()
    }, 1000)

    document.addEventListener('visibilitychange', flush)
    window.addEventListener('pagehide', flush)

    return () => {
      clearInterval(id)
      events.forEach(e => window.removeEventListener(e, bump))
      window.removeEventListener('scroll', bump, { capture: true })
      document.removeEventListener('visibilitychange', flush)
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [courseCode, year, trackIdle, paperId])
}
