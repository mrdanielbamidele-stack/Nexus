// Read-only review of one saved Past Question attempt (objective or theory).
// Mirrors the post-submit screen so the student sees exactly what they would
// see right after submitting. Opened from CoursePastQuestions via state, not
// a route change, so onBack() returns to the list without a navigation event.

import { marked } from 'marked'
import { getQuiz } from '../lib/pastQuestions'
import { formatCode } from '../lib/courseSlug'
import MathContent from './MathContent'
import ScrollToTop from './ScrollToTop'
import '../pages/CampaignTest.css'
import '../pages/CampaignEssayTest.css'

const GRADE_WORD = { A: 'Excellent', B: 'Good', C: 'Average', D: 'Pass', E: 'Marginal', F: 'Fail' }

const mdInline = (s) => ({
  __html: String(s ?? '').split('\n').map(line => marked.parseInline(line)).join('<br>'),
})

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function ReviewBreadcrumb({ courseCode, courseLabel, num, onBack }) {
  return (
    <nav className="nx-breadcrumb nx-fixed" aria-label="breadcrumb">
      <button className="nx-bc-item nx-bc-prev" onClick={onBack}>
        <span className="nx-bc-home-dot"></span>
        {courseLabel}
      </button>
      <span className="nx-bc-sep">/</span>
      <span className="nx-bc-item nx-bc-current">
        {ordinal(num)} Attempt Review
      </span>
    </nav>
  )
}

// ── Objective (MCQ) review ────────────────────────────────────────────────────

