import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, LogIn, ShieldCheck, Activity, BrainCircuit, Cloud } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { DEMO_USERS } from '../services/api'
import { Logo } from '../components/Layout'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const validate = () => {
    const e = {}
    if (!email.trim()) e.email = 'Email is required'
    else if (!EMAIL_RE.test(email.trim())) e.email = 'Enter a valid email address'
    if (!password) e.password = 'Password is required'
    else if (password.length < 6) e.password = 'Password must be at least 6 characters'
    return e
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) return
    setSubmitting(true)
    try {
      await login(email, password, remember)
      navigate(location.state?.from || '/dashboard', { replace: true })
    } catch (err) {
      setErrors({ form: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  const fillDemo = () => {
    setEmail(DEMO_USERS[0].email)
    setPassword(DEMO_USERS[0].password)
    setErrors({})
  }

  return (
    <div className="login-page">
      <div className="login-glow g1" />
      <div className="login-glow g2" />

      <section className="login-hero">
        <Logo size={44} />
        <h1>
          Detect suspicious AWS activity <span className="grad">before it becomes a breach.</span>
        </h1>
        <p>
          CloudGuard AI collects CloudTrail management events, extracts behavioural features and uses an
          Isolation Forest model to flag anomalies across IAM, EC2 and S3.
        </p>
        <ul className="hero-points">
          <li>
            <Cloud size={18} /> CloudTrail events collected with Boto3
          </li>
          <li>
            <BrainCircuit size={18} /> Isolation Forest anomaly detection
          </li>
          <li>
            <Activity size={18} /> Real-time dashboard via FastAPI
          </li>
        </ul>
      </section>

      <section className="login-card">
        <div className="login-card-head">
          <div className="lock-badge">
            <ShieldCheck size={26} />
          </div>
          <h2>Welcome back</h2>
          <p>Sign in to your security dashboard</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {errors.form && <div className="form-error">{errors.form}</div>}

          <label className="field">
            <span>Email address</span>
            <div className={`input-wrap ${errors.email ? 'has-error' : ''}`}>
              <Mail size={18} />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {errors.email && <small className="field-error">{errors.email}</small>}
          </label>

          <label className="field">
            <span>Password</span>
            <div className={`input-wrap ${errors.password ? 'has-error' : ''}`}>
              <Lock size={18} />
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <small className="field-error">{errors.password}</small>}
          </label>

          <div className="form-row">
            <label className="checkbox">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Remember me
            </label>
            <a href="#" onClick={(e) => e.preventDefault()} className="link">
              Forgot password?
            </a>
          </div>

          <button className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? <span className="spinner sm" /> : <LogIn size={18} />}
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="demo-box">
          <div>
            <strong>Demo credentials</strong>
            <span className="mono">{DEMO_USERS[0].email}</span>
            <span className="mono">{DEMO_USERS[0].password}</span>
          </div>
          <button type="button" className="btn btn-ghost" onClick={fillDemo}>
            Use demo
          </button>
        </div>
      </section>
    </div>
  )
}
