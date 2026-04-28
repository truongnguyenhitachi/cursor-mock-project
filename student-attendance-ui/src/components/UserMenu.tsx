import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from './Toast'

export function UserMenu() {
  const { status, user, logout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current) return
      if (!containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (status === 'loading') {
    return <div className="user-menu user-menu--ghost">Loading…</div>
  }

  if (status !== 'authenticated' || !user) {
    return (
      <div className="user-menu">
        <Link to="/auth" className="btn btn--ghost">
          Sign in
        </Link>
        <Link to="/auth?mode=register" className="btn btn--primary">
          Sign up
        </Link>
      </div>
    )
  }

  const initial = (user.displayName || user.username).slice(0, 1).toUpperCase()

  return (
    <div className="user-menu" ref={containerRef}>
      <button
        type="button"
        className="user-menu__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="user-menu__avatar">{initial}</span>
        <span className="user-menu__name">{user.displayName}</span>
        <svg
          className="user-menu__chev"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="user-menu__dropdown" role="menu">
          <div className="user-menu__header">
            <strong>{user.displayName}</strong>
            <span>@{user.username}</span>
            <span className="user-menu__role">{user.role}</span>
          </div>
          <Link
            to="/my-courses"
            className="user-menu__item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            My courses
          </Link>
          <Link
            to="/notes"
            className="user-menu__item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            My notes
          </Link>
          <button
            type="button"
            className="user-menu__item user-menu__item--danger"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              logout()
              toast.push('Signed out', 'success')
              navigate('/')
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
