/**
 * Environment Variable Validation Tests
 *
 * These tests verify that the Zod validation schema correctly validates
 * all environment variables and fails appropriately for invalid configurations.
 *
 * Run with: bun test env.test.ts
 */

import { describe, test, expect } from 'bun:test'
import { envSchema } from '../env'
import { z } from 'zod'

describe('Environment Variable Validation', () => {
  // ============================================================================
  // VALID CONFIGURATIONS
  // ============================================================================

  test('Valid production configuration passes', () => {
    const validProdEnv = {
      NODE_ENV: 'production',
      PORT: '3000',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/lumiku',
      JWT_SECRET: 'a'.repeat(32), // 32 characters
      JWT_EXPIRES_IN: '7d',
      CORS_ORIGIN: 'https://app.superlumiku.com',
      REDIS_HOST: 'redis.example.com',
      REDIS_PORT: '6379',
      REDIS_PASSWORD: 'secure-password',
      UPLOAD_PATH: './uploads',
      OUTPUT_PATH: './outputs',
      MAX_FILE_SIZE: '524288000',
      DUITKU_MERCHANT_CODE: 'MERCHANT123',
      DUITKU_API_KEY: 'api-key-123456',
      DUITKU_CALLBACK_URL: 'https://api.superlumiku.com/api/payments/callback',
      DUITKU_RETURN_URL: 'https://app.superlumiku.com/payments/status',
      DUITKU_BASE_URL: 'https://passport.duitku.com',
      DUITKU_ENV: 'production',
      PAYMENT_IP_WHITELIST_ENABLED: 'true',
      RATE_LIMIT_ENABLED: 'true',
      RATE_LIMIT_LOGIN_WINDOW_MS: '900000',
      RATE_LIMIT_LOGIN_MAX_ATTEMPTS: '5',
      RATE_LIMIT_REGISTER_WINDOW_MS: '3600000',
      RATE_LIMIT_REGISTER_MAX_ATTEMPTS: '3',
      RATE_LIMIT_PASSWORD_RESET_WINDOW_MS: '3600000',
      RATE_LIMIT_PASSWORD_RESET_MAX_ATTEMPTS: '3',
      RATE_LIMIT_PROFILE_UPDATE_WINDOW_MS: '3600000',
      RATE_LIMIT_PROFILE_UPDATE_MAX_ATTEMPTS: '10',
      RATE_LIMIT_ACCOUNT_LOCKOUT_ATTEMPTS: '10',
      RATE_LIMIT_ACCOUNT_LOCKOUT_DURATION_MS: '1800000',
      RATE_LIMIT_GLOBAL_AUTH_WINDOW_MS: '60000',
      RATE_LIMIT_GLOBAL_AUTH_MAX_REQUESTS: '1000',
      TRUSTED_PROXY_IPS: '10.0.0.1,10.0.0.2',
      ANTHROPIC_API_KEY: 'sk-ant-api-key',
      FFMPEG_PATH: '/usr/bin/ffmpeg',
      FFPROBE_PATH: '/usr/bin/ffprobe',
    }

    expect(() => envSchema.parse(validProdEnv)).not.toThrow()
  })

  test('Valid development configuration passes', () => {
    const validDevEnv = {
      NODE_ENV: 'development',
      DATABASE_URL: 'file:./prisma/dev.db',
      JWT_SECRET: 'dev-secret-key-must-be-32-chars-long',
      CORS_ORIGIN: 'http://localhost:5173',
      DUITKU_MERCHANT_CODE: 'DEV-MERCHANT',
      DUITKU_API_KEY: 'dev-api-key',
      DUITKU_CALLBACK_URL: 'http://localhost:3000/api/payments/callback',
      DUITKU_RETURN_URL: 'http://localhost:5173/payments/status',
    }

    const result = envSchema.parse(validDevEnv)
    expect(result.NODE_ENV).toBe('development')
    expect(result.PORT).toBe(3000) // Default value
    expect(result.DUITKU_ENV).toBe('sandbox') // Default value
  })

  test('Minimal required configuration with defaults passes', () => {
    const minimalEnv = {
      DATABASE_URL: 'file:./prisma/dev.db',
      JWT_SECRET: 'a'.repeat(32),
      DUITKU_MERCHANT_CODE: 'MERCHANT',
      DUITKU_API_KEY: 'api-key-123',
      DUITKU_CALLBACK_URL: 'http://localhost:3000/callback',
      DUITKU_RETURN_URL: 'http://localhost:3000/return',
    }

    const result = envSchema.parse(minimalEnv)

    // Check defaults are applied
    expect(result.NODE_ENV).toBe('development')
    expect(result.PORT).toBe(3000)
    expect(result.CORS_ORIGIN).toBe('http://localhost:5173')
    expect(result.UPLOAD_PATH).toBe('./uploads')
    expect(result.OUTPUT_PATH).toBe('./outputs')
    expect(result.MAX_FILE_SIZE).toBe(524288000)
    expect(result.DUITKU_BASE_URL).toBe('https://passport.duitku.com')
    expect(result.DUITKU_ENV).toBe('sandbox')
    expect(result.RATE_LIMIT_ENABLED).toBe(true)
    expect(result.RATE_LIMIT_LOGIN_MAX_ATTEMPTS).toBe(5)
  })

  // ============================================================================
  // REQUIRED FIELDS VALIDATION
  // ============================================================================

  test('Missing DATABASE_URL fails', () => {
    const invalidEnv = {
      JWT_SECRET: 'a'.repeat(32),
      DUITKU_MERCHANT_CODE: 'MERCHANT',
      DUITKU_API_KEY: 'api-key-123',
      DUITKU_CALLBACK_URL: 'http://localhost:3000/callback',
      DUITKU_RETURN_URL: 'http://localhost:3000/return',
    }

    expect(() => envSchema.parse(invalidEnv)).toThrow()
  })

  test('Empty DATABASE_URL fails', () => {
    const invalidEnv = {
      DATABASE_URL: '',
      JWT_SECRET: 'a'.repeat(32),
      DUITKU_MERCHANT_CODE: 'MERCHANT',
      DUITKU_API_KEY: 'api-key-123',
      DUITKU_CALLBACK_URL: 'http://localhost:3000/callback',
      DUITKU_RETURN_URL: 'http://localhost:3000/return',
    }

    expect(() => envSchema.parse(invalidEnv)).toThrow(/DATABASE_URL/)
  })

  test('Missing JWT_SECRET fails', () => {
    const invalidEnv = {
      DATABASE_URL: 'file:./prisma/dev.db',
      DUITKU_MERCHANT_CODE: 'MERCHANT',
      DUITKU_API_KEY: 'api-key-123',
      DUITKU_CALLBACK_URL: 'http://localhost:3000/callback',
      DUITKU_RETURN_URL: 'http://localhost:3000/return',
    }

    expect(() => envSchema.parse(invalidEnv)).toThrow()
  })

  test('Short JWT_SECRET fails (less than 32 characters)', () => {
    const invalidEnv = {
      DATABASE_URL: 'file:./prisma/dev.db',
      JWT_SECRET: 'short', // Less than 32 chars
      DUITKU_MERCHANT_CODE: 'MERCHANT',
      DUITKU_API_KEY: 'api-key-123',
      DUITKU_CALLBACK_URL: 'http://localhost:3000/callback',
      DUITKU_RETURN_URL: 'http://localhost:3000/return',
    }

    expect(() => envSchema.parse(invalidEnv)).toThrow(/at least 32 characters/)
  })

  test('Missing DUITKU_MERCHANT_CODE fails', () => {
    const invalidEnv = {
      DATABASE_URL: 'file:./prisma/dev.db',
      JWT_SECRET: 'a'.repeat(32),
      DUITKU_API_KEY: 'api-key-123',
      DUITKU_CALLBACK_URL: 'http://localhost:3000/callback',
      DUITKU_RETURN_URL: 'http://localhost:3000/return',
    }

    expect(() => envSchema.parse(invalidEnv)).toThrow()
  })

  test('Missing DUITKU_API_KEY fails', () => {
    const invalidEnv = {
      DATABASE_URL: 'file:./prisma/dev.db',
      JWT_SECRET: 'a'.repeat(32),
      DUITKU_MERCHANT_CODE: 'MERCHANT',
      DUITKU_CALLBACK_URL: 'http://localhost:3000/callback',
      DUITKU_RETURN_URL: 'http://localhost:3000/return',
    }

    expect(() => envSchema.parse(invalidEnv)).toThrow()
  })

  test('Short DUITKU_API_KEY fails (less than 10 characters)', () => {
    const invalidEnv = {
      DATABASE_URL: 'file:./prisma/dev.db',
      JWT_SECRET: 'a'.repeat(32),
      DUITKU_MERCHANT_CODE: 'MERCHANT',
      DUITKU_API_KEY: 'short', // Less than 10 chars
      DUITKU_CALLBACK_URL: 'http://localhost:3000/callback',
      DUITKU_RETURN_URL: 'http://localhost:3000/return',
    }

    expect(() => envSchema.parse(invalidEnv)).toThrow(/at least 10 characters/)
  })

  test('Missing DUITKU_CALLBACK_URL fails', () => {
    const invalidEnv = {
      DATABASE_URL: 'file:./prisma/dev.db',
      JWT_SECRET: 'a'.repeat(32),
      DUITKU_MERCHANT_CODE: 'MERCHANT',
      DUITKU_API_KEY: 'api-key-123',
      DUITKU_RETURN_URL: 'http://localhost:3000/return',
    }

    expect(() => envSchema.parse(invalidEnv)).toThrow()
  })

  test('Missing DUITKU_RETURN_URL fails', () => {
    const invalidEnv = {
      DATABASE_URL: 'file:./prisma/dev.db',
      JWT_SECRET: 'a'.repeat(32),
      DUITKU_MERCHANT_CODE: 'MERCHANT',
      DUITKU_API_KEY: 'api-key-123',
      DUITKU_CALLBACK_URL: 'http://localhost:3000/callback',
    }

    expect(() => envSchema.parse(invalidEnv)).toThrow()
  })

  // ============================================================================
  // URL FORMAT VALIDATION
  // ============================================================================

  test('Invalid CORS_ORIGIN format fails', () => {
    const invalidEnv = {
      DATABASE_URL: 'file:./prisma/dev.db',
      JWT_SECRET: 'a'.repeat(32),
      CORS_ORIGIN: 'not-a-url', // Invalid URL
      DUITKU_MERCHANT_CODE: 'MERCHANT',
      DUITKU_API_KEY: 'api-key-123',
      DUITKU_CALLBACK_URL: 'http://localhost:3000/callback',
      DUITKU_RETURN_URL: 'http://localhost:3000/return',
    }

    expect(() => envSchema.parse(invalidEnv)).toThrow(/valid URL/)
  })

  test('Invalid DUITKU_CALLBACK_URL format fails', () => {
    const invalidEnv = {
      DATABASE_URL: 'file:./prisma/dev.db',
      JWT_SECRET: 'a'.repeat(32),
      DUITKU_MERCHANT_CODE: 'MERCHANT',
      DUITKU_API_KEY: 'api-key-123',
      DUITKU_CALLBACK_URL: 'not-a-url', // Invalid URL
      DUITKU_RETURN_URL: 'http://localhost:3000/return',
    }

    expect(() => envSchema.parse(invalidEnv)).toThrow(/valid URL/)
  })

  test('Invalid DUITKU_RETURN_URL format fails', () => {
    const invalidEnv = {
      DATABASE_URL: 'file:./prisma/dev.db',
      JWT_SECRET: 'a'.repeat(32),
      DUITKU_MERCHANT_CODE: 'MERCHANT',
      DUITKU_API_KEY: 'api-key-123',
      DUITKU_CALLBACK_URL: 'http://localhost:3000/callback',
      DUITKU_RETURN_URL: 'not-a-url', // Invalid URL
    }

    expect(() => envSchema.parse(invalidEnv)).toThrow(/valid URL/)
  })

  test('Invalid DUITKU_BASE_URL format fails', () => {
    const invalidEnv = {
      DATABASE_URL: 'file:./prisma/dev.db',
      JWT_SECRET: 'a'.repeat(32),
      DUITKU_MERCHANT_CODE: 'MERCHANT',
      DUITKU_API_KEY: 'api-key-123',
      DUITKU_CALLBACK_URL: 'http://localhost:3000/callback',
      DUITKU_RETURN_URL: 'http://localhost:3000/return',
      DUITKU_BASE_URL: 'not-a-url', // Invalid URL
    }

    expect(() => envSchema.parse(invalidEnv)).toThrow(/Invalid url/)
  })

  // ============================================================================
  // ENUM VALIDATION
  // ============================================================================

  test('Invalid NODE_ENV value fails', () => {
    const invalidEnv = {
      NODE_ENV: 'invalid-env', // Not in enum
      DATABASE_URL: 'file:./prisma/dev.db',
      JWT_SECRET: 'a'.repeat(32),
      DUITKU_MERCHANT_CODE: 'MERCHANT',
      DUITKU_API_KEY: 'api-key-123',
      DUITKU_CALLBACK_URL: 'http://localhost:3000/callback',
      DUITKU_RETURN_URL: 'http://localhost:3000/return',
    }

    expect(() => envSchema.parse(invalidEnv)).toThrow()
  })

  test('Invalid DUITKU_ENV value fails', () => {
    const invalidEnv = {
      DATABASE_URL: 'file:./prisma/dev.db',
      JWT_SECRET: 'a'.repeat(32),
      DUITKU_MERCHANT_CODE: 'MERCHANT',
      DUITKU_API_KEY: 'api-key-123',
      DUITKU_CALLBACK_URL: 'http://localhost:3000/callback',
      DUITKU_RETURN_URL: 'http://localhost:3000/return',
      DUITKU_ENV: 'invalid-env', // Not 'production' or 'sandbox'
    }

    expect(() => envSchema.parse(invalidEnv)).toThrow()
  })

  // ============================================================================
  // NUMBER VALIDATION
  // ============================================================================

  test('Invalid PORT value (negative) fails', () => {
    const invalidEnv = {
      PORT: '-1', // Negative
      DATABASE_URL: 'file:./prisma/dev.db',
      JWT_SECRET: 'a'.repeat(32),
      DUITKU_MERCHANT_CODE: 'MERCHANT',
      DUITKU_API_KEY: 'api-key-123',
      DUITKU_CALLBACK_URL: 'http://localhost:3000/callback',
      DUITKU_RETURN_URL: 'http://localhost:3000/return',
    }

    expect(() => envSchema.parse(invalidEnv)).toThrow()
  })

  test('Invalid PORT value (too large) fails', () => {
    const invalidEnv = {
      PORT: '99999', // > 65535
      DATABASE_URL: 'file:./prisma/dev.db',
      JWT_SECRET: 'a'.repeat(32),
      DUITKU_MERCHANT_CODE: 'MERCHANT',
      DUITKU_API_KEY: 'api-key-123',
      DUITKU_CALLBACK_URL: 'http://localhost:3000/callback',
      DUITKU_RETURN_URL: 'http://localhost:3000/return',
    }

    expect(() => envSchema.parse(invalidEnv)).toThrow()
  })

  test('Invalid MAX_FILE_SIZE (negative) fails', () => {
    const invalidEnv = {
      DATABASE_URL: 'file:./prisma/dev.db',
      JWT_SECRET: 'a'.repeat(32),
      MAX_FILE_SIZE: '-1', // Negative
      DUITKU_MERCHANT_CODE: 'MERCHANT',
      DUITKU_API_KEY: 'api-key-123',
      DUITKU_CALLBACK_URL: 'http://localhost:3000/callback',
      DUITKU_RETURN_URL: 'http://localhost:3000/return',
    }

    expect(() => envSchema.parse(invalidEnv)).toThrow()
  })

  test('Invalid RATE_LIMIT_LOGIN_MAX_ATTEMPTS (zero) fails', () => {
    const invalidEnv = {
      DATABASE_URL: 'file:./prisma/dev.db',
      JWT_SECRET: 'a'.repeat(32),
      RATE_LIMIT_LOGIN_MAX_ATTEMPTS: '0', // Not positive
      DUITKU_MERCHANT_CODE: 'MERCHANT',
      DUITKU_API_KEY: 'api-key-123',
      DUITKU_CALLBACK_URL: 'http://localhost:3000/callback',
      DUITKU_RETURN_URL: 'http://localhost:3000/return',
    }

    expect(() => envSchema.parse(invalidEnv)).toThrow()
  })

  // ============================================================================
  // COERCION TESTS
  // ============================================================================

  test('String PORT is coerced to number', () => {
    const validEnv = {
      PORT: '8080', // String
      DATABASE_URL: 'file:./prisma/dev.db',
      JWT_SECRET: 'a'.repeat(32),
      DUITKU_MERCHANT_CODE: 'MERCHANT',
      DUITKU_API_KEY: 'api-key-123',
      DUITKU_CALLBACK_URL: 'http://localhost:3000/callback',
      DUITKU_RETURN_URL: 'http://localhost:3000/return',
    }

    const result = envSchema.parse(validEnv)
    expect(result.PORT).toBe(8080)
    expect(typeof result.PORT).toBe('number')
  })

  test('String MAX_FILE_SIZE is coerced to number', () => {
    const validEnv = {
      DATABASE_URL: 'file:./prisma/dev.db',
      JWT_SECRET: 'a'.repeat(32),
      MAX_FILE_SIZE: '1048576', // String (1MB)
      DUITKU_MERCHANT_CODE: 'MERCHANT',
      DUITKU_API_KEY: 'api-key-123',
      DUITKU_CALLBACK_URL: 'http://localhost:3000/callback',
      DUITKU_RETURN_URL: 'http://localhost:3000/return',
    }

    const result = envSchema.parse(validEnv)
    expect(result.MAX_FILE_SIZE).toBe(1048576)
    expect(typeof result.MAX_FILE_SIZE).toBe('number')
  })

  // ============================================================================
  // BOOLEAN TRANSFORMATION TESTS
  // ============================================================================

  test('RATE_LIMIT_ENABLED "true" transforms to boolean true', () => {
    const validEnv = {
      DATABASE_URL: 'file:./prisma/dev.db',
      JWT_SECRET: 'a'.repeat(32),
      RATE_LIMIT_ENABLED: 'true',
      DUITKU_MERCHANT_CODE: 'MERCHANT',
      DUITKU_API_KEY: 'api-key-123',
      DUITKU_CALLBACK_URL: 'http://localhost:3000/callback',
      DUITKU_RETURN_URL: 'http://localhost:3000/return',
    }

    const result = envSchema.parse(validEnv)
    expect(result.RATE_LIMIT_ENABLED).toBe(true)
  })

  test('RATE_LIMIT_ENABLED "false" transforms to boolean false', () => {
    const validEnv = {
      DATABASE_URL: 'file:./prisma/dev.db',
      JWT_SECRET: 'a'.repeat(32),
      RATE_LIMIT_ENABLED: 'false',
      DUITKU_MERCHANT_CODE: 'MERCHANT',
      DUITKU_API_KEY: 'api-key-123',
      DUITKU_CALLBACK_URL: 'http://localhost:3000/callback',
      DUITKU_RETURN_URL: 'http://localhost:3000/return',
    }

    const result = envSchema.parse(validEnv)
    expect(result.RATE_LIMIT_ENABLED).toBe(false)
  })

  test('PAYMENT_IP_WHITELIST_ENABLED "true" transforms to boolean true', () => {
    const validEnv = {
      DATABASE_URL: 'file:./prisma/dev.db',
      JWT_SECRET: 'a'.repeat(32),
      PAYMENT_IP_WHITELIST_ENABLED: 'true',
      DUITKU_MERCHANT_CODE: 'MERCHANT',
      DUITKU_API_KEY: 'api-key-123',
      DUITKU_CALLBACK_URL: 'http://localhost:3000/callback',
      DUITKU_RETURN_URL: 'http://localhost:3000/return',
    }

    const result = envSchema.parse(validEnv)
    expect(result.PAYMENT_IP_WHITELIST_ENABLED).toBe(true)
  })

  // ============================================================================
  // OPTIONAL FIELDS TESTS
  // ============================================================================

  test('Optional REDIS_HOST can be omitted', () => {
    const validEnv = {
      DATABASE_URL: 'file:./prisma/dev.db',
      JWT_SECRET: 'a'.repeat(32),
      DUITKU_MERCHANT_CODE: 'MERCHANT',
      DUITKU_API_KEY: 'api-key-123',
      DUITKU_CALLBACK_URL: 'http://localhost:3000/callback',
      DUITKU_RETURN_URL: 'http://localhost:3000/return',
      // REDIS_HOST not provided
    }

    const result = envSchema.parse(validEnv)
    expect(result.REDIS_HOST).toBeUndefined()
  })

  test('Optional ANTHROPIC_API_KEY can be omitted', () => {
    const validEnv = {
      DATABASE_URL: 'file:./prisma/dev.db',
      JWT_SECRET: 'a'.repeat(32),
      DUITKU_MERCHANT_CODE: 'MERCHANT',
      DUITKU_API_KEY: 'api-key-123',
      DUITKU_CALLBACK_URL: 'http://localhost:3000/callback',
      DUITKU_RETURN_URL: 'http://localhost:3000/return',
      // ANTHROPIC_API_KEY not provided
    }

    const result = envSchema.parse(validEnv)
    expect(result.ANTHROPIC_API_KEY).toBeUndefined()
  })

  test('Optional OPENAI_API_KEY can be provided', () => {
    const validEnv = {
      DATABASE_URL: 'file:./prisma/dev.db',
      JWT_SECRET: 'a'.repeat(32),
      OPENAI_API_KEY: 'sk-openai-key-123',
      DUITKU_MERCHANT_CODE: 'MERCHANT',
      DUITKU_API_KEY: 'api-key-123',
      DUITKU_CALLBACK_URL: 'http://localhost:3000/callback',
      DUITKU_RETURN_URL: 'http://localhost:3000/return',
    }

    const result = envSchema.parse(validEnv)
    expect(result.OPENAI_API_KEY).toBe('sk-openai-key-123')
  })

  // ============================================================================
  // ERROR MESSAGE QUALITY TESTS
  // ============================================================================

  test('Error message includes field name and validation issue', () => {
    const invalidEnv = {
      DATABASE_URL: 'file:./prisma/dev.db',
      JWT_SECRET: 'too-short', // Less than 32 chars
      DUITKU_MERCHANT_CODE: 'MERCHANT',
      DUITKU_API_KEY: 'api-key-123',
      DUITKU_CALLBACK_URL: 'http://localhost:3000/callback',
      DUITKU_RETURN_URL: 'http://localhost:3000/return',
    }

    try {
      envSchema.parse(invalidEnv)
      expect(true).toBe(false) // Should not reach here
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors[0].message
        expect(errorMessage).toContain('32')
        expect(errorMessage.toLowerCase()).toContain('character')
      }
    }
  })

  test('Multiple validation errors are reported', () => {
    const invalidEnv = {
      // Missing DATABASE_URL
      JWT_SECRET: 'short', // Too short
      PORT: '-1', // Invalid
      CORS_ORIGIN: 'not-a-url', // Invalid URL
      DUITKU_MERCHANT_CODE: 'MERCHANT',
      DUITKU_API_KEY: 'api', // Too short
      DUITKU_CALLBACK_URL: 'http://localhost:3000/callback',
      DUITKU_RETURN_URL: 'http://localhost:3000/return',
    }

    try {
      envSchema.parse(invalidEnv)
      expect(true).toBe(false) // Should not reach here
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Should have multiple errors
        expect(error.errors.length).toBeGreaterThan(1)
      }
    }
  })

  // ============================================================================
  // TYPE INFERENCE TEST
  // ============================================================================

  test('Schema type inference works correctly', () => {
    type EnvType = z.infer<typeof envSchema>

    // This test ensures the type is correct at compile time
    const result = envSchema.parse({
      DATABASE_URL: 'file:./prisma/dev.db',
      JWT_SECRET: 'a'.repeat(32),
      DUITKU_MERCHANT_CODE: 'MERCHANT',
      DUITKU_API_KEY: 'api-key-123',
      DUITKU_CALLBACK_URL: 'http://localhost:3000/callback',
      DUITKU_RETURN_URL: 'http://localhost:3000/return',
    })

    // TypeScript should recognize these as the correct types
    const port: number = result.PORT
    const nodeEnv: 'development' | 'production' | 'test' = result.NODE_ENV
    const duitkuEnv: 'production' | 'sandbox' = result.DUITKU_ENV
    const rateLimitEnabled: boolean = result.RATE_LIMIT_ENABLED

    expect(typeof port).toBe('number')
    expect(['development', 'production', 'test']).toContain(nodeEnv)
    expect(['production', 'sandbox']).toContain(duitkuEnv)
    expect(typeof rateLimitEnabled).toBe('boolean')
  })
})
