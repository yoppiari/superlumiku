# Video Processing Architecture - Phase 2

**Date:** 2025-10-02
**Status:** Planning Phase
**Goal:** Implement actual video generation with FFmpeg, background queue, and worker processes

---

## 🎯 Overview

Phase 1 created the UI/UX and settings management. Phase 2 will implement:
1. **Background Queue System** - BullMQ + Redis for async job processing
2. **FFmpeg Integration** - Actual video mixing and processing
3. **Worker Processes** - Separate workers to handle heavy video processing
4. **Real-time Updates** - WebSocket/polling for status updates
5. **Download System** - Serve completed videos to users

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  - VideoMixer.tsx                                                │
│  - Click "Start Processing" → POST /generate                    │
│  - Poll /generations/:id for status updates                     │
│  - Download completed videos                                     │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend API (Hono + Bun)                      │
│  - POST /generate → Create job → Push to queue                  │
│  - GET /generations/:id → Return status from DB                 │
│  - GET /download/:generationId/:fileIndex → Stream video        │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Redis Queue (BullMQ)                        │
│  - Queue: "video-mixer-queue"                                   │
│  - Jobs: { generationId, userId, projectId, settings }          │
│  - Retry: 3 attempts with exponential backoff                   │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Worker Process (Bun)                          │
│  - Consume jobs from queue                                       │
│  - Load source videos from storage                               │
│  - Process with FFmpeg (mixing, quality, duration)               │
│  - Save output videos                                            │
│  - Update generation status in DB                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Dependencies to Install

```bash
# Queue system
bun add bullmq ioredis

# FFmpeg wrapper
bun add fluent-ffmpeg @types/fluent-ffmpeg

# Progress tracking
bun add @bull-board/api @bull-board/hono  # Optional: Queue dashboard
```

**System Requirements:**
- Redis server (local or cloud)
- FFmpeg installed on system (PATH accessible)

---

## 🔧 Implementation Plan

### Step 1: Redis Setup

**Install Redis (Windows):**
```bash
# Option 1: Docker (Recommended)
docker run -d -p 6379:6379 --name redis redis:alpine

# Option 2: WSL
wsl -d Ubuntu
sudo apt update && sudo apt install redis-server
redis-server
```

**Test Redis Connection:**
```bash
bun add ioredis
```

```typescript
// backend/src/lib/redis.ts
import Redis from 'ioredis'

export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null, // Required for BullMQ
})

redis.on('connect', () => {
  console.log('✅ Redis connected')
})

redis.on('error', (err) => {
  console.error('❌ Redis error:', err)
})
```

---

### Step 2: Queue Service

```typescript
// backend/src/lib/queue.ts
import { Queue, Worker, Job } from 'bullmq'
import { redis } from './redis'

interface VideoMixerJob {
  generationId: string
  userId: string
  projectId: string
  settings: any
  totalVideos: number
}

export const videoMixerQueue = new Queue<VideoMixerJob>('video-mixer', {
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

export async function addVideoMixerJob(data: VideoMixerJob) {
  const job = await videoMixerQueue.add('process-generation', data, {
    jobId: data.generationId, // Use generationId as jobId for easy tracking
  })

  console.log(`📋 Job added: ${job.id}`)
  return job
}
```

---

### Step 3: FFmpeg Service

