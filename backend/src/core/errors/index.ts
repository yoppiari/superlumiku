/**
 * Error Handling System - Main Export File
 *
 * Centralized exports for the comprehensive error handling system.
 * Import from this file to access all error handling functionality.
 */

// Base error class and types
export { BaseAppError } from './BaseAppError'
export type { IAppError, ErrorOptions } from './types'
export {
  ErrorSeverity,
  ErrorCategory,
  ErrorCode,
  type ErrorMetadata,
  type ErrorResponse,
  type ErrorLogEntry,
} from './types'

// Specialized error classes
export {
  // Validation errors
  ValidationError,
  InvalidInputError,
  MissingRequiredFieldError,

  // Authentication errors
  AuthenticationError,
  InvalidCredentialsError,
  TokenExpiredError,
  TokenInvalidError,

  // Authorization errors
  AuthorizationError,
  InsufficientPermissionsError,
  ResourceForbiddenError,

  // Not Found errors
  NotFoundError,
  ResourceNotFoundError,

  // Conflict errors
  ConflictError,
  DuplicateResourceError,

  // Rate limiting errors
  RateLimitError,
  QuotaExceededError,

  // Business logic errors
  InsufficientCreditsError,
  InsufficientQuotaError,
  OperationNotAllowedError,
  InvalidStateError,

  // Payment errors
  PaymentError,
  PaymentFailedError,
  PaymentVerificationError,

  // Database errors
  DatabaseError,
  DatabaseConnectionError,
  DatabaseQueryError,

  // External service errors
  ExternalServiceError,
  AIProviderError,
  PaymentGatewayError,
  ServiceUnavailableError,

  // Internal errors
  InternalError,
  ConfigurationError,
  UnhandledError,
} from './errors'

// Error handler and middleware
export {
  handleError,
  asyncHandler,
  globalErrorHandler,
  notFoundHandler,
  normalizeError,
  createErrorHandler,
} from './ErrorHandler'

// Error logger
export { ErrorLogger, errorLogger, type IMonitoringService } from './ErrorLogger'
