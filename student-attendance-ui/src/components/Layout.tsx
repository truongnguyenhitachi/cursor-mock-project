import type { ReactElement } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { UserMenu } from './UserMenu'
import { useAuth } from '../contexts/AuthContext'

interface NavItem {
  to: string
  label: string
  description: string
  icon: ReactElement
}

const navItems: NavItem[] = [
  {
    to: '/',
    label: 'Dashboard',
    description: 'Overview of students, courses and attendance',
    icon: (
      <svg
        className="sidebar__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 13h8V3H3z" />
        <path d="M13 21h8V11h-8z" />
        <path d="M3 21h8v-6H3z" />
        <path d="M13 9h8V3h-8z" />
      </svg>
    ),
  },
  {
    to: '/students',
    label: 'Students',
    description: 'Manage student records and enrollments',
    icon: (
      <svg
        className="sidebar__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    to: '/courses',
    label: 'Courses',
    description: 'Course catalog and credit hours',
    icon: (
      <svg
        className="sidebar__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    to: '/attendance',
    label: 'Attendance',
    description: 'Record and review session attendance',
    icon: (
      <svg
        className="sidebar__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <path d="m9 16 2 2 4-4" />
      </svg>
    ),
  },
]

const authNavItems: NavItem[] = [
  {
    to: '/my-courses',
    label: 'My Courses',
    description: 'Courses you have enrolled in',
    icon: (
      <svg
        className="sidebar__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    to: '/notes',
    label: 'Notes',
    description: 'Personal study notes',
    icon: (
      <svg
        className="sidebar__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="9" y1="17" x2="13" y2="17" />
      </svg>
    ),
  },
]

export function Layout() {
  const location = useLocation()
  const { status } = useAuth()
  const isAuthed = status === 'authenticated'

  const allItems = [...navItems, ...(isAuthed ? authNavItems : [])]
  const current =
    allItems.find(
      (n) =>
        n.to === location.pathname ||
        (n.to !== '/' && location.pathname.startsWith(n.to)),
    ) ?? allItems[0]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <div className="sidebar__logo">SA</div>
          <div className="sidebar__title">
            <strong>Student Attendance</strong>
            <span>Admin Console</span>
          </div>
        </div>
        <nav className="sidebar__nav" aria-label="Main">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}

          {isAuthed && (
            <>
              <div className="sidebar__group-label">Personal</div>
              {authNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
                  }
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>
        <div className="sidebar__footer">
          v1.0 · Connected to <code>/api/v1</code>
        </div>
      </aside>
      <main className="main">
        <header className="main__header">
          <div className="main__title">
            <h1>{current.label}</h1>
            <span>{current.description}</span>
          </div>
          <UserMenu />
        </header>
        <div className="main__content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