```typescript
// backend/src/lib/ffmpeg.ts
import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import { promises as fs } from 'fs'

interface VideoInput {
  filePath: string
  duration: number
  order: number
}

interface ProcessingOptions {
  resolution: '480p' | '720p' | '1080p' | '4k'
  frameRate: 24 | 30 | 60
  aspectRatio: '9:16' | '16:9' | '1:1' | '4:5'
  bitrate: 'low' | 'medium' | 'high'
  audioOption: 'keep' | 'mute'
  speedMin: number
  speedMax: number
  enableSpeedVariations: boolean
}

const RESOLUTION_MAP = {
  '480p': { width: 854, height: 480 },
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
  '4k': { width: 3840, height: 2160 },
}

const ASPECT_RATIO_MAP = {
  '9:16': { width: 1080, height: 1920 }, // TikTok/Instagram Reels
  '16:9': { width: 1920, height: 1080 }, // YouTube
  '1:1': { width: 1080, height: 1080 }, // Instagram Square
  '4:5': { width: 1080, height: 1350 }, // Instagram Portrait
}

const BITRATE_MAP = {
  low: '1000k',
  medium: '2500k',
  high: '5000k',
}

export class FFmpegService {
  /**
   * Mix multiple videos into one output
   */
  async mixVideos(
    inputs: VideoInput[],
    outputPath: string,
    options: ProcessingOptions,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Sort by order
      const sortedInputs = [...inputs].sort((a, b) => a.order - b.order)

      // Create concat file for FFmpeg
      const concatFilePath = outputPath.replace('.mp4', '_concat.txt')
      const concatContent = sortedInputs
        .map((input) => `file '${path.resolve(input.filePath)}'`)
        .join('\n')

      // Write concat file
      fs.writeFile(concatFilePath, concatContent)
        .then(() => {
          const command = ffmpeg()

          // Input: concat demuxer
          command.input(concatFilePath).inputOptions([
            '-f concat',
            '-safe 0',
          ])

          // Video filters
          const filters: string[] = []

          // Resolution/Aspect Ratio
          const targetDimensions = ASPECT_RATIO_MAP[options.aspectRatio]
          filters.push(`scale=${targetDimensions.width}:${targetDimensions.height}:force_original_aspect_ratio=decrease`)
          filters.push(`pad=${targetDimensions.width}:${targetDimensions.height}:(ow-iw)/2:(oh-ih)/2`)

          // Speed variation (if enabled)
          if (options.enableSpeedVariations) {
            const randomSpeed = this.getRandomSpeed(options.speedMin, options.speedMax)
            filters.push(`setpts=${1 / randomSpeed}*PTS`)
          }

          // Apply filters
          if (filters.length > 0) {
            command.videoFilters(filters.join(','))
          }

          // Video codec & quality
          command
            .videoCodec('libx264')
            .videoBitrate(BITRATE_MAP[options.bitrate])
            .fps(options.frameRate)

          // Audio
          if (options.audioOption === 'mute') {
            command.noAudio()
          } else {
            command.audioCodec('aac').audioBitrate('128k')
          }

          // Output format
          command.format('mp4').outputOptions([
            '-movflags +faststart', // Enable streaming
            '-preset fast',
          ])

          // Progress tracking
          command.on('progress', (progress) => {
            if (onProgress) {
              onProgress(progress.percent || 0)
            }
          })

          // Error handling
          command.on('error', (err) => {
            fs.unlink(concatFilePath).catch(() => {}) // Cleanup
            reject(err)
          })

          // Success
          command.on('end', async () => {
            await fs.unlink(concatFilePath) // Cleanup concat file
            resolve()
          })

          // Run
          command.save(outputPath)
        })
        .catch(reject)
    })
  }

  /**
   * Get random speed within range
   */
  private getRandomSpeed(min: number, max: number): number {
    return Math.random() * (max - min) + min
  }

  /**
   * Shuffle array (for order mixing)
   */
  shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
}
```

---

### Step 4: Worker Implementation

