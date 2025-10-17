# Background Remover Pro - Pricing Logic Documentation

## Table of Contents
1. [Overview](#overview)
2. [Tier Pricing](#tier-pricing)
3. [Volume Discounts](#volume-discounts)
4. [Subscription Model](#subscription-model)
5. [Pricing Calculator Implementation](#pricing-calculator-implementation)
6. [Break-Even Analysis](#break-even-analysis)
7. [Test Cases](#test-cases)

---

## Overview

Background Remover Pro uses a **hybrid pricing model**:

1. **Credit-based**: Pay per image (always for batches, fallback for single images)
2. **Subscription**: Unlimited single image removals within daily quota

### Credit System

- **1 credit = Rp 100**
- Credits are deducted **upfront** for batch processing
- Credits are deducted **after success** for single images
- **No refunds** for failed images in batch (partial processing still charges)

---

## Tier Pricing

### Cost Structure per Tier

| Tier | Model | Provider | Credits/Image | IDR/Image | HPP (IDR) | Margin % |
|------|-------|----------|---------------|-----------|-----------|----------|
| **Basic** | RMBG-1.4 | HuggingFace | 3 | 300 | 17.5 | 94.17% |
| **Standard** | RMBG-2.0 | HuggingFace | 8 | 800 | 51.75 | 93.53% |
| **Professional** | BiRefNet-General | Segmind | 15 | 1,500 | 86.25 | 94.25% |
| **Industry** | BiRefNet-Portrait | Segmind | 25 | 2,500 | 138 | 94.48% |

### HPP Calculation

```typescript
// Exchange rate: Rp 15,000 per $1

// Basic tier (HuggingFace RMBG-1.4)
const basicCostUSD = 0.00117  // Per API call
const basicHPP = basicCostUSD * 15000 // = 17.5 IDR

// Standard tier (HuggingFace RMBG-2.0)
const standardCostUSD = 0.00345
const standardHPP = standardCostUSD * 15000 // = 51.75 IDR

// Professional tier (Segmind BiRefNet-General)
const professionalCostUSD = 0.00575
const professionalHPP = professionalCostUSD * 15000 // = 86.25 IDR

// Industry tier (Segmind BiRefNet-Portrait)
const industryCostUSD = 0.0092
const industryHPP = industryCostUSD * 15000 // = 138 IDR
```

### Margin Calculation

```typescript
function calculateMargin(sellPrice: number, costPrice: number): number {
  return ((sellPrice - costPrice) / sellPrice) * 100
}

// Example: Professional tier
const professionalMargin = calculateMargin(1500, 86.25)
// = ((1500 - 86.25) / 1500) * 100
// = (1413.75 / 1500) * 100
// = 94.25%
```

---

## Volume Discounts

### Discount Tiers

| Image Count | Discount | Example (100 images @ Standard) |
|-------------|----------|----------------------------------|
| 1-19 | 0% | 19 × 8 = 152 credits |
| 20-50 | 5% | 50 × 8 × 0.95 = 380 credits |
| 51-100 | 10% | 100 × 8 × 0.90 = 720 credits |
| 101-200 | 15% | 200 × 8 × 0.85 = 1,360 credits |
| 201-500 | 20% | 500 × 8 × 0.80 = 3,200 credits |

### Implementation

```typescript
// src/modules/background-remover/config/pricing.config.ts

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

export function findVolumeDiscount(imageCount: number): VolumeDiscount {
  const discount = VOLUME_DISCOUNTS.find(
    (d) => imageCount >= d.minImages && imageCount <= d.maxImages
  )

  if (!discount) {
    throw new Error(`Invalid image count: ${imageCount}`)
  }

  return discount
}
```

### Discount Calculation Formula

```typescript
function calculateBatchCost(
  tier: RemovalTier,
  imageCount: number
): {
  baseCreditsPerImage: number
  baseTotal: number
  discountPercentage: number
  discountAmount: number
  finalTotal: number
  creditsPerImageAfterDiscount: number
} {
  // Step 1: Get tier pricing
  const tierConfig = TIER_CONFIGS[tier]
  const baseCreditsPerImage = tierConfig.creditsPerImage

  // Step 2: Calculate base cost
  const baseTotal = baseCreditsPerImage * imageCount

  // Step 3: Find applicable discount
  const discountRule = findVolumeDiscount(imageCount)
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
```

### Example Calculations

#### Example 1: 100 images @ Standard tier

```typescript
const result = calculateBatchCost('standard', 100)

// Result:
{
  baseCreditsPerImage: 8,
  baseTotal: 800,              // 100 × 8
  discountPercentage: 10,      // 51-100 range
  discountAmount: 80,          // 800 × 0.10
  finalTotal: 720,             // 800 - 80
  creditsPerImageAfterDiscount: 7.2  // 720 / 100
}

// Savings: 80 credits = Rp 8,000
// Final cost: 720 credits = Rp 72,000
// Per image: 7.2 credits = Rp 720
```

#### Example 2: 250 images @ Professional tier

```typescript
const result = calculateBatchCost('professional', 250)

// Result:
{
  baseCreditsPerImage: 15,
  baseTotal: 3750,             // 250 × 15
  discountPercentage: 20,      // 201-500 range
  discountAmount: 750,         // 3750 × 0.20
  finalTotal: 3000,            // 3750 - 750
  creditsPerImageAfterDiscount: 12  // 3000 / 250
}

// Savings: 750 credits = Rp 75,000
// Final cost: 3000 credits = Rp 300,000
// Per image: 12 credits = Rp 1,200 (vs Rp 1,500 regular)
```

---

## Subscription Model

### Plan Comparison

| Feature | Starter | Pro |
|---------|---------|-----|
| **Price** | Rp 99,000/mo | Rp 299,000/mo |
| **Daily Quota** | 50 removals | 200 removals |
| **Allowed Tiers** | Basic, Standard | Basic, Standard, Professional* |
| **Professional Quota** | - | 50/day max |
| **Batch Processing** | Pay credits | Pay credits |
| **Volume Discount** | Yes | Yes |

*Professional tier limited to 50 uses/day on Pro plan

### Subscription Value Calculation

#### Starter Plan

```typescript
// Starter: Rp 99,000/month = Rp 3,300/day (30 days)
// Daily quota: 50 removals

// If using Basic tier only:
const basicCostPerImage = 300  // Rp
const dailyValueBasic = 50 * 300 // = 15,000 Rp/day
const monthlyValueBasic = dailyValueBasic * 30 // = 450,000 Rp/month

// ROI: 450,000 / 99,000 = 4.55x value

// If using Standard tier only:
const standardCostPerImage = 800  // Rp
const dailyValueStandard = 50 * 800 // = 40,000 Rp/day
const monthlyValueStandard = dailyValueStandard * 30 // = 1,200,000 Rp/month

// ROI: 1,200,000 / 99,000 = 12.12x value
```

#### Pro Plan

```typescript
// Pro: Rp 299,000/month = Rp 9,967/day (30 days)
// Daily quota: 200 removals (50 Professional max)

// Mixed usage: 150 Standard + 50 Professional
const standardValue = 150 * 800 // = 120,000 Rp/day
const professionalValue = 50 * 1500 // = 75,000 Rp/day
const dailyTotal = standardValue + professionalValue // = 195,000 Rp/day
const monthlyTotal = dailyTotal * 30 // = 5,850,000 Rp/month

// ROI: 5,850,000 / 299,000 = 19.57x value
```

### Subscription Quota Logic

```typescript
// src/modules/background-remover/services/subscription.service.ts

interface SubscriptionQuota {
  canUse: boolean
  reason?: string
  remainingQuota: number
  remainingProfessionalQuota?: number
}

async function checkSubscriptionQuota(
  userId: string,
  tier: RemovalTier
): Promise<SubscriptionQuota> {
  // Step 1: Get active subscription
  const subscription = await prisma.background_remover_subscriptions.findFirst({
    where: {
      user_id: userId,
      status: 'active',
      expires_at: { gte: new Date() },
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
  if (!subscription.allowed_tiers.includes(tier)) {
    return {
      canUse: false,
      reason: `Tier '${tier}' not allowed in ${subscription.plan} plan`,
      remainingQuota: 0,
    }
  }

  // Step 3: Get today's usage
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayUsage = await prisma.background_remover_subscription_usage.findMany({
    where: {
      subscription_id: subscription.id,
      date: today,
    },
  })

  const totalUsedToday = todayUsage.reduce((sum, u) => sum + u.removals_count, 0)

  // Step 4: Check general quota
  if (totalUsedToday >= subscription.daily_quota) {
    return {
      canUse: false,
      reason: 'Daily quota exceeded',
      remainingQuota: 0,
    }
  }

  // Step 5: Check Professional tier quota (Pro plan only)
  if (tier === 'professional' && subscription.plan === 'pro') {
    const professionalUsage = todayUsage.find((u) => u.tier === 'professional')
    const professionalUsedToday = professionalUsage?.removals_count || 0

    if (professionalUsedToday >= subscription.professional_daily_quota) {
      return {
        canUse: false,
        reason: 'Professional tier daily quota exceeded',
        remainingQuota: subscription.daily_quota - totalUsedToday,
        remainingProfessionalQuota: 0,
      }
    }

    return {
      canUse: true,
      remainingQuota: subscription.daily_quota - totalUsedToday,
      remainingProfessionalQuota:
        subscription.professional_daily_quota - professionalUsedToday,
    }
  }

  return {
    canUse: true,
    remainingQuota: subscription.daily_quota - totalUsedToday,
  }
}
```

### Subscription vs Credits Decision Tree

```
┌─────────────────────────────────────┐
│ User wants to remove background     │
└────────────┬────────────────────────┘
             │
             ▼
      ┌──────────────┐
      │ Batch (2-500)│──────────► ALWAYS use credits
      │   images?    │            (with volume discount)
      └──────┬───────┘
             │ No
             ▼
      ┌─────────────────┐
      │ Has active       │──── No ───► Use credits
      │ subscription?    │
      └──────┬──────────┘
             │ Yes
             ▼
      ┌─────────────────┐
      │ Tier allowed     │──── No ───► Use credits
      │ in plan?         │
      └──────┬──────────┘
             │ Yes
             ▼
      ┌─────────────────┐
      │ Daily quota      │──── No ───► Use credits
      │ available?       │
      └──────┬──────────┘
             │ Yes
             ▼
      ┌─────────────────┐
      │ Professional     │──── Yes ───┐
      │ tier?            │            │
      └──────┬──────────┘            │
             │ No                     │
             │                        ▼
             │              ┌──────────────────┐
             │              │ Professional     │─ No ─► Use credits
             │              │ quota available? │
             │              └─────────┬────────┘
             │                        │ Yes
             │                        │
             └────────────────────────┘
                          │
                          ▼
                ┌─────────────────┐
                │ USE SUBSCRIPTION │
                │ (increment quota)│
                └──────────────────┘
```

---

## Pricing Calculator Implementation

### Frontend Calculator Component

```typescript
// frontend/src/lib/components/background-remover/PricingCalculator.svelte

<script lang="ts">
  import { derived } from 'svelte/store'
  import { useBackgroundRemoverStore } from '../../stores/background-remover.store'

  const store = useBackgroundRemoverStore()

  // Reactive pricing calculation
  $: pricing = calculatePricing($store.uploadedFiles.length, $store.selectedTier)

  function calculatePricing(imageCount: number, tier: string) {
    if (imageCount === 0) return null

    const tierPricing = {
      basic: 3,
      standard: 8,
      professional: 15,
      industry: 25,
    }

    const baseCreditsPerImage = tierPricing[tier] || 0
    const baseTotal = baseCreditsPerImage * imageCount

    // Find discount
    let discountPercentage = 0
    if (imageCount >= 20 && imageCount <= 50) discountPercentage = 5
    else if (imageCount >= 51 && imageCount <= 100) discountPercentage = 10
    else if (imageCount >= 101 && imageCount <= 200) discountPercentage = 15
    else if (imageCount >= 201) discountPercentage = 20

    const discountAmount = Math.floor(baseTotal * (discountPercentage / 100))
    const finalTotal = baseTotal - discountAmount

    return {
      imageCount,
      tier,
      baseCreditsPerImage,
      baseTotal,
      baseTotalIDR: baseTotal * 100,
      discountPercentage,
      discountAmount,
      discountAmountIDR: discountAmount * 100,
      finalTotal,
      finalTotalIDR: finalTotal * 100,
      creditsPerImageAfterDiscount: (finalTotal / imageCount).toFixed(2),
      perImageIDR: Math.floor((finalTotal * 100) / imageCount),
    }
  }

  function formatIDR(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }
</script>

{#if pricing}
  <div class="pricing-card">
    <h3>Pricing Summary</h3>

    <div class="pricing-row">
      <span>Images:</span>
      <strong>{pricing.imageCount}</strong>
    </div>

    <div class="pricing-row">
      <span>Tier:</span>
      <strong>{pricing.tier}</strong>
    </div>

    <div class="pricing-row">
      <span>Base cost:</span>
      <span>{pricing.baseTotal} credits ({formatIDR(pricing.baseTotalIDR)})</span>
    </div>

    {#if pricing.discountPercentage > 0}
      <div class="pricing-row discount">
        <span>Volume discount ({pricing.discountPercentage}%):</span>
        <span class="savings">
          -{pricing.discountAmount} credits (-{formatIDR(pricing.discountAmountIDR)})
        </span>
      </div>
    {/if}

    <div class="pricing-row total">
      <span>Total cost:</span>
      <strong>{pricing.finalTotal} credits ({formatIDR(pricing.finalTotalIDR)})</strong>
    </div>

    <div class="pricing-row per-image">
      <span>Per image:</span>
      <span>~{formatIDR(pricing.perImageIDR)}</span>
    </div>

    {#if pricing.discountPercentage > 0}
      <div class="savings-badge">
        You save {formatIDR(pricing.discountAmountIDR)}!
      </div>
    {/if}
  </div>
{/if}
```

---

## Break-Even Analysis

### When Subscription Makes Sense

#### Starter Plan Break-Even

```typescript
// Starter: Rp 99,000/month

// Break-even with Basic tier:
const breakEvenBasic = 99000 / 300 // = 330 images/month
// → If you process >330 Basic images/month, subscribe

// Break-even with Standard tier:
const breakEvenStandard = 99000 / 800 // = 124 images/month
// → If you process >124 Standard images/month, subscribe

// Daily break-even (30 days):
const dailyBreakEvenBasic = 330 / 30 // = 11 images/day
const dailyBreakEvenStandard = 124 / 30 // = 4.1 images/day

// Conclusion:
// - If you process 5+ Standard images/day → Subscribe to Starter
// - If you process 11+ Basic images/day → Subscribe to Starter
```

#### Pro Plan Break-Even

```typescript
// Pro: Rp 299,000/month

// Break-even with Standard tier:
const breakEvenStandard = 299000 / 800 // = 374 images/month
// = 12.5 images/day

// Break-even with Professional tier:
const breakEvenProfessional = 299000 / 1500 // = 199 images/month
// = 6.6 images/day

// Mixed usage break-even (50% Standard, 50% Professional):
const avgCost = (800 + 1500) / 2 // = 1150 Rp/image
const breakEvenMixed = 299000 / 1150 // = 260 images/month
// = 8.7 images/day

// Conclusion:
// - If you process 7+ Professional images/day → Subscribe to Pro
// - If you process 13+ Standard images/day → Subscribe to Pro
// - If you mix tiers and process 9+ images/day → Subscribe to Pro
```

### ROI Calculator

```typescript
function calculateSubscriptionROI(
  plan: 'starter' | 'pro',
  dailyUsage: { basic?: number; standard?: number; professional?: number }
): {
  monthlySubscriptionCost: number
  monthlyCreditCost: number
  monthlySavings: number
  roi: number
  breakEvenDays: number
} {
  const planPrices = {
    starter: 99000,
    pro: 299000,
  }

  const tierPrices = {
    basic: 300,
    standard: 800,
    professional: 1500,
  }

  const subscriptionCost = planPrices[plan]

  // Calculate monthly credit cost (30 days)
  const basicCost = (dailyUsage.basic || 0) * tierPrices.basic * 30
  const standardCost = (dailyUsage.standard || 0) * tierPrices.standard * 30
  const professionalCost = (dailyUsage.professional || 0) * tierPrices.professional * 30
  const totalCreditCost = basicCost + standardCost + professionalCost

  const savings = totalCreditCost - subscriptionCost
  const roi = (savings / subscriptionCost) * 100

  // Break-even calculation
  const dailyCreditCost = totalCreditCost / 30
  const dailySubscriptionCost = subscriptionCost / 30
  const dailySavings = dailyCreditCost - dailySubscriptionCost
  const breakEvenDays = dailySavings > 0 ? subscriptionCost / dailySavings : Infinity

  return {
    monthlySubscriptionCost: subscriptionCost,
    monthlyCreditCost: totalCreditCost,
    monthlySavings: savings,
    roi,
    breakEvenDays: Math.ceil(breakEvenDays),
  }
}

// Example: Pro plan with 10 Standard + 5 Professional per day
const roi = calculateSubscriptionROI('pro', {
  standard: 10,
  professional: 5,
})

console.log(roi)
// {
//   monthlySubscriptionCost: 299000,
//   monthlyCreditCost: 2490000,  // (10*800 + 5*1500) * 30
//   monthlySavings: 2191000,
//   roi: 732.78%,
//   breakEvenDays: 5
// }
```

---

## Test Cases

### Test Suite

```typescript
// src/modules/background-remover/services/__tests__/pricing.test.ts

import { describe, it, expect } from 'bun:test'
import { calculateBatchCost } from '../pricing.service'

describe('Pricing Service - Volume Discounts', () => {
  it('should apply 0% discount for 19 images', () => {
    const result = calculateBatchCost('basic', 19)
    expect(result.discountPercentage).toBe(0)
    expect(result.finalTotal).toBe(57) // 19 * 3
  })

  it('should apply 5% discount for 20 images', () => {
    const result = calculateBatchCost('basic', 20)
    expect(result.baseTotal).toBe(60)
    expect(result.discountPercentage).toBe(5)
    expect(result.discountAmount).toBe(3) // Math.floor(60 * 0.05)
    expect(result.finalTotal).toBe(57) // 60 - 3
  })

  it('should apply 5% discount for 50 images', () => {
    const result = calculateBatchCost('standard', 50)
    expect(result.baseTotal).toBe(400)
    expect(result.discountPercentage).toBe(5)
    expect(result.discountAmount).toBe(20)
    expect(result.finalTotal).toBe(380)
  })

  it('should apply 10% discount for 51 images', () => {
    const result = calculateBatchCost('standard', 51)
    expect(result.baseTotal).toBe(408)
    expect(result.discountPercentage).toBe(10)
    expect(result.discountAmount).toBe(40) // Math.floor(408 * 0.10)
    expect(result.finalTotal).toBe(368)
  })

  it('should apply 10% discount for 100 images', () => {
    const result = calculateBatchCost('professional', 100)
    expect(result.baseTotal).toBe(1500)
    expect(result.discountPercentage).toBe(10)
    expect(result.discountAmount).toBe(150)
    expect(result.finalTotal).toBe(1350)
  })

  it('should apply 15% discount for 101 images', () => {
    const result = calculateBatchCost('professional', 101)
    expect(result.baseTotal).toBe(1515)
    expect(result.discountPercentage).toBe(15)
    expect(result.discountAmount).toBe(227) // Math.floor(1515 * 0.15)
    expect(result.finalTotal).toBe(1288)
  })

  it('should apply 15% discount for 200 images', () => {
    const result = calculateBatchCost('industry', 200)
    expect(result.baseTotal).toBe(5000)
    expect(result.discountPercentage).toBe(15)
    expect(result.discountAmount).toBe(750)
    expect(result.finalTotal).toBe(4250)
  })

  it('should apply 20% discount for 201 images', () => {
    const result = calculateBatchCost('industry', 201)
    expect(result.baseTotal).toBe(5025)
    expect(result.discountPercentage).toBe(20)
    expect(result.discountAmount).toBe(1005)
    expect(result.finalTotal).toBe(4020)
  })

  it('should apply 20% discount for 500 images', () => {
    const result = calculateBatchCost('basic', 500)
    expect(result.baseTotal).toBe(1500)
    expect(result.discountPercentage).toBe(20)
    expect(result.discountAmount).toBe(300)
    expect(result.finalTotal).toBe(1200)
  })
})

describe('Pricing Service - Edge Cases', () => {
  it('should throw error for 0 images', () => {
    expect(() => calculateBatchCost('basic', 0)).toThrow()
  })

  it('should throw error for 501 images', () => {
    expect(() => calculateBatchCost('basic', 501)).toThrow()
  })

  it('should throw error for negative images', () => {
    expect(() => calculateBatchCost('basic', -5)).toThrow()
  })

  it('should throw error for invalid tier', () => {
    expect(() => calculateBatchCost('invalid' as any, 10)).toThrow()
  })
})

describe('Pricing Service - Rounding', () => {
  it('should round down discount amount', () => {
    // 33 images * 3 credits = 99 credits
    // 5% discount = 99 * 0.05 = 4.95
    // Should round down to 4
    const result = calculateBatchCost('basic', 33)
    expect(result.discountAmount).toBe(4) // Not 5
    expect(result.finalTotal).toBe(95) // 99 - 4
  })
})
```

---

## Summary

**Key Takeaways**:

1. **Tier margins**: All tiers maintain 92-95% profit margins
2. **Volume discounts**: 5-20% discount for batches, encouraging larger orders
3. **Subscription value**: 4.5x to 19.5x ROI for regular users
4. **Break-even**: Starter at 5+ images/day, Pro at 7+ images/day
5. **Credit deduction**: Upfront for batches, post-success for single images

**Next Steps**: See QUEUE_SYSTEM.md for batch processing implementation.
