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

export interface VideoGeneratorJob {
  generationId: string
  creditUsed: number
}

let videoMixerQueue: Queue<VideoMixerJob> | null = null
let carouselMixQueue: Queue<CarouselMixJob> | null = null
let loopingFlowQueue: Queue<LoopingFlowJob> | null = null
let videoGenQueue: Queue<VideoGeneratorJob> | null = null

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

  videoGenQueue = new Queue<VideoGeneratorJob>('video-generator', {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 10000, // 10s, 50s, 250s (longer delay for API rate limits)
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

export async function addVideoGenJob(data: VideoGeneratorJob) {
  if (!videoGenQueue) {
    console.warn('⚠️  Redis not configured - Job will not be processed')
    console.warn('   Generation will remain in "pending" status')
    console.warn('   See TODO_REDIS_SETUP.md for setup instructions')
    return null
  }

  const job = await videoGenQueue.add('process-generation', data, {
    jobId: data.generationId,
  })

  console.log(`📋 Video Generator job added to queue: ${job.id}`)
  return job
}

export async function getVideoGenJobStatus(generationId: string) {
  if (!videoGenQueue) return null

  const job = await videoGenQueue.getJob(generationId)
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

export { videoMixerQueue, carouselMixQueue, loopingFlowQueue, videoGenQueue }
