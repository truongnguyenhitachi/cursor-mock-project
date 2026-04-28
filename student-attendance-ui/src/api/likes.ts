import { api } from './client'
import type { LikeStatus } from '../types'

export const likesApi = {
  courseStatus(courseId: number): Promise<LikeStatus> {
    return api
      .get<LikeStatus>(`/courses/${courseId}/likes`)
      .then((r) => r.data)
  },

  likeCourse(courseId: number): Promise<LikeStatus> {
    return api
      .post<LikeStatus>(`/courses/${courseId}/likes`)
      .then((r) => r.data)
  },

  unlikeCourse(courseId: number): Promise<LikeStatus> {
    return api
      .delete<LikeStatus>(`/courses/${courseId}/likes`)
      .then((r) => r.data)
  },

  commentStatus(commentId: number): Promise<LikeStatus> {
    return api
      .get<LikeStatus>(`/comments/${commentId}/likes`)
      .then((r) => r.data)
  },

  likeComment(commentId: number): Promise<LikeStatus> {
    return api
      .post<LikeStatus>(`/comments/${commentId}/likes`)
      .then((r) => r.data)
  },

  unlikeComment(commentId: number): Promise<LikeStatus> {
    return api
      .delete<LikeStatus>(`/comments/${commentId}/likes`)
      .then((r) => r.data)
  },
}
