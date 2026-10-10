import './Skeleton.css'

// One grey shape. `width` / `height` take a number (px) or any CSS length.
// `circle` makes a round one from `width` alone; `dark` is for dark surfaces.
export function Skeleton({ width = '100%', height = 14, radius, circle = false, dark = false, className = '', style }) {
  const classes = ['sk', dark && 'dark', className].filter(Boolean).join(' ')
  return (
    <span
      className={classes}
      style={{
        width,
        height: circle ? width : height,
        borderRadius: circle ? '50%' : radius,
        flex: circle ? 'none' : undefined,
        ...style,
      }}
      aria-hidden="true"
    />
  )
}

// Wraps a group of shapes so a screen reader hears `label` once ("Loading your
// courses") instead of a pile of empty boxes. Pass `className` when the group
// is itself the layout (a grid of cards, say).
export function SkeletonRegion({ label = 'Loading', className, style, children }) {
  return (
    <div className={className} style={style} role="status" aria-live="polite" aria-busy="true">
      <span className="sk-sr">{label}</span>
      {children}
    </div>
  )
}

/* ------------------------------- presets ---------------------------------- */

// Course cards (.cards / .card) - the Dashboard, Past Questions and staff grids.
export function CourseCardsSkeleton({ count = 6, label = 'Loading your courses' }) {
  return (
    <SkeletonRegion className="cards" label={label}>
      {Array.from({ length: count }, (_, i) => (
        <div className="card" key={i}>
          <Skeleton width={74} height={16} />
          <Skeleton width="82%" height={14} style={{ margin: '12px 0 10px' }} />
          <Skeleton width="48%" height={12} style={{ marginBottom: 14 }} />
          <Skeleton height={38} radius={8} />
        </div>
      ))}
    </SkeletonRegion>
  )
}

// Inside a real course card whose code and title are already known: the
// "N years available" line and the button, while the paper list loads.
export function CourseCardPending() {
  return (
    <>
      <Skeleton width="46%" height={12} style={{ margin: '-6px 0 12px' }} />
      <Skeleton height={38} radius={8} />
    </>
  )
}

// Year cards (.pq-cards / .pq-card) on a course's past-questions page.
export function PaperCardsSkeleton({ count = 3, label = 'Loading past questions' }) {
  return (
    <SkeletonRegion className="pq-cards" label={label}>
      {Array.from({ length: count }, (_, i) => (
        <div className="pq-card" key={i}>
          <Skeleton width="62%" height={18} />
          <div className="pq-mode-selector">
            <Skeleton height={56} radius={8} />
            <Skeleton height={56} radius={8} />
          </div>
          <Skeleton height={40} radius={8} />
        </div>
      ))}
    </SkeletonRegion>
  )
}

const SHEET_LINES = [100, 94, 98, 62, 100, 90, 96, 54, 100, 92, 70, 98]

// Blank sheets of paper, shown inside the reader while the file loads.
export function ReaderSkeleton({ topPadding = 72, label = 'Loading paper' }) {
  return (
    <SkeletonRegion className="sk-reader" label={label} style={{ paddingTop: topPadding }}>
      {[0, 1].map(sheet => (
        <div className="sk-sheet" key={sheet}>
          <Skeleton width="44%" height={20} />
          <Skeleton width="28%" height={12} style={{ marginBottom: 14 }} />
          {SHEET_LINES.map((w, i) => (
            <Skeleton key={i} width={`${w}%`} height={12} />
          ))}
        </div>
      ))}
    </SkeletonRegion>
  )
}

// Rows in the notification panel.
export function NotificationRowsSkeleton({ count = 3 }) {
  return (
    <SkeletonRegion label="Loading notifications">
      {Array.from({ length: count }, (_, i) => (
        <div className="sk-row" key={i}>
          <Skeleton circle width={32} />
          <div className="sk-row-body">
            <Skeleton width="38%" height={13} />
            <Skeleton width="92%" height={12} />
            <Skeleton width="24%" height={11} />
          </div>
        </div>
      ))}
    </SkeletonRegion>
  )
}
