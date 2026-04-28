import { useState, type FormEvent } from 'react'
import type { Course, Note, NoteRequest } from '../../types'

interface NoteFormProps {
  initial: Note | null
  courses: Course[]
  /** When set, the course selector is hidden and this id is used. */
  fixedCourseId?: number | null
  onSubmit: (payload: NoteRequest) => Promise<void>
  onCancel?: () => void
}

/**
 * Compact note editor — handles both create and update flows.
 * Honors `fixedCourseId` so the course-detail page can scope notes to
 * the current course without showing a course picker.
 */
export function NoteForm({
  initial,
  courses,
  fixedCourseId,
  onSubmit,
  onCancel,
}: NoteFormProps) {
  // Callers re-mount this form via the `key` prop when switching between
  // creating and editing different notes, so the initial values seed state
  // exactly once per logical instance — no sync-effect mirroring needed.
  const [title, setTitle] = useState(initial?.title ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [courseId, setCourseId] = useState<number | null>(
    initial?.courseId ?? fixedCourseId ?? null,
  )
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        courseId: fixedCourseId ?? courseId,
      })
      if (!initial) {
        setTitle('')
        setContent('')
        if (!fixedCourseId) setCourseId(null)
      }
    } catch {
      // toast handled upstream
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="note-form" onSubmit={handleSubmit}>
      <div className="note-form__row">
        <h3 style={{ margin: 0 }}>{initial ? 'Edit note' : 'New note'}</h3>
        {initial && onCancel && (
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={onCancel}
          >
            Cancel edit
          </button>
        )}
      </div>

      <label className="form-field">
        <span>Title</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
          placeholder="A short headline for your note"
        />
      </label>

      {!fixedCourseId && (
        <label className="form-field">
          <span>Course (optional)</span>
          <select
            value={courseId == null ? '' : String(courseId)}
            onChange={(e) =>
              setCourseId(e.target.value === '' ? null : Number(e.target.value))
            }
          >
            <option value="">— Standalone note —</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.courseCode} — {c.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="form-field">
        <span>Content</span>
        <textarea
          rows={5}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          maxLength={5000}
          placeholder="What did you learn? Use Markdown if you like — it's free-form."
        />
      </label>

      <div className="note-form__actions">
        <button
          type="submit"
          className="btn btn--primary"
          disabled={submitting || !title.trim() || !content.trim()}
        >
          {submitting ? 'Saving…' : initial ? 'Save changes' : 'Add note'}
        </button>
      </div>
    </form>
  )
}

interface NoteCardProps {
  note: Note
  course: Course | null
  onEdit: () => void
  onDelete: () => void
}

export function NoteCard({ note, course, onEdit, onDelete }: NoteCardProps) {
  return (
    <article className="note-card">
      <header className="note-card__header">
        <h4 className="note-card__title">{note.title}</h4>
        <div className="note-card__meta">
          {course ? (
            <span className="badge">{course.courseCode}</span>
          ) : (
            <span className="badge badge--muted">Standalone</span>
          )}
          <span title={new Date(note.updatedAt).toLocaleString()}>
            {new Date(note.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </header>
      <p className="note-card__body">{note.content}</p>
      <footer className="note-card__actions">
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={onEdit}
        >
          Edit
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={onDelete}
          style={{ color: 'var(--color-danger)' }}
        >
          Delete
        </button>
      </footer>
    </article>
  )
}
