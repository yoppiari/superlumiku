import { Hono } from 'hono'
import prisma from '../db/client'
import bcrypt from 'bcryptjs'

const app = new Hono()

/**
 * POST /api/admin/seed-models
 * Seed AI models to database (admin only)
 */
app.post('/seed-models', async (c) => {
  try {
    console.log('🌱 Starting AI models seeding...')

    const models = [
      // Video Generator
      { appId: 'video-generator', modelId: 'wan2.2', modelKey: 'video-generator:wan2.2', name: 'Wan 2.2 T2V (Free)', description: 'Text-to-Video Ultra - Fast and efficient', provider: 'modelslab', tier: 'free', creditCost: 5, quotaCost: 1, creditPerSecond: 1.0, capabilities: '{"maxDuration":6,"resolutions":["720p"],"aspectRatios":["16:9","9:16"]}', enabled: true, beta: false },
      { appId: 'video-generator', modelId: 'veo2', modelKey: 'video-generator:veo2', name: 'Google Veo 2', description: 'Advanced video generation with Veo 2', provider: 'edenai', tier: 'basic', creditCost: 10, quotaCost: 1, creditPerSecond: 2.0, capabilities: '{"maxDuration":10,"resolutions":["720p","1080p"],"aspectRatios":["16:9","9:16","1:1"]}', enabled: true, beta: false },
      { appId: 'video-generator', modelId: 'kling-2.5', modelKey: 'video-generator:kling-2.5', name: 'Kling 2.5 Pro', description: 'Professional video generation with Kling AI', provider: 'edenai', tier: 'pro', creditCost: 20, quotaCost: 2, creditPerSecond: 3.0, capabilities: '{"maxDuration":10,"resolutions":["720p","1080p","4k"],"aspectRatios":["16:9","9:16","1:1","4:5"]}', enabled: true, beta: false },

      // Poster Editor
      { appId: 'poster-editor', modelId: 'inpaint-standard', modelKey: 'poster-editor:inpaint-standard', name: 'Inpaint Standard', description: 'Standard quality inpainting', provider: 'segmind', tier: 'free', creditCost: 3, quotaCost: 1, creditPerPixel: 0.000001, capabilities: '{"maxResolution":"2048x2048"}', enabled: true, beta: false },
      { appId: 'poster-editor', modelId: 'inpaint-pro', modelKey: 'poster-editor:inpaint-pro', name: 'Inpaint Pro', description: 'High quality inpainting with better results', provider: 'segmind', tier: 'pro', creditCost: 10, quotaCost: 2, creditPerPixel: 0.000003, capabilities: '{"maxResolution":"4096x4096"}', enabled: true, beta: false },

      // Video Mixer
      { appId: 'video-mixer', modelId: 'ffmpeg-standard', modelKey: 'video-mixer:ffmpeg-standard', name: 'FFmpeg Standard', description: 'Standard video mixing with FFmpeg', provider: 'local', tier: 'free', creditCost: 2, quotaCost: 1, capabilities: '{"maxVideos":100,"formats":["mp4","webm"]}', enabled: true, beta: false },

      // Carousel Mix
      { appId: 'carousel-mix', modelId: 'canvas-standard', modelKey: 'carousel-mix:canvas-standard', name: 'Canvas Standard', description: 'Standard carousel generation', provider: 'local', tier: 'free', creditCost: 1, quotaCost: 1, capabilities: '{"maxSlides":8,"formats":["png","jpg"]}', enabled: true, beta: false },

      // Looping Flow
      { appId: 'looping-flow', modelId: 'ffmpeg-loop', modelKey: 'looping-flow:ffmpeg-loop', name: 'FFmpeg Loop', description: 'Video looping with FFmpeg', provider: 'local', tier: 'free', creditCost: 2, quotaCost: 1, capabilities: '{"maxDuration":300,"crossfade":true}', enabled: true, beta: false },

      // Avatar Generator
      { appId: 'avatar-generator', modelId: 'controlnet-openpose-sd15', modelKey: 'avatar-generator:controlnet-openpose-sd15', name: 'ControlNet OpenPose SD 1.5 (Free)', description: 'Pose-guided avatar generation using Stable Diffusion 1.5', provider: 'huggingface', tier: 'free', creditCost: 3, quotaCost: 1, capabilities: '{"model":"lllyasviel/control_v11p_sd15_openpose","baseModel":"runwayml/stable-diffusion-v1-5","quality":"sd","resolution":"512x512","poseControl":true}', enabled: true, beta: true },
      { appId: 'avatar-generator', modelId: 'controlnet-openpose-sdxl', modelKey: 'avatar-generator:controlnet-openpose-sdxl', name: 'ControlNet OpenPose SDXL', description: 'High quality pose-guided generation using Stable Diffusion XL', provider: 'huggingface', tier: 'basic', creditCost: 5, quotaCost: 1, capabilities: '{"model":"thibaud/controlnet-openpose-sdxl-1.0","baseModel":"stabilityai/stable-diffusion-xl-base-1.0","quality":"hd","resolution":"1024x1024","poseControl":true}', enabled: true, beta: true },
      { appId: 'avatar-generator', modelId: 'controlnet-openpose-sdxl-ultra', modelKey: 'avatar-generator:controlnet-openpose-sdxl-ultra', name: 'ControlNet OpenPose SDXL Ultra', description: 'Ultra high quality with xinsir SOTA model', provider: 'huggingface', tier: 'pro', creditCost: 8, quotaCost: 2, capabilities: '{"model":"xinsir/controlnet-openpose-sdxl-1.0","baseModel":"stabilityai/stable-diffusion-xl-base-1.0","quality":"ultra","resolution":"1024x1024","poseControl":true,"priorityQueue":true,"sota":true}', enabled: true, beta: true }
    ]

    let inserted = 0
    let skipped = 0

    for (const model of models) {
      try {
        await prisma.aIModel.upsert({
          where: { modelKey: model.modelKey },
          update: {},
          create: model
        })
        inserted++
        console.log(`✅ Seeded: ${model.name}`)
      } catch (err) {
        skipped++
        console.log(`⏭️  Skipped: ${model.name}`)
      }
    }

    // Get stats
    const stats = await prisma.aIModel.groupBy({
      by: ['appId'],
      _count: { appId: true }
    })

    const total = await prisma.aIModel.count()

    return c.json({
      success: true,
      message: 'AI models seeded successfully',
      stats: {
        inserted,
        skipped,
        total,
        byApp: stats.map(s => ({ appId: s.appId, count: s._count.appId }))
      }
    })
  } catch (error: any) {
    console.error('❌ Seed error:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

/**
 * POST /api/admin/update-enterprise-passwords
 * Update passwords for 4 enterprise users
 */
app.post('/update-enterprise-passwords', async (c) => {
  try {
    console.log('🔐 Updating enterprise user passwords...')

    const userUpdates = [
      { email: 'ardianfaisal.id@gmail.com', newPassword: 'Ardian2025' },
      { email: 'iqbal.elvo@gmail.com', newPassword: 'Iqbal2025' },
      { email: 'galuh.inteko@gmail.com', newPassword: 'Galuh2025' },
      { email: 'dilla.inteko@gmail.com', newPassword: 'Dilla2025' }
    ]

    const results = []

    for (const update of userUpdates) {
      const hashedPassword = await bcrypt.hash(update.newPassword, 10)

      const user = await prisma.user.update({
        where: { email: update.email },
        data: { password: hashedPassword },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          credits: true
        }
      })

      results.push({
        email: user.email,
        name: user.name,
        role: user.role,
        credits: user.credits,
        passwordUpdated: true
      })

      console.log(`✅ Updated password for: ${user.email}`)
    }

    return c.json({
      success: true,
      message: 'Enterprise user passwords updated successfully',
      users: results,
      credentials: userUpdates.map(u => ({
        email: u.email,
        password: u.newPassword
      }))
    })
  } catch (error: any) {
    console.error('❌ Password update error:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

export default app
