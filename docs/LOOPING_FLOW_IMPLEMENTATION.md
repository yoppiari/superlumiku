# Looping Flow - Implementation Documentation

**Created:** 2025-10-04
**Status:** Implementation Guide
**App ID:** `looping-flow`

---

## Overview

**Looping Flow** adalah aplikasi untuk mengubah video pendek menjadi video berdurasi panjang dengan seamless looping (pengulangan yang tidak terasa).

### Spesifikasi
- **Nama:** Looping Flow
- **Icon:** `film` (dari Lucide)
- **Warna:** Blue (`bg-blue-50 text-blue-700`)
- **Fungsi:** Melooping video pendek menjadi video panjang dengan seamless transition
- **Credit System:** 2 credits per 30 detik durasi output

### User Flow
1. User membuat project/folder baru
2. User upload video pendek ke project
3. User menentukan total durasi yang diinginkan (dalam detik)
4. Sistem menghitung credit: `Math.ceil(targetDuration / 30) * 2`
5. User klik generate
6. Sistem memproses looping seamless
7. User download hasil

---

## Database Schema

### Models (Prisma)

```prisma
// ========================================
// Looping Flow App Models
// ========================================

model LoopingFlowProject {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  videos      LoopingFlowVideo[]
  generations LoopingFlowGeneration[]

  @@index([userId])
  @@map("looping_flow_projects")
}

model LoopingFlowVideo {
  id          String   @id @default(cuid())
  projectId   String
  fileName    String
  filePath    String   // Path to uploaded video file
  fileSize    Int      // File size in bytes
  duration    Float    // Duration in seconds
  mimeType    String
  createdAt   DateTime @default(now())

  project     LoopingFlowProject @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@map("looping_flow_videos")
}

model LoopingFlowGeneration {
  id              String   @id @default(cuid())
  projectId       String
  userId          String
  videoId         String   // Reference to source video
  targetDuration  Int      // Target duration in seconds
  creditUsed      Int      // Total credits used
  status          String   @default("pending") // pending, processing, completed, failed
  outputPath      String?  // Path to generated looped video
  errorMessage    String?
  createdAt       DateTime @default(now())
  completedAt     DateTime?

  project         LoopingFlowProject @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@index([userId])
  @@index([status])
  @@map("looping_flow_generations")
}
```

### Migration Command
```bash
bun prisma migrate dev --name add-looping-flow-app
```

---

## Backend Implementation

### File Structure
```
backend/src/apps/looping-flow/
├── plugin.config.ts          # Plugin configuration
├── routes.ts                 # API routes
├── services/
│   └── looping-flow.service.ts   # Business logic
└── repositories/
    └── looping-flow.repository.ts # Database operations
```

### 1. Plugin Config (`plugin.config.ts`)

```typescript
import { PluginConfig } from '../../plugins/types'

export const loopingFlowConfig: PluginConfig = {
  appId: 'looping-flow',
  name: 'Looping Flow',
  description: 'Loop short videos into longer seamless videos',
  icon: 'film',
  version: '1.0.0',
  routePrefix: '/api/apps/looping-flow',
  credits: {
    createProject: 0,      // Free
    uploadVideo: 0,        // Free
    perThirtySeconds: 2,   // 2 credits per 30 seconds of output
  },
  access: {
    requiresAuth: true,
    requiresSubscription: false,
    minSubscriptionTier: null,
    allowedRoles: ['user', 'admin'],
  },
  features: {
    enabled: true,
    beta: false,
    comingSoon: false,
  },
  dashboard: {
    order: 7,
    color: 'blue',
    stats: {
      enabled: true,
      endpoint: '/api/apps/looping-flow/stats',
    },
  },
}

export default loopingFlowConfig
```

### 2. Routes (`routes.ts`)

