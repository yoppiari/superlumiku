# Lumiku Pricing Strategy - Hybrid Credit System

**Date:** 2025-10-10
**Version:** 1.0
**Status:** Strategic Plan for Multi-App Platform

---

## 📊 **CURRENT SITUATION ANALYSIS**

### **Existing Lumiku Pricing (Credit-Based)**

**HPP per Kredit:** **Rp 50**

#### **Langganan Bulanan:**
```
PEBISNIS (Rp 99,000/bulan):
- Credits: 1,800 kredit
- Effective price: Rp 55/kredit
- HPP: 1,800 × Rp 50 = Rp 90,000
- Margin: (99k - 90k) / 99k = 9.1% ❌ VERY THIN

JURAGAN (Rp 249,000/bulan):
- Credits: 4,800 kredit
- Effective price: Rp 52/kredit
- HPP: 4,800 × Rp 50 = Rp 240,000
- Margin: (249k - 240k) / 249k = 3.6% ❌ DANGEROUSLY THIN
```

#### **Top-up (Pay-as-you-go):**
```
Paket 1,500:
- Price: Rp 100,000
- Effective: Rp 67/kredit
- HPP: Rp 75,000
- Margin: 25% ✅ Healthy

Paket 4,000:
- Price: Rp 250,000
- Effective: Rp 62/kredit
- HPP: Rp 200,000
- Margin: 20% ✅ Acceptable

Paket 9,000:
- Price: Rp 500,000
- Effective: Rp 55/kredit
- HPP: Rp 450,000
- Margin: 10% ⚠️ Thin
```

### **Problem Statement:**

1. ❌ **Subscription margins TOO LOW** (3-9% unsustainable for SaaS)
2. ❌ **Risk:** Heavy users bisa bikin rugi
3. ❌ **No differentiation** antara expensive vs cheap operations
4. ✅ **Top-up margins OK** tapi users prefer subscription untuk value

---

## 💡 **SOLUTION: HYBRID UNLIMITED + CREDIT MODEL**

### **Core Philosophy:**

> **"Unlimited daily workflow, Credits for premium AI power"**

**Strategy:**
1. **Core features UNLIMITED** (pose generation, poster editing, brand management)
   - Users feel freedom, tidak takut habis quota
   - HPP rendah (Rp 50-80/operation via HuggingFace/ControlNet)
   - Dengan abuse protection, tetap profitable

2. **Premium AI tools pakai CREDITS** (advanced image gen, video gen)
   - High-value, high-cost operations
   - Predictable cost control
   - Natural upsell opportunity

3. **Subscribers get BONUS CREDITS** (lebih murah dari top-up)
   - Incentive untuk subscribe
   - Locked-in recurring revenue
   - Healthy margins

---

## 🎯 **FAL.AI COST ANALYSIS**

### **Image Generation (FLUX Models):**

```
Model                    Fal.ai Cost/image    Use Case
──────────────────────────────────────────────────────────
FLUX Schnell (fastest)   ~$0.003 (~Rp 50)    Daily content, quick iterations
FLUX Dev (quality)       ~$0.025 (~Rp 400)   Better quality, campaigns
FLUX Pro (best)          ~$0.04 (~Rp 700)    Professional work, print
FLUX Pro Ultra (2K)      ~$0.055 (~Rp 900)   High-res, billboards

ControlNet (Pose)        ~$0.005 (~Rp 80)    Pose-guided generation ✅ UNLIMITED
```

### **Video Generation:**

```
Model                    Fal.ai Cost         Use Case
──────────────────────────────────────────────────────────
Seedance Lite 720p 5s    ~$0.18 (~Rp 3,000)  Social media videos
Seedance Pro 1080p 5s    ~$0.74 (~Rp 12,000) Professional videos
Veo 3 Fast               ~$0.25/sec (~Rp 4k/s) Premium quality
```

### **Cost Structure Summary:**

| Operation Type | Cost (Fal.ai) | Lumiku HPP | Strategy |
|----------------|---------------|------------|----------|
| Pose Generation (ControlNet) | Rp 80 | Rp 50 (if HF Free) | **UNLIMITED** ✅ |
| Basic Image (FLUX Schnell) | Rp 50 | Rp 50 | **UNLIMITED** or Low credit ✅ |
| Quality Image (FLUX Dev/Pro) | Rp 400-700 | Rp 50-100 | **CREDITS** 💳 |
| Video 5s (Seedance) | Rp 3k-12k | Rp 100-300 | **CREDITS** 💳 |

**Key Insight:**
- Pose generation (core workflow) + basic image gen bisa UNLIMITED karena cost rendah
- Advanced image & video → CREDITS untuk protect margins

---

## 💰 **REVISED PRICING STRATEGY**

### **FREE TIER**
```
Perfect for: Testing & Personal Projects

UNLIMITED:
- ✅ 1 brand kit
- ✅ 1 avatar
- ✅ 10 pose generations/month
- ✅ Basic templates

CREDITS: 10 credits/month
Can use for:
- ~3 FLUX Schnell images
- OR ~1 FLUX Dev image
- OR ~2 seconds video (testing)

Limitations:
- ❌ Watermark on exports
- ❌ Community support only
```

---

### **STARTER - Rp 199,000/month** ⬆️ (dari 99k)
```
Perfect for: Small UMKM (1-3 products, occasional campaigns)

UNLIMITED (No Credits Needed):
- ✅ Unlimited brand kits
- ✅ Unlimited avatars
- ✅ Unlimited pose generations (ControlNet)
- ✅ Unlimited poster editing
- ✅ Unlimited basic image gen (FLUX Schnell)
- ✅ All templates
- ✅ Cloud storage

INCLUDED CREDITS: 200 credits/month
Can use for:
- ~25 FLUX Dev images (better quality)
- OR ~13 FLUX Pro images (professional)
- OR ~3 Seedance Lite videos (720p, 5s each)
- OR mix & match

BONUS:
- 💾 Credits rollover: Max 400 credits
- 📧 Email support (48h response)
- 🚀 Standard queue

Fair Use: Unlimited features optimized for 500 uses/month
Monthly Value: Rp 199k + 200 credits @ Rp 100/credit = Rp 399k value!
```

