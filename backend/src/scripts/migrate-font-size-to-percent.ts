import prisma from '../db/client'

/**
 * Migration script: Convert fontSize (pixels) to fontSizePercent
 *
 * Assumption: Preview container is ~350px tall
 * Formula: fontSizePercent = (fontSize / 350) * 100
 *
 * Example: fontSize 16px → (16 / 350) * 100 = 4.57%
 */

const PREVIEW_CONTAINER_HEIGHT = 350

async function migrateFontSizeToPercent() {
  console.log('🔄 Starting font size migration...')

  try {
    // Get all position settings
    const settings = await prisma.carouselPositionSettings.findMany()

    console.log(`   Found ${settings.length} position settings to migrate`)

    let updated = 0

    for (const setting of settings) {
      // Calculate percentage from pixel value
      const fontSizePercent = (setting.fontSize / PREVIEW_CONTAINER_HEIGHT) * 100

      // Update the setting
      await prisma.carouselPositionSettings.update({
        where: { id: setting.id },
        data: { fontSizePercent }
      })

      console.log(`   ✅ Position ${setting.slidePosition} in project ${setting.projectId.slice(0, 8)}: ${setting.fontSize}px → ${fontSizePercent.toFixed(2)}%`)
      updated++
    }

    console.log(`\n✅ Migration completed! Updated ${updated} settings`)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migrateFontSizeToPercent()
