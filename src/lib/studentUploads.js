// Uploading a paper: anyone can send one, and everything lands in a "pending"
// queue to be checked before it's published.
//
// Files go straight from the browser to Cloudinary using one-time signed
// tickets from our server (so a big upload never has to pass through the API),
// then the finished set is recorded with /api/papers. Photos are sent as
// ordered pages; documents are sent as they are.

import { api, ApiError } from './api'

export const MAX_DOC_BYTES = 10 * 1024 * 1024
export const MAX_DOCS = 5
export const MAX_PAGES = 40

export const DOC_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt']
export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif']

export const extOf = name => (name.split('.').pop() || '').toLowerCase()

// 'image' | 'doc' | null (not something we accept).
export function classifyFile(file) {
  const ext = extOf(file.name)
  if (file.type.startsWith('image/') || IMAGE_EXTENSIONS.includes(ext)) return 'image'
  if (DOC_EXTENSIONS.includes(ext)) return 'doc'
  return null
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// The sessions papers can be filed under, oldest first.
export const SESSIONS = ['2021/2022', '2022/2023', '2023/2024', '2024/2025', '2025/2026']

// crypto.randomUUID only exists on secure origins; testing on a phone over a
// plain-http LAN address is not one.
export function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map(x => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

// The files of one paper, in order: photo pages first, then documents.
export function buildFileList({ pages, docs }) {
  return [
    ...pages.map((blob, i) => ({
      blob,
      kind: 'page',
      page: i + 1,
      name: `page-${i + 1}.jpg`,
    })),
    ...docs.map(file => ({
      blob: file,
      kind: 'document',
      name: file.name,
    })),
  ]
}

async function putOnCloudinary(ticket, signing, file) {
  const form = new FormData()
  form.append('file', file.blob, file.name)
  form.append('api_key', signing.apiKey)
  form.append('timestamp', String(ticket.timestamp))
  form.append('public_id', ticket.publicId)
  form.append('signature', ticket.signature)

  let response
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${signing.cloudName}/auto/upload`, {
      method: 'POST',
      body: form,
    })
  } catch {
    throw new ApiError("Couldn't reach the upload service. Check your connection and try again.", { code: 'NETWORK' })
  }

  const result = await response.json().catch(() => null)
  if (!response.ok || !result?.secure_url) throw uploadError(result?.error?.message, response.status)
  return result
}

// Turn Cloudinary's wording into something a student can act on.
function uploadError(message = '', status = 0) {
  if (/too large|file size|exceeds/i.test(message) || status === 413) {
    return new ApiError(
      `One of the files is larger than the upload limit (${formatBytes(MAX_DOC_BYTES)}). Try a smaller copy or fewer pages.`,
      { code: 'TOO_LARGE' }
    )
  }
  if (/invalid image|not a valid|unsupported|format/i.test(message)) {
    return new ApiError("One of the files couldn't be read. Try a different copy of it - a PDF or a clear photo works best.", { code: 'BAD_FILE' })
  }
  if (/signature|timestamp|expired|stale/i.test(message)) {
    return new ApiError('The upload took too long and timed out. Please tap send again.', { code: 'EXPIRED' })
  }
  return new ApiError('Something went wrong while uploading. Please try again.', { code: 'UPLOAD_FAILED' })
}

// Upload every file, then record the submission. `attempt` ({ id, sent }) is
// kept by the caller across retries: files that already went up are skipped,
// so a dropped connection halfway through doesn't start over.
export async function submitUpload({
  attempt, courseCode, session, pages, docs, onProgress, as = 'student', recordPath = '/papers',
  uploaderName = '', // a signed-out visitor's name; empty = stays mysterious
}) {
  const files = buildFileList({ pages, docs })

  let done = files.filter((_, i) => attempt.sent[i]).length
  onProgress?.(done, files.length)

  if (!attempt.signing) {
    attempt.signing = await api('/papers/sign', {
      method: 'POST',
      body: { files: files.map(f => ({ name: f.name, kind: f.kind })) },
    })
  }

  for (let i = 0; i < files.length; i++) {
    if (attempt.sent[i]) continue
    const result = await putOnCloudinary(attempt.signing.tickets[i], attempt.signing, files[i])
    attempt.sent[i] = {
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      format: result.format || extOf(files[i].name),
      bytes: result.bytes,
      name: files[i].name,
      kind: files[i].kind,
      page: files[i].page,
    }
    onProgress?.(++done, files.length)
  }

  return api(recordPath, {
    method: 'POST',
    body: {
      courseCode,
      session,
      as,
      uploaderName,
      files: files.map((_, i) => attempt.sent[i]),
    },
  })
}
