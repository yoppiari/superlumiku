# 🎯 Dual User System Implementation Guide

**Project:** Lumiku App - Multi-tier Subscription & Model-Level Access Control
**Version:** 1.0.0
**Date:** 2025-01-15
**Status:** Implementation Ready

---

## 📋 TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Architecture Design](#architecture-design)
3. [Database Schema](#database-schema)
4. [Services Layer](#services-layer)
5. [Middleware Layer](#middleware-layer)
6. [API Endpoints](#api-endpoints)
7. [Background Jobs](#background-jobs)
8. [Migration Strategy](#migration-strategy)
9. [Testing Checklist](#testing-checklist)
10. [Implementation Timeline](#implementation-timeline)

---

## 🎯 SYSTEM OVERVIEW

### Business Requirements

#### **2 User Types**

##### 1. **SUBSCRIPTION User** (Berlangganan)
- **Tiers:** Basic / Pro / Enterprise
- **Pricing Model:** Monthly/Yearly subscription fee
- **Usage Model:** Quota-based (unlimited tapi terbatas)
- **Daily Quota:** 50-500 generates/day (depends on tier)
- **Model Access:** Based on subscription tier
  - Basic: Free + Basic tier models
  - Pro: Free + Basic + Pro tier models
  - Enterprise: ALL models (Free + Basic + Pro + Enterprise)
- **Cost:** NO credit deduction, uses quota system
- **Quota Reset:** Daily at 00:00 UTC

##### 2. **PAY-AS-YOU-GO User** (PAYG)
- **Tier:** Free (default)
- **Pricing Model:** Pay per generate (credit-based)
- **Usage Model:** Credit-based (existing system)
- **Model Access:** Free tier models only + Basic tier with higher credit cost
- **Cost:** Deducts credits per generation
- **Premium Models:** Cannot access Pro/Enterprise tier models

---

### Model-Level Access Control

Every app has **multiple AI models** with different tiers:

**Example: Video Generator App**

| Model ID | Model Name | Tier | PAYG Credit | Subscription Quota | Access |
|----------|------------|------|-------------|-------------------|---------|
| `veo3-basic` | Google Veo 3 Basic | `free` | 5 credits | 1 quota | ✅ All users |
| `kling-2.5` | Kling 2.5 Pro | `pro` | 20 credits | 2 quota | ✅ Pro+ subscribers<br>✅ PAYG (expensive) |
| `custom-enterprise` | Custom Enterprise | `enterprise` | ❌ N/A | 3 quota | ✅ Enterprise only |

**Key Concepts:**
- **Tier-based access:** Models are categorized by tier (free/basic/pro/enterprise)
- **Dual pricing:** Same model, different cost for PAYG vs Subscription
- **Quota weight:** Heavy/expensive models consume more quota (1-5x)
- **Dynamic filtering:** API returns only models user can access

---

## 🏗️ ARCHITECTURE DESIGN

### System Flow Diagram

```
┌─────────────┐
│   USER      │
└─────┬───────┘
      │
      ▼
┌─────────────────────────────────────┐
│  API Endpoint (e.g., /generate)     │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  Auth Middleware                    │
│  - Verify JWT token                 │
│  - Extract userId                   │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  Model Access Middleware            │
│  - Check user tier vs model tier    │
│  - Return 403 if denied             │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  Hybrid Usage Middleware            │
│  ┌─────────────────────────────┐   │
│  │ IF accountType == 'payg':   │   │
│  │   → Check credit balance    │   │
│  │   → Return 402 if low       │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ IF accountType == 'sub':    │   │
│  │   → Check daily quota       │   │
│  │   → Return 429 if exceeded  │   │
│  └─────────────────────────────┘   │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  Business Logic (Generate)          │
│  - Process request                  │
│  - Call AI provider                 │
│  - Save result                      │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  Record Usage Middleware            │
│  ┌─────────────────────────────┐   │
│  │ IF PAYG: Deduct credits     │   │
│  │ IF Sub:  Increment quota    │   │
│  └─────────────────────────────┘   │
│  - Save ModelUsage record           │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  Response                           │
│  - Return success/error             │
└─────────────────────────────────────┘
```

---

## 🗄️ DATABASE SCHEMA

### 1. User Model (Updated)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  role      String   @default("user") // user, admin

  // Storage quota (existing)
  storageQuota Int @default(1073741824)  // 1GB
  storageUsed  Int @default(0)

  // NEW: Account Type & Subscription
  accountType      String   @default("payg")  // "subscription" | "payg"
  subscriptionTier String   @default("free")  // "free" | "basic" | "pro" | "enterprise"

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  credits      Credit[]
  sessions     Session[]
  devices      Device[]
  appUsages    AppUsage[]
  subscription Subscription?    // NEW
  quotaUsages  QuotaUsage[]     // NEW
  modelUsages  ModelUsage[]     // NEW

  @@map("users")
}
```

---

### 2. AIModel (NEW - Central Model Registry)

```prisma
// Central registry untuk semua AI models di semua apps
model AIModel {
  id                String   @id @default(cuid())

  // Model Identity
  appId             String   // "video-generator", "poster-editor", etc
  modelId           String   // "veo3", "kling-2.5", "wan2.2", etc
  modelKey          String   @unique // "video-generator:veo3"

  // Display Info
  name              String   // "Google Veo 3"
  description       String?
  provider          String   // "modelslab", "edenai", "segmind"

  // Access Control (CORE!)
  tier              String   // "free", "basic", "pro", "enterprise"
  enabled           Boolean  @default(true)
  beta              Boolean  @default(false)

  // Pricing for PAYG users
  creditCost        Int      // Base credit cost
  creditPerSecond   Float?   // For video: cost per second
  creditPerPixel    Float?   // For image: cost per megapixel

  // Quota for Subscription users
  quotaCost         Int      @default(1)  // Heavy models = 2-5 quota

  // Capabilities (JSON)
  capabilities      String?  // JSON: {maxDuration, resolutions, aspectRatios}

  // Stats
  totalUsage        Int      @default(0)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  modelUsages       ModelUsage[]

  @@unique([appId, modelId])
  @@index([appId])
  @@index([tier])
  @@index([enabled])
  @@map("ai_models")
}
```

---

### 3. SubscriptionPlan (NEW)

```prisma
model SubscriptionPlan {
  id              String   @id @default(cuid())
  planId          String   @unique  // "basic-monthly", "pro-yearly"

  // Plan Info
  tier            String   // "basic", "pro", "enterprise"
  name            String   // "Pro Monthly"
  description     String?

  // Pricing
  price           Float    // Rupiah
  billingCycle    String   // "monthly", "yearly"

  // Quotas
  dailyQuota      Int      // 100 generates per day
  monthlyQuota    Int?     // Optional monthly cap

  // Model Access
  // Models akan di-filter by tier, jadi tidak perlu list manual
  // tier "pro" bisa akses: free, basic, pro models
  maxModelTier    String   // "basic", "pro", "enterprise"

  // Features (JSON)
  features        String?  // JSON: {prioritySupport, customBranding, etc}

  // Status
  isActive        Boolean  @default(true)
  displayOrder    Int      @default(0)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  subscriptions   Subscription[]

  @@index([tier])
  @@index([isActive])
  @@map("subscription_plans")
}
```

---

### 4. Subscription (NEW)

```prisma
model Subscription {
  id              String   @id @default(cuid())
  userId          String   @unique
  planId          String

  // Status
  status          String   // "active", "cancelled", "expired", "grace_period", "suspended"

  // Billing Period
  startDate       DateTime
  endDate         DateTime
  billingCycle    String   // "monthly", "yearly"

  // Auto-renewal
  autoRenew       Boolean  @default(true)
  nextBillingDate DateTime?

  // Payment
  lastPaymentId   String?

  // Cancellation
  cancelledAt     DateTime?
  cancelReason    String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  user            User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  plan            SubscriptionPlan  @relation(fields: [planId], references: [id])

  @@index([status])
  @@index([endDate])
  @@map("subscriptions")
}
```

---

### 5. QuotaUsage (NEW - Daily Reset)

```prisma
model QuotaUsage {
  id          String   @id @default(cuid())
  userId      String

  // Period Tracking
  quotaType   String   // "daily", "monthly"
  period      String   // "2025-01-15" for daily, "2025-01" for monthly

  // Usage
  usageCount  Int      @default(0)  // Total quota used in period
  quotaLimit  Int      // From subscription plan

  // Breakdown by model (JSON)
  modelBreakdown String?  // JSON: {"veo3": 50, "kling": 30, "wan22": 20}

  // Auto-reset
  resetAt     DateTime

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, period, quotaType])
  @@index([userId, period])
  @@index([resetAt])
  @@map("quota_usages")
}
```

---

### 6. ModelUsage (NEW - Detailed Tracking)

```prisma
model ModelUsage {
  id          String   @id @default(cuid())
  userId      String
  appId       String   // "video-generator"
  modelKey    String   // "video-generator:veo3"

  // Usage Type
  usageType   String   // "credit" (PAYG) | "quota" (Subscription)

  // Cost/Quota
  creditUsed  Int?     // For PAYG users
  quotaUsed   Int?     // For Subscription users (usually 1, heavy models = 2-5)

  // Action metadata
  action      String   // "generate_video", "inpaint_poster", etc
  metadata    String?  // JSON: {duration: 5, resolution: "720p"}

  createdAt   DateTime @default(now())

  // Relations
  user        User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  model       AIModel @relation(fields: [modelKey], references: [modelKey], onDelete: Cascade)

  @@index([userId])
  @@index([appId])
  @@index([modelKey])
  @@index([createdAt])
  @@map("model_usages")
}
```

---

## ⚙️ SERVICES LAYER

### 1. Model Registry Service

**File:** `backend/src/services/model-registry.service.ts`

```typescript
import prisma from '../db/client'
import { AIModel } from '@prisma/client'

export class ModelRegistryService {
  /**
   * Get all models for an app
   */
  async getAppModels(appId: string): Promise<AIModel[]> {
    return await prisma.aIModel.findMany({
      where: {
        appId,
        enabled: true
      },
      orderBy: { tier: 'asc' }
    })
  }

  /**
   * Get models user can access based on their tier
   */
  async getUserAccessibleModels(userId: string, appId: string): Promise<AIModel[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        accountType: true,
        subscriptionTier: true
      }
    })

    if (!user) throw new Error('User not found')

    const tierHierarchy = {
      'free': ['free'],
      'basic': ['free', 'basic'],
      'pro': ['free', 'basic', 'pro'],
      'enterprise': ['free', 'basic', 'pro', 'enterprise']
    }

    const allowedTiers = tierHierarchy[user.subscriptionTier] || ['free']

    return await prisma.aIModel.findMany({
      where: {
        appId,
        enabled: true,
        tier: { in: allowedTiers }
      },
      orderBy: { tier: 'asc' }
    })
  }

  /**
   * Check if user can access specific model
   */
  async canAccessModel(userId: string, modelKey: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true }
    })

    const model = await prisma.aIModel.findUnique({
      where: { modelKey }
    })

    if (!user || !model) return false

    const tierHierarchy = {
      'free': ['free'],
      'basic': ['free', 'basic'],
      'pro': ['free', 'basic', 'pro'],
      'enterprise': ['free', 'basic', 'pro', 'enterprise']
    }

    const allowedTiers = tierHierarchy[user.subscriptionTier] || ['free']
    return allowedTiers.includes(model.tier)
  }

  /**
   * Get model cost (credit or quota) based on params
   */
  async getModelCost(modelKey: string, params: any): Promise<{
    creditCost: number
    quotaCost: number
  }> {
    const model = await prisma.aIModel.findUnique({
      where: { modelKey }
    })

    if (!model) throw new Error('Model not found')

    let creditCost = model.creditCost
    let quotaCost = model.quotaCost

    // Calculate dynamic cost for video (duration-based)
    if (model.creditPerSecond && params.duration) {
      creditCost = Math.ceil(model.creditPerSecond * params.duration)
    }

    // Calculate dynamic cost for image (resolution-based)
    if (model.creditPerPixel && params.width && params.height) {
      const megapixels = (params.width * params.height) / 1000000
      creditCost = Math.ceil(model.creditPerPixel * megapixels)
    }

    return { creditCost, quotaCost }
  }

  /**
   * Register/update model in database
   */
  async upsertModel(data: {
    appId: string
    modelId: string
    name: string
    provider: string
    tier: string
    creditCost: number
    quotaCost: number
    capabilities?: any
  }): Promise<AIModel> {
    const modelKey = `${data.appId}:${data.modelId}`

    return await prisma.aIModel.upsert({
      where: { modelKey },
      update: {
        name: data.name,
        provider: data.provider,
        tier: data.tier,
        creditCost: data.creditCost,
        quotaCost: data.quotaCost,
        capabilities: data.capabilities ? JSON.stringify(data.capabilities) : null
      },
      create: {
        appId: data.appId,
        modelId: data.modelId,
        modelKey,
        name: data.name,
        provider: data.provider,
        tier: data.tier,
        creditCost: data.creditCost,
        quotaCost: data.quotaCost,
        capabilities: data.capabilities ? JSON.stringify(data.capabilities) : null
      }
    })
  }
}