```typescript
import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth.middleware'
import { AuthVariables } from '../../types/hono'
import { deductCredits, recordCreditUsage } from '../../core/middleware/credit.middleware'
import { LoopingFlowService } from './services/looping-flow.service'
import { loopingFlowConfig } from './plugin.config'
import { saveFile, checkStorageQuota, updateUserStorage, deleteFile } from '../../lib/storage'
import { getVideoDuration } from '../../lib/video-utils'
import { z } from 'zod'

const routes = new Hono<{ Variables: AuthVariables }>()
const service = new LoopingFlowService()

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})

const estimateSchema = z.object({
  targetDuration: z.number().min(1),
})

const generateSchema = z.object({
  projectId: z.string(),
  videoId: z.string(),
  targetDuration: z.number().min(1),
})

// ===== Projects =====
routes.get('/projects', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projects = await service.getProjects(userId)
    return c.json({ success: true, projects })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.post('/projects', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const body = createProjectSchema.parse(await c.req.json())
    const project = await service.createProject(userId, body.name, body.description)
    return c.json({ success: true, project })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.get('/projects/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('id')
    const project = await service.getProject(projectId, userId)
    return c.json({ success: true, project })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.delete('/projects/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('id')
    await service.deleteProject(projectId, userId)
    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// ===== Videos =====
routes.post('/videos/upload', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const formData = await c.req.formData()

    const projectId = formData.get('projectId') as string
    const file = formData.get('file') as File

    if (!file) {
      return c.json({ error: 'No file provided' }, 400)
    }

    // Check storage quota
    const quotaCheck = await checkStorageQuota(userId, file.size)
    if (!quotaCheck.allowed) {
      return c.json({
        error: 'Storage quota exceeded',
        used: quotaCheck.used,
        quota: quotaCheck.quota,
        fileSize: file.size,
        available: quotaCheck.available,
      }, 413)
    }

    // Save file
    const { filePath, fileName } = await saveFile(file, 'videos')
    const fullPath = `./uploads${filePath}`
    const duration = await getVideoDuration(fullPath)

    // Create video record
    const video = await service.createVideo({
      projectId,
      userId,
      fileName,
      filePath,
      fileSize: file.size,
      duration,
      mimeType: file.type,
    })

    // Update storage
    await updateUserStorage(userId, file.size)

    return c.json({ success: true, video, storageUsed: quotaCheck.used + file.size })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.delete('/videos/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const videoId = c.req.param('id')

    const video = await service.getVideoById(videoId, userId)
    await deleteFile(video.filePath)
    await service.deleteVideo(videoId, userId)
    await updateUserStorage(userId, -video.fileSize)

    return c.json({ success: true, freedSpace: video.fileSize })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

// ===== Generation =====
routes.post('/estimate', authMiddleware, async (c) => {
  try {
    const body = estimateSchema.parse(await c.req.json())
    const creditCost = service.calculateCreditCost(body.targetDuration)
    return c.json({ success: true, creditCost })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.post(
  '/generate',
  authMiddleware,
  async (c, next) => {
    try {
      const body = generateSchema.parse(await c.req.json())
      const creditCost = service.calculateCreditCost(body.targetDuration)
      return deductCredits(creditCost, 'generate_loop', loopingFlowConfig.appId)(c, next)
    } catch (error: any) {
      return c.json({ error: error.message }, 400)
    }
  },
  async (c) => {
    try {
      const userId = c.get('userId')
      const body = generateSchema.parse(await c.req.json())

      const generation = await service.createGeneration(
        body.projectId,
        userId,
        body.videoId,
        body.targetDuration
      )

      const deduction = c.get('creditDeduction')
      const { newBalance, creditUsed } = await recordCreditUsage(
        userId,
        deduction?.appId || 'looping-flow',
        deduction?.action || 'generate',
        deduction?.amount || 0
      )

      return c.json({
        success: true,
        generation,
        creditUsed,
        creditBalance: newBalance,
      })
    } catch (error: any) {
      return c.json({ error: error.message }, 400)
    }
  }
)

routes.get('/projects/:projectId/generations', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('projectId')
    const generations = await service.getGenerations(projectId, userId)
    return c.json({ success: true, generations })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.get('/download/:generationId', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const generationId = c.req.param('generationId')

    const generation = await service.getGenerationById(generationId, userId)

    if (generation.status !== 'completed' || !generation.outputPath) {
      return c.json({ error: 'Generation not completed yet' }, 400)
    }

    const filePath = `./uploads${generation.outputPath}`
    const { promises: fs } = await import('fs')
    const path = await import('path')

    const fileExists = await fs.access(filePath).then(() => true).catch(() => false)
    if (!fileExists) {
      return c.json({ error: 'File not found' }, 404)
    }

    const fileBuffer = await fs.readFile(filePath)
    const filename = path.basename(filePath)

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

routes.get('/stats', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const stats = await service.getStats(userId)
    return c.json({ success: true, stats })
  } catch (error: any) {
    return c.json({ error: error.message }, 400)
  }
})

export default routes
```

### 3. Service (`services/looping-flow.service.ts`)

```typescript
import { LoopingFlowRepository } from '../repositories/looping-flow.repository'

export class LoopingFlowService {
  private repository = new LoopingFlowRepository()

  // Credit calculation: 2 credits per 30 seconds
  calculateCreditCost(targetDuration: number): number {
    return Math.ceil(targetDuration / 30) * 2
  }

  async getProjects(userId: string) {
    return this.repository.getProjects(userId)
  }

  async createProject(userId: string, name: string, description?: string) {
    return this.repository.createProject(userId, name, description)
  }

  async getProject(projectId: string, userId: string) {
    return this.repository.getProject(projectId, userId)
  }

  async deleteProject(projectId: string, userId: string) {
    return this.repository.deleteProject(projectId, userId)
  }

  async createVideo(data: any) {
    return this.repository.createVideo(data)
  }

  async getVideoById(videoId: string, userId: string) {
    return this.repository.getVideoById(videoId, userId)
  }

  async deleteVideo(videoId: string, userId: string) {
    return this.repository.deleteVideo(videoId, userId)
  }

  async createGeneration(
    projectId: string,
    userId: string,
    videoId: string,
    targetDuration: number
  ) {
    const creditUsed = this.calculateCreditCost(targetDuration)
    return this.repository.createGeneration(projectId, userId, videoId, targetDuration, creditUsed)
  }

  async getGenerations(projectId: string, userId: string) {
    return this.repository.getGenerations(projectId, userId)
  }

  async getGenerationById(generationId: string, userId: string) {
    return this.repository.getGenerationById(generationId, userId)
  }

  async getStats(userId: string) {
    return this.repository.getStats(userId)
  }
}
```