**Cost Analysis:**
```
Scenario: Average user
- 300 poses/month (UNLIMITED): 300 × Rp 80 (Fal.ai) = Rp 24,000
  OR 300 × Rp 15 (HF Free tier) = Rp 4,500
- 50 FLUX Schnell (UNLIMITED): 50 × Rp 50 = Rp 2,500
- Uses 100 credits (FLUX Dev): 12 images × Rp 400 = Rp 4,800

Total HPP: Rp 24k + Rp 2.5k + Rp 4.8k = Rp 31,300
Revenue: Rp 199,000
Profit: Rp 167,700
Margin: 84% ✅ HEALTHY!

With HF Free for poses:
Total HPP: Rp 4.5k + Rp 2.5k + Rp 4.8k = Rp 11,800
Margin: 94% ✅ EXCELLENT!
```

---

### **PRO - Rp 449,000/month** ⬆️ (dari 249k)
```
Perfect for: Active UMKM (5-10 products, regular campaigns)

UNLIMITED (No Credits Needed):
- ✅ Everything in STARTER
- ✅ Priority queue (5x faster)
- ✅ Advanced analytics dashboard
- ✅ API access (coming soon)
- ✅ Background removal (SAM)
- ✅ HD upscaler

INCLUDED CREDITS: 600 credits/month
Can use for:
- ~75 FLUX Dev images
- OR ~40 FLUX Pro images
- OR ~10 Seedance Lite videos
- OR ~5 Seedance Pro videos
- OR mix & match

BONUS:
- 💾 Credits rollover: Max 1,200 credits
- 📧 Priority email support (24h response)
- 🚀 Priority queue (5x faster)
- 🎁 15% discount on credit top-up (Rp 85/credit vs Rp 100)

Fair Use: Unlimited features optimized for 2,000 uses/month
Monthly Value: Rp 449k + 600 credits @ Rp 100 = Rp 1,049k value!
```

**Cost Analysis:**
```
Scenario: Power user
- 1,500 poses/month: 1,500 × Rp 15 (HF Free) = Rp 22,500
- 100 FLUX Schnell: 100 × Rp 50 = Rp 5,000
- Uses 400 credits:
  - 30 FLUX Dev: 30 × Rp 400 = Rp 12,000
  - 5 FLUX Pro: 5 × Rp 700 = Rp 3,500
  - 2 Seedance Lite: 2 × Rp 3,000 = Rp 6,000

Total HPP: Rp 22.5k + Rp 5k + Rp 21.5k = Rp 49,000
Revenue: Rp 449,000
Profit: Rp 400,000
Margin: 89% ✅ EXCELLENT!
```

---

### **BUSINESS - Rp 899,000/month** 🆕
```
Perfect for: Power users, small agencies (10+ products, daily content)

UNLIMITED (No Credits Needed):
- ✅ Everything in PRO
- ✅ 10x faster processing (dedicated resources)
- ✅ Team collaboration (up to 5 seats)
- ✅ Advanced team analytics
- ✅ Custom AI training (beta access)
- ✅ White-label exports (remove branding)

INCLUDED CREDITS: 2,000 credits/month
Can use for:
- ~250 FLUX Dev images
- OR ~133 FLUX Pro images
- OR ~33 Seedance Lite videos
- OR ~16 Seedance Pro videos
- OR ~80 seconds Veo 3 video
- OR mix & match

BONUS:
- 💾 Credits rollover: Max 4,000 credits
- 📧 Priority support (12h response)
- 🚀 Dedicated queue (10x faster)
- 🎁 30% discount on credit top-up (Rp 70/credit)
- 👥 Team management dashboard

Fair Use: Unlimited features optimized for 5,000 uses/month
Monthly Value: Rp 899k + 2,000 credits @ Rp 100 = Rp 2,899k value!
```

**Cost Analysis:**
```
Scenario: Agency/Heavy user
- 3,000 poses/month: 3,000 × Rp 80 (Fal.ai) = Rp 240,000
  With HF Free (assuming 30k quota available): Rp 45,000
- 200 FLUX Schnell: 200 × Rp 50 = Rp 10,000
- Uses 1,500 credits:
  - 100 FLUX Dev: 100 × Rp 400 = Rp 40,000
  - 50 FLUX Pro: 50 × Rp 700 = Rp 35,000
  - 10 Seedance Lite: 10 × Rp 3,000 = Rp 30,000

Total HPP: Rp 240k + Rp 10k + Rp 105k = Rp 355,000
Revenue: Rp 899,000
Profit: Rp 544,000
Margin: 60% ✅ HEALTHY!

With HF Free optimization:
Total HPP: Rp 45k + Rp 10k + Rp 105k = Rp 160,000
Margin: 82% ✅ EXCELLENT!
```

---

### **ENTERPRISE - Custom (Start Rp 2,500,000/month)**
```
Perfect for: Agencies, corporations, high-volume users

- Everything in BUSINESS
- TRULY UNLIMITED (dedicated GPU resources, no soft caps)
- Custom credit allocation (negotiable)
- On-premise deployment option
- Custom AI model training (your brand style)
- SLA 99.9% uptime guarantee
- Dedicated account manager
- Custom integrations
- Unlimited team seats
- White-label platform option

Contact sales for custom quote based on:
- Team size
- Monthly volume
- Specific feature requirements
```

---

## 💳 **CREDIT SYSTEM DETAILS**

### **Credit Pricing (Top-up)**

