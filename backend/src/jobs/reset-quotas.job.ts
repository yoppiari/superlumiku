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
