// AI grading for written/essay answers via a Supabase Edge Function (ai-grade).


import { supabasePublic } from './supabase.js'

const OR_MODEL = 'qwen/qwen3-235b-a22b-thinking-2507'

// Strip characters that would break the JSON prompt / model parsing.
// eslint-disable-next-line no-control-regex
const clean = (s) => (s || 'blank').replace(/"/g, "'").replace(/[\x00-\x1F\x7F]/g, ' ')

export function getLetterGrade(pct) {
  if (pct >= 70) return 'A'
  if (pct >= 60) return 'B'
  if (pct >= 50) return 'C'
  if (pct >= 45) return 'D'
  if (pct >= 40) return 'E'
  return 'F'
}

/**
 * Grade written answers with the LLM, and provide full worked solutions for math.
 * Each item is either an essay (graded against `modelAnswer`) or an objective
 * math item (`kind: 'objective'`, carrying the known `correctAnswer`) for which
 * the model returns a complete step-by-step worked solution as feedback.
 * @param {string} subject  e.g. "university law (GES 101)"
 * @param {Array<{n:number, kind?:'essay'|'objective', marks:number, text:string, formula?:string, modelAnswer?:string, correctAnswer?:string, studentAnswer:string|null}>} items
 * @returns {Promise<Array<{n:number, marksAwarded:number, maxMarks:number, verdict:string, feedback:string}>>}
 */
export async function gradeWrittenWithAI(subject, items) {
  if (items.length === 0) return []

  const hasMath     = items.some(it => it.kind === 'objective')
  const hasCreative = items.some(it => it.kind === 'essay' && it.rubric)

  const prompt = `You are a university examiner AND tutor for ${subject} at Topfaith University, Nigeria. Grade the following ${items.length} answers.
Reply with ONLY a raw JSON array -no markdown, no code fences, no explanation.
Format exactly: [{"n":<int>,"marksAwarded":<number>,"maxMarks":<number>,"verdict":"correct|partial|incorrect","feedback":"..."}]

GRADING RULES (be flexible and fair -reward understanding, not exact wording):
1. OPEN-MINDED MARKING: never restrict correct answers to the model answer. Award marks for ANY point that is accurate, valid and relevant, however it is worded, and even if it is missing from the model answer. The model answer is a GUIDE, not the only acceptable answer.
2. Accept synonyms, paraphrases, valid alternative examples, and mathematically equivalent forms (e.g. 1/2 = 0.5, "x = 6" = 6, 3×2⁵ = 96). Do NOT penalise spelling, grammar, capitalisation, rounding or notation.
3. Give the benefit of the doubt: if an answer is partly right, award proportional/partial marks. Reserve 0 for answers that are blank, irrelevant or entirely wrong.
4. For lists: award proportional marks for each correct item even if the student gives fewer than requested.
${hasCreative ? `5. CREATIVE / PERSONAL ESSAYS (tagged [CREATIVE] below): these have no fixed correct answer. Grade using the rubric provided. Be very generous: award 75–100% of marks for any sincere, relevant, organised attempt. Award 50–74% for relevant but short or poorly organised essays. Reserve below 50% only for completely off-topic or nearly blank answers. Never penalise grammar, spelling, or capitalisation in creative essays.` : ''}

FEEDBACK RULES -your feedback must:
- Praise specifically what the student got right.
- When partial/incorrect: say what was missing or wrong, then briefly show how to do it correctly, staying encouraging like a tutor.
- Keep feedback concise (3-5 sentences). Use \\n to start a new line in feedback whenever you list multiple points, steps, or corrections - one point per line.
${hasMath ? `
MATH ITEMS (tagged [MATH] below) are objective. For EVERY [MATH] item, your feedback MUST contain the FULL step-by-step worked solution that arrives at the correct answer -written clearly, line by line -and then state whether the student's answer is correct. ALWAYS solve it; never just give the final answer.
` : ''}
ANSWERS TO GRADE:
${items.map(q => {
  if (q.kind === 'objective') {
    return `Q${q.n} [MATH] (max ${q.marks} marks): question="${clean(q.text)}"${q.formula ? ` hint="${clean(q.formula)}"` : ''} correctAnswer="${clean(String(q.correctAnswer))}" studentAnswer="${clean(q.studentAnswer)}"`
  }
  if (q.rubric) {
    return `Q${q.n} [CREATIVE] (max ${q.marks} marks): question="${clean(q.text)}" rubric="${clean(q.rubric)}" studentAnswer="${clean(q.studentAnswer)}"`
  }
  return `Q${q.n} (max ${q.marks} marks): question="${clean(q.text)}" modelAnswer="${clean(q.modelAnswer)}" studentAnswer="${clean(q.studentAnswer)}"`
}).join('\n')}`

  const { data, error } = await supabasePublic.functions.invoke('ai-grade', {
    body: {
      model: OR_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    },
  })
  if (error) throw new Error(`AI grading failed: ${error.message}`)
  const raw = data?.choices?.[0]?.message?.content || ''
  const match = raw.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('AI returned no JSON array. Got: ' + raw.substring(0, 200))
  return JSON.parse(match[0])
}

// Auto-grade objective items (mcq / number) locally -no AI needed.
export function gradeObjective(q, answer) {
  if (q.type === 'mcq') {
    const correct = answer === q.answer
    return {
      marksAwarded: correct ? q.marks : 0,
      maxMarks: q.marks,
      verdict: correct ? 'correct' : 'incorrect',
      feedback: correct
        ? 'Correct answer.'
        : `Incorrect. The correct option was ${String.fromCharCode(65 + q.answer)}.`,
    }
  }
  // number
  const tol = q.tolerance ?? 0
  const correct = answer !== null && answer !== undefined && answer !== '' &&
    Math.abs(Number(answer) - q.answer) <= tol
  return {
    marksAwarded: correct ? q.marks : 0,
    maxMarks: q.marks,
    verdict: correct ? 'correct' : 'incorrect',
    feedback: correct ? 'Correct.' : `Incorrect. Expected ${q.answer}.`,
  }
}

/**
 * Combine per-question results into a final score, honouring section rules.
 * For a section with `pick: N`, only the N best-scoring answers count, and the
 * section contributes N × (its per-question marks) to the total possible.
 * `pick: 'all'` (or omitted) counts every question.
 *
 * @param {object} test     a campaignEssays entry (has .questions and optional .sections)
 * @param {Array}  results  per-question result aligned to test.questions
 * @returns {{ totalAwarded:number, totalPossible:number, percentage:number, letterGrade:string }}
 */
export function computeWrittenScore(test, results) {
  const sections = test.sections || [{ id: '_all', pick: 'all' }]
  let totalAwarded = 0
  let totalPossible = 0

  for (const sec of sections) {
    const idxs = test.questions
      .map((q, i) => ({ q, i }))
      .filter(({ q }) => (test.sections ? q.section === sec.id : true))
    if (idxs.length === 0) continue

    const unit = idxs[0].q.marks
    if (sec.pick === undefined || sec.pick === 'all') {
      idxs.forEach(({ i }) => {
        totalAwarded  += results[i]?.marksAwarded || 0
        totalPossible += results[i]?.maxMarks ?? idxs.find(x => x.i === i).q.marks
      })
    } else {
      const awarded = idxs
        .map(({ i }) => results[i]?.marksAwarded || 0)
        .sort((a, b) => b - a)
        .slice(0, sec.pick)
        .reduce((s, v) => s + v, 0)
      totalAwarded  += awarded
      totalPossible += sec.pick * unit
    }
  }

  const percentage = totalPossible === 0
    ? 0
    : parseFloat(((totalAwarded / totalPossible) * 100).toFixed(1))
  return { totalAwarded, totalPossible, percentage, letterGrade: getLetterGrade(percentage) }
}
