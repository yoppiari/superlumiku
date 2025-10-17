import { BackgroundRemovalTier, PricingCalculation } from '../types'
import backgroundRemoverConfig from '../plugin.config'

/**
 * PricingService - Calculate credits with volume discounts
 */
class PricingService {
  /**
   * Get credit cost for a specific tier
   */
  getCreditCostForTier(tier: BackgroundRemovalTier): number {
    return backgroundRemoverConfig.credits[tier] || 0
  }

  /**
   * Calculate volume discount percentage based on quantity
   */
  getVolumeDiscountPercentage(quantity: number): number {
    const discounts = backgroundRemoverConfig.discounts

    if (quantity >= discounts.tier4.min && quantity <= discounts.tier4.max) {
      return discounts.tier4.percentage
    }
    if (quantity >= discounts.tier3.min && quantity <= discounts.tier3.max) {
      return discounts.tier3.percentage
    }
    if (quantity >= discounts.tier2.min && quantity <= discounts.tier2.max) {
      return discounts.tier2.percentage
    }
    if (quantity >= discounts.tier1.min && quantity <= discounts.tier1.max) {
      return discounts.tier1.percentage
    }

    return 0 // No discount for < 20 images
  }

  /**
   * Calculate batch pricing with volume discount
   */
  calculateBatchPricing(
    totalImages: number,
    tier: BackgroundRemovalTier
  ): PricingCalculation {
    const creditPerImage = this.getCreditCostForTier(tier)
    const originalPrice = totalImages * creditPerImage
    const discountPercentage = this.getVolumeDiscountPercentage(totalImages)
    const discountAmount = Math.floor((originalPrice * discountPercentage) / 100)
    const finalPrice = originalPrice - discountAmount
    const savings = discountAmount

    return {
      totalImages,
      tier,
      creditPerImage,
      originalPrice,
      discountPercentage,
      discountAmount,
      finalPrice,
      savings,
    }
  }

  /**
   * Get subscription plan details
   */
  getSubscriptionPlanDetails(plan: 'starter' | 'pro') {
    return backgroundRemoverConfig.subscriptionPlans[plan]
  }

  /**
   * Check if tier is allowed for subscription plan
   */
  isTierAllowedForPlan(tier: BackgroundRemovalTier, plan: 'starter' | 'pro'): boolean {
    const planDetails = this.getSubscriptionPlanDetails(plan)
    return planDetails.allowedTiers.includes(tier)
  }

  /**
   * Get estimated processing time for tier
   */
  getEstimatedProcessingTime(tier: BackgroundRemovalTier): string {
    const tierConfig = backgroundRemoverConfig.tiers[tier]
    return tierConfig?.processingTime || 'Unknown'
  }

  /**
   * Calculate total credits equivalent (for subscription usage tracking)
   */
  calculateCreditsEquivalent(removalsCount: number, tier: BackgroundRemovalTier): number {
    const creditPerImage = this.getCreditCostForTier(tier)
    return removalsCount * creditPerImage
  }
}

export const pricingService = new PricingService()
