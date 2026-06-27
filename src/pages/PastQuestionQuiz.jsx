import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { useParams, useNavigate , Link} from 'react-router'
import { marked } from 'marked'
import { getQuiz, getCoursePQ, formatYear } from '../lib/pastQuestions'
import { formatCode } from '../lib/courseSlug'
import {
  gradeWrittenWithAI,
  gradeObjective,
  computeWrittenScore,
  getLetterGrade,
} from '../lib/aiGrader'
import { downloadScoreCard } from '../lib/scoreImage'
import { savePQResult } from '../lib/pqResults'
import MathContent from '../components/MathContent'
import TaskEngine from '../utils/taskEngine'
import WaitGame from '../components/WaitGame'
import NotFound from './NotFound'
import './CampaignTest.css'
import './CampaignEssayTest.css'
import './PastQuestions.css'
import ScrollToTop from '../components/ScrollToTop';

const GRADE_WORD = { A: 'Excellent', B: 'Good', C: 'Average', D: 'Pass', E: 'Marginal', F: 'Fail' }
const hasAnswer = (v) => v !== null && v !== undefined && v !== ''

/* ── Lightweight per-attempt answer persistence (resume after reload) ──────── */
function loadAnswers(key) {
  try { return JSON.parse(localStorage.getItem(key)) || {} } catch { return {} }
}
function saveAnswers(key, answers) {
  localStorage.setItem(key, JSON.stringify(answers))
}

/* ── Markdown helpers for past-question content (questions, options, notes) ── */
const mdInline = (s) => ({
  __html: String(s ?? '').split('\n').map(line => marked.parseInline(line)).join('<br>'),
})