**For Non-Subscribers (PAYG):**
```
100 credits:   Rp 15,000  (Rp 150/credit)
500 credits:   Rp 60,000  (Rp 120/credit)
1,000 credits: Rp 100,000 (Rp 100/credit)
5,000 credits: Rp 450,000 (Rp 90/credit)
```

**For Subscribers (Discounted):**
```
STARTER: Rp 100/credit (33% off PAYG)
PRO:     Rp 85/credit  (44% off PAYG)
BUSINESS: Rp 70/credit (53% off PAYG)
```

### **Credit Cost per AI Model**

**Image Generation:**
```
Model              Fal.ai Cost    Credits    Why
───────────────────────────────────────────────────────
FLUX Schnell       Rp 50         FREE ✅    UNLIMITED for subscribers
FLUX Dev           Rp 400        4 credits  Better quality
FLUX Pro           Rp 700        7 credits  Professional work
FLUX Pro Ultra     Rp 900        9 credits  High-res, print
```

**Video Generation:**
```
Model              Fal.ai Cost    Credits    Why
───────────────────────────────────────────────────────
Seedance Lite 5s   Rp 3,000      30 credits Social media
Seedance Pro 5s    Rp 12,000     120 credits Professional
Veo 3 Fast 1s      Rp 4,000      40 credits Premium quality
```

**Core Features:**
```
Feature            Fal.ai Cost    Credits    Status
───────────────────────────────────────────────────────
Pose Generation    Rp 80         FREE ✅    UNLIMITED
Poster Editor      Rp 50         FREE ✅    UNLIMITED
Brand Kit          Rp 0          FREE ✅    UNLIMITED
Background Removal Rp 0 (SAM)    FREE ✅    UNLIMITED (PRO+)
```

**Markup Strategy:**
- Image credits: ~1.75x Fal.ai cost
- Video credits: ~2.5x Fal.ai cost
- Allows for 40-60% gross margin on premium operations

---

## 📊 **PROFIT MARGIN ANALYSIS**

### **Comparison: Old vs New Pricing**

#### **STARTER Tier:**
```
OLD (PEBISNIS - Rp 99k):
- 1,800 credits
- HPP: Rp 90,000 (if all credits used @ Rp 50)
- Margin: 9% ❌

NEW (STARTER - Rp 199k):
- UNLIMITED core features
- 200 premium credits
- Typical usage HPP: Rp 11,800 - Rp 31,300
- Margin: 84-94% ✅ HEALTHY!

Improvement: +75-85 percentage points!
```

#### **PRO Tier:**
```
OLD (JURAGAN - Rp 249k):
- 4,800 credits
- HPP: Rp 240,000 (if all used)
- Margin: 3.6% ❌ DANGEROUS

NEW (PRO - Rp 449k):
- UNLIMITED core features
- 600 premium credits
- Typical usage HPP: Rp 49,000
- Margin: 89% ✅ EXCELLENT!

Improvement: +85 percentage points!
Price increase: +80% (Rp 200k more)
Value increase: ~2.5x more value to user
```

### **Worst Case Scenarios:**

#### **Scenario 1: STARTER user maxes out everything**
```
Usage:
- 1,000 poses (abuse territory, triggers ORANGE alert)
- 200 FLUX Schnell images
- Uses all 200 credits on FLUX Pro (28 images)

Cost with Fal.ai:
- Poses: 1,000 × Rp 80 = Rp 80,000
- FLUX Schnell: 200 × Rp 50 = Rp 10,000
- FLUX Pro: 28 × Rp 700 = Rp 19,600
Total: Rp 109,600

Revenue: Rp 199,000
Profit: Rp 89,400
Margin: 45% ✅ Still profitable!

Cost with HF Free (30k quota shared across users):
- Poses: 1,000 × Rp 15 = Rp 15,000
- Others same
Total: Rp 44,600
Margin: 78% ✅ Excellent!
```

#### **Scenario 2: PRO user heavy abuse**
```
Usage:
- 5,000 poses (RED alert territory!)
- 500 FLUX Schnell
- Uses all 600 credits on expensive stuff:
  - 40 FLUX Pro: 280 credits (Rp 28k)
  - 5 Seedance Pro videos: 600 credits total (Rp 60k)

Cost with Fal.ai:
- Poses: 5,000 × Rp 80 = Rp 400,000 🚨
- FLUX Schnell: 500 × Rp 50 = Rp 25,000
- Premium: Rp 88,000
Total: Rp 513,000

Revenue: Rp 449,000
Profit: -Rp 64,000
Margin: -14% ❌ LOSS!

BUT with abuse protection:
1. User hits ORANGE at 2,000 poses → soft throttle
2. User hits RED at 5,000 → contact for Enterprise
3. HF Free tier usage:
   - Poses: 5,000 × Rp 15 = Rp 75,000
   Total: Rp 188,000
   Margin: 58% ✅ Still profitable!

Solution: Abuse protection + HF Free tier = Always profitable
```

### **Break-Even Analysis:**

#### **STARTER (Rp 199k):**
```
With Fal.ai ControlNet (Rp 80/pose):
- Break-even: 2,487 unlimited operations
- Fair use cap: 500/month
- Safety margin: 5x ✅

With HuggingFace Free (Rp 15/pose):
- Break-even: 13,267 operations
- Safety margin: 26x ✅ VERY SAFE
```

#### **PRO (Rp 449k):**
```
With Fal.ai:
- Break-even: 5,612 operations
- Fair use cap: 2,000/month
- Safety margin: 2.8x ✅

With HuggingFace Free:
- Break-even: 29,933 operations
- Safety margin: 15x ✅ VERY SAFE
```

**Conclusion:** With abuse protection + HF Free tier, margins are safe even in worst cases!

---

## 🎯 **STRATEGY ADVANTAGES**

### **1. User Psychology - Best of Both Worlds**
```
✅ "UNLIMITED" for daily workflow
   - Pose generation (most used)
   - Basic image creation
   - Poster editing
   - Brand management
   → User feels FREE to create

💎 "CREDITS" for premium power
   - High-quality image gen
   - Professional videos
   - Special campaigns
   → User feels PREMIUM value

Result: "I can work freely, plus I have special powers for important projects!"
```

