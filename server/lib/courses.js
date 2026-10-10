// Server-side view of the course catalogue (the same data file the browser uses).

import { courseCatalog } from '../../src/data/courseCatalog.js'
import { pqKey } from '../../src/lib/courseSlug.js'

export { pqKey, courseCatalog }

let index = null

// pqKey -> { code, title } for every course in the catalogue.
function courseIndex() {
  if (index) return index
  index = new Map()
  for (const levels of Object.values(courseCatalog)) {
    for (const list of Object.values(levels)) {
      for (const course of list) {
        const key = pqKey(course.code)
        if (!index.has(key)) index.set(key, { code: course.code, title: course.title })
      }
    }
  }
  return index
}

export const findCourse = codeOrKey => courseIndex().get(pqKey(codeOrKey)) || null

export const hasCourse = code => courseIndex().has(pqKey(code))

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
