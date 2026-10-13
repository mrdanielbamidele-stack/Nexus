import { useState } from 'react'
import './PasswordInput.css'

const EyeIcon = ({ off }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M3 3l18 18" />}
  </svg>
)

// A password box with a show / hide eye. Used wherever a password is typed
// outside the sign-in card (Settings, the owner area). `onChange` gets the string.
export default function PasswordInput({
  value, onChange, id, name, autoComplete = 'current-password', placeholder, disabled = false, autoFocus = false, className = '',
}) {
  const [shown, setShown] = useState(false)

  return (
    <span className={`pw ${className}`.trim()}>
      <input
        id={id}
        name={name}
        className="pw-input"
        type={shown ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
      />
      <button
        type="button"
        className="pw-eye"
        onClick={() => setShown(s => !s)}
        aria-label={shown ? 'Hide password' : 'Show password'}
        aria-pressed={shown}
        disabled={disabled}
      >
        <EyeIcon off={shown} />
      </button>
    </span>
  )
}