export const modelRegistryService = new ModelRegistryService()
```

---

### 2. Subscription Service

**File:** `backend/src/services/subscription.service.ts`

```typescript
import prisma from '../db/client'
import { Subscription, SubscriptionPlan } from '@prisma/client'
import { addDays, addMonths, addYears } from 'date-fns'

export class SubscriptionService {
  /**
   * Create new subscription
   */
  async createSubscription(userId: string, planId: string): Promise<Subscription> {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { planId }
    })

    if (!plan) throw new Error('Subscription plan not found')

    const now = new Date()
    const endDate = plan.billingCycle === 'monthly'
      ? addMonths(now, 1)
      : addYears(now, 1)

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId,
        status: 'active',
        startDate: now,
        endDate,
        billingCycle: plan.billingCycle,
        autoRenew: true,
        nextBillingDate: endDate
      }
    })

    // Update user account type and tier
    await prisma.user.update({
      where: { id: userId },
      data: {
        accountType: 'subscription',
        subscriptionTier: plan.tier
      }
    })

    // Initialize quota usage
    await this.initializeQuota(userId, plan.dailyQuota)

    return subscription
  }

  /**
   * Initialize daily quota for new subscriber
   */
  private async initializeQuota(userId: string, dailyLimit: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = addDays(new Date(), 1)
    tomorrow.setHours(0, 0, 0, 0)

    await prisma.quotaUsage.create({
      data: {
        userId,
        quotaType: 'daily',
        period: today,
        usageCount: 0,
        quotaLimit: dailyLimit,
        resetAt: tomorrow
      }
    })
  }

  /**
   * Get user subscription
   */
  async getUserSubscription(userId: string): Promise<(Subscription & { plan: SubscriptionPlan }) | null> {
    return await prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true }
    })
  }

  /**
   * Check if subscription is active
   */
  async isSubscriptionActive(userId: string): Promise<boolean> {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      select: { status: true, endDate: true }
    })

    if (!subscription) return false

    return subscription.status === 'active' && subscription.endDate > new Date()
  }

  /**
   * Get user tier
   */
  async getUserTier(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true }
    })

    return user?.subscriptionTier || 'free'
  }

  /**
   * Cancel subscription (keep until end of period)
   */
  async cancelSubscription(userId: string, reason?: string): Promise<void> {
    await prisma.subscription.update({
      where: { userId },
      data: {
        autoRenew: false,
        cancelledAt: new Date(),
        cancelReason: reason
      }
    })
  }

  /**
   * Renew subscription (after payment confirmed)
   */
  async renewSubscription(userId: string): Promise<void> {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true }
    })

    if (!subscription) throw new Error('Subscription not found')

    const newEndDate = subscription.billingCycle === 'monthly'
      ? addMonths(subscription.endDate, 1)
      : addYears(subscription.endDate, 1)

    await prisma.subscription.update({
      where: { userId },
      data: {
        status: 'active',
        endDate: newEndDate,
        nextBillingDate: newEndDate
      }
    })
  }

  /**
   * Expire subscriptions (cron job)
   */
  async expireSubscriptions(): Promise<number> {
    const now = new Date()

    const result = await prisma.subscription.updateMany({
      where: {
        status: 'active',
        endDate: { lte: now },
        autoRenew: false
      },
      data: { status: 'expired' }
    })

    // Revert users to PAYG
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: { status: 'expired' },
      select: { userId: true }
    })

    for (const sub of expiredSubscriptions) {
      await prisma.user.update({
        where: { id: sub.userId },
        data: {
          accountType: 'payg',
          subscriptionTier: 'free'
        }
      })
    }

    return result.count
  }

  /**
   * Change plan (upgrade/downgrade)
   */
  async changePlan(userId: string, newPlanId: string): Promise<void> {
    const newPlan = await prisma.subscriptionPlan.findUnique({
      where: { planId: newPlanId }
    })

    if (!newPlan) throw new Error('Plan not found')

    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    })

    if (!subscription) throw new Error('No active subscription')

    // Update subscription plan
    await prisma.subscription.update({
      where: { userId },
      data: { planId: newPlanId }
    })

    // Update user tier
    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionTier: newPlan.tier }
    })

    // Update quota limit
    const today = new Date().toISOString().split('T')[0]
    await prisma.quotaUsage.updateMany({
      where: {
        userId,
        period: today,
        quotaType: 'daily'
      },
      data: { quotaLimit: newPlan.dailyQuota }
    })
  }
}

