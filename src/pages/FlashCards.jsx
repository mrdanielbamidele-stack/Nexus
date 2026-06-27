import { Link } from 'react-router'
import { useEffectiveCourses } from '../lib/studentCourses'
import { flashcards, deckSize } from '../data/flashcards'
import { testKey } from '../lib/campaign'
import ScrollToTop from '../components/ScrollToTop';

function FlashCardCard({ course }) {
  const deck = flashcards[testKey(course.code)]
  const topicCount = deck ? deck.topics.length : 0
  const cardCount = deckSize(deck)

  return (
    <div className="card">
      <strong>{course.code}</strong>
      <div className="course-title">{course.title}</div>
      <p className="muted" style={{ marginTop: -10 }}>
        {deck ? `${cardCount} cards · ${topicCount} topics` : 'Flashcards coming soon'}
      </p>

      <Link
        to={`/flashcards/${testKey(course.code)}`}
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        <button>Study Flashcards</button>
      </Link>
    </div>
  )
}

export default function FlashCards() {
  const allCourses = useEffectiveCourses()
  return (
    <>
     <ScrollToTop />
      <h1>Flash Cards</h1>
      <p className="muted">Flip through bite-sized question &amp; answer cards, topic by topic.</p>
      <div className="cards">
        {allCourses.map(course => (
          <FlashCardCard key={course.code} course={course} />
        ))}
      </div>
    </>
  )
}
