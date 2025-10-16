/**
 * Export Service
 *
 * Handles multi-format export for generated poses:
 * - Format specifications (Instagram, TikTok, Shopee, Print, etc.)
 * - Image resizing with Sharp
 * - Format conversion
 * - Batch export to ZIP
 *
 * Phase 1.4: Service Layer Implementation
 */

import sharp from 'sharp'
import archiver from 'archiver'
import { createWriteStream } from 'fs'
import { mkdir, readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { Readable } from 'stream'
import { ValidationError } from '../../../core/errors/errors'
import { poseStorageService } from './storage.service'

// ============================================
// EXPORT FORMAT SPECIFICATIONS
// ============================================

interface ExportFormatSpec {
  name: string
  width: number
  height: number
  format: 'jpeg' | 'png' | 'webp'
  quality: number
  aspectRatio: string
  description: string
}

export class ExportService {
  private readonly EXPORT_FORMATS: Record<string, ExportFormatSpec> = {
    // Instagram formats
    instagram_story: {
      name: 'Instagram Story',
      width: 1080,
      height: 1920,
      format: 'jpeg',
      quality: 90,
      aspectRatio: '9:16',
      description: 'Optimized for Instagram Stories (1080x1920)',
    },
    instagram_feed: {
      name: 'Instagram Feed',
      width: 1080,
      height: 1080,
      format: 'jpeg',
      quality: 85,
      aspectRatio: '1:1',
      description: 'Square format for Instagram feed (1080x1080)',
    },
    instagram_portrait: {
      name: 'Instagram Portrait',
      width: 1080,
      height: 1350,
      format: 'jpeg',
      quality: 85,
      aspectRatio: '4:5',
      description: 'Vertical format for Instagram feed (1080x1350)',
    },

    // TikTok format
    tiktok: {
      name: 'TikTok',
      width: 1080,
      height: 1920,
      format: 'jpeg',
      quality: 90,
      aspectRatio: '9:16',
      description: 'Optimized for TikTok videos (1080x1920)',
    },

    // E-commerce platforms
    shopee_product: {
      name: 'Shopee Product',
      width: 1000,
      height: 1000,
      format: 'jpeg',
      quality: 95,
      aspectRatio: '1:1',
      description: 'Square format for Shopee listings (1000x1000)',
    },
    tokopedia_product: {
      name: 'Tokopedia Product',
      width: 1200,
      height: 1200,
      format: 'jpeg',
      quality: 95,
      aspectRatio: '1:1',
      description: 'Square format for Tokopedia listings (1200x1200)',
    },
    lazada_product: {
      name: 'Lazada Product',
      width: 1000,
      height: 1000,
      format: 'jpeg',
      quality: 95,
      aspectRatio: '1:1',
      description: 'Square format for Lazada listings (1000x1000)',
    },

    // Print formats
    print_a4: {
      name: 'Print A4',
      width: 2480,
      height: 3508,
      format: 'png',
      quality: 100,
      aspectRatio: '210:297',
      description: 'High-resolution A4 print (300 DPI)',
    },
    print_4x6: {
      name: 'Print 4x6',
      width: 1800,
      height: 1200,
      format: 'png',
      quality: 100,
      aspectRatio: '3:2',
      description: 'Standard photo print 4x6 inches (300 DPI)',
    },

    // Web/Social formats
    facebook_post: {
      name: 'Facebook Post',
      width: 1200,
      height: 630,
      format: 'jpeg',
      quality: 85,
      aspectRatio: '1.91:1',
      description: 'Optimized for Facebook posts (1200x630)',
    },
    twitter_post: {
      name: 'Twitter Post',
      width: 1200,
      height: 675,
      format: 'jpeg',
      quality: 85,
      aspectRatio: '16:9',
      description: 'Optimized for Twitter posts (1200x675)',
    },
    linkedin_post: {
      name: 'LinkedIn Post',
      width: 1200,
      height: 627,
      format: 'jpeg',
      quality: 85,
      aspectRatio: '1.91:1',
      description: 'Optimized for LinkedIn posts (1200x627)',
    },

    // Original/Custom
    original: {
      name: 'Original',
      width: 0, // Will use original dimensions
      height: 0,
      format: 'png',
      quality: 100,
      aspectRatio: 'original',
      description: 'Original resolution and format',
    },
  }

  // ============================================
  // SINGLE IMAGE EXPORT
  // ============================================

  /**
   * Export single image to specific format
   *
   * @param imageSource - Image URL or Buffer
   * @param formatName - Export format name
   * @returns Processed image buffer
   */
  async exportToFormat(
    imageSource: string | Buffer,
    formatName: string
  ): Promise<Buffer> {
    const format = this.EXPORT_FORMATS[formatName]

    if (!format) {
      throw new ValidationError(
        `Unknown export format: ${formatName}. Valid formats: ${Object.keys(
          this.EXPORT_FORMATS
        ).join(', ')}`
      )
    }

    // Load image
    let sharpInstance = sharp(imageSource)

    // Get original metadata
    const metadata = await sharpInstance.metadata()

    // Handle original format (no resize)
    if (formatName === 'original') {
      return await sharpInstance
        .toFormat('png', { quality: 100 })
        .toBuffer()
    }

    // Resize image
    sharpInstance = sharpInstance.resize(format.width, format.height, {
      fit: 'cover', // Cover entire area, crop if needed
      position: 'center', // Center crop
    })

    // Apply format conversion
    if (format.format === 'jpeg') {
      sharpInstance = sharpInstance.jpeg({
        quality: format.quality,
        progressive: true,
        mozjpeg: true, // Use mozjpeg for better compression
      })
    } else if (format.format === 'png') {
      sharpInstance = sharpInstance.png({
        quality: format.quality,
        compressionLevel: 9,
      })
    } else if (format.format === 'webp') {
      sharpInstance = sharpInstance.webp({
        quality: format.quality,
        effort: 6, // Higher effort for better compression
      })
    }

    // Convert to buffer
    return await sharpInstance.toBuffer()
  }

  /**
   * Export to multiple formats
   *
   * @param imageSource - Image URL or Buffer
   * @param formatNames - Array of format names
   * @returns Record of format name to buffer
   */
  async exportMultipleFormats(
    imageSource: string | Buffer,
    formatNames: string[]
  ): Promise<Record<string, Buffer>> {
    const results: Record<string, Buffer> = {}

    // Process formats in parallel
    await Promise.all(
      formatNames.map(async (formatName) => {
        try {
          results[formatName] = await this.exportToFormat(imageSource, formatName)
        } catch (error) {
          console.error(`Failed to export format ${formatName}:`, error)
          // Continue with other formats
        }
      })
    )

    return results
  }

  // ============================================
  // BATCH EXPORT (ZIP)
  // ============================================

  /**
   * Create ZIP archive from multiple files
   *
   * @param files - Array of files with name and buffer
   * @param outputPath - Path to save ZIP file
   */
  async createZipArchive(
    files: Array<{ name: string; buffer: Buffer }>,
    outputPath: string
  ): Promise<void> {
    // Ensure output directory exists
    await mkdir(dirname(outputPath), { recursive: true })

    return new Promise((resolve, reject) => {
      const output = createWriteStream(outputPath)
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Maximum compression
      })

      // Handle events
      output.on('close', () => {
        console.log(`Archive created: ${archive.pointer()} bytes`)
        resolve()
      })

      output.on('error', (err) => {
        reject(err)
      })

      archive.on('error', (err) => {
        reject(err)
      })

      archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
          console.warn('Archive warning:', err)
        } else {
          reject(err)
        }
      })

      // Pipe archive to output file
      archive.pipe(output)

      // Add files to archive
      for (const file of files) {
        archive.append(file.buffer, { name: file.name })
      }

      // Finalize archive
      archive.finalize()
    })
  }

  /**
   * Batch export multiple images to multiple formats and create ZIP
   *
   * @param images - Array of image sources with names
   * @param formats - Array of format names
   * @param outputPath - Path to save ZIP file
   */
  async batchExportToZip(
    images: Array<{ name: string; source: string | Buffer }>,
    formats: string[],
    outputPath: string
  ): Promise<void> {
    const files: Array<{ name: string; buffer: Buffer }> = []

    // Process each image
    for (const image of images) {
      for (const formatName of formats) {
        try {
          const buffer = await this.exportToFormat(image.source, formatName)
          const format = this.EXPORT_FORMATS[formatName]

          // Generate filename
          const extension = format.format === 'jpeg' ? 'jpg' : format.format
          const filename = `${image.name}_${formatName}.${extension}`

          files.push({ name: filename, buffer })
        } catch (error) {
          console.error(
            `Failed to export ${image.name} to ${formatName}:`,
            error
          )
          // Continue with other images/formats
        }
      }
    }

    // Create ZIP archive
    await this.createZipArchive(files, outputPath)
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Get all available export formats
   */
  getAvailableFormats(): ExportFormatSpec[] {
    return Object.entries(this.EXPORT_FORMATS).map(([key, spec]) => ({
      ...spec,
      id: key,
    })) as any
  }

  /**
   * Get format specification by name
   */
  getFormatSpec(formatName: string): ExportFormatSpec | null {
    return this.EXPORT_FORMATS[formatName] || null
  }

  /**
   * Validate format name
   */
  isValidFormat(formatName: string): boolean {
    return formatName in this.EXPORT_FORMATS
  }

  /**
   * Get format category
   */
  getFormatCategory(formatName: string): string {
    if (formatName.startsWith('instagram')) return 'Instagram'
    if (formatName.startsWith('tiktok')) return 'TikTok'
    if (formatName.includes('product')) return 'E-commerce'
    if (formatName.startsWith('print')) return 'Print'
    if (formatName.startsWith('facebook')) return 'Facebook'
    if (formatName.startsWith('twitter')) return 'Twitter'
    if (formatName.startsWith('linkedin')) return 'LinkedIn'
    if (formatName === 'original') return 'Original'
    return 'Other'
  }

  /**
   * Get formats by category
   */
  getFormatsByCategory(): Record<string, string[]> {
    const categories: Record<string, string[]> = {}

    for (const formatName of Object.keys(this.EXPORT_FORMATS)) {
      const category = this.getFormatCategory(formatName)

      if (!categories[category]) {
        categories[category] = []
      }

      categories[category].push(formatName)
    }

    return categories
  }

  /**
   * Calculate estimated file size for format
   */
  estimateFileSize(formatName: string): string {
    const format = this.EXPORT_FORMATS[formatName]
    if (!format) return 'Unknown'

    const pixels = format.width * format.height
    const bitsPerPixel = format.format === 'png' ? 3 : 2 // Rough estimate

    const estimatedBytes = (pixels * bitsPerPixel * format.quality) / 100
    const estimatedMB = estimatedBytes / (1024 * 1024)

    if (estimatedMB < 1) {
      return `~${Math.round(estimatedMB * 1024)} KB`
    }

    return `~${estimatedMB.toFixed(1)} MB`
  }

  /**
   * Get recommended formats for use case
   */
  getRecommendedFormats(useCase: string): string[] {
    const recommendations: Record<string, string[]> = {
      social_media: [
        'instagram_story',
        'instagram_feed',
        'tiktok',
        'facebook_post',
      ],
      ecommerce: [
        'shopee_product',
        'tokopedia_product',
        'lazada_product',
        'original',
      ],
      print: ['print_a4', 'print_4x6', 'original'],
      all_social: [
        'instagram_story',
        'instagram_feed',
        'tiktok',
        'facebook_post',
        'twitter_post',
        'linkedin_post',
      ],
    }

    return recommendations[useCase] || ['instagram_story', 'instagram_feed']
  }

  // ============================================
  // PHASE 4D: EXPORT GENERATION FOR POSES
  // ============================================

  /**
   * Generate all export formats for a generated pose
   *
   * @param params Generation parameters
   * @returns Record of format name to public URL
   */
  async generateExports(params: {
    sourceImagePath: string
    generationId: string
    poseId: string
    selectedFormats: string[]
  }): Promise<{ [formatName: string]: string }> {
    const { sourceImagePath, generationId, poseId, selectedFormats } = params
    const exportUrls: { [formatName: string]: string } = {}

    console.log(`[ExportService] Generating ${selectedFormats.length} formats for pose ${poseId}`)

    try {
      // Resolve source image path to actual file path
      const resolvedPath = poseStorageService.resolveToFilePath(sourceImagePath)

      // Read source image
      const sourceBuffer = await readFile(resolvedPath)

      // Generate each requested format in parallel
      const exportPromises = selectedFormats.map(async (formatName) => {
        try {
          const exportBuffer = await this.exportToFormat(sourceBuffer, formatName)

          // Determine file extension
          const format = this.EXPORT_FORMATS[formatName]
          const extension = format.format === 'jpeg' ? 'jpg' : format.format

          // Save export
          const exportPath = `poses/${generationId}/exports/${poseId}_${formatName}.${extension}`

          // Use storage service to save
          const exportUrl = await poseStorageService.saveExport(exportPath, exportBuffer)

          console.log(`[ExportService] Generated ${formatName} -> ${exportUrl}`)

          return { formatName, exportUrl }
        } catch (error) {
          console.error(`[ExportService] Failed to generate export format ${formatName}:`, error)
          return null
        }
      })

      // Wait for all exports to complete
      const results = await Promise.all(exportPromises)

      // Build URL map (exclude failed exports)
      for (const result of results) {
        if (result) {
          exportUrls[result.formatName] = result.exportUrl
        }
      }

      console.log(`[ExportService] Successfully generated ${Object.keys(exportUrls).length}/${selectedFormats.length} formats`)

      return exportUrls
    } catch (error) {
      console.error(`[ExportService] Failed to generate exports:`, error)
      throw error
    }
  }

  /**
   * Create ZIP archive of all exports for a generation
   *
   * @param params ZIP creation parameters
   * @returns ZIP buffer
   */
  async createExportZip(params: {
    generationId: string
    poseIds: string[]
    formats: string[]
  }): Promise<Buffer> {
    const { generationId, poseIds, formats } = params

    console.log(`[ExportService] Creating ZIP for ${poseIds.length} poses, ${formats.length} formats`)

    return new Promise((resolve, reject) => {
      const archive = archiver('zip', { zlib: { level: 9 } })
      const chunks: Buffer[] = []

      // Collect data chunks
      archive.on('data', (chunk) => chunks.push(chunk))

      // Archive completed
      archive.on('end', () => {
        const zipBuffer = Buffer.concat(chunks)
        console.log(`[ExportService] ZIP created: ${zipBuffer.length} bytes`)
        resolve(zipBuffer)
      })

      // Handle errors
      archive.on('error', (err) => {
        console.error(`[ExportService] ZIP creation error:`, err)
        reject(err)
      })

      // Add files to archive
      let filesAdded = 0
      for (const poseId of poseIds) {
        for (const formatName of formats) {
          try {
            // Determine file extension
            const format = this.EXPORT_FORMATS[formatName]
            if (!format) {
              console.warn(`[ExportService] Unknown format ${formatName}, skipping`)
              continue
            }

            const extension = format.format === 'jpeg' ? 'jpg' : format.format
            const exportPath = `poses/${generationId}/exports/${poseId}_${formatName}.${extension}`

            // Resolve to file path
            const fullPath = poseStorageService.resolveToFilePath(exportPath)

            // Add to archive with organized folder structure
            archive.file(fullPath, {
              name: `${formatName}/${poseId}.${extension}`,
            })

            filesAdded++
          } catch (error) {
            console.warn(`[ExportService] Failed to add ${poseId}_${formatName} to archive:`, error)
          }
        }
      }

      console.log(`[ExportService] Added ${filesAdded} files to ZIP`)

      // Finalize archive (must be called after adding all files)
      archive.finalize()
    })
  }

  /**
   * Create ZIP archive from in-memory buffers (useful when exports don't exist on disk yet)
   *
   * @param files Array of files with name and buffer
   * @returns ZIP buffer
   */
  async createZipFromBuffers(
    files: Array<{ name: string; buffer: Buffer }>
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const archive = archiver('zip', { zlib: { level: 9 } })
      const chunks: Buffer[] = []

      archive.on('data', (chunk) => chunks.push(chunk))
      archive.on('end', () => resolve(Buffer.concat(chunks)))
      archive.on('error', reject)

      // Add files from buffers
      for (const file of files) {
        archive.append(file.buffer, { name: file.name })
      }

      archive.finalize()
    })
  }

  /**
   * Re-generate single export format
   *
   * @param params Regeneration parameters
   * @returns Public URL of regenerated export
   */
  async regenerateExport(params: {
    sourceImagePath: string
    generationId: string
    poseId: string
    formatName: string
  }): Promise<string> {
    const { sourceImagePath, generationId, poseId, formatName } = params

    console.log(`[ExportService] Regenerating ${formatName} for pose ${poseId}`)

    // Validate format
    if (!this.isValidFormat(formatName)) {
      throw new ValidationError(`Invalid export format: ${formatName}`)
    }

    // Generate single format
    const exportUrls = await this.generateExports({
      sourceImagePath,
      generationId,
      poseId,
      selectedFormats: [formatName],
    })

    return exportUrls[formatName]
  }
}

export const exportService = new ExportService()
