/**
 * Storage Service Test Script
 *
 * Tests the Pose Storage Service implementation
 * Verifies local storage mode and R2 configuration
 *
 * Usage:
 *   bun run scripts/test-storage.ts
 */

import { poseStorageService } from '../src/apps/pose-generator/services/storage.service'
import sharp from 'sharp'

async function testStorage() {
  console.log('===========================================')
  console.log('Storage Service Test')
  console.log('===========================================\n')

  // Test 1: Check storage mode
  console.log('Test 1: Storage Mode')
  const mode = poseStorageService.getStorageMode()
  console.log(`✓ Storage mode: ${mode}`)
  console.log('')

  // Test 2: Initialize local storage
  console.log('Test 2: Initialize Local Storage')
  try {
    await poseStorageService.initializeLocalStorage()
    console.log('✓ Local storage initialized successfully')
  } catch (error) {
    console.error('✗ Failed to initialize local storage:', error)
    process.exit(1)
  }
  console.log('')

  // Test 3: Create test image
  console.log('Test 3: Generate Test Image')
  const testImageBuffer = await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 100, g: 150, b: 200, alpha: 1 },
    },
  })
    .png()
    .toBuffer()
  console.log(`✓ Test image created: ${testImageBuffer.length} bytes`)
  console.log('')

  // Test 4: Save pose with thumbnail
  console.log('Test 4: Save Pose with Thumbnail')
  const testGenerationId = 'test-gen-' + Date.now()
  const testPoseId = 'test-pose-' + Date.now()

  try {
    const result = await poseStorageService.savePoseWithThumbnail({
      imageBuffer: testImageBuffer,
      generationId: testGenerationId,
      poseId: testPoseId,
    })

    console.log('✓ Pose saved successfully:')
    console.log(`  - Image URL: ${result.imageUrl}`)
    console.log(`  - Thumbnail URL: ${result.thumbnailUrl}`)
    console.log(`  - Original URL: ${result.originalImageUrl}`)
  } catch (error) {
    console.error('✗ Failed to save pose:', error)
    process.exit(1)
  }
  console.log('')

  // Test 5: Verify files exist (local mode only)
  if (mode === 'local') {
    console.log('Test 5: Verify Files Exist (Local Mode)')
    const fs = await import('fs/promises')
    const path = await import('path')

    const basePath = process.env.UPLOAD_PATH || '/app/backend/uploads'
    const imagePath = path.join(basePath, `poses/${testGenerationId}/${testPoseId}.png`)
    const thumbPath = path.join(basePath, `poses/${testGenerationId}/${testPoseId}_thumb.png`)

    try {
      await fs.access(imagePath)
      console.log('✓ Full-size image exists')

      await fs.access(thumbPath)
      console.log('✓ Thumbnail image exists')

      // Check file sizes
      const imageStats = await fs.stat(imagePath)
      const thumbStats = await fs.stat(thumbPath)

      console.log(`  - Full-size: ${imageStats.size} bytes`)
      console.log(`  - Thumbnail: ${thumbStats.size} bytes`)
      console.log(`  - Thumbnail is smaller: ${thumbStats.size < imageStats.size ? '✓' : '✗'}`)
    } catch (error) {
      console.error('✗ Files not found:', error)
      process.exit(1)
    }
    console.log('')

    // Test 6: Delete pose
    console.log('Test 6: Delete Pose')
    try {
      await poseStorageService.deletePose({
        generationId: testGenerationId,
        poseId: testPoseId,
      })
      console.log('✓ Pose deleted successfully')

      // Verify deletion
      try {
        await fs.access(imagePath)
        console.error('✗ File still exists after deletion')
        process.exit(1)
      } catch {
        console.log('✓ Files removed from filesystem')
      }
    } catch (error) {
      console.error('✗ Failed to delete pose:', error)
      process.exit(1)
    }
    console.log('')
  }

  // Test 7: Test error handling
  console.log('Test 7: Error Handling')
  try {
    // Try to save with invalid buffer
    await poseStorageService.savePoseWithThumbnail({
      imageBuffer: Buffer.from('invalid image data'),
      generationId: 'error-test',
      poseId: 'error-pose',
    })
    console.error('✗ Should have thrown error for invalid image')
    process.exit(1)
  } catch (error) {
    console.log('✓ Correctly handles invalid image data')
    console.log(`  - Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  console.log('')

  // Summary
  console.log('===========================================')
  console.log('All Tests Passed!')
  console.log('===========================================')
  console.log('')
  console.log('Storage service is working correctly.')
  console.log(`Current mode: ${mode}`)
  console.log('')
  console.log('Next steps:')
  console.log('1. Deploy to Coolify with volume mount')
  console.log('2. Test with real pose generation')
  console.log('3. Monitor disk usage')
  console.log('4. Plan R2 migration when ready')
  console.log('')
}

// Run tests
testStorage()
  .then(() => {
    console.log('Test completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Test failed:', error)
    process.exit(1)
  })
