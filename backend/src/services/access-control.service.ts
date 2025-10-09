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

    const tierHierarchy: Record<string, string[]> = {
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
