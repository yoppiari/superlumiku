import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:3qQOc2DzN8GpkTAKkTNvvoXKn4ZPbyxkX65zRMBL0IbI9XsVZd5zQkhAj5j793e6@kssgoso:5432/postgres'
    }
  }
})

async function main() {
  console.log('✅ Connecting to production database...\n')

  const models = [
    { appId: 'video-generator', modelId: 'wan2.2', modelKey: 'video-generator:wan2.2', name: 'Wan 2.2 T2V (Free)', description: 'Text-to-Video Ultra', provider: 'modelslab', tier: 'free', creditCost: 5, quotaCost: 1, creditPerSecond: 1.0, capabilities: '{"maxDuration":6}', enabled: true, beta: false },
    { appId: 'video-generator', modelId: 'veo2', modelKey: 'video-generator:veo2', name: 'Google Veo 2', provider: 'edenai', tier: 'basic', creditCost: 10, quotaCost: 1, creditPerSecond: 2.0, enabled: true, beta: false },
    { appId: 'video-generator', modelId: 'kling-2.5', modelKey: 'video-generator:kling-2.5', name: 'Kling 2.5 Pro', provider: 'edenai', tier: 'pro', creditCost: 20, quotaCost: 2, creditPerSecond: 3.0, enabled: true, beta: false },
    { appId: 'poster-editor', modelId: 'inpaint-standard', modelKey: 'poster-editor:inpaint-standard', name: 'Inpaint Standard', provider: 'segmind', tier: 'free', creditCost: 3, quotaCost: 1, creditPerPixel: 0.000001, enabled: true, beta: false },
    { appId: 'poster-editor', modelId: 'inpaint-pro', modelKey: 'poster-editor:inpaint-pro', name: 'Inpaint Pro', provider: 'segmind', tier: 'pro', creditCost: 10, quotaCost: 2, creditPerPixel: 0.000003, enabled: true, beta: false },
    { appId: 'video-mixer', modelId: 'ffmpeg-standard', modelKey: 'video-mixer:ffmpeg-standard', name: 'FFmpeg Standard', provider: 'local', tier: 'free', creditCost: 2, quotaCost: 1, enabled: true, beta: false },
    { appId: 'carousel-mix', modelId: 'canvas-standard', modelKey: 'carousel-mix:canvas-standard', name: 'Canvas Standard', provider: 'local', tier: 'free', creditCost: 1, quotaCost: 1, enabled: true, beta: false },
    { appId: 'looping-flow', modelId: 'ffmpeg-loop', modelKey: 'looping-flow:ffmpeg-loop', name: 'FFmpeg Loop', provider: 'local', tier: 'free', creditCost: 2, quotaCost: 1, enabled: true, beta: false },
    { appId: 'avatar-generator', modelId: 'controlnet-openpose-sd15', modelKey: 'avatar-generator:controlnet-openpose-sd15', name: 'ControlNet OpenPose SD 1.5 (Free)', provider: 'huggingface', tier: 'free', creditCost: 3, quotaCost: 1, enabled: true, beta: true },
    { appId: 'avatar-generator', modelId: 'controlnet-openpose-sdxl', modelKey: 'avatar-generator:controlnet-openpose-sdxl', name: 'ControlNet OpenPose SDXL', provider: 'huggingface', tier: 'basic', creditCost: 5, quotaCost: 1, enabled: true, beta: true },
    { appId: 'avatar-generator', modelId: 'controlnet-openpose-sdxl-ultra', modelKey: 'avatar-generator:controlnet-openpose-sdxl-ultra', name: 'ControlNet OpenPose SDXL Ultra', provider: 'huggingface', tier: 'pro', creditCost: 8, quotaCost: 2, enabled: true, beta: true }
  ]

  console.log('🌱 Seeding AI models...\n')

  for (const model of models) {
    try {
      await prisma.aIModel.upsert({
        where: { modelKey: model.modelKey },
        update: {},
        create: model as any
      })
      console.log(`✅ ${model.name}`)
    } catch (err) {
      console.log(`⏭️  Skipped: ${model.name}`)
    }
  }

  const total = await prisma.aIModel.count()
  console.log(`\n🎉 Total: ${total} models in database!`)
  console.log('\n📱 Refresh https://dev.lumiku.com/dashboard to see 6 apps!\n')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
