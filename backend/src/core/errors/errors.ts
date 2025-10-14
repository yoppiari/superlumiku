/**
 * Comprehensive Error Class Hierarchy
 *
 * This file contains all specialized error classes organized by category.
 * Each error class is designed for specific scenarios with appropriate
 * HTTP status codes, error codes, and severity levels.
 */

import { BaseAppError } from './BaseAppError'
import { ErrorCode, ErrorCategory, ErrorSeverity, ErrorMetadata } from './types'

// ============================================================================
// VALIDATION ERRORS (400)
// ============================================================================

export class ValidationError extends BaseAppError {
  constructor(message: string, metadata: ErrorMetadata = {}) {
    super(
      message,
      400,
      ErrorCode.VALIDATION_ERROR,
      ErrorCategory.VALIDATION,
      ErrorSeverity.LOW,
      metadata
    )
  }

  static forField(field: string, message: string, metadata: ErrorMetadata = {}): ValidationError {
    return new ValidationError(message, { ...metadata, field })
  }

  static forMultipleFields(
    errors: Record<string, string[]>,
    metadata: ErrorMetadata = {}
  ): ValidationError {
    return new ValidationError('Validation failed', {
      ...metadata,
      validationErrors: errors,
    })
  }
}

export class InvalidInputError extends BaseAppError {
  constructor(message: string, metadata: ErrorMetadata = {}) {
    super(
      message,
      400,
      ErrorCode.INVALID_INPUT,
      ErrorCategory.VALIDATION,
      ErrorSeverity.LOW,
      metadata
    )
  }
}

export class MissingRequiredFieldError extends BaseAppError {
  constructor(fieldName: string, metadata: ErrorMetadata = {}) {
    super(
      `Required field missing: ${fieldName}`,
      400,
      ErrorCode.MISSING_REQUIRED_FIELD,
      ErrorCategory.VALIDATION,
      ErrorSeverity.LOW,
      { ...metadata, field: fieldName }
    )
  }
}

// ============================================================================
// AUTHENTICATION ERRORS (401)
// ============================================================================

export class AuthenticationError extends BaseAppError {
  constructor(message: string = 'Authentication failed', metadata: ErrorMetadata = {}) {
    super(
      message,
      401,
      ErrorCode.AUTHENTICATION_ERROR,
      ErrorCategory.AUTHENTICATION,
      ErrorSeverity.MEDIUM,
      metadata
    )
  }
}

export class InvalidCredentialsError extends BaseAppError {
  constructor(metadata: ErrorMetadata = {}) {
    super(
      'Invalid email or password',
      401,
      ErrorCode.INVALID_CREDENTIALS,
      ErrorCategory.AUTHENTICATION,
      ErrorSeverity.MEDIUM,
      metadata
    )
  }
}

export class TokenExpiredError extends BaseAppError {
  constructor(metadata: ErrorMetadata = {}) {
    super(
      'Your session has expired. Please log in again.',
      401,
      ErrorCode.TOKEN_EXPIRED,
      ErrorCategory.AUTHENTICATION,
      ErrorSeverity.LOW,
      metadata
    )
  }
}

export class TokenInvalidError extends BaseAppError {
  constructor(metadata: ErrorMetadata = {}) {
    super(
      'Invalid authentication token',
      401,
      ErrorCode.TOKEN_INVALID,
      ErrorCategory.AUTHENTICATION,
      ErrorSeverity.MEDIUM,
      metadata
    )
  }
}

// ============================================================================
// AUTHORIZATION ERRORS (403)
// ============================================================================

export class AuthorizationError extends BaseAppError {
  constructor(message: string = 'Insufficient permissions', metadata: ErrorMetadata = {}) {
    super(
      message,
      403,
      ErrorCode.AUTHORIZATION_ERROR,
      ErrorCategory.AUTHORIZATION,
      ErrorSeverity.MEDIUM,
      metadata
    )
  }
}

export class InsufficientPermissionsError extends BaseAppError {
  constructor(requiredPermission?: string, metadata: ErrorMetadata = {}) {
    const message = requiredPermission
      ? `Insufficient permissions. Required: ${requiredPermission}`
      : 'Insufficient permissions'

    super(
      message,
      403,
      ErrorCode.INSUFFICIENT_PERMISSIONS,
      ErrorCategory.AUTHORIZATION,
      ErrorSeverity.MEDIUM,
      metadata
    )
  }
}

export class ResourceForbiddenError extends BaseAppError {
  constructor(resourceType: string, resourceId: string, metadata: ErrorMetadata = {}) {
    super(
      `Access denied to ${resourceType}`,
      403,
      ErrorCode.RESOURCE_FORBIDDEN,
      ErrorCategory.AUTHORIZATION,
      ErrorSeverity.MEDIUM,
      { ...metadata, resourceType, resourceId }
    )
  }
}

