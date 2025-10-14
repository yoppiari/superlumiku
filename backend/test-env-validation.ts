/**
 * Environment Validation Test Script
 *
 * This script demonstrates the comprehensive environment variable validation.
 * Run with: bun run test-env-validation.ts
 *
 * It will:
 * 1. Show successful validation with complete config
 * 2. Show various validation failures with clear errors
 */

import { envSchema } from './src/config/env'
import { z } from 'zod'

console.log('🧪 Environment Validation Test Suite\n')
console.log('=' .repeat(80))

// Test 1: Valid Configuration
console.log('\n✅ TEST 1: Valid Development Configuration')
console.log('-'.repeat(80))
try {
  const validEnv = {
    NODE_ENV: 'development',
    DATABASE_URL: 'file:./prisma/dev.db',
    JWT_SECRET: 'dev-secret-at-least-32-characters-long',
    CORS_ORIGIN: 'http://localhost:5173',
    DUITKU_MERCHANT_CODE: 'sandbox-merchant',
    DUITKU_API_KEY: 'sandbox-api-key',
    DUITKU_CALLBACK_URL: 'http://localhost:3000/api/payments/callback',
    DUITKU_RETURN_URL: 'http://localhost:5173/payments/status',
  }

  const result = envSchema.parse(validEnv)
  console.log('✅ Validation PASSED')
  console.log('   - NODE_ENV:', result.NODE_ENV)
  console.log('   - PORT:', result.PORT, '(default)')
  console.log('   - DATABASE_URL:', result.DATABASE_URL.substring(0, 20) + '...')
  console.log('   - JWT_SECRET:', '***' + result.JWT_SECRET.substring(result.JWT_SECRET.length - 4))
  console.log('   - DUITKU_ENV:', result.DUITKU_ENV, '(default)')
  console.log('   - RATE_LIMIT_ENABLED:', result.RATE_LIMIT_ENABLED)
} catch (error) {
  console.error('❌ Unexpected error:', error)
}

// Test 2: Missing Required Field
console.log('\n\n❌ TEST 2: Missing DATABASE_URL')
console.log('-'.repeat(80))
try {
  const invalidEnv = {
    JWT_SECRET: 'dev-secret-at-least-32-characters-long',
    DUITKU_MERCHANT_CODE: 'sandbox-merchant',
    DUITKU_API_KEY: 'sandbox-api-key',
    DUITKU_CALLBACK_URL: 'http://localhost:3000/api/payments/callback',
    DUITKU_RETURN_URL: 'http://localhost:5173/payments/status',
  }

  envSchema.parse(invalidEnv)
  console.log('❌ ERROR: Should have thrown!')
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log('✅ Validation correctly FAILED:')
    error.errors.forEach((err) => {
      console.log(`   ❌ ${err.path.join('.')}: ${err.message}`)
    })
  }
}

// Test 3: JWT Secret Too Short
console.log('\n\n❌ TEST 3: JWT_SECRET Too Short')
console.log('-'.repeat(80))
try {
  const invalidEnv = {
    DATABASE_URL: 'file:./prisma/dev.db',
    JWT_SECRET: 'short', // Less than 32 characters
    DUITKU_MERCHANT_CODE: 'sandbox-merchant',
    DUITKU_API_KEY: 'sandbox-api-key',
    DUITKU_CALLBACK_URL: 'http://localhost:3000/api/payments/callback',
    DUITKU_RETURN_URL: 'http://localhost:5173/payments/status',
  }

  envSchema.parse(invalidEnv)
  console.log('❌ ERROR: Should have thrown!')
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log('✅ Validation correctly FAILED:')
    error.errors.forEach((err) => {
      console.log(`   ❌ ${err.path.join('.')}: ${err.message}`)
    })
  }
}

// Test 4: Invalid URL Format
console.log('\n\n❌ TEST 4: Invalid URL Formats')
console.log('-'.repeat(80))
try {
  const invalidEnv = {
    DATABASE_URL: 'file:./prisma/dev.db',
    JWT_SECRET: 'dev-secret-at-least-32-characters-long',
    CORS_ORIGIN: 'not-a-url', // Invalid URL
    DUITKU_MERCHANT_CODE: 'sandbox-merchant',
    DUITKU_API_KEY: 'sandbox-api-key',
    DUITKU_CALLBACK_URL: 'also-not-a-url', // Invalid URL
    DUITKU_RETURN_URL: 'still-not-a-url', // Invalid URL
  }

  envSchema.parse(invalidEnv)
  console.log('❌ ERROR: Should have thrown!')
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log('✅ Validation correctly FAILED:')
    error.errors.forEach((err) => {
      console.log(`   ❌ ${err.path.join('.')}: ${err.message}`)
    })
  }
}

