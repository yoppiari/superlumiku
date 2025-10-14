/**
 * JWT Secret Validation System
 *
 * This module provides secure validation and management of JWT secrets
 * following OWASP security best practices.
 *
 * Security Requirements:
 * - Production: MUST have strong JWT_SECRET (min 32 chars, entropy check)
 * - Development: Generates secure temporary secret with warnings
 * - Test: Allows test-specific secrets
 *
 * @module jwt-secret-validator
 */

import { createHmac, randomBytes } from 'crypto'
import { z } from 'zod'

/**
 * Environment types for JWT secret validation
 */
export type Environment = 'production' | 'development' | 'test'

/**
 * JWT secret validation result
 */
export interface JwtSecretValidationResult {
  secret: string
  isSecure: boolean
  warnings: string[]
  metadata: {
    length: number
    entropy: number
    source: 'env' | 'generated'
    environment: Environment
  }
}

/**
 * Configuration for JWT secret validation
 */
export interface JwtSecretValidatorConfig {
  environment: Environment
  secret?: string
  minLength: number
  minEntropy: number
  allowInsecureInDev: boolean
  allowGeneration: boolean
}

/**
 * Default configuration constants
 */
export const JWT_SECRET_CONSTANTS = {
  // OWASP recommends minimum 256 bits (32 bytes) for HMAC-SHA256
  MIN_LENGTH_PRODUCTION: 32,
  MIN_LENGTH_DEVELOPMENT: 16,
  MIN_LENGTH_TEST: 16,

  // Minimum Shannon entropy (bits per character)
  MIN_ENTROPY: 3.5,

  // Known weak/default secrets that should never be used
  BLACKLISTED_SECRETS: [
    'change-this-secret-key',
    'your-secret-key-here',
    'secret',
    'jwt-secret',
    'default-secret',
    'test-secret',
    'development-secret',
    '12345678',
    'password',
    'admin',
  ],
} as const

/**
 * Calculate Shannon entropy of a string
 * Higher entropy = more random/unpredictable
 *
 * @param str - String to analyze
 * @returns Entropy in bits per character
 */
function calculateEntropy(str: string): number {
  if (!str || str.length === 0) return 0

  const frequencies = new Map<string, number>()

  // Count character frequencies
  for (const char of str) {
    frequencies.set(char, (frequencies.get(char) || 0) + 1)
  }

  // Calculate Shannon entropy
  let entropy = 0
  const len = str.length

  // Convert iterator to array for TypeScript compatibility
  const counts = Array.from(frequencies.values())
  for (const count of counts) {
    const probability = count / len
    entropy -= probability * Math.log2(probability)
  }

  return entropy
}

/**
 * Generate a cryptographically secure random secret
 *
 * @param length - Length in bytes (will be hex encoded, so output is length*2 chars)
 * @returns Secure random hex string
 */
export function generateSecureSecret(length: number = 32): string {
  return randomBytes(length).toString('hex')
}

/**
 * Check if a secret is in the blacklist or matches common patterns
 *
 * @param secret - Secret to check
 * @returns true if secret is weak/blacklisted
 */
function isBlacklistedSecret(secret: string): boolean {
  const normalized = secret.toLowerCase().trim()

  // Check exact matches
  if (JWT_SECRET_CONSTANTS.BLACKLISTED_SECRETS.some(
    blocked => normalized === blocked || normalized.includes(blocked)
  )) {
    return true
  }

  // Check for common weak patterns
  const weakPatterns = [
    /^(secret|password|admin|test|dev|local)/i,
    /^[0-9]+$/,  // Only numbers
    /^[a-z]+$/i, // Only letters
    /^(.)\1{7,}/, // Repeating characters (8+ times)
  ]

  return weakPatterns.some(pattern => pattern.test(secret))
}

/**
 * Validate JWT secret strength and security
 *
 * @param config - Validation configuration
 * @returns Validation result with secret and metadata
 * @throws Error if validation fails in production
 */
