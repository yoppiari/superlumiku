/**
 * 🔧 Force Sync Database Schema
 *
 * This script forcefully syncs the Prisma schema to the database
 * with multiple retry attempts and fallback mechanisms.
 */

import { execSync } from 'child_process'
import prisma from '../src/db/client'

const MAX_RETRIES = 3
const RETRY_DELAY = 2000 // 2 seconds

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$connect()
    await prisma.$disconnect()
    return true
  } catch {
    return false
  }
}

async function waitForDatabase(maxAttempts = 10): Promise<void> {
  console.log('⏳ Waiting for database connection...')

  for (let i = 1; i <= maxAttempts; i++) {
    const connected = await checkDatabaseConnection()

    if (connected) {
      console.log('✅ Database is ready!')
      return
    }

    console.log(`   Attempt ${i}/${maxAttempts} - Database not ready, retrying...`)
    await sleep(2000)
  }

  throw new Error('Database connection timeout')
}

async function runPrismaGenerate(): Promise<boolean> {
  console.log('\n1️⃣ Generating Prisma Client...')

  try {
    execSync('bun prisma generate', {
      stdio: 'inherit',
      cwd: process.cwd()
    })
    console.log('✅ Prisma Client generated successfully')
    return true
  } catch (error: any) {
    console.log('❌ Failed to generate Prisma Client:', error.message)
    return false
  }
}

async function runPrismaDbPush(): Promise<boolean> {
  console.log('\n2️⃣ Pushing schema to database (db push)...')

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`   Attempt ${attempt}/${MAX_RETRIES}`)

      execSync('bun prisma db push --accept-data-loss --skip-generate', {
        stdio: 'inherit',
        cwd: process.cwd(),
        timeout: 30000 // 30 second timeout
      })

      console.log('✅ Schema pushed successfully via db push')
      return true

    } catch (error: any) {
      console.log(`❌ Attempt ${attempt} failed:`, error.message)

      if (attempt < MAX_RETRIES) {
        console.log(`   Retrying in ${RETRY_DELAY / 1000} seconds...`)
        await sleep(RETRY_DELAY)
      }
    }
  }

  return false
}

async function runPrismaMigrateDeploy(): Promise<boolean> {
  console.log('\n3️⃣ Running migrations (migrate deploy)...')

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`   Attempt ${attempt}/${MAX_RETRIES}`)

      execSync('bun prisma migrate deploy', {
        stdio: 'inherit',
        cwd: process.cwd(),
        timeout: 30000
      })

      console.log('✅ Migrations deployed successfully')
      return true

    } catch (error: any) {
      console.log(`❌ Attempt ${attempt} failed:`, error.message)

      if (attempt < MAX_RETRIES) {
        console.log(`   Retrying in ${RETRY_DELAY / 1000} seconds...`)
        await sleep(RETRY_DELAY)
      }
    }
  }

  return false
}

async function verifyAvatarProjectsTable(): Promise<boolean> {
  console.log('\n4️⃣ Verifying avatar_projects table...')

  try {
    await prisma.$connect()

    const result = await prisma.$queryRaw<any[]>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'avatar_projects'
      ) as exists
    `

    const exists = result[0]?.exists

    if (exists) {
      console.log('✅ Table avatar_projects exists!')

      // Test if we can query it
      const count = await prisma.avatarProject.findMany({ take: 1 })
      console.log('✅ Can successfully query avatar_projects table')

      return true
    } else {
      console.log('❌ Table avatar_projects does NOT exist')
      return false
    }

  } catch (error: any) {
    console.log('❌ Verification failed:', error.message)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

async function createTableDirectly(): Promise<boolean> {
  console.log('\n5️⃣ FALLBACK: Creating table directly via SQL...')

  try {
    await prisma.$connect()

    // Create table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "avatar_projects" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL
      )
    `

    console.log('✅ Table created')

    // Create index
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "avatar_projects_userId_idx"
      ON "avatar_projects"("userId")
    `

    console.log('✅ Index created')

    return true

  } catch (error: any) {
    console.log('❌ Direct SQL creation failed:', error.message)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

async function main() {
  console.log('═══════════════════════════════════════════')
  console.log('🔧 FORCE SYNC DATABASE SCHEMA')
  console.log('═══════════════════════════════════════════\n')

  try {
    // Step 0: Wait for database
    await waitForDatabase()

    // Step 1: Generate Prisma Client
    const generateSuccess = await runPrismaGenerate()
    if (!generateSuccess) {
      console.log('\n⚠️  Warning: Prisma Client generation failed, continuing anyway...')
    }

    // Step 2: Try db push first (safest)
    const dbPushSuccess = await runPrismaDbPush()

    // Step 3: If db push fails, try migrate deploy
    let migrateSuccess = false
    if (!dbPushSuccess) {
      console.log('\n⚠️  db push failed, trying migrate deploy...')
      migrateSuccess = await runPrismaMigrateDeploy()
    }

    // Step 4: Verify the table exists
    const verified = await verifyAvatarProjectsTable()

    // Step 5: If still not exists, create directly
    if (!verified) {
      console.log('\n⚠️  Table still does not exist, using fallback SQL creation...')
      const directSuccess = await createTableDirectly()

      if (directSuccess) {
        // Verify again
        const finalVerification = await verifyAvatarProjectsTable()

        if (finalVerification) {
          console.log('\n═══════════════════════════════════════════')
          console.log('🎉 SUCCESS! Database schema synced via fallback')
          console.log('═══════════════════════════════════════════')
          process.exit(0)
        }
      }

      console.log('\n═══════════════════════════════════════════')
      console.log('❌ FAILED: Could not create avatar_projects table')
      console.log('═══════════════════════════════════════════')
      console.log('\n📝 Manual intervention required:')
      console.log('   1. Check database permissions')
      console.log('   2. Check DATABASE_URL environment variable')
      console.log('   3. Try running SQL manually in psql')
      process.exit(1)
    }

    console.log('\n═══════════════════════════════════════════')
    console.log('🎉 SUCCESS! Database schema fully synced')
    console.log('═══════════════════════════════════════════')
    process.exit(0)

  } catch (error: any) {
    console.error('\n💥 Fatal error:', error.message)
    process.exit(1)
  }
}

// Run
main()