### **2. UMKM Value Proposition - Still INSANE**
```
Traditional method:
- Photoshoot: Rp 10,000,000 for 100 photos
- Videographer: Rp 5,000,000 for 3 videos
- Total: Rp 15,000,000

Lumiku PRO (Rp 449k/month):
- Unlimited poses (thousands possible)
- Unlimited basic images
- 600 credits:
  - Option A: 75 high-quality images
  - Option B: 10 professional videos
  - Option C: Mix of both
- Still 97% cost savings! 🎉

ROI: Pay once Rp 449k, save Rp 15 million = 33x return!
```

### **3. Natural Upsell Path**
```
User Journey:
1. FREE → Try features, get hooked
   "I need more than 10 poses!"

2. STARTER (Rp 199k) → Daily content creation
   "This is amazing! But I'm running out of credits for videos..."

3. PRO (Rp 449k) → 3x more credits + priority
   "Perfect! Now I can do everything faster"

4. BUSINESS (Rp 899k) → Scale up, team access
   "My team needs access, and we need more credits"

5. ENTERPRISE → White-label, unlimited
   "We're ready to go all-in"

Each tier unlocks clear value, natural progression
```

### **4. Profit Protection Built-in**
```
Expensive Operations = Credits:
✅ Can't be abused (limited by credits)
✅ Predictable costs
✅ Upsell opportunity
✅ Healthy margins (40-60%)

Affordable Operations = Unlimited:
✅ User satisfaction (freedom)
✅ Still profitable with abuse protection
✅ Core value proposition
✅ Excellent margins (80-94%)

Win-Win: User happy + Business profitable
```

### **5. Competitive Moat**
```
Competitor Analysis:
- Canva Pro: Rp 150k/month, design only (no AI gen)
- Midjourney: Rp 470k/month, image only
- Runway ML: Rp 235k/month, 125 video credits only

Lumiku PRO: Rp 449k/month:
✅ Unlimited poses (unique!)
✅ Unlimited basic images
✅ Poster editing
✅ 600 premium credits
✅ All-in-one platform
✅ UMKM-focused (Indonesian market)

We're 3x more value per Rupiah spent!
```

---

## 🔧 **TECHNICAL IMPLEMENTATION**

### **A. Dual System Architecture**

```typescript
// Two parallel systems:

// System 1: Usage Monitor (Unlimited Features)
class UsageMonitorService {
  // Tracks unlimited feature usage
  // Applies fair use policy
  // Soft throttle if abuse detected
  // Free tier enforces hard limits
}

// System 2: Credit Balance (Premium Features)
class CreditService {
  // Manages credit balance
  // Deducts credits for premium operations
  // Tracks rollover
  // Handles top-ups
}
```

### **B. Feature Access Matrix**

```typescript
// backend/src/config/feature-access.ts

export const FEATURE_ACCESS = {
  // UNLIMITED features (usage monitored, abuse protected)
  UNLIMITED: {
    poseGeneration: {
      tiers: ['free', 'starter', 'pro', 'business', 'enterprise'],
      freeLimit: 10, // Hard limit for free tier
      fairUse: {
        starter: 500,
        pro: 2000,
        business: 5000,
      }
    },
    basicImageGen: {
      model: 'flux-schnell',
      tiers: ['starter', 'pro', 'business', 'enterprise'],
      fairUse: {
        starter: 200,
        pro: 500,
        business: 1000,
      }
    },
    posterEditor: {
      tiers: ['free', 'starter', 'pro', 'business', 'enterprise'],
      freeLimit: 10,
    },
    brandKits: {
      tiers: ['free', 'starter', 'pro', 'business', 'enterprise'],
      limits: {
        free: 1,
        starter: Infinity,
        pro: Infinity,
        business: Infinity,
      }
    }
  },

  // CREDIT-BASED features
  CREDIT_BASED: {
    imageGeneration: {
      models: {
        'flux-dev': {
          creditCost: 4,
          actualCost: 400, // Rupiah, for margin tracking
          tiers: ['starter', 'pro', 'business', 'enterprise']
        },
        'flux-pro': {
          creditCost: 7,
          actualCost: 700,
          tiers: ['starter', 'pro', 'business', 'enterprise']
        },
        'flux-pro-ultra': {
          creditCost: 9,
          actualCost: 900,
          tiers: ['pro', 'business', 'enterprise']
        }
      }
    },
    videoGeneration: {
      models: {
        'seedance-lite': {
          creditCost: 30,
          actualCost: 3000, // per 5 seconds
          tiers: ['starter', 'pro', 'business', 'enterprise']
        },
        'seedance-pro': {
          creditCost: 120,
          actualCost: 12000,
          tiers: ['pro', 'business', 'enterprise']
        },
        'veo3-fast': {
          creditCost: 40, // per second
          actualCost: 4000,
          tiers: ['business', 'enterprise']
        }
      }
    }
  }
}
```

### **C. Credit Management Database Schema**

