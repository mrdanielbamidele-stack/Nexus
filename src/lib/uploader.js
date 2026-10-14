// Who a signed-out visitor says they are on /upload: a name, or "stay
// mysterious" (no name). Remembered on this device so they aren't asked again
// for the next paper, and so the owner's usage numbers can show "Name
// (Uploader)" or just "Uploader". Signed-in people never use this.

const KEY = 'nexus_uploader'

export function getUploader() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY))
    return { name: String(saved?.name || ''), mysterious: Boolean(saved?.mysterious) }
  } catch {
    return { name: '', mysterious: false }
  }
}

export function setUploader(next) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ name: next.name, mysterious: next.mysterious }))
  } catch {
    /* storage unavailable: they just get asked again next time */
  }
}

// The name to send along (empty when mysterious or not chosen).
export const uploaderName = () => getUploader().name.trim()
