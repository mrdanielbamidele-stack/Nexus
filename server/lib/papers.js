// Creating, numbering and describing papers (shared by the public upload route
// and the /delealone routes).

import { Paper } from '../models.js'
import { fail } from './errors.js'
import { findCourse, pqKey, sessionKey, titleOf, yearKeyOf } from './courses.js'
import { MAX_BYTES, MAX_FILES, isOurFile } from './cloudinary.js'

// A version number only means something among the papers students can see.
// The first public paper for a course + session is v1 (shown with no suffix);
// others are v2, v3... Papers waiting for review or rejected have no version.
//
// Next version for a paper that is about to go public.
export async function nextVersion(courseKey, session) {
  const live = await Paper.countDocuments({ courseKey, session, status: 'approved' })
  return live + 1
}

// Keep the public versions of one course + session as 1, 2, 3... with no gaps
// (after a paper is approved, hidden, rejected or deleted).
export async function renumberVersions(courseKey, session) {
  const live = await Paper.find({ courseKey, session, status: 'approved' })
    .sort({ version: 1, createdAt: 1 })
    .select('version')

  const changes = live
    .map((paper, i) => ({ paper, version: i + 1 }))
    .filter(({ paper, version }) => paper.version !== version)

  if (changes.length) {
    await Paper.bulkWrite(changes.map(({ paper, version }) => ({
      updateOne: { filter: { _id: paper._id }, update: { $set: { version } } },
    })))
  }
}

// Once per start: fix any course + session whose public versions have gaps.
export async function normalizeAllVersions() {
  const live = await Paper.find({ status: 'approved' })
    .sort({ courseKey: 1, session: 1, version: 1, createdAt: 1 })
    .select('courseKey session version')

  const changes = []
  let group = ''
  let n = 0
  for (const paper of live) {
    const key = `${paper.courseKey}|${paper.session}`
    n = key === group ? n + 1 : 1
    group = key
    if (paper.version !== n) changes.push({ updateOne: { filter: { _id: paper._id }, update: { $set: { version: n } } } })
  }
  if (changes.length) await Paper.bulkWrite(changes)
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
  // Only a public paper has a version; anything else is just "PHY 101 2023/2024".
  const shown = { ...doc, version: doc.status === 'approved' ? doc.version : 1 }
  return {
    id: String(doc._id),
    title: titleOf(shown),
    courseCode: doc.courseCode,
    courseKey: doc.courseKey,
    session: doc.session,
    version: shown.version,
    yearKey: yearKeyOf(shown),
    status: doc.status,
    source: doc.source,
    createdAt: doc.createdAt,
    reviewedAt: doc.reviewedAt || null,
    uploader: {
      signedIn: Boolean(doc.uploaderId),
      // No account behind it: a named guest is "Name (Uploader)", a mysterious
      // one (or an erased account) is just "Uploader".
      label: doc.uploaderId
        ? `${doc.uploaderName || doc.uploaderEmail || 'A user'} (${doc.uploaderRole || 'user'})`
        : doc.source === 'dele' || doc.source === 'seed'
          ? 'Dele (owner)'
          : doc.uploaderName ? `${doc.uploaderName} (Uploader)` : 'Uploader',
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

// A list of papers, each told how many public versions its course + session has
// (so the owner's page knows whether to offer a version choice).
export async function describePapers(papers) {
  const counts = await Paper.aggregate([
    { $match: { status: 'approved' } },
    { $group: { _id: { course: '$courseKey', session: '$session' }, n: { $sum: 1 } } },
  ])
  const publicCount = new Map(counts.map(c => [`${c._id.course}|${c._id.session}`, c.n]))

  return papers.map(paper => ({
    ...describePaper(paper),
    publicVersions: publicCount.get(`${paper.courseKey}|${paper.session}`) || 0,
  }))
}
