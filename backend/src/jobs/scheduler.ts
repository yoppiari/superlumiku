import cron from 'node-cron'
import { resetDailyQuotasJob } from './reset-quotas.job'
import { expireSubscriptionsJob } from './expire-subscriptions.job'

/**
 * Initialize all cron jobs
 */
export const initializeScheduler = () => {
  console.log('⏰ Initializing cron scheduler...')

  // Daily quota reset - Run at 00:00 UTC
  cron.schedule('0 0 * * *', resetDailyQuotasJob, {
    timezone: 'UTC'
  })
  console.log('✅ Scheduled: Daily quota reset (00:00 UTC)')

  // Subscription expiry check - Run every hour
  cron.schedule('0 * * * *', expireSubscriptionsJob, {
    timezone: 'UTC'
  })
  console.log('✅ Scheduled: Subscription expiry check (hourly)')

  console.log('✅ Cron scheduler initialized')
}
