import axios, { AxiosError } from 'axios'
import type { ApiError } from '../types'

// In dev, requests go to "/api/v1/..." which Vite proxies to the Spring
// Boot backend on http://localhost:8081 (see vite.config.ts).
// In production, set VITE_API_BASE_URL to point at the deployed API.
const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export function extractApiError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    const data = error.response?.data as Partial<ApiError> | undefined
    return {
      status: error.response?.status ?? 0,
      message:
        data?.message ?? error.message ?? 'Unexpected error contacting the API',
      fieldErrors: data?.fieldErrors,
      error: data?.error,
      timestamp: data?.timestamp,
      path: data?.path,
    }
  }
  return {
    status: 0,
    message: error instanceof Error ? error.message : 'Unknown error',
  }
}
