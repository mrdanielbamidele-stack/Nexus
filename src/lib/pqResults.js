// Per-year attempt history for Past Question quizzes.
// Keyed separately from campaign results so they persist independently.

const key = (courseCode, year) =>
  `pq_results_${String(courseCode).toLowerCase().replace(/\s+/g, '_')}_${year}`

export function loadPQResults(courseCode, year) {
  try {
    const data = JSON.parse(localStorage.getItem(key(courseCode, year)))
    if (!data) return []
    return Array.isArray(data) ? data : [data]
  } catch { return [] }
}

// Append one attempt; returns its 1-based attempt number.
export function savePQResult(courseCode, year, result) {
  const history = loadPQResults(courseCode, year)
  result.attemptNumber = history.length + 1
  result.savedAt = result.savedAt || new Date().toISOString()
  history.push(result)
  try { localStorage.setItem(key(courseCode, year), JSON.stringify(history)) }
  catch (e) { console.warn('Could not save PQ result:', e) }
  return result.attemptNumber
}

// All attempts across all years for a course, newest first.
export function loadAllPQResults(courseCode) {
  const prefix = `pq_results_${String(courseCode).toLowerCase().replace(/\s+/g, '_')}_`
  const out = []
  for (const k of Object.keys(localStorage)) {
    if (!k.startsWith(prefix)) continue
    const year = k.slice(prefix.length)
    loadPQResults(courseCode, year).forEach(attempt => out.push({ year, ...attempt }))
  }
  out.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))
  return out
}
