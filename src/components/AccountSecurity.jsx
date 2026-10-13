import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { api } from '../lib/api'
import { signOut } from '../lib/session'
import {
  EXAMPLE_STAFF_EMAIL, EXAMPLE_STUDENT_EMAIL,
  checkSchoolEmail, emailProblem, passwordProblem, roleProblem,
} from '../lib/schoolEmail'
import PasswordInput from './PasswordInput'
import { SetRow, SetSection } from './SetSection'
import UiIcon from './UiIcon'

// The "Account & security" section of Settings, for students and staff:
// school email (changed through Google), password, signing out, and deleting
// the account. Render it inside a `.settings-page` so the Settings styles apply.
export default function AccountSecurity({ role, email, onSignOut }) {
  const [params] = useSearchParams()
  const emailChanged = params.get('emailChanged') === '1'

  return (
    <>
      {emailChanged && (
        <p className="set-flash" role="status">
          <UiIcon name="check" size={15} /> Your school email was changed and confirmed with Google.
        </p>
      )}

      <EmailCard role={role} email={email} />
      <PasswordCard role={role} />

      <SetSection title="Sign out" sub="End your session on this device.">
        <SetRow
          title="Log out of this device"
          desc="You can sign back in any time with your school email and password."
          action={(
            <button type="button" className="set-btn-ghost" onClick={onSignOut}>
              <UiIcon name="logout" size={16} /> Log out
            </button>
          )}
        />
      </SetSection>

      <DeleteCard role={role} />
    </>
  )
}

function Status({ type, children }) {
  if (!children) return null
  return (
    <p className={`set-status is-${type}`} role={type === 'err' ? 'alert' : 'status'}>
      <UiIcon name={type === 'ok' ? 'check' : 'alert'} size={14} />
      <span>{children}</span>
    </p>
  )
}

function EmailCard({ role, email }) {
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')

    const checked = checkSchoolEmail(value)
    if (!checked.ok) return setError(emailProblem(checked.reason))
    const mismatch = roleProblem(role, checked.kind)
    if (mismatch) return setError(mismatch)

    setBusy(true)
    try {
      const { url } = await api(`/${role}/email`, { method: 'POST', body: { email: value } })
      window.location.assign(url) // Google confirms the new address is theirs
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <SetSection
      as="form"
      onSubmit={submit}
      noValidate
      title="School email"
      sub={<>Signed in as <strong>{email}</strong>. To change it, enter the new @topfaith.edu.ng address - you'll confirm it with Google before it takes effect.</>}
    >
      <div className="set-body">
        <label className="set-label" htmlFor="set-new-email">New school email</label>
        <input
          id="set-new-email"
          className="set-input"
          type="email"
          placeholder={role === 'admin' ? EXAMPLE_STAFF_EMAIL : EXAMPLE_STUDENT_EMAIL}
          value={value}
          onChange={e => setValue(e.target.value)}
          autoComplete="email"
        />
        <Status type="err">{error}</Status>
      </div>
      <div className="set-foot">
        <button type="submit" className="set-btn-primary" disabled={busy || !value.trim()}>
          {busy ? 'Opening Google…' : 'Verify with Google'}
        </button>
      </div>
    </SetSection>
  )
}

function PasswordCard({ role }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [again, setAgain] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')
    setSaved('')

    if (!current) return setError('Enter your current password first.')
    const problem = passwordProblem(next)
    if (problem) return setError(problem)
    if (next !== again) return setError("The new password and the repeat don't match. Type the same password in both boxes.")

    setBusy(true)
    try {
      await api(`/${role}/password`, { method: 'POST', body: { current, next } })
      setCurrent('')
      setNext('')
      setAgain('')
      setSaved('Password changed.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <SetSection as="form" onSubmit={submit} noValidate title="Change password" sub="Use at least 8 characters.">
      <div className="set-body">
        <div className="set-field">
          <label className="set-label" htmlFor="pw-current">Current password</label>
          <PasswordInput id="pw-current" value={current} onChange={setCurrent} autoComplete="current-password" />
        </div>
        <div className="set-field">
          <label className="set-label" htmlFor="pw-new">New password</label>
          <PasswordInput id="pw-new" value={next} onChange={setNext} autoComplete="new-password" />
        </div>
        <div className="set-field">
          <label className="set-label" htmlFor="pw-again">Repeat new password</label>
          <PasswordInput id="pw-again" value={again} onChange={setAgain} autoComplete="new-password" />
        </div>
        <Status type="err">{error}</Status>
        <Status type="ok">{saved}</Status>
      </div>
      <div className="set-foot">
        <button type="submit" className="set-btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Change password'}
        </button>
      </div>
    </SetSection>
  )
}

// The Danger Zone: a red box, one row per irreversible thing. Deleting expands
// in place so what will happen is read before the password is asked for.
function DeleteCard({ role }) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function erase(e) {
    e.preventDefault()
    setError('')
    if (!password) return setError('Type your password to confirm.')

    setBusy(true)
    try {
      await api(`/${role}/account`, { method: 'DELETE', body: { password } })
      try { localStorage.removeItem('pqReading') } catch { /* nothing to clear */ }
      await signOut(role).catch(() => {})
      // A full load, so nothing from the old account is left in memory.
      window.location.assign(role === 'admin' ? '/admin' : '/auth')
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <SetSection danger title="Danger zone" sub="Be careful this can't be undone.">
      <SetRow
        title="Delete this account"
        desc="Permanently remove your Nexus account, course list and reading history."
        action={!open && (
          <button type="button" className="set-btn-danger" onClick={() => setOpen(true)}>
            Delete this account
          </button>
        )}
      />

      {open && (
        <form className="set-body" onSubmit={erase} noValidate>
          <ul className="set-danger-list">
            <li>Your {role === 'admin' ? 'admin' : 'student'} account, course list and reading history are erased.</li>
            <li>Papers you uploaded stay for other students, but no longer show your name.</li>
            <li>You can sign up again with the same school email whenever you like.</li>
          </ul>

          <div className="set-field">
            <label className="set-label" htmlFor="pw-delete">Type your password to confirm</label>
            <PasswordInput id="pw-delete" value={password} onChange={setPassword} autoComplete="current-password" autoFocus />
          </div>

          <div className="set-actions" style={{ marginTop: 0 }}>
            <button type="submit" className="set-btn-danger is-solid" disabled={busy}>
              {busy ? 'Deleting…' : 'Permanently delete my account'}
            </button>
            <button
              type="button"
              className="set-btn-ghost"
              disabled={busy}
              onClick={() => { setOpen(false); setPassword(''); setError('') }}
            >
              Keep my account
            </button>
          </div>
          <Status type="err">{error}</Status>
        </form>
      )}
    </SetSection>
  )
}
