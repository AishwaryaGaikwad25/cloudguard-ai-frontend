import { useState } from 'react'
import {
  Cloud,
  ScrollText,
  Code2,
  FileJson,
  Settings2,
  Network,
  ClipboardCheck,
  Monitor,
  Zap,
  Database,
  ArrowRight,
  ArrowLeftRight,
  Info,
} from 'lucide-react'
import { PageHeader, JsonBlock } from '../components/common'
import { getOverview, getEvents, getAnomalies, USE_MOCK, API_BASE_URL } from '../services/api'

const PIPELINE = [
  { icon: Cloud, title: 'AWS Environment', text: 'IAM • EC2 • S3', color: '#f59e0b' },
  { icon: ScrollText, title: 'AWS CloudTrail', text: 'Records supported API activity / management events', color: '#ec4899' },
  { icon: Code2, title: 'Python Collector (Boto3)', text: 'Fetches CloudTrail events', color: '#facc15' },
  { icon: FileJson, title: 'Raw Event JSON', text: 'cloudtrail_events.json', color: '#94a3b8' },
  { icon: Settings2, title: 'Preprocessing & Feature Extraction', text: 'Clean fields • Build numeric features', color: '#38bdf8' },
  { icon: Network, title: 'Isolation Forest', text: 'Predicts Normal / Anomaly', color: '#22c55e' },
  { icon: ClipboardCheck, title: 'Processed Results', text: 'Event details • Prediction • Anomaly score', color: '#4ade80' },
]

const ENDPOINTS = [
  { path: '/api/overview', desc: 'Summary counts, timeline, model info', fn: getOverview },
  { path: '/api/events', desc: 'All processed events with predictions', fn: getEvents },
  { path: '/api/anomalies', desc: 'Only events predicted as Anomaly', fn: getAnomalies },
]

export default function Workflow() {
  const [active, setActive] = useState(0)
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)

  const tryEndpoint = async (ep) => {
    setLoading(true)
    const data = await ep.fn()
    // Trim long arrays so the preview stays readable
    const preview = JSON.parse(JSON.stringify(data))
    for (const k of ['events', 'anomalies']) {
      if (Array.isArray(preview[k]) && preview[k].length > 2) {
        preview[k] = [...preview[k].slice(0, 2), `… ${data[k].length - 2} more`]
      }
    }
    setResponse({ path: ep.path, data: preview })
    setLoading(false)
  }

  return (
    <div className="page">
      <PageHeader title="API Data Flow & System Workflow" subtitle="How data travels from AWS to this dashboard" />

      <section className="card section">
        <div className="section-tag">A. AWS Data Collection &amp; ML Pipeline</div>
        <div className="pipeline">
          {PIPELINE.map((s, i) => (
            <div key={s.title} className="pipeline-item">
              <button
                className={`pipe-step ${active === i ? 'active' : ''}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                style={{ '--c': s.color }}
              >
                <span className="pipe-num">{i + 1}</span>
                <s.icon size={30} />
                <strong>{s.title}</strong>
                <span>{s.text}</span>
              </button>
              {i < PIPELINE.length - 1 && <ArrowRight className="pipe-arrow" size={20} />}
            </div>
          ))}
        </div>
      </section>

      <section className="card section">
        <div className="section-tag">B. Dashboard API Request / Response Flow</div>
        <div className="flow-b">
          <div className="flow-node" style={{ '--c': '#61dafb' }}>
            <Monitor size={34} />
            <strong>React Dashboard (Browser)</strong>
            <span>Overview • Activity Logs • Anomaly Results</span>
          </div>
          <div className="flow-link">
            <span>HTTP GET request</span>
            <ArrowLeftRight size={26} />
            <span>HTTP 200 + JSON</span>
          </div>
          <div className="flow-node" style={{ '--c': '#14b8a6' }}>
            <Zap size={34} />
            <strong>FastAPI</strong>
            <span>API Routes / Endpoints</span>
            <code className="endpoints">
              GET /api/overview
              <br />
              GET /api/events
              <br />
              GET /api/anomalies
            </code>
          </div>
          <div className="flow-link">
            <span>reads</span>
            <ArrowLeftRight size={26} />
            <span>results</span>
          </div>
          <div className="flow-node" style={{ '--c': '#3b82f6' }}>
            <Database size={34} />
            <strong>Backend Service Layer</strong>
            <span>Reads processed event &amp; prediction data</span>
          </div>
        </div>
        <div className="info-note">
          <Info size={18} />
          React does not call AWS or the ML model directly. React requests data from FastAPI; FastAPI retrieves
          backend results and returns JSON.
        </div>
      </section>

      <section className="card section">
        <div className="card-head">
          <h3>API playground</h3>
          <span className={`badge ${USE_MOCK ? 'badge-amber' : 'badge-green'}`}>
            {USE_MOCK ? 'Mock mode – static data' : `Live: ${API_BASE_URL}`}
          </span>
        </div>
        <div className="playground">
          <div className="endpoint-list">
            {ENDPOINTS.map((ep) => (
              <button
                key={ep.path}
                className={`endpoint ${response?.path === ep.path ? 'active' : ''}`}
                onClick={() => tryEndpoint(ep)}
              >
                <span className="method">GET</span>
                <div>
                  <code>{ep.path}</code>
                  <span>{ep.desc}</span>
                </div>
              </button>
            ))}
          </div>
          <div className="playground-out">
            {loading ? (
              <div className="loader">
                <div className="spinner" /> Sending request…
              </div>
            ) : response ? (
              <>
                <div className="status-line">
                  <span className="badge badge-green">200 OK</span>
                  <code>GET {response.path}</code>
                </div>
                <JsonBlock data={response.data} />
              </>
            ) : (
              <p className="muted">Select an endpoint to preview its JSON response.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
