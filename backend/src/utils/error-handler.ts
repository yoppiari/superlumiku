import { Context } from 'hono'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { sendError, HttpStatus, ErrorCode } from './api-response'
import { logger } from './logger'

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code?: string,
    public details?: any,
    public field?: string
  ) {
    super(message)
    this.name = 'AppError'
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Validation error - for input validation failures
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any, field?: string) {
    super(message, HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_ERROR, details, field)
    this.name = 'ValidationError'
  }
}

/**
 * Authentication error - for failed auth attempts
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, HttpStatus.UNAUTHORIZED, ErrorCode.AUTHENTICATION_ERROR)
    this.name = 'AuthenticationError'
  }
}

/**
 * Authorization error - for insufficient permissions
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, HttpStatus.FORBIDDEN, ErrorCode.AUTHORIZATION_ERROR)
    this.name = 'AuthorizationError'
  }
}

/**
 * Not found error - for resources that don't exist
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', resource?: string) {
    super(message, HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, resource ? { resource } : undefined)
    this.name = 'NotFoundError'
  }
}

/**
 * Conflict error - for conflicts like duplicate resources
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, HttpStatus.CONFLICT, ErrorCode.CONFLICT, details)
    this.name = 'ConflictError'
  }
}

/**
 * Centralized error handler for route handlers
 *
 * @param c - Hono context
 * @param error - Error object
 * @param operationName - Name of the operation for logging
 * @returns Standardized error response
 *
 * @example
 * try {
 *   // ... route logic
 * } catch (error) {
 *   return handleRouteError(c, error, 'Get Balance')
 * }
 */
export function handleRouteError(c: Context, error: unknown, operationName: string) {
  const userId = c.get('userId') || 'anonymous'
  const method = c.req.method
  const path = c.req.path

  // Handle AppError and its subclasses
  if (error instanceof AppError) {
    logger.warn(`[${operationName}] Application error`, {
      userId,
      method,
      path,
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      details: error.details,
    })

    return sendError(c, error.message, error.statusCode, error.code, error.details, error.field)
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const firstError = error.errors[0]
    const field = firstError.path.join('.')
    const message = firstError.message

    logger.warn(`[${operationName}] Validation error`, {
      userId,
      method,
      path,
      field,
      message,
      errors: error.errors,
    })

    return sendError(
      c,
      `Validation failed: ${message}`,
      HttpStatus.BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR,
      error.errors,
      field
    )
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    logger.error(`[${operationName}] Database error`, {
      userId,
      method,
      path,
      code: error.code,
      message: error.message,
      meta: error.meta,
    })

    // Unique constraint violation
    if (error.code === 'P2002') {
      const field = (error.meta?.target as string[])?.join(', ') || 'field'
      return sendError(
        c,
        `A record with this ${field} already exists`,
        HttpStatus.CONFLICT,
        ErrorCode.CONFLICT,
        { field }
      )
    }

    // Record not found
    if (error.code === 'P2025') {
      return sendError(
        c,
        'Record not found',
        HttpStatus.NOT_FOUND,
        ErrorCode.NOT_FOUND
      )
    }

    // Foreign key constraint violation
    if (error.code === 'P2003') {
      return sendError(
        c,
        'Related record not found',
        HttpStatus.BAD_REQUEST,
        ErrorCode.VALIDATION_ERROR
      )
    }

    // Generic database error
    return sendError(
      c,
      'Database operation failed',
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCode.INTERNAL_ERROR
    )
  }

  // Handle Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    logger.error(`[${operationName}] Database validation error`, {
      userId,
      method,
      path,
      message: error.message,
    })

    return sendError(
      c,
      'Invalid data provided',
      HttpStatus.BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR
    )
  }

  // Handle generic errors
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
  const errorStack = error instanceof Error ? error.stack : undefined

  logger.error(`[${operationName}] Unexpected error`, {
    userId,
    method,
    path,
    message: errorMessage,
    stack: errorStack,
    error: error,
  })

  return sendError(
    c,
    errorMessage,
    HttpStatus.INTERNAL_SERVER_ERROR,
    ErrorCode.INTERNAL_ERROR
  )
}

/**
 * Async route handler wrapper with automatic error handling
 *
 * @param handler - Route handler function
 * @param operationName - Name of the operation for logging
 * @returns Wrapped handler with error handling
 *
 * @example
 * router.get('/balance', authMiddleware, asyncHandler(async (c) => {
 *   const userId = c.get('userId')
 *   const balance = await creditService.getBalance(userId)
 *   return sendSuccess(c, { balance })
 * }, 'Get Balance'))
 */
export function asyncHandler<T extends Context>(
  handler: (c: T) => Promise<Response>,
  operationName: string
) {
  return async (c: T) => {
    try {
      return await handler(c)
    } catch (error) {
      return handleRouteError(c, error, operationName)
    }
  }
}
