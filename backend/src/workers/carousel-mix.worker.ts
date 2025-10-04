import { Worker, Job } from 'bullmq'
import { redis } from '../lib/redis'
import { CarouselMixJob } from '../lib/queue'
import { generateCarousels } from '../apps/carousel-mix/workers/carousel-generator.worker'

const worker = new Worker<CarouselMixJob>(
  'carousel-mix',
  async (job: Job<CarouselMixJob>) => {
    const { generationId, userId, projectId } = job.data

    console.log(`🎨 Processing carousel generation: ${generationId}`)

    try {
      // Call the carousel generator
      await generateCarousels(generationId)

      return { success: true, generationId }
    } catch (error: any) {
      console.error(`❌ Carousel generation failed: ${generationId}`, error.message)
      throw error
    }
  },
  {
    connection: redis ? redis : undefined,
    concurrency: 2, // Process up to 2 carousel jobs at a time (less CPU intensive than video)
  } as any
)

worker.on('completed', (job) => {
  console.log(`✅ Carousel job ${job.id} completed`)
})

worker.on('failed', (job, err) => {
  console.error(`❌ Carousel job ${job?.id} failed:`, err.message)
})

worker.on('error', (err) => {
  console.error('❌ Carousel worker error:', err)
})

worker.on('ready', () => {
  console.log('🔧 Carousel Mix Worker ready and listening for jobs')
})

console.log('🚀 Carousel Mix Worker started')