export const subscriptionService = new SubscriptionService()
```

---

### 3. Quota Service

**File:** `backend/src/services/quota.service.ts`

```typescript
import prisma from '../db/client'
import { addDays } from 'date-fns'

export class QuotaService {
  /**
   * Check if user has quota available
   */
  async checkQuota(userId: string, quotaCost: number = 1): Promise<{
    allowed: boolean
    current: number
    limit: number
    remaining: number
    resetAt: Date
  }> {
    const today = new Date().toISOString().split('T')[0]

    let quota = await prisma.quotaUsage.findUnique({
      where: {
        userId_period_quotaType: {
          userId,
          period: today,
          quotaType: 'daily'
        }
      }
    })

    // Initialize quota if not exists
    if (!quota) {
      quota = await this.initializeDailyQuota(userId)
    }

    const remaining = quota.quotaLimit - quota.usageCount
    const allowed = remaining >= quotaCost

    return {
      allowed,
      current: quota.usageCount,
      limit: quota.quotaLimit,
      remaining,
      resetAt: quota.resetAt
    }
  }

  /**
   * Initialize daily quota for user
   */
  private async initializeDailyQuota(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: { include: { plan: true } } }
    })

    const dailyLimit = user?.subscription?.plan?.dailyQuota || 10 // Default 10 for free

    const today = new Date().toISOString().split('T')[0]
    const tomorrow = addDays(new Date(), 1)
    tomorrow.setHours(0, 0, 0, 0)

    return await prisma.quotaUsage.create({
      data: {
        userId,
        quotaType: 'daily',
        period: today,
        usageCount: 0,
        quotaLimit: dailyLimit,
        resetAt: tomorrow
      }
    })
  }

  /**
   * Increment quota usage
   */
  async incrementQuota(
    userId: string,
    modelKey: string,
    quotaCost: number = 1
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0]

    const quota = await prisma.quotaUsage.findUnique({
      where: {
        userId_period_quotaType: {
          userId,
          period: today,
          quotaType: 'daily'
        }
      }
    })

    if (!quota) {
      throw new Error('Quota record not found')
    }

    // Parse model breakdown
    const breakdown = quota.modelBreakdown
      ? JSON.parse(quota.modelBreakdown)
      : {}

    const modelId = modelKey.split(':')[1]
    breakdown[modelId] = (breakdown[modelId] || 0) + quotaCost

    // Update quota
    await prisma.quotaUsage.update({
      where: { id: quota.id },
      data: {
        usageCount: quota.usageCount + quotaCost,
        modelBreakdown: JSON.stringify(breakdown)
      }
    })
  }

  /**
   * Get remaining quota
   */
  async getRemainingQuota(userId: string): Promise<number> {
    const result = await this.checkQuota(userId)
    return result.remaining
  }

  /**
   * Get quota usage details
   */
  async getQuotaUsage(userId: string) {
    const today = new Date().toISOString().split('T')[0]

    return await prisma.quotaUsage.findUnique({
      where: {
        userId_period_quotaType: {
          userId,
          period: today,
          quotaType: 'daily'
        }
      }
    })
  }

  /**
   * Reset daily quotas (cron job)
   */
  async resetDailyQuotas(): Promise<number> {
    const now = new Date()

    // Find all expired quotas
    const expiredQuotas = await prisma.quotaUsage.findMany({
      where: {
        quotaType: 'daily',
        resetAt: { lte: now }
      }
    })

    // Delete old quota records
    await prisma.quotaUsage.deleteMany({
      where: {
        quotaType: 'daily',
        resetAt: { lte: now }
      }
    })

    // Create new quota records for today
    const tomorrow = addDays(now, 1)
    tomorrow.setHours(0, 0, 0, 0)
    const today = now.toISOString().split('T')[0]

    for (const oldQuota of expiredQuotas) {
      await prisma.quotaUsage.create({
        data: {
          userId: oldQuota.userId,
          quotaType: 'daily',
          period: today,
          usageCount: 0,
          quotaLimit: oldQuota.quotaLimit,
          resetAt: tomorrow
        }
      })
    }

    return expiredQuotas.length
  }

  /**
   * Get quota breakdown by model
   */
  async getQuotaBreakdown(userId: string): Promise<Record<string, number>> {
    const quota = await this.getQuotaUsage(userId)

    if (!quota?.modelBreakdown) {
      return {}
    }

    return JSON.parse(quota.modelBreakdown)
  }
}

