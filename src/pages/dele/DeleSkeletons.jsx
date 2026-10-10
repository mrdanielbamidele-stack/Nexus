import { Skeleton, SkeletonRegion } from '../../components/Skeleton'

// Loading shapes for the owner area, laid out like the real screens (see Dele.css).

const BAR_HEIGHTS = [38, 52, 44, 70, 58, 82, 64, 46, 76, 90, 60, 48, 68, 54]
const USER_COLUMNS = ['Person', 'Role', 'Course / department', 'Downloads', 'Reading', 'On Nexus', 'Last seen']
const NUMBER_COLUMNS = new Set([3, 4, 5])

function TableCard({ rows = 5 }) {
  return (
    <section className="dl-card">
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

// Overview: stat tiles, the per-day chart, then two tables.
export function DeleOverviewSkeleton({ label = 'Loading the overview' }) {
  return (
    <SkeletonRegion label={label}>
      <div className="dl-titlebar">
        <Skeleton width={150} height={30} />
        <div className="dl-filters" style={{ marginBottom: 0 }}>
          {[0, 1, 2, 3].map(i => <Skeleton key={i} width={78} height={32} radius={999} />)}
        </div>
      </div>

      <div className="dl-stats">
        {Array.from({ length: 9 }, (_, i) => (
          <div className="dl-stat" key={i} style={{ gap: 8 }}>
            <Skeleton width="46%" height={28} />
            <Skeleton width="72%" height={13} />
            <Skeleton width="40%" height={12} />
          </div>
        ))}
      </div>

      <section className="dl-card">
        <Skeleton width={230} height={16} style={{ marginBottom: 18 }} />
        <div className="dl-bars">
          {BAR_HEIGHTS.map((h, i) => (
            <Skeleton key={i} width="auto" height={`${h}%`} radius="6px 6px 2px 2px" style={{ flex: 1, maxWidth: 38 }} />
          ))}
        </div>
      </section>

      <div className="dl-two">
        <TableCard />
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
export function DeleUsersSkeleton({ rows = 8 }) {
  return (
    <SkeletonRegion label="Loading users">
      <div className="dl-table-wrap">
        <table className="dl-table users">
          <thead>
            <tr>
              {USER_COLUMNS.map((name, i) => (
                <th key={name} className={NUMBER_COLUMNS.has(i) ? 'num' : ''}>{name}</th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, r) => (
              <tr key={r}>
                <td>
                  <Skeleton width="62%" height={14} />
                  <Skeleton width="82%" height={11} style={{ marginTop: 7 }} />
                </td>
                <td><Skeleton width={60} height={13} /></td>
                <td><Skeleton width="72%" height={13} /></td>
                {[0, 1, 2].map(n => (
                  <td className="num" key={n}><Skeleton width={46} height={13} style={{ marginLeft: 'auto' }} /></td>
                ))}
                <td><Skeleton width={64} height={13} /></td>
                <td><Skeleton width={120} height={32} radius={10} style={{ marginLeft: 'auto' }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SkeletonRegion>
  )
}

// Compare: the grid of courses to pick from.
export function DeleCoursesSkeleton({ count = 8 }) {
  return (
    <SkeletonRegion className="dl-course-grid" label="Loading courses">
      {Array.from({ length: count }, (_, i) => (
        <div className="dl-course" key={i} style={{ cursor: 'default', gap: 8 }}>
          <Skeleton width={70} height={16} />
          <Skeleton width="84%" height={13} />
          <Skeleton width="42%" height={12} />
        </div>
      ))}
    </SkeletonRegion>
  )
}

// The whole owner frame, while the session is being checked.
export function DeleShellSkeleton() {
  return (
    <div className="dl-shell">
      <header className="dl-top">
        <div className="dl-brand">
          <Skeleton width={30} height={30} radius={9} />
          <Skeleton width={110} height={16} />
        </div>
        <nav className="dl-tabs" style={{ alignItems: 'center' }}>
          {[0, 1, 2, 3, 4].map(i => <Skeleton key={i} width={72} height={30} radius={9} />)}
        </nav>
        <Skeleton width={84} height={34} radius={10} />
      </header>
      <main className="dl-main">
        <DeleOverviewSkeleton label="Loading the owner area" />
      </main>
    </div>
  )
}
