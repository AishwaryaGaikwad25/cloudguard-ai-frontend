/**
 * API SERVICE LAYER
 * ----------------------------------------------------------------------------
 * React never talks to AWS or the ML model directly — it only calls FastAPI.
 *
 * Right now USE_MOCK = true, so every function returns static data from
 * src/data/mockData.js after a short fake delay. When the FastAPI backend is
 * ready, set VITE_USE_MOCK=false and VITE_API_BASE_URL in a .env file — the
 * pages do not need to change because the response shapes are the same.
 */
import { EVENTS, MODEL_INFO, PIPELINE_STATUS, ANOMALY_THRESHOLD } from '../data/mockData'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

async function request(path, mockFn) {
  if (USE_MOCK) {
    await delay(350)
    return mockFn()
  }
  const res = await fetch(`${API_BASE_URL}${path}`)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

const SERVICES = ['IAM', 'EC2', 'S3']

function buildOverview() {
  const anomalies = EVENTS.filter((e) => e.prediction === 'Anomaly')
  const byService = SERVICES.map((s) => ({
    service: s,
    total: EVENTS.filter((e) => e.service === s).length,
    anomalies: anomalies.filter((e) => e.service === s).length,
  }))

  // Events per day (normal vs anomaly)
  const days = {}
  for (const e of EVENTS) {
    const d = e.eventTime.slice(0, 10)
    days[d] ??= { date: d, normal: 0, anomaly: 0 }
    days[d][e.prediction === 'Anomaly' ? 'anomaly' : 'normal']++
  }

  return {
    status: 'success',
    total_events: EVENTS.length,
    anomalies: anomalies.length,
    normal: EVENTS.length - anomalies.length,
    anomaly_rate: Number(((anomalies.length / EVENTS.length) * 100).toFixed(1)),
    unique_users: new Set(EVENTS.map((e) => e.user)).size,
    failed_calls: EVENTS.filter((e) => e.errorCode).length,
    last_collected: '2026-11-08T22:00:00Z',
    services: byService,
    timeline: Object.values(days).sort((a, b) => a.date.localeCompare(b.date)),
    model: MODEL_INFO,
    pipeline: PIPELINE_STATUS,
  }
}

/** GET /api/overview */
export const getOverview = () => request('/api/overview', buildOverview)

/** GET /api/events */
export const getEvents = () =>
  request('/api/events', () => ({ status: 'success', count: EVENTS.length, events: EVENTS }))

/** GET /api/anomalies */
export const getAnomalies = () =>
  request('/api/anomalies', () => {
    const items = EVENTS.filter((e) => e.prediction === 'Anomaly').sort(
      (a, b) => b.anomaly_score - a.anomaly_score,
    )
    return { status: 'success', count: items.length, threshold: ANOMALY_THRESHOLD, anomalies: items }
  })

/** Mock authentication (replace with POST /api/auth/login later). */
export const DEMO_USERS = [
  { email: 'admin@cloudguard.ai', password: 'admin123', name: 'Admin User', role: 'Security Analyst' },
]

export async function login(email, password) {
  await delay(600)
  const user = DEMO_USERS.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password,
  )
  if (!user) throw new Error('Invalid email or password')
  const { password: _pw, ...safe } = user
  return { token: 'mock-jwt-token', user: safe }
}
