// Read-only review of one saved test attempt (MCQ or essay), opened from the
// "Review Past Results" list on the campaign page. Mirrors the post-submit
// screen so the student sees exactly what they would see right after submitting.

import { marked } from 'marked'
import { campaignEssays } from '../data/campaignEssays'
import { testKey } from '../lib/campaign'
import { formatCode } from '../lib/courseSlug'
import ScrollToTop from './ScrollToTop'
import '../pages/CampaignTest.css'
import '../pages/CampaignEssayTest.css'
import '../../nexus-breadcrumb.css'

const GRADE_WORD = { A: 'Excellent', B: 'Good', C: 'Average', D: 'Pass', E: 'Marginal', F: 'Fail' }

// Split by \n first so that newlines always render as <br>, regardless of
// whether marked.parseInline treats them as soft line breaks (spaces).
const mdInline = (s) => ({
  __html: String(s ?? '').split('\n').map(line => marked.parseInline(line)).join('<br>'),
})

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

// Nexus breadcrumb: Campaign / <course> · Review
// Uses a button for the Campaign crumb (not a Link) because AttemptReview is
// a state-based view inside the /campaign route - navigating to the same URL
// won't reset the reviewing state, so we call onBack() directly instead.
function ReviewBreadcrumb({ code, num, onBack }) {
  return (
    <nav className="nx-breadcrumb nx-fixed" aria-label="breadcrumb">
      <button className="nx-bc-item nx-bc-prev" onClick={onBack}>
        <span className="nx-bc-home-dot"></span>
        Campaign
      </button>
      <span className="nx-bc-sep">/</span>
      <span className="nx-bc-item nx-bc-current">
        {formatCode(code)} · {ordinal(num)} Attempt
      </span>
    </nav>
  )
}

// ── MCQ review: exact mirror of CampaignTest.jsx post-submit layout ───────────

