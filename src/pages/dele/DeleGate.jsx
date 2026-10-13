import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { api } from '../../lib/api'
import PasswordInput from '../../components/PasswordInput'
import UiIcon from '../../components/UiIcon'
import { DeleContext } from './deleContext'
import { DeleShellSkeleton } from './DeleSkeletons'
import './Dele.css'

const TABS = [
  { to: '/delealone', label: 'Overview', end: true },
  { to: '/delealone/papers', label: 'Papers' },
  { to: '/delealone/upload', label: 'Upload' },
  { to: '/delealone/compare', label: 'Compare' },
  { to: '/delealone/users', label: 'Users' },
]

// /delealone: two passwords, then the owner's control room. Once in, it is
// the same app frame the students see (sidebar + page), just with owner pages.
export default function DeleGate() {
  const [state, setState] = useState('checking') // checking | out | in | offline
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()

  // Only the server saying "your owner session has ended" shows the password
  // screen. If it simply can't be reached (it restarts after every code change
  // while developing), say so and keep asking - the session is still good.
  useEffect(() => {
    document.title = 'Owner - Nexus'
    let cancelled = false
    let timer = 0

    async function check() {
      try {
        await api('/dele/me')
        if (!cancelled) setState('in')
      } catch (err) {
        if (cancelled) return
        if (err.code === 'DELE_SIGNED_OUT') {
          setState('out')
        } else {
          setState('offline')
          timer = setTimeout(check, 2000)
        }
      }
    }

    check()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [])

  // A new page closes the phone menu.
  useEffect(() => setMenuOpen(false), [pathname])

  const call = useCallback(async (path, options) => {
    try {
      return await api(`/dele${path}`, options)
    } catch (err) {
      if (err.code === 'DELE_SIGNED_OUT') setState('out')
      throw err
    }
  }, [])

  const context = useMemo(() => ({ call }), [call])

  async function logout() {
    await api('/dele/logout', { method: 'POST' }).catch(() => {})
    setState('out')
  }

  if (state === 'checking') return <DeleShellSkeleton />

  if (state === 'offline') {
    return (
      <div className="dl-center">
        <div className="dl-login" role="status">
          <div className="logo">
            <span className="logo-badge">N</span>
            Nexus
          </div>
          <h1>Reconnecting…</h1>
          <p>Nexus can't be reached for a moment. You're still signed in - this will try again by itself.</p>
        </div>
      </div>
    )
  }

  if (state === 'out') return <DeleLogin onDone={() => setState('in')} />

  return (
    <DeleContext.Provider value={context}>
      <div className="app dl-app">
        {/* Hamburger + dark overlay: phones only (same as the student site) */}
        <button
          type="button"
          className={`menu-btn ${menuOpen ? 'hidden' : ''}`}
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </button>
        <div className={`overlay ${menuOpen ? 'active' : ''}`} onClick={() => setMenuOpen(false)} />

        <aside className={`sidebar ${menuOpen ? 'active' : ''}`} id="sidebar">
          <div className="logo">
            <span className="logo-badge">N</span>
            Nexus
          </div>

          <nav className="nav">
            {TABS.map(tab => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>

          {/* The foot of the sidebar, where leaving belongs */}
          <div className="dl-side-foot">
            <button type="button" className="dl-signout" onClick={logout}>
              <UiIcon name="logout" size={18} /> Sign out
            </button>
          </div>
        </aside>

        <main className="main">
          <Outlet />
        </main>
      </div>
    </DeleContext.Provider>
  )
}

function DeleLogin({ onDone }) {
  const [first, setFirst] = useState('')
  const [second, setSecond] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api('/dele/login', { method: 'POST', body: { password1: first, password2: second } })
      onDone()
    } catch (err) {
      setError(err.message)
      setSecond('')
      setBusy(false)
    }
  }

  return (
    <div className="dl-center">
      <form className="dl-login" onSubmit={submit}>
        <div className="logo">
          <span className="logo-badge">N</span>
          Nexus
        </div>
        <h1>Owner area</h1>
        <p>Enter both passwords to continue.</p>

        <label>
          Password 1
          <PasswordInput value={first} onChange={setFirst} autoComplete="off" autoFocus />
        </label>
        <label>
          Password 2
          <PasswordInput value={second} onChange={setSecond} autoComplete="off" />
        </label>

        {error && <p className="dl-error" role="alert">{error}</p>}

        <button type="submit" className="dl-btn" disabled={busy || !first || !second}>
          {busy ? 'Checking…' : 'Enter'}
        </button>
      </form>
    </div>
  )
}
