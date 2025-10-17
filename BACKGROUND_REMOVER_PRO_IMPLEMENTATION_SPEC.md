# Background Remover Pro - Complete Implementation Specification

## Executive Summary

Background Remover Pro is an enterprise-grade AI-powered background removal service for the Lumiku Platform featuring:

- **4 Quality Tiers**: Basic (3 credits) → Standard (8 credits) → Professional (15 credits) → Industry (25 credits)
- **Batch Processing**: 2-500 images with volume discounts (5-20%)
- **Hybrid Pricing Model**: Subscription unlimited (Rp 99K-299K/month) + Credit-based fallback
- **Queue System**: BullMQ + Redis for reliable async processing
- **Cross-App Integration**: Avatar Creator, Pose Generator, Image Upscaler Pro, Carousel Mix
- **92-95% Profit Margins**: Optimized pricing with AI API cost efficiency

**Technology Stack**: Hono.js (backend), PostgreSQL + Prisma (database), BullMQ + Redis (queue), HuggingFace + Segmind (AI providers), Sharp (image processing), React + Zustand (frontend)

---

## 1. Database Schema (Prisma)

### 1.1 Main Tables

Add the following models to `backend/prisma/schema.prisma`:

```prisma
// ========================================
// Background Remover Pro App Models
// ========================================

// Single removal job (both single and batch items)
model BackgroundRemovalJob {
  id        String   @id @default(cuid())
  userId    String
  batchId   String?  // NULL for single removal, set for batch items

  // Input
  originalFileName String
  originalFilePath String
  originalFileSize Int     // bytes

  // Output
  processedFilePath String?
  processedFileSize Int?    // bytes

  // Processing
  tier              String  // basic, standard, professional, industry
  status            String  @default("pending") // pending, processing, completed, failed
  errorMessage      String? @db.Text

  // AI Provider tracking
  aiProvider String? // huggingface, segmind
  modelName  String? // rmbg-1.4, rmbg-2.0, birefnet-general, birefnet-portrait

  // Metrics
  processingTimeMs Int?

  // Pricing
  creditUsed  Int     // Credits charged
  pricingType String  // credits, subscription

  // Image metadata
  width  Int?
  height Int?
  format String? // jpg, png, webp

  createdAt   DateTime  @default(now())
  completedAt DateTime?

  // Relations
  batch BackgroundRemovalBatch? @relation(fields: [batchId], references: [id], onDelete: Cascade)

  @@index([userId])                          // Find user's jobs
  @@index([status])                          // Filter by status
  @@index([batchId])                         // FK index
  @@index([userId, createdAt(sort: Desc)])   // Composite: user's recent jobs
  @@index([status, createdAt])               // Composite: process pending jobs in order
  @@index([userId, status])                  // Composite: user's active jobs
  @@map("background_removal_jobs")
}

// Batch processing container
model BackgroundRemovalBatch {
  id     String @id @default(cuid())
  userId String

  // Batch info
  totalImages       Int
  processedImages   Int     @default(0)
  failedImages      Int     @default(0)
  tier              String  // Quality tier for entire batch

  // Status tracking
  status           String  @default("pending") // pending, processing, completed, failed
  progressPercent  Int     @default(0)
  errorMessage     String? @db.Text

  // Pricing
  baseCreditsPerImage            Int
  baseTotal                      Int
  discountPercentage             Int
  discountAmount                 Int
  finalTotal                     Int
  creditsPerImageAfterDiscount   Float

  // Output
  zipFilePath        String?
  zipFileSize        Int?    // bytes

  // Timing
  estimatedCompletionMinutes Int?
  createdAt                  DateTime  @default(now())
  startedAt                  DateTime?
  completedAt                DateTime?

  // Queue
  queueJobId String? // BullMQ job ID

  // Relations
  items BackgroundRemovalJob[]

  @@index([userId])                          // Find user's batches
  @@index([status])                          // Filter by status
  @@index([userId, createdAt(sort: Desc)])   // Composite: user's recent batches
  @@index([status, createdAt])               // Composite: process pending batches
  @@index([queueJobId])                      // Find batch by queue job
  @@map("background_removal_batches")
}

// Subscription plans for Background Remover Pro
model BackgroundRemoverSubscription {
  id     String @id @default(cuid())
  userId String @unique

  // Plan details
  plan                      String  // starter, pro
  status                    String  @default("active") // active, cancelled, expired, grace_period

  // Pricing
  monthlyPrice Int // IDR
  currency     String @default("IDR")

  // Quotas
  dailyQuota                Int     // 50 for starter, 200 for pro
  professionalDailyQuota    Int?    // 50 for pro, NULL for starter
  allowedTiers              String[] // ["basic", "standard"] for starter, ["basic", "standard", "professional"] for pro

  // Billing
  subscribedAt     DateTime
  currentPeriodEnd DateTime
  nextBillingDate  DateTime?
  lastPaymentId    String?

  // Auto-renewal
  autoRenew       Boolean   @default(true)
  cancelledAt     DateTime?
  cancelReason    String?   @db.Text
  expiresAt       DateTime  // When subscription actually ends

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  usageHistory BackgroundRemoverSubscriptionUsage[]

  @@index([userId])
  @@index([status])
  @@index([status, expiresAt])              // Find active/expiring subscriptions
  @@index([nextBillingDate])                // Find subscriptions due for renewal
  @@map("background_remover_subscriptions")
}

// Daily quota usage tracking for subscriptions
model BackgroundRemoverSubscriptionUsage {
  id             String   @id @default(cuid())
  subscriptionId String
  userId         String

  // Date tracking
  date           DateTime // Midnight of the day (e.g., 2025-01-15T00:00:00Z)

  // Usage counts
  removalsCount      Int     @default(0)  // Total removals today
  basicCount         Int     @default(0)
  standardCount      Int     @default(0)
  professionalCount  Int     @default(0)

  // Tier-specific tracking
  tier String? // If this record tracks specific tier

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  subscription BackgroundRemoverSubscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)

  @@unique([subscriptionId, date, tier])      // One record per subscription per day per tier
  @@index([subscriptionId])                   // FK index
  @@index([userId])                           // Find user's usage
  @@index([date])                             // Find usage by date
  @@index([subscriptionId, date])             // Composite: subscription usage on specific date
  @@map("background_remover_subscription_usage")
}
```

### 1.2 Index Strategy Explanation

**Critical Indexes**:

