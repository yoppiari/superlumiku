# Background Remover Pro - Complete Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Project Structure](#project-structure)
5. [Phase 1: Database & Core Models](#phase-1-database--core-models)
6. [Phase 2: API Layer](#phase-2-api-layer)
7. [Phase 3: Queue System](#phase-3-queue-system)
8. [Phase 4: Frontend Implementation](#phase-4-frontend-implementation)
9. [Phase 5: Integration Layer](#phase-5-integration-layer)
10. [Testing](#testing)
11. [Deployment](#deployment)
12. [Related Documentation](#related-documentation)

---

## Overview

**Background Remover Pro** is an enterprise-grade background removal service for the Lumiku platform. It provides:

- **4 quality tiers** (Basic to Industry-grade)
- **Massive batch processing** (up to 500 images)
- **Hybrid pricing model** (subscription + credits)
- **Cross-app integrations** (Avatar Creator, Pose Generator, etc.)
- **Production-grade queue system** (BullMQ + Redis)

### Why This Matters

Background removal is a critical feature for e-commerce, marketing, and creative professionals. This implementation balances:
- **Cost efficiency**: 92-95% profit margins through smart tier pricing
- **Performance**: Handles 500-image batches without OOM
- **User experience**: Real-time progress tracking and volume discounts
- **Scalability**: Horizontal worker scaling for growing demand

### Key Metrics
- Target margin: **85%+** (achieved: 92-95%)
- Max batch size: **500 images** (2GB total)
- Processing speed: **5-20 concurrent workers** (adaptive)
- Credit cost: **3-25 credits** per image (tier-dependent)

---

## Architecture

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Svelte)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ Single Image │  │ Batch Upload │  │ Integration Triggers │ │
│  │   Interface  │  │  (500 max)   │  │  (Avatar/Pose/etc)   │ │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘ │
└─────────┼──────────────────┼─────────────────────┼─────────────┘
          │                  │                     │
          ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Layer (Elysia + Bun)                     │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │ Auth Middleware │  │ Pricing Service  │  │ Credit Service│ │
│  └────────┬────────┘  └────────┬─────────┘  └───────┬───────┘ │
│           │                    │                     │          │
│  ┌────────▼────────────────────▼─────────────────────▼───────┐ │
│  │           Removal Service Orchestrator                    │ │
│  │  - Single image → Direct processing                       │ │
│  │  - Batch → Queue job creation                             │ │
│  └────────┬──────────────────────────────────────────────────┘ │
└───────────┼─────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Queue System (BullMQ + Redis)                │
│  ┌──────────────────┐         ┌─────────────────────────────┐  │
│  │  Batch Job Queue │────────▶│   5-20 Worker Processes     │  │
│  │  - Job metadata  │         │   (Adaptive Concurrency)    │  │
│  │  - Progress      │         │   - HuggingFace API calls   │  │
│  │  - Retry logic   │         │   - Segmind API calls       │  │
│  └──────────────────┘         └─────────────┬───────────────┘  │
└───────────────────────────────────────────────┼──────────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External AI Services                         │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │  HuggingFace API │  │   Segmind API    │                    │
│  │  - RMBG-1.4      │  │  - BiRefNet-Gen  │                    │
│  │  - RMBG-2.0      │  │  - BiRefNet-Port │                    │
│  └──────────────────┘  └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
            │                              │
            ▼                              ▼
┌─────────────────────────────────────────────────────────────────┐
│           Storage Layer (Local FS / S3)                         │
│  - Original images: /uploads/background-remover/{userId}/...    │
│  - Processed images: /processed/background-remover/{userId}/... │
│  - Batch archives: /batches/{batchId}.zip                       │
└─────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│              Database (PostgreSQL + Prisma)                     │
│  - background_removal_jobs                                      │
│  - background_removal_batches                                   │
│  - background_removal_batch_items                               │
│  - subscriptions                                                │
│  - subscription_usage_logs                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow: Single Image Processing

```
1. User uploads image + selects tier
   ↓
2. API validates: file size, format, credit balance/quota
   ↓
3. Single image → Direct processing (no queue)
   ↓
4. Call AI API (HuggingFace or Segmind)
   ↓
5. Save processed image to storage
   ↓
6. Deduct credits OR increment daily quota usage
   ↓
7. Create background_removal_jobs record
   ↓
8. Return processed image URL to frontend
```

### Data Flow: Batch Processing

```
1. User uploads 50-500 images + selects tier
   ↓
2. API validates: total size, count, credit balance
   ↓
3. Calculate total cost with volume discount
   ↓
4. Deduct credits upfront (always credits for batches)
   ↓
5. Create background_removal_batches record
   ↓
6. Create 50-500 background_removal_batch_items
   ↓
7. Add job to BullMQ queue
   ↓
8. Workers pick up job → process images concurrently
   ↓
9. Update progress in Redis (for real-time tracking)
   ↓
10. On completion: ZIP all images + send email
   ↓
11. Update batch status to 'completed'
```

---

## Prerequisites

### System Requirements
- **Node.js**: 20.x+ (or Bun 1.0+)
- **PostgreSQL**: 14.x+
- **Redis**: 7.x+
- **Memory**: 4GB+ RAM (8GB+ for production)
- **Storage**: 50GB+ (for image processing)

### External Services
- **HuggingFace Account**: Free tier for RMBG-1.4, RMBG-2.0
- **Segmind API Key**: Paid API for BiRefNet models
- **SMTP Server**: For email notifications (optional)
- **S3 Bucket**: For cloud storage (optional, can use local FS)

### Development Tools
- **Git**: For version control
- **Docker**: For local Redis (optional)
- **Postman/Insomnia**: For API testing
- **PM2**: For process management (production)

### API Keys Required

```bash
# .env file (copy from .env.example)
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxx
SEGMIND_API_KEY=SG_xxxxxxxxxxxxxxxxxxxxx
DATABASE_URL=postgresql://user:pass@localhost:5432/lumiku
REDIS_URL=redis://localhost:6379
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Cost Estimates (Monthly)

| Service | Tier | Est. Cost |
|---------|------|-----------|
| HuggingFace | Free (rate-limited) | $0 |
| Segmind | Pay-per-use | $50-200 |
| Redis Cloud | 30MB (free) | $0 |
| PostgreSQL | 1GB (free tier) | $0 |
| SMTP (Gmail) | Free quota | $0 |
| **Total (startup)** | | **$50-200/mo** |

---

## Project Structure

```
lumiku-app/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── background-remover/
│   │   │   │   ├── controllers/
│   │   │   │   │   ├── removal.controller.ts          # Main API endpoints
│   │   │   │   │   ├── batch.controller.ts            # Batch operations
│   │   │   │   │   ├── subscription.controller.ts     # Quota management
│   │   │   │   │   └── integration.controller.ts      # Cross-app endpoints
│   │   │   │   ├── services/
│   │   │   │   │   ├── removal.service.ts             # Core removal logic
│   │   │   │   │   ├── pricing.service.ts             # Credit calculations
│   │   │   │   │   ├── queue.service.ts               # BullMQ management
│   │   │   │   │   ├── ai-provider.service.ts         # API abstraction
│   │   │   │   │   ├── storage.service.ts             # File management
│   │   │   │   │   └── notification.service.ts        # Email sending
│   │   │   │   ├── workers/
│   │   │   │   │   ├── batch-processor.worker.ts      # Main worker
│   │   │   │   │   └── cleanup.worker.ts              # Cleanup old files
│   │   │   │   ├── validators/
│   │   │   │   │   ├── removal.validator.ts           # Request validation
│   │   │   │   │   └── batch.validator.ts             # Batch validation
│   │   │   │   ├── types/
│   │   │   │   │   ├── removal.types.ts               # TypeScript interfaces
│   │   │   │   │   └── pricing.types.ts               # Pricing types
│   │   │   │   ├── config/
│   │   │   │   │   ├── tiers.config.ts                # Tier definitions
│   │   │   │   │   ├── pricing.config.ts              # Pricing rules
│   │   │   │   │   └── queue.config.ts                # Queue settings
│   │   │   │   └── routes.ts                          # Route definitions
│   │   │   └── ... (other modules)
│   │   ├── prisma/
│   │   │   ├── schema.prisma                          # Database schema
│   │   │   └── migrations/                            # Migration files
│   │   ├── shared/
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.ts                 # JWT validation
│   │   │   │   └── credit-check.middleware.ts         # Credit validation
│   │   │   └── utils/
│   │   │       ├── logger.ts                          # Winston logger
│   │   │       └── error-handler.ts                   # Error handling
│   │   ├── index.ts                                   # API entry point
│   │   └── worker.ts                                  # Worker entry point
├── frontend/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/
│   │   │   │   ├── background-remover/
│   │   │   │   │   ├── SingleRemover.svelte           # Single image UI
│   │   │   │   │   ├── BatchRemover.svelte            # Batch upload UI
│   │   │   │   │   ├── TierSelector.svelte            # Quality selector
│   │   │   │   │   ├── PricingCalculator.svelte       # Cost estimator
│   │   │   │   │   ├── ProgressTracker.svelte         # Real-time progress
│   │   │   │   │   └── QuotaDisplay.svelte            # Subscription usage
│   │   │   ├── stores/
│   │   │   │   └── background-remover.store.ts        # Zustand store
│   │   │   ├── api/
│   │   │   │   └── background-remover.api.ts          # API client
│   │   │   └── types/
│   │   │       └── background-remover.types.ts        # Frontend types
│   │   └── routes/
│   │       └── background-remover/
│   │           ├── +page.svelte                       # Main page
│   │           └── batch/[id]/+page.svelte            # Batch status page
├── docs/
│   ├── IMPLEMENTATION_GUIDE.md                        # This file
│   ├── DATABASE_SCHEMA.md                             # Database docs
│   ├── API_DOCUMENTATION.md                           # API reference
│   ├── PRICING_LOGIC.md                               # Pricing details
│   ├── QUEUE_SYSTEM.md                                # BullMQ docs
│   ├── INTEGRATION_GUIDE.md                           # Cross-app integration
│   ├── FRONTEND_COMPONENTS.md                         # UI components
│   ├── DEPLOYMENT.md                                  # Deployment guide
│   ├── TESTING_STRATEGY.md                            # Testing docs
│   └── RISK_MITIGATION.md                             # Risk management
└── scripts/
    ├── setup-background-remover.sh                    # Initial setup
    ├── start-workers.sh                               # Worker launcher
    └── cleanup-old-images.sh                          # Maintenance script
```

---

## Phase 1: Database & Core Models

### Step 1.1: Install Dependencies

```bash
# Navigate to backend directory
cd backend

# Install dependencies
bun install prisma @prisma/client
bun install bullmq ioredis
bun install sharp archiver
bun install nodemailer
bun install zod # For validation
bun install winston # For logging

# Install dev dependencies
bun install -D @types/nodemailer @types/archiver
```

### Step 1.2: Configure Prisma

```bash
# Initialize Prisma (if not done)
bunx prisma init

# This creates:
# - prisma/schema.prisma
# - .env (with DATABASE_URL)
```

### Step 1.3: Define Database Schema

Create or update `prisma/schema.prisma`:

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Main table: Tracks individual removal jobs
model background_removal_jobs {
  id                String   @id @default(cuid())
  user_id           String
  tier              String   // 'basic' | 'standard' | 'professional' | 'industry'

  // File paths
  original_url      String
  processed_url     String?

  // Pricing
  credits_used      Int
  pricing_type      String   // 'subscription' | 'credits'

  // Status
  status            String   // 'pending' | 'processing' | 'completed' | 'failed'
  error_message     String?

  // Performance tracking
  processing_time_ms Int?
  ai_provider       String   // 'huggingface' | 'segmind'
  model_name        String   // 'rmbg-1.4' | 'rmbg-2.0' | 'birefnet-general' | 'birefnet-portrait'

  // Metadata
  file_size_bytes   Int
  image_width       Int?
  image_height      Int?
  format            String   // 'png' | 'jpg' | 'webp'

  // Relationships
  batch_id          String?
  batch_item        background_removal_batch_items? @relation(fields: [batch_id], references: [id])

  // Timestamps
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt

  // Indexes
  @@index([user_id, created_at])
  @@index([status, created_at])
  @@index([batch_id])
  @@index([tier, created_at])
}

// Table: Tracks batch removal jobs
model background_removal_batches {
  id                  String   @id @default(cuid())
  user_id             String
  tier                String

  // Batch metrics
  total_images        Int
  processed_images    Int      @default(0)
  failed_images       Int      @default(0)

  // Pricing
  total_credits       Int      // Total cost after volume discount
  base_credits        Int      // Cost before discount
  discount_percentage Int      // 0, 5, 10, 15, or 20
  discount_amount     Int      // Credits saved

  // Status
  status              String   // 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress_percentage Int      @default(0)

  // Queue
  queue_job_id        String?  // BullMQ job ID

  // Output
  zip_url             String?  // URL to download ZIP
  zip_size_bytes      Int?

  // Notifications
  email_sent          Boolean  @default(false)
  email_sent_at       DateTime?

  // Timestamps
  started_at          DateTime?
  completed_at        DateTime?
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt

  // Relationships
  items               background_removal_batch_items[]

  // Indexes
  @@index([user_id, created_at])
  @@index([status, created_at])
  @@index([queue_job_id])
}

// Table: Individual items in a batch
model background_removal_batch_items {
  id                String   @id @default(cuid())
  batch_id          String
  batch             background_removal_batches @relation(fields: [batch_id], references: [id], onDelete: Cascade)

  // File info
  original_filename String
  original_url      String
  processed_url     String?

  // Status
  status            String   // 'pending' | 'processing' | 'completed' | 'failed'
  error_message     String?

  // Performance
  processing_time_ms Int?
  retry_count       Int      @default(0)

  // Metadata
  file_size_bytes   Int
  position          Int      // Order in batch (0-499)

  // Timestamps
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  processed_at      DateTime?

  // Relationships
  job               background_removal_jobs?

  // Indexes
  @@index([batch_id, position])
  @@index([status])
}

// Table: Subscription plans for unlimited usage
model background_remover_subscriptions {
  id                String   @id @default(cuid())
  user_id           String   @unique
  plan              String   // 'starter' | 'pro'

  // Plan limits
  daily_quota       Int      // 50 for starter, 200 for pro
  allowed_tiers     String[] // ['basic', 'standard'] for starter

  // Tier-specific quotas (for Pro plan)
  professional_daily_quota Int @default(50)
  professional_used_today  Int @default(0)

  // Status
  status            String   // 'active' | 'cancelled' | 'expired'

  // Billing
  monthly_price     Int      // In IDR (99000 or 299000)
  next_billing_date DateTime

  // Timestamps
  subscribed_at     DateTime @default(now())
  cancelled_at      DateTime?
  expires_at        DateTime?

  // Relationships
  usage_logs        background_remover_subscription_usage[]

  @@index([user_id, status])
}

// Table: Daily usage tracking for subscriptions
model background_remover_subscription_usage {
  id                String   @id @default(cuid())
  subscription_id   String
  subscription      background_remover_subscriptions @relation(fields: [subscription_id], references: [id], onDelete: Cascade)

  user_id           String
  date              DateTime @db.Date
  tier              String

  // Usage counters
  removals_count    Int      @default(0)

  // Metadata
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt

  // Unique constraint: One record per user per day per tier
  @@unique([subscription_id, date, tier])
  @@index([user_id, date])
}
```

### Step 1.4: Run Migration

```bash
# Generate migration
bunx prisma migrate dev --name init_background_remover

# Generate Prisma Client
bunx prisma generate

# Verify database connection
bunx prisma db pull
```

### Step 1.5: Create Prisma Client Instance

```typescript
// src/shared/database/prisma.ts

import { PrismaClient } from '@prisma/client'

// Singleton pattern for Prisma Client
let prisma: PrismaClient

declare global {
  var __prisma: PrismaClient | undefined
}

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient()
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    })
  }
  prisma = global.__prisma
}

export default prisma

// Optional: Add middleware for logging slow queries
prisma.$use(async (params, next) => {
  const before = Date.now()
  const result = await next(params)
  const after = Date.now()

  const duration = after - before

  // Log slow queries (>1 second)
  if (duration > 1000) {
    console.warn(`Slow query detected: ${params.model}.${params.action} took ${duration}ms`)
  }

  return result
})
```

**See DATABASE_SCHEMA.md for detailed schema documentation, indexes, and migration strategies.**

---

## Phase 2: API Layer

### Step 2.1: Define Type System

```typescript
// src/modules/background-remover/types/removal.types.ts

export type RemovalTier = 'basic' | 'standard' | 'professional' | 'industry'
export type RemovalStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type PricingType = 'subscription' | 'credits'
export type AIProvider = 'huggingface' | 'segmind'

export interface TierConfig {
  name: RemovalTier
  displayName: string
  model: string
  provider: AIProvider
  creditsPerImage: number
  costInIDR: number // For display purposes
  hpp: number // Cost in IDR
  margin: number // Percentage
  description: string
  maxDailyQuota?: number // For pro plan
}

export interface RemovalRequest {
  userId: string
  tier: RemovalTier
  image: File | Buffer
  filename: string
  usageType: 'single' | 'batch'
}

export interface RemovalResponse {
  success: boolean
  jobId: string
  originalUrl: string
  processedUrl?: string
  creditsUsed: number
  pricingType: PricingType
  processingTimeMs?: number
  error?: string
}

export interface BatchRemovalRequest {
  userId: string
  tier: RemovalTier
  images: Array<{
    file: File | Buffer
    filename: string
  }>
}

export interface BatchRemovalResponse {
  success: boolean
  batchId: string
  totalImages: number
  totalCredits: number
  discountPercentage: number
  estimatedCompletionMinutes: number
}

export interface VolumeDiscount {
  minImages: number
  maxImages: number
  discountPercentage: number
}
```

### Step 2.2: Configure Tier Definitions

```typescript
// src/modules/background-remover/config/tiers.config.ts

import { TierConfig } from '../types/removal.types'

export const TIER_CONFIGS: Record<string, TierConfig> = {
  basic: {
    name: 'basic',
    displayName: 'Basic',
    model: 'briaai/RMBG-1.4',
    provider: 'huggingface',
    creditsPerImage: 3,
    costInIDR: 300,
    hpp: 17.5, // $0.00117 * 15000
    margin: 94.25,
    description: 'Fast removal for simple backgrounds',
  },
  standard: {
    name: 'standard',
    displayName: 'Standard',
    model: 'briaai/RMBG-2.0',
    provider: 'huggingface',
    creditsPerImage: 8,
    costInIDR: 800,
    hpp: 51.75, // $0.00345 * 15000
    margin: 93.53,
    description: 'Improved quality for most use cases',
  },
  professional: {
    name: 'professional',
    displayName: 'Professional',
    model: 'birefnet-general',
    provider: 'segmind',
    creditsPerImage: 15,
    costInIDR: 1500,
    hpp: 86.25, // $0.00575 * 15000
    margin: 94.25,
    description: 'High-quality removal for complex images',
    maxDailyQuota: 50, // For Pro plan
  },
  industry: {
    name: 'industry',
    displayName: 'Industry',
    model: 'birefnet-portrait',
    provider: 'segmind',
    creditsPerImage: 25,
    costInIDR: 2500,
    hpp: 138, // $0.0092 * 15000
    margin: 94.48,
    description: 'Best quality for portraits and products',
  },
}

export const VOLUME_DISCOUNTS = [
  { minImages: 1, maxImages: 19, discountPercentage: 0 },
  { minImages: 20, maxImages: 50, discountPercentage: 5 },
  { minImages: 51, maxImages: 100, discountPercentage: 10 },
  { minImages: 101, maxImages: 200, discountPercentage: 15 },
  { minImages: 201, maxImages: 500, discountPercentage: 20 },
]

export const SUBSCRIPTION_PLANS = {
  starter: {
    name: 'Starter',
    price: 99000, // IDR
    dailyQuota: 50,
    allowedTiers: ['basic', 'standard'],
  },
  pro: {
    name: 'Pro',
    price: 299000, // IDR
    dailyQuota: 200,
    allowedTiers: ['basic', 'standard', 'professional'],
    professionalDailyQuota: 50,
  },
}

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const MAX_BATCH_SIZE = 500
export const MAX_BATCH_TOTAL_SIZE = 2 * 1024 * 1024 * 1024 // 2GB
```

### Step 2.3: Implement Pricing Service

```typescript
// src/modules/background-remover/services/pricing.service.ts

import { TIER_CONFIGS, VOLUME_DISCOUNTS } from '../config/tiers.config'
import { RemovalTier } from '../types/removal.types'

export class PricingService {
  /**
   * Calculate cost for single image removal
   */
  calculateSingleImageCost(tier: RemovalTier): number {
    const config = TIER_CONFIGS[tier]
    if (!config) {
      throw new Error(`Invalid tier: ${tier}`)
    }
    return config.creditsPerImage
  }

  /**
   * Calculate cost for batch with volume discount
   * @returns Object with base cost, discount, and final cost
   */
  calculateBatchCost(tier: RemovalTier, imageCount: number) {
    if (imageCount < 1 || imageCount > 500) {
      throw new Error('Image count must be between 1 and 500')
    }

    const config = TIER_CONFIGS[tier]
    const baseCreditsPerImage = config.creditsPerImage
    const baseTotal = baseCreditsPerImage * imageCount

    // Find applicable discount
    const discount = VOLUME_DISCOUNTS.find(
      (d) => imageCount >= d.minImages && imageCount <= d.maxImages
    )

    if (!discount) {
      throw new Error(`No discount found for ${imageCount} images`)
    }

    const discountAmount = Math.floor(baseTotal * (discount.discountPercentage / 100))
    const finalTotal = baseTotal - discountAmount

    return {
      baseCreditsPerImage,
      baseTotal,
      discountPercentage: discount.discountPercentage,
      discountAmount,
      finalTotal,
      creditsPerImageAfterDiscount: finalTotal / imageCount,
    }
  }

  /**
   * Check if user has sufficient credits
   */
  async checkCreditBalance(userId: string, requiredCredits: number): Promise<boolean> {
    // TODO: Implement credit balance check from database
    // This should query the user's credit balance
    // For now, return true
    return true
  }

  /**
   * Deduct credits from user's balance
   */
  async deductCredits(userId: string, amount: number): Promise<void> {
    // TODO: Implement credit deduction
    // This should create a transaction record
    console.log(`Deducting ${amount} credits from user ${userId}`)
  }
}

export default new PricingService()
```

**See PRICING_LOGIC.md for detailed pricing calculations, formulas, and test cases.**

### Step 2.4: Implement AI Provider Service

```typescript
// src/modules/background-remover/services/ai-provider.service.ts

import { RemovalTier, AIProvider } from '../types/removal.types'
import { TIER_CONFIGS } from '../config/tiers.config'
import sharp from 'sharp'

export class AIProviderService {
  private huggingfaceKey: string
  private segmindKey: string

  constructor() {
    this.huggingfaceKey = process.env.HUGGINGFACE_API_KEY || ''
    this.segmindKey = process.env.SEGMIND_API_KEY || ''

    if (!this.huggingfaceKey) {
      throw new Error('HUGGINGFACE_API_KEY not configured')
    }
    if (!this.segmindKey) {
      throw new Error('SEGMIND_API_KEY not configured')
    }
  }

  /**
   * Remove background using appropriate AI model
   */
  async removeBackground(
    imageBuffer: Buffer,
    tier: RemovalTier
  ): Promise<{ processedBuffer: Buffer; processingTimeMs: number }> {
    const startTime = Date.now()
    const config = TIER_CONFIGS[tier]

    let processedBuffer: Buffer

    if (config.provider === 'huggingface') {
      processedBuffer = await this.callHuggingFace(imageBuffer, config.model)
    } else if (config.provider === 'segmind') {
      processedBuffer = await this.callSegmind(imageBuffer, config.model)
    } else {
      throw new Error(`Unknown provider: ${config.provider}`)
    }

    const processingTimeMs = Date.now() - startTime

    return { processedBuffer, processingTimeMs }
  }

  /**
   * Call HuggingFace Inference API
   */
  private async callHuggingFace(imageBuffer: Buffer, model: string): Promise<Buffer> {
    const url = `https://api-inference.huggingface.co/models/${model}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.huggingfaceKey}`,
        'Content-Type': 'application/octet-stream',
      },
      body: imageBuffer,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`HuggingFace API error: ${error}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  /**
   * Call Segmind API for BiRefNet models
   */
  private async callSegmind(imageBuffer: Buffer, model: string): Promise<Buffer> {
    // Convert buffer to base64 for Segmind
    const base64Image = imageBuffer.toString('base64')
    const dataUri = `data:image/png;base64,${base64Image}`

    // Map model names to Segmind endpoints
    const endpointMap: Record<string, string> = {
      'birefnet-general': 'birefnet-v1-lite',
      'birefnet-portrait': 'birefnet-portrait',
    }

    const endpoint = endpointMap[model]
    if (!endpoint) {
      throw new Error(`Unknown Segmind model: ${model}`)
    }

    const url = `https://api.segmind.com/v1/${endpoint}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': this.segmindKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: dataUri,
        output_format: 'png',
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Segmind API error: ${error}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  /**
   * Optimize processed image (reduce file size)
   */
  async optimizeImage(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
      .png({ compressionLevel: 9, quality: 90 })
      .toBuffer()
  }
}

export default new AIProviderService()
```

### Step 2.5: Implement Storage Service

```typescript
// src/modules/background-remover/services/storage.service.ts

import fs from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

export class StorageService {
  private uploadDir: string
  private processedDir: string
  private batchDir: string

  constructor() {
    const baseDir = process.env.STORAGE_DIR || './storage'
    this.uploadDir = path.join(baseDir, 'uploads', 'background-remover')
    this.processedDir = path.join(baseDir, 'processed', 'background-remover')
    this.batchDir = path.join(baseDir, 'batches')
  }

  async init() {
    await fs.mkdir(this.uploadDir, { recursive: true })
    await fs.mkdir(this.processedDir, { recursive: true })
    await fs.mkdir(this.batchDir, { recursive: true })
  }

  /**
   * Save uploaded image
   */
  async saveUploadedImage(
    userId: string,
    buffer: Buffer,
    filename: string
  ): Promise<{ path: string; url: string }> {
    const userDir = path.join(this.uploadDir, userId)
    await fs.mkdir(userDir, { recursive: true })

    const uniqueFilename = `${randomUUID()}-${filename}`
    const filePath = path.join(userDir, uniqueFilename)

    await fs.writeFile(filePath, buffer)

    // Generate URL (adjust based on your server config)
    const url = `/uploads/background-remover/${userId}/${uniqueFilename}`

    return { path: filePath, url }
  }

  /**
   * Save processed image
   */
  async saveProcessedImage(
    userId: string,
    buffer: Buffer,
    originalFilename: string
  ): Promise<{ path: string; url: string }> {
    const userDir = path.join(this.processedDir, userId)
    await fs.mkdir(userDir, { recursive: true })

    // Add timestamp to filename
    const ext = path.extname(originalFilename)
    const name = path.basename(originalFilename, ext)
    const uniqueFilename = `${name}-${Date.now()}-removed${ext}`
    const filePath = path.join(userDir, uniqueFilename)

    await fs.writeFile(filePath, buffer)

    const url = `/processed/background-remover/${userId}/${uniqueFilename}`

    return { path: filePath, url }
  }

  /**
   * Get file size in bytes
   */
  async getFileSize(filePath: string): Promise<number> {
    const stats = await fs.stat(filePath)
    return stats.size
  }

  /**
   * Delete file
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath)
    } catch (error) {
      console.error(`Failed to delete file ${filePath}:`, error)
    }
  }

  /**
   * Clean up old files (older than X days)
   */
  async cleanupOldFiles(daysOld: number = 30): Promise<number> {
    const cutoffDate = Date.now() - daysOld * 24 * 60 * 60 * 1000
    let deletedCount = 0

    const dirs = [this.uploadDir, this.processedDir, this.batchDir]

    for (const dir of dirs) {
      deletedCount += await this.cleanupDirectory(dir, cutoffDate)
    }

    return deletedCount
  }

  private async cleanupDirectory(dir: string, cutoffDate: number): Promise<number> {
    let count = 0

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
          count += await this.cleanupDirectory(fullPath, cutoffDate)
        } else {
          const stats = await fs.stat(fullPath)
          if (stats.mtimeMs < cutoffDate) {
            await fs.unlink(fullPath)
            count++
          }
        }
      }
    } catch (error) {
      console.error(`Error cleaning directory ${dir}:`, error)
    }

    return count
  }
}

export default new StorageService()
```

### Step 2.6: Implement Main Removal Service

```typescript
// src/modules/background-remover/services/removal.service.ts

import prisma from '../../../shared/database/prisma'
import aiProviderService from './ai-provider.service'
import storageService from './storage.service'
import pricingService from './pricing.service'
import { RemovalRequest, RemovalResponse } from '../types/removal.types'
import sharp from 'sharp'

export class RemovalService {
  /**
   * Process single image removal (synchronous)
   */
  async processSingleImage(request: RemovalRequest): Promise<RemovalResponse> {
    const { userId, tier, image, filename } = request

    try {
      // Step 1: Validate and save uploaded image
      const imageBuffer = Buffer.isBuffer(image) ? image : await this.fileToBuffer(image)
      const { url: originalUrl, path: originalPath } = await storageService.saveUploadedImage(
        userId,
        imageBuffer,
        filename
      )

      // Step 2: Get image metadata
      const metadata = await sharp(imageBuffer).metadata()
      const fileSize = await storageService.getFileSize(originalPath)

      // Step 3: Calculate cost
      const creditsRequired = pricingService.calculateSingleImageCost(tier)

      // Step 4: Check subscription or credit balance
      const pricingType = await this.determinePricingType(userId, tier, creditsRequired)

      if (pricingType === 'credits') {
        const hasCredits = await pricingService.checkCreditBalance(userId, creditsRequired)
        if (!hasCredits) {
          throw new Error('Insufficient credits')
        }
      } else {
        // Check subscription quota
        const canUseSubscription = await this.checkSubscriptionQuota(userId, tier)
        if (!canUseSubscription) {
          throw new Error('Daily quota exceeded')
        }
      }

      // Step 5: Create pending job record
      const job = await prisma.background_removal_jobs.create({
        data: {
          user_id: userId,
          tier,
          original_url: originalUrl,
          status: 'processing',
          credits_used: creditsRequired,
          pricing_type: pricingType,
          file_size_bytes: fileSize,
          image_width: metadata.width,
          image_height: metadata.height,
          format: metadata.format || 'unknown',
          ai_provider: aiProviderService.getProvider(tier),
          model_name: aiProviderService.getModelName(tier),
        },
      })

      // Step 6: Process image with AI
      const { processedBuffer, processingTimeMs } = await aiProviderService.removeBackground(
        imageBuffer,
        tier
      )

      // Step 7: Optimize and save processed image
      const optimizedBuffer = await aiProviderService.optimizeImage(processedBuffer)
      const { url: processedUrl } = await storageService.saveProcessedImage(
        userId,
        optimizedBuffer,
        filename
      )

      // Step 8: Deduct credits or increment quota
      if (pricingType === 'credits') {
        await pricingService.deductCredits(userId, creditsRequired)
      } else {
        await this.incrementSubscriptionUsage(userId, tier)
      }

      // Step 9: Update job as completed
      await prisma.background_removal_jobs.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          processed_url: processedUrl,
          processing_time_ms: processingTimeMs,
        },
      })

      return {
        success: true,
        jobId: job.id,
        originalUrl,
        processedUrl,
        creditsUsed: creditsRequired,
        pricingType,
        processingTimeMs,
      }
    } catch (error: any) {
      console.error('Error processing image:', error)

      return {
        success: false,
        jobId: '',
        originalUrl: '',
        creditsUsed: 0,
        pricingType: 'credits',
        error: error.message,
      }
    }
  }

  /**
   * Determine pricing type (subscription vs credits)
   */
  private async determinePricingType(
    userId: string,
    tier: string,
    creditsRequired: number
  ): Promise<'subscription' | 'credits'> {
    // Check if user has active subscription
    const subscription = await prisma.background_remover_subscriptions.findFirst({
      where: {
        user_id: userId,
        status: 'active',
        expires_at: {
          gte: new Date(),
        },
      },
    })

    if (!subscription) {
      return 'credits'
    }

    // Check if tier is allowed in plan
    if (!subscription.allowed_tiers.includes(tier)) {
      return 'credits'
    }

    // Check if daily quota is available
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayUsage = await prisma.background_remover_subscription_usage.findFirst({
      where: {
        subscription_id: subscription.id,
        date: today,
        tier,
      },
    })

    const usedToday = todayUsage?.removals_count || 0

    // Check tier-specific quota for Professional tier
    if (tier === 'professional' && subscription.plan === 'pro') {
      if (usedToday >= subscription.professional_daily_quota) {
        return 'credits'
      }
    }

    // Check general quota
    if (usedToday >= subscription.daily_quota) {
      return 'credits'
    }

    return 'subscription'
  }

  /**
   * Check subscription quota availability
   */
  private async checkSubscriptionQuota(userId: string, tier: string): Promise<boolean> {
    const subscription = await prisma.background_remover_subscriptions.findFirst({
      where: {
        user_id: userId,
        status: 'active',
      },
    })

    if (!subscription) return false

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayUsage = await prisma.background_remover_subscription_usage.findFirst({
      where: {
        subscription_id: subscription.id,
        date: today,
        tier,
      },
    })

    const usedToday = todayUsage?.removals_count || 0

    if (tier === 'professional' && subscription.plan === 'pro') {
      return usedToday < subscription.professional_daily_quota
    }

    return usedToday < subscription.daily_quota
  }

  /**
   * Increment subscription usage
   */
  private async incrementSubscriptionUsage(userId: string, tier: string): Promise<void> {
    const subscription = await prisma.background_remover_subscriptions.findFirst({
      where: {
        user_id: userId,
        status: 'active',
      },
    })

    if (!subscription) return

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    await prisma.background_remover_subscription_usage.upsert({
      where: {
        subscription_id_date_tier: {
          subscription_id: subscription.id,
          date: today,
          tier,
        },
      },
      create: {
        subscription_id: subscription.id,
        user_id: userId,
        date: today,
        tier,
        removals_count: 1,
      },
      update: {
        removals_count: {
          increment: 1,
        },
      },
    })
  }

  private async fileToBuffer(file: File): Promise<Buffer> {
    const arrayBuffer = await file.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }
}

