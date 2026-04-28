import { api } from './client'
import type { Comment, CommentRequest, Page } from '../types'

export interface ListParams {
  page?: number
  size?: number
}

export const commentsApi = {
  list(courseId: number, params: ListParams = {}): Promise<Page<Comment>> {
    return api
      .get<Page<Comment>>(`/courses/${courseId}/comments`, { params })
      .then((r) => r.data)
  },

  create(courseId: number, payload: CommentRequest): Promise<Comment> {
    return api
      .post<Comment>(`/courses/${courseId}/comments`, payload)
      .then((r) => r.data)
  },

  update(commentId: number, payload: CommentRequest): Promise<Comment> {
    return api
      .put<Comment>(`/comments/${commentId}`, payload)
      .then((r) => r.data)
  },

  delete(commentId: number): Promise<void> {
    return api.delete(`/comments/${commentId}`).then(() => undefined)
  },
}