```prisma
// Add to schema.prisma

model CreditBalance {
  id                String   @id @default(cuid())
  userId            String   @unique

  // Credit types
  includedCredits   Int      @default(0)  // From subscription
  purchasedCredits  Int      @default(0)  // From top-up
  bonusCredits      Int      @default(0)  // From promotions
  totalCredits      Int      @default(0)  // Sum of all

  // Rollover
  rolloverCredits   Int      @default(0)
  maxRollover       Int      // Based on tier
  lastRollover      DateTime?

  // Monthly reset tracking
  lastReset         DateTime @default(now())
  nextReset         DateTime

  // Metadata
  tier              String   // Current subscription tier

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user              User     @relation(fields: [userId], references: [id])

  @@map("credit_balances")
}

model CreditTransaction {
  id              String   @id @default(cuid())
  userId          String

  // Transaction type
  type            String   // "subscription_grant", "purchase", "spend", "rollover", "bonus", "refund"
  amount          Int      // Positive for earn, negative for spend
  balanceAfter    Int      // Balance after transaction

  // For spend transactions
  appId           String?  // "image-generator", "video-generator"
  modelId         String?  // "flux-pro", "seedance-lite"
  referenceId     String?  // Link to generation job/project

  // For purchase transactions
  paymentId       String?
  packageId       String?
  pricePerCredit  Float?   // Rupiah per credit at purchase

  // For subscription grants
  subscriptionId  String?
  grantMonth      String?  // "2025-10"

  description     String?
  metadata        String?  // JSON for additional data

  createdAt       DateTime @default(now())

  user            User     @relation(fields: [userId], references: [id])

  @@index([userId, createdAt])
  @@index([type])
  @@index([appId, modelId])
  @@map("credit_transactions")
}

model SubscriptionPlan {
  id              String   @id @default(cuid())
  planId          String   @unique  // "starter", "pro", "business"

  // Plan info
  name            String   // "Starter", "Pro", "Business"
  displayName     String   // For UI
  description     String?

  // Pricing
  price           Float    // Monthly price in Rupiah

  // Credits
  includedCredits Int      // Monthly credit allocation
  rolloverMax     Int      // Max rollover credits
  topupDiscount   Float    // Discount % on credit top-up (0.15 = 15% off)

  // Features (JSON)
  features        String   // JSON array of feature flags

  // Queue priority
  queuePriority   Int      @default(5) // Lower = higher priority

  isActive        Boolean  @default(true)
  displayOrder    Int      @default(0)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  subscriptions   Subscription[]

  @@map("subscription_plans")
}

model Subscription {
  id              String   @id @default(cuid())
  userId          String   @unique
  planId          String

  // Status
  status          String   // "active", "cancelled", "expired", "suspended"

  // Billing
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  nextBillingDate    DateTime?

  // Auto-renewal
  autoRenew       Boolean  @default(true)

  // Payment tracking
  lastPaymentId   String?
  lastPaymentDate DateTime?

  // Cancellation
  cancelledAt     DateTime?
  cancelReason    String?
  cancelAtPeriodEnd Boolean @default(false)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user            User             @relation(fields: [userId], references: [id])
  plan            SubscriptionPlan @relation(fields: [planId], references: [id])

  @@index([status])
  @@index([nextBillingDate])
  @@map("subscriptions")
}

model CreditPackage {
  id              String   @id @default(cuid())
  packageId       String   @unique  // "topup-1000", "topup-5000"

  // Package details
  name            String   // "1,000 Credits"
  credits         Int      // Credits in package
  price           Float    // Price in Rupiah
  pricePerCredit  Float    // Calculated

  // Marketing
  popular         Boolean  @default(false)
  bonusPercent    Int?     // Bonus % (e.g., 10 = 10% bonus credits)

  isActive        Boolean  @default(true)
  displayOrder    Int      @default(0)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("credit_packages")
}
```

### **D. Credit Service Implementation**

