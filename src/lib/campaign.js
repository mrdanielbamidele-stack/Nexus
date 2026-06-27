// Shared campaign engine -localStorage state + grading helpers.
// Mirrors the legacy hi.js CampaignEngine so the React Campaign page and the
// migrated quiz page (CampaignTest) read/write the same data.

import { clearExamDeadline } from './campaignTimer'

const CAMPAIGN_KEY = 'nexus_campaign'

// ── Campaign state ────────────────────────────────────────────────────────────

export function loadCampaign() {
  try { return JSON.parse(localStorage.getItem(CAMPAIGN_KEY)) || null }
  catch { return null }
}
export function saveCampaign(data) {
  localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(data))
}

// Called when a user OPENS a test: flip not_started -> in_progress.
export function markInProgress(courseCode) {
  const campaign = loadCampaign()
  if (!campaign) return
  const course = campaign.courses[courseCode]
  if (course && course.status === 'not_started') {
    course.status = 'in_progress'
    saveCampaign(campaign)
  }
}

// Opening a test = starting an attempt. Used by the essay flow (which has a fixed
// question set, so it doesn't need resolveBatch). not_started OR completed both
// move to in_progress; a retake (was completed) clears the old score until resubmit.
export function markAttemptStart(courseCode) {
  const campaign = loadCampaign()
  if (!campaign) return
  const course = campaign.courses[courseCode]
  if (!course) return
  if (course.status === 'not_started') {
    course.status = 'in_progress'
    clearExamDeadline(courseCode)   // first attempt -> fresh exam clock
    saveCampaign(campaign)
  } else if (course.status === 'completed') {
    course.status = 'in_progress'
    course.score = null
    course.completedAt = null
    clearExamDeadline(courseCode)   // retake -> fresh exam clock
    saveCampaign(campaign)
  }
  // status already 'in_progress' -> resume the existing countdown, no reset.
}

// Called when a user FINISHES a test: record the percentage score.
export function recordResult(courseCode, score) {
  const campaign = loadCampaign()
  if (!campaign) return
  const course = campaign.courses[courseCode]
  if (course) {
    course.status      = 'completed'
    course.score       = score
    course.completedAt = new Date().toISOString()
    saveCampaign(campaign)
  }
}

// ── Per-attempt result history (for "Review Answers") ─────────────────────────

const resultKey = (code) => 'nexus_result_' + code.replace(/\s+/g, '')

export function loadCourseResult(courseCode) {
  try {
    const data = JSON.parse(localStorage.getItem(resultKey(courseCode)))
    if (!data) return []
    return Array.isArray(data) ? data : [data]   // migrate old single-object form
  } catch { return [] }
}

// Append an attempt; returns its 1-based attempt number.
export function saveCourseResult(courseCode, result) {
  const history = loadCourseResult(courseCode)
  result.attemptNumber = history.length + 1
  history.push(result)
  try { localStorage.setItem(resultKey(courseCode), JSON.stringify(history)) }
  catch (e) { console.warn('Could not save result:', e) }
  return result.attemptNumber
}

// Remove all per-course artifacts (saved attempts, question batches, in-progress
// answers) so a brand-new campaign -or an ended one -starts from a clean slate.
export function clearCampaignArtifacts() {
  const prefixes = ['nexus_result_', 'nexus_pool_', 'nexus_answers_', 'nexus_exam_timer_']
  Object.keys(localStorage)
    .filter(k => prefixes.some(p => k.startsWith(p)))
    .forEach(k => localStorage.removeItem(k))
}

// ── Persistent question batch (MCQ) ───────────────────────────────────────────
// Bug fix: the objective test used to re-shuffle a brand-new set of questions on
// every mount, so leaving the page and coming back kept switching the batch.
// We now lock the chosen question indices to localStorage so the SAME batch is
// shown until the student finishes and explicitly retakes.

