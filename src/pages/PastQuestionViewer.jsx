import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate } from 'react-router'
import BackLink from '../components/BackLink'
import LynklensAd from '../components/LynklensAd'
import PdfReader from '../components/PdfReader'
import { ReaderSkeleton } from '../components/Skeleton'
import { getCoursePQ, getPaper, formatYear, usePapers, usePapersReady } from '../lib/pastQuestions'
import { formatCode } from '../lib/courseSlug'
import { usePqBase } from '../lib/pqBase'
import { track } from '../lib/track'
import { getReading, saveReading } from '../lib/readingProgress'
import { useReadingTimer } from '../lib/useReadingTimer'
import NotFound from './NotFound'
import './PastQuestions.css'

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|heic|heif)$/i
const OFFICE_EXT = /\.(docx?|rtf|pptx?|xlsx?)$/i

// A paper can be several files: photo pages and/or documents. Photo pages are
// read together as one scrolling view; every document gets its own view.
function viewsOf(paper) {
  const files = paper.files?.length ? paper.files : [{ url: paper.fileUrl, kind: 'document' }]
  const isImage = f => f.kind === 'page' || IMAGE_EXT.test(f.url) || IMAGE_EXT.test(`.${f.format || ''}`)
  const isOffice = f => OFFICE_EXT.test(f.url) || OFFICE_EXT.test(`.${f.format || ''}`)

  const views = []
  const photos = files.filter(isImage)
  if (photos.length) views.push({ kind: 'image', label: photos.length > 1 ? `Photos (${photos.length})` : 'Photo', urls: photos.map(f => f.url) })

  for (const file of files.filter(f => !isImage(f))) {
    views.push({ kind: isOffice(file) ? 'word' : 'pdf', label: file.name || 'Document', urls: [file.url] })
  }
  return views
}

const ZOOM_STEPS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3]
// Wide desktop screens open zoomed out a little (75%) so a page reads
// comfortably; phones, tablets and narrower laptops (where the sidebar takes a
// good share of the width) already fit the page well, so they stay at 100%.
const defaultZoomIndex = () => ZOOM_STEPS.indexOf(window.innerWidth >= 1200 ? 0.75 : 1)

// A page only counts as read once it has stayed on screen this long, so
// flicking through to the end doesn't mark the paper as finished.
const PAGE_DWELL_MS = 2000

// The floating controls fade away after this long so the paper fills the screen.
const CONTROLS_HIDE_MS = 3000

