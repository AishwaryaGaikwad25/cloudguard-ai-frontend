import { Link } from 'react-router-dom'
import {
  Activity,
  ShieldAlert,
  ShieldCheck,
  Percent,
  Users,
  CircleX,
  BrainCircuit,
  CircleCheck,
  ArrowRight,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts'
import { getOverview, getAnomalies } from '../services/api'
import {
  useApi,
  Loader,
  ErrorBox,
  PageHeader,
  StatCard,
  ApiResponseButton,
  ServiceBadge,
  fmtDateTime,
  fmtDay,
  severityOf,
} from '../components/common'

const COLORS = { normal: '#38bdf8', anomaly: '#f43f5e' }
const SVC_COLORS = { IAM: '#a78bfa', EC2: '#f59e0b', S3: '#22c55e' }

const tooltipStyle = {
  contentStyle: {
    background: '#0f1b33',
    border: '1px solid #1e3a66',
    borderRadius: 10,
    color: '#e2e8f0',
  },
  labelStyle: { color: '#94a3b8' },
}

export default function Overview() {
  const { data, loading, error } = useApi(getOverview)
  const anomaliesRes = useApi(getAnomalies)

  if (loading) return <Loader />
  if (error) return <ErrorBox error={error} />

  const pie = [
    { name: 'Normal', value: data.normal, color: COLORS.normal },
    { name: 'Anomaly', value: data.anomalies, color: COLORS.anomaly },
  ]
  const top = anomaliesRes.data?.anomalies.slice(0, 4) ?? []

  return (
    <div className="page">
      <PageHeader
        title="Security Overview"
        subtitle={`CloudTrail management events · last collected ${fmtDateTime(data.last_collected)}`}
      >
        <ApiResponseButton endpoint="/api/overview" data={data} />
      </PageHeader>

      <div className="stats-grid">
        <StatCard icon={Activity} label="Total Events" value={data.total_events} hint="IAM · EC2 · S3" />
        <StatCard
          icon={ShieldAlert}
          label="Anomalies Detected"
          value={data.anomalies}
          hint="Flagged by Isolation Forest"
          tone="red"
        />
        <StatCard icon={ShieldCheck} label="Normal Events" value={data.normal} hint="Expected behaviour" tone="green" />
        <StatCard icon={Percent} label="Anomaly Rate" value={`${data.anomaly_rate}%`} hint="of all events" tone="amber" />
        <StatCard icon={Users} label="Unique Identities" value={data.unique_users} hint="Users & roles" tone="violet" />
        <StatCard icon={CircleX} label="Failed API Calls" value={data.failed_calls} hint="errorCode present" tone="slate" />
      </div>

      <div className="grid-2-1">
        <div className="card">
          <div className="card-head">
            <h3>Event activity timeline</h3>
            <span className="muted small">Events per day · Normal vs Anomaly</span>
          </div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gN" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.normal} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={COLORS.normal} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.anomaly} stopOpacity={0.6} />
                    <stop offset="100%" stopColor={COLORS.anomaly} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e2d4a" strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={fmtDay} stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                <Tooltip {...tooltipStyle} labelFormatter={fmtDay} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="normal" name="Normal" stroke={COLORS.normal} fill="url(#gN)" strokeWidth={2} />
                <Area type="monotone" dataKey="anomaly" name="Anomaly" stroke={COLORS.anomaly} fill="url(#gA)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Prediction split</h3>
          </div>
          <div className="chart-box donut">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pie} dataKey="value" innerRadius={62} outerRadius={90} paddingAngle={3} stroke="none">
                  {pie.map((p) => (
                    <Cell key={p.name} fill={p.color} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <strong>{data.total_events}</strong>
              <span>events</span>
            </div>
          </div>
          <div className="legend-list">
            {pie.map((p) => (
              <div key={p.name}>
                <i style={{ background: p.color }} /> {p.name}
                <strong>{p.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-1-1-1">
        <div className="card">
          <div className="card-head">
            <h3>Events by AWS service</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.services} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#1e2d4a" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="service" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
              <Tooltip {...tooltipStyle} cursor={{ fill: 'rgba(56,189,248,0.06)' }} />
              <Bar dataKey="total" name="Total" radius={[6, 6, 0, 0]}>
                {data.services.map((s) => (
                  <Cell key={s.service} fill={SVC_COLORS[s.service]} />
                ))}
              </Bar>
              <Bar dataKey="anomalies" name="Anomalies" fill={COLORS.anomaly} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Top anomalies</h3>
            <Link to="/anomalies" className="link small">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <ul className="mini-list">
            {top.map((a) => {
              const sev = severityOf(a.anomaly_score)
              return (
                <li key={a.event_id}>
                  <div>
                    <strong>{a.eventName}</strong>
                    <span className="muted small">
                      {a.user} · {fmtDateTime(a.eventTime)}
                    </span>
                  </div>
                  <div className="mini-right">
                    <ServiceBadge service={a.service} />
                    <span className={`sev ${sev.cls}`}>{a.anomaly_score.toFixed(2)}</span>
                  </div>
                </li>
              )
            })}
            {!top.length && <Loader label="Loading anomalies…" />}
          </ul>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>
              <BrainCircuit size={18} /> ML model
            </h3>
            <span className="badge badge-green">Active</span>
          </div>
          <dl className="kv">
            <dt>Algorithm</dt>
            <dd>{data.model.name}</dd>
            <dt>Library</dt>
            <dd>{data.model.library}</dd>
            <dt>Estimators</dt>
            <dd>{data.model.n_estimators}</dd>
            <dt>Contamination</dt>
            <dd>{data.model.contamination}</dd>
            <dt>Score threshold</dt>
            <dd>{data.model.threshold}</dd>
            <dt>Last trained</dt>
            <dd>{fmtDateTime(data.model.trained_at)}</dd>
          </dl>
          <div className="pipeline-mini">
            {data.pipeline.map((p) => (
              <span key={p.step} title={`${p.step}: ${p.detail}`}>
                <CircleCheck size={14} />
              </span>
            ))}
            <Link to="/workflow" className="link small">
              Pipeline healthy <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
