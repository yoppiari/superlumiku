/**
 * Admin Authorization Middleware
 *
 * Enforces admin role requirements for protected endpoints.
 *
 * Usage:
 * ```typescript
 * app.get(
 *   '/admin/metrics',
 *   authMiddleware,      // First verify authentication
 *   adminMiddleware,     // Then verify admin role
 *   handler
 * )
 * ```
 *
 * Security:
 * - Must be used AFTER authMiddleware
 * - Checks user.role === 'admin'
 * - Returns 403 Forbidden if not admin
 * - Does not expose internal error details
 */

import { Context, Next } from 'hono'
import { AuthContext } from '../types/hono'

/**
 * Admin Authorization Middleware
 *
 * Verifies that the authenticated user has admin role.
 * Must be used after authMiddleware to ensure user context is available.
 *
 * @param c - Hono context with user information
 * @param next - Next middleware handler
 * @returns 403 Forbidden if user is not admin, otherwise calls next handler
 */
export const adminMiddleware = async (c: AuthContext, next: Next) => {
  // Get user from context (set by authMiddleware)
  const user = c.get('user')

  if (!user) {
    // This should not happen if authMiddleware is used correctly
    return c.json({ error: 'Unauthorized - User context not found' }, 401)
  }

  // Check if user has admin role
  if (user.role !== 'admin') {
    return c.json(
      {
        error: 'Forbidden',
        message: 'This endpoint requires admin privileges',
      },
      403
    )
  }

  // User is admin, continue to next handler
  await next()
}
