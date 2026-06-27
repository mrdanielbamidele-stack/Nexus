const TASKS_KEY  = 'nexus_tasks'
const MAX_RECENT = 10

function _load() {
  try { return JSON.parse(localStorage.getItem(TASKS_KEY)) || {} }
  catch { return {} }
}
function _save(data) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(data))
}

// A task is identified by the (courseCode, task) pair, so the same course can
// have several ongoing activities at once -e.g. "COS 101 / Campaign" and
// "MTH 101 / 2023/2024 Past Questions" are stored as two separate entries.
function _key(courseCode, task) {
  return `${courseCode}::${task}`
}

export function open(courseCode, task, url, title, totalQ = 0, sessionType = 'quiz') {
  const tasks = _load()
  const key = _key(courseCode, task)
  if (!tasks[key]) {
    tasks[key] = {
      key, courseCode, task, title, url, totalQ,
      answeredQ: 0, progress: 0, sessionType,
      openedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      completed: false
    }
  } else {
    tasks[key].url  = url
    tasks[key].title = title
    tasks[key].task = task
    tasks[key].lastActiveAt = new Date().toISOString()
    if (totalQ > 0) tasks[key].totalQ = totalQ
    // Re-opening a task that was already finished means a fresh attempt:
    // reset the completion state so it shows up under "Continue Studying"
    // again instead of staying filtered out as a completed task.
    if (tasks[key].completed) {
      tasks[key].completed   = false
      tasks[key].progress    = 0
      tasks[key].answeredQ   = 0
      tasks[key].score       = undefined
      tasks[key].completedAt = undefined
      tasks[key].openedAt    = new Date().toISOString()
    }
  }
  _save(tasks)
}

export function updateProgress(courseCode, task, answeredQ, totalQ) {
  const tasks = _load()
  const key = _key(courseCode, task)
  if (!tasks[key]) return
  tasks[key].answeredQ    = answeredQ
  tasks[key].totalQ       = totalQ
  tasks[key].progress     = totalQ > 0 ? Math.round((answeredQ / totalQ) * 100) : 0
  tasks[key].lastActiveAt = new Date().toISOString()
  _save(tasks)
}

export function complete(courseCode, task, score) {
  const tasks = _load()
  const key = _key(courseCode, task)
  if (!tasks[key]) return
  tasks[key].completed    = true
  tasks[key].progress     = 100
  tasks[key].score        = score
  tasks[key].completedAt  = new Date().toISOString()
  tasks[key].lastActiveAt = new Date().toISOString()
  _save(tasks)
}

export function clear(courseCode, task) {
  const tasks = _load()
  delete tasks[_key(courseCode, task)]
  _save(tasks)
}

export function get(courseCode, task) {
  return _load()[_key(courseCode, task)] || null
}

export function getInProgress() {
  const tasks = _load()
  return Object.values(tasks)
    .filter(t => !t.completed && t.progress > 0)
    .sort((a, b) => new Date(b.lastActiveAt) - new Date(a.lastActiveAt))
    .slice(0, MAX_RECENT)
}

export function getAll() {
  const tasks = _load()
  return Object.values(tasks)
    .sort((a, b) => new Date(b.lastActiveAt) - new Date(a.lastActiveAt))
}

export function getContinueList() {
  const tasks = _load()
  return Object.values(tasks)
    .filter(t => !t.completed && t.progress > 0)
    .sort((a, b) => new Date(b.lastActiveAt) - new Date(a.lastActiveAt))
}

export function getLabel(session) {
  if (!session) return ''
  if (session.sessionType === 'reading') {
    const mins = Math.floor((session.answeredQ || 0) / 60)
    return mins > 0 ? `${mins} min${mins !== 1 ? 's' : ''} read` : 'Just opened'
  }
  const a = session.answeredQ || 0
  const t = session.totalQ   || 0
  if (session.sessionType === 'essay') {
    return t > 0 ? `${a} / ${t} questions attempted` : `${session.progress}% done`
  }
  return t > 0 ? `${a} / ${t} answered` : `${session.progress}% done`
}

// ── Default export object so Dashboard can do: import TaskEngine from '...' ──
const TaskEngine = { open, updateProgress, complete, clear, get, getInProgress, getAll, getContinueList, getLabel }

if (typeof window !== 'undefined') {
  window.TaskEngine = TaskEngine
}

export default TaskEngine
