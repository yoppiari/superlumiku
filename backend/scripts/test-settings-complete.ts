/**
 * Comprehensive Settings API Test Suite
 *
 * Tests all settings endpoints with authentication:
 * 1. Health check for settings
 * 2. GET /api/settings - Retrieve user settings
 * 3. PUT /api/settings - Update multiple settings
 * 4. PATCH /api/settings/notifications - Update notification settings
 * 5. PATCH /api/settings/display - Update display settings
 * 6. PATCH /api/settings/privacy - Update privacy settings
 * 7. POST /api/settings/reset - Reset to defaults
 *
 * Usage:
 *   bun run scripts/test-settings-complete.ts
 */

const BASE_URL = 'http://localhost:3000'

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function success(message: string) {
  log(`✓ ${message}`, colors.green)
}

function error(message: string) {
  log(`✗ ${message}`, colors.red)
}

function info(message: string) {
  log(`ℹ ${message}`, colors.blue)
}

function warn(message: string) {
  log(`⚠ ${message}`, colors.yellow)
}

function section(title: string) {
  console.log()
  log(`${'='.repeat(60)}`, colors.cyan)
  log(`${title}`, colors.bright + colors.cyan)
  log(`${'='.repeat(60)}`, colors.cyan)
  console.log()
}

interface TestResult {
  name: string
  passed: boolean
  duration: number
  details?: string
  error?: string
}

const results: TestResult[] = []

/**
 * Create a test user and get auth token
 */
async function setupTestUser(): Promise<string | null> {
  try {
    info('Creating test user...')

    const testEmail = `test-settings-${Date.now()}@lumiku.test`
    const testPassword = 'TestPass123!'

    // Register user
    const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: 'Settings Test User',
      }),
    })

    if (!registerRes.ok) {
      const errorText = await registerRes.text()
      throw new Error(`Registration failed: ${registerRes.status} - ${errorText}`)
    }

    const registerData = await registerRes.json()

    if (registerData.success && registerData.data?.token) {
      success(`Test user created: ${testEmail}`)
      return registerData.data.token
    }

    throw new Error('No token in registration response')
  } catch (err) {
    error(`Failed to create test user: ${err}`)
    return null
  }
}

/**
 * Test 1: Settings Health Check
 */
