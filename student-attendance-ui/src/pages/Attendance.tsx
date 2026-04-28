import { useEffect, useMemo, useState } from 'react'
import { attendanceApi } from '../api/attendance'
import { coursesApi } from '../api/courses'
import { studentsApi } from '../api/students'
import { extractApiError } from '../api/client'
import { Modal } from '../components/Modal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import {
  ATTENDANCE_STATUSES,
  type Attendance,
  type AttendanceRequest,
  type AttendanceStatus,
  type AttendanceSummary,
  type Course,
  type Student,
} from '../types'

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

const emptyForm: AttendanceRequest = {
  studentId: 0,
  courseId: 0,
  sessionDate: todayISO(),
  status: 'PRESENT',
  remarks: '',
}

export function AttendancePage() {
  const toast = useToast()
  const [courses, setCourses] = useState<Course[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)

  const [selectedCourseId, setSelectedCourseId] = useState<number | ''>('')
  const [selectedDate, setSelectedDate] = useState<string>(todayISO())
  const [sessionRecords, setSessionRecords] = useState<Attendance[]>([])
  const [sessionLoading, setSessionLoading] = useState(false)
  const [sessionError, setSessionError] = useState<string | null>(null)

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Attendance | null>(null)
  const [form, setForm] = useState<AttendanceRequest>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [deleteTarget, setDeleteTarget] = useState<Attendance | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [summaryStudentId, setSummaryStudentId] = useState<number | ''>('')
  const [summaryCourseId, setSummaryCourseId] = useState<number | ''>('')
  const [summary, setSummary] = useState<AttendanceSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setCoursesLoading(true)
      try {
        const [coursePage, studentPage] = await Promise.all([
          coursesApi.list({ page: 0, size: 200, sort: 'name,asc' }),
          studentsApi.search({ page: 0, size: 500, sort: 'lastName,asc' }),
        ])
        if (cancelled) return
        setCourses(coursePage.content)
        setStudents(studentPage.content)
        if (coursePage.content.length > 0 && selectedCourseId === '') {
          setSelectedCourseId(coursePage.content[0].id)
        }
      } catch (e) {
        toast.error(extractApiError(e).message)
      } finally {
        if (!cancelled) setCoursesLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selectedCourseId === '' || !selectedDate) return
    let cancelled = false
    async function load() {
      setSessionLoading(true)
      setSessionError(null)
      try {
        const data = await attendanceApi.listByCourseAndDate(
          selectedCourseId as number,
          selectedDate,
        )
        if (!cancelled) setSessionRecords(data)
      } catch (e) {
        if (!cancelled) setSessionError(extractApiError(e).message)
      } finally {
        if (!cancelled) setSessionLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [selectedCourseId, selectedDate])

  const studentLookup = useMemo(() => {
    const map = new Map<number, Student>()
    students.forEach((s) => map.set(s.id, s))
    return map
  }, [students])

  const enrolledStudents = useMemo(() => {
    if (selectedCourseId === '') return [] as Student[]
    return students.filter((s) =>
      s.courses.some((c) => c.id === selectedCourseId),
    )
  }, [students, selectedCourseId])

  const recordedStudentIds = useMemo(
    () => new Set(sessionRecords.map((r) => r.studentId)),
    [sessionRecords],
  )

  function openCreateFor(studentId?: number) {
    setForm({
      studentId: studentId ?? 0,
      courseId: selectedCourseId === '' ? 0 : (selectedCourseId as number),
      sessionDate: selectedDate,
      status: 'PRESENT',
      remarks: '',
    })
    setFieldErrors({})
    setCreating(true)
  }

  function openEdit(record: Attendance) {
    setForm({
      studentId: record.studentId,
      courseId: record.courseId,
      sessionDate: record.sessionDate,
      status: record.status,
      remarks: record.remarks ?? '',
    })
    setFieldErrors({})
    setEditing(record)
  }

  function closeForm() {
    if (submitting) return
    setCreating(false)
    setEditing(null)
  }

  async function reloadSession() {
    if (selectedCourseId === '' || !selectedDate) return
    const data = await attendanceApi.listByCourseAndDate(
      selectedCourseId as number,
      selectedDate,
    )
    setSessionRecords(data)
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setFieldErrors({})
    try {
      const payload: AttendanceRequest = {
        ...form,
        remarks: form.remarks?.trim() ? form.remarks : undefined,
        studentId: Number(form.studentId),
        courseId: Number(form.courseId),
      }
      if (editing) {
        await attendanceApi.update(editing.id, payload)
        toast.success('Attendance updated')
      } else {
        await attendanceApi.record(payload)
        toast.success('Attendance recorded')
      }
      setCreating(false)
      setEditing(null)
      await reloadSession()
    } catch (e) {
      const apiErr = extractApiError(e)
      if (apiErr.fieldErrors) setFieldErrors(apiErr.fieldErrors)
      toast.error(apiErr.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function quickRecord(studentId: number, status: AttendanceStatus) {
    if (selectedCourseId === '') return
    try {
      await attendanceApi.record({
        studentId,
        courseId: selectedCourseId as number,
        sessionDate: selectedDate,
        status,
      })
      toast.success('Attendance recorded')
      await reloadSession()
    } catch (e) {
      toast.error(extractApiError(e).message)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await attendanceApi.delete(deleteTarget.id)
      toast.success('Attendance removed')
      setDeleteTarget(null)
      await reloadSession()
    } catch (e) {
      toast.error(extractApiError(e).message)
    } finally {
      setDeleting(false)
    }
  }

  async function loadSummary() {
    if (summaryStudentId === '') return
    setSummaryLoading(true)
    try {
      const data = await attendanceApi.summary(
        summaryStudentId as number,
        summaryCourseId === '' ? undefined : (summaryCourseId as number),
      )
      setSummary(data)
    } catch (e) {
      toast.error(extractApiError(e).message)
    } finally {
      setSummaryLoading(false)
    }
  }

  return (
    <>
      <div className="card">
        <div className="section-header">
          <div>
            <h2>Session attendance</h2>
            <p>Pick a course and date to record or review attendance.</p>
          </div>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => openCreateFor()}
            disabled={courses.length === 0 || students.length === 0}
          >
            + Record attendance
          </button>
        </div>

        <div className="toolbar">
          <div className="form-field" style={{ minWidth: 220, flex: 1 }}>
            <label htmlFor="filter-course">Course</label>
            <select
              id="filter-course"
              value={selectedCourseId}
              onChange={(e) =>
                setSelectedCourseId(
                  e.target.value === '' ? '' : Number(e.target.value),
                )
              }
              disabled={coursesLoading || courses.length === 0}
            >
              {courses.length === 0 ? <option value="">No courses</option> : null}
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.courseCode} — {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field" style={{ minWidth: 180 }}>
            <label htmlFor="filter-date">Session date</label>
            <input
              id="filter-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        {coursesLoading ? (
          <div className="loading">Loading…</div>
        ) : courses.length === 0 ? (
          <div className="empty-state">
            <h3>No courses available</h3>
            <p>Create a course before recording attendance.</p>
          </div>
        ) : sessionLoading ? (
          <div className="loading">Loading session…</div>
        ) : sessionError ? (
          <div className="error-state">{sessionError}</div>
        ) : (
          <>
            <h3
              style={{
                margin: '0.5rem 0 0.75rem',
                fontSize: '0.95rem',
                color: 'var(--color-text-muted)',
              }}
            >
              Recorded for this session
            </h3>
            {sessionRecords.length === 0 ? (
              <div className="empty-state" style={{ padding: '1.25rem' }}>
                <p>No attendance recorded for this date yet.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Status</th>
                      <th>Remarks</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionRecords.map((r) => {
                      const stu = studentLookup.get(r.studentId)
                      return (
                        <tr key={r.id}>
                          <td>
                            <strong>{r.studentCode}</strong>
                            {stu ? (
                              <div
                                style={{
                                  fontSize: '0.78rem',
                                  color: 'var(--color-text-muted)',
                                }}
                              >
                                {stu.firstName} {stu.lastName}
                              </div>
                            ) : null}
                          </td>
                          <td>
                            <span className={`badge badge--${r.status}`}>
                              {r.status}
                            </span>
                          </td>
                          <td style={{ color: 'var(--color-text-muted)' }}>
                            {r.remarks?.trim() || '—'}
                          </td>
                          <td>
                            <div className="table__actions">
                              <button
                                type="button"
                                className="btn btn--secondary btn--sm"
                                onClick={() => openEdit(r)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn--danger btn--sm"
                                onClick={() => setDeleteTarget(r)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <h3
              style={{
                margin: '1.5rem 0 0.75rem',
                fontSize: '0.95rem',
                color: 'var(--color-text-muted)',
              }}
            >
              Quick record · enrolled students
            </h3>
            {enrolledStudents.length === 0 ? (
              <div className="empty-state" style={{ padding: '1.25rem' }}>
                <p>No students are enrolled in this course yet.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Quick mark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrolledStudents.map((s) => {
                      const recorded = recordedStudentIds.has(s.id)
                      return (
                        <tr key={s.id}>
                          <td>
                            <strong>{s.studentCode}</strong>
                            <div
                              style={{
                                fontSize: '0.78rem',
                                color: 'var(--color-text-muted)',
                              }}
                            >
                              {s.firstName} {s.lastName}
                            </div>
                          </td>
                          <td>
                            {recorded ? (
                              <span className="badge">Recorded</span>
                            ) : (
                              <span
                                style={{
                                  color: 'var(--color-text-soft)',
                                  fontSize: '0.85rem',
                                }}
                              >
                                Not recorded
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="table__actions">
                              {ATTENDANCE_STATUSES.map((status) => (
                                <button
                                  key={status}
                                  type="button"
                                  className="btn btn--ghost btn--sm"
                                  onClick={() => quickRecord(s.id, status)}
                                  disabled={recorded}
                                  title={
                                    recorded
                                      ? 'Already recorded'
                                      : `Mark ${status.toLowerCase()}`
                                  }
                                >
                                  {status[0] +
                                    status.slice(1).toLowerCase()}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      <div className="card">
        <div className="section-header">
          <div>
            <h2>Student attendance summary</h2>
            <p>See attendance counts per student, optionally per course.</p>
          </div>
        </div>
        <div className="toolbar">
          <div className="form-field" style={{ minWidth: 220, flex: 1 }}>
            <label htmlFor="summary-student">Student</label>
            <select
              id="summary-student"
              value={summaryStudentId}
              onChange={(e) =>
                setSummaryStudentId(
                  e.target.value === '' ? '' : Number(e.target.value),
                )
              }
            >
              <option value="">Select a student…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.studentCode} · {s.firstName} {s.lastName}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field" style={{ minWidth: 220 }}>
            <label htmlFor="summary-course">Course (optional)</label>
            <select
              id="summary-course"
              value={summaryCourseId}
              onChange={(e) =>
                setSummaryCourseId(
                  e.target.value === '' ? '' : Number(e.target.value),
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
          </div>
          <button
            type="button"
            className="btn btn--primary"
            onClick={loadSummary}
            disabled={summaryStudentId === '' || summaryLoading}
            style={{ alignSelf: 'flex-end' }}
          >
            {summaryLoading ? 'Loading…' : 'View summary'}
          </button>
        </div>

        {summary ? (
          <>
            <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
              Total sessions: <strong>{summary.totalSessions}</strong>
            </p>
            <div className="summary-grid">
              {ATTENDANCE_STATUSES.map((status) => {
                const count = summary.counts[status] ?? 0
                const pct =
                  summary.totalSessions === 0
                    ? 0
                    : Math.round((count / summary.totalSessions) * 100)
                return (
                  <div className="summary-tile" key={status}>
                    <div className="summary-tile__label">
                      <span className={`badge badge--${status}`}>{status}</span>
                    </div>
                    <div className="summary-tile__value">{count}</div>
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      {pct}% of sessions
                    </div>
                    <div className="summary-tile__bar">
                      <span style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div className="empty-state" style={{ padding: '1rem' }}>
            <p>Select a student and click “View summary”.</p>
          </div>
        )}
      </div>

      <Modal
        open={creating || editing !== null}
        title={editing ? 'Edit attendance' : 'Record attendance'}
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
              form="attendance-form"
              className="btn btn--primary"
              disabled={submitting}
            >
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <form id="attendance-form" className="form-grid" onSubmit={submitForm}>
          <div className="form-field">
            <label htmlFor="att-course">Course</label>
            <select
              id="att-course"
              required
              value={form.courseId || ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, courseId: Number(e.target.value) }))
              }
            >
              <option value="">Select…</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.courseCode} — {c.name}
                </option>
              ))}
            </select>
            {fieldErrors.courseId ? (
              <span className="form-field__error">{fieldErrors.courseId}</span>
            ) : null}
          </div>
          <div className="form-field">
            <label htmlFor="att-student">Student</label>
            <select
              id="att-student"
              required
              value={form.studentId || ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, studentId: Number(e.target.value) }))
              }
            >
              <option value="">Select…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.studentCode} · {s.firstName} {s.lastName}
                </option>
              ))}
            </select>
            {fieldErrors.studentId ? (
              <span className="form-field__error">
                {fieldErrors.studentId}
              </span>
            ) : null}
          </div>
          <div className="form-field">
            <label htmlFor="att-date">Session date</label>
            <input
              id="att-date"
              type="date"
              required
              value={form.sessionDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, sessionDate: e.target.value }))
              }
            />
            {fieldErrors.sessionDate ? (
              <span className="form-field__error">
                {fieldErrors.sessionDate}
              </span>
            ) : null}
          </div>
          <div className="form-field">
            <label htmlFor="att-status">Status</label>
            <select
              id="att-status"
              required
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  status: e.target.value as AttendanceStatus,
                }))
              }
            >
              {ATTENDANCE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {fieldErrors.status ? (
              <span className="form-field__error">{fieldErrors.status}</span>
            ) : null}
          </div>
          <div className="form-field form-field--full">
            <label htmlFor="att-remarks">Remarks</label>
            <textarea
              id="att-remarks"
              maxLength={255}
              value={form.remarks ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, remarks: e.target.value }))
              }
            />
            {fieldErrors.remarks ? (
              <span className="form-field__error">{fieldErrors.remarks}</span>
            ) : null}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete attendance record?"
        message={
          deleteTarget
            ? `Remove the ${deleteTarget.status} record for ${deleteTarget.studentCode} on ${deleteTarget.sessionDate}?`
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
