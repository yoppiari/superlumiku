/**
 * Settings API Test Script
 *
 * Tests all settings endpoints with authentication
 *
 * Usage:
 *   bun run scripts/test-settings.ts
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000'

interface TestResult {
  test: string
  passed: boolean
  error?: string
  response?: any
}

const results: TestResult[] = []

/**
 * Login and get auth token
 */
async function login(): Promise<string> {
  console.log('\n=== STEP 1: Authentication ===')

  const loginData = {
    email: process.env.TEST_USER_EMAIL || 'test@example.com',
    password: process.env.TEST_USER_PASSWORD || 'password123'
  }

  console.log('Logging in as:', loginData.email)

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    })

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.success || !data.data?.token) {
      throw new Error('Login response missing token')
    }

    console.log('✓ Login successful')
    console.log('Token:', data.data.token.substring(0, 20) + '...')

    return data.data.token
  } catch (error) {
    console.error('✗ Login failed:', error)
    throw error
  }
}

/**
 * Test GET /api/settings
 */
async function testGetSettings(token: string): Promise<void> {
  console.log('\n=== STEP 2: GET /api/settings ===')

  try {
    const response = await fetch(`${API_BASE_URL}/api/settings`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2))

    const data = await response.json()
    console.log('Response body:', JSON.stringify(data, null, 2))

    if (!response.ok) {
      throw new Error(`GET /api/settings failed: ${response.status} ${JSON.stringify(data)}`)
    }

    if (!data.success) {
      throw new Error('Response success is false')
    }

    if (!data.data) {
      throw new Error('Response missing data field')
    }

    // Verify settings structure
    const settings = data.data
    const requiredFields = [
      'emailNotifications',
      'pushNotifications',
      'marketingEmails',
      'projectUpdates',
      'creditAlerts',
      'theme',
      'language',
      'profileVisibility',
      'showEmail',
      'analyticsTracking',
      'settingsUpdatedAt'
    ]

    for (const field of requiredFields) {
      if (!(field in settings)) {
        throw new Error(`Missing required field: ${field}`)
      }
    }

    console.log('✓ GET /api/settings successful')
    console.log('Current theme:', settings.theme)
    console.log('Current language:', settings.language)

    results.push({
      test: 'GET /api/settings',
      passed: true,
      response: settings
    })
  } catch (error) {
    console.error('✗ GET /api/settings failed:', error)
    results.push({
      test: 'GET /api/settings',
      passed: false,
      error: error instanceof Error ? error.message : String(error)
    })
    throw error
  }
}

/**
 * Test PUT /api/settings - Update theme
 */
async function testUpdateTheme(token: string): Promise<void> {
  console.log('\n=== STEP 3: PUT /api/settings (Update Theme) ===')

  const updateData = {
    theme: 'dark'
  }

  console.log('Updating theme to:', updateData.theme)

  try {
    const response = await fetch(`${API_BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    })

    console.log('Response status:', response.status)

    const data = await response.json()
    console.log('Response body:', JSON.stringify(data, null, 2))

    if (!response.ok) {
      throw new Error(`PUT /api/settings failed: ${response.status} ${JSON.stringify(data)}`)
    }

    if (!data.success) {
      throw new Error('Response success is false')
    }

    if (data.data.theme !== 'dark') {
      throw new Error(`Theme not updated correctly. Expected: dark, Got: ${data.data.theme}`)
    }

    console.log('✓ Theme updated successfully to:', data.data.theme)

    results.push({
      test: 'PUT /api/settings (theme)',
      passed: true,
      response: data.data
    })
  } catch (error) {
    console.error('✗ PUT /api/settings (theme) failed:', error)
    results.push({
      test: 'PUT /api/settings (theme)',
      passed: false,
      error: error instanceof Error ? error.message : String(error)
    })
    throw error
  }
}

/**
 * Test PUT /api/settings - Update multiple settings
 */
async function testUpdateMultipleSettings(token: string): Promise<void> {
  console.log('\n=== STEP 4: PUT /api/settings (Multiple Settings) ===')

  const updateData = {
    theme: 'system',
    language: 'en',
    emailNotifications: false,
    pushNotifications: true
  }

  console.log('Updating settings:', JSON.stringify(updateData, null, 2))

  try {
    const response = await fetch(`${API_BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    })

    console.log('Response status:', response.status)

    const data = await response.json()
    console.log('Response body:', JSON.stringify(data, null, 2))

    if (!response.ok) {
      throw new Error(`PUT /api/settings failed: ${response.status} ${JSON.stringify(data)}`)
    }

    if (!data.success) {
      throw new Error('Response success is false')
    }

    // Verify all fields updated
    if (data.data.theme !== 'system') {
      throw new Error(`Theme not updated. Expected: system, Got: ${data.data.theme}`)
    }
    if (data.data.language !== 'en') {
      throw new Error(`Language not updated. Expected: en, Got: ${data.data.language}`)
    }
    if (data.data.emailNotifications !== false) {
      throw new Error(`emailNotifications not updated`)
    }
    if (data.data.pushNotifications !== true) {
      throw new Error(`pushNotifications not updated`)
    }

    console.log('✓ Multiple settings updated successfully')

    results.push({
      test: 'PUT /api/settings (multiple)',
      passed: true,
      response: data.data
    })
  } catch (error) {
    console.error('✗ PUT /api/settings (multiple) failed:', error)
    results.push({
      test: 'PUT /api/settings (multiple)',
      passed: false,
      error: error instanceof Error ? error.message : String(error)
    })
    throw error
  }
}

