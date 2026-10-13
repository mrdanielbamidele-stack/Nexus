import { Link, useSearchParams } from 'react-router'
import '../pages/Settings.css'
import BackLink from './BackLink'
import LynklensAd from './LynklensAd'
import ScrollToTop from './ScrollToTop'
import UiIcon from './UiIcon'

// The Settings frame used by students (/settings) and staff (/admin/settings):
//
//   /settings                    a hub of tiles, one per section
//   /settings?section=<id>       that section, with a "All settings" way back
//
// `sections`: [{ id, title, icon, tone, desc, meta, lead, sponsor }]
//   desc    one line on the tile        meta   small line at the foot of the tile
//   lead    sentence under the section's own heading
// `renderSection(section)` returns the content of an open section.
export default function SettingsHub({ title, lead, basePath, sections, banner, renderSection }) {
  const [params] = useSearchParams()
  const section = sections.find(s => s.id === params.get('section')) || null

  /* ---- hub ---- */
  if (!section) {
    return (
      <div className="settings-page" key="hub">
        <ScrollToTop />
        <header className="set-hero">
          <div>
            <h1 className="set-title">{title}</h1>
            <p className="set-lead">{lead}</p>
          </div>
        </header>

        {banner}

        <div className="set-grid">
          {sections.map(s => (
            <Link key={s.id} to={`${basePath}?section=${s.id}`} className={`set-tile tone-${s.tone}`}>
              <div className="set-tile-top">
                <span className="set-tile-icon"><UiIcon name={s.icon} size={24} /></span>
                <UiIcon name="arrow" size={20} className="set-tile-arrow" />
              </div>
              <h2 className="set-tile-title">{s.title}</h2>
              <p className="set-tile-desc">{s.desc}</p>
              <div className="set-tile-meta">{s.meta}</div>
            </Link>
          ))}
        </div>

        <LynklensAd variant="banner" />
      </div>
    )
  }

  /* ---- one section ---- */
  return (
    <div className="settings-page is-section" key={section.id}>
      <ScrollToTop />
      <BackLink to={basePath}>All settings</BackLink>

      <header className="set-hero">
        <div>
          <h1 className="set-title">{section.title}</h1>
          <p className="set-lead">{section.lead}</p>
        </div>
        <span className={`set-hero-icon tone-${section.tone}`}>
          <UiIcon name={section.icon} size={26} />
        </span>
      </header>

      {renderSection(section)}

      {section.sponsor && <LynklensAd variant="note" message={section.sponsor} />}
    </div>
  )
}