1. **`@@index([userId, createdAt(sort: Desc)])`** - Most common query: user's recent jobs/batches
2. **`@@index([status, createdAt])`** - Worker query: process pending jobs in chronological order
3. **`@@index([queueJobId])`** - Link batch to BullMQ job for status updates
4. **`@@index([status, expiresAt])`** - Cron job: find expiring subscriptions

**Why These Indexes?**:
- Foreign keys (`userId`, `batchId`, `subscriptionId`) - Required for joins and CASCADE deletes
- Status fields - Filter pending/processing/completed jobs
- Timestamps with DESC - Most recent first (common UX pattern)
- Composite indexes - Optimize multi-condition queries (status + date)

### 1.3 Migration Steps

```bash
# 1. Add models to schema.prisma (above)

# 2. Generate migration
cd backend
npx prisma migrate dev --name add_background_remover_pro

# 3. Verify migration
npx prisma migrate status

# 4. Deploy to production
npx prisma migrate deploy
```

---

## 2. Plugin Configuration

Create `backend/src/plugins/background-remover/plugin.config.ts`:

```typescript
import { PluginConfig } from '../types'

export const backgroundRemoverConfig: PluginConfig = {
  // Identity
  appId: 'background-remover-pro',
  name: 'Background Remover Pro',
  description: 'AI-powered background removal with 4 quality tiers and batch processing',
  icon: 'eraser', // Lucide icon
  version: '1.0.0',
  routePrefix: '/api/apps/background-remover',

  // Credit costs per action
  credits: {
    // Single removal by tier
    removeSingleBasic: 3,
    removeSingleStandard: 8,
    removeSingleProfessional: 15,
    removeSingleIndustry: 25,

    // Batch processing uses dynamic pricing (see pricing service)
    // Base cost per image * quantity - volume discount

    // Subscription management (no credit cost, uses payment)
    subscribe: 0,
    cancelSubscription: 0,

    // Integration endpoints (charged by calling app)
    integrationAvatarCreator: 0,  // Cost calculated based on tier
    integrationPoseGenerator: 0,
    integrationImageUpscaler: 0,
    integrationCarouselMix: 0,
  },

  // Access control
  access: {
    requiresAuth: true,
    requiresSubscription: false,  // Can use credits or subscription
    minSubscriptionTier: null,
    allowedRoles: ['user', 'admin'],
  },

  // Feature flags
  features: {
    enabled: true,
    beta: false,
    comingSoon: false,
  },

  // Dashboard display
  dashboard: {
    order: 6,  // Position in app grid
    color: 'purple',  // Theme color
    stats: {
      enabled: true,
      endpoint: '/api/apps/background-remover/stats',
    },
  },
}

export default backgroundRemoverConfig
```

---

## 3. API Routes & Endpoints

### 3.1 Route Structure

Create `backend/src/plugins/background-remover/routes.ts`:

```typescript
import { Hono } from 'hono'
import { authMiddleware } from '../../middleware/auth'
import {
  removeSingleHandler,
  startBatchHandler,
  getBatchStatusHandler,
  downloadBatchHandler,
  getJobHandler,
  getUserJobsHandler,
  calculatePricingHandler,
} from './handlers/removal.handlers'
import {
  getSubscriptionHandler,
  subscribeHandler,
  cancelSubscriptionHandler,
} from './handlers/subscription.handlers'
import {
  avatarCreatorBatchHandler,
  poseGeneratorAutoRemoveHandler,
  imageUpscalerPipelineHandler,
  carouselMixBatchHandler,
} from './handlers/integration.handlers'
import {
  getStatsHandler,
} from './handlers/stats.handlers'

const router = new Hono()

// Apply auth middleware to all routes
router.use('*', authMiddleware)

// ========================================
// Core Endpoints
// ========================================

// Single image removal
router.post('/remove', removeSingleHandler)

// Batch processing
router.post('/batch', startBatchHandler)
router.get('/batch/:batchId', getBatchStatusHandler)
router.get('/batch/:batchId/download', downloadBatchHandler)

// Job management
router.get('/jobs/:jobId', getJobHandler)
router.get('/jobs', getUserJobsHandler)

// Pricing calculator
router.post('/pricing/calculate', calculatePricingHandler)

// ========================================
// Subscription Endpoints
// ========================================

router.get('/subscription', getSubscriptionHandler)
router.post('/subscription', subscribeHandler)
router.delete('/subscription', cancelSubscriptionHandler)

// ========================================
// Integration Endpoints
// ========================================

router.post('/integrations/avatar-creator/batch', avatarCreatorBatchHandler)
router.post('/integrations/pose-generator/auto-remove', poseGeneratorAutoRemoveHandler)
router.post('/integrations/image-upscaler/pipeline', imageUpscalerPipelineHandler)
router.post('/integrations/carousel-mix/batch', carouselMixBatchHandler)

// ========================================
// Stats Endpoints
// ========================================

router.get('/stats', getStatsHandler)

export default router
```

### 3.2 Endpoint Specifications

#### 3.2.1 POST /remove - Single Image Removal

**Request** (multipart/form-data):
```typescript
interface RemoveSingleRequest {
  image: File       // Required: Image file (max 10MB)
  tier: RemovalTier // Required: 'basic' | 'standard' | 'professional' | 'industry'
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "jobId": "job_abc123",
    "originalUrl": "/uploads/background-remover/user_123/original.jpg",
    "processedUrl": "/processed/background-remover/user_123/removed.png",
    "creditsUsed": 15,
    "pricingType": "credits",
    "processingTimeMs": 3245,
    "tier": "professional",
    "metadata": {
      "originalSize": 2457600,
      "processedSize": 1823400,
      "width": 1920,
      "height": 1080,
      "format": "png"
    }
  }
}
```

**Errors**:
- `400` - Invalid tier, file too large, unsupported format
- `402` - Insufficient credits (if no subscription or quota exceeded)
- `403` - Tier not allowed in subscription plan
- `429` - Daily quota exceeded

---

#### 3.2.2 POST /batch - Start Batch Processing

**Request** (multipart/form-data):
```typescript
interface BatchRemovalRequest {
  images: File[]    // Required: 2-500 image files (total max 2GB)
  tier: RemovalTier // Required
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "batchId": "batch_xyz789",
    "totalImages": 100,
    "tier": "standard",
    "pricing": {
      "baseCreditsPerImage": 8,
      "baseTotal": 800,
      "discountPercentage": 10,
      "discountAmount": 80,
      "finalTotal": 720,
      "creditsPerImageAfterDiscount": 7.2
    },
    "estimatedCompletionMinutes": 15,
    "status": "pending",
    "createdAt": "2025-01-15T10:00:00Z"
  }
}
```

