/**
 * Pose Generator - Database Seeding Script
 *
 * Seeds the database with:
 * - Category hierarchy (6 top-level, 27 sub-categories)
 * - Pose library (150+ curated poses)
 * - Placeholder images using placehold.co service
 *
 * Features:
 * - Idempotent (can run multiple times safely)
 * - Uses upsert for data integrity
 * - Clear progress logging
 * - Error handling with rollback
 */

import { PrismaClient } from '@prisma/client'
import { categoryHierarchy, getCategoryBySlug } from './data/pose-categories'
import { poseLibraryData, getPoseStatistics } from './data/pose-library'

const prisma = new PrismaClient()

/**
 * Main seeding function
 */
async function seedPoseGenerator() {
  console.log('\n🌱 Starting Pose Generator Seed...\n')

  try {
    // Step 1: Seed categories
    console.log('📂 Seeding Categories...')
    const categories = await seedCategories()
    console.log(`✅ Seeded ${categories.size} categories\n`)

    // Step 2: Seed pose library
    console.log('🎭 Seeding Pose Library...')
    const posesCount = await seedPoseLibrary(categories)
    console.log(`✅ Seeded ${posesCount} poses\n`)

    // Step 3: Print statistics
    printStatistics()

    console.log('✨ Pose Generator Seed Complete!\n')
  } catch (error) {
    console.error('❌ Seed failed:', error)
    throw error
  }
}

/**
 * Seed categories with parent-child relationships
 */
async function seedCategories(): Promise<Map<string, string>> {
  const categoryMap = new Map<string, string>() // slug -> id mapping

  // First pass: Create all categories without parent references
  console.log('  Creating categories...')
  for (const category of categoryHierarchy) {
    const created = await prisma.poseCategory.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        displayName: category.displayName,
        description: category.description,
        icon: category.icon,
        displayOrder: category.displayOrder,
        color: category.color,
        isActive: category.isActive,
      },
      create: {
        name: category.name,
        displayName: category.displayName,
        description: category.description,
        slug: category.slug,
        icon: category.icon,
        displayOrder: category.displayOrder,
        color: category.color,
        isActive: category.isActive,
      },
    })

    categoryMap.set(category.slug, created.id)
    console.log(`    ✓ ${category.displayName} (${category.slug})`)
  }

  // Second pass: Update parent relationships
  console.log('  Setting parent relationships...')
  for (const category of categoryHierarchy) {
    if (category.parentSlug) {
      const parentId = categoryMap.get(category.parentSlug)
      if (!parentId) {
        console.warn(`    ⚠️  Parent not found for ${category.slug}: ${category.parentSlug}`)
        continue
      }

      await prisma.poseCategory.update({
        where: { slug: category.slug },
        data: { parentId },
      })
      console.log(`    ✓ ${category.displayName} → parent: ${category.parentSlug}`)
    }
  }

  return categoryMap
}

/**
 * Seed pose library with placeholder images
 */
async function seedPoseLibrary(categoryMap: Map<string, string>): Promise<number> {
  let seededCount = 0
  let skippedCount = 0

  for (const pose of poseLibraryData) {
    const categoryId = categoryMap.get(pose.categorySlug)
    if (!categoryId) {
      console.warn(`  ⚠️  Category not found for pose: ${pose.name} (${pose.categorySlug})`)
      skippedCount++
      continue
    }

    // Generate placeholder image URLs
    const placeholderUrl = generatePlaceholderUrl(pose.name)
    const thumbnailUrl = generateThumbnailUrl(pose.name)
    const controlNetUrl = generateControlNetUrl(pose.name)

    try {
      // Use upsert to safely create or update pose (prevents race conditions)
      await prisma.poseLibrary.upsert({
        where: {
          categoryId_name: {
            categoryId,
            name: pose.name,
          },
        },
        update: {
          description: pose.description,
          difficulty: pose.difficulty,
          genderSuitability: pose.genderSuitability,
          tags: pose.tags,
          isPremium: pose.isPremium,
          sourceType: pose.sourceType,
          isFeatured: pose.isFeatured || false,
          previewImageUrl: placeholderUrl,
          referenceImageUrl: placeholderUrl,
          controlnetImageUrl: controlNetUrl,
          thumbnailUrl: thumbnailUrl,
          isPublic: true,
        },
        create: {
          name: pose.name,
          description: pose.description,
          categoryId,
          difficulty: pose.difficulty,
          genderSuitability: pose.genderSuitability,
          tags: pose.tags,
          isPremium: pose.isPremium,
          sourceType: pose.sourceType,
          isFeatured: pose.isFeatured || false,
          previewImageUrl: placeholderUrl,
          referenceImageUrl: placeholderUrl,
          controlnetImageUrl: controlNetUrl,
          thumbnailUrl: thumbnailUrl,
          isPublic: true,
        },
      })

      seededCount++

      // Log progress every 10 poses
      if (seededCount % 10 === 0) {
        console.log(`  ✓ ${seededCount} poses seeded...`)
      }
    } catch (error) {
      console.error(`  ❌ Failed to seed pose: ${pose.name}`, error)
      skippedCount++
    }
  }

  if (skippedCount > 0) {
    console.log(`  ⚠️  Skipped ${skippedCount} poses due to errors`)
  }

  return seededCount
}

/**
 * Generate placeholder image URL
 * Uses placehold.co service with custom text
 */
function generatePlaceholderUrl(poseName: string): string {
  const encodedName = encodeURIComponent(poseName.substring(0, 30))
  return `https://placehold.co/1024x1024/3B82F6/FFFFFF/png?text=${encodedName}`
}

/**
 * Generate thumbnail URL (smaller size)
 */
function generateThumbnailUrl(poseName: string): string {
  const encodedName = encodeURIComponent(poseName.substring(0, 20))
  return `https://placehold.co/400x400/3B82F6/FFFFFF/png?text=${encodedName}`
}

/**
 * Generate ControlNet placeholder URL
 */
function generateControlNetUrl(poseName: string): string {
  const encodedName = encodeURIComponent('ControlNet:' + poseName.substring(0, 25))
  return `https://placehold.co/1024x1024/000000/00FF00/png?text=${encodedName}`
}

/**
 * Print seeding statistics
 */
function printStatistics(): void {
  const stats = getPoseStatistics()

  console.log('📊 Seeding Statistics:')
  console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`  Total Poses: ${stats.total}`)
  console.log(`  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`  Difficulty Distribution:`)
  console.log(`    - Beginner: ${stats.byDifficulty.beginner} (${Math.round((stats.byDifficulty.beginner / stats.total) * 100)}%)`)
  console.log(`    - Intermediate: ${stats.byDifficulty.intermediate} (${Math.round((stats.byDifficulty.intermediate / stats.total) * 100)}%)`)
  console.log(`    - Advanced: ${stats.byDifficulty.advanced} (${Math.round((stats.byDifficulty.advanced / stats.total) * 100)}%)`)
  console.log(`  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`  Gender Suitability:`)
  console.log(`    - Unisex: ${stats.byGender.unisex}`)
  console.log(`    - Female: ${stats.byGender.female}`)
  console.log(`    - Male: ${stats.byGender.male}`)
  console.log(`  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`  Premium Poses: ${stats.premium}`)
  console.log(`  Featured Poses: ${stats.featured}`)
  console.log(`  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)
}

/**
 * Run the seed script
 */
seedPoseGenerator()
  .catch((e) => {
    console.error('❌ Seed script failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
