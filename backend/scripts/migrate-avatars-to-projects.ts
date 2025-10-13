/**
 * Migration Script: Avatar to Avatar Projects
 *
 * This script migrates existing avatars to the new project-based system.
 * It creates a default "My Avatars" project for each user with existing avatars
 * and links all their avatars to that project.
 *
 * Run this AFTER deploying the new schema and BEFORE making projectId required.
 */

import prisma from '../src/db/client'

async function migrateAvatarsToProjects() {
  console.log('🚀 Starting avatar migration to project system...\n')

  try {
    // 1. Get all users with avatars that don't have projectId
    const usersWithAvatars = await prisma.avatar.findMany({
      where: { projectId: null },
      select: { userId: true },
      distinct: ['userId']
    })

    console.log(`📊 Found ${usersWithAvatars.length} users with avatars to migrate\n`)

    if (usersWithAvatars.length === 0) {
      console.log('✅ No avatars to migrate. All done!')
      return
    }

    let migratedCount = 0
    let errorCount = 0

    // 2. For each user, create default project and link avatars
    for (const { userId } of usersWithAvatars) {
      try {
        // Count avatars for this user
        const avatarCount = await prisma.avatar.count({
          where: { userId, projectId: null }
        })

        console.log(`👤 Processing user: ${userId} (${avatarCount} avatars)`)

        // Create default project
        const defaultProject = await prisma.avatarProject.create({
          data: {
            userId,
            name: 'My Avatars',
            description: 'Default project for existing avatars'
          }
        })

        console.log(`   ✓ Created project: ${defaultProject.id}`)

        // Link all user's avatars to default project
        const result = await prisma.avatar.updateMany({
          where: { userId, projectId: null },
          data: { projectId: defaultProject.id }
        })

        console.log(`   ✓ Migrated ${result.count} avatars to project\n`)
        migratedCount += result.count

      } catch (error) {
        console.error(`   ✗ Error processing user ${userId}:`, error)
        errorCount++
      }
    }

    // 3. Summary
    console.log('\n' + '='.repeat(60))
    console.log('📋 Migration Summary')
    console.log('='.repeat(60))
    console.log(`✅ Successfully migrated: ${migratedCount} avatars`)
    console.log(`❌ Errors: ${errorCount}`)
    console.log('='.repeat(60))

    // 4. Verify - check if any avatars still have null projectId
    const orphanedAvatars = await prisma.avatar.count({
      where: { projectId: null }
    })

    if (orphanedAvatars > 0) {
      console.log(`\n⚠️  WARNING: ${orphanedAvatars} avatars still have null projectId`)
      console.log('   Please investigate before making projectId required!')
    } else {
      console.log('\n✨ Perfect! All avatars have been migrated.')
      console.log('   You can now safely make projectId required in the schema.')
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migrateAvatarsToProjects()
  .then(() => {
    console.log('\n🎉 Migration completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error)
    process.exit(1)
  })
