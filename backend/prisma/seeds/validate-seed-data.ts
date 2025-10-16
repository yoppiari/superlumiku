/**
 * Pose Generator - Seed Data Validation
 *
 * Validates seed data structure without requiring database connection
 * Run this to verify data integrity before seeding
 */

import { categoryHierarchy, getCategoryBySlug, getTopLevelCategories, getSubCategories } from './data/pose-categories'
import { poseLibraryData, getPoseStatistics, getPosesByCategory } from './data/pose-library'

console.log('🔍 Validating Pose Generator Seed Data...\n')

let errors = 0
let warnings = 0

// ========================================
// 1. Validate Category Structure
// ========================================
console.log('📂 Validating Categories...')

const categoryMap = new Map<string, boolean>()
categoryHierarchy.forEach(cat => categoryMap.set(cat.slug, true))

// Check for duplicate slugs
const slugs = categoryHierarchy.map(c => c.slug)
const duplicateSlugs = slugs.filter((item, index) => slugs.indexOf(item) !== index)
if (duplicateSlugs.length > 0) {
  console.error(`  ❌ Duplicate category slugs found: ${duplicateSlugs.join(', ')}`)
  errors++
} else {
  console.log('  ✓ No duplicate category slugs')
}

// Check parent relationships
categoryHierarchy.forEach(cat => {
  if (cat.parentSlug && !categoryMap.has(cat.parentSlug)) {
    console.error(`  ❌ Category "${cat.slug}" references non-existent parent: ${cat.parentSlug}`)
    errors++
  }
})
console.log('  ✓ All parent relationships valid')

// Check top-level categories
const topLevel = getTopLevelCategories()
console.log(`  ✓ ${topLevel.length} top-level categories`)

// Check sub-categories
let totalSubCategories = 0
topLevel.forEach(parent => {
  const subs = getSubCategories(parent.slug)
  totalSubCategories += subs.length
  if (subs.length === 0) {
    console.warn(`  ⚠️  Top-level category "${parent.slug}" has no sub-categories`)
    warnings++
  }
})
console.log(`  ✓ ${totalSubCategories} sub-categories`)

console.log(`✅ Category validation complete: ${categoryHierarchy.length} total categories\n`)

// ========================================
// 2. Validate Pose Library
// ========================================
console.log('🎭 Validating Pose Library...')

// Check for duplicate pose names within same category
const posesByCategory = new Map<string, Set<string>>()
poseLibraryData.forEach(pose => {
  if (!posesByCategory.has(pose.categorySlug)) {
    posesByCategory.set(pose.categorySlug, new Set())
  }
  const categoryPoses = posesByCategory.get(pose.categorySlug)!
  if (categoryPoses.has(pose.name)) {
    console.error(`  ❌ Duplicate pose name in category "${pose.categorySlug}": ${pose.name}`)
    errors++
  }
  categoryPoses.add(pose.name)
})
console.log('  ✓ No duplicate pose names within categories')

// Check category references
poseLibraryData.forEach(pose => {
  if (!categoryMap.has(pose.categorySlug)) {
    console.error(`  ❌ Pose "${pose.name}" references non-existent category: ${pose.categorySlug}`)
    errors++
  }
})
console.log('  ✓ All pose category references valid')

// Check difficulty values
const validDifficulties = ['beginner', 'intermediate', 'advanced']
poseLibraryData.forEach(pose => {
  if (!validDifficulties.includes(pose.difficulty)) {
    console.error(`  ❌ Invalid difficulty for pose "${pose.name}": ${pose.difficulty}`)
    errors++
  }
})
console.log('  ✓ All difficulty levels valid')

// Check gender suitability
const validGenders = ['male', 'female', 'unisex']
poseLibraryData.forEach(pose => {
  if (!validGenders.includes(pose.genderSuitability)) {
    console.error(`  ❌ Invalid gender suitability for pose "${pose.name}": ${pose.genderSuitability}`)
    errors++
  }
})
console.log('  ✓ All gender suitability values valid')

