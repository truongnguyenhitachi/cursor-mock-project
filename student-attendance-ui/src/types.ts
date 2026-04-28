export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'

export const ATTENDANCE_STATUSES: AttendanceStatus[] = [
  'PRESENT',
  'ABSENT',
  'LATE',
  'EXCUSED',
]

export interface CourseSummary {
  id: number
  courseCode: string
  name: string
}

export interface Student {
  id: number
  studentCode: string
  firstName: string
  lastName: string
  email: string
  dateOfBirth: string | null
  courses: CourseSummary[]
  createdAt: string
  updatedAt: string
}

export interface StudentRequest {
  studentCode: string
  firstName: string
  lastName: string
  email: string
  dateOfBirth?: string | null
  courseIds?: number[]
}

export interface Course {
  id: number
  courseCode: string
  name: string
  description: string | null
  credits: number
  hasCoverImage: boolean
  coverImageUrl: string | null
  likeCount: number
  commentCount: number
  materialCount: number
  videoCount: number
  likedByMe: boolean
  createdAt: string
  updatedAt: string
}

export interface CourseRequest {
  courseCode: string
  name: string
  description?: string
  credits: number
}

export interface CourseMaterial {
  id: number
  courseId: number
  originalFilename: string
  contentType: string | null
  sizeBytes: number
  downloadUrl: string
  uploadedAt: string
}

export interface Comment {
  id: number
  courseId: number
  authorName: string
  content: string
  likeCount: number
  likedByMe: boolean
  ownedByMe: boolean
  createdAt: string
  updatedAt: string
}

export interface CommentRequest {
  authorName: string
  content: string
}

export interface LikeStatus {
  likeCount: number
  likedByMe: boolean
}

export interface CourseVideo {
  id: number
  courseId: number
  title: string
  description: string | null
  originalFilename: string
  contentType: string | null
  sizeBytes: number
  streamUrl: string
  downloadUrl: string
  uploadedAt: string
  updatedAt: string
}

export interface CourseVideoMetadata {
  title: string
  description?: string
}

export type UserRole = 'USER' | 'ADMIN'

export interface AuthUser {
  id: number
  username: string
  displayName: string
  role: UserRole
  createdAt: string
}

export interface AuthResponse {
  token: string
  tokenType: string
  expiresInSeconds: number
  user: AuthUser
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  password: string
  displayName: string
}

export interface Note {
  id: number
  userId: number
  courseId: number | null
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface NoteRequest {
  title: string
  content: string
  courseId?: number | null
}

export interface Attendance {
  id: number
  studentId: number
  studentCode: string
  courseId: number
  courseCode: string
  sessionDate: string
  status: AttendanceStatus
  remarks: string | null
  createdAt: string
  updatedAt: string
}

export interface AttendanceRequest {
  studentId: number
  courseId: number
  sessionDate: string
  status: AttendanceStatus
  remarks?: string
}

export interface AttendanceSummary {
  studentId: number
  courseId: number | null
  totalSessions: number
  counts: Partial<Record<AttendanceStatus, number>>
}

export interface SortObject {
  empty: boolean
  sorted: boolean
  unsorted: boolean
}

export interface PageableObject {
  pageNumber: number
  pageSize: number
  sort: SortObject
  offset: number
  paged: boolean
  unpaged: boolean
}

export interface Page<T> {
  content: T[]
  pageable: PageableObject
  totalElements: number
  totalPages: number
  last: boolean
  first: boolean
  size: number
  number: number
  numberOfElements: number
  empty: boolean
}

export interface ApiError {
  timestamp?: string
  status: number
  error?: string
  message: string
  path?: string
  fieldErrors?: Record<string, string>
}
