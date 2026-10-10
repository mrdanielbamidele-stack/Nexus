import { useState } from 'react'
import { api } from '../lib/api'
import { EXAMPLE_STAFF_EMAIL, EXAMPLE_STUDENT_EMAIL, checkSchoolEmail, emailProblem, passwordProblem, roleProblem } from '../lib/schoolEmail'
import UiIcon from './UiIcon'

// The "Account" part of Settings for both students and staff: change the school
// email (re-confirmed with Google), change the password, sign out.
// Render it inside a `.settings-page` so the Settings styles apply.
export default function AccountSecurity({ role, email, emailChanged, onSignOut }) {
  return (
    <>
      {emailChanged && (
        <section className="set-card set-card-ok" role="status">
          <p className="set-saved" style={{ margin: 0 }}>
            <UiIcon name="check" size={14} /> Your school email has been changed and confirmed with Google.
          </p>
        </section>
      )}
      <EmailCard role={role} email={email} />
      <PasswordCard role={role} />
      <section className="set-card">
        <p className="set-card-sub">Sign out of Nexus on this device.</p>
        <button type="button" className="set-btn-danger" onClick={onSignOut}>
          <UiIcon name="logout" size={17} /> Log out
        </button>
      </section>
    </>
  )
}

function Message({ error, saved }) {
  if (error) {
    return (
      <p className="set-error" role="alert">
        <UiIcon name="alert" size={14} /> {error}
      </p>
    )
  }
  if (saved) {
    return (
      <p className="set-saved">
        <UiIcon name="check" size={14} /> {saved}
      </p>
    )
  }
  return null
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
    <form className="set-card" onSubmit={submit} noValidate>
      <h2 className="set-card-title">School email</h2>
      <p className="set-card-sub">
        Signed in as <strong>{email}</strong>. To change it, enter the new @topfaith.edu.ng address -
        you'll confirm it with Google before it takes effect.
      </p>

      <label className="set-label" htmlFor="set-new-email">New school email</label>
      <div className="set-name-row">
        <input
          id="set-new-email"
          className="set-input"
          type="email"
          placeholder={role === 'admin' ? EXAMPLE_STAFF_EMAIL : EXAMPLE_STUDENT_EMAIL}
          value={value}
          onChange={e => setValue(e.target.value)}
          autoComplete="email"
        />
        <button type="submit" className="set-btn-primary" disabled={busy || !value.trim()}>
          {busy ? 'Opening Google…' : 'Verify with Google'}
        </button>
      </div>
      <Message error={error} />
    </form>
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
    <form className="set-card" onSubmit={submit} noValidate>
      <h2 className="set-card-title">Change password</h2>
      <p className="set-card-sub">Use at least 8 characters.</p>

      <label className="set-label" htmlFor="set-cur-pass">Current password</label>
      <input id="set-cur-pass" className="set-input" type="password" value={current}
        onChange={e => setCurrent(e.target.value)} autoComplete="current-password" style={{ width: '100%', marginBottom: 14 }} />

      <label className="set-label" htmlFor="set-new-pass">New password</label>
      <input id="set-new-pass" className="set-input" type="password" value={next}
        onChange={e => setNext(e.target.value)} autoComplete="new-password" style={{ width: '100%', marginBottom: 14 }} />

      <label className="set-label" htmlFor="set-again-pass">Repeat new password</label>
      <input id="set-again-pass" className="set-input" type="password" value={again}
        onChange={e => setAgain(e.target.value)} autoComplete="new-password" style={{ width: '100%', marginBottom: 16 }} />

      <button type="submit" className="set-btn-primary" disabled={busy}>
        {busy ? 'Saving…' : 'Change password'}
      </button>
      <Message error={error} saved={saved} />
    </form>
  )
}
