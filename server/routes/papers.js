// Past question papers, as students see them.
//
//   GET  /api/papers        every approved paper, grouped by course
//   POST /api/papers/sign   signed Cloudinary upload tickets (open to everyone)
//   POST /api/papers        record a finished upload (it waits for approval)

import { Router } from 'express'
import { Paper } from '../models.js'
import { fail, wrap } from '../lib/errors.js'
import { clientIp, whoIsThis } from '../lib/session.js'
import { limit } from '../lib/throttle.js'
import { findCourse, titleOf, yearKeyOf } from '../lib/courses.js'
import {
  DOC_EXTENSIONS, IMAGE_EXTENSIONS, MAX_FILES, extOf, signUploads,
} from '../lib/cloudinary.js'
import { nextVersion, parseSubmission } from '../lib/papers.js'

const router = Router()

// The file a reader opens first: a document if there is one, else page 1.
function primaryFile(files) {
  return files.find(f => f.kind === 'document') || files[0]
}

router.get('/', wrap(async (req, res) => {
  const papers = await Paper.find({ status: 'approved' }).sort({ session: -1, version: 1 })
  const courses = {}

  for (const paper of papers) {
    const main = primaryFile(paper.files)
    if (!main) continue

    const known = findCourse(paper.courseCode)
    const entry = (courses[paper.courseKey] ||= {
      code: paper.courseCode,
      title: known?.title || '',
      years: {},
    })

    entry.years[yearKeyOf(paper)] = {
      id: String(paper._id),
      session: paper.session,
      version: paper.version,
      title: titleOf(paper),
      fileUrl: main.url,
      files: paper.files.map(f => ({
        url: f.url, name: f.name, kind: f.kind, format: f.format, page: f.page || null,
      })),
    }
  }

  res.json({ courses })
}))

router.post('/sign', wrap(async (req, res) => {
  await limit(`sign:${clientIp(req)}`, { max: 40, windowSec: 3600, what: 'uploads' })

  const files = Array.isArray(req.body?.files) ? req.body.files : []
  if (!files.length) throw fail(400, 'NO_FILES', 'Add at least one page or document before sending.')
  if (files.length > MAX_FILES) {
    throw fail(400, 'TOO_MANY_FILES', `A paper can have up to ${MAX_FILES} files. Remove a few and try again.`)
  }

  for (const file of files) {
    const ext = extOf(file?.name)
    const allowed = file?.kind === 'page' ? IMAGE_EXTENSIONS : DOC_EXTENSIONS
    if (!allowed.includes(ext)) {
      throw fail(
        400,
        'BAD_FILE_TYPE',
        `"${file?.name || 'That file'}" isn't a type we accept. Use photos, PDF, Word, PowerPoint, Excel or text files.`
      )
    }
  }

  res.json(signUploads(files))
}))

router.post('/', wrap(async (req, res) => {
  await limit(`submit:${clientIp(req)}`, { max: 30, windowSec: 3600, what: 'uploads' })

  const fields = parseSubmission(req.body)
  const found = await whoIsThis(req, req.body?.as === 'admin' ? 'admin' : 'student')

  const paper = await Paper.create({
    ...fields,
    version: await nextVersion(fields.courseKey, fields.session),
    status: 'pending',
    source: found ? found.user.role : 'student',
    uploaderId: found?.user._id || null,
    uploaderRole: found?.user.role || null,
    uploaderName: found?.user.username || null,
    uploaderEmail: found?.user.email || null,
  })

  res.status(201).json({ id: String(paper._id), title: titleOf(paper), status: paper.status })
}))

export default router