**Volume Discounts**:
| Images | Discount | Example (100 @ 8 credits) |
|--------|----------|---------------------------|
| 1-19   | 0%       | 19 × 8 = 152 credits      |
| 20-50  | 5%       | 50 × 8 × 0.95 = 380       |
| 51-100 | 10%      | 100 × 8 × 0.90 = 720      |
| 101-200| 15%      | 200 × 8 × 0.85 = 1,360    |
| 201-500| 20%      | 500 × 8 × 0.80 = 3,200    |

---

#### 3.2.3 GET /batch/:batchId - Get Batch Status

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "batchId": "batch_xyz789",
    "status": "processing",
    "progress": {
      "totalImages": 100,
      "processedImages": 67,
      "failedImages": 2,
      "percentage": 69
    },
    "pricing": {
      "totalCredits": 720,
      "discountPercentage": 10
    },
    "timing": {
      "startedAt": "2025-01-15T10:00:00Z",
      "estimatedCompletionAt": "2025-01-15T10:15:00Z"
    },
    "zipUrl": null
  }
}
```

**When Completed**:
```json
{
  "success": true,
  "data": {
    "batchId": "batch_xyz789",
    "status": "completed",
    "progress": {
      "totalImages": 100,
      "processedImages": 98,
      "failedImages": 2,
      "percentage": 100
    },
    "zipUrl": "/batches/batch_xyz789.zip",
    "zipSizeBytes": 157286400,
    "completedAt": "2025-01-15T10:12:00Z"
  }
}
```

---

#### 3.2.4 GET /subscription - Get Subscription Status

**Response** (200 OK - Active):
```json
{
  "success": true,
  "data": {
    "hasSubscription": true,
    "plan": "pro",
    "status": "active",
    "pricing": {
      "monthlyPrice": 299000,
      "currency": "IDR"
    },
    "quotas": {
      "daily": {
        "limit": 200,
        "used": 47,
        "remaining": 153,
        "resetsAt": "2025-01-16T00:00:00Z"
      },
      "professionalTier": {
        "limit": 50,
        "used": 12,
        "remaining": 38
      }
    },
    "allowedTiers": ["basic", "standard", "professional"],
    "billing": {
      "nextBillingDate": "2025-02-15T00:00:00Z",
      "subscribedAt": "2025-01-15T00:00:00Z"
    }
  }
}
```

**Response** (200 OK - No Subscription):
```json
{
  "success": true,
  "data": {
    "hasSubscription": false,
    "availablePlans": [
      {
        "name": "starter",
        "price": 99000,
        "dailyQuota": 50,
        "allowedTiers": ["basic", "standard"]
      },
      {
        "name": "pro",
        "price": 299000,
        "dailyQuota": 200,
        "allowedTiers": ["basic", "standard", "professional"],
        "professionalQuota": 50
      }
    ]
  }
}
```

---

#### 3.2.5 POST /integrations/avatar-creator/batch

**Request**:
```json
{
  "projectId": "proj_abc123",
  "tier": "professional"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "batchId": "batch_integration_001",
    "projectId": "proj_abc123",
    "totalAvatars": 12,
    "totalCredits": 162,
    "discountPercentage": 0
  }
}
```

---

## 4. Service Layer Architecture

### 4.1 Core Services

#### 4.1.1 Pricing Service

Create `backend/src/plugins/background-remover/services/pricing.service.ts`:

```typescript
export interface VolumeDiscount {
  minImages: number
  maxImages: number
  discountPercentage: number
}

export const VOLUME_DISCOUNTS: VolumeDiscount[] = [
  { minImages: 1, maxImages: 19, discountPercentage: 0 },
  { minImages: 20, maxImages: 50, discountPercentage: 5 },
  { minImages: 51, maxImages: 100, discountPercentage: 10 },
  { minImages: 101, maxImages: 200, discountPercentage: 15 },
  { minImages: 201, maxImages: 500, discountPercentage: 20 },
]

export const TIER_PRICING = {
  basic: { credits: 3, provider: 'huggingface', model: 'rmbg-1.4' },
  standard: { credits: 8, provider: 'huggingface', model: 'rmbg-2.0' },
  professional: { credits: 15, provider: 'segmind', model: 'birefnet-general' },
  industry: { credits: 25, provider: 'segmind', model: 'birefnet-portrait' },
}

export type RemovalTier = keyof typeof TIER_PRICING

export interface BatchPricing {
  baseCreditsPerImage: number
  baseTotal: number
  discountPercentage: number
  discountAmount: number
  finalTotal: number
  creditsPerImageAfterDiscount: number
}

export class PricingService {
  /**
   * Calculate batch pricing with volume discounts
   */
  calculateBatchCost(tier: RemovalTier, imageCount: number): BatchPricing {
    // Validate inputs
    if (imageCount < 2 || imageCount > 500) {
      throw new Error(`Invalid image count: ${imageCount}. Must be between 2 and 500`)
    }

    if (!TIER_PRICING[tier]) {
      throw new Error(`Invalid tier: ${tier}`)
    }

    // Step 1: Get tier pricing
    const baseCreditsPerImage = TIER_PRICING[tier].credits

    // Step 2: Calculate base cost
    const baseTotal = baseCreditsPerImage * imageCount

    // Step 3: Find applicable discount
    const discountRule = this.findVolumeDiscount(imageCount)
    const discountPercentage = discountRule.discountPercentage

    // Step 4: Calculate discount amount (rounded down)
    const discountAmount = Math.floor(baseTotal * (discountPercentage / 100))

    // Step 5: Calculate final cost
    const finalTotal = baseTotal - discountAmount

    // Step 6: Calculate effective cost per image
    const creditsPerImageAfterDiscount = finalTotal / imageCount

    return {
      baseCreditsPerImage,
      baseTotal,
      discountPercentage,
      discountAmount,
      finalTotal,
      creditsPerImageAfterDiscount,
    }
  }

  /**
   * Find volume discount tier for image count
   */
  private findVolumeDiscount(imageCount: number): VolumeDiscount {
    const discount = VOLUME_DISCOUNTS.find(
      (d) => imageCount >= d.minImages && imageCount <= d.maxImages
    )

    if (!discount) {
      throw new Error(`No discount found for image count: ${imageCount}`)
    }

    return discount
  }

  /**
   * Calculate single image cost (no discount)
   */
  calculateSingleCost(tier: RemovalTier): number {
    return TIER_PRICING[tier].credits
  }
}