export function validateJwtSecret(
  config: JwtSecretValidatorConfig
): JwtSecretValidationResult {
  const { environment, secret, minLength, minEntropy, allowInsecureInDev, allowGeneration } = config

  const warnings: string[] = []
  let finalSecret = secret || ''
  let source: 'env' | 'generated' = 'env'

  // Step 1: Check if secret is provided
  if (!finalSecret || finalSecret.trim() === '') {
    if (environment === 'production') {
      throw new Error(
        'CRITICAL SECURITY ERROR: JWT_SECRET environment variable is not set.\n' +
        'This is a P0 security vulnerability. Your application CANNOT start without a secure JWT secret.\n\n' +
        'To fix this:\n' +
        '1. Generate a secure secret: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"\n' +
        '2. Set JWT_SECRET environment variable with the generated secret\n' +
        '3. Never commit this secret to version control\n\n' +
        'See docs/JWT_SECRET_SETUP.md for detailed instructions.'
      )
    }

    if (allowGeneration && (environment === 'development' || environment === 'test')) {
      finalSecret = generateSecureSecret(32)
      source = 'generated'
      warnings.push(
        `JWT_SECRET not set. Generated temporary secret for ${environment} environment.`
      )
      warnings.push(
        'This secret will change on every restart. Set JWT_SECRET in .env for persistent sessions.'
      )
    } else {
      throw new Error(
        `JWT_SECRET is required but not set. Environment: ${environment}`
      )
    }
  }

  // Step 2: Validate secret length
  if (finalSecret.length < minLength) {
    const error = new Error(
      `JWT_SECRET is too short (${finalSecret.length} characters). ` +
      `Minimum required: ${minLength} characters for ${environment} environment.\n\n` +
      `Security Risk: Short secrets are vulnerable to brute force attacks.\n` +
      `Generate a secure secret with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
    )

    if (environment === 'production' || !allowInsecureInDev) {
      throw error
    }

    warnings.push(error.message)
  }

  // Step 3: Check if secret is blacklisted
  if (isBlacklistedSecret(finalSecret)) {
    const error = new Error(
      'JWT_SECRET is using a known weak or default value.\n' +
      'This is a CRITICAL security vulnerability. Attackers can easily guess this secret.\n\n' +
      'Generate a secure secret immediately with:\n' +
      'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    )

    if (environment === 'production') {
      throw error
    }

    warnings.push(error.message)
  }

  // Step 4: Calculate and validate entropy
  const entropy = calculateEntropy(finalSecret)

  if (entropy < minEntropy) {
    const error = new Error(
      `JWT_SECRET has insufficient entropy (${entropy.toFixed(2)} bits/char). ` +
      `Minimum required: ${minEntropy} bits/char.\n\n` +
      `Low entropy means your secret is predictable and weak.\n` +
      `Use a cryptographically secure random generator.`
    )

    if (environment === 'production' || !allowInsecureInDev) {
      throw error
    }

    warnings.push(error.message)
  }

  // Step 5: Determine if secret is secure
  const isSecure =
    finalSecret.length >= minLength &&
    entropy >= minEntropy &&
    !isBlacklistedSecret(finalSecret)

  return {
    secret: finalSecret,
    isSecure,
    warnings,
    metadata: {
      length: finalSecret.length,
      entropy: parseFloat(entropy.toFixed(2)),
      source,
      environment,
    },
  }
}

/**
 * Create a validator configuration from environment
 *
 * @param env - Node environment string
 * @param secret - JWT secret from environment variables
 * @returns Validator configuration
 */
export function createValidatorConfig(
  env: string = 'development',
  secret?: string
): JwtSecretValidatorConfig {
  const environment = normalizeEnvironment(env)

  return {
    environment,
    secret,
    minLength:
      environment === 'production'
        ? JWT_SECRET_CONSTANTS.MIN_LENGTH_PRODUCTION
        : environment === 'development'
        ? JWT_SECRET_CONSTANTS.MIN_LENGTH_DEVELOPMENT
        : JWT_SECRET_CONSTANTS.MIN_LENGTH_TEST,
    minEntropy: JWT_SECRET_CONSTANTS.MIN_ENTROPY,
    allowInsecureInDev: environment !== 'production',
    allowGeneration: environment === 'development' || environment === 'test',
  }
}

/**
 * Normalize environment string to supported type
 *
 * @param env - Environment string
 * @returns Normalized environment type
 */
function normalizeEnvironment(env: string): Environment {
  const normalized = env.toLowerCase().trim()

  if (normalized === 'production' || normalized === 'prod') {
    return 'production'
  }

  if (normalized === 'test' || normalized === 'testing') {
    return 'test'
  }

  return 'development'
}

/**
 * Log JWT secret validation status (without exposing the secret itself)
 *
 * @param result - Validation result
 */
export function logJwtSecretStatus(result: JwtSecretValidationResult): void {
  const { isSecure, warnings, metadata } = result
  const { environment, source, length, entropy } = metadata

  console.log('\n🔐 JWT Secret Configuration:')
  console.log(`   Environment: ${environment}`)
  console.log(`   Source: ${source === 'env' ? 'Environment Variable' : 'Auto-Generated (Temporary)'}`)
  console.log(`   Length: ${length} characters`)
  console.log(`   Entropy: ${entropy} bits/char`)
  console.log(`   Status: ${isSecure ? '✅ SECURE' : '⚠️  WEAK'}`)

  if (warnings.length > 0) {
    console.log('\n⚠️  Security Warnings:')
    warnings.forEach((warning, index) => {
      console.log(`   ${index + 1}. ${warning}`)
    })
  }

  if (environment === 'production' && isSecure) {
    console.log('\n✅ Production JWT secret is properly configured and secure.\n')
  } else if (environment === 'development' && source === 'generated') {
    console.log('\n💡 Tip: Set JWT_SECRET in .env for persistent sessions across restarts.\n')
  }
}

/**
 * Create a health check metadata object for JWT secret
 * Returns only non-sensitive metadata for monitoring
 *
 * @param result - Validation result
 * @returns Safe metadata for health checks
 */
export function getJwtSecretHealthMetadata(result: JwtSecretValidationResult) {
  return {
    isConfigured: true,
    isSecure: result.isSecure,
    source: result.metadata.source,
    environment: result.metadata.environment,
    length: result.metadata.length,
    entropy: result.metadata.entropy,
    hasWarnings: result.warnings.length > 0,
    warningCount: result.warnings.length,
    // Generate a fingerprint for change detection (without exposing secret)
    fingerprint: createHmac('sha256', 'lumiku-jwt-health-check')
      .update(result.secret)
      .digest('hex')
      .substring(0, 8),
  }
}

/**
 * Zod schema for JWT secret validation
 * Can be used for additional runtime validation
 */
export const jwtSecretSchema = z.string()
  .min(JWT_SECRET_CONSTANTS.MIN_LENGTH_DEVELOPMENT,
    'JWT secret must be at least 16 characters long')
  .refine(
    (secret) => !isBlacklistedSecret(secret),
    'JWT secret is using a known weak or default value'
  )
  .refine(
    (secret) => calculateEntropy(secret) >= JWT_SECRET_CONSTANTS.MIN_ENTROPY,
    `JWT secret must have sufficient entropy (min ${JWT_SECRET_CONSTANTS.MIN_ENTROPY} bits/char)`
  )
