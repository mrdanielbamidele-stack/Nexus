import { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router'
import { marked } from 'marked'
import { campaignEssays } from '../data/campaignEssays'
import {
  loadCampaign,
  markAttemptStart,
  recordResult,
  saveCourseResult,
  testKey,
} from '../lib/campaign'
import {
  gradeWrittenWithAI,
  gradeObjective,
  computeWrittenScore,
} from '../lib/aiGrader'
import { downloadScoreCard } from '../lib/scoreImage'
import { useStudyTimer } from '../lib/useStudyTimer'
import { useCountdownTimer } from '../lib/useCountdownTimer'
import { formatDuration, getCourseDuration } from '../lib/campaignTimer'
import TaskEngine from '../utils/taskEngine'
import WaitGame from '../components/WaitGame'
import ExamTimer from '../components/ExamTimer'
import CampaignBreadcrumb from '../components/CampaignBreadcrumb'
import NotFound from './NotFound'
import { formatCode } from '../lib/courseSlug'
import './CampaignEssayTest.css'
import ScrollToTop from '../components/ScrollToTop'

const GRADE_WORD = { A: 'Excellent', B: 'Good', C: 'Average', D: 'Pass', E: 'Marginal', F: 'Fail' }

const mdInline = (s) => ({
  __html: String(s ?? '').split('\n').map(line => marked.parseInline(line)).join('<br>'),
})

function adjustHeight(el) {
  if (!el) return
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

function hasAnswer(v) {
  return v !== null && v !== undefined && v !== ''
}

export default function CampaignEssayTest() {
  const { courseCode } = useParams()
  const navigate = useNavigate()
  const key  = testKey(courseCode)
  const test = campaignEssays[key]

  const canonicalCode = useMemo(() => {
    const campaign = loadCampaign()
    if (campaign) {
      const match = Object.keys(campaign.courses).find(c => testKey(c) === key)
      if (match) return match
    }
    return test?.code || courseCode
  }, [key, test, courseCode])

  // ── Answer persistence: save as you type, clear on submit/retake ────────────
  const answersKey = `campaign-answers-${key}`
  const [answers, setAnswers]   = useState(() => {
    try { return JSON.parse(localStorage.getItem(answersKey)) || {} } catch { return {} }
  })   // { [qIndex]: optionIdx | numberStr | text }
  const [phase, setPhase]       = useState('answering') // answering | grading | graded | error
  const [results, setResults]   = useState(null)
  const [score, setScore]       = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [overAlert, setOverAlert] = useState(false)

  // Study clock -runs while answering, pauses on idle / hidden tab.
  const { elapsed } = useStudyTimer(canonicalCode, phase === 'answering')

  // Exam countdown -fixed wall-clock duration per course; auto-submits at 0.
  const examDuration = getCourseDuration(canonicalCode)
  const { remaining, reset: resetCountdown } = useCountdownTimer(
    canonicalCode,
    examDuration,
    !!test && phase === 'answering',
    () => { if (phase === 'answering') handleSubmit() },
  )

  // ── Auto-resize textarea refs (init heights for saved answers before paint) ──
  const textareaRefs = useRef({})
  useLayoutEffect(() => {
    Object.values(textareaRefs.current).forEach(el => el && adjustHeight(el))
  }, [])

  // ── Voice dictation (Web Speech API) ──────────────────────────────────────
  const recognitionRef = useRef(null)
  const [recordingQi, setRecordingQi] = useState(null)
  const speechSupported = typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition)

  useEffect(() => {
    if (test) markAttemptStart(canonicalCode)
  }, [test, canonicalCode])

  useEffect(() => {
    document.title = test ? `${formatCode(canonicalCode)} – Test` : 'Nexus'
  }, [test, canonicalCode])

  useEffect(() => () => { recognitionRef.current?.stop() }, [])

  // ── Task tracking: log this attempt under "Continue Studying" ───────────────
  useEffect(() => {
    if (!test) return
    TaskEngine.open(canonicalCode, 'Campaign', `/campaign/${courseCode}`, test.title, test.questions.length, 'essay')
  }, [test, canonicalCode, courseCode])

  useEffect(() => {
    if (!test || phase !== 'answering') return
    const answered = test.questions.filter((_, i) => hasAnswer(answers[i])).length
    TaskEngine.updateProgress(canonicalCode, 'Campaign', answered, test.questions.length)
  }, [answers, phase, test, canonicalCode])

  if (!test) {
    return (
      <NotFound
        title="404 - Test not found"
        message={`The test for ${formatCode(courseCode) || 'this course'} isn't available yet. Check back soon!`}
        homeTo="/campaign"
        homeLabel="Back to Campaign"
      />
    )
  }

  function toggleDictation(qi) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    if (recordingQi === qi) {                       // stop current
      recognitionRef.current?.stop()
      recognitionRef.current = null
      setRecordingQi(null)
      return
    }
    recognitionRef.current?.stop()                  // stop any other
    const r = new SR()
    r.continuous = false; r.interimResults = false; r.lang = 'en-NG'
    r.onresult = e => {
      const t = (e.results[0][0].transcript || '').trim()
      if (!t) return
      setAnswers(prev => {
        const cur = prev[qi] || ''
        const sp  = cur.length > 0 && !/[\s\n]$/.test(cur) ? ' ' : ''
        let ft = t
        if (!/[.!?]$/.test(ft)) ft += '.'
        const next = { ...prev, [qi]: cur + sp + ft + ' ' }
        localStorage.setItem(answersKey, JSON.stringify(next))
        return next
      })
    }
    r.onend   = () => { setRecordingQi(null); recognitionRef.current = null }
    r.onerror = () => { setRecordingQi(null); recognitionRef.current = null }
    recognitionRef.current = r
    setRecordingQi(qi)
    r.start()
  }

  const setAnswer = (qi, v) => setAnswers(prev => {
    const next = { ...prev, [qi]: v }
    localStorage.setItem(answersKey, JSON.stringify(next))
    return next
  })

  const answeredCount = test.questions.filter((_, i) => hasAnswer(answers[i])).length
  const progressPct   = Math.round((answeredCount / test.questions.length) * 100)

  const sectionCount = (sec) => test.questions.reduce((n, q, i) => {
    if (q.section !== sec.id || !hasAnswer(answers[i])) return n
    if (q.type !== 'essay') return n + 1
    return String(answers[i]).trim().length > 0 ? n + 1 : n
  }, 0)
  const overAnswered = (test.sections || []).filter(sec =>
    sec.pick !== 'all' && sec.pick != null && sectionCount(sec) > sec.pick
  )

  async function handleSubmit() {
    if (overAnswered.length > 0) {
      setOverAlert(true)
      return
    }
    setPhase('grading')
    setErrorMsg('')
    try {
      const perQuestion = new Array(test.questions.length).fill(null)
      const aiItems = []

      test.questions.forEach((q, i) => {
        const answered = hasAnswer(answers[i]) && (q.type !== 'essay' || String(answers[i]).trim().length > 0)
        if (!answered) {
          perQuestion[i] = { marksAwarded: 0, maxMarks: q.marks, verdict: 'not-attempted', feedback: '' }
          return
        }
        if (q.type === 'essay') {
          aiItems.push({
            n: i,
            kind: 'essay',
            marks: q.marks,
            text: q.text,
            modelAnswer: q.modelAnswer,
            rubric: q.rubric,
            studentAnswer: String(answers[i]),
          })
        } else {
          perQuestion[i] = gradeObjective(q, answers[i])
        }
      })

      if (aiItems.length > 0) {
        const aiResults = await gradeWrittenWithAI(test.subject, aiItems)
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
      }

      const finalScore = computeWrittenScore(test, perQuestion)

      // Persist for the campaign GPA + "Review Answers".
      saveCourseResult(canonicalCode, {
        courseCode:  canonicalCode,
        courseTitle: test.title,
        score: finalScore.totalAwarded,
        total: finalScore.totalPossible,
        pct:   finalScore.percentage,
        grade: finalScore.letterGrade,
        savedAt: new Date().toISOString(),
        type: 'essay',
        results: test.questions.map((q, i) => ({
          n: i + 1,
          subsection:    q.label || q.section || '',
          questionText:  q.text,
          studentAnswer: hasAnswer(answers[i]) ? String(answers[i]) : '',
          marksAwarded:  perQuestion[i]?.marksAwarded ?? 0,
          maxMarks:      perQuestion[i]?.maxMarks ?? q.marks,
          verdict:       perQuestion[i]?.verdict ?? 'incorrect',
          feedback:      perQuestion[i]?.feedback ?? '',
        })),
      })
      recordResult(canonicalCode, finalScore.percentage)
      TaskEngine.complete(canonicalCode, 'Campaign', finalScore.percentage)
      localStorage.removeItem(answersKey) // saved answers no longer needed once graded

      setResults(perQuestion)
      setScore(finalScore)
      setPhase('graded')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error('Grading error:', err)
      setErrorMsg(err.message || 'Could not connect to the AI grader.')
      setPhase('error')
    }
  }

  function retake() {
    localStorage.removeItem(answersKey)
    setAnswers({})
    setResults(null)
    setScore(null)
    setOverAlert(false)
    setPhase('answering')
    resetCountdown()   // fresh exam clock for the new attempt
    // Reset the tracked task so it re-appears as a fresh in-progress attempt.
    TaskEngine.clear(canonicalCode, 'Campaign')
    TaskEngine.open(canonicalCode, 'Campaign', `/campaign/${courseCode}`, test.title, test.questions.length, 'essay')
    window.scrollTo({ top: 0 })
  }

  async function handleDownload() {
    if (!score || !results) return
    setDownloading(true)
    try {
      const full      = results.filter(r => r?.verdict === 'correct').length
      const partial   = results.filter(r => r?.verdict === 'partial').length
      const incorrect = results.filter(r => r?.verdict === 'incorrect').length
      await downloadScoreCard({
        courseCode:  canonicalCode,
        courseTitle: test.title,
        score: score.totalAwarded,
        total: score.totalPossible,
        pct:   score.percentage,
        grade: score.letterGrade,
        gradeWord: GRADE_WORD[score.letterGrade],
        studentName: localStorage.getItem('username') || '',
        stats: [
          { label: 'Full marks', value: full,      color: '#34d399' },
          { label: 'Partial',    value: partial,   color: '#fbbf24' },
          { label: 'Incorrect',  value: incorrect, color: '#f87171' },
        ],
      })
    } catch (e) {
      console.error('Score image failed:', e)
      alert('Could not generate the score image.')
    } finally {
      setDownloading(false)
    }
  }

  const graded = phase === 'graded'

 


  let lastSection = null

  return (
    <div className="ce-page">
      <div className="ce-wrapper">
        <CampaignBreadcrumb courseCode={canonicalCode} />
        {/* Header */}
        <div className="ce-header">
          <div className="ce-header-uni">
            <div className="ce-header-logo"><img src="/logo.png" width={40} alt="" /></div>
            <div>
              <h1>Topfaith University</h1>
              <p>Mkpatak, Akwa Ibom State, Nigeria</p>
            </div>
          </div>
          <div className="ce-header-meta">
            <div><span>Course:</span><strong>{formatCode(canonicalCode)}</strong></div>
            <div><span>Title:</span><strong>{test.title}</strong></div>
            <div><span>Grading:</span><strong>Nexus AI</strong></div>
            <div>
              <span>{phase === 'answering' ? 'Time left:' : 'Time spent:'}</span>
              <strong>
                {phase === 'answering' ? formatDuration(remaining) : formatDuration(elapsed)}
              </strong>
            </div>
          </div>
        </div>

        {/* Floating exam countdown with 30-min and 5-min warnings */}
        <ExamTimer remaining={remaining} hidden={phase !== 'answering'} />

        {/* Score banner (after grading) */}
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

        {/* Progress (before grading) */}
        {!graded && (
          <div className="ce-progress">
            <div className="ce-progress-label">
              <span>Answered</span>
              <span>{answeredCount} / {test.questions.length}</span>
            </div>
            <div className="ce-progress-track">
              <div className="ce-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}

        {/* Over-answer modal */}
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
              <button className="pq-modal-ok" onClick={() => setOverAlert(false)}>OK</button>
            </div>
          </div>
        )}

        {/* Questions */}
        {test.questions.map((q, i) => {
          const sec = test.sections?.find(s => s.id === q.section)
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

                {q.scenario && <div className="ce-scenario" dangerouslySetInnerHTML={mdInline(q.scenario)} />}
                <div className="ce-qtext" dangerouslySetInnerHTML={mdInline(q.text)} />
                {q.formula && <div className="ce-formula">{q.formula}</div>}

                {/* MCQ: always visible; letter badges go correct/wrong after grading */}
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
                        ✗ {!hasAnswer(answers[i]) ? 'No answer selected.' : 'Incorrect.'}{' '}
                        Correct answer: {String.fromCharCode(65 + q.answer)}. {q.options[q.answer]}
                      </strong>
                    )}
                    {q.explanation && <span className="ce-explain">{q.explanation}</span>}
                  </div>
                )}

                {!graded && q.type === 'number' && (
                  <input
                    className="ce-num-input"
                    type="number"
                    step="any"
                    placeholder="Your answer"
                    value={answers[i] ?? ''}
                    onChange={e => setAnswer(i, e.target.value)}
                  />
                )}

                {!graded && q.type === 'essay' && (
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

                {/* Essay / number: not-attempted shows model answer */}
                {graded && r && q.type !== 'mcq' && r.verdict === 'not-attempted' && (
                  <div className="ce-result">
                    <div className="ce-not-attempted-badge">Question not attempted</div>
                    {q.modelAnswer && (
                      <div className="ce-model-answer">
                        <div className="ce-model-answer-label">Model Answer</div>
                        <div className="ce-model-answer-text" dangerouslySetInnerHTML={mdInline(q.modelAnswer)} />
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
                    <div className="ce-result-fb" dangerouslySetInnerHTML={mdInline(r.feedback)} />
                    {q.modelAnswer && (
                      <div className="ce-model-answer">
                        <div className="ce-model-answer-label">Model Answer</div>
                        <div className="ce-model-answer-text" dangerouslySetInnerHTML={mdInline(q.modelAnswer)} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Grading overlay - play Snake while the AI marks the paper */}
        {phase === 'grading' && <WaitGame />}

        {/* Error */}
        {phase === 'error' && (
          <div className="ce-error">
            <strong>Grading failed.</strong>
            <p>{errorMsg}</p>
            <div className="ce-btn-row">
              <button className="ce-btn ce-btn-outline" onClick={() => setPhase('answering')}>Close</button>
              <button className="ce-btn ce-btn-primary" onClick={handleSubmit}>Retry</button>
            </div>
          </div>
        )}

        {/* Actions */}
        {phase === 'answering' && (
          <div className="ce-btn-row">
            <button className="ce-btn ce-btn-primary" onClick={handleSubmit} disabled={answeredCount === 0}>
              Submit
            </button>
            {answeredCount === 0 && (
              <span style={{ width: '100%', textAlign: 'center', marginTop: 8, fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>
                Answer at least one question to submit
              </span>
            )}
          </div>
        )}
        {graded && (
          <div className="ce-btn-row">
            <button className="ce-btn ce-btn-primary" onClick={handleDownload} disabled={downloading}>
              <i className="fa-solid fa-download" /> {downloading ? 'Preparing…' : 'Download Score'}
            </button>
            <button className="ce-btn ce-btn-outline" onClick={retake}>
              <i className="fa-solid fa-rotate-left" /> Retake
            </button>
            <button className="ce-btn ce-btn-accent" onClick={() => navigate('/campaign')}>
              <i className="fa-solid fa-arrow-left" /> Back to Campaign
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
