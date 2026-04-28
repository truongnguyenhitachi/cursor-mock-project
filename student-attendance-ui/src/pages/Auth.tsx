import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../components/Toast'
import { extractApiError } from '../api/client'

type Mode = 'login' | 'register'

interface LocationState {
  redirectTo?: string
}

export function AuthPage() {
  const [params] = useSearchParams()
  const initialMode: Mode = params.get('mode') === 'register' ? 'register' : 'login'
  const [mode, setMode] = useState<Mode>(initialMode)

  const navigate = useNavigate()
  const location = useLocation()
  const { login, register } = useAuth()
  const toast = useToast()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const redirectTo =
    (location.state as LocationState | null)?.redirectTo ?? '/my-courses'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setErrors({})
    try {
      if (mode === 'login') {
        await login({ username: username.trim(), password })
        toast.push('Welcome back', 'success')
      } else {
        await register({
          username: username.trim(),
          password,
          displayName: displayName.trim() || username.trim(),
        })
        toast.push('Account created', 'success')
      }
      navigate(redirectTo, { replace: true })
    } catch (err) {
      const apiErr = extractApiError(err)
      setErrors(apiErr.fieldErrors ?? {})
      toast.push(apiErr.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-card__header">
          <div className="auth-card__brand">SA</div>
          <h1>Student Attendance</h1>
          <p>
            {mode === 'login'
              ? 'Sign in to enroll in courses and keep personal notes.'
              : 'Create an account in seconds — username and password is enough.'}
          </p>
        </div>

        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={
              mode === 'login' ? 'auth-tab auth-tab--active' : 'auth-tab'
            }
            onClick={() => setMode('login')}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={
              mode === 'register' ? 'auth-tab auth-tab--active' : 'auth-tab'
            }
            onClick={() => setMode('register')}
          >
            Create account
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="form-field">
            <span>Username</span>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={64}
              pattern="[a-zA-Z0-9_.\-]+"
            />
            {errors.username && (
              <small className="field-error">{errors.username}</small>
            )}
          </label>

          {mode === 'register' && (
            <label className="form-field">
              <span>Display name</span>
              <input
                type="text"
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={120}
                placeholder="How others will see you"
              />
              {errors.displayName && (
                <small className="field-error">{errors.displayName}</small>
              )}
            </label>
          )}

          <label className="form-field">
            <span>Password</span>
            <input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              maxLength={100}
            />
            {errors.password && (
              <small className="field-error">{errors.password}</small>
            )}
          </label>

          <button
            type="submit"
            className="btn btn--primary auth-submit"
            disabled={submitting}
          >
            {submitting
              ? 'Please wait…'
              : mode === 'login'
                ? 'Sign in'
                : 'Create account'}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/">← Back to dashboard</Link>
        </div>
      </div>
    </div>
  )
}
