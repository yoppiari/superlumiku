import prisma from '../db/client'
import { AIModel } from '@prisma/client'

export class ModelRegistryService {
  /**
   * Get all models for an app
   */
  async getAppModels(appId: string): Promise<AIModel[]> {
    return await prisma.aIModel.findMany({
      where: {
        appId,
        enabled: true
      },
      orderBy: { tier: 'asc' }
    })
  }

  /**
   * Get models user can access based on their tier
   */
  async getUserAccessibleModels(userId: string, appId: string): Promise<AIModel[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        accountType: true,
        subscriptionTier: true
      }
    })

    if (!user) throw new Error('User not found')

    const tierHierarchy: Record<string, string[]> = {
      'free': ['free'],
      'basic': ['free', 'basic'],
      'pro': ['free', 'basic', 'pro'],
      'enterprise': ['free', 'basic', 'pro', 'enterprise']
    }

    const allowedTiers = tierHierarchy[user.subscriptionTier] || ['free']

    return await prisma.aIModel.findMany({
      where: {
        appId,
        enabled: true,
        tier: { in: allowedTiers }
      },
      orderBy: { tier: 'asc' }
    })
  }

  /**
   * Check if user can access specific model
   */
  async canAccessModel(userId: string, modelKey: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true }
    })

    const model = await prisma.aIModel.findUnique({
      where: { modelKey }
    })

    if (!user || !model) return false

    const tierHierarchy: Record<string, string[]> = {
      'free': ['free'],
      'basic': ['free', 'basic'],
      'pro': ['free', 'basic', 'pro'],
      'enterprise': ['free', 'basic', 'pro', 'enterprise']
    }

    const allowedTiers = tierHierarchy[user.subscriptionTier] || ['free']
    return allowedTiers.includes(model.tier)
  }

  /**
   * Get model cost (credit or quota) based on params
   */
  async getModelCost(modelKey: string, params: any): Promise<{
    creditCost: number
    quotaCost: number
  }> {
    const model = await prisma.aIModel.findUnique({
      where: { modelKey }
    })

    if (!model) throw new Error('Model not found')

    let creditCost = model.creditCost
    let quotaCost = model.quotaCost

    // Calculate dynamic cost for video (duration-based)
    if (model.creditPerSecond && params.duration) {
      creditCost = Math.ceil(model.creditPerSecond * params.duration)
    }

    // Calculate dynamic cost for image (resolution-based)
    if (model.creditPerPixel && params.width && params.height) {
      const megapixels = (params.width * params.height) / 1000000
      creditCost = Math.ceil(model.creditPerPixel * megapixels)
    }

    return { creditCost, quotaCost }
  }

  /**
   * Register/update model in database
   */
  async upsertModel(data: {
    appId: string
    modelId: string
    name: string
    provider: string
    tier: string
    creditCost: number
    quotaCost: number
    capabilities?: any
  }): Promise<AIModel> {
    const modelKey = `${data.appId}:${data.modelId}`

    return await prisma.aIModel.upsert({
      where: { modelKey },
      update: {
        name: data.name,
        provider: data.provider,
        tier: data.tier,
        creditCost: data.creditCost,
        quotaCost: data.quotaCost,
        capabilities: data.capabilities ? JSON.stringify(data.capabilities) : null
      },
      create: {
        appId: data.appId,
        modelId: data.modelId,
        modelKey,
        name: data.name,
        provider: data.provider,
        tier: data.tier,
        creditCost: data.creditCost,
        quotaCost: data.quotaCost,
        capabilities: data.capabilities ? JSON.stringify(data.capabilities) : null
      }
    })
  }
}

export const modelRegistryService = new ModelRegistryService()
