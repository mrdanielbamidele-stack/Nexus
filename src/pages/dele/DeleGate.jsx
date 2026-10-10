import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { api } from '../../lib/api'
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

// /delealone: two passwords, then the owner's control room.
export default function DeleGate() {
  const [state, setState] = useState('checking') // checking | out | in

  useEffect(() => {
    document.title = 'Owner - Nexus'
    api('/dele/me').then(() => setState('in')).catch(() => setState('out'))
  }, [])

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

  if (state === 'out') return <DeleLogin onDone={() => setState('in')} />

  return (
    <DeleContext.Provider value={context}>
      <div className="dl-shell">
        <header className="dl-top">
          <div className="dl-brand">
            <span className="dl-badge">N</span>
            <span>Nexus Owner</span>
          </div>
          <nav className="dl-tabs">
            {TABS.map(tab => (
              <NavLink key={tab.to} to={tab.to} end={tab.end} className={({ isActive }) => `dl-tab${isActive ? ' on' : ''}`}>
                {tab.label}
              </NavLink>
            ))}
          </nav>
          <button type="button" className="dl-btn ghost" onClick={logout}>Sign out</button>
        </header>
        <main className="dl-main">
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
        <span className="dl-badge big">N</span>
        <h1>Owner area</h1>
        <p>Enter both passwords to continue.</p>

        <label>
          Password 1
          <input type="password" value={first} onChange={e => setFirst(e.target.value)} autoComplete="off" autoFocus />
        </label>
        <label>
          Password 2
          <input type="password" value={second} onChange={e => setSecond(e.target.value)} autoComplete="off" />
        </label>

        {error && <p className="dl-error" role="alert">{error}</p>}

        <button type="submit" className="dl-btn" disabled={busy || !first || !second}>
          {busy ? 'Checking…' : 'Enter'}
        </button>
      </form>
    </div>
  )
}
