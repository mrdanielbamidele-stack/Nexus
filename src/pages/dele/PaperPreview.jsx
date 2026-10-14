import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import PdfReader from '../../components/PdfReader'
import UiIcon from '../../components/UiIcon'
import '../PastQuestions.css'

// The same reading experience students get (PDF.js pages with a few small
// floating controls), shrunk into a card with a maximize button. Works for
// PDFs, photo pages and Word / PowerPoint / Excel files.

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2]
const FIT = ZOOM_STEPS.indexOf(1)

const IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif']
const OFFICE_EXT = /\.(docx?|rtf|pptx?|xlsx?)($|\?)/i

const isImage = file => file.kind === 'page' || IMAGE_FORMATS.includes((file.format || '').toLowerCase())
const isOffice = file => OFFICE_EXT.test(file.url || '') || OFFICE_EXT.test(`.${file.format || ''}`)

// Photo pages are read together as one scrolling view; every document is its own view.
function viewsOf(files) {
  const views = []
  const photos = files.filter(isImage).sort((a, b) => (a.page || 0) - (b.page || 0))
  if (photos.length) {
    views.push({ kind: 'image', label: photos.length > 1 ? `Photos (${photos.length})` : 'Photo', urls: photos.map(f => f.url) })
  }
  for (const file of files.filter(f => !isImage(f))) {
    views.push({ kind: isOffice(file) ? 'word' : 'pdf', label: file.name || 'Document', urls: [file.url] })
  }
  return views
}

const officeSrc = url =>
  `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(new URL(url, window.location.origin).href)}`

function Body({ view, zoom, onPage, topPadding, label }) {
  if (view.kind === 'pdf') {
    return <PdfReader url={view.urls[0]} zoom={zoom} startPage={1} onPage={onPage} topPadding={topPadding} />
  }

  if (view.kind === 'image') {
    return (
      <div className="pq-reader-scroll">
        <div className="pq-reader-pages is-photos" style={{ padding: `${topPadding}px 8px 24px` }}>
          {view.urls.map((src, i) => (
            <img key={src} className="pq-reader-img" src={src} alt={`${label} - page ${i + 1}`} loading="lazy" />
          ))}
        </div>
      </div>
    )
  }

  // Word & friends: Office's own viewer, sat below the floating controls.
  return (
    <iframe
      className="pq-reader-frame"
      src={officeSrc(view.urls[0])}
      title={label}
      style={{ top: topPadding, height: `calc(100% - ${topPadding}px)` }}
    />
  )
}

// `files` are a paper's files as the owner API describes them. `compact` drops
// the file name and zoom percentage so the controls fit a narrow card.
export default function PaperPreview({ files, label = 'Paper', height = 360, compact = false }) {
  const views = viewsOf(files || [])
  const [viewIndex, setViewIndex] = useState(0)
  const [zoomIndex, setZoomIndex] = useState(FIT)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [maximized, setMaximized] = useState(false)
  const [near, setNear] = useState(false)
  const holder = useRef(null)

  const view = views[viewIndex] || views[0]
  const zoom = ZOOM_STEPS[zoomIndex]

  // A long page of previews only draws the ones you're near.
  useEffect(() => {
    const el = holder.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setNear(entry.isIntersecting),
      { root: el.closest('.main'), rootMargin: '700px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!maximized) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = e => { if (e.key === 'Escape') setMaximized(false) }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [maximized])

  const onPage = useCallback((current, pages) => {
    setPage(current)
    setTotal(pages)
  }, [])

  function chooseView(index) {
    setViewIndex(index)
    setPage(0)
    setTotal(0)
  }

  if (!view) return <p className="dl-empty small">This paper has no files.</p>

  const controls = full => {
    const small = compact && !full
    const showName = !small && views.length === 1
    return (
      <div className="pq-reader-float">
        {full || views.length > 1 || showName ? (
          <div className="pq-reader-pill pq-reader-tools dl-pv-left">
            {full && <strong className="dl-pv-name">{label}</strong>}
            {views.length > 1
              ? views.map((v, i) => (
                <button
                  key={`${v.label}-${i}`}
                  type="button"
                  className="dl-pv-tab"
                  aria-pressed={i === viewIndex}
                  onClick={() => chooseView(i)}
                >
                  {v.label}
                </button>
              ))
              : !full && <span className="dl-pv-name">{view.label}</span>}
          </div>
        ) : <span />}

        <div className="pq-reader-pill pq-reader-tools">
          {view.kind === 'pdf' && total > 0 && (
            <span className="pq-reader-page-count">
              {full ? `${page} / ${total}` : `${total} ${total === 1 ? 'page' : 'pages'}`}
            </span>
          )}
          {/* Zoom is for the maximized view; the small preview just shows the first page. */}
          {full && view.kind === 'pdf' && (
            <>
              <button type="button" aria-label="Zoom out" disabled={zoomIndex === 0} onClick={() => setZoomIndex(i => i - 1)}>
                <UiIcon name="minus" size={15} />
              </button>
              <span className="pq-reader-zoom">{Math.round(zoom * 100)}%</span>
              <button type="button" aria-label="Zoom in" disabled={zoomIndex === ZOOM_STEPS.length - 1} onClick={() => setZoomIndex(i => i + 1)}>
                <UiIcon name="plus" size={15} />
              </button>
            </>
          )}
          {view.kind !== 'image' && !small && (
            <a className="dl-pv-open" href={view.urls[0]} target="_blank" rel="noreferrer">Open</a>
          )}
          <button
            type="button"
            aria-label={full ? 'Close full view' : 'Maximize'}
            title={full ? 'Close (Esc)' : 'Maximize'}
            onClick={() => setMaximized(!full)}
          >
            <UiIcon name={full ? 'shrink' : 'expand'} size={15} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div ref={holder} className="dl-pv-stage" style={{ '--pv-h': `${height}px` }}>
        {!maximized && near && (
          <Body view={view} zoom={1} onPage={onPage} topPadding={compact ? 52 : 56} label={label} />
        )}
        {maximized ? <p className="dl-pv-hold">Open in full view</p> : (
          <>
            {/* Covers the page: nothing inside scrolls, a click enlarges it. */}
            <button type="button" className="dl-pv-hit" aria-label={`Enlarge ${label}`} onClick={() => setMaximized(true)} />
            {controls(false)}
          </>
        )}
      </div>

      {maximized && createPortal(
        <div className="dl-pv-max" role="dialog" aria-modal="true" aria-label={label}>
          <div className="dl-pv-stage full">
            <Body view={view} zoom={zoom} onPage={onPage} topPadding={64} label={label} />
            {controls(true)}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
