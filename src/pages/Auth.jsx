import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { api } from '../lib/api'
import { refreshSession, useSession } from '../lib/session'
import { courseCatalog } from '../data/courseCatalog'
import {
  EXAMPLE_STAFF_EMAIL, EXAMPLE_STUDENT_EMAIL,
  checkSchoolEmail, emailProblem, passwordProblem, roleProblem, usernameProblem,
} from '../lib/schoolEmail'
import ScrollToTop from '../components/ScrollToTop'
import UiIcon from '../components/UiIcon'
import ShowPassword from '../assets/showpassword.svg'
import HidePassword from '../assets/hidepassword.svg'
import './Auth.css'

/* -------------------------------- helpers --------------------------------- */

const programmes = Object.keys(courseCatalog)
const programmeOptions = programmes.map(p => ({ value: p, label: p }))
const levelsOf = programme => Object.keys(courseCatalog[programme] || {})
const levelLabel = level => (/^\d+$/.test(level) ? `${level} level` : level)

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.3 0-11.5-5.2-11.5-11.5S17.7 12.5 24 12.5c2.9 0 5.5 1.1 7.5 2.9l5.7-5.7C33.6 6.5 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12.5 24 12.5c2.9 0 5.5 1.1 7.5 2.9l5.7-5.7C33.6 6.5 29 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 43.5c5.2 0 9.7-2 13.1-5.2l-6.1-5c-1.9 1.4-4.3 2.2-7 2.2-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39 16.2 43.5 24 43.5z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.1-2.2 4-4.2 5.3l6.1 5C40.9 36 43.5 30.6 43.5 24c0-1.2-.1-2.3-.4-3.5z" />
  </svg>
)

// `plain` swaps the <label> for a <div>: a click on an option inside a <label>
// would be passed on to the input and reopen the list that was just closed.
function Field({ label, hint, plain = false, children }) {
  const Tag = plain ? 'div' : 'label'
  return (
    <Tag className="auth-field">
      <span className="auth-field-label">{label}</span>
      {children}
      {hint && <span className="auth-field-hint">{hint}</span>}
    </Tag>
  )
}

// Wrap the part of `text` that matches `query` in <mark>.
function highlight(text, query) {
  const q = query.trim().toLowerCase()
  const at = q ? text.toLowerCase().indexOf(q) : -1
  if (at < 0) return text
  return (
    <>
      {text.slice(0, at)}
      <mark>{text.slice(at, at + q.length)}</mark>
      {text.slice(at + q.length)}
    </>
  )
}

