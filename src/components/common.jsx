import { useEffect, useState } from 'react'
import { Braces, X, Copy, Check } from 'lucide-react'

/** Small hook that calls a service function and tracks loading / error. */
export function useApi(fn) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  useEffect(() => {
    let alive = true
    fn()
      .then((data) => alive && setState({ data, loading: false, error: null }))
      .catch((error) => alive && setState({ data: null, loading: false, error }))
    return () => {
      alive = false
    }
  }, [fn])
  return state
}

export function Loader({ label = 'Loading data…' }) {
  return (
    <div className="loader">
      <div className="spinner" />
      <span>{label}</span>
    </div>
  )
}

export function ErrorBox({ error }) {
  return <div className="error-box">Could not load data: {error?.message}</div>
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="page-header-actions">{children}</div>
    </div>
  )
}

export function StatCard({ icon: Icon, label, value, hint, tone = 'blue' }) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <div className="stat-icon">
        <Icon size={22} />
      </div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {hint && <div className="stat-hint">{hint}</div>}
      </div>
    </div>
  )
}

export function PredictionBadge({ prediction }) {
  const anomaly = prediction === 'Anomaly'
  return <span className={`badge ${anomaly ? 'badge-red' : 'badge-green'}`}>{prediction}</span>
}

export function ServiceBadge({ service }) {
  return <span className={`badge badge-svc svc-${service.toLowerCase()}`}>{service}</span>
}

export function severityOf(score) {
  if (score >= 0.8) return { label: 'Critical', cls: 'sev-critical' }
  if (score >= 0.7) return { label: 'High', cls: 'sev-high' }
  return { label: 'Medium', cls: 'sev-medium' }
}

export function ScoreBar({ score, threshold = 0.6 }) {
  const color = score >= threshold ? 'var(--red)' : score >= 0.4 ? 'var(--amber)' : 'var(--green)'
  return (
    <div className="score-bar" title={`Anomaly score ${score.toFixed(2)}`}>
      <div className="score-track">
        <div className="score-fill" style={{ width: `${score * 100}%`, background: color }} />
      </div>
      <span className="mono">{score.toFixed(2)}</span>
    </div>
  )
}

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

export function JsonBlock({ data }) {
  const [copied, setCopied] = useState(false)
  const text = JSON.stringify(data, null, 2)
  const copy = () => {
    navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="json-wrap">
      <button className="icon-btn json-copy" onClick={copy} aria-label="Copy JSON">
        {copied ? <Check size={15} /> : <Copy size={15} />}
      </button>
      <pre className="json">{text}</pre>
    </div>
  )
}

/** Button that shows the (mock) JSON response the page is rendering. */
export function ApiResponseButton({ endpoint, data }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="btn btn-ghost" onClick={() => setOpen(true)} disabled={!data}>
        <Braces size={16} /> {endpoint}
      </button>
      {open && (
        <Modal title={`GET ${endpoint} — response`} onClose={() => setOpen(false)} wide>
          <p className="muted small">
            Static mock response. The FastAPI backend will return this same JSON shape.
          </p>
          <JsonBlock data={data} />
        </Modal>
      )}
    </>
  )
}

export const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }) + ' UTC'

export const fmtDay = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' })
