import { Skeleton, SkeletonRegion } from '../../components/Skeleton'

// Loading shapes for the owner area, laid out like the real screens (see Dele.css).

const BAR_HEIGHTS = [38, 52, 44, 70, 58, 82, 64, 46, 76, 90, 60, 48, 68, 54]
const USER_COLUMNS = ['Person', 'Course / department', 'Downloads', 'Reading', 'On Nexus', 'Last seen']
const NUMBER_COLUMNS = new Set([2, 3, 4])

function TableCard({ rows = 5 }) {
  return (
    <section className="dl-ov-panel">
      <Skeleton width={180} height={16} style={{ marginBottom: 14 }} />
      {Array.from({ length: rows }, (_, i) => (
        <div className="sk-split" key={i}>
          <Skeleton width="52%" height={13} />
          <Skeleton width={56} height={13} />
        </div>
      ))}
    </section>
  )
}

// Overview: title, banner, metric cards, the per-day chart, then two panels.
export function DeleOverviewSkeleton({ label = 'Loading the overview' }) {
  return (
    <SkeletonRegion label={label} className="dl-ov">
      <div className="dl-ov-title">
        <div>
          <Skeleton width={90} height={11} style={{ marginBottom: 10 }} />
          <Skeleton width={150} height={30} />
        </div>
        <Skeleton width={150} height={38} radius={10} />
      </div>

      <Skeleton height={190} radius={26} style={{ marginBottom: 20 }} />

      <div className="dl-ov-metrics">
        {Array.from({ length: 8 }, (_, i) => (
          <div className="dl-ov-metric" key={i}>
            <Skeleton width={36} height={36} radius={11} style={{ marginBottom: 16 }} />
            <Skeleton width="55%" height={12} />
            <Skeleton width="42%" height={26} style={{ margin: '8px 0' }} />
            <Skeleton width="70%" height={12} />
          </div>
        ))}
      </div>

      <div className="dl-ov-columns">
        <section className="dl-ov-panel">
          <Skeleton width={230} height={16} style={{ marginBottom: 18 }} />
          <div className="dl-bars">
            {BAR_HEIGHTS.map((h, i) => (
              <Skeleton key={i} width="auto" height={`${h}%`} radius="6px 6px 2px 2px" style={{ flex: 1, maxWidth: 38 }} />
            ))}
          </div>
        </section>
        <TableCard />
      </div>
    </SkeletonRegion>
  )
}

// The moderation / compare lists: a card per paper with its pages and actions.
export function DeleStackSkeleton({ count = 3, label = 'Loading papers' }) {
  return (
    <SkeletonRegion className="dl-stack" label={label}>
      {Array.from({ length: count }, (_, i) => (
        <div className="dl-paper" key={i}>
          <div className="dl-paper-head">
            <div style={{ flex: 1, minWidth: 0 }}>
              <Skeleton width="42%" height={20} style={{ marginBottom: 8 }} />
              <Skeleton width="68%" height={12} />
            </div>
            <Skeleton width={84} height={26} radius={999} />
          </div>
          <div className="dl-pages">
            {[0, 1, 2, 3].map(p => (
              <Skeleton key={p} height="auto" radius={10} style={{ aspectRatio: '3 / 4' }} />
            ))}
          </div>
          <div className="dl-actions">
            <Skeleton width={96} height={36} radius={10} />
            <Skeleton width={84} height={36} radius={10} />
            <Skeleton width={72} height={36} radius={10} />
          </div>
        </div>
      ))}
    </SkeletonRegion>
  )
}

// Users: the real column headings, with skeleton rows under them.
export function DeleUsersSkeleton({ rows = 6 }) {
  return (
    <SkeletonRegion label="Loading users">
      <div className="dl-u-panel">
        <div className="dl-table-wrap">
          <table className="dl-u-table">
            <thead>
              <tr>
                {USER_COLUMNS.map((name, i) => (
                  <th key={name} className={NUMBER_COLUMNS.has(i) ? 'dl-u-num' : ''}>{name}</th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }, (_, r) => (
                <tr key={r}>
                  <td>
                    <div className="dl-u-person">
                      <Skeleton circle width={38} />
                      <div style={{ flex: 1 }}>
                        <Skeleton width="48%" height={14} />
                        <Skeleton width="72%" height={11} style={{ marginTop: 7 }} />
                      </div>
                    </div>
                  </td>
                  <td><Skeleton width="72%" height={13} /></td>
                  {[0, 1, 2].map(n => (
                    <td className="dl-u-num" key={n}><Skeleton width={46} height={13} style={{ marginLeft: 'auto' }} /></td>
                  ))}
                  <td><Skeleton width={64} height={13} /></td>
                  <td><Skeleton width={120} height={34} radius={10} style={{ marginLeft: 'auto' }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SkeletonRegion>
  )
}

// A grid of small paper cards (the Papers page).
export function DeleCardsSkeleton({ count = 6, label = 'Loading papers' }) {
  return (
    <SkeletonRegion className="dl-cmp-grid" label={label}>
      {Array.from({ length: count }, (_, i) => (
        <div className="dl-paper compact" key={i}>
          <Skeleton width="62%" height={17} style={{ marginBottom: 8 }} />
          <Skeleton width="84%" height={12} style={{ marginBottom: 14 }} />
          <Skeleton height={320} radius={14} />
        </div>
      ))}
    </SkeletonRegion>
  )
}

// Compare: a couple of courses, each with a row of paper cards.
export function DeleCompareSkeleton() {
  return (
    <SkeletonRegion label="Loading every paper">
      {[0, 1].map(course => (
        <div className="dl-cmp-course" key={course}>
          <Skeleton width={220} height={22} style={{ marginBottom: 16 }} />
          <div className="dl-cmp-grid">
            {[0, 1, 2].map(card => (
              <div className="dl-paper compact" key={card}>
                <Skeleton width="62%" height={17} style={{ marginBottom: 8 }} />
                <Skeleton width="84%" height={12} style={{ marginBottom: 14 }} />
                <Skeleton height={320} radius={14} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </SkeletonRegion>
  )
}

// The whole owner frame, while the session is being checked.
export function DeleShellSkeleton() {
  return (
    <div className="app dl-app">
      <aside className="sidebar" aria-hidden="true">
        <div className="logo">
          <Skeleton width={32} height={32} radius={8} style={{ marginRight: 10 }} />
          <Skeleton width={90} height={18} />
        </div>
        <nav className="nav">
          {[0, 1, 2, 3, 4].map(i => (
            <Skeleton key={i} height={40} radius={8} style={{ marginBottom: 6 }} />
          ))}
        </nav>
      </aside>
      <main className="main">
        <DeleOverviewSkeleton label="Loading the owner area" />
      </main>
    </div>
  )
}