// ============================================================================
// NOT FOUND ERRORS (404)
// ============================================================================

export class NotFoundError extends BaseAppError {
  constructor(message: string = 'Resource not found', metadata: ErrorMetadata = {}) {
    super(message, 404, ErrorCode.NOT_FOUND, ErrorCategory.BUSINESS_LOGIC, ErrorSeverity.LOW, metadata)
  }
}

export class ResourceNotFoundError extends BaseAppError {
  constructor(resourceType: string, resourceId: string, metadata: ErrorMetadata = {}) {
    super(
      `${resourceType} not found`,
      404,
      ErrorCode.RESOURCE_NOT_FOUND,
      ErrorCategory.BUSINESS_LOGIC,
      ErrorSeverity.LOW,
      { ...metadata, resourceType, resourceId }
    )
  }
}

// ============================================================================
// CONFLICT ERRORS (409)
// ============================================================================

export class ConflictError extends BaseAppError {
  constructor(message: string, metadata: ErrorMetadata = {}) {
    super(message, 409, ErrorCode.CONFLICT, ErrorCategory.BUSINESS_LOGIC, ErrorSeverity.LOW, metadata)
  }
}

export class DuplicateResourceError extends BaseAppError {
  constructor(resourceType: string, field: string, metadata: ErrorMetadata = {}) {
    super(
      `A ${resourceType} with this ${field} already exists`,
      409,
      ErrorCode.DUPLICATE_RESOURCE,
      ErrorCategory.BUSINESS_LOGIC,
      ErrorSeverity.LOW,
      { ...metadata, resourceType, field }
    )
  }
}

// ============================================================================
// RATE LIMITING ERRORS (429)
// ============================================================================

export class RateLimitError extends BaseAppError {
  constructor(message: string = 'Too many requests', retryAfter?: number, metadata: ErrorMetadata = {}) {
    super(
      message,
      429,
      ErrorCode.RATE_LIMIT_EXCEEDED,
      ErrorCategory.RATE_LIMIT,
      ErrorSeverity.LOW,
      { ...metadata, retryable: true, retryAfter }
    )
  }
}

export class QuotaExceededError extends BaseAppError {
  constructor(quotaType: string, metadata: ErrorMetadata = {}) {
    super(
      `${quotaType} quota exceeded`,
      429,
      ErrorCode.QUOTA_EXCEEDED,
      ErrorCategory.RATE_LIMIT,
      ErrorSeverity.LOW,
      { ...metadata, quotaType }
    )
  }
}

// ============================================================================
// BUSINESS LOGIC ERRORS (400/422)
// ============================================================================

export class InsufficientCreditsError extends BaseAppError {
  constructor(required: number, available: number, metadata: ErrorMetadata = {}) {
    super(
      `Insufficient credits. Required: ${required}, Available: ${available}`,
      402,
      ErrorCode.INSUFFICIENT_CREDITS,
      ErrorCategory.BUSINESS_LOGIC,
      ErrorSeverity.LOW,
      { ...metadata, required, available }
    )
  }
}

export class InsufficientQuotaError extends BaseAppError {
  constructor(quotaType: string, metadata: ErrorMetadata = {}) {
    super(
      `Insufficient ${quotaType} quota`,
      403,
      ErrorCode.INSUFFICIENT_QUOTA,
      ErrorCategory.BUSINESS_LOGIC,
      ErrorSeverity.LOW,
      { ...metadata, quotaType }
    )
  }
}

export class OperationNotAllowedError extends BaseAppError {
  constructor(operation: string, reason: string, metadata: ErrorMetadata = {}) {
    super(
      `Operation not allowed: ${operation}. Reason: ${reason}`,
      403,
      ErrorCode.OPERATION_NOT_ALLOWED,
      ErrorCategory.BUSINESS_LOGIC,
      ErrorSeverity.LOW,
      { ...metadata, operation, reason }
    )
  }
}

export class InvalidStateError extends BaseAppError {
  constructor(currentState: string, expectedState: string, metadata: ErrorMetadata = {}) {
    super(
      `Invalid state transition. Current: ${currentState}, Expected: ${expectedState}`,
      400,
      ErrorCode.INVALID_STATE,
      ErrorCategory.BUSINESS_LOGIC,
      ErrorSeverity.LOW,
      { ...metadata, currentState, expectedState }
    )
  }
}

// ============================================================================
// PAYMENT ERRORS (400/402)
// ============================================================================

export class PaymentError extends BaseAppError {
  constructor(message: string, metadata: ErrorMetadata = {}) {
    super(
      message,
      402,
      ErrorCode.PAYMENT_ERROR,
      ErrorCategory.PAYMENT,
      ErrorSeverity.MEDIUM,
      metadata
    )
  }
}

