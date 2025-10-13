# App Routes Update Guide

## Overview
This guide shows how to update existing app routes to use the new hybrid credit/quota system with model-level access control.

## Pattern for Updating Routes

### Before (Old Pattern - Credit Only):
```typescript
routes.post('/generate',
  authMiddleware,
  deductCredits(10, 'generate', 'video-generator'),
  async (c) => {
    // Generate logic
  }
)
```

### After (New Pattern - Hybrid Credit/Quota):
```typescript
import { deductModelUsage } from '../../middleware/hybrid-usage.middleware'
import { recordModelUsage } from '../../middleware/record-model-usage.middleware'

routes.post('/generate',
  authMiddleware,
  async (c) => {
    const { modelId } = await c.req.json()
    const modelKey = `video-generator:${modelId}`

    // 1. Check & deduct usage (credit OR quota)
    const usageMiddleware = deductModelUsage(modelKey, 'generate_video')
    await usageMiddleware(c, async () => {})

    // 2. Perform generation
    const result = await service.generate(...)

    // 3. Record usage after success
    await recordModelUsage(c)

    return c.json({ success: true, result })
  }
)
```

## Apps That Need Updates

### 1. Video Generator (DONE - Example above)
- Multiple AI models (veo3, kling-2.5, wan2.2, veo2)
- Model selection by user
- **File:** `backend/src/apps/video-generator/routes.ts`
- **Endpoint:** `POST /generate`

### 2. Poster Editor
- Multiple AI models (inpaint-standard, inpaint-pro, super-resolution)
- **Files:**
  - `backend/src/apps/poster-editor/routes.ts`
  - `backend/src/apps/poster-editor/controllers/*.ts`
- **Endpoints:**
  - `POST /quick-edit` → Use `poster-editor:inpaint-standard`
  - `POST /batch-inpaint` → Use `poster-editor:inpaint-pro`
  - `POST /enhance` → Use `poster-editor:super-resolution`

### 3. Video Mixer
- Single default model (ffmpeg-standard)
- **File:** `backend/src/apps/video-mixer/routes.ts`
- **Endpoint:** `POST /generate`
- **Model:** `video-mixer:ffmpeg-standard`

### 4. Carousel Mix
- Single default model (canvas-standard)
- **File:** `backend/src/apps/carousel-mix/routes.ts`
- **Endpoint:** `POST /generate`
- **Model:** `carousel-mix:canvas-standard`

### 5. Looping Flow
- Single default model (ffmpeg-loop)
- **File:** `backend/src/apps/looping-flow/routes.ts`
- **Endpoint:** `POST /generate`
- **Model:** `looping-flow:ffmpeg-loop`

## Implementation Steps for Each App

### For Apps with Multiple Models (Video Generator, Poster Editor):

1. **Import middleware:**
   ```typescript
   import { deductModelUsage } from '../../middleware/hybrid-usage.middleware'
   import { recordModelUsage } from '../../middleware/record-model-usage.middleware'
   ```

2. **Update generate endpoint:**
   - Extract `modelId` from request body
   - Construct `modelKey = appId:modelId`
   - Apply `deductModelUsage` middleware
   - After success, call `recordModelUsage`

3. **Update /models endpoint:**
   - Replace with call to `modelRegistryService.getUserAccessibleModels(userId, appId)`
   - Return filtered models based on user tier

### For Apps with Single Default Model:

1. **Import middleware** (same as above)

2. **Update generate endpoint:**
   ```typescript
   const modelKey = 'app-id:default-model-id'
   const usageMiddleware = deductModelUsage(modelKey, 'generate')
   await usageMiddleware(c, async () => {})

   // ... generation logic ...

   await recordModelUsage(c)
   ```

## Example: Video Mixer Update

```typescript
// backend/src/apps/video-mixer/routes.ts

import { deductModelUsage } from '../../core/middleware/hybrid-usage.middleware'
import { recordModelUsage } from '../../core/middleware/record-model-usage.middleware'

// Before:
router.post('/generate',
  authMiddleware,
  async (c) => {
    const body = await c.req.json()
    const creditCost = service.calculateCreditCost(body.settings, body.totalVideos)
    return deductCredits(creditCost, 'generate_videos', 'video-mixer')(c, next)
  },
  async (c) => {
    // ... generation logic
  }
)

// After:
router.post('/generate',
  authMiddleware,
  async (c) => {
    const body = await c.req.json()

    // Use default model for video-mixer
    const modelKey = 'video-mixer:ffmpeg-standard'

    // Check & deduct usage
    const usageMiddleware = deductModelUsage(modelKey, 'generate_videos')
    await usageMiddleware(c, async () => {})

    // Generate videos
    const generation = await service.generate(...)

    // Record usage
    await recordModelUsage(c)

    return c.json({ success: true, generation })
  }
)
```

## Example: Poster Editor Update

```typescript
// backend/src/apps/poster-editor/controllers/inpaint-batch.controller.ts

import { deductModelUsage } from '../../../middleware/hybrid-usage.middleware'
import { recordModelUsage } from '../../../middleware/record-model-usage.middleware'

export const batchInpaintController = async (c: Context) => {
  const userId = c.get('userId')
  const body = await c.req.json()

  // Determine model based on quality setting
  const modelKey = body.quality === 'pro'
    ? 'poster-editor:inpaint-pro'
    : 'poster-editor:inpaint-standard'

  // Check & deduct usage
  const usageMiddleware = deductModelUsage(modelKey, 'batch_inpaint')
  await usageMiddleware(c, async () => {})

  // Perform inpainting
  const result = await inpaintService.batchInpaint(...)

  // Record usage
  await recordModelUsage(c)

  return c.json({ success: true, result })
}
```

## Testing Checklist

After updating each app:

- [ ] PAYG users can generate with credit deduction
- [ ] Subscription users can generate with quota increment
- [ ] Quota exceeds → 429 error
- [ ] Insufficient credit → 402 error
- [ ] Model access check works (403 for unauthorized)
- [ ] ModelUsage records created
- [ ] Model stats increment correctly
- [ ] Credit/Quota tracking accurate

## Notes

- **Backward Compatibility:** Old `deductCredits` middleware still works for PAYG users
- **Gradual Migration:** Update apps one by one, test thoroughly
- **Error Handling:** New middleware returns proper HTTP status codes (402, 429, 403)
- **Logging:** All middleware logs usage for debugging

## Priority Order for Updates

1. ✅ **Database & Services** (DONE)
2. ✅ **Middleware** (DONE)
3. ✅ **API Endpoints** (DONE)
4. 🔄 **App Routes** (IN PROGRESS - Use this guide)
5. ⏭️ **Background Jobs** (NEXT)
6. ⏭️ **Testing** (FINAL)