export const pricingService = new PricingService()
```

---

#### 4.1.2 AI Provider Service

Create `backend/src/plugins/background-remover/services/ai-provider.service.ts`:

```typescript
import axios from 'axios'
import sharp from 'sharp'
import { TIER_PRICING, RemovalTier } from './pricing.service'

export interface RemovalResult {
  processedImageBuffer: Buffer
  processingTimeMs: number
  provider: string
  model: string
  width: number
  height: number
  format: string
  size: number
}

export class AIProviderService {
  private huggingfaceApiKey: string
  private segmindApiKey: string

  constructor() {
    this.huggingfaceApiKey = process.env.HUGGINGFACE_API_KEY!
    this.segmindApiKey = process.env.SEGMIND_API_KEY!
  }

  /**
   * Remove background using specified tier
   */
  async removeBackground(
    imageBuffer: Buffer,
    tier: RemovalTier
  ): Promise<RemovalResult> {
    const startTime = Date.now()
    const tierConfig = TIER_PRICING[tier]

    let processedBuffer: Buffer

    if (tierConfig.provider === 'huggingface') {
      processedBuffer = await this.callHuggingFace(imageBuffer, tierConfig.model)
    } else if (tierConfig.provider === 'segmind') {
      processedBuffer = await this.callSegmind(imageBuffer, tierConfig.model)
    } else {
      throw new Error(`Unknown provider: ${tierConfig.provider}`)
    }

    const processingTimeMs = Date.now() - startTime

    // Get metadata
    const metadata = await sharp(processedBuffer).metadata()

    return {
      processedImageBuffer: processedBuffer,
      processingTimeMs,
      provider: tierConfig.provider,
      model: tierConfig.model,
      width: metadata.width!,
      height: metadata.height!,
      format: metadata.format!,
      size: processedBuffer.length,
    }
  }

  /**
   * Call HuggingFace Inference API
   */
  private async callHuggingFace(imageBuffer: Buffer, model: string): Promise<Buffer> {
    const modelEndpoints = {
      'rmbg-1.4': 'https://api-inference.huggingface.co/models/briaai/RMBG-1.4',
      'rmbg-2.0': 'https://api-inference.huggingface.co/models/briaai/RMBG-2.0',
    }

    const endpoint = modelEndpoints[model as keyof typeof modelEndpoints]
    if (!endpoint) {
      throw new Error(`Unknown HuggingFace model: ${model}`)
    }

    try {
      const response = await axios.post(endpoint, imageBuffer, {
        headers: {
          'Authorization': `Bearer ${this.huggingfaceApiKey}`,
          'Content-Type': 'application/octet-stream',
        },
        responseType: 'arraybuffer',
        timeout: 30000, // 30 second timeout
      })

      return Buffer.from(response.data)
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error('HuggingFace rate limit exceeded. Please try again in a few seconds.')
      }
      throw new Error(`HuggingFace API error: ${error.message}`)
    }
  }

  /**
   * Call Segmind API
   */
  private async callSegmind(imageBuffer: Buffer, model: string): Promise<Buffer> {
    const base64Image = imageBuffer.toString('base64')

    const modelEndpoints = {
      'birefnet-general': 'https://api.segmind.com/v1/birefnet-general',
      'birefnet-portrait': 'https://api.segmind.com/v1/birefnet-portrait',
    }

    const endpoint = modelEndpoints[model as keyof typeof modelEndpoints]
    if (!endpoint) {
      throw new Error(`Unknown Segmind model: ${model}`)
    }

    try {
      const response = await axios.post(
        endpoint,
        {
          image: `data:image/png;base64,${base64Image}`,
          output_format: 'png',
        },
        {
          headers: {
            'x-api-key': this.segmindApiKey,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
          timeout: 30000,
        }
      )

      return Buffer.from(response.data)
    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new Error('Segmind rate limit exceeded. Please try again in a few seconds.')
      }
      throw new Error(`Segmind API error: ${error.message}`)
    }
  }

  /**
   * Retry logic with exponential backoff
   */
  async removeBackgroundWithRetry(
    imageBuffer: Buffer,
    tier: RemovalTier,
    maxRetries = 3
  ): Promise<RemovalResult> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.removeBackground(imageBuffer, tier)
      } catch (error: any) {
        if (attempt < maxRetries - 1 && error.message.includes('rate limit')) {
          // Exponential backoff: 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
          continue
        }
        throw error
      }
    }

    throw new Error('Max retries exceeded')
  }
}

export const aiProviderService = new AIProviderService()
```

---

#### 4.1.3 Subscription Service

Create `backend/src/plugins/background-remover/services/subscription.service.ts`:

```typescript
import prisma from '../../../db/client'

export interface SubscriptionQuota {
  canUse: boolean
  reason?: string
  remainingQuota: number
  remainingProfessionalQuota?: number
}

export class SubscriptionService {
  /**
   * Check if user can use tier with subscription quota
   */
  async checkSubscriptionQuota(
    userId: string,
    tier: RemovalTier
  ): Promise<SubscriptionQuota> {
    // Step 1: Get active subscription
    const subscription = await prisma.backgroundRemoverSubscription.findFirst({
      where: {
        userId,
        status: 'active',
        expiresAt: { gte: new Date() },
      },
    })

    if (!subscription) {
      return {
        canUse: false,
        reason: 'No active subscription',
        remainingQuota: 0,
      }
    }

    // Step 2: Check if tier is allowed in plan
    if (!subscription.allowedTiers.includes(tier)) {
      return {
        canUse: false,
        reason: `Tier '${tier}' not allowed in ${subscription.plan} plan`,
        remainingQuota: 0,
      }
    }

    // Step 3: Get today's usage
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayUsage = await prisma.backgroundRemoverSubscriptionUsage.findMany({
      where: {
        subscriptionId: subscription.id,
        date: today,
      },
    })

    const totalUsedToday = todayUsage.reduce((sum, u) => sum + u.removalsCount, 0)

    // Step 4: Check general quota
    if (totalUsedToday >= subscription.dailyQuota) {
      return {
        canUse: false,
        reason: 'Daily quota exceeded',
        remainingQuota: 0,
      }
    }

    // Step 5: Check Professional tier quota (Pro plan only)
    if (tier === 'professional' && subscription.plan === 'pro') {
      const professionalUsage = todayUsage.find((u) => u.tier === 'professional')
      const professionalUsedToday = professionalUsage?.removalsCount || 0

      if (professionalUsedToday >= subscription.professionalDailyQuota!) {
        return {
          canUse: false,
          reason: 'Professional tier daily quota exceeded',
          remainingQuota: subscription.dailyQuota - totalUsedToday,
          remainingProfessionalQuota: 0,
        }
      }

      return {
        canUse: true,
        remainingQuota: subscription.dailyQuota - totalUsedToday,
        remainingProfessionalQuota: subscription.professionalDailyQuota! - professionalUsedToday,
      }
    }

    return {
      canUse: true,
      remainingQuota: subscription.dailyQuota - totalUsedToday,
    }
  }

