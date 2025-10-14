/**
 * User-Friendly Error Messages
 *
 * Centralized error message mapping for consistent, user-friendly error messages.
 * Supports internationalization (i18n) by providing message keys and default messages.
 */

import { ErrorCode } from './types'

/**
 * Error message with i18n support
 */
export interface ErrorMessage {
  key: string // i18n key
  defaultMessage: string // fallback message
  userMessage: string // user-friendly message
  actionableGuidance?: string // what the user should do
}

/**
 * Error message mapping
 * Maps error codes to user-friendly messages with actionable guidance
 */
export const ERROR_MESSAGES: Record<ErrorCode, ErrorMessage> = {
  // Validation errors
  [ErrorCode.VALIDATION_ERROR]: {
    key: 'error.validation.general',
    defaultMessage: 'Validation failed',
    userMessage: 'The information you provided is invalid. Please check your input and try again.',
    actionableGuidance: 'Review the highlighted fields and correct any errors.',
  },

  [ErrorCode.INVALID_INPUT]: {
    key: 'error.validation.invalidInput',
    defaultMessage: 'Invalid input',
    userMessage: 'The information you entered is not valid.',
    actionableGuidance: 'Please check your input and ensure it meets the requirements.',
  },

  [ErrorCode.MISSING_REQUIRED_FIELD]: {
    key: 'error.validation.missingField',
    defaultMessage: 'Required field missing',
    userMessage: 'A required field is missing.',
    actionableGuidance: 'Please fill in all required fields marked with an asterisk (*).',
  },

  [ErrorCode.INVALID_FORMAT]: {
    key: 'error.validation.invalidFormat',
    defaultMessage: 'Invalid format',
    userMessage: 'The format of your input is incorrect.',
    actionableGuidance: 'Please ensure your input matches the expected format.',
  },

  // Authentication errors
  [ErrorCode.AUTHENTICATION_ERROR]: {
    key: 'error.auth.general',
    defaultMessage: 'Authentication failed',
    userMessage: 'We could not verify your identity.',
    actionableGuidance: 'Please log in again to continue.',
  },

  [ErrorCode.INVALID_CREDENTIALS]: {
    key: 'error.auth.invalidCredentials',
    defaultMessage: 'Invalid credentials',
    userMessage: 'The email or password you entered is incorrect.',
    actionableGuidance: 'Please check your credentials and try again, or reset your password.',
  },

  [ErrorCode.TOKEN_EXPIRED]: {
    key: 'error.auth.tokenExpired',
    defaultMessage: 'Session expired',
    userMessage: 'Your session has expired for security reasons.',
    actionableGuidance: 'Please log in again to continue.',
  },

  [ErrorCode.TOKEN_INVALID]: {
    key: 'error.auth.tokenInvalid',
    defaultMessage: 'Invalid token',
    userMessage: 'Your authentication token is invalid.',
    actionableGuidance: 'Please log in again.',
  },

  [ErrorCode.SESSION_EXPIRED]: {
    key: 'error.auth.sessionExpired',
    defaultMessage: 'Session expired',
    userMessage: 'Your session has expired.',
    actionableGuidance: 'Please log in again to continue.',
  },

  // Authorization errors
  [ErrorCode.AUTHORIZATION_ERROR]: {
    key: 'error.auth.authorization',
    defaultMessage: 'Access denied',
    userMessage: 'You do not have permission to perform this action.',
    actionableGuidance: 'Please contact support if you believe this is an error.',
  },

  [ErrorCode.INSUFFICIENT_PERMISSIONS]: {
    key: 'error.auth.insufficientPermissions',
    defaultMessage: 'Insufficient permissions',
    userMessage: 'You do not have the required permissions for this action.',
    actionableGuidance: 'Contact your administrator to request access.',
  },

  [ErrorCode.ACCESS_DENIED]: {
    key: 'error.auth.accessDenied',
    defaultMessage: 'Access denied',
    userMessage: 'Access to this resource is denied.',
    actionableGuidance: 'Ensure you are logged in with the correct account.',
  },

  [ErrorCode.RESOURCE_FORBIDDEN]: {
    key: 'error.auth.resourceForbidden',
    defaultMessage: 'Resource forbidden',
    userMessage: 'You do not have access to this resource.',
    actionableGuidance: 'Contact support if you need access to this resource.',
  },

  // Resource errors
  [ErrorCode.NOT_FOUND]: {
    key: 'error.resource.notFound',
    defaultMessage: 'Not found',
    userMessage: 'The item you are looking for could not be found.',
    actionableGuidance: 'It may have been removed or you may not have access to it.',
  },

  [ErrorCode.RESOURCE_NOT_FOUND]: {
    key: 'error.resource.resourceNotFound',
    defaultMessage: 'Resource not found',
    userMessage: 'The resource you requested does not exist.',
    actionableGuidance: 'Please check the URL and try again.',
  },

  [ErrorCode.ENDPOINT_NOT_FOUND]: {
    key: 'error.resource.endpointNotFound',
    defaultMessage: 'Endpoint not found',
    userMessage: 'The page or endpoint you requested does not exist.',
    actionableGuidance: 'Please check the URL and try again.',
  },

  // Conflict errors
  [ErrorCode.CONFLICT]: {
    key: 'error.conflict.general',
    defaultMessage: 'Conflict',
    userMessage: 'There was a conflict with your request.',
    actionableGuidance: 'Please refresh the page and try again.',
  },

  [ErrorCode.DUPLICATE_RESOURCE]: {
    key: 'error.conflict.duplicate',
    defaultMessage: 'Already exists',
    userMessage: 'A record with this information already exists.',
    actionableGuidance: 'Please use a different value or update the existing record.',
  },

  [ErrorCode.VERSION_CONFLICT]: {
    key: 'error.conflict.version',
    defaultMessage: 'Version conflict',
    userMessage: 'This record has been modified by someone else.',
    actionableGuidance: 'Please refresh the page and try your changes again.',
  },

  // Rate limiting
  [ErrorCode.RATE_LIMIT_EXCEEDED]: {
    key: 'error.rateLimit.exceeded',
    defaultMessage: 'Too many requests',
    userMessage: 'You have made too many requests.',
    actionableGuidance: 'Please wait a moment before trying again.',
  },

  [ErrorCode.QUOTA_EXCEEDED]: {
    key: 'error.rateLimit.quotaExceeded',
    defaultMessage: 'Quota exceeded',
    userMessage: 'You have exceeded your usage quota.',
    actionableGuidance: 'Please upgrade your plan or wait until your quota resets.',
  },

  [ErrorCode.TOO_MANY_REQUESTS]: {
    key: 'error.rateLimit.tooMany',
    defaultMessage: 'Too many requests',
    userMessage: 'You are making requests too quickly.',
    actionableGuidance: 'Please slow down and try again in a moment.',
  },

  // Business logic errors
  [ErrorCode.INSUFFICIENT_CREDITS]: {
    key: 'error.business.insufficientCredits',
    defaultMessage: 'Insufficient credits',
    userMessage: 'You do not have enough credits for this action.',
    actionableGuidance: 'Please purchase more credits to continue.',
  },

  [ErrorCode.INSUFFICIENT_QUOTA]: {
    key: 'error.business.insufficientQuota',
    defaultMessage: 'Insufficient quota',
    userMessage: 'You have reached your usage limit.',
    actionableGuidance: 'Upgrade your plan for more capacity.',
  },

  [ErrorCode.OPERATION_NOT_ALLOWED]: {
    key: 'error.business.operationNotAllowed',
    defaultMessage: 'Operation not allowed',
    userMessage: 'This operation is not allowed in the current state.',
    actionableGuidance: 'Please check the requirements and try again.',
  },

  [ErrorCode.INVALID_STATE]: {
    key: 'error.business.invalidState',
    defaultMessage: 'Invalid state',
    userMessage: 'This action cannot be performed in the current state.',
    actionableGuidance: 'Please refresh the page and try again.',
  },

  [ErrorCode.BUSINESS_RULE_VIOLATION]: {
    key: 'error.business.ruleViolation',
    defaultMessage: 'Business rule violation',
    userMessage: 'This action violates a business rule.',
    actionableGuidance: 'Please review the requirements and try again.',
  },

  // Payment errors
  [ErrorCode.PAYMENT_ERROR]: {
    key: 'error.payment.general',
    defaultMessage: 'Payment error',
    userMessage: 'There was a problem processing your payment.',
    actionableGuidance: 'Please check your payment details and try again.',
  },

  [ErrorCode.PAYMENT_FAILED]: {
    key: 'error.payment.failed',
    defaultMessage: 'Payment failed',
    userMessage: 'Your payment could not be processed.',
    actionableGuidance: 'Please verify your payment method and try again.',
  },

  [ErrorCode.PAYMENT_VERIFICATION_FAILED]: {
    key: 'error.payment.verificationFailed',
    defaultMessage: 'Payment verification failed',
    userMessage: 'We could not verify your payment.',
    actionableGuidance: 'Please contact support for assistance.',
  },

  [ErrorCode.INVALID_PAYMENT_METHOD]: {
    key: 'error.payment.invalidMethod',
    defaultMessage: 'Invalid payment method',
    userMessage: 'The payment method is invalid or expired.',
    actionableGuidance: 'Please update your payment method and try again.',
  },

  // External service errors
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: {
    key: 'error.service.external',
    defaultMessage: 'External service error',
    userMessage: 'An external service is temporarily unavailable.',
    actionableGuidance: 'Please try again in a few moments.',
  },

  [ErrorCode.AI_PROVIDER_ERROR]: {
    key: 'error.service.aiProvider',
    defaultMessage: 'AI service error',
    userMessage: 'The AI service is temporarily unavailable.',
    actionableGuidance: 'Please try again in a few moments.',
  },

  [ErrorCode.PAYMENT_GATEWAY_ERROR]: {
    key: 'error.service.paymentGateway',
    defaultMessage: 'Payment gateway error',
    userMessage: 'The payment gateway is temporarily unavailable.',
    actionableGuidance: 'Please try again later or contact support.',
  },

  [ErrorCode.STORAGE_SERVICE_ERROR]: {
    key: 'error.service.storage',
    defaultMessage: 'Storage service error',
    userMessage: 'The storage service is temporarily unavailable.',
    actionableGuidance: 'Please try again in a few moments.',
  },

  [ErrorCode.THIRD_PARTY_API_ERROR]: {
    key: 'error.service.thirdPartyApi',
    defaultMessage: 'Third-party API error',
    userMessage: 'A third-party service is temporarily unavailable.',
    actionableGuidance: 'Please try again later.',
  },

  [ErrorCode.SERVICE_UNAVAILABLE]: {
    key: 'error.service.unavailable',
    defaultMessage: 'Service unavailable',
    userMessage: 'This service is temporarily unavailable.',
    actionableGuidance: 'Please try again in a few minutes.',
  },

  // Database errors
  [ErrorCode.DATABASE_ERROR]: {
    key: 'error.database.general',
    defaultMessage: 'Database error',
    userMessage: 'A database error occurred.',
    actionableGuidance: 'Please try again or contact support if the problem persists.',
  },

  [ErrorCode.DATABASE_CONNECTION_ERROR]: {
    key: 'error.database.connection',
    defaultMessage: 'Database connection error',
    userMessage: 'Could not connect to the database.',
    actionableGuidance: 'Please try again in a moment.',
  },

  [ErrorCode.DATABASE_QUERY_ERROR]: {
    key: 'error.database.query',
    defaultMessage: 'Database query error',
    userMessage: 'A database query failed.',
    actionableGuidance: 'Please try again or contact support.',
  },

  [ErrorCode.DATABASE_CONSTRAINT_ERROR]: {
    key: 'error.database.constraint',
    defaultMessage: 'Database constraint error',
    userMessage: 'This operation violates a database constraint.',
    actionableGuidance: 'Please check your data and try again.',
  },

  // Internal errors
  [ErrorCode.INTERNAL_ERROR]: {
    key: 'error.internal.general',
    defaultMessage: 'Internal server error',
    userMessage: 'An unexpected error occurred on our end.',
    actionableGuidance: 'Please try again. If the problem persists, contact support.',
  },

  [ErrorCode.UNHANDLED_ERROR]: {
    key: 'error.internal.unhandled',
    defaultMessage: 'Unhandled error',
    userMessage: 'An unexpected error occurred.',
    actionableGuidance: 'Please try again or contact support.',
  },

  [ErrorCode.CONFIGURATION_ERROR]: {
    key: 'error.internal.configuration',
    defaultMessage: 'Configuration error',
    userMessage: 'The service is not configured correctly.',
    actionableGuidance: 'Please contact support.',
  },
}

