import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import { promises as fs } from 'fs'

export interface VideoInput {
  filePath: string
  duration: number
  order: number
  trimDuration?: number // For smart distribution (trim to this duration)
  speedFactor?: number // For speed adjustment (e.g., 1.2 = 1.2x faster)
}

export interface ProcessingOptions {
  resolution: '480p' | '720p' | '1080p' | '4k'
  frameRate: 24 | 30 | 60
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5'
  bitrate: 'low' | 'medium' | 'high'
  audioOption: 'keep' | 'mute'
  speedMin: number
  speedMax: number
  enableSpeedVariations: boolean
  durationType?: 'original' | 'fixed'
  fixedDuration?: number // in seconds
  metadataSource?: 'capcut' | 'tiktok' | 'instagram' | 'youtube'
}

const ASPECT_RATIO_MAP = {
  '9:16': { width: 1080, height: 1920 }, // TikTok/Instagram Reels
  '16:9': { width: 1920, height: 1080 }, // YouTube
  '1:1': { width: 1080, height: 1080 }, // Instagram Square
  '4:5': { width: 1080, height: 1350 }, // Instagram Portrait
}

const RESOLUTION_MAP = {
  '480p': { width: 854, height: 480 },
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
  '4k': { width: 3840, height: 2160 },
}

const BITRATE_MAP = {
  low: '1000k',
  medium: '2500k',
  high: '5000k',
}