export class PaymentFailedError extends BaseAppError {
  constructor(reason: string, metadata: ErrorMetadata = {}) {
    super(
      `Payment failed: ${reason}`,
      402,
      ErrorCode.PAYMENT_FAILED,
      ErrorCategory.PAYMENT,
      ErrorSeverity.MEDIUM,
      metadata
    )
  }
}

export class PaymentVerificationError extends BaseAppError {
  constructor(reason: string, metadata: ErrorMetadata = {}) {
    super(
      `Payment verification failed: ${reason}`,
      400,
      ErrorCode.PAYMENT_VERIFICATION_FAILED,
      ErrorCategory.PAYMENT,
      ErrorSeverity.CRITICAL,
      metadata
    )
  }
}

// ============================================================================
// DATABASE ERRORS (500)
// ============================================================================

export class DatabaseError extends BaseAppError {
  constructor(message: string, metadata: ErrorMetadata = {}) {
    super(
      message,
      500,
      ErrorCode.DATABASE_ERROR,
      ErrorCategory.DATABASE,
      ErrorSeverity.HIGH,
      metadata,
      false // Non-operational - programming error
    )
  }
}

export class DatabaseConnectionError extends BaseAppError {
  constructor(metadata: ErrorMetadata = {}) {
    super(
      'Database connection failed',
      503,
      ErrorCode.DATABASE_CONNECTION_ERROR,
      ErrorCategory.DATABASE,
      ErrorSeverity.CRITICAL,
      { ...metadata, retryable: true },
      false
    )
  }
}

export class DatabaseQueryError extends BaseAppError {
  constructor(query: string, cause: Error, metadata: ErrorMetadata = {}) {
    super(
      'Database query failed',
      500,
      ErrorCode.DATABASE_QUERY_ERROR,
      ErrorCategory.DATABASE,
      ErrorSeverity.HIGH,
      { ...metadata, query, cause },
      false
    )
  }
}

// ============================================================================
// EXTERNAL SERVICE ERRORS (502/503)
// ============================================================================

export class ExternalServiceError extends BaseAppError {
  constructor(serviceName: string, message: string, metadata: ErrorMetadata = {}) {
    super(
      `External service error (${serviceName}): ${message}`,
      502,
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      ErrorCategory.EXTERNAL_SERVICE,
      ErrorSeverity.HIGH,
      { ...metadata, serviceName, retryable: true }
    )
  }
}

export class AIProviderError extends BaseAppError {
  constructor(provider: string, message: string, metadata: ErrorMetadata = {}) {
    super(
      `AI provider error (${provider}): ${message}`,
      502,
      ErrorCode.AI_PROVIDER_ERROR,
      ErrorCategory.EXTERNAL_SERVICE,
      ErrorSeverity.HIGH,
      { ...metadata, provider, retryable: true }
    )
  }
}

export class PaymentGatewayError extends BaseAppError {
  constructor(gateway: string, message: string, metadata: ErrorMetadata = {}) {
    super(
      `Payment gateway error (${gateway}): ${message}`,
      502,
      ErrorCode.PAYMENT_GATEWAY_ERROR,
      ErrorCategory.EXTERNAL_SERVICE,
      ErrorSeverity.HIGH,
      { ...metadata, gateway, retryable: true }
    )
  }
}

export class ServiceUnavailableError extends BaseAppError {
  constructor(serviceName: string, retryAfter?: number, metadata: ErrorMetadata = {}) {
    super(
      `Service temporarily unavailable: ${serviceName}`,
      503,
      ErrorCode.SERVICE_UNAVAILABLE,
      ErrorCategory.EXTERNAL_SERVICE,
      ErrorSeverity.HIGH,
      { ...metadata, serviceName, retryable: true, retryAfter }
    )
  }
}

// ============================================================================
// INTERNAL ERRORS (500)
// ============================================================================

export class InternalError extends BaseAppError {
  constructor(message: string = 'An internal error occurred', metadata: ErrorMetadata = {}) {
    super(
      message,
      500,
      ErrorCode.INTERNAL_ERROR,
      ErrorCategory.INTERNAL,
      ErrorSeverity.HIGH,
      metadata,
      false
    )
  }
}

export class ConfigurationError extends BaseAppError {
  constructor(configKey: string, metadata: ErrorMetadata = {}) {
    super(
      `Configuration error: ${configKey}`,
      500,
      ErrorCode.CONFIGURATION_ERROR,
      ErrorCategory.INTERNAL,
      ErrorSeverity.CRITICAL,
      { ...metadata, configKey },
      false
    )
  }
}

export class UnhandledError extends BaseAppError {
  constructor(originalError: Error, metadata: ErrorMetadata = {}) {
    super(
      'An unexpected error occurred',
      500,
      ErrorCode.UNHANDLED_ERROR,
      ErrorCategory.UNKNOWN,
      ErrorSeverity.CRITICAL,
      { ...metadata, cause: originalError },
      false
    )
  }
}