/**
 * Test PATCH /api/settings/display
 */
async function testUpdateDisplaySettings(token: string): Promise<void> {
  console.log('\n=== STEP 5: PATCH /api/settings/display ===')

  const updateData = {
    theme: 'light',
    language: 'id'
  }

  console.log('Updating display settings:', JSON.stringify(updateData, null, 2))

  try {
    const response = await fetch(`${API_BASE_URL}/api/settings/display`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    })

    console.log('Response status:', response.status)

    const data = await response.json()
    console.log('Response body:', JSON.stringify(data, null, 2))

    if (!response.ok) {
      throw new Error(`PATCH /api/settings/display failed: ${response.status} ${JSON.stringify(data)}`)
    }

    if (!data.success) {
      throw new Error('Response success is false')
    }

    console.log('✓ Display settings updated successfully')

    results.push({
      test: 'PATCH /api/settings/display',
      passed: true,
      response: data.data
    })
  } catch (error) {
    console.error('✗ PATCH /api/settings/display failed:', error)
    results.push({
      test: 'PATCH /api/settings/display',
      passed: false,
      error: error instanceof Error ? error.message : String(error)
    })
    throw error
  }
}

/**
 * Main test runner
 */
async function runTests(): Promise<void> {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║         Settings API Test Suite                           ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log('API Base URL:', API_BASE_URL)

  try {
    // Step 1: Login
    const token = await login()

    // Step 2: Get settings
    await testGetSettings(token)

    // Step 3: Update theme
    await testUpdateTheme(token)

    // Step 4: Update multiple settings
    await testUpdateMultipleSettings(token)

    // Step 5: Update display settings
    await testUpdateDisplaySettings(token)

    // Print summary
    console.log('\n╔════════════════════════════════════════════════════════════╗')
    console.log('║         TEST SUMMARY                                       ║')
    console.log('╚════════════════════════════════════════════════════════════╝')

    const passed = results.filter(r => r.passed).length
    const failed = results.filter(r => !r.passed).length

    console.log(`\nTotal tests: ${results.length}`)
    console.log(`✓ Passed: ${passed}`)
    console.log(`✗ Failed: ${failed}`)

    if (failed > 0) {
      console.log('\nFailed tests:')
      results.filter(r => !r.passed).forEach(r => {
        console.log(`  - ${r.test}: ${r.error}`)
      })
      process.exit(1)
    } else {
      console.log('\n🎉 All tests passed!')
      process.exit(0)
    }
  } catch (error) {
    console.error('\n❌ Test suite failed:', error)
    process.exit(1)
  }
}

// Run tests
runTests()