export default new RemovalService()
```

**See API_DOCUMENTATION.md for complete API reference with all endpoints, request/response schemas, and examples.**

---

## Phase 3: Queue System

### Step 3.1: Install Queue Dependencies

```bash
cd backend

# Install BullMQ and Redis client
bun install bullmq ioredis

# Install archiver for ZIP creation
bun install archiver

# Install types
bun install -D @types/archiver
```

### Step 3.2: Configure Redis Connection

```typescript
// src/modules/background-remover/config/redis.config.ts

import { ConnectionOptions } from 'bullmq'

export const redisConnection: ConnectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
}

export const QUEUE_NAMES = {
  BATCH_REMOVAL: 'background-remover:batch',
  CLEANUP: 'background-remover:cleanup',
}
```

### Step 3.3: Implement Queue Service

```typescript
// src/modules/background-remover/services/queue.service.ts

import { Queue, QueueEvents } from 'bullmq'
import { redisConnection, QUEUE_NAMES } from '../config/redis.config'
import Redis from 'ioredis'

export interface BatchJobData {
  batchId: string
  userId: string
  tier: string
  totalImages: number
}

export class QueueService {
  private batchQueue: Queue<BatchJobData>
  private queueEvents: QueueEvents
  private redis: Redis

  constructor() {
    this.redis = new Redis(redisConnection)

    this.batchQueue = new Queue<BatchJobData>(QUEUE_NAMES.BATCH_REMOVAL, {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000, // Start with 5 seconds
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

    this.queueEvents = new QueueEvents(QUEUE_NAMES.BATCH_REMOVAL, {
      connection: redisConnection,
    })

    this.setupEventListeners()
  }

  /**
   * Add batch processing job to queue
   */
  async addBatchJob(data: BatchJobData): Promise<string> {
    const job = await this.batchQueue.add('process-batch', data, {
      jobId: data.batchId,
      priority: this.calculatePriority(data.totalImages),
    })

    console.log(`Added batch job ${job.id} to queue`)
    return job.id!
  }

  /**
   * Get job progress from Redis
   */
  async getJobProgress(batchId: string): Promise<{
    processed: number
    total: number
    percentage: number
    status: string
  } | null> {
    const key = `batch:progress:${batchId}`
    const data = await this.redis.hgetall(key)

    if (!data || !data.total) {
      return null
    }

    const processed = parseInt(data.processed || '0')
    const total = parseInt(data.total)
    const percentage = Math.floor((processed / total) * 100)

    return {
      processed,
      total,
      percentage,
      status: data.status || 'unknown',
    }
  }

  /**
   * Update job progress in Redis
   */
  async updateJobProgress(
    batchId: string,
    processed: number,
    total: number,
    status: string
  ): Promise<void> {
    const key = `batch:progress:${batchId}`
    await this.redis.hset(key, {
      processed: processed.toString(),
      total: total.toString(),
      status,
      updated_at: Date.now().toString(),
    })

    // Expire key after 7 days
    await this.redis.expire(key, 604800)
  }

  /**
   * Remove job from queue
   */
  async removeJob(jobId: string): Promise<void> {
    const job = await this.batchQueue.getJob(jobId)
    if (job) {
      await job.remove()
    }
  }

  /**
   * Get queue metrics
   */
  async getQueueMetrics(): Promise<{
    waiting: number
    active: number
    completed: number
    failed: number
  }> {
    const [waiting, active, completed, failed] = await Promise.all([
      this.batchQueue.getWaitingCount(),
      this.batchQueue.getActiveCount(),
      this.batchQueue.getCompletedCount(),
      this.batchQueue.getFailedCount(),
    ])

    return { waiting, active, completed, failed }
  }

  /**
   * Pause queue
   */
  async pauseQueue(): Promise<void> {
    await this.batchQueue.pause()
  }

  /**
   * Resume queue
   */
  async resumeQueue(): Promise<void> {
    await this.batchQueue.resume()
  }

  /**
   * Calculate job priority based on image count
   * Smaller batches get higher priority
   */
  private calculatePriority(imageCount: number): number {
    if (imageCount <= 10) return 1 // Highest priority
    if (imageCount <= 50) return 2
    if (imageCount <= 100) return 3
    if (imageCount <= 200) return 4
    return 5 // Lowest priority
  }

  /**
   * Setup event listeners for monitoring
   */
  private setupEventListeners(): void {
    this.queueEvents.on('completed', ({ jobId }) => {
      console.log(`Job ${jobId} completed`)
    })

    this.queueEvents.on('failed', ({ jobId, failedReason }) => {
      console.error(`Job ${jobId} failed: ${failedReason}`)
    })

    this.queueEvents.on('progress', ({ jobId, data }) => {
      console.log(`Job ${jobId} progress:`, data)
    })
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    await this.batchQueue.close()
    await this.queueEvents.close()
    await this.redis.quit()
  }
}

export default new QueueService()
```

### Step 3.4: Implement Batch Worker

```typescript
// src/modules/background-remover/workers/batch-processor.worker.ts

import { Worker, Job } from 'bullmq'
import { redisConnection, QUEUE_NAMES } from '../config/redis.config'
import { BatchJobData } from '../services/queue.service'
import prisma from '../../../shared/database/prisma'
import aiProviderService from '../services/ai-provider.service'
import storageService from '../services/storage.service'
import queueService from '../services/queue.service'
import archiver from 'archiver'
import fs from 'fs'
import path from 'path'
import os from 'os'

class BatchProcessorWorker {
  private worker: Worker<BatchJobData>
  private concurrency: number

  constructor() {
    // Adaptive concurrency based on CPU cores
    const cpuCount = os.cpus().length
    this.concurrency = Math.min(Math.max(cpuCount - 1, 5), 20)

    console.log(`Starting batch worker with concurrency: ${this.concurrency}`)

    this.worker = new Worker<BatchJobData>(
      QUEUE_NAMES.BATCH_REMOVAL,
      async (job) => this.processJob(job),
      {
        connection: redisConnection,
        concurrency: this.concurrency,
        limiter: {
          max: 10, // Max 10 jobs per second
          duration: 1000,
        },
      }
    )

    this.setupEventHandlers()
  }

  /**
   * Main job processing function
   */
  private async processJob(job: Job<BatchJobData>): Promise<void> {
    const { batchId, userId, tier } = job.data

    console.log(`Processing batch ${batchId} for user ${userId}`)

    try {
      // Step 1: Get batch and items from database
      const batch = await prisma.background_removal_batches.findUnique({
        where: { id: batchId },
        include: {
          items: {
            orderBy: { position: 'asc' },
          },
        },
      })

      if (!batch) {
        throw new Error(`Batch ${batchId} not found`)
      }

      // Step 2: Update batch status
      await prisma.background_removal_batches.update({
        where: { id: batchId },
        data: {
          status: 'processing',
          started_at: new Date(),
        },
      })

      // Step 3: Process items in chunks
      const items = batch.items
      const chunkSize = this.concurrency
      let processedCount = 0
      let failedCount = 0

      for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize)

        const results = await Promise.allSettled(
          chunk.map((item) => this.processItem(item, tier))
        )

        // Count successes and failures
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            processedCount++
          } else {
            failedCount++
            console.error(`Failed to process item ${chunk[index].id}:`, result.reason)
          }
        })

