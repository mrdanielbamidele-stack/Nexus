import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router'
import CameraCapture from '../components/CameraCapture'
import CourseCombobox from '../components/CourseCombobox'
import HeroBanner, { Twinkles } from '../components/HeroBanner'
import LynklensAd from '../components/LynklensAd'
import PdfReader from '../components/PdfReader'
import ScrollToTop from '../components/ScrollToTop'
import UiIcon from '../components/UiIcon'
import { isAuthed } from '../lib/studentAuth'
import { getAllCatalogCourses } from '../lib/studentCourses'
import { prepareImage, rotateImage } from '../lib/imageTools'
import {
  MAX_DOC_BYTES, MAX_DOCS, MAX_PAGES, DOC_EXTENSIONS, IMAGE_EXTENSIONS, SESSIONS,
  classifyFile, extOf, formatBytes, submitUpload, uuid,
} from '../lib/studentUploads'
import { useDele } from './dele/deleContext'
import './Upload.css'

const IMAGE_ACCEPT = IMAGE_EXTENSIONS.map(e => `.${e}`).join(',')
const DOC_ACCEPT = DOC_EXTENSIONS.map(e => `.${e}`).join(',')
const noop = () => {}

let nextId = 1
const newId = () => `u${nextId++}`

const pageItem = blob => ({ id: newId(), blob, url: URL.createObjectURL(blob) })

const SHAKE = [
  { transform: 'translateX(0)' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(6px)' },
  { transform: 'translateX(-4px)' }, { transform: 'translateX(3px)' }, { transform: 'translateX(0)' },
]

// What to tell the student when they try to send too early.
const HINTS = {
  course: 'Choose the course first - start typing its code or title and pick it from the list.',
  year: 'Which year is the paper from? Tap one of the years above.',
  files: 'Add the paper to send - take photos, choose photos or upload a document.',
}

const sendingMessage = ratio =>
  ratio < 0.34 ? 'Packing your paper…' : ratio < 0.8 ? 'Sending it over…' : 'Almost there…'

const CONFETTI_COLORS = ['#8b5cf6', '#c4b5fd', '#e9b872', '#7b97c2', '#8fb36f', '#e5636f']

/* ------------------------------ small pieces ------------------------------ */

const UPLOAD_SPOTS = [
  { x: 252, y: 66, size: 1.1, delay: 0 },
  { x: 50, y: 138, size: 0.95, delay: 1 },
  { x: 268, y: 118, size: 0.65, delay: 1.8 },
  { x: 38, y: 78, size: 0.65, delay: 2.4 },
]

function UploadArt() {
  return (
    <svg viewBox="0 0 300 220" width="100%">
      <ellipse cx="150" cy="200" rx="95" ry="8" fill="#d8cdf3" opacity="0.55" />
      <g transform="rotate(-9 130 110)">
        <rect x="68" y="34" width="110" height="146" rx="12" fill="#9a82e0" />
      </g>
      <g transform="rotate(5 150 110)">
        <rect x="92" y="26" width="112" height="152" rx="12" fill="#fff" stroke="#cdbdf2" strokeWidth="1.5" />
        <rect x="108" y="46" width="52" height="7" rx="3.5" fill="#6d4fc2" />
        <rect x="108" y="64" width="80" height="5" rx="2.5" fill="#ddd3f6" />
        <rect x="108" y="76" width="68" height="5" rx="2.5" fill="#ddd3f6" />
        <rect x="108" y="88" width="76" height="5" rx="2.5" fill="#ddd3f6" />
        <rect x="108" y="108" width="14" height="14" rx="4" fill="#efe8fd" stroke="#cdbdf2" />
        <rect x="128" y="108" width="14" height="14" rx="4" fill="#efe8fd" stroke="#cdbdf2" />
        <rect x="148" y="108" width="14" height="14" rx="4" fill="#b9a6ec" />
        <rect x="168" y="108" width="14" height="14" rx="4" fill="#efe8fd" stroke="#cdbdf2" />
      </g>
      <circle cx="214" cy="152" r="32" fill="#4c3a99" />
      <rect x="196" y="140" width="36" height="25" rx="6" fill="#fff" />
      <path d="M205 140l3-5h12l3 5z" fill="#fff" />
      <circle cx="214" cy="152" r="7.5" fill="#6d4fc2" />
      <circle cx="214" cy="152" r="3" fill="#cdbdf2" />
      <circle cx="84" cy="52" r="17" fill="#e9b872" />
      <path d="M84 60V44M77 50l7-7 7 7" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Twinkles spots={UPLOAD_SPOTS} />
    </svg>
  )
}

function CardHead({ tone, icon, title, sub }) {
  return (
    <div className="up-card-head">
      <span className={`up-chip up-tone-${tone}`}><UiIcon name={icon} size={22} /></span>
      <div>
        <h2 className="up-card-title">{title}</h2>
        <p className="up-card-sub">{sub}</p>
      </div>
    </div>
  )
}

function ActionTile({ tone, icon, title, desc, onClick, disabled }) {
  return (
    <button type="button" className="up-action" onClick={onClick} disabled={disabled}>
      <span className={`up-chip small up-tone-${tone}`}><UiIcon name={icon} size={20} /></span>
      <span className="up-action-text">
        <strong>{title}</strong>
        <span>{desc}</span>
      </span>
    </button>
  )
}

function Hint({ children }) {
  return (
    <p className="up-hint" role="alert">
      <UiIcon name="info" size={16} />
      <span>{children}</span>
    </p>
  )
}

function Confetti() {
  const [bits] = useState(() =>
    Array.from({ length: 36 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 1.9 + Math.random() * 1.5,
      drift: (Math.random() - 0.5) * 160,
      spin: 360 + Math.random() * 540,
      size: 6 + Math.random() * 6,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    }))
  )
  return (
    <div className="up-confetti" aria-hidden="true">
      {bits.map(b => (
        <i
          key={b.id}
          style={{
            left: `${b.left}%`, width: b.size, height: b.size * 1.6, background: b.color,
            animationDelay: `${b.delay}s`, animationDuration: `${b.duration}s`,
            '--drift': `${b.drift}px`, '--spin': `${b.spin}deg`,
          }}
        />
      ))}
    </div>
  )
}

