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
