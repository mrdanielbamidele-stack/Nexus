import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import UiIcon from './UiIcon'
import { Skeleton } from './Skeleton'

const ERRORS = {
  denied: {
    title: 'Camera access is blocked',
    text: 'Allow camera access for this site in your browser settings, then try again.',
  },
  none: {
    title: 'No camera found',
    text: "We couldn't find a camera on this device.",
  },
  failed: {
    title: "Couldn't start the camera",
    text: 'Another app may be using it. Close it and try again.',
  },
}

// Full-screen live camera for snapping a paper page by page.
//
// The parent owns the pages. Every shot goes up through onShot(blob); while
// `retakingId` is set the next shot replaces that page instead of adding a new
// one. The strip along the bottom shows what's been taken so far, so a blurry
// shot can be retaken (or dropped) right there without leaving the camera.
export default function CameraCapture({
  pages,
  retakingId,
  onShot,
  onRetake,
  onDelete,
  onClose,
  onUseNative,
}) {
  const videoRef = useRef(null)
  const stripRef = useRef(null)
  const [facing, setFacing] = useState('environment')
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)
  const [hasMultiple, setHasMultiple] = useState(false)
  const [flash, setFlash] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let stream
    let cancelled = false
    setReady(false)
    setError(null)

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('failed')
        return
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing }, width: { ideal: 2560 }, height: { ideal: 1440 } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop())
          return
        }
        const video = videoRef.current
        video.srcObject = stream
        await video.play().catch(() => {})
        setReady(true)

        const devices = await navigator.mediaDevices.enumerateDevices()
        if (!cancelled) setHasMultiple(devices.filter(d => d.kind === 'videoinput').length > 1)
      } catch (err) {
        if (cancelled) return
        setError(err.name === 'NotAllowedError' ? 'denied' : err.name === 'NotFoundError' ? 'none' : 'failed')
      }
    }

    start()
    return () => {
      cancelled = true
      stream?.getTracks().forEach(t => t.stop())
    }
  }, [facing])

  // Lock the page behind the camera and let Escape close it.
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  // Keep the newest shot in view.
  useEffect(() => {
    const strip = stripRef.current
    if (strip) strip.scrollLeft = strip.scrollWidth
  }, [pages.length])

  async function snap() {
    const video = videoRef.current
    if (!ready || busy || !video?.videoWidth) return
    setBusy(true)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d').drawImage(video, 0, 0)
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92))
      setFlash(true)
      setTimeout(() => setFlash(false), 140)
      if (blob) await onShot(blob)
    } finally {
      setBusy(false)
    }
  }

  const retakingIndex = pages.findIndex(p => p.id === retakingId)
  const last = pages[pages.length - 1]
  const title = retakingIndex >= 0 ? `Retaking page ${retakingIndex + 1}` : `Page ${pages.length + 1}`

  return createPortal(
    <div className="up-cam" role="dialog" aria-modal="true" aria-label="Camera">
      <div className="up-cam-top">
        <button type="button" className="up-cam-icon" onClick={onClose} aria-label="Close camera">
          <UiIcon name="x" size={20} />
        </button>
        <span className="up-cam-title">{title}</span>
        {hasMultiple ? (
          <button
            type="button"
            className="up-cam-icon"
            onClick={() => setFacing(f => (f === 'environment' ? 'user' : 'environment'))}
            aria-label="Switch camera"
          >
            <UiIcon name="flip" size={20} />
          </button>
        ) : (
          <span className="up-cam-icon spacer" />
        )}
      </div>

      <div className="up-cam-view">
        <video
          ref={videoRef}
          playsInline
          muted
          className={facing === 'user' ? 'mirror' : ''}
        />
        {flash && <div className="up-cam-flash" />}
        {!ready && !error && (
          <div className="up-cam-status loading" role="status" aria-live="polite">
            <Skeleton dark width="100%" height="100%" radius={0} />
            <span className="sk-sr">Starting camera</span>
          </div>
        )}

        {error && (
          <div className="up-cam-status error">
            <UiIcon name="camera" size={36} />
            <strong>{ERRORS[error].title}</strong>
            <p>{ERRORS[error].text}</p>
            <button type="button" className="up-btn primary" onClick={onUseNative}>
              Use my phone's camera app
            </button>
            <button type="button" className="up-btn" onClick={onClose}>Close</button>
          </div>
        )}
      </div>

      {retakingIndex >= 0 && (
        <div className="up-cam-banner">
          Replacing page {retakingIndex + 1}
          <button type="button" onClick={() => onRetake(null)}>Cancel</button>
        </div>
      )}

      <div className="up-cam-bottom">
        {pages.length > 0 && (
          <ul className="up-cam-strip" ref={stripRef}>
            {pages.map((page, i) => (
              <li key={page.id} className={page.id === retakingId ? 'retaking' : ''}>
                <img src={page.url} alt={`Page ${i + 1}`} draggable={false} />
                <span className="up-cam-n">{i + 1}</span>
                <button type="button" onClick={() => onRetake(page.id)} aria-label={`Retake page ${i + 1}`}>
                  <UiIcon name="undo" size={14} />
                </button>
                <button type="button" onClick={() => onDelete(page.id)} aria-label={`Delete page ${i + 1}`}>
                  <UiIcon name="trash" size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="up-cam-controls">
          <button type="button" className="up-cam-done" onClick={onClose}>
            {pages.length > 0 ? `Done (${pages.length})` : 'Cancel'}
          </button>

          <button
            type="button"
            className="up-cam-shutter"
            onClick={snap}
            disabled={!ready || busy}
            aria-label="Take photo"
          />

          <button
            type="button"
            className="up-cam-done secondary"
            onClick={() => last && onRetake(last.id)}
            disabled={!last}
          >
            <UiIcon name="undo" size={14} /> Retake last
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
