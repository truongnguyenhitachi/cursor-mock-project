import type { AxiosProgressEvent } from 'axios'
import { api } from './client'
import type { CourseVideo, CourseVideoMetadata } from '../types'

export interface UploadOptions {
  title?: string
  description?: string
  onProgress?: (percent: number) => void
}

export const videosApi = {
  list(courseId: number): Promise<CourseVideo[]> {
    return api
      .get<CourseVideo[]>(`/courses/${courseId}/videos`)
      .then((r) => r.data)
  },

  upload(
    courseId: number,
    file: File,
    options: UploadOptions = {},
  ): Promise<CourseVideo> {
    const form = new FormData()
    form.append('file', file)
    if (options.title) form.append('title', options.title)
    if (options.description) form.append('description', options.description)
    return api
      .post<CourseVideo>(`/courses/${courseId}/videos`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: options.onProgress
          ? (e: AxiosProgressEvent) => {
              if (!e.total) return
              const pct = Math.round((e.loaded / e.total) * 100)
              options.onProgress?.(pct)
            }
          : undefined,
      })
      .then((r) => r.data)
  },

  updateMetadata(
    courseId: number,
    videoId: number,
    payload: CourseVideoMetadata,
  ): Promise<CourseVideo> {
    return api
      .put<CourseVideo>(`/courses/${courseId}/videos/${videoId}`, payload)
      .then((r) => r.data)
  },

  delete(courseId: number, videoId: number): Promise<void> {
    return api
      .delete(`/courses/${courseId}/videos/${videoId}`)
      .then(() => undefined)
  },
}
