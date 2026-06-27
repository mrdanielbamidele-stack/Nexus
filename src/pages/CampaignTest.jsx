import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router'
import { campaignTests } from '../data/campaignTests'
import { campaignEssays } from '../data/campaignEssays'
import { courseWarnings } from '../data/campaignWarnings'
import CampaignEssayTest from './CampaignEssayTest'
import PreTestWarning from './PreTestWarning'
import {
  loadCampaign,
  recordResult,
  saveCourseResult,
  getLetterGrade,
  testKey,
  resolveBatch,
  startFreshBatch,
  saveBatchAnswers,
} from '../lib/campaign'
import { downloadScoreCard } from '../lib/scoreImage'
import { useStudyTimer } from '../lib/useStudyTimer'
import { useCountdownTimer } from '../lib/useCountdownTimer'
import { formatDuration, getCourseDuration } from '../lib/campaignTimer'
import TaskEngine from '../utils/taskEngine'
import ExamTimer from '../components/ExamTimer'
import CampaignBreadcrumb from '../components/CampaignBreadcrumb'
import NotFound from './NotFound'
import { formatCode } from '../lib/courseSlug'
import './CampaignTest.css'
import ScrollToTop from '../components/ScrollToTop'

const GRADE_WORD = { A: 'Excellent', B: 'Good', C: 'Average', D: 'Pass', E: 'Marginal', F: 'Fail' }

// Shown when the student lands on a completed course's test URL without having
// pressed "Retake Test" on the campaign page (e.g. reload, direct URL, bookmark).
// Prevents resolveBatch / markAttemptStart from wiping the score on accident.
function RetakeConfirmGate({ courseCode, onConfirm, onReview }) {
  return (
    <div className="ct-page">
      <ScrollToTop />
      <CampaignBreadcrumb courseCode={courseCode} />
      <div className="ct-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div style={{
          background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 20,
          padding: '40px 32px', maxWidth: 460, width: '100%', textAlign: 'center',
          boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
        }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
            Redo {formatCode(courseCode)} Test?
          </div>
          <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, margin: '0 0 28px' }}>
            You have already completed this test. Starting again will begin a fresh attempt.
            Would you like to retake it, or go back to review your past results?
          </p>
          <div className="ct-btn-row">
            <button className="ct-btn ct-btn-primary" onClick={onConfirm}>
              Yes, Retake Test
            </button>
            <button className="ct-btn ct-btn-outline" onClick={onReview}>
              No, Review Past Results
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Route entry point: guard completed courses before any test component mounts
// (resolveBatch and markAttemptStart wipe the score on first render, so the
// gate must sit here - not inside McqTest / CampaignEssayTest).
export default function CampaignTest() {
  const { courseCode } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const key     = testKey(courseCode)
  const warning = courseWarnings[key]

  // Resolve the canonical code and completion status once at mount.
  const [canonicalCode] = useState(() => {
    const camp = loadCampaign()
    if (camp) {
      const match = Object.keys(camp.courses).find(c => testKey(c) === key)
      if (match) return match
    }
    return courseCode
  })

  // Skip the gate when:
  //   - The user pressed "Yes, Retake" on the Campaign card modal (fromCampaignRetake flag).
  //   - The course is not yet completed (not_started / in_progress).
  // Show the gate when the user lands here via reload, bookmark, or direct URL
  // while the course is already completed — preventing a silent score wipe.
  const [retakeConfirmed, setRetakeConfirmed] = useState(() => {
    if (location.state?.fromCampaignRetake) return true
    const camp = loadCampaign()
    if (!camp) return true
    return camp.courses[canonicalCode]?.status !== 'completed'
  })

  const [acknowledged, setAcknowledged] = useState(!warning)

  // 1. Retake gate - must be first so neither test nor its side-effects mount.
  if (!retakeConfirmed) {
    return (
      <RetakeConfirmGate
        courseCode={canonicalCode}
        onConfirm={() => setRetakeConfirmed(true)}
        onReview={() => navigate('/campaign', { state: { scrollToReview: true } })}
      />
    )
  }

  // 2. Render the test behind the overlay — timer is gated on `acknowledged`.
  const testEl = campaignEssays[key]
    ? <CampaignEssayTest />
    : <McqTest acknowledged={acknowledged} />

  if (!acknowledged && warning) {
    return (
      <>
        {testEl}
        <PreTestWarning
          warning={warning}
          onStart={() => setAcknowledged(true)}
        />
      </>
    )
  }

  return testEl
}

// Shown for courses that don't have a question bank yet (stubs + essay-only).
function ComingSoon({ code }) {
  return (
    <NotFound
      title="404 - Test not found"
      message={`The test for ${formatCode(code) || 'this course'} isn't available yet. Check back soon!`}
      homeTo="/campaign"
      homeLabel="Back to Campaign"
    />
  )
}

