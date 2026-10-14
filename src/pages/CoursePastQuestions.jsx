import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import BackLink from '../components/BackLink'
import { getCoursePQ, getAvailableYears, formatYear, usePapers, usePapersReady } from '../lib/pastQuestions'
import { PaperCardsSkeleton, Skeleton } from '../components/Skeleton'
import { formatCode } from '../lib/courseSlug'
import { usePqBase } from '../lib/pqBase'
import { track } from '../lib/track'
import NotFound from './NotFound'
import './PastQuestions.css'
import ScrollToTop from '../components/ScrollToTop';
import LynklensAd from '../components/LynklensAd';

// Save one file to the device. Returns false if the browser couldn't fetch it.
async function saveFile(url, filename) {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(String(res.status))
    const blob = await res.blob()
    const objUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(objUrl)
    return true
  } catch {
    // The blob fetch can fail (CORS). Try a plain open so a hosted file still works.
    return Boolean(window.open(url, '_blank'))
  }
}

function YearCard({ courseCode, courseLabel, year, paper }) {
  const navigate = useNavigate()
  const { papers: base } = usePqBase()
  const session = paper.session || formatYear(year)
  const label = paper.title || `${courseLabel} ${session}`

  const [mode, setMode] = useState(null) // 'view' | 'download'
  const [busy, setBusy] = useState(false)

  async function download() {
    setBusy(true)
    track('download', { paperId: paper.id })

    // A paper can be several files (photo pages, documents): save each one.
    const files = paper.files?.length ? paper.files : [{ url: paper.fileUrl }]
    let saved = true
    for (const [i, file] of files.entries()) {
      const ext = file.url.match(/\.[a-z0-9]+(?=$|\?)/i)?.[0] || (file.format ? `.${file.format}` : '')
      const suffix = files.length > 1 ? ` (${i + 1} of ${files.length})` : ''
      saved = (await saveFile(file.url, `${label}${suffix}${ext}`)) && saved
    }

    if (!saved) alert('This past question paper is not available yet.')
    setBusy(false)
  }

  function go() {
    if (mode === 'view') navigate(`${base}/${courseCode}/${year}`)
    else if (mode === 'download') download()
  }

  const goLabel = busy
    ? 'Preparing…'
    : mode === 'view'
      ? 'View Questions'
      : mode === 'download'
        ? 'Download'
        : 'Select an option above'

  return (
    <div className="pq-card">
      <strong className="pq-card-title">{paper.title || `${courseLabel} - ${session}`}</strong>

      <div className="pq-mode-selector">
        <button
          type="button"
          className={`pq-mode-btn${mode === 'view' ? ' selected' : ''}`}
          onClick={() => setMode('view')}
        >
          <span className="pq-mode-text">
            <span className="pq-mode-label">View Online</span>
            <span className="pq-mode-desc">Read the questions right here</span>
          </span>
          <span className="pq-radio-dot" />
        </button>

        <button
          type="button"
          className={`pq-mode-btn${mode === 'download' ? ' selected' : ''}`}
          onClick={() => setMode('download')}
        >
          <span className="pq-mode-text">
            <span className="pq-mode-label">Download</span>
            <span className="pq-mode-desc">Save the question paper to your device</span>
          </span>
          <span className="pq-radio-dot" />
        </button>
      </div>

      <button className="pq-go-btn" disabled={!mode || busy} onClick={go}>
        {goLabel}
      </button>
    </div>
  )
}

export default function CoursePastQuestions() {
  const { courseCode } = useParams()
  const { papers: base, home } = usePqBase()
  usePapers() // re-render when the paper list refreshes
  const ready = usePapersReady()

  const course = getCoursePQ(courseCode)
  const years = getAvailableYears(courseCode)
  const courseLabel = formatCode(course?.code || courseCode)

  useEffect(() => {
    document.title = `${courseLabel} Past Questions`
  }, [courseLabel])

  // The paper list is still on its way: show the page's shape, not a 404.
  if (years.length === 0 && !ready) {
    return (
      <div className="pq-page-wrap">
        <BackLink to={home}>Back to Dashboard</BackLink>
        <h1 style={{ marginBottom: 4 }}>{courseLabel}</h1>
        <Skeleton width={240} height={14} style={{ marginTop: 10 }} />
        <PaperCardsSkeleton label={`Loading ${courseLabel} past questions`} />
      </div>
    )
  }

  if (years.length === 0) {
    return (
      <NotFound
        title="404 - Past Question not found"
        message={`No past questions for ${courseLabel || 'this course'} yet. Try browsing other courses.`}
        homeTo={base}
        homeLabel="Browse past questions"
      />
    )
  }

  return (
    <div className="pq-page-wrap">
     <ScrollToTop />
      <BackLink to={home}>Back to Dashboard</BackLink>

      <h1 style={{ marginBottom: 4 }}>{courseLabel}</h1>
      {course?.title && <p className="muted" style={{ marginTop: 0 }}>{course.title}</p>}

      <div className="pq-cards">
        {years.map((year) => (
          <YearCard
            key={year}
            courseCode={courseCode}
            courseLabel={courseLabel}
            year={year}
            paper={course.years[year]}
          />
        ))}
      </div>

      <LynklensAd variant="footer" />
    </div>
  )
}