        // Update progress
        const progress = Math.floor((processedCount / items.length) * 100)
        await job.updateProgress(progress)
        await queueService.updateJobProgress(
          batchId,
          processedCount,
          items.length,
          'processing'
        )

        await prisma.background_removal_batches.update({
          where: { id: batchId },
          data: {
            processed_images: processedCount,
            failed_images: failedCount,
            progress_percentage: progress,
          },
        })
      }

      // Step 4: Create ZIP archive
      const zipPath = await this.createZipArchive(batchId, userId, items)

      // Step 5: Update batch as completed
      await prisma.background_removal_batches.update({
        where: { id: batchId },
        data: {
          status: 'completed',
          completed_at: new Date(),
          zip_url: `/batches/${batchId}.zip`,
          progress_percentage: 100,
        },
      })

      await queueService.updateJobProgress(batchId, processedCount, items.length, 'completed')

      // Step 6: Send email notification
      await this.sendCompletionEmail(userId, batchId, processedCount, failedCount)

      console.log(`Batch ${batchId} completed: ${processedCount} success, ${failedCount} failed`)
    } catch (error: any) {
      console.error(`Error processing batch ${batchId}:`, error)

      await prisma.background_removal_batches.update({
        where: { id: batchId },
        data: {
          status: 'failed',
          completed_at: new Date(),
        },
      })

      await queueService.updateJobProgress(batchId, 0, 0, 'failed')

      throw error
    }
  }

  /**
   * Process single item in batch
   */
  private async processItem(
    item: any,
    tier: string
  ): Promise<void> {
    const startTime = Date.now()

    try {
      // Update item status
      await prisma.background_removal_batch_items.update({
        where: { id: item.id },
        data: { status: 'processing' },
      })

      // Read original image
      const imageBuffer = await fs.promises.readFile(item.original_url)

      // Process with AI
      const { processedBuffer, processingTimeMs } = await aiProviderService.removeBackground(
        imageBuffer,
        tier
      )

      // Optimize
      const optimizedBuffer = await aiProviderService.optimizeImage(processedBuffer)

      // Save processed image
      const { url: processedUrl } = await storageService.saveProcessedImage(
        item.batch.user_id,
        optimizedBuffer,
        item.original_filename
      )

      // Update item as completed
      await prisma.background_removal_batch_items.update({
        where: { id: item.id },
        data: {
          status: 'completed',
          processed_url: processedUrl,
          processing_time_ms: processingTimeMs,
          processed_at: new Date(),
        },
      })

      // Create job record
      await prisma.background_removal_jobs.create({
        data: {
          user_id: item.batch.user_id,
          tier,
          original_url: item.original_url,
          processed_url: processedUrl,
          status: 'completed',
          credits_used: 0, // Already deducted at batch level
          pricing_type: 'credits',
          file_size_bytes: item.file_size_bytes,
          processing_time_ms: processingTimeMs,
          ai_provider: aiProviderService.getProvider(tier),
          model_name: aiProviderService.getModelName(tier),
          batch_id: item.id,
        },
      })
    } catch (error: any) {
      console.error(`Error processing item ${item.id}:`, error)

      await prisma.background_removal_batch_items.update({
        where: { id: item.id },
        data: {
          status: 'failed',
          error_message: error.message,
          retry_count: { increment: 1 },
        },
      })

      throw error
    }
  }

  /**
   * Create ZIP archive of all processed images
   */
  private async createZipArchive(
    batchId: string,
    userId: string,
    items: any[]
  ): Promise<string> {
    const zipPath = path.join(storageService.batchDir, `${batchId}.zip`)
    const output = fs.createWriteStream(zipPath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    return new Promise((resolve, reject) => {
      output.on('close', () => {
        console.log(`ZIP created: ${archive.pointer()} bytes`)
        resolve(zipPath)
      })

      archive.on('error', (err) => {
        reject(err)
      })

      archive.pipe(output)

      // Add all processed images
      for (const item of items) {
        if (item.status === 'completed' && item.processed_url) {
          const filePath = item.processed_url // Adjust if needed
          archive.file(filePath, { name: `removed-${item.original_filename}` })
        }
      }

      archive.finalize()
    })
  }

  /**
   * Send completion email
   */
  private async sendCompletionEmail(
    userId: string,
    batchId: string,
    successCount: number,
    failedCount: number
  ): Promise<void> {
    // TODO: Implement email sending
    console.log(`Sending email to user ${userId} for batch ${batchId}`)
    console.log(`Success: ${successCount}, Failed: ${failedCount}`)
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.worker.on('completed', (job) => {
      console.log(`Job ${job.id} completed`)
    })

    this.worker.on('failed', (job, err) => {
      console.error(`Job ${job?.id} failed:`, err)
    })

    this.worker.on('error', (err) => {
      console.error('Worker error:', err)
    })
  }

  /**
   * Close worker
   */
  async close(): Promise<void> {
    await this.worker.close()
  }
}

