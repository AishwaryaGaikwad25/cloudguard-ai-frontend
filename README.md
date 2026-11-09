# CloudGuard AI – Frontend

AI-powered cloud security dashboard for a safer AWS environment.
React frontend for the **CloudGuard AI** college project: AWS CloudTrail events → Python/Boto3 collector → feature extraction → Isolation Forest → FastAPI → **this React dashboard**.

> **Status:** The FastAPI backend is not ready yet, so the app currently runs on **static mock data** that uses the agreed API response shapes.

## Features

| Page | What it shows |
|------|---------------|
| **Login** | Email + password login with validation, show/hide password, "remember me" and demo credentials |
| **Overview** | Total events, anomalies, normal events, anomaly rate, timeline chart, prediction split, events per AWS service, top anomalies, ML model info |
| **Activity Logs** | All 120 processed CloudTrail events. Search, filter by service and prediction, pagination, CSV export, and a detail view with the raw JSON |
| **Anomaly Results** | Scatter chart of anomaly scores with the threshold line, plus severity cards (Critical / High / Medium) explaining why each event was flagged |
| **System Workflow** | Interactive version of the architecture diagram (Section A pipeline, Section B request/response flow) and an API playground |
| **Future Modules** | Planned modules: Risk Scoring, Genetic Algorithm, What-If Simulation, Controlled Response |

Every data page has a `{ } /api/...` button that shows the JSON response the page is rendering, so the backend team can see the exact contract.

## Demo login

```
Email:    admin@cloudguard.ai
Password: admin123
```

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build -> dist/
```

## Project structure

```
src/
├── data/mockData.js        # static events (120 total, 8 anomalies) + model info
├── services/api.js         # getOverview / getEvents / getAnomalies / login
├── context/AuthContext.jsx # login state (localStorage when "remember me" is ticked)
├── components/
│   ├── Layout.jsx          # sidebar + top bar
│   └── common.jsx          # cards, badges, modal, JSON viewer, useApi hook
└── pages/                  # Login, Overview, ActivityLogs, Anomalies, Workflow, Roadmap
```

## API contract (for the FastAPI team)

React never calls AWS or the ML model directly. It only calls these endpoints:

| Method | Endpoint | Response (main fields) |
|--------|----------|------------------------|
| GET | `/api/overview` | `status, total_events, anomalies, normal, anomaly_rate, unique_users, failed_calls, last_collected, services[], timeline[], model{}, pipeline[]` |
| GET | `/api/events` | `status, count, events[]` |
| GET | `/api/anomalies` | `status, count, threshold, anomalies[]` (sorted by score, highest first) |

Each event object:

```json
{
  "event_id": "evt-0011",
  "eventTime": "2026-11-03T02:47:13Z",
  "eventName": "ConsoleLogin",
  "eventSource": "signin.amazonaws.com",
  "service": "IAM",
  "user": "root",
  "userType": "Root",
  "sourceIPAddress": "185.220.101.43",
  "awsRegion": "us-east-1",
  "errorCode": null,
  "prediction": "Anomaly",
  "anomaly_score": 0.91,
  "reasons": ["Root account login", "..."]
}
```

`anomaly_score` runs from 0 to 1, and a higher score is more anomalous. An event counts as an anomaly when its score is 0.6 or higher. `reasons` is optional and only needed for anomalies.

## Switching to the real backend

Create a `.env` file (see `.env.example`):

```
VITE_USE_MOCK=false
VITE_API_BASE_URL=http://localhost:8000
```

No page changes are needed, because `src/services/api.js` switches from mock data to `fetch()` calls. FastAPI must allow CORS from the frontend origin.

## Tech stack

React 19 · Vite · React Router · Recharts · Lucide icons · plain CSS
