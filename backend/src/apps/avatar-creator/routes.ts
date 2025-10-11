import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth.middleware'
import { avatarService } from './services/avatar.service'
import { avatarCreatorConfig } from './plugin.config'
import { z } from 'zod'
import path from 'path'
import fs from 'fs/promises'
import { existsSync } from 'fs'

const routes = new Hono()

// Validation schemas
const createAvatarSchema = z.object({
  name: z.string().min(1).max(100),
  gender: z.enum(['male', 'female', 'unisex']).optional(),
  ageRange: z.enum(['young', 'adult', 'mature']).optional(),
  style: z.enum(['casual', 'formal', 'sporty']).optional(),
  ethnicity: z.string().optional(),
})

const updateAvatarSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  gender: z.enum(['male', 'female', 'unisex']).optional(),
  ageRange: z.enum(['young', 'adult', 'mature']).optional(),
  style: z.enum(['casual', 'formal', 'sporty']).optional(),
  ethnicity: z.string().optional(),
})

// ========================================
// GET ALL AVATARS (Free)
// ========================================
routes.get('/avatars', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const avatars = await avatarService.getUserAvatars(userId)

    return c.json({
      success: true,
      avatars,
    })
  } catch (error: any) {
    console.error('Error fetching avatars:', error)
    return c.json({ error: error.message }, 400)
  }
})

// ========================================
// CREATE AVATAR (10 credits - commented out for now)
// ========================================
routes.post('/avatars', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')

    // Get form data
    const formData = await c.req.formData()
    const imageFile = formData.get('image') as File | null
    const name = formData.get('name') as string
    const gender = formData.get('gender') as string | undefined
    const ageRange = formData.get('ageRange') as string | undefined
    const style = formData.get('style') as string | undefined
    const ethnicity = formData.get('ethnicity') as string | undefined

    if (!imageFile) {
      return c.json({ error: 'Image file is required' }, 400)
    }

    if (!name) {
      return c.json({ error: 'Avatar name is required' }, 400)
    }

    // Validate data
    const validated = createAvatarSchema.parse({
      name,
      gender,
      ageRange,
      style,
      ethnicity,
    })

    // Save uploaded file
    const uploadsDir = path.join(process.cwd(), 'uploads', 'avatar-creator', userId)
    if (!existsSync(uploadsDir)) {
      await fs.mkdir(uploadsDir, { recursive: true })
    }

    const fileExtension = path.extname(imageFile.name)
    const filename = `avatar_${Date.now()}${fileExtension}`
    const filepath = path.join(uploadsDir, filename)

    // Write file
    const arrayBuffer = await imageFile.arrayBuffer()
    await fs.writeFile(filepath, Buffer.from(arrayBuffer))

    // Store relative path
    const relativePath = `/uploads/avatar-creator/${userId}/${filename}`

    // Create avatar in database
    const avatar = await avatarService.createAvatar(userId, validated, relativePath)

    // TODO: Record credit usage when credit system is ready
    // const { newBalance, creditUsed } = await recordCreditUsage(
    //   userId,
    //   'avatar-creator',
    //   'create_avatar',
    //   avatarCreatorConfig.credits.createAvatar,
    //   { avatarId: avatar.id }
    // )

    return c.json({
      success: true,
      avatar,
      message: 'Avatar created successfully',
      // creditUsed,
      // creditBalance: newBalance,
    }, 201)
  } catch (error: any) {
    console.error('Error creating avatar:', error)
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.errors }, 400)
    }
    return c.json({ error: error.message }, 400)
  }
})

// ========================================
// GET AVATAR BY ID (Free)
// ========================================
routes.get('/avatars/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const id = c.req.param('id')

    const avatar = await avatarService.getAvatar(id, userId)

    if (!avatar) {
      return c.json({ error: 'Avatar not found' }, 404)
    }

    return c.json({
      success: true,
      avatar,
    })
  } catch (error: any) {
    console.error('Error fetching avatar:', error)
    return c.json({ error: error.message }, 400)
  }
})

// ========================================
// UPDATE AVATAR (Free)
// ========================================
routes.put('/avatars/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const id = c.req.param('id')
    const body = await c.req.json()

    const validated = updateAvatarSchema.parse(body)

    const avatar = await avatarService.updateAvatar(id, userId, validated)

    return c.json({
      success: true,
      avatar,
      message: 'Avatar updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating avatar:', error)
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.errors }, 400)
    }
    return c.json({ error: error.message }, 400)
  }
})

// ========================================
// DELETE AVATAR (Free)
// ========================================
routes.delete('/avatars/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const id = c.req.param('id')

    await avatarService.deleteAvatar(id, userId)

    return c.json({
      success: true,
      message: 'Avatar deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting avatar:', error)
    return c.json({ error: error.message }, 400)
  }
})

// ========================================
// GET STATS (Free)
// ========================================
routes.get('/stats', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const stats = await avatarService.getStats(userId)

    return c.json({
      success: true,
      stats,
    })
  } catch (error: any) {
    console.error('Error fetching stats:', error)
    return c.json({ error: error.message }, 400)
  }
})

export default routes
