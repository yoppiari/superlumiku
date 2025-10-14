/**
 * Frontend Error Utility Functions
 *
 * Helper functions for working with errors in the frontend.
 */

import { AxiosError } from 'axios'
import { AppError } from './AppError'

/**
 * Extract user-friendly error message from various error types
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message
  }

  if (error instanceof AxiosError) {
    const data = error.response?.data as any
    return (
      data?.error?.message ||
      data?.message ||
      data?.error ||
      error.message ||
      'An unexpected error occurred'
    )
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
 * Parse error into AppError instance
 */
export function parseError(error: unknown): AppError {
  return AppError.fromUnknownError(error)
}

/**
 * Log error to console with context
 */
export function logError(error: unknown, context?: string): void {
  const appError = parseError(error)
  const prefix = context ? `[${context}]` : ''

  console.error(`${prefix} Error:`, {
    code: appError.code,
    message: appError.message,
    category: appError.category,
    severity: appError.severity,
    metadata: appError.metadata,
  })

  if (import.meta.env.DEV && appError.stack) {
    console.error('Stack:', appError.stack)
  }
}

/**
 * Handle API error with consistent formatting and logging
 */
export function handleApiError(error: unknown, context?: string): AppError {
  const appError = parseError(error)
  logError(appError, context)
  return appError
}

/**
 * Check if error is an authentication error (401/403)
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof AppError) {
    return (
      error.metadata.statusCode === 401 ||
      error.metadata.statusCode === 403 ||
      error.code === 'AUTHENTICATION_ERROR' ||
      error.code === 'TOKEN_EXPIRED' ||
      error.code === 'SESSION_EXPIRED'
    )
  }

  if (error instanceof AxiosError) {
    return error.response?.status === 401 || error.response?.status === 403
  }

  return false
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.code === 'NETWORK_ERROR' || error.category === 'NETWORK'
  }

  if (error instanceof AxiosError) {
    return !error.response && (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED')
  }

  return false
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isRetryable()
  }

  // Network errors are generally retryable
  return isNetworkError(error)
}

/**
 * Get retry delay for an error (in milliseconds)
 */
export function getRetryDelay(error: unknown): number {
  if (error instanceof AppError) {
    return error.getRetryDelay()
  }

  // Default retry delay
  return 3000
}

/**
 * Create error handler function
 */
export function createErrorHandler(
  defaultMessage: string = 'An error occurred'
): (error: unknown) => string {
  return (error: unknown): string => {
    const message = extractErrorMessage(error)
    return message || defaultMessage
  }
}

/**
 * Format error for display
 */
export function formatErrorForDisplay(error: unknown): {
  title: string
  message: string
  action?: string
} {
  const appError = parseError(error)
  const { getErrorMessage } = require('./errorMessages')

  return getErrorMessage(appError.code)
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    initialDelay?: number
    maxDelay?: number
    backoffMultiplier?: number
    onRetry?: (attempt: number, error: unknown) => void
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    onRetry,
  } = options

  let attempt = 0
  let delay = initialDelay

  while (attempt < maxRetries) {
    try {
      return await fn()
    } catch (error) {
      attempt++

      if (attempt >= maxRetries) {
        throw error
      }

      // Only retry if error is retryable
      if (!isRetryableError(error)) {
        throw error
      }

      // Call onRetry callback
      if (onRetry) {
        onRetry(attempt, error)
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay))

      // Increase delay for next attempt
      delay = Math.min(delay * backoffMultiplier, maxDelay)
    }
  }

  throw new Error('Max retries exceeded')
}

/**
 * Create promise with timeout
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError?: Error
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(timeoutError || new Error('Operation timed out')),
        timeoutMs
      )
    ),
  ])
}
