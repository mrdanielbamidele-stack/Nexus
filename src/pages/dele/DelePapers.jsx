import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import PaperReview from './PaperReview'
import { useDele } from './deleContext'
import { DeleCardsSkeleton } from './DeleSkeletons'

const FILTERS = [
  { id: 'pending', label: 'Waiting' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: '', label: 'All' },
]

// Moderation queue: approve, reject or delete what people have sent.
export default function DelePapers() {
  const { call } = useDele()
  const [status, setStatus] = useState('pending')
  const [papers, setPapers] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const { papers: list } = await call(`/papers${status ? `?status=${status}` : ''}`)
      setPapers(list)
    } catch (err) {
      setError(err.message)
    }
  }, [call, status])

  useEffect(() => {
    setPapers(null)
    load()
  }, [load])

  function changed(updated) {
    // It may no longer belong in this filter (e.g. approved while viewing "Waiting").
    setPapers(list => list.flatMap(p => (p.id !== updated.id ? [p] : !status || updated.status === status ? [updated] : [])))
  }

  const removed = id => setPapers(list => list.filter(p => p.id !== id))

  return (
    <div>
      <div className="dl-titlebar">
        <h1>Papers</h1>
        <Link className="dl-btn ghost" to="/delealone/compare">Compare by course</Link>
      </div>

      <div className="dl-filters" role="tablist">
        {FILTERS.map(filter => (
          <button
            key={filter.id || 'all'}
            type="button"
            role="tab"
            aria-selected={status === filter.id}
            className={`dl-chip${status === filter.id ? ' on' : ''}`}
            onClick={() => setStatus(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {error && <p className="dl-error" role="alert">{error}</p>}
      {!papers && !error && <DeleCardsSkeleton />}

      {papers?.length === 0 && (
        <p className="dl-empty">
          {status === 'pending' ? 'Nothing in Lobby' : 'No papers here.'}
        </p>
      )}

      {papers?.length > 0 && (
        <div className="dl-cmp-grid">
          {papers.map(paper => (
            <PaperReview key={paper.id} paper={paper} compact onChanged={changed} onDeleted={removed} onRefresh={load} />
          ))}
        </div>
      )}
    </div>
  )
}
