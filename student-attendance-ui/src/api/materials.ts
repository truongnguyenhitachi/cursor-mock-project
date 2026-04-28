import { api } from './client'
import type { CourseMaterial } from '../types'

export const materialsApi = {
  list(courseId: number): Promise<CourseMaterial[]> {
    return api
      .get<CourseMaterial[]>(`/courses/${courseId}/materials`)
      .then((r) => r.data)
  },

  upload(courseId: number, files: File[]): Promise<CourseMaterial[]> {
    const form = new FormData()
    for (const f of files) form.append('files', f)
    return api
      .post<CourseMaterial[]>(`/courses/${courseId}/materials`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  delete(courseId: number, materialId: number): Promise<void> {
    return api
      .delete(`/courses/${courseId}/materials/${materialId}`)
      .then(() => undefined)
  },

  setCover(courseId: number, file: File): Promise<unknown> {
    const form = new FormData()
    form.append('file', file)
    return api
      .post(`/courses/${courseId}/cover`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  clearCover(courseId: number): Promise<void> {
    return api.delete(`/courses/${courseId}/cover`).then(() => undefined)
  },
}
