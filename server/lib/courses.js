// Server-side view of the course catalogues (the same data files the browser uses).
//
//   courseCatalog   this semester's (Primo) courses - what sign-up and "My courses" use
//   betaCatalog     last semester's (Beta) courses - what reseats are chosen from
//
// A paper can be filed under a course from either, so findCourse looks in both.

import { courseCatalog } from '../../src/data/courseCatalog.js'
import { betaCatalog } from '../../src/data/betaCatalog.js'
import { pqKey } from '../../src/lib/courseSlug.js'

export { pqKey, courseCatalog, betaCatalog }

// pqKey -> { code, title } for every course in a catalogue.
function indexOf(catalog) {
  const index = new Map()
  for (const levels of Object.values(catalog)) {
    for (const list of Object.values(levels)) {
      for (const course of list) {
        const key = pqKey(course.code)
        if (!index.has(key)) index.set(key, { code: course.code, title: course.title })
      }
    }
  }
  return index
}

let primo = null
let beta = null
const primoIndex = () => (primo ||= indexOf(courseCatalog))
const betaIndex = () => (beta ||= indexOf(betaCatalog))

// Any course Nexus has papers for: this semester's first, then last semester's.
export const findCourse = codeOrKey => {
  const key = pqKey(codeOrKey)
  return primoIndex().get(key) || betaIndex().get(key) || null
}

// This semester's courses only (the "My courses" list).
export const hasCourse = code => primoIndex().has(pqKey(code))

// Last semester's courses only (the reseat list). Returns { code, title } with
// the catalogue's own spelling of the code, or null.
export const findReseatCourse = code => betaIndex().get(pqKey(code)) || null

export const programmes = () => Object.keys(courseCatalog)

export const levelsOfProgramme = programme => Object.keys(courseCatalog[programme] || {})

// The course codes a programme + level starts a student with.
export function baseCourseCodes(programme, level) {
  return (courseCatalog[programme]?.[level] || []).map(c => c.code)
}

// "2023/2024" -> "20232024"; null if it isn't a real academic session.
export function sessionKey(session) {
  const match = /^(\d{4})\/(\d{4})$/.exec(String(session || '').trim())
  if (!match || Number(match[2]) !== Number(match[1]) + 1) return null
  return `${match[1]}${match[2]}`
}

export const titleOf = ({ courseCode, session, version }) =>
  `${courseCode} ${session}${version > 1 ? ` v${version}` : ''}`

// The key a paper is routed under: "20232024" for the original, "20232024-v2"...
export const yearKeyOf = ({ session, version }) =>
  `${sessionKey(session)}${version > 1 ? `-v${version}` : ''}`
