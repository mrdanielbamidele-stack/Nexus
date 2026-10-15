import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import UiIcon from '../../components/UiIcon'
import { pqKey } from '../../lib/courseSlug'
import { getAllCatalogCourses } from '../../lib/studentCourses'
import { SESSIONS } from '../../lib/studentUploads'
import Upload from '../Upload'
import DeleSelect from './DeleSelect'
import PaperReview from './PaperReview'
import { useDele } from './deleContext'
import { DeleCompareSkeleton } from './DeleSkeletons'

const FILTERS = [
  { id: '', label: 'All' },
  { id: 'approved', label: 'Approved' },
  { id: 'pending', label: 'Waiting' },
  { id: 'rejected', label: 'Rejected' },
]

// "Years" are the different sessions a course has; "past questions" are its
// papers (every version). Both count what is showing under the status filter.
const SORTS = [
  { value: 'az', label: 'Course A to Z' },
  { value: 'years-desc', label: 'Most years' },
  { value: 'years-asc', label: 'Fewest years' },
  { value: 'papers-desc', label: 'Most past questions' },
  { value: 'papers-asc', label: 'Fewest past questions' },
]

// How many years and past questions a course has under the status filter. They
// come from the light course list, so sorting needs no papers loaded.
const countsOf = (course, status) => ({
  years: course.years?.[status || 'all'] ?? 0,
  papers: (status ? course[status] : course.total) ?? 0,
})

function sortCourses(list, sort, status) {
  if (sort === 'az') return list
  const [by, direction] = sort.split('-')
  const other = by === 'years' ? 'papers' : 'years'
  const sign = direction === 'asc' ? 1 : -1

  // Ties fall back to the other count, then A to Z (the order the list came in).
  return [...list].sort((a, b) => {
    const x = countsOf(a, status)
    const y = countsOf(b, status)
    return sign * (x[by] - y[by]) || sign * (x[other] - y[other]) || a.code.localeCompare(b.code)
  })
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

// The end of one course + year: a way to add another paper for exactly that
// year, using the same upload as /delealone/upload in a smaller size. It starts
// folded away; once opened it stays mounted so a send in progress isn't lost
// when it is folded again.
function UploadSlot({ course, session, onPublished, startOpen = false }) {
  const [open, setOpen] = useState(startOpen)
  const [started, setStarted] = useState(startOpen)

  function toggle() {
    setStarted(true)
    setOpen(o => !o)
  }

  return (
    <div className={`dl-cmp-slot${open ? ' open' : ''}`}>
      <button type="button" className="dl-cmp-slot-toggle" aria-expanded={open} onClick={toggle}>
        <UiIcon name={open ? 'x' : 'plus'} size={16} />
        {open ? 'Close' : `Upload another for ${course.code} · ${session}`}
      </button>

      {started && (
        <div className="dl-cmp-slot-body" hidden={!open}>
          <Upload
            variant="owner"
            embedded
            fixedCourse={course.code}
            fixedSession={session}
            onPublished={onPublished}
          />
        </div>
      )}
    </div>
  )
}

// A course with nothing on Nexus yet has no year to attach an upload to, so the
// year is chosen first; the small upload then opens for that year.
function EmptyCourse({ course, onPublished }) {
  const [session, setSession] = useState('')

  return (
    <div className="dl-cmp-empty">
      <p className="dl-empty small">No past questions for {course.code} yet. Pick a year to upload one.</p>
      <div className="dl-cmp-chips" role="radiogroup" aria-label={`Year for ${course.code}`}>
        {SESSIONS.map(s => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={session === s}
            className={`dl-chip${session === s ? ' on' : ''}`}
            onClick={() => setSession(s)}
          >
            {s}
          </button>
        ))}
      </div>
      {session && <UploadSlot key={session} course={course} session={session} onPublished={onPublished} startOpen />}
    </div>
  )
}

// Every course on Nexus, one after another: its sessions and versions grouped
// together, each with a small preview you can maximize.
//
// It loads in batches of 50 courses. First a light list of every course (counts
// only) arrives, which is enough to search, filter and sort; the papers are
// fetched only for the 50 courses on screen. "Load 50 more" brings the next 50.
const BATCH = 50