export class FFmpegService {
  /**
   * Mix multiple videos into one output
   */
  async mixVideos(
    inputs: VideoInput[],
    outputPath: string,
    options: ProcessingOptions,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // Sort by order
        const sortedInputs = [...inputs].sort((a, b) => a.order - b.order)

        // Check if we need to use smart distribution (trim individual videos)
        const useSmartDistribution = sortedInputs.some(input => input.trimDuration !== undefined)

        // Check if we have a global speed factor for duration fitting
        const globalSpeedFactor = sortedInputs[0]?.speedFactor

        if (useSmartDistribution) {
          // Use complex filter for individual trimming
          const command = ffmpeg()

          // Add each input separately (NO -t option, will trim in filter)
          sortedInputs.forEach((input) => {
            command.input(input.filePath)
          })

          // Build complex filter with trim + concat + scaling/padding
          const targetDimensions = ASPECT_RATIO_MAP[options.aspectRatio]

          let filterComplex = ''

          // Step 1: Trim each video/audio stream individually
          sortedInputs.forEach((input, i) => {
            if (input.trimDuration) {
              // Trim video stream
              filterComplex += `[${i}:v]trim=duration=${input.trimDuration},setpts=PTS-STARTPTS[v${i}];`
              // Trim audio stream (if not muted)
              if (options.audioOption !== 'mute') {
                filterComplex += `[${i}:a]atrim=duration=${input.trimDuration},asetpts=PTS-STARTPTS[a${i}];`
              }
            } else {
              // No trimming, just pass through with null filter
              filterComplex += `[${i}:v]null[v${i}];`
              if (options.audioOption !== 'mute') {
                filterComplex += `[${i}:a]anull[a${i}];`
              }
            }
          })

          // Step 2: Concat the trimmed streams
          const concatInputs = sortedInputs.map((_, i) => {
            if (options.audioOption === 'mute') {
              return `[v${i}]`
            } else {
              return `[v${i}][a${i}]`
            }
          }).join('')

          if (options.audioOption === 'mute') {
            filterComplex += `${concatInputs}concat=n=${sortedInputs.length}:v=1:a=0[v];`
          } else {
            filterComplex += `${concatInputs}concat=n=${sortedInputs.length}:v=1:a=1[v][a];`
          }

          // Step 3: Scale and pad the concatenated output
          filterComplex += `[v]scale=${targetDimensions.width}:${targetDimensions.height}:force_original_aspect_ratio=decrease,`
          filterComplex += `pad=${targetDimensions.width}:${targetDimensions.height}:(ow-iw)/2:(oh-ih)/2[outv]`

          command.complexFilter(filterComplex)
          command.map('[outv]')
          if (options.audioOption !== 'mute') {
            command.map('[a]')
          }

          // Video codec & quality
          command
            .videoCodec('libx264')
            .videoBitrate(BITRATE_MAP[options.bitrate])
            .fps(options.frameRate)

          // Audio
          if (options.audioOption === 'mute') {
            command.noAudio()
          } else {
            command.audioCodec('aac').audioBitrate('128k')
          }

          // Output format with metadata
          const outputOptions = [
            '-movflags', '+faststart',
            '-preset', 'fast',
            '-pix_fmt', 'yuv420p',
            '-max_muxing_queue_size', '1024',
          ]

          // Add platform-specific metadata
          if (options.metadataSource) {
            const metadataMap = {
              capcut: { encoder: 'CapCut', comment: 'Made with CapCut' },
              tiktok: { encoder: 'TikTok', comment: 'TikTok Video' },
              instagram: { encoder: 'Instagram', comment: 'Instagram Reels' },
              youtube: { encoder: 'YouTube', comment: 'YouTube Video' },
            }
            const metadata = metadataMap[options.metadataSource]
            outputOptions.push('-metadata', `encoder=${metadata.encoder}`)
            outputOptions.push('-metadata', `comment=${metadata.comment}`)
          }

          command.format('mp4').outputOptions(outputOptions)

          // Progress tracking
          command.on('progress', (progress) => {
            if (onProgress && progress.percent) {
              onProgress(Math.min(progress.percent, 100))
            }
          })

          // Error handling
          command.on('error', (err: any) => {
            reject(new Error(`FFmpeg error: ${err.message}`))
          })

          // Success
          command.on('end', () => {
            resolve()
          })

          // Run
          command.save(outputPath)
        } else {
          // Original concat file method
          const concatFilePath = outputPath.replace('.mp4', '_concat.txt')
          const concatContent = sortedInputs
            .map((input) => `file '${path.resolve(input.filePath).replace(/\\/g, '/')}'`)
            .join('\n')

          // Write concat file
          await fs.writeFile(concatFilePath, concatContent)

          const command = ffmpeg()

          // Input: concat demuxer
          command.input(concatFilePath).inputOptions(['-f', 'concat', '-safe', '0'])

          // Continue with filters and output...
          await this.applyFiltersAndOutput(command, outputPath, options, onProgress, resolve, reject, concatFilePath, globalSpeedFactor)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  private async applyFiltersAndOutput(
    command: any,
    outputPath: string,
    options: ProcessingOptions,
    onProgress: ((progress: number) => void) | undefined,
    resolve: (value: void) => void,
    reject: (reason?: any) => void,
    concatFilePath?: string,
    globalSpeedFactor?: number
  ): Promise<void> {
    // Video filters
    const filters: string[] = []

        // Use aspect ratio dimensions as target
        const targetDimensions = ASPECT_RATIO_MAP[options.aspectRatio]

        // Scale to fit and pad to maintain aspect ratio
        filters.push(
          `scale=${targetDimensions.width}:${targetDimensions.height}:force_original_aspect_ratio=decrease`
        )
        filters.push(
          `pad=${targetDimensions.width}:${targetDimensions.height}:(ow-iw)/2:(oh-ih)/2:black`
        )

        // Speed adjustment for duration fitting OR speed variation for anti-fingerprinting
        if (globalSpeedFactor) {
          // Use global speed factor for duration fitting (takes precedence)
          filters.push(`setpts=${(1 / globalSpeedFactor).toFixed(3)}*PTS`)

          // Also adjust audio speed if keeping audio
          if (options.audioOption === 'keep') {
            command.audioFilters([`atempo=${globalSpeedFactor.toFixed(3)}`])
          }
        } else if (options.enableSpeedVariations) {
          // Use random speed for anti-fingerprinting
          const randomSpeed = this.getRandomSpeed(options.speedMin, options.speedMax)
          filters.push(`setpts=${(1 / randomSpeed).toFixed(3)}*PTS`)

          // Also adjust audio speed if keeping audio
          if (options.audioOption === 'keep') {
            command.audioFilters([`atempo=${randomSpeed.toFixed(3)}`])
          }
        }

        // Apply video filters
        if (filters.length > 0) {
          command.videoFilters(filters)
        }

        // Apply fixed duration if specified
        if (options.durationType === 'fixed' && options.fixedDuration) {
          command.duration(options.fixedDuration)
        }

        // Video codec & quality
        command
          .videoCodec('libx264')
          .videoBitrate(BITRATE_MAP[options.bitrate])
          .fps(options.frameRate)

        // Audio
        if (options.audioOption === 'mute') {
          command.noAudio()
        } else {
          command.audioCodec('aac').audioBitrate('128k')
        }

        // Output format with metadata
        const outputOptions = [
          '-movflags', '+faststart', // Enable streaming
          '-preset', 'fast',
          '-pix_fmt', 'yuv420p', // Compatibility
          '-max_muxing_queue_size', '1024', // Prevent muxing errors
        ]

        // Add platform-specific metadata
        if (options.metadataSource) {
          const metadataMap = {
            capcut: { encoder: 'CapCut', comment: 'Made with CapCut' },
            tiktok: { encoder: 'TikTok', comment: 'TikTok Video' },
            instagram: { encoder: 'Instagram', comment: 'Instagram Reels' },
            youtube: { encoder: 'YouTube', comment: 'YouTube Video' },
          }
          const metadata = metadataMap[options.metadataSource]
          outputOptions.push('-metadata', `encoder=${metadata.encoder}`)
          outputOptions.push('-metadata', `comment=${metadata.comment}`)
        }

        command.format('mp4').outputOptions(outputOptions)

        // Progress tracking
        command.on('progress', (progress: any) => {
          if (onProgress && progress.percent) {
            onProgress(Math.min(progress.percent, 100))
          }
        })

    // Error handling
    command.on('error', async (err: any) => {
      if (concatFilePath) {
        try {
          await fs.unlink(concatFilePath)
        } catch {}
      }
      reject(new Error(`FFmpeg error: ${err.message}`))
    })

    // Success
    command.on('end', async () => {
      if (concatFilePath) {
        try {
          await fs.unlink(concatFilePath) // Cleanup concat file
        } catch {}
      }
      resolve()
    })

    // Run
    command.save(outputPath)
  }

  /**
   * Get random speed within range
   */
  private getRandomSpeed(min: number, max: number): number {
    return Math.random() * (max - min) + min
  }

  /**
   * Shuffle array (for order mixing)
   */
  shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  /**
   * Rotate array (for different start)
   */
  rotateArray<T>(array: T[], positions: number): T[] {
    const pos = positions % array.length
    return [...array.slice(pos), ...array.slice(0, pos)]
  }

  /**
   * Generate thumbnail from video
   */
  async generateThumbnail(videoPath: string, outputPath: string, timeOffset: number = 1): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: [timeOffset],
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
          size: '640x360'
        })
        .on('end', () => resolve())
        .on('error', (err: any) => reject(new Error(`Thumbnail generation failed: ${err.message}`)))
    })
  }
}
