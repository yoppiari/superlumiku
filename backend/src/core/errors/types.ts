/**
 * Centralized Error Types and Interfaces
 *
 * This file defines the core types and interfaces for the error handling system.
 * All custom errors extend from BaseAppError to ensure consistent structure.
 */

import { StatusCode } from 'hono/utils/http-status'

/**
 * Error severity levels for logging and monitoring
 */
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * Error categories for classification and routing
 */
export enum ErrorCategory {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  DATABASE = 'DATABASE',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  NETWORK = 'NETWORK',
  RATE_LIMIT = 'RATE_LIMIT',
  PAYMENT = 'PAYMENT',
  INTERNAL = 'INTERNAL',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Standard error codes for consistent client-side handling
 */
export enum ErrorCode {
  // Validation errors (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',

  // Authentication errors (401)
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // Authorization errors (403)
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ACCESS_DENIED = 'ACCESS_DENIED',
  RESOURCE_FORBIDDEN = 'RESOURCE_FORBIDDEN',

  // Resource errors (404)
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  ENDPOINT_NOT_FOUND = 'ENDPOINT_NOT_FOUND',

  // Conflict errors (409)
  CONFLICT = 'CONFLICT',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
  VERSION_CONFLICT = 'VERSION_CONFLICT',

  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

  // Business logic errors (400/422)
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
  INSUFFICIENT_QUOTA = 'INSUFFICIENT_QUOTA',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  INVALID_STATE = 'INVALID_STATE',
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',

  // Payment errors (400/402)
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_VERIFICATION_FAILED = 'PAYMENT_VERIFICATION_FAILED',
  INVALID_PAYMENT_METHOD = 'INVALID_PAYMENT_METHOD',

  // External service errors (502/503)
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  AI_PROVIDER_ERROR = 'AI_PROVIDER_ERROR',
  PAYMENT_GATEWAY_ERROR = 'PAYMENT_GATEWAY_ERROR',
  STORAGE_SERVICE_ERROR = 'STORAGE_SERVICE_ERROR',
  THIRD_PARTY_API_ERROR = 'THIRD_PARTY_API_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // Database errors (500)
  DATABASE_ERROR = 'DATABASE_ERROR',
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_ERROR = 'DATABASE_QUERY_ERROR',
  DATABASE_CONSTRAINT_ERROR = 'DATABASE_CONSTRAINT_ERROR',

  // Internal errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNHANDLED_ERROR = 'UNHANDLED_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
}

/**
 * Metadata for error context and debugging
 */
export interface ErrorMetadata {
  // Request context
  userId?: string
  requestId?: string
  path?: string
  method?: string

  // Resource context
  resourceType?: string
  resourceId?: string

  // Additional context
  field?: string
  validationErrors?: Record<string, string[]>
  retryable?: boolean
  retryAfter?: number

  // Technical details (not sent to client in production)
  stackTrace?: string
  cause?: Error
  query?: string

  // Custom metadata
  [key: string]: any
}

/**
 * Structured error log entry
 */
export interface ErrorLogEntry {
  timestamp: string
  severity: ErrorSeverity
  category: ErrorCategory
  code: ErrorCode
  message: string
  httpStatus: StatusCode
  metadata: ErrorMetadata
  environment: string
  stackTrace?: string
}

/**
 * Error response sent to client
 */
export interface ErrorResponse {
  success: false
  error: {
    message: string
    code: ErrorCode
    statusCode: StatusCode
    details?: any
    field?: string
    retryable?: boolean
    retryAfter?: number
  }
  timestamp: string
  requestId?: string
}

/**
 * Base interface for all application errors
 */
export interface IAppError extends Error {
  readonly name: string
  readonly message: string
  readonly httpStatus: StatusCode
  readonly code: ErrorCode
  readonly category: ErrorCategory
  readonly severity: ErrorSeverity
  readonly metadata: ErrorMetadata
  readonly isOperational: boolean

  toJSON(): ErrorResponse
  toLogEntry(): ErrorLogEntry
}

/**
 * Options for creating custom errors
 */
export interface ErrorOptions {
  code?: ErrorCode
  httpStatus?: StatusCode
  category?: ErrorCategory
  severity?: ErrorSeverity
  metadata?: ErrorMetadata
  cause?: Error
  isOperational?: boolean
}
