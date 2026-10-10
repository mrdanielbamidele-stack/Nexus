import { isDemo, SPONSOR_URL } from '../lib/demo'
import UiIcon from './UiIcon'
import './LynklensAd.css'

// The one sponsor in the demo: Lynklens (link safety, short links, link-in-bio
// pages and QR codes). Only renders in demo mode, so slots can be dropped into
// any page without a check. Pass `message` to say something specific to that spot.
//
//   banner   wide card for the top/bottom of a page
//   footer   the closing card under a list of papers or at the end of a paper
//   note     a slim line for sparse pages (Settings, Upload)
const COPY = {
  banner: {
    title: 'Past questions in your palm.',
    text: 'Brought to you by Lynklens - safer links, smarter pages, clearer insights.',
    cta: 'Visit lynklens.com',
  },
  footer: {
    title: 'Every paper here is brought to you by Lynklens.',
    text: 'Short links you can trust, link-in-bio pages and QR codes - and a safety check on every link before you click it.',
    cta: 'Visit lynklens.com',
  },
  note: {
    text: 'Nexus is free for students because of Lynklens.',
    cta: 'lynklens.com',
  },
}

export default function LynklensAd({ variant = 'banner', title, message }) {
  if (!isDemo) return null
  const copy = COPY[variant]

  return (
    <aside className={`ln-ad ln-${variant}`} aria-label="Sponsored by Lynklens">
      <a className="ln-link" href={SPONSOR_URL} target="_blank" rel="noopener sponsored">
        <span className="ln-tag">Sponsored</span>
        <img className="ln-logo" src="/lynklens-logo.png" alt="Lynklens" />

        <span className="ln-copy">
          {(title || copy.title) && <strong>{title || copy.title}</strong>}
          <span>{message || copy.text}</span>
        </span>

        <span className="ln-cta">
          <span className="ln-cta-label">{copy.cta}</span> <UiIcon name="arrow" size={15} />
        </span>
      </a>
    </aside>
  )
}
