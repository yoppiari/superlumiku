import { FFmpegLooper } from './apps/looping-flow/utils/ffmpeg-looper'
import path from 'path'
import { createId } from '@paralleldrive/cuid2'

const TEST_VIDEO = 'uploads/videos/1759576687431_3c02cfcfdc83da04.mp4'
const OUTPUT_DIR = 'uploads/test-outputs'
const SOURCE_DURATION = 8.0
const TARGET_DURATION = 20 // Short for quick testing

interface TestCase {
  name: string
  loopStyle: 'simple' | 'crossfade' | 'boomerang'
  crossfadeDuration?: number
  videoCrossfade?: boolean
  audioCrossfade?: boolean
  masterVolume?: number
  audioFadeIn?: number
  audioFadeOut?: number
  muteOriginal?: boolean
}

const testCases: TestCase[] = [
  {
    name: 'Test 1: Simple Loop (baseline)',
    loopStyle: 'simple',
  },
  {
    name: 'Test 2: Simple Loop with audio fade',
    loopStyle: 'simple',
    audioFadeIn: 2.0,
    audioFadeOut: 2.0,
  },
  {
    name: 'Test 3: Crossfade Loop - Video Only',
    loopStyle: 'crossfade',
    crossfadeDuration: 1.0,
    videoCrossfade: true,
    audioCrossfade: false,
  },
  {
    name: 'Test 4: Crossfade Loop - Audio Only',
    loopStyle: 'crossfade',
    crossfadeDuration: 1.0,
    videoCrossfade: false,
    audioCrossfade: true,
  },
  {
    name: 'Test 5: Crossfade Loop - Both Video & Audio',
    loopStyle: 'crossfade',
    crossfadeDuration: 1.0,
    videoCrossfade: true,
    audioCrossfade: true,
  },
  {
    name: 'Test 6: Crossfade Loop - Long crossfade (2s)',
    loopStyle: 'crossfade',
    crossfadeDuration: 2.0,
    videoCrossfade: true,
    audioCrossfade: true,
  },
  {
    name: 'Test 7: Boomerang Loop',
    loopStyle: 'boomerang',
  },
  {
    name: 'Test 8: Boomerang with audio fade',
    loopStyle: 'boomerang',
    audioFadeIn: 3.0,
    audioFadeOut: 3.0,
  },
  {
    name: 'Test 9: Simple Loop - Muted original audio',
    loopStyle: 'simple',
    muteOriginal: true,
  },
  {
    name: 'Test 10: Simple Loop - Low volume (50%)',
    loopStyle: 'simple',
    masterVolume: 50,
  },
]

async function runTests() {
  const looper = new FFmpegLooper()
  const results: Array<{ name: string; success: boolean; error?: string; command?: string }> = []

  console.log('\n🧪 LOOPING FLOW COMPREHENSIVE TEST SUITE')
  console.log('=' .repeat(60))
  console.log(`📹 Test Video: ${TEST_VIDEO}`)
  console.log(`⏱️  Source Duration: ${SOURCE_DURATION}s`)
  console.log(`🎯 Target Duration: ${TARGET_DURATION}s`)
  console.log(`📊 Total Test Cases: ${testCases.length}`)
  console.log('=' .repeat(60) + '\n')

  for (const [index, testCase] of testCases.entries()) {
    const testNum = index + 1
    console.log(`\n🔬 Running: ${testCase.name}`)
    console.log(`   Settings:`, JSON.stringify(testCase, null, 2).split('\n').slice(1, -1).join('\n   '))

    const inputPath = path.join(process.cwd(), TEST_VIDEO).replace(/\\/g, '/')
    const outputFileName = `test-${testNum}-${createId()}.mp4`
    const outputPath = path.join(process.cwd(), OUTPUT_DIR, outputFileName).replace(/\\/g, '/')

    try {
      const result = await looper.processLoop(
        inputPath,
        outputPath,
        TARGET_DURATION,
        SOURCE_DURATION,
        {
          loopStyle: testCase.loopStyle,
          crossfadeDuration: testCase.crossfadeDuration,
          videoCrossfade: testCase.videoCrossfade,
          audioCrossfade: testCase.audioCrossfade,
          masterVolume: testCase.masterVolume ?? 100,
          audioFadeIn: testCase.audioFadeIn ?? 2.0,
          audioFadeOut: testCase.audioFadeOut ?? 2.0,
          muteOriginal: testCase.muteOriginal ?? false,
          audioLayers: [],
        }
      )

      if (result.success) {
        console.log(`   ✅ SUCCESS - Output: ${outputFileName}`)
        results.push({ name: testCase.name, success: true })
      } else {
        console.log(`   ❌ FAILED - ${result.error}`)
        results.push({ name: testCase.name, success: false, error: result.error })
      }
    } catch (error: any) {
      console.log(`   ❌ EXCEPTION - ${error.message}`)
      results.push({ name: testCase.name, success: false, error: error.message })
    }

    // Small delay between tests
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  // Print summary
  console.log('\n' + '=' .repeat(60))
  console.log('📊 TEST SUMMARY')
  console.log('=' .repeat(60))

  const passed = results.filter((r) => r.success).length
  const failed = results.filter((r) => !r.success).length

  console.log(`\n✅ Passed: ${passed}/${testCases.length}`)
  console.log(`❌ Failed: ${failed}/${testCases.length}`)

  if (failed > 0) {
    console.log('\n❌ Failed Tests:')
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`   - ${r.name}`)
        console.log(`     Error: ${r.error}`)
      })
  }

  console.log('\n' + '=' .repeat(60))
  console.log(`\n📁 Output Location: ${OUTPUT_DIR}`)
  console.log('💡 Review the generated videos to verify visual quality\n')

  process.exit(failed > 0 ? 1 : 0)
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
