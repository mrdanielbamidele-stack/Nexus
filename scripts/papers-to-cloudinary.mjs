// Moves the original papers (the PDFs in public/pastquestions/) onto Cloudinary,
// points their records in the database at the new addresses, and labels them as
// sent by the owner - so every paper on Nexus comes from the same place.
//
//   node scripts/papers-to-cloudinary.mjs           shows what it would do
//   node scripts/papers-to-cloudinary.mjs --apply   does it
//
// Safe to run again: files already on Cloudinary are skipped. The PDFs in
// public/pastquestions/ are left where they are, so nothing is lost if a step
// fails. The Lynklens demo copy is not touched - the demo reads it locally.

import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mongoose from 'mongoose'
import { v2 as cloudinary } from 'cloudinary'
import { connectDb } from '../server/db.js'
import { Paper } from '../server/models.js'

const apply = process.argv.includes('--apply')
const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public')

const LOCAL = /^\/pastquestions\//
const FOLDER = 'nexus/papers/original'
const OWNER = 'Dele (owner)'

for (const name of ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'MONGODB_URI']) {
  if (!process.env[name]) {
    console.error(`${name} is missing from .env - add it and run this again.`)
    process.exit(1)
  }
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

// Cloudinary can refuse to deliver PDFs on some accounts (a security setting),
// so make sure the new address really serves the file before using it.
async function serves(url) {
  const res = await fetch(url, { method: 'HEAD' })
  return res.ok && /pdf|octet-stream/i.test(res.headers.get('content-type') || '')
}

async function main() {
  await connectDb()

  const papers = await Paper.find({ $or: [{ source: 'seed' }, { 'files.url': LOCAL }] }).sort({ courseKey: 1 })
  if (papers.length === 0) {
    console.log('Nothing to move - every paper is already on Cloudinary.')
    return
  }

  let moved = 0
  let failed = 0

  for (const paper of papers) {
    const label = `${paper.courseCode} ${paper.session}`

    for (const file of paper.files) {
      if (!LOCAL.test(file.url)) continue

      const localPath = path.join(publicDir, decodeURI(file.url))
      if (!fs.existsSync(localPath)) {
        console.error(`  ${label}: ${file.url} is not in public/ - skipped`)
        failed++
        continue
      }

      if (!apply) {
        console.log(`  would move ${label}: ${file.url} -> Cloudinary (${FOLDER}/)`)
        continue
      }

      try {
        const stem = path.basename(localPath, path.extname(localPath))
        const result = await cloudinary.uploader.upload(localPath, {
          public_id: `${FOLDER}/${stem}`,
          resource_type: 'auto',
          overwrite: true,
          invalidate: true,
        })

        if (!(await serves(result.secure_url))) {
          throw new Error('Cloudinary would not deliver the PDF. In Cloudinary: Settings > Security > turn on "PDF and ZIP files delivery".')
        }

        file.url = result.secure_url
        file.publicId = result.public_id
        file.resourceType = result.resource_type
        file.format = result.format || 'pdf'
        file.bytes = result.bytes
        console.log(`  moved ${label} -> ${result.secure_url}`)
        moved++
      } catch (err) {
        console.error(`  ${label}: not moved - ${err.message}`)
        failed++
      }
    }

    if (apply) {
      // Only papers whose files are all on Cloudinary now get relabelled.
      const done = paper.files.every(f => !LOCAL.test(f.url))
      if (done) {
        paper.source = 'dele'
        paper.uploaderName = OWNER
      }
      await paper.save()
    }
  }

  console.log(apply
    ? `\nDone: ${moved} moved, ${failed} not moved.`
    : `\nNothing changed yet. Run again with --apply to move ${papers.length} paper(s).`)
  if (failed) process.exitCode = 1
}

main()
  .catch(err => {
    console.error('Stopped:', err.message)
    process.exitCode = 1
  })
  .finally(() => mongoose.disconnect())
