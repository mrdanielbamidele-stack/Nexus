import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import PaperReview from './PaperReview'
import { useDele } from './deleContext'
import { DeleCompareSkeleton } from './DeleSkeletons'

const FILTERS = [
  { id: '', label: 'All' },
  { id: 'approved', label: 'Approved' },
  { id: 'pending', label: 'Waiting' },
  { id: 'rejected', label: 'Rejected' },
]

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

// Every course on Nexus, one after another: its sessions and versions grouped
// together, each with a small preview you can maximize. Scroll through it all
// instead of opening courses one by one.
export default function DeleCompare() {
  const { call } = useDele()
  const [params] = useSearchParams()
  const jumpTo = params.get('course') || ''

  const [courses, setCourses] = useState(null)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const jumped = useRef(false)

  const load = useCallback(
    () => call('/compare/all').then(({ courses: list }) => setCourses(list)).catch(err => setError(err.message)),
    [call]
  )

  useEffect(() => { load() }, [load])

  // /delealone/compare?course=mth101 still lands on that course.
  useEffect(() => {
    if (!courses || !jumpTo || jumped.current) return
    jumped.current = true
    document.getElementById(`course-${jumpTo.toLowerCase()}`)?.scrollIntoView()
  }, [courses, jumpTo])

  const changed = useCallback(updated => {
    setCourses(list => list.map(c => ({ ...c, papers: c.papers.map(p => (p.id === updated.id ? updated : p)) })))
  }, [])

  const removed = useCallback(id => {
    setCourses(list => list
      .map(c => ({ ...c, papers: c.papers.filter(p => p.id !== id) }))
      .filter(c => c.papers.length > 0))
  }, [])

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    const squashed = q.replace(/\s+/g, '')

    return (courses || []).flatMap(course => {
      const matches = !q
        || course.code.toLowerCase().replace(/\s+/g, '').includes(squashed)
        || course.title.toLowerCase().includes(q)
      if (!matches) return []

      const papers = status ? course.papers.filter(p => p.status === status) : course.papers
      return papers.length ? [{ ...course, papers }] : []
    })
  }, [courses, query, status])

  const paperCount = shown.reduce((sum, c) => sum + c.papers.length, 0)

  return (
    <div className="dl-cmp">
      <div className="dl-titlebar"><h1>Compare</h1></div>
      <p className="dl-lead">
        Every course on Nexus with all of its sessions and versions together. Scroll through them,
        and maximize any paper to look closer.
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
        {courses && <span className="dl-cmp-count">{plural(shown.length, 'course')} · {plural(paperCount, 'paper')}</span>}
      </div>

      {error && <p className="dl-error" role="alert">{error}</p>}
      {!courses && !error && <DeleCompareSkeleton />}
      {courses?.length === 0 && <p className="dl-empty">No uploads yet.</p>}
      {courses?.length > 0 && shown.length === 0 && (
        <p className="dl-empty">No course matches that. Try a different code or clear the filter.</p>
      )}

      {shown.map(course => {
        const sessions = [...new Set(course.papers.map(p => p.session))]
        const waiting = course.papers.filter(p => p.status === 'pending').length

        return (
          <section key={course.key} id={`course-${course.key}`} className="dl-cmp-course">
            <header className="dl-cmp-head">
              <h2>
                {course.code}
                {course.title && <small>{course.title}</small>}
              </h2>
              <span>
                {plural(course.papers.length, 'paper')} · {plural(sessions.length, 'session')}
                {waiting > 0 && <b> · {waiting} waiting</b>}
              </span>
            </header>

            <div className="dl-cmp-grid">
              {sessions.map(session => {
                const group = course.papers.filter(p => p.session === session)
                const live = group.filter(p => p.status === 'approved').length
                return (
                  <Fragment key={session}>
                    <h3 className="dl-cmp-session">
                      {session}
                      {live > 1 && <span>{live} public versions</span>}
                    </h3>
                    {group.map(paper => (
                      <PaperReview key={paper.id} paper={paper} compact onChanged={changed} onDeleted={removed} onRefresh={load} />
                    ))}
                  </Fragment>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