// Start worker if this file is run directly
if (require.main === module) {
  const worker = new BatchProcessorWorker()

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing worker...')
    await worker.close()
    process.exit(0)
  })
}

export default BatchProcessorWorker
```

**See QUEUE_SYSTEM.md for complete queue architecture, job flow, concurrency strategies, and monitoring setup.**

---

## Phase 4: Frontend Implementation

### Step 4.1: Create Zustand Store

```typescript
// frontend/src/lib/stores/background-remover.store.ts

import { create } from 'zustand'
import { RemovalTier } from '../types/background-remover.types'

interface RemovalJob {
  id: string
  originalUrl: string
  processedUrl?: string
  status: 'processing' | 'completed' | 'failed'
  tier: RemovalTier
  creditsUsed: number
  error?: string
}

interface BatchJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  totalImages: number
  processedImages: number
  failedImages: number
  progressPercentage: number
  totalCredits: number
  discountPercentage: number
  zipUrl?: string
}

interface BackgroundRemoverStore {
  // Single removal
  currentJob: RemovalJob | null
  isProcessing: boolean

  // Batch removal
  currentBatch: BatchJob | null
  uploadedFiles: File[]
  selectedTier: RemovalTier

  // Subscription
  subscriptionPlan: 'none' | 'starter' | 'pro'
  dailyQuotaUsed: number
  dailyQuotaLimit: number

