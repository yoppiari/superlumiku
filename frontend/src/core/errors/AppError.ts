/**
 * Frontend Application Error Class
 *
 * Provides structured error handling for the frontend application.
 */

import type { AppError as IAppError, ErrorMetadata } from './types'
import { ErrorCode, ErrorCategory, ErrorSeverity } from './types'
import { AxiosError } from 'axios'

export class AppError extends Error implements IAppError {
  public readonly code: ErrorCode
  public readonly category: ErrorCategory
  public readonly severity: ErrorSeverity
  public readonly metadata: ErrorMetadata
  public readonly timestamp: Date

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    metadata: ErrorMetadata = {}
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.category = category
    this.severity = severity
    this.metadata = metadata
    this.timestamp = new Date()

    // Maintain proper stack trace (Node.js only)
    if (typeof (Error as any).captureStackTrace === 'function') {
      (Error as any).captureStackTrace(this, AppError)
    }
  }

  /**
   * Create AppError from API error response
   */
  static fromApiError(error: AxiosError): AppError {
    const data = error.response?.data as any

    // Extract error code
    const code = data?.error?.code || ErrorCode.UNKNOWN_ERROR

    // Determine category based on status code
    const statusCode = error.response?.status || 500
    const category = AppError.getCategoryFromStatusCode(statusCode)

    // Determine severity
    const severity = AppError.getSeverityFromStatusCode(statusCode)

    // Extract message
    const message = data?.error?.message || error.message || 'An unexpected error occurred'

    // Build metadata
    const metadata: ErrorMetadata = {
      statusCode,
      path: error.config?.url,
      requestId: data?.requestId,
      retryable: data?.error?.retryable,
      retryAfter: data?.error?.retryAfter,
      details: data?.error?.details,
      field: data?.error?.field,
    }

    return new AppError(message, code as ErrorCode, category, severity, metadata)
  }

  /**
   * Create AppError from network error
   */
  static fromNetworkError(error: Error): AppError {
    return new AppError(
      'Network error. Please check your connection.',
      ErrorCode.NETWORK_ERROR,
      ErrorCategory.NETWORK,
      ErrorSeverity.MEDIUM,
      {
        originalError: error.message,
        retryable: true,
      }
    )
  }

  /**
   * Create AppError from rendering error
   */
  static fromRenderError(error: Error, componentName?: string): AppError {
    return new AppError(
      'A rendering error occurred',
      ErrorCode.RENDERING_ERROR,
      ErrorCategory.RENDERING,
      ErrorSeverity.HIGH,
      {
        component: componentName,
        originalError: error.message,
        stack: error.stack,
      }
    )
  }

  /**
   * Create AppError from unknown error
   */
  static fromUnknownError(error: unknown): AppError {
    if (error instanceof AppError) {
      return error
    }

    if (error instanceof AxiosError) {
      return AppError.fromApiError(error)
    }

    if (error instanceof Error) {
      // Check if it's a network error
      if ('code' in error && error.code === 'ERR_NETWORK') {
        return AppError.fromNetworkError(error)
      }

      return new AppError(
        error.message,
        ErrorCode.UNKNOWN_ERROR,
        ErrorCategory.UNKNOWN,
        ErrorSeverity.MEDIUM,
        {
          originalError: error.message,
          stack: error.stack,
        }
      )
    }

    return new AppError(
      'An unexpected error occurred',
      ErrorCode.UNKNOWN_ERROR,
      ErrorCategory.UNKNOWN,
      ErrorSeverity.MEDIUM,
      {
        originalError: String(error),
      }
    )
  }

  /**
   * Determine error category from HTTP status code
   */
  private static getCategoryFromStatusCode(statusCode: number): ErrorCategory {
    if (statusCode === 401) return ErrorCategory.AUTHENTICATION
    if (statusCode === 403) return ErrorCategory.AUTHORIZATION
    if (statusCode === 422 || statusCode === 400) return ErrorCategory.VALIDATION
    if (statusCode === 429) return ErrorCategory.BUSINESS_LOGIC
    if (statusCode >= 500) return ErrorCategory.EXTERNAL_SERVICE
    return ErrorCategory.UNKNOWN
  }

  /**
   * Determine error severity from HTTP status code
   */
  private static getSeverityFromStatusCode(statusCode: number): ErrorSeverity {
    if (statusCode >= 500) return ErrorSeverity.HIGH
    if (statusCode === 429) return ErrorSeverity.MEDIUM
    if (statusCode === 401 || statusCode === 403) return ErrorSeverity.MEDIUM
    return ErrorSeverity.LOW
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    return this.metadata.retryable === true || this.category === ErrorCategory.NETWORK
  }

  /**
   * Get retry delay in milliseconds
   */
  getRetryDelay(): number {
    if (this.metadata.retryAfter) {
      return this.metadata.retryAfter * 1000
    }

    // Default retry delays based on category
    switch (this.category) {
      case ErrorCategory.NETWORK:
        return 3000
      case ErrorCategory.EXTERNAL_SERVICE:
        return 5000
      default:
        return 0
    }
  }

  /**
   * Convert to log entry for sending to backend
   */
  toLogEntry() {
    return {
      error: {
        code: this.code,
        message: this.message,
        category: this.category,
        severity: this.severity,
        metadata: this.metadata,
        timestamp: this.timestamp,
        stack: this.stack,
      },
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: this.timestamp.toISOString(),
      environment: import.meta.env.MODE || 'development',
    }
  }
}
