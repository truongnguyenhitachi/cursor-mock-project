import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { notesApi } from '../api/notes'
import { coursesApi } from '../api/courses'
import { extractApiError } from '../api/client'
import { useToast } from '../components/Toast'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { NoteCard, NoteForm } from '../components/notes/NoteUi'
import type { Course, Note, NoteRequest } from '../types'

export function NotesPage() {
  const toast = useToast()
  const [notes, setNotes] = useState<Note[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Note | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [filterCourseId, setFilterCourseId] = useState<number | 'all'>('all')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [n, c] = await Promise.all([
          notesApi.list(),
          // best-effort, only used to label courseIds
          coursesApi.list({ page: 0, size: 200, sort: 'name,asc' }),
        ])
        if (!cancelled) {
          setNotes(n)
          setCourses(c.content)
        }
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

  const courseLookup = useMemo(() => {
    const m = new Map<number, Course>()
    courses.forEach((c) => m.set(c.id, c))
    return m
  }, [courses])

  const visible = useMemo(() => {
    if (filterCourseId === 'all') return notes
    return notes.filter((n) => n.courseId === filterCourseId)
  }, [notes, filterCourseId])

  async function handleSave(payload: NoteRequest) {
    try {
      if (editing) {
        const updated = await notesApi.update(editing.id, payload)
        setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
        toast.push('Note updated', 'success')
      } else {
        const created = await notesApi.create(payload)
        setNotes((prev) => [created, ...prev])
        toast.push('Note created', 'success')
      }
      setEditing(null)
    } catch (err) {
      toast.push(extractApiError(err).message, 'error')
      throw err
    }
  }

  async function confirmDelete() {
    if (deleteId == null) return
    setDeleting(true)
    try {
      await notesApi.delete(deleteId)
      setNotes((prev) => prev.filter((n) => n.id !== deleteId))
      toast.push('Note deleted', 'success')
      setDeleteId(null)
    } catch (err) {
      toast.push(extractApiError(err).message, 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="card">
        <div className="card__body">
          <NoteForm
            key={editing?.id ?? 'new'}
            initial={editing}
            courses={courses}
            onSubmit={handleSave}
            onCancel={editing ? () => setEditing(null) : undefined}
          />
        </div>
      </div>

      <div className="card">
        <div className="card__body">
          <div className="toolbar" style={{ marginBottom: '1rem' }}>
            <label className="form-field" style={{ maxWidth: 280 }}>
              <span>Filter by course</span>
              <select
                value={filterCourseId === 'all' ? '' : String(filterCourseId)}
                onChange={(e) =>
                  setFilterCourseId(
                    e.target.value === '' ? 'all' : Number(e.target.value),
                  )
                }
              >
                <option value="">All courses</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.courseCode} — {c.name}
                  </option>
                ))}
              </select>
            </label>
            <div style={{ marginLeft: 'auto', color: 'var(--color-text-soft)' }}>
              {visible.length} note{visible.length === 1 ? '' : 's'}
            </div>
          </div>

          {error && (
            <div style={{ color: 'var(--color-danger)' }}>{error}</div>
          )}

          {loading ? (
            <p>Loading…</p>
          ) : visible.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <p style={{ color: 'var(--color-text-soft)' }}>
                No notes yet — write your first one above.
              </p>
              <Link to="/courses">Browse courses</Link>
            </div>
          ) : (
            <div className="note-list">
              {visible.map((n) => (
                <NoteCard
                  key={n.id}
                  note={n}
                  course={n.courseId ? courseLookup.get(n.courseId) ?? null : null}
                  onEdit={() => setEditing(n)}
                  onDelete={() => setDeleteId(n.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete note?"
        message="This will permanently remove the note."
        confirmLabel="Delete"
        destructive
        busy={deleting}
        onCancel={() => (deleting ? undefined : setDeleteId(null))}
        onConfirm={confirmDelete}
      />
    </>
  )
}
