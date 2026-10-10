import { useState } from 'react'
import { formatWhen, plural } from '../../lib/format'
import { formatBytes } from '../../lib/studentUploads'
import { useDele } from './deleContext'

const IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif']

const isImage = file => file.kind === 'page' || IMAGE_FORMATS.includes((file.format || '').toLowerCase())
const isPdf = file => (file.format || '').toLowerCase() === 'pdf' || /\.pdf($|\?)/i.test(file.url)

const absolute = url => new URL(url, window.location.origin).href

// Every file of one paper, shown so it can be judged without leaving the page:
// photos as images, PDFs in a frame, Word/Excel/PowerPoint through Office's viewer.
export function PaperFiles({ files }) {
  const pages = files.filter(isImage)
  const documents = files.filter(file => !isImage(file))

  return (
    <div className="dl-files">
      {pages.length > 0 && (
        <div className="dl-pages">
          {pages.map((file, i) => (
            <a key={file.url} href={file.url} target="_blank" rel="noreferrer" className="dl-page" title="Open full size">
              <img src={file.url} alt={`Page ${file.page || i + 1}`} loading="lazy" />
              <span>{file.page || i + 1}</span>
            </a>
          ))}
        </div>
      )}

      {documents.map(file => (
        <div className="dl-doc" key={file.url}>
          <div className="dl-doc-head">
            <strong title={file.name}>{file.name || 'Document'}</strong>
            <span>{(file.format || 'file').toUpperCase()}{file.bytes ? ` · ${formatBytes(file.bytes)}` : ''}</span>
            <a href={file.url} target="_blank" rel="noreferrer">Open</a>
          </div>
          {isPdf(file) ? (
            <iframe className="dl-frame" src={file.url} title={file.name || 'PDF'} loading="lazy" />
          ) : (
            <iframe
              className="dl-frame"
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absolute(file.url))}`}
              title={file.name || 'Document'}
              loading="lazy"
            />
          )}
        </div>
      ))}
    </div>
  )
}

const STATUS_LABEL = { pending: 'Waiting for review', approved: 'Approved', rejected: 'Rejected' }

// One paper with Approve / Reject / Delete. `onChanged(paper)` gets the updated
// paper, `onDeleted(id)` is called once it has been removed.
export default function PaperReview({ paper, onChanged, onDeleted, showFiles = true }) {
  const { call } = useDele()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)

  async function setStatus(status) {
    setBusy(true)
    setError('')
    try {
      const { paper: updated } = await call(`/papers/${paper.id}`, { method: 'PATCH', body: { status } })
      onChanged(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    setBusy(true)
    setError('')
    try {
      await call(`/papers/${paper.id}`, { method: 'DELETE' })
      onDeleted(paper.id)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  const fileCount = paper.files.length

  return (
    <article className={`dl-paper is-${paper.status}`}>
      <header className="dl-paper-head">
        <div>
          <h3>{paper.title}</h3>
          <p>
            {plural(fileCount, 'file')} · by <b>{paper.uploader.label}</b>
            {paper.uploader.email ? ` · ${paper.uploader.email}` : ''} · {formatWhen(paper.createdAt)}
          </p>
        </div>
        <span className={`dl-badge-status ${paper.status}`}>{STATUS_LABEL[paper.status]}</span>
      </header>

      {showFiles && <PaperFiles files={paper.files} />}

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
