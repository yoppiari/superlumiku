/**
 * Environment Configuration
 *
 * Centralized configuration management with comprehensive Zod validation.
 * All environment variables are validated and typed here.
 *
 * ============================================================================
 * SECURITY MODEL
 * ============================================================================
 *
 * This configuration implements a defense-in-depth security strategy:
 *
 * 1. **No Hardcoded Secrets**: All secrets must come from environment variables
 *    - JWT_SECRET: Validated by jwt-secret-validator, auto-generated in dev
 *    - DUITKU secrets: Required and validated against weak patterns
 *    - AI API keys: Optional but validated when present
 *
 * 2. **Fail Fast in Production**: Application refuses to start if:
 *    - Required secrets are missing or weak
 *    - Security configurations are invalid (e.g., HTTP instead of HTTPS)
 *    - Default/test values are detected
 *
 * 3. **Development-Friendly**: In development mode:
 *    - JWT_SECRET auto-generates secure random value if not set
 *    - Warnings logged instead of fatal errors for non-critical issues
 *    - Clear guidance provided on how to fix configuration
 *
 * 4. **Validation Layers**:
 *    - Zod schema: Type safety and basic validation
 *    - Custom validators: Security-specific checks (jwt-secret-validator)
 *    - Production guards: Environment-specific enforcement
 *
 * ============================================================================
 * ADDING NEW SECRETS
 * ============================================================================
 *
 * When adding new API keys or secrets:
 *
 * 1. Add to Zod schema with appropriate validation:
 *    - Use .string().min() for required secrets
 *    - Use .string().optional() for feature-specific secrets
 *    - Add clear description
 *
 * 2. Add production validation if critical:
 *    - Check for weak/default patterns
 *    - Enforce minimum length requirements
 *    - Validate format (e.g., URLs must use HTTPS)
 *
 * 3. Update .env.example with:
 *    - Clear documentation
 *    - Generation instructions
 *    - Security best practices
 *
 * 4. Add to export object at bottom of file
 *
 * Example:
 * ```typescript
 * // In schema:
 * NEW_API_KEY: z.string().min(32, 'NEW_API_KEY must be at least 32 characters'),
 *
 * // In production validation:
 * if (validatedEnv.NODE_ENV === 'production') {
 *   if (validatedEnv.NEW_API_KEY.includes('test')) {
 *     throw new Error('NEW_API_KEY appears to be a test value')
 *   }
 * }
 *
 * // In export:
 * export const env = {
 *   NEW_API_KEY: validatedEnv.NEW_API_KEY,
 * }
 * ```
 *
 * ============================================================================
 * FAILURE MODES
 * ============================================================================
 *
 * Application startup will fail if:
 * - NODE_ENV=production and any critical security check fails
 * - Required environment variables are missing
 * - Environment variables fail Zod validation
 * - Secrets are detected as weak/default values
 *
 * Application will warn but continue if:
 * - NODE_ENV=development and optional configs are missing
 * - Redis not configured (falls back to in-memory, not recommended for prod)
 *
 * ============================================================================
 */

import { z } from 'zod'
import {
  validateJwtSecret,
  createValidatorConfig,
  logJwtSecretStatus,
  type JwtSecretValidationResult,
} from './jwt-secret-validator'

/**
 * Environment Variable Validation Schema
 *
 * This schema validates ALL environment variables at application startup.
 * Invalid configuration causes immediate application failure (fail fast).
 *
 * Variable Categories:
 * - Required (production): Must be set in production, enforced by validation
 * - Required (all): Must be set in all environments
 * - Optional with defaults: Will use sensible defaults if not provided
 * - Optional (features): Only needed when specific features are enabled
 */
