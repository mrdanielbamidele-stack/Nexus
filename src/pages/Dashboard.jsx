import { useState } from 'react'
import { Link } from 'react-router'
import { useEffectiveCourses } from '../lib/studentCourses'
import TaskEngine from '../utils/taskEngine'
import ScrollToTop from '../components/ScrollToTop'


 

function getLetterGrade(score) {
  if (score >= 70) return 'A'
  if (score >= 60) return 'B'
  if (score >= 50) return 'C'
  if (score >= 45) return 'D'
  if (score >= 40) return 'E'
  return 'F'
}

function getGradePoint(letter) {
  return { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 }[letter] ?? 0
}

// ── CourseGrid ────────────────────────────────────────────────────────────────
// Renders a grid of course cards.
// withProgress=true  → shows the progress bar  (Continue Studying section)
// withProgress=false → shows "View Materials"   (Your Courses section)

function CourseGrid({ courses = [], withProgress = false }) {
  if (!courses.length) {
    return <p className="muted">No Courses Found</p>
  }

  return (
    <div className="cards">
      {courses.map(course => {
        const code     = course.courseCode || course.code || ''
        // In-progress tasks show the activity (e.g. "Campaign", "2023/2024 Past
        // Questions"); the "Your Courses" grid falls back to the course title.
        const subtitle = course.task || course.title || ''
        const pct      = course.progress   ?? 0

        // In-progress tasks carry their own deep link back to where they left
        // off; plain course cards link to the course page.
        const to = course.url || `/${code.replace(/\s+/g, '')}`

        return (
          <div className="card" key={course.key || code}>
            <strong>{code}</strong>
            <div className="course-title">{subtitle}</div>

            {withProgress && (
              <>
                <div className="progress" style={{ margin: '0px 0 4px' }}>
                  <span style={{ width: `${pct}%` }} />
                </div> 
              </>
            )}

            <Link to={to}>
              <button>{withProgress ? 'Continue' : 'View Materials'}</button>
            </Link>
          </div>
        )
      })}
    </div>
  )
}

// ── CampaignWidget ────────────────────────────────────────────────────────────
// Shows either the "Start Campaign" prompt or live campaign progress.