// Full-screen, read-only reader for one paper (PDF, image or Word file). The
// paper fills the whole screen like it is the page; the controls float above it.
function Reader({ courseCode, year, courseLabel, session, paper }) {
  const navigate = useNavigate()
  const { papers: base } = usePqBase()
  const views = useMemo(() => viewsOf(paper), [paper])
  const [viewIndex, setViewIndex] = useState(0)
  const view = views[viewIndex] || views[0]
  const url = view.urls[0]
  const kind = view.kind

  const [zoomIndex, setZoomIndex] = useState(defaultZoomIndex)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [controlsShown, setControlsShown] = useState(true)
  const [startPage] = useState(() => getReading(courseCode, year).page)

  const rootRef = useRef(null)
  const hovering = useRef(false)
  const hideTimer = useRef(0)
  const dwellTimer = useRef(0)
  const latestPage = useRef(null)

  // Word files sit in an iframe that swallows mouse/scroll events, so the
  // controls can't be brought back once hidden - keep them up for those.
  const pinned = kind === 'word'

  useReadingTimer(courseCode, year, kind !== 'word', paper.id)

  // Counts as one "open" each time the paper is shown.
  useEffect(() => {
    if (paper.id) track('open', { paperId: paper.id })
  }, [paper.id])

  // Remember the page for resuming right away, but only credit it as read
  // (maxPage) once the student has actually lingered on it.
  const onPage = useCallback((current, pages) => {
    setPage(current)
    setTotal(pages)
    latestPage.current = { page: current, totalPages: pages }

    clearTimeout(dwellTimer.current)
    dwellTimer.current = setTimeout(() => {
      const saved = getReading(courseCode, year)
      saveReading(courseCode, year, {
        page: current,
        totalPages: pages,
        maxPage: Math.max(saved.maxPage, current),
      })
    }, PAGE_DWELL_MS)
  }, [courseCode, year])

  // Leaving: keep the spot to resume from, without crediting skimmed pages.
  useEffect(() => () => {
    clearTimeout(dwellTimer.current)
    if (latestPage.current) saveReading(courseCode, year, latestPage.current)
  }, [courseCode, year])

  const revealControls = useCallback(() => {
    setControlsShown(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      if (!hovering.current) setControlsShown(false)
    }, CONTROLS_HIDE_MS)
  }, [])

  // Controls: shown on mouse move / tap / scroll up, hidden on scroll down or
  // after a few idle seconds.
  useEffect(() => {
    if (pinned) return
    const root = rootRef.current
    let lastTop = 0

    const onMove = e => { if (e.pointerType === 'mouse') revealControls() }
    const onScroll = e => {
      const top = e.target.scrollTop
      if (typeof top !== 'number') return
      if (top > lastTop + 4) {
        clearTimeout(hideTimer.current)
        setControlsShown(false)
      } else if (top < lastTop - 4) {
        revealControls()
      }
      lastTop = top
    }
    const onKey = e => {
      if (e.key === 'Escape') navigate(`${base}/${courseCode}`)
      else revealControls()
    }

    revealControls()
    root.addEventListener('pointermove', onMove)
    root.addEventListener('click', revealControls)
    root.addEventListener('scroll', onScroll, { capture: true, passive: true })
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(hideTimer.current)
      root.removeEventListener('pointermove', onMove)
      root.removeEventListener('click', revealControls)
      root.removeEventListener('scroll', onScroll, { capture: true })
      window.removeEventListener('keydown', onKey)
    }
  }, [pinned, revealControls, navigate, courseCode, base])

  // The reader is its own scroll surface - lock the page behind it.
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [])

  const shown = pinned || controlsShown
  const zoom = ZOOM_STEPS[zoomIndex]
  const officeSrc = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(new URL(url, window.location.origin).href)}`
  const label = `${courseLabel} ${session} Past Questions`

  return createPortal(
    <div ref={rootRef} className="pq-reader">
      {kind === 'pdf' && (
        <>
          <PdfReader url={url} zoom={zoom} startPage={startPage} onPage={onPage} footer={<LynklensAd variant="footer" />} />
          <div
            className="pq-reader-progress"
            style={{ width: total > 1 ? `${(page / total) * 100}%` : 0 }}
          />
        </>
      )}

      {kind === 'image' && (
        <div className="pq-reader-scroll">
          <div className="pq-reader-pages" style={{ padding: '72px 8px 40px' }}>
            {view.urls.map((src, i) => (
              <img
                key={src}
                className="pq-reader-img"
                src={src}
                alt={view.urls.length > 1 ? `${label} - page ${i + 1}` : label}
              />
            ))}
          </div>
        </div>
      )}

      {kind === 'word' && <iframe className="pq-reader-frame" src={officeSrc} title={label} />}

      {/* Floating controls - hover above the paper */}
      <div
        className={`pq-reader-float${shown ? '' : ' hidden'}`}
        onPointerEnter={() => { hovering.current = true }}
        onPointerLeave={() => { hovering.current = false; revealControls() }}
      >
        <div className="pq-reader-pill pq-reader-back-pill">
          <BackLink to={`${base}/${courseCode}`}>Back to {courseLabel}</BackLink>
        </div>

        {views.length > 1 && (
          <div className="pq-reader-pill pq-reader-tools">
            {views.map((v, i) => (
              <button
                key={`${v.label}-${i}`}
                type="button"
                aria-pressed={i === viewIndex}
                style={{ fontWeight: i === viewIndex ? 800 : 500, width: 'auto', padding: '0 10px' }}
                onClick={() => { setViewIndex(i); setPage(0); setTotal(0) }}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}

        {kind === 'pdf' && (
          <div className="pq-reader-pill pq-reader-tools">
            {total > 0 && <span className="pq-reader-page-count">{page} / {total}</span>}
            <button
              type="button"
              aria-label="Zoom out"
              disabled={zoomIndex === 0}
              onClick={() => setZoomIndex(i => i - 1)}
            >
              <i className="fa-solid fa-minus" />
            </button>
            <span className="pq-reader-zoom">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              aria-label="Zoom in"
              disabled={zoomIndex === ZOOM_STEPS.length - 1}
              onClick={() => setZoomIndex(i => i + 1)}
            >
              <i className="fa-solid fa-plus" />
            </button>
          </div>
        )}
      </div>

      <p className={`pq-reader-pill pq-reader-note${shown ? '' : ' hidden'}`}>
        <span className="pq-reader-note-lead">Can't see the paper?</span>{' '}
        <a href={url} target="_blank" rel="noreferrer">Open it in a new tab</a>
        {' '}or{' '}
        <a href={url} download onClick={() => track('download', { paperId: paper.id })}>download it</a>
      </p>
    </div>,
    document.body
  )
}

export default function PastQuestionViewer() {
  const { courseCode, year } = useParams()
  const { papers: base } = usePqBase()
  usePapers() // re-render when the paper list refreshes
  const ready = usePapersReady()

  const course = getCoursePQ(courseCode)
  const paper = getPaper(courseCode, year)
  const courseLabel = formatCode(course?.code || courseCode)
  const session = paper?.session || formatYear(year)
  const title = `${courseLabel} ${session} Past Questions`

  useEffect(() => {
    document.title = title
  }, [title])

  // The paper list is still on its way: show the reader's shape, not a 404.
  if (!paper && !ready) {
    return (
      <div className="pq-reader">
        <div className="pq-reader-scroll">
          <div className="sk-reader-back">
            <BackLink to={base}>Back</BackLink>
          </div>
          <ReaderSkeleton label={`Loading ${courseLabel} past questions`} />
        </div>
      </div>
    )
  }

  if (!paper) {
    return (
      <NotFound
        title="404 - Paper not found"
        message={`We couldn't find that ${courseLabel || 'course'} past question paper.`}
        homeTo={base}
        homeLabel="Browse past questions"
      />
    )
  }

  return (
    <Reader
      courseCode={courseCode}
      year={year}
      courseLabel={courseLabel}
      session={session}
      paper={paper}
    />
  )
}
