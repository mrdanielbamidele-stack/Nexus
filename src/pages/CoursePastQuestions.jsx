import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { getCoursePQ, getAvailableYears, formatYear } from '../lib/pastQuestions'
import { formatCode } from '../lib/courseSlug'
import { loadPQResults } from '../lib/pqResults'
import PQAttemptReview from '../components/PQAttemptReview'
import NotFound from './NotFound'
import './PastQuestions.css'
import ScrollToTop from '../components/ScrollToTop';

async function downloadPdf(url, filename, setBusy) {
  setBusy(true)
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
  } catch {
    // The blob fetch can fail (file not uploaded yet / CORS). Try a plain open
    // so a hosted PDF still works; otherwise let the user know.
    const opened = window.open(url, '_blank')
    if (!opened) alert('This past question PDF is not available yet.')
  } finally {
    setBusy(false)
  }
}

function YearCard({ courseCode, courseLabel, year, quiz }) {
  const navigate = useNavigate()
  const session = quiz.session || formatYear(year)
  const hasQuiz = Array.isArray(quiz.questions) && quiz.questions.length > 0
  
  const [mode, setMode] = useState(hasQuiz ? null : 'pdf') // 'grade' | 'pdf'
  const [busy, setBusy] = useState(false)

  function download() {
    downloadPdf(quiz.pdfUrl, `${courseLabel} ${session}.pdf`, setBusy)
  }

  function go() {
    if (!mode) return
    if (mode === 'grade') navigate(`/pastquestions/${courseCode}/${year}`)
    else download()
  }

  // PDF-only year: skip the mode selector and just offer the download.
  if (!hasQuiz) {
    return (
       <div className="pq-card">
      <strong className="pq-card-title">{courseLabel} - {session}</strong>

      <div className="pq-mode-selector">
        <button
          type="button"
          className={`pq-mode-btn${mode === 'pdf' ? ' selected' : ''}`}
          onClick={() => setMode('pdf')}
        >
          <span className="pq-mode-text">
            <span className="pq-mode-label">Download the PDF</span>
            <span className="pq-mode-desc">Save the question paper to your device</span>
          </span>
          <span className="pq-radio-dot" />
        </button>
      </div>

      <button className="pq-go-btn" disabled={!mode || busy} onClick={go}>
       Download Pdf
      </button>
    </div>
    )
  }

  const goLabel = busy
    ? 'Preparing…'
    : mode === 'grade'
      ? 'Start Quiz'
      : mode === 'pdf'
        ? 'Download PDF'
        : 'Select an option above'

  return (
    <div className="pq-card">
      <strong className="pq-card-title">{courseLabel} - {session}</strong>

      <div className="pq-mode-selector">
        <button
          type="button"
          className={`pq-mode-btn${mode === 'grade' ? ' selected' : ''}`}
          onClick={() => setMode('grade')}
        >
          <span className="pq-mode-text">
            <span className="pq-mode-label">Answer &amp; Get Graded</span>
            <span className="pq-mode-desc">Interactive quiz with instant feedback</span>
          </span>
          <span className="pq-radio-dot" />
        </button>

        <button
          type="button"
          className={`pq-mode-btn${mode === 'pdf' ? ' selected' : ''}`}
          onClick={() => setMode('pdf')}
        >
          <span className="pq-mode-text">
            <span className="pq-mode-label">Download the PDF</span>
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

function ordinalLabel(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function gradeColor(pct) {
  if (pct >= 70) return '#10b981'
  if (pct >= 50) return '#f59e0b'
  return '#ef4444'
}
function gradeBg(pct) {
  if (pct >= 70) return '#f0fdf4'
  if (pct >= 50) return '#fffbeb'
  return '#fef2f2'
}

function AttemptRow({ attempt, session, onClick }) {
  const date = attempt.savedAt
    ? new Date(attempt.savedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
    : ''
  const gc = gradeColor(attempt.pct)
  const gb = gradeBg(attempt.pct)
  const canReview = !!(attempt.answers)

  return (
    <div
      onClick={canReview ? onClick : undefined}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', background: '#fff', border: '1.5px solid #e5e7eb',
        borderRadius: 10, marginBottom: 8, gap: 12,
        cursor: canReview ? 'pointer' : 'default',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>
          {ordinalLabel(attempt.attemptNumber)} attempt · {session}
        </div>
        {date && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{date}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{attempt.score}/{attempt.total}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>{attempt.pct}%</div>
        </div>
        <div style={{
          width: 34, height: 34, borderRadius: 8,
          background: gb, color: gc,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 15,
        }}>
          {attempt.grade}
        </div>
        {canReview && <span style={{ color: '#9ca3af', fontSize: 18 }}>›</span>}
      </div>
    </div>
  )
}

export default function CoursePastQuestions() {
  const { courseCode } = useParams()
  const [reviewing, setReviewing] = useState(null) // { year, attempt }

  const course = getCoursePQ(courseCode)
  const years = getAvailableYears(courseCode)
  const courseLabel = formatCode(course?.code || courseCode)

  useEffect(() => {
    document.title = `${courseLabel} Past Questions`
  }, [courseLabel])

  if (years.length === 0) {
    return (
      <NotFound
        title="404 - Course not found"
        message={`No past questions for ${courseLabel || 'this course'} yet. Try browsing other courses.`}
        homeTo="/pastquestions"
        homeLabel="Browse past questions"
      />
    )
  }

  // Show review overlay when an attempt is selected.
  if (reviewing) {
    return (
      <PQAttemptReview
        courseCode={courseCode}
        courseLabel={courseLabel}
        year={reviewing.year}
        attempt={reviewing.attempt}
        onBack={() => setReviewing(null)}
      />
    )
  }

  // Gather all attempts grouped by year, newest first within each year.
  const attemptsByYear = {}
  years.forEach(year => {
    const attempts = loadPQResults(courseCode, year)
    if (attempts.length > 0) attemptsByYear[year] = [...attempts].reverse()
  })
  const hasAnyAttempts = Object.keys(attemptsByYear).length > 0

  return (
    <>
     <ScrollToTop />
      <nav className="nx-breadcrumb nx-fixed" aria-label="breadcrumb">
                   <ScrollToTop />
                   <Link className="nx-bc-item" to="/pastquestions">
                     <span className="nx-bc-home-dot"></span>
                     Past Questions
                   </Link>
                   <span className="nx-bc-sep">/</span>
                   <span className="nx-bc-item nx-bc-current">
                      {courseLabel}
                   </span>
        </nav>

      <h1 style={{ marginBottom: 4 , marginTop: 25 }}>{courseLabel} Past Questions</h1>
      {course?.title && <p className="muted" style={{ marginTop: 0 }}>{course.title}</p>}

      <div className="pq-cards">
        {years.map((year) => (
          <YearCard
            key={year}
            courseCode={courseCode}
            courseLabel={courseLabel}
            year={year}
            quiz={course.years[year]}
          />
        ))}
      </div>

      {hasAnyAttempts && (
        <div style={{ marginTop: 36 }}>
          <div style={{
            fontSize: 17, fontWeight: 700,
            paddingBottom: 8, borderBottom: '2px solid #e5e7eb', marginBottom: 20,
          }}>
            Past Attempts
          </div>
          {years.filter(y => attemptsByYear[y]).map(year => (
            <div key={year} style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: 13, fontWeight: 700, color: '#7c3aed',
                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10,
              }}>
                {course?.years?.[year]?.session || formatYear(year)}
              </div>
              {attemptsByYear[year].map((attempt, i) => (
                <AttemptRow
                  key={i}
                  attempt={attempt}
                  session={course?.years?.[year]?.session || formatYear(year)}
                  onClick={() => setReviewing({ year, attempt })}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
