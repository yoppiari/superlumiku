import { promises as fs } from 'fs'
import path from 'path'
import { randomBytes } from 'crypto'
import prisma from '../db/client'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'

/**
 * Initialize storage directory
 */
export async function initStorage() {
  const dirs = [
    path.join(UPLOAD_DIR, 'videos'),
    path.join(UPLOAD_DIR, 'temp'),
    path.join(UPLOAD_DIR, 'carousel-slides'),
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
  category: 'videos' | 'temp' | 'carousel-slides' = 'videos'
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

/**
 * Calculate total storage used by user across all projects
 */
export async function getUserStorageUsed(userId: string): Promise<number> {
  const videos = await prisma.videoMixerVideo.findMany({
    where: {
      project: {
        userId,
      },
    },
    select: {
      fileSize: true,
    },
  })

  return videos.reduce((sum, video) => sum + video.fileSize, 0)
}

/**
 * Check if user has enough storage quota for file upload (READ-ONLY, no reservation)
 * For display purposes only - use checkAndReserveStorage for actual uploads
 */
export async function checkStorageQuota(
  userId: string,
  fileSize: number
): Promise<{ allowed: boolean; used: number; quota: number; available: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      storageQuota: true,
      storageUsed: true,
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const newUsage = user.storageUsed + fileSize
  const allowed = newUsage <= user.storageQuota
  const available = user.storageQuota - user.storageUsed

  return {
    allowed,
    used: user.storageUsed,
    quota: user.storageQuota,
    available,
  }
}

/**
 * Atomically check and reserve storage quota
 * Uses database transaction to prevent race conditions
 * Returns reservation ID for later commit or rollback
 */
export async function checkAndReserveStorage(
  userId: string,
  fileSize: number
): Promise<{ allowed: boolean; reservationId?: string; used?: number; quota?: number }> {
  return await prisma.$transaction(async (tx) => {
    // Lock user row for update
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        storageQuota: true,
        storageUsed: true
      }
    })

    if (!user) {
      throw new Error('User not found')
    }

    const newUsage = user.storageUsed + fileSize

    // Check if reservation would exceed quota
    if (newUsage > user.storageQuota) {
      return {
        allowed: false,
        used: user.storageUsed,
        quota: user.storageQuota
      }
    }

    // Atomically increment storage usage (reserve space)
    await tx.user.update({
      where: { id: userId },
      data: {
        storageUsed: { increment: fileSize }
      }
    })

    const reservationId = randomBytes(16).toString('hex')

    return {
      allowed: true,
      reservationId,
      used: user.storageUsed,
      quota: user.storageQuota
    }
  }, {
    isolationLevel: 'Serializable',
    maxWait: 5000,
    timeout: 10000,
  })
}

/**
 * Release storage reservation (rollback on upload failure)
 * @param userId - User ID
 * @param fileSize - Size to release in bytes
 */
export async function releaseStorageReservation(
  userId: string,
  fileSize: number
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      storageUsed: { decrement: fileSize }
    }
  })
}

/**
 * Update user storage usage (for manual adjustments)
 * @param userId - User ID
 * @param delta - Change in bytes (positive = add, negative = subtract)
 */
export async function updateUserStorage(userId: string, delta: number): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      storageUsed: {
        increment: delta,
      },
    },
  })
}
