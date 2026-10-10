import { Link, Outlet, useLocation } from 'react-router'
import Layout from './Layout'
import { isAuthed } from '../lib/studentAuth'

// Frame for /upload. The page is open to everyone: a signed-in student gets the
// normal app layout (sidebar etc.); a visitor gets a plain page with a way in.
export default function UploadShell() {
  useLocation() // re-check sign-in state on every navigation, not just on first load

  if (isAuthed()) return <Layout />

  return (
    <div className="up-public">
      <header className="up-public-bar">
        <div className="logo">
          <span className="logo-badge">N</span>
          Nexus
        </div>
        <Link to="/auth" className="up-public-signin">Sign in</Link>
      </header>
      <main className="up-public-main">
        <Outlet />
      </main>
    </div>
  )
}
