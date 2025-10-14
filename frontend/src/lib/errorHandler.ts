import { AxiosError } from 'axios'

export interface AppError {
  message: string
  code?: string
  statusCode?: number
}

/**
 * Extract error message from various error types
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return error.response?.data?.error || error.response?.data?.message || error.message || 'An unexpected error occurred'
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'An unexpected error occurred'
}

/**
 * Parse error into structured format
 */
export function parseError(error: unknown): AppError {
  if (error instanceof AxiosError) {
    return {
      message: error.response?.data?.error || error.response?.data?.message || error.message,
      code: error.response?.data?.code || error.code,
      statusCode: error.response?.status,
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    }
  }

  return {
    message: typeof error === 'string' ? error : 'An unexpected error occurred',
  }
}

/**
 * Log error to console (can be extended to send to error tracking service)
 */
export function logError(error: unknown, context?: string): void {
  const parsedError = parseError(error)
  console.error(`[Error${context ? ` - ${context}` : ''}]:`, parsedError)
}

/**
 * Handle API error with consistent formatting and logging
 */
export function handleApiError(error: unknown, context?: string): AppError {
  logError(error, context)
  return parseError(error)
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === 401 || error.response?.status === 403
  }
  return false
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return !error.response && error.code === 'ERR_NETWORK'
  }
  return false
}
