import axios, { AxiosError } from 'axios'
import type { ApiError } from '../types'

// In dev, requests go to "/api/v1/..." which Vite proxies to the Spring
// Boot backend on http://localhost:8081 (see vite.config.ts).
// In production, set VITE_API_BASE_URL to point at the deployed API.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

const CLIENT_ID_KEY = 'student-attendance-ui:client-id'

/**
 * Returns a stable per-browser identifier used by the API to track who
 * liked / commented (we have no auth). Generated lazily on first call
 * and persisted in localStorage so the same browser keeps the same id
 * across sessions.
 */
export function getClientId(): string {
  let id = localStorage.getItem(CLIENT_ID_KEY)
  if (!id) {
    id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `cid-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`
    localStorage.setItem(CLIENT_ID_KEY, id)
  }
  return id
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  config.headers = config.headers ?? {}
  config.headers['X-Client-Id'] = getClientId()
  return config
})

/**
 * Build a fully qualified URL for an API endpoint that returns a
 * binary resource (cover image, file download). Useful in <img src>.
 */
export function apiUrl(path: string): string {
  if (!path) return ''
  const base = API_BASE_URL.endsWith('/')
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL
  const tail = path.startsWith('/') ? path : `/${path}`
  return `${base}${tail}`
}

interface ApiErrorPayload {
  message?: string
  status?: number
  error?: string
  timestamp?: string
  path?: string
  // Spring Boot side returns "violations: [{ field, message }]"
  violations?: Array<{ field: string; message: string }>
  // Some controllers may use a "fieldErrors" map; support both shapes.
  fieldErrors?: Record<string, string>
}

export function extractApiError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    const data = (error.response?.data ?? {}) as ApiErrorPayload
    let fieldErrors: Record<string, string> | undefined = data.fieldErrors
    if (!fieldErrors && Array.isArray(data.violations)) {
      fieldErrors = {}
      for (const v of data.violations) {
        if (v?.field) fieldErrors[v.field] = v.message
      }
      if (Object.keys(fieldErrors).length === 0) fieldErrors = undefined
    }
    return {
      status: error.response?.status ?? 0,
      message:
        data.message ?? error.message ?? 'Unexpected error contacting the API',
      fieldErrors,
      error: data.error,
      timestamp: data.timestamp,
      path: data.path,
    }
  }
  return {
    status: 0,
    message: error instanceof Error ? error.message : 'Unknown error',
  }
}
