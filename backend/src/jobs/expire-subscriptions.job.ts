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
      // TODO: Send email notifications to users
    } else {
      console.log('✅ No subscriptions expired')
    }
  } catch (error) {
    console.error('❌ Error expiring subscriptions:', error)
  }
}
