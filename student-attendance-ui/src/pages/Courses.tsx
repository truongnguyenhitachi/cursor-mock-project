import { useEffect, useState } from 'react'
import { coursesApi } from '../api/courses'
import { extractApiError } from '../api/client'
import { Modal } from '../components/Modal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Pagination } from '../components/Pagination'
import { useToast } from '../components/Toast'
import type { Course, CourseRequest } from '../types'

const PAGE_SIZE = 10

const emptyForm: CourseRequest = {
  courseCode: '',
  name: '',
  description: '',
  credits: 3,
}

export function CoursesPage() {
  const toast = useToast()
  const [items, setItems] = useState<Course[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<CourseRequest>(emptyForm)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function reload() {
    const res = await coursesApi.list({
      page,
      size: PAGE_SIZE,
      sort: 'name,asc',
    })
    setItems(res.content)
    setTotalPages(res.totalPages)
    setTotalElements(res.totalElements)
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await coursesApi.list({
          page,
          size: PAGE_SIZE,
          sort: 'name,asc',
        })
        if (cancelled) return
        setItems(res.content)
        setTotalPages(res.totalPages)
        setTotalElements(res.totalElements)
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
  }, [page])

  function openCreate() {
    setForm(emptyForm)
    setFieldErrors({})
    setCreating(true)
  }

  function openEdit(course: Course) {
    setForm({
      courseCode: course.courseCode,
      name: course.name,
      description: course.description ?? '',
      credits: course.credits,
    })
    setFieldErrors({})
    setEditing(course)
  }

  function closeForm() {
    if (submitting) return
    setCreating(false)
    setEditing(null)
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setFieldErrors({})
    try {
      const payload: CourseRequest = {
        ...form,
        description: form.description?.trim() ? form.description : undefined,
        credits: Number(form.credits),
      }
      if (editing) {
        await coursesApi.update(editing.id, payload)
        toast.success('Course updated')
      } else {
        await coursesApi.create(payload)
        toast.success('Course created')
      }
      setCreating(false)
      setEditing(null)
      await reload()
    } catch (e) {
      const apiErr = extractApiError(e)
      if (apiErr.fieldErrors) setFieldErrors(apiErr.fieldErrors)
      toast.error(apiErr.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await coursesApi.delete(deleteTarget.id)
      toast.success(`Removed ${deleteTarget.name}`)
      setDeleteTarget(null)
      await reload()
    } catch (e) {
      toast.error(extractApiError(e).message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="card">
        <div className="section-header">
          <div>
            <h2>Courses</h2>
            <p>Define the courses students can enroll in.</p>
          </div>
          <button type="button" className="btn btn--primary" onClick={openCreate}>
            + New course
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading courses…</div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <h3>No courses yet</h3>
            <p>Create your first course to start enrolling students.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Credits</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.courseCode}</strong>
                    </td>
                    <td>{c.name}</td>
                    <td>{c.credits}</td>
                    <td
                      style={{
                        maxWidth: 360,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        color: 'var(--color-text-muted)',
                      }}
                      title={c.description ?? ''}
                    >
                      {c.description?.trim() || '—'}
                    </td>
                    <td>
                      <div className="table__actions">
                        <button
                          type="button"
                          className="btn btn--secondary btn--sm"
                          onClick={() => openEdit(c)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn--danger btn--sm"
                          onClick={() => setDeleteTarget(c)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={PAGE_SIZE}
          onChange={setPage}
        />
      </div>

      <Modal
        open={creating || editing !== null}
        title={editing ? 'Edit course' : 'Create course'}
        onClose={closeForm}
        footer={
          <>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={closeForm}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="course-form"
              className="btn btn--primary"
              disabled={submitting}
            >
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <form id="course-form" className="form-grid" onSubmit={submitForm}>
          <div className="form-field">
            <label htmlFor="courseCode">Course code</label>
            <input
              id="courseCode"
              required
              value={form.courseCode}
              onChange={(e) =>
                setForm((f) => ({ ...f, courseCode: e.target.value }))
              }
            />
            {fieldErrors.courseCode ? (
              <span className="form-field__error">
                {fieldErrors.courseCode}
              </span>
            ) : null}
          </div>
          <div className="form-field">
            <label htmlFor="credits">Credits</label>
            <input
              id="credits"
              type="number"
              min={0}
              required
              value={form.credits}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  credits: Number(e.target.value),
                }))
              }
            />
            {fieldErrors.credits ? (
              <span className="form-field__error">{fieldErrors.credits}</span>
            ) : null}
          </div>
          <div className="form-field form-field--full">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            {fieldErrors.name ? (
              <span className="form-field__error">{fieldErrors.name}</span>
            ) : null}
          </div>
          <div className="form-field form-field--full">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              maxLength={500}
              value={form.description ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
            {fieldErrors.description ? (
              <span className="form-field__error">
                {fieldErrors.description}
              </span>
            ) : null}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete course?"
        message={
          deleteTarget
            ? `Remove "${deleteTarget.name}"? Students enrolled in this course will be unenrolled.`
            : ''
        }
        confirmLabel="Delete"
        destructive
        busy={deleting}
        onCancel={() => (deleting ? undefined : setDeleteTarget(null))}
        onConfirm={confirmDelete}
      />
    </>
  )
}
