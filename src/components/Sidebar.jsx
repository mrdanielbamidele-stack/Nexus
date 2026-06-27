import { NavLink, useLocation } from 'react-router'

// Top-level routes that own their own sidebar item. Any other single-segment
// path (e.g. /cos101) is a course page, where Dashboard should stay active.
const TOP_LEVEL_ROUTES = ['dashboard', 'nexusai', 'pastquestions', 'campaign', 'flashcards', 'settings', 'admin']

export default function Sidebar({ isOpen, onNavClick }) {
  const { pathname } = useLocation()
  const firstSegment = pathname.split('/').filter(Boolean)[0]
  const onCoursePage = firstSegment && !TOP_LEVEL_ROUTES.includes(firstSegment)

  const navItems = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/nexusai',   label: 'Nexus AI' },
    { to: '/pastquestions',      label: 'Past Questions' },
    { to: '/campaign',  label: 'Campaign' },
    { to: '/flashcards', label: 'Flash Cards' },
    { to: '/settings',  label: 'Settings' },
  ]

  return (
    <aside
      className={`sidebar ${isOpen ? 'active' : ''}`}
      id="sidebar"
    >
      <div className="logo">
        <span className="logo-badge">N</span>
        Nexus
      </div>

      <nav className="nav">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              (isActive || (item.to === '/dashboard' && onCoursePage)) ? 'active' : ''
            }
            onClick={onNavClick}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}