// eslint-disable-next-line no-unused-vars
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router'
import { getCourseOS, getLevel, getEffectiveCourses } from '../lib/studentCourses'
import { testKey, loadCourseResult, clearCampaignArtifacts } from '../lib/campaign'
import {   resetCampaignTime } from '../lib/campaignTimer'
import AttemptReview from '../components/AttemptReview'
import ScrollToTop from '../components/ScrollToTop'

// ── localStorage helpers (extracted from hi.js) ───────────────────────────────

const CAMPAIGN_KEY         = 'nexus_campaign'
const CAMPAIGN_HISTORY_KEY = 'nexus_campaign_history'

function loadCampaign() {
  try { return JSON.parse(localStorage.getItem(CAMPAIGN_KEY)) || null }
  catch { return null }
}
function saveCampaign(data) {
  localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(data))
}
function clearCampaign() {
  localStorage.removeItem(CAMPAIGN_KEY)
}
function loadHistory() {
  try { return JSON.parse(localStorage.getItem(CAMPAIGN_HISTORY_KEY)) || [] }
  catch { return [] }
}
function archiveCampaign() {
  const campaign = loadCampaign()
  if (!campaign) return
  campaign.endedAt = new Date().toISOString()
  const history = loadHistory()
  history.push(campaign)
  localStorage.setItem(CAMPAIGN_HISTORY_KEY, JSON.stringify(history))
}
function clearHistory() {
  localStorage.removeItem(CAMPAIGN_HISTORY_KEY)
}

// ── Grade helpers ─────────────────────────────────────────────────────────────

