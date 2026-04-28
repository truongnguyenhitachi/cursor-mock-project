import { api } from './client'
import type {
  Attendance,
  AttendanceRequest,
  AttendanceSummary,
  Page,
} from '../types'

export interface PageParams {
  page?: number
  size?: number
  sort?: string
}

export const attendanceApi = {
  record(payload: AttendanceRequest): Promise<Attendance> {
    return api.post<Attendance>('/attendance', payload).then((r) => r.data)
  },

  get(id: number): Promise<Attendance> {
    return api.get<Attendance>(`/attendance/${id}`).then((r) => r.data)
  },

  update(id: number, payload: AttendanceRequest): Promise<Attendance> {
    return api.put<Attendance>(`/attendance/${id}`, payload).then((r) => r.data)
  },

  delete(id: number): Promise<void> {
    return api.delete(`/attendance/${id}`).then(() => undefined)
  },

  listByStudent(
    studentId: number,
    params: PageParams = {},
  ): Promise<Page<Attendance>> {
    return api
      .get<Page<Attendance>>(`/attendance/students/${studentId}`, { params })
      .then((r) => r.data)
  },

  listByCourse(
    courseId: number,
    params: PageParams = {},
  ): Promise<Page<Attendance>> {
    return api
      .get<Page<Attendance>>(`/attendance/courses/${courseId}`, { params })
      .then((r) => r.data)
  },

  listByCourseAndDate(courseId: number, date: string): Promise<Attendance[]> {
    return api
      .get<Attendance[]>(`/attendance/courses/${courseId}/sessions`, {
        params: { date },
      })
      .then((r) => r.data)
  },

  summary(studentId: number, courseId?: number): Promise<AttendanceSummary> {
    return api
      .get<AttendanceSummary>(`/attendance/students/${studentId}/summary`, {
        params: courseId ? { courseId } : undefined,
      })
      .then((r) => r.data)
  },
}
