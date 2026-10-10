import './HeroBanner.css'

// A little four-point sparkle that twinkles. `spots` are positions inside the
// 300x220 artwork: x, y, size and a stagger so they don't all blink together.
const BOOK_SPOTS = [
  { x: 46, y: 62, size: 1, delay: 0 },
  { x: 258, y: 100, size: 1.15, delay: 0.9 },
  { x: 238, y: 26, size: 0.7, delay: 1.7 },
  { x: 34, y: 142, size: 0.7, delay: 2.3 },
]

export function Twinkles({ spots = BOOK_SPOTS }) {
  return spots.map(({ x, y, size, delay }) => (
    <g key={`${x}-${y}`} transform={`translate(${x} ${y}) scale(${size})`}>
      <path
        className="hb-twinkle"
        style={{ animationDelay: `${delay}s` }}
        d="M0-9C1-3 3-1 9 0 3 1 1 3 0 9-1 3-3 1-9 0-3-1-1-3 0-9z"
        fill="#c4b3f0"
      />
    </g>
  ))
}

function BooksArt() {
  return (
    <svg viewBox="0 0 300 220" width="100%">
      <ellipse cx="150" cy="196" rx="92" ry="9" fill="#d8cdf3" opacity="0.55" />
      <rect x="82" y="152" width="136" height="36" rx="9" fill="#6d4fc2" />
      <rect x="96" y="167" width="62" height="5" rx="2.5" fill="#fff" opacity="0.55" />
      <rect x="94" y="116" width="122" height="36" rx="9" fill="#9a82e0" />
      <rect x="108" y="131" width="54" height="5" rx="2.5" fill="#fff" opacity="0.6" />
      <rect x="78" y="80" width="130" height="36" rx="9" fill="#efe8fd" stroke="#cdbdf2" />
      <rect x="92" y="95" width="58" height="5" rx="2.5" fill="#b9a6ec" />
      <path d="M150 20 218 44 150 68 82 44z" fill="#4c3a99" />
      <path d="M112 56v18c0 8 17 15 38 15s38-7 38-15V56l-38 14z" fill="#5d49b0" />
      <path d="M218 44v26" stroke="#4c3a99" strokeWidth="3" strokeLinecap="round" />
      <circle cx="218" cy="74" r="5" fill="#e9b872" />
      <Twinkles />
    </svg>
  )
}

// Soft lavender banner with a headline, a line or two of encouragement and a
// small line-art illustration (a stack of books under a graduation cap).
// Shared by the Dashboard and the Settings hub so both greet you the same way.
// Pass `art` (an <svg>) to swap the stack-of-books illustration for your own.
export default function HeroBanner({ title, children, art, className = '' }) {
  return (
    <div className={`hb-banner ${className}`.trim()}>
      <div className="hb-copy">
        <h2>{title}</h2>
        <p>{children}</p>
      </div>

      <div className="hb-art" aria-hidden="true">
        <span className="hb-orbit" />
        {art || <BooksArt />}
      </div>
    </div>
  )
}
