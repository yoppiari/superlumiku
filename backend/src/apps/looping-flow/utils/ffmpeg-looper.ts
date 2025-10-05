import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'

const execAsync = promisify(exec)

export interface LoopOptions {
  loopStyle?: 'simple' | 'crossfade' | 'boomerang'
  crossfadeDuration?: number
  videoCrossfade?: boolean
  audioCrossfade?: boolean
  audioLayers?: Array<{
    filePath: string
    volume: number
    muted: boolean
    fadeIn: number
    fadeOut: number
  }>
  masterVolume?: number
  audioFadeIn?: number
  audioFadeOut?: number
  muteOriginal?: boolean
}

export class FFmpegLooper {
  /**
   * Calculate how many times to loop the video
   */
  calculateLoops(sourceDuration: number, targetDuration: number): number {
    return Math.ceil(targetDuration / sourceDuration)
  }

  /**
   * Calculate optimal base loop duration for long videos
   *
   * Strategy (Multi-tier approach):
   * - Tier 1: Direct render if loops ≤ MAX_SAFE_LOOPS (25)
   * - Tier 2: For > 25 loops, create larger base chunks that can be concat with xfade
   *   - Base chunk size: min(totalLoops, OPTIMAL_CHUNK_LOOPS)
   *   - OPTIMAL_CHUNK_LOOPS balances quality (longer chunks = fewer concat cuts)
   *     and command safety (shorter chunks = safer commands)
   *
   * Example for 900 loops:
   * - Option A: 36 chunks @ 25 loops = many concat cuts
   * - Option B: 9 chunks @ 100 loops = fewer cuts but needs hybrid per chunk
   * - Option C: Create base 200s (25 loops), extend via demuxer = fast but potential cut
   *
   * We choose Option C for performance, accept minor cut as trade-off
   */
  calculateBaseLoopDuration(targetDuration: number, sourceDuration: number): number {
    const MAX_SAFE_LOOPS = 25 // Safe direct render limit
    const totalLoops = Math.ceil(targetDuration / sourceDuration)

    if (totalLoops <= MAX_SAFE_LOOPS) {
      return targetDuration // Direct render
    } else {
      // Create base segment with MAX_SAFE_LOOPS, will be extended via concat demuxer
      // This is fastest approach, though may have slight cut at concat points
      // For seamless result, consider using simple loop style instead of crossfade
      return sourceDuration * MAX_SAFE_LOOPS
    }
  }

  /**
   * Calculate credit cost for looping
   * Formula:
   * - Base: 2 credits per 10 minutes (minimum 2 credits)
   * - Bonus for very long videos (>5 hours): +2 credits per hour after hour 5
   *
   * Examples (1 credit = Rp 50):
   * - 10 min = 2 credits (Rp 100)
   * - 30 min = 6 credits (Rp 300)
   * - 60 min = 12 credits (Rp 600)
   * - 120 min = 24 credits (Rp 1,200)
   * - 300 min (5h) = 60 credits (Rp 3,000)
   * - 360 min (6h) = 74 credits (Rp 3,700)
   * - 480 min (8h) = 102 credits (Rp 5,100)
   */
  calculateCreditCost(targetDuration: number): number {
    const minutes = targetDuration / 60

    // Base: 2 credits per 10 minutes (minimum 2)
    const baseCost = Math.max(2, Math.ceil(minutes / 10) * 2)

    // Bonus for very long videos (> 5 hours)
    if (minutes > 300) { // 5 hours = 300 minutes
      const hours = targetDuration / 3600
      const extraHours = Math.ceil(hours - 5)
      return baseCost + (extraHours * 2)
    }

    return baseCost
  }

