import fs from 'fs/promises'
import path from 'path'

/**
 * Save SAM mask (base64) to temporary file and return URL
 * @param maskBase64 - Base64 data URL (with or without prefix)
 * @returns Relative URL path to the saved file
 */
export async function saveMaskToTemp(maskBase64: string): Promise<string> {
  const filename = `mask-${Date.now()}-${Math.random().toString(36).substring(7)}.png`
  const dirPath = path.join(process.cwd(), 'uploads', 'temp')
  const filepath = path.join(dirPath, filename)

  // Ensure directory exists
  await fs.mkdir(dirPath, { recursive: true })

  // Remove data URL prefix if present
  const base64Data = maskBase64.replace(/^data:image\/\w+;base64,/, '')
  const buffer = Buffer.from(base64Data, 'base64')

  await fs.writeFile(filepath, buffer)
  console.log(`✅ Saved mask to temp: ${filename}`)

  return `/uploads/temp/${filename}`
}

/**
 * Copy init image to temporary file and return URL
 * @param sourcePath - Absolute path to source image
 * @returns Relative URL path to the copied file
 */
export async function copyImageToTemp(sourcePath: string): Promise<string> {
  const filename = `init-${Date.now()}-${Math.random().toString(36).substring(7)}.png`
  const dirPath = path.join(process.cwd(), 'uploads', 'temp')
  const filepath = path.join(dirPath, filename)

  await fs.mkdir(dirPath, { recursive: true })
  await fs.copyFile(sourcePath, filepath)

  console.log(`✅ Copied image to temp: ${filename}`)

  return `/uploads/temp/${filename}`
}

/**
 * Cleanup temporary file
 * @param relativePath - Relative URL path (e.g., /uploads/temp/mask-123.png)
 */
export async function cleanupTempFile(relativePath: string): Promise<void> {
  try {
    const fullPath = path.join(process.cwd(), relativePath.replace(/^\//, ''))
    await fs.unlink(fullPath)
    console.log(`🧹 Cleaned up temp file: ${relativePath}`)
  } catch (error) {
    console.warn(`⚠️ Failed to cleanup temp file: ${relativePath}`, error)
  }
}

/**
 * Convert relative URL to absolute file path
 * @param relativeUrl - Relative URL (e.g., /uploads/poster-editor/image.png)
 * @returns Absolute file path
 */
export function urlToAbsolutePath(relativeUrl: string): string {
  return path.join(process.cwd(), relativeUrl.replace(/^\//, ''))
}

/**
 * Get public URL for file (for ModelsLab API)
 * In production, this would return full URL with domain
 * For local development, we need to use absolute file paths
 * @param relativePath - Relative path (e.g., /uploads/temp/mask-123.png)
 * @returns Absolute path for local or full URL for production
 */
export function getPublicUrl(relativePath: string): string {
  // For local development, ModelsLab needs absolute file paths
  // or we serve via static file server
  const baseUrl = process.env.PUBLIC_URL || 'http://localhost:3001'
  return `${baseUrl}${relativePath}`
}
