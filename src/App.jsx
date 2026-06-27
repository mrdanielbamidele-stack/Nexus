import { Routes, Route, Navigate } from 'react-router'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import NexusAI from './pages/NexusAI'
import PastQuestions from './pages/PastQuestions'
import CoursePastQuestions from './pages/CoursePastQuestions'
import PastQuestionQuiz from './pages/PastQuestionQuiz'
import Campaign from './pages/Campaign'
import CampaignTest from './pages/CampaignTest'
import Settings from './pages/Settings'
import FlashCards from './pages/FlashCards'
import FlashCardDeck from './pages/FlashCardDeck'
import LecturerPortal from './pages/LecturerPortal'
import LibraryPortal from './pages/LibraryPortal'
import CoursePage from './pages/CoursePage'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      {/* Student auth flow (fake OAuth) -public */}
      <Route path="/auth" element={<Auth />} />

      {/* Admin portal -standalone page, has its own (Supabase) auth */}
      <Route path="/admin" element={<LecturerPortal />} />

      {/* Library portal -standalone page, shares the Supabase auth session */}
      <Route path="/library" element={<LibraryPortal />} />

      {/* Main app with sidebar layout -requires a signed-in student */}
      <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="nexusai" element={<NexusAI />} />
        <Route path="pastquestions" element={<PastQuestions />} />
        <Route path="pastquestions/:courseCode" element={<CoursePastQuestions />} />
        <Route path="pastquestions/:courseCode/:year" element={<PastQuestionQuiz />} />
        <Route path="campaign" element={<Campaign />} />
        <Route path="campaign/:courseCode" element={<CampaignTest />} />
        <Route path="flashcards" element={<FlashCards />} />
        <Route path="flashcards/:courseCode" element={<FlashCardDeck />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Course page -has its own sidebar, outside Layout */}
      <Route path="/:courseCode" element={<RequireAuth><CoursePage /></RequireAuth>} />

      {/* Catch-all -anything that didn't match above renders the 404 page */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}