  /**
   * Increment subscription usage
   */
  async incrementUsage(userId: string, tier: RemovalTier): Promise<void> {
    const subscription = await prisma.backgroundRemoverSubscription.findFirst({
      where: { userId, status: 'active' },
    })

    if (!subscription) {
      throw new Error('No active subscription found')
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    await prisma.backgroundRemoverSubscriptionUsage.upsert({
      where: {
        subscriptionId_date_tier: {
          subscriptionId: subscription.id,
          date: today,
          tier,
        },
      },
      create: {
        subscriptionId: subscription.id,
        userId,
        date: today,
        tier,
        removalsCount: 1,
        basicCount: tier === 'basic' ? 1 : 0,
        standardCount: tier === 'standard' ? 1 : 0,
        professionalCount: tier === 'professional' ? 1 : 0,
      },
      update: {
        removalsCount: { increment: 1 },
        basicCount: tier === 'basic' ? { increment: 1 } : undefined,
        standardCount: tier === 'standard' ? { increment: 1 } : undefined,
        professionalCount: tier === 'professional' ? { increment: 1 } : undefined,
      },
    })
  }
}

export const subscriptionService = new SubscriptionService()
```

---

## 5. Queue Worker Implementation

### 5.1 Queue Configuration

Create `backend/src/plugins/background-remover/queue/config.ts`:

```typescript
import { ConnectionOptions } from 'bullmq'

export const redisConnection: ConnectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
}

export const QUEUE_NAMES = {
  BATCH_REMOVAL: 'background-remover:batch',
}

export const QUEUE_OPTIONS = {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
      age: 86400, // 24 hours
    },
    removeOnFail: {
      count: 50,
      age: 604800, // 7 days
    },
  },
}
```

### 5.2 Worker Implementation

Create `backend/src/plugins/background-remover/queue/worker.ts`:

```typescript
import { Worker, Job } from 'bullmq'
import { redisConnection, QUEUE_NAMES } from './config'
import { aiProviderService } from '../services/ai-provider.service'
import { storageService } from '../services/storage.service'
import prisma from '../../../db/client'
import os from 'os'
import fs from 'fs/promises'
import archiver from 'archiver'
import path from 'path'

interface BatchJobData {
  batchId: string
  userId: string
  tier: string
  imageCount: number
}

export class BatchProcessorWorker {
  private worker: Worker

  constructor() {
    // Calculate concurrency based on CPU cores
    const concurrency = Math.min(Math.max(os.cpus().length - 1, 5), 20)

    this.worker = new Worker(
      QUEUE_NAMES.BATCH_REMOVAL,
      async (job) => this.processBatch(job),
      {
        connection: redisConnection,
        concurrency,
        limiter: {
          max: 100, // Max 100 jobs per interval
          duration: 60000, // 1 minute
        },
      }
    )

    this.worker.on('completed', (job) => {
      console.log(`Batch ${job.id} completed`)
    })

    this.worker.on('failed', (job, err) => {
      console.error(`Batch ${job?.id} failed:`, err)
    })
  }

  /**
   * Process batch job
   */
  private async processBatch(job: Job<BatchJobData>) {
    const { batchId, userId, tier, imageCount } = job.data

    // Update batch status to processing
    await prisma.backgroundRemovalBatch.update({
      where: { id: batchId },
      data: {
        status: 'processing',
        startedAt: new Date(),
      },
    })

    try {
      // Get all pending items
      const items = await prisma.backgroundRemovalJob.findMany({
        where: {
          batchId,
          status: 'pending',
        },
      })

      // Process items in chunks (based on concurrency)
      const chunkSize = 10
      for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize)

        await Promise.allSettled(
          chunk.map(item => this.processItem(item, tier))
        )

        // Update progress
        const progress = Math.floor(((i + chunk.length) / items.length) * 100)
        await job.updateProgress(progress)

        await prisma.backgroundRemovalBatch.update({
          where: { id: batchId },
          data: {
            processedImages: i + chunk.length,
            progressPercent: progress,
          },
        })
      }

      // Get final counts
      const finalCounts = await prisma.backgroundRemovalJob.groupBy({
        by: ['status'],
        where: { batchId },
        _count: true,
      })

      const completed = finalCounts.find(c => c.status === 'completed')?._count || 0
      const failed = finalCounts.find(c => c.status === 'failed')?._count || 0

      // Create ZIP file
      const zipPath = await this.createZipFile(batchId, userId)
      const zipStats = await fs.stat(zipPath)

      // Update batch as completed
      await prisma.backgroundRemovalBatch.update({
        where: { id: batchId },
        data: {
          status: 'completed',
          processedImages: completed,
          failedImages: failed,
          zipFilePath: zipPath,
          zipFileSize: zipStats.size,
          progressPercent: 100,
          completedAt: new Date(),
        },
      })

