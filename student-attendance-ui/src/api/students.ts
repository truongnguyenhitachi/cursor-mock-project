import { api } from './client'
import type { Page, Student, StudentRequest } from '../types'

export interface SearchParams {
  query?: string
  page?: number
  size?: number
  sort?: string
}

export const studentsApi = {
  search(params: SearchParams = {}): Promise<Page<Student>> {
    return api
      .get<Page<Student>>('/students', { params })
      .then((r) => r.data)
  },

  get(id: number): Promise<Student> {
    return api.get<Student>(`/students/${id}`).then((r) => r.data)
  },

  create(payload: StudentRequest): Promise<Student> {
    return api.post<Student>('/students', payload).then((r) => r.data)
  },

  update(id: number, payload: StudentRequest): Promise<Student> {
    return api.put<Student>(`/students/${id}`, payload).then((r) => r.data)
  },

  delete(id: number): Promise<void> {
    return api.delete(`/students/${id}`).then(() => undefined)
  },

  enroll(studentId: number, courseId: number): Promise<Student> {
    return api
      .post<Student>(`/students/${studentId}/courses/${courseId}`)
      .then((r) => r.data)
  },

  unenroll(studentId: number, courseId: number): Promise<Student> {
    return api
      .delete<Student>(`/students/${studentId}/courses/${courseId}`)
      .then((r) => r.data)
  },
}
