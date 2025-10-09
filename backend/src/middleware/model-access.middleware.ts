import { Context, Next } from 'hono'
import { accessControlService } from '../services/access-control.service'

/**
 * Check if user can access specific AI model
 * Usage: requireModelAccess('video-generator:veo3')
 */
export const requireModelAccess = (modelKey: string) => {
  return async (c: Context, next: Next) => {
    const userId = c.get('userId')

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { allowed, reason, requiredTier } = await accessControlService.canUseModel(userId, modelKey)

    if (!allowed) {
      return c.json({
        error: 'Model access denied',
        reason,
        requiredTier,
        modelKey
      }, 403)
    }

    c.set('modelKey', modelKey)
    await next()
  }
}
