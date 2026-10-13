import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import Sidebar from './Sidebar'
import NotificationBell from './NotificationBell'
import ContactModal from './ContactModal'
import FloatingChatWidget from './FloatingChatWidget'
import ImpersonationBanner from './ImpersonationBanner'

const VALID_MODALS = ['contact']

// The app frame: sidebar, notification bell and the page itself.
// `area="admin"` is the same frame with the staff navigation.
export default function Layout({ area = 'student' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  // Lazy initializer -captures the URL's `modal` param (e.g. a deep link to
  // /?modal=contact) on first render, before the index route's <Navigate>
  // strips the query string on redirect to /.
  const [activeModal, setActiveModal] = useState(() => {
    const requested = new URLSearchParams(location.search).get('modal')
    return VALID_MODALS.includes(requested) ? requested : null
  })
  const isDesktop = () => window.innerWidth >= 768

  const toggleMobile = () => setSidebarOpen(prev => !prev)
  const closeMobile = () => setSidebarOpen(false)

  useEffect(() => {
    document.title = 'Nexus'
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (isDesktop()) setSidebarOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="app">
      {/* Phones only: on desktop this lives in the sidebar (see Sidebar.jsx) */}
      <ImpersonationBanner variant="strip" />

      {/* Hamburger -mobile only */}
      <button
        className={`menu-btn ${sidebarOpen ? 'hidden' : ''}`}
        onClick={toggleMobile}
      >
        ☰
      </button>

      {/* Dark overlay -mobile only */}
      <div
        className={`overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={closeMobile}
      />

      <Sidebar
        area={area}
        isOpen={sidebarOpen}
        onNavClick={closeMobile}
        onOpenModal={setActiveModal}
      />

      {/* Notification bell - fixed top-right, visible on every page/device */}
      <div className="nx-bell-fixed">
        <NotificationBell />
      </div>

      <main className="main">
        <Outlet />  {/* ← active page renders here */}
      </main>

      {activeModal === 'contact' && <ContactModal onClose={() => setActiveModal(null)} />}

      <FloatingChatWidget />
    </div>
  )
}