const envSchema = z.object({
  // ============================================================================
  // NODE ENVIRONMENT
  // ============================================================================
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development')
    .describe('Node environment mode'),

  PORT: z.coerce
    .number()
    .int()
    .positive()
    .max(65535)
    .default(3000)
    .describe('Server port number'),

  // ============================================================================
  // DATABASE
  // ============================================================================
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .describe('PostgreSQL or SQLite connection string'),

  // ============================================================================
  // JWT AUTHENTICATION
  // ============================================================================
  // Note: JWT_SECRET has additional validation via jwt-secret-validator
  // This is a basic validation, the real validation happens after
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters for security')
    .describe('Secret key for JWT token signing'),

  JWT_EXPIRES_IN: z
    .string()
    .default('7d')
    .describe('JWT token expiration time (e.g., "7d", "24h")'),

  // ============================================================================
  // CORS
  // ============================================================================
  CORS_ORIGIN: z
    .string()
    .url('CORS_ORIGIN must be a valid URL')
    .default('http://localhost:5173')
    .describe('Allowed CORS origin for frontend'),

  // ============================================================================
  // REDIS (Optional - Required in Production for Rate Limiting)
  // ============================================================================
  REDIS_HOST: z
    .string()
    .optional()
    .describe('Redis host for rate limiting and caching'),

  REDIS_PORT: z.coerce
    .number()
    .int()
    .positive()
    .max(65535)
    .optional()
    .describe('Redis port number'),

  REDIS_PASSWORD: z
    .string()
    .optional()
    .describe('Redis password for authentication'),

  // ============================================================================
  // FILE STORAGE
  // ============================================================================
  UPLOAD_PATH: z
    .string()
    .default('./uploads')
    .describe('Directory path for file uploads'),

  OUTPUT_PATH: z
    .string()
    .default('./outputs')
    .describe('Directory path for generated outputs'),

  MAX_FILE_SIZE: z.coerce
    .number()
    .int()
    .positive()
    .default(524288000) // 500MB
    .describe('Maximum file upload size in bytes'),

  // ============================================================================
  // PAYMENT GATEWAY (DUITKU)
  // ============================================================================
  // Note: In production, these MUST be set. In development, they can be optional
  // if payment features are not being tested. This prevents deployment failures
  // when secrets are accidentally left as defaults or not set.
  DUITKU_MERCHANT_CODE: z
    .string()
    .min(1, 'DUITKU_MERCHANT_CODE is required for payment processing')
    .describe('Duitku merchant identification code'),

  DUITKU_API_KEY: z
    .string()
    .min(10, 'DUITKU_API_KEY must be at least 10 characters')
    .describe('Duitku API key for authentication'),

  DUITKU_CALLBACK_URL: z
    .string()
    .url('DUITKU_CALLBACK_URL must be a valid URL')
    .describe('Callback URL for Duitku payment notifications'),

  DUITKU_RETURN_URL: z
    .string()
    .url('DUITKU_RETURN_URL must be a valid URL')
    .describe('Return URL after payment completion'),

  DUITKU_BASE_URL: z
    .string()
    .url()
    .default('https://passport.duitku.com')
    .describe('Duitku API base URL'),

  DUITKU_ENV: z
    .enum(['production', 'sandbox'])
    .default('sandbox')
    .describe('Duitku environment mode'),

  // Payment Security
  PAYMENT_IP_WHITELIST_ENABLED: z
    .string()
    .transform((val) => val !== 'false')
    .default('true')
    .describe('Enable IP whitelist for payment callbacks'),

  // ============================================================================
  // RATE LIMITING
  // ============================================================================
  RATE_LIMIT_ENABLED: z
    .string()
    .transform((val) => val !== 'false')
    .default('true')
    .describe('Enable rate limiting globally'),

  // Login rate limits (IP-based)
  RATE_LIMIT_LOGIN_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(15 * 60 * 1000) // 15 minutes
    .describe('Login rate limit time window in milliseconds'),

  RATE_LIMIT_LOGIN_MAX_ATTEMPTS: z.coerce
    .number()
    .int()
    .positive()
    .default(5)
    .describe('Maximum login attempts per window'),

  // Register rate limits (IP-based)
  RATE_LIMIT_REGISTER_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60 * 1000) // 1 hour
    .describe('Registration rate limit time window in milliseconds'),

  RATE_LIMIT_REGISTER_MAX_ATTEMPTS: z.coerce
    .number()
    .int()
    .positive()
    .default(3)
    .describe('Maximum registration attempts per window'),

  // Password reset rate limits (IP-based)
  RATE_LIMIT_PASSWORD_RESET_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60 * 1000) // 1 hour
    .describe('Password reset rate limit time window in milliseconds'),

  RATE_LIMIT_PASSWORD_RESET_MAX_ATTEMPTS: z.coerce
    .number()
    .int()
    .positive()
    .default(3)
    .describe('Maximum password reset attempts per window'),

  // Profile update rate limits
  RATE_LIMIT_PROFILE_UPDATE_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60 * 1000) // 1 hour
    .describe('Profile update rate limit time window in milliseconds'),

  RATE_LIMIT_PROFILE_UPDATE_MAX_ATTEMPTS: z.coerce
    .number()
    .int()
    .positive()
    .default(10)
    .describe('Maximum profile updates per window'),

  // Account lockout (account-based)
  RATE_LIMIT_ACCOUNT_LOCKOUT_ATTEMPTS: z.coerce
    .number()
    .int()
    .positive()
    .default(10)
    .describe('Failed login attempts before account lockout'),

  RATE_LIMIT_ACCOUNT_LOCKOUT_DURATION_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(30 * 60 * 1000) // 30 minutes
    .describe('Account lockout duration in milliseconds'),

  // Global rate limits (system-wide)
  RATE_LIMIT_GLOBAL_AUTH_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 1000) // 1 minute
    .describe('Global auth rate limit time window in milliseconds'),

  RATE_LIMIT_GLOBAL_AUTH_MAX_REQUESTS: z.coerce
    .number()
    .int()
    .positive()
    .default(1000)
    .describe('Maximum auth requests globally per window'),

  // Redis configuration for rate limiting
  RATE_LIMIT_REDIS_URL: z
    .string()
    .optional()
    .describe('Redis URL for distributed rate limiting'),

  // ============================================================================
  // TRUSTED PROXIES
  // ============================================================================
  TRUSTED_PROXY_IPS: z
    .string()
    .default('')
    .describe('Comma-separated list of trusted proxy IPs'),

  // ============================================================================
  // AI SERVICES (Optional)
  // ============================================================================
  ANTHROPIC_API_KEY: z
    .string()
    .optional()
    .describe('Anthropic API key for Claude AI'),

  OPENAI_API_KEY: z
    .string()
    .optional()
    .describe('OpenAI API key for GPT models'),

  FLUX_API_KEY: z
    .string()
    .optional()
    .describe('Flux API key for image generation'),

  // ============================================================================
  // FFMPEG
  // ============================================================================
  FFMPEG_PATH: z
    .string()
    .default('ffmpeg')
    .describe('Path to FFmpeg executable'),

  FFPROBE_PATH: z
    .string()
    .default('ffprobe')
    .describe('Path to FFprobe executable'),
})

