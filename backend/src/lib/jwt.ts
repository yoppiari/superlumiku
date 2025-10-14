/**
 * JWT Token Management
 *
 * Handles JWT token signing and verification with support for:
 * - Secure token generation
 * - Token validation
 * - Future: Secret rotation support
 */

import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export interface JwtPayload {
  userId: string
  email: string
}

/**
 * Sign a JWT token with the current secret
 *
 * @param payload - Token payload containing user information
 * @returns Signed JWT token string
 */
export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions)
}

/**
 * Verify a JWT token
 *
 * This function supports secret rotation by attempting verification
 * with multiple secrets. Currently uses single secret, but architecture
 * is ready for rotation implementation.
 *
 * @param token - JWT token string to verify
 * @returns Decoded JWT payload
 * @throws Error if token is invalid or expired
 */
export const verifyToken = (token: string): JwtPayload => {
  // Primary secret verification
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload
  } catch (error) {
    // Future: Attempt verification with rotated secrets
    // This is where we would try JWT_SECRET_PREVIOUS if implementing rotation
    //
    // Example rotation strategy:
    // if (env.JWT_SECRET_PREVIOUS) {
    //   try {
    //     return jwt.verify(token, env.JWT_SECRET_PREVIOUS) as JwtPayload
    //   } catch (rotationError) {
    //     // Fall through to error
    //   }
    // }

    throw new Error('Invalid or expired token')
  }
}

/**
 * Verify token and check if it needs rotation
 *
 * Future enhancement: Returns both the payload and a flag indicating
 * whether the token should be rotated (signed with old secret).
 *
 * @param token - JWT token string to verify
 * @returns Payload and rotation status
 */
export const verifyTokenWithRotationCheck = (token: string): {
  payload: JwtPayload
  needsRotation: boolean
} => {
  // Currently no rotation, so needsRotation is always false
  const payload = verifyToken(token)

  return {
    payload,
    needsRotation: false,
  }

  // Future implementation:
  // 1. Try to verify with current secret -> needsRotation = false
  // 2. If fails, try previous secret -> needsRotation = true
  // 3. If both fail, throw error
  //
  // When needsRotation is true, the application should:
  // - Accept the token for this request
  // - Issue a new token signed with current secret
  // - Return new token in response header for client to update
}