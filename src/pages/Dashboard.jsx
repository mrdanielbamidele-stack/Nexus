import { useState } from 'react'
import { Link } from 'react-router'
import ScrollToTop from '../components/ScrollToTop'
import HeroBanner from '../components/HeroBanner'
import LynklensAd from '../components/LynklensAd'
import { useEffectiveCourses, useReseatCourses } from '../lib/studentCourses'
import { CourseCardPending } from '../components/Skeleton'
import { getAvailableYears, pqKey, usePapers, usePapersReady } from '../lib/pastQuestions'
import { getContinueList } from '../lib/readingProgress'

// ── ContinueGrid ──────────────────────────────────────────────────────────────
// Papers the student has really been reading (not just peeked at - see
// readingProgress.js), each linking back to where they left off.

function ContinueGrid({ items }) {
  return (
    <div className="cards">
      {items.map(item => (
        <div className="card" key={item.key}>
          <strong>{item.courseCode}</strong>
          <div className="progress-title">{item.task}</div>
          <div className="progress" style={{ margin: '8px 0 8px' }}>
            <span style={{ width: `${item.progress}%` }} />
          </div>

          <Link to={item.url}>
            <button>Continue</button>
          </Link>
        </div>
      ))}
    </div>
  )
}

// ── PastQuestionsGrid ─────────────────────────────────────────────────────────
// "Your Courses" grid - static course list, each card linking straight to its
// Past Questions. Availability text/disabled state is derived live from
// lib/pastQuestions.js, same as the dedicated Past Questions page.

function PastQuestionsGrid({ courses = [] }) {
  const ready = usePapersReady()

  if (!courses.length) {
    return <p className="muted">No Courses Found</p>
  }

  return (
    <div className="cards" aria-busy={!ready}>
      {courses.map(course => {
        const sessions = getAvailableYears(course.code).length
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
            <p className="muted" style={{ marginTop: -10 , marginBottom: 6 }}>
              {sessions > 0
                ? `${sessions} year${sessions === 1 ? '' : 's'} available`
                : 'No years available yet'}
            </p>

            <Link
              to={`/pastquestions/${pqKey(course.code)}`}
              style={{ textDecoration: 'none', color: 'inherit', pointerEvents: sessions === 0 ? 'none' : 'auto' }}
            >
              <button
                disabled={sessions === 0}
                style={{
                  opacity: sessions === 0 ? 0.5 : 1,
                  cursor: sessions === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                Past Questions
              </button>
            </Link>
          </div>
        )
      })}
    </div>
  )
}

// ── Dashboard page ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const username = localStorage.getItem('username') || 'Guest'
  usePapers() // re-render when the paper list loads or changes
  const inProgress = getContinueList()
  // The courses on the student's account (their programme + level to begin with).
  const courseList = useEffectiveCourses()
  // Last semester's courses they are sitting again (added in Settings).
  const reseatList = useReseatCourses()

  // Search state for "Your Courses" section
  const [query, setQuery] = useState('')
  // How many in-progress papers to show - starts at 4, doubles on "Show more".
  const [visibleCount, setVisibleCount] = useState(4)
  const filtered = query
    ? courseList.filter(c =>
      c.code.toLowerCase().includes(query.toLowerCase()) ||
      c.title.toLowerCase().includes(query.toLowerCase())
    )
    : courseList

  return (
    <div>
      <ScrollToTop />
      <h1 style={{ marginBottom: 0 }}>Hi {username}👋</h1>
      <p className="muted" style={{ margin: 0 }}>What course are we studying today?</p>

      {/* A little encouragement - leans on real progress when there is some */}
      <HeroBanner
        className="hb-dashboard"
        title={inProgress.length > 0 ? 'Small steps, big grades.' : 'Small steps, big grades.'}
      >
        {inProgress.length > 0
          ? 'Every paper you read makes exam day a little easier. Pick up right where you left off.'
          : 'Open one past paper today. One paper at a time is how confident exam days are made.'}
        <br />
        You’ve got this, {username}.
      </HeroBanner>

      <LynklensAd variant="banner" />

      {/* Continue Studying - only shows once a paper has been read for real */}
      {inProgress.length > 0 && (
        <section className="section">
          <h2 style={{ marginTop: 0 }}>Continue Studying</h2>
          <ContinueGrid items={inProgress.slice(0, visibleCount)} />
          {inProgress.length > visibleCount && (
            <button
              className="show-more-btn"
              onClick={() => setVisibleCount(c => c * 2)}
            >
              Show more ({inProgress.length - visibleCount} more)
            </button>
          )}
        </section>
      )}

      {/* All courses with search */}
      <section className="section">
        <h2>Your Courses</h2>
        <div className="search">
          <input
            type="text"
            placeholder="Search courses..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoComplete="off"
          />
        </div>
        <PastQuestionsGrid courses={filtered} />
      </section>

      {/* Courses carried over from last semester - added in Settings */}
      <section className="section">
        <h2>Reseat Courses</h2>
        {reseatList.length > 0 ? (
          <PastQuestionsGrid courses={reseatList} />
        ) : (
          <>
            <p className="muted" style={{ marginTop: 0 }}>
             Add the courses you are sitting again from last
              semester and their past questions will show up here.
            </p>
            <Link to="/settings?section=reseat">
              <button className="show-more-btn">Add reseat courses</button>
            </Link>
          </>
        )}
      </section>

      <LynklensAd variant="footer" />
    </div>
  )
}