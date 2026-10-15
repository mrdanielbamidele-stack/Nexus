import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { plural } from '../lib/format'
import { usernameProblem } from '../lib/schoolEmail'
import { getUploader, setUploader } from '../lib/uploader'
import PaperReview from './dele/PaperReview'
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
  who: 'Type your name, or choose to stay mysterious, then send.',
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

// Sprays over the whole page when an upload finishes.
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
    <div className="up-confetti screen" aria-hidden="true">
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

// "3 pages", "1 document", "2 pages and 1 document".
const countParts = (pages, docs) => [
  pages ? plural(pages, 'page') : null,
  docs ? plural(docs, 'document') : null,
].filter(Boolean).join(' and ')

// Papers going up in the background, one row each with its own bar.
function UploadJobs({ jobs, owner, panelRef, onRetry, onDismiss }) {
  if (!jobs.length) return null

  return (
    <section className="up-jobs" ref={panelRef} aria-label="Uploads in progress">
      {jobs.map(job => {
        const ratio = job.total ? job.done / job.total : 0
        const label = job.paper?.title || job.title || `${job.courseCode} ${job.session}`
        return (
          <div className={`up-job is-${job.state}`} key={job.id}>
            <span className="up-job-icon">
              {job.state === 'sending' && <UiIcon name="loader" size={18} spin />}
              {job.state === 'done' && <UiIcon name="check" size={18} />}
              {job.state === 'error' && <UiIcon name="alert" size={18} />}
            </span>

            <div className="up-job-body">
              <strong>{job.courseCode} · {job.session}</strong>
              <span>
                {job.state === 'sending' && `${sendingMessage(ratio)} ${job.done} of ${plural(job.total, 'file')}`}
                {job.state === 'done' && (owner
                  ? <>Published as <b>{label}</b>. Students can open it now.</>
                  : <>Sent. It will show up once our team has checked it.</>)}
                {job.state === 'error' && job.error}
              </span>
              {job.state === 'sending' && (
                <span className="up-job-bar" aria-hidden="true">
                  <span style={{ width: `${Math.max(4, ratio * 100)}%` }} />
                </span>
              )}
            </div>

            <div className="up-job-actions">
              {job.state === 'error' && (
                <button type="button" className="up-btn primary" onClick={() => onRetry(job.id)}>Try again</button>
              )}
              {job.state !== 'sending' && (
                <button type="button" className="up-icon-btn" onClick={() => onDismiss(job.id)} aria-label="Dismiss">
                  <UiIcon name="x" size={16} />
                </button>
              )}
            </div>
          </div>
        )
      })}
    </section>
  )
}

const STATUS_ORDER = { approved: 0, pending: 1 }

// Owner: every accepted and waiting version Nexus has for the chosen course
// (just the chosen year once there is one), laid out like Compare. Shows
// nothing at all when there is nothing yet.
function ExistingPapers({ course, session, found, onChanged, onDeleted, onRefresh }) {
  if (!found || found.code !== course.code) return null

  const papers = found.papers
    .filter(p => p.status !== 'rejected' && (!session || p.session === session))
    .sort((a, b) =>
      b.session.localeCompare(a.session)
      || STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
      || a.version - b.version
      || new Date(a.createdAt) - new Date(b.createdAt))
  if (!papers.length) return null

  const sessions = [...new Set(papers.map(p => p.session))]
  const waiting = papers.filter(p => p.status === 'pending').length

  return (
    <section className="dl-cmp-course up-have">
      <header className="dl-cmp-head">
        <h2>
          {course.code}
          {course.title && <small>{course.title}</small>}
        </h2>
        <span>
          {plural(papers.length, 'paper')} on Nexus
          {waiting > 0 && <b> · {waiting} waiting</b>}
        </span>
      </header>

      <div className="dl-cmp-grid">
        {sessions.map(name => {
          const group = papers.filter(p => p.session === name)
          const live = group.filter(p => p.status === 'approved').length
          return (
            <Fragment key={name}>
              <h3 className="dl-cmp-session">
                {name}
                {live > 1 && <span>{live} public versions</span>}
              </h3>
              {group.map(paper => (
                <PaperReview
                  key={paper.id}
                  paper={paper}
                  compact
                  onChanged={onChanged}
                  onDeleted={onDeleted}
                  onRefresh={onRefresh}
                />
              ))}
            </Fragment>
          )
        })}
      </div>
    </section>
  )
}

