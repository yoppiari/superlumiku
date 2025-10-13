/**
 * DEBUG ROUTES - TEMPORARY FOR PRODUCTION DEBUGGING
 * These routes help diagnose the 400 error in production
 *
 * DELETE THIS FILE AFTER DEBUGGING IS COMPLETE!
 */

import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth.middleware'
import prisma from '../../db/client'

const debugRoutes = new Hono()

// ========================================
// DEBUG: Test Database Connection
// ========================================
debugRoutes.get('/debug/db-connection', async (c) => {
  try {
    console.log('DEBUG: Testing database connection...')

    // Test 1: Raw query
    const rawTest = await prisma.$queryRaw`SELECT 1 as test`
    console.log('DEBUG: Raw query result:', rawTest)

    // Test 2: Check if avatar_projects table exists
    const tableCheck = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'avatar_projects'
      ) as exists
    `
    console.log('DEBUG: Table check result:', tableCheck)

    // Test 3: Try to query avatar_projects
    const projectsCount = await prisma.avatarProject.count()
    console.log('DEBUG: Avatar projects count:', projectsCount)

    return c.json({
      success: true,
      tests: {
        rawQuery: rawTest,
        tableExists: tableCheck,
        projectsCount: projectsCount,
      },
      databaseUrl: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@'), // Hide password
      prismaVersion: '5.22.0',
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('DEBUG: Database connection test failed:', error)
    return c.json({
      success: false,
      error: error.message,
      code: error.code,
      stack: error.stack,
      databaseUrl: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@'),
    }, 500)
  }
})

// ========================================
// DEBUG: Test Create Project (Without Auth)
// ========================================
debugRoutes.post('/debug/test-create-project', async (c) => {
  try {
    const body = await c.req.json()
    console.log('DEBUG: Attempting to create project with data:', body)

    // Get first user for testing
    const testUser = await prisma.user.findFirst()
    console.log('DEBUG: Found test user:', testUser?.id, testUser?.email)

    if (!testUser) {
      return c.json({
        success: false,
        error: 'No users found in database',
        hint: 'Need to create a user first',
      }, 400)
    }

    // Try to create project
    console.log('DEBUG: Creating project...')
    const project = await prisma.avatarProject.create({
      data: {
        userId: testUser.id,
        name: body.name || `Debug Test ${Date.now()}`,
        description: body.description || 'Debug test project',
      },
      include: {
        avatars: true,
      },
    })

    console.log('DEBUG: Project created successfully:', project.id)

    // Clean up - delete the test project
    await prisma.avatarProject.delete({
      where: { id: project.id },
    })
    console.log('DEBUG: Test project deleted')

    return c.json({
      success: true,
      message: 'Test project created and deleted successfully',
      testProjectId: project.id,
      testUserId: testUser.id,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('DEBUG: Create project test failed:', error)
    return c.json({
      success: false,
      error: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
      prismaVersion: '5.22.0',
    }, 500)
  }
})

// ========================================
// DEBUG: Test With Auth
// ========================================
debugRoutes.post('/debug/test-with-auth', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const body = await c.req.json()

    console.log('DEBUG: Authenticated test for user:', userId)
    console.log('DEBUG: Request body:', body)

    // Try to create project
    const project = await prisma.avatarProject.create({
      data: {
        userId: userId,
        name: body.name || `Auth Test ${Date.now()}`,
        description: body.description || 'Authenticated test project',
      },
      include: {
        avatars: true,
      },
    })

    console.log('DEBUG: Project created with auth:', project.id)

    // Clean up
    await prisma.avatarProject.delete({
      where: { id: project.id },
    })

    return c.json({
      success: true,
      message: 'Authenticated test passed',
      userId: userId,
      testProjectId: project.id,
    })
  } catch (error: any) {
    console.error('DEBUG: Authenticated test failed:', error)
    return c.json({
      success: false,
      error: error.message,
      code: error.code,
      userId: c.get('userId'),
      stack: error.stack,
    }, 500)
  }
})

// ========================================
// DEBUG: Check Environment
// ========================================
debugRoutes.get('/debug/environment', async (c) => {
  return c.json({
    nodeEnv: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@'),
    postgresHost: process.env.POSTGRES_HOST,
    postgresDb: process.env.POSTGRES_DB,
    prismaVersion: '5.22.0',
    nodeVersion: process.version,
    platform: process.platform,
    cwd: process.cwd(),
    timestamp: new Date().toISOString(),
  })
})

// ========================================
// DEBUG: Full Diagnostic
// ========================================
debugRoutes.get('/debug/full-diagnostic', async (c) => {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: {},
  }

  // Test 1: Database connection
  try {
    await prisma.$queryRaw`SELECT 1`
    results.tests.databaseConnection = { success: true }
  } catch (error: any) {
    results.tests.databaseConnection = {
      success: false,
      error: error.message,
      code: error.code,
    }
  }

  // Test 2: Tables exist
  try {
    const tables = ['users', 'avatar_projects', 'avatars', 'sessions', 'credits']
    const checks: any = {}

    for (const table of tables) {
      const result = await prisma.$queryRaw<any[]>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = ${table}
        ) as exists
      `
      checks[table] = result[0]?.exists || false
    }

    results.tests.tablesExist = { success: true, tables: checks }
  } catch (error: any) {
    results.tests.tablesExist = {
      success: false,
      error: error.message,
    }
  }

  // Test 3: User exists
  try {
    const userCount = await prisma.user.count()
    results.tests.usersExist = {
      success: userCount > 0,
      count: userCount,
    }
  } catch (error: any) {
    results.tests.usersExist = {
      success: false,
      error: error.message,
    }
  }

  // Test 4: Try to create and delete project
  try {
    const testUser = await prisma.user.findFirst()
    if (!testUser) {
      results.tests.createProject = {
        success: false,
        error: 'No users found',
      }
    } else {
      const project = await prisma.avatarProject.create({
        data: {
          userId: testUser.id,
          name: `Diagnostic ${Date.now()}`,
          description: 'Auto-diagnostic test',
        },
      })

      await prisma.avatarProject.delete({
        where: { id: project.id },
      })

      results.tests.createProject = {
        success: true,
        testProjectId: project.id,
      }
    }
  } catch (error: any) {
    results.tests.createProject = {
      success: false,
      error: error.message,
      code: error.code,
      meta: error.meta,
    }
  }

  // Environment info
  results.environment = {
    nodeEnv: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@'),
    postgresHost: process.env.POSTGRES_HOST,
  }

  // Determine overall status
  const allTestsPassed = Object.values(results.tests).every(
    (test: any) => test.success === true
  )

  return c.json({
    overallStatus: allTestsPassed ? 'HEALTHY' : 'ISSUES_DETECTED',
    ...results,
  })
})

export default debugRoutes