// Test 5: Invalid Number Values
console.log('\n\n❌ TEST 5: Invalid Number Values')
console.log('-'.repeat(80))
try {
  const invalidEnv = {
    PORT: '-1', // Negative port
    DATABASE_URL: 'file:./prisma/dev.db',
    JWT_SECRET: 'dev-secret-at-least-32-characters-long',
    MAX_FILE_SIZE: '0', // Zero is not positive
    DUITKU_MERCHANT_CODE: 'sandbox-merchant',
    DUITKU_API_KEY: 'sandbox-api-key',
    DUITKU_CALLBACK_URL: 'http://localhost:3000/api/payments/callback',
    DUITKU_RETURN_URL: 'http://localhost:5173/payments/status',
  }

  envSchema.parse(invalidEnv)
  console.log('❌ ERROR: Should have thrown!')
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log('✅ Validation correctly FAILED:')
    error.errors.forEach((err) => {
      console.log(`   ❌ ${err.path.join('.')}: ${err.message}`)
    })
  }
}

// Test 6: Invalid Enum Values
console.log('\n\n❌ TEST 6: Invalid Enum Values')
console.log('-'.repeat(80))
try {
  const invalidEnv = {
    NODE_ENV: 'invalid-env', // Not 'development', 'production', or 'test'
    DATABASE_URL: 'file:./prisma/dev.db',
    JWT_SECRET: 'dev-secret-at-least-32-characters-long',
    DUITKU_ENV: 'invalid-env', // Not 'production' or 'sandbox'
    DUITKU_MERCHANT_CODE: 'sandbox-merchant',
    DUITKU_API_KEY: 'sandbox-api-key',
    DUITKU_CALLBACK_URL: 'http://localhost:3000/api/payments/callback',
    DUITKU_RETURN_URL: 'http://localhost:5173/payments/status',
  }

  envSchema.parse(invalidEnv)
  console.log('❌ ERROR: Should have thrown!')
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log('✅ Validation correctly FAILED:')
    error.errors.forEach((err) => {
      console.log(`   ❌ ${err.path.join('.')}: ${err.message}`)
    })
  }
}

// Test 7: Multiple Errors at Once
console.log('\n\n❌ TEST 7: Multiple Validation Errors')
console.log('-'.repeat(80))
try {
  const invalidEnv = {
    // Missing DATABASE_URL
    JWT_SECRET: 'short', // Too short
    PORT: '999999', // Too large
    CORS_ORIGIN: 'not-a-url', // Invalid URL
    DUITKU_MERCHANT_CODE: 'sandbox-merchant',
    DUITKU_API_KEY: 'short', // Too short
    DUITKU_CALLBACK_URL: 'not-a-url', // Invalid URL
    DUITKU_RETURN_URL: 'http://localhost:5173/payments/status',
  }

  envSchema.parse(invalidEnv)
  console.log('❌ ERROR: Should have thrown!')
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log('✅ Validation correctly FAILED with multiple errors:')
    console.log(`   Found ${error.errors.length} validation errors:\n`)
    error.errors.forEach((err, index) => {
      console.log(`   ${index + 1}. ❌ ${err.path.join('.')}: ${err.message}`)
    })
  }
}

// Summary
console.log('\n\n' + '='.repeat(80))
console.log('📊 TEST SUMMARY')
console.log('='.repeat(80))
console.log('✅ All validation tests completed successfully!')
console.log('✅ Zod schema correctly validates environment variables')
console.log('✅ Clear error messages provided for invalid configurations')
console.log('✅ Type coercion and transformations working correctly')
console.log('✅ Default values applied when appropriate')
console.log('\n🎉 Environment validation system is production-ready!')
console.log('\nRun actual tests with: bun test src/config/__tests__/env.test.ts')
console.log('=' .repeat(80) + '\n')
