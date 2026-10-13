import { useState } from 'react'
import { formatWhen, plural } from '../../lib/format'
import { useDele } from './deleContext'
import DeleSelect from './DeleSelect'
import PaperPreview from './PaperPreview'

const STATUS_LABEL = { pending: 'Waiting for review', approved: 'Approved', rejected: 'Rejected' }

// One paper with Approve / Reject / Delete. `onChanged(paper)` gets the updated
// paper, `onDeleted(id)` is called once it has been removed. `compact` is the
// small version used when many papers are scrolled through together.
// `onRefresh` asks the page to reload its list: choosing a version can change
// other papers' numbers too, and approving or deleting renumbers the rest.
export default function PaperReview({ paper, onChanged, onDeleted, onRefresh, showFiles = true, compact = false }) {
  const { call } = useDele()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)

  async function update(body) {
    setBusy(true)
    setError('')
    try {
      const { paper: updated } = await call(`/papers/${paper.id}`, { method: 'PATCH', body })
      onChanged({ ...updated, publicVersions: paper.publicVersions })
      onRefresh?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const setStatus = status => update({ status })

  async function remove() {
    setBusy(true)
    setError('')
    try {
      await call(`/papers/${paper.id}`, { method: 'DELETE' })
      onDeleted(paper.id)
      onRefresh?.()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  const fileCount = paper.files.length

  // v1 is the plain "PGE 101 2022/2023"; v2, v3... are labelled. Only offered
  // when students can see more than one paper for this course and year.
  const chooseVersion = paper.status === 'approved' && paper.publicVersions > 1
  const versionOptions = Array.from({ length: paper.publicVersions }, (_, i) => ({
    value: i + 1,
    label: i === 0 ? 'v1 · main' : `v${i + 1}`,
  }))

  return (
    <article className={`dl-paper is-${paper.status}${compact ? ' compact' : ''}`}>
      <header className="dl-paper-head">
        <div>
          <h3>{paper.title}</h3>
          <p>
            {plural(fileCount, 'file')} · by <b>{paper.uploader.label}</b>
            {!compact && paper.uploader.email ? ` · ${paper.uploader.email}` : ''} · {formatWhen(paper.createdAt)}
          </p>
        </div>
        <span className={`dl-badge-status ${paper.status}`}>{STATUS_LABEL[paper.status]}</span>
      </header>

      {chooseVersion && (
        <div className="dl-paper-version">
          <span>Version students see</span>
          <DeleSelect
            label="Version"
            value={paper.version}
            options={versionOptions}
            onChange={version => update({ version })}
          />
        </div>
      )}

      {showFiles && (
        <PaperPreview files={paper.files} label={paper.title} height={320} compact={compact} />
      )}

      {error && <p className="dl-error" role="alert">{error}</p>}

      <footer className="dl-actions">
        {paper.status !== 'approved' && (
          <button type="button" className="dl-btn ok" disabled={busy} onClick={() => setStatus('approved')}>
            Approve
          </button>
        )}
        {paper.status !== 'rejected' && (
          <button type="button" className="dl-btn warn" disabled={busy} onClick={() => setStatus('rejected')}>
            Reject
          </button>
        )}

        {confirming ? (
          <span className="dl-confirm">
            Delete this paper and its files for good?
            <button type="button" className="dl-btn danger" disabled={busy} onClick={remove}>Yes, delete</button>
            <button type="button" className="dl-btn ghost" disabled={busy} onClick={() => setConfirming(false)}>Cancel</button>
          </span>
        ) : (
          <button type="button" className="dl-btn ghost danger-text" disabled={busy} onClick={() => setConfirming(true)}>
            Delete
          </button>
        )}
      </footer>
    </article>
  )
}
