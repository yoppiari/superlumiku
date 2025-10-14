/**
 * Frontend Error Messages
 *
 * User-friendly error messages for common error codes.
 * Provides consistent messaging across the application.
 */

import { ErrorCode } from './types'

export interface ErrorMessage {
  title: string
  message: string
  action?: string
}

/**
 * Error message mappings
 */
export const ERROR_MESSAGES: Record<ErrorCode, ErrorMessage> = {
  // Validation errors
  [ErrorCode.VALIDATION_ERROR]: {
    title: 'Validation Error',
    message: 'Please check your input and try again.',
    action: 'Review the highlighted fields and correct any errors.',
  },

  [ErrorCode.INVALID_INPUT]: {
    title: 'Invalid Input',
    message: 'The information you entered is not valid.',
    action: 'Please check your input and ensure it meets the requirements.',
  },

  // Authentication errors
  [ErrorCode.AUTHENTICATION_ERROR]: {
    title: 'Authentication Failed',
    message: 'We could not verify your identity.',
    action: 'Please log in again to continue.',
  },

  [ErrorCode.TOKEN_EXPIRED]: {
    title: 'Session Expired',
    message: 'Your session has expired for security reasons.',
    action: 'Please log in again to continue.',
  },

  [ErrorCode.SESSION_EXPIRED]: {
    title: 'Session Expired',
    message: 'Your session has expired.',
    action: 'Please log in again to continue.',
  },

  // Authorization errors
  [ErrorCode.AUTHORIZATION_ERROR]: {
    title: 'Access Denied',
    message: 'You do not have permission to perform this action.',
    action: 'Please contact support if you believe this is an error.',
  },

  [ErrorCode.INSUFFICIENT_PERMISSIONS]: {
    title: 'Insufficient Permissions',
    message: 'You do not have the required permissions.',
    action: 'Contact your administrator to request access.',
  },

  // Not found errors
  [ErrorCode.NOT_FOUND]: {
    title: 'Not Found',
    message: 'The item you are looking for could not be found.',
    action: 'It may have been removed or you may not have access to it.',
  },

  [ErrorCode.RESOURCE_NOT_FOUND]: {
    title: 'Resource Not Found',
    message: 'The resource you requested does not exist.',
    action: 'Please check the URL and try again.',
  },

  // Rate limiting
  [ErrorCode.RATE_LIMIT_EXCEEDED]: {
    title: 'Too Many Requests',
    message: 'You have made too many requests.',
    action: 'Please wait a moment before trying again.',
  },

  [ErrorCode.QUOTA_EXCEEDED]: {
    title: 'Quota Exceeded',
    message: 'You have exceeded your usage quota.',
    action: 'Please upgrade your plan or wait until your quota resets.',
  },

  // Business logic errors
  [ErrorCode.INSUFFICIENT_CREDITS]: {
    title: 'Insufficient Credits',
    message: 'You do not have enough credits for this action.',
    action: 'Please purchase more credits to continue.',
  },

  [ErrorCode.INSUFFICIENT_QUOTA]: {
    title: 'Insufficient Quota',
    message: 'You have reached your usage limit.',
    action: 'Upgrade your plan for more capacity.',
  },

  // Payment errors
  [ErrorCode.PAYMENT_ERROR]: {
    title: 'Payment Error',
    message: 'There was a problem processing your payment.',
    action: 'Please check your payment details and try again.',
  },

  [ErrorCode.PAYMENT_FAILED]: {
    title: 'Payment Failed',
    message: 'Your payment could not be processed.',
    action: 'Please verify your payment method and try again.',
  },

  // External service errors
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: {
    title: 'Service Error',
    message: 'An external service is temporarily unavailable.',
    action: 'Please try again in a few moments.',
  },

  [ErrorCode.AI_PROVIDER_ERROR]: {
    title: 'AI Service Error',
    message: 'The AI service is temporarily unavailable.',
    action: 'Please try again in a few moments.',
  },

  [ErrorCode.SERVICE_UNAVAILABLE]: {
    title: 'Service Unavailable',
    message: 'This service is temporarily unavailable.',
    action: 'Please try again in a few minutes.',
  },

  // Network errors
  [ErrorCode.NETWORK_ERROR]: {
    title: 'Network Error',
    message: 'Unable to connect to the server.',
    action: 'Please check your internet connection and try again.',
  },

  [ErrorCode.TIMEOUT_ERROR]: {
    title: 'Request Timeout',
    message: 'The request took too long to complete.',
    action: 'Please try again.',
  },

  // Internal errors
  [ErrorCode.INTERNAL_ERROR]: {
    title: 'Internal Error',
    message: 'An unexpected error occurred on our end.',
    action: 'Please try again. If the problem persists, contact support.',
  },

  [ErrorCode.RENDERING_ERROR]: {
    title: 'Display Error',
    message: 'There was an error displaying this content.',
    action: 'Please refresh the page.',
  },

  [ErrorCode.UNKNOWN_ERROR]: {
    title: 'Unknown Error',
    message: 'An unexpected error occurred.',
    action: 'Please try again or contact support.',
  },
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(code: ErrorCode): ErrorMessage {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES[ErrorCode.UNKNOWN_ERROR]
}

/**
 * Format error message with custom details
 */
export function formatErrorMessage(code: ErrorCode, details?: Record<string, any>): string {
  const errorMessage = getErrorMessage(code)
  let message = errorMessage.message

  // Add specific details for certain error types
  if (details) {
    if (code === ErrorCode.INSUFFICIENT_CREDITS && details.required && details.available) {
      message += ` Required: ${details.required}, Available: ${details.available}`
    }

    if (details.field) {
      message += ` Field: ${details.field}`
    }
  }

  return message
}

/**
 * Get error action message
 */
export function getErrorAction(code: ErrorCode): string | undefined {
  return getErrorMessage(code).action
}