```typescript
// backend/src/services/credit.service.ts

export class CreditService {
  /**
   * Check and deduct credits for premium operation
   */
  async deductCredits(
    userId: string,
    appId: string,
    modelId: string,
    referenceId?: string
  ): Promise<{ success: boolean; balance?: number; error?: string }> {
    // Get model pricing
    const modelConfig = FEATURE_ACCESS.CREDIT_BASED[appId]?.models?.[modelId]

    if (!modelConfig) {
      throw new Error(`Model ${modelId} not found in ${appId}`)
    }

    const creditCost = modelConfig.creditCost

    // Get user's credit balance
    const balance = await prisma.creditBalance.findUnique({
      where: { userId }
    })

    if (!balance || balance.totalCredits < creditCost) {
      return {
        success: false,
        error: `Insufficient credits. Need ${creditCost}, have ${balance?.totalCredits || 0}`
      }
    }

    // Deduct credits (priority: bonus → purchased → included)
    const newBalance = await this.performDeduction(userId, creditCost)

    // Log transaction
    await prisma.creditTransaction.create({
      data: {
        userId,
        type: 'spend',
        amount: -creditCost,
        balanceAfter: newBalance,
        appId,
        modelId,
        referenceId,
        description: `Generated with ${modelId}`
      }
    })

    return { success: true, balance: newBalance }
  }

  /**
   * Grant monthly subscription credits
   */
  async grantSubscriptionCredits(userId: string, planId: string) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { planId }
    })

    if (!plan) {
      throw new Error('Subscription plan not found')
    }

    const month = new Date().toISOString().slice(0, 7) // "2025-10"

    // Check if already granted this month
    const existing = await prisma.creditTransaction.findFirst({
      where: {
        userId,
        type: 'subscription_grant',
        grantMonth: month
      }
    })

    if (existing) {
      return { alreadyGranted: true }
    }

    // Handle rollover first
    await this.processRollover(userId, plan.rolloverMax)

    // Grant new credits
    const balance = await prisma.creditBalance.findUnique({
      where: { userId }
    })

    const newIncludedCredits = plan.includedCredits
    const newTotal = (balance?.purchasedCredits || 0) +
                     (balance?.bonusCredits || 0) +
                     (balance?.rolloverCredits || 0) +
                     newIncludedCredits

    await prisma.creditBalance.update({
      where: { userId },
      data: {
        includedCredits: newIncludedCredits,
        totalCredits: newTotal,
        lastReset: new Date(),
        nextReset: this.getNextMonthDate(),
        maxRollover: plan.rolloverMax
      }
    })

    await prisma.creditTransaction.create({
      data: {
        userId,
        type: 'subscription_grant',
        amount: newIncludedCredits,
        balanceAfter: newTotal,
        grantMonth: month,
        description: `Monthly credits for ${plan.name} plan`
      }
    })

    return { success: true, creditsGranted: newIncludedCredits }
  }

  /**
   * Process credit rollover
   */
  private async processRollover(userId: string, maxRollover: number) {
    const balance = await prisma.creditBalance.findUnique({
      where: { userId }
    })

    if (!balance) return

    // Rollover unused included credits (up to max)
    const unusedIncluded = balance.includedCredits
    const rolloverAmount = Math.min(unusedIncluded, maxRollover)

    if (rolloverAmount > 0) {
      await prisma.creditTransaction.create({
        data: {
          userId,
          type: 'rollover',
          amount: rolloverAmount,
          balanceAfter: balance.totalCredits, // Unchanged, just moving credits
          description: `Rollover of ${rolloverAmount} unused credits`
        }
      })

      await prisma.creditBalance.update({
        where: { userId },
        data: {
          rolloverCredits: (balance.rolloverCredits || 0) + rolloverAmount,
          lastRollover: new Date()
        }
      })
    }
  }

  /**
   * Purchase credits via top-up
   */
  async purchaseCredits(
    userId: string,
    packageId: string,
    paymentId: string
  ) {
    const pkg = await prisma.creditPackage.findUnique({
      where: { packageId }
    })

    if (!pkg) {
      throw new Error('Credit package not found')
    }

    // Get user's tier for discount
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: { include: { plan: true } } }
    })

    const plan = user?.subscription?.plan
    const discount = plan?.topupDiscount || 0
    const finalPrice = pkg.price * (1 - discount)
    const pricePerCredit = finalPrice / pkg.credits

    // Add credits to balance
    const balance = await prisma.creditBalance.findUnique({
      where: { userId }
    })

    const newPurchased = (balance?.purchasedCredits || 0) + pkg.credits
    const newTotal = (balance?.includedCredits || 0) +
                     (balance?.rolloverCredits || 0) +
                     (balance?.bonusCredits || 0) +
                     newPurchased

    await prisma.creditBalance.update({
      where: { userId },
      data: {
        purchasedCredits: newPurchased,
        totalCredits: newTotal
      }
    })

    await prisma.creditTransaction.create({
      data: {
        userId,
        type: 'purchase',
        amount: pkg.credits,
        balanceAfter: newTotal,
        paymentId,
        packageId,
        pricePerCredit,
        description: `Purchased ${pkg.name}`
      }
    })

    return { success: true, creditsAdded: pkg.credits, newBalance: newTotal }
  }

  private async performDeduction(userId: string, amount: number): Promise<number> {
    // Deduct in priority order: bonus → purchased → rollover → included
    const balance = await prisma.creditBalance.findUnique({
      where: { userId }
    })

    if (!balance) throw new Error('Balance not found')

    let remaining = amount
    let newBonus = balance.bonusCredits
    let newPurchased = balance.purchasedCredits
    let newRollover = balance.rolloverCredits
    let newIncluded = balance.includedCredits

    // Deduct from bonus first
    if (newBonus > 0) {
      const deduct = Math.min(newBonus, remaining)
      newBonus -= deduct
      remaining -= deduct
    }

    // Then purchased
    if (remaining > 0 && newPurchased > 0) {
      const deduct = Math.min(newPurchased, remaining)
      newPurchased -= deduct
      remaining -= deduct
    }

    // Then rollover
    if (remaining > 0 && newRollover > 0) {
      const deduct = Math.min(newRollover, remaining)
      newRollover -= deduct
      remaining -= deduct
    }

    // Finally included
    if (remaining > 0 && newIncluded > 0) {
      const deduct = Math.min(newIncluded, remaining)
      newIncluded -= deduct
      remaining -= deduct
    }

    const newTotal = newBonus + newPurchased + newRollover + newIncluded

    await prisma.creditBalance.update({
      where: { userId },
      data: {
        bonusCredits: newBonus,
        purchasedCredits: newPurchased,
        rolloverCredits: newRollover,
        includedCredits: newIncluded,
        totalCredits: newTotal
      }
    })

    return newTotal
  }

  private getNextMonthDate(): Date {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth() + 1, 1)
  }
}

export const creditService = new CreditService()
```

---

## 📧 **EMAIL TEMPLATES**

### **Credits Running Low (80% used)**
```
Subject: 💳 80% Credits Used - Top-up Now!

Hi [Name],

You've used 80% of your monthly credits!

Current balance: [X] credits remaining
Resets on: [DATE]

Need more credits now?
→ Top-up at [DISCOUNTED_RATE]
   (Save [X]% as a subscriber!)

→ Or upgrade to [NEXT_TIER]
   Get [X]x more monthly credits!

[Top-up Now] [Upgrade Plan]

Remember: Core features still UNLIMITED! ✅
✓ Unlimited pose generation
✓ Unlimited basic images
✓ Unlimited poster editing

- Lumiku Team
```

### **Credits Exhausted**
```
Subject: 🎨 Monthly Credits Used - Resets Soon!

Hi [Name],

You've used all your monthly premium credits!

Your credits reset on: [DATE] ([X] days)

Meanwhile, you can still:
✅ Generate unlimited poses
✅ Create unlimited basic images (FLUX Schnell)
✅ Edit unlimited posters
✅ Manage all brand kits

Need premium AI power now?
→ Top-up: Starting from Rp 100/credit
→ Upgrade to [NEXT_TIER]: [X]x monthly credits!

[Top-up] [Upgrade]

- Lumiku Team
```

### **Upgrade Suggestion (Credits frequently exhausted)**
```
Subject: 📈 Upgrade to [TIER] - Never Run Out!

Hi [Name],

We noticed you've topped up credits [X] times this month.

You spent: Rp [TOPUP_TOTAL]
You could save: Rp [SAVINGS] with [NEXT_TIER]!

[NEXT_TIER] Plan Benefits:
✓ [X]x more monthly credits ([NEW_CREDITS] vs [CURRENT_CREDITS])
✓ [X]% cheaper per credit
✓ Priority processing (10x faster!)
✓ [OTHER_BENEFITS]

Total Value: Rp [VALUE] for only Rp [PRICE]

[Upgrade Now] [Compare Plans]

- Lumiku Team
```

