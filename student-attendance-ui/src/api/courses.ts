import { api } from './client'
import type { Course, CourseRequest, Page } from '../types'

export interface ListParams {
  page?: number
  size?: number
  sort?: string
}

export const coursesApi = {
  list(params: ListParams = {}): Promise<Page<Course>> {
    return api.get<Page<Course>>('/courses', { params }).then((r) => r.data)
  },

  get(id: number): Promise<Course> {
    return api.get<Course>(`/courses/${id}`).then((r) => r.data)
  },

  create(payload: CourseRequest): Promise<Course> {
    return api.post<Course>('/courses', payload).then((r) => r.data)
  },

  update(id: number, payload: CourseRequest): Promise<Course> {
    return api.put<Course>(`/courses/${id}`, payload).then((r) => r.data)
  },

  delete(id: number): Promise<void> {
    return api.delete(`/courses/${id}`).then(() => undefined)
  },
}
