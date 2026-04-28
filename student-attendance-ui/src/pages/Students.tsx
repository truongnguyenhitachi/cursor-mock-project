import { useEffect, useState } from 'react'
import { studentsApi } from '../api/students'
import { coursesApi } from '../api/courses'
import { extractApiError } from '../api/client'
import { Modal } from '../components/Modal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Pagination } from '../components/Pagination'
import { useToast } from '../components/Toast'
import type { Course, Student, StudentRequest } from '../types'

const PAGE_SIZE = 10

const emptyForm: StudentRequest = {
  studentCode: '',
  firstName: '',
  lastName: '',
  email: '',
  dateOfBirth: '',
  courseIds: [],
}

export function StudentsPage() {
  const toast = useToast()
  const [items, setItems] = useState<Student[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')

  const [courses, setCourses] = useState<Course[]>([])

  const [editing, setEditing] = useState<Student | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<StudentRequest>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [enrollTarget, setEnrollTarget] = useState<Student | null>(null)
  const [enrolling, setEnrolling] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await studentsApi.search({
          query: debounced || undefined,
          page,
          size: PAGE_SIZE,
          sort: 'lastName,asc',
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
  }, [page, debounced])

  useEffect(() => {
    coursesApi
      .list({ page: 0, size: 200, sort: 'name,asc' })
      .then((p) => setCourses(p.content))
      .catch((e) => toast.error(extractApiError(e).message))
  }, [toast])

  function openCreate() {
    setForm(emptyForm)
    setFieldErrors({})
    setCreating(true)
  }

  function openEdit(student: Student) {
    setForm({
      studentCode: student.studentCode,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      dateOfBirth: student.dateOfBirth ?? '',
      courseIds: student.courses.map((c) => c.id),
    })
    setFieldErrors({})
    setEditing(student)
  }

  function closeForm() {
    if (submitting) return
    setCreating(false)
    setEditing(null)
  }

  async function reload() {
    const res = await studentsApi.search({
      query: debounced || undefined,
      page,
      size: PAGE_SIZE,
      sort: 'lastName,asc',
    })
    setItems(res.content)
    setTotalPages(res.totalPages)
    setTotalElements(res.totalElements)
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setFieldErrors({})
    try {
      const payload: StudentRequest = {
        ...form,
        dateOfBirth: form.dateOfBirth ? form.dateOfBirth : null,
      }
      if (editing) {
        await studentsApi.update(editing.id, payload)
        toast.success('Student updated')
      } else {
        await studentsApi.create(payload)
        toast.success('Student created')
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
      await studentsApi.delete(deleteTarget.id)
      toast.success(`Removed ${deleteTarget.firstName} ${deleteTarget.lastName}`)
      setDeleteTarget(null)
      await reload()
    } catch (e) {
      toast.error(extractApiError(e).message)
    } finally {
      setDeleting(false)
    }
  }

  async function toggleEnrollment(courseId: number, currentlyEnrolled: boolean) {
    if (!enrollTarget) return
    setEnrolling(true)
    try {
      const updated = currentlyEnrolled
        ? await studentsApi.unenroll(enrollTarget.id, courseId)
        : await studentsApi.enroll(enrollTarget.id, courseId)
      setEnrollTarget(updated)
      setItems((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
      toast.success(
        currentlyEnrolled ? 'Removed from course' : 'Enrolled in course',
      )
    } catch (e) {
      toast.error(extractApiError(e).message)
    } finally {
      setEnrolling(false)
    }
  }

  return (
    <>
      <div className="card">
        <div className="section-header">
          <div>
            <h2>Students</h2>
            <p>Search, create, edit, and manage course enrollments.</p>
          </div>
          <button type="button" className="btn btn--primary" onClick={openCreate}>
            + New student
          </button>
        </div>

        <div className="toolbar">
          <div className="toolbar__search">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              placeholder="Search by name, code, or email"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading students…</div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <h3>No students found</h3>
            <p>Adjust your search or add a new student.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Date of birth</th>
                  <th>Courses</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.studentCode}</strong>
                    </td>
                    <td>
                      {s.firstName} {s.lastName}
                    </td>
                    <td>{s.email}</td>
                    <td>{s.dateOfBirth ?? '—'}</td>
                    <td>
                      {s.courses.length === 0 ? (
                        <span style={{ color: 'var(--color-text-soft)' }}>
                          None
                        </span>
                      ) : (
                        <div className="chip-list">
                          {s.courses.slice(0, 3).map((c) => (
                            <span key={c.id} className="chip">
                              {c.courseCode}
                            </span>
                          ))}
                          {s.courses.length > 3 ? (
                            <span className="chip">+{s.courses.length - 3}</span>
                          ) : null}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="table__actions">
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={() => setEnrollTarget(s)}
                        >
                          Enroll
                        </button>
                        <button
                          type="button"
                          className="btn btn--secondary btn--sm"
                          onClick={() => openEdit(s)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn--danger btn--sm"
                          onClick={() => setDeleteTarget(s)}
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
        title={editing ? 'Edit student' : 'Create student'}
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
              form="student-form"
              className="btn btn--primary"
              disabled={submitting}
            >
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <form id="student-form" className="form-grid" onSubmit={submitForm}>
          <div className="form-field">
            <label htmlFor="studentCode">Student code</label>
            <input
              id="studentCode"
              required
              value={form.studentCode}
              onChange={(e) =>
                setForm((f) => ({ ...f, studentCode: e.target.value }))
              }
            />
            {fieldErrors.studentCode ? (
              <span className="form-field__error">
                {fieldErrors.studentCode}
              </span>
            ) : null}
          </div>
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
            />
            {fieldErrors.email ? (
              <span className="form-field__error">{fieldErrors.email}</span>
            ) : null}
          </div>
          <div className="form-field">
            <label htmlFor="firstName">First name</label>
            <input
              id="firstName"
              required
              value={form.firstName}
              onChange={(e) =>
                setForm((f) => ({ ...f, firstName: e.target.value }))
              }
            />
            {fieldErrors.firstName ? (
              <span className="form-field__error">
                {fieldErrors.firstName}
              </span>
            ) : null}
          </div>
          <div className="form-field">
            <label htmlFor="lastName">Last name</label>
            <input
              id="lastName"
              required
              value={form.lastName}
              onChange={(e) =>
                setForm((f) => ({ ...f, lastName: e.target.value }))
              }
            />
            {fieldErrors.lastName ? (
              <span className="form-field__error">{fieldErrors.lastName}</span>
            ) : null}
          </div>
          <div className="form-field">
            <label htmlFor="dateOfBirth">Date of birth</label>
            <input
              id="dateOfBirth"
              type="date"
              value={form.dateOfBirth ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, dateOfBirth: e.target.value }))
              }
            />
            {fieldErrors.dateOfBirth ? (
              <span className="form-field__error">
                {fieldErrors.dateOfBirth}
              </span>
            ) : null}
          </div>
          <div className="form-field form-field--full">
            <label>Courses</label>
            {courses.length === 0 ? (
              <p
                style={{
                  margin: 0,
                  color: 'var(--color-text-muted)',
                  fontSize: '0.85rem',
                }}
              >
                No courses available yet. Create courses first to enroll
                students.
              </p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: '0.4rem',
                  maxHeight: 180,
                  overflow: 'auto',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.5rem 0.75rem',
                }}
              >
                {courses.map((c) => {
                  const checked = form.courseIds?.includes(c.id) ?? false
                  return (
                    <label
                      key={c.id}
                      style={{
                        display: 'flex',
                        gap: '0.4rem',
                        alignItems: 'center',
                        fontWeight: 400,
                        fontSize: '0.85rem',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setForm((f) => {
                            const ids = new Set(f.courseIds ?? [])
                            if (e.target.checked) ids.add(c.id)
                            else ids.delete(c.id)
                            return { ...f, courseIds: Array.from(ids) }
                          })
                        }}
                      />
                      <span>
                        <strong>{c.courseCode}</strong> · {c.name}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        </form>
      </Modal>

      <Modal
        open={enrollTarget !== null}
        title={
          enrollTarget
            ? `Manage enrollments — ${enrollTarget.firstName} ${enrollTarget.lastName}`
            : ''
        }
        onClose={() => (enrolling ? undefined : setEnrollTarget(null))}
        footer={
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => setEnrollTarget(null)}
            disabled={enrolling}
          >
            Done
          </button>
        }
      >
        {enrollTarget ? (
          courses.length === 0 ? (
            <div className="empty-state">
              <h3>No courses available</h3>
              <p>Create courses before assigning them to students.</p>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                maxHeight: 360,
                overflow: 'auto',
              }}
            >
              {courses.map((c) => {
                const enrolled = enrollTarget.courses.some(
                  (ec) => ec.id === c.id,
                )
                return (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.55rem 0.8rem',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      background: enrolled
                        ? 'var(--color-primary-soft)'
                        : 'var(--color-surface)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        {c.courseCode} · {c.credits} credit
                        {c.credits === 1 ? '' : 's'}
                      </div>
                    </div>
                    <button
                      type="button"
                      className={
                        enrolled
                          ? 'btn btn--secondary btn--sm'
                          : 'btn btn--primary btn--sm'
                      }
                      onClick={() => toggleEnrollment(c.id, enrolled)}
                      disabled={enrolling}
                    >
                      {enrolled ? 'Unenroll' : 'Enroll'}
                    </button>
                  </div>
                )
              })}
            </div>
          )
        ) : null}
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete student?"
        message={
          deleteTarget
            ? `This will permanently remove ${deleteTarget.firstName} ${deleteTarget.lastName} and all related attendance.`
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
