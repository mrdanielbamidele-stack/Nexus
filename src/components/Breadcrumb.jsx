import { Link, useLocation } from 'react-router'

const LABELS = {
  '':               'Dashboard',
  'dashboard':      'Dashboard',
  'nexusai':        'Nexus AI',
  'past':           'Past Questions',
  'campaign':       'Campaign',
  'settings':       'Settings',
  'courses':        'Courses',
  'pastquestions':  'Past Questions',
  'flashcards':     'Flash Cards',
}

export default function Breadcrumb() {
  const location = useLocation()
  const parts = location.pathname.split('/').filter(Boolean)

  if (parts.length <= 1) return null  

  return (
    <nav className="nx-breadcrumb">
      <Link className="nx-bc-item" to="/dashboard">
        <span className="nx-bc-home-dot" />
        Dashboard
      </Link>
      {parts.map((part, i) => {
        const path = '/' + parts.slice(0, i + 1).join('/')
        const label = LABELS[part] || part
        const isLast = i === parts.length - 1
        return (
          <span key={path} style={{ display: 'flex', alignItems: 'center' }}>
            <span className="nx-bc-sep">/</span>
            {isLast
              ? <span className="nx-bc-item nx-bc-current">{label}</span>
              : <Link className="nx-bc-item" to={path}>{label}</Link>
            }
          </span>
        )
      })}
    </nav>
  )
}