function McqTest({ acknowledged = true }) {
  const { courseCode } = useParams()
  const navigate = useNavigate()
  const key  = testKey(courseCode)
  const test = campaignTests[key]

  // Resolve the canonical catalog code (e.g. "TUM-GES 103") from the active
  // campaign so results are recorded against the right course entry.
  const canonicalCode = useMemo(() => {
    const campaign = loadCampaign()
    if (campaign) {
      const match = Object.keys(campaign.courses).find(c => testKey(c) === key)
      if (match) return match
    }
    return test?.code || courseCode
  }, [key, test, courseCode])

  // Locked question batch. resolveBatch persists the chosen question indices so
  // leaving and returning shows the SAME set (not a freshly reshuffled one).
  // It also flips the course status (not_started/completed -> in_progress).
  const [batch, setBatch] = useState(() =>
    test ? resolveBatch(key, test, canonicalCode) : { indices: [], answers: {} }
  )
  const pool = useMemo(
    () => (test ? batch.indices.map(i => test.questions[i]) : []),
    [batch, test]
  )

  const [answers, setAnswers]         = useState(() => batch.answers || {})  // { [poolIndex]: optionIndex }
  const [submitted, setSubmitted]     = useState(false)
  const [result, setResult]           = useState(null)
  const [downloading, setDownloading] = useState(false)

  // Study clock -runs while answering, pauses on idle / hidden tab.
  const { elapsed } = useStudyTimer(canonicalCode, !submitted && acknowledged)

  // Exam countdown -fixed wall-clock duration per course; auto-submits at 0.
  const examDuration = getCourseDuration(canonicalCode)
  const { remaining, reset: resetCountdown } = useCountdownTimer(
    canonicalCode,
    examDuration,
    test && !submitted && acknowledged,
    () => { if (!submitted) handleSubmit() },
  )

  useEffect(() => {
    document.title = test ? `${formatCode(canonicalCode)} – Test` : 'Nexus'
  }, [test, canonicalCode])

  // ── Task tracking: log this attempt under "Continue Studying" ───────────────
  useEffect(() => {
    if (!test) return
    TaskEngine.open(canonicalCode, 'Campaign', `/campaign/${courseCode}`, test.title, pool.length, 'quiz')
  }, [test, canonicalCode, courseCode, pool.length])

  useEffect(() => {
    if (!test || submitted) return
    TaskEngine.updateProgress(canonicalCode, 'Campaign', Object.keys(answers).length, pool.length)
  }, [answers, submitted, test, canonicalCode, pool.length])

  if (!test) {
    return <ComingSoon code={courseCode} />
  }

  const answeredCount = Object.keys(answers).length
  const progressPct   = Math.round((answeredCount / pool.length) * 100)

  function choose(qi, oi) {
    if (submitted) return
    setAnswers(prev => {
      const next = { ...prev, [qi]: oi }
      saveBatchAnswers(key, next)   // resume a half-finished attempt after a reload
      return next
    })
  }

  function handleSubmit() {
    let score = 0
    pool.forEach((q, i) => { if (answers[i] === q.answer) score++ })
    const pct   = Math.round((score / pool.length) * 100)
    const grade = getLetterGrade(pct)

    const resultData = {
      courseCode:  canonicalCode,
      courseTitle: test.title,
      score,
      total: pool.length,
      pct,
      grade,
      savedAt: new Date().toISOString(),
      type: 'mcq',
      questions: pool.map((q, i) => {
        const chosen = i in answers ? answers[i] : null
        return {
          q:           q.q,
          options:     q.options,
          correct:     q.answer,
          chosen,
          isCorrect:   chosen === q.answer,
          explanation: q.explanation,
        }
      }),
    }

    saveCourseResult(canonicalCode, resultData)   // for "Review Answers"
    recordResult(canonicalCode, pct)              // updates campaign GPA
    TaskEngine.complete(canonicalCode, 'Campaign', pct)

    setResult({ score, total: pool.length, pct, grade })
    setSubmitted(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function retake() {
    const indices = startFreshBatch(key, test, canonicalCode)  // new batch + back to In Progress
    setBatch({ indices, answers: {} })
    setAnswers({})
    setSubmitted(false)
    setResult(null)
    resetCountdown()   // fresh exam clock for the new attempt
    // Reset the tracked task so it re-appears as a fresh in-progress attempt.
    TaskEngine.clear(canonicalCode, 'Campaign')
    TaskEngine.open(canonicalCode, 'Campaign', `/campaign/${courseCode}`, test.title, indices.length, 'quiz')
    window.scrollTo({ top: 0 })
  }

  async function handleDownload() {
    if (!result) return
    setDownloading(true)
    try {
      const correct = pool.filter((q, i) => answers[i] === q.answer).length
      const wrong   = pool.filter((q, i) => i in answers && answers[i] !== q.answer).length
      const skipped = pool.length - correct - wrong
      await downloadScoreCard({
        courseCode:  canonicalCode,
        courseTitle: test.title,
        score: result.score,
        total: result.total,
        pct:   result.pct,
        grade: result.grade,
        gradeWord: GRADE_WORD[result.grade],
        studentName: localStorage.getItem('username') || '',
        stats: [
          { label: 'Correct', value: correct, color: '#34d399' },
          { label: 'Wrong',   value: wrong,   color: '#f87171' },
          { label: 'Skipped', value: skipped, color: '#cbd5e1' },
        ],
      })
    } catch (e) {
      console.error('Score image failed:', e)
      alert('Could not generate the score image.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="ct-page">
      <ScrollToTop />
      <div className="ct-wrapper" >
        <CampaignBreadcrumb courseCode={canonicalCode} />
        {/* Exam header */}
        <div className="ct-exam-header">
          <div className="ct-exam-uni">
            <div className="ct-exam-logo"><img src="/logo.png" alt="" width={40}/></div>
            <div>
              <h1>Topfaith University</h1>
              <p>Mkpatak, Akwa Ibom State, Nigeria</p>
            </div>
          </div>
          <div className="ct-exam-meta">
            <div className="ct-meta-item"><span>Course:</span><strong>{formatCode(canonicalCode)}</strong></div>
            <div className="ct-meta-item"><span>Title:</span><strong>{test.title}</strong></div>
            <div className="ct-meta-item"><span>Questions:</span><strong>{pool.length}</strong></div>
            <div className="ct-meta-item">
              <span>{submitted ? 'Time spent:' : 'Time left:'}</span>
              <strong>
                {submitted ? formatDuration(elapsed) : formatDuration(remaining)}
              </strong>
            </div>
          </div>
        </div>

        {/* Floating exam countdown with 30-min and 5-min warnings */}
        <ExamTimer remaining={remaining} hidden={submitted} />

        {/* Score banner (after submit) */}
        {submitted && result && (
          <div className="ct-score-box">
            <div>
              <div className="ct-score-main">{result.score} <span>/ {result.total}</span></div>
              <div className="ct-score-pct">{result.pct}% · Grade: {result.grade}</div>
            </div>
            <div className="ct-score-grade">{result.grade}</div>
          </div>
        )}

        {/* Progress (before submit) */}
        {!submitted && (
          <div className="ct-progress">
            <div className="ct-progress-label">
              <span>Question Progress</span>
              <span>{answeredCount} / {pool.length} answered</span>
            </div>
            <div className="ct-progress-track">
              <div className="ct-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}

        {/* Questions */}
        <div>
          {pool.map((q, qi) => {
            const chosen  = qi in answers ? answers[qi] : null
            const correct = submitted && chosen === q.answer
            return (
              <div className={`ct-qcard ${submitted ? (correct ? 'correct' : chosen === null ? 'not-attempted' : 'wrong') : ''}`} key={qi}>
                <div className="ct-qnum">Question {qi + 1} of {pool.length}</div>
                <div className="ct-qtext">{q.q}</div>
                <div className="ct-options">
                  {q.options.map((opt, oi) => {
                    const isChosen = chosen === oi
                    const isRight  = q.answer === oi
                    let stateCls = ''
                    if (submitted) {
                      if (isRight) stateCls = 'is-correct'
                      else if (isChosen) stateCls = 'is-wrong'
                    } else if (isChosen) {
                      stateCls = 'is-selected'
                    }
                    return (
                      <label
                        key={oi}
                        className={`ct-option ${stateCls}`}
                        onClick={() => choose(qi, oi)}
                      >
                        <span className="ct-opt-letter">{String.fromCharCode(65 + oi)}</span>
                        <span className="ct-opt-text">{opt}</span>
                      </label>
                    )
                  })}
                </div>
                {submitted && (
                  <div className={`ct-feedback ${correct ? 'ok' : 'bad'}`}>
                    {correct ? (
                      <strong>✓ Correct!</strong>
                    ) : (
                      <strong>
                        ✗ {chosen === null ? 'No answer selected.' : 'Incorrect.'} Correct answer:&nbsp;
                        {String.fromCharCode(65 + q.answer)}. {q.options[q.answer]}
                      </strong>
                    )}
                    {q.explanation && <span className="ct-explain">{q.explanation}</span>}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Buttons */}
        <div className="ct-btn-row">
          {!submitted ? (
            <>
              <button className="ct-btn ct-btn-primary" onClick={handleSubmit} disabled={answeredCount === 0}>
                <i className="fa-solid fa-paper-plane" /> Submit Answers
              </button>
              {answeredCount === 0 && (
                <span className="ct-submit-hint">Answer at least one question to submit</span>
              )}
            </>
          ) : (
            <>
              <button className="ct-btn ct-btn-primary" onClick={handleDownload} disabled={downloading}>
                <i className="fa-solid fa-download" /> {downloading ? 'Preparing…' : 'Download Score'}
              </button>
              <button className="ct-btn ct-btn-outline" onClick={retake}>
                <i className="fa-solid fa-rotate-left" /> Retake Test
              </button>
              <button className="ct-btn ct-btn-accent" onClick={() => navigate('/campaign')}>
                <i className="fa-solid fa-arrow-left" /> Back to Campaign
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
