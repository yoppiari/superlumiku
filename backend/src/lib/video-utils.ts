import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * Video metadata interface
 */
export interface VideoMetadata {
  duration: number // in seconds
  width: number
  height: number
  fps: number
  bitrate: number
  codec: string
}

/**
 * Extract video duration using ffprobe
 * Falls back to placeholder if ffprobe is not available
 */
export async function getVideoDuration(filePath: string): Promise<number> {
  try {
    // Try to use ffprobe if available
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
    )
    const duration = parseFloat(stdout.trim())
    return isNaN(duration) ? 5 : Math.round(duration * 100) / 100 // Round to 2 decimal places
  } catch (error) {
    console.warn('⚠️  ffprobe not available, using placeholder duration')
    // Return placeholder duration (5 seconds)
    return 5
  }
}

/**
 * Extract full video metadata using ffprobe
 * Falls back to basic metadata if ffprobe is not available
 */
export async function getVideoMetadata(filePath: string): Promise<VideoMetadata> {
  try {
    // Try to use ffprobe if available
    const { stdout } = await execAsync(
      `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,bit_rate,codec_name -show_entries format=duration -of json "${filePath}"`
    )

    const data = JSON.parse(stdout)
    const stream = data.streams?.[0] || {}
    const format = data.format || {}

    // Parse frame rate (e.g., "30/1" -> 30)
    let fps = 30
    if (stream.r_frame_rate) {
      const [num, den] = stream.r_frame_rate.split('/').map(Number)
      fps = Math.round(num / den)
    }

    return {
      duration: parseFloat(format.duration) || 5,
      width: stream.width || 1920,
      height: stream.height || 1080,
      fps: fps,
      bitrate: parseInt(stream.bit_rate) || 5000000,
      codec: stream.codec_name || 'h264',
    }
  } catch (error) {
    console.warn('⚠️  ffprobe not available, using placeholder metadata')
    // Return placeholder metadata
    return {
      duration: 5,
      width: 1920,
      height: 1080,
      fps: 30,
      bitrate: 5000000,
      codec: 'h264',
    }
  }
}

/**
 * Check if ffprobe is available in the system
 */
export async function isFFProbeAvailable(): Promise<boolean> {
  try {
    await execAsync('ffprobe -version')
    return true
  } catch {
    return false
  }
}