/* ---------------------------------- page ---------------------------------- */

// `variant="staff"` is the admin version (/admin/upload): same flow, but it asks
// for solved or properly typed papers rather than phone snaps.
// `variant="owner"` is /delealone/upload: same page again, but the paper goes
// live straight away (no review) and its title - "PHY 101 2023/2024", then
// "... v2" - is worked out for you.
//
// `embedded` is the small version that sits inside a Compare course: the course
// and year are fixed (`fixedCourse`, `fixedSession`), there is no page header or
// course picker, and `onPublished` is called each time a paper finishes going up.
export default function Upload({
  variant = 'student', embedded = false, fixedCourse = '', fixedSession = '', onPublished,
}) {
  const staff = variant === 'staff'
  const owner = variant === 'owner'
  const signedIn = staff || owner || isAuthed()
  const dele = useDele() // only set inside the owner area

  // Every course in the catalog, A to Z.
  const courseList = useMemo(getAllCatalogCourses, [])

  const [courseCode, setCourseCode] = useState(fixedCourse)
  const [session, setSession] = useState(fixedSession)
  const [pages, setPages] = useState([])      // photos, in reading order
  const [docs, setDocs] = useState([])        // PDF / Word / etc.
  const [previewId, setPreviewId] = useState(null)
  const [notices, setNotices] = useState([])
  const [dragOver, setDragOver] = useState(false)
  const [camera, setCamera] = useState(null)  // null | { retakingId }
  const [lightbox, setLightbox] = useState(null) // page index
  const [dragId, setDragId] = useState(null)
  const [overId, setOverId] = useState(null)
  const [stage, setStage] = useState('form')  // 'form' | 'done' (the thank-you screen)
  const [hint, setHint] = useState(null)      // 'course' | 'year' | 'files' | 'who' - what they missed
  // Signed-out visitors: their name, or "stay mysterious" (remembered on this device).
  const [sender, setSender] = useState(getUploader) // { name, mysterious }
  const [nudge, setNudge] = useState(false)
  const [title, setTitle] = useState('')      // owner: what the paper will be called
  // Papers being sent in the background, so the form is free for the next one.
  const [jobs, setJobs] = useState([])
  const [lastJob, setLastJob] = useState(null)  // the one the thank-you screen follows
  const [bursts, setBursts] = useState([])      // confetti sprays, one per finished upload
  // Owner: what Nexus already has for the chosen course ({ code, papers }).
  const [existing, setExisting] = useState(null)
  const [listVersion, setListVersion] = useState(0) // bumped when a background send finishes

  const courseInput = useRef(null)
  const courseField = useRef(null)
  const yearField = useRef(null)
  const addZone = useRef(null)
  const whoField = useRef(null)
  const whoInput = useRef(null)
  const anyInput = useRef(null)
  const photoInput = useRef(null)
  const docInput = useRef(null)
  const nativeInput = useRef(null)
  const retakeTarget = useRef(null) // page being replaced by the native camera app
  const jobWork = useRef(new Map()) // job id -> what to send (files stay out of state)
  const jobsPanel = useRef(null)
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
  }, [owner, dele, courseCode, session, listVersion])

  // Owner: everything Nexus already has for the chosen course, newest first.
  // Refreshed whenever a background send finishes.
  useEffect(() => {
    if (!owner || !courseCode || embedded) return
    let cancelled = false
    dele.call(`/papers?course=${encodeURIComponent(courseCode)}`)
      .then(({ papers }) => { if (!cancelled) setExisting({ code: courseCode, papers }) })
      .catch(() => { if (!cancelled) setExisting({ code: courseCode, papers: [], failed: true }) })
    return () => { cancelled = true }
  }, [owner, dele, courseCode, listVersion, embedded])

  // Leaving (or closing the tab) while papers are still going up would cut them off.
  const sendingJobs = jobs.some(j => j.state === 'sending')
  useEffect(() => {
    if (!sendingJobs) return
    const warn = e => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [sendingJobs])

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

  // Paste a screenshot / copied image straight in. (Not in the small version:
  // several of them can be on one page, and a paste must not land in all.)
  useEffect(() => {
    if (embedded) return
    const onPaste = e => {
      const files = [...(e.clipboardData?.files || [])]
      if (files.length) addFiles(files)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [addFiles, embedded])

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

  // Someone who isn't signed in says who is sending, or stays mysterious.
  const senderName = sender.name.trim()
  const senderProblem = senderName ? usernameProblem(senderName) : null
  const needsWho = !signedIn && (Boolean(senderProblem) || (!senderName && !sender.mysterious))

  // What's still missing, in the order the page asks for it.
  const missing = !courseCode ? 'course'
    : !session ? 'year'
      : !pages.length && !docs.length ? 'files'
        : needsWho ? 'who'
          : null

  function changeSender(next) {
    setSender(next)
    setUploader(next)
    setHint(h => (h === 'who' ? null : h))
  }

  // Scroll to the thing they missed, wiggle it, and say what to do there.
  function guideTo(field) {
    setHint(field)
    const target = { course: courseField, year: yearField, files: addZone, who: whoField }[field].current
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'center' })
    if (!calm) target.animate(SHAKE, { duration: 420, easing: 'ease-in-out' })
    // Focus once the scroll has landed - focusing mid-scroll can cut it short.
    if (field === 'course') setTimeout(() => courseInput.current?.focus({ preventScroll: true }), calm ? 0 : 500)
    if (field === 'who' && !sender.mysterious) setTimeout(() => whoInput.current?.focus({ preventScroll: true }), calm ? 0 : 500)
    if (field === 'files') {
      setNudge(true)
      setTimeout(() => setNudge(false), 1600)
    }
  }

  const patchJob = (id, patch) => setJobs(list => list.map(j => (j.id === id ? { ...j, ...patch } : j)))

  // Send one queued paper. Safe to call again after a failure - files that
  // already went up are skipped (see submitUpload).
  async function runJob(id) {
    const work = jobWork.current.get(id)
    if (!work) return
    patchJob(id, { state: 'sending', error: '' })
    try {
      const result = await submitUpload({
        attempt: work.attempt,
        courseCode: work.courseCode,
        session: work.session,
        pages: work.pages,
        docs: work.docs,
        as: staff ? 'admin' : 'student',
        uploaderName: work.uploaderName,
        recordPath: owner ? '/dele/papers' : undefined,
        onProgress: (done, total) => patchJob(id, { done, total }),
      })
      jobWork.current.delete(id)
      patchJob(id, { state: 'done', paper: owner ? result.paper : null })
      setListVersion(v => v + 1)
      onPublished?.()

      // Confetti for this one, wherever they are on the page by now.
      setBursts(list => [...list, id])
      setTimeout(() => setBursts(list => list.filter(b => b !== id)), 4500)
    } catch (err) {
      patchJob(id, { state: 'error', error: err.message })
    }
  }

  // Take what is on the form and send it in the background. The thank-you
  // screen follows it; "Upload another" gives back a clean form while it carries on.
  function queueUpload() {
    const id = uuid()
    jobWork.current.set(id, {
      courseCode,
      session,
      pages: pages.map(p => p.blob),
      docs: docs.map(d => d.file),
      uploaderName: signedIn ? '' : senderName,
      attempt: { id: uuid(), sent: {} },
    })
    setJobs(list => [
      {
        id, courseCode, session, title,
        parts: countParts(pages.length, docs.length),
        done: 0, total: pages.length + docs.length, state: 'sending', error: '', paper: null,
      },
      ...list,
    ])

    // Page previews are only for the form; the blobs themselves live on in the job.
    pages.forEach(p => URL.revokeObjectURL(p.url))
    docs.forEach(d => URL.revokeObjectURL(d.url))
    setPages([])
    setDocs([])
    setNotices([])
    setHint(null)
    setPreviewId(null)
    // Nothing carries over: the next paper starts from a blank form. (The small
    // version belongs to one course and year, so it keeps those and stays on the
    // form - the job row above it shows how the send is going.)
    if (!embedded) {
      setCourseCode('')
      setSession('')
      setTitle('')
      setLastJob(id)
      setStage('done')
    }
    runJob(id)
  }

  function submit() {
    if (missing) {
      guideTo(missing)
      return
    }
    queueUpload()
  }

  // Everything was already cleared when the upload was queued.
  const startOver = () => setStage('form')

  const course = courseList.find(c => c.code === courseCode)
  const total = pages.length + docs.length

  // Confetti for every upload that finishes, on any screen.
  const celebration = bursts.map(id => <Confetti key={id} />)

  if (stage === 'done') {
    const job = jobs.find(j => j.id === lastJob)
    const state = job?.state || 'done'
    const ratio = job?.total ? job.done / job.total : 0
    const others = jobs.filter(j => j.state === 'sending' && j.id !== lastJob).length

    return (
      <div className="up-page">
        <ScrollToTop />
        {celebration}
        <section className="up-card up-done">
          <span className={`up-done-icon is-${state}`}>
            <UiIcon name={state === 'sending' ? 'loader' : state === 'error' ? 'alert' : 'check'} size={38} spin={state === 'sending'} />
          </span>

          {state === 'sending' && (
            <>
              <h1 className="up-serif">Sending it over…</h1>
              <p>
                <strong>{job.courseCode}</strong> · {job.session} is going up now. You can start the next
                paper while it finishes - it will celebrate when it is done.
              </p>
              <div className="up-done-bar" aria-hidden="true"><span style={{ width: `${Math.max(4, ratio * 100)}%` }} /></div>
            </>
          )}

          {state === 'done' && owner && (
            <>
              <h1 className="up-serif">Published!</h1>
              <p>
                <strong>{job?.paper?.title || `${job?.courseCode} ${job?.session}`}</strong> is live.
                It was approved automatically, so students can open it now.
              </p>
            </>
          )}

          {state === 'done' && !owner && (
            <>
              <h1 className="up-serif">Thank you!</h1>
              <p>
                {job.parts} for <strong>{job.courseCode}</strong> · {job.session} {job.total === 1 ? 'is' : 'are'} on
                the way to our team. Everything is checked before it goes live, so it may take a little while to show up.
              </p>
            </>
          )}

          {state === 'error' && (
            <>
              <h1 className="up-serif">That didn&apos;t go through</h1>
              <p>{job.error}</p>
            </>
          )}

          {others > 0 && <p className="up-done-others">{others} other {others === 1 ? 'paper is' : 'papers are'} still sending.</p>}

          <div className="up-done-actions">
            <button type="button" className="up-btn primary" onClick={startOver}>
              <UiIcon name="plus" size={17} /> Upload another
            </button>
            {state === 'error' && (
              <button type="button" className="up-btn" onClick={() => runJob(job.id)}>Try again</button>
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

  return (
    <div className={`up-page${embedded ? ' is-embedded' : ''}`}>
      {!embedded && <ScrollToTop />}
      {celebration}
      {!embedded && (
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
      )}

      <UploadJobs
        jobs={jobs}
        owner={owner}
        panelRef={jobsPanel}
        onRetry={runJob}
        onDismiss={id => {
          jobWork.current.delete(id)
          setJobs(list => list.filter(j => j.id !== id))
        }}
      />

      {/* The owner doesn't need the pitch - straight to the form */}
      {!owner && !embedded && (staff ? (
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

      {/* 1 - which paper (the small version already knows: course + year are fixed) */}
      {!embedded && (
        <section className="up-card">
          <CardHead tone="blue" icon="book" title="Which paper is it?" sub="Search for the course, then pick the year." />

          <div className="up-field" ref={courseField}>
            <span className="up-label">Course</span>
            <CourseCombobox
              courses={courseList}
              value={courseCode}
              onChange={code => { setCourseCode(code); if (code) setHint(h => (h === 'course' ? null : h)) }}
              invalid={hint === 'course' && !courseCode}
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
                  onClick={() => { setSession(s); setHint(h => (h === 'year' ? null : h)) }}
                >
                  {session === s && <UiIcon name="check" size={14} />}
                  {s}
                </button>
              ))}
            </div>
            {hint === 'year' && !session && <Hint>{HINTS.year}</Hint>}
          </div>

          {owner && title && (
            <p className="up-saveas">
              <UiIcon name="doc" size={18} />
              <span>Will be saved as</span>
              <strong>{title}</strong>
            </p>
          )}
        </section>
      )}

      {embedded && title && (
        <p className="up-saveas">
          <UiIcon name="doc" size={18} />
          <span>Will be saved as</span>
          <strong>{title}</strong>
        </p>
      )}

      {/* Owner: what is already there for this course / year */}
      {owner && !embedded && course && (
        <ExistingPapers
          course={course}
          session={session}
          found={existing}
          onChanged={updated => setExisting(found => found && ({
            ...found,
            papers: found.papers.map(p => (p.id === updated.id ? updated : p)),
          }))}
          onDeleted={id => setExisting(found => found && ({
            ...found,
            papers: found.papers.filter(p => p.id !== id),
          }))}
          onRefresh={() => setListVersion(v => v + 1)}
        />
      )}

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
            <ActionTile tone="peach" icon="camera" title="Take photos" desc="Snap it page by page" onClick={() => openCamera()} />
            <ActionTile tone="blue" icon="image" title="Choose photos" desc="From your gallery" onClick={() => photoInput.current.click()} />
            <ActionTile tone="sage" icon="file" title="Upload a document" desc="PDF, Word and more" onClick={() => docInput.current.click()} />
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
                    <button type="button" className="up-icon-btn" onClick={() => removeDoc(doc.id)} aria-label={`Remove ${doc.name}`}>
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
                  draggable
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
                    <button type="button" onClick={() => movePage(page.id, -1)} disabled={i === 0} aria-label="Move earlier">
                      <UiIcon name="left" size={15} />
                    </button>
                    <button type="button" onClick={() => rotatePage(page.id)} aria-label="Rotate">
                      <UiIcon name="rotate" size={15} />
                    </button>
                    <button type="button" onClick={() => openCamera(page.id)} aria-label="Retake">
                      <UiIcon name="camera" size={15} />
                    </button>
                    <button type="button" onClick={() => removePage(page.id)} aria-label="Remove">
                      <UiIcon name="trash" size={15} />
                    </button>
                    <button type="button" onClick={() => movePage(page.id, 1)} disabled={i === pages.length - 1} aria-label="Move later">
                      <UiIcon name="right" size={15} />
                    </button>
                  </div>
                </li>
              ))}

              {pages.length < MAX_PAGES && (
                <li className="up-tile add">
                  <button type="button" onClick={() => openCamera()}>
                    <UiIcon name="camera" size={17} /> Snap more
                  </button>
                  <button type="button" onClick={() => photoInput.current.click()}>
                    <UiIcon name="image" size={17} /> Add photos
                  </button>
                </li>
              )}
            </ul>
          </div>
        )}
      </section>

      {/* Not signed in: say who is sending this, or stay mysterious */}
      {!signedIn && (
        <section className="up-card">
          <CardHead
            tone="peach"
            icon="user"
            title="Who is sending this?"
            sub="Add your name so it's credited to you, or stay mysterious. You can send it either way."
          />

          <div className="up-field" ref={whoField}>
            <span className="up-label">Your name</span>
            <div className="up-who">
              <div className={`up-combo up-who-name${hint === 'who' && needsWho && !sender.mysterious ? ' invalid' : ''}`}>
                <div className="up-combo-field">
                  <UiIcon name="user" size={18} />
                  <input
                    ref={whoInput}
                    type="text"
                    value={sender.name}
                    maxLength={30}
                    placeholder={sender.mysterious ? 'Staying mysterious' : 'e.g. John Doe'}
                    autoComplete="nickname"
                    disabled={sender.mysterious}
                    aria-label="Your name"
                    onChange={e => changeSender({ name: e.target.value, mysterious: false })}
                  />
                </div>
              </div>

              <button
                type="button"
                className={`up-year${sender.mysterious ? ' on' : ''}`}
                aria-pressed={sender.mysterious}
                onClick={() => changeSender({ name: '', mysterious: !sender.mysterious })}
              >
                {sender.mysterious && <UiIcon name="check" size={14} />}
                Stay mysterious
              </button>
            </div>

            {senderName && senderProblem && <Hint>{senderProblem}</Hint>}
            {hint === 'who' && needsWho && !senderProblem && <Hint>{HINTS.who}</Hint>}
          </div>
        </section>
      )}

      <div className="up-submit">
        <button
          type="button"
          className={`up-send${missing ? '' : ' ready'}`}
          onClick={submit}
        >
          <span className="up-send-label">
            {owner ? 'Publish' : 'Submit for review'}
            {countLabel && <em>{countLabel}</em>}
          </span>
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
