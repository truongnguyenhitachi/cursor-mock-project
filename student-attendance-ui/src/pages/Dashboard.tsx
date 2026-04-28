import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { coursesApi } from '../api/courses'
import { studentsApi } from '../api/students'
import { attendanceApi } from '../api/attendance'
import { extractApiError } from '../api/client'
import type { Attendance, Course, Student } from '../types'

interface Stats {
  totalStudents: number
  totalCourses: number
  todaySessions: number
  presentToday: number
}

export function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalCourses: 0,
    todaySessions: 0,
    presentToday: 0,
  })
  const [recentStudents, setRecentStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [todaysAttendance, setTodaysAttendance] = useState<Attendance[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [studentsPage, coursesPage] = await Promise.all([
          studentsApi.search({ page: 0, size: 5, sort: 'id,desc' }),
          coursesApi.list({ page: 0, size: 100, sort: 'name,asc' }),
        ])

        const today = new Date().toISOString().slice(0, 10)
        const sessions = await Promise.all(
          coursesPage.content.map((c) =>
            attendanceApi
              .listByCourseAndDate(c.id, today)
              .catch(() => [] as Attendance[]),
          ),
        )
        const allToday = sessions.flat()
        const presentToday = allToday.filter(
          (a) => a.status === 'PRESENT' || a.status === 'LATE',
        ).length

        if (cancelled) return
        setStats({
          totalStudents: studentsPage.totalElements,
          totalCourses: coursesPage.totalElements,
          todaySessions: allToday.length,
          presentToday,
        })
        setRecentStudents(studentsPage.content)
        setCourses(coursesPage.content)
        setTodaysAttendance(allToday.slice(0, 8))
      } catch (e) {
        if (!cancelled) setError(extractApiError(e).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return <div className="loading">Loading dashboard…</div>
  }

  if (error) {
    return <div className="error-state">Failed to load dashboard: {error}</div>
  }

  return (
    <>
      <div className="stats-grid">
        <StatCard
          label="Total students"
          value={stats.totalStudents}
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          }
        />
        <StatCard
          label="Active courses"
          value={stats.totalCourses}
          icon={
            <svg
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
          }
        />
        <StatCard
          label="Sessions today"
          value={stats.todaySessions}
          icon={
            <svg
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
            </svg>
          }
        />
        <StatCard
          label="Present today"
          value={stats.presentToday}
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="section-header">
            <div>
              <h2>Recently added students</h2>
              <p>The five newest student records</p>
            </div>
            <Link to="/students" className="btn btn--secondary btn--sm">
              View all
            </Link>
          </div>
          {recentStudents.length === 0 ? (
            <EmptyState
              title="No students yet"
              hint="Head to the Students page to add your first student."
            />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Courses</th>
                  </tr>
                </thead>
                <tbody>
                  {recentStudents.map((s) => (
                    <tr key={s.id}>
                      <td>{s.studentCode}</td>
                      <td>
                        {s.firstName} {s.lastName}
                      </td>
                      <td>{s.email}</td>
                      <td>{s.courses.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-header">
            <div>
              <h2>Today's attendance</h2>
              <p>Latest sessions recorded today</p>
            </div>
            <Link to="/attendance" className="btn btn--secondary btn--sm">
              Open
            </Link>
          </div>
          {todaysAttendance.length === 0 ? (
            <EmptyState
              title="No sessions yet today"
              hint={
                courses.length === 0
                  ? 'Create a course to start recording attendance.'
                  : 'Record attendance from the Attendance page.'
              }
            />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todaysAttendance.map((a) => (
                    <tr key={a.id}>
                      <td>{a.studentCode}</td>
                      <td>{a.courseCode}</td>
                      <td>
                        <span className={`badge badge--${a.status}`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string
  value: number
  icon: ReactNode
}) {
  return (
    <div className="stat-card">
      <div className="stat-card__icon">{icon}</div>
      <div>
        <div className="stat-card__value">{value}</div>
        <div className="stat-card__label">{label}</div>
      </div>
    </div>
  )
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{hint}</p>
    </div>
  )
}