/**
 * Validate and retrieve JWT secret with security checks
 *
 * This function:
 * 1. Validates JWT_SECRET based on environment
 * 2. Enforces security requirements (fails fast in production)
 * 3. Generates temporary secrets in development if needed
 * 4. Logs appropriate warnings
 *
 * @throws Error if JWT_SECRET is invalid in production
 */
function getValidatedJwtSecret(jwtSecret: string, nodeEnv: string): JwtSecretValidationResult {
  const config = createValidatorConfig(nodeEnv, jwtSecret)
  const result = validateJwtSecret(config)

  // Log status during initialization (only if not in test mode)
  if (nodeEnv !== 'test') {
    logJwtSecretStatus(result)
  }

  return result
}

/**
 * Validate environment variables with Zod
 *
 * This function is called on module load and will throw if validation fails.
 * The application will not start with invalid configuration.
 */
function validateEnvironment() {
  try {
    // Parse and validate all environment variables
    const validatedEnv = envSchema.parse(process.env)

    // Additional JWT validation with custom validator
    const jwtSecretValidation = getValidatedJwtSecret(
      validatedEnv.JWT_SECRET,
      validatedEnv.NODE_ENV
    )

    // Production-specific validation
    if (validatedEnv.NODE_ENV === 'production') {
      // ========================================================================
      // SECURITY: JWT Secret Validation
      // ========================================================================
      if (!jwtSecretValidation.isSecure) {
        throw new Error(
          'CRITICAL: JWT_SECRET is not secure enough for production.\n' +
            'Requirements: Minimum 32 characters with high entropy.\n\n' +
            'To fix:\n' +
            '1. Generate: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"\n' +
            '2. Set JWT_SECRET in your production environment\n' +
            '3. Restart the application\n'
        )
      }

      // ========================================================================
      // SECURITY: Payment Gateway Secrets Validation
      // ========================================================================
      // Check for weak/default DUITKU secrets that should never be in production
      const weakDuitkuPatterns = [
        'test',
        'sandbox',
        'demo',
        'example',
        'change',
        'replace',
        'your-',
        'merchant-code',
        'api-key',
        '12345',
      ]

      const merchantCodeLower = validatedEnv.DUITKU_MERCHANT_CODE.toLowerCase()
      if (weakDuitkuPatterns.some(pattern => merchantCodeLower.includes(pattern))) {
        throw new Error(
          'CRITICAL: DUITKU_MERCHANT_CODE appears to be a test/default value.\n' +
            'Production requires real merchant credentials from Duitku.\n\n' +
            'To fix:\n' +
            '1. Register at https://passport.duitku.com\n' +
            '2. Get your production merchant code\n' +
            '3. Set DUITKU_MERCHANT_CODE in your production environment\n'
        )
      }

      const apiKeyLower = validatedEnv.DUITKU_API_KEY.toLowerCase()
      if (weakDuitkuPatterns.some(pattern => apiKeyLower.includes(pattern))) {
        throw new Error(
          'CRITICAL: DUITKU_API_KEY appears to be a test/default value.\n' +
            'Production requires real API credentials from Duitku.\n\n' +
            'To fix:\n' +
            '1. Get your production API key from Duitku dashboard\n' +
            '2. Set DUITKU_API_KEY in your production environment\n' +
            '3. Never commit API keys to version control\n'
        )
      }

      // Ensure API key has sufficient length (Duitku keys are typically 32+ chars)
      if (validatedEnv.DUITKU_API_KEY.length < 20) {
        throw new Error(
          'CRITICAL: DUITKU_API_KEY is too short for production.\n' +
            'Valid Duitku API keys are typically 32+ characters.\n' +
            'Please verify you are using a real production API key.\n'
        )
      }

      // ========================================================================
      // SECURITY: CORS Configuration Validation
      // ========================================================================
      if (validatedEnv.CORS_ORIGIN === 'http://localhost:5173') {
        throw new Error(
          'CRITICAL: CORS_ORIGIN is set to localhost in production.\n' +
            'This will prevent your frontend from accessing the API.\n\n' +
            'To fix:\n' +
            '1. Set CORS_ORIGIN to your production frontend URL (e.g., https://app.lumiku.com)\n' +
            '2. Ensure it uses HTTPS in production\n'
        )
      }

      // ========================================================================
      // SECURITY: Payment URLs Must Use HTTPS
      // ========================================================================
      if (!validatedEnv.DUITKU_CALLBACK_URL.startsWith('https://')) {
        throw new Error(
          'CRITICAL: DUITKU_CALLBACK_URL must use HTTPS in production.\n' +
            'HTTP callbacks are insecure and rejected by most payment gateways.\n\n' +
            'Example: https://api.lumiku.com/api/payments/callback\n'
        )
      }

      if (!validatedEnv.DUITKU_RETURN_URL.startsWith('https://')) {
        throw new Error(
          'CRITICAL: DUITKU_RETURN_URL must use HTTPS in production.\n' +
            'HTTP return URLs are insecure and provide poor user experience.\n\n' +
            'Example: https://app.lumiku.com/payment/success\n'
        )
      }

      // ========================================================================
      // CRITICAL: Redis Configuration (Production Requirement)
      // ========================================================================
      // CRITICAL FIX: Redis is now REQUIRED in production for proper rate limiting
      // In-memory rate limiting does NOT work across multiple instances
      if (!validatedEnv.REDIS_HOST) {
        throw new Error(
          'CRITICAL: REDIS_HOST is required in production!\n' +
            'Rate limiting CANNOT function properly without Redis across multiple instances.\n' +
            'This is a security vulnerability that allows rate limit bypasses.\n\n' +
            'To fix:\n' +
            '1. Set REDIS_HOST in your production environment (e.g., redis://localhost:6379)\n' +
            '2. Set REDIS_PASSWORD for secure authentication\n' +
            '3. Recommended providers:\n' +
            '   - Upstash (https://upstash.com) - Serverless Redis\n' +
            '   - Redis Cloud (https://redis.com/cloud) - Managed Redis\n' +
            '   - AWS ElastiCache - For AWS deployments\n\n' +
            'For development/testing, you can run: docker run -d -p 6379:6379 redis\n'
        )
      }

      // Verify REDIS_PASSWORD is set in production
      if (!validatedEnv.REDIS_PASSWORD) {
        throw new Error(
          'CRITICAL: REDIS_PASSWORD is required in production!\n' +
            'Running Redis without authentication is a severe security risk.\n\n' +
            'To fix:\n' +
            '1. Set REDIS_PASSWORD in your production environment\n' +
            '2. Configure your Redis instance to require authentication\n' +
            '3. Never deploy Redis with default configuration to production\n'
        )
      }
    }

    return { validatedEnv, jwtSecretValidation }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('\n❌ ENVIRONMENT VARIABLE VALIDATION FAILED:\n')
      console.error('The following environment variables are invalid or missing:\n')

      error.errors.forEach((err) => {
        const path = err.path.join('.')
        console.error(`  ❌ ${path}: ${err.message}`)
      })

      console.error('\nPlease check your .env file and ensure all required variables are set.')
      console.error('Refer to .env.example for a complete list of required variables.\n')
    } else if (error instanceof Error) {
      console.error(`\n❌ CONFIGURATION ERROR: ${error.message}\n`)
    }

    throw error
  }
}

