import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import HeroBanner from '../../components/HeroBanner'
import ScrollToTop from '../../components/ScrollToTop'
import { courseCatalog } from '../../data/courseCatalog'
import { coursesOfDepartment } from '../../data/faculties'
import { CourseCardPending } from '../../components/Skeleton'
import { pqKey, getAvailableYears, usePapers, usePapersReady } from '../../lib/pastQuestions'
import { useSession } from '../../lib/session'

// What staff see instead of "Your Courses": every course of THEIR department
// (chosen at sign-up, changeable in Settings), grouped by level, with how many
// years of past questions each one has.
export default function AdminDashboard() {
  usePapers() // re-render when papers load or change
  const ready = usePapersReady()
  const { admin } = useSession()
  const [query, setQuery] = useState('')

  const courses = useMemo(
    () => coursesOfDepartment(courseCatalog, admin.department),
    [admin.department]
  )

  const term = query.trim().toLowerCase()
  const shown = term
    ? courses.filter(c => c.code.toLowerCase().includes(term) || c.title.toLowerCase().includes(term))
    : courses

  // Group by level, in teaching order.
  const levels = [...new Set(shown.map(c => c.level))]

  return (
    <div>
      <ScrollToTop />
      <h1 style={{ marginBottom: 0 }}>Hi {admin.username}👋</h1>
      <p className="muted" style={{ margin: 0 }}>
        {admin.faculty} · {admin.department}
      </p>

      <HeroBanner className="hb-dashboard" title="Past questions, organised by department.">
        You're seeing the courses of {admin.department}. Open a course to read its papers, or upload
        a solved or properly typed paper to help students.
        <br />
        <Link to="/admin/settings" style={{ color: 'inherit', fontWeight: 700 }}>Change department</Link>
      </HeroBanner>

      <section className="section">
        <div className="search">
          <input
            type="text"
            placeholder="Search courses..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoComplete="off"
          />
        </div>

        {levels.length === 0 && <p className="muted">No courses match your search.</p>}

        {levels.map(level => (
          <div key={level}>
            <h2>{/^\d+$/.test(level) ? `${level} level` : level}</h2>
            <div className="cards">
              {shown.filter(c => c.level === level).map(course => {
                const years = getAvailableYears(course.code).length
                if (!ready) {
                  // The course itself is known; what's available isn't yet.
                  return (
                    <div className="card" key={course.code}>
                      <strong>{course.code}</strong>
                      <div className="course-title">{course.title}</div>
                      <CourseCardPending />
                    </div>
                  )
                }
                return (
                  <div className="card" key={course.code}>
                    <strong>{course.code}</strong>
                    <div className="course-title">{course.title}</div>
                    <p className="muted" style={{ marginTop: -10, marginBottom: 6 }}>
                      {years > 0 ? `${years} year${years === 1 ? '' : 's'} available` : 'No years available yet'}
                    </p>
                    <Link
                      to={`/admin/pastquestions/${pqKey(course.code)}`}
                      style={{ textDecoration: 'none', color: 'inherit', pointerEvents: years === 0 ? 'none' : 'auto' }}
                    >
                      <button
                        disabled={years === 0}
                        style={{ opacity: years === 0 ? 0.5 : 1, cursor: years === 0 ? 'not-allowed' : 'pointer' }}
                      >
                        Browse Past Questions
                      </button>
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