  /**
   * Process video looping with enhanced options
   */
  async processLoop(
    inputPath: string,
    outputPath: string,
    targetDuration: number,
    sourceDuration: number,
    options: LoopOptions = {}
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const {
        loopStyle = 'crossfade',
        crossfadeDuration = 1.0,
        videoCrossfade = true,
        audioCrossfade = true,
        audioLayers = [],
        masterVolume = 100,
        audioFadeIn = 2.0,
        audioFadeOut = 2.0,
        muteOriginal = false,
      } = options

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath)
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }

      let command: string

      // Choose processing method based on loop style
      if (loopStyle === 'boomerang') {
        command = this.buildBoomerangCommand(
          inputPath,
          outputPath,
          targetDuration,
          sourceDuration,
          audioLayers,
          masterVolume,
          audioFadeIn,
          audioFadeOut,
          muteOriginal
        )
      } else if (loopStyle === 'crossfade') {
        // Use crossfade method whenever crossfade style is selected
        // This ensures multi-input approach which is required for xfade/acrossfade filters
        command = this.buildCrossfadeCommand(
          inputPath,
          outputPath,
          targetDuration,
          sourceDuration,
          crossfadeDuration,
          videoCrossfade,
          audioCrossfade,
          audioLayers,
          masterVolume,
          audioFadeIn,
          audioFadeOut,
          muteOriginal
        )
      } else {
        // Simple loop - uses -stream_loop (fast, no crossfade)
        const loops = this.calculateLoops(sourceDuration, targetDuration)
        command = this.buildSimpleLoopCommand(
          inputPath,
          outputPath,
          loops,
          targetDuration,
          audioLayers,
          masterVolume,
          audioFadeIn,
          audioFadeOut,
          muteOriginal
        )
      }

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
   * Build simple loop command (fast, good for most cases)
   */
  private buildSimpleLoopCommand(
    inputPath: string,
    outputPath: string,
    loops: number,
    targetDuration: number,
    audioLayers: LoopOptions['audioLayers'] = [],
    masterVolume: number = 100,
    audioFadeIn: number = 2.0,
    audioFadeOut: number = 2.0,
    muteOriginal: boolean = false
  ): string {
    const loopCount = loops - 1 // -stream_loop uses 0-based count

    let filterComplex = ''
    let mapOptions = ''

    // Build audio mixing if there are audio layers
    if (audioLayers.length > 0 || muteOriginal) {
      filterComplex = this.buildAudioMixFilter(
        audioLayers.length,
        audioLayers,
        masterVolume,
        audioFadeIn,
        audioFadeOut,
        muteOriginal,
        targetDuration
      )
      mapOptions = '-map 0:v -map "[aout]"'
    } else {
      mapOptions = '-map 0'
    }

    // Build command
    let inputCommands = `-stream_loop ${loopCount} -i "${inputPath}"`

    // Add audio layer inputs
    audioLayers.forEach((layer, idx) => {
      inputCommands += ` -stream_loop -1 -i "${layer.filePath}"`
    })

    const command = `ffmpeg -y ${inputCommands} \
      ${filterComplex ? `-filter_complex "${filterComplex}"` : ''} \
      -t ${targetDuration} \
      ${mapOptions} \
      -c:v libx264 -preset medium -crf 23 \
      -pix_fmt yuv420p -profile:v high \
      -c:a aac -b:a 192k \
      -movflags +faststart \
      "${outputPath}"`

    return command.replace(/\s+/g, ' ').trim()
  }

  /**
   * Build crossfade loop command with truly seamless transitions
   * Strategy: Multiple input copies with xfade/acrossfade chain
   * Most reliable method - no freeze, no black screen, smooth blending
   * For very long durations, uses hybrid approach to prevent command overflow
   */
  private buildCrossfadeCommand(
    inputPath: string,
    outputPath: string,
    targetDuration: number,
    sourceDuration: number,
    crossfadeDuration: number,
    videoCrossfade: boolean,
    audioCrossfade: boolean,
    audioLayers: LoopOptions['audioLayers'] = [],
    masterVolume: number = 100,
    audioFadeIn: number = 2.0,
    audioFadeOut: number = 2.0,
    muteOriginal: boolean = false
  ): string {
    const loops = this.calculateLoops(sourceDuration, targetDuration)
    const xfadeDuration = Math.min(crossfadeDuration, sourceDuration / 4)

    // Prevent command overflow: max 25 inputs for reliability
    // Higher values can cause "command line too long" errors on Windows
    const MAX_INPUTS = 25
    if (loops > MAX_INPUTS) {
      return this.buildHybridCrossfadeCommand(
        inputPath,
        outputPath,
        targetDuration,
        sourceDuration,
        xfadeDuration,
        videoCrossfade,
        audioCrossfade,
        audioLayers,
        masterVolume,
        audioFadeIn,
        audioFadeOut,
        muteOriginal,
        MAX_INPUTS
      )
    }

    let filterComplex = ''
    let mapOptions = ''

    if (videoCrossfade || audioCrossfade) {
      // Build multiple input flags for the same video
      let inputs = ''
      for (let i = 0; i < loops; i++) {
        inputs += `-i "${inputPath}" `
      }

      // Build xfade chain for video
      let videoFilter = ''
      if (videoCrossfade) {
        let currentLabel = '[0:v]'
        for (let i = 1; i < loops; i++) {
          const nextLabel = i === loops - 1 ? '[vout]' : `[vx${i}]`
          const offset = i * sourceDuration - i * xfadeDuration
          videoFilter += `${currentLabel}[${i}:v]xfade=transition=fade:duration=${xfadeDuration}:offset=${offset}${nextLabel};`
          currentLabel = nextLabel
        }
      } else {
        // No video crossfade, just use first input
        videoFilter = '[0:v]copy[vout];'
      }

      // Build acrossfade chain for audio
      let audioFilter = ''
      if (audioCrossfade && !muteOriginal) {
        let currentAudioLabel = '[0:a]'
        for (let i = 1; i < loops; i++) {
          const nextLabel = i === loops - 1 ? '[abase]' : `[ax${i}]`
          audioFilter += `${currentAudioLabel}[${i}:a]acrossfade=d=${xfadeDuration}${nextLabel};`
          currentAudioLabel = nextLabel
        }
      } else if (!muteOriginal) {
        // No audio crossfade, concat all audio inputs
        let audioConcat = ''
        for (let i = 0; i < loops; i++) {
          audioConcat += `[${i}:a]`
        }
        if (loops > 1) {
          audioFilter = `${audioConcat}concat=n=${loops}:v=0:a=1[abase];`
        } else {
          audioFilter = '[0:a]acopy[abase];'
        }
      }

      filterComplex = videoFilter + audioFilter

      // Update input commands to use multiple inputs
      let inputCommands = inputs.trim()

      // Add audio layer inputs
      audioLayers.forEach((layer) => {
        inputCommands += ` -stream_loop -1 -i "${layer.filePath}"`
      })

      // Add audio mixing if needed
      if (audioLayers.length > 0 || muteOriginal) {
        const audioMixFilter = this.buildAudioMixFilter(
          audioLayers.length,
          audioLayers,
          masterVolume,
          audioFadeIn,
          audioFadeOut,
          muteOriginal,
          targetDuration,
          muteOriginal ? null : 'abase',
          loops // Offset audio layer input indices
        )
        filterComplex = filterComplex + audioMixFilter
        mapOptions = '-map "[vout]" -map "[aout]"'
      } else {
        mapOptions = '-map "[vout]" -map "[abase]"'
      }

      const command = `ffmpeg -y ${inputCommands} -filter_complex "${filterComplex}" -t ${targetDuration} ${mapOptions} -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p -profile:v high -c:a aac -b:a 192k -movflags +faststart "${outputPath}"`

      return command.replace(/\s+/g, ' ').trim()
    } else {
      // No crossfade at all, fallback to simple loop
      return this.buildSimpleLoopCommand(
        inputPath,
        outputPath,
        loops,
        targetDuration,
        audioLayers,
        masterVolume,
        audioFadeIn,
        audioFadeOut,
        muteOriginal
      )
    }
  }

  /**
   * Build hybrid crossfade command for very long durations
   * Creates base loop segment, then uses stream_loop to extend
   */
  private buildHybridCrossfadeCommand(
    inputPath: string,
    outputPath: string,
    targetDuration: number,
    sourceDuration: number,
    xfadeDuration: number,
    videoCrossfade: boolean,
    audioCrossfade: boolean,
    audioLayers: LoopOptions['audioLayers'],
    masterVolume: number,
    audioFadeIn: number,
    audioFadeOut: number,
    muteOriginal: boolean,
    baseLoops: number
  ): string {
    // Create base segment with crossfades
    const baseDuration = sourceDuration * baseLoops

    let inputs = ''
    for (let i = 0; i < baseLoops; i++) {
      inputs += `-i "${inputPath}" `
    }

    // Build xfade chain for base segment
    let videoFilter = ''
    if (videoCrossfade) {
      let currentLabel = '[0:v]'
      for (let i = 1; i < baseLoops; i++) {
        const nextLabel = i === baseLoops - 1 ? '[vbase]' : `[vx${i}]`
        const offset = i * sourceDuration - i * xfadeDuration
        videoFilter += `${currentLabel}[${i}:v]xfade=transition=fade:duration=${xfadeDuration}:offset=${offset}${nextLabel};`
        currentLabel = nextLabel
      }
    } else {
      videoFilter = '[0:v]copy[vbase];'
    }

    // Build audio for base segment
    let audioFilter = ''
    if (audioCrossfade && !muteOriginal) {
      let currentAudioLabel = '[0:a]'
      for (let i = 1; i < baseLoops; i++) {
        const nextLabel = i === baseLoops - 1 ? '[abase]' : `[ax${i}]`
        audioFilter += `${currentAudioLabel}[${i}:a]acrossfade=d=${xfadeDuration}${nextLabel};`
        currentAudioLabel = nextLabel
      }
    } else if (!muteOriginal) {
      let audioConcat = ''
      for (let i = 0; i < baseLoops; i++) {
        audioConcat += `[${i}:a]`
      }
      audioFilter = `${audioConcat}concat=n=${baseLoops}:v=0:a=1[abase];`
    }

    let filterComplex = videoFilter + audioFilter
    let inputCommands = inputs.trim()

    // Add audio layer inputs
    audioLayers.forEach((layer) => {
      inputCommands += ` -stream_loop -1 -i "${layer.filePath}"`
    })

    // Add audio mixing if needed
    let mapOptions = ''
    if (audioLayers.length > 0 || muteOriginal) {
      const audioMixFilter = this.buildAudioMixFilter(
        audioLayers.length,
        audioLayers,
        masterVolume,
        audioFadeIn,
        audioFadeOut,
        muteOriginal,
        targetDuration,
        muteOriginal ? null : 'abase',
        baseLoops
      )
      filterComplex += audioMixFilter
      mapOptions = '-map "[vbase]" -map "[aout]"'
    } else {
      mapOptions = '-map "[vbase]" -map "[abase]"'
    }

    const command = `ffmpeg -y ${inputCommands} -filter_complex "${filterComplex}" -t ${targetDuration} ${mapOptions} -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p -profile:v high -c:a aac -b:a 192k -movflags +faststart "${outputPath}"`

    return command.replace(/\s+/g, ' ').trim()
  }

  /**
   * Build boomerang loop command (forward → reverse → forward)
   * Strategy: Multiple boomerang segments concatenated directly
   * This prevents memory accumulation and freezing issues with loop filter
   * For very long durations, limits inputs to prevent command overflow
   */
  private buildBoomerangCommand(
    inputPath: string,
    outputPath: string,
    targetDuration: number,
    sourceDuration: number,
    audioLayers: LoopOptions['audioLayers'] = [],
    masterVolume: number = 100,
    audioFadeIn: number = 2.0,
    audioFadeOut: number = 2.0,
    muteOriginal: boolean = false
  ): string {
    // Boomerang: video plays forward then reverse
    // This creates perfect seamless loop (start frame = end frame)
    const boomerangDuration = sourceDuration * 2 // forward + reverse
    const loops = Math.ceil(targetDuration / boomerangDuration)

    // Prevent command overflow: max 25 boomerang segments (each uses 2 filters)
    const MAX_BOOMERANG_LOOPS = 25
    const actualLoops = Math.min(loops, MAX_BOOMERANG_LOOPS)

    // Build multiple input flags for creating multiple boomerang segments
    let inputCommands = ''
    for (let i = 0; i < actualLoops; i++) {
      inputCommands += `-i "${inputPath}" `
    }
    inputCommands = inputCommands.trim()

    // Build concat chain for boomerang segments
    // Each segment: forward + reverse
    let videoFilter = ''
    let concatInputs = ''

    for (let i = 0; i < actualLoops; i++) {
      // Split each input into forward and reverse
      videoFilter += `[${i}:v]split[v${i}f][v${i}r];`
      videoFilter += `[v${i}f]setpts=PTS-STARTPTS[vf${i}];`
      videoFilter += `[v${i}r]reverse,setpts=PTS-STARTPTS[vr${i}];`
      videoFilter += `[vf${i}][vr${i}]concat=n=2:v=1:a=0[vboomerang${i}];`
      concatInputs += `[vboomerang${i}]`
    }

    // Concatenate all boomerang segments
    if (actualLoops > 1) {
      videoFilter += `${concatInputs}concat=n=${actualLoops}:v=1:a=0[vout]`
    } else {
      videoFilter += `[vboomerang0]copy[vout]`
    }

    // For audio, keep it forward-only (better for meditation/sleep music)
    // Build audio concat to match the multiple video inputs
    let audioFilter = ''
    if (!muteOriginal) {
      let audioConcat = ''
      for (let i = 0; i < actualLoops; i++) {
        audioConcat += `[${i}:a]`
      }
      if (actualLoops > 1) {
        audioFilter = `${audioConcat}concat=n=${actualLoops}:v=0:a=1[abase]`
      } else {
        audioFilter = `[0:a]acopy[abase]`
      }
    }

    let filterComplex = videoFilter
    if (audioFilter) {
      filterComplex += `;${audioFilter}`
    }

    // Add audio layer inputs
    audioLayers.forEach((layer) => {
      inputCommands += ` -stream_loop -1 -i "${layer.filePath}"`
    })

    // Add audio mixing if needed
    let mapOptions = ''
    if (audioLayers.length > 0 || muteOriginal) {
      const audioMixFilter = this.buildAudioMixFilter(
        audioLayers.length,
        audioLayers,
        masterVolume,
        audioFadeIn,
        audioFadeOut,
        muteOriginal,
        targetDuration,
        muteOriginal ? null : 'abase',
        actualLoops // Offset for audio layer indices
      )
      filterComplex += `;${audioMixFilter}`
      mapOptions = '-map "[vout]" -map "[aout]"'
    } else {
      mapOptions = '-map "[vout]" -map "[abase]"'
    }

    const command = `ffmpeg -y ${inputCommands} \
      -filter_complex "${filterComplex}" \
      -t ${targetDuration} \
      ${mapOptions} \
      -c:v libx264 -preset medium -crf 23 \
      -pix_fmt yuv420p -profile:v high \
      -c:a aac -b:a 192k \
      -movflags +faststart \
      "${outputPath}"`

    return command.replace(/\s+/g, ' ').trim()
  }

  /**
   * Extend video using concat demuxer (ultra fast, no re-encode)
   * Creates concat list file and uses -c copy
   */
  async extendWithConcatDemuxer(
    baseLoopPath: string,
    outputPath: string,
    baseLoopDuration: number,
    targetDuration: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const repeats = Math.ceil(targetDuration / baseLoopDuration)
      const concatListPath = baseLoopPath.replace('.mp4', '-concat.txt')

      // Create concat list file
      let concatContent = ''
      for (let i = 0; i < repeats; i++) {
        // Use absolute path with forward slashes for FFmpeg
        const absolutePath = path.resolve(baseLoopPath).replace(/\\/g, '/')
        concatContent += `file '${absolutePath}'\n`
      }
      fs.writeFileSync(concatListPath, concatContent, 'utf-8')

      // Concat with copy codec (no re-encode) then trim to exact duration
      const command = `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -t ${targetDuration} -c copy "${outputPath}"`

      console.log(`🔗 Concat Demuxer Command: ${command}`)

      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 1024 * 1024 * 10,
      })

      // Cleanup concat list
      if (fs.existsSync(concatListPath)) {
        fs.unlinkSync(concatListPath)
      }

      console.log(`✅ Concat demuxer completed: ${outputPath}`)
      return { success: true }
    } catch (error: any) {
      console.error('❌ Concat demuxer failed:', error)
      return {
        success: false,
        error: error.message || 'Concat demuxer error',
      }
    }
  }

  /**
   * Build audio mixing filter for multi-layer audio
   */
  private buildAudioMixFilter(
    numLayers: number,
    audioLayers: LoopOptions['audioLayers'] = [],
    masterVolume: number = 100,
    fadeIn: number = 2.0,
    fadeOut: number = 2.0,
    muteOriginal: boolean = false,
    targetDuration: number,
    originalAudioLabel: string | null = '0:a',
    inputIndexOffset: number = 0
  ): string {
    const filters: string[] = []
    const mixInputs: string[] = []

    // Original video audio
    if (!muteOriginal && originalAudioLabel) {
      const origVol = masterVolume / 100
      filters.push(
        `[${originalAudioLabel}]volume=${origVol},afade=t=in:st=0:d=${fadeIn},afade=t=out:st=${
          targetDuration - fadeOut
        }:d=${fadeOut}[a0]`
      )
      mixInputs.push('[a0]')
    }

    // Audio layers
    audioLayers.forEach((layer, idx) => {
      const inputIdx = inputIndexOffset + idx + 1 // Offset by loop count if using multiple inputs
      const vol = layer.muted ? 0 : (layer.volume * masterVolume) / 10000
      const layerFadeIn = layer.fadeIn || fadeIn
      const layerFadeOut = layer.fadeOut || fadeOut

      filters.push(
        `[${inputIdx}:a]volume=${vol},afade=t=in:st=0:d=${layerFadeIn},afade=t=out:st=${
          targetDuration - layerFadeOut
        }:d=${layerFadeOut}[a${inputIdx}]`
      )
      mixInputs.push(`[a${inputIdx}]`)
    })

    // Mix all audio inputs
    if (mixInputs.length > 1) {
      filters.push(
        `${mixInputs.join('')}amix=inputs=${
          mixInputs.length
        }:duration=longest:normalize=0[aout]`
      )
    } else if (mixInputs.length === 1) {
      // Just copy the single input to output
      filters.push(`${mixInputs[0]}acopy[aout]`)
    } else {
      // No audio (shouldn't happen, but handle it)
      filters.push('anullsrc=r=48000:cl=stereo[aout]')
    }

    return filters.join(';')
  }
}