```typescript
// backend/src/workers/video-mixer.worker.ts
import { Worker, Job } from 'bullmq'
import { redis } from '../lib/redis'
import { FFmpegService } from '../lib/ffmpeg'
import prisma from '../db/client'
import path from 'path'
import { randomBytes } from 'crypto'

interface VideoMixerJob {
  generationId: string
  userId: string
  projectId: string
  settings: any
  totalVideos: number
}

const ffmpegService = new FFmpegService()
const OUTPUT_DIR = process.env.OUTPUT_DIR || './uploads/outputs'

const worker = new Worker<VideoMixerJob>(
  'video-mixer',
  async (job: Job<VideoMixerJob>) => {
    const { generationId, projectId, settings, totalVideos } = job.data

    console.log(`🎬 Processing generation: ${generationId}`)

    try {
      // Update status to processing
      await prisma.videoMixerGeneration.update({
        where: { id: generationId },
        data: { status: 'processing' },
      })

      // Load project videos
      const project = await prisma.videoMixerProject.findUnique({
        where: { id: projectId },
        include: {
          videos: {
            orderBy: { order: 'asc' },
          },
        },
      })

      if (!project || project.videos.length === 0) {
        throw new Error('No videos found in project')
      }

      const outputPaths: string[] = []

      // Generate multiple videos
      for (let i = 0; i < totalVideos; i++) {
        console.log(`  📹 Generating video ${i + 1}/${totalVideos}`)

        // Prepare inputs
        let inputs = project.videos.map((v, index) => ({
          filePath: path.join('./uploads', v.filePath),
          duration: v.duration,
          order: index,
        }))

        // Apply order mixing
        if (settings.enableOrderMixing) {
          inputs = ffmpegService.shuffleArray(inputs)
        }

        // Apply different start
        if (settings.enableDifferentStart && i > 0) {
          // Rotate array for each generation
          inputs = [...inputs.slice(i % inputs.length), ...inputs.slice(0, i % inputs.length)]
        }

        // Generate output filename
        const outputFilename = `${generationId}_${i + 1}_${randomBytes(4).toString('hex')}.mp4`
        const outputPath = path.join(OUTPUT_DIR, outputFilename)

        // Process with FFmpeg
        await ffmpegService.mixVideos(
          inputs,
          outputPath,
          {
            resolution: settings.videoResolution,
            frameRate: settings.frameRate,
            aspectRatio: settings.aspectRatio,
            bitrate: settings.videoBitrate,
            audioOption: settings.audioOption,
            speedMin: settings.speedMin,
            speedMax: settings.speedMax,
            enableSpeedVariations: settings.enableSpeedVariations,
          },
          (progress) => {
            // Update job progress
            job.updateProgress({
              video: i + 1,
              totalVideos,
              percent: progress,
            })
          }
        )

        outputPaths.push(`/outputs/${outputFilename}`)
        console.log(`  ✅ Generated: ${outputFilename}`)
      }

      // Update generation status
      await prisma.videoMixerGeneration.update({
        where: { id: generationId },
        data: {
          status: 'completed',
          outputPaths: JSON.stringify(outputPaths),
          completedAt: new Date(),
        },
      })

      console.log(`✅ Generation completed: ${generationId}`)
      return { success: true, outputPaths }
    } catch (error: any) {
      console.error(`❌ Generation failed: ${generationId}`, error)

      // Update generation status to failed
      await prisma.videoMixerGeneration.update({
        where: { id: generationId },
        data: { status: 'failed' },
      })

      throw error
    }
  },
  {
    connection: redis,
    concurrency: 1, // Process one job at a time (CPU intensive)
  }
)

worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`)
})

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message)
})

worker.on('error', (err) => {
  console.error('❌ Worker error:', err)
})

console.log('🔧 Video Mixer Worker started')
```

---

### Step 5: Update Generate Route

```typescript
// backend/src/apps/video-mixer/routes.ts

// Update the /generate route:
routes.post(
  '/generate',
  authMiddleware,
  async (c, next) => {
    // ... existing credit deduction middleware
  },
  async (c) => {
    try {
      const userId = c.get('userId')
      const body = createGenerationSchema.parse(await c.req.json())

      // Create generation record
      const result = await service.createGeneration(
        body.projectId,
        userId,
        body.totalVideos,
        body.settings
      )

      // Record credit usage
      const deduction = c.get('creditDeduction')
      const { newBalance, creditUsed } = await recordCreditUsage(
        userId,
        deduction.appId,
        deduction.action,
        deduction.amount
      )

      // ✨ NEW: Add job to queue
      await addVideoMixerJob({
        generationId: result.generation.id,
        userId,
        projectId: body.projectId,
        settings: body.settings,
        totalVideos: body.totalVideos,
      })

      return c.json({
        success: true,
        generation: result.generation,
        creditUsed,
        creditBalance: newBalance,
        message: 'Generation started! Check status in Generation History.',
      })
    } catch (error: any) {
      return c.json({ error: error.message }, 400)
    }
  }
)
```

---

### Step 6: Download Route

```typescript
// backend/src/apps/video-mixer/routes.ts

routes.get('/download/:generationId/:fileIndex', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const generationId = c.req.param('generationId')
    const fileIndex = parseInt(c.req.param('fileIndex'))

    // Get generation
    const generation = await prisma.videoMixerGeneration.findUnique({
      where: { id: generationId },
      include: { project: true },
    })

    if (!generation || generation.userId !== userId) {
      return c.json({ error: 'Generation not found or access denied' }, 403)
    }

    if (generation.status !== 'completed' || !generation.outputPaths) {
      return c.json({ error: 'Generation not completed yet' }, 400)
    }

    const outputPaths = JSON.parse(generation.outputPaths)
    if (fileIndex < 0 || fileIndex >= outputPaths.length) {
      return c.json({ error: 'Invalid file index' }, 400)
    }

    const filePath = path.join('./uploads', outputPaths[fileIndex])
    const fileExists = await fs.access(filePath).then(() => true).catch(() => false)

    if (!fileExists) {
      return c.json({ error: 'File not found' }, 404)
    }

    // Stream file
    const fileStream = await fs.readFile(filePath)
    const filename = path.basename(filePath)

    return new Response(fileStream, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})