function CampaignWidget() {
  const [campaign] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nexus_campaign')) || null }
    catch { return null }
  })

  const hasCampaign = campaign?.active

  // ── No campaign ──────────────────────────────────────────────────────────
  if (!hasCampaign) {
    return (
      <div className="campaign-widget">
        <div className="widget-left">
          <div className="camp-widget-start-label">Start a Campaign</div>
          <h2>Campaign Mode -<br />Semester Readiness</h2>
          <p>Work through all your semester courses, earn grades, and track your predicted GPA in real time.</p>
          <Link to="/campaign">
            <button className="btn-campaign">Start New Campaign</button>
          </Link>
        </div>
        <div className="readiness-card">
          <div className="readiness-header">Your Readiness</div>
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#9ca3af', fontSize: 13 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}></div>
            No courses completed yet.<br />Start a campaign to track your progress!
          </div>
          <div className="divider" />
          <div className="stats-footer">
            <div>
              <div className="gpa-label">Weighted GPA</div>
              <div className="gpa-score">– / 5.0</div>
            </div>
            <div className="circle-chart" style={{ background: 'conic-gradient(#e5e7eb 0% 100%)' }}>
              <div className="circle-inner" style={{ color: '#9ca3af' }}>–</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Active campaign ───────────────────────────────────────────────────────
  const entries      = Object.entries(campaign.courses || {})
  const totalCount   = entries.length
  const completed    = entries.filter(([, c]) => c.status === 'completed')
  const doneCount    = completed.length
  const pct          = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  let pts = 0, credits = 0
  entries.forEach(([, c]) => {
    if (c.status === 'completed') {
      const gp = getGradePoint(getLetterGrade(c.score))
      pts     += gp * (c.creditHours || 1)
      credits += (c.creditHours || 1)
    }
  })
  const gpa = credits === 0 ? '0.00' : (pts / credits).toFixed(2)

  const recentItems = completed.slice(-3).map(([code, c]) => ({
    code, score: c.score, creditHours: c.creditHours || 1
  }))

  return (
    <div className="campaign-widget">
      <div className="widget-left">
        <div className="camp-widget-start-label" style={{ background: '#d1fae5', color: '#065f46' }}>
          Campaign Active
        </div>
        <h2>Campaign Mode –<br />Semester Readiness</h2>
        <p>{doneCount} of {totalCount} courses completed · {pct}% done</p>
        <div style={{ margin: '12px 0 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
            <span>Progress</span><span>{pct}%</span>
          </div>
          <div style={{ height: 8, background: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#7c3aed,#4c1d95)', borderRadius: 999, transition: 'width .5s ease' }} />
          </div>
        </div>
        <Link to="/campaign">
          <button className="btn-campaign">Continue Campaign →</button>
        </Link>
      </div>

      <div className="readiness-card">
        <div className="readiness-header">Recent Results</div>
        {recentItems.length > 0
          ? recentItems.map(item => (
              <div className="mini-course-row" key={item.code}>
                <div className="mini-course-name">
                  {item.code} <span style={{ fontWeight: 700, color: '#7c3aed' }}>[{getLetterGrade(item.score)}]</span>
                </div>
                <div className="mini-progress-track">
                  <div className="mini-progress-fill" style={{ width: `${item.score ?? 0}%` }} />
                </div>
              </div>
            ))
          : <div style={{ textAlign: 'center', padding: '16px 0', color: '#9ca3af', fontSize: 13 }}>No courses completed yet -keep going!</div>
        }
        <div className="divider" />
        <div className="stats-footer">
          <div>
            <div className="gpa-label">Weighted GPA</div>
            <div className="gpa-score">{gpa} / 5.0</div>
          </div>
          <div className="circle-chart" style={{ background: `conic-gradient(var(--primary) 0% ${(gpa / 5) * 100}%, #e5e7eb ${(gpa / 5) * 100}% 100%)` }}>
            <div className="circle-inner">{gpa}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Dashboard page ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const username   = localStorage.getItem('username')  || 'Guest'
  const allCourses = useEffectiveCourses()
  const inProgress = TaskEngine.getContinueList()



  // Search state for "Your Courses" section
  const [query, setQuery] = useState('')
  const [kwuery, setKwuery] = useState('')
  // How many in-progress tasks to show -starts at 4, doubles on "Show more".
  const [visibleCount, setVisibleCount] = useState(4)
  const filtered = query
    ? allCourses.filter(c =>
        c.code.toLowerCase().includes(query.toLowerCase()) ||
        c.title.toLowerCase().includes(query.toLowerCase())
      )
    : allCourses

      const Kiltered = kwuery
    ? inProgress.filter(c =>
        (c.courseCode || '').toLowerCase().includes(kwuery.toLowerCase()) ||
        (c.task || '').toLowerCase().includes(kwuery.toLowerCase()) ||
        (c.title || '').toLowerCase().includes(kwuery.toLowerCase())
      )
    : inProgress


  return (
    <div> 
      <ScrollToTop />
      <h1 style={{ marginBottom: 0 }}>Hi {username}👋</h1>
      <p className="muted" style={{ margin: 0 }}>What course are we reading today?</p>

      {/* Continue Studying -only shows if there are in-progress sessions */}
      {inProgress.length > 0 && (
        <section className="section">
          <h2 style={{marginTop: -20 }}>Continue Studying</h2>
         <div className="search">
          <input
            type="text"
            placeholder="Search courses..."
            value={kwuery}
            onChange={e => setKwuery(e.target.value)}
            autoComplete="off"
          />
        </div>
          <CourseGrid courses={Kiltered.slice(0, visibleCount)} withProgress />
          {Kiltered.length > visibleCount && (
            <button
              className="show-more-btn"
              onClick={() => setVisibleCount(c => c * 2)}
            >
              Show more ({Kiltered.length - visibleCount} more)
            </button>
          )}
        </section>
      )}

      {/* Campaign widget */}
      <CampaignWidget />

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
        <CourseGrid courses={filtered} />
      </section>
    </div>
  )
}