// Cloudinary: files go from the browser straight to Cloudinary (a Netlify
// Function can't take a large upload). The server only SIGNS each upload, so
// nobody can send files to our account without asking us first.

import crypto from 'node:crypto'
import { v2 as cloudinary } from 'cloudinary'
import { need } from './env.js'

const FOLDER = 'nexus/papers'

function configure() {
  cloudinary.config({
    cloud_name: need('CLOUDINARY_CLOUD_NAME', 'Uploading'),
    api_key: need('CLOUDINARY_API_KEY', 'Uploading'),
    api_secret: need('CLOUDINARY_API_SECRET', 'Uploading'),
    secure: true,
  })
  return cloudinary
}

export const DOC_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt']
export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif']
export const MAX_FILES = 45
export const MAX_BYTES = 30 * 1024 * 1024

export const extOf = name => (String(name).split('.').pop() || '').toLowerCase()

const safeName = name => String(name).replace(/[^a-z0-9._-]+/gi, '_').slice(-60)

// One signed upload ticket per file. The browser posts to
// https://api.cloudinary.com/v1_1/<cloudName>/auto/upload with these fields.
export function signUploads(files) {
  const lib = configure()
  const secret = need('CLOUDINARY_API_SECRET', 'Uploading')
  const batch = crypto.randomUUID()
  const timestamp = Math.floor(Date.now() / 1000)

  const tickets = files.map((file, i) => {
    const ext = extOf(file.name)
    const isPage = file.kind === 'page'
    const stem = isPage
      ? `page-${String(i + 1).padStart(2, '0')}`
      : `doc-${i + 1}-${safeName(file.name).replace(/\.[^.]+$/, '')}`

    // Raw files (Word, Excel...) keep their extension so viewers can open them;
    // images and PDFs get theirs from Cloudinary.
    const keepExt = !isPage && ext !== 'pdf'
    const publicId = `${FOLDER}/${batch}/${stem}${keepExt ? `.${ext}` : ''}`

    const params = { public_id: publicId, timestamp }
    return { publicId, timestamp, signature: lib.utils.api_sign_request(params, secret) }
  })

  return {
    cloudName: need('CLOUDINARY_CLOUD_NAME', 'Uploading'),
    apiKey: need('CLOUDINARY_API_KEY', 'Uploading'),
    tickets,
  }
}

// A submitted file must really be one of ours.
export function isOurFile({ url, publicId }) {
  const cloud = need('CLOUDINARY_CLOUD_NAME', 'Uploading')
  return (
    typeof url === 'string' &&
    url.startsWith(`https://res.cloudinary.com/${cloud}/`) &&
    typeof publicId === 'string' &&
    publicId.startsWith(`${FOLDER}/`)
  )
}

// Best effort: a file that can't be removed shouldn't block deleting the paper.
export async function destroyFiles(files) {
  try {
    const lib = configure()
    await Promise.allSettled(
      files
        .filter(f => f.publicId)
        .map(f => lib.uploader.destroy(f.publicId, {
          resource_type: f.resourceType === 'raw' ? 'raw' : 'image',
          invalidate: true,
        }))
    )
  } catch (err) {
    console.error('[cloudinary] cleanup skipped:', err.message)
  }
}