```

---

### Step 7: Frontend Status Polling

```typescript
// frontend/src/apps/VideoMixer.tsx

// Add polling for in-progress generations
useEffect(() => {
  if (!selectedProject) return

  const inProgressGens = generations.filter(g =>
    g.status === 'pending' || g.status === 'processing'
  )

  if (inProgressGens.length === 0) return

  // Poll every 3 seconds
  const interval = setInterval(() => {
    loadGenerations(selectedProject.id)
  }, 3000)

  return () => clearInterval(interval)
}, [selectedProject, generations])

// Add download handler
const handleDownload = async (generationId: string, fileIndex: number) => {
  try {
    const res = await api.get(
      `/api/apps/video-mixer/download/${generationId}/${fileIndex}`,
      { responseType: 'blob' }
    )

    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = `generated_video_${fileIndex + 1}.mp4`
    link.click()
    window.URL.revokeObjectURL(url)
  } catch (error: any) {
    alert('Download failed: ' + error.message)
  }
}
```

---

## 🚀 Startup Scripts

### package.json
```json
{
  "scripts": {
    "dev": "concurrently \"bun run dev:backend\" \"bun run dev:frontend\" \"bun run dev:worker\"",
    "dev:backend": "cd backend && bun --watch src/index.ts",
    "dev:frontend": "cd frontend && bun run dev",
    "dev:worker": "cd backend && bun --watch src/workers/video-mixer.worker.ts",

    "start": "concurrently \"bun run start:backend\" \"bun run start:worker\"",
    "start:backend": "cd backend && bun src/index.ts",
    "start:worker": "cd backend && bun src/workers/video-mixer.worker.ts"
  }
}
```

---

## 📋 Implementation Checklist

### Backend
- [ ] Install dependencies (bullmq, ioredis, fluent-ffmpeg)
- [ ] Setup Redis connection (`lib/redis.ts`)
- [ ] Create queue service (`lib/queue.ts`)
- [ ] Implement FFmpeg service (`lib/ffmpeg.ts`)
- [ ] Create worker process (`workers/video-mixer.worker.ts`)
- [ ] Update generate route to add jobs
- [ ] Add download route
- [ ] Create outputs directory

### Frontend
- [ ] Add status polling for in-progress generations
- [ ] Implement download handler
- [ ] Add download buttons in Generation History
- [ ] Show progress percentage (if available)
- [ ] Add "processing" animation/spinner

### System
- [ ] Install Redis server (Docker/WSL)
- [ ] Install FFmpeg system-wide
- [ ] Test Redis connection
- [ ] Test FFmpeg installation
- [ ] Update .env with Redis config

### Testing
- [ ] Test job creation
- [ ] Test worker processing
- [ ] Test status updates
- [ ] Test download functionality
- [ ] Test error handling
- [ ] Test concurrent processing

---

## 🔒 Security Considerations

1. **File Access Control**
   - Verify user ownership before allowing download
   - Use signed URLs for time-limited access (future)

2. **Resource Limits**
   - Set worker concurrency to prevent CPU overload
   - Implement timeout for long-running jobs
   - Clean up temporary files

3. **Error Handling**
   - Retry failed jobs with exponential backoff
   - Log errors for debugging
   - Update generation status on failure

---

## 📊 Performance Optimization

1. **Worker Scaling**
   - Start with concurrency: 1
   - Increase based on CPU cores and load
   - Monitor memory usage

2. **Queue Management**
   - Set job retention policies
   - Implement priority queues (future)
   - Monitor queue length

3. **File Storage**
   - Compress outputs when possible
   - Implement cleanup for old files (7 days)
   - Consider cloud storage (S3, Cloudflare R2)

---

## 🐛 Debugging Tips

```bash
# Check Redis
redis-cli ping  # Should return PONG

# Check FFmpeg
ffmpeg -version

# Monitor queue
# Install Bull Board (optional)
# Access at http://localhost:3000/admin/queues

# Worker logs
bun run dev:worker  # Watch logs in real-time

# Check job status in Redis
redis-cli
> KEYS bull:video-mixer:*
> HGETALL bull:video-mixer:generationId
```

---

**Next Steps:** Implement each section sequentially, testing as we go.
