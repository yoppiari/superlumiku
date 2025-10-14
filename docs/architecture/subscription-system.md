# Subscription System - Dual User Model

---
**Last Updated:** 2025-10-14
**Version:** 1.0.0
**Status:** Current
---

## Overview

Lumiku implements a **dual monetization system** supporting both Pay-As-You-Go (PAYG) and Subscription models. This allows flexible pricing for different user segments while providing sophisticated access control based on subscription tiers.

**Key Concepts:**
- **PAYG Users:** Pay per action using credits
- **Subscription Users:** Pay monthly/yearly for quota-based access
- **AI Model Tiers:** Models are categorized by access level (free, basic, pro, enterprise)
- **Dual Tracking:** Separate systems for credit transactions and quota usage

## Account Types

### Pay-As-You-Go (PAYG)

**Database Field:** `User.accountType = "payg"` (default)

**Characteristics:**
- Purchase credits via Duitku payment gateway
- Credits deducted per action based on app configuration
- No recurring payments
- No access to premium AI models (limited to free tier)
- No daily/monthly usage limits (only credit balance)

**Use Cases:**
- Casual users who use the platform occasionally
- Users who want to try the service without commitment
- Users who need flexibility in spending

**Credit System:**
- Credits stored in `User` table (balance calculation from Credit transactions)
- Each action deducts credits based on `pluginConfig.credits`
- Transaction history in `Credit` table
- Purchases create `Payment` records

### Subscription

**Database Field:** `User.accountType = "subscription"`

**Characteristics:**
- Pay monthly/yearly subscription fee
- Access to quota-based AI model usage
- Daily/monthly quota limits based on plan
- Access to premium AI models based on tier
- Recurring billing with auto-renewal

**Subscription Tiers:**
1. **Free Tier** (`User.subscriptionTier = "free"`)
   - Default for all users
   - Access to free-tier AI models only
   - Very limited features

2. **Basic Tier** (`User.subscriptionTier = "basic"`)
   - Monthly/yearly payment
   - Access to free + basic-tier AI models
   - Moderate daily quota (e.g., 50 generations/day)

3. **Pro Tier** (`User.subscriptionTier = "pro"`)
   - Monthly/yearly payment
   - Access to free + basic + pro-tier AI models
   - Higher daily quota (e.g., 200 generations/day)
   - Priority processing

4. **Enterprise Tier** (`User.subscriptionTier = "enterprise"`)
   - Monthly/yearly payment
   - Access to ALL AI models (free + basic + pro + enterprise)
   - Unlimited or very high quotas
   - Priority support
   - Custom features

**Use Cases:**
- Power users who need consistent access
- Businesses requiring premium AI models
- Users wanting predictable monthly costs

## Database Schema

### Core User Fields

```prisma
model User {
  // Account Type
  accountType      String  @default("payg")      // "payg" | "subscription"
  subscriptionTier String  @default("free")      // "free" | "basic" | "pro" | "enterprise"
  userTags         String?                       // JSON: ["enterprise_unlimited", "beta_tester"]

  // Relations
  subscription Subscription?  // One-to-one (null for PAYG users)
  credits      Credit[]       // Transaction history
  quotaUsages  QuotaUsage[]   // Quota tracking
  modelUsages  ModelUsage[]   // AI model usage analytics
}
```

### AI Model Registry

