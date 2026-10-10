// Creating, numbering and describing papers (shared by the public upload route
// and the /delealone routes).

import { Paper } from '../models.js'
import { fail } from './errors.js'
import { findCourse, pqKey, sessionKey, titleOf, yearKeyOf } from './courses.js'
import { MAX_BYTES, MAX_FILES, isOurFile } from './cloudinary.js'

// Next free version number for this course + session. A rejected paper doesn't
// hold its number, so a re-upload after a rejection is still "v1".
export async function nextVersion(courseKey, session) {
  const latest = await Paper.findOne({ courseKey, session, status: { $ne: 'rejected' } })
    .sort({ version: -1 })
    .select('version')
  return (latest?.version || 0) + 1
}

// Validate what the browser says it uploaded and turn it into paper fields.
export function parseSubmission(body) {
  const course = findCourse(body?.courseCode)
  if (!course) {
    throw fail(400, 'BAD_COURSE', 'Choose the course from the list so we know which paper this is.')
  }

  const session = String(body?.session || '').trim()
  if (!sessionKey(session)) {
    throw fail(400, 'BAD_SESSION', 'Choose the year this paper is from, for example 2023/2024.')
  }

  const incoming = Array.isArray(body?.files) ? body.files : []
  if (!incoming.length) {
    throw fail(400, 'NO_FILES', 'Add at least one page or document before sending.')
  }
  if (incoming.length > MAX_FILES) {
    throw fail(400, 'TOO_MANY_FILES', `A paper can have up to ${MAX_FILES} files. Remove a few and try again.`)
  }

  const files = incoming.map(file => {
    if (!isOurFile(file)) {
      throw fail(400, 'BAD_FILE', "One of the files didn't upload properly. Please add the paper again and resend.")
    }
    if (Number(file.bytes) > MAX_BYTES) {
      throw fail(400, 'FILE_TOO_LARGE', `"${file.name || 'A file'}" is larger than 30 MB. Try a smaller copy.`)
    }
    return {
      url: file.url,
      publicId: file.publicId,
      resourceType: file.resourceType === 'raw' ? 'raw' : 'image',
      format: String(file.format || '').toLowerCase().slice(0, 10),
      bytes: Number(file.bytes) || 0,
      name: String(file.name || '').slice(0, 120),
      kind: file.kind === 'page' ? 'page' : 'document',
      page: file.kind === 'page' ? Number(file.page) || undefined : undefined,
    }
  })

  return { courseCode: course.code, courseKey: pqKey(course.code), session, files }
}

// What the browser is told about a paper.
export function describePaper(paper) {
  const doc = paper.toObject ? paper.toObject() : paper
  return {
    id: String(doc._id),
    title: titleOf(doc),
    courseCode: doc.courseCode,
    courseKey: doc.courseKey,
    session: doc.session,
    version: doc.version,
    yearKey: yearKeyOf(doc),
    status: doc.status,
    source: doc.source,
    createdAt: doc.createdAt,
    reviewedAt: doc.reviewedAt || null,
    uploader: {
      signedIn: Boolean(doc.uploaderId),
      label: doc.uploaderId
        ? `${doc.uploaderName || doc.uploaderEmail || 'A user'} (${doc.uploaderRole || 'user'})`
        : doc.source === 'seed' ? 'Original Nexus paper' : 'Not logged in',
      name: doc.uploaderName || null,
      email: doc.uploaderEmail || null,
      role: doc.uploaderRole || null,
    },
    files: (doc.files || []).map(f => ({
      url: f.url,
      name: f.name,
      kind: f.kind,
      format: f.format,
      bytes: f.bytes,
      page: f.page || null,
    })),
  }
}
