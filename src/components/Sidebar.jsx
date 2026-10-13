import { NavLink, useLocation } from 'react-router'
import { isDemo } from '../lib/demo'
import ImpersonationBanner from './ImpersonationBanner'

// Sections that own their own sidebar item. Everything else - the past
// questions flow (/pastquestions/..., /admin/pastquestions/...), which has no
// dedicated nav item - keeps Dashboard active, since that's where a person
// reaches it from.
const TOP_LEVEL_ROUTES = ['settings', 'upload']

// `area` is 'student' (the main site) or 'admin' (everything under /admin).
export default function Sidebar({ area = 'student', isOpen, onNavClick, onOpenModal }) {
  const { pathname } = useLocation()
  const base = area === 'admin' ? '/admin' : ''

  const segments = pathname.split('/').filter(Boolean)
  const section = (area === 'admin' ? segments.slice(1) : segments)[0]
  const onPapers = section && !TOP_LEVEL_ROUTES.includes(section)

  function openModal(name) {
    onOpenModal(name)
    onNavClick?.()
  }

  return (
    <aside
      className={`sidebar ${isOpen ? 'active' : ''}`}
      id="sidebar"
    >
      <div className="logo">
        <span className="logo-badge">N</span>
        {area === 'admin' ? 'Nexus' : 'Nexus'}
      </div>

      <nav className="nav">
        <NavLink
          to={base || '/'}
          end
          className={({ isActive }) => (isActive || onPapers) ? 'active' : ''}
          onClick={onNavClick}
        >
          Dashboard
        </NavLink>

        {/* The demo can't send papers, so it has no Upload item */}
        {!isDemo && (
          <NavLink
            to={`${base}/upload`}
            className={({ isActive }) => isActive ? 'active' : ''}
            onClick={onNavClick}
          >
            Upload
          </NavLink>
        )}

        <button type="button" onClick={() => openModal('contact')}>
          Contact
        </button>

        <NavLink
          to={`${base}/settings`}
          className={({ isActive }) => isActive ? 'active' : ''}
          onClick={onNavClick}
        >
          Settings
        </NavLink>
      </nav>

      {/* Only appears while the owner is "logged in as" someone */}
      <ImpersonationBanner variant="card" />
    </aside>
  )
}
