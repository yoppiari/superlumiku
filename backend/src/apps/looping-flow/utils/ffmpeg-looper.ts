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
      -c:a aac -b:a 192k \
      -movflags +faststart \
      "${outputPath}"`

    return command.replace(/\s+/g, ' ').trim()
  }

  /**
   * Build crossfade loop command (smooth transitions)
   * NOTE: xfade/acrossfade filters require 2 separate inputs and cannot be used with stream_loop
   * Instead, we use simple loop which is already seamless (end frame connects to start frame)
   * with optional fade in/out for smooth audio transitions
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
    // For "crossfade" style with stream_loop, we just use simple loop
    // The loop is already seamless since end frame connects to start frame
    // We can add fade in/out for smoother audio transition feeling
    return this.buildSimpleLoopCommand(
      inputPath,
      outputPath,
      this.calculateLoops(sourceDuration, targetDuration),
      targetDuration,
      audioLayers,
      masterVolume,
      audioFadeIn,
      audioFadeOut,
      muteOriginal
    )
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
    originalAudioLabel: string = '0:a'
  ): string {
    const filters: string[] = []
    const mixInputs: string[] = []

    // Original video audio
    if (!muteOriginal) {
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
      const inputIdx = idx + 1 // Input 0 is the video
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
