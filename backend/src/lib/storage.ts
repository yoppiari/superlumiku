import { promises as fs } from 'fs'
import path from 'path'
import { randomBytes } from 'crypto'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'

/**
 * Initialize storage directory
 */
export async function initStorage() {
  const dirs = [
    path.join(UPLOAD_DIR, 'videos'),
    path.join(UPLOAD_DIR, 'temp'),
  ]

  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true })
      console.log(`✅ Storage directory created: ${dir}`)
    } catch (error) {
      console.error(`❌ Failed to create directory ${dir}:`, error)
    }
  }
}

/**
 * Save uploaded file to storage
 */
export async function saveFile(
  file: File,
  category: 'videos' | 'temp' = 'videos'
): Promise<{ filePath: string; fileName: string }> {
  const timestamp = Date.now()
  const randomId = randomBytes(8).toString('hex')
  const ext = path.extname(file.name)
  const fileName = `${timestamp}_${randomId}${ext}`
  const filePath = path.join(UPLOAD_DIR, category, fileName)

  // Convert File to Buffer for Bun
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Save file
  await fs.writeFile(filePath, buffer)

  return {
    filePath: `/${category}/${fileName}`,
    fileName: file.name,
  }
}

/**
 * Delete file from storage
 */
export async function deleteFile(filePath: string): Promise<void> {
  const fullPath = path.join(UPLOAD_DIR, filePath)
  try {
    await fs.unlink(fullPath)
    console.log(`✅ File deleted: ${filePath}`)
  } catch (error) {
    console.error(`❌ Failed to delete file ${filePath}:`, error)
  }
}

/**
 * Get file size
 */
export async function getFileSize(filePath: string): Promise<number> {
  const fullPath = path.join(UPLOAD_DIR, filePath)
  const stats = await fs.stat(fullPath)
  return stats.size
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  const fullPath = path.join(UPLOAD_DIR, filePath)
  try {
    await fs.access(fullPath)
    return true
  } catch {
    return false
  }
}