async function testSettingsHealth(): Promise<TestResult> {
  const startTime = Date.now()

  try {
    info('Testing settings health check...')

    const response = await fetch(`${BASE_URL}/health/settings`)

    if (!response.ok) {
      return {
        name: 'Settings Health Check',
        passed: false,
        duration: Date.now() - startTime,
        error: `HTTP ${response.status}: ${await response.text()}`,
      }
    }

    const data = await response.json()

    // Check if fallback is enabled (allows degraded mode)
    const isHealthy = data.status === 'ok' || (data.status === 'degraded' && data.checks?.settingsTable?.fallbackEnabled)

    if (isHealthy) {
      success('Settings health check passed')
      return {
        name: 'Settings Health Check',
        passed: true,
        duration: Date.now() - startTime,
        details: `Status: ${data.status}, Fallback: ${data.checks?.settingsTable?.fallbackEnabled ? 'Enabled' : 'Disabled'}`,
      }
    }

    return {
      name: 'Settings Health Check',
      passed: false,
      duration: Date.now() - startTime,
      error: `Status: ${data.status}, ${JSON.stringify(data.checks)}`,
    }
  } catch (err) {
    return {
      name: 'Settings Health Check',
      passed: false,
      duration: Date.now() - startTime,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * Test 2: GET /api/settings
 */
async function testGetSettings(token: string): Promise<TestResult> {
  const startTime = Date.now()

  try {
    info('Testing GET /api/settings...')

    const response = await fetch(`${BASE_URL}/api/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      return {
        name: 'GET /api/settings',
        passed: false,
        duration: Date.now() - startTime,
        error: `HTTP ${response.status}: ${await response.text()}`,
      }
    }

    const data = await response.json()

    // Verify response structure
    if (!data.success || !data.data) {
      return {
        name: 'GET /api/settings',
        passed: false,
        duration: Date.now() - startTime,
        error: 'Invalid response structure',
      }
    }

    const settings = data.data

    // Verify required fields
    const requiredFields = [
      'emailNotifications',
      'pushNotifications',
      'theme',
      'language',
      'profileVisibility',
    ]

    for (const field of requiredFields) {
      if (!(field in settings)) {
        return {
          name: 'GET /api/settings',
          passed: false,
          duration: Date.now() - startTime,
          error: `Missing field: ${field}`,
        }
      }
    }

    success('GET /api/settings passed')
    return {
      name: 'GET /api/settings',
      passed: true,
      duration: Date.now() - startTime,
      details: `Retrieved settings with theme: ${settings.theme}, language: ${settings.language}`,
    }
  } catch (err) {
    return {
      name: 'GET /api/settings',
      passed: false,
      duration: Date.now() - startTime,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * Test 3: PUT /api/settings
 */
async function testUpdateSettings(token: string): Promise<TestResult> {
  const startTime = Date.now()

  try {
    info('Testing PUT /api/settings...')

    const updates = {
      theme: 'dark',
      language: 'en',
      emailNotifications: false,
    }

    const response = await fetch(`${BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      return {
        name: 'PUT /api/settings',
        passed: false,
        duration: Date.now() - startTime,
        error: `HTTP ${response.status}: ${await response.text()}`,
      }
    }

    const data = await response.json()

    // Verify updates were applied
    if (
      data.data.theme !== 'dark' ||
      data.data.language !== 'en' ||
      data.data.emailNotifications !== false
    ) {
      return {
        name: 'PUT /api/settings',
        passed: false,
        duration: Date.now() - startTime,
        error: 'Settings not updated correctly',
      }
    }

    success('PUT /api/settings passed')
    return {
      name: 'PUT /api/settings',
      passed: true,
      duration: Date.now() - startTime,
      details: 'Successfully updated theme, language, and emailNotifications',
    }
  } catch (err) {
    return {
      name: 'PUT /api/settings',
      passed: false,
      duration: Date.now() - startTime,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * Test 4: PATCH /api/settings/notifications
 */
async function testUpdateNotifications(token: string): Promise<TestResult> {
  const startTime = Date.now()

  try {
    info('Testing PATCH /api/settings/notifications...')

    const updates = {
      pushNotifications: true,
      creditAlerts: true,
    }

    const response = await fetch(`${BASE_URL}/api/settings/notifications`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      return {
        name: 'PATCH /api/settings/notifications',
        passed: false,
        duration: Date.now() - startTime,
        error: `HTTP ${response.status}: ${await response.text()}`,
      }
    }

    const data = await response.json()

    if (
      data.data.pushNotifications !== true ||
      data.data.creditAlerts !== true
    ) {
      return {
        name: 'PATCH /api/settings/notifications',
        passed: false,
        duration: Date.now() - startTime,
        error: 'Notification settings not updated correctly',
      }
    }

    success('PATCH /api/settings/notifications passed')
    return {
      name: 'PATCH /api/settings/notifications',
      passed: true,
      duration: Date.now() - startTime,
      details: 'Successfully updated notification preferences',
    }
  } catch (err) {
    return {
      name: 'PATCH /api/settings/notifications',
      passed: false,
      duration: Date.now() - startTime,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * Test 5: PATCH /api/settings/display
 */
async function testUpdateDisplay(token: string): Promise<TestResult> {
  const startTime = Date.now()

  try {
    info('Testing PATCH /api/settings/display...')

    const updates = {
      theme: 'light',
      language: 'id',
    }

    const response = await fetch(`${BASE_URL}/api/settings/display`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      return {
        name: 'PATCH /api/settings/display',
        passed: false,
        duration: Date.now() - startTime,
        error: `HTTP ${response.status}: ${await response.text()}`,
      }
    }

    const data = await response.json()

    if (data.data.theme !== 'light' || data.data.language !== 'id') {
      return {
        name: 'PATCH /api/settings/display',
        passed: false,
        duration: Date.now() - startTime,
        error: 'Display settings not updated correctly',
      }
    }

    success('PATCH /api/settings/display passed')
    return {
      name: 'PATCH /api/settings/display',
      passed: true,
      duration: Date.now() - startTime,
      details: 'Successfully updated display preferences',
    }
  } catch (err) {
    return {
      name: 'PATCH /api/settings/display',
      passed: false,
      duration: Date.now() - startTime,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * Test 6: PATCH /api/settings/privacy
 */
async function testUpdatePrivacy(token: string): Promise<TestResult> {
  const startTime = Date.now()

  try {
    info('Testing PATCH /api/settings/privacy...')

    const updates = {
      profileVisibility: 'private',
      showEmail: false,
    }

    const response = await fetch(`${BASE_URL}/api/settings/privacy`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      return {
        name: 'PATCH /api/settings/privacy',
        passed: false,
        duration: Date.now() - startTime,
        error: `HTTP ${response.status}: ${await response.text()}`,
      }
    }

    const data = await response.json()

    if (
      data.data.profileVisibility !== 'private' ||
      data.data.showEmail !== false
    ) {
      return {
        name: 'PATCH /api/settings/privacy',
        passed: false,
        duration: Date.now() - startTime,
        error: 'Privacy settings not updated correctly',
      }
    }

    success('PATCH /api/settings/privacy passed')
    return {
      name: 'PATCH /api/settings/privacy',
      passed: true,
      duration: Date.now() - startTime,
      details: 'Successfully updated privacy preferences',
    }
  } catch (err) {
    return {
      name: 'PATCH /api/settings/privacy',
      passed: false,
      duration: Date.now() - startTime,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * Test 7: POST /api/settings/reset
 */
async function testResetSettings(token: string): Promise<TestResult> {
  const startTime = Date.now()

  try {
    info('Testing POST /api/settings/reset...')

    const response = await fetch(`${BASE_URL}/api/settings/reset`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      return {
        name: 'POST /api/settings/reset',
        passed: false,
        duration: Date.now() - startTime,
        error: `HTTP ${response.status}: ${await response.text()}`,
      }
    }

    const data = await response.json()

    // Verify defaults
    if (
      data.data.theme !== 'light' ||
      data.data.language !== 'id' ||
      data.data.emailNotifications !== true
    ) {
      return {
        name: 'POST /api/settings/reset',
        passed: false,
        duration: Date.now() - startTime,
        error: 'Settings not reset to defaults correctly',
      }
    }

    success('POST /api/settings/reset passed')
    return {
      name: 'POST /api/settings/reset',
      passed: true,
      duration: Date.now() - startTime,
      details: 'Successfully reset settings to defaults',
    }
  } catch (err) {
    return {
      name: 'POST /api/settings/reset',
      passed: false,
      duration: Date.now() - startTime,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * Test 8: Verify persistence
 */
async function testPersistence(token: string): Promise<TestResult> {
  const startTime = Date.now()

  try {
    info('Testing settings persistence...')

    // Update settings
    await fetch(`${BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ theme: 'dark' }),
    })

    // Retrieve settings
    const response = await fetch(`${BASE_URL}/api/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    const data = await response.json()

    if (data.data.theme !== 'dark') {
      return {
        name: 'Settings Persistence',
        passed: false,
        duration: Date.now() - startTime,
        error: 'Settings not persisted correctly',
      }
    }

    success('Settings persistence verified')
    return {
      name: 'Settings Persistence',
      passed: true,
      duration: Date.now() - startTime,
      details: 'Settings persisted correctly across requests',
    }
  } catch (err) {
    return {
      name: 'Settings Persistence',
      passed: false,
      duration: Date.now() - startTime,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * Print test results summary
 */
function printSummary() {
  section('TEST RESULTS SUMMARY')

  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length
  const total = results.length

  console.log()
  log(`Total Tests: ${total}`, colors.bright)
  log(`Passed: ${passed}`, colors.green)
  log(`Failed: ${failed}`, failed > 0 ? colors.red : colors.green)
  console.log()

  // Detailed results
  for (const result of results) {
    const status = result.passed ? '✓' : '✗'
    const color = result.passed ? colors.green : colors.red
    const duration = `${result.duration}ms`

    log(`${status} ${result.name} (${duration})`, color)

    if (result.details) {
      log(`  └─ ${result.details}`, colors.cyan)
    }

    if (result.error) {
      log(`  └─ Error: ${result.error}`, colors.red)
    }
  }

  console.log()

  if (failed === 0) {
    success('🎉 All tests passed!')
  } else {
    error(`❌ ${failed} test(s) failed`)
  }

  console.log()
}

/**
 * Main test runner
 */
async function main() {
  section('COMPREHENSIVE SETTINGS API TEST SUITE')

  info('Starting test suite...')
  info(`Backend URL: ${BASE_URL}`)
  console.log()

  // Setup test user
  const token = await setupTestUser()

  if (!token) {
    error('Failed to setup test user. Aborting tests.')
    process.exit(1)
  }

  console.log()

  // Run all tests
  results.push(await testSettingsHealth())
  results.push(await testGetSettings(token))
  results.push(await testUpdateSettings(token))
  results.push(await testUpdateNotifications(token))
  results.push(await testUpdateDisplay(token))
  results.push(await testUpdatePrivacy(token))
  results.push(await testResetSettings(token))
  results.push(await testPersistence(token))

  // Print summary
  printSummary()

  // Exit with appropriate code
  const failed = results.filter((r) => !r.passed).length
  process.exit(failed > 0 ? 1 : 0)
}

// Run tests
main().catch((err) => {
  error(`Fatal error: ${err}`)
  process.exit(1)
})
