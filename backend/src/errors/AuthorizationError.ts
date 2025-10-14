import { ResourceType } from '../services/authorization.service'

/**
 * Base Authorization Error
 *
 * Thrown when a user attempts to access a resource they don't own.
 * Use ResourceNotFoundError instead when you want to hide the existence of resources.
 */
export class AuthorizationError extends Error {
  public readonly statusCode: number = 403
  public readonly resourceType: ResourceType
  public readonly resourceId: string

  constructor(resourceType: ResourceType, resourceId: string, message?: string) {
    super(
      message ||
        `Access denied: You do not have permission to access this ${resourceType} (${resourceId})`
    )
    this.name = 'AuthorizationError'
    this.resourceType = resourceType
    this.resourceId = resourceId

    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthorizationError)
    }
  }

  toJSON() {
    return {
      error: 'Access Denied',
      message: this.message,
      resourceType: this.resourceType,
      statusCode: this.statusCode,
    }
  }
}

/**
 * Resource Not Found Error
 *
 * Thrown when a resource doesn't exist OR when we want to hide that it exists
 * from unauthorized users. This prevents information leakage.
 *
 * Security Best Practice:
 * - Return 404 instead of 403 when user doesn't own a resource
 * - Don't reveal whether the resource exists to unauthorized users
 * - Prevents enumeration attacks
 */
export class ResourceNotFoundError extends Error {
  public readonly statusCode: number = 404
  public readonly resourceType: ResourceType
  public readonly resourceId: string

  constructor(resourceType: ResourceType, resourceId: string, message?: string) {
    super(message || `${resourceType} not found`)
    this.name = 'ResourceNotFoundError'
    this.resourceType = resourceType
    this.resourceId = resourceId

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ResourceNotFoundError)
    }
  }

  toJSON() {
    return {
      error: 'Not Found',
      message: this.message,
      resourceType: this.resourceType,
      statusCode: this.statusCode,
    }
  }
}

/**
 * Error Handler Helper
 *
 * Converts authorization errors to appropriate HTTP responses.
 * Use this in route handlers to ensure consistent error responses.
 *
 * @example
 * ```typescript
 * try {
 *   await authService.verifyProjectOwnership(userId, projectId)
 *   // ... do stuff
 * } catch (error) {
 *   return handleAuthorizationError(c, error)
 * }
 * ```
 */
export function handleAuthorizationError(c: any, error: any): Response {
  if (error instanceof ResourceNotFoundError) {
    return c.json(
      {
        error: error.message,
      },
      404
    )
  }

  if (error instanceof AuthorizationError) {
    return c.json(
      {
        error: error.message,
      },
      403
    )
  }

  // Unknown error - log and return generic 500
  console.error('Unexpected error:', error)
  return c.json(
    {
      error: 'An unexpected error occurred',
    },
    500
  )
}

/**
 * Check if error is authorization-related
 */
export function isAuthorizationError(error: any): boolean {
  return error instanceof AuthorizationError || error instanceof ResourceNotFoundError
}