      // TODO: Send email notification

    } catch (error: any) {
      // Mark batch as failed
      await prisma.backgroundRemovalBatch.update({
        where: { id: batchId },
        data: {
          status: 'failed',
          errorMessage: error.message,
        },
      })

      throw error
    }
  }

  /**
   * Process single item in batch
   */
  private async processItem(item: any, tier: string) {
    try {
      // Update status to processing
      await prisma.backgroundRemovalJob.update({
        where: { id: item.id },
        data: { status: 'processing' },
      })

      // Read original image
      const imageBuffer = await fs.readFile(item.originalFilePath)

      // Remove background
      const result = await aiProviderService.removeBackgroundWithRetry(
        imageBuffer,
        tier as any,
        3 // Max 3 retries
      )

      // Save processed image
      const processedPath = await storageService.saveProcessedImage(
        result.processedImageBuffer,
        item.userId,
        item.id
      )

      // Update job as completed
      await prisma.backgroundRemovalJob.update({
        where: { id: item.id },
        data: {
          status: 'completed',
          processedFilePath: processedPath,
          processedFileSize: result.size,
          aiProvider: result.provider,
          modelName: result.model,
          processingTimeMs: result.processingTimeMs,
          width: result.width,
          height: result.height,
          format: result.format,
          completedAt: new Date(),
        },
      })

    } catch (error: any) {
      // Mark item as failed
      await prisma.backgroundRemovalJob.update({
        where: { id: item.id },
        data: {
          status: 'failed',
          errorMessage: error.message,
        },
      })
    }
  }

  /**
   * Create ZIP file from completed items
   */
  private async createZipFile(batchId: string, userId: string): Promise<string> {
    const completedItems = await prisma.backgroundRemovalJob.findMany({
      where: {
        batchId,
        status: 'completed',
      },
    })

    const zipDir = path.join(process.cwd(), 'storage', 'batches', userId)
    await fs.mkdir(zipDir, { recursive: true })

    const zipPath = path.join(zipDir, `${batchId}.zip`)
    const output = require('fs').createWriteStream(zipPath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    return new Promise((resolve, reject) => {
      output.on('close', () => resolve(zipPath))
      archive.on('error', reject)

      archive.pipe(output)

      for (const item of completedItems) {
        const fileName = `removed-${path.basename(item.originalFileName, path.extname(item.originalFileName))}.png`
        archive.file(item.processedFilePath!, { name: fileName })
      }

      archive.finalize()
    })
  }

  /**
   * Start worker
   */
  start() {
    console.log(`Background Remover worker started with ${this.worker.opts.concurrency} concurrency`)
  }

  /**
   * Stop worker gracefully
   */
  async stop() {
    await this.worker.close()
    console.log('Background Remover worker stopped')
  }
}

// Start worker if running as standalone process
if (require.main === module) {
  const worker = new BatchProcessorWorker()
  worker.start()

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    await worker.stop()
    process.exit(0)
  })
}

export default BatchProcessorWorker
```

---

## 6. Frontend Components & Store

### 6.1 Zustand Store

Create `frontend/src/stores/background-remover.store.ts`:

```typescript
import { create } from 'zustand'

export type RemovalTier = 'basic' | 'standard' | 'professional' | 'industry'

export interface BatchJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  totalImages: number
  processedImages: number
  failedImages: number
  progressPercentage: number
  totalCredits: number
  zipUrl?: string
}

export interface SubscriptionInfo {
  hasSubscription: boolean
  plan?: 'starter' | 'pro'
  dailyQuota?: number
  dailyUsed?: number
  dailyRemaining?: number
  professionalQuota?: number
  professionalUsed?: number
  professionalRemaining?: number
}

interface BackgroundRemoverStore {
  // State
  uploadedFiles: File[]
  selectedTier: RemovalTier
  currentBatch: BatchJob | null
  subscription: SubscriptionInfo | null
  isLoading: boolean
  error: string | null

  // Actions
  addFiles: (files: File[]) => void
  removeFile: (index: number) => void
  clearFiles: () => void
  setSelectedTier: (tier: RemovalTier) => void
  setCurrentBatch: (batch: BatchJob) => void
  updateBatchProgress: (progress: Partial<BatchJob>) => void
  setSubscription: (sub: SubscriptionInfo) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useBackgroundRemoverStore = create<BackgroundRemoverStore>((set) => ({
  // Initial state
  uploadedFiles: [],
  selectedTier: 'standard',
  currentBatch: null,
  subscription: null,
  isLoading: false,
  error: null,

  // Actions
  addFiles: (files) => set((state) => ({
    uploadedFiles: [...state.uploadedFiles, ...files].slice(0, 500) // Max 500 files
  })),

  removeFile: (index) => set((state) => ({
    uploadedFiles: state.uploadedFiles.filter((_, i) => i !== index)
  })),

  clearFiles: () => set({ uploadedFiles: [] }),

  setSelectedTier: (tier) => set({ selectedTier: tier }),

  setCurrentBatch: (batch) => set({ currentBatch: batch }),

  updateBatchProgress: (progress) => set((state) => ({
    currentBatch: state.currentBatch ? { ...state.currentBatch, ...progress } : null
  })),

  setSubscription: (sub) => set({ subscription: sub }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  reset: () => set({
    uploadedFiles: [],
    selectedTier: 'standard',
    currentBatch: null,
    error: null,
  }),
}))
```

### 6.2 Main Component

Create `frontend/src/pages/apps/background-remover/BackgroundRemoverPro.tsx`:

```tsx
import React, { useState, useEffect } from 'react'
import { Eraser, Upload, Zap, Download, CreditCard } from 'lucide-react'
import { useBackgroundRemoverStore } from '../../../stores/background-remover.store'
import { backgroundRemoverAPI } from '../../../api/background-remover.api'
import UnifiedHeader from '../../../components/UnifiedHeader'
import TierSelector from './components/TierSelector'
import FileUploader from './components/FileUploader'
import PricingCalculator from './components/PricingCalculator'
import ProgressTracker from './components/ProgressTracker'
import SubscriptionCard from './components/SubscriptionCard'

const BackgroundRemoverPro: React.FC = () => {
  const store = useBackgroundRemoverStore()
  const [mode, setMode] = useState<'single' | 'batch'>('single')

  // Load subscription status on mount
  useEffect(() => {
    loadSubscription()
  }, [])

  const loadSubscription = async () => {
    try {
      const sub = await backgroundRemoverAPI.getSubscription()
      store.setSubscription(sub)
    } catch (error) {
      console.error('Failed to load subscription:', error)
    }
  }

  const handleBatchRemoval = async () => {
    if (store.uploadedFiles.length < 2) {
      store.setError('Please upload at least 2 images for batch processing')
      return
    }

    store.setLoading(true)
    store.setError(null)

    try {
      const result = await backgroundRemoverAPI.removeBatch(
        store.uploadedFiles,
        store.selectedTier
      )

      store.setCurrentBatch({
        id: result.batchId,
        status: 'processing',
        totalImages: result.totalImages,
        processedImages: 0,
        failedImages: 0,
        progressPercentage: 0,
        totalCredits: result.pricing.finalTotal,
      })

      // Start polling for progress
      startProgressPolling(result.batchId)

    } catch (error: any) {
      store.setError(error.message || 'Failed to start batch processing')
    } finally {
      store.setLoading(false)
    }
  }

  const startProgressPolling = (batchId: string) => {
    const interval = setInterval(async () => {
      try {
        const progress = await backgroundRemoverAPI.getBatchProgress(batchId)

        store.updateBatchProgress({
          processedImages: progress.processedImages,
          failedImages: progress.failedImages,
          progressPercentage: progress.progressPercentage,
          status: progress.status,
          zipUrl: progress.zipUrl,
        })

        // Stop polling if completed or failed
        if (progress.status === 'completed' || progress.status === 'failed') {
          clearInterval(interval)
        }
      } catch (error) {
        console.error('Failed to fetch progress:', error)
        clearInterval(interval)
      }
    }, 2000) // Poll every 2 seconds
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedHeader
        icon={Eraser}
        title="Background Remover Pro"
        subtitle="AI-powered background removal with 4 quality tiers"
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Subscription Status */}
        {store.subscription && (
          <SubscriptionCard subscription={store.subscription} />
        )}

        {/* Mode Selector */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setMode('single')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                mode === 'single'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Zap className="inline w-5 h-5 mr-2" />
              Single Image
            </button>
            <button
              onClick={() => setMode('batch')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                mode === 'batch'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Upload className="inline w-5 h-5 mr-2" />
              Batch Processing (2-500)
            </button>
          </div>

          {/* Tier Selector */}
          <TierSelector
            selected={store.selectedTier}
            onChange={store.setSelectedTier}
            subscription={store.subscription}
          />

          {/* File Uploader */}
          <FileUploader
            multiple={mode === 'batch'}
            maxFiles={mode === 'batch' ? 500 : 1}
            onUpload={(files) => store.addFiles(files)}
            uploadedFiles={store.uploadedFiles}
            onRemove={(index) => store.removeFile(index)}
          />

          {/* Pricing Calculator (Batch Mode) */}
          {mode === 'batch' && store.uploadedFiles.length > 0 && (
            <PricingCalculator
              imageCount={store.uploadedFiles.length}
              tier={store.selectedTier}
              subscription={store.subscription}
            />
          )}

          {/* Error Display */}
          {store.error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {store.error}
            </div>
          )}

          {/* Action Button */}
          {mode === 'batch' && store.uploadedFiles.length >= 2 && (
            <button
              onClick={handleBatchRemoval}
              disabled={store.isLoading}
              className="mt-6 w-full py-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {store.isLoading ? (
                'Starting batch...'
              ) : (
                `Process ${store.uploadedFiles.length} Images`
              )}
            </button>
          )}
        </div>

        {/* Progress Tracker */}
        {store.currentBatch && (
          <ProgressTracker batch={store.currentBatch} />
        )}
      </div>
    </div>
  )
}

