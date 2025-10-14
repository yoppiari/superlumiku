/**
 * Centralized Error Handler Middleware
 *
 * Provides comprehensive error handling for Hono applications:
 * - Converts all errors to BaseAppError instances
 * - Handles Zod validation errors
 * - Handles Prisma database errors
 * - Logs errors appropriately
 * - Returns consistent error responses
 * - Integrates with monitoring services
 */

import { Context } from 'hono'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { BaseAppError } from './BaseAppError'
import {
  ValidationError,
  DatabaseError,
  DatabaseConnectionError,
  DatabaseQueryError,
  DuplicateResourceError,
  NotFoundError,
  InternalError,
  UnhandledError,
} from './errors'
import { errorLogger } from './ErrorLogger'
import { ErrorMetadata } from './types'

/**
 * Extract request context from Hono context
 */
function extractRequestContext(c: Context): ErrorMetadata {
  return {
    requestId: c.get('requestId') || crypto.randomUUID(),
    userId: c.get('userId'),
    path: c.req.path,
    method: c.req.method,
  }
}

/**
 * Convert Zod validation error to ValidationError
 */
function handleZodError(error: ZodError, context: ErrorMetadata): BaseAppError {
  const validationErrors: Record<string, string[]> = {}

  error.errors.forEach((err) => {
    const field = err.path.join('.')
    if (!validationErrors[field]) {
      validationErrors[field] = []
    }
    validationErrors[field].push(err.message)
  })

  return ValidationError.forMultipleFields(validationErrors, context)
}

/**
 * Convert Prisma error to appropriate BaseAppError
 */
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError, context: ErrorMetadata): BaseAppError {
  switch (error.code) {
    // Unique constraint violation
    case 'P2002': {
      const target = error.meta?.target as string[] | undefined
      const field = target?.join(', ') || 'field'
      return new DuplicateResourceError('Record', field, {
        ...context,
        prismaCode: error.code,
        meta: error.meta,
      })
    }

    // Record not found
    case 'P2025':
      return new NotFoundError('Record not found', {
        ...context,
        prismaCode: error.code,
        meta: error.meta,
      })

    // Foreign key constraint violation
    case 'P2003':
      return new ValidationError('Related record not found', {
        ...context,
        prismaCode: error.code,
        meta: error.meta,
      })

    // Connection error
    case 'P1001':
    case 'P1002':
    case 'P1008':
      return new DatabaseConnectionError({
        ...context,
        prismaCode: error.code,
        meta: error.meta,
      })

    // Query error
    case 'P2000':
    case 'P2001':
    case 'P2010':
    case 'P2011':
    case 'P2012':
    case 'P2013':
    case 'P2014':
      return new DatabaseQueryError(
        'Database query failed',
        error,
        {
          ...context,
          prismaCode: error.code,
          meta: error.meta,
        }
      )

    // Generic database error
    default:
      return new DatabaseError(`Database operation failed: ${error.message}`, {
        ...context,
        prismaCode: error.code,
        meta: error.meta,
      })
  }
}

/**
 * Convert Prisma validation error to ValidationError
 */
function handlePrismaValidationError(
  error: Prisma.PrismaClientValidationError,
  context: ErrorMetadata
): BaseAppError {
  return new ValidationError('Invalid data provided to database', {
    ...context,
    details: error.message,
  })
}

/**
 * Convert any error to BaseAppError
 */
export function normalizeError(error: unknown, context: ErrorMetadata = {}): BaseAppError {
  // Already a BaseAppError
  if (error instanceof BaseAppError) {
    return error.withMetadata(context)
  }

  // Zod validation error
  if (error instanceof ZodError) {
    return handleZodError(error, context)
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error, context)
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return handlePrismaValidationError(error, context)
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new DatabaseConnectionError({
      ...context,
      details: error.message,
    })
  }

  // Standard Error
  if (error instanceof Error) {
    return new UnhandledError(error, context)
  }

  // Unknown error type
  return new InternalError('An unexpected error occurred', context)
}

/**
 * Main error handler for route handlers
 *
 * @example
 * app.get('/users', async (c) => {
 *   try {
 *     const users = await userService.getAll()
 *     return c.json({ users })
 *   } catch (error) {
 *     return handleError(c, error, 'Get Users')
 *   }
 * })
 */
export function handleError(
  c: Context,
  error: unknown,
  operationName?: string
): Response {
  // Extract request context
  const context = extractRequestContext(c)
  if (operationName) {
    context.operation = operationName
  }

  // Normalize error
  const normalizedError = normalizeError(error, context)

  // Log error
  errorLogger.logError(normalizedError, context)

  // Return error response
  const response = normalizedError.toJSON()

  return c.json(response, normalizedError.httpStatus)
}

/**
 * Async handler wrapper with automatic error handling
 *
 * @example
 * app.get('/users', asyncHandler(async (c) => {
 *   const users = await userService.getAll()
 *   return c.json({ users })
 * }, 'Get Users'))
 */
export function asyncHandler<T extends Context>(
  handler: (c: T) => Promise<Response>,
  operationName?: string
) {
  return async (c: T): Promise<Response> => {
    try {
      return await handler(c)
    } catch (error) {
      return handleError(c, error, operationName)
    }
  }
}

/**
 * Global error handler middleware for Hono
 *
 * This should be registered as the app's error handler:
 *
 * @example
 * app.onError(globalErrorHandler)
 */
export function globalErrorHandler(error: Error, c: Context): Response {
  console.error('Global error handler caught:', error)
  return handleError(c, error, 'Global Error Handler')
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(c: Context): Response {
  const error = new NotFoundError('Endpoint not found', {
    path: c.req.path,
    method: c.req.method,
  })

  return c.json(error.toJSON(), 404)
}

/**
 * Create error handler with custom logging
 */
export function createErrorHandler(
  customLogger?: (error: BaseAppError, context: ErrorMetadata) => void
) {
  return (c: Context, error: unknown, operationName?: string): Response => {
    const context = extractRequestContext(c)
    const normalizedError = normalizeError(error, context)

    // Use custom logger if provided
    if (customLogger) {
      customLogger(normalizedError, context)
    } else {
      errorLogger.logError(normalizedError, context)
    }

    return c.json(normalizedError.toJSON(), normalizedError.httpStatus)
  }
}