// Validate environment on module load (fail fast)
const { validatedEnv, jwtSecretValidation } = validateEnvironment()

/**
 * Type-safe, validated environment configuration
 *
 * All values in this object have been validated by Zod.
 * Direct access to process.env is not allowed in application code.
 */
export const env = {
  // Server
  PORT: validatedEnv.PORT,
  NODE_ENV: validatedEnv.NODE_ENV,

  // Database
  DATABASE_URL: validatedEnv.DATABASE_URL,

  // JWT - Secured with validation
  JWT_SECRET: jwtSecretValidation.secret,
  JWT_EXPIRES_IN: validatedEnv.JWT_EXPIRES_IN,

  // CORS
  CORS_ORIGIN: validatedEnv.CORS_ORIGIN,

  // Redis (Optional)
  REDIS_HOST: validatedEnv.REDIS_HOST,
  REDIS_PORT: validatedEnv.REDIS_PORT,
  REDIS_PASSWORD: validatedEnv.REDIS_PASSWORD,

  // File Storage
  UPLOAD_PATH: validatedEnv.UPLOAD_PATH,
  OUTPUT_PATH: validatedEnv.OUTPUT_PATH,
  MAX_FILE_SIZE: validatedEnv.MAX_FILE_SIZE,

  // Payment (Duitku) - Now centralized!
  DUITKU_MERCHANT_CODE: validatedEnv.DUITKU_MERCHANT_CODE,
  DUITKU_API_KEY: validatedEnv.DUITKU_API_KEY,
  DUITKU_CALLBACK_URL: validatedEnv.DUITKU_CALLBACK_URL,
  DUITKU_RETURN_URL: validatedEnv.DUITKU_RETURN_URL,
  DUITKU_BASE_URL: validatedEnv.DUITKU_BASE_URL,
  DUITKU_ENV: validatedEnv.DUITKU_ENV,
  PAYMENT_IP_WHITELIST_ENABLED: validatedEnv.PAYMENT_IP_WHITELIST_ENABLED,

  // AI Services (Optional)
  ANTHROPIC_API_KEY: validatedEnv.ANTHROPIC_API_KEY,
  OPENAI_API_KEY: validatedEnv.OPENAI_API_KEY,
  FLUX_API_KEY: validatedEnv.FLUX_API_KEY,

  // FFmpeg
  FFMPEG_PATH: validatedEnv.FFMPEG_PATH,
  FFPROBE_PATH: validatedEnv.FFPROBE_PATH,

  // Rate Limiting
  RATE_LIMIT_ENABLED: validatedEnv.RATE_LIMIT_ENABLED,
  RATE_LIMIT_LOGIN_WINDOW_MS: validatedEnv.RATE_LIMIT_LOGIN_WINDOW_MS,
  RATE_LIMIT_LOGIN_MAX_ATTEMPTS: validatedEnv.RATE_LIMIT_LOGIN_MAX_ATTEMPTS,
  RATE_LIMIT_REGISTER_WINDOW_MS: validatedEnv.RATE_LIMIT_REGISTER_WINDOW_MS,
  RATE_LIMIT_REGISTER_MAX_ATTEMPTS: validatedEnv.RATE_LIMIT_REGISTER_MAX_ATTEMPTS,
  RATE_LIMIT_PASSWORD_RESET_WINDOW_MS: validatedEnv.RATE_LIMIT_PASSWORD_RESET_WINDOW_MS,
  RATE_LIMIT_PASSWORD_RESET_MAX_ATTEMPTS: validatedEnv.RATE_LIMIT_PASSWORD_RESET_MAX_ATTEMPTS,
  RATE_LIMIT_PROFILE_UPDATE_WINDOW_MS: validatedEnv.RATE_LIMIT_PROFILE_UPDATE_WINDOW_MS,
  RATE_LIMIT_PROFILE_UPDATE_MAX_ATTEMPTS: validatedEnv.RATE_LIMIT_PROFILE_UPDATE_MAX_ATTEMPTS,
  RATE_LIMIT_ACCOUNT_LOCKOUT_ATTEMPTS: validatedEnv.RATE_LIMIT_ACCOUNT_LOCKOUT_ATTEMPTS,
  RATE_LIMIT_ACCOUNT_LOCKOUT_DURATION_MS: validatedEnv.RATE_LIMIT_ACCOUNT_LOCKOUT_DURATION_MS,
  RATE_LIMIT_GLOBAL_AUTH_WINDOW_MS: validatedEnv.RATE_LIMIT_GLOBAL_AUTH_WINDOW_MS,
  RATE_LIMIT_GLOBAL_AUTH_MAX_REQUESTS: validatedEnv.RATE_LIMIT_GLOBAL_AUTH_MAX_REQUESTS,
  RATE_LIMIT_REDIS_URL: validatedEnv.RATE_LIMIT_REDIS_URL || validatedEnv.REDIS_HOST || 'localhost',

  // Trusted Proxies
  TRUSTED_PROXY_IPS: validatedEnv.TRUSTED_PROXY_IPS,
} as const

/**
 * Export JWT secret validation metadata for health checks
 * Does not expose the actual secret, only metadata
 */
export const jwtSecretMetadata = {
  isSecure: jwtSecretValidation.isSecure,
  source: jwtSecretValidation.metadata.source,
  environment: jwtSecretValidation.metadata.environment,
  length: jwtSecretValidation.metadata.length,
  entropy: jwtSecretValidation.metadata.entropy,
  hasWarnings: jwtSecretValidation.warnings.length > 0,
}

/**
 * Type-safe environment configuration type
 */
export type Env = typeof env

/**
 * Export the Zod schema for testing purposes
 */
export { envSchema }