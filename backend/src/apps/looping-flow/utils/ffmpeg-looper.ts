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
      } else if (loopStyle === 'crossfade' && videoCrossfade) {
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
        // Simple loop
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
        // No audio crossfade, just use first input with loop
        audioFilter = '[0:a]aloop=loop=' + (loops - 1) + ':size=' + Math.floor(sourceDuration * 48000) + '[abase];'
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
   * Build boomerang loop command (forward → reverse → forward)
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

    let filterComplex = `[0:v]split[vforward][vreverse];
      [vforward]setpts=PTS-STARTPTS[vf];
      [vreverse]reverse,setpts=PTS-STARTPTS[vr];
      [vf][vr]concat=n=2:v=1:a=0[vloop];
      [vloop]loop=loop=${loops}:size=1:start=0[v]`

    // For audio, we can keep it forward-only or also reverse
    // For meditation/sleep music, forward-only is better
    let audioFilterBase = `[0:a]aloop=loop=${loops}:size=${Math.floor(
      sourceDuration * 48000
    )}[a]`

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
        'a'
      )
      filterComplex = `${filterComplex};${audioFilterBase};${audioMixFilter}`
    } else {
      filterComplex = `${filterComplex};${audioFilterBase}`
    }

    let inputCommands = `-i "${inputPath}"`

    // Add audio layer inputs
    audioLayers.forEach((layer, idx) => {
      inputCommands += ` -stream_loop -1 -i "${layer.filePath}"`
    })

    const mapOptions =
      audioLayers.length > 0 || muteOriginal
        ? '-map "[v]" -map "[aout]"'
        : '-map "[v]" -map "[a]"'

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