// Big look at one page: confirm it's the right one, rotate it, retake it or drop it.
function PageLightbox({ pages, index, onIndex, onClose, onRotate, onRetake, onRemove }) {
  const page = pages[index]

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft' && index > 0) onIndex(index - 1)
      else if (e.key === 'ArrowRight' && index < pages.length - 1) onIndex(index + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, pages.length, onIndex, onClose])

  if (!page) return null

  return createPortal(
    <div className="up-lightbox" role="dialog" aria-modal="true" aria-label={`Page ${index + 1}`}>
      <div className="up-lightbox-top">
        <span>Page {index + 1} of {pages.length}</span>
        <button type="button" className="up-lightbox-done" onClick={onClose}>
          <UiIcon name="check" size={16} /> Looks good
        </button>
      </div>

      <div className="up-lightbox-stage">
        <button type="button" className="up-lightbox-nav prev" aria-label="Previous page" disabled={index === 0} onClick={() => onIndex(index - 1)}>
          <UiIcon name="left" size={20} />
        </button>
        <img src={page.url} alt={`Page ${index + 1}`} />
        <button type="button" className="up-lightbox-nav next" aria-label="Next page" disabled={index === pages.length - 1} onClick={() => onIndex(index + 1)}>
          <UiIcon name="right" size={20} />
        </button>
      </div>

      <div className="up-lightbox-bar">
        <button type="button" onClick={() => onRotate(page.id)}><UiIcon name="rotate" size={17} /> Rotate</button>
        <button type="button" onClick={() => onRetake(page.id)}><UiIcon name="camera" size={17} /> Retake</button>
        <button type="button" className="danger" onClick={() => onRemove(page.id)}><UiIcon name="trash" size={17} /> Remove</button>
      </div>
    </div>,
    document.body
  )
}

