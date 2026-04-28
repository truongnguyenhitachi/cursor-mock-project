import { api } from './client'
import type { Course } from '../types'

export const myCoursesApi = {
  list(): Promise<Course[]> {
    return api.get<Course[]>('/me/courses').then((r) => r.data)
  },
  enrollmentStatus(courseId: number): Promise<{ enrolled: boolean }> {
    return api
      .get<{ enrolled: boolean }>(`/me/courses/${courseId}/enrollment`)
      .then((r) => r.data)
  },
  enroll(courseId: number): Promise<Course> {
    return api.post<Course>(`/me/courses/${courseId}`).then((r) => r.data)
  },
  unenroll(courseId: number): Promise<void> {
    return api.delete<void>(`/me/courses/${courseId}`).then(() => undefined)
  },
}
