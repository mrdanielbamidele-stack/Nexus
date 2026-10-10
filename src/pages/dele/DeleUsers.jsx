import { useCallback, useEffect, useState } from 'react'
import { formatDuration, timeAgo } from '../../lib/format'
import { useDele } from './deleContext'
import { DeleUsersSkeleton } from './DeleSkeletons'

const ROLES = [
  { id: '', label: 'Everyone' },
  { id: 'student', label: 'Students' },
  { id: 'admin', label: 'Admins' },
]

export default function DeleUsers() {
  const { call } = useDele()
  const [role, setRole] = useState('')
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState(null)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [deleting, setDeleting] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const params = new URLSearchParams()
      if (role) params.set('role', role)
      if (query.trim()) params.set('q', query.trim())
      const { users: list } = await call(`/users?${params}`)
      setUsers(list)
    } catch (err) {
      setError(err.message)
    }
  }, [call, role, query])

  // Search as they type, without hammering the server on every keystroke.
  useEffect(() => {
    const id = setTimeout(load, query ? 300 : 0)
    return () => clearTimeout(id)
  }, [load, query])

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

  async function remove(user) {
    setBusyId(user.id)
    setError('')
    try {
      await call(`/users/${user.id}`, { method: 'DELETE' })
      setUsers(list => list.filter(u => u.id !== user.id))
      setDeleting('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId('')
    }
  }

  return (
    <div>
      <div className="dl-titlebar"><h1>Users</h1></div>
      <p className="dl-lead">
        "Log in as" opens Nexus exactly as that person sees it. The session lasts 10 minutes and is
        recorded.
      </p>

      <div className="dl-filters">
        {ROLES.map(r => (
          <button key={r.id || 'all'} type="button" className={`dl-chip${role === r.id ? ' on' : ''}`} onClick={() => setRole(r.id)}>
            {r.label}
          </button>
        ))}
        <input className="dl-input" placeholder="Search name or email" value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      {error && <p className="dl-error" role="alert">{error}</p>}
      {!users && !error && <DeleUsersSkeleton />}
      {users?.length === 0 && <p className="dl-empty">No one matches.</p>}

      {users?.length > 0 && (
        <div className="dl-table-wrap">
          <table className="dl-table users">
            <thead>
              <tr>
                <th>Person</th><th>Role</th><th>Course / department</th><th className="num">Downloads</th>
                <th className="num">Reading</th><th className="num">On Nexus</th><th>Last seen</th><th />
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.username || '-'}</strong>
                    <div className="dl-sub">{user.email}</div>
                  </td>
                  <td>
                    {user.role}
                    {user.status !== 'verified' && <em className="dl-role warn">not verified</em>}
                  </td>
                  <td>{user.role === 'student' ? `${user.programme || '-'} · ${user.level || '-'}` : user.department || 'not chosen yet'}</td>
                  <td className="num">{user.downloads}</td>
                  <td className="num">{formatDuration(user.readSeconds)}</td>
                  <td className="num">{formatDuration(user.activeSeconds)}</td>
                  <td>{timeAgo(user.lastSeenAt || user.lastLoginAt)}</td>
                  <td className="dl-row-actions">
                    {deleting === user.id ? (
                      <>
                        <button type="button" className="dl-btn danger" disabled={busyId === user.id} onClick={() => remove(user)}>Delete account</button>
                        <button type="button" className="dl-btn ghost" onClick={() => setDeleting('')}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="dl-btn"
                          disabled={busyId === user.id || user.status !== 'verified'}
                          title={user.status !== 'verified' ? 'This account has not verified with Google yet' : ''}
                          onClick={() => loginAs(user)}
                        >
                          Log in as
                        </button>
                        <button type="button" className="dl-btn ghost danger-text" onClick={() => setDeleting(user.id)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
