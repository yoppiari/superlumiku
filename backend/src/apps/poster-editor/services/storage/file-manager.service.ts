import fs from 'fs/promises'
import path from 'path'
import { createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'
import sharp from 'sharp'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'
const BASE_DIR = path.join(UPLOAD_DIR, 'poster-editor')

export class FileManagerService {
  /**
   * Ensure user directory exists
   */
  async ensureUserDirectory(userId: string, posterId: string): Promise<string> {
    const userDir = path.join(BASE_DIR, userId, posterId)
    await fs.mkdir(userDir, { recursive: true })
    return userDir
  }

  /**
   * Save uploaded file
   */
  async saveUploadedFile(
    userId: string,
    posterId: string,
    buffer: Buffer,
    filename: string
  ): Promise<string> {
    const userDir = await this.ensureUserDirectory(userId, posterId)
    const filePath = path.join(userDir, filename)
    await fs.writeFile(filePath, buffer)
    return filePath
  }

  /**
   * Save file from URL
   */
  async saveFromUrl(
    userId: string,
    posterId: string,
    url: string,
    filename: string
  ): Promise<string> {
    const userDir = await this.ensureUserDirectory(userId, posterId)
    const filePath = path.join(userDir, filename)

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    await fs.writeFile(filePath, buffer)
    return filePath
  }

  /**
   * Read file as buffer
   */
  async readFile(filePath: string): Promise<Buffer> {
    return await fs.readFile(filePath)
  }

  /**
   * Get file info
   */
  async getFileInfo(filePath: string): Promise<{
    size: number
    width: number
    height: number
    format: string
  }> {
    const buffer = await this.readFile(filePath)
    const metadata = await sharp(buffer).metadata()

    return {
      size: buffer.length,
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
    }
  }

  /**
   * Delete file
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath)
    } catch (error) {
      console.warn(`Failed to delete file: ${filePath}`)
    }
  }

  /**
   * Delete poster directory
   */
  async deletePosterDirectory(userId: string, posterId: string): Promise<void> {
    const userDir = path.join(BASE_DIR, userId, posterId)
    try {
      await fs.rm(userDir, { recursive: true, force: true })
    } catch (error) {
      console.warn(`Failed to delete directory: ${userDir}`)
    }
  }

  /**
   * Get public URL for file
   */
  getPublicUrl(filePath: string): string {
    // Convert absolute path to relative URL
    const relativePath = filePath.replace(UPLOAD_DIR, '').replace(/\\/g, '/')
    return `/uploads${relativePath}`
  }

  /**
   * Convert URL to absolute path
   */
  urlToPath(url: string): string {
    const relativePath = url.replace('/uploads', '')
    return path.join(UPLOAD_DIR, relativePath)
  }
}

export const fileManagerService = new FileManagerService()
