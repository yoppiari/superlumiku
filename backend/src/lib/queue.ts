import { Queue } from 'bullmq'
import { redis, isRedisEnabled } from './redis'

export interface VideoMixerJob {
  generationId: string
  userId: string
  projectId: string
  settings: any
  totalVideos: number
}

export interface CarouselMixJob {
  generationId: string
  userId: string
  projectId: string
}

export interface LoopingFlowJob {
  generationId: string
  userId: string
  projectId: string
  videoId: string
  videoPath: string
  targetDuration: number
  loopStyle: string
  crossfadeDuration?: number
  videoCrossfade?: boolean
  audioCrossfade?: boolean
  masterVolume?: number
  audioFadeIn?: number
  audioFadeOut?: number
  muteOriginal?: boolean
  audioLayers?: Array<{
    id: string
    filePath: string
    volume: number
    muted: boolean
    fadeIn: number
    fadeOut: number
  }>
}

export interface AvatarGenerationJob {
  generationId: string
  userId: string
  projectId: string
  prompt: string
  options: {
    width?: number
    height?: number
    seed?: number
  }
  metadata: {
    name: string
    sourceType: string
    persona?: {
      name?: string
      age?: number
      personality?: string[]
      background?: string
    }
    attributes?: {
      gender?: string
      ageRange?: string
      ethnicity?: string
      bodyType?: string
      hairStyle?: string
      hairColor?: string
      eyeColor?: string
      skinTone?: string
      style?: string
    }
    creditCost?: number
    aiModel?: {
      modelKey: string
      modelId: string
      loraModel?: string | null
      loraScale?: number
      useLoRA?: boolean
      numInferenceSteps?: number
      guidanceScale?: number
    }
  }
}

export interface BackgroundRemovalBatchJob {
  batchId: string
  userId: string
  tier: string
  items: Array<{
    id: string
    itemIndex: number
    originalUrl: string
  }>
}

let videoMixerQueue: Queue<VideoMixerJob> | null = null
let carouselMixQueue: Queue<CarouselMixJob> | null = null
let loopingFlowQueue: Queue<LoopingFlowJob> | null = null
let avatarGenerationQueue: Queue<AvatarGenerationJob> | null = null
let backgroundRemovalQueue: Queue<BackgroundRemovalBatchJob> | null = null

if (isRedisEnabled() && redis) {
  videoMixerQueue = new Queue<VideoMixerJob>('video-mixer', {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000, // 5s, 25s, 125s
      },
      removeOnComplete: {
        age: 86400, // Keep completed jobs for 24 hours
        count: 1000,
      },
      removeOnFail: {
        age: 604800, // Keep failed jobs for 7 days
      },
    },
  })

  carouselMixQueue = new Queue<CarouselMixJob>('carousel-mix', {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: {
        age: 86400,
        count: 1000,
      },
      removeOnFail: {
        age: 604800,
      },
    },
  })

  loopingFlowQueue = new Queue<LoopingFlowJob>('looping-flow', {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: {
        age: 86400, // Keep completed jobs for 24 hours
        count: 1000,
      },
      removeOnFail: {
        age: 604800, // Keep failed jobs for 7 days
      },
    },
  })

  avatarGenerationQueue = new Queue<AvatarGenerationJob>('avatar-generation', {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 10000, // 10s, 100s, 1000s (FLUX can take time)
      },
      removeOnComplete: {
        age: 86400, // Keep completed jobs for 24 hours
        count: 1000,
      },
      removeOnFail: {
        age: 604800, // Keep failed jobs for 7 days
      },
    },
  })

  backgroundRemovalQueue = new Queue<BackgroundRemovalBatchJob>('background-remover:batch', {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000, // 5s, 25s, 125s
      },
      removeOnComplete: {
        age: 86400, // Keep completed jobs for 24 hours
        count: 1000,
      },
      removeOnFail: {
        age: 604800, // Keep failed jobs for 7 days
      },
    },
  })
}