function adjustHeight(el) {
  if (!el) return
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

/* ── Exam timer that only counts active, on-screen seconds ───────────────────
   Pauses while the tab is hidden or the window is unfocused (so switching tabs
   or apps stops the clock), persists elapsed time across reloads, fires the
   30-minute and 5-minute warnings, and calls onExpire when time runs out. */
function useExamTimer({ totalSeconds, storageKey, running, onExpire }) {
  const [elapsed, setElapsed] = useState(() => {
    const saved = Number(localStorage.getItem(storageKey))
    return Number.isFinite(saved) && saved > 0 ? saved : 0
  })

  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  // Work out which thresholds were ALREADY crossed at load time. On a fresh
  // page load past a threshold (e.g. a refresh) we don't want to re-announce
  // "30 minutes remaining" as if it just happened - we mark it as already
  // fired and instead show a one-off "Less than X minutes remaining" reminder.
  const firedRef = useRef(null)
  const initWarn = useRef('')
  if (firedRef.current === null) {
    const saved = Number(localStorage.getItem(storageKey))
    const initElapsed = Number.isFinite(saved) && saved > 0 ? saved : 0
    const initRemaining = Math.max(0, totalSeconds - initElapsed)
    const fiveCrossed = totalSeconds > 300 && initRemaining <= 300
    const thirtyCrossed = totalSeconds > 1800 && initRemaining <= 1800
    firedRef.current = { thirty: thirtyCrossed, five: fiveCrossed }
    if (fiveCrossed) initWarn.current = 'Less than 5 minutes remaining!'
    else if (thirtyCrossed) initWarn.current = 'Less than 30 minutes remaining.'
  }

  const [warning, setWarning] = useState(initWarn.current)

  // Whether the page is currently in front of the user (visible + focused).
  const activeRef = useRef(true)
  useEffect(() => {
    const sync = () => {
      activeRef.current = document.visibilityState === 'visible' && document.hasFocus()
    }
    sync()
    document.addEventListener('visibilitychange', sync)
    window.addEventListener('focus', sync)
    window.addEventListener('blur', sync)
    return () => {
      document.removeEventListener('visibilitychange', sync)
      window.removeEventListener('focus', sync)
      window.removeEventListener('blur', sync)
    }
  }, [])

  // Tick once a second, but only while running AND on-screen.
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      if (!activeRef.current) return // off-screen / another tab - don't count
      setElapsed(prev => {
        const next = prev + 1
        localStorage.setItem(storageKey, String(next))
        return next
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running, storageKey])

  const remaining = Math.max(0, totalSeconds - elapsed)

  // Threshold warnings + expiry.
  useEffect(() => {
    if (!running) return
    if (remaining <= 0) { onExpireRef.current?.(); return }
    if (totalSeconds > 300 && remaining <= 300 && !firedRef.current.five) {
      firedRef.current.five = true
      setWarning('5 minutes remaining!')
    } else if (totalSeconds > 1800 && remaining <= 1800 && !firedRef.current.thirty) {
      firedRef.current.thirty = true
      setWarning('30 minutes remaining.')
    }
  }, [remaining, running, totalSeconds])

  // Auto-dismiss each warning after a few seconds.
  useEffect(() => {
    if (!warning) return
    const id = setTimeout(() => setWarning(''), 8000)
    return () => clearTimeout(id)
  }, [warning])

  const reset = () => {
    localStorage.removeItem(storageKey)
    firedRef.current = { thirty: false, five: false }
    setElapsed(0)
    setWarning('')
  }

  return { remaining, warning, dismissWarning: () => setWarning(''), reset }
}

/* Format seconds as H:MM:SS (or M:SS when under an hour). */
function formatTime(total) {
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`
}

/* ══════════════════════════════════════════════════════════════════════════
   Route entry - picks the objective or theory flow.
   ══════════════════════════════════════════════════════════════════════════ */
export default function PastQuestionQuiz() {
  const { courseCode, year } = useParams()
  const navigate = useNavigate()
  const quiz = getQuiz(courseCode, year)
  const course = getCoursePQ(courseCode)

  if (!quiz) {
    return (
      <NotFound
        title="404 - Past question not found"
        message={`No ${formatYear(year)} paper exists for ${formatCode(courseCode) || 'this course'}.`}
        homeTo={`/pastquestions/${courseCode}`}
        homeLabel="Back to course"
      />
    )
  }

  const courseLabel = formatCode(course?.code || courseCode)
  const session = quiz.session || formatYear(year)
  const subject = course?.subject || `${courseLabel} (${course?.title || ''})`

  // PDF-only paper (no question bank) - there's nothing to grade interactively.
  if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    return (
      
        <div className="">
          <h1>{courseLabel} {session}</h1>
          <p>This paper is available as a downloadable PDF only.</p>
          <button className="ct-btn ct-btn-primary" style={{ width: '100px', height: '40px' , fontWeight: '600'}} onClick={() => navigate(`/pastquestions/${courseCode}`)}>
            Back
          </button>
        </div>
     
    )
  }

  const props = { quiz, courseCode, year, courseLabel, session, subject, navigate }

  return quiz.type === 'theory' ? <TheoryQuiz {...props} /> : <ObjectiveQuiz {...props} />
}

/* ══════════════════════════════════════════════════════════════════════════
   Objective - multiple choice, auto-graded with instant feedback.
   ══════════════════════════════════════════════════════════════════════════ */
function ObjectiveQuiz({ quiz, courseCode, year, courseLabel, session, navigate }) {
  const pool = quiz.questions
  const storageKey = `pq-${courseCode}-${year}-answers`
  const timerKey = `pq-${courseCode}-${year}-timer`
  const taskLabel = `${session} Past Questions`
  const taskUrl = `/pastquestions/${courseCode}/${year}`
  const TOTAL = (quiz.durationMins || 60) * 60

  const [answers, setAnswers] = useState(() => loadAnswers(storageKey)) // { [i]: optionIndex }
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [openDetail, setOpenDetail] = useState({}) // { [i]: true }
  const [downloading, setDownloading] = useState(false)

  // Keep the latest handleSubmit reachable from the timer's auto-submit.
  const autoSubmitRef = useRef(null)
  const { remaining, warning, dismissWarning, reset: resetTimer } = useExamTimer({
    totalSeconds: TOTAL,
    storageKey: timerKey,
    running: !submitted,
    onExpire: () => autoSubmitRef.current?.(),
  })
  const timeCls = remaining <= 300 ? 'danger' : remaining <= 600 ? 'warning' : ''

  useEffect(() => { document.title = `${courseLabel} ${session} - Quiz` }, [courseLabel, session])

  // ── Task tracking: log this attempt under "Continue Studying" ───────────────
  useEffect(() => {
    TaskEngine.open(courseLabel, taskLabel, taskUrl, `${courseLabel} ${session} Past Question`, pool.length, 'quiz')
  }, [courseLabel, taskLabel, taskUrl, session, pool.length])

  useEffect(() => {
    if (submitted) return
    TaskEngine.updateProgress(courseLabel, taskLabel, Object.keys(answers).length, pool.length)
  }, [answers, submitted, courseLabel, taskLabel, pool.length])

  const answeredCount = Object.keys(answers).length
  const progressPct = Math.round((answeredCount / pool.length) * 100)

  function choose(qi, oi) {
    if (submitted) return
    setAnswers(prev => {
      const next = { ...prev, [qi]: oi }
      saveAnswers(storageKey, next)
      return next
    })
  }

  function handleSubmit() {
    let score = 0
    pool.forEach((q, i) => { if (answers[i] === q.answer) score++ })
    const pct = Math.round((score / pool.length) * 100)
    const grade = getLetterGrade(pct)
    setResult({ score, total: pool.length, pct, grade })
    setSubmitted(true)
    savePQResult(courseCode, year, { score, total: pool.length, pct, grade, session, type: 'objective', answers })
    TaskEngine.complete(courseLabel, taskLabel, pct)
    localStorage.removeItem(timerKey)
    localStorage.removeItem(storageKey) // saved answers no longer needed once submitted
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  autoSubmitRef.current = handleSubmit

  function retake() {
    localStorage.removeItem(storageKey)
    setAnswers({})
    setOpenDetail({})
    setResult(null)
    setSubmitted(false)
    resetTimer()
    // Reset the tracked task so it re-appears as a fresh in-progress attempt.
    TaskEngine.clear(courseLabel, taskLabel)
    TaskEngine.open(courseLabel, taskLabel, taskUrl, `${courseLabel} ${session} Past Question`, pool.length, 'quiz')
    window.scrollTo({ top: 0 })
  }

  async function handleDownload() {
    if (!result) return
    setDownloading(true)
    try {
      const correct = pool.filter((q, i) => answers[i] === q.answer).length
      const wrong = pool.filter((q, i) => i in answers && answers[i] !== q.answer).length
      const skipped = pool.length - correct - wrong
      await downloadScoreCard({
        courseCode: courseLabel,
        courseTitle: `${quiz.session || session} Past Question`,
        score: result.score, total: result.total, pct: result.pct,
        grade: result.grade, gradeWord: GRADE_WORD[result.grade],
        studentName: localStorage.getItem('username') || '',
        stats: [
          { label: 'Correct', value: correct, color: '#34d399' },
          { label: 'Wrong', value: wrong, color: '#f87171' },
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
    <div className={`ct-page ${!submitted ? 'pq-timerfix' : ''}`}>
      <div className="ct-wrapper">

         <nav className="nx-breadcrumb nx-fixed" aria-label="breadcrumb" style={{ marginBottom: 20 }}>
          <Link className="nx-bc-item" to="/pastquestions">
            <span className="nx-bc-home-dot"></span>
               Past Questions
          </Link>
          <span className="nx-bc-sep">/</span>
          <Link className="nx-bc-item nx-bc-prev" to={`/pastquestions/${courseCode}`}>
            {courseLabel}
          </Link>
          <span className="nx-bc-sep">/</span>
          <span className="nx-bc-item nx-bc-current">
            {formatYear(year)}
          </span>
        </nav>

        {!submitted && (
          <div className="pq-timer-bar">
            <span className="pq-timer-label">⏱ TIME REMAINING</span>
            <span className={`pq-timer-display ${timeCls}`}>{formatTime(remaining)}</span>
          </div>
        )}

        {!submitted && warning && (
          <div className="pq-timer-toast" role="alert" onClick={dismissWarning}>
            {warning}
          </div>
        )}

        <div className="ct-exam-header" style={{marginTop:50}}>
          <div className="ct-exam-uni">
            <div className="ct-exam-logo"><img src="/logo.png" alt="" width={40} /></div>
            <div>
              <h1>Topfaith University</h1>
              <p>Mkpatak, Akwa Ibom State, Nigeria</p>
            </div>
          </div>
          <div className="ct-exam-meta">
            <div className="ct-meta-item"><span>Course:</span><strong>{courseLabel}</strong></div>
            <div className="ct-meta-item"><span>Session:</span><strong>{session}</strong></div>
            <div className="ct-meta-item"><span>Questions:</span><strong>{pool.length}</strong></div>
            <div className="ct-meta-item"><span>Type:</span><strong>Multiple Choice</strong></div>
          </div>
        </div>

        {submitted && result && (
          <div className="ct-score-box">
            <div>
              <div className="ct-score-main">{result.score} <span>/ {result.total}</span></div>
              <div className="ct-score-pct">{result.pct}% · Grade: {result.grade}</div>
            </div>
            <div className="ct-score-grade">{result.grade}</div>
          </div>
        )}

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

        <div>
          {pool.map((q, qi) => {
            const chosen = qi in answers ? answers[qi] : null
            const correct = submitted && chosen === q.answer
            return (
              <div className={`ct-qcard ${submitted ? (correct ? 'correct' : chosen === null ? 'not-attempted' : 'wrong') : ''}`} key={qi}>
                <div className="ct-qnum">Question {qi + 1} of {pool.length}</div>
                {quiz.mathjax
                  ? <MathContent className="ct-qtext" html={q.q} />
                  : <div className="ct-qtext" dangerouslySetInnerHTML={mdInline(q.q)} />}
                <div className="ct-options">
                  {q.options.map((opt, oi) => {
                    const isChosen = chosen === oi
                    const isRight = q.answer === oi
                    let stateCls = ''
                    if (submitted) {
                      if (isRight) stateCls = 'is-correct'
                      else if (isChosen) stateCls = 'is-wrong'
                    } else if (isChosen) {
                      stateCls = 'is-selected'
                    }
                    return (
                      <label key={oi} className={`ct-option ${stateCls}`} onClick={() => choose(qi, oi)}>
                        <span className="ct-opt-letter">{String.fromCharCode(65 + oi)}</span>
                        {quiz.mathjax
                          ? <MathContent as="span" className="ct-opt-text" html={opt} />
                          : <span className="ct-opt-text" dangerouslySetInnerHTML={mdInline(opt)} />}
                      </label>
                    )
                  })}
                </div>

                {submitted && (
                  <>
                    <div className={`ct-feedback ${correct ? 'ok' : 'bad'}`}>
                      {correct ? (
                        <strong>✓ Correct!</strong>
                      ) : (
                        <strong>
                          ✗ {chosen === null ? 'No answer selected.' : 'Incorrect.'} Correct answer:&nbsp;
                          {String.fromCharCode(65 + q.answer)}.{' '}
                          {quiz.mathjax
                            ? <MathContent as="span" html={q.options[q.answer]} />
                            : q.options[q.answer]}
                        </strong>
                      )}
                      {q.explanation && (
                        quiz.mathjax
                          ? <MathContent as="span" html={q.explanation} />
                          : <span dangerouslySetInnerHTML={mdInline(q.explanation)} />
                      )}
                    </div>

                    {q.detailed && (
                      <>
                        <button
                          className="pq-detail-toggle"
                          onClick={() => setOpenDetail(prev => ({ ...prev, [qi]: !prev[qi] }))}
                        >
                          {openDetail[qi] ? 'Hide detailed explanation' : 'Detailed explanation'}
                        </button>
                        {openDetail[qi] && (
                          quiz.mathjax
                            ? <MathContent className="pq-detail" html={marked.parse(q.detailed)} />
                            : <div
                                className="pq-detail"
                                dangerouslySetInnerHTML={{ __html: marked.parse(q.detailed) }}
                              />
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>

        <div className="ct-btn-row">
          {!submitted ? (
            <>
              <button className="ct-btn ct-btn-primary" onClick={handleSubmit} disabled={answeredCount === 0}>Submit Answers</button>
              {answeredCount === 0 && (
                <span className="ct-submit-hint">Answer at least one question to submit</span>
              )}
            </>
          ) : (
            <>
              <button className="ct-btn ct-btn-primary" onClick={handleDownload} disabled={downloading}>
                {downloading ? 'Preparing…' : 'Download Score'}
              </button>
              <button className="ct-btn ct-btn-outline" onClick={retake}>Retake</button>
              <button className="ct-btn ct-btn-accent" onClick={() => navigate(`/pastquestions/${courseCode}`)}>
                Back
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   Theory - essay paper, AI-graded, with a countdown timer.
   ══════════════════════════════════════════════════════════════════════════ */
function TheoryQuiz({ quiz, courseCode, year, courseLabel, session, subject, navigate }) {
  const storageKey = `pq-${courseCode}-${year}-answers`
  const timerKey = `pq-${courseCode}-${year}-timer`
  const taskLabel = `${session} Past Questions`
  const taskUrl = `/pastquestions/${courseCode}/${year}`
  const TOTAL = (quiz.durationMins || 60) * 60

  const [answers, setAnswers] = useState(() => loadAnswers(storageKey)) // { [i]: text }
  const [phase, setPhase] = useState('answering') // answering | grading | graded | error
  const [results, setResults] = useState(null)
  const [score, setScore] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [overAlert, setOverAlert] = useState(false)

  // Keep the latest handleSubmit reachable from the timer's auto-submit.
  const autoSubmitRef = useRef(null)
  const { remaining, warning, dismissWarning, reset: resetTimer } = useExamTimer({
    totalSeconds: TOTAL,
    storageKey: timerKey,
    running: phase === 'answering',
    onExpire: () => autoSubmitRef.current?.(),
  })

  // Auto-resize textarea refs (init heights for saved answers before paint)
  const textareaRefs = useRef({})
  useLayoutEffect(() => {
    Object.values(textareaRefs.current).forEach(el => el && adjustHeight(el))
  }, [])

  // Voice dictation
  const recognitionRef = useRef(null)
  const [recordingQi, setRecordingQi] = useState(null)
  const speechSupported = typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition)

  useEffect(() => { document.title = `${courseLabel} ${session} - Quiz` }, [courseLabel, session])
  useEffect(() => () => { recognitionRef.current?.stop() }, [])

  // ── Task tracking: log this attempt under "Continue Studying" ───────────────
  useEffect(() => {
    TaskEngine.open(courseLabel, taskLabel, taskUrl, `${courseLabel} ${session} Past Question`, quiz.questions.length, 'essay')
  }, [courseLabel, taskLabel, taskUrl, session, quiz.questions.length])

  useEffect(() => {
    if (phase !== 'answering') return
    const answered = quiz.questions.filter((_, i) => hasAnswer(answers[i])).length
    TaskEngine.updateProgress(courseLabel, taskLabel, answered, quiz.questions.length)
  }, [answers, phase, courseLabel, taskLabel, quiz.questions])

  function toggleDictation(qi) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    if (recordingQi === qi) {
      recognitionRef.current?.stop(); recognitionRef.current = null; setRecordingQi(null); return
    }
    recognitionRef.current?.stop()
    const r = new SR()
    r.continuous = false; r.interimResults = false; r.lang = 'en-NG'
    r.onresult = e => {
      const t = (e.results[0][0].transcript || '').trim()
      if (!t) return
      setAnswers(prev => {
        const cur = prev[qi] || ''
        const sp = cur.length > 0 && !/[\s\n]$/.test(cur) ? ' ' : ''
        let ft = t
        if (!/[.!?]$/.test(ft)) ft += '.'
        const next = { ...prev, [qi]: cur + sp + ft + ' ' }
        saveAnswers(storageKey, next)
        return next
      })
    }
    r.onend = () => { setRecordingQi(null); recognitionRef.current = null }
    r.onerror = () => { setRecordingQi(null); recognitionRef.current = null }
    recognitionRef.current = r
    setRecordingQi(qi)
    r.start()
  }

  function setAnswer(qi, v) {
    setAnswers(prev => {
      const next = { ...prev, [qi]: v }
      saveAnswers(storageKey, next)
      return next
    })
  }

  const answeredCount = quiz.questions.filter((_, i) => hasAnswer(answers[i])).length
  const progressPct = Math.round((answeredCount / quiz.questions.length) * 100)

  // Sections where the student answered more than the allowed pick count.
  const sectionCount = (sec) => quiz.questions.reduce((n, q, i) => {
    if (q.section !== sec.id || !hasAnswer(answers[i])) return n
    if (q.type !== 'essay') return n + 1
    return String(answers[i]).trim().length > 0 ? n + 1 : n
  }, 0)
  const overAnswered = (quiz.sections || []).filter(sec =>
    sec.pick !== 'all' && sec.pick != null && sectionCount(sec) > sec.pick
  )

  async function handleSubmit(forced = false) {
    if (!forced && overAnswered.length > 0) {
      setOverAlert(true)
      return
    }
    setPhase('grading')
    setErrorMsg('')
    try {
      const perQuestion = new Array(quiz.questions.length).fill(null)
      const aiItems = []
      quiz.questions.forEach((q, i) => {
        const answered = hasAnswer(answers[i]) && (q.type !== 'essay' || String(answers[i]).trim().length > 0)
        if (!answered) {
          perQuestion[i] = { marksAwarded: 0, maxMarks: q.marks, verdict: 'not-attempted', feedback: '' }
          return
        }
        if (q.type === 'essay') {
          aiItems.push({
            n: i, kind: 'essay', marks: q.marks, text: q.text,
            modelAnswer: q.modelAnswer, rubric: q.rubric,
            studentAnswer: String(answers[i]),
          })
        } else {
          perQuestion[i] = gradeObjective(q, answers[i])
        }
      })

      const aiResults = await gradeWrittenWithAI(subject, aiItems)
      aiItems.forEach(item => {
        const ai = aiResults.find(a => a.n === item.n)
        perQuestion[item.n] = ai
          ? {
            marksAwarded: Math.max(0, Math.min(item.marks, Number(ai.marksAwarded) || 0)),
            maxMarks: item.marks,
            verdict: ai.verdict || 'incorrect',
            feedback: ai.feedback || '',
          }
          : { marksAwarded: 0, maxMarks: item.marks, verdict: 'incorrect', feedback: 'Could not grade this answer.' }
      })

      const finalScore = computeWrittenScore(quiz, perQuestion)
      setResults(perQuestion)
      setScore(finalScore)
      setPhase('graded')
      savePQResult(courseCode, year, {
        score: finalScore.totalAwarded,
        total: finalScore.totalPossible,
        pct: finalScore.percentage,
        grade: finalScore.letterGrade,
        session,
        type: 'theory',
        answers,
        results: perQuestion,
      })
      TaskEngine.complete(courseLabel, taskLabel, finalScore.percentage)
      localStorage.removeItem(timerKey)
      localStorage.removeItem(storageKey) // saved answers no longer needed once submitted
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error('Grading error:', err)
      setErrorMsg(err.message || 'Could not connect to the AI grader.')
      setPhase('error')
    }
  }
  autoSubmitRef.current = () => handleSubmit(true) // timer auto-submit bypasses the pick guard

  function retake() {
    localStorage.removeItem(storageKey)
    setAnswers({})
    setResults(null)
    setScore(null)
    resetTimer()
    setPhase('answering')
    // Reset the tracked task so it re-appears as a fresh in-progress attempt.
    TaskEngine.clear(courseLabel, taskLabel)
    TaskEngine.open(courseLabel, taskLabel, taskUrl, `${courseLabel} ${session} Past Question`, quiz.questions.length, 'essay')
    window.scrollTo({ top: 0 })
  }

  async function handleDownload() {
    if (!score || !results) return
    setDownloading(true)
    try {
      await downloadScoreCard({
        courseCode: courseLabel,
        courseTitle: `${quiz.session || session} Past Question`,
        score: score.totalAwarded, total: score.totalPossible, pct: score.percentage,
        grade: score.letterGrade, gradeWord: GRADE_WORD[score.letterGrade],
        studentName: localStorage.getItem('username') || '',
      })
    } catch (e) {
      console.error('Score image failed:', e)
      alert('Could not generate the score image.')
    } finally {
      setDownloading(false)
    }
  }

  const graded = phase === 'graded'



  const timeDisplay = formatTime(remaining)
  const timeCls = remaining <= 300 ? 'danger' : remaining <= 600 ? 'warning' : ''

  let lastSection = null

  return (
    <div className={`ce-page pq-quiz ${!graded && phase !== 'grading' ? 'pq-timerfix' : ''}`}>

      <div className="ce-wrapper">
        <nav className="nx-breadcrumb nx-fixed" aria-label="breadcrumb" style={{ marginBottom: 20 }}>
          <Link className="nx-bc-item" to="/pastquestions">
            <span className="nx-bc-home-dot"></span>
               Past Questions
          </Link>
          <span className="nx-bc-sep">/</span>
          <Link className="nx-bc-item nx-bc-prev" to={`/pastquestions/${courseCode}`}>
            {courseLabel}
          </Link>
          <span className="nx-bc-sep">/</span>
          <span className="nx-bc-item nx-bc-current">
            {formatYear(year)}
          </span>
        </nav>

        {!graded && phase !== 'grading' && (
          <div className="pq-timer-bar">
            <span className="pq-timer-label">⏱ TIME REMAINING</span>
            <span className={`pq-timer-display ${timeCls}`}>{timeDisplay}</span>
          </div>
        )}

        {!graded && phase !== 'grading' && warning && (
          <div className="pq-timer-toast" role="alert" onClick={dismissWarning}>
            {warning}
          </div>
        )}

        <div className="ce-header" style={{marginTop:50}}>
          <div className="ce-header-uni">
            <div className="ce-header-logo"><img src="/logo.png" width={40} alt="" /></div>
            <div>
              <h1>Topfaith University</h1>
              <p>Mkpatak, Akwa Ibom State, Nigeria</p>
            </div>
          </div>
          <div className="ce-header-meta">
            <div><span>Course:</span><strong>{courseLabel}</strong></div>
            <div><span>Session:</span><strong>{session}</strong></div>
            <div><span>Grading:</span><strong>Nexus AI</strong></div>
          </div>
        </div>

        {graded && score && (
          <div className="ce-score-banner">
            <div>
              <div className="ce-score-num">{score.totalAwarded}<span> / {score.totalPossible}</span></div>
              <div className="ce-score-pct">{score.percentage}%</div>
            </div>
            <div className="ce-grade-badge">
              <div className="ce-grade-letter">{score.letterGrade}</div>
              <div className="ce-grade-word">{GRADE_WORD[score.letterGrade]}</div>
            </div>
          </div>
        )}

        {!graded && (
          <div className="ce-progress">
            <div className="ce-progress-label">
              <span>Answered</span>
              <span>{answeredCount} / {quiz.questions.length}</span>
            </div>
            <div className="ce-progress-track">
              <div className="ce-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}

        {overAlert && (
          <div className="pq-modal-overlay" onClick={() => setOverAlert(false)}>
            <div className="pq-modal-card" onClick={e => e.stopPropagation()}>
              
              <h2 className="pq-modal-title">You cannot submit - Too many questions answered</h2>
              <div className="pq-modal-body">
                {overAnswered.map((s, k) => {
                  const cnt = sectionCount(s)
                  return (
                    <p key={k}>
                      <strong>{s.label}:</strong> you answered {cnt} question{cnt > 1 ? 's' : ''} but only {s.pick} {s.pick > 1 ? 'are' : 'is'} required.
                      Please clear {cnt - s.pick} extra answer{cnt - s.pick > 1 ? 's' : ''} from your textarea{cnt - s.pick > 1 ? 's' : ''} to continue.
                    </p>
                  )
                })}
              </div>
              <button className="pq-modal-ok" onClick={() => setOverAlert(false)}>
                OK
              </button>
            </div>
          </div>
        )}

        {quiz.questions.map((q, i) => {
          const sec = quiz.sections?.find(x => x.id === q.section)
          const showDivider = q.section && q.section !== lastSection
          lastSection = q.section
          const r = graded ? results[i] : null
          const vc = r ? r.verdict : null

          return (
            <div key={i}>
              {showDivider && sec && <div className="ce-section-divider">{sec.label}</div>}

              <div className={`ce-qcard ${vc || ''}`}>
                <div className="ce-qcard-top">
                  <span className="ce-q-label">{q.label || `Question ${i + 1}`}</span>
                  <span className="ce-q-marks">
                    {graded && r ? `${r.marksAwarded} / ${r.maxMarks}` : `${q.marks} mark${q.marks > 1 ? 's' : ''}`}
                  </span>
                </div>

                {q.scenario && <div className="ce-scenario">{q.scenario}</div>}
                {quiz.mathjax
                  ? <MathContent className="ce-qtext" html={q.text} />
                  : <div className="ce-qtext" dangerouslySetInnerHTML={mdInline(q.text)} />}

                {q.type === 'mcq' && (
                  <div className="ce-options">
                    {q.options.map((opt, oi) => {
                      const isChosen = hasAnswer(answers[i]) && Number(answers[i]) === oi
                      const isRight  = q.answer === oi
                      let stateCls = ''
                      if (graded) {
                        if (isRight)       stateCls = 'is-correct'
                        else if (isChosen) stateCls = 'is-wrong'
                      } else if (isChosen) {
                        stateCls = 'is-selected'
                      }
                      return (
                        <label
                          key={oi}
                          className={`ce-option ${stateCls}`}
                          onClick={() => !graded && setAnswer(i, oi)}
                        >
                          <span className="ce-opt-letter">{String.fromCharCode(65 + oi)}</span>
                          <span>{opt}</span>
                        </label>
                      )
                    })}
                  </div>
                )}
                {graded && r && q.type === 'mcq' && (
                  <div className={`ce-mcq-feedback ${r.verdict === 'correct' ? 'ok' : 'bad'}`}>
                    {r.verdict === 'correct' ? (
                      <strong>✓ Correct!</strong>
                    ) : (
                      <strong>
                        ✗ {r.verdict === 'not-attempted' ? 'Not attempted.' : 'Incorrect.'}{' '}
                        Correct answer: {String.fromCharCode(65 + q.answer)}. {q.options[q.answer]}
                      </strong>
                    )}
                    {(r.feedback || q.explanation) && (
                      <span className="ce-explain" dangerouslySetInnerHTML={mdInline(r.feedback || q.explanation)} />
                    )}
                  </div>
                )}

                {!graded && q.type !== 'mcq' && (
                  <>
                    <textarea
                      className="ce-essay-box"
                      placeholder="Type your answer, or use the mic to dictate…"
                      value={answers[i] ?? ''}
                      ref={el => { textareaRefs.current[i] = el }}
                      onChange={e => { setAnswer(i, e.target.value); adjustHeight(e.target) }}
                    />
                    {speechSupported && (
                      <div className="ce-voice-bar">
                        <button
                          type="button"
                          className={`ce-mic-btn ${recordingQi === i ? 'active' : ''}`}
                          onClick={() => toggleDictation(i)}
                        >
                          <i {...(recordingQi === i ? { style: { color: '#ef4444' } } : {})} className="fa-solid fa-microphone" />
                        </button>
                        <span className="ce-mic-status">
                          {recordingQi === i ? 'Listening… tap to stop' : 'Tap mic to dictate'}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {graded && r && q.type !== 'mcq' && r.verdict === 'not-attempted' && (
                  <div className="ce-result">
                    <div className="ce-not-attempted-badge">Question not attempted</div>
                    {q.modelAnswer && (
                      <div className="ce-model-answer">
                        <div className="ce-model-answer-label">Model Answer</div>
                        {quiz.mathjax
                          ? <MathContent className="ce-model-answer-text" html={q.modelAnswer} />
                          : <div className="ce-model-answer-text" dangerouslySetInnerHTML={mdInline(q.modelAnswer)} />}
                      </div>
                    )}
                  </div>
                )}
                {graded && r && q.type !== 'mcq' && r.verdict !== 'not-attempted' && (
                  <div className="ce-result">
                    <div className="ce-result-answer">
                      <span className="ce-result-lbl">Your answer:</span>
                      <div className="ce-result-answer-text">{hasAnswer(answers[i]) ? String(answers[i]) : <em>No answer given</em>}</div>
                    </div>
                    {quiz.mathjax
                      ? <MathContent className="ce-result-fb" html={r.feedback} />
                      : <div className="ce-result-fb" dangerouslySetInnerHTML={mdInline(r.feedback)} />}
                    {q.modelAnswer && (
                      <div className="ce-model-answer">
                        <div className="ce-model-answer-label">Model Answer</div>
                        {quiz.mathjax
                          ? <MathContent className="ce-model-answer-text" html={q.modelAnswer} />
                          : <div className="ce-model-answer-text" dangerouslySetInnerHTML={mdInline(q.modelAnswer)} />}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {phase === 'grading' && <WaitGame />}

        {phase === 'error' && (
          <div className="ce-error">
            <strong> Grading failed.</strong>
            <p>{errorMsg}</p>
            <div className="ce-btn-row">
              <button className="ce-btn ce-btn-outline" onClick={() => setPhase('answering')}>Close</button>
              <button className="ce-btn ce-btn-primary" onClick={handleSubmit}>Retry</button>
            </div>
          </div>
        )}

        {phase === 'answering' && (
          <div className="ce-btn-row">
            <button
              className="ce-btn ce-btn-primary"
              onClick={() => handleSubmit()}
              disabled={answeredCount === 0}
            >
              Submit
            </button>
          </div>
        )}
        {graded && (
          <div className="ce-btn-row">
            <button className="ce-btn ce-btn-primary" onClick={handleDownload} disabled={downloading}>
              {downloading ? 'Preparing…' : 'Download Score'}
            </button>
            <button className="ce-btn ce-btn-outline" onClick={retake}>↺ Retake</button>
            <button className="ce-btn ce-btn-accent" onClick={() => navigate(`/pastquestions/${courseCode}`)}>
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
