// Imports the original static papers into the database exactly once. A marker
// document records that it happened, so a paper deleted later in /delealone is
// never brought back by a restart.
//
// Runs as part of connecting (see app.js), before any request is served - so a
// paper uploaded on the very first request is numbered after the originals.

import { Meta, Paper } from './models.js'
import { seedPapers } from './seedPapers.js'
import { pqKey } from './lib/courses.js'
import { normalizeAllVersions } from './lib/papers.js'

let done = false

export async function ensureSeeded() {
  if (done) return

  const earlier = await Meta.findOneAndUpdate(
    { _id: 'seeded-original-papers' },
    { $setOnInsert: { at: new Date() } },
    { upsert: true, returnDocument: 'before' }
  )

  if (!earlier) {
    try {
      await Paper.insertMany(
        seedPapers.map(p => ({
          courseCode: p.code,
          courseKey: pqKey(p.code),
          session: p.session,
          version: 1,
          status: 'approved',
          // They are the owner's papers. The files start out as the static PDFs
          // in public/pastquestions; `npm run papers:cloud` moves them to Cloudinary.
          source: 'dele',
          uploaderName: 'Dele (owner)',
          files: [{
            url: `/pastquestions/${p.file}`,
            name: p.file,
            kind: 'document',
            format: 'pdf',
          }],
        }))
      )
      console.log(`[seed] imported ${seedPapers.length} original papers`)
    } catch (err) {
      // Let the next request try again rather than leaving the site paper-less.
      await Meta.deleteOne({ _id: 'seeded-original-papers' })
      throw err
    }
  }

  // Public versions are always 1, 2, 3... with no gaps.
  await normalizeAllVersions()

  done = true
}
