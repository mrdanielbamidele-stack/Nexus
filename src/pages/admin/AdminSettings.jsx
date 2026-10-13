import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { api } from '../../lib/api'
import { patchAdmin, signOut, useSession } from '../../lib/session'
import AccountSecurity from '../../components/AccountSecurity'
import SettingsHub from '../../components/SettingsHub'
import UiIcon from '../../components/UiIcon'
import { SetRow, SetSection } from '../../components/SetSection'
import DepartmentPicker from './DepartmentPicker'
import '../Settings.css'

function Status({ type, children }) {
  if (!children) return null
  return (
    <p className={`set-status is-${type}`} role={type === 'err' ? 'alert' : 'status'}>
      <UiIcon name={type === 'ok' ? 'check' : 'alert'} size={14} />
      <span>{children}</span>
    </p>
  )
}

const initialsOf = name => {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return parts.length === 1 ? parts[0][0].toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function ProfileSection({ admin }) {
  const [name, setName] = useState(admin.username || '')
  const [state, setState] = useState({ type: '', text: '' })
  const [busy, setBusy] = useState(false)

  async function save() {
    setState({ type: '', text: '' })
    setBusy(true)
    try {
      const { me } = await api('/admin/profile', { method: 'PATCH', body: { username: name } })
      patchAdmin(me)
      setName(me.username)
      setState({ type: 'ok', text: 'Saved.' })
    } catch (err) {
      setState({ type: 'err', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <SetSection title="Display name" sub="This is how your name appears across Nexus.">
        <div className="set-row set-who">
          <div className="set-avatar">{initialsOf(admin.username)}</div>
          <div className="set-profile-meta">
            <p className="set-profile-name">{admin.username}</p>
            <p className="set-profile-reg">{admin.email}</p>
          </div>
        </div>

        <div className="set-body">
          <label className="set-label" htmlFor="adm-name">Name shown on Nexus</label>
          <input
            id="adm-name"
            className="set-input"
            value={name}
            maxLength={30}
            onChange={e => setName(e.target.value)}
          />
          <Status type={state.type}>{state.text}</Status>
        </div>

        <div className="set-foot">
          <button
            type="button"
            className="set-btn-primary"
            disabled={busy || !name.trim() || name.trim() === admin.username}
            onClick={save}
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </SetSection>

      <SetSection title="Account details" sub="Your sign-in identity and the courses you see.">
        <SetRow
          title="School email"
          desc={admin.email}
          action={<Link to="/admin/settings?section=account">Change</Link>}
        />
        <SetRow title="Faculty" desc={admin.faculty || '-'} />
        <SetRow
          title="Department"
          desc={admin.department || '-'}
          action={<Link to="/admin/settings?section=department">Change</Link>}
        />
      </SetSection>
    </>
  )
}

function DepartmentSection({ admin }) {
  const [department, setDepartment] = useState(admin.department || '')
  const [state, setState] = useState({ type: '', text: '' })
  const [busy, setBusy] = useState(false)

  async function save() {
    setState({ type: '', text: '' })
    setBusy(true)
    try {
      const { me } = await api('/admin/department', { method: 'PUT', body: { department } })
      patchAdmin(me)
      setState({ type: 'ok', text: `Done - you now see the courses of ${me.department}.` })
    } catch (err) {
      setState({ type: 'err', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <SetSection
      title="Your department"
      sub={<>Currently <strong>{admin.department}</strong> ({admin.faculty}). Pick another to see that department's courses instead.</>}
    >
      <div className="set-body">
        <DepartmentPicker value={department} onChange={setDepartment} disabled={busy} />
        <Status type={state.type}>{state.text}</Status>
      </div>
      <div className="set-foot">
        <button
          type="button"
          className="set-btn-primary"
          disabled={busy || !department || department === admin.department}
          onClick={save}
        >
          {busy ? 'Saving…' : 'Switch department'}
        </button>
      </div>
    </SetSection>
  )
}

export default function AdminSettings() {
  const { admin } = useSession()
  const navigate = useNavigate()

  async function logout() {
    if (!window.confirm('Log out of this device?')) return
    await signOut('admin')
    navigate('/admin', { replace: true })
  }

  const sections = [
    {
      id: 'profile',
      title: 'Profile',
      icon: 'user',
      tone: 'violet',
      desc: 'Update your name and see the faculty and department tied to your account.',
      meta: `${admin.username} · ${admin.department || 'no department yet'}`,
      lead: 'Your identity across Nexus.',
    },
    {
      id: 'department',
      title: 'Department',
      icon: 'book',
      tone: 'blue',
      desc: 'Choose the department whose courses and past questions show up on your dashboard.',
      meta: admin.faculty ? `${admin.faculty}` : 'Not chosen yet',
      lead: "Switch to another department's courses any time.",
    },
    {
      id: 'account',
      title: 'Account & security',
      icon: 'shield',
      tone: 'sage',
      desc: 'Your school email, password, and deleting your account.',
      meta: 'Keep your account safe',
      lead: 'Manage how you sign in to Nexus.',
    },
  ]

  function renderSection(section) {
    if (section.id === 'profile') return <ProfileSection admin={admin} />
    if (section.id === 'department') return <DepartmentSection admin={admin} />
    return <AccountSecurity role="admin" email={admin.email} onSignOut={logout} />
  }

  return (
    <SettingsHub
      title="Settings"
      lead="Your name, your department and how you sign in."
      basePath="/admin/settings"
      sections={sections}
      renderSection={renderSection}
    />
  )
}
