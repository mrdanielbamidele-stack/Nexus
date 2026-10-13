import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import HeroBanner from '../../components/HeroBanner'
import UiIcon from '../../components/UiIcon'
import { formatDuration, timeAgo } from '../../lib/format'
import { useDele } from './deleContext'
import DeleSelect from './DeleSelect'
import { DeleOverviewSkeleton } from './DeleSkeletons'

const DAY_OPTIONS = [7, 14, 30, 90].map(n => ({ value: n, label: `Last ${n} days` }))

const SETUP_LABELS = {
  mongodb: 'MongoDB connection',
  session: 'Session secret',
  google: 'Google sign-in',
  cloudinary: 'Cloudinary uploads',
  owner: 'Owner passwords',
  push: 'Background notifications',
  chat: 'Nexus AI chat',
}

const dayLabel = day =>
  new Date(`${day}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })

/* --------------------------------- pieces --------------------------------- */

function Metric({ icon, tone, label, value, hint, footnote, to }) {
  const body = (
    <>
      <span className={`dl-ov-icon ${tone}`}><UiIcon name={icon} size={18} /></span>
      <small>{label}</small>
      <b>{value}</b>
      {hint && <span>{hint}</span>}
      {footnote && <span className="dl-ov-footnote">{footnote}</span>}
    </>
  )
  return to
    ? <Link to={to} className="dl-ov-metric link">{body}</Link>
    : <article className="dl-ov-metric">{body}</article>
}

function Panel({ title, action, className = '', children }) {
  return (
    <section className={`dl-ov-panel ${className}`.trim()}>
      <div className="dl-ov-panel-head">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

// Downloads and opens, one bar per day. Hover, focus or tap a bar to read it.
function ActivityChart({ series }) {
  const [selected, setSelected] = useState(null)
  const peak = Math.max(1, ...series.map(d => d.downloads + d.opens))
  const row = series[selected] ?? series[series.length - 1]

  return (
    <>
      <div className="dl-ov-readout">
        <b>{dayLabel(row.day)}</b>
        <span>
          {row.downloads} downloads · {row.opens} opened · {row.people} people on Nexus
        </span>
      </div>

      <div className="dl-ov-chart">
        <div className="dl-ov-axis" aria-hidden="true">
          <span>{peak}</span>
          <span>{Math.round(peak / 2)}</span>
          <span>0</span>
        </div>
        <div className="dl-ov-bars">
          {series.map((day, i) => (
            <button
              key={day.day}
              type="button"
              className={selected === i ? 'selected' : ''}
              aria-label={`${dayLabel(day.day)}: ${day.downloads} downloads, ${day.opens} opened`}
              onMouseEnter={() => setSelected(i)}
              onFocus={() => setSelected(i)}
              onClick={() => setSelected(i)}
            >
              <span className="opens" style={{ height: `${(day.opens / peak) * 100}%` }} />
              <span className="downloads" style={{ height: `${(day.downloads / peak) * 100}%` }} />
            </button>
          ))}
        </div>
      </div>

      <div className="dl-ov-chart-labels">
        <span>{dayLabel(series[0].day)}</span>
        <span><i /> Downloads <i className="opens" /> Opened</span>
        <span>{dayLabel(series[series.length - 1].day)}</span>
      </div>
    </>
  )
}

// How many different people were on Nexus each day.
function PeopleChart({ series }) {
  const peak = Math.max(1, ...series.map(d => d.people))
  const best = series.reduce((top, day) => (day.people > top.people ? day : top), series[0])

  return (
    <>
      <div className="dl-ov-growth">
        {series.map(day => (
          <div key={day.day} title={`${dayLabel(day.day)}: ${day.people} people`}>
            <span style={{ height: `${Math.max(2, (day.people / peak) * 100)}%` }} />
          </div>
        ))}
      </div>
      {best.people > 0 ? (
        <p className="dl-ov-big">
          <b>{best.people}</b> {best.people === 1 ? 'person' : 'people'} on {dayLabel(best.day)}, the busiest day
        </p>
      ) : (
        <p className="dl-ov-big">Nobody has used Nexus in this period yet.</p>
      )}
      <p className="dl-ov-hint">
        {dayLabel(series[0].day)} – {dayLabel(series[series.length - 1].day)}
      </p>
    </>
  )
}

// A short leaderboard: rank, name, a bar relative to the leader, one number.
function Ranking({ rows, empty }) {
  if (rows.length === 0) return <p className="dl-empty small">{empty}</p>
  const top = Math.max(1, ...rows.map(r => r.score))

  return rows.map((row, i) => (
    <div className="dl-ov-rank" key={row.key}>
      <span className="dl-ov-rank-no">{i + 1}</span>
      <div>
        <strong title={row.hint || ''}>
          {row.title}
          {row.role && <em className="dl-role">{row.role}</em>}
        </strong>
        <small>{row.sub}</small>
        <progress max={top} value={row.score} aria-hidden="true" />
      </div>
      <b>
        {row.value}
        <small>{row.valueLabel}</small>
      </b>
    </div>
  ))
}

// Lists show the top ten; the arrow opens (and closes) the full list.
const TOP = 10

function MoreArrow({ open, onClick }) {
  return (
    <button
      type="button"
      className={`dl-ov-more${open ? ' open' : ''}`}
      aria-expanded={open}
      aria-label={open ? `Show only the top ${TOP}` : 'Show the full list'}
      title={open ? `Top ${TOP} only` : 'Full list'}
      onClick={onClick}
    >
      <UiIcon name="arrow" size={17} />
    </button>
  )
}

function RankPanel({ title, rows, empty }) {
  const [open, setOpen] = useState(false)

  return (
    <Panel
      title={title}
      action={rows.length > TOP && <MoreArrow open={open} onClick={() => setOpen(o => !o)} />}
    >
      <Ranking rows={open ? rows : rows.slice(0, TOP)} empty={empty} />
    </Panel>
  )
}

function Table({ title, columns, rows, empty = 'Nothing yet.' }) {
  const [open, setOpen] = useState(false)

  return (
    <Panel
      title={title}
      action={rows.length > TOP && <MoreArrow open={open} onClick={() => setOpen(o => !o)} />}
    >
      {rows.length === 0 ? (
        <p className="dl-empty small">{empty}</p>
      ) : (
        <div className="dl-table-wrap">
          <table className="dl-table">
            <thead>
              <tr>{columns.map(c => <th key={c} className={c === columns[0] ? '' : 'num'}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {(open ? rows : rows.slice(0, TOP)).map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => <td key={j} className={j === 0 ? '' : 'num'}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}

const person = row => (
  <span title={row.email || ''}>
    {row.who}
    {row.role && <em className="dl-role">{row.role}</em>}
  </span>
)

/* ---------------------------------- page ---------------------------------- */

export default function DeleOverview() {
  const { call } = useDele()
  const [days, setDays] = useState(14)
  const [version, setVersion] = useState(0)
  const [data, setData] = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)
  const [health, setHealth] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setError('')
    call(`/overview?days=${days}`)
      .then(result => {
        if (cancelled) return
        setData(result)
        setUpdatedAt(new Date())
      })
      .catch(err => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [call, days, version])

  useEffect(() => {
    call('/health').then(setHealth).catch(() => {})
  }, [call])

  // Re-render every 30 seconds so "Last updated just now" moves on to "1m ago", "5h ago"...
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(n => n + 1), 30 * 1000)
    return () => clearInterval(id)
  }, [])

  if (error) return <p className="dl-error" role="alert">{error}</p>
  if (!data) return <DeleOverviewSkeleton />

  const { users, papers, activity, series } = data
  const missing = health ? Object.entries(health).filter(([, ok]) => !ok) : []
  const notVerified = users.studentsUnverified + users.adminsUnverified
  const period = `Last ${days} days`

  return (
    <div className="dl-ov">
      <div className="dl-ov-title">
        <div>
          <h1>Overview</h1>
          <p className="dl-ov-sub">Downloads, reading time and people across Nexus.</p>
        </div>
        <div className="dl-ov-tools">
          {updatedAt && (
            <span className="dl-ov-updated" title={updatedAt.toLocaleString()}>
              Last updated {timeAgo(updatedAt)}
            </span>
          )}
          <DeleSelect label="Period" value={days} options={DAY_OPTIONS} onChange={setDays} />
          <button type="button" className="dl-btn ghost" onClick={() => setVersion(v => v + 1)}>Refresh</button>
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

      <HeroBanner className="dl-ov-hero" title="Every student, one clear view.">
        {users.students} students and {users.admins} staff use Nexus, with {papers.approved} approved
        papers to read. {users.onlineNow} {users.onlineNow === 1 ? 'person is' : 'people are'} online right now.
      </HeroBanner>

      <div className="dl-ov-metrics">
        <Metric
          icon="users" tone="violet" label="People"
          value={users.students + users.admins}
          hint={`${users.students} students · ${users.admins} staff`}
          footnote={notVerified > 0 ? `${notVerified} not verified yet` : undefined}
        />
        <Metric icon="activity" tone="green" label="Online right now" value={users.onlineNow} hint="Active in the last 3 minutes" />
        <Metric icon="download" tone="peach" label="Downloads" value={activity.downloads} hint={period} />
        <Metric icon="eye" tone="blue" label="Papers opened" value={activity.opens} hint={period} />
        <Metric icon="book" tone="amber" label="Time reading papers" value={formatDuration(activity.readSeconds)} hint={period} />
        <Metric icon="clock" tone="violet" label="Time on Nexus" value={formatDuration(activity.activeSeconds)} hint={period} />
        <Metric icon="link" tone="blue" label="Links clicked" value={activity.linkClicks} hint={period} />
        <Metric
          icon="check" tone="green" label="Approved papers" value={papers.approved}
          hint={`${papers.pending} waiting · ${papers.rejected} rejected`}
          to="/delealone/papers"
        />
      </div>

      <div className="dl-ov-columns">
        <Panel title="Downloads and opens per day">
          <ActivityChart series={series} />
        </Panel>
        <Panel title="People on Nexus">
          <PeopleChart series={series} />
        </Panel>
      </div>

      <div className="dl-ov-columns even">
        <RankPanel
          title="Most popular papers"
          empty="No paper activity in this period."
          rows={data.topPapers.map(p => ({
            key: p.id,
            title: p.title,
            sub: `${p.opens} opened · read for ${formatDuration(p.seconds)}`,
            score: p.downloads + p.opens,
            value: p.downloads,
            valueLabel: p.downloads === 1 ? 'download' : 'downloads',
          }))}
        />
        <RankPanel
          title="Who downloads the most"
          empty="No downloads in this period."
          rows={data.topDownloaders.map((d, i) => ({
            key: `${d.who}-${i}`,
            title: d.who,
            hint: d.email,
            role: d.role,
            sub: `Last download ${timeAgo(d.last)}`,
            score: d.downloads,
            value: d.downloads,
            valueLabel: d.downloads === 1 ? 'download' : 'downloads',
          }))}
        />
      </div>

      <Table
        title="Who is reading what, and for how long"
        columns={['Person', 'Paper', 'Time spent', 'Last read']}
        rows={data.viewers.map(v => [person(v), v.title, formatDuration(v.seconds), timeAgo(v.last)])}
        empty="Nobody has read a paper in this period."
      />

      <div className="dl-ov-columns even">
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