/* ---------------------------------- page ---------------------------------- */

// `variant="staff"` is the admin version (/admin/upload): same flow, but it asks
// for solved or properly typed papers rather than phone snaps.
// `variant="owner"` is /delealone/upload: same page again, but the paper goes
// live straight away (no review) and its title - "PHY 101 2023/2024", then
// "... v2" - is worked out for you.
export default function Upload({ variant = 'student' }) {
  const staff = variant === 'staff'
  const owner = variant === 'owner'
  const signedIn = staff || owner || isAuthed()
  const dele = useDele() // only set inside the owner area

  // Every course in the catalog, A to Z.
  const courseList = useMemo(getAllCatalogCourses, [])

  const [courseCode, setCourseCode] = useState('')
  const [session, setSession] = useState('')
  const [pages, setPages] = useState([])      // photos, in reading order
  const [docs, setDocs] = useState([])        // PDF / Word / etc.
  const [previewId, setPreviewId] = useState(null)
  const [notices, setNotices] = useState([])
  const [dragOver, setDragOver] = useState(false)
  const [camera, setCamera] = useState(null)  // null | { retakingId }
  const [lightbox, setLightbox] = useState(null) // page index
  const [dragId, setDragId] = useState(null)
  const [overId, setOverId] = useState(null)
  const [stage, setStage] = useState('form')  // 'form' | 'sending' | 'done'
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [error, setError] = useState('')
  const [hint, setHint] = useState(null)      // 'course' | 'year' | 'files' - what they missed
  const [nudge, setNudge] = useState(false)
  const [title, setTitle] = useState('')      // owner: what the paper will be called
  const [published, setPublished] = useState(null) // owner: the paper that just went live

  const courseInput = useRef(null)
  const courseField = useRef(null)
  const yearField = useRef(null)
  const addZone = useRef(null)
  const anyInput = useRef(null)
  const photoInput = useRef(null)
  const docInput = useRef(null)
  const nativeInput = useRef(null)
  const retakeTarget = useRef(null) // page being replaced by the native camera app
  const attempt = useRef(null)      // { id, sent } - lets a failed send resume
  const urls = useRef({ pages, docs })
  urls.current = { pages, docs }

  useEffect(() => {
    if (!owner) document.title = 'Upload · Nexus'
    // Free the in-memory previews when leaving the page.
    return () => {
      urls.current.pages.forEach(p => URL.revokeObjectURL(p.url))
      urls.current.docs.forEach(d => URL.revokeObjectURL(d.url))
    }
  }, [owner])

  // Any change to what's being sent starts a fresh submission.
  useEffect(() => { attempt.current = null }, [pages, docs, courseCode, session])

  // Owner: the title fills itself in as soon as the course and year are chosen
  // (and again after publishing, since the next version number moves on).
  useEffect(() => {
    if (!owner || !courseCode || !session) {
      setTitle('')
      return
    }
    let cancelled = false
    dele.call(`/next-version?course=${encodeURIComponent(courseCode)}&session=${encodeURIComponent(session)}`)
      .then(result => { if (!cancelled) setTitle(result.title) })
      .catch(() => { if (!cancelled) setTitle('') })
    return () => { cancelled = true }
  }, [owner, dele, courseCode, session, stage])

  // A file dropped just outside the drop zone shouldn't navigate the tab away.
  useEffect(() => {
    const stop = e => e.preventDefault()
    window.addEventListener('dragover', stop)
    window.addEventListener('drop', stop)
    return () => {
      window.removeEventListener('dragover', stop)
      window.removeEventListener('drop', stop)
    }
  }, [])

  const addPhotos = useCallback(async (sources, problems = []) => {
    const added = []
    for (const source of sources) {
      try {
        added.push(pageItem(await prepareImage(source)))
      } catch {
        problems.push(`We couldn't read "${source.name || 'that photo'}". Try a JPG or PNG.`)
      }
    }
    const room = Math.max(MAX_PAGES - urls.current.pages.length, 0)
    if (added.length > room) {
      problems.push(`A paper can have up to ${MAX_PAGES} pages - the extra photos were left out.`)
      added.slice(room).forEach(p => URL.revokeObjectURL(p.url))
    }
    setPages(prev => [...prev, ...added.slice(0, room)])
    setNotices(problems)
  }, [])

  const addFiles = useCallback(async fileList => {
    const problems = []
    const photos = []
    const documents = []

    for (const file of fileList) {
      const kind = classifyFile(file)
      if (!kind) problems.push(`"${file.name}" isn't a type we accept (photos, PDF, Word, PowerPoint, Excel or text).`)
      else if (kind === 'image') photos.push(file)
      else if (file.size > MAX_DOC_BYTES) problems.push(`"${file.name}" is over ${formatBytes(MAX_DOC_BYTES)}.`)
      else documents.push(file)
    }

    if (documents.length) {
      const items = documents.map(file => ({
        id: newId(), file, name: file.name, size: file.size,
        ext: extOf(file.name), url: URL.createObjectURL(file),
      }))
      const room = Math.max(MAX_DOCS - urls.current.docs.length, 0)
      if (items.length > room) {
        problems.push(`You can send up to ${MAX_DOCS} documents at once.`)
        items.slice(room).forEach(d => URL.revokeObjectURL(d.url))
      }
      const kept = items.slice(0, room)
      const firstPdf = kept.find(d => d.ext === 'pdf')
      if (firstPdf) setPreviewId(firstPdf.id)
      setDocs(prev => [...prev, ...kept])
    }

    if (photos.length) await addPhotos(photos, problems)
    else setNotices(problems)
  }, [addPhotos])

  // Paste a screenshot / copied image straight in.
  useEffect(() => {
    const onPaste = e => {
      const files = [...(e.clipboardData?.files || [])]
      if (files.length) addFiles(files)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [addFiles])

  function replacePage(id, blob) {
    setPages(prev => prev.map(p => {
      if (p.id !== id) return p
      URL.revokeObjectURL(p.url)
      return { ...p, blob, url: URL.createObjectURL(blob) }
    }))
  }

  function removePage(id) {
    setPages(prev => {
      const gone = prev.find(p => p.id === id)
      if (gone) URL.revokeObjectURL(gone.url)
      return prev.filter(p => p.id !== id)
    })
    setLightbox(null)
  }

  async function rotatePage(id) {
    const page = pages.find(p => p.id === id)
    if (page) replacePage(id, await rotateImage(page.blob))
  }

  function movePage(id, step) {
    setPages(prev => {
      const from = prev.findIndex(p => p.id === id)
      const to = from + step
      if (from < 0 || to < 0 || to >= prev.length) return prev
      const next = [...prev]
      next.splice(to, 0, next.splice(from, 1)[0])
      return next
    })
  }

  function dropOnPage(targetId) {
    const fromId = dragId
    setDragId(null)
    setOverId(null)
    if (!fromId || fromId === targetId) return
    setPages(prev => {
      const from = prev.findIndex(p => p.id === fromId)
      const to = prev.findIndex(p => p.id === targetId)
      if (from < 0 || to < 0) return prev
      const next = [...prev]
      next.splice(to, 0, next.splice(from, 1)[0])
      return next
    })
  }

  function removeDoc(id) {
    setDocs(prev => {
      const gone = prev.find(d => d.id === id)
      if (gone) URL.revokeObjectURL(gone.url)
      return prev.filter(d => d.id !== id)
    })
  }

  // The live camera needs a secure page (https or localhost). Elsewhere - e.g.
  // testing on a phone over plain http - fall back to the phone's own camera app.
  function openCamera(retakingId = null) {
    setLightbox(null)
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      openNativeCamera(retakingId)
      return
    }
    setCamera({ retakingId })
  }

  function openNativeCamera(retakingId = null) {
    retakeTarget.current = retakingId
    nativeInput.current.click()
  }

  async function onCameraShot(blob) {
    const photo = await prepareImage(blob)
    if (camera?.retakingId) {
      replacePage(camera.retakingId, photo)
      setCamera({ retakingId: null })
    } else {
      setPages(prev => (prev.length >= MAX_PAGES ? prev : [...prev, pageItem(photo)]))
    }
  }

  async function onNativeCapture(e) {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    setCamera(null)
    const target = retakeTarget.current
    retakeTarget.current = null
    if (target) {
      try { replacePage(target, await prepareImage(file)) } catch { setNotices(["We couldn't read that photo."]) }
    } else {
      await addPhotos([file])
    }
  }

  function pickFiles(e) {
    const files = [...e.target.files]
    e.target.value = ''
    if (files.length) addFiles(files)
  }

  // What's still missing, in the order the page asks for it.
  const missing = !courseCode ? 'course' : !session ? 'year' : !pages.length && !docs.length ? 'files' : null

  // Scroll to the thing they missed, wiggle it, and say what to do there.
  function guideTo(field) {
    setHint(field)
    const target = { course: courseField, year: yearField, files: addZone }[field].current
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'center' })
    if (!calm) target.animate(SHAKE, { duration: 420, easing: 'ease-in-out' })
    // Focus once the scroll has landed - focusing mid-scroll can cut it short.
    if (field === 'course') setTimeout(() => courseInput.current?.focus({ preventScroll: true }), calm ? 0 : 500)
    if (field === 'files') {
      setNudge(true)
      setTimeout(() => setNudge(false), 1600)
    }
  }

  async function submit() {
    if (stage === 'sending') return
    if (missing) {
      guideTo(missing)
      return
    }
    setStage('sending')
    setError('')
    attempt.current ||= { id: uuid(), sent: {} }
    try {
      const result = await submitUpload({
        attempt: attempt.current,
        courseCode,
        session,
        pages: pages.map(p => p.blob),
        docs: docs.map(d => d.file),
        as: staff ? 'admin' : 'student',
        recordPath: owner ? '/dele/papers' : undefined,
        onProgress: (done, total) => setProgress({ done, total }),
      })
      if (owner) setPublished(result.paper)
      setStage('done')
    } catch (err) {
      setError(err.message)
      setStage('form')
    }
  }

  function startOver() {
    pages.forEach(p => URL.revokeObjectURL(p.url))
    docs.forEach(d => URL.revokeObjectURL(d.url))
    setPages([])
    setDocs([])
    setNotices([])
    setError('')
    setHint(null)
    setPublished(null)
    // The year they just sent is not the one they are about to send next. The
    // course stays, since the next paper is often from the same course.
    setSession('')
    setStage('form')
  }

  const course = courseList.find(c => c.code === courseCode)
  const sending = stage === 'sending'
  const total = pages.length + docs.length

  if (stage === 'done') {
    const parts = [
      pages.length ? `${pages.length} page${pages.length === 1 ? '' : 's'}` : null,
      docs.length ? `${docs.length} document${docs.length === 1 ? '' : 's'}` : null,
    ].filter(Boolean).join(' and ')

    return (
      <div className="up-page">
        <ScrollToTop />
        <section className="up-card up-done">
          <Confetti />
          <span className="up-done-icon"><UiIcon name="check" size={38} /></span>
          {owner ? (
            <>
              <h1 className="up-serif">Published</h1>
              <p>
                <strong>{published?.title || `${course?.code} · ${session}`}</strong> is live. It was approved
                automatically, so students can open it now.
              </p>
            </>
          ) : (
            <>
              <h1 className="up-serif">Thank you!</h1>
              <p>
                {parts} for <strong>{course?.code}</strong> · {session} {total === 1 ? 'is' : 'are'} on the way
                to our team. Everything is checked before it goes live, so it may take a little while to show up.
              </p>
            </>
          )}
          <div className="up-done-actions">
            <button type="button" className="up-btn primary" onClick={startOver}>
              <UiIcon name="plus" size={17} /> Upload another
            </button>
            {owner && published?.courseKey && (
              <Link to={`/delealone/compare?course=${published.courseKey}`} className="up-btn">See it in Compare</Link>
            )}
            {!owner && (signedIn
              ? <Link to={staff ? '/admin' : '/'} className="up-btn">Back to dashboard</Link>
              : <Link to="/auth" className="up-btn">Sign in</Link>)}
          </div>
        </section>
      </div>
    )
  }

  const countLabel = pages.length && !docs.length
    ? `${pages.length} page${pages.length === 1 ? '' : 's'}`
    : docs.length && !pages.length
      ? `${docs.length} document${docs.length === 1 ? '' : 's'}`
      : total ? `${total} files` : ''
  const ratio = progress.total ? progress.done / progress.total : 0

  return (
    <div className="up-page">
      <ScrollToTop />
      <header className="up-head">
        <h1 className="up-title">Upload</h1>
        <p className="up-lead">
          {owner
            ? 'Papers you upload here are approved immediately and credited to you.'
            : staff
              ? 'Help students with solved or properly documented past questions.'
              : 'Share a past question paper with everyone studying the same course.'}
        </p>
      </header>

      {/* The owner doesn't need the pitch - straight to the form */}
      {!owner && (staff ? (
        <HeroBanner className="up-hero" title="Send us the good ones." art={<UploadArt />}>
          Most of the past questions on Nexus are simply photos snapped on a phone. If you have
          papers that are <b>solved</b>, or properly typed and formatted as a <b>PDF or Word file</b>,
          please send them here - they make revising far easier for students. Every upload is
          checked before it goes live.
        </HeroBanner>
      ) : (
        <HeroBanner className="up-hero" title="Got a paper? Pass it on." art={<UploadArt />}>
          A few photos or a quick file drop is all it takes. We look over every upload before it
          goes live, so the papers on Nexus stay clean and correct.
        </HeroBanner>
      ))}

      {/* 1 - which paper */}
      <section className="up-card">
        <CardHead tone="blue" icon="book" title="Which paper is it?" sub="Search for the course, then pick the year." />

        <div className="up-field" ref={courseField}>
          <span className="up-label">Course</span>
          <CourseCombobox
            courses={courseList}
            value={courseCode}
            onChange={code => { setCourseCode(code); if (code) setHint(h => (h === 'course' ? null : h)) }}
            invalid={hint === 'course' && !courseCode}
            disabled={sending}
            inputRef={courseInput}
          />
          {hint === 'course' && !courseCode && <Hint>{HINTS.course}</Hint>}
        </div>

        <div className="up-field" ref={yearField}>
          <span className="up-label">Year</span>
          <div className={`up-years${hint === 'year' && !session ? ' invalid' : ''}`} role="radiogroup" aria-label="Year">
            {SESSIONS.map(s => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={session === s}
                className={`up-year${session === s ? ' on' : ''}`}
                disabled={sending}
                onClick={() => { setSession(s); setHint(h => (h === 'year' ? null : h)) }}
              >
                {session === s && <UiIcon name="check" size={14} />}
                {s}
              </button>
            ))}
          </div>
          {hint === 'year' && !session && <Hint>{HINTS.year}</Hint>}
        </div>

        {owner && (
          <p className="up-saveas">
            <UiIcon name="doc" size={18} />
            {title ? (
              <>
                <span>Will be saved as</span>
                <strong>{title}</strong>
              </>
            ) : (
              <span>Pick a course and a year to see what this will be saved as.</span>
            )}
          </p>
        )}
      </section>

      {/* 2 - the paper itself */}
      <section className="up-card">
        <CardHead
          tone="violet"
          icon="cloud"
          title="Add the paper"
          sub={staff || owner
            ? 'A solved or typed PDF or Word file works best. Photos are fine too.'
            : 'Photos of each page, or a document - whichever you have.'}
        />

        <div className="up-addzone" ref={addZone}>
          <div
            className={`up-drop${dragOver ? ' over' : ''}`}
            onClick={() => anyInput.current.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false) }}
            onDrop={e => {
              e.preventDefault()
              setDragOver(false)
              addFiles([...e.dataTransfer.files])
            }}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); anyInput.current.click() } }}
          >
            <UiIcon name="cloud" size={30} className="up-drop-icon" />
            <strong>{dragOver ? 'Let go to add it' : 'Drag & drop files here'}</strong>
            <span>or tap to browse · up to {formatBytes(MAX_DOC_BYTES)} each</span>
          </div>

          <div className={`up-actions${nudge ? ' nudge' : ''}`}>
            <ActionTile tone="peach" icon="camera" title="Take photos" desc="Snap it page by page" onClick={() => openCamera()} disabled={sending} />
            <ActionTile tone="blue" icon="image" title="Choose photos" desc="From your gallery" onClick={() => photoInput.current.click()} disabled={sending} />
            <ActionTile tone="sage" icon="file" title="Upload a document" desc="PDF, Word and more" onClick={() => docInput.current.click()} disabled={sending} />
          </div>

          {hint === 'files' && !total && <Hint>{HINTS.files}</Hint>}
        </div>

        {notices.length > 0 && (
          <ul className="up-notices" role="alert">
            {notices.map((n, i) => <li key={i}><UiIcon name="alert" size={16} /> {n}</li>)}
          </ul>
        )}

        {docs.length > 0 && (
          <div className="up-block">
            <h3>{docs.length === 1 ? 'Document' : `Documents (${docs.length})`}</h3>
            {docs.map(doc => {
              const open = previewId === doc.id
              return (
                <div className="up-doc" key={doc.id}>
                  <div className="up-doc-row">
                    <span className="up-chip small up-tone-violet"><UiIcon name="doc" size={20} /></span>
                    <div className="up-doc-meta">
                      <strong title={doc.name}>{doc.name}</strong>
                      <span>{doc.ext.toUpperCase()} · {formatBytes(doc.size)}</span>
                    </div>
                    {doc.ext === 'pdf' && (
                      <button type="button" className="up-link" onClick={() => setPreviewId(open ? null : doc.id)}>
                        {open ? 'Hide preview' : 'Preview'}
                      </button>
                    )}
                    <button type="button" className="up-icon-btn" onClick={() => removeDoc(doc.id)} aria-label={`Remove ${doc.name}`} disabled={sending}>
                      <UiIcon name="trash" size={16} />
                    </button>
                  </div>
                  {open && (
                    <div className="up-preview">
                      <PdfReader url={doc.url} zoom={1} startPage={1} onPage={noop} topPadding={12} />
                    </div>
                  )}
                  {doc.ext !== 'pdf' && (
                    <p className="up-doc-note">No preview for this file type - our team will open it when reviewing.</p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {pages.length > 0 && (
          <div className="up-block">
            <div className="up-block-head">
              <h3>Pages ({pages.length})</h3>
              <span>Tap a page to check it. Drag, or use the arrows, to reorder.</span>
            </div>

            <ul className="up-grid">
              {pages.map((page, i) => (
                <li
                  key={page.id}
                  className={`up-tile${dragId === page.id ? ' dragging' : ''}${overId === page.id && dragId !== page.id ? ' over' : ''}`}
                  draggable={!sending}
                  onDragStart={() => setDragId(page.id)}
                  onDragOver={e => { e.preventDefault(); setOverId(page.id) }}
                  onDrop={e => { e.preventDefault(); e.stopPropagation(); dropOnPage(page.id) }}
                  onDragEnd={() => { setDragId(null); setOverId(null) }}
                >
                  <button type="button" className="up-tile-img" onClick={() => setLightbox(i)} aria-label={`Check page ${i + 1}`}>
                    <img src={page.url} alt={`Page ${i + 1}`} draggable={false} />
                  </button>
                  <span className="up-tile-n">{i + 1}</span>
                  <div className="up-tile-bar">
                    <button type="button" onClick={() => movePage(page.id, -1)} disabled={i === 0 || sending} aria-label="Move earlier">
                      <UiIcon name="left" size={15} />
                    </button>
                    <button type="button" onClick={() => rotatePage(page.id)} disabled={sending} aria-label="Rotate">
                      <UiIcon name="rotate" size={15} />
                    </button>
                    <button type="button" onClick={() => openCamera(page.id)} disabled={sending} aria-label="Retake">
                      <UiIcon name="camera" size={15} />
                    </button>
                    <button type="button" onClick={() => removePage(page.id)} disabled={sending} aria-label="Remove">
                      <UiIcon name="trash" size={15} />
                    </button>
                    <button type="button" onClick={() => movePage(page.id, 1)} disabled={i === pages.length - 1 || sending} aria-label="Move later">
                      <UiIcon name="right" size={15} />
                    </button>
                  </div>
                </li>
              ))}

              {pages.length < MAX_PAGES && (
                <li className="up-tile add">
                  <button type="button" onClick={() => openCamera()} disabled={sending}>
                    <UiIcon name="camera" size={17} /> Snap more
                  </button>
                  <button type="button" onClick={() => photoInput.current.click()} disabled={sending}>
                    <UiIcon name="image" size={17} /> Add photos
                  </button>
                </li>
              )}
            </ul>
          </div>
        )}
      </section>

      <div className="up-submit">
        {error && <p className="up-error" role="alert"><UiIcon name="alert" size={16} /> {error}</p>}
        <button
          type="button"
          className={`up-send${missing ? '' : ' ready'}${sending ? ' sending' : ''}`}
          onClick={submit}
          disabled={sending}
        >
          {sending ? (
            <>
              <span className="up-send-fill" style={{ width: `${ratio * 100}%` }} />
              <span className="up-send-label">
                <UiIcon name="loader" size={18} spin /> {sendingMessage(ratio)}
              </span>
            </>
          ) : (
            <span className="up-send-label">
           
              {error ? 'Try again' : owner ? 'Publish' : 'Submit for review'}
              {countLabel && <em>{countLabel}</em>}
              
            </span>
          )}
        </button>
      </div>

      {!owner && (
        <LynklensAd variant="note" message="Every paper you share keeps this going - made possible by Lynklens." />
      )}

      <input ref={anyInput} type="file" hidden multiple accept={`${IMAGE_ACCEPT},${DOC_ACCEPT}`} onChange={pickFiles} />
      <input ref={photoInput} type="file" hidden multiple accept={IMAGE_ACCEPT} onChange={pickFiles} />
      <input ref={docInput} type="file" hidden multiple accept={DOC_ACCEPT} onChange={pickFiles} />
      <input ref={nativeInput} type="file" hidden accept="image/*" capture="environment" onChange={onNativeCapture} />

      {camera && (
        <CameraCapture
          pages={pages}
          retakingId={camera.retakingId}
          onShot={onCameraShot}
          onRetake={id => setCamera({ retakingId: id })}
          onDelete={removePage}
          onClose={() => setCamera(null)}
          onUseNative={() => openNativeCamera(camera.retakingId)}
        />
      )}

      {lightbox !== null && (
        <PageLightbox
          pages={pages}
          index={Math.min(lightbox, pages.length - 1)}
          onIndex={setLightbox}
          onClose={() => setLightbox(null)}
          onRotate={rotatePage}
          onRetake={openCamera}
          onRemove={removePage}
        />
      )}
    </div>
  )
}
