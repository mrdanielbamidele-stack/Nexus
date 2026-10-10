// The past questions students can open, as served by /api/papers.
//
// Course key = pqKey(code): lowercase, no spaces/hyphens, "TUM" prefix dropped
//              ("COS 101" -> "cos101"). It is also what the routes use.
// Year key   = the session as 8 digits ("20232024"); a second paper for the same
//              course + session is "20232024-v2", and so on.
//
// The index is loaded once at start-up (see main.jsx) and can be refreshed.
// Everything below reads it synchronously. Components that must re-render when
// it changes call usePapers(); usePapersReady() says whether the first load has
// finished (successfully or not), so screens can show skeletons until then
// instead of "no papers" or a 404.

import { useSyncExternalStore } from 'react'
import { api } from './api'
import { isDemo, DEMO_PAPER_URL } from './demo'
import { pqKey } from './courseSlug'
import { getAllCatalogCourses } from './studentCourses'

export { pqKey }

let index = {} // pqKey -> { code, title, years: { yearKey: paper } }
let settled = isDemo // the demo has no list to wait for
const listeners = new Set()

function notify() {
  listeners.forEach(listener => listener())
}

function setIndex(next) {
  index = next
  notify()
}

export async function loadPapers() {
  if (isDemo) return
  try {
    const { courses } = await api('/papers')
    setIndex(courses)
  } catch {
    // Offline: keep what we had. The papers screens just show what is cached.
  } finally {
    if (!settled) {
      settled = true
      notify()
    }
  }
}

function subscribe(callback) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

export function usePapers() {
  return useSyncExternalStore(subscribe, () => index)
}

// false until the first load has finished, even if it failed.
export function usePapersReady() {
  return useSyncExternalStore(subscribe, () => settled)
}

// The demo shows one paper for every course (see lib/demo.js).
const DEMO_PAPER = {
  id: null,
  session: '2023/2024',
  version: 1,
  fileUrl: DEMO_PAPER_URL,
  files: [{ url: DEMO_PAPER_URL, name: 'STA111-20232024.pdf', kind: 'document', format: 'pdf', page: null }],
}

// The course entry ({ code, title, years }) or null.
export function getCoursePQ(codeOrSlug) {
  if (isDemo) {
    const own = getAllCatalogCourses().find(c => pqKey(c.code) === pqKey(codeOrSlug))
    if (!own) return null
    return { code: own.code, title: own.title, years: { '20232024': DEMO_PAPER } }
  }
  return index[pqKey(codeOrSlug)] || null
}

// Available year keys for a course, newest first. [] when none.
export function getAvailableYears(codeOrSlug) {
  const course = getCoursePQ(codeOrSlug)
  if (!course) return []
  return Object.keys(course.years).sort().reverse()
}

// A single year's paper ({ id, session, version, fileUrl, files }), or null.
export function getPaper(codeOrSlug, year) {
  return getCoursePQ(codeOrSlug)?.years?.[year] || null
}

// "20232024" -> "2023/2024", "20232024-v2" -> "2023/2024 v2".
export function formatYear(yearKey) {
  const match = /^(\d{4})(\d{4})(?:-v(\d+))?$/.exec(yearKey || '')
  if (!match) return yearKey
  return `${match[1]}/${match[2]}${match[3] ? ` v${match[3]}` : ''}`
}
