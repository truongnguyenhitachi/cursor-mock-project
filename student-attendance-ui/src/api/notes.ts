import { api } from './client'
import type { Note, NoteRequest } from '../types'

export const notesApi = {
  list(courseId?: number): Promise<Note[]> {
    const params = courseId != null ? { courseId } : undefined
    return api.get<Note[]>('/notes', { params }).then((r) => r.data)
  },
  create(payload: NoteRequest): Promise<Note> {
    return api.post<Note>('/notes', payload).then((r) => r.data)
  },
  update(id: number, payload: NoteRequest): Promise<Note> {
    return api.put<Note>(`/notes/${id}`, payload).then((r) => r.data)
  },
  delete(id: number): Promise<void> {
    return api.delete<void>(`/notes/${id}`).then(() => undefined)
  },
}