function ObjectiveReview({ courseCode, courseLabel, year, attempt, onBack }) {
  const quiz = getQuiz(courseCode, year)
  const pool = quiz?.questions || []
  const answers = attempt.answers || {}
  const num = attempt.attemptNumber || 1
  const date = attempt.savedAt
    ? new Date(attempt.savedAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })
    : ''

  return (
    <div className="ct-page">
      <ScrollToTop />
      <div className="ct-wrapper">
        <ReviewBreadcrumb courseCode={courseCode} courseLabel={courseLabel} num={num} onBack={onBack} />

        <div className="ct-exam-header" style={{ marginTop: 50 }}>
          <div className="ct-exam-uni">
            <div className="ct-exam-logo"><img src="/logo.png" alt="" width={40} /></div>
            <div>
              <h1>Topfaith University</h1>
              <p>Mkpatak, Akwa Ibom State, Nigeria</p>
            </div>
          </div>
          <div className="ct-exam-meta">
            <div className="ct-meta-item"><span>Course:</span><strong>{courseLabel}</strong></div>
            <div className="ct-meta-item"><span>Session:</span><strong>{attempt.session || year}</strong></div>
            <div className="ct-meta-item"><span>Questions:</span><strong>{pool.length}</strong></div>
            <div className="ct-meta-item"><span>Submitted:</span><strong>{date}</strong></div>
          </div>
        </div>

        <div className="ct-score-box">
          <div>
            <div className="ct-score-main">{attempt.score} <span>/ {attempt.total}</span></div>
            <div className="ct-score-pct">{attempt.pct}% · Grade: {attempt.grade} · {GRADE_WORD[attempt.grade] || ''}</div>
          </div>
          <div className="ct-score-grade">{attempt.grade}</div>
        </div>

        <div style={{ fontSize: 16, fontWeight: 700, paddingBottom: 8, borderBottom: '2px solid #e5e7eb', marginBottom: 18 }}>
          All Questions
        </div>

        {pool.map((q, qi) => {
          const chosen = qi in answers ? answers[qi] : null
          const correct = chosen === q.answer
          const notAttempted = chosen === null || chosen === undefined

          return (
            <div
              className={`ct-qcard ${correct ? 'correct' : notAttempted ? 'not-attempted' : 'wrong'}`}
              key={qi}
            >
              <div className="ct-qnum">Question {qi + 1} of {pool.length}</div>
              {quiz.mathjax
                ? <MathContent className="ct-qtext" html={q.q} />
                : <div className="ct-qtext" dangerouslySetInnerHTML={mdInline(q.q)} />}

              <div className="ct-options">
                {q.options.map((opt, oi) => {
                  const isChosen = chosen === oi
                  const isRight = q.answer === oi
                  let stateCls = ''
                  if (isRight) stateCls = 'is-correct'
                  else if (isChosen) stateCls = 'is-wrong'
                  return (
                    <label key={oi} className={`ct-option ${stateCls}`}>
                      <span className="ct-opt-letter">{String.fromCharCode(65 + oi)}</span>
                      {quiz.mathjax
                        ? <MathContent as="span" className="ct-opt-text" html={opt} />
                        : <span className="ct-opt-text" dangerouslySetInnerHTML={mdInline(opt)} />}
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
            </div>
          )
        })}

        <div className="ct-btn-row">
          <button className="ct-btn ct-btn-accent" onClick={onBack}>
            Back
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Theory (essay) review ─────────────────────────────────────────────────────

function TheoryReview({ courseCode, courseLabel, year, attempt, onBack }) {
  const quiz = getQuiz(courseCode, year)
  const questions = quiz?.questions || []
  const answers = attempt.answers || {}
  const results = attempt.results || []
  const num = attempt.attemptNumber || 1
  const date = attempt.savedAt
    ? new Date(attempt.savedAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })
    : ''

  let lastSection = null

  return (
    <div className="ce-page">
      <ScrollToTop />
      <div className="ce-wrapper">
        <ReviewBreadcrumb courseCode={courseCode} courseLabel={courseLabel} num={num} onBack={onBack} />

        <div className="ce-header" style={{ marginTop: 50 }}>
          <div className="ce-header-uni">
            <div className="ce-header-logo"><img src="/logo.png" width={40} alt="" /></div>
            <div>
              <h1>Topfaith University</h1>
              <p>Mkpatak, Akwa Ibom State, Nigeria</p>
            </div>
          </div>
          <div className="ce-header-meta">
            <div><span>Course:</span><strong>{courseLabel}</strong></div>
            <div><span>Session:</span><strong>{attempt.session || year}</strong></div>
            <div><span>Grading:</span><strong>Nexus AI</strong></div>
            <div><span>Submitted:</span><strong>{date}</strong></div>
          </div>
        </div>

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

        {questions.map((q, i) => {
          const sec = quiz.sections?.find(x => x.id === q.section)
          const showDivider = q.section && q.section !== lastSection
          lastSection = q.section
          const r = results[i]
          const vc = r?.verdict || 'not-attempted'
          const studentAnswer = answers[i]
          const hasStudentAns = studentAnswer !== null && studentAnswer !== undefined && studentAnswer !== ''

          return (
            <div key={i}>
              {showDivider && sec && <div className="ce-section-divider">{sec.label}</div>}

              <div className={`ce-qcard ${vc}`}>
                <div className="ce-qcard-top">
                  <span className="ce-q-label">{q.label || `Question ${i + 1}`}</span>
                  <span className="ce-q-marks">
                    {r ? `${r.marksAwarded} / ${r.maxMarks}` : `${q.marks} mark${q.marks > 1 ? 's' : ''}`}
                  </span>
                </div>

                {q.scenario && <div className="ce-scenario">{q.scenario}</div>}
                {quiz.mathjax
                  ? <MathContent className="ce-qtext" html={q.text} />
                  : <div className="ce-qtext" dangerouslySetInnerHTML={mdInline(q.text)} />}

                {/* MCQ inside a theory paper */}
                {q.type === 'mcq' && q.options && (
                  <div className="ce-options">
                    {q.options.map((opt, oi) => {
                      const chosenIdx = hasStudentAns ? Number(studentAnswer) : null
                      const isChosen = chosenIdx === oi
                      const isRight = q.answer === oi
                      let stateCls = ''
                      if (isRight) stateCls = 'is-correct'
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
                {q.type === 'mcq' && (
                  <div className={`ce-mcq-feedback ${vc === 'correct' ? 'ok' : 'bad'}`}>
                    {vc === 'correct' ? (
                      <strong>✓ Correct!</strong>
                    ) : (
                      <strong>
                        ✗ {!hasStudentAns ? 'Not attempted.' : 'Incorrect.'}{' '}
                        Correct answer: {String.fromCharCode(65 + q.answer)}. {q.options[q.answer]}
                      </strong>
                    )}
                    {(r?.feedback || q.explanation) && (
                      <span className="ce-explain" dangerouslySetInnerHTML={mdInline(r?.feedback || q.explanation)} />
                    )}
                  </div>
                )}

                {/* Essay / written - not attempted */}
                {q.type !== 'mcq' && vc === 'not-attempted' && (
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

                {/* Essay / written - attempted */}
                {q.type !== 'mcq' && vc !== 'not-attempted' && (
                  <div className="ce-result">
                    <div className="ce-result-answer">
                      <span className="ce-result-lbl">Your answer:</span>
                      <div className="ce-result-answer-text">
                        {hasStudentAns ? String(studentAnswer) : <em>No answer given</em>}
                      </div>
                    </div>
                    {r?.feedback && (
                      quiz.mathjax
                        ? <MathContent className="ce-result-fb" html={r.feedback} />
                        : <div className="ce-result-fb" dangerouslySetInnerHTML={mdInline(r.feedback)} />
                    )}
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

        <div className="ce-btn-row">
          <button className="ce-btn ce-btn-accent" onClick={onBack}>
            Back
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Entry point ───────────────────────────────────────────────────────────────

export default function PQAttemptReview({ courseCode, courseLabel, year, attempt, onBack }) {
  if (attempt.type === 'theory') {
    return (
      <TheoryReview
        courseCode={courseCode}
        courseLabel={courseLabel}
        year={year}
        attempt={attempt}
        onBack={onBack}
      />
    )
  }
  return (
    <ObjectiveReview
      courseCode={courseCode}
      courseLabel={courseLabel}
      year={year}
      attempt={attempt}
      onBack={onBack}
    />
  )
}
