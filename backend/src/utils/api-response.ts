import { Context } from 'hono'
import { StatusCode } from 'hono/utils/http-status'

/**
 * Standard API response structure for success responses
 */
export interface ApiSuccessResponse<T = any> {
  success: true
  data?: T
  message?: string
  meta?: {
    total?: number
    page?: number
    limit?: number
    [key: string]: any
  }
}

/**
 * Standard API response structure for error responses
 */
export interface ApiErrorResponse {
  success: false
  error: {
    message: string
    code?: string
    details?: any
    field?: string
  }
}

/**
 * Union type for all API responses
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Send a standardized success response
 *
 * @param c - Hono context
 * @param data - Response data
 * @param message - Optional success message
 * @param statusCode - HTTP status code (default: 200)
 * @param meta - Optional metadata (pagination, etc.)
 * @returns JSON response
 *
 * @example
 * return sendSuccess(c, { balance: 100 })
 * return sendSuccess(c, users, 'Users retrieved', 200, { total: 50, page: 1 })
 */
export function sendSuccess<T = any>(
  c: Context,
  data?: T,
  message?: string,
  statusCode: StatusCode = 200,
  meta?: Record<string, any>
) {
  const response: ApiSuccessResponse<T> = {
    success: true,
  }

  if (data !== undefined) {
    response.data = data
  }

  if (message) {
    response.message = message
  }

  if (meta) {
    response.meta = meta
  }

  return c.json(response, statusCode)
}

/**
 * Send a standardized error response
 *
 * @param c - Hono context
 * @param message - Error message
 * @param statusCode - HTTP status code (default: 400)
 * @param code - Optional error code for client-side handling
 * @param details - Optional additional error details
 * @param field - Optional field name for validation errors
 * @returns JSON response
 *
 * @example
 * return sendError(c, 'Invalid credentials', 401)
 * return sendError(c, 'Validation failed', 400, 'VALIDATION_ERROR', { min: 8 }, 'password')
 */
export function sendError(
  c: Context,
  message: string,
  statusCode: StatusCode = 400,
  code?: string,
  details?: any,
  field?: string
) {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      message,
    },
  }

  if (code) {
    response.error.code = code
  }

  if (details !== undefined) {
    response.error.details = details
  }

  if (field) {
    response.error.field = field
  }

  return c.json(response, statusCode)
}

/**
 * HTTP status codes enum for better type safety
 */
export const HttpStatus = {
  OK: 200 as StatusCode,
  CREATED: 201 as StatusCode,
  NO_CONTENT: 204 as StatusCode,
  BAD_REQUEST: 400 as StatusCode,
  UNAUTHORIZED: 401 as StatusCode,
  FORBIDDEN: 403 as StatusCode,
  NOT_FOUND: 404 as StatusCode,
  CONFLICT: 409 as StatusCode,
  UNPROCESSABLE_ENTITY: 422 as StatusCode,
  TOO_MANY_REQUESTS: 429 as StatusCode,
  INTERNAL_SERVER_ERROR: 500 as StatusCode,
  SERVICE_UNAVAILABLE: 503 as StatusCode,
} as const

/**
 * Common error codes for consistent client-side error handling
 */
export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  INSUFFICIENT_QUOTA: 'INSUFFICIENT_QUOTA',
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode]
