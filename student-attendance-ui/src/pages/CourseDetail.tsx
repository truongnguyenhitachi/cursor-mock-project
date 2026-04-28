import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { ChangeEvent, DragEvent, FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { coursesApi } from '../api/courses'
import { materialsApi } from '../api/materials'
import { commentsApi } from '../api/comments'
import { likesApi } from '../api/likes'
import { apiUrl, extractApiError } from '../api/client'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'
import type { Comment, Course, CourseMaterial } from '../types'

const AUTHOR_KEY = 'student-attendance-ui:author-name'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  const sec = Math.round(diff / 1000)
  if (sec < 60) return 'just now'
  const min = Math.round(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.round(hr / 24)
  if (day < 30) return `${day}d ago`
  return new Date(iso).toLocaleDateString()
}

function extensionOf(name: string): string {
  const idx = name.lastIndexOf('.')
  if (idx < 0 || idx >= name.length - 1) return 'FILE'
  return name.slice(idx + 1).toUpperCase().slice(0, 4)
}

export function CourseDetailPage() {
  const params = useParams<{ id: string }>()
  const courseId = Number(params.id)
  const toast = useToast()

  const courseIdValid = !Number.isNaN(courseId)

  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(courseIdValid)
  const [error, setError] = useState<string | null>(
    courseIdValid ? null : 'Invalid course id',
  )

  const [materials, setMaterials] = useState<CourseMaterial[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [coverBust, setCoverBust] = useState(0)

  const [authorName, setAuthorName] = useState(
    () => localStorage.getItem(AUTHOR_KEY) ?? '',
  )
  const [commentText, setCommentText] = useState('')
  const [commentSubmitting, setCommentSubmitting] = useState(false)

  const [coverUploading, setCoverUploading] = useState(false)
  const [materialUploading, setMaterialUploading] = useState(false)
  const [dropActive, setDropActive] = useState(false)

  const [deleteMaterialId, setDeleteMaterialId] = useState<number | null>(null)
  const [deletingMaterial, setDeletingMaterial] = useState(false)

  const [deleteCommentId, setDeleteCommentId] = useState<number | null>(null)
  const [deletingComment, setDeletingComment] = useState(false)

  const coverFileRef = useRef<HTMLInputElement>(null)
  const materialFileRef = useRef<HTMLInputElement>(null)

  const reloadCourse = useCallback(async () => {
    const data = await coursesApi.get(courseId)
    setCourse(data)
  }, [courseId])

  const reloadMaterials = useCallback(async () => {
    const data = await materialsApi.list(courseId)
    setMaterials(data)
  }, [courseId])

  const reloadComments = useCallback(async () => {
    setCommentsLoading(true)
    try {
      const page = await commentsApi.list(courseId, { page: 0, size: 50 })
      setComments(page.content)
    } finally {
      setCommentsLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    if (!courseIdValid) return
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [courseData, materialList, commentPage] = await Promise.all([
          coursesApi.get(courseId),
          materialsApi.list(courseId),
          commentsApi.list(courseId, { page: 0, size: 50 }),
        ])
        if (cancelled) return
        setCourse(courseData)
        setMaterials(materialList)
        setComments(commentPage.content)
      } catch (e) {
        if (!cancelled) setError(extractApiError(e).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [courseId, courseIdValid])

  async function toggleCourseLike() {
    if (!course) return
    try {
      const status = course.likedByMe
        ? await likesApi.unlikeCourse(courseId)
        : await likesApi.likeCourse(courseId)
      setCourse({
        ...course,
        likeCount: status.likeCount,
        likedByMe: status.likedByMe,
      })
    } catch (e) {
      toast.error(extractApiError(e).message)
    }
  }

  async function toggleCommentLike(comment: Comment) {
    try {
      const status = comment.likedByMe
        ? await likesApi.unlikeComment(comment.id)
        : await likesApi.likeComment(comment.id)
      setComments((prev) =>
        prev.map((c) =>
          c.id === comment.id
            ? { ...c, likeCount: status.likeCount, likedByMe: status.likedByMe }
            : c,
        ),
      )
    } catch (e) {
      toast.error(extractApiError(e).message)
    }
  }

  async function onCoverChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) await uploadCover(file)
    e.target.value = ''
  }

  async function uploadCover(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Cover must be an image')
      return
    }
    setCoverUploading(true)
    try {
      await materialsApi.setCover(courseId, file)
      await reloadCourse()
      setCoverBust(Date.now())
      toast.success('Cover updated')
    } catch (e) {
      toast.error(extractApiError(e).message)
    } finally {
      setCoverUploading(false)
    }
  }

  async function clearCover() {
    setCoverUploading(true)
    try {
      await materialsApi.clearCover(courseId)
      await reloadCourse()
      toast.success('Cover removed')
    } catch (e) {
      toast.error(extractApiError(e).message)
    } finally {
      setCoverUploading(false)
    }
  }

  async function uploadMaterials(files: File[]) {
    if (files.length === 0) return
    setMaterialUploading(true)
    try {
      await materialsApi.upload(courseId, files)
      await Promise.all([reloadMaterials(), reloadCourse()])
      toast.success(
        files.length === 1
          ? 'File uploaded'
          : `Uploaded ${files.length} files`,
      )
    } catch (e) {
      toast.error(extractApiError(e).message)
    } finally {
      setMaterialUploading(false)
    }
  }

  function onMaterialInputChange(e: ChangeEvent<HTMLInputElement>) {
    const list = e.target.files
    if (!list || list.length === 0) return
    void uploadMaterials(Array.from(list))
    e.target.value = ''
  }

  function onDropMaterials(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    setDropActive(false)
    const files = Array.from(e.dataTransfer.files ?? [])
    if (files.length > 0) void uploadMaterials(files)
  }

  async function confirmDeleteMaterial() {
    if (deleteMaterialId == null) return
    setDeletingMaterial(true)
    try {
      await materialsApi.delete(courseId, deleteMaterialId)
      await Promise.all([reloadMaterials(), reloadCourse()])
      toast.success('Material removed')
      setDeleteMaterialId(null)
    } catch (e) {
      toast.error(extractApiError(e).message)
    } finally {
      setDeletingMaterial(false)
    }
  }

  async function submitComment(e: FormEvent) {
    e.preventDefault()
    const author = authorName.trim()
    const content = commentText.trim()
    if (!author || !content) {
      toast.error('Both name and comment are required')
      return
    }
    setCommentSubmitting(true)
    try {
      localStorage.setItem(AUTHOR_KEY, author)
      await commentsApi.create(courseId, { authorName: author, content })
      setCommentText('')
      await Promise.all([reloadComments(), reloadCourse()])
      toast.success('Comment posted')
    } catch (e) {
      toast.error(extractApiError(e).message)
    } finally {
      setCommentSubmitting(false)
    }
  }

  async function confirmDeleteComment() {
    if (deleteCommentId == null) return
    setDeletingComment(true)
    try {
      await commentsApi.delete(deleteCommentId)
      await Promise.all([reloadComments(), reloadCourse()])
      toast.success('Comment deleted')
      setDeleteCommentId(null)
    } catch (e) {
      toast.error(extractApiError(e).message)
    } finally {
      setDeletingComment(false)
    }
  }

  if (loading) return <div className="loading">Loading course…</div>
  if (error || !course) {
    return (
      <div className="error-state">
        {error ?? 'Course not found.'}{' '}
        <Link to="/courses">Back to courses</Link>
      </div>
    )
  }

  const coverSrc = course.coverImageUrl
    ? `${apiUrl(course.coverImageUrl)}${coverBust ? `?v=${coverBust}` : ''}`
    : null

  return (
    <>
      <div className="detail-grid">
        <div>
          <div className="card">
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '1rem',
                marginBottom: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <Link
                  to="/courses"
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  ← All courses
                </Link>
                <h2 style={{ margin: '0.4rem 0 0.2rem', fontSize: '1.4rem' }}>
                  {course.name}
                </h2>
                <div
                  style={{
                    color: 'var(--color-text-muted)',
                    fontSize: '0.9rem',
                  }}
                >
                  <strong style={{ color: 'var(--color-primary)' }}>
                    {course.courseCode}
                  </strong>{' '}
                  · {course.credits} credit{course.credits === 1 ? '' : 's'}
                </div>
              </div>
              <LikeButton
                liked={course.likedByMe}
                count={course.likeCount}
                onToggle={toggleCourseLike}
              />
            </div>

            <div className="cover">
              {coverSrc ? (
                <img src={coverSrc} alt={`${course.name} cover`} />
              ) : (
                <div className="cover__placeholder">
                  No cover image — add one to give the course a face
                </div>
              )}
              <div className="cover__actions">
                <input
                  type="file"
                  accept="image/*"
                  ref={coverFileRef}
                  onChange={onCoverChange}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="btn btn--sm"
                  onClick={() => coverFileRef.current?.click()}
                  disabled={coverUploading}
                >
                  {coverUploading
                    ? 'Uploading…'
                    : course.hasCoverImage
                      ? 'Change cover'
                      : 'Upload cover'}
                </button>
                {course.hasCoverImage ? (
                  <button
                    type="button"
                    className="btn btn--sm"
                    onClick={clearCover}
                    disabled={coverUploading}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </div>

            {course.description?.trim() ? (
              <p
                style={{
                  margin: '0 0 0.5rem',
                  color: 'var(--color-text-muted)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {course.description}
              </p>
            ) : null}
          </div>

          <div className="card">
            <div className="section-header">
              <div>
                <h2>Materials</h2>
                <p>
                  Upload PDFs, slides, or any file students need for this
                  course.
                </p>
              </div>
              <input
                type="file"
                multiple
                ref={materialFileRef}
                onChange={onMaterialInputChange}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => materialFileRef.current?.click()}
                disabled={materialUploading}
              >
                {materialUploading ? 'Uploading…' : '+ Add files'}
              </button>
            </div>

            <label
              className={
                dropActive ? 'dropzone dropzone--active' : 'dropzone'
              }
              onDragOver={(e) => {
                e.preventDefault()
                setDropActive(true)
              }}
              onDragLeave={() => setDropActive(false)}
              onDrop={onDropMaterials}
            >
              <strong>Drop files here</strong> or click <em>+ Add files</em>{' '}
              above. Up to 25&nbsp;MB per file.
            </label>

            {materials.length === 0 ? (
              <div className="empty-state" style={{ padding: '1.25rem' }}>
                <p>No materials uploaded yet.</p>
              </div>
            ) : (
              <div style={{ marginTop: '1rem' }}>
                {materials.map((m) => (
                  <div className="material-row" key={m.id}>
                    <div className="material-row__icon">
                      {extensionOf(m.originalFilename)}
                    </div>
                    <div className="material-row__meta">
                      <div className="material-row__name" title={m.originalFilename}>
                        {m.originalFilename}
                      </div>
                      <div className="material-row__sub">
                        {formatBytes(m.sizeBytes)} · uploaded{' '}
                        {formatRelative(m.uploadedAt)}
                      </div>
                    </div>
                    <div className="material-row__actions">
                      <a
                        className="btn btn--secondary btn--sm"
                        href={apiUrl(m.downloadUrl)}
                        download={m.originalFilename}
                      >
                        Download
                      </a>
                      <button
                        type="button"
                        className="btn btn--danger btn--sm"
                        onClick={() => setDeleteMaterialId(m.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="card">
            <div className="section-header">
              <div>
                <h2>Discussion</h2>
                <p>{course.commentCount} comment{course.commentCount === 1 ? '' : 's'}</p>
              </div>
            </div>

            <form onSubmit={submitComment} style={{ marginBottom: '1rem' }}>
              <div className="form-grid form-grid--single">
                <div className="form-field">
                  <label htmlFor="author">Your name</label>
                  <input
                    id="author"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="e.g. Alice"
                    maxLength={80}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="content">Comment</label>
                  <textarea
                    id="content"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Share your thoughts about this course…"
                    maxLength={2000}
                    required
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                  }}
                >
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={commentSubmitting}
                  >
                    {commentSubmitting ? 'Posting…' : 'Post comment'}
                  </button>
                </div>
              </div>
            </form>

            <div className="section-divider" />

            {commentsLoading ? (
              <div className="loading">Loading comments…</div>
            ) : comments.length === 0 ? (
              <div className="empty-state">
                <h3>Be the first to comment</h3>
                <p>Start the discussion above.</p>
              </div>
            ) : (
              <div>
                {comments.map((c) => (
                  <CommentItem
                    key={c.id}
                    comment={c}
                    onLikeToggle={() => toggleCommentLike(c)}
                    onDelete={() => setDeleteCommentId(c.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteMaterialId !== null}
        title="Delete material?"
        message="This file will be removed permanently."
        confirmLabel="Delete"
        destructive
        busy={deletingMaterial}
        onCancel={() =>
          deletingMaterial ? undefined : setDeleteMaterialId(null)
        }
        onConfirm={confirmDeleteMaterial}
      />

      <ConfirmDialog
        open={deleteCommentId !== null}
        title="Delete comment?"
        message="This will also remove all of its likes."
        confirmLabel="Delete"
        destructive
        busy={deletingComment}
        onCancel={() =>
          deletingComment ? undefined : setDeleteCommentId(null)
        }
        onConfirm={confirmDeleteComment}
      />

    </>
  )
}

function LikeButton({
  liked,
  count,
  onToggle,
  size = 'md',
}: {
  liked: boolean
  count: number
  onToggle: () => void
  size?: 'md' | 'sm'
}) {
  return (
    <button
      type="button"
      className={
        (liked ? 'like-btn like-btn--liked' : 'like-btn') +
        (size === 'sm' ? ' like-btn--sm' : '')
      }
      onClick={onToggle}
      aria-pressed={liked}
      title={liked ? 'Unlike' : 'Like'}
    >
      <svg
        viewBox="0 0 24 24"
        fill={liked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <span>{count}</span>
    </button>
  )
}

function CommentItem({
  comment,
  onLikeToggle,
  onDelete,
}: {
  comment: Comment
  onLikeToggle: () => void
  onDelete: () => void
}) {
  const initials = comment.authorName
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')

  return (
    <div className="comment">
      <div className="comment__avatar">{initials || '?'}</div>
      <div className="comment__body">
        <div className="comment__head">
          <span className="comment__author">{comment.authorName}</span>
          <span className="comment__time">
            {formatRelative(comment.createdAt)}
            {comment.updatedAt !== comment.createdAt ? ' · edited' : ''}
          </span>
        </div>
        <p className="comment__content">{comment.content}</p>
        <div className="comment__footer">
          <LikeButton
            liked={comment.likedByMe}
            count={comment.likeCount}
            onToggle={onLikeToggle}
            size="sm"
          />
          {comment.ownedByMe ? (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={onDelete}
            >
              Delete
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