export default function DeleCompare() {
  const { call } = useDele()
  const [params] = useSearchParams()
  const jumpTo = (params.get('course') || '').toLowerCase()

  const [index, setIndex] = useState(null)   // light list: every course that has papers
  const [loaded, setLoaded] = useState({})   // course key -> its papers (only courses that were on screen)
  const [shownCount, setShownCount] = useState(BATCH)
  const [fetching, setFetching] = useState(false)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('az')
  const [error, setError] = useState('')
  const jumped = useRef(false)
  const asked = useRef(new Set())            // keys already requested
  const loadedRef = useRef(loaded)
  loadedRef.current = loaded

  // Fetch the papers of some courses, at most 50 at a time.
  const fetchPapers = useCallback(async keys => {
    const fresh = {}
    for (let i = 0; i < keys.length; i += BATCH) {
      const chunk = keys.slice(i, i + BATCH)
      const { courses } = await call(`/compare/all?keys=${chunk.join(',')}`)
      for (const key of chunk) fresh[key] = []
      for (const course of courses) fresh[course.key] = course.papers
    }
    return fresh
  }, [call])

  const loadIndex = useCallback(
    () => call('/compare/courses').then(({ courses }) => setIndex(courses)).catch(err => setError(err.message)),
    [call]
  )

  useEffect(() => { loadIndex() }, [loadIndex])

  // After an approve / delete / upload: new counts, and fresh papers for what is already on screen.
  const refresh = useCallback(async () => {
    try {
      const keys = Object.keys(loadedRef.current)
      const [, fresh] = await Promise.all([loadIndex(), fetchPapers(keys)])
      setLoaded(prev => ({ ...prev, ...fresh }))
    } catch (err) {
      setError(err.message)
    }
  }, [loadIndex, fetchPapers])

  const changed = useCallback(updated => {
    setLoaded(map => Object.fromEntries(
      Object.entries(map).map(([key, papers]) => [key, papers.map(p => (p.id === updated.id ? updated : p))])
    ))
  }, [])

  const removed = useCallback(id => {
    setLoaded(map => Object.fromEntries(
      Object.entries(map).map(([key, papers]) => [key, papers.filter(p => p.id !== id)])
    ))
  }, [])

  // Every course that matches the search + status, in the chosen order.
  const matching = useMemo(() => {
    if (!index) return null
    const q = query.trim().toLowerCase()
    const squashed = q.replace(/\s+/g, '')

    // Sorting by the fewest is how you find what is missing, so then the courses
    // with nothing (under the current filter) are listed too, straight from the
    // catalogue - the server only knows courses that have at least one paper.
    const withNone = sort.endsWith('-asc')
    const known = new Set(index.map(c => c.key))
    const all = withNone
      ? [
          ...index,
          ...getAllCatalogCourses()
            .filter(c => !known.has(pqKey(c.code)) && known.add(pqKey(c.code)))
            .map(c => ({ key: pqKey(c.code), code: c.code, title: c.title, total: 0, years: {} })),
        ]
      : index

    const visible = all.filter(course => {
      const matches = !q
        || course.code.toLowerCase().replace(/\s+/g, '').includes(squashed)
        || course.title.toLowerCase().includes(q)
      return matches && (withNone || countsOf(course, status).papers > 0)
    })

    return sortCourses(visible, sort, status)
  }, [index, query, status, sort])

  // A new search, filter or order starts again from the first 50.
  useEffect(() => { setShownCount(BATCH) }, [query, status, sort])

  const page = useMemo(() => (matching ? matching.slice(0, shownCount) : null), [matching, shownCount])

  // Fetch the papers of the courses on screen that haven't been fetched yet.
  useEffect(() => {
    if (!page) return
    const need = page
      .filter(c => c.total > 0 && !(c.key in loaded) && !asked.current.has(c.key))
      .map(c => c.key)
    if (!need.length) return

    need.forEach(key => asked.current.add(key))
    setFetching(true)
    fetchPapers(need)
      .then(fresh => setLoaded(prev => ({ ...prev, ...fresh })))
      .catch(err => {
        need.forEach(key => asked.current.delete(key))
        setError(err.message)
      })
      .finally(() => setFetching(false))
  }, [page, loaded, fetchPapers])

  // /delealone/compare?course=mth101 still lands on that course, wherever it falls in the list.
  useEffect(() => {
    if (!matching || !jumpTo || jumped.current) return
    const at = matching.findIndex(c => c.key === jumpTo)
    if (at < 0) { jumped.current = true; return }
    if (at >= shownCount) { setShownCount(Math.ceil((at + 1) / BATCH) * BATCH); return }
    const el = document.getElementById(`course-${jumpTo}`)
    if (el) { jumped.current = true; el.scrollIntoView() }
  }, [matching, shownCount, jumpTo, loaded])

  const courseTotal = matching?.length || 0
  const paperTotal = (matching || []).reduce((sum, c) => sum + countsOf(c, status).papers, 0)
  const left = courseTotal - shownCount

  return (
    <div className="dl-cmp">
      <div className="dl-titlebar"><h1>Compare</h1></div>
      <p className="dl-lead">
        Every course on Nexus with all of its sessions and versions together. They load 50 courses
        at a time, and you can maximize any paper to look closer.
      </p>

      <div className="dl-cmp-bar">
        <input
          className="dl-input"
          placeholder="Find a course, e.g. PHY 101"
          aria-label="Find a course"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <div className="dl-cmp-chips" role="tablist">
          {FILTERS.map(filter => (
            <button
              key={filter.id || 'all'}
              type="button"
              role="tab"
              aria-selected={status === filter.id}
              className={`dl-chip${status === filter.id ? ' on' : ''}`}
              onClick={() => setStatus(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <DeleSelect label="Sort courses" value={sort} options={SORTS} onChange={setSort} />
        {matching && <span className="dl-cmp-count">{plural(courseTotal, 'course')} · {plural(paperTotal, 'paper')}</span>}
      </div>

      {error && <p className="dl-error" role="alert">{error}</p>}
      {!index && !error && <DeleCompareSkeleton />}
      {index?.length === 0 && courseTotal === 0 && <p className="dl-empty">No uploads yet.</p>}
      {index?.length > 0 && courseTotal === 0 && (
        <p className="dl-empty">No course matches that. Try a different code or clear the filter.</p>
      )}

      {(page || []).map(course => {
        const waitingForPapers = course.total > 0 && !(course.key in loaded)
        const all = loaded[course.key] || []
        const papers = status ? all.filter(p => p.status === status) : all
        const sessions = [...new Set(papers.map(p => p.session))]
        const waiting = papers.filter(p => p.status === 'pending').length
        const shownCourse = { ...course, papers }

        return (
          <section key={course.key} id={`course-${course.key}`} className="dl-cmp-course">
            <header className="dl-cmp-head">
              <h2>
                {course.code}
                {course.title && <small>{course.title}</small>}
              </h2>
              <span>
                {plural(waitingForPapers ? countsOf(course, status).papers : papers.length, 'paper')}
                {' · '}
                {plural(waitingForPapers ? countsOf(course, status).years : sessions.length, 'session')}
                {waiting > 0 && <b> · {waiting} waiting</b>}
              </span>
            </header>

            <div className="dl-cmp-grid">
              {waitingForPapers && <p className="dl-empty small">Loading papers…</p>}
              {!waitingForPapers && sessions.length === 0 && <EmptyCourse course={shownCourse} onPublished={refresh} />}
              {sessions.map(session => {
                const group = papers.filter(p => p.session === session)
                const live = group.filter(p => p.status === 'approved').length
                return (
                  <Fragment key={session}>
                    <h3 className="dl-cmp-session">
                      {session}
                      {live > 1 && <span>{live} public versions</span>}
                    </h3>
                    {group.map(paper => (
                      <PaperReview key={paper.id} paper={paper} compact onChanged={changed} onDeleted={removed} onRefresh={refresh} />
                    ))}
                    <UploadSlot course={shownCourse} session={session} onPublished={refresh} />
                  </Fragment>
                )
              })}
            </div>
          </section>
        )
      })}

      {left > 0 && (
        <div className="dl-cmp-more">
          <span>Showing {shownCount} of {courseTotal} courses</span>
          <button
            type="button"
            className="dl-btn ghost"
            disabled={fetching}
            onClick={() => setShownCount(n => n + BATCH)}
          >
            {fetching ? 'Loading…' : `Load ${Math.min(BATCH, left)} more`}
          </button>
        </div>
      )}
    </div>
  )
}