const poolKey    = (code) => 'nexus_pool_' + code.replace(/\s+/g, '')
const answersKey = (code) => 'nexus_answers_' + code.replace(/\s+/g, '')

// Fisher–Yates over the question indices, then take the first `total`.
function makeIndices(test) {
  const idx = test.questions.map((_, i) => i)
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }
  const total = Math.min(test.total || idx.length, idx.length)
  return idx.slice(0, total)
}

// Read a saved batch of indices for a course, or null if none / invalid.
function readSavedIndices(key, test) {
  try {
    const saved = JSON.parse(localStorage.getItem(poolKey(key)))
    if (!Array.isArray(saved) || saved.length === 0) return null
    const valid = saved.every(i => Number.isInteger(i) && i >= 0 && i < test.questions.length)
    return valid ? saved : null
  } catch { return null }
}

// Flip a course's status in the active campaign (no-op if it doesn't exist).
function setCourseStatus(canonicalCode, patch) {
  const campaign = loadCampaign()
  const course = campaign?.courses?.[canonicalCode]
  if (!course) return
  Object.assign(course, patch)
  saveCampaign(campaign)
}

// Persist the in-progress answer map so a half-finished attempt survives reloads.
export function saveBatchAnswers(key, answers) {
  try { localStorage.setItem(answersKey(key), JSON.stringify(answers)) } catch { /* quota */ }
}

// Generate + persist a fresh batch and move the course back to In Progress.
// Used both for an explicit "Retake" and the first time a course is opened.
export function startFreshBatch(key, test, canonicalCode) {
  const indices = makeIndices(test)
  localStorage.setItem(poolKey(key), JSON.stringify(indices))
  localStorage.removeItem(answersKey(key))
  clearExamDeadline(canonicalCode)   // new attempt -> fresh exam clock
  setCourseStatus(canonicalCode, { status: 'in_progress', score: null, completedAt: null })
  return indices
}

// Decide which batch to show when the test page opens.
//  • completed  → this is a RETAKE: fresh batch, course returns to In Progress.
//  • saved one  → restore the exact same batch (+ any saved answers).
//  • otherwise  → first attempt: create + lock a batch, mark In Progress.
// Writes synchronously so React StrictMode's double-mount stays consistent.
export function resolveBatch(key, test, canonicalCode) {
  const campaign = loadCampaign()
  const status   = campaign?.courses?.[canonicalCode]?.status

  if (status === 'completed') {
    return { indices: startFreshBatch(key, test, canonicalCode), answers: {} }
  }

  const saved = readSavedIndices(key, test)
  if (saved) {
    let answers = {}
    try { answers = JSON.parse(localStorage.getItem(answersKey(key))) || {} } catch { answers = {} }
    if (status === 'not_started') setCourseStatus(canonicalCode, { status: 'in_progress' })
    return { indices: saved, answers }
  }

  const indices = makeIndices(test)
  localStorage.setItem(poolKey(key), JSON.stringify(indices))
  clearExamDeadline(canonicalCode)   // first attempt -> fresh exam clock
  if (status === 'not_started') setCourseStatus(canonicalCode, { status: 'in_progress' })
  return { indices, answers: {} }
}

// ── Grade helpers ─────────────────────────────────────────────────────────────

export function getLetterGrade(score) {
  if (score === null || score === undefined) return '–'
  if (score >= 70) return 'A'
  if (score >= 60) return 'B'
  if (score >= 50) return 'C'
  if (score >= 45) return 'D'
  if (score >= 40) return 'E'
  return 'F'
}

// ── Test-code slug ────────────────────────────────────────────────────────────
// Canonical catalog code -> clean test slug used in the URL and the test data:
//   "COS 101"      -> "cos101"
//   "TUM-CSC 112"  -> "csc112"
//   "TUM-GES 103"  -> "ges103"
export const testKey = (code) =>
  (code ?? '').toLowerCase().replace(/\s+/g, '').replace(/^tum-/, '')
