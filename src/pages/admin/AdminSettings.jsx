import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { api } from '../../lib/api'
import { patchAdmin, signOut, useSession } from '../../lib/session'
import AccountSecurity from '../../components/AccountSecurity'
import ScrollToTop from '../../components/ScrollToTop'
import UiIcon from '../../components/UiIcon'
import DepartmentPicker from './DepartmentPicker'
import '../Settings.css'

function SavedLine({ saved, error }) {
  if (error) return <p className="set-error" role="alert"><UiIcon name="alert" size={14} /> {error}</p>
  if (saved) return <p className="set-saved"><UiIcon name="check" size={14} /> {saved}</p>
  return null
}

export default function AdminSettings() {
  const { admin } = useSession()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [name, setName] = useState(admin.username || '')
  const [nameState, setNameState] = useState({ saved: '', error: '' })

  const [department, setDepartment] = useState(admin.department || '')
  const [deptState, setDeptState] = useState({ saved: '', error: '' })
  const [busy, setBusy] = useState(false)

  async function saveName() {
    setNameState({ saved: '', error: '' })
    try {
      const { me } = await api('/admin/profile', { method: 'PATCH', body: { username: name } })
      patchAdmin(me)
      setName(me.username)
      setNameState({ saved: 'Saved', error: '' })
    } catch (err) {
      setNameState({ saved: '', error: err.message })
    }
  }

  async function saveDepartment() {
    setDeptState({ saved: '', error: '' })
    setBusy(true)
    try {
      const { me } = await api('/admin/department', { method: 'PUT', body: { department } })
      patchAdmin(me)
      setDeptState({ saved: `Done - you now see the courses of ${me.department}.`, error: '' })
    } catch (err) {
      setDeptState({ saved: '', error: err.message })
    } finally {
      setBusy(false)
    }
  }

  async function logout() {
    if (!window.confirm('Log out of this device?')) return
    await signOut('admin')
    navigate('/admin', { replace: true })
  }

  return (
    <div className="settings-page is-section">
      <ScrollToTop />

      <header className="set-hero">
        <div>
          <span className="set-eyebrow">Admin</span>
          <h1 className="set-title">Settings</h1>
          <p className="set-lead">Your name, your department and how you sign in.</p>
        </div>
      </header>

      <section className="set-card">
        <h2 className="set-card-title">Your name</h2>
        <label className="set-label" htmlFor="adm-name">Name shown on Nexus</label>
        <div className="set-name-row">
          <input id="adm-name" className="set-input" value={name} onChange={e => setName(e.target.value)} />
          <button
            type="button"
            className="set-btn-primary"
            disabled={!name.trim() || name.trim() === admin.username}
            onClick={saveName}
          >
            Save
          </button>
        </div>
        <SavedLine {...nameState} />
      </section>

      <section className="set-card">
        <h2 className="set-card-title">Department</h2>
        <p className="set-card-sub">
          Currently <strong>{admin.department}</strong> ({admin.faculty}). Pick another to see that
          department's courses instead.
        </p>
        <DepartmentPicker value={department} onChange={setDepartment} disabled={busy} />
        <button
          type="button"
          className="set-btn-primary"
          disabled={busy || !department || department === admin.department}
          onClick={saveDepartment}
        >
          Switch department
        </button>
        <SavedLine {...deptState} />
      </section>

      <AccountSecurity
        role="admin"
        email={admin.email}
        emailChanged={params.get('emailChanged') === '1'}
        onSignOut={logout}
      />
    </div>
  )
}
