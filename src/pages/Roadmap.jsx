import { ShieldCheck, Dna, BarChart3, ShieldEllipsis, Clock } from 'lucide-react'
import { PageHeader } from '../components/common'

const MODULES = [
  {
    icon: ShieldCheck,
    title: 'Risk Scoring',
    color: '#22c55e',
    text: 'Combine anomaly score, asset sensitivity and identity privileges into a single risk score per event and per user.',
    points: ['Per-identity risk profile', 'Weighted by resource criticality', 'Risk trend over time'],
  },
  {
    icon: Dna,
    title: 'Genetic Algorithm',
    color: '#38bdf8',
    text: 'Use a genetic algorithm to tune model hyper-parameters and search for the best feature subset.',
    points: ['Optimise contamination & estimators', 'Feature selection', 'Fitness = detection quality'],
  },
  {
    icon: BarChart3,
    title: 'What-If Simulation',
    color: '#f59e0b',
    text: 'Simulate attack scenarios and policy changes to see how the model and risk scores would react.',
    points: ['Replay synthetic attacks', 'Policy change impact', 'Compare before / after'],
  },
  {
    icon: ShieldEllipsis,
    title: 'Controlled Response',
    color: '#f43f5e',
    text: 'Suggest or trigger safe, approval-based remediation actions for high-risk anomalies.',
    points: ['Disable access keys', 'Revert public bucket policy', 'Human-in-the-loop approval'],
  },
]

export default function Roadmap() {
  return (
    <div className="page">
      <PageHeader title="Future Modules" subtitle="Planned features for upcoming project phases" />
      <div className="roadmap-grid">
        {MODULES.map((m) => (
          <article key={m.title} className="roadmap-card" style={{ '--c': m.color }}>
            <div className="roadmap-top">
              <div className="roadmap-icon">
                <m.icon size={26} />
              </div>
              <span className="badge badge-amber">
                <Clock size={12} /> Planned
              </span>
            </div>
            <h3>{m.title}</h3>
            <p>{m.text}</p>
            <ul>
              {m.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  )
}
