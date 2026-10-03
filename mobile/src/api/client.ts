import axios, { AxiosError } from 'axios'

const baseURL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '')

if (!baseURL) {
  console.warn('EXPO_PUBLIC_API_URL is not set — copy mobile/.env.example to mobile/.env.')
}

// The website itself (for "View website" links) and its mobile API.
export const SITE_URL = baseURL ?? ''
export const API_URL = `${SITE_URL}/api/mobile`

// The token lives in SecureStore; AuthProvider mirrors it here so requests
// don't need an async SecureStore read each time.
let authToken: string | null = null
let onUnauthorized: (() => void) | null = null

export function setAuthToken(token: string | null) {
  authToken = token
}

export function getAuthToken() {
  return authToken
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

export const api = axios.create({ baseURL: API_URL, timeout: 20000 })

api.interceptors.request.use((config) => {
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // A 401 on anything but the login call means the token expired or the admin was removed.
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      onUnauthorized?.()
    }
    return Promise.reject(error)
  },
)

export type FieldErrors = Record<string, string[] | undefined>

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public fieldErrors?: FieldErrors,
  ) {
    super(message)
  }
}

// Normalises axios/network failures into one shape the UI can display.
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string; errors?: FieldErrors } | undefined
    if (data?.error) return new ApiError(data.error, error.response?.status, data.errors)
    if (!error.response) {
      return new ApiError('Cannot reach the server. Check your internet connection.')
    }
    return new ApiError(`Request failed (${error.response.status}).`, error.response.status)
  }
  return new ApiError(error instanceof Error ? error.message : 'Something went wrong.')
}