  // Actions
  setSelectedTier: (tier: RemovalTier) => void
  addFiles: (files: File[]) => void
  removeFile: (index: number) => void
  clearFiles: () => void
  setCurrentJob: (job: RemovalJob | null) => void
  setCurrentBatch: (batch: BatchJob | null) => void
  updateBatchProgress: (progress: Partial<BatchJob>) => void
  setSubscriptionInfo: (plan: string, used: number, limit: number) => void
}

export const useBackgroundRemoverStore = create<BackgroundRemoverStore>((set) => ({
  // Initial state
  currentJob: null,
  isProcessing: false,
  currentBatch: null,
  uploadedFiles: [],
  selectedTier: 'standard',
  subscriptionPlan: 'none',
  dailyQuotaUsed: 0,
  dailyQuotaLimit: 0,

  // Actions
  setSelectedTier: (tier) => set({ selectedTier: tier }),

  addFiles: (files) =>
    set((state) => ({
      uploadedFiles: [...state.uploadedFiles, ...files].slice(0, 500),
    })),

  removeFile: (index) =>
    set((state) => ({
      uploadedFiles: state.uploadedFiles.filter((_, i) => i !== index),
    })),

  clearFiles: () => set({ uploadedFiles: [] }),

  setCurrentJob: (job) =>
    set({
      currentJob: job,
      isProcessing: job?.status === 'processing',
    }),

  setCurrentBatch: (batch) => set({ currentBatch: batch }),

  updateBatchProgress: (progress) =>
    set((state) => ({
      currentBatch: state.currentBatch
        ? { ...state.currentBatch, ...progress }
        : null,
    })),

  setSubscriptionInfo: (plan, used, limit) =>
    set({
      subscriptionPlan: plan as any,
      dailyQuotaUsed: used,
      dailyQuotaLimit: limit,
    }),
}))
```

### Step 4.2: Create API Client

```typescript
// frontend/src/lib/api/background-remover.api.ts