```prisma
model AIModel {
  id       String  @id @default(cuid())

  // Model Identity
  appId    String  // "video-generator", "poster-editor", etc
  modelId  String  // "veo3", "kling-2.5", "flux-dev", etc
  modelKey String  @unique  // "video-generator:veo3"

  // Display Info
  name        String  // "Google Veo 3"
  description String?
  provider    String  // "modelslab", "edenai", "huggingface"

  // Access Control (CRITICAL)
  tier    String   // "free" | "basic" | "pro" | "enterprise"
  enabled Boolean  @default(true)
  beta    Boolean  @default(false)

  // Pricing for PAYG users
  creditCost      Int    // Base credit cost
  creditPerSecond Float? // For video: cost per second
  creditPerPixel  Float? // For image: cost per megapixel

  // Quota for Subscription users
  quotaCost Int @default(1)  // Heavy models = 2-5 quota

  // Capabilities (JSON)
  capabilities String?  // {maxDuration, resolutions, aspectRatios}

  // Stats
  totalUsage Int @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Example Models:**
- `video-generator:veo3` - Google Veo 3 (Pro tier, 15 credits OR 2 quotas)
- `poster-editor:flux-dev` - FLUX.1-dev (Basic tier, 5 credits OR 1 quota)
- `avatar-creator:sdxl` - Stable Diffusion XL (Free tier, 3 credits OR 1 quota)

### Subscription Plans

```prisma
model SubscriptionPlan {
  id     String @id @default(cuid())
  planId String @unique  // "basic-monthly", "pro-yearly"

  // Plan Info
  tier        String  // "basic" | "pro" | "enterprise"
  name        String  // "Pro Monthly"
  description String?

  // Pricing
  price        Float   // Rupiah
  billingCycle String  // "monthly" | "yearly"

  // Quotas
  dailyQuota   Int    // 100 generations per day
  monthlyQuota Int?   // Optional monthly cap

  // Model Access
  maxModelTier String  // "basic" | "pro" | "enterprise"

  // Features (JSON)
  features String?  // {prioritySupport, customBranding, etc}

  // Status
  isActive     Boolean @default(true)
  displayOrder Int     @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Example Plans:**
- `basic-monthly`: $10/month, 50/day quota, access to basic-tier models
- `pro-monthly`: $30/month, 200/day quota, access to pro-tier models
- `pro-yearly`: $300/year (save 2 months), 200/day quota, pro-tier models
- `enterprise-monthly`: $100/month, 1000/day quota, all models

### Active Subscription

```prisma
model Subscription {
  id     String @id @default(cuid())
  userId String @unique
  planId String

  // Status
  status String  // "active" | "cancelled" | "expired" | "grace_period" | "suspended"

  // Billing Period
  startDate    DateTime
  endDate      DateTime
  billingCycle String  // "monthly" | "yearly"

  // Auto-renewal
  autoRenew       Boolean   @default(true)
  nextBillingDate DateTime?

  // Payment
  lastPaymentId String?

  // Cancellation
  cancelledAt  DateTime?
  cancelReason String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User             @relation(fields: [userId], references: [id])
  plan SubscriptionPlan @relation(fields: [planId], references: [id])
}
```

### Quota Usage Tracking

```prisma
model QuotaUsage {
  id     String @id @default(cuid())
  userId String

  // Period Tracking
  quotaType String  // "daily" | "monthly"
  period    String  // "2025-10-14" for daily, "2025-10" for monthly

  // Usage
  usageCount Int @default(0)  // Total quota used in period
  quotaLimit Int              // From subscription plan

  // Breakdown by model (JSON)
  modelBreakdown String?  // {"veo3": 50, "kling": 30, "flux-dev": 20}

  // Auto-reset
  resetAt DateTime

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])

  @@unique([userId, period, quotaType])
}
```

### Model Usage Analytics

```prisma
model ModelUsage {
  id       String @id @default(cuid())
  userId   String
  appId    String  // "video-generator"
  modelKey String  // "video-generator:veo3"

  // Usage Type
  usageType String  // "credit" (PAYG) | "quota" (Subscription)

  // Cost/Quota
  creditUsed Int?  // For PAYG users
  quotaUsed  Int?  // For Subscription users (usually 1, heavy = 2-5)

  // Action metadata
  action   String   // "generate_video", "inpaint_poster"
  metadata String?  // JSON: {duration: 5, resolution: "720p"}

  createdAt DateTime @default(now())

  user  User    @relation(fields: [userId], references: [id])
  model AIModel @relation(fields: [modelKey], references: [modelKey])
}
```

## Access Control Logic

### Model Access Determination

```typescript
function canAccessModel(user: User, model: AIModel): boolean {
  // Model must be enabled
  if (!model.enabled) return false

  // Check user account type
  if (user.accountType === 'payg') {
    // PAYG users can only access free-tier models
    return model.tier === 'free'
  }

  if (user.accountType === 'subscription') {
    // Check subscription tier hierarchy
    const tierHierarchy = ['free', 'basic', 'pro', 'enterprise']
    const userTierIndex = tierHierarchy.indexOf(user.subscriptionTier)
    const modelTierIndex = tierHierarchy.indexOf(model.tier)

    // User can access models at or below their tier
    return userTierIndex >= modelTierIndex
  }

  return false
}
```

**Examples:**
- Free user: Can access free-tier models only
- Basic subscriber: Can access free + basic-tier models
- Pro subscriber: Can access free + basic + pro-tier models
- Enterprise subscriber: Can access ALL models

### Quota Checking

```typescript
async function canUseQuota(userId: string, quotaRequired: number = 1): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } })

  // PAYG users don't use quotas (they use credits)
  if (user.accountType === 'payg') return true

  // Get today's quota usage
  const today = new Date().toISOString().split('T')[0]
  const quotaUsage = await prisma.quotaUsage.findUnique({
    where: {
      userId_period_quotaType: {
        userId,
        period: today,
        quotaType: 'daily',
      },
    },
  })

  if (!quotaUsage) {
    // No usage today yet - create record and allow
    return true
  }

  // Check if user has quota remaining
  return quotaUsage.usageCount + quotaRequired <= quotaUsage.quotaLimit
}
```

### Credit Checking

```typescript
async function hasEnoughCredits(userId: string, creditsRequired: number): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } })

  // Subscription users don't use credits
  if (user.accountType === 'subscription') return true

  // Calculate current credit balance
  const creditHistory = await prisma.credit.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 1,
  })

  const currentBalance = creditHistory[0]?.balance || 0
  return currentBalance >= creditsRequired
}
```

## Usage Flow

### PAYG User Flow

1. **User registers:**
   - `accountType = "payg"` (default)
   - `subscriptionTier = "free"` (default)
   - No subscription record created

2. **User purchases credits:**
   - Initiates payment via Duitku
   - `Payment` record created with status "pending"
   - User completes payment
   - Duitku callback validates payment
   - Credits added to account via `Credit` record
   - `Payment` status updated to "success"

3. **User generates content:**
   - App checks credit balance
   - Deducts credits based on action
   - Creates `Credit` record with negative amount
   - Creates `ModelUsage` record with `usageType = "credit"`
   - Balance updated

4. **User checks balance:**
   - Query latest `Credit` record for current balance
   - Show transaction history from `Credit` table

### Subscription User Flow

1. **User subscribes:**
   - Selects plan (Basic/Pro/Enterprise)
   - Completes payment via Duitku
   - `Subscription` record created
   - `User.accountType` set to "subscription"
   - `User.subscriptionTier` set based on plan
   - Daily `QuotaUsage` record initialized

2. **User generates content:**
   - App checks quota availability for today
   - Checks if model tier is accessible
   - Consumes quota (typically 1, heavy models 2-5)
   - Creates `ModelUsage` record with `usageType = "quota"`
   - Updates `QuotaUsage.usageCount`
   - Updates `QuotaUsage.modelBreakdown` JSON

3. **Quota reset (daily):**
   - Automated cron job or on-demand check
   - New `QuotaUsage` record created for new period
   - Old records retained for analytics

4. **Subscription renewal:**
   - Auto-renewal date reached
   - Payment processed via Duitku
   - `Subscription` dates extended
   - `Subscription.lastPaymentId` updated
   - If payment fails: grace period (7 days)
   - After grace period: subscription suspended

5. **User cancels subscription:**
   - `Subscription.autoRenew` set to false
   - `Subscription.cancelledAt` set to now
   - `Subscription.cancelReason` recorded
   - Subscription remains active until `endDate`
   - After `endDate`: status changes to "expired"
   - `User.accountType` reverts to "payg"

## Pricing Strategy

### PAYG Pricing (Credits)

**Credit Calculation:**
```
Total Credits = Base Cost + Feature Costs + Quality Upgrades
```

**Example - Video Mixer:**
- Base generation: 1 credit
- Order mixing: +1 credit
- Speed variations: +1 credit
- HD (720p): +2 credits
- Total: 5 credits per video

**Example - Avatar Creator:**
- Generate avatar (FLUX.1-dev): 10 credits
- Upload avatar: 2 credits
- From preset: 8 credits
- Edit persona: 0 credits (free)

**Credit Packages (Example):**
- Starter: 100 credits = $10 (10¢/credit)
- Basic: 500 credits = $45 (9¢/credit)
- Pro: 1000 credits = $80 (8¢/credit)
- Enterprise: 5000 credits = $350 (7¢/credit)

### Subscription Pricing (Quotas)

**Quota Calculation:**
```
Quota Cost = 1 (standard) or 2-5 (heavy models)
```

**Example Plans:**

**Basic Plan - $10/month:**
- 50 quota/day (1,500/month)
- Access to basic-tier models
- Standard processing priority
- Email support

**Pro Plan - $30/month:**
- 200 quota/day (6,000/month)
- Access to pro-tier models
- Priority processing
- Priority email support
- Early access to new features

**Enterprise Plan - $100/month:**
- 1,000 quota/day (30,000/month)
- Access to ALL models
- Highest priority processing
- Dedicated support
- Custom features
- API access
- Team management

**Yearly Discount:**
- 2 months free (16.7% discount)
- Pro Yearly: $300/year (vs $360)
- Enterprise Yearly: $1,000/year (vs $1,200)

## API Endpoints

### Subscription Management

**Get Available Plans:**
```http
GET /api/subscriptions/plans
Authorization: Bearer {jwt_token}

Response:
[
  {
    "id": "clx...",
    "planId": "pro-monthly",
    "name": "Pro Monthly",
    "tier": "pro",
    "price": 300000,  // Rupiah
    "dailyQuota": 200,
    "billingCycle": "monthly",
    "features": {...}
  }
]
```

**Create Subscription:**
```http
POST /api/subscriptions/create
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "planId": "pro-monthly"
}

Response:
{
  "subscriptionId": "clx...",
  "paymentUrl": "https://passport.duitku.com/...",
  "expiresAt": "2025-10-14T10:00:00Z"
}
```

**Get Current Subscription:**
```http
GET /api/subscriptions/current
Authorization: Bearer {jwt_token}

Response:
{
  "subscription": {
    "id": "clx...",
    "plan": {
      "name": "Pro Monthly",
      "tier": "pro",
      "dailyQuota": 200
    },
    "status": "active",
    "startDate": "2025-10-01T00:00:00Z",
    "endDate": "2025-11-01T00:00:00Z",
    "autoRenew": true
  }
}
```

**Cancel Subscription:**
```http
POST /api/subscriptions/cancel
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "reason": "Too expensive"
}

Response:
{
  "message": "Subscription cancelled. Access until 2025-11-01",
  "endDate": "2025-11-01T00:00:00Z"
}
```

### Quota Management

**Get Quota Usage:**
```http
GET /api/quotas/usage?period=2025-10-14
Authorization: Bearer {jwt_token}

Response:
{
  "quotaType": "daily",
  "period": "2025-10-14",
  "usageCount": 45,
  "quotaLimit": 200,
  "remaining": 155,
  "modelBreakdown": {
    "video-generator:veo3": 20,
    "poster-editor:flux-dev": 15,
    "avatar-creator:sdxl": 10
  },
  "resetAt": "2025-10-15T00:00:00Z"
}
```

**Check Quota Availability:**
```http
POST /api/quotas/check
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "modelKey": "video-generator:veo3",
  "quotaRequired": 2
}

Response:
{
  "available": true,
  "remaining": 155,
  "quotaLimit": 200
}
```

### Credit Management (PAYG)

**Get Credit Balance:**
```http
GET /api/credits/balance
Authorization: Bearer {jwt_token}

Response:
{
  "balance": 150,
  "lastTransaction": {
    "amount": -5,
    "type": "usage",
    "description": "Video Mixer generation",
    "createdAt": "2025-10-14T08:30:00Z"
  }
}
```

**Get Credit History:**
```http
GET /api/credits/history?limit=20&offset=0
Authorization: Bearer {jwt_token}

Response:
{
  "transactions": [
    {
      "id": "clx...",
      "amount": -5,
      "balance": 145,
      "type": "usage",
      "description": "Video Mixer generation",
      "referenceType": "video_mixer_generation",
      "referenceId": "clx...",
      "createdAt": "2025-10-14T08:30:00Z"
    },
    {
      "id": "clx...",
      "amount": 100,
      "balance": 150,
      "type": "purchase",
      "description": "Credit purchase",
      "paymentId": "clx...",
      "createdAt": "2025-10-14T08:00:00Z"
    }
  ],
  "total": 45,
  "limit": 20,
  "offset": 0
}
```

### Model Access

**Get Available Models:**
```http
GET /api/models/available?appId=video-generator
Authorization: Bearer {jwt_token}

Response:
{
  "models": [
    {
      "modelKey": "video-generator:veo3",
      "name": "Google Veo 3",
      "tier": "pro",
      "accessible": true,  // Based on user's subscription tier
      "creditCost": 15,
      "quotaCost": 2,
      "capabilities": {
        "maxDuration": 5,
        "resolutions": ["720p", "1080p"],
        "aspectRatios": ["16:9", "9:16"]
      }
    }
  ]
}
```

## Migration Between Account Types

### From PAYG to Subscription

```typescript
async function migrateToSubscription(userId: string, planId: string) {
  // 1. Create subscription
  const subscription = await prisma.subscription.create({
    data: {
      userId,
      planId,
      status: 'active',
      startDate: new Date(),
      endDate: addMonths(new Date(), 1),
      billingCycle: 'monthly',
      autoRenew: true,
    },
  })

  // 2. Update user account type
  await prisma.user.update({
    where: { id: userId },
    data: {
      accountType: 'subscription',
      subscriptionTier: subscription.plan.tier,
    },
  })

  // 3. Initialize quota usage
  const today = new Date().toISOString().split('T')[0]
  await prisma.quotaUsage.create({
    data: {
      userId,
      quotaType: 'daily',
      period: today,
      usageCount: 0,
      quotaLimit: subscription.plan.dailyQuota,
      resetAt: addDays(new Date(), 1),
    },
  })

  // 4. Existing credits are preserved (can still be used or refunded)
  // Note: User can keep unused credits as a bonus
}
```

### From Subscription to PAYG

```typescript
async function migrateToPayg(userId: string) {
  // 1. Cancel subscription
  await prisma.subscription.update({
    where: { userId },
    data: {
      status: 'cancelled',
      autoRenew: false,
      cancelledAt: new Date(),
    },
  })

  // 2. Update user account type (after subscription expires)
  await prisma.user.update({
    where: { id: userId },
    data: {
      accountType: 'payg',
      subscriptionTier: 'free',
    },
  })

  // 3. Quota usage records are preserved for analytics
  // but no longer enforced
}
```

## Special User Tags

**Enterprise Unlimited:**
```json
User.userTags = '["enterprise_unlimited"]'
```
- Bypass quota checks
- Unlimited daily usage
- Access to all models

**Beta Tester:**
```json
User.userTags = '["beta_tester"]'
```
- Access to beta models
- Early feature access
- Special testing quotas

**Implementation:**
```typescript
function checkUserTag(user: User, tag: string): boolean {
  if (!user.userTags) return false
  const tags = JSON.parse(user.userTags)
  return tags.includes(tag)
}

// Usage
if (checkUserTag(user, 'enterprise_unlimited')) {
  // Bypass quota checks
}
```

## Analytics & Reporting

### Subscription Metrics

```sql
-- Active subscriptions by tier
SELECT
  tier,
  COUNT(*) as active_count,
  SUM(price) as monthly_revenue
FROM subscriptions s
JOIN subscription_plans sp ON s.planId = sp.id
WHERE s.status = 'active'
GROUP BY tier;

-- Churn rate
SELECT
  COUNT(CASE WHEN cancelledAt IS NOT NULL THEN 1 END)::float /
  COUNT(*)::float * 100 as churn_percentage
FROM subscriptions
WHERE endDate > NOW() - INTERVAL '30 days';
```

### Quota Analytics

```sql
-- Average quota usage by tier
SELECT
  u.subscriptionTier,
  AVG(qu.usageCount) as avg_daily_usage,
  AVG(qu.quotaLimit) as avg_daily_limit,
  AVG(qu.usageCount::float / qu.quotaLimit::float * 100) as avg_utilization
FROM quota_usages qu
JOIN users u ON qu.userId = u.id
WHERE qu.quotaType = 'daily'
  AND qu.period >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY u.subscriptionTier;

-- Most used models
SELECT
  modelKey,
  COUNT(*) as usage_count,
  COUNT(DISTINCT userId) as unique_users
FROM model_usages
WHERE createdAt >= NOW() - INTERVAL '30 days'
GROUP BY modelKey
ORDER BY usage_count DESC;
```

### Revenue Analytics

```sql
-- Monthly recurring revenue (MRR)
SELECT
  SUM(CASE WHEN billingCycle = 'monthly' THEN price ELSE price / 12 END) as mrr
FROM subscriptions s
JOIN subscription_plans sp ON s.planId = sp.id
WHERE s.status = 'active';

-- Credit purchase revenue
SELECT
  DATE_TRUNC('month', createdAt) as month,
  COUNT(*) as purchases,
  SUM(amount) as total_revenue,
  AVG(amount) as avg_purchase
FROM payments
WHERE status = 'success'
GROUP BY month
ORDER BY month DESC;
```

## Related Documentation

- **[Architecture Overview](./overview.md)** - Complete system architecture
- **[Database Schema](./database-schema.md)** - All database models
- **[API Reference - Subscriptions](../api/subscriptions.md)** - Subscription endpoints
- **[API Reference - Credits](../api/credits.md)** - Credit endpoints
- **[API Reference - Quotas](../api/quotas.md)** - Quota endpoints
- **[Payment Security](../security/payment-security.md)** - Payment integration security

---

**Document Status:** Current
**Last Updated:** 2025-10-14
**Maintainer:** Technical Team
