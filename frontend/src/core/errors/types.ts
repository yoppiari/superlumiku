/**
 * Frontend Error Types and Interfaces
 *
 * Defines types for frontend error handling system.
 * Mirrors backend error structure for consistency.
 */

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * Error categories
 */
export enum ErrorCategory {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  RENDERING = 'RENDERING',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Standard error codes matching backend
 */
export enum ErrorCode {
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',

  // Authentication
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // Authorization
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Not Found
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',

  // Business Logic
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
  INSUFFICIENT_QUOTA = 'INSUFFICIENT_QUOTA',

  // Payment
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  PAYMENT_FAILED = 'PAYMENT_FAILED',

  // External Services
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  AI_PROVIDER_ERROR = 'AI_PROVIDER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // Network
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',

  // Internal
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RENDERING_ERROR = 'RENDERING_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Error metadata for context
 */
export interface ErrorMetadata {
  userId?: string
  requestId?: string
  path?: string
  component?: string
  action?: string
  statusCode?: number
  retryable?: boolean
  retryAfter?: number
  [key: string]: any
}

/**
 * Structured app error
 */
export interface AppError {
  code: ErrorCode
  message: string
  category: ErrorCategory
  severity: ErrorSeverity
  metadata: ErrorMetadata
  timestamp: Date
  stack?: string
}

/**
 * Error from API response
 */
export interface ApiErrorResponse {
  success: false
  error: {
    message: string
    code?: string
    statusCode?: number
    details?: any
    field?: string
    retryable?: boolean
    retryAfter?: number
  }
  timestamp?: string
  requestId?: string
}

/**
 * Error recovery strategy
 */
export interface ErrorRecoveryStrategy {
  canRecover: boolean
  action?: () => void | Promise<void>
  actionLabel?: string
}

/**
 * Error log entry
 */
export interface ErrorLogEntry {
  error: AppError
  userAgent: string
  url: string
  timestamp: string
  environment: string
}
