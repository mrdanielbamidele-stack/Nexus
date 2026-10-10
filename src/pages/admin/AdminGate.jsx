import { useState } from 'react'
import { api } from '../../lib/api'
import { patchAdmin, signOut, useSession } from '../../lib/session'
import Layout from '../../components/Layout'
import Auth from '../Auth'
import DepartmentPicker from './DepartmentPicker'
import '../Settings.css'
import '../Auth.css'

// Everything under /admin goes through here:
//   not signed in as staff      -> the admin sign in / sign up screen
//   signed in, no department    -> "which department are you mostly interested in?"
//   otherwise                   -> the app frame with the staff pages inside
export default function AdminGate() {
  const { admin } = useSession()

  if (!admin) return <Auth role="admin" onSignedIn={() => {}} />
  if (admin.needsDepartment) return <DepartmentSetup admin={admin} />
  return <Layout area="admin" />
}

function DepartmentSetup({ admin }) {
  const [department, setDepartment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    if (!department) return setError('Choose a department to continue.')
    setError('')
    setBusy(true)
    try {
      const { me } = await api('/admin/department', { method: 'PUT', body: { department } })
      patchAdmin(me)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="settings-page" style={{ padding: '32px 16px' }}>
      <header className="set-hero">
        <div>
          <span className="set-eyebrow">One quick question</span>
          <h1 className="set-title">Hi {admin.username}, which department do you work with most?</h1>
          <p className="set-lead">
            Nexus will show you only that department's courses and past questions. You can change
            this any time in Settings.
          </p>
        </div>
      </header>

      <section className="set-card">
        <DepartmentPicker value={department} onChange={setDepartment} disabled={busy} />
        {error && <p className="set-error" role="alert">{error}</p>}
        <button type="button" className="set-btn-primary" disabled={busy} onClick={save}>
          {busy ? 'Saving…' : 'Continue'}
        </button>
      </section>

      <p className="set-lead" style={{ textAlign: 'center' }}>
        Not {admin.username}?{' '}
        <button type="button" className="auth-link" onClick={() => signOut('admin')}>Sign out</button>
      </p>
    </div>
  )
}
