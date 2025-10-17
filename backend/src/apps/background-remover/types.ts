export type BackgroundRemovalTier = 'basic' | 'standard' | 'professional' | 'industry'
export type BackgroundRemovalStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'partial'
export type PricingType = 'credit' | 'subscription'
export type SubscriptionPlan = 'starter' | 'pro'
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'suspended'

export interface BackgroundRemovalJob {
  id: string
  userId: string
  batchId?: string
  itemIndex?: number
  status: BackgroundRemovalStatus
  originalUrl: string
  processedUrl?: string
  thumbnailUrl?: string
  originalSize?: number
  processedSize?: number
  tier: BackgroundRemovalTier
  aiProvider?: string
  modelName?: string
  creditsUsed: number
  pricingType: PricingType
  processingTime?: number
  errorMessage?: string
  retryCount: number
  metadata?: Record<string, any>
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
}

export interface BackgroundRemovalBatch {
  id: string
  userId: string
  batchId: string
  status: BackgroundRemovalStatus
  totalImages: number
  processedImages: number
  failedImages: number
  tier: BackgroundRemovalTier
  totalCredits: number
  discountPercentage: number
  originalPrice: number
  finalPrice: number
  zipUrl?: string
  zipSize?: number
  zipGenerated: boolean
  progressPercentage: number
  estimatedTimeMs?: number
  processingTimeMs?: number
  notificationSent: boolean
  emailSentAt?: Date
  errorMessage?: string
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  jobs?: BackgroundRemovalJob[]
}

export interface BackgroundRemoverSubscription {
  id: string
  userId: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  monthlyPrice: number
  dailyQuota: number
  professionalDailyQuota: number
  allowedTiers: BackgroundRemovalTier[]
  subscribedAt: Date
  currentPeriodEnd: Date
  nextBillingDate?: Date
  cancelledAt?: Date
  cancelReason?: string
  autoRenew: boolean
  lastPaymentId?: string
  paymentMethod?: string
  createdAt: Date
  updatedAt: Date
  usageRecords?: BackgroundRemoverSubscriptionUsage[]
}

export interface BackgroundRemoverSubscriptionUsage {
  id: string
  subscriptionId: string
  userId: string
  date: string
  tier: BackgroundRemovalTier
  removalsCount: number
  totalCreditsEquivalent: number
  createdAt: Date
  updatedAt: Date
}

export interface CreateJobRequest {
  imageFile?: File
  imageUrl?: string
  tier: BackgroundRemovalTier
}

export interface CreateBatchRequest {
  imageFiles?: File[]
  imageUrls?: string[]
  tier: BackgroundRemovalTier
}

export interface PricingCalculation {
  totalImages: number
  tier: BackgroundRemovalTier
  creditPerImage: number
  originalPrice: number
  discountPercentage: number
  discountAmount: number
  finalPrice: number
  savings: number
}

export interface SubscriptionQuotaCheck {
  hasSubscription: boolean
  plan?: SubscriptionPlan
  dailyQuota: number
  usedToday: number
  remainingToday: number
  professionalQuota: number
  professionalUsedToday: number
  professionalRemainingToday: number
  canUseSubscription: boolean
  needsCredits: boolean
  quotaExceeded: boolean
}

export interface BatchProcessingJob {
  batchId: string
  userId: string
  tier: BackgroundRemovalTier
  items: {
    id: string
    itemIndex: number
    originalUrl: string
  }[]
}

export interface AIProcessingResult {
  success: boolean
  processedUrl?: string
  processingTime: number
  aiProvider: string
  modelName: string
  error?: string
}

export interface VolumeDiscount {
  min: number
  max: number
  percentage: number
}
