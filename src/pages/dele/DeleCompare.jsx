import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import PaperReview from './PaperReview'
import { useDele } from './deleContext'
import { DeleCoursesSkeleton, DeleStackSkeleton } from './DeleSkeletons'

// Every upload for one course in one long list - photos, PDFs and documents all
// visible - so versions of the same paper ("PHY 101 2023/2024", "... v2") can be
// compared side by side and approved or deleted from here.
export default function DeleCompare() {
  const { call } = useDele()
  const [params, setParams] = useSearchParams()
  const course = params.get('course') || ''

  const [courses, setCourses] = useState(null)
  const [query, setQuery] = useState('')
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    call('/compare/courses').then(({ courses: list }) => setCourses(list)).catch(err => setError(err.message))
  }, [call])

  const load = useCallback(async () => {
    if (!course) return
    setError('')
    try {
      setDetail(await call(`/compare?course=${encodeURIComponent(course)}`))
    } catch (err) {
      setError(err.message)
    }
  }, [call, course])

  useEffect(() => {
    setDetail(null)
    load()
  }, [load])

  const shownCourses = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/\s+/g, '')
    if (!q) return courses || []
    return (courses || []).filter(c => c.code.toLowerCase().replace(/\s+/g, '').includes(q) || c.title.toLowerCase().includes(query.trim().toLowerCase()))
  }, [courses, query])

  // Group the papers by session, newest session first (the server already sorted them).
  const groups = useMemo(() => {
    const map = new Map()
    for (const paper of detail?.papers || []) {
      if (!map.has(paper.session)) map.set(paper.session, [])
      map.get(paper.session).push(paper)
    }
    return [...map.entries()]
  }, [detail])

  const changed = updated =>
    setDetail(d => ({ ...d, papers: d.papers.map(p => (p.id === updated.id ? updated : p)) }))
  const removed = id => setDetail(d => ({ ...d, papers: d.papers.filter(p => p.id !== id) }))

  /* ---- no course chosen: pick one ---- */
  if (!course) {
    return (
      <div>
        <div className="dl-titlebar"><h1>Compare</h1></div>
        <p className="dl-lead">Choose a course to see every upload for it in one place.</p>

        <input
          className="dl-input wide"
          placeholder="Search a course, e.g. PHY 101"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />

        {error && <p className="dl-error" role="alert">{error}</p>}
        {!courses && !error && <DeleCoursesSkeleton />}
        {courses?.length === 0 && <p className="dl-empty">No uploads yet.</p>}

        <div className="dl-course-grid">
          {shownCourses.map(c => (
            <button key={c.key} type="button" className="dl-course" onClick={() => setParams({ course: c.key })}>
              <strong>{c.code}</strong>
              <span>{c.title}</span>
              <em>
                {c.total} upload{c.total === 1 ? '' : 's'}
                {c.pending > 0 && <b> · {c.pending} waiting</b>}
              </em>
            </button>
          ))}
        </div>
      </div>
    )
  }

  /* ---- one course ---- */
  return (
    <div>
      <div className="dl-titlebar">
        <h1>{detail?.course.code || course} <small>{detail?.course.title}</small></h1>
        <button type="button" className="dl-btn ghost" onClick={() => setParams({})}>All courses</button>
      </div>

      {error && <p className="dl-error" role="alert">{error}</p>}
      {!detail && !error && <DeleStackSkeleton count={2} label="Loading uploads" />}
      {detail && detail.papers.length === 0 && <p className="dl-empty">Nothing has been uploaded for this course.</p>}

      {groups.map(([session, papers]) => (
        <section key={session} className="dl-session">
          <h2>{session} <small>{papers.length} upload{papers.length === 1 ? '' : 's'}</small></h2>
          <div className="dl-stack">
            {papers.map(paper => (
              <PaperReview key={paper.id} paper={paper} onChanged={changed} onDeleted={removed} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
