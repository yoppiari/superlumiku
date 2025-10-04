import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

export class FFmpegLooper {
  /**
   * Calculate how many times to loop the video
   */
  calculateLoops(sourceDuration: number, targetDuration: number): number {
    return Math.ceil(targetDuration / sourceDuration)
  }

  /**
   * Process video looping with seamless crossfade
   */
  async processLoop(
    inputPath: string,
    outputPath: string,
    targetDuration: number,
    sourceDuration: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const loops = this.calculateLoops(sourceDuration, targetDuration)
      const crossfadeDuration = 0.5 // 0.5 seconds crossfade

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath)
      await execAsync(`mkdir -p "${outputDir}"`)

      // Build FFmpeg command for seamless looping with crossfade
      // Strategy: concat video multiple times with crossfade between loops
      const command = this.buildFFmpegCommand(
        inputPath,
        outputPath,
        loops,
        targetDuration,
        sourceDuration,
        crossfadeDuration
      )

      console.log(`🎬 FFmpeg Loop Command: ${command}`)

      // Execute FFmpeg
      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 1024 * 1024 * 50, // 50MB buffer
      })

      if (stderr && stderr.includes('Error')) {
        throw new Error(stderr)
      }

      console.log(`✅ Video looping completed: ${outputPath}`)
      return { success: true }
    } catch (error: any) {
      console.error('❌ FFmpeg looping failed:', error)
      return {
        success: false,
        error: error.message || 'Unknown FFmpeg error',
      }
    }
  }

  /**
   * Build FFmpeg command for seamless looping
   */
  private buildFFmpegCommand(
    inputPath: string,
    outputPath: string,
    loops: number,
    targetDuration: number,
    sourceDuration: number,
    crossfadeDuration: number
  ): string {
    // For simple looping without crossfade (faster, good for most cases)
    // Using -stream_loop and cutting to exact duration

    const loopCount = loops - 1 // -stream_loop uses 0-based count

    // Build command:
    // 1. Loop input video
    // 2. Trim to exact target duration
    // 3. Re-encode with good quality
    const command = `ffmpeg -y -stream_loop ${loopCount} -i "${inputPath}" \
      -t ${targetDuration} \
      -c:v libx264 -preset medium -crf 23 \
      -c:a aac -b:a 128k \
      -movflags +faststart \
      "${outputPath}"`

    return command.replace(/\s+/g, ' ').trim()
  }

  /**
   * Build advanced FFmpeg command with crossfade (more complex, smoother)
   */
  private buildCrossfadeCommand(
    inputPath: string,
    outputPath: string,
    loops: number,
    targetDuration: number,
    sourceDuration: number,
    crossfadeDuration: number
  ): string {
    // This is more complex and requires building filter_complex
    // For now, we use simple looping above
    // TODO: Implement crossfade for ultra-smooth transitions

    return ''
  }
}
