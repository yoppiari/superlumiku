import { Context } from 'hono'
import prisma from '../../../db/client'
import sharp from 'sharp'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function uploadPoster(c: Context) {
  try {
    const userId = c.get('userId')
    const body = await c.req.parseBody()
    const file = body.file as File
    const projectId = body.projectId as string

    if (!file) {
      return c.json({ success: false, error: 'No file provided' }, 400)
    }

    if (!projectId) {
      return c.json({ success: false, error: 'Project ID is required' }, 400)
    }

    // Verify project ownership
    const project = await prisma.posterEditorProject.findFirst({
      where: { id: projectId, userId }
    })

    if (!project) {
      return c.json({ success: false, error: 'Project not found' }, 404)
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return c.json({ success: false, error: 'Only image files are allowed' }, 400)
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return c.json({ success: false, error: 'File size must be less than 10MB' }, 400)
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'uploads', 'poster-editor', 'originals')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${timestamp}-${originalName}`
    const filepath = path.join(uploadDir, filename)

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Get image metadata before processing
    const metadata = await sharp(buffer).metadata()

    // Process image with sharp (optimize and save)
    await sharp(buffer)
      .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toFile(filepath)

    // Create database record
    const poster = await prisma.posterEdit.create({
      data: {
        userId,
        projectId,
        originalUrl: `/uploads/poster-editor/originals/${filename}`,
        originalSize: JSON.stringify({
          width: metadata.width || 0,
          height: metadata.height || 0,
          fileSize: buffer.length,
          format: metadata.format || 'jpeg'
        }),
        status: 'uploaded'
      },
      include: {
        exports: true
      }
    })

    // Update project updatedAt
    await prisma.posterEditorProject.update({
      where: { id: projectId },
      data: { updatedAt: new Date() }
    })

    return c.json({
      success: true,
      poster,
      message: 'Poster uploaded successfully'
    }, 201)

  } catch (error: any) {
    console.error('Upload error:', error)
    return c.json({
      success: false,
      error: error.message || 'Failed to upload poster'
    }, 500)
  }
}

export async function deletePoster(c: Context) {
  try {
    const userId = c.get('userId')
    const posterId = c.req.param('id')

    // Verify ownership
    const poster = await prisma.posterEdit.findFirst({
      where: { id: posterId, userId }
    })

    if (!poster) {
      return c.json({ success: false, error: 'Poster not found' }, 404)
    }

    // Delete from database (files can be cleaned up with a cron job)
    await prisma.posterEdit.delete({
      where: { id: posterId }
    })

    return c.json({
      success: true,
      message: 'Poster deleted successfully'
    })

  } catch (error: any) {
    console.error('Delete poster error:', error)
    return c.json({
      success: false,
      error: error.message || 'Failed to delete poster'
    }, 500)
  }
}

export async function getPoster(c: Context) {
  try {
    const userId = c.get('userId')
    const posterId = c.req.param('id')

    const poster = await prisma.posterEdit.findFirst({
      where: { id: posterId, userId },
      include: {
        exports: true
      }
    })

    if (!poster) {
      return c.json({ success: false, error: 'Poster not found' }, 404)
    }

    return c.json({
      success: true,
      poster
    })

  } catch (error: any) {
    console.error('Get poster error:', error)
    return c.json({
      success: false,
      error: error.message || 'Failed to get poster'
    }, 500)
  }
}
