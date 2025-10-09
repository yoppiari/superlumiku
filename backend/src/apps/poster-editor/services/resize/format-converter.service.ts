import sharp from 'sharp'
import { PRINT_FORMATS, SOCIAL_FORMATS, type FormatDefinition } from './format-presets'
import type { ResizeParams } from '../../types'

export class FormatConverterService {
  /**
   * Resize image to target format
   */
  async resizeToFormat(
    imageBuffer: Buffer,
    params: ResizeParams
  ): Promise<{
    buffer: Buffer
    width: number
    height: number
    wasUpscaled: boolean
    upscaleRatio?: number
  }> {
    const format = this.getFormatDefinition(params.format, {
      width: params.customWidth,
      height: params.customHeight,
    })

    if (!format) {
      throw new Error(`Invalid format: ${params.format}`)
    }

    const metadata = await sharp(imageBuffer).metadata()
    const originalWidth = metadata.width || 0
    const originalHeight = metadata.height || 0

    let targetWidth = format.width
    let targetHeight = format.height

    // Check if upscaling is needed
    const needsUpscale =
      targetWidth > originalWidth || targetHeight > originalHeight
    let wasUpscaled = false
    let upscaleRatio: number | undefined

    if (needsUpscale && params.autoUpscale) {
      upscaleRatio = Math.max(
        targetWidth / originalWidth,
        targetHeight / originalHeight
      )
      wasUpscaled = true
      // Note: Actual upscaling should be done via ModelsLab Super Resolution
      // This is just for metadata
    }

    // Apply resize method
    let resized: sharp.Sharp

    switch (params.resizeMethod) {
      case 'smart_crop':
        resized = await this.smartCrop(imageBuffer, targetWidth, targetHeight)
        break

      case 'fit':
        resized = sharp(imageBuffer).resize(targetWidth, targetHeight, {
          fit: 'inside',
          withoutEnlargement: !params.autoUpscale,
        })
        break

      case 'fill':
        resized = sharp(imageBuffer).resize(targetWidth, targetHeight, {
          fit: 'cover',
          position: 'center',
        })
        break

      case 'stretch':
        resized = sharp(imageBuffer).resize(targetWidth, targetHeight, {
          fit: 'fill',
        })
        break

      default:
        throw new Error(`Invalid resize method: ${params.resizeMethod}`)
    }

    // Apply quality settings
    const quality = this.getQualityValue(params.quality || 'high')
    const outputFormat = format.category === 'print' ? 'png' : 'jpeg'

    let buffer: Buffer

    if (outputFormat === 'jpeg') {
      buffer = await resized.jpeg({ quality }).toBuffer()
    } else {
      buffer = await resized
        .png({ compressionLevel: quality === 100 ? 6 : 9 })
        .toBuffer()
    }

    return {
      buffer,
      width: targetWidth,
      height: targetHeight,
      wasUpscaled,
      upscaleRatio,
    }
  }

  /**
   * Smart crop with face/object detection (simplified version)
   */
  private async smartCrop(
    imageBuffer: Buffer,
    targetWidth: number,
    targetHeight: number
  ): Promise<sharp.Sharp> {
    // Use Sharp's built-in attention algorithm for smart cropping
    return sharp(imageBuffer).resize(targetWidth, targetHeight, {
      fit: 'cover',
      position: sharp.strategy.attention,
    })
  }

  /**
   * Batch resize to multiple formats
   */
  async batchResize(
    imageBuffer: Buffer,
    formats: string[],
    options?: {
      autoUpscale?: boolean
      quality?: 'high' | 'medium' | 'low'
      resizeMethod?: 'smart_crop' | 'fit' | 'fill' | 'stretch'
    }
  ): Promise<
    Array<{
      formatName: string
      buffer: Buffer
      width: number
      height: number
      fileSize: number
      wasUpscaled: boolean
      upscaleRatio?: number
    }>
  > {
    const results = []

    for (const formatName of formats) {
      const result = await this.resizeToFormat(imageBuffer, {
        posterId: '', // Not needed for batch
        format: formatName,
        resizeMethod: options?.resizeMethod || 'smart_crop',
        quality: options?.quality || 'high',
        autoUpscale: options?.autoUpscale || false,
      })

      results.push({
        formatName,
        buffer: result.buffer,
        width: result.width,
        height: result.height,
        fileSize: result.buffer.length,
        wasUpscaled: result.wasUpscaled,
        upscaleRatio: result.upscaleRatio,
      })
    }

    return results
  }

  /**
   * Get format definition
   */
  private getFormatDefinition(
    formatName: string,
    customDimensions?: { width?: number; height?: number }
  ): FormatDefinition | null {
    if (formatName === 'custom' && customDimensions?.width && customDimensions?.height) {
      return {
        name: 'Custom',
        width: customDimensions.width,
        height: customDimensions.height,
        category: 'custom',
        aspectRatio: `${customDimensions.width}:${customDimensions.height}`,
        description: 'Custom dimensions',
      }
    }

    return (
      PRINT_FORMATS[formatName] ||
      SOCIAL_FORMATS[formatName] ||
      null
    )
  }

  /**
   * Get quality value (0-100)
   */
  private getQualityValue(quality: 'high' | 'medium' | 'low'): number {
    switch (quality) {
      case 'high':
        return 95
      case 'medium':
        return 80
      case 'low':
        return 60
      default:
        return 95
    }
  }

  /**
   * Get all available formats
   */
  getAllFormats(): {
    print: FormatDefinition[]
    social: FormatDefinition[]
  } {
    return {
      print: Object.values(PRINT_FORMATS),
      social: Object.values(SOCIAL_FORMATS),
    }
  }

  /**
   * Calculate optimal format for image
   */
  async suggestFormat(imageBuffer: Buffer): Promise<string[]> {
    const metadata = await sharp(imageBuffer).metadata()
    const width = metadata.width || 0
    const height = metadata.height || 0
    const aspectRatio = width / height

    const suggestions: string[] = []

    // Check which formats match the aspect ratio
    const allFormats = { ...PRINT_FORMATS, ...SOCIAL_FORMATS }

    for (const [key, format] of Object.entries(allFormats)) {
      const formatRatio = format.width / format.height
      const ratioDiff = Math.abs(aspectRatio - formatRatio)

      // If aspect ratio is close (within 10%)
      if (ratioDiff < 0.1) {
        suggestions.push(key)
      }
    }

    return suggestions
  }
}

export const formatConverterService = new FormatConverterService()
