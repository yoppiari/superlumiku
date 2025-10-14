/**
 * Rate Limiting Test Script
 *
 * Tests the rate limiting functionality by making multiple requests
 * to the login endpoint and verifying rate limit behavior.
 *
 * Usage:
 *   bun run src/scripts/test-rate-limiting.ts
 */

import { env } from '../config/env'

const BASE_URL = `http://localhost:${env.PORT}`

interface RateLimitTestResult {
  attemptNumber: number
  statusCode: number
  success: boolean
  rateLimitHeaders: {
    limit?: string
    remaining?: string
    reset?: string
  }
  retryAfter?: string
  message?: string
}

/**
 * Make a login attempt
 */
async function attemptLogin(attemptNumber: number): Promise<RateLimitTestResult> {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword',
      }),
    })

    const data = await response.json()

    return {
      attemptNumber,
      statusCode: response.status,
      success: response.ok,
      rateLimitHeaders: {
        limit: response.headers.get('X-RateLimit-Limit') || undefined,
        remaining: response.headers.get('X-RateLimit-Remaining') || undefined,
        reset: response.headers.get('X-RateLimit-Reset') || undefined,
      },
      retryAfter: response.headers.get('Retry-After') || undefined,
      message: data.message || data.error || 'No message',
    }
  } catch (error: any) {
    return {
      attemptNumber,
      statusCode: 0,
      success: false,
      rateLimitHeaders: {},
      message: `Request failed: ${error.message}`,
    }
  }
}

/**
 * Make a registration attempt
 */
async function attemptRegister(attemptNumber: number): Promise<RateLimitTestResult> {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: `test${attemptNumber}@example.com`,
        password: 'testpassword123',
        name: 'Test User',
      }),
    })

    const data = await response.json()

    return {
      attemptNumber,
      statusCode: response.status,
      success: response.ok,
      rateLimitHeaders: {
        limit: response.headers.get('X-RateLimit-Limit') || undefined,
        remaining: response.headers.get('X-RateLimit-Remaining') || undefined,
        reset: response.headers.get('X-RateLimit-Reset') || undefined,
      },
      retryAfter: response.headers.get('Retry-After') || undefined,
      message: data.message || data.error || 'No message',
    }
  } catch (error: any) {
    return {
      attemptNumber,
      statusCode: 0,
      success: false,
      rateLimitHeaders: {},
      message: `Request failed: ${error.message}`,
    }
  }
}

/**
 * Print test result
 */
function printResult(result: RateLimitTestResult, title: string) {
  const statusEmoji = result.statusCode === 429 ? '🚫' : result.success ? '✅' : '❌'
  console.log(`\n${statusEmoji} ${title}`)
  console.log(`   Status: ${result.statusCode}`)
  console.log(`   Message: ${result.message}`)
  console.log(`   Rate Limit: ${result.rateLimitHeaders.remaining || 'N/A'}/${result.rateLimitHeaders.limit || 'N/A'}`)

  if (result.retryAfter) {
    console.log(`   Retry After: ${result.retryAfter}s`)
  }

  if (result.rateLimitHeaders.reset) {
    const resetDate = new Date(parseInt(result.rateLimitHeaders.reset) * 1000)
    console.log(`   Reset At: ${resetDate.toLocaleTimeString()}`)
  }
}

/**
 * Test login rate limiting
 */
async function testLoginRateLimiting() {
  console.log('\n' + '='.repeat(60))
  console.log('🔐 Testing Login Rate Limiting')
  console.log('='.repeat(60))
  console.log('Configuration: 5 attempts per 15 minutes')

  const results: RateLimitTestResult[] = []

  // Make 7 attempts (should succeed for first 5, fail for last 2)
  for (let i = 1; i <= 7; i++) {
    const result = await attemptLogin(i)
    results.push(result)
    printResult(result, `Attempt ${i}/7`)

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  // Summary
  console.log('\n' + '-'.repeat(60))
  console.log('📊 Summary')
  console.log('-'.repeat(60))

  const allowed = results.filter((r) => r.statusCode !== 429).length
  const blocked = results.filter((r) => r.statusCode === 429).length

  console.log(`✅ Allowed: ${allowed}`)
  console.log(`🚫 Blocked: ${blocked}`)

  if (blocked > 0) {
    console.log('✅ Rate limiting is working correctly!')
  } else {
    console.log('⚠️  Rate limiting may not be working - all requests were allowed')
  }

  return results
}

/**
 * Test registration rate limiting
 */
async function testRegistrationRateLimiting() {
  console.log('\n' + '='.repeat(60))
  console.log('📝 Testing Registration Rate Limiting')
  console.log('='.repeat(60))
  console.log('Configuration: 3 attempts per hour')

  const results: RateLimitTestResult[] = []

  // Make 5 attempts (should succeed for first 3, fail for last 2)
  for (let i = 1; i <= 5; i++) {
    const result = await attemptRegister(i)
    results.push(result)
    printResult(result, `Attempt ${i}/5`)

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  // Summary
  console.log('\n' + '-'.repeat(60))
  console.log('📊 Summary')
  console.log('-'.repeat(60))

  const allowed = results.filter((r) => r.statusCode !== 429).length
  const blocked = results.filter((r) => r.statusCode === 429).length

  console.log(`✅ Allowed: ${allowed}`)
  console.log(`🚫 Blocked: ${blocked}`)

  if (blocked > 0) {
    console.log('✅ Rate limiting is working correctly!')
  } else {
    console.log('⚠️  Rate limiting may not be working - all requests were allowed')
  }

  return results
}

/**
 * Check if server is running
 */
async function checkServer(): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/health`)
    return response.ok
  } catch {
    return false
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log('🧪 Rate Limiting Test Suite')
  console.log('Server URL:', BASE_URL)

  // Check if server is running
  console.log('\n🔍 Checking server status...')
  const serverRunning = await checkServer()

  if (!serverRunning) {
    console.error('❌ Server is not running!')
    console.error('Please start the server with: bun run dev')
    process.exit(1)
  }

  console.log('✅ Server is running')

  // Run tests
  await testLoginRateLimiting()
  await new Promise((resolve) => setTimeout(resolve, 1000))
  await testRegistrationRateLimiting()

  // Final summary
  console.log('\n' + '='.repeat(60))
  console.log('✅ Rate Limiting Tests Complete')
  console.log('='.repeat(60))
  console.log('\nNote: Rate limits are IP-based. If all requests were allowed,')
  console.log('it may be because the rate limit window has not yet expired.')
  console.log('Try running the test again in a new terminal or wait for the')
  console.log('rate limit window to reset.')
}

// Run tests
main().catch((error) => {
  console.error('❌ Test failed:', error)
  process.exit(1)
})