function getLetterGrade(score) {
  if (score === null || score === undefined) return '–'
  if (score >= 70) return 'A'
  if (score >= 60) return 'B'
  if (score >= 50) return 'C'
  if (score >= 45) return 'D'
  if (score >= 40) return 'E'
  return 'F'
}
function getGradePoint(letter) {
  return { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 }[letter] ?? 0
}
function calcWeightedGPA(campaign) {
  let pts = 0, credits = 0
  Object.values(campaign.courses).forEach(c => {
    if (c.status === 'completed') {
      pts     += getGradePoint(getLetterGrade(c.score)) * c.creditHours
      credits += c.creditHours
    }
  })
  return credits === 0 ? '0.00' : (pts / credits).toFixed(2)
}
function getScoreColor(score) {
  if (score >= 70) return '#10b981'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

// ── Start campaign ────────────────────────────────────────────────────────────

function startNewCampaign() {
  const courseOS = getCourseOS()
  const level    = getLevel()
  const courses  = getEffectiveCourses()

  if (courses.length === 0) {
    alert('Could not load course list. Please set your department and level in Settings.')
    return null
  }

  // Fresh campaign -wipe previous attempts, question batches and the study timer.
  clearCampaignArtifacts()
  resetCampaignTime()

  const courseMap = {}
  courses.forEach(c => {
    courseMap[c.code] = {
      title:       c.title,
      creditHours: c.creditHours || 1,
      status:      'not_started',
      score:       null,
      completedAt: null
    }
  })

  const campaign = {
    active:    true,
    courseOS,
    level,
    startedAt: new Date().toISOString(),
    courses:   courseMap
  }
  saveCampaign(campaign)
  return campaign
}

// ── Sub-components ────────────────────────────────────────────────────────────

// Course card used in an active campaign
function CourseCard({ code, course }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const navigate = useNavigate()

  const letter = getLetterGrade(course.score)
  const grade  = course.score !== null ? `${course.score}% ·  ${letter}` : ''

  let badgeText, badgeClass, btnLabel, cardClass
  if (course.status === 'completed') {
    badgeText = '';  badgeClass = 'badge-done';     btnLabel = 'Retake Test';  cardClass = 'card-done'
  } else if (course.status === 'in_progress') {
    badgeText = ''; badgeClass = 'badge-progress'; btnLabel = 'Continue Test'; cardClass = 'card-progress'
  } else {
    badgeText = ''; badgeClass = 'badge-new'; btnLabel = 'Start Test'; cardClass = ''
  }

  const testUrl = `/campaign/${testKey(code)}`

  return (
    <div className={`card ${cardClass}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>{code}</strong>
        <span className={`badge ${badgeClass}`}>{badgeText}</span>
      </div>
      <div className="course-title">{course.title}</div>

      {course.score !== null && (
        <>
          <div className="progress" style={{ margin: '-4px 0 3px' }}>
            <span style={{ width: `${course.score}%`, background: getScoreColor(course.score) }} />
          </div>
          <div style={{ marginTop: 2 }}>
            <span style={{
              display: 'inline-block',
              fontSize: 13, fontWeight: 700,
              color: '#7c3aed', background: '#f5f3ff',
              border: '1px solid #e9d5ff',
              borderRadius: 999, padding: '2px 10px', marginBottom: '6px'
            }}>{grade}</span>
          </div>
        </>
      )}

      {/* Completed courses ask before retaking; others navigate directly */}
      {course.status === 'completed' ? (
        <button style={{ marginTop: 'auto' }} onClick={() => setShowConfirm(true)}>
          {btnLabel}
        </button>
      ) : (
        <Link to={testUrl} style={{ textDecoration: 'none' }}>
          <button style={{ marginTop: 'auto' }}>{btnLabel}</button>
        </Link>
      )}

      {/* Retake confirmation dialog */}
      {showConfirm && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            style={{
              background: '#fff', borderRadius: 20, padding: '32px 28px 26px',
              maxWidth: 400, width: '100%', textAlign: 'center',
              boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
              animation: 'camp-modal-in 0.2s cubic-bezier(0.34,1.56,0.64,1)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 10 }}>
              Redo {code} Test?
            </div>
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, marginBottom: 24 }}>
              This will start a fresh attempt. If you just want to review your past results, choose the option below.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => { setShowConfirm(false); navigate(testUrl, { state: { fromCampaignRetake: true } }) }}
                style={{
                  background: '#7c3aed', color: '#fff', border: 'none',
                  borderRadius: 10, padding: '10px 22px', fontWeight: 700,
                  fontSize: 14, cursor: 'pointer',
                }}
              >
                Yes, Retake
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false)
                  document.getElementById('review-campaign-past-results')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }}
                style={{
                  background: '#f3f4f6', color: '#374151', border: 'none',
                  borderRadius: 10, padding: '10px 22px', fontWeight: 700,
                  fontSize: 14, cursor: 'pointer',
                }}
              >
                No, Review Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// GPA readiness widget shown when 3+ courses are done
function ReadinessWidget({ campaign }) {
  const gpa     = calcWeightedGPA(campaign)
  const done    = Object.entries(campaign.courses).filter(([, c]) => c.status === 'completed')
  const recent  = done.slice(-3)
  const total   = Object.keys(campaign.courses).length
  const doneCount = done.length
  console.log(total)
//Come back here my friend 
  return (
    <div className="campaign-widget">
      <div className="widget-left">
        <h2>Semester Readiness</h2>
        <p>You&apos;ve completed {doneCount} courses. Keep going to improve your GPA!</p>
        <div className="gpa-big">
          <span style={{fontSize:'48px', fontWeight: 800 , lineHeight:1 , color:'#7c3aed'}}>{gpa}</span>
            <span style={{fontSize:'18px' , color:'#9ca3af'}}>/ 5.0</span>
        </div>
      </div>
      <div className="readiness-card">
        <div className="readiness-header">Recent Results</div>
        {recent.map(([code, c]) => (
          <div className="mini-course-row" key={code}>
            <div className="mini-course-name">
              {code} <span style={{ fontWeight: 'bold', color: '#7c3aed' }}>[{getLetterGrade(c.score)}]</span>
            </div>
            <div className="mini-progress-track">
              <div className="mini-progress-fill" style={{ width: `${c.score ?? 0}%` }} />
            </div>
          </div>
        ))}
        <div className="divider" />
        <div className="stats-footer">
          <div>
            <div className="gpa-label">Weighted GPA</div>
            <div className="gpa-score">{gpa} / 5.0</div>
          </div>
          <div
            className="circle-chart"
            style={{ background: `conic-gradient(#7c3aed 0% ${(gpa / 5) * 100}%, #e5e7eb ${(gpa / 5) * 100}% 100%)` }}
          >
            <div className="circle-inner">{gpa}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Active campaign screen
function ActiveCampaign({ campaign, onEnd }) {
  const [reviewing, setReviewing] = useState(null)
  const location = useLocation()

  // Scroll to Review Past Results when returning from a test via "No, Review Results"
  useEffect(() => {
    if (location.state?.scrollToReview) {
      const el = document.getElementById('review-campaign-past-results')
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 150)
      }
    }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const entries    = Object.entries(campaign.courses)
  const done       = entries.filter(([, c]) => c.status === 'completed')
  const inProgress = entries.filter(([, c]) => c.status === 'in_progress')
  const notStarted = entries.filter(([, c]) => c.status === 'not_started')
  const doneCount  = done.length
  const total      = entries.length
  const pct        = Math.round((doneCount / total) * 100)
  const showWidget = doneCount >= 3

  const gpa        = calcWeightedGPA(campaign)
  const perfectGpa = parseFloat(gpa) >= 5 && doneCount === total && total > 0

  // Every saved attempt across all courses, newest first.
  const attempts = []
  entries.forEach(([code, c]) => {
    loadCourseResult(code).forEach((attempt, idx) => {
      attempts.push({ code, title: c.title, attempt, idx })
    })
  })
  attempts.sort((a, b) => new Date(b.attempt.savedAt) - new Date(a.attempt.savedAt))

  function handleEnd() {
    if (confirm('End this campaign? Your results will be saved to Past Campaigns.')) {
      onEnd()
    }
  }

  if (reviewing) {
    return (
      <AttemptReview
        code={reviewing.code}
        attempt={reviewing.attempt}
        onBack={() => setReviewing(null)}
      />
    )
  }

  return (
    <div className="camp-page">
      <ScrollToTop />
      {/* Top bar */}
      <div className="camp-topbar">
        <div>
          <h1 style={{ margin: 0 }}>Campaign Mode</h1>
          <p className="muted" style={{ margin: ' 0 0' }}>
            {campaign.courseOS} · Level {campaign.level} · Started {new Date(campaign.startedAt).toLocaleDateString()}
          </p>
        </div>
        
      </div>

      {/* Overall progress bar */}
      <div className="camp-progress-wrap">
        <div className="camp-progress-label" style={{marginTop:-10}}>
          <span>{doneCount} / {total} courses completed</span>
          <span>{pct}%</span>
        </div>
        <div className="camp-progress-track">
          <div className="camp-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Advisory shown once the weighted GPA hits a perfect 5.0. The campaign is
          never deleted automatically - we only suggest ending it. */}
      {perfectGpa && (
        <div style={{
          background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 14,
          padding: '18px 22px', marginBottom: 20,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: 16, flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontWeight: 700, color: '#166534', marginBottom: 4 }}>
              Perfect 5.0 GPA reached
            </div>
            <div style={{ fontSize: 13, color: '#15803d', lineHeight: 1.5 }}>
              Every graded course is an A. When you&apos;re happy with this campaign you can
              end it and start a new one - nothing is deleted until you choose to.
            </div>
          </div>
          <button className="btn-danger" onClick={handleEnd} style={{ whiteSpace: 'nowrap' }}>
            End &amp; Start New
          </button>
        </div>
      )}

      {showWidget && <ReadinessWidget campaign={campaign} />}


      {inProgress.length > 0 && (
        <div className="camp-section">
          <h2 className="camp-section-title">In Progress</h2>
          <div className="cards">
            {inProgress.map(([code, c]) => <CourseCard key={code} code={code} course={c} />)}
          </div>
        </div>
      )}


      {notStarted.length > 0 && (
        <div className="camp-section">
          <h2 className="camp-section-title">Not Started</h2>
          <div className="cards">
            {notStarted.map(([code, c]) => <CourseCard key={code} code={code} course={c} />)}
          </div>
        </div>
      )}

      {/* Completed */}
      {done.length > 0 && (
        <div className="camp-section" style={{ marginBottom: 20 }}>
          <h2 className="camp-section-title"> Completed</h2>
          <div className="cards">
            {done.map(([code, c]) => <CourseCard key={code} code={code} course={c} />)}
          </div>
        </div>
      )}
      <button className="btn-danger"  style={{ marginTop: 20 }} onClick={handleEnd}>End Campaign  🗑 </button>
      {/* Review Past Results -every saved attempt across all courses */}
      {attempts.length > 0 && (
        <div className="camp-section">
          <h2 className="camp-section-title" id="review-campaign-past-results">
            Review Past Results
          </h2>
          {attempts.map(({ code, title, attempt, idx }) => (
            <PastResultRow
              key={`${code}-${idx}`}
              code={code}
              title={title}
              attempt={attempt}
              onClick={() => setReviewing({ code, attempt })}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// One row in the "Review Past Results" list. No emojis by request.
function PastResultRow({ code, title, attempt, onClick }) {
  const num        = attempt.attemptNumber || 1
  const date       = attempt.savedAt
    ? new Date(attempt.savedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
    : ''
  const gradeColor = attempt.pct >= 70 ? '#10b981' : attempt.pct >= 50 ? '#f59e0b' : '#ef4444'
  const gradeBg    = attempt.pct >= 70 ? '#f0fdf4' : attempt.pct >= 50 ? '#fffbeb' : '#fef2f2'

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px', background: '#fff', border: '1.5px solid #e5e7eb',
        borderRadius: 12, cursor: 'pointer', marginBottom: 10, gap: 12,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {ordinalLabel(num)} {code} Test
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
          {title}{date ? ` · ${date}` : ''}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{attempt.score}/{attempt.total}</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>{attempt.pct}%</div>
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: 8, background: gradeBg, color: gradeColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15,
        }}>
          {attempt.grade}
        </div>
        <span style={{ color: '#9ca3af', fontSize: 18 }}>›</span>
      </div>
    </div>
  )
}

function ordinalLabel(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

// Past campaign history card
function HistoryCard({ entry, onClick }) {
  const gpa   = calcWeightedGPA(entry)
  const done  = Object.values(entry.courses).filter(c => c.status === 'completed').length
  const total = Object.keys(entry.courses).length
  const pct   = Math.round((done / total) * 100)
  const gpaNum = parseFloat(gpa)
  const gpaColor = gpaNum >= 4 ? '#008000' : gpaNum >= 3 ? '#f59e0b' : '#CC0000'
  const startDate = new Date(entry.startedAt).toLocaleDateString()
  const endDate   = entry.endedAt ? new Date(entry.endedAt).toLocaleDateString() : 'N/A'

  return (
    <div className="card" style={{ cursor: 'pointer' }} onClick={onClick}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ fontSize: 14 }}>{entry.courseOS}</strong>
        <span className="badge badge-done">Level {entry.level}</span>
      </div>
      <div className="course-title" style={{ margin: '6px 0 10px' }}>
        <span style={{ fontSize: 12, color: '#6b7280' }}> {startDate} → {endDate}</span>
      </div>
      <div className="progress" style={{ margin: '0 0 4px' }}>
        <span style={{ width: `${pct}%`, background: '#7c3aed' }} />
      </div>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
        {done}/{total} courses · {pct}% complete
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px solid #f3f4f6', paddingTop: 10 }}>
        <div>
          <span style={{ fontSize: 26, fontWeight: 800, color: gpaColor }}>{gpa}</span>
          <span style={{ fontSize: 12, color: '#9ca3af' }}> / 5.0</span>
        </div>
        <span style={{ fontSize: 12, color: '#7c3aed', fontWeight: 600 }}>View </span>
      </div>
    </div>
  )
}

// No campaign screen
function NoCampaign({ onStart }) {
  const history = loadHistory()
  const [viewingIdx, setViewingIdx] = useState(null)

  if (viewingIdx !== null) {
    return <PastCampaignView entry={history[viewingIdx]} onBack={() => setViewingIdx(null)} />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0 60px' }}>
      <div className="camp-empty-card">
        <h2>No Active Campaign</h2>
        <p>A campaign lets you work through all your semester courses one by one, earn grades, and track your readiness GPA.</p>
        <ul className="camp-rules">
          <li>One campaign at a time</li>
          <li>Complete tests to earn grades</li>
          <li>See your weighted GPA update live</li>
          <li>Finish all courses to complete the campaign</li>
        </ul>
        <button className="btn-start-camp" onClick={onStart}>
          Start New Campaign
        </button>
      </div>

      {/* Past campaigns */}
      {history.length > 0 && (
        <div style={{ maxWidth: 700, width: '100%', marginTop: 48 }}>
          <div style={{ fontSize: 17, fontWeight: 700, paddingBottom: 8, borderBottom: '2px solid #e5e7eb', marginBottom: 16 }}>
            Past Campaigns
          </div>
          <div className="cards">
            {[...history].reverse().map((entry, i) => (
              <HistoryCard
                key={i}
                entry={entry}
                onClick={() => setViewingIdx(history.length - 1 - i)}
              />
            ))}
          </div>
          <div style={{ textAlign: 'right', marginTop: 14 }}>
            <button
              onClick={() => { if (confirm('Delete all past campaign history?')) { clearHistory(); window.location.reload() } }}
              style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
            >
              🗑 Clear all history
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Read-only view of a past campaign
function PastCampaignView({ entry, onBack }) {
  const entries   = Object.entries(entry.courses)
  const done      = entries.filter(([, c]) => c.status === 'completed')
  const notDone   = entries.filter(([, c]) => c.status !== 'completed')
  const gpa       = calcWeightedGPA(entry)
  const total     = entries.length
  const doneCount = done.length
  const pct       = Math.round((doneCount / total) * 100)
  const gpaNum    = parseFloat(gpa)
  const gpaColor  = gpaNum >= 4 ? '#10b981' : gpaNum >= 3 ? '#f59e0b' : '#ef4444'

  return (
    <div className="camp-page">
      <div className="camp-topbar">
        <div>
          <h1 style={{ margin: 0 }}>Past Campaign</h1>
          <p className="muted" style={{ margin: '4px 0 0' }}>
            {entry.courseOS} · Level {entry.level}
          </p>
        </div>
        <button className="btn-danger" style={{ color: '#7c3aed', borderColor: '#c4b5fd' }} onClick={onBack}>
          Back
        </button>
      </div>

      <div className="camp-progress-wrap">
        <div className="camp-progress-label">
          <span>{doneCount} / {total} courses completed</span>
          <span>{pct}%</span>
        </div>
        <div className="camp-progress-track">
          <div className="camp-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div style={{ background: '#f5f3ff', borderRadius: 16, padding: '24px 28px', marginBottom: 8 }}>
        <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>FINAL WEIGHTED GPA</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 48, fontWeight: 800, color: gpaColor, lineHeight: 1 }}>{gpa}</span>
          <span style={{ fontSize: 18, color: '#9ca3af' }}>/ 5.0</span>
        </div>
      </div>

      {done.length > 0 && (
        <div className="camp-section">
          <h2 className="camp-section-title">  Completed ({done.length})</h2>
          <div className="cards">
            {done.map(([code, c]) => (
              <div className="card card-done" key={code}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{code}</strong>
                  <span style={{ fontSize: 14, fontWeight: 600 }} className="badge badge-done">{getLetterGrade(c.score)}</span>
                </div>
                <div className="course-title">{c.title}</div>
                {c.score !== null && (
                  <div className="progress" style={{ margin: '8px 0 4px' }}>
                    <span style={{ width: `${c.score}%`, background: getScoreColor(c.score) }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {notDone.length > 0 && (
        <div className="camp-section">
          <h2 className="camp-section-title"> Not Completed ({notDone.length})</h2>
          <div className="cards">
            {notDone.map(([code, c]) => (
              <div className="card" key={code}>
                <strong>{code}</strong>
                <div className="course-title">{c.title}</div>
                <span className="badge badge-new">Skipped</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Campaign page ────────────────────────────────────────────────────────

export default function Campaign() {
  // Load campaign from localStorage into state
  // Re-reading on every render is fine since the quiz pages write to localStorage directly
  const [campaign, setCampaign] = useState(() => loadCampaign())

  // Re-check localStorage when the tab gets focus again
  // (user finishes a quiz in another tab and comes back)
  useEffect(() => {
    function onFocus() {
      setCampaign(loadCampaign())
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  function handleStart() {
    const newCampaign = startNewCampaign()
    if (newCampaign) setCampaign(newCampaign)
  }

  function handleEnd() {
    archiveCampaign()          // snapshot scores into Past Campaigns first
    clearCampaign()
    clearCampaignArtifacts()   // drop per-course attempts / batches
    resetCampaignTime()        // drop the study timer
    setCampaign(null)
  }

  // Show active campaign or the "no campaign" screen
  if (campaign && campaign.active) {
    return <ActiveCampaign campaign={campaign} onEnd={handleEnd} />
  }

  return <NoCampaign onStart={handleStart} />
}