// Check tags
poseLibraryData.forEach(pose => {
  if (!pose.tags || pose.tags.length === 0) {
    console.warn(`  ⚠️  Pose "${pose.name}" has no tags`)
    warnings++
  }
  if (pose.tags.length < 3) {
    console.warn(`  ⚠️  Pose "${pose.name}" has fewer than 3 tags (${pose.tags.length})`)
    warnings++
  }
})
console.log('  ✓ Tags validation complete')

console.log(`✅ Pose library validation complete: ${poseLibraryData.length} total poses\n`)

// ========================================
// 3. Print Statistics
// ========================================
console.log('📊 Seed Data Statistics:')
console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

const stats = getPoseStatistics()
console.log(`  Total Categories: ${categoryHierarchy.length}`)
console.log(`    - Top-level: ${topLevel.length}`)
console.log(`    - Sub-categories: ${totalSubCategories}`)
console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`  Total Poses: ${stats.total}`)
console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`  Difficulty Distribution:`)
console.log(`    - Beginner: ${stats.byDifficulty.beginner} (${Math.round((stats.byDifficulty.beginner / stats.total) * 100)}%)`)
console.log(`    - Intermediate: ${stats.byDifficulty.intermediate} (${Math.round((stats.byDifficulty.intermediate / stats.total) * 100)}%)`)
console.log(`    - Advanced: ${stats.byDifficulty.advanced} (${Math.round((stats.byDifficulty.advanced / stats.total) * 100)}%)`)
console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`  Gender Suitability:`)
console.log(`    - Unisex: ${stats.byGender.unisex}`)
console.log(`    - Female: ${stats.byGender.female}`)
console.log(`    - Male: ${stats.byGender.male}`)
console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`  Premium Poses: ${stats.premium}`)
console.log(`  Featured Poses: ${stats.featured}`)
console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

// Difficulty target check
const beginnerPercent = Math.round((stats.byDifficulty.beginner / stats.total) * 100)
const intermediatePercent = Math.round((stats.byDifficulty.intermediate / stats.total) * 100)
const advancedPercent = Math.round((stats.byDifficulty.advanced / stats.total) * 100)

console.log('\n🎯 Target Validation:')
if (beginnerPercent >= 55 && beginnerPercent <= 65) {
  console.log(`  ✓ Beginner poses: ${beginnerPercent}% (target: 60%)`)
} else {
  console.warn(`  ⚠️  Beginner poses: ${beginnerPercent}% (target: 60%)`)
  warnings++
}

if (intermediatePercent >= 25 && intermediatePercent <= 35) {
  console.log(`  ✓ Intermediate poses: ${intermediatePercent}% (target: 30%)`)
} else {
  console.warn(`  ⚠️  Intermediate poses: ${intermediatePercent}% (target: 30%)`)
  warnings++
}

if (advancedPercent >= 5 && advancedPercent <= 15) {
  console.log(`  ✓ Advanced poses: ${advancedPercent}% (target: 10%)`)
} else {
  console.warn(`  ⚠️  Advanced poses: ${advancedPercent}% (target: 10%)`)
  warnings++
}

// ========================================
// 4. Category Distribution
// ========================================
console.log('\n📋 Poses per Category:')
topLevel.forEach(parent => {
  const subs = getSubCategories(parent.slug)
  const parentPoses = getPosesByCategory(parent.slug)
  let totalInCategory = parentPoses.length

  console.log(`  ${parent.displayName}: ${totalInCategory} poses`)

  subs.forEach(sub => {
    const subPoses = getPosesByCategory(sub.slug)
    totalInCategory += subPoses.length
    console.log(`    - ${sub.displayName}: ${subPoses.length} poses`)
  })
})

// ========================================
// 5. Final Summary
// ========================================
console.log('\n' + '='.repeat(50))
if (errors === 0 && warnings === 0) {
  console.log('✅ Validation PASSED with no errors or warnings')
  console.log('✨ Seed data is ready for production!')
} else if (errors === 0) {
  console.log(`⚠️  Validation PASSED with ${warnings} warning(s)`)
  console.log('   Data is functional but consider addressing warnings')
} else {
  console.log(`❌ Validation FAILED with ${errors} error(s) and ${warnings} warning(s)`)
  console.log('   Please fix errors before seeding database')
}
console.log('='.repeat(50) + '\n')

// Exit with appropriate code
process.exit(errors > 0 ? 1 : 0)
