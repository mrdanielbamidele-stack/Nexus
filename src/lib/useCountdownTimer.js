import { useEffect, useState, useRef, useCallback } from 'react'
import {
  getExamRemaining,
  setExamRemaining,
} from './campaignTimer'

// Exam countdown for the campaign test pages. It counts down only while the
// student is actually on the page -the clock PAUSES when the tab is hidden or
// the browser window loses focus (i.e. they leave the browser), and resumes
// when they come back, just like the study clock. The remaining time is
// persisted per course so a reload continues where it left off. When it reaches
// zero, `onExpire` fires once (used to auto-submit the paper).
//
//   courseCode   canonical catalog code, e.g. "STA 111"
//   durationSecs total exam length in seconds (see getCourseDuration)
//   active       whether the clock should run (false once submitted/graded)
//   onExpire     called a single time when the countdown reaches 0
export function useCountdownTimer(courseCode, durationSecs, active, onExpire) {
  const [remaining, setRemaining] = useState(durationSecs)
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire
  const firedRef = useRef(false)
  const remainingRef = useRef(durationSecs)

  useEffect(() => {
    if (!active || !courseCode) return

    // Resume saved time, or start fresh on first entry.
    let secs = getExamRemaining(courseCode)
    if (secs == null) {
      secs = durationSecs
      setExamRemaining(courseCode, secs)
    }
    remainingRef.current = secs
    setRemaining(secs)
    if (secs <= 0) firedRef.current = true

    const tick = () => {
      // Only the page in front of the user counts down. document.hidden covers
      // a backgrounded tab; hasFocus() covers leaving the browser entirely.
      const onScreen = !document.hidden &&
        (typeof document.hasFocus !== 'function' || document.hasFocus())
      if (!onScreen) return

      const next = Math.max(0, remainingRef.current - 1)
      remainingRef.current = next
      setRemaining(next)
      setExamRemaining(courseCode, next)

      if (next <= 0 && !firedRef.current) {
        firedRef.current = true
        onExpireRef.current?.()
      }
    }

    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [courseCode, durationSecs, active])

  // Restart the countdown from full duration (called on a retake).
  const reset = useCallback(() => {
    if (!courseCode) return
    setExamRemaining(courseCode, durationSecs)
    remainingRef.current = durationSecs
    firedRef.current = false
    setRemaining(durationSecs)
  }, [courseCode, durationSecs])

  return { remaining, reset }
}