/**
 * Get user-friendly error message for an error code
 */
export function getUserMessage(code: ErrorCode, context?: Record<string, any>): string {
  const message = ERROR_MESSAGES[code]
  if (!message) {
    return ERROR_MESSAGES[ErrorCode.INTERNAL_ERROR].userMessage
  }

  // In the future, this can be enhanced to:
  // 1. Interpolate context variables into the message
  // 2. Fetch translations from i18n service
  // 3. Apply locale-specific formatting

  return message.userMessage
}

/**
 * Get actionable guidance for an error code
 */
export function getActionableGuidance(code: ErrorCode): string | undefined {
  return ERROR_MESSAGES[code]?.actionableGuidance
}

/**
 * Get i18n key for an error code
 */
export function getI18nKey(code: ErrorCode): string {
  return ERROR_MESSAGES[code]?.key || 'error.unknown'
}

/**
 * Format error message with context
 *
 * @example
 * formatErrorMessage(ErrorCode.INSUFFICIENT_CREDITS, { required: 100, available: 50 })
 * // Returns: "You do not have enough credits for this action. Required: 100, Available: 50"
 */
export function formatErrorMessage(code: ErrorCode, context?: Record<string, any>): string {
  let message = getUserMessage(code, context)

  // Add context details if available
  if (context) {
    const details: string[] = []

    if (context.required !== undefined && context.available !== undefined) {
      details.push(`Required: ${context.required}, Available: ${context.available}`)
    }

    if (context.field) {
      details.push(`Field: ${context.field}`)
    }

    if (details.length > 0) {
      message += ` ${details.join(', ')}`
    }
  }

  return message
}
