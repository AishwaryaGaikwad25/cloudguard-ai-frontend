import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ScrollText,
  ShieldAlert,
  Workflow,
  Rocket,
  LogOut,
  Menu,
  ShieldCheck,
  Database,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { USE_MOCK } from '../services/api'

const NAV = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/activity', label: 'Activity Logs', icon: ScrollText },
  { to: '/anomalies', label: 'Anomaly Results', icon: ShieldAlert },
  { to: '/workflow', label: 'System Workflow', icon: Workflow },
  { to: '/roadmap', label: 'Future Modules', icon: Rocket },
]

export function Logo({ size = 34 }) {
  return (
    <div className="logo">
      <div className="logo-mark" style={{ width: size, height: size }}>
        <ShieldCheck size={size * 0.6} />
      </div>
      <div className="logo-text">
        CloudGuard <span>AI</span>
      </div>
    </div>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const initials = user?.name
    ?.split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <Logo />
        <nav>
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={() => setOpen(false)} className="nav-link">
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="data-source">
            <Database size={14} />
            <span>{USE_MOCK ? 'Static demo data' : 'Live FastAPI'}</span>
            <i className={USE_MOCK ? 'dot dot-amber' : 'dot dot-green'} />
          </div>
          <button className="nav-link logout" onClick={handleLogout}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>
      {open && <div className="sidebar-scrim" onClick={() => setOpen(false)} />}

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div className="topbar-title">AI-Powered Cloud Security for a Safer AWS Environment</div>
          <div className="user-chip">
            <div className="avatar">{initials}</div>
            <div className="user-meta">
              <strong>{user?.name}</strong>
              <span>{user?.role}</span>
            </div>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