export default BackgroundRemoverPro
```

---

## 7. Integration Points with Other Apps

### 7.1 Avatar Creator Integration

**Use Case**: Remove backgrounds from all avatars in a project

**Implementation**:

```typescript
// In Avatar Creator app
async function removeAllBackgrounds(projectId: string, tier: string) {
  const response = await fetch('/api/apps/background-remover/integrations/avatar-creator/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ projectId, tier })
  })

  const { batchId } = await response.json()

  // Poll for progress
  const interval = setInterval(async () => {
    const progress = await fetchBatchProgress(batchId)
    if (progress.status === 'completed') {
      clearInterval(interval)
      // Refresh avatar list
      loadAvatars()
    }
  }, 2000)
}
```

### 7.2 Pose Generator Integration

**Use Case**: Auto-remove background after pose generation

**Implementation**:

```typescript
// In Pose Generator app
async function generatePoseWithBackgroundRemoval(params: any) {
  // 1. Generate pose
  const poseResult = await generatePose(params)

  // 2. Auto-remove background if requested
  if (params.autoRemoveBackground) {
    const removal = await fetch('/api/apps/background-remover/integrations/pose-generator/auto-remove', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        generatedImageId: poseResult.id,
        tier: params.removalTier || 'standard'
      })
    })

    const result = await removal.json()
    poseResult.backgroundRemovedUrl = result.processedUrl
  }

  return poseResult
}
```

### 7.3 Image Upscaler Pro Integration

**Use Case**: Pipeline processing (remove → upscale OR upscale → remove)

**Implementation**:

```typescript
// In Image Upscaler Pro app
async function pipelineProcess(imageId: string, pipeline: string) {
  const response = await fetch('/api/apps/background-remover/integrations/image-upscaler/pipeline', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      imageId,
      pipeline, // 'remove-then-upscale' or 'upscale-then-remove'
      removalTier: 'professional',
      upscaleFactor: 4
    })
  })

  return await response.json()
}
```

### 7.4 Carousel Mix Integration

**Use Case**: Remove backgrounds from all carousel slides

**Implementation**:

```typescript
// In Carousel Mix app
async function removeCarouselBackgrounds(projectId: string, tier: string) {
  const response = await fetch('/api/apps/background-remover/integrations/carousel-mix/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ projectId, tier })
  })

  return await response.json()
}
```

---

## 8. Credit Pricing Logic & Decision Tree

### 8.1 Pricing Decision Tree

```
User wants to remove background
│
├─ Is it a batch (2-500 images)?
│  ├─ YES → ALWAYS use credits (no subscription option for batch)
│  │        Calculate: baseTotal - volumeDiscount = finalTotal
│  │        Charge credits upfront
│  │
│  └─ NO (single image)
│     │
│     └─ Does user have active subscription?
│        ├─ YES
│        │  ├─ Is tier allowed in plan?
│        │  │  ├─ YES
│        │  │  │  └─ Is daily quota available?
│        │  │  │     ├─ YES → USE SUBSCRIPTION (increment quota)
│        │  │  │     └─ NO → Fallback to credits
│        │  │  └─ NO → Fallback to credits
│        │  └─
│        └─ NO → Use credits
```

### 8.2 Credit Deduction Logic

```typescript
// In removal handler
async function removeSingle(userId: string, tier: string, imageBuffer: Buffer) {
  // Step 1: Check subscription eligibility
  const quotaCheck = await subscriptionService.checkSubscriptionQuota(userId, tier)

  if (quotaCheck.canUse) {
    // Use subscription quota
    const result = await aiProviderService.removeBackground(imageBuffer, tier)
    await subscriptionService.incrementUsage(userId, tier)

    return {
      ...result,
      creditsUsed: 0,
      pricingType: 'subscription',
    }
  } else {
    // Fallback to credits
    const cost = pricingService.calculateSingleCost(tier)

    // Deduct credits FIRST (atomic transaction)
    await creditService.deductCredits({
      userId,
      amount: cost,
      description: `Background removal (${tier})`,
      referenceType: 'background_removal_job',
    })

    // Process image (only if credits deducted successfully)
    const result = await aiProviderService.removeBackground(imageBuffer, tier)

    return {
      ...result,
      creditsUsed: cost,
      pricingType: 'credits',
    }
  }
}
```

### 8.3 Batch Pricing Formula

```typescript
function calculateBatchCost(tier: string, imageCount: number) {
  // Base cost
  const baseCreditsPerImage = TIER_PRICING[tier].credits
  const baseTotal = baseCreditsPerImage * imageCount

  // Volume discount
  let discountPercentage = 0
  if (imageCount >= 20 && imageCount <= 50) discountPercentage = 5
  else if (imageCount >= 51 && imageCount <= 100) discountPercentage = 10
  else if (imageCount >= 101 && imageCount <= 200) discountPercentage = 15
  else if (imageCount >= 201) discountPercentage = 20

  const discountAmount = Math.floor(baseTotal * (discountPercentage / 100))
  const finalTotal = baseTotal - discountAmount

  return {
    baseCreditsPerImage,
    baseTotal,
    discountPercentage,
    discountAmount,
    finalTotal,
    creditsPerImageAfterDiscount: finalTotal / imageCount
  }
}
```

---

## 9. Environment Variables

Add to `backend/.env`:

```bash
# Background Remover Pro Configuration