import { RemovalTier } from '../types/background-remover.types'

const API_BASE = '/api/background-remover'

export const backgroundRemoverAPI = {
  /**
   * Remove background from single image
   */
  async removeSingle(file: File, tier: RemovalTier) {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('tier', tier)

    const response = await fetch(`${API_BASE}/remove`, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to remove background')
    }

    return response.json()
  },

  /**
   * Start batch removal
   */
  async removeBatch(files: File[], tier: RemovalTier) {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('images', file)
    })
    formData.append('tier', tier)

    const response = await fetch(`${API_BASE}/batch`, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to start batch removal')
    }

    return response.json()
  },

  /**
   * Get batch progress
   */
  async getBatchProgress(batchId: string) {
    const response = await fetch(`${API_BASE}/batch/${batchId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get batch progress')
    }

    return response.json()
  },

  /**
   * Calculate pricing
   */
  async calculatePrice(imageCount: number, tier: RemovalTier) {
    const response = await fetch(`${API_BASE}/pricing/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ imageCount, tier }),
    })

    if (!response.ok) {
      throw new Error('Failed to calculate price')
    }

    return response.json()
  },

  /**
   * Get subscription info
   */
  async getSubscription() {
    const response = await fetch(`${API_BASE}/subscription`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get subscription info')
    }

    return response.json()
  },
}
```

### Step 4.3: Create Main Component

```svelte
<!-- frontend/src/lib/components/background-remover/BackgroundRemover.svelte -->