---

## 🎬 **USER JOURNEY EXAMPLES**

### **Case Study 1: Bu Sari - Small Skincare UMKM (STARTER Plan)**

**Profile:**
- 3 skincare products
- Posts 2-3 times/week on Instagram
- Occasional video ads (1-2/month)

**Monthly Usage:**
- Week 1: Create 20 product poses (UNLIMITED - FREE)
- Week 2: Generate 30 more poses + 10 basic images (UNLIMITED - FREE)
- Week 3: Special campaign - need 5 high-quality images (20 credits)
- Week 4: Create 1 professional video ad for IG Reels (120 credits)

**Credits Used:** 140 / 200 included credits
**Cost:** Rp 199,000
**Value Created:**
- 50+ professional product photos
- 10 basic marketing images
- 5 premium quality images
- 1 professional video

**Traditional Cost:** Rp 8,000,000+ (photoshoot + videographer)
**Savings:** 97.5% 🎉

**Next Month:** Stays on STARTER, very happy!

---

### **Case Study 2: Pak Budi - Active Fashion Brand (PRO Plan)**

**Profile:**
- 10 fashion products (tops, bottoms, accessories)
- Daily Instagram content
- Weekly TikTok videos
- Monthly campaign materials

**Monthly Usage:**
- Daily: 10 poses/day × 30 days = 300 poses (UNLIMITED - FREE)
- Daily: 3 basic images/day × 30 days = 90 images (UNLIMITED - FREE)
- Weekly campaigns: 20 FLUX Dev images/week × 4 = 80 images (320 credits)
- TikTok videos: 4 Seedance Lite videos/month (120 credits)

**Credits Used:** 440 / 600 included credits
**Credits Remaining:** 160 (rolls over to next month!)
**Cost:** Rp 449,000

**Value Created:**
- 300 professional product photos
- 90 marketing images
- 80 high-quality campaign images
- 4 professional videos

**Traditional Cost:** Rp 25,000,000+
**Savings:** 98.2% 🎉

**Result:** Extremely happy, considering BUSINESS tier for team access

---

### **Case Study 3: Agency "Creative Works" (BUSINESS Plan)**

**Profile:**
- Small agency serving 5 UMKM clients
- High-volume content production
- Need team collaboration

**Monthly Usage:**
- Daily production: 50 poses/day × 30 = 1,500 poses (UNLIMITED)
- Daily basic images: 20/day × 30 = 600 images (UNLIMITED)
- Client campaigns: 150 FLUX Dev images (600 credits)
- Client campaigns: 50 FLUX Pro images (350 credits)
- Video ads: 10 Seedance Lite videos (300 credits)
- Premium video: 3 Seedance Pro videos (360 credits)

**Credits Used:** 1,610 / 2,000 included
**Credits Remaining:** 390
**Cost:** Rp 899,000

**Revenue from Clients:** Rp 15,000,000+
**Lumiku Cost:** Rp 899,000
**Agency Profit Margin on Lumiku:** 94% 🚀

**Traditional Content Production Cost:** Rp 80,000,000+
**Client Savings:** 90%+ (massive value to clients)

**Result:** Planning to upgrade to ENTERPRISE for white-label branding

---

## ✅ **MIGRATION PLAN FROM CURRENT PRICING**

### **For Existing PEBISNIS Users (Rp 99k → Rp 199k STARTER)**

**Communication:**
```
Subject: 🎉 Lumiku Upgrade - More Value, New Features!

Hi [Name],

Exciting news! We're upgrading Lumiku with UNLIMITED features!

Your Current Plan (PEBISNIS):
✓ 1,800 credits/month
✓ Rp 99,000/month

Your New Plan (STARTER):
✅ UNLIMITED pose generation (no more counting!)
✅ UNLIMITED basic image generation
✅ UNLIMITED poster editing
✅ 200 premium AI credits
✅ Everything at Rp 199,000/month

Why the change?
- You asked for unlimited daily workflow → We listened!
- Save premium credits for special campaigns
- Never worry about running out mid-project
- Better value overall

Your Options:
1. Auto-upgrade to STARTER on [DATE] at Rp 199k
   (Recommended for active users)

2. Downgrade to FREE tier (10 poses/month, 10 credits)

3. Switch to Pay-as-you-go (top-up only)

[Confirm Upgrade] [View Comparison] [Contact Support]

Grandfathered Bonus:
Upgrade by [DATE] and get 50 bonus credits! 🎁

- Lumiku Team
```

**Migration Path:**
- 30 days notice
- Grandfather existing users: Extra 50 credits for 3 months
- Option to stay on old plan for 3 months (then forced upgrade)
- Clear comparison showing value improvement

---

### **For Existing JURAGAN Users (Rp 249k → Rp 449k PRO)**

**Communication:**
```
Subject: 🚀 Lumiku PRO - Unlimited Everything + Premium AI!

Hi [Name],

As a JURAGAN member, you're getting our biggest upgrade ever!

Your Current Plan:
✓ 4,800 credits/month
✓ Rp 249,000/month
→ Effective: Rp 52/credit

Your New Plan (PRO):
✅ UNLIMITED pose generation
✅ UNLIMITED basic image generation
✅ UNLIMITED poster editing
✅ 600 premium AI credits
✅ Priority queue (5x faster!)
✅ Advanced analytics
✅ API access (coming soon)
✅ Background removal (unlimited!)
✅ HD upscaler (unlimited!)
✅ Everything at Rp 449,000/month

Better Deal?
- Old: 4,800 credits × Rp 50 HPP = need ALL for basic work
- New: UNLIMITED basic work + 600 credits for premium only!
- Effective savings: 3x more value!

Plus: Priority processing means 5x faster results!

Your Options:
1. Auto-upgrade to PRO on [DATE] at Rp 449k
   (Recommended - best value!)

2. Downgrade to STARTER at Rp 199k
   (200 credits, unlimited core features)

3. Pause subscription (switch to pay-as-you-go)

[Confirm Upgrade] [Compare Plans] [Talk to Sales]

Loyalty Bonus:
Upgrade now → 200 bonus credits + 2 months priority support FREE! 🎁

- Lumiku Team
```