export const quotaService = new QuotaService()
```

---

### 4. Access Control Service

**File:** `backend/src/services/access-control.service.ts`

```typescript
import prisma from '../db/client'
import { modelRegistryService } from './model-registry.service'
import { subscriptionService } from './subscription.service'
import { quotaService } from './quota.service'
import { getCreditBalance } from '../core/middleware/credit.middleware'

export class AccessControlService {
  /**
   * Check if user can access app
   */
  async canAccessApp(userId: string, appId: string): Promise<boolean> {
    // For now, all authenticated users can access all apps
    // Apps are filtered by models, not app-level
    return true
  }

  /**
   * Check if user can use specific model
   */
  async canUseModel(userId: string, modelKey: string): Promise<{
    allowed: boolean
    reason?: string
    requiredTier?: string
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true }
    })

    const model = await prisma.aIModel.findUnique({
      where: { modelKey }
    })

    if (!model) {
      return { allowed: false, reason: 'Model not found' }
    }

    if (!model.enabled) {
      return { allowed: false, reason: 'Model is currently disabled' }
    }

    const tierHierarchy = {
      'free': ['free'],
      'basic': ['free', 'basic'],
      'pro': ['free', 'basic', 'pro'],
      'enterprise': ['free', 'basic', 'pro', 'enterprise']
    }

    const allowedTiers = tierHierarchy[user?.subscriptionTier || 'free'] || ['free']

    if (!allowedTiers.includes(model.tier)) {
      return {
        allowed: false,
        reason: `This model requires ${model.tier} tier or higher`,
        requiredTier: model.tier
      }
    }

    return { allowed: true }
  }

  /**
   * Get all accessible apps for user (with model filtering)
   */
  async getUserAccessibleApps(userId: string) {
    const { pluginRegistry } = await import('../plugins/registry')
    const allApps = pluginRegistry.getDashboardApps()

    // For each app, check if user can access at least one model
    const accessibleApps = []

    for (const app of allApps) {
      const models = await modelRegistryService.getUserAccessibleModels(userId, app.appId)

      if (models.length > 0) {
        accessibleApps.push({
          ...app,
          availableModels: models.length
        })
      }
    }

    return accessibleApps
  }

  /**
   * Validate full access (app + model + quota/credit)
   */
  async validateAccess(
    userId: string,
    appId: string,
    modelKey: string,
    params: any
  ): Promise<{
    allowed: boolean
    usageType: 'credit' | 'quota'
    cost: number
    error?: string
  }> {
    // 1. Check model access
    const modelAccess = await this.canUseModel(userId, modelKey)
    if (!modelAccess.allowed) {
      return {
        allowed: false,
        usageType: 'credit',
        cost: 0,
        error: modelAccess.reason
      }
    }

    // 2. Get user account type
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { accountType: true }
    })

    // 3. Calculate cost
    const { creditCost, quotaCost } = await modelRegistryService.getModelCost(modelKey, params)

    // 4. Check quota or credit
    if (user?.accountType === 'subscription') {
      const quotaCheck = await quotaService.checkQuota(userId, quotaCost)

      if (!quotaCheck.allowed) {
        return {
          allowed: false,
          usageType: 'quota',
          cost: quotaCost,
          error: `Daily quota exceeded. Resets at ${quotaCheck.resetAt.toISOString()}`
        }
      }

      return {
        allowed: true,
        usageType: 'quota',
        cost: quotaCost
      }
    } else {
      const balance = await getCreditBalance(userId)

      if (balance < creditCost) {
        return {
          allowed: false,
          usageType: 'credit',
          cost: creditCost,
          error: `Insufficient credits. Required: ${creditCost}, Current: ${balance}`
        }
      }

      return {
        allowed: true,
        usageType: 'credit',
        cost: creditCost
      }
    }
  }
}

