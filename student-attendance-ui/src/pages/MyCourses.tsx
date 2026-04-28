import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { myCoursesApi } from '../api/myCourses'
import { apiUrl, extractApiError } from '../api/client'
import { useToast } from '../components/Toast'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useAuth } from '../contexts/AuthContext'
import type { Course } from '../types'

export function MyCoursesPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [items, setItems] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removeTarget, setRemoveTarget] = useState<Course | null>(null)
  const [removing, setRemoving] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await myCoursesApi.list()
        if (!cancelled) setItems(res)
      } catch (err) {
        if (!cancelled) setError(extractApiError(err).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function confirmRemove() {
    if (!removeTarget) return
    setRemoving(true)
    try {
      await myCoursesApi.unenroll(removeTarget.id)
      setItems((prev) => prev.filter((c) => c.id !== removeTarget.id))
      toast.push(`Unenrolled from ${removeTarget.name}`, 'success')
      setRemoveTarget(null)
    } catch (err) {
      toast.push(extractApiError(err).message, 'error')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <>
      <div className="card">
        <div className="card__body">
          <h2 style={{ marginTop: 0 }}>Hi {user?.displayName} 👋</h2>
          <p style={{ color: 'var(--color-text-soft)', margin: 0 }}>
            These are the courses you've registered for. Browse the full{' '}
            <Link to="/courses">course catalog</Link> to enroll in more.
          </p>
        </div>
      </div>

      {error && (
        <div className="card" style={{ borderLeft: '4px solid var(--color-danger)' }}>
          <div className="card__body" style={{ color: 'var(--color-danger)' }}>
            {error}
          </div>
        </div>
      )}

      {loading ? (
        <div className="card">
          <div className="card__body">Loading…</div>
        </div>
      ) : items.length === 0 ? (
        <div className="card">
          <div className="card__body" style={{ textAlign: 'center' }}>
            <p>You haven't enrolled in any courses yet.</p>
            <Link to="/courses" className="btn btn--primary">
              Browse courses
            </Link>
          </div>
        </div>
      ) : (
        <div className="course-grid">
          {items.map((c) => (
            <div className="course-card" key={c.id}>
              <Link
                to={`/courses/${c.id}`}
                className="course-card__cover"
                aria-label={`Open ${c.name}`}
                style={{ display: 'block' }}
              >
                {c.coverImageUrl ? (
                  <img src={apiUrl(c.coverImageUrl)} alt={`${c.name} cover`} />
                ) : (
                  <div className="course-card__cover-placeholder">
                    {c.courseCode}
                  </div>
                )}
              </Link>
              <div className="course-card__body">
                <div className="course-card__code">{c.courseCode}</div>
                <h3 className="course-card__name">
                  <Link to={`/courses/${c.id}`} style={{ color: 'inherit' }}>
                    {c.name}
                  </Link>
                </h3>
                <div className="course-card__desc">
                  {c.description?.trim() || (
                    <span style={{ color: 'var(--color-text-soft)' }}>
                      No description
                    </span>
                  )}
                </div>
              </div>
              <div className="course-card__footer">
                <div className="course-card__stats">
                  <span className="course-card__stat" title="Credits">
                    {c.credits} credits
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setRemoveTarget(c)}
                  style={{ color: 'var(--color-danger)' }}
                >
                  Unenroll
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!removeTarget}
        title="Unenroll from course"
        message={
          removeTarget
            ? `Remove ${removeTarget.name} from your enrolled courses?`
            : ''
        }
        confirmLabel="Unenroll"
        destructive
        busy={removing}
        onCancel={() => (removing ? undefined : setRemoveTarget(null))}
        onConfirm={confirmRemove}
      />
    </>
  )
}
