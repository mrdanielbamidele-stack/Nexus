import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import CourseCombobox from '../../components/CourseCombobox'
import { getAllCatalogCourses } from '../../lib/studentCourses'
import { prepareImage } from '../../lib/imageTools'
import {
  DOC_EXTENSIONS, IMAGE_EXTENSIONS, MAX_DOC_BYTES, MAX_DOCS, MAX_PAGES, SESSIONS,
  classifyFile, formatBytes, submitUpload, uuid,
} from '../../lib/studentUploads'
import { useDele } from './deleContext'

const ACCEPT = [...IMAGE_EXTENSIONS, ...DOC_EXTENSIONS].map(e => `.${e}`).join(',')

// Owner upload: goes live immediately (no review) and the version number is
// worked out for you - "PHY 101 2023/2024", then "PHY 101 2023/2024 v2"...
export default function DeleUpload() {
  const { call } = useDele()
  const courses = useMemo(getAllCatalogCourses, [])

  const [courseCode, setCourseCode] = useState('')
  const [session, setSession] = useState('')
  const [title, setTitle] = useState('')
  const [pages, setPages] = useState([]) // { id, blob, url, name }
  const [docs, setDocs] = useState([]) // File[]
  const [notices, setNotices] = useState([])
  const [stage, setStage] = useState('form') // form | sending | done
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [error, setError] = useState('')
  const [published, setPublished] = useState(null)

  const input = useRef(null)
  const attempt = useRef(null)

  // The title fills itself in as soon as the course and year are chosen.
  useEffect(() => {
    attempt.current = null
    if (!courseCode || !session) {
      setTitle('')
      return
    }
    let cancelled = false
    call(`/next-version?course=${encodeURIComponent(courseCode)}&session=${encodeURIComponent(session)}`)
      .then(result => { if (!cancelled) setTitle(result.title) })
      .catch(() => { if (!cancelled) setTitle('') })
    return () => { cancelled = true }
  }, [call, courseCode, session, stage])

  useEffect(() => { attempt.current = null }, [pages, docs])

  async function addFiles(fileList) {
    const problems = []
    const newPages = []
    const newDocs = []

    for (const file of fileList) {
      const kind = classifyFile(file)
      if (!kind) problems.push(`"${file.name}" isn't a type we accept (photos, PDF, Word, PowerPoint, Excel or text).`)
      else if (kind === 'doc') {
        if (file.size > MAX_DOC_BYTES) problems.push(`"${file.name}" is over ${formatBytes(MAX_DOC_BYTES)}.`)
        else newDocs.push(file)
      } else {
        try {
          const blob = await prepareImage(file)
          newPages.push({ id: uuid(), blob, url: URL.createObjectURL(blob), name: file.name })
        } catch {
          problems.push(`We couldn't read "${file.name}". Try a JPG or PNG.`)
        }
      }
    }

    setPages(prev => [...prev, ...newPages].slice(0, MAX_PAGES))
    setDocs(prev => [...prev, ...newDocs].slice(0, MAX_DOCS))
    setNotices(problems)
  }

  function removePage(id) {
    setPages(prev => {
      const gone = prev.find(p => p.id === id)
      if (gone) URL.revokeObjectURL(gone.url)
      return prev.filter(p => p.id !== id)
    })
  }

  async function submit() {
    setError('')
    if (!courseCode) return setError('Choose the course first.')
    if (!session) return setError('Choose the year first.')
    if (!pages.length && !docs.length) return setError('Add at least one photo or document.')

    setStage('sending')
    attempt.current ||= { id: uuid(), sent: {} }
    try {
      const { paper } = await submitUpload({
        attempt: attempt.current,
        courseCode,
        session,
        pages: pages.map(p => p.blob),
        docs,
        recordPath: '/dele/papers',
        onProgress: (done, total) => setProgress({ done, total }),
      })
      setPublished(paper)
      setStage('done')
    } catch (err) {
      setError(err.message)
      setStage('form')
    }
  }

  function another() {
    pages.forEach(p => URL.revokeObjectURL(p.url))
    setPages([])
    setDocs([])
    setNotices([])
    setPublished(null)
    setStage('form')
  }

  if (stage === 'done' && published) {
    return (
      <div className="dl-card center">
        <h1>Published ✓</h1>
        <p><b>{published.title}</b> is live. Approved automatically.</p>
        <div className="dl-actions center">
          <button type="button" className="dl-btn" onClick={another}>Upload another</button>
          <Link className="dl-btn ghost" to={`/delealone/compare?course=${published.courseKey}`}>See it in Compare</Link>
        </div>
      </div>
    )
  }

  const sending = stage === 'sending'

  return (
    <div>
      <div className="dl-titlebar"><h1>Upload</h1></div>
      <p className="dl-lead">Papers you upload here are approved immediately and credited to you.</p>

      <section className="dl-card">
        <h2>Which paper?</h2>
        <div className="dl-form-row">
          <div className="dl-field">
            <span>Course</span>
            <CourseCombobox courses={courses} value={courseCode} onChange={setCourseCode} disabled={sending} />
          </div>
          <div className="dl-field">
            <span>Year</span>
            <select className="dl-input" value={session} onChange={e => setSession(e.target.value)} disabled={sending}>
              <option value="">Choose the year…</option>
              {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="dl-title-preview">
          <span>Will be saved as</span>
          <strong>{title || '-'}</strong>
        </div>
      </section>

      <section className="dl-card">
        <h2>Files</h2>
        <input
          ref={input}
          type="file"
          multiple
          hidden
          accept={ACCEPT}
          onChange={e => { addFiles([...e.target.files]); e.target.value = '' }}
        />
        <button type="button" className="dl-drop" disabled={sending} onClick={() => input.current.click()}>
          <strong>Choose photos or documents</strong>
          <span>Up to {MAX_PAGES} photos and {MAX_DOCS} documents · {formatBytes(MAX_DOC_BYTES)} each</span>
        </button>

        {notices.length > 0 && (
          <ul className="dl-notices">{notices.map((n, i) => <li key={i}>{n}</li>)}</ul>
        )}

        {docs.length > 0 && (
          <ul className="dl-filelist">
            {docs.map((file, i) => (
              <li key={`${file.name}-${i}`}>
                <span>{file.name}</span>
                <em>{formatBytes(file.size)}</em>
                <button type="button" className="dl-link" disabled={sending} onClick={() => setDocs(d => d.filter((_, n) => n !== i))}>Remove</button>
              </li>
            ))}
          </ul>
        )}

        {pages.length > 0 && (
          <div className="dl-pages">
            {pages.map((page, i) => (
              <div key={page.id} className="dl-page">
                <img src={page.url} alt={`Page ${i + 1}`} />
                <span>{i + 1}</span>
                <button type="button" className="dl-page-x" disabled={sending} onClick={() => removePage(page.id)} aria-label="Remove page">×</button>
              </div>
            ))}
          </div>
        )}
      </section>

      {error && <p className="dl-error" role="alert">{error}</p>}

      <button type="button" className="dl-btn big" disabled={sending} onClick={submit}>
        {sending
          ? `Uploading… ${progress.done}/${progress.total}`
          : `Publish${title ? ` ${title}` : ''}`}
      </button>
    </div>
  )
}
