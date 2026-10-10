// Photo helpers for the upload page. Phone cameras produce 5-10 MB photos,
// so every photo is shrunk and re-encoded before it's shown or uploaded.

// Long edge of a stored page, in pixels - plenty to read small print on a paper.
const MAX_EDGE = 2200
const QUALITY = 0.85

function toJpeg(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('Could not encode the photo'))),
      'image/jpeg',
      QUALITY
    )
  })
}

// Decode a photo (honouring its EXIF rotation, so phone photos aren't sideways),
// shrink it to MAX_EDGE and re-encode as JPEG. Throws if the browser can't read it.
export async function prepareImage(source) {
  const bitmap = await createImageBitmap(source, { imageOrientation: 'from-image' })
  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)

    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff' // JPEG has no transparency - keep PNG scans from going black
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    return await toJpeg(canvas)
  } finally {
    bitmap.close()
  }
}

// Rotate a prepared photo a quarter turn clockwise.
export async function rotateImage(blob) {
  const bitmap = await createImageBitmap(blob)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.height
    canvas.height = bitmap.width

    const ctx = canvas.getContext('2d')
    ctx.translate(canvas.width, 0)
    ctx.rotate(Math.PI / 2)
    ctx.drawImage(bitmap, 0, 0)
    return await toJpeg(canvas)
  } finally {
    bitmap.close()
  }
}
