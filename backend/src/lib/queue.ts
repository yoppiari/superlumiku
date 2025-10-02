import { Queue } from 'bullmq'
import { redis, isRedisEnabled } from './redis'

export interface VideoMixerJob {
  generationId: string
  userId: string
  projectId: string
  settings: any
  totalVideos: number
}

let videoMixerQueue: Queue<VideoMixerJob> | null = null

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

export { videoMixerQueue }
