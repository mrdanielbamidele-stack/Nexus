import { Routes, Route, Navigate, useParams } from 'react-router'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import UploadShell from './components/UploadShell'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import PastQuestions from './pages/PastQuestions'
import CoursePastQuestions from './pages/CoursePastQuestions'
import PastQuestionViewer from './pages/PastQuestionViewer'
import Settings from './pages/Settings'
import Upload from './pages/Upload'
import AdminGate from './pages/admin/AdminGate'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminSettings from './pages/admin/AdminSettings'
import DeleGate from './pages/dele/DeleGate'
import DeleOverview from './pages/dele/DeleOverview'
import DelePapers from './pages/dele/DelePapers'
import DeleCompare from './pages/dele/DeleCompare'
import DeleUsers from './pages/dele/DeleUsers'
import NotFound from './pages/NotFound'
import Privacy from './pages/Privacy'
import { isDemo } from './lib/demo'
import { isCourseCode, pqKey } from './lib/courseSlug'

// /cos101 used to be a course's materials page. Materials now live with the
// past questions, so a course-shaped address goes straight to that course's papers.
function CourseRedirect() {
  const { courseCode } = useParams()
  if (!isCourseCode(courseCode)) return <NotFound />
  return <Navigate to={`/pastquestions/${pqKey(courseCode)}`} replace />
}

export default function App() {
  return (
    <Routes>
      {/* Demo: no sign-in and no staff pages - anything like that goes home */}
      {isDemo && ['auth', 'admin', 'delealone'].map(path => (
        <Route key={path} path={`/${path}/*`} element={<Navigate to="/" replace />} />
      ))}

      {/* Public privacy policy (the address Google's sign-in screen links to) */}
      <Route path="/privacy" element={<Privacy />} />

      {/* Student sign in / sign up / forgot password */}
      <Route path="/auth" element={<Auth />} />

      {/* Staff: sign in, then the dashboard organised by department */}
      <Route path="/admin" element={<AdminGate />}>
        <Route index element={<AdminDashboard />} />
        <Route path="upload" element={<Upload variant="staff" />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="pastquestions/:courseCode" element={<CoursePastQuestions />} />
        <Route path="pastquestions/:courseCode/:year" element={<PastQuestionViewer />} />
      </Route>

      {/* The owner's control room: two passwords, then everything */}
      <Route path="/delealone" element={<DeleGate />}>
        <Route index element={<DeleOverview />} />
        <Route path="papers" element={<DelePapers />} />
        <Route path="upload" element={<Upload variant="owner" />} />
        <Route path="compare" element={<DeleCompare />} />
        <Route path="users" element={<DeleUsers />} />
      </Route>

      {/* Upload -open to everyone; signed-in students get the sidebar layout.
          Not in the demo: /demo/upload doesn't exist there (it shows the 404 page). */}
      {!isDemo && (
        <Route path="/upload" element={<UploadShell />}>
          <Route index element={<Upload />} />
        </Route>
      )}

      {/* Main app with sidebar layout -requires a signed-in student */}
      <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<Dashboard />} />
        {/* Old /dashboard URL (bookmarks, history) now just goes home */}
        <Route path="dashboard" element={<Navigate to="/" replace />} />
        <Route path="pastquestions" element={<PastQuestions />} />
        <Route path="pastquestions/:courseCode" element={<CoursePastQuestions />} />
        <Route path="pastquestions/:courseCode/:year" element={<PastQuestionViewer />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* A course code on its own (/cos101) -> that course's past questions */}
      <Route path="/:courseCode" element={<RequireAuth><CourseRedirect /></RequireAuth>} />

      {/* Catch-all -anything that didn't match above renders the 404 page */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