export const accessControlService = new AccessControlService()
```

---

## 🛡️ MIDDLEWARE LAYER

### 1. Model Access Middleware

**File:** `backend/src/middleware/model-access.middleware.ts`

```typescript
import { Context, Next } from 'hono'
import { accessControlService } from '../services/access-control.service'

/**
 * Check if user can access specific AI model
 * Usage: requireModelAccess('video-generator:veo3')
 */
export const requireModelAccess = (modelKey: string) => {
  return async (c: Context, next: Next) => {
    const userId = c.get('userId')

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { allowed, reason, requiredTier } = await accessControlService.canUseModel(userId, modelKey)

    if (!allowed) {
      return c.json({
        error: 'Model access denied',
        reason,
        requiredTier,
        modelKey
      }, 403)
    }

    c.set('modelKey', modelKey)
    await next()
  }
}
```

---

### 2. Hybrid Usage Middleware

**File:** `backend/src/middleware/hybrid-usage.middleware.ts`

```typescript
import { Context, Next } from 'hono'
import prisma from '../db/client'
import { modelRegistryService } from '../services/model-registry.service'
import { quotaService } from '../services/quota.service'
import { getCreditBalance } from '../core/middleware/credit.middleware'

/**
 * Deduct credit (PAYG) OR quota (Subscription) based on user type
 * Automatically detects user type and applies correct pricing
 */
export const deductModelUsage = (modelKey: string, action: string) => {
  return async (c: Context, next: Next) => {
    const userId = c.get('userId')

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Get user account type
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { accountType: true, subscriptionTier: true }
    })

    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }

    // Get request params (for dynamic cost calculation)
    const requestBody = await c.req.json()

    // Get model cost
    const cost = await modelRegistryService.getModelCost(modelKey, requestBody)

    if (user.accountType === 'subscription') {
      // Use QUOTA system
      const quotaCheck = await quotaService.checkQuota(userId, cost.quotaCost)

      if (!quotaCheck.allowed) {
        return c.json({
          error: 'Daily quota exceeded',
          usage: quotaCheck.current,
          limit: quotaCheck.limit,
          remaining: quotaCheck.remaining,
          resetAt: quotaCheck.resetAt
        }, 429) // Too Many Requests
      }

      c.set('usageType', 'quota')
      c.set('quotaCost', cost.quotaCost)

    } else {
      // Use CREDIT system (existing)
      const balance = await getCreditBalance(userId)

      if (balance < cost.creditCost) {
        return c.json({
          error: 'Insufficient credits',
          required: cost.creditCost,
          current: balance
        }, 402) // Payment Required
      }

      c.set('usageType', 'credit')
      c.set('creditCost', cost.creditCost)
    }

    // Store for post-processing
    c.set('modelUsageData', {
      modelKey,
      action,
      cost,
      requestBody
    })

    await next()
  }
}
```

---

### 3. Record Model Usage Middleware

**File:** `backend/src/middleware/record-model-usage.middleware.ts`

```typescript
import { Context } from 'hono'
import prisma from '../db/client'
import { quotaService } from '../services/quota.service'
import { recordCreditUsage } from '../core/middleware/credit.middleware'

/**
 * Record model usage after successful generation
 * Call this AFTER the operation succeeds
 */
export const recordModelUsage = async (c: Context) => {
  const userId = c.get('userId')
  const usageType = c.get('usageType')
  const modelUsageData = c.get('modelUsageData')

  if (!modelUsageData) {
    console.warn('⚠️  No model usage data found in context')
    return
  }

  try {
    if (usageType === 'quota') {
      // Record quota usage
      await quotaService.incrementQuota(
        userId,
        modelUsageData.modelKey,
        modelUsageData.cost.quotaCost
      )

    } else {
      // Record credit usage (existing)
      const appId = modelUsageData.modelKey.split(':')[0]
      await recordCreditUsage(
        userId,
        appId,
        modelUsageData.action,
        modelUsageData.cost.creditCost
      )
    }

    // Record detailed model usage
    await prisma.modelUsage.create({
      data: {
        userId,
        appId: modelUsageData.modelKey.split(':')[0],
        modelKey: modelUsageData.modelKey,
        usageType,
        creditUsed: usageType === 'credit' ? modelUsageData.cost.creditCost : null,
        quotaUsed: usageType === 'quota' ? modelUsageData.cost.quotaCost : null,
        action: modelUsageData.action,
        metadata: JSON.stringify(modelUsageData.requestBody)
      }
    })

    // Update model stats
    await prisma.aIModel.update({
      where: { modelKey: modelUsageData.modelKey },
      data: { totalUsage: { increment: 1 } }
    })

    console.log(`✅ Recorded ${usageType} usage for ${modelUsageData.modelKey}`)

  } catch (error) {
    console.error('❌ Error recording model usage:', error)
    // Don't throw - usage recording should not break the main flow
  }
}
```

---

## 🌐 API ENDPOINTS

### 1. Apps API (Updated)

**File:** `backend/src/app.ts`

```typescript
// Get all apps for dashboard (filtered by user access)
app.get('/api/apps', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const accessControl = new AccessControlService()

  // Get only apps user can access
  const apps = await accessControl.getUserAccessibleApps(userId)

  return c.json({ apps })
})

// Get models for specific app (filtered by user tier)
app.get('/api/apps/:appId/models', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const appId = c.req.param('appId')

  const models = await modelRegistryService.getUserAccessibleModels(userId, appId)

  return c.json({ models })
})
```

---

### 2. Subscription Routes (NEW)

**File:** `backend/src/routes/subscription.routes.ts`

```typescript
import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.middleware'
import { subscriptionService } from '../services/subscription.service'
import prisma from '../db/client'

