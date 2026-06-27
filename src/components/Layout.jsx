import { useState, useEffect } from 'react'
import { Outlet } from 'react-router'
import Sidebar from './Sidebar'
import NotificationBell from './NotificationBell'
import NotificationToast from './NotificationToast'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
        isOpen={sidebarOpen}
        onNavClick={closeMobile}
      />

      {/* Notification bell - fixed top-right, visible on every page/device */}
      <div className="nx-bell-fixed">
        <NotificationBell />
      </div>

      <main className="main">
        <Outlet />  {/* ← active page renders here */}
      </main>

      <NotificationToast />
    </div>
  )
}