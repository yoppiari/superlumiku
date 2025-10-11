# 🔮 AVATAR & POSE GENERATOR - TODO LATER

**Status**: Core apps implemented, these features deferred for later phases
**Date**: 2025-10-11

---

## 📊 WHAT'S DONE NOW

✅ **Avatar Creator App** - Create and manage avatars
✅ **Pose Generator App** - Generate poses with avatars
✅ Basic database structure
✅ Frontend UI complete
✅ Backend APIs ready
✅ Plugin system integration

---

## 💰 TODO LATER: CREDIT SYSTEM INTEGRATION

### Current State
- Apps use **placeholder credit costs** (not enforced)
- Credit middleware imported but not active
- Users can generate unlimited for testing

### What Needs to Be Done

#### 1. Activate Credit Middleware in Avatar Creator
**File**: `backend/src/apps/avatar-creator/routes.ts`

```typescript
// ADD credit middleware to these routes:
POST /avatars          - deductCredits(10, 'create_avatar', 'avatar-creator')
POST /avatars/:id/enhance - deductCredits(5, 'enhance_avatar', 'avatar-creator')
```

**Implementation**:
```typescript
import { deductCredits, recordCreditUsage } from '../../core/middleware/credit.middleware'
import { avatarCreatorConfig } from './plugin.config'

routes.post(
  '/avatars',
  authMiddleware,
  deductCredits(
    avatarCreatorConfig.credits.createAvatar,
    'create_avatar',
    avatarCreatorConfig.appId
  ),
  async (c) => {
    // ... existing logic

    // After successful avatar creation:
    const deduction = c.get('creditDeduction')
    const { newBalance, creditUsed } = await recordCreditUsage(
      userId,
      deduction.appId,
      deduction.action,
      deduction.amount,
      { avatarId: avatar.id }
    )

    return c.json({
      success: true,
      avatar,
      creditUsed,
      creditBalance: newBalance
    })
  }
)
```

#### 2. Activate Credit Middleware in Pose Generator
**File**: `backend/src/apps/pose-generator/routes.ts`

```typescript
// ADD credit middleware:
POST /generate - Dynamic cost based on settings
POST /retry/:id - Same cost as original generation
```

**Dynamic Cost Calculation**:
```typescript
// Calculate credit cost based on user settings
const calculateGenerationCost = (settings: GenerationSettings) => {
  let cost = poseGeneratorConfig.credits.generatePose // 5 base

  if (settings.quality === 'hd') {
    cost = poseGeneratorConfig.credits.generatePoseHD // 8
  }

  if (settings.batchCount >= 10) {
    // Batch discount: 3 credits per pose
    cost = poseGeneratorConfig.credits.batchGeneration * settings.batchCount
  } else {
    cost = cost * settings.batchCount
  }

  if (settings.fashionEnhancement) {
    cost += poseGeneratorConfig.credits.fashionEnhancement // +2
  }

  if (settings.backgroundReplacement) {
    cost += poseGeneratorConfig.credits.backgroundReplacement // +3
  }

  if (settings.professionTheme) {
    cost += poseGeneratorConfig.credits.professionTheme // +2
  }

  return cost
}

// Use in route:
routes.post('/generate', authMiddleware, async (c) => {
  const settings = await c.req.json()
  const totalCost = calculateGenerationCost(settings)

  // Manual credit check before generation
  const balance = await getCreditBalance(userId)
  if (balance < totalCost) {
    return c.json({
      error: 'Insufficient credits',
      required: totalCost,
      current: balance
    }, 402)
  }

  // Start generation...

  // Record usage after success
  await recordCreditUsage(userId, 'pose-generator', 'batch_generation', totalCost, {
    poseCount: settings.batchCount,
    quality: settings.quality
  })
})
```

#### 3. Frontend Credit Display
**Files**: `frontend/src/apps/AvatarCreator.tsx`, `PoseGenerator.tsx`

```typescript
// Show credit cost before action
<button className="...">
  Create Avatar (10 credits)
</button>

// Show remaining credits in header
<div className="text-sm text-gray-600">
  Credits: {user?.creditBalance || 0}
</div>

// Handle insufficient credits
if (error.response?.status === 402) {
  alert('Insufficient credits! Please top up.')
  navigate('/credits')
}

// Update balance after operation
updateCreditBalance(res.data.creditBalance)
```

---

## 🤖 TODO LATER: AI INTEGRATION

### Current State
- **Placeholder AI** - Returns dummy results
- No actual pose transfer happening
- No fashion/theme enhancement
- Background not replaced

### What Needs to Be Done

#### 1. ControlNet Integration for Pose Transfer
**File**: `backend/src/apps/pose-generator/services/controlnet.service.ts` (NEW)

