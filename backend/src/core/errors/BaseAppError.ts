/**
 * Base Application Error Class
 *
 * All custom errors should extend this base class to ensure consistent
 * error structure, logging, and client responses across the application.
 */

import { StatusCode } from 'hono/utils/http-status'
import {
  IAppError,
  ErrorCode,
  ErrorCategory,
  ErrorSeverity,
  ErrorMetadata,
  ErrorResponse,
  ErrorLogEntry,
  ErrorOptions,
} from './types'

export class BaseAppError extends Error implements IAppError {
  public readonly httpStatus: StatusCode
  public readonly code: ErrorCode
  public readonly category: ErrorCategory
  public readonly severity: ErrorSeverity
  public readonly metadata: ErrorMetadata
  public readonly isOperational: boolean
  public readonly timestamp: string

  constructor(
    message: string,
    httpStatus: StatusCode = 500,
    code: ErrorCode = ErrorCode.INTERNAL_ERROR,
    category: ErrorCategory = ErrorCategory.INTERNAL,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    metadata: ErrorMetadata = {},
    isOperational: boolean = true
  ) {
    super(message)

    // Set prototype explicitly for proper instanceof checks
    Object.setPrototypeOf(this, new.target.prototype)

    this.name = this.constructor.name
    this.httpStatus = httpStatus
    this.code = code
    this.category = category
    this.severity = severity
    this.metadata = metadata
    this.isOperational = isOperational
    this.timestamp = new Date().toISOString()

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor)
  }

  /**
   * Convert error to JSON response for client
   * Filters out sensitive information
   */
  toJSON(): ErrorResponse {
    const response: ErrorResponse = {
      success: false,
      error: {
        message: this.message,
        code: this.code,
        statusCode: this.httpStatus,
      },
      timestamp: this.timestamp,
    }

    // Add requestId if available
    if (this.metadata.requestId) {
      response.requestId = this.metadata.requestId
    }

    // Add field for validation errors
    if (this.metadata.field) {
      response.error.field = this.metadata.field
    }

    // Add details for validation errors
    if (this.metadata.validationErrors) {
      response.error.details = this.metadata.validationErrors
    }

    // Add retry information
    if (this.metadata.retryable !== undefined) {
      response.error.retryable = this.metadata.retryable
    }

    if (this.metadata.retryAfter !== undefined) {
      response.error.retryAfter = this.metadata.retryAfter
    }

    return response
  }

  /**
   * Convert error to structured log entry
   * Includes all context for debugging
   */
  toLogEntry(): ErrorLogEntry {
    return {
      timestamp: this.timestamp,
      severity: this.severity,
      category: this.category,
      code: this.code,
      message: this.message,
      httpStatus: this.httpStatus,
      metadata: {
        ...this.metadata,
        stackTrace: this.stack,
      },
      environment: process.env.NODE_ENV || 'development',
      stackTrace: this.stack,
    }
  }

  /**
   * Create error with additional metadata
   */
  withMetadata(metadata: Partial<ErrorMetadata>): this {
    Object.assign(this.metadata, metadata)
    return this
  }

  /**
   * Set error as retryable
   */
  asRetryable(retryAfter?: number): this {
    this.metadata.retryable = true
    if (retryAfter !== undefined) {
      this.metadata.retryAfter = retryAfter
    }
    return this
  }

  /**
   * Set error as non-operational (programming error)
   */
  asNonOperational(): this {
    (this as any).isOperational = false
    return this
  }

  /**
   * Create error from options
   */
  static fromOptions(message: string, options: ErrorOptions = {}): BaseAppError {
    const error = new BaseAppError(
      message,
      options.httpStatus,
      options.code,
      options.category,
      options.severity,
      options.metadata,
      options.isOperational
    )

    if (options.cause) {
      error.metadata.cause = options.cause
      error.metadata.stackTrace = options.cause.stack
    }

    return error
  }
}
