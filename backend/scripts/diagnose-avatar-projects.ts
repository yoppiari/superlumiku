/**
 * 🔍 Avatar Projects Database Diagnosis Script
 *
 * This script checks the current state of avatar_projects table and Prisma Client
 * to diagnose the 400 error when creating projects.
 */

import prisma from '../src/db/client'
import { execSync } from 'child_process'

async function diagnose() {
  console.log('🔍 Starting Avatar Projects Diagnosis...\n')

  // Test 1: Database Connection
  console.log('📡 Test 1: Database Connection')
  try {
    await prisma.$connect()
    console.log('✅ Successfully connected to database')
  } catch (error: any) {
    console.log('❌ Failed to connect to database:', error.message)
    process.exit(1)
  }

  // Test 2: Check if avatar_projects table exists
  console.log('\n📊 Test 2: Check avatar_projects table existence')
  try {
    const result = await prisma.$queryRaw<any[]>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'avatar_projects'
      ) as exists
    `

    if (result[0]?.exists) {
      console.log('✅ Table avatar_projects EXISTS')

      // Get table structure
      const columns = await prisma.$queryRaw<any[]>`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'avatar_projects'
        ORDER BY ordinal_position
      `

      console.log('   Table structure:')
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`)
      })

      // Check row count
      const count = await prisma.$queryRaw<any[]>`SELECT COUNT(*) as count FROM avatar_projects`
      console.log(`   Row count: ${count[0].count}`)

    } else {
      console.log('❌ Table avatar_projects DOES NOT EXIST')
      console.log('   This is the root cause of the 400 error!')
    }
  } catch (error: any) {
    console.log('❌ Error checking table:', error.message)
    if (error.message.includes('does not exist')) {
      console.log('   ⚠️  CONFIRMED: Table avatar_projects does not exist!')
    }
  }

  // Test 3: Check Prisma Client Model
  console.log('\n🔧 Test 3: Check Prisma Client')
  try {
    // Check if Prisma Client has avatarProject model
    if ('avatarProject' in prisma) {
      console.log('✅ Prisma Client has avatarProject model')

      // Try to execute a simple query
      try {
        const projects = await prisma.avatarProject.findMany({ take: 1 })
        console.log('✅ Can query avatarProject model')
        console.log(`   Found ${projects.length} projects`)
      } catch (error: any) {
        console.log('❌ Cannot query avatarProject model:', error.message)
        if (error.message.includes('does not exist')) {
          console.log('   ⚠️  Table exists in Prisma Client but not in database!')
        }
      }
    } else {
      console.log('❌ Prisma Client does NOT have avatarProject model')
      console.log('   Need to run: bun prisma generate')
    }
  } catch (error: any) {
    console.log('❌ Error checking Prisma Client:', error.message)
  }

  // Test 4: Check other related tables
  console.log('\n📋 Test 4: Check related tables')
  const tablesToCheck = ['users', 'avatars', 'avatar_usage_history']

  for (const table of tablesToCheck) {
    try {
      const result = await prisma.$queryRaw<any[]>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = ${table}
        ) as exists
      `

      const exists = result[0]?.exists
      console.log(`   ${exists ? '✅' : '❌'} ${table}: ${exists ? 'EXISTS' : 'MISSING'}`)
    } catch (error: any) {
      console.log(`   ❌ ${table}: ERROR - ${error.message}`)
    }
  }

  // Test 5: Check Prisma migrations
  console.log('\n🔄 Test 5: Check Prisma migrations status')
  try {
    const migrations = await prisma.$queryRaw<any[]>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = '_prisma_migrations'
      ) as exists
    `

    if (migrations[0]?.exists) {
      console.log('✅ Prisma migrations table exists')

      const migrationHistory = await prisma.$queryRaw<any[]>`
        SELECT migration_name, finished_at, applied_steps_count
        FROM _prisma_migrations
        ORDER BY finished_at DESC
        LIMIT 5
      `

      console.log('   Recent migrations:')
      migrationHistory.forEach(m => {
        console.log(`   - ${m.migration_name} (${m.finished_at ? new Date(m.finished_at).toISOString() : 'pending'})`)
      })
    } else {
      console.log('❌ Prisma migrations table does not exist')
      console.log('   Migrations have never been run!')
    }
  } catch (error: any) {
    console.log('❌ Error checking migrations:', error.message)
  }

  // Test 6: Check DATABASE_URL
  console.log('\n🔐 Test 6: Environment Variables')
  const dbUrl = process.env.DATABASE_URL
  if (dbUrl) {
    // Mask password
    const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':****@')
    console.log(`✅ DATABASE_URL is set: ${maskedUrl}`)
  } else {
    console.log('❌ DATABASE_URL is NOT set')
  }

  // Summary
  console.log('\n📊 DIAGNOSIS SUMMARY')
  console.log('═══════════════════════════════════════════')

  const tableExists = await checkTableExists()

  if (!tableExists) {
    console.log('❌ ROOT CAUSE IDENTIFIED:')
    console.log('   Table avatar_projects does not exist in database')
    console.log('')
    console.log('🔧 RECOMMENDED FIXES (in order):')
    console.log('   1. Run: bun prisma db push --accept-data-loss')
    console.log('   2. Or: bun run backend/scripts/force-sync-schema.ts')
    console.log('   3. Or: psql $DATABASE_URL -f fix-avatar-projects-table.sql')
    console.log('')
    console.log('📝 After fix, restart the backend service')
  } else {
    console.log('✅ Table avatar_projects exists')
    console.log('')
    console.log('🔍 Possible other causes:')
    console.log('   1. Check auth middleware (userId not passed)')
    console.log('   2. Check request payload format')
    console.log('   3. Check backend logs for detailed error')
  }

  await prisma.$disconnect()
}

async function checkTableExists(): Promise<boolean> {
  try {
    const result = await prisma.$queryRaw<any[]>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'avatar_projects'
      ) as exists
    `
    return result[0]?.exists || false
  } catch {
    return false
  }
}

// Run diagnosis
diagnose().catch(error => {
  console.error('\n💥 Diagnosis failed with error:', error)
  process.exit(1)
})