<script lang="ts">
  import { onMount } from 'svelte'
  import { useBackgroundRemoverStore } from '../../stores/background-remover.store'
  import { backgroundRemoverAPI } from '../../api/background-remover.api'
  import TierSelector from './TierSelector.svelte'
  import FileUploader from './FileUploader.svelte'
  import PricingCalculator from './PricingCalculator.svelte'
  import ProgressTracker from './ProgressTracker.svelte'
  import QuotaDisplay from './QuotaDisplay.svelte'

  const store = useBackgroundRemoverStore()

  let mode: 'single' | 'batch' = 'single'
  let isProcessing = false
  let error: string | null = null

  onMount(async () => {
    // Load subscription info
    try {
      const subscription = await backgroundRemoverAPI.getSubscription()
      store.setSubscriptionInfo(
        subscription.plan,
        subscription.dailyUsed,
        subscription.dailyLimit
      )
    } catch (err) {
      console.error('Failed to load subscription:', err)
    }
  })

  async function handleSingleRemoval(file: File) {
    isProcessing = true
    error = null

    try {
      const result = await backgroundRemoverAPI.removeSingle(
        file,
        $store.selectedTier
      )

      store.setCurrentJob({
        id: result.jobId,
        originalUrl: result.originalUrl,
        processedUrl: result.processedUrl,
        status: 'completed',
        tier: $store.selectedTier,
        creditsUsed: result.creditsUsed,
      })
    } catch (err: any) {
      error = err.message
    } finally {
      isProcessing = false
    }
  }

  async function handleBatchRemoval() {
    if ($store.uploadedFiles.length === 0) {
      error = 'Please upload at least one image'
      return
    }

    isProcessing = true
    error = null

    try {
      const result = await backgroundRemoverAPI.removeBatch(
        $store.uploadedFiles,
        $store.selectedTier
      )

      store.setCurrentBatch({
        id: result.batchId,
        status: 'processing',
        totalImages: result.totalImages,
        processedImages: 0,
        failedImages: 0,
        progressPercentage: 0,
        totalCredits: result.totalCredits,
        discountPercentage: result.discountPercentage,
      })

      // Start polling for progress
      startProgressPolling(result.batchId)
    } catch (err: any) {
      error = err.message
    } finally {
      isProcessing = false
    }
  }

  function startProgressPolling(batchId: string) {
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

        if (progress.status === 'completed' || progress.status === 'failed') {
          clearInterval(interval)
        }
      } catch (err) {
        console.error('Failed to fetch progress:', err)
        clearInterval(interval)
      }
    }, 2000) // Poll every 2 seconds
  }
</script>

