import { Link } from 'react-router'

// Replaces the old breadcrumb trail site-wide: one underlined "Back to ..." link
// pointing at the parent page. Pass `to` for a route, or `onClick` for in-page
// views that switch state instead of navigating.
export default function BackLink({ to, onClick, children }) {
  if (onClick) {
    return (
      <button type="button" className="pq-dash-back" onClick={onClick}>
        {children}
      </button>
    )
  }
  return (
    <Link className="pq-dash-back" to={to}>
      {children}
    </Link>
  )
}
