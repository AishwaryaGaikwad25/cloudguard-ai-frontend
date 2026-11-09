import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Overview from './pages/Overview'
import ActivityLogs from './pages/ActivityLogs'
import Anomalies from './pages/Anomalies'
import Workflow from './pages/Workflow'
import Roadmap from './pages/Roadmap'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Overview />} />
            <Route path="/activity" element={<ActivityLogs />} />
            <Route path="/anomalies" element={<Anomalies />} />
            <Route path="/workflow" element={<Workflow />} />
            <Route path="/roadmap" element={<Roadmap />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
