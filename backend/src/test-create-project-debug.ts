/**
 * DEBUG SCRIPT - Test Create Project with Detailed Logging
 *
 * This script simulates what happens when the API receives a create project request
 * It will show EXACTLY where the error occurs
 */

import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn', 'info'],
})

// Copy exact validation schema from routes.ts
const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
})

async function testCreateProject() {
  console.log('🔍 Testing Create Project Flow with Debug Logging\n')

  // STEP 1: Get a test user
  console.log('Step 1: Finding test user...')
  const testUser = await prisma.user.findFirst()

  if (!testUser) {
    console.error('❌ No user found! Please register a user first.')
    process.exit(1)
  }

  console.log(`✅ Found user: ${testUser.email} (ID: ${testUser.id})`)

  // STEP 2: Prepare request data (simulating frontend)
  const requestBody = {
    name: 'Cobain Lagi 2',
    description: 'Cobain 15 kali',
  }

  console.log('\nStep 2: Request data:')
  console.log(JSON.stringify(requestBody, null, 2))

  // STEP 3: Validate with Zod
  console.log('\nStep 3: Validating with Zod schema...')
  try {
    const validated = createProjectSchema.parse(requestBody)
    console.log('✅ Validation passed:')
    console.log(JSON.stringify(validated, null, 2))
  } catch (error) {
    console.error('❌ Validation failed!')
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.errors)
    }
    process.exit(1)
  }

  // STEP 4: Check if table exists
  console.log('\nStep 4: Checking if avatar_projects table exists...')
  try {
    const tableCheck = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'avatar_projects'
      ) as exists
    `
    console.log('Table check result:', tableCheck)

    if (!tableCheck[0]?.exists) {
      console.error('❌ avatar_projects table does NOT exist!')
      console.error('   Run: bunx prisma migrate dev')
      process.exit(1)
    }

    console.log('✅ avatar_projects table exists')
  } catch (error) {
    console.error('❌ Failed to check table:', error)
  }

  // STEP 5: Attempt to create project
  console.log('\nStep 5: Creating project via Prisma...')
  console.log('Calling: prisma.avatarProject.create()')
  console.log('Data:', {
    userId: testUser.id,
    name: requestBody.name,
    description: requestBody.description || null,
  })

  try {
    const project = await prisma.avatarProject.create({
      data: {
        userId: testUser.id,
        name: requestBody.name,
        description: requestBody.description || null,
      },
      include: {
        avatars: true,
      },
    })

    console.log('\n✅ SUCCESS! Project created:')
    console.log(JSON.stringify(project, null, 2))

    // STEP 6: Verify we can read it back
    console.log('\nStep 6: Verifying project was saved...')
    const found = await prisma.avatarProject.findUnique({
      where: { id: project.id },
      include: { avatars: true },
    })

    if (found) {
      console.log('✅ Project found in database')
    }

    // STEP 7: Clean up
    console.log('\nStep 7: Cleaning up test data...')
    await prisma.avatarProject.delete({
      where: { id: project.id },
    })
    console.log('✅ Test project deleted')

    console.log('\n🎉 ALL STEPS PASSED!')
    console.log('\n📊 CONCLUSION:')
    console.log('   The backend code is working correctly.')
    console.log('   The error must be happening at:')
    console.log('   1. Network level (request not reaching backend)')
    console.log('   2. Authentication (invalid token)')
    console.log('   3. Frontend sending wrong data')
    console.log('\n   Next: Check browser DevTools Network tab')
  } catch (error: any) {
    console.error('\n❌ FAILED at Prisma create step!')
    console.error('Error type:', error.constructor.name)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)

    if (error.code) {
      console.error('\n📋 Prisma Error Code Analysis:')
      const errorCodes: Record<string, string> = {
        P2002: 'Unique constraint violation - duplicate value',
        P2003: 'Foreign key constraint failed',
        P2025: 'Record not found',
        P1001: 'Cannot reach database server',
        P1003: 'Database does not exist',
        P2021: 'Table does not exist',
      }

      console.error(`   ${error.code}: ${errorCodes[error.code] || 'Unknown error'}`)
    }

    if (error.meta) {
      console.error('\nError metadata:', error.meta)
    }

    console.error('\nFull error stack:')
    console.error(error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

testCreateProject()