# AI Provider APIs
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SEGMIND_API_KEY=SG_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Redis (for queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Storage
STORAGE_DIR=./storage
MAX_FILE_SIZE_MB=10
MAX_BATCH_SIZE_GB=2

# Email (for batch completion notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@lumiku.com
SMTP_PASS=xxxxxxxxxxxxx

# Rate Limiting
RATE_LIMIT_SINGLE=30  # per minute
RATE_LIMIT_BATCH=5    # per hour

# Processing
WORKER_CONCURRENCY=10
BATCH_TIMEOUT_MINUTES=60
```

---

## 10. Deployment Checklist

### Phase 1: Database Setup
- [ ] Add Prisma models to schema.prisma
- [ ] Run `npx prisma migrate dev --name add_background_remover_pro`
- [ ] Verify migration with `npx prisma migrate status`
- [ ] Deploy to production with `npx prisma migrate deploy`

### Phase 2: Backend Implementation
- [ ] Create plugin configuration (`plugin.config.ts`)
- [ ] Implement pricing service with volume discount logic
- [ ] Implement AI provider service (HuggingFace + Segmind)
- [ ] Implement subscription service with quota tracking
- [ ] Implement storage service for file management
- [ ] Create API route handlers (removal, batch, subscription)
- [ ] Add integration endpoints for other apps
- [ ] Register plugin in `backend/src/plugins/loader.ts`

### Phase 3: Queue System
- [ ] Install BullMQ and Redis dependencies: `npm install bullmq ioredis archiver`
- [ ] Configure Redis connection
- [ ] Implement batch processor worker
- [ ] Test worker with small batch (10 images)
- [ ] Setup PM2 for worker process management
- [ ] Configure worker auto-restart and monitoring

### Phase 4: Frontend Implementation
- [ ] Create Zustand store for state management
- [ ] Implement main component (`BackgroundRemoverPro.tsx`)
- [ ] Create tier selector component
- [ ] Create file uploader with drag-drop (500 file support)
- [ ] Create pricing calculator component
- [ ] Create progress tracker component
- [ ] Create subscription card component
- [ ] Add to app routes

### Phase 5: Integration
- [ ] Implement Avatar Creator integration endpoint
- [ ] Implement Pose Generator integration endpoint
- [ ] Implement Image Upscaler Pro pipeline endpoint
- [ ] Implement Carousel Mix integration endpoint
- [ ] Test cross-app integrations
- [ ] Update integration documentation

### Phase 6: Testing
- [ ] Unit tests for pricing service (20+ test cases)
- [ ] Unit tests for subscription quota logic
- [ ] Integration tests for API endpoints
- [ ] Load test with 500-image batch
- [ ] Test credit deduction with race conditions
- [ ] Test subscription quota reset at midnight
- [ ] Test volume discount calculations

### Phase 7: Deployment
- [ ] Configure environment variables in production
- [ ] Deploy database migrations
- [ ] Deploy backend code
- [ ] Deploy worker processes (PM2)
- [ ] Setup Redis persistence
- [ ] Configure health checks
- [ ] Setup monitoring (Sentry, logs)
- [ ] Test production endpoints

### Phase 8: Monitoring & Optimization
- [ ] Monitor AI API costs and margins
- [ ] Setup alerts for high failure rates
- [ ] Monitor queue performance
- [ ] Optimize worker concurrency
- [ ] Monitor storage usage
- [ ] Setup automated cleanup for old files

---

## 11. Performance Targets

**Single Image Processing**:
- Basic tier: < 2 seconds
- Standard tier: < 3 seconds
- Professional tier: < 4 seconds
- Industry tier: < 5 seconds

**Batch Processing**:
- 100 images (Standard): 10-15 minutes
- 500 images (Professional): 45-60 minutes
- Worker concurrency: 5-20 adaptive

**System Metrics**:
- Uptime: 99.5%+
- Success rate: 98%+
- Profit margin: 92-95%
- Credit system race conditions: 0 (Serializable isolation)

---

## 12. Ready for Implementation

This specification is complete and ready for the `lumiku-app-builder` agent to implement.

**File Locations**:
- Database: `backend/prisma/schema.prisma`
- Plugin Config: `backend/src/plugins/background-remover/plugin.config.ts`
- Routes: `backend/src/plugins/background-remover/routes.ts`
- Services: `backend/src/plugins/background-remover/services/`
- Queue: `backend/src/plugins/background-remover/queue/`
- Frontend: `frontend/src/pages/apps/background-remover/`
- Store: `frontend/src/stores/background-remover.store.ts`

**Total Implementation Time**: 2-3 weeks (2 developers)

**Key Technologies**:
- Backend: Hono.js, Prisma, PostgreSQL
- Queue: BullMQ, Redis
- AI: HuggingFace Inference API, Segmind API
- Image: Sharp
- Frontend: React, Zustand, TailwindCSS

**Next Steps**:
1. Pass this specification to `lumiku-app-builder` agent
2. Follow the 8-phase implementation checklist
3. Test thoroughly with batch processing and credit deduction
4. Deploy to production with monitoring

---

**Specification Version**: 1.0.0
**Last Updated**: January 2025
**Status**: Ready for Implementation ✅
