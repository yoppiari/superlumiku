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
    // AVATAR CREATOR MODELS (FLUX.1-dev)
    // ==========================================
    {
      appId: 'avatar-creator',
      modelId: 'flux-dev-standard',
      modelKey: 'avatar-creator:flux-dev-standard',
      name: 'FLUX.1-dev Standard',
      description: 'Text-to-image avatar generation with FLUX.1-dev + Realism LoRA',
      provider: 'huggingface',
      tier: 'free',
      creditCost: 10,
      creditPerPixel: null,
      quotaCost: 1,
      capabilities: JSON.stringify({
        model: 'black-forest-labs/FLUX.1-dev',
        lora: 'realism',
        quality: 'standard',
        resolution: '512x512',
        guidanceScale: 7.5,
        processingTime: '~30-60s',
        photoRealistic: true
      }),
      enabled: true,
      beta: false
    },
    {
      appId: 'avatar-creator',
      modelId: 'flux-dev-hd',
      modelKey: 'avatar-creator:flux-dev-hd',
      name: 'FLUX.1-dev HD',
      description: 'High resolution avatar generation (1024x1024) with enhanced details',
      provider: 'huggingface',
      tier: 'basic',
      creditCost: 15,
      creditPerPixel: null,
      quotaCost: 2,
      capabilities: JSON.stringify({
        model: 'black-forest-labs/FLUX.1-dev',
        lora: 'realism',
        quality: 'hd',
        resolution: '1024x1024',
        guidanceScale: 7.5,
        processingTime: '~45-90s',
        photoRealistic: true,
        enhancedDetails: true
      }),
      enabled: true,
      beta: false
    },
    {
      appId: 'avatar-creator',
      modelId: 'flux-schnell-fast',
      modelKey: 'avatar-creator:flux-schnell-fast',
      name: 'FLUX.1-schnell Fast',
      description: 'Rapid avatar generation with FLUX.1-schnell (5-10 seconds)',
      provider: 'huggingface',
      tier: 'pro',
      creditCost: 8,
      creditPerPixel: null,
      quotaCost: 1,
      capabilities: JSON.stringify({
        model: 'black-forest-labs/FLUX.1-schnell',
        lora: 'realism',
        quality: 'fast',
        resolution: '512x512',
        guidanceScale: 0,
        processingTime: '~5-10s',
        photoRealistic: true,
        fastMode: true
      }),
      enabled: true,
      beta: false
    },

    // ==========================================
    // AVATAR GENERATOR MODELS (Hugging Face)
    // ==========================================
    {
      appId: 'avatar-generator',
      modelId: 'controlnet-openpose-sd15',
      modelKey: 'avatar-generator:controlnet-openpose-sd15',
      name: 'ControlNet OpenPose SD 1.5 (Free)',
      description: 'Pose-guided avatar generation using Stable Diffusion 1.5',
      provider: 'huggingface',
      tier: 'free',
      creditCost: 3,
      creditPerSecond: null,
      quotaCost: 1,
      capabilities: JSON.stringify({
        model: 'lllyasviel/control_v11p_sd15_openpose',
        baseModel: 'runwayml/stable-diffusion-v1-5',
        quality: 'sd',
        resolution: '512x512',
        poseControl: true,
        processingTime: '~15-30s'
      }),
      enabled: true,
      beta: true
    },
    {
      appId: 'avatar-generator',
      modelId: 'controlnet-openpose-sdxl',
      modelKey: 'avatar-generator:controlnet-openpose-sdxl',
      name: 'ControlNet OpenPose SDXL',
      description: 'High quality pose-guided generation using Stable Diffusion XL',
      provider: 'huggingface',
      tier: 'basic',
      creditCost: 5,
      creditPerSecond: null,
      quotaCost: 1,
      capabilities: JSON.stringify({
        model: 'thibaud/controlnet-openpose-sdxl-1.0',
        baseModel: 'stabilityai/stable-diffusion-xl-base-1.0',
        quality: 'hd',
        resolution: '1024x1024',
        poseControl: true,
        processingTime: '~30-60s'
      }),
      enabled: true,
      beta: true
    },
    {
      appId: 'avatar-generator',
      modelId: 'controlnet-openpose-sdxl-ultra',
      modelKey: 'avatar-generator:controlnet-openpose-sdxl-ultra',
      name: 'ControlNet OpenPose SDXL Ultra',
      description: 'Ultra high quality with xinsir SOTA model',
      provider: 'huggingface',
      tier: 'pro',
      creditCost: 8,
      creditPerSecond: null,
      quotaCost: 2,
      capabilities: JSON.stringify({
        model: 'xinsir/controlnet-openpose-sdxl-1.0',
        baseModel: 'stabilityai/stable-diffusion-xl-base-1.0',
        quality: 'ultra',
        resolution: '1024x1024',
        poseControl: true,
        priorityQueue: true,
        processingTime: '~30-60s',
        sota: true
      }),
      enabled: true,
      beta: true
    },
    {
      appId: 'avatar-generator',
      modelId: 'sd35-controlnet-canny',
      modelKey: 'avatar-generator:sd35-controlnet-canny',
      name: 'SD 3.5 ControlNet Canny (Coming Soon)',
      description: 'Edge-guided generation with SD 3.5 Large - Pose support coming soon',
      provider: 'huggingface',
      tier: 'enterprise',
      creditCost: 12,
      creditPerSecond: null,
      quotaCost: 3,
      capabilities: JSON.stringify({
        model: 'stabilityai/stable-diffusion-3.5-controlnets',
        controlnetType: 'canny',
        baseModel: 'stabilityai/stable-diffusion-3.5-large',
        quality: 'premium',
        resolution: '1024x1024',
        poseControl: false,
        edgeControl: true,
        comingSoon: true,
        processingTime: '~60-90s',
        recommendedSteps: 60,
        recommendedStrength: 0.75,
        note: 'OpenPose ControlNet for SD 3.5 not yet released by Stability AI'
      }),
      enabled: false,
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
