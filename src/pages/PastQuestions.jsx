import { Link } from 'react-router'
import { useEffectiveCourses } from '../lib/studentCourses'
import { getAvailableYears, pqKey, usePapers, usePapersReady } from '../lib/pastQuestions'
import { CourseCardPending } from '../components/Skeleton'
import ScrollToTop from '../components/ScrollToTop';
import LynklensAd from '../components/LynklensAd';

function RenderTestCards({ courses }) {
  const ready = usePapersReady()
  return (
    <>
      {courses.map((course) => {
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
            <p className="muted" style={{ marginTop: -10 }}>
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
                Browse Past Questions
              </button>
            </Link>
          </div>
        )
      })}
    </>
  )
}

export default function PastQuestions() {
  usePapers() // re-render when the paper list loads or changes
  const allCourses = useEffectiveCourses()
  return (
    <>
     <ScrollToTop />
      <h1>Past Questions</h1>
      <div className="cards">
        <RenderTestCards courses={allCourses} />
      </div>

      <LynklensAd variant="banner" />
    </>
  )
}