const router = new Hono()

// GET /api/subscription/plans - List all available plans
router.get('/plans', async (c) => {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' }
  })

  return c.json({ plans })
})

// GET /api/subscription/status - Get current user subscription
router.get('/status', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const subscription = await subscriptionService.getUserSubscription(userId)

  if (!subscription) {
    return c.json({ subscription: null, tier: 'free' })
  }

  return c.json({
    subscription,
    tier: subscription.plan.tier,
    isActive: await subscriptionService.isSubscriptionActive(userId)
  })
})

// POST /api/subscription/subscribe - Create subscription
router.post('/subscribe', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const { planId } = await c.req.json()

  // Check if user already has subscription
  const existing = await subscriptionService.getUserSubscription(userId)
  if (existing && existing.status === 'active') {
    return c.json({ error: 'User already has active subscription' }, 400)
  }

  const subscription = await subscriptionService.createSubscription(userId, planId)

  return c.json({
    success: true,
    subscription
  })
})

// POST /api/subscription/cancel - Cancel subscription
router.post('/cancel', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const { reason } = await c.req.json()

  await subscriptionService.cancelSubscription(userId, reason)

  return c.json({
    success: true,
    message: 'Subscription will remain active until end of billing period'
  })
})

// POST /api/subscription/change-plan - Upgrade/downgrade plan
router.post('/change-plan', authMiddleware, async (c) => {
  const userId = c.get('userId')
  const { newPlanId } = await c.req.json()

  await subscriptionService.changePlan(userId, newPlanId)

  return c.json({
    success: true,
    message: 'Plan changed successfully'
  })
})

export default router
```

---

### 3. Quota Routes (NEW)

**File:** `backend/src/routes/quota.routes.ts`

```typescript
import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.middleware'
import { quotaService } from '../services/quota.service'

const router = new Hono()

// GET /api/quota/status - Get remaining quota
router.get('/status', authMiddleware, async (c) => {
  const userId = c.get('userId')

  const quotaCheck = await quotaService.checkQuota(userId)
  const breakdown = await quotaService.getQuotaBreakdown(userId)

  return c.json({
    remaining: quotaCheck.remaining,
    used: quotaCheck.current,
    limit: quotaCheck.limit,
    resetAt: quotaCheck.resetAt,
    breakdown
  })
})

// GET /api/quota/history - Get quota usage history
router.get('/history', authMiddleware, async (c) => {
  const userId = c.get('userId')

  const history = await prisma.quotaUsage.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 30 // Last 30 days
  })

  return c.json({ history })
})

export default router
```

---

### 4. Model Usage Stats Routes (NEW)

**File:** `backend/src/routes/model-stats.routes.ts`

```typescript
import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.middleware'
import prisma from '../db/client'

const router = new Hono()

// GET /api/models/usage - Get user's model usage stats
router.get('/usage', authMiddleware, async (c) => {
  const userId = c.get('userId')

  const usages = await prisma.modelUsage.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      model: {
        select: {
          name: true,
          provider: true,
          tier: true
        }
      }
    }
  })

  return c.json({ usages })
})

// GET /api/models/popular - Get most used models (global stats)
router.get('/popular', async (c) => {
  const popularModels = await prisma.aIModel.findMany({
    where: { enabled: true },
    orderBy: { totalUsage: 'desc' },
    take: 10,
    select: {
      modelKey: true,
      name: true,
      provider: true,
      tier: true,
      totalUsage: true
    }
  })

  return c.json({ models: popularModels })
})

export default router
```

---

## ⏰ BACKGROUND JOBS

### 1. Daily Quota Reset Job

**File:** `backend/src/jobs/reset-quotas.job.ts`

```typescript
import { quotaService } from '../services/quota.service'

/**
 * Daily Quota Reset Job
 * Run daily at 00:00 UTC
 */
export const resetDailyQuotasJob = async () => {
  console.log('🔄 Starting daily quota reset job...')

  try {
    const resetCount = await quotaService.resetDailyQuotas()
    console.log(`✅ Reset ${resetCount} daily quotas`)
  } catch (error) {
    console.error('❌ Error resetting daily quotas:', error)
  }
}
```

---

### 2. Subscription Expiry Job

**File:** `backend/src/jobs/expire-subscriptions.job.ts`

```typescript
import { subscriptionService } from '../services/subscription.service'

/**
 * Subscription Expiry Job
 * Run hourly to check expired subscriptions
 */
export const expireSubscriptionsJob = async () => {
  console.log('🔄 Checking for expired subscriptions...')

  try {
    const expiredCount = await subscriptionService.expireSubscriptions()

    if (expiredCount > 0) {
      console.log(`⏰ Expired ${expiredCount} subscriptions`)
      // TODO: Send email notifications
    }
  } catch (error) {
    console.error('❌ Error expiring subscriptions:', error)
  }
}
```

---

### 3. Cron Setup

**File:** `backend/src/jobs/scheduler.ts`

```typescript
import cron from 'node-cron'
import { resetDailyQuotasJob } from './reset-quotas.job'
import { expireSubscriptionsJob } from './expire-subscriptions.job'

/**
 * Initialize all cron jobs
 */
export const initializeScheduler = () => {
  // Daily quota reset - Run at 00:00 UTC
  cron.schedule('0 0 * * *', resetDailyQuotasJob)
  console.log('✅ Scheduled: Daily quota reset (00:00 UTC)')

  // Subscription expiry check - Run every hour
  cron.schedule('0 * * * *', expireSubscriptionsJob)
  console.log('✅ Scheduled: Subscription expiry check (hourly)')
}
```

**Update:** `backend/src/index.ts`

```typescript
import app from './app'
import { initializeScheduler } from './jobs/scheduler'

const PORT = process.env.PORT || 3000

// Initialize cron jobs
initializeScheduler()

console.log(`🚀 Server running on port ${PORT}`)

export default {
  port: PORT,
  fetch: app.fetch,
}
```

---

## 🔄 MIGRATION STRATEGY

### Step 1: Create Prisma Migration

```bash
npx prisma migrate dev --name add_subscription_and_quota_system
```

### Step 2: Seed Subscription Plans

**File:** `backend/prisma/seeds/subscription-plans.seed.ts`

```typescript
import prisma from '../../src/db/client'

