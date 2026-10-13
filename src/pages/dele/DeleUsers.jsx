import { useCallback, useEffect, useMemo, useState } from 'react'
import PasswordInput from '../../components/PasswordInput'
import UiIcon from '../../components/UiIcon'
import { FACULTIES } from '../../data/faculties'
import { EXAMPLE_STAFF_EMAIL } from '../../lib/schoolEmail'
import { formatDuration, initialsOf, timeAgo } from '../../lib/format'
import { useDele } from './deleContext'
import DeleSelect from './DeleSelect'
import { DeleUsersSkeleton } from './DeleSkeletons'

const ROLES = [
  { id: '', label: 'Everyone', count: 'all' },
  { id: 'student', label: 'Students', count: 'student' },
  { id: 'admin', label: 'Admins', count: 'admin' },
]

const seenAt = user => new Date(user.lastSeenAt || user.lastLoginAt || 0).getTime()

const SORTS = [
  { value: 'newest', label: 'Newest first', by: null },
  { value: 'downloads', label: 'Most downloads', by: (a, b) => b.downloads - a.downloads },
  { value: 'reading', label: 'Most reading time', by: (a, b) => b.readSeconds - a.readSeconds },
  { value: 'active', label: 'Most time on Nexus', by: (a, b) => b.activeSeconds - a.activeSeconds },
  { value: 'seen', label: 'Seen most recently', by: (a, b) => seenAt(b) - seenAt(a) },
]

// Someone counts as online if Nexus heard from them in the last few minutes.
const ONLINE_MS = 3 * 60 * 1000
const isOnline = user => Date.now() - new Date(user.lastSeenAt || 0).getTime() < ONLINE_MS

const amount = (value, format = String) => (value ? format(value) : '—')

