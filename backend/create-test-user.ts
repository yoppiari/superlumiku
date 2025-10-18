/**
 * Create Test User for Settings API Testing
 */

const BASE_URL = 'http://localhost:3000'

async function createTestUser() {
  console.log('Creating test user...')

  const testUser = {
    email: 'test@lumiku.com',
    password: 'TestPassword123!SecureEnough',
    name: 'Test User'
  }

  try {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    })

    const data = await response.json()

    if (response.status === 201 || response.status === 200) {
      console.log('✓ Test user created successfully!')
      console.log('  Email:', testUser.email)
      console.log('  Password:', testUser.password)
      console.log('  User ID:', data.data?.user?.id || data.user?.id || 'N/A')

      if (data.data?.token || data.token) {
        console.log('  Token:', (data.data?.token || data.token).substring(0, 30) + '...')
      }

      return true
    } else if (response.status === 409 || (typeof data.error === 'string' && data.error.includes('already exists'))) {
      console.log('⚠ Test user already exists, attempting login...')

      // Try to login
      const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password
        })
      })

      const loginData = await loginResponse.json()

      if (loginResponse.status === 200) {
        console.log('✓ Logged in successfully!')
        console.log('  Email:', testUser.email)
        console.log('  User ID:', loginData.data?.user?.id || loginData.user?.id || 'N/A')
        console.log('  Token:', (loginData.data?.token || loginData.token).substring(0, 30) + '...')
        return true
      } else {
        console.error('✗ Login failed:', loginData.error)
        return false
      }
    } else {
      console.error('✗ Failed to create test user')
      console.error('  Status:', response.status)
      console.error('  Response:', JSON.stringify(data, null, 2))
      return false
    }
  } catch (error: any) {
    console.error('✗ Error creating test user:', error.message)
    return false
  }
}

createTestUser().then((success) => {
  process.exit(success ? 0 : 1)
})