// Pick from a list or type to narrow it. The whole list shows on focus; typing
// keeps only what matches, best matches first. Arrows, Enter and Esc work as in
// any menu. `options` are { value, label }.
function Combobox({ label, options, value, onChange, placeholder, disabled = false }) {
  const listId = useId()
  const wrapRef = useRef(null)
  const inputRef = useRef(null)
  const [query, setQuery] = useState(null) // null = not typing: show the chosen option
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1) // -1 = nothing highlighted yet

  const chosen = options.find(o => o.value === value)
  const typed = query !== null
  const shown = typed ? query : (chosen?.label ?? '')

  const matches = useMemo(() => {
    const q = (query ?? '').trim().toLowerCase()
    if (!q) return options
    const starts = o => Number(o.label.toLowerCase().startsWith(q))
    return options
      .filter(o => o.label.toLowerCase().includes(q))
      .sort((a, b) => starts(b) - starts(a))
  }, [options, query])

  // Keep the highlighted option in view while arrowing through a long list.
  useEffect(() => {
    if (!open) return
    wrapRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  function choose(option) {
    onChange(option.value)
    setQuery(null)
    setOpen(false)
  }

  function onInput(e) {
    setQuery(e.target.value)
    if (value) onChange('') // typing again un-picks the option
    setActive(0)
    setOpen(true)
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive(i => Math.min(i + 1, matches.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && open && matches[active]) {
      e.preventDefault() // pick it, don't submit the form
      choose(matches[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setQuery(null)
    }
  }

  // Leaving mid-word: take the option if exactly one fits, otherwise go back to
  // what was chosen so the box never shows text that isn't really selected.
  function onBlur(e) {
    if (wrapRef.current?.contains(e.relatedTarget)) return
    setOpen(false)
    if (!typed) return
    const said = query.trim().toLowerCase()
    const exact = matches.length === 1
      ? matches[0]
      : options.find(o => o.label.toLowerCase() === said)
    if (exact) choose(exact)
    else setQuery(null)
  }

  function toggle(e) {
    e.preventDefault() // keep focus where it is
    if (disabled) return
    if (open) {
      setOpen(false)
    } else {
      inputRef.current?.focus()
      setOpen(true)
    }
  }

  return (
    <div className={`auth-combo${open ? ' is-open' : ''}`} ref={wrapRef} onBlur={onBlur}>
      <span className={`auth-input${disabled ? ' is-disabled' : ''}`}>
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={open && matches[active] ? `${listId}-${active}` : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          disabled={disabled}
          value={shown}
          onChange={onInput}
          onFocus={e => {
            setOpen(true)
            setActive(matches.findIndex(o => o.value === value))
            if (!typed) e.target.select()
          }}
          onKeyDown={onKeyDown}
        />
        <span className="auth-combo-chevron" aria-hidden="true" onMouseDown={toggle}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </span>

      {open && (
        <ul className="auth-combo-list" id={listId} role="listbox" aria-label={label}>
          {matches.length ? matches.map((option, i) => (
            <li
              key={option.value}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={option.value === value ? 'chosen' : ''}
              onMouseDown={e => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(option)}
            >
              <span>{typed ? highlight(option.label, query) : option.label}</span>
              {option.value === value && <UiIcon name="check" size={16} />}
            </li>
          )) : (
            <li className="auth-combo-empty" role="option" aria-selected="false">
              Nothing matches &ldquo;{query.trim()}&rdquo;. Clear the box to see every option.
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

function PasswordInput({ value, onChange, autoComplete, placeholder }) {
  const [shown, setShown] = useState(false)
  return (
    <span className="auth-input">
      <input
        type={shown ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
      />
      <button
        type="button"
        className="auth-eye"
        onClick={() => setShown(s => !s)}
        aria-label={shown ? 'Hide password' : 'Show password'}
      >
        <img src={shown ? HidePassword : ShowPassword} alt="" width="18" height="18" />
      </button>
    </span>
  )
}

function Problem({ error, children }) {
  if (!error) return null
  return (
    <div className="auth-alert" role="alert">
      <p>{error.message}</p>
      {children}
    </div>
  )
}

// The Sign in / Sign up switch at the top of the card. The violet thumb slides
// between the two halves (see data-active in Auth.css).
function ModeSwitch({ value, onChange }) {
  return (
    <div className="auth-tabs" role="tablist" aria-label="Sign in or sign up" data-active={value}>
      <span className="auth-tab-thumb" aria-hidden="true" />
      <button
        type="button"
        role="tab"
        className="auth-tab"
        aria-selected={value === 'login'}
        onClick={() => onChange('login')}
      >
        Sign in
      </button>
      <button
        type="button"
        role="tab"
        className="auth-tab"
        aria-selected={value === 'signup'}
        onClick={() => onChange('signup')}
      >
        Sign up
      </button>
    </div>
  )
}

const startGoogle = (purpose, role) => {
  window.location.assign(`/api/auth/google/start?purpose=${purpose}&role=${role}`)
}

/* --------------------------------- page ----------------------------------- */

// One screen for both kinds of account: <Auth /> is the student's /auth page,
// <Auth role="admin" /> is what /admin shows until staff are signed in.
export default function Auth({ role = 'student', onSignedIn }) {
  const isAdmin = role === 'admin'
  const navigate = useNavigate()
  const session = useSession()
  const [params, setParams] = useSearchParams()
  const next = params.get('next') || '/'

  const [view, setView] = useState(() => {
    if (params.get('step') === 'reset') return 'reset'
    if (session.pending?.role === role) return 'verify'
    return isAdmin ? 'login' : 'signup'
  })
  const [email, setEmail] = useState(() => (session.pending?.role === role ? session.pending.email : ''))
  const [notice, setNotice] = useState(() => params.get('error'))

  useEffect(() => {
    document.title = isAdmin ? 'Admin sign in - Nexus' : 'Sign in - Nexus'
  }, [isAdmin])

  // The server redirects back here with ?error=... when Google didn't work out.
  // Show it once, then tidy the address bar.
  useEffect(() => {
    if (params.has('error') || params.has('step')) {
      const clean = new URLSearchParams(params)
      clean.delete('error')
      clean.delete('step')
      setParams(clean, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function signedIn() {
    await refreshSession()
    if (onSignedIn) onSignedIn()
    else navigate(next, { replace: true })
  }

  function goVerify(address) {
    setEmail(address)
    setNotice(null)
    setView('verify')
  }

  return (
    <div className="auth-root">
      <ScrollToTop />
      <div className="auth-collage" aria-hidden="true">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <div key={n} className="auth-collage-item">
            <img src={`/logimgs/pic${n}.jpg`} alt="" />
          </div>
        ))}
      </div>
      {/* Tints the photos so the card is what you read, not the collage */}
      <div className="auth-scrim" aria-hidden="true" />

      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-badge">N</span>
          <span className="auth-brand-name">Nexus</span>
        </div>

        {(view === 'login' || view === 'signup') && (
          <ModeSwitch
            value={view}
            onChange={next => { setNotice(null); setView(next) }}
          />
        )}

        {notice && (
          <div className="auth-alert" role="alert">
            <p>{notice}</p>
          </div>
        )}

        {/* Keyed by view so each screen eases in when the switch is used */}
        <div className="auth-view" key={view}>
          {view === 'signup' && (
            <SignupForm
              role={role}
              email={email}
              setEmail={setEmail}
              onVerify={goVerify}
              onLogin={() => { setNotice(null); setView('login') }}
            />
          )}

          {view === 'login' && (
            <LoginForm
              role={role}
              email={email}
              setEmail={setEmail}
              onSignedIn={signedIn}
              onVerify={goVerify}
              onSignup={() => { setNotice(null); setView('signup') }}
              onForgot={() => { setNotice(null); setView('forgot') }}
            />
          )}

          {view === 'forgot' && (
            <ForgotForm
              role={role}
              email={email}
              setEmail={setEmail}
              onBack={() => setView('login')}
              onSignup={() => setView('signup')}
            />
          )}

          {view === 'verify' && (
            <VerifyCard
              role={role}
              email={email}
              onStartOver={() => { setNotice(null); setView('signup') }}
            />
          )}

          {view === 'reset' && <ResetForm onDone={signedIn} />}
        </div>

        <p className="auth-footer">
          {isAdmin ? (
            <>Not staff? <Link to="/auth">Student Login</Link></>
          ) : (
            <>Not a student? <Link to="/admin">Staff Login</Link></>
          )}
        </p>
      </div>
    </div>
  )
}

/* ------------------------------- sign up ---------------------------------- */

function SignupForm({ role, email, setEmail, onVerify, onLogin }) {
  const isAdmin = role === 'admin'
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [programme, setProgramme] = useState('')
  const [level, setLevel] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  // A question the server wants answered before it will go on.
  const [ask, setAsk] = useState(null) // 'staff' | 'overwrite' | null

  const levelOptions = useMemo(
    () => levelsOf(programme).map(l => ({ value: l, label: levelLabel(l) })),
    [programme]
  )

  async function submit(extra = {}) {
    setError(null)
    setAsk(null)

    const checked = checkSchoolEmail(email)
    if (!checked.ok) return setError({ message: emailProblem(checked.reason) })

    const mismatch = roleProblem(role, checked.kind)
    if (mismatch) return setError({ message: mismatch, code: 'STUDENT_EMAIL_ON_ADMIN' })

    const problem = usernameProblem(username) || passwordProblem(password)
    if (problem) return setError({ message: problem })

    if (!isAdmin && !programme) return setError({ message: 'Choose your course of study.' })
    if (!isAdmin && !level) return setError({ message: 'Choose your level.' })

    setBusy(true)
    try {
      await api('/auth/signup', {
        method: 'POST',
        body: { role, email, password, username, programme, level, ...extra },
      })
      await refreshSession()
      onVerify(checked.email)
    } catch (err) {
      if (err.code === 'CONFIRM_STAFF_AS_STUDENT') setAsk({ kind: 'staff', message: err.message })
      else if (err.code === 'UNVERIFIED_EXISTS') setAsk({ kind: 'overwrite', message: err.message })
      else setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={e => { e.preventDefault(); submit() }} noValidate>
      <h1 className="auth-title">{isAdmin ? 'Create an admin account' : 'Create your account'}</h1>

      <Field label={isAdmin ? 'Your name' : 'Username'} hint={isAdmin ? 'This is how your name appears on Nexus.' : 'A nickname - no emojis.'}>
        <span className="auth-input">
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder={isAdmin ? 'e.g. Dr. Bamididele' : 'Pick a username'}
            autoComplete={isAdmin ? 'name' : 'nickname'}
          />
        </span>
      </Field>

      <Field
        label="School email"
        hint={(
          <>
            Your @topfaith.edu.ng address
            <span className="auth-hint-eg">, like {isAdmin ? EXAMPLE_STAFF_EMAIL : EXAMPLE_STUDENT_EMAIL}</span>.
          </>
        )}
      >
        <span className="auth-input">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={isAdmin ? EXAMPLE_STAFF_EMAIL : EXAMPLE_STUDENT_EMAIL}
            autoComplete="email"
            inputMode="email"
          />
        </span>
      </Field>

      <Field label="Password" hint="At least 8 characters.">
        <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" placeholder="Choose a password" />
      </Field>

      {!isAdmin && (
        <>
          <Field label="Course of study" plain>
            <Combobox
              label="Course of study"
              options={programmeOptions}
              value={programme}
              onChange={next => { setProgramme(next); setLevel('') }}
              placeholder="Type or pick your course"
            />
          </Field>

          <Field label="Level" plain>
            <Combobox
              label="Level"
              options={levelOptions}
              value={level}
              onChange={setLevel}
              placeholder={programme ? 'Pick your level' : 'Choose a course first'}
              disabled={!programme}
            />
          </Field>
        </>
      )}

      <Problem error={error}>
        {error?.code === 'ACCOUNT_EXISTS' && (
          <button type="button" className="auth-link" onClick={onLogin}>Go to sign in</button>
        )}
        {error?.code === 'STUDENT_EMAIL_ON_ADMIN' && (
          <Link className="auth-link" to="/auth">Sign up as a student</Link>
        )}
      </Problem>

      {ask && (
        <div className="auth-confirm" role="alertdialog">
          <p>{ask.message}</p>
          <div className="auth-confirm-actions">
            {ask.kind === 'staff' ? (
              <>
                <button type="button" className="auth-btn" disabled={busy} onClick={() => submit({ confirmStaffAsStudent: true })}>
                  Yes, make me a student
                </button>
                <Link className="auth-btn ghost" to="/admin">No, I want an admin account</Link>
              </>
            ) : (
              <>
                <button type="button" className="auth-btn" disabled={busy} onClick={() => submit({ overwrite: true })}>
                  Yes, replace the old details
                </button>
                <button type="button" className="auth-btn ghost" onClick={() => setAsk(null)}>
                  No, keep editing
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <button type="submit" className="auth-submit" disabled={busy || Boolean(ask)}>
        {busy ? 'Creating your account…' : 'Create account'}
      </button>
    </form>
  )
}

/* -------------------------------- sign in --------------------------------- */

function LoginForm({ role, email, setEmail, onSignedIn, onVerify, onSignup, onForgot }) {
  const isAdmin = role === 'admin'
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setError(null)

    const checked = checkSchoolEmail(email)
    if (!checked.ok) return setError({ message: emailProblem(checked.reason) })
    const mismatch = roleProblem(role, checked.kind)
    if (mismatch) return setError({ message: mismatch, code: 'STUDENT_EMAIL_ON_ADMIN' })
    if (!password) return setError({ message: 'Enter your password.' })

    setBusy(true)
    try {
      const result = await api('/auth/login', { method: 'POST', body: { role, email, password } })
      if (result.next === 'verify') {
        await refreshSession()
        onVerify(checked.email)
      } else {
        await onSignedIn()
      }
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  const code = error?.code
  const noAccount = code === 'NO_ACCOUNT' || code === 'NO_STUDENT_ACCOUNT' || code === 'NO_ADMIN_ACCOUNT'

  return (
    <form onSubmit={submit} noValidate>
      <h1 className="auth-title">{isAdmin ? 'Admin sign in' : 'Welcome back'}</h1>

      <button type="button" className="auth-google" onClick={() => startGoogle('login', role)}>
        <GoogleIcon /> Continue with Google
      </button>

      <div className="auth-or"><span>or use your password</span></div>

      <Field label="School email">
        <span className="auth-input">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={isAdmin ? EXAMPLE_STAFF_EMAIL : EXAMPLE_STUDENT_EMAIL}
            autoComplete="email"
            inputMode="email"
          />
        </span>
      </Field>

      <Field label="Password">
        <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" placeholder="Your password" />
      </Field>

      <div className="auth-aside">
        <button type="button" className="auth-link" onClick={onForgot}>Forgot password?</button>
      </div>

      <Problem error={error}>
        {noAccount && (
          <button type="button" className="auth-link" onClick={onSignup}>
            Create {isAdmin ? 'an admin' : 'a student'} account
          </button>
        )}
        {code === 'NO_STUDENT_ACCOUNT' && (
          <Link className="auth-link" to="/admin">Go to the admin sign in</Link>
        )}
        {(code === 'NO_ADMIN_ACCOUNT' || code === 'STUDENT_EMAIL_ON_ADMIN') && (
          <Link className="auth-link" to="/auth">Go to the student sign in</Link>
        )}
        {code === 'WRONG_PASSWORD' && (
          <button type="button" className="auth-link" onClick={onForgot}>Forgot password?</button>
        )}
      </Problem>

      <button type="submit" className="auth-submit" disabled={busy}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}

/* ----------------------------- forgot password ---------------------------- */

function ForgotForm({ role, email, setEmail, onBack, onSignup }) {
  const isAdmin = role === 'admin'
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setError(null)

    const checked = checkSchoolEmail(email)
    if (!checked.ok) return setError({ message: emailProblem(checked.reason) })
    const mismatch = roleProblem(role, checked.kind)
    if (mismatch) return setError({ message: mismatch, code: 'STUDENT_EMAIL_ON_ADMIN' })

    setBusy(true)
    try {
      const { url } = await api('/auth/forgot', { method: 'POST', body: { role, email } })
      window.location.assign(url) // on to Google, which proves the email is theirs
    } catch (err) {
      setError(err)
      setBusy(false)
    }
  }

  const code = error?.code
  const noAccount = code === 'NO_ACCOUNT' || code === 'NO_STUDENT_ACCOUNT' || code === 'NO_ADMIN_ACCOUNT'

  return (
    <form onSubmit={submit} noValidate>
      <h1 className="auth-title">Reset your password</h1>
      <p className="auth-lead">
        Enter your school email. You'll confirm it's you with Google, then choose a new password.
      </p>

      <Field label="School email">
        <span className="auth-input">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={isAdmin ? EXAMPLE_STAFF_EMAIL : EXAMPLE_STUDENT_EMAIL}
            autoComplete="email"
            inputMode="email"
          />
        </span>
      </Field>

      <Problem error={error}>
        {noAccount && (
          <button type="button" className="auth-link" onClick={onSignup}>
            Create {isAdmin ? 'an admin' : 'a student'} account
          </button>
        )}
      </Problem>

      <button type="submit" className="auth-google" disabled={busy}>
        <GoogleIcon /> {busy ? 'Opening Google…' : 'Continue with Google'}
      </button>

      <p className="auth-switch">
        <button type="button" className="auth-link" onClick={onBack}>Back to sign in</button>
      </p>
    </form>
  )
}

/* --------------------------- finish with Google --------------------------- */

function VerifyCard({ role, email, onStartOver }) {
  return (
    <div>
      <h1 className="auth-title">Confirm email</h1>
      <p className="auth-lead">
        Your account is created. One last step: continue with Google so we know{' '}
        <strong>{email || 'your school email'}</strong> really is yours.
      </p>

      <button type="button" className="auth-google" onClick={() => startGoogle('verify', role)}>
        <GoogleIcon /> Continue with Google
      </button>

      <p className="auth-fineprint">
        Only @topfaith.edu.ng Google accounts work. You can finish this later, on any device:
        just sign in with your school email and password and we'll bring you back here.
      </p>

      <p className="auth-switch">
        Wrong email?{' '}
        <button type="button" className="auth-link" onClick={onStartOver}>Start over</button>
      </p>
    </div>
  )
}

/* ----------------------------- choose password ---------------------------- */

function ResetForm({ onDone }) {
  const [password, setPassword] = useState('')
  const [again, setAgain] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setError(null)

    const problem = passwordProblem(password)
    if (problem) return setError({ message: problem })
    if (password !== again) return setError({ message: "The two passwords don't match. Type the same password in both boxes." })

    setBusy(true)
    try {
      await api('/auth/reset', { method: 'POST', body: { password } })
      await onDone()
    } catch (err) {
      setError(err)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <h1 className="auth-title">Choose a new password</h1>
      <p className="auth-lead">Your email is confirmed. Pick a new password for your account.</p>

      <Field label="New password" hint="At least 8 characters.">
        <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" placeholder="New password" />
      </Field>
      <Field label="Type it again">
        <PasswordInput value={again} onChange={setAgain} autoComplete="new-password" placeholder="Repeat the password" />
      </Field>

      <Problem error={error} />

      <button type="submit" className="auth-submit" disabled={busy}>
        {busy ? 'Saving…' : 'Save password and sign in'}
      </button>
    </form>
  )
}