```typescript
import { HfInference } from '@huggingface/inference'

export class ControlNetService {
  private hf: HfInference

  constructor() {
    this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY)
  }

  /**
   * Generate pose using ControlNet
   */
  async generatePose(
    avatarImageBuffer: Buffer,
    poseSkeletonBuffer: Buffer,
    prompt: string,
    quality: 'sd' | 'hd'
  ): Promise<Buffer> {
    const modelId = quality === 'hd'
      ? 'thibaud/controlnet-openpose-sdxl-1.0'  // HD model
      : 'lllyasviel/control_v11p_sd15_openpose' // SD model

    const result = await this.hf.imageToImage({
      model: modelId,
      inputs: avatarImageBuffer,
      parameters: {
        prompt,
        negative_prompt: 'ugly, blurry, low quality, distorted',
        num_inference_steps: quality === 'hd' ? 50 : 30,
        guidance_scale: 7.5,
        controlnet_conditioning_scale: 1.0,
        control_image: poseSkeletonBuffer
      }
    })

    return Buffer.from(await result.arrayBuffer())
  }
}
```

**Usage in pose-generation.service.ts**:
```typescript
const controlnet = new ControlNetService()

// Read avatar image
const avatarBuffer = await fs.readFile(avatar.baseImageUrl)

// Get pose template skeleton
const poseBuffer = await this.getPoseSkeletonBuffer(poseTemplate)

// Generate
const resultBuffer = await controlnet.generatePose(
  avatarBuffer,
  poseBuffer,
  this.buildPrompt(settings),
  settings.quality
)

// Save result
const outputPath = await this.saveGeneratedPose(resultBuffer, generationId)
```

#### 2. Fashion Enhancement Service
**File**: `backend/src/apps/pose-generator/services/fashion-enhancement.service.ts` (NEW)

```typescript
export class FashionEnhancementService {
  /**
   * Add fashion items to generated pose
   */
  async addFashionItems(
    generatedPoseBuffer: Buffer,
    fashionSettings: {
      hijab?: { style: string, color: string }
      accessories?: string[] // ['jewelry', 'bag', 'watch']
      outfit?: string
    }
  ): Promise<Buffer> {
    // Use Segment Anything Model (SAM) or inpainting
    // to add fashion items to the image

    // Example: Add hijab using inpainting
    if (fashionSettings.hijab) {
      const prompt = `wearing ${fashionSettings.hijab.style} hijab in ${fashionSettings.hijab.color} color`

      // Call inpainting API (Segmind or ModelsLab)
      const result = await this.inpaintFashion(
        generatedPoseBuffer,
        prompt,
        'head' // region
      )

      return result
    }

    return generatedPoseBuffer
  }

  private async inpaintFashion(
    image: Buffer,
    prompt: string,
    region: string
  ): Promise<Buffer> {
    // TODO: Implement inpainting API call
    // Using Segmind Stable Diffusion Inpainting
    return image // placeholder
  }
}
```

#### 3. Background Replacement Service
**File**: `backend/src/apps/pose-generator/services/background-service.ts` (NEW)

```typescript
export class BackgroundService {
  /**
   * Replace background in generated pose
   */
  async replaceBackground(
    generatedPoseBuffer: Buffer,
    backgroundSettings: {
      type: 'auto' | 'custom' | 'scene'
      scene?: string // 'studio', 'outdoor', 'office'
      customPrompt?: string
    }
  ): Promise<Buffer> {
    // Step 1: Remove existing background (SAM or rembg)
    const nobgBuffer = await this.removeBackground(generatedPoseBuffer)

    // Step 2: Generate or select new background
    let backgroundBuffer: Buffer

    if (backgroundSettings.type === 'scene') {
      backgroundBuffer = await this.generateSceneBackground(backgroundSettings.scene!)
    } else if (backgroundSettings.type === 'custom') {
      backgroundBuffer = await this.generateCustomBackground(backgroundSettings.customPrompt!)
    } else {
      backgroundBuffer = await this.generateAutoBackground()
    }

    // Step 3: Composite
    const result = await this.compositeImages(nobgBuffer, backgroundBuffer)

    return result
  }

  private async removeBackground(image: Buffer): Promise<Buffer> {
    // Use rembg library or SAM
    // https://github.com/danielgatis/rembg
    return image // placeholder
  }
}
```

#### 4. Profession Theme Processor
**File**: `backend/src/apps/pose-generator/services/theme-processor.service.ts` (NEW)

```typescript
export class ThemeProcessorService {
  /**
   * Apply profession theme to pose
   */
  async applyProfessionTheme(
    generatedPoseBuffer: Buffer,
    theme: string // 'doctor', 'pilot', 'chef', etc
  ): Promise<Buffer> {
    const themeConfig = this.getThemeConfig(theme)

    // Add profession-specific items
    let result = generatedPoseBuffer

    // Add clothing (e.g., white coat for doctor)
    if (themeConfig.clothing) {
      result = await this.addClothing(result, themeConfig.clothing)
    }

    // Add props (e.g., stethoscope for doctor)
    if (themeConfig.props) {
      result = await this.addProps(result, themeConfig.props)
    }

    // Adjust background
    if (themeConfig.background) {
      result = await this.adjustBackground(result, themeConfig.background)
    }

    return result
  }

  private getThemeConfig(theme: string) {
    const configs = {
      doctor: {
        clothing: 'white coat',
        props: ['stethoscope'],
        background: 'hospital clinic'
      },
      pilot: {
        clothing: 'pilot uniform',
        props: ['aviation cap'],
        background: 'airplane cockpit'
      },
      chef: {
        clothing: 'chef uniform',
        props: ['chef hat', 'cooking tools'],
        background: 'professional kitchen'
      }
      // ... more themes
    }

    return configs[theme] || {}
  }
}
```

#### 5. Main Integration in Pose Generation Service
**File**: `backend/src/apps/pose-generator/services/pose-generation.service.ts`

```typescript
import { ControlNetService } from './controlnet.service'
import { FashionEnhancementService } from './fashion-enhancement.service'
import { BackgroundService } from './background-service'
import { ThemeProcessorService } from './theme-processor.service'

export class PoseGenerationService {
  private controlnet = new ControlNetService()
  private fashionService = new FashionEnhancementService()
  private backgroundService = new BackgroundService()
  private themeService = new ThemeProcessorService()

  async processBatchGeneration(generationId: string): Promise<void> {
    const generation = await this.getGeneration(generationId)
    const avatar = await this.getAvatar(generation.avatarId)
    const poseTemplates = await this.getPoseTemplates(generation.settings.selectedPoses)

    for (const poseTemplate of poseTemplates) {
      try {
        // 1. Generate base pose with ControlNet
        let resultBuffer = await this.controlnet.generatePose(
          avatar.baseImageBuffer,
          poseTemplate.skeletonBuffer,
          generation.settings.basePrompt,
          generation.settings.quality
        )

        // 2. Apply fashion enhancements (if enabled)
        if (generation.settings.fashionEnhancement) {
          resultBuffer = await this.fashionService.addFashionItems(
            resultBuffer,
            generation.settings.fashionSettings
          )
        }

        // 3. Replace background (if enabled)
        if (generation.settings.backgroundReplacement) {
          resultBuffer = await this.backgroundService.replaceBackground(
            resultBuffer,
            generation.settings.backgroundSettings
          )
        }

        // 4. Apply profession theme (if enabled)
        if (generation.settings.professionTheme) {
          resultBuffer = await this.themeService.applyProfessionTheme(
            resultBuffer,
            generation.settings.professionTheme
          )
        }

        // 5. Save result
        await this.saveGeneratedPose(resultBuffer, generationId, poseTemplate.id)

      } catch (error) {
        console.error(`Failed to generate pose ${poseTemplate.id}:`, error)
        await this.markPoseFailed(generationId, poseTemplate.id, error.message)
      }
    }

    await this.markGenerationComplete(generationId)
  }
}
```

---

## 🔧 ENVIRONMENT VARIABLES NEEDED

Add to `.env`:
```bash
# AI Service API Keys
HUGGINGFACE_API_KEY=hf_xxxxx
SEGMIND_API_KEY=xxxxx
MODELSLAB_API_KEY=xxxxx  # Already exists

# AI Model Settings
CONTROLNET_MODEL_SD=lllyasviel/control_v11p_sd15_openpose
CONTROLNET_MODEL_HD=thibaud/controlnet-openpose-sdxl-1.0
INPAINTING_MODEL=segmind/sd-inpainting
```

---

## 📦 DEPENDENCIES TO INSTALL

```bash
# Hugging Face Inference
bun add @huggingface/inference

# Image processing
bun add sharp
bun add canvas

# Background removal (if self-hosted)
pip install rembg  # Python dependency
```

---

## 🎯 IMPLEMENTATION PRIORITY

### Phase 1: Credit System (High Priority)
**Estimated Time**: 2-3 hours
**Impact**: Revenue & usage control

1. Activate credit middleware in Avatar Creator
2. Activate credit middleware in Pose Generator
3. Add dynamic cost calculation
4. Update frontend to show costs
5. Test credit flow end-to-end

### Phase 2: Basic AI Integration (High Priority)
**Estimated Time**: 1-2 days
**Impact**: Core functionality

1. Integrate ControlNet for basic pose transfer
2. Test with real avatars & poses
3. Handle errors gracefully
4. Optimize performance

### Phase 3: Fashion Enhancement (Medium Priority)
**Estimated Time**: 2-3 days
**Impact**: Feature differentiation

1. Implement fashion item inpainting
2. Add hijab styles library
3. Add accessories overlay
4. Test quality

### Phase 4: Background & Themes (Low Priority)
**Estimated Time**: 3-5 days
**Impact**: Premium features

1. Background removal integration
2. Scene background generation
3. Profession theme library
4. Composite quality optimization

---

## 📝 NOTES

- **Start with Phase 1** (Credit System) - critical for business
- **Phase 2** can use ModelsLab API (already integrated) as quick solution
- **Phases 3-4** can be premium features with higher credit costs
- **Performance**: Consider queue system for batch generations
- **Costs**: Monitor API costs and adjust credit prices accordingly

---

**Created**: 2025-10-11
**Last Updated**: 2025-10-11
**Status**: Ready for implementation when needed
