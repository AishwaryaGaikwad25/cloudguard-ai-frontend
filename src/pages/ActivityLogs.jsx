import { useMemo, useState } from 'react'
import { Search, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { getEvents } from '../services/api'
import {
  useApi,
  Loader,
  ErrorBox,
  PageHeader,
  ApiResponseButton,
  PredictionBadge,
  ServiceBadge,
  ScoreBar,
  Modal,
  JsonBlock,
  fmtDateTime,
} from '../components/common'

const PAGE_SIZE = 12

export function EventDetail({ event, onClose }) {
  return (
    <Modal title={`${event.eventName} · ${event.event_id}`} onClose={onClose} wide>
      <div className="detail-grid">
        <div>
          <span>Prediction</span>
          <PredictionBadge prediction={event.prediction} />
        </div>
        <div>
          <span>Anomaly score</span>
          <ScoreBar score={event.anomaly_score} />
        </div>
        <div>
          <span>Service</span>
          <ServiceBadge service={event.service} />
        </div>
        <div>
          <span>Time</span>
          {fmtDateTime(event.eventTime)}
        </div>
        <div>
          <span>Identity</span>
          {event.user} <em className="muted">({event.userType})</em>
        </div>
        <div>
          <span>Source IP</span>
          <code>{event.sourceIPAddress}</code>
        </div>
        <div>
          <span>Region</span>
          {event.awsRegion}
        </div>
        <div>
          <span>Error code</span>
          {event.errorCode || '—'}
        </div>
      </div>
      {event.reasons && (
        <div className="reasons">
          <h4>Why it was flagged</h4>
          <ul>
            {event.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}
      <h4 className="mt">Processed event JSON</h4>
      <JsonBlock data={event} />
    </Modal>
  )
}

export default function ActivityLogs() {
  const { data, loading, error } = useApi(getEvents)
  const [query, setQuery] = useState('')
  const [service, setService] = useState('All')
  const [prediction, setPrediction] = useState('All')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)

  const filtered = useMemo(() => {
    if (!data) return []
    const q = query.trim().toLowerCase()
    return data.events.filter(
      (e) =>
        (service === 'All' || e.service === service) &&
        (prediction === 'All' || e.prediction === prediction) &&
        (!q ||
          [e.eventName, e.user, e.sourceIPAddress, e.awsRegion, e.event_id].some((v) =>
            v.toLowerCase().includes(q),
          )),
    )
  }, [data, query, service, prediction])

  if (loading) return <Loader />
  if (error) return <ErrorBox error={error} />

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  const exportCsv = () => {
    const cols = ['event_id', 'eventTime', 'eventName', 'service', 'user', 'sourceIPAddress', 'awsRegion', 'prediction', 'anomaly_score']
    const csv = [cols.join(','), ...filtered.map((e) => cols.map((c) => e[c]).join(','))].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: 'cloudguard_events.csv' })
    a.click()
    URL.revokeObjectURL(url)
  }

  const resetPage = (fn) => (e) => {
    fn(e.target.value)
    setPage(1)
  }

  return (
    <div className="page">
      <PageHeader title="Activity Logs" subtitle="All processed CloudTrail events with model prediction">
        <button className="btn btn-ghost" onClick={exportCsv}>
          <Download size={16} /> Export CSV
        </button>
        <ApiResponseButton endpoint="/api/events" data={data} />
      </PageHeader>

      <div className="card">
        <div className="toolbar">
          <div className="input-wrap search">
            <Search size={17} />
            <input placeholder="Search event, user, IP, region…" value={query} onChange={resetPage(setQuery)} />
          </div>
          <select value={service} onChange={resetPage(setService)}>
            {['All', 'IAM', 'EC2', 'S3'].map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? 'All services' : s}
              </option>
            ))}
          </select>
          <div className="segmented">
            {['All', 'Normal', 'Anomaly'].map((p) => (
              <button key={p} className={prediction === p ? 'active' : ''} onClick={() => (setPrediction(p), setPage(1))}>
                {p}
              </button>
            ))}
          </div>
          <span className="muted small toolbar-count">{filtered.length} events</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Time (UTC)</th>
                <th>Event name</th>
                <th>Service</th>
                <th>Identity</th>
                <th>Source IP</th>
                <th>Region</th>
                <th>Prediction</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr
                  key={e.event_id}
                  className={e.prediction === 'Anomaly' ? 'row-anomaly' : ''}
                  onClick={() => setSelected(e)}
                >
                  <td className="mono muted">{e.event_id}</td>
                  <td className="nowrap">{fmtDateTime(e.eventTime)}</td>
                  <td>
                    <strong>{e.eventName}</strong>
                    {e.errorCode && <span className="err-tag">{e.errorCode}</span>}
                  </td>
                  <td>
                    <ServiceBadge service={e.service} />
                  </td>
                  <td>{e.user}</td>
                  <td className="mono">{e.sourceIPAddress}</td>
                  <td>{e.awsRegion}</td>
                  <td>
                    <PredictionBadge prediction={e.prediction} />
                  </td>
                  <td>
                    <ScoreBar score={e.anomaly_score} />
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={9} className="empty">
                    No events match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <span className="muted small">
            Page {current} of {pages}
          </span>
          <div>
            <button className="icon-btn" disabled={current === 1} onClick={() => setPage(current - 1)} aria-label="Previous page">
              <ChevronLeft size={18} />
            </button>
            <button className="icon-btn" disabled={current === pages} onClick={() => setPage(current + 1)} aria-label="Next page">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {selected && <EventDetail event={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
