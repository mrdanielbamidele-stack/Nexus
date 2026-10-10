// Reading progress for past-question papers, kept in localStorage.
//
// One record per paper ("cos101/20232024"):
//   seconds    active reading time (see useReadingTimer - idle/hidden time is not counted)
//   page       the page the student was last on (so the reader can resume there)
//   maxPage    the furthest page they actually read (a page counts once it has
//              stayed on screen for a moment, so flicking past doesn't)
//   totalPages page count (0 for images/Word files, which have no pages)
//
// A paper only shows up in "Continue Studying" once the student has spent
// PEEK_SECONDS actively reading it - anything shorter was just a peek.

import { pqKey, getCoursePQ } from './pastQuestions'

const STORE_KEY = 'pqReading'

export const PEEK_SECONDS = 90

const EMPTY = { seconds: 0, page: 1, maxPage: 1, totalPages: 0 }

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || {}
  } catch {
    return {}
  }
}

function paperKey(courseCode, year) {
  return `${pqKey(courseCode)}/${year}`
}

export function getReading(courseCode, year) {
  return { ...EMPTY, ...readAll()[paperKey(courseCode, year)] }
}

// Merge `patch` into the paper's record. Callers only send the fields they own
// (the timer sends `seconds`, the reader sends the page fields), so the two
// never overwrite each other.
export function saveReading(courseCode, year, patch) {
  const all = readAll()
  const key = paperKey(courseCode, year)
  all[key] = { ...EMPTY, ...all[key], ...patch, updatedAt: Date.now() }
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(all))
  } catch {
    // Storage full or blocked - progress just won't persist.
  }
}

const isStudying = r => r.seconds >= PEEK_SECONDS
const isFinished = r => r.totalPages > 1 && r.maxPage >= r.totalPages

// Papers worth resuming: read for real (not just peeked at) and not finished,
// most recently read first. Shaped for the Dashboard's Continue Studying cards.
export function getContinueList() {
  return Object.entries(readAll())
    .filter(([, r]) => isStudying(r) && !isFinished(r))
    .sort(([, a], [, b]) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .map(([key, r]) => {
      const [slug, year] = key.split('/')
      const paper = getCoursePQ(slug)?.years?.[year]
      if (!paper) return null

      const minutes = Math.max(1, Math.round(r.seconds / 60))
      const where = r.totalPages > 1 ? `Page ${r.page} of ${r.totalPages} · ` : ''
      return {
        key,
        courseCode: getCoursePQ(slug).code,
        task: `${paper.session} Past Questions`,
        detail: `${where}${minutes} min read`,
        progress: r.totalPages > 1 ? Math.round((r.maxPage / r.totalPages) * 100) : 0,
        url: `/pastquestions/${slug}/${year}`,
      }
    })
    .filter(Boolean)
}
