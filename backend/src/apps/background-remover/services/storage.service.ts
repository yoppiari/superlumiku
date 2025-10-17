import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import archiver from 'archiver'
import { createWriteStream, createReadStream } from 'fs'

/**
 * StorageService - Save/retrieve images with Sharp processing
 */
class StorageService {
  private uploadDir: string
  private outputDir: string
  private thumbnailDir: string
  private zipDir: string

  constructor() {
    // Define storage directories
    this.uploadDir = path.join(process.cwd(), 'storage', 'background-remover', 'uploads')
    this.outputDir = path.join(process.cwd(), 'storage', 'background-remover', 'outputs')
    this.thumbnailDir = path.join(process.cwd(), 'storage', 'background-remover', 'thumbnails')
    this.zipDir = path.join(process.cwd(), 'storage', 'background-remover', 'zips')

    // Initialize directories
    this.initializeDirectories()
  }

  /**
   * Initialize storage directories
   */
  private async initializeDirectories() {
    const dirs = [this.uploadDir, this.outputDir, this.thumbnailDir, this.zipDir]

    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true })
      } catch (error) {
        console.error(`Failed to create directory ${dir}:`, error)
      }
    }
  }

  /**
   * Save uploaded file
   */
  async saveUploadedFile(
    fileBuffer: Buffer,
    userId: string,
    originalName: string
  ): Promise<{ filePath: string; fileSize: number }> {
    const timestamp = Date.now()
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${userId}_${timestamp}_${sanitizedName}`
    const filePath = path.join(this.uploadDir, fileName)

    await fs.writeFile(filePath, fileBuffer)

    return {
      filePath: `/storage/background-remover/uploads/${fileName}`,
      fileSize: fileBuffer.length,
    }
  }

  /**
   * Save processed image with optimization
   */
  async saveProcessedImage(
    imageBuffer: Buffer,
    userId: string,
    jobId: string,
    format: 'png' | 'webp' = 'png'
  ): Promise<{ filePath: string; fileSize: number; thumbnailPath: string }> {
    const fileName = `${userId}_${jobId}.${format}`
    const thumbnailName = `${userId}_${jobId}_thumb.webp`

    const filePath = path.join(this.outputDir, fileName)
    const thumbnailPath = path.join(this.thumbnailDir, thumbnailName)

    // Optimize and save main image
    let processedBuffer: Buffer
    if (format === 'png') {
      processedBuffer = await sharp(imageBuffer)
        .png({ quality: 90, compressionLevel: 9 })
        .toBuffer()
    } else {
      processedBuffer = await sharp(imageBuffer)
        .webp({ quality: 90 })
        .toBuffer()
    }

    await fs.writeFile(filePath, processedBuffer)

    // Generate thumbnail (300x300)
    await sharp(imageBuffer)
      .resize(300, 300, { fit: 'inside' })
      .webp({ quality: 80 })
      .toFile(thumbnailPath)

    return {
      filePath: `/storage/background-remover/outputs/${fileName}`,
      fileSize: processedBuffer.length,
      thumbnailPath: `/storage/background-remover/thumbnails/${thumbnailName}`,
    }
  }

  /**
   * Convert data URL to buffer
   */
  dataUrlToBuffer(dataUrl: string): Buffer {
    const base64Data = dataUrl.split(',')[1]
    return Buffer.from(base64Data, 'base64')
  }

  /**
   * Get image metadata
   */
  async getImageMetadata(imageBuffer: Buffer): Promise<{
    width: number
    height: number
    format: string
    size: number
  }> {
    const metadata = await sharp(imageBuffer).metadata()

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: imageBuffer.length,
    }
  }

  /**
   * Create ZIP file from processed images
   */
  async createZipFromBatch(
    batchId: string,
    jobs: Array<{ id: string; processedUrl: string; itemIndex: number }>
  ): Promise<{ zipPath: string; zipSize: number }> {
    const zipFileName = `batch_${batchId}_${Date.now()}.zip`
    const zipPath = path.join(this.zipDir, zipFileName)

    return new Promise((resolve, reject) => {
      const output = createWriteStream(zipPath)
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Maximum compression
      })

      output.on('close', async () => {
        const stats = await fs.stat(zipPath)
        resolve({
          zipPath: `/storage/background-remover/zips/${zipFileName}`,
          zipSize: stats.size,
        })
      })

      archive.on('error', (err) => {
        reject(err)
      })

      archive.pipe(output)

      // Add files to archive
      for (const job of jobs) {
        const fileName = `image_${job.itemIndex + 1}.png`

        // Handle both file paths and data URLs
        if (job.processedUrl.startsWith('data:')) {
          const buffer = this.dataUrlToBuffer(job.processedUrl)
          archive.append(buffer, { name: fileName })
        } else {
          const fullPath = path.join(process.cwd(), job.processedUrl)
          archive.append(createReadStream(fullPath), { name: fileName })
        }
      }

      archive.finalize()
    })
  }

  /**
   * Delete file
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const fullPath = path.join(process.cwd(), filePath)
      await fs.unlink(fullPath)
    } catch (error) {
      console.error(`Failed to delete file ${filePath}:`, error)
    }
  }

  /**
   * Get file size
   */
  async getFileSize(filePath: string): Promise<number> {
    try {
      const fullPath = path.join(process.cwd(), filePath)
      const stats = await fs.stat(fullPath)
      return stats.size
    } catch (error) {
      return 0
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(process.cwd(), filePath)
      await fs.access(fullPath)
      return true
    } catch {
      return false
    }
  }

  /**
   * Clean up old files (older than 7 days)
   */
  async cleanupOldFiles(): Promise<void> {
    const dirs = [this.uploadDir, this.outputDir, this.thumbnailDir, this.zipDir]
    const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

    for (const dir of dirs) {
      try {
        const files = await fs.readdir(dir)

        for (const file of files) {
          const filePath = path.join(dir, file)
          const stats = await fs.stat(filePath)
          const age = Date.now() - stats.mtimeMs

          if (age > maxAge) {
            await fs.unlink(filePath)
            console.log(`Deleted old file: ${file}`)
          }
        }
      } catch (error) {
        console.error(`Failed to cleanup directory ${dir}:`, error)
      }
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    uploadsCount: number
    outputsCount: number
    thumbnailsCount: number
    zipsCount: number
    totalSize: number
  }> {
    const dirs = {
      uploads: this.uploadDir,
      outputs: this.outputDir,
      thumbnails: this.thumbnailDir,
      zips: this.zipDir,
    }

    const stats = {
      uploadsCount: 0,
      outputsCount: 0,
      thumbnailsCount: 0,
      zipsCount: 0,
      totalSize: 0,
    }

    for (const [key, dir] of Object.entries(dirs)) {
      try {
        const files = await fs.readdir(dir)
        const countKey = `${key}Count` as keyof typeof stats

        stats[countKey] = files.length

        for (const file of files) {
          const filePath = path.join(dir, file)
          const fileStats = await fs.stat(filePath)
          stats.totalSize += fileStats.size
        }
      } catch (error) {
        console.error(`Failed to get stats for ${dir}:`, error)
      }
    }

    return stats
  }
}

export const storageService = new StorageService()
