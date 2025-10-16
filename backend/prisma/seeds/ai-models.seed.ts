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
    // POSE GENERATOR MODELS (ControlNet + Background)
    // ==========================================
    {
      appId: 'pose-generator',
      modelId: 'flux-controlnet-standard',
      modelKey: 'pose-generator:flux-controlnet-standard',
      name: 'FLUX ControlNet Standard',
      description: 'Standard quality pose-to-avatar generation using FLUX.1-dev with ControlNet for pose guidance',
      provider: 'huggingface',
      tier: 'basic',
      creditCost: 30,
      creditPerPixel: null,
      quotaCost: 2,
      capabilities: JSON.stringify({
        modelId: 'black-forest-labs/FLUX.1-dev',
        controlnetModel: 'InstantX/FLUX.1-dev-Controlnet-Union',
        controlnetType: 'openpose',
        width: 768,
        height: 768,
        numInferenceSteps: 28,
        guidanceScale: 3.5,
        controlnetConditioningScale: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 'standard',
        processingTime: '45-60s',
        poseGuidance: true,
        features: ['pose-to-avatar', 'controlnet', 'basic-quality', 'openpose']
      }),
      enabled: true,
      beta: false
    },
    {
      appId: 'pose-generator',
      modelId: 'flux-controlnet-pro',
      modelKey: 'pose-generator:flux-controlnet-pro',
      name: 'FLUX ControlNet Pro',
      description: 'Premium high-resolution pose-to-avatar with FLUX.1-dev ControlNet for professional results',
      provider: 'huggingface',
      tier: 'pro',
      creditCost: 40,
      creditPerPixel: null,
      quotaCost: 3,
      capabilities: JSON.stringify({
        modelId: 'black-forest-labs/FLUX.1-dev',
        controlnetModel: 'InstantX/FLUX.1-dev-Controlnet-Union',
        controlnetType: 'openpose',
        width: 1024,
        height: 1024,
        numInferenceSteps: 35,
        guidanceScale: 3.5,
        controlnetConditioningScale: 0.85,
        maxWidth: 1536,
        maxHeight: 1536,
        quality: 'premium',
        processingTime: '60-90s',
        poseGuidance: true,
        highResolution: true,
        features: ['pose-to-avatar', 'controlnet', 'pro-quality', 'high-res', 'openpose']
      }),
      enabled: true,
      beta: false
    },
    {
      appId: 'pose-generator',
      modelId: 'background-changer-sam',
      modelKey: 'pose-generator:background-changer-sam',
      name: 'Background Changer (SAM)',
      description: 'AI-powered background replacement using Segment Anything Model for precise subject extraction',
      provider: 'meta',
      tier: 'basic',
      creditCost: 10,
      creditPerPixel: null,
      quotaCost: 1,
      capabilities: JSON.stringify({
        modelId: 'facebook/sam-vit-huge',
        segmentationType: 'automatic',
        width: 1024,
        height: 1024,
        maxWidth: 2048,
        maxHeight: 2048,
        quality: 'high',
        processingTime: '15-30s',
        backgroundRemoval: true,
        preciseSegmentation: true,
        features: ['background-removal', 'segmentation', 'sam-model', 'precise-cutout']
      }),
      enabled: true,
      beta: false
    },

    // ==========================================
    // AVATAR CREATOR MODELS (FLUX.1-dev + Realism LoRA)
    // ==========================================
    {
      appId: 'avatar-creator',
      modelId: 'flux-dev-base',
      modelKey: 'avatar-creator:flux-dev-base',
      name: 'FLUX.1-dev Base',
      description: 'High-quality text-to-image avatar generation with FLUX.1-dev (base model without LoRA)',
      provider: 'huggingface',
      tier: 'free',
      creditCost: 8,
      creditPerPixel: null,
      quotaCost: 1,
      capabilities: JSON.stringify({
        modelId: 'black-forest-labs/FLUX.1-dev',
        loraModel: null,
        loraScale: 0,
        useLoRA: false,
        width: 512,
        height: 512,
        numInferenceSteps: 28,
        guidanceScale: 3.5,
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 'standard',
        processingTime: '30-45s',
        photoRealistic: true,
        features: ['text-to-image', 'portrait', 'professional']
      }),
      enabled: true,
      beta: false
    },
    {
      appId: 'avatar-creator',
      modelId: 'flux-dev-realism',
      modelKey: 'avatar-creator:flux-dev-realism',
      name: 'FLUX.1-dev + Realism LoRA',
      description: 'Ultra-realistic avatar generation with FLUX.1-dev enhanced by Realism LoRA for photorealistic portraits',
      provider: 'huggingface',
      tier: 'basic',
      creditCost: 12,
      creditPerPixel: null,
      quotaCost: 2,
      capabilities: JSON.stringify({
        modelId: 'black-forest-labs/FLUX.1-dev',
        loraModel: 'XLabs-AI/flux-RealismLora',
        loraScale: 0.9,
        useLoRA: true,
        width: 768,
        height: 768,
        numInferenceSteps: 30,
        guidanceScale: 3.5,
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 'high',
        processingTime: '45-60s',
        photoRealistic: true,
        ultraRealistic: true,
        features: ['photorealistic', 'ultra-detail', 'professional-grade', 'studio-quality']
      }),
      enabled: true,
      beta: false
    },
    {
      appId: 'avatar-creator',
      modelId: 'flux-dev-hd-realism',
      modelKey: 'avatar-creator:flux-dev-hd-realism',
      name: 'FLUX.1-dev HD + Realism LoRA',
      description: 'Premium 1024x1024 photorealistic avatars with FLUX.1-dev + Realism LoRA at maximum quality',
      provider: 'huggingface',
      tier: 'pro',
      creditCost: 15,
      creditPerPixel: null,
      quotaCost: 3,
      capabilities: JSON.stringify({
        modelId: 'black-forest-labs/FLUX.1-dev',
        loraModel: 'XLabs-AI/flux-RealismLora',
        loraScale: 0.9,
        useLoRA: true,
        width: 1024,
        height: 1024,
        numInferenceSteps: 35,
        guidanceScale: 3.5,
        maxWidth: 1536,
        maxHeight: 1536,
        quality: 'ultra',
        processingTime: '60-90s',
        photoRealistic: true,
        ultraRealistic: true,
        highResolution: true,
        features: ['ultra-hd', 'maximum-detail', 'professional-grade', 'studio-quality', 'premium']
      }),
      enabled: true,
      beta: false
    },
    {
      appId: 'avatar-creator',
      modelId: 'flux-schnell-fast',
      modelKey: 'avatar-creator:flux-schnell-fast',
      name: 'FLUX.1-schnell Fast',
      description: 'Rapid avatar generation with FLUX.1-schnell distilled model (5-15 seconds, good quality)',
      provider: 'huggingface',
      tier: 'basic',
      creditCost: 6,
      creditPerPixel: null,
      quotaCost: 1,
      capabilities: JSON.stringify({
        modelId: 'black-forest-labs/FLUX.1-schnell',
        loraModel: null,
        loraScale: 0,
        useLoRA: false,
        width: 512,
        height: 512,
        numInferenceSteps: 4,
        guidanceScale: 0,
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 'fast',
        processingTime: '5-15s',
        photoRealistic: true,
        fastMode: true,
        features: ['rapid-generation', 'good-quality', 'distilled-model']
      }),
      enabled: true,
      beta: false
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
