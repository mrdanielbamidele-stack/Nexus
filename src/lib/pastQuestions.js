// Lookup helpers over the generated pastQuestions data.
//
// Course codes appear in several forms across the catalog ("COS 101",
// "TUM-GES 101", "GES 101"). pqKey() collapses them all to the clean slug the
// data + routes use ("cos101", "ges101") by lowercasing, dropping spaces/hyphens
// and stripping the institutional "TUM" prefix.

import { pastQuestions as generated } from '../data/pastQuestions'
import { pastQuestionsExtra as extra } from '../data/pastQuestionsExtra'

// Merge the auto-generated bank with the hand-edited additions. Extra entries
// add new courses, and add (or override) years on existing courses - so the
// generator can be re-run any time without clobbering manually-added papers.
function mergePastQuestions() {
  const out = {}
  for (const [code, course] of Object.entries(generated)) {
    out[code] = { ...course, years: { ...course.years } }
  }
  for (const [code, course] of Object.entries(extra)) {
    out[code] = out[code]
      ? { ...out[code], ...course, years: { ...out[code].years, ...course.years } }
      : { ...course, years: { ...course.years } }
  }
  return out
}

export const pastQuestions = mergePastQuestions()

export function pqKey(codeOrSlug) {
  return (codeOrSlug || '')
    .toLowerCase()
    .replace(/[\s-]/g, '')
    .replace(/^tum/, '')
}

// The course entry ({ code, title, [subject], years }) or null.
export function getCoursePQ(codeOrSlug) {
  return pastQuestions[pqKey(codeOrSlug)] || null
}

// Available year slugs for a course, newest first. [] when none.
export function getAvailableYears(codeOrSlug) {
  const course = getCoursePQ(codeOrSlug)
  if (!course) return []
  return Object.keys(course.years).sort().reverse()
}

// A single year's quiz definition, or null.
export function getQuiz(codeOrSlug, year) {
  return getCoursePQ(codeOrSlug)?.years?.[year] || null
}

// "20232024" -> "2023/2024" for display when an explicit session isn't given.
export function formatYear(yearSlug) {
  if (/^\d{8}$/.test(yearSlug)) return `${yearSlug.slice(0, 4)}/${yearSlug.slice(4)}`
  return yearSlug
}