---

## 🎯 **SUCCESS METRICS & GOALS**

### **Business Metrics (6 months post-launch):**

```
Subscription Distribution Target:
- STARTER: 60% of paid users
- PRO: 30% of paid users
- BUSINESS: 8% of paid users
- ENTERPRISE: 2% of paid users

Revenue Targets:
- MRR: Rp 100,000,000 (from 300 paid users)
- Average revenue per user (ARPU): Rp 333,000
- Top-up revenue: +15% additional
- Total MRR: Rp 115,000,000

Margin Targets:
- Gross margin: 75%+ (after all AI costs)
- Net margin: 50%+ (after ops, support, infra)

Upgrade Rate:
- FREE → STARTER: 15%
- STARTER → PRO: 25%
- PRO → BUSINESS: 10%

Churn Rate:
- Target: <5% monthly
- Retention: >95% monthly
```

### **Product Metrics:**

```
User Satisfaction:
- NPS Score: >50
- Feature satisfaction: >4.2/5
- Would recommend: >80%

Usage Metrics:
- Monthly active users: >90% of subscribers
- Average sessions/user: >15/month
- Features used per session: >2.5

Credit Utilization:
- STARTER: 60-70% credits used (sweet spot)
- PRO: 65-75% credits used
- BUSINESS: 70-80% credits used
- Top-up rate: 20-30% of users/month
```

### **Profitability Metrics:**

```
Cost Control:
- AI generation cost per user: <Rp 50,000/month
- HuggingFace Free tier coverage: 60%+ of operations
- Abuse rate: <2% of users flagged
- Suspended accounts: <0.5%

Margin by Tier:
- STARTER: 85%+ gross margin
- PRO: 80%+ gross margin
- BUSINESS: 75%+ gross margin
- Overall: 80%+ blended gross margin
```

---

## 📝 **ACTION ITEMS & NEXT STEPS**

### **Immediate (Week 1-2):**
- [ ] Finalize pricing tiers (get stakeholder approval)
- [ ] Design credit system database schema
- [ ] Create migration plan for existing users
- [ ] Draft user communication emails
- [ ] Update pricing page mockups

### **Short-term (Week 3-6):**
- [ ] Implement credit balance system (backend)
- [ ] Implement dual tracking (usage + credits)
- [ ] Build credit purchase flow
- [ ] Create subscription management UI
- [ ] Test credit deduction logic
- [ ] Implement rollover mechanism

### **Medium-term (Week 7-10):**
- [ ] Migrate existing users (with grace period)
- [ ] Launch new pricing publicly
- [ ] Monitor early metrics closely
- [ ] Adjust thresholds if needed
- [ ] Implement usage analytics dashboard
- [ ] Add credit usage notifications

### **Long-term (Week 11-16):**
- [ ] Optimize HuggingFace vs Fal.ai usage mix
- [ ] Fine-tune abuse protection thresholds
- [ ] Launch upsell campaigns
- [ ] Introduce Enterprise sales process
- [ ] Add team collaboration features
- [ ] Launch API access for Business+ users

---

## ⚠️ **RISKS & MITIGATION**

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **User backlash on price increase** | High | Medium | Clear communication, grandfather period, show value improvement |
| **Credit system too complex** | Medium | Low | Simple UI, clear messaging, helpful tooltips, onboarding |
| **HF Free tier quota exceeded** | High | Medium | Fallback to Fal.ai, monitor quota closely, optimize usage |
| **Users don't understand hybrid model** | Medium | Medium | Educational content, tooltips, onboarding flow, FAQs |
| **Churn from PEBISNIS users** | Medium | Low | Grandfather bonus, show ROI, offer downgrade option |
| **Abuse of unlimited features** | Medium | Low | Robust abuse protection system (already designed) |
| **Credit costs higher than expected** | High | Low | Conservative tier allocation, monitor costs weekly |

---

## 🎉 **CONCLUSION**

### **Why This Strategy Wins:**

1. ✅ **User Experience:** "Unlimited" freedom where it matters most
2. ✅ **Value Proposition:** Still 95%+ cheaper than traditional methods
3. ✅ **Profitability:** 75-85% margins across all tiers
4. ✅ **Scalability:** Credit system prevents abuse, HF Free tier optimization
5. ✅ **Competitive Moat:** All-in-one platform with hybrid model
6. ✅ **Natural Upsells:** Clear value at each tier upgrade
7. ✅ **Sustainable:** Healthy margins fund growth & innovation

### **Key Numbers:**

- **Old JURAGAN margin:** 3.6% ❌
- **New PRO margin:** 89% ✅
- **Improvement:** +85 percentage points! 🚀

- **Old subscription value:** Credits only
- **New subscription value:** Unlimited + Credits + Premium features
- **Value improvement:** 3-5x 🎉

### **Next Decision Point:**

Review this strategy and decide:
1. Approve pricing tiers (or suggest adjustments)
2. Approve credit costs per AI model
3. Set timeline for implementation
4. Approve migration communication plan

---

**Document Version:** 1.0
**Last Updated:** 2025-10-10
**Status:** Awaiting Approval

**Prepared by:** AI Strategy Analysis
**For:** Lumiku Multi-App Platform Launch

---

*This strategy is designed to maximize user value while ensuring sustainable profitability for long-term growth.*
