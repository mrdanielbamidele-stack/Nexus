import { useEffect, useState } from 'react'
import UiIcon from './UiIcon'
import './Modal.css'

const EMAIL = 'mrdanielbamidele@gmail.com'
// 09168695157 in international form (wa.me wants digits only, with the country
// code and no leading 0). The link opens a direct chat, with a first line ready.
const WHATSAPP_NUMBER = '2349168695157'
const WHATSAPP_DISPLAY = '+234 916 869 5157'
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  'Hi! I’m reaching out from Nexus.',
)}`

// The WhatsApp mark: a speech bubble with a phone handset inside, drawn as
// line-work in the tile's soft green.
function WhatsAppLogo({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path strokeWidth="1.65" d="M7.9 20A9 9 0 1 0 4 16.1L2 22z" />
      <path
        strokeWidth="3.4"
        transform="translate(6.2 6.2) scale(0.48)"
        d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"
      />
    </svg>
  )
}

export default function ContactModal({ onClose }) {
  const [copied, setCopied] = useState(false)

  // Esc closes the popup, like any dialog.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function copyEmail(e) {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(EMAIL)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard can be blocked (insecure origin / permissions) - the mailto
      // link beside the button still works, so just stay quiet.
    }
  }

  return (
    <div className="cm-overlay" role="presentation" onClick={onClose}>
      <div
        className="cm-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="cm-close" onClick={onClose} aria-label="Close">
          <UiIcon name="x" size={18} />
        </button>

        <div className="cm-head">
          <span className="cm-eyebrow">We&rsquo;d love to hear from you</span>
          <h2 id="cm-title">Get in touch</h2>
          <p>Questions, feedback, or something not working? Reach out whichever way suits you.</p>
        </div>

        <div className="cm-list">
          <div className="cm-row">
            <a className="cm-row-main" href={`mailto:${EMAIL}`}>
              <span className="cm-row-icon tone-blue"><UiIcon name="mail" size={21} /></span>
              <span className="cm-row-text">
                <small>Email</small>
                <b>{EMAIL}</b>
              </span>
            </a>
            <button
              type="button"
              className={`cm-copy${copied ? ' is-copied' : ''}`}
              onClick={copyEmail}
              aria-label="Copy email address"
            >
              <UiIcon name={copied ? 'check' : 'copy'} size={15} />
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <a className="cm-row" href={WHATSAPP_URL} target="_blank" rel="noreferrer">
            <span className="cm-row-icon tone-wa"><WhatsAppLogo size={25} /></span>
            <span className="cm-row-text">
              <small>WhatsApp · {WHATSAPP_DISPLAY}</small>
              <b>Message us directly</b>
            </span>
            <UiIcon name="arrow" size={18} className="cm-arrow" />
          </a>
        </div>

        <p className="cm-foot">We're all ears.</p>
      </div>
    </div>
  )
}
