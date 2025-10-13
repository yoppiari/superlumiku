/**
 * COMPREHENSIVE DIAGNOSTIC TEST SUITE
 * untuk Avatar Projects Error 400
 *
 * Test ini akan:
 * 1. Check database connection
 * 2. Verify avatar_projects table exists
 * 3. Test Prisma client directly
 * 4. Test API endpoint with authentication
 * 5. Check validation
 * 6. Test full end-to-end flow
 */

import { PrismaClient } from '@prisma/client'
import { signToken } from './backend/src/lib/jwt.ts'

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn', 'info'],
})

// Color logging untuk readability
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(color, emoji, title, message) {
  console.log(`\n${color}${emoji} ${title}${colors.reset}`)
  if (message) console.log(`   ${message}`)
}

function success(title, message) {
  log(colors.green, '✅', title, message)
}

function error(title, message) {
  log(colors.red, '❌', title, message)
}

function warning(title, message) {
  log(colors.yellow, '⚠️', title, message)
}

function info(title, message) {
  log(colors.cyan, '🔍', title, message)
}

async function runTests() {
  console.log('\n' + '='.repeat(80))
  console.log('🧪 COMPREHENSIVE DIAGNOSTIC TEST FOR AVATAR PROJECTS ERROR 400')
  console.log('='.repeat(80))

  let testResults = {
    dbConnection: false,
    tableExists: false,
    prismaCreate: false,
    userExists: false,
    authToken: false,
    apiEndpoint: false,
    validation: false,
  }

  // ==========================================
  // TEST 1: Database Connection
  // ==========================================
  info('TEST 1/7', 'Testing database connection...')
  try {
    await prisma.$connect()
    await prisma.$queryRaw`SELECT 1 as test`
    success('Database Connection', 'Successfully connected to database')
    testResults.dbConnection = true
  } catch (err) {
    error('Database Connection', `Failed to connect: ${err.message}`)
    console.log(err)
    return testResults // Stop if DB connection fails
  }

  // ==========================================
  // TEST 2: Check if avatar_projects table exists
  // ==========================================
  info('TEST 2/7', 'Checking if avatar_projects table exists...')
  try {
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'avatar_projects'
      ) as table_exists
    `

    if (result[0]?.table_exists) {
      success('Table Exists', 'avatar_projects table found in database')
      testResults.tableExists = true

      // Check table structure
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'avatar_projects'
        ORDER BY ordinal_position
      `
      info('Table Structure', '')
      console.log(columns)
    } else {
      error('Table Exists', 'avatar_projects table NOT FOUND!')
      warning('SOLUTION', 'Run: cd backend && bunx prisma migrate dev')
    }
  } catch (err) {
    error('Table Check', `Failed to check table: ${err.message}`)
    console.log(err)
  }

  // ==========================================
  // TEST 3: Check if any users exist
  // ==========================================
  info('TEST 3/7', 'Checking if users exist in database...')
  try {
    const userCount = await prisma.user.count()

    if (userCount === 0) {
      error('User Check', 'No users found in database!')
      warning('SOLUTION', 'You need to register a user first')
      testResults.userExists = false
    } else {
      success('User Check', `Found ${userCount} user(s) in database`)

      // Get first user for testing
      const testUser = await prisma.user.findFirst()
      info('Test User', `Using user: ${testUser.email} (ID: ${testUser.id})`)

      testResults.userExists = true
      testResults.testUserId = testUser.id
      testResults.testUserEmail = testUser.email

      // Generate auth token for testing
      try {
        const token = signToken({ userId: testUser.id, email: testUser.email })
        testResults.authToken = token
        success('Auth Token', 'Generated test authentication token')
      } catch (err) {
        error('Auth Token', `Failed to generate token: ${err.message}`)
      }
    }
  } catch (err) {
    error('User Check', `Failed to check users: ${err.message}`)
    console.log(err)
  }

  // ==========================================
  // TEST 4: Test Prisma Create Directly
  // ==========================================
  if (testResults.tableExists && testResults.userExists) {
    info('TEST 4/7', 'Testing Prisma create directly...')
    try {
      const testProject = await prisma.avatarProject.create({
        data: {
          userId: testResults.testUserId,
          name: `Test Project ${Date.now()}`,
          description: 'Diagnostic test project',
        },
        include: {
          avatars: true,
        },
      })

      success('Prisma Create', `Created project: ${testProject.name} (ID: ${testProject.id})`)
      testResults.prismaCreate = true
      testResults.testProjectId = testProject.id

      // Verify it was created
      const found = await prisma.avatarProject.findUnique({
        where: { id: testProject.id },
      })

      if (found) {
        success('Prisma Read', 'Successfully read back created project')

        // Clean up test project
        await prisma.avatarProject.delete({
          where: { id: testProject.id },
        })
        info('Cleanup', 'Deleted test project')
      }
    } catch (err) {
      error('Prisma Create', `Failed to create via Prisma: ${err.message}`)
      console.log(err)

      // Check specific error types
      if (err.code === 'P2002') {
        warning('ERROR ANALYSIS', 'Unique constraint violation')
      } else if (err.code === 'P2003') {
        warning('ERROR ANALYSIS', 'Foreign key constraint violation')
      } else if (err.message.includes('does not exist')) {
        warning('ERROR ANALYSIS', 'Table does not exist - run migrations!')
      }
    }
  }

  // ==========================================
  // TEST 5: Test API Endpoint
  // ==========================================
  if (testResults.authToken) {
    info('TEST 5/7', 'Testing API endpoint...')
    try {
      // Check if backend is running
      const healthCheck = await fetch('http://localhost:3000/api/health').catch(() => null)

      if (!healthCheck) {
        error('Backend Server', 'Backend server is NOT running on port 3000')
        warning('SOLUTION', 'Run: cd backend && bun run dev')
      } else {
        success('Backend Server', 'Backend server is running')

        // Test the create project endpoint
        info('API Test', 'Sending POST request to /api/apps/avatar-creator/projects')

        const response = await fetch('http://localhost:3000/api/apps/avatar-creator/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${testResults.authToken}`,
          },
          body: JSON.stringify({
            name: `API Test Project ${Date.now()}`,
            description: 'Testing from diagnostic script',
          }),
        })

        const responseData = await response.json()

        console.log(`   Status: ${response.status}`)
        console.log(`   Response:`, responseData)

        if (response.status === 201) {
          success('API Endpoint', 'Successfully created project via API')
          testResults.apiEndpoint = true

          // Clean up
          if (responseData.project?.id) {
            await fetch(`http://localhost:3000/api/apps/avatar-creator/projects/${responseData.project.id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${testResults.authToken}`,
              },
            })
            info('Cleanup', 'Deleted test project via API')
          }
        } else if (response.status === 400) {
          error('API Endpoint', `Got 400 Bad Request`)
          warning('ERROR DETAILS', JSON.stringify(responseData, null, 2))

          // Analyze the error
          if (responseData.error === 'Validation error') {
            warning('ERROR TYPE', 'Zod validation failed')
            console.log('   Validation details:', responseData.details)
          } else {
            warning('ERROR TYPE', responseData.error)
          }
        } else if (response.status === 401) {
          error('API Endpoint', 'Authentication failed (401 Unauthorized)')
        } else {
          error('API Endpoint', `Unexpected status: ${response.status}`)
        }
      }
    } catch (err) {
      error('API Test', `Failed to test API: ${err.message}`)
      console.log(err)
    }
  }

  // ==========================================
  // TEST 6: Test Validation Schema
  // ==========================================
  info('TEST 6/7', 'Testing Zod validation schema...')
  try {
    const { z } = await import('zod')

    const createProjectSchema = z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
    })

    // Test valid data
    const validData = {
      name: 'Test Project',
      description: 'Test Description',
    }

    const result = createProjectSchema.safeParse(validData)
    if (result.success) {
      success('Validation Schema', 'Valid data passed validation')
    } else {
      error('Validation Schema', 'Valid data failed validation!')
      console.log(result.error)
    }

    // Test edge cases
    const edgeCases = [
      { name: '', description: 'Empty name' }, // Should fail
      { name: 'A'.repeat(101), description: 'Too long' }, // Should fail
      { name: 'Valid', description: 'A'.repeat(501) }, // Should fail
      { name: 'Valid Only' }, // Should pass (no description)
    ]

    for (const testCase of edgeCases) {
      const result = createProjectSchema.safeParse(testCase)
      console.log(`   ${result.success ? '✅' : '❌'} ${JSON.stringify(testCase).substring(0, 60)}...`)
    }

    testResults.validation = true
  } catch (err) {
    error('Validation Test', `Failed to test validation: ${err.message}`)
  }

  // ==========================================
  // TEST 7: Check Browser Console Error
  // ==========================================
  info('TEST 7/7', 'Browser-side debugging instructions')
  console.log(`
   To debug in browser:
   1. Open DevTools (F12)
   2. Go to Network tab
   3. Try creating a project
   4. Click the failed request
   5. Check:
      - Request Headers (Authorization header present?)
      - Request Payload (name and description correct?)
      - Response (what error message?)
   `)

  // ==========================================
  // FINAL REPORT
  // ==========================================
  console.log('\n' + '='.repeat(80))
  console.log('📊 TEST RESULTS SUMMARY')
  console.log('='.repeat(80))

  const tests = [
    { name: 'Database Connection', result: testResults.dbConnection },
    { name: 'Table Exists', result: testResults.tableExists },
    { name: 'User Exists', result: testResults.userExists },
    { name: 'Prisma Create', result: testResults.prismaCreate },
    { name: 'Auth Token', result: testResults.authToken !== false },
    { name: 'API Endpoint', result: testResults.apiEndpoint },
    { name: 'Validation Schema', result: testResults.validation },
  ]

  tests.forEach((test, index) => {
    const icon = test.result ? '✅' : '❌'
    const color = test.result ? colors.green : colors.red
    console.log(`${color}${icon} ${test.name}${colors.reset}`)
  })

  const passedTests = tests.filter(t => t.result).length
  const totalTests = tests.length

  console.log('\n' + '='.repeat(80))
  if (passedTests === totalTests) {
    success('ALL TESTS PASSED', `${passedTests}/${totalTests} tests successful`)
    console.log('\n❓ If all tests pass but browser still fails:')
    console.log('   1. Check browser console for exact error')
    console.log('   2. Verify frontend is connecting to correct backend URL')
    console.log('   3. Check CORS configuration')
    console.log('   4. Verify auth token is being sent correctly')
  } else {
    error('TESTS FAILED', `Only ${passedTests}/${totalTests} tests passed`)
    console.log('\n📋 NEXT STEPS:')

    if (!testResults.dbConnection) {
      console.log('   1. Check DATABASE_URL in .env file')
      console.log('   2. Ensure PostgreSQL is running')
    }

    if (!testResults.tableExists) {
      console.log('   1. Run: cd backend && bunx prisma migrate dev')
      console.log('   2. Or: bunx prisma db push')
    }

    if (!testResults.prismaCreate) {
      console.log('   1. Run: cd backend && bunx prisma generate')
      console.log('   2. Restart backend server')
    }

    if (!testResults.userExists) {
      console.log('   1. Register a user via frontend')
      console.log('   2. Or create user directly in database')
    }
  }

  console.log('\n' + '='.repeat(80))

  // Disconnect
  await prisma.$disconnect()

  return testResults
}

// Run tests
runTests()
  .then((results) => {
    console.log('\n✨ Diagnostic test completed\n')
    process.exit(results.apiEndpoint ? 0 : 1)
  })
  .catch((err) => {
    console.error('\n❌ Diagnostic test crashed:', err)
    process.exit(1)
  })
