import { useEffect } from 'react'
import { Link } from 'react-router'
import ScrollToTop from '../components/ScrollToTop'
import UiIcon from '../components/UiIcon'
import './Privacy.css'

const CONTACT_EMAIL = 'mrdanielbamidele@gmail.com'

// The three promises worth seeing before anything else.
const GLANCE = [
  { icon: 'shield', tone: 'sage', title: 'School accounts only', text: 'Sign-in is limited to @topfaith.edu.ng Google accounts.' },
  { icon: 'lock', tone: 'violet', title: 'Never sold', text: 'Your details are not sold, rented or used for ads.' },
  { icon: 'trash', tone: 'peach', title: 'Delete any time', text: 'Erase your account yourself from Settings.' },
]

const SECTIONS = [
  {
    icon: 'user',
    tone: 'violet',
    title: 'What we collect',
    items: [
      'Your school email, a username, and your password (kept scrambled, so even we cannot read it).',
      'Your course of study, level and the courses you take. Staff also choose a department.',
      'The papers you upload, with your name on them if you are signed in. Visitors can add a name or stay anonymous.',
    ],
  },
  {
    icon: 'mail',
    tone: 'blue',
    title: 'Sign in with Google',
    items: [
      'We only ask Google for your name and email address, to confirm the account is really yours and belongs to the school.',
      'We never see your Google password, and we cannot read your mail, files, contacts or calendar.',
    ],
  },
  {
    icon: 'activity',
    tone: 'sage',
    title: 'How you use Nexus',
    items: [
      'Which papers you open, how long you read them, what you download and which links you tap.',
      'How long Nexus stays open. If you are not signed in, this is tied to a random code on your device instead of a name.',
      'This helps us see which papers are useful. It is never shown to other students.',
    ],
  },
  {
    icon: 'bell',
    tone: 'peach',
    title: 'Notifications and the AI helper',
    items: [
      'If you switch on background alerts, we keep your device’s notification address and your course list so we can tell you about new papers.',
      'Messages you type to Nexus AI are sent to an AI service to write a reply. Please do not share personal secrets in the chat.',
    ],
  },
  {
    icon: 'cloud',
    tone: 'violet',
    title: 'Where it lives',
    items: [
      'Your account and usage records sit in a MongoDB database, uploaded papers are stored on Cloudinary, and the site runs on Netlify.',
      'Sign-in cookies keep you signed in on this device. Your course list and reading progress are also remembered in your browser.',
    ],
  },
  {
    icon: 'trash',
    tone: 'blue',
    title: 'Your choices',
    items: [
      'Change your name, courses or password any time in Settings.',
      'Settings → Account & security → Delete this account erases your account, course list and usage history.',
      'Papers you uploaded stay up for other students, but no longer carry your name.',
    ],
  },
]

export default function Privacy() {
  useEffect(() => {
    document.title = 'Privacy - Nexus'
  }, [])

  return (
    <div className="pv-page">
      <ScrollToTop />

      <header className="pv-bar">
        <Link to="/" className="pv-brand">
          <span className="pv-badge">N</span>
          Nexus
        </Link>
        <Link to="/" className="pv-back">Back to Nexus</Link>
      </header>

      <main className="pv-main">
        <section className="pv-hero">
          <span className="pv-eyebrow">Privacy policy</span>
          <h1>Your privacy, in plain words.</h1>
          <p>
            Nexus is a free study tool for Topfaith University. Here is exactly what it keeps about you,
            why, and how to take it back.
          </p>
          <small>Last updated 14 October 2026</small>
        </section>

        <div className="pv-glance">
          {GLANCE.map(item => (
            <div className="pv-fact" key={item.title}>
              <span className={`pv-chip tone-${item.tone}`}><UiIcon name={item.icon} size={20} /></span>
              <strong>{item.title}</strong>
              <span>{item.text}</span>
            </div>
          ))}
        </div>

        {SECTIONS.map(section => (
          <section className="pv-card" key={section.title}>
            <div className="pv-card-head">
              <span className={`pv-chip tone-${section.tone}`}><UiIcon name={section.icon} size={20} /></span>
              <h2>{section.title}</h2>
            </div>
            <ul>
              {section.items.map(item => <li key={item}>{item}</li>)}
            </ul>
          </section>
        ))}

        <section className="pv-contact">
          <div>
            <h2>Questions about your data?</h2>
            <p>Write to us and we will answer personally.</p>
          </div>
          <a href={`mailto:${CONTACT_EMAIL}`} className="pv-mail">
            <UiIcon name="mail" size={17} /> {CONTACT_EMAIL}
          </a>
        </section>
      </main>
    </div>
  )
}