export async function addVideoMixerJob(data: VideoMixerJob) {
  if (!videoMixerQueue) {
    console.warn('⚠️  Redis not configured - Job will not be processed')
    console.warn('   Generation will remain in "pending" status')
    console.warn('   See TODO_REDIS_SETUP.md for setup instructions')
    return null
  }

  const job = await videoMixerQueue.add('process-generation', data, {
    jobId: data.generationId, // Use generationId as jobId for easy tracking
  })

  console.log(`📋 Job added to queue: ${job.id}`)
  return job
}

// Get job status
export async function getJobStatus(generationId: string) {
  if (!videoMixerQueue) return null

  const job = await videoMixerQueue.getJob(generationId)
  if (!job) return null

  const state = await job.getState()
  const progress = job.progress

  return {
    id: job.id,
    state,
    progress,
    data: job.data,
  }
}

export async function addCarouselMixJob(data: CarouselMixJob) {
  if (!carouselMixQueue) {
    console.warn('⚠️  Redis not configured - Job will not be processed')
    console.warn('   Generation will remain in "pending" status')
    console.warn('   See TODO_REDIS_SETUP.md for setup instructions')
    return null
  }

  const job = await carouselMixQueue.add('process-generation', data, {
    jobId: data.generationId,
  })

  console.log(`📋 Carousel job added to queue: ${job.id}`)
  return job
}

// Get carousel job status
export async function getCarouselJobStatus(generationId: string) {
  if (!carouselMixQueue) return null

  const job = await carouselMixQueue.getJob(generationId)
  if (!job) return null

  const state = await job.getState()
  const progress = job.progress

  return {
    id: job.id,
    state,
    progress,
    data: job.data,
  }
}

export async function addLoopingFlowJob(data: LoopingFlowJob) {
  if (!loopingFlowQueue) {
    console.warn('⚠️  Redis not configured - Job will not be processed')
    console.warn('   Generation will remain in "pending" status')
    console.warn('   See TODO_REDIS_SETUP.md for setup instructions')
    return null
  }

  const job = await loopingFlowQueue.add('process-generation', data, {
    jobId: data.generationId,
  })

  console.log(`📋 Looping Flow job added to queue: ${job.id}`)
  return job
}

export async function getLoopingFlowJobStatus(generationId: string) {
  if (!loopingFlowQueue) return null

  const job = await loopingFlowQueue.getJob(generationId)
  if (!job) return null

  const state = await job.getState()
  const progress = job.progress

  return {
    id: job.id,
    state,
    progress,
    data: job.data,
  }
}

export async function addAvatarGenerationJob(data: AvatarGenerationJob) {
  if (!avatarGenerationQueue) {
    console.warn('⚠️  Redis not configured - Job will not be processed')
    console.warn('   Generation will remain in "pending" status')
    console.warn('   See TODO_REDIS_SETUP.md for setup instructions')
    return null
  }

  const job = await avatarGenerationQueue.add('process-generation', data, {
    jobId: data.generationId,
  })

  console.log(`📋 Avatar generation job added to queue: ${job.id}`)
  return job
}

export async function getAvatarGenerationJobStatus(generationId: string) {
  if (!avatarGenerationQueue) return null

  const job = await avatarGenerationQueue.getJob(generationId)
  if (!job) return null

  const state = await job.getState()
  const progress = job.progress

  return {
    id: job.id,
    state,
    progress,
    data: job.data,
  }
}

export async function addBackgroundRemovalBatchJob(data: BackgroundRemovalBatchJob) {
  if (!backgroundRemovalQueue) {
    console.warn('⚠️  Redis not configured - Job will not be processed')
    console.warn('   Batch will remain in "pending" status')
    console.warn('   See TODO_REDIS_SETUP.md for setup instructions')
    return null
  }

  const job = await backgroundRemovalQueue.add('process-batch', data, {
    jobId: data.batchId,
  })

  console.log(`📋 Background removal batch job added to queue: ${job.id}`)
  return job
}

export async function getBackgroundRemovalBatchJobStatus(batchId: string) {
  if (!backgroundRemovalQueue) return null

  const job = await backgroundRemovalQueue.getJob(batchId)
  if (!job) return null

  const state = await job.getState()
  const progress = job.progress

  return {
    id: job.id,
    state,
    progress,
    data: job.data,
  }
}

export { videoMixerQueue, carouselMixQueue, loopingFlowQueue, avatarGenerationQueue, backgroundRemovalQueue }