function McqAttemptReview({ code, attempt, onBack }) {
  const num       = attempt.attemptNumber || 1
  const date      = attempt.savedAt
    ? new Date(attempt.savedAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })
    : ''
  const questions = attempt.questions || []

  return (
    <div className="ct-page">
      <ScrollToTop />
      <div className="ct-wrapper">
        <ReviewBreadcrumb code={code} num={num} onBack={onBack} />

        {/* Exam header */}
        <div className="ct-exam-header">
          <div className="ct-exam-uni">
            <div className="ct-exam-logo"><img src="/logo.png" alt="" width={40} /></div>
            <div>
              <h1>Topfaith University</h1>
              <p>Mkpatak, Akwa Ibom State, Nigeria</p>
            </div>
          </div>
          <div className="ct-exam-meta">
            <div className="ct-meta-item"><span>Course:</span><strong>{formatCode(code)}</strong></div>
            <div className="ct-meta-item"><span>Title:</span><strong>{attempt.courseTitle || ''}</strong></div>
            <div className="ct-meta-item"><span>Questions:</span><strong>{questions.length}</strong></div>
            <div className="ct-meta-item"><span>Submitted:</span><strong>{date}</strong></div>
          </div>
        </div>

        {/* Score banner */}
        <div className="ct-score-box">
          <div>
            <div className="ct-score-main">{attempt.score} <span>/ {attempt.total}</span></div>
            <div className="ct-score-pct">{attempt.pct}% · Grade: {attempt.grade} · {GRADE_WORD[attempt.grade] || ''}</div>
          </div>
          <div className="ct-score-grade">{attempt.grade}</div>
        </div>

        {/* Section label */}
        <div style={{ fontSize: 16, fontWeight: 700, paddingBottom: 8, borderBottom: '2px solid #e5e7eb', marginBottom: 18 }}>
          All Questions
        </div>

        {/* Questions */}
        {questions.map((q, qi) => {
          const correct      = q.isCorrect
          const notAttempted = q.chosen === null || q.chosen === undefined
          let cardCls = 'ct-qcard'
          if (correct) cardCls += ' correct'
          else if (notAttempted) cardCls += ' not-attempted'
          else cardCls += ' wrong'

          return (
            <div className={cardCls} key={qi}>
              <div className="ct-qnum">Question {qi + 1} of {questions.length}</div>
              <div className="ct-qtext" style={{ whiteSpace: 'pre-line' }}>{q.q}</div>
              <div className="ct-options">
                {q.options.map((opt, oi) => {
                  const isChosen = q.chosen === oi
                  const isRight  = q.correct === oi
                  let stateCls = ''
                  if (isRight)       stateCls = 'is-correct'
                  else if (isChosen) stateCls = 'is-wrong'
                  return (
                    <label key={oi} className={`ct-option ${stateCls}`}>
                      <span className="ct-opt-letter">{String.fromCharCode(65 + oi)}</span>
                      <span className="ct-opt-text">{opt}</span>
                    </label>
                  )
                })}
              </div>
              <div className={`ct-feedback ${correct ? 'ok' : 'bad'}`}>
                {correct ? (
                  <strong>✓ Correct!</strong>
                ) : (
                  <strong>
                    ✗ {notAttempted ? 'No answer selected.' : 'Incorrect.'} Correct answer:&nbsp;
                    {String.fromCharCode(65 + q.correct)}. {q.options[q.correct]}
                  </strong>
                )}
                {q.explanation && <span className="ct-explain">{q.explanation}</span>}
              </div>
            </div>
          )
        })}

        <div className="ct-btn-row">
          <button className="ct-btn ct-btn-accent" onClick={onBack}>
            <i className="fa-solid fa-arrow-left" /> Back to Campaign
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Essay review: exact mirror of CampaignEssayTest.jsx post-graded layout ───

function EssayAttemptReview({ code, attempt, onBack }) {
  const num     = attempt.attemptNumber || 1
  const date    = attempt.savedAt
    ? new Date(attempt.savedAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })
    : ''
  const results = attempt.results || []

  // Look up the original test to get full question data (options, modelAnswer,
  // scenario, formula, type) which are not stored in the saved attempt.
  const origTest = campaignEssays[testKey(code)]

  let lastSection = null

  return (
    <div className="ce-page">
      <ScrollToTop />
      <div className="ce-wrapper">
        <ReviewBreadcrumb code={code} num={num} onBack={onBack} />

        {/* Exam header */}
        <div className="ce-header">
          <div className="ce-header-uni">
            <div className="ce-header-logo"><img src="/logo.png" width={40} alt="" /></div>
            <div>
              <h1>Topfaith University</h1>
              <p>Mkpatak, Akwa Ibom State, Nigeria</p>
            </div>
          </div>
          <div className="ce-header-meta">
            <div><span>Course:</span><strong>{formatCode(code)}</strong></div>
            <div><span>Title:</span><strong>{attempt.courseTitle || ''}</strong></div>
            <div><span>Grading:</span><strong>Nexus AI</strong></div>
            <div><span>Submitted:</span><strong>{date}</strong></div>
          </div>
        </div>

        {/* Score banner */}
        <div className="ce-score-banner">
          <div>
            <div className="ce-score-num">{attempt.score}<span> / {attempt.total}</span></div>
            <div className="ce-score-pct">{attempt.pct}%</div>
          </div>
          <div className="ce-grade-badge">
            <div className="ce-grade-letter">{attempt.grade}</div>
            <div className="ce-grade-word">{GRADE_WORD[attempt.grade] || ''}</div>
          </div>
        </div>

        <div style={{ fontSize: 16, fontWeight: 700, paddingBottom: 8, borderBottom: '2px solid #e5e7eb', marginBottom: 18 }}>
          Question Breakdown
        </div>

        {/* Questions */}
        {results.map((r, i) => {
          const origQ = origTest?.questions?.[i]
          const qType = origQ?.type || 'essay'
          const vc    = r.verdict || 'incorrect'

          // Section divider
          const section    = origQ?.section || ''
          const sec        = origTest?.sections?.find(s => s.id === section)
          const showDivider = section && section !== lastSection
          lastSection = section

          // For MCQ questions embedded in essay tests
          const chosenIdx    = qType === 'mcq'
            ? (r.studentAnswer !== '' && r.studentAnswer !== undefined ? parseInt(r.studentAnswer) : null)
            : null
          const hasStudentAns = r.studentAnswer !== '' && r.studentAnswer !== undefined && r.studentAnswer !== null

          return (
            <div key={i}>
              {showDivider && sec && <div className="ce-section-divider">{sec.label}</div>}

              <div className={`ce-qcard ${vc}`}>
                <div className="ce-qcard-top">
                  <span className="ce-q-label">{r.subsection || `Question ${r.n}`}</span>
                  <span className="ce-q-marks">{r.marksAwarded} / {r.maxMarks}</span>
                </div>

                {origQ?.scenario && (
                  <div className="ce-scenario" dangerouslySetInnerHTML={mdInline(origQ.scenario)} />
                )}
                <div className="ce-qtext" dangerouslySetInnerHTML={mdInline(r.questionText)} />
                {origQ?.formula && <div className="ce-formula">{origQ.formula}</div>}

                {/* MCQ options (for MCQ questions within an essay test) */}
                {qType === 'mcq' && origQ?.options && (
                  <div className="ce-options">
                    {origQ.options.map((opt, oi) => {
                      const isChosen = chosenIdx === oi
                      const isRight  = origQ.answer === oi
                      let stateCls = ''
                      if (isRight)       stateCls = 'is-correct'
                      else if (isChosen) stateCls = 'is-wrong'
                      return (
                        <label key={oi} className={`ce-option ${stateCls}`}>
                          <span className="ce-opt-letter">{String.fromCharCode(65 + oi)}</span>
                          <span>{opt}</span>
                        </label>
                      )
                    })}
                  </div>
                )}

                {/* MCQ feedback */}
                {qType === 'mcq' && origQ && (
                  <div className={`ce-mcq-feedback ${vc === 'correct' ? 'ok' : 'bad'}`}>
                    {vc === 'correct' ? (
                      <strong>✓ Correct!</strong>
                    ) : (
                      <strong>
                        ✗ {!hasStudentAns ? 'No answer selected.' : 'Incorrect.'}{' '}
                        Correct answer: {String.fromCharCode(65 + origQ.answer)}. {origQ.options[origQ.answer]}
                      </strong>
                    )}
                    {origQ.explanation && <span className="ce-explain">{origQ.explanation}</span>}
                  </div>
                )}

                {/* Essay / number - not attempted */}
                {qType !== 'mcq' && vc === 'not-attempted' && (
                  <div className="ce-result">
                    <div className="ce-not-attempted-badge">Question not attempted</div>
                    {origQ?.modelAnswer && (
                      <div className="ce-model-answer">
                        <div className="ce-model-answer-label">Model Answer</div>
                        <div className="ce-model-answer-text" dangerouslySetInnerHTML={mdInline(origQ.modelAnswer)} />
                      </div>
                    )}
                  </div>
                )}

                {/* Essay / number - attempted */}
                {qType !== 'mcq' && vc !== 'not-attempted' && (
                  <div className="ce-result">
                    <div className="ce-result-answer">
                      <span className="ce-result-lbl">Your answer:</span>
                      <div className="ce-result-answer-text">
                        {r.studentAnswer || <em>No answer given</em>}
                      </div>
                    </div>
                    <div className="ce-result-fb" dangerouslySetInnerHTML={mdInline(r.feedback)} />
                    {origQ?.modelAnswer && (
                      <div className="ce-model-answer">
                        <div className="ce-model-answer-label">Model Answer</div>
                        <div className="ce-model-answer-text" dangerouslySetInnerHTML={mdInline(origQ.modelAnswer)} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        <div className="ce-btn-row">
          <button className="ce-btn ce-btn-accent" onClick={onBack}>
            <i className="fa-solid fa-arrow-left" /> Back to Campaign
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Entry point ───────────────────────────────────────────────────────────────

export default function AttemptReview({ code, attempt, onBack }) {
  if (attempt.type === 'essay') {
    return <EssayAttemptReview code={code} attempt={attempt} onBack={onBack} />
  }
  return <McqAttemptReview code={code} attempt={attempt} onBack={onBack} />
}
