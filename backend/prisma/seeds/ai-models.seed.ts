import prisma from '../../src/db/client'

export const seedAIModels = async () => {
  console.log('🌱 Seeding AI models...')

  const models = [
    // ==========================================
    // VIDEO GENERATOR MODELS
    // ==========================================
    {
      appId: 'video-generator',
      modelId: 'wan2.2',
      modelKey: 'video-generator:wan2.2',
      name: 'Wan 2.2 T2V (Free)',
      description: 'Text-to-Video Ultra - Fast and efficient',
      provider: 'modelslab',
      tier: 'free',
      creditCost: 5,
      creditPerSecond: 1.0,
      quotaCost: 1,
      capabilities: JSON.stringify({
        maxDuration: 6,
        resolutions: ['720p'],
        aspectRatios: ['16:9', '9:16']
      }),
      enabled: true,
      beta: false
    },
    {
      appId: 'video-generator',
      modelId: 'veo2',
      modelKey: 'video-generator:veo2',
      name: 'Google Veo 2',
      description: 'Advanced video generation with Veo 2',
      provider: 'edenai',
      tier: 'basic',
      creditCost: 10,
      creditPerSecond: 2.0,
      quotaCost: 1,
      capabilities: JSON.stringify({
        maxDuration: 10,
        resolutions: ['720p', '1080p'],
        aspectRatios: ['16:9', '9:16', '1:1']
      }),
      enabled: true,
      beta: false
    },
    {
      appId: 'video-generator',
      modelId: 'kling-2.5',
      modelKey: 'video-generator:kling-2.5',
      name: 'Kling 2.5 Pro',
      description: 'Professional video generation with Kling AI',
      provider: 'edenai',
      tier: 'pro',
      creditCost: 20,
      creditPerSecond: 3.0,
      quotaCost: 2,
      capabilities: JSON.stringify({
        maxDuration: 10,
        resolutions: ['720p', '1080p', '4k'],
        aspectRatios: ['16:9', '9:16', '1:1', '4:5']
      }),
      enabled: true,
      beta: false
    },
    {
      appId: 'video-generator',
      modelId: 'veo3',
      modelKey: 'video-generator:veo3',
      name: 'Google Veo 3 Enterprise',
      description: 'Latest Veo 3 with enterprise features',
      provider: 'edenai',
      tier: 'enterprise',
      creditCost: 50,
      creditPerSecond: 5.0,
      quotaCost: 3,
      capabilities: JSON.stringify({
        maxDuration: 20,
        resolutions: ['720p', '1080p', '4k'],
        aspectRatios: ['16:9', '9:16', '1:1', '4:5'],
        supportsAudio: true
      }),
      enabled: true,
      beta: false
    },

    // ==========================================
    // POSTER EDITOR MODELS
    // ==========================================
    {
      appId: 'poster-editor',
      modelId: 'inpaint-standard',
      modelKey: 'poster-editor:inpaint-standard',
      name: 'Inpaint Standard',
      description: 'Standard quality inpainting',
      provider: 'segmind',
      tier: 'free',
      creditCost: 3,
      creditPerPixel: 0.000001,
      quotaCost: 1,
      capabilities: JSON.stringify({
        maxResolution: '2048x2048'
      }),
      enabled: true,
      beta: false
    },
    {
      appId: 'poster-editor',
      modelId: 'inpaint-pro',
      modelKey: 'poster-editor:inpaint-pro',
      name: 'Inpaint Pro',
      description: 'High quality inpainting with better results',
      provider: 'segmind',
      tier: 'pro',
      creditCost: 10,
      creditPerPixel: 0.000003,
      quotaCost: 2,
      capabilities: JSON.stringify({
        maxResolution: '4096x4096'
      }),
      enabled: true,
      beta: false
    },
    {
      appId: 'poster-editor',
      modelId: 'super-resolution',
      modelKey: 'poster-editor:super-resolution',
      name: 'Super Resolution 4K',
      description: 'AI upscaling to 4K resolution',
      provider: 'edenai',
      tier: 'enterprise',
      creditCost: 50,
      creditPerPixel: null,
      quotaCost: 5,
      capabilities: JSON.stringify({
        maxUpscale: '4x',
        outputResolution: '4K'
      }),
      enabled: true,
      beta: false
    },

    // ==========================================
    // VIDEO MIXER (Not model-based, use default)
    // ==========================================
    {
      appId: 'video-mixer',
      modelId: 'ffmpeg-standard',
      modelKey: 'video-mixer:ffmpeg-standard',
      name: 'FFmpeg Standard',
      description: 'Standard video mixing with FFmpeg',
      provider: 'local',
      tier: 'free',
      creditCost: 2,
      creditPerSecond: null,
      quotaCost: 1,
      capabilities: JSON.stringify({
        maxVideos: 100,
        formats: ['mp4', 'webm']
      }),
      enabled: true,
      beta: false
    },

    // ==========================================
    // CAROUSEL MIX (Not model-based, use default)
    // ==========================================
    {
      appId: 'carousel-mix',
      modelId: 'canvas-standard',
      modelKey: 'carousel-mix:canvas-standard',
      name: 'Canvas Standard',
      description: 'Standard carousel generation',
      provider: 'local',
      tier: 'free',
      creditCost: 1,
      creditPerSecond: null,
      quotaCost: 1,
      capabilities: JSON.stringify({
        maxSlides: 8,
        formats: ['png', 'jpg']
      }),
      enabled: true,
      beta: false
    },

    // ==========================================
    // LOOPING FLOW (Not model-based, use default)
    // ==========================================
    {
      appId: 'looping-flow',
      modelId: 'ffmpeg-loop',
      modelKey: 'looping-flow:ffmpeg-loop',
      name: 'FFmpeg Loop',
      description: 'Video looping with FFmpeg',
      provider: 'local',
      tier: 'free',
      creditCost: 2,
      creditPerSecond: null,
      quotaCost: 1,
      capabilities: JSON.stringify({
        maxDuration: 300,
        crossfade: true
      }),
      enabled: true,
      beta: false
    },

    // ==========================================
    // AVATAR GENERATOR MODELS
    // ==========================================
    {
      appId: 'avatar-generator',
      modelId: 'controlnet-sd',
      modelKey: 'avatar-generator:controlnet-sd',
      name: 'ControlNet SD (Free)',
      description: 'Standard definition avatar generation with pose control',
      provider: 'modelslab',
      tier: 'free',
      creditCost: 5,
      creditPerSecond: null,
      quotaCost: 1,
      capabilities: JSON.stringify({
        quality: 'sd',
        resolution: '512x512',
        poseControl: true,
        processingTime: '~10s'
      }),
      enabled: true,
      beta: true
    },
    {
      appId: 'avatar-generator',
      modelId: 'controlnet-hd',
      modelKey: 'avatar-generator:controlnet-hd',
      name: 'ControlNet HD',
      description: 'High definition avatar generation with enhanced quality',
      provider: 'modelslab',
      tier: 'basic',
      creditCost: 7,
      creditPerSecond: null,
      quotaCost: 1,
      capabilities: JSON.stringify({
        quality: 'hd',
        resolution: '1024x1024',
        poseControl: true,
        processingTime: '~15s'
      }),
      enabled: true,
      beta: true
    },
    {
      appId: 'avatar-generator',
      modelId: 'controlnet-ultra',
      modelKey: 'avatar-generator:controlnet-ultra',
      name: 'ControlNet Ultra Pro',
      description: 'Ultra high quality with priority processing',
      provider: 'modelslab',
      tier: 'pro',
      creditCost: 10,
      creditPerSecond: null,
      quotaCost: 2,
      capabilities: JSON.stringify({
        quality: 'ultra',
        resolution: '1024x1024',
        poseControl: true,
        priorityQueue: true,
        processingTime: '~8s'
      }),
      enabled: true,
      beta: true
    }
  ]

  for (const model of models) {
    await prisma.aIModel.upsert({
      where: { modelKey: model.modelKey },
      update: model,
      create: model
    })
  }

  console.log(`✅ Seeded ${models.length} AI models`)
}
