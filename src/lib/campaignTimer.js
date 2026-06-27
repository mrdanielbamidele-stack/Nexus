// Campaign study timer -tracks active time spent taking tests, per course and
// in total. The clock only advances while the student is actually working (see
// useStudyTimer): it pauses on idle / hidden tab and resumes when they return.

const TIMER_KEY = 'nexus_campaign_timer'

function load() {
  try { return JSON.parse(localStorage.getItem(TIMER_KEY)) || { total: 0, courses: {} } }
  catch { return { total: 0, courses: {} } }
}
function persist(t) {
  try { localStorage.setItem(TIMER_KEY, JSON.stringify(t)) } catch { /* quota */ }
}

// Add `secs` of active time to a course and the campaign total.
export function addActiveSeconds(courseCode, secs = 1) {
  const t = load()
  t.total = (t.total || 0) + secs
  if (courseCode) t.courses[courseCode] = (t.courses[courseCode] || 0) + secs
  persist(t)
}

export function getTotalTime() { return load().total || 0 }
export function getCourseTime(courseCode) { return load().courses?.[courseCode] || 0 }

// Wipe the timer (called when a campaign is started fresh or ended).
export function resetCampaignTime() { persist({ total: 0, courses: {} }) }

// ── Timed-exam countdown ──────────────────────────────────────────────────────
// Each campaign test runs for a fixed duration of *active* time. STA 111 gets 3
// hours, COS 101 and TUM-GES 103 get 1 hour each, every other course gets 2.
// The countdown only ticks while the page is visible and the browser is focused
// (see useCountdownTimer), so we persist the REMAINING seconds rather than a
// wall-clock deadline -leaving the browser pauses it, exactly like the study
// clock.

const EXAM_TIMER_PREFIX = 'nexus_exam_timer_'

// Canonical/catalog code -> clean slug, mirroring testKey() in campaign.js.
function slug(code) {
  return (code ?? '').toLowerCase().replace(/\s+/g, '').replace(/^tum-/, '')
}

// Exam length in seconds for a course (defaults to 2 hours).
export function getCourseDuration(code) {
  const key = slug(code)
  if (key === 'sta111') return 3 * 3600
  if (key === 'cos101' || key === 'ges103') return 1 * 3600
  return 2 * 3600
}

const examTimerKey = (code) => EXAM_TIMER_PREFIX + (code ?? '').replace(/\s+/g, '')

// Read the stored remaining seconds for a course, or null if none saved yet.
export function getExamRemaining(code) {
  const raw = localStorage.getItem(examTimerKey(code))
  if (raw == null) return null
  const v = Number(raw)
  return Number.isFinite(v) ? Math.max(0, v) : null
}

// Persist the remaining seconds for a course.
export function setExamRemaining(code, secs) {
  try { localStorage.setItem(examTimerKey(code), String(Math.max(0, Math.floor(secs)))) }
  catch { /* quota */ }
}

// Forget a course's timer so the next attempt starts a fresh clock.
export function clearExamDeadline(code) {
  try { localStorage.removeItem(examTimerKey(code)) } catch { /* ignore */ }
}

// 3725 -> "1:02:05",  185 -> "03:05"
export function formatDuration(totalSecs) {
  const s = Math.max(0, Math.floor(totalSecs || 0))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  const pad = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(ss)}` : `${pad(m)}:${pad(ss)}`
}
