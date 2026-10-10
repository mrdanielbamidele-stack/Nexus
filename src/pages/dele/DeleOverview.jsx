import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { formatDuration, timeAgo } from '../../lib/format'
import { useDele } from './deleContext'
import { DeleOverviewSkeleton } from './DeleSkeletons'

const DAY_OPTIONS = [7, 14, 30, 90]

const SETUP_LABELS = {
  mongodb: 'MongoDB connection',
  session: 'Session secret',
  google: 'Google sign-in',
  cloudinary: 'Cloudinary uploads',
  owner: 'Owner passwords',
  push: 'Background notifications',
  chat: 'Nexus AI chat',
}

function Stat({ label, value, hint, to }) {
  const body = (
    <>
      <span className="dl-stat-value">{value}</span>
      <span className="dl-stat-label">{label}</span>
      {hint && <span className="dl-stat-hint">{hint}</span>}
    </>
  )
  return to ? <Link to={to} className="dl-stat link">{body}</Link> : <div className="dl-stat">{body}</div>
}

function Table({ title, columns, rows, empty = 'Nothing yet.' }) {
  return (
    <section className="dl-card">
      <h2>{title}</h2>
      {rows.length === 0 ? (
        <p className="dl-empty small">{empty}</p>
      ) : (
        <div className="dl-table-wrap">
          <table className="dl-table">
            <thead>
              <tr>{columns.map(c => <th key={c} className={c === columns[0] ? '' : 'num'}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => <td key={j} className={j === 0 ? '' : 'num'}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

const person = row => (
  <span title={row.email || ''}>
    {row.who}
    {row.role && <em className="dl-role">{row.role}</em>}
  </span>
)

export default function DeleOverview() {
  const { call } = useDele()
  const [days, setDays] = useState(14)
  const [data, setData] = useState(null)
  const [health, setHealth] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setError('')
    call(`/overview?days=${days}`)
      .then(result => { if (!cancelled) setData(result) })
      .catch(err => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [call, days])

  useEffect(() => {
    call('/health').then(setHealth).catch(() => {})
  }, [call])

  if (error) return <p className="dl-error" role="alert">{error}</p>
  if (!data) return <DeleOverviewSkeleton />

  const { users, papers, activity, series } = data
  const peak = Math.max(1, ...series.map(d => d.downloads + d.opens))
  const missing = health ? Object.entries(health).filter(([, ok]) => !ok) : []

  return (
    <div>
      <div className="dl-titlebar">
        <h1>Overview</h1>
        <div className="dl-filters">
          {DAY_OPTIONS.map(option => (
            <button
              key={option}
              type="button"
              className={`dl-chip${days === option ? ' on' : ''}`}
              onClick={() => setDays(option)}
            >
              {option} days
            </button>
          ))}
        </div>
      </div>

      {missing.length > 0 && (
        <div className="dl-notice" role="status">
          <b>Setup incomplete:</b> {missing.map(([key]) => SETUP_LABELS[key] || key).join(', ')}. Add the missing
          values to the environment and redeploy.
        </div>
      )}

      {papers.pending > 0 && (
        <Link to="/delealone/papers" className="dl-notice link">
          <b>{papers.pending}</b> paper{papers.pending === 1 ? ' is' : 's are'} waiting for your review →
        </Link>
      )}

      <div className="dl-stats">
        <Stat label="Students" value={users.students} hint={`${users.studentsUnverified} not verified yet`} />
        <Stat label="Admins" value={users.admins} hint={`${users.adminsUnverified} not verified yet`} />
        <Stat label="Online right now" value={users.onlineNow} />
        <Stat label="Downloads" value={activity.downloads} hint={`last ${days} days`} />
        <Stat label="Papers opened" value={activity.opens} hint={`last ${days} days`} />
        <Stat label="Time reading papers" value={formatDuration(activity.readSeconds)} />
        <Stat label="Time on Nexus" value={formatDuration(activity.activeSeconds)} />
        <Stat label="Links clicked" value={activity.linkClicks} />
        <Stat label="Approved papers" value={papers.approved} hint={`${papers.rejected} rejected`} to="/delealone/papers" />
      </div>

      <section className="dl-card">
        <h2>Downloads and opens per day</h2>
        <div className="dl-bars" role="img" aria-label="Downloads and opens per day">
          {series.map(day => (
            <div className="dl-bar-col" key={day.day} title={`${day.day}: ${day.downloads} downloads, ${day.opens} opens, ${day.people} people`}>
              <div className="dl-bar-stack" style={{ height: `${((day.downloads + day.opens) / peak) * 100}%` }}>
                <span className="dl-bar-dl" style={{ flex: day.downloads }} />
                <span className="dl-bar-op" style={{ flex: day.opens }} />
              </div>
              <span className="dl-bar-label">{series.length <= 14 ? day.day.slice(5) : ''}</span>
            </div>
          ))}
        </div>
        <p className="dl-legend"><i className="dl-bar-dl" /> Downloads <i className="dl-bar-op" /> Opened</p>
      </section>

      <div className="dl-two">
        <Table
          title="Who downloads the most"
          columns={['Person', 'Downloads', 'Last']}
          rows={data.topDownloaders.map(d => [person(d), d.downloads, timeAgo(d.last)])}
          empty="No downloads in this period."
        />
        <Table
          title="Most popular papers"
          columns={['Paper', 'Downloads', 'Opened', 'Read for']}
          rows={data.topPapers.map(p => [p.title, p.downloads, p.opens, formatDuration(p.seconds)])}
          empty="No paper activity in this period."
        />
      </div>

      <Table
        title="Who is reading what, and for how long"
        columns={['Person', 'Paper', 'Time spent', 'Last read']}
        rows={data.viewers.map(v => [person(v), v.title, formatDuration(v.seconds), timeAgo(v.last)])}
        empty="Nobody has read a paper in this period."
      />

      <div className="dl-two">
        <Table
          title="Time on the platform"
          columns={['Person', 'Time', 'Last seen']}
          rows={data.usage.map(u => [person(u), formatDuration(u.seconds), timeAgo(u.last)])}
          empty="No usage recorded yet."
        />
        <Table
          title="Links people clicked"
          columns={['Link', 'Clicks', 'Last']}
          rows={data.links.map(l => [
            <span key={l.url} title={l.url}>{l.label}</span>, l.clicks, timeAgo(l.last),
          ])}
          empty="No links clicked in this period."
        />
      </div>
    </div>
  )
}
