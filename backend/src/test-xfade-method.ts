import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { createId } from '@paralleldrive/cuid2'

const execAsync = promisify(exec)

const TEST_VIDEO = 'uploads/videos/1759576687431_3c02cfcfdc83da04.mp4'
const OUTPUT_DIR = 'uploads/test-outputs'
const SOURCE_DURATION = 8.0
const TARGET_DURATION = 20
const XFADE_DURATION = 0.5

/**
 * Test Method 1: Multiple inputs with xfade chain
 * This is the most reliable method for seamless crossfade looping
 */
async function testMultipleInputsXfade() {
  const inputPath = path.join(process.cwd(), TEST_VIDEO).replace(/\\/g, '/')
  const outputPath = path
    .join(process.cwd(), OUTPUT_DIR, `xfade-multiple-inputs-${createId()}.mp4`)
    .replace(/\\/g, '/')

  const loops = Math.ceil(TARGET_DURATION / SOURCE_DURATION) // 3 loops

  // Build multiple input flags
  let inputs = ''
  for (let i = 0; i < loops; i++) {
    inputs += `-i "${inputPath}" `
  }

  // Build xfade chain for video
  let videoFilter = ''
  let currentLabel = '[0:v]'
  for (let i = 1; i < loops; i++) {
    const nextLabel = i === loops - 1 ? '[vout]' : `[vx${i}]`
    const offset = i * SOURCE_DURATION - i * XFADE_DURATION
    videoFilter += `${currentLabel}[${i}:v]xfade=transition=fade:duration=${XFADE_DURATION}:offset=${offset}${nextLabel};`
    currentLabel = nextLabel
  }

  // Build acrossfade chain for audio
  let audioFilter = ''
  let currentAudioLabel = '[0:a]'
  for (let i = 1; i < loops; i++) {
    const nextLabel = i === loops - 1 ? '[aout]' : `[ax${i}]`
    audioFilter += `${currentAudioLabel}[${i}:a]acrossfade=d=${XFADE_DURATION}${nextLabel};`
    currentAudioLabel = nextLabel
  }

  const filterComplex = videoFilter + audioFilter

  const command = `ffmpeg -y ${inputs} -filter_complex "${filterComplex}" -t ${TARGET_DURATION} -map "[vout]" -map "[aout]" -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p -profile:v high -c:a aac -b:a 192k -movflags +faststart "${outputPath}"`

  console.log('\n🧪 Test Method 1: Multiple Inputs + XFade Chain')
  console.log('=' .repeat(60))
  console.log(`Command: ${command.replace(/\s+/g, ' ')}`)
  console.log('=' .repeat(60))

  try {
    const { stdout, stderr } = await execAsync(command.replace(/\s+/g, ' '), {
      maxBuffer: 1024 * 1024 * 50,
    })

    console.log(`✅ SUCCESS - Output: ${outputPath}`)
    return { success: true, outputPath }
  } catch (error: any) {
    console.error(`❌ FAILED - ${error.message}`)
    return { success: false, error: error.message }
  }
}

/**
 * Run test
 */
async function runTest() {
  console.log('\n🔬 Testing XFade Method for Seamless Looping')
  console.log('Video will loop 3 times with 0.5s crossfade between each loop')
  console.log('No black screen, no freeze - just smooth transitions\n')

  const result = await testMultipleInputsXfade()

  if (result.success) {
    console.log('\n✅ Test completed successfully!')
    console.log(`📁 Check output: ${result.outputPath}`)
    console.log('🎬 Play the video and watch for smooth transitions at ~8s and ~16s')
  } else {
    console.log('\n❌ Test failed')
    process.exit(1)
  }
}

runTest().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