<div class="background-remover">
  <header>
    <h1>Background Remover Pro</h1>
    <p>Professional background removal with AI</p>
  </header>

  {#if $store.subscriptionPlan !== 'none'}
    <QuotaDisplay
      plan={$store.subscriptionPlan}
      used={$store.dailyQuotaUsed}
      limit={$store.dailyQuotaLimit}
    />
  {/if}

  <div class="mode-selector">
    <button
      class:active={mode === 'single'}
      on:click={() => (mode = 'single')}
    >
      Single Image
    </button>
    <button
      class:active={mode === 'batch'}
      on:click={() => (mode = 'batch')}
    >
      Batch (up to 500)
    </button>
  </div>

  <TierSelector
    selected={$store.selectedTier}
    on:change={(e) => store.setSelectedTier(e.detail)}
  />

  {#if mode === 'single'}
    <FileUploader
      multiple={false}
      on:upload={(e) => handleSingleRemoval(e.detail[0])}
    />
  {:else}
    <FileUploader
      multiple={true}
      maxFiles={500}
      on:upload={(e) => store.addFiles(e.detail)}
    />

    <PricingCalculator
      imageCount={$store.uploadedFiles.length}
      tier={$store.selectedTier}
    />

    <button
      class="start-batch"
      disabled={isProcessing || $store.uploadedFiles.length === 0}
      on:click={handleBatchRemoval}
    >
      {isProcessing ? 'Starting...' : `Start Batch (${$store.uploadedFiles.length} images)`}
    </button>
  {/if}

  {#if error}
    <div class="error">{error}</div>
  {/if}

  {#if $store.currentJob}
    <div class="result">
      <h3>Result</h3>
      <img src={$store.currentJob.processedUrl} alt="Processed" />
      <a href={$store.currentJob.processedUrl} download>Download</a>
    </div>
  {/if}

  {#if $store.currentBatch}
    <ProgressTracker batch={$store.currentBatch} />
  {/if}
</div>

<style>
  .background-remover {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .mode-selector {
    display: flex;
    gap: 1rem;
    margin: 2rem 0;
  }

  .mode-selector button {
    flex: 1;
    padding: 1rem;
    border: 2px solid #ddd;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
  }

  .mode-selector button.active {
    border-color: #0066cc;
    background: #0066cc;
    color: white;
  }

  .start-batch {
    width: 100%;
    padding: 1rem;
    background: #0066cc;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1.1rem;
    margin-top: 1rem;
  }

  .start-batch:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error {
    padding: 1rem;
    background: #ffebee;
    color: #c62828;
    border-radius: 4px;
    margin-top: 1rem;
  }

  .result {
    margin-top: 2rem;
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 4px;
  }

  .result img {
    max-width: 100%;
    margin: 1rem 0;
  }
</style>
```

**See FRONTEND_COMPONENTS.md for complete component implementation, TypeScript types, and real-time progress tracking.**

---

## Phase 5: Integration Layer

### Step 5.1: Create Integration Controller

```typescript
// src/modules/background-remover/controllers/integration.controller.ts

import { Elysia, t } from 'elysia'
import prisma from '../../../shared/database/prisma'
import removalService from '../services/removal.service'

export const integrationController = new Elysia({ prefix: '/integrations' })
  /**
   * Avatar Creator: Remove backgrounds from all avatars in project
   */
  .post(
    '/avatar-creator/batch-remove',
    async ({ body, user }) => {
      const { projectId, tier } = body

      // Get all avatars in project
      const avatars = await prisma.avatars.findMany({
        where: { project_id: projectId, user_id: user.id },
      })

      if (avatars.length === 0) {
        return { success: false, message: 'No avatars found' }
      }

      // Create batch removal job
      const images = avatars.map((avatar) => ({
        file: avatar.image_url,
        filename: `avatar-${avatar.id}.png`,
      }))

      const batchResult = await removalService.processBatch({
        userId: user.id,
        tier,
        images,
      })

      return {
        success: true,
        batchId: batchResult.batchId,
        totalAvatars: avatars.length,
        totalCredits: batchResult.totalCredits,
      }
    },
    {
      body: t.Object({
        projectId: t.String(),
        tier: t.Union([
          t.Literal('basic'),
          t.Literal('standard'),
          t.Literal('professional'),
          t.Literal('industry'),
        ]),
      }),
    }
  )

  /**
   * Pose Generator: Auto-remove background after generation
   */
  .post(
    '/pose-generator/auto-remove',
    async ({ body, user }) => {
      const { generatedImageId, tier } = body

      // Get generated image
      const generatedImage = await prisma.pose_generator_outputs.findFirst({
        where: { id: generatedImageId, user_id: user.id },
      })

      if (!generatedImage) {
        return { success: false, message: 'Generated image not found' }
      }

      // Process single image
      const result = await removalService.processSingleImage({
        userId: user.id,
        tier,
        image: generatedImage.output_url,
        filename: `pose-${generatedImageId}.png`,
        usageType: 'single',
      })

      // Update pose generator output with removed background version
      if (result.success) {
        await prisma.pose_generator_outputs.update({
          where: { id: generatedImageId },
          data: {
            background_removed_url: result.processedUrl,
          },
        })
      }

      return result
    },
    {
      body: t.Object({
        generatedImageId: t.String(),
        tier: t.Union([
          t.Literal('basic'),
          t.Literal('standard'),
          t.Literal('professional'),
          t.Literal('industry'),
        ]),
      }),
    }
  )

  /**
   * Image Upscaler: Pipeline (remove → upscale or upscale → remove)
   */
  .post(
    '/upscaler/pipeline',
    async ({ body, user }) => {
      const { imageId, pipeline, removalTier, upscaleFactor } = body

      // Validate pipeline
      if (!['remove-then-upscale', 'upscale-then-remove'].includes(pipeline)) {
        return { success: false, message: 'Invalid pipeline' }
      }

      // Get image
      const image = await prisma.user_images.findFirst({
        where: { id: imageId, user_id: user.id },
      })

      if (!image) {
        return { success: false, message: 'Image not found' }
      }

      let currentImageUrl = image.url

      // Execute pipeline
      if (pipeline === 'remove-then-upscale') {
        // Step 1: Remove background
        const removalResult = await removalService.processSingleImage({
          userId: user.id,
          tier: removalTier,
          image: currentImageUrl,
          filename: `image-${imageId}.png`,
          usageType: 'single',
        })

        if (!removalResult.success) {
          return { success: false, message: 'Background removal failed' }
        }

        currentImageUrl = removalResult.processedUrl!

        // Step 2: Upscale (TODO: Call upscaler service)
        // const upscaleResult = await upscalerService.upscale(...)
      } else {
        // Step 1: Upscale
        // const upscaleResult = await upscalerService.upscale(...)

        // Step 2: Remove background
        // const removalResult = await removalService.processSingleImage(...)
      }

      return {
        success: true,
        finalImageUrl: currentImageUrl,
      }
    },
    {
      body: t.Object({
        imageId: t.String(),
        pipeline: t.Union([
          t.Literal('remove-then-upscale'),
          t.Literal('upscale-then-remove'),
        ]),
        removalTier: t.Union([
          t.Literal('basic'),
          t.Literal('standard'),
          t.Literal('professional'),
          t.Literal('industry'),
        ]),
        upscaleFactor: t.Number(),
      }),
    }
  )
```

**See INTEGRATION_GUIDE.md for detailed integration patterns, API contracts, and code examples.**

---

## Testing

### Unit Tests Example

```typescript
// src/modules/background-remover/services/__tests__/pricing.service.test.ts

import { describe, it, expect } from 'bun:test'
import pricingService from '../pricing.service'

describe('PricingService', () => {
  describe('calculateSingleImageCost', () => {
    it('should return correct cost for basic tier', () => {
      const cost = pricingService.calculateSingleImageCost('basic')
      expect(cost).toBe(3)
    })

    it('should return correct cost for industry tier', () => {
      const cost = pricingService.calculateSingleImageCost('industry')
      expect(cost).toBe(25)
    })

    it('should throw error for invalid tier', () => {
      expect(() => pricingService.calculateSingleImageCost('invalid' as any)).toThrow()
    })
  })

  describe('calculateBatchCost', () => {
    it('should apply 0% discount for 19 images', () => {
      const result = pricingService.calculateBatchCost('standard', 19)
      expect(result.discountPercentage).toBe(0)
      expect(result.finalTotal).toBe(19 * 8) // 152 credits
    })

    it('should apply 5% discount for 20-50 images', () => {
      const result = pricingService.calculateBatchCost('standard', 50)
      const expected = 50 * 8 // 400
      const discount = Math.floor(expected * 0.05) // 20
      expect(result.discountPercentage).toBe(5)
      expect(result.discountAmount).toBe(discount)
      expect(result.finalTotal).toBe(expected - discount) // 380
    })

    it('should apply 20% discount for 201+ images', () => {
      const result = pricingService.calculateBatchCost('basic', 300)
      const expected = 300 * 3 // 900
      const discount = Math.floor(expected * 0.2) // 180
      expect(result.discountPercentage).toBe(20)
      expect(result.finalTotal).toBe(expected - discount) // 720
    })
  })
})
```

### Integration Test Example

```bash
# Run tests
bun test

# Run with coverage
bun test --coverage

# Run specific test file
bun test pricing.service.test.ts
```

**See TESTING_STRATEGY.md for complete testing documentation, fixtures, and load testing strategies.**

---

## Deployment

### Step 1: Environment Setup

```bash
# .env.production
DATABASE_URL=postgresql://user:pass@prod-db:5432/lumiku
REDIS_URL=redis://prod-redis:6379
REDIS_PASSWORD=secure_password

HUGGINGFACE_API_KEY=hf_prod_key
SEGMIND_API_KEY=SG_prod_key

STORAGE_DIR=/var/lumiku/storage
FRONTEND_URL=https://lumiku.com

SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxx

NODE_ENV=production
```

### Step 2: Database Migration

```bash
# Run migrations on production
bunx prisma migrate deploy

# Generate Prisma client
bunx prisma generate
```

### Step 3: Start Services

```bash
# Start API server
pm2 start src/index.ts --name lumiku-api

# Start workers (multiple instances)
pm2 start src/worker.ts --name lumiku-worker -i 4

# Check status
pm2 status

# View logs
pm2 logs lumiku-worker
```

### Step 4: Setup Monitoring

```bash
# Install monitoring tools
bun install @sentry/node

# Configure Sentry
export SENTRY_DSN=https://xxx@sentry.io/xxx
```

**See DEPLOYMENT.md for complete deployment guide, Coolify setup, scaling strategies, and troubleshooting.**

---

## Related Documentation

This implementation guide references the following detailed documentation:

1. **DATABASE_SCHEMA.md** - Complete database schema, indexes, and queries
2. **API_DOCUMENTATION.md** - Full API reference with all endpoints
3. **PRICING_LOGIC.md** - Pricing calculations and formulas
4. **QUEUE_SYSTEM.md** - BullMQ architecture and worker management
5. **INTEGRATION_GUIDE.md** - Cross-app integration patterns
6. **FRONTEND_COMPONENTS.md** - UI components and state management
7. **DEPLOYMENT.md** - Production deployment and scaling
8. **TESTING_STRATEGY.md** - Testing strategies and examples
9. **RISK_MITIGATION.md** - Risk analysis and mitigation

---

## Quick Start Checklist

Use this checklist to verify your implementation:

- [ ] PostgreSQL database created
- [ ] Redis server running
- [ ] Environment variables configured
- [ ] Dependencies installed (`bun install`)
- [ ] Database migrated (`bunx prisma migrate dev`)
- [ ] HuggingFace API key working
- [ ] Segmind API key working
- [ ] Storage directories created
- [ ] API server starts without errors
- [ ] Worker process starts without errors
- [ ] Frontend builds successfully
- [ ] Single image removal works
- [ ] Batch processing works (test with 5 images)
- [ ] Progress tracking updates in real-time
- [ ] Volume discounts calculate correctly
- [ ] Subscription quota tracking works
- [ ] Email notifications send
- [ ] ZIP download works
- [ ] Error handling tested
- [ ] Load testing passed (100 images)

---

## Support & Resources

- **HuggingFace Docs**: https://huggingface.co/docs/api-inference
- **Segmind Docs**: https://docs.segmind.com/
- **BullMQ Docs**: https://docs.bullmq.io/
- **Prisma Docs**: https://www.prisma.io/docs

---

**Next Steps**: Proceed to DATABASE_SCHEMA.md for detailed database implementation.