export const seedSubscriptionPlans = async () => {
  const plans = [
    {
      planId: 'free-forever',
      tier: 'free',
      name: 'Free Forever',
      description: 'Perfect for trying out Lumiku',
      price: 0,
      billingCycle: 'monthly',
      dailyQuota: 10,
      monthlyQuota: 300,
      maxModelTier: 'free',
      features: JSON.stringify({
        freeModelsOnly: true,
        basicSupport: true
      }),
      isActive: true,
      displayOrder: 0
    },
    {
      planId: 'basic-monthly',
      tier: 'basic',
      name: 'Basic Monthly',
      description: 'Great for individuals and small projects',
      price: 99000,
      billingCycle: 'monthly',
      dailyQuota: 50,
      monthlyQuota: 1500,
      maxModelTier: 'basic',
      features: JSON.stringify({
        basicModels: true,
        emailSupport: true,
        noWatermark: true
      }),
      isActive: true,
      displayOrder: 1
    },
    {
      planId: 'pro-monthly',
      tier: 'pro',
      name: 'Pro Monthly',
      description: 'Perfect for professionals and agencies',
      price: 299000,
      billingCycle: 'monthly',
      dailyQuota: 100,
      monthlyQuota: 3000,
      maxModelTier: 'pro',
      features: JSON.stringify({
        proModels: true,
        prioritySupport: true,
        apiAccess: true,
        customBranding: true
      }),
      isActive: true,
      displayOrder: 2
    },
    {
      planId: 'enterprise-monthly',
      tier: 'enterprise',
      name: 'Enterprise Monthly',
      description: 'Unlimited power for large teams',
      price: 999000,
      billingCycle: 'monthly',
      dailyQuota: 500,
      monthlyQuota: 15000,
      maxModelTier: 'enterprise',
      features: JSON.stringify({
        allModels: true,
        dedicatedSupport: true,
        apiAccess: true,
        customBranding: true,
        sla: true,
        onPremise: true
      }),
      isActive: true,
      displayOrder: 3
    },
    {
      planId: 'pro-yearly',
      tier: 'pro',
      name: 'Pro Yearly',
      description: 'Save 20% with annual billing',
      price: 2870000, // 299k * 12 * 0.8
      billingCycle: 'yearly',
      dailyQuota: 100,
      monthlyQuota: 3000,
      maxModelTier: 'pro',
      features: JSON.stringify({
        proModels: true,
        prioritySupport: true,
        apiAccess: true,
        customBranding: true,
        yearlyDiscount: true
      }),
      isActive: true,
      displayOrder: 4
    }
  ]

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { planId: plan.planId },
      update: plan,
      create: plan
    })
  }

  console.log('✅ Seeded subscription plans')
}
```

---

### Step 3: Seed AI Models

**File:** `backend/prisma/seeds/ai-models.seed.ts`

```typescript
import prisma from '../../src/db/client'

