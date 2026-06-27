import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate , Link } from 'react-router'
import { flashcards } from '../data/flashcards'
import { testKey } from '../lib/campaign'
import MathContent from '../components/MathContent'
import NotFound from './NotFound'
import { formatCode } from '../lib/courseSlug'
import './FlashCardDeck.css'
import '../../nexus-breadcrumb.css'
import ScrollToTop from '../components/ScrollToTop';

const MAX_DOTS = 30

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Shown when a course has no flashcard deck (unknown course code).
function NoDeck({ code }) {
  return (
    <NotFound
      title="404 - Flashcards not found"
      message={`There are no flashcards for ${formatCode(code) || 'this course'} yet. Check back soon!`}
      homeTo="/flashcards"
      homeLabel="Back to Flash Cards"
    />
  )
}

export default function FlashCardDeck() {
  const { courseCode } = useParams()
  const navigate = useNavigate()
  const key = testKey(courseCode)
  const deck = flashcards[key]

  // 'topics' (pick topics) → 'cards' (study) → 'done' (completion)
  const [view, setView] = useState('topics')
  const [selected, setSelected] = useState(() => new Set())
  const [cards, setCards] = useState([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [swipe, setSwipe] = useState('')

  const cardRef = useRef(null)
  const touch = useRef({ x: 0, y: 0 })

  const displayCode = (deck?.code || courseCode || '').replace(/^TUM-/, '')

  useEffect(() => {
    document.title = deck ? `${displayCode} Flashcards – Nexus` : 'Flash Cards – Nexus'
  }, [deck, displayCode])

  // When you enter the study view, bring the actual flashcard into view so the
  // card (not the header) is what you land on - on every screen size.
  useEffect(() => {
    if (view !== 'cards') return
    const id = requestAnimationFrame(() => {
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
    return () => cancelAnimationFrame(id)
  }, [view])

  const current = cards[index]

  function toggleTopic(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  function selectAll() { setSelected(new Set(deck.topics.map(t => t.id))) }
  function clearAll() { setSelected(new Set()) }

  function start() {
    const built = []
    deck.topics
      .filter(t => selected.has(t.id))
      .forEach(t => t.cards.forEach(c => built.push({ ...c, topic: t.name })))
    setCards(shuffle(built))
    setIndex(0)
    setFlipped(false)
    setView('cards')
  }

  function flip() { setFlipped(f => !f) }

  function goNext() {
    if (index < cards.length - 1) {
      setSwipe('left')
      setTimeout(() => setSwipe(''), 350)
      setFlipped(false)
      setIndex(i => i + 1)
    } else {
      setView('done')
    }
  }
  function goPrev() {
    if (index > 0) {
      setSwipe('right')
      setTimeout(() => setSwipe(''), 350)
      setFlipped(false)
      setIndex(i => i - 1)
    }
  }

  // Keyboard navigation while studying.
  useEffect(() => {
    if (view !== 'cards') return
    function onKey(e) {
      if (e.key === 'ArrowRight' || e.key === 'Tab') { e.preventDefault(); goNext() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev() }
      else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, index, cards.length])

  function onTouchStart(e) {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  function onTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - touch.current.x
    const dy = e.changedTouches[0].clientY - touch.current.y
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      dx < 0 ? goNext() : goPrev()
    } else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      flip()
    }
  }

  if (!deck) return <NoDeck code={courseCode} />

  const total = cards.length
  const pct = total ? Math.round((index / total) * 100) : 0
  const dotCount = Math.min(total, MAX_DOTS)

  return (
    <div className="fc-deck">
       <ScrollToTop />
        <nav className="nx-breadcrumb nx-fixed" aria-label="breadcrumb">
             <ScrollToTop />
             <Link className="nx-bc-item" to="/flashcards">
               <span className="nx-bc-home-dot"></span>
               Flash Cards
             </Link>
             <span className="nx-bc-sep">/</span>
             <span className="nx-bc-item nx-bc-current">
                {formatCode(courseCode)}
             </span>
           </nav>
      {/* Header */}
      <div className="fc-header-row">
        <div>
          <h1 className="fc-title">{displayCode} Flashcards</h1>
          <p className="fc-sub">{deck.title}</p>
        </div>
        <button className="fc-help-btn" onClick={() => navigate('/flashcards')}>
          ← All courses
        </button>
      </div>

      {/* ── Topic selection ── */}
      {view === 'topics' && (
        <>
          <div className="fc-section-label">Select topics to study</div>
          <div className="fc-topics-grid">
            {deck.topics.map(t => {
              const isSel = selected.has(t.id)
              return (
                <div
                  key={t.id}
                  className={`fc-topic-card ${isSel ? 'selected' : ''}`}
                  onClick={() => toggleTopic(t.id)}
                >
                  <div className="fc-topic-inner">
                    {t.module && <div className="fc-topic-num">{t.module}</div>}
                    <div className="fc-topic-name">{t.name}</div>
                    <div className="fc-topic-count">{t.cards.length} cards</div>
                  </div>
                  <div className="fc-topic-check">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#7c3aed" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="fc-actions">
            <button className="fc-btn-ghost" onClick={selectAll}>Select All</button>
            <button className="fc-btn-ghost danger" onClick={clearAll}>Clear</button>
            <button className="fc-btn-start" onClick={start} disabled={selected.size === 0}>
              Start Flashcards →
            </button>
          </div>
        </>
      )}

      {/* ── Study ── */}
      {view === 'cards' && current && (
        <>
          <div className="fc-bar">
            <button className="fc-btn-back" onClick={() => setView('topics')}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
              Topics
            </button>
            <div className="fc-meta">Topic: <strong>{current.topic}</strong></div>
          </div>

          <div className="fc-progress-wrap">
            <div className="fc-progress-top">
              <span>Card {index + 1} of {total}</span>
              <span>{pct}%</span>
            </div>
            <div className="fc-progress-bar">
              <div className="fc-progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="fc-dots">
            {Array.from({ length: dotCount }).map((_, i) => (
              <div key={i} className={`fc-dot ${i === index ? 'active' : i < index ? 'seen' : ''}`} />
            ))}
          </div>

          <div className="fc-stage">
            <button className="fc-arrow" onClick={goPrev} disabled={index === 0} aria-label="Previous card">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
            </button>

            <div
              className={`fc-card-container ${swipe ? `swipe-${swipe}` : ''}`}
              ref={cardRef}
              role="button"
              tabIndex={0}
              aria-label="Flashcard – click or press space to flip"
              onClick={flip}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <div className={`fc-card-inner ${flipped ? 'flipped' : ''}`}>
                <div className="fc-face fc-front">
                  <div className="fc-face-label">Question</div>
                  <span className="fc-tag">{current.topic}</span>
                  <MathContent className="fc-question" html={current.q} />
                  <div className="fc-hint">Tap / click to reveal answer</div>
                </div>
                <div className="fc-face fc-back">
                  <div className="fc-face-label">Answer</div>
                  <span className="fc-tag">{current.topic}</span>
                  <MathContent className="fc-answer" html={current.a.replace(/\n/g, '<br>')} />
                  <div className="fc-hint" style={{ marginTop: 'auto' }}>Tap again to flip back</div>
                </div>
              </div>
            </div>

            <button className="fc-arrow" onClick={goNext} aria-label="Next card">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>

          {/* Mobile nav - the side arrows hide on small screens, so give
              touch users real Prev / Flip / Next buttons. */}
          <div className="fc-mobile-nav">
            <button className="fc-nav-btn" onClick={goPrev} disabled={index === 0}>← Prev</button>
            <button className="fc-nav-btn primary" onClick={flip}>Flip</button>
            <button className="fc-nav-btn" onClick={goNext}>
              {index === total - 1 ? 'Finish' : 'Next →'}
            </button>
          </div>

          <div className="fc-tap-hint">Swipe or use the buttons · tap the card to flip</div>

          <div className="fc-kb-hints">
            <div className="fc-kb-item"><span className="fc-kbd">←</span><span className="fc-kbd">→</span> Navigate</div>
            <div className="fc-kb-item"><span className="fc-kbd">Space</span> Flip</div>
            <div className="fc-kb-item"><span className="fc-kbd">Tab</span> Next</div>
          </div>
        </>
      )}

      {/* ── Completion ── */}
      {view === 'done' && (
        <div className="fc-done">
          <div className="fc-done-icon">✓</div>
          <h2>You&apos;ve finished!</h2>
          <p>You reviewed all {total} cards across {selected.size} topic{selected.size > 1 ? 's' : ''}. Great work!</p>
          <div className="fc-done-actions">
            <button className="fc-btn-primary" onClick={start}>Restart Deck</button>
            <button className="fc-btn-outline" onClick={() => setView('topics')}>Change Topics</button>
          </div>
        </div>
      )}
    </div>
  )
}
