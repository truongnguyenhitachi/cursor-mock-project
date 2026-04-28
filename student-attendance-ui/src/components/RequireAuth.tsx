import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  children: ReactNode
}

/**
 * Route guard. Renders children if authenticated, otherwise bounces the
 * user to /auth and remembers where they were going so we can return
 * after they sign in.
 */
export function RequireAuth({ children }: Props) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="auth-loading">
        <div className="spinner" aria-hidden="true" />
        <p>Loading session…</p>
      </div>
    )
  }
  if (status !== 'authenticated') {
    return (
      <Navigate
        to="/auth"
        replace
        state={{ redirectTo: `${location.pathname}${location.search}` }}
      />
    )
  }
  return <>{children}</>
}