### 4. Repository (`repositories/looping-flow.repository.ts`)

```typescript
import { prisma } from '../../../db/prisma'

export class LoopingFlowRepository {
  async getProjects(userId: string) {
    return prisma.loopingFlowProject.findMany({
      where: { userId },
      include: {
        videos: true,
        generations: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { updatedAt: 'desc' },
    })
  }

  async createProject(userId: string, name: string, description?: string) {
    return prisma.loopingFlowProject.create({
      data: { userId, name, description },
    })
  }

  async getProject(projectId: string, userId: string) {
    const project = await prisma.loopingFlowProject.findFirst({
      where: { id: projectId, userId },
      include: {
        videos: true,
        generations: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!project) throw new Error('Project not found')
    return project
  }

  async deleteProject(projectId: string, userId: string) {
    const project = await prisma.loopingFlowProject.findFirst({
      where: { id: projectId, userId },
    })
    if (!project) throw new Error('Project not found')
    return prisma.loopingFlowProject.delete({ where: { id: projectId } })
  }

  async createVideo(data: any) {
    return prisma.loopingFlowVideo.create({ data })
  }

  async getVideoById(videoId: string, userId: string) {
    const video = await prisma.loopingFlowVideo.findFirst({
      where: {
        id: videoId,
        project: { userId },
      },
    })
    if (!video) throw new Error('Video not found')
    return video
  }

  async deleteVideo(videoId: string, userId: string) {
    const video = await this.getVideoById(videoId, userId)
    return prisma.loopingFlowVideo.delete({ where: { id: video.id } })
  }

  async createGeneration(
    projectId: string,
    userId: string,
    videoId: string,
    targetDuration: number,
    creditUsed: number
  ) {
    return prisma.loopingFlowGeneration.create({
      data: {
        projectId,
        userId,
        videoId,
        targetDuration,
        creditUsed,
        status: 'pending',
      },
    })
  }

  async getGenerations(projectId: string, userId: string) {
    return prisma.loopingFlowGeneration.findMany({
      where: { projectId, userId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getGenerationById(generationId: string, userId: string) {
    const generation = await prisma.loopingFlowGeneration.findFirst({
      where: { id: generationId, userId },
    })
    if (!generation) throw new Error('Generation not found')
    return generation
  }

  async getStats(userId: string) {
    const totalProjects = await prisma.loopingFlowProject.count({ where: { userId } })
    const totalGenerations = await prisma.loopingFlowGeneration.count({ where: { userId } })
    const completedGenerations = await prisma.loopingFlowGeneration.count({
      where: { userId, status: 'completed' },
    })

    return {
      totalProjects,
      totalGenerations,
      completedGenerations,
    }
  }
}
```

---

## Frontend Implementation

### File: `frontend/src/apps/LoopingFlow.tsx`

Mengikuti UI Standards dengan:
- Sticky header (back button, icon, title, credits, profile)
- Project list view dan project detail view
- Upload video, set duration, generate
- Generation history dengan download

---

## Plugin Registration

### Update `backend/src/plugins/loader.ts`

```typescript
import loopingFlowConfig from '../apps/looping-flow/plugin.config'
import loopingFlowRoutes from '../apps/looping-flow/routes'

export function loadPlugins() {
  pluginRegistry.register(videoMixerConfig, videoMixerRoutes)
  pluginRegistry.register(carouselMixConfig, carouselMixRoutes)
  pluginRegistry.register(loopingFlowConfig, loopingFlowRoutes) // NEW

  // ... logging
}
```

### Update `frontend/src/App.tsx`

```tsx
import LoopingFlow from './apps/LoopingFlow'

// Add routes:
<Route path="/apps/looping-flow" element={<LoopingFlow />} />
<Route path="/apps/looping-flow/:projectId" element={<LoopingFlow />} />
```

---

## Testing Checklist

- [ ] Create project
- [ ] Upload video
- [ ] Estimate credit cost
- [ ] Generate loop (credit deduction works)
- [ ] Check generation status
- [ ] Download result
- [ ] Delete video (storage quota updates)
- [ ] Delete project
- [ ] View stats

---

## Notes

- **Seamless Looping**: Implementasi FFmpeg untuk crossfade transition antara end dan start video
- **Credit System**: Otomatis menghitung `Math.ceil(targetDuration / 30) * 2`
- **Storage Management**: Video dihapus saat project dihapus (CASCADE)
- **Queue System**: Bisa ditambahkan worker untuk processing async (optional)

---

**End of Documentation**