export const seedAIModels = async () => {
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
      quotaCost: 1,
      capabilities: JSON.stringify({
        maxDuration: 300,
        crossfade: true
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

  console.log('✅ Seeded AI models')
}
```

---

### Step 4: Migrate Existing Users

**File:** `backend/prisma/seeds/migrate-users.seed.ts`

```typescript
import prisma from '../../src/db/client'

export const migrateExistingUsers = async () => {
  // Set all existing users to PAYG by default
  await prisma.user.updateMany({
    where: {
      accountType: { equals: null }
    },
    data: {
      accountType: 'payg',
      subscriptionTier: 'free'
    }
  })

  console.log('✅ Migrated existing users to PAYG')
}
```

---

### Step 5: Run All Seeds

**File:** `backend/prisma/seed.ts`

```typescript
import { seedSubscriptionPlans } from './seeds/subscription-plans.seed'
import { seedAIModels } from './seeds/ai-models.seed'
import { migrateExistingUsers } from './seeds/migrate-users.seed'

async function main() {
  console.log('🌱 Starting database seeding...')

  await seedSubscriptionPlans()
  await seedAIModels()
  await migrateExistingUsers()

  console.log('✅ Database seeding completed')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    const { default: prisma } = await import('../src/db/client')
    await prisma.$disconnect()
  })
```

Add to `package.json`:
```json
{
  "prisma": {
    "seed": "bun run prisma/seed.ts"
  }
}
```

---

## ✅ TESTING CHECKLIST

### Subscription Users
- [ ] Can subscribe to plan successfully
- [ ] Subscription status updates user accountType
- [ ] Can access models within tier
- [ ] Cannot access models above tier
- [ ] Daily quota initializes correctly
- [ ] Quota increments on generation
- [ ] Cannot exceed daily quota (429 error)
- [ ] Quota resets at midnight UTC
- [ ] Can cancel subscription
- [ ] Cancelled subscription remains active until period ends
- [ ] Expired subscription reverts to PAYG
- [ ] Can upgrade plan mid-cycle
- [ ] Can downgrade plan mid-cycle
- [ ] Quota limit updates on plan change

### PAYG Users
- [ ] Default accountType is "payg"
- [ ] Can access free tier models
- [ ] Can access basic tier models (expensive credits)
- [ ] Cannot access pro/enterprise models (403 error)
- [ ] Credit deduction works correctly
- [ ] Insufficient credit error (402)
- [ ] Can purchase credits
- [ ] Can upgrade to subscription
- [ ] Upgrading creates subscription record
- [ ] User tier updates on subscription

### Model Access Control
- [ ] Model registry returns correct models per tier
- [ ] getUserAccessibleModels filters correctly
- [ ] requireModelAccess middleware blocks unauthorized
- [ ] Hybrid usage middleware detects user type
- [ ] Dynamic cost calculation (duration/resolution)
- [ ] Model usage records created
- [ ] Model stats increment

### Edge Cases
- [ ] Concurrent quota checks (race condition)
- [ ] Quota at exactly limit (boundary)
- [ ] Subscription expires during active session
- [ ] Change plan with active quota
- [ ] Model disabled mid-generation
- [ ] Invalid model key handling
- [ ] User without subscription record
- [ ] Quota reset job runs successfully
- [ ] Subscription expiry job runs successfully

### API Endpoints
- [ ] GET /api/apps returns filtered apps
- [ ] GET /api/apps/:appId/models returns user models
- [ ] GET /api/subscription/plans returns all plans
- [ ] GET /api/subscription/status returns user subscription
- [ ] POST /api/subscription/subscribe creates subscription
- [ ] POST /api/subscription/cancel cancels subscription
- [ ] POST /api/subscription/change-plan updates plan
- [ ] GET /api/quota/status returns quota info
- [ ] GET /api/quota/history returns usage history

---

## 📅 IMPLEMENTATION TIMELINE

### **Week 1: Database Foundation** (Jan 15-21)
**Day 1-2:** Schema Design & Migration
- [ ] Update User model
- [ ] Create AIModel table
- [ ] Create SubscriptionPlan table
- [ ] Create Subscription table
- [ ] Create QuotaUsage table
- [ ] Create ModelUsage table
- [ ] Run migration

**Day 3-4:** Seeding
- [ ] Seed subscription plans
- [ ] Seed AI models for all apps
- [ ] Migrate existing users to PAYG

**Day 5:** Testing
- [ ] Test database queries
- [ ] Verify relationships
- [ ] Check indexes

---

### **Week 2: Core Services** (Jan 22-28)
**Day 1-2:** Model Registry Service
- [ ] Implement ModelRegistryService
- [ ] getAppModels()
- [ ] getUserAccessibleModels()
- [ ] canAccessModel()
- [ ] getModelCost()
- [ ] Unit tests

**Day 3-4:** Subscription & Quota Services
- [ ] Implement SubscriptionService
- [ ] Implement QuotaService
- [ ] Unit tests

**Day 5:** Access Control Service
- [ ] Implement AccessControlService
- [ ] validateAccess()
- [ ] Integration tests

---

### **Week 3: Middleware & APIs** (Jan 29 - Feb 4)
**Day 1-2:** Middleware
- [ ] requireModelAccess middleware
- [ ] deductModelUsage middleware
- [ ] recordModelUsage middleware
- [ ] Integration tests

**Day 3-4:** API Endpoints
- [ ] Update /api/apps endpoint
- [ ] Create /api/apps/:appId/models
- [ ] Create subscription routes
- [ ] Create quota routes
- [ ] Create model stats routes

**Day 5:** Testing
- [ ] API integration tests
- [ ] Postman collection

---

### **Week 4: Update App Routes** (Feb 5-11)
**Day 1:** Video Generator
- [ ] Update to use model-specific middleware
- [ ] Test with different models
- [ ] Test quota vs credit

**Day 2:** Poster Editor
- [ ] Update inpaint endpoints
- [ ] Update enhance endpoints
- [ ] Test model access

**Day 3:** Other Apps
- [ ] Update Carousel Mix
- [ ] Update Looping Flow
- [ ] Update Video Mixer

**Day 4-5:** Testing & Bug Fixes
- [ ] End-to-end testing
- [ ] Fix issues

---

### **Week 5: Background Jobs & Polish** (Feb 12-18)
**Day 1-2:** Cron Jobs
- [ ] Implement quota reset job
- [ ] Implement subscription expiry job
- [ ] Test cron scheduler

**Day 3-4:** Edge Cases & Polish
- [ ] Handle edge cases
- [ ] Add logging
- [ ] Performance optimization

**Day 5:** Documentation
- [ ] API documentation
- [ ] Usage examples
- [ ] Admin guide

---

### **Week 6: Frontend Integration** (Feb 19-25)
**Day 1-2:** Model Selector UI
- [ ] Model dropdown with tier badges
- [ ] Cost preview (credit/quota)
- [ ] Access restriction UI

**Day 3:** Quota Display
- [ ] Quota meter in dashboard
- [ ] Real-time quota updates
- [ ] Reset countdown

**Day 4:** Subscription Management
- [ ] Plan comparison page
- [ ] Upgrade/downgrade UI
- [ ] Billing history

**Day 5:** Final Testing & Launch
- [ ] Full system test
- [ ] Load testing
- [ ] Production deployment

---

## 🎯 SUCCESS METRICS

### Technical Metrics
- ✅ All API endpoints return correct filtered data
- ✅ Quota reset runs daily without errors
- ✅ No race conditions in quota checks
- ✅ Model usage tracking 100% accurate
- ✅ Zero downtime deployment

### Business Metrics
- ✅ Subscription conversion rate > 10%
- ✅ PAYG users upgrade to subscription
- ✅ Model usage evenly distributed
- ✅ Premium models drive subscription upgrades
- ✅ Daily quota utilization > 70%

---

## 📝 NOTES & CONSIDERATIONS

### Security
- Always validate user tier before model access
- Rate limit API endpoints to prevent abuse
- Audit log for subscription changes
- Encrypt sensitive payment data

### Performance
- Index all foreign keys and frequently queried fields
- Cache user tier and subscription status (Redis)
- Batch quota updates when possible
- Use database transactions for critical operations

### Scalability
- Quota system can handle millions of daily resets
- Model registry supports dynamic model additions
- Horizontal scaling ready (stateless middleware)
- Background jobs can run on separate workers

### Future Enhancements
- [ ] Team subscriptions (multiple users per plan)
- [ ] API access for enterprise
- [ ] Custom model training for enterprise
- [ ] Webhook for subscription events
- [ ] Detailed analytics dashboard
- [ ] A/B testing for pricing tiers

---

## 🆘 TROUBLESHOOTING GUIDE

### Issue: Quota not resetting
**Solution:** Check cron job logs, verify resetAt timestamp

### Issue: User can't access model
**Solution:** Verify user tier, check model.tier, inspect access control logic

### Issue: Credit deducted for subscription user
**Solution:** Verify accountType field, check hybrid middleware logic

### Issue: Subscription expired but still active
**Solution:** Run expireSubscriptionsJob manually, check endDate

### Issue: Model cost incorrect
**Solution:** Verify creditPerSecond/creditPerPixel calculation, check params

---

## 📚 REFERENCES

- Prisma Documentation: https://www.prisma.io/docs
- Hono Middleware Guide: https://hono.dev/guides/middleware
- Node-Cron: https://github.com/node-cron/node-cron
- Date-fns: https://date-fns.org/

---

**END OF IMPLEMENTATION GUIDE**

Last Updated: 2025-01-15
Version: 1.0.0
