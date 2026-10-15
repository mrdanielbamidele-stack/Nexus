import { useCallback, useEffect, useRef, useState } from 'react'
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

// The list loads 50 papers at a time; "Load 50 more" brings the next 50.
const BATCH = 50

// Moderation queue: approve, reject or delete what people have sent.
export default function DelePapers() {
  const { call } = useDele()
  const [status, setStatus] = useState('pending')
  const [papers, setPapers] = useState(null)
  const [total, setTotal] = useState(0)
  const [moreLoading, setMoreLoading] = useState(false)
  const [error, setError] = useState('')
  const count = useRef(0) // how many are on screen, so a refresh keeps them all
  count.current = papers?.length || 0

  const url = (from, size) =>
    `/papers?limit=${size}&offset=${from}${status ? `&status=${status}` : ''}`

  // Load (or reload) the list from the top. A reload after an approve or delete
  // asks for as many as are already showing, so the page doesn't jump back to 50.
  const load = useCallback(async (keep = false) => {
    setError('')
    try {
      const size = keep ? Math.min(100, Math.max(BATCH, count.current)) : BATCH
      const result = await call(`/papers?limit=${size}&offset=0${status ? `&status=${status}` : ''}`)
      setPapers(result.papers)
      setTotal(result.total)
    } catch (err) {
      setError(err.message)
    }
  }, [call, status])

  useEffect(() => {
    setPapers(null)
    load()
  }, [load])

  async function loadMore() {
    setMoreLoading(true)
    setError('')
    try {
      const result = await call(url(papers.length, BATCH))
      setPapers(list => {
        const seen = new Set(list.map(p => p.id))
        return [...list, ...result.papers.filter(p => !seen.has(p.id))]
      })
      setTotal(result.total)
    } catch (err) {
      setError(err.message)
    } finally {
      setMoreLoading(false)
    }
  }

  function changed(updated) {
    // It may no longer belong in this filter (e.g. approved while viewing "Waiting").
    setPapers(list => list.flatMap(p => (p.id !== updated.id ? [p] : !status || updated.status === status ? [updated] : [])))
  }

  const removed = id => setPapers(list => list.filter(p => p.id !== id))

  const left = total - (papers?.length || 0)

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
            <PaperReview key={paper.id} paper={paper} compact onChanged={changed} onDeleted={removed} onRefresh={() => load(true)} />
          ))}
        </div>
      )}

      {left > 0 && (
        <div className="dl-cmp-more">
          <span>Showing {papers.length} of {total} papers</span>
          <button type="button" className="dl-btn ghost" disabled={moreLoading} onClick={loadMore}>
            {moreLoading ? 'Loading…' : `Load ${Math.min(BATCH, left)} more`}
          </button>
        </div>
      )}
    </div>
  )
}
