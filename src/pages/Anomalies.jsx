import { useState } from 'react'
import { ShieldAlert, MapPin, User, Globe, Clock } from 'lucide-react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts'
import { getAnomalies, getEvents } from '../services/api'
import {
  useApi,
  Loader,
  ErrorBox,
  PageHeader,
  ApiResponseButton,
  ServiceBadge,
  ScoreBar,
  fmtDateTime,
  fmtDay,
  severityOf,
} from '../components/common'
import { EventDetail } from './ActivityLogs'

function ScatterTip({ active, payload }) {
  if (!active || !payload?.length) return null
  const e = payload[0].payload
  return (
    <div className="chart-tip">
      <strong>{e.eventName}</strong>
      <span>{fmtDateTime(e.eventTime)}</span>
      <span>
        Score {e.anomaly_score.toFixed(2)} · {e.prediction}
      </span>
    </div>
  )
}

export default function Anomalies() {
  const { data, loading, error } = useApi(getAnomalies)
  const all = useApi(getEvents)
  const [selected, setSelected] = useState(null)
  const [sev, setSev] = useState('All')

  if (loading) return <Loader />
  if (error) return <ErrorBox error={error} />

  const points = (all.data?.events ?? []).map((e) => ({ ...e, t: Date.parse(e.eventTime) }))
  const items = data.anomalies.filter((a) => sev === 'All' || severityOf(a.anomaly_score).label === sev)
  const counts = ['Critical', 'High', 'Medium'].map((l) => ({
    l,
    n: data.anomalies.filter((a) => severityOf(a.anomaly_score).label === l).length,
  }))

  return (
    <div className="page">
      <PageHeader
        title="Anomaly Results"
        subtitle={`${data.count} events flagged by Isolation Forest (score ≥ ${data.threshold})`}
      >
        <ApiResponseButton endpoint="/api/anomalies" data={data} />
      </PageHeader>

      <div className="card">
        <div className="card-head">
          <h3>Anomaly score across all events</h3>
          <span className="muted small">Each dot is one CloudTrail event · dashed line = threshold</span>
        </div>
        {all.loading ? (
          <Loader />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="#1e2d4a" strokeDasharray="3 3" />
              <XAxis
                dataKey="t"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(t) => fmtDay(new Date(t).toISOString())}
                stroke="#64748b"
                fontSize={12}
              />
              <YAxis dataKey="anomaly_score" domain={[0, 1]} stroke="#64748b" fontSize={12} />
              <ZAxis range={[40, 40]} />
              <Tooltip content={<ScatterTip />} cursor={{ strokeDasharray: '3 3' }} />
              <ReferenceLine
                y={data.threshold}
                stroke="#f59e0b"
                strokeDasharray="6 4"
                label={{ value: 'threshold', fill: '#f59e0b', fontSize: 11, position: 'insideTopRight' }}
              />
              <Scatter data={points} onClick={(p) => setSelected(p.payload ?? p)}>
                {points.map((p) => (
                  <Cell
                    key={p.event_id}
                    fill={p.prediction === 'Anomaly' ? '#f43f5e' : '#38bdf8'}
                    fillOpacity={p.prediction === 'Anomaly' ? 1 : 0.55}
                    style={{ cursor: 'pointer' }}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="toolbar plain">
        <div className="segmented">
          <button className={sev === 'All' ? 'active' : ''} onClick={() => setSev('All')}>
            All ({data.count})
          </button>
          {counts.map(({ l, n }) => (
            <button key={l} className={sev === l ? 'active' : ''} onClick={() => setSev(l)}>
              {l} ({n})
            </button>
          ))}
        </div>
      </div>

      <div className="anomaly-grid">
        {items.map((a) => {
          const s = severityOf(a.anomaly_score)
          return (
            <article key={a.event_id} className={`anomaly-card ${s.cls}`} onClick={() => setSelected(a)}>
              <div className="anomaly-top">
                <div className="anomaly-icon">
                  <ShieldAlert size={20} />
                </div>
                <div className="anomaly-title">
                  <h4>{a.eventName}</h4>
                  <span className="muted small mono">{a.event_id}</span>
                </div>
                <span className={`sev ${s.cls}`}>{s.label}</span>
              </div>
              <ScoreBar score={a.anomaly_score} threshold={data.threshold} />
              <div className="anomaly-meta">
                <span>
                  <User size={14} /> {a.user}
                </span>
                <span>
                  <Globe size={14} /> {a.sourceIPAddress}
                </span>
                <span>
                  <MapPin size={14} /> {a.awsRegion}
                </span>
                <span>
                  <Clock size={14} /> {fmtDateTime(a.eventTime)}
                </span>
              </div>
              <ul className="reason-list">
                {a.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <div className="anomaly-foot">
                <ServiceBadge service={a.service} />
                <span className="link small">View details →</span>
              </div>
            </article>
          )
        })}
      </div>

      {selected && <EventDetail event={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