// Make a staff (admin) account yourself - no Google step - so the staff side
// can be used before a real staff address exists. Starts out verified.
function CreateStaff({ onCreated, onLoginAs }) {
  const { call } = useDele()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const { user } = await call('/users/staff', {
        method: 'POST',
        body: { name, email, department, password },
      })
      setCreated(user)
      onCreated()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function another() {
    setCreated(null)
    setName('')
    setEmail('')
    setPassword('')
  }

  if (created) {
    return (
      <section className="dl-ov-panel">
        <h2 className="dl-u-formtitle">Staff account created</h2>
        <p className="dl-lead" style={{ margin: '0 0 14px' }}>
          <b>{created.username}</b> ({created.email}) is ready, in {created.department}. Sign in at{' '}
          <b>/admin</b> with that email and the password you set - or open it right now.
        </p>
        <div className="dl-actions" style={{ marginTop: 0 }}>
          <button type="button" className="dl-btn" onClick={() => onLoginAs(created)}>Log in as {created.username}</button>
          <button type="button" className="dl-btn ghost" onClick={another}>Create another</button>
        </div>
      </section>
    )
  }

  return (
    <form className="dl-ov-panel" onSubmit={submit} noValidate>
      <h2 className="dl-u-formtitle">Create a staff account</h2>
      <p className="dl-lead" style={{ margin: '0 0 16px' }}>
        For trying the staff side. The address must start with a letter and end in @topfaith.edu.ng -
        it doesn't have to be a real mailbox. The account starts verified and is marked "Owner-made";
        erase it later when the real person signs up.
      </p>

      <div className="dl-form-row">
        <div className="dl-field">
          <span>Name</span>
          <input className="dl-input" value={name} onChange={e => setName(e.target.value)} placeholder="Dr. Test Admin" maxLength={30} />
        </div>
        <div className="dl-field">
          <span>School email</span>
          <input
            className="dl-input"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={EXAMPLE_STAFF_EMAIL}
            autoComplete="off"
          />
        </div>
        <div className="dl-field">
          <span>Department</span>
          <select className="dl-input" value={department} onChange={e => setDepartment(e.target.value)}>
            <option value="">Choose a department…</option>
            {FACULTIES.map(faculty => (
              <optgroup key={faculty.name} label={faculty.name}>
                {faculty.departments.map(d => <option key={d} value={d}>{d}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="dl-field">
          <span>Password</span>
          <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" placeholder="At least 8 characters" />
        </div>
      </div>

      {error && <p className="dl-error" role="alert">{error}</p>}

      <div className="dl-actions">
        <button type="submit" className="dl-btn" disabled={busy || !name.trim() || !email.trim() || !department || !password}>
          {busy ? 'Creating…' : 'Create staff account'}
        </button>
      </div>
    </form>
  )
}

// One person: who they are, what they've done, and the two things you can do to them.
function UserRow({ user, busy, onLoginAs, onErase }) {
  const [confirming, setConfirming] = useState(false)
  const verified = user.status === 'verified'
  const online = isOnline(user)
  const name = user.username || 'No name yet'

  const course = user.role === 'student'
    ? [user.programme, user.level && `${user.level} level`].filter(Boolean).join(' · ') || 'Not chosen yet'
    : user.department || 'Not chosen yet'

  return (
    <>
      <tr>
        <td>
          <div className="dl-u-person">
            <span className={`dl-u-avatar ${user.role}`} aria-hidden="true">{initialsOf(user.username || user.email)}</span>
            <div>
              <strong>{name}</strong>
              <small>{user.email}</small>
              <div className="dl-u-tags">
                <span className={`dl-u-role ${user.role}`}>{user.role === 'admin' ? 'Admin' : 'Student'}</span>
                {!verified && <span className="dl-u-tag warn">Not verified</span>}
                {user.createdByOwner && <span className="dl-u-tag">Owner-made</span>}
              </div>
            </div>
          </div>
        </td>
        <td>{course}</td>
        <td className="dl-u-num">{amount(user.downloads)}</td>
        <td className="dl-u-num hide-md">{amount(user.readSeconds, formatDuration)}</td>
        <td className="dl-u-num hide-md">{amount(user.activeSeconds, formatDuration)}</td>
        <td className="dl-u-seen">
          {online
            ? <span className="dl-u-online">Online now</span>
            : timeAgo(user.lastSeenAt || user.lastLoginAt)}
        </td>
        <td>
          <div className="dl-u-actions">
            <button
              type="button"
              className="dl-btn soft sm"
              disabled={busy || !verified}
              title={verified
                ? `Open Nexus as ${name} for 10 minutes (recorded)`
                : "This account hasn't confirmed its email with Google yet, so it can't be opened."}
              onClick={() => onLoginAs(user)}
            >
              Log in as
            </button>
            <button
              type="button"
              className="dl-u-icon"
              aria-label={`Delete ${name}`}
              title="Delete"
              disabled={busy}
              onClick={() => setConfirming(true)}
            >
              <UiIcon name="trash" size={17} />
            </button>
          </div>
        </td>
      </tr>

      {confirming && (
        <tr className="dl-u-confirm">
          <td colSpan={7}>
            <div>
              <p>
                Erase <b>{name}</b> and everything they did on Nexus? This can't be undone. The same
                email can sign up again afterwards as a brand-new user.
              </p>
              <div className="dl-u-confirm-actions">
                <button type="button" className="dl-btn danger sm" disabled={busy} onClick={() => onErase(user)}>
                  {busy ? 'Deleting…' : 'Erase for good'}
                </button>
                <button type="button" className="dl-btn ghost sm" disabled={busy} onClick={() => setConfirming(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function DeleUsers() {
  const { call } = useDele()
  const [creating, setCreating] = useState(false)
  const [role, setRole] = useState('')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('newest')
  const [users, setUsers] = useState(null)
  const [counts, setCounts] = useState(null)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const params = new URLSearchParams()
      if (role) params.set('role', role)
      if (query.trim()) params.set('q', query.trim())
      const result = await call(`/users?${params}`)
      setUsers(result.users)
      setCounts(result.counts)
    } catch (err) {
      setError(err.message)
    }
  }, [call, role, query])

  // Search as they type, without hammering the server on every keystroke.
  useEffect(() => {
    const id = setTimeout(load, query ? 300 : 0)
    return () => clearTimeout(id)
  }, [load, query])

  const sorted = useMemo(() => {
    const by = SORTS.find(s => s.value === sort)?.by
    return by && users ? [...users].sort(by) : users
  }, [users, sort])

  async function loginAs(user) {
    setBusyId(user.id)
    setError('')
    try {
      const { url } = await call('/impersonate', { method: 'POST', body: { userId: user.id } })
      window.location.assign(url) // full load so the new session is picked up
    } catch (err) {
      setError(err.message)
      setBusyId('')
    }
  }

  async function erase(user) {
    setBusyId(user.id)
    setError('')
    try {
      await call(`/users/${user.id}`, { method: 'DELETE' })
      setUsers(list => list.filter(u => u.id !== user.id))
      setCounts(c => c && { ...c, all: c.all - 1, [user.role]: c[user.role] - 1 })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId('')
    }
  }

  return (
    <div className="dl-ov dl-users">
      <div className="dl-ov-title">
        <h1>Users</h1>
        <button type="button" className="dl-btn" onClick={() => setCreating(open => !open)}>
          {creating ? 'Close' : <><UiIcon name="plus" size={16} /> Create staff account</>}
        </button>
      </div>

      {creating && <CreateStaff onCreated={load} onLoginAs={loginAs} />}

      <div className="dl-u-bar">
        <div className="dl-seg" role="tablist">
          {ROLES.map(r => (
            <button
              key={r.id || 'all'}
              type="button"
              role="tab"
              aria-selected={role === r.id}
              className={role === r.id ? 'on' : ''}
              onClick={() => setRole(r.id)}
            >
              {r.label}
              {counts && <span>{counts[r.count]}</span>}
            </button>
          ))}
        </div>

        <label className="dl-u-search">
          <UiIcon name="search" size={17} />
          <input
            className="dl-input"
            placeholder="Search name or email"
            aria-label="Search name or email"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </label>

        <div className="dl-u-sort">
          <DeleSelect label="Sort people" value={sort} options={SORTS} onChange={setSort} />
        </div>
      </div>

      {error && <p className="dl-error" role="alert">{error}</p>}
      {!users && !error && <DeleUsersSkeleton />}

      {users?.length === 0 && (
        <div className="dl-u-empty">
          <b>{query.trim() ? `No one matches "${query.trim()}".` : 'No one is here yet.'}</b>
          <span>
            {query.trim()
              ? 'Check the spelling, or try part of their email instead.'
              : 'People show up here as soon as they sign up.'}
          </span>
        </div>
      )}

      {sorted?.length > 0 && (
        <div className="dl-u-panel">
          <div className="dl-table-wrap">
            <table className="dl-u-table">
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Course / department</th>
                  <th className="dl-u-num">Downloads</th>
                  <th className="dl-u-num hide-md">Reading</th>
                  <th className="dl-u-num hide-md">On Nexus</th>
                  <th>Last seen</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {sorted.map(user => (
                  <UserRow
                    key={user.id}
                    user={user}
                    busy={busyId === user.id}
                    onLoginAs={loginAs}
                    onErase={erase}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
