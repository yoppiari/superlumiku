# AI IMPLEMENTATION MASTER GUIDE - Avatar & Pose Generator

**Created:** 2025-10-11
**Status:** Implementation In Progress
**Claude Session Recovery Document**

---

## 🎯 OBJECTIVE

Implement full AI system for Avatar & Pose Generator:
- **Phase 1:** ControlNet Pose Generation (CORE)
- **Phase 2:** Text-to-Avatar AI Generation
- **Phase 3:** Fashion Enhancement (Hijab, Accessories)
- **Phase 4:** Background Replacement & Profession Themes

---

## 📋 CURRENT STATE (Before Implementation)

### ✅ Already Implemented:
- Avatar upload (photo reference) - `AvatarCreator.tsx`
- Pose Generator UI - `PoseGenerator.tsx`
- Database schema complete
- Placeholder AI in `pose-generation.service.ts` (line 100-115)

### ❌ NOT Implemented (Placeholders):
- Actual ControlNet integration
- Text-to-avatar generation
- Fashion enhancement
- Background replacement
- Profession themes

### 🔍 Key Files:
```
frontend/src/apps/AvatarCreator.tsx         - Avatar upload UI
backend/src/apps/avatar-creator/routes.ts   - Avatar API
backend/src/apps/pose-generator/services/pose-generation.service.ts  - Placeholder AI (TODO line 100)
```

---

## 🏗️ IMPLEMENTATION PLAN

### Phase 1: ControlNet Pose Generation ⭐ CRITICAL
**Goal:** Replace placeholder with real AI pose generation

**Files to Create:**
1. `backend/src/lib/huggingface-client.ts` - HF API wrapper
2. `backend/src/apps/pose-generator/services/controlnet.service.ts` - ControlNet integration
3. Update `backend/src/apps/pose-generator/services/pose-generation.service.ts` - Replace TODO

**Dependencies:**
```bash
cd backend
bun add @huggingface/inference axios sharp canvas
```

**Environment Variables (.env):**
```bash
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxx
CONTROLNET_MODEL_SD=lllyasviel/control_v11p_sd15_openpose
CONTROLNET_MODEL_HD=thibaud/controlnet-openpose-sdxl-1.0
```

**How to Get HF API Key:**
1. Go to https://huggingface.co/settings/tokens
2. Create new token with "Read" access
3. Copy to .env

**Implementation Steps:**
1. Create HuggingFace client wrapper
2. Implement pose skeleton rendering (Canvas API)
3. Create ControlNet service (image-to-image with pose control)
4. Update pose-generation.service.ts processGeneration() method
5. Test with 1 avatar + 1 pose template
6. Implement error handling & retry logic

**Key Code Locations:**
```typescript
// Replace this TODO (line 100-115):
// backend/src/apps/pose-generator/services/pose-generation.service.ts
// TODO: Actual AI generation here (placeholder for now)

// With actual ControlNet call:
const controlnet = new ControlNetService()
const result = await controlnet.generatePose(...)
```

---

### Phase 2: Text-to-Avatar AI Generation
**Goal:** Generate avatar from text prompt

**Files to Create:**
1. `backend/src/apps/avatar-creator/services/avatar-ai.service.ts` - AI avatar generation
2. Update `backend/src/apps/avatar-creator/routes.ts` - Add POST /avatars/generate
3. Update `frontend/src/apps/AvatarCreator.tsx` - Add "Generate from Text" tab

**AI Model:**
- SDXL: `stabilityai/stable-diffusion-xl-base-1.0`
- Or FLUX.1: `black-forest-labs/FLUX.1-schnell`

**API Endpoint:**
```typescript
POST /api/apps/avatar-creator/avatars/generate
Body: {
  prompt: "professional asian woman, age 25-30, business attire",
  gender: "female",
  ageRange: "adult",
  style: "professional"
}
```

**Frontend Changes:**
- Add tabs: "Upload Photo" | "Generate from Text"
- Text prompt textarea + metadata form
- Preview generated avatar
- Save to collection button

---

### Phase 3: Fashion Enhancement
**Goal:** Add fashion items (hijab, accessories) to generated poses

**Files to Create:**
1. `backend/src/apps/pose-generator/services/fashion-enhancement.service.ts`
2. Update pose-generation pipeline to apply enhancements

**Features:**
- **Hijab Styles:** modern, pashmina, turban, square, instant
- **Accessories:** jewelry, bag, watch, sunglasses
- **Outfit Enhancement:** casual, formal, traditional

**Inpainting API Options:**
1. Segmind: https://segmind.com/models/sd-inpainting
2. ModelsLab (already integrated): https://modelslab.com/api

**Environment Variables:**
```bash
SEGMIND_API_KEY=xxxxx
INPAINTING_MODEL=segmind/sd-inpainting
```

**Integration Point:**
```typescript
// In pose-generation.service.ts processGeneration()
// After ControlNet generation:
if (generation.fashionSettings) {
  resultBuffer = await fashionService.addFashionItems(
    resultBuffer,
    generation.fashionSettings
  )
}
```

**Frontend Changes:**
- Fashion settings panel in PoseGenerator
- Hijab style selector with previews
- Accessories checklist
- Outfit selector

---

### Phase 4: Background & Profession Themes
**Goal:** Replace backgrounds and apply profession themes

**Files to Create:**
1. `backend/src/apps/pose-generator/services/background.service.ts`
2. `backend/src/apps/pose-generator/services/theme-processor.service.ts`

**Background Service:**
- Remove background (rembg or SAM)
- Generate scene backgrounds (studio, outdoor, office, cafe)
- Composite with proper lighting

**Profession Themes:**
- **Doctor:** white coat, stethoscope, hospital background
- **Pilot:** uniform, aviation cap, cockpit background
- **Chef:** chef uniform, hat, kitchen background
- **Teacher:** casual professional, classroom background

**Dependencies:**
```bash
# For background removal (Python)
pip install rembg
```

**Integration Point:**
```typescript
// After fashion enhancement:
if (generation.backgroundSettings) {
  resultBuffer = await backgroundService.replaceBackground(...)
}

if (generation.professionTheme) {
  resultBuffer = await themeService.applyProfessionTheme(...)
}
```

---

## 🔑 API KEYS & CREDENTIALS

### Required API Keys:

1. **Hugging Face** (FREE)
   - URL: https://huggingface.co/settings/tokens
   - Usage: 30k requests/month free
   - Models: ControlNet, SDXL

2. **Segmind** (Optional - for inpainting)
   - URL: https://segmind.com/
   - Usage: $0.0025 per image
   - Free tier: $5 credits

3. **ModelsLab** (Already have?)
   - Check existing .env for MODELSLAB_API_KEY
   - URL: https://modelslab.com/

### Environment Variables Template:

```bash
# Core AI
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxx
CONTROLNET_MODEL_SD=lllyasviel/control_v11p_sd15_openpose
CONTROLNET_MODEL_HD=thibaud/controlnet-openpose-sdxl-1.0

# Text-to-Avatar
SDXL_MODEL=stabilityai/stable-diffusion-xl-base-1.0
FLUX_MODEL=black-forest-labs/FLUX.1-schnell

# Fashion Enhancement
SEGMIND_API_KEY=xxxxx
INPAINTING_MODEL=segmind/sd-inpainting

# ModelsLab (fallback)
MODELSLAB_API_KEY=xxxxx  # Should exist already

# Storage
AVATAR_STORAGE_PATH=./uploads/avatars
POSE_OUTPUT_PATH=./uploads/pose-generator
MAX_AVATAR_SIZE_MB=10
```

---

## 📦 DEPENDENCIES TO INSTALL

### Backend (Bun):
```bash
cd backend
bun add @huggingface/inference
bun add axios
bun add sharp
bun add canvas
bun add form-data
```

### Python (for background removal - optional):
```bash
pip install rembg
pip install pillow
```

---

## 🔄 GENERATION PIPELINE FLOW

### Complete Flow (All Phases):

```
1. User Input
   ├─ Select Avatar
   ├─ Select Pose Templates (multiple)
   ├─ Settings:
   │  ├─ Quality (SD/HD)
   │  ├─ Fashion Settings (optional)
   │  ├─ Background Settings (optional)
   │  └─ Profession Theme (optional)
   └─ Click Generate

2. Backend Processing (per pose):
   ├─ [Phase 1] Load Avatar Image
   ├─ [Phase 1] Load Pose Template Keypoints
   ├─ [Phase 1] Render Pose Skeleton
   ├─ [Phase 1] ControlNet Generation
   │  ├─ Input: Avatar + Pose Skeleton
   │  ├─ Model: lllyasviel/control_v11p_sd15_openpose
   │  ├─ Output: Avatar in new pose
   │  └─ Save: /uploads/pose-generator/{id}/base.jpg
   │
   ├─ [Phase 3] Fashion Enhancement (if enabled)
   │  ├─ Add Hijab (inpainting)
   │  ├─ Add Accessories (overlay)
   │  └─ Save: /uploads/pose-generator/{id}/fashion.jpg
   │
   ├─ [Phase 4] Background Replacement (if enabled)
   │  ├─ Remove Background (rembg/SAM)
   │  ├─ Generate Scene Background
   │  ├─ Composite
   │  └─ Save: /uploads/pose-generator/{id}/background.jpg
   │
   ├─ [Phase 4] Profession Theme (if enabled)
   │  ├─ Add Profession Clothing (inpainting)
   │  ├─ Add Props (overlay)
   │  ├─ Adjust Background
   │  └─ Save: /uploads/pose-generator/{id}/final.jpg
   │
   └─ Create GeneratedPose Record
      ├─ outputUrl
      ├─ generationTime
      ├─ qualityScore
      └─ success: true/false

3. Progress Tracking
   ├─ Update progress % in database
   ├─ Frontend polls /api/apps/pose-generator/generate/{id}
   └─ Show progress bar + current pose

4. Results
   ├─ Gallery view of all generated poses
   ├─ Download individually or bulk (ZIP)
   ├─ Retry failed poses
   └─ Send to Poster Editor
```

---

## 🧪 TESTING CHECKLIST

### Phase 1 - ControlNet:
- [ ] Generate 1 pose with 1 avatar
- [ ] Verify pose matches template skeleton
- [ ] Check image quality
- [ ] Test with different avatars (male, female)
- [ ] Test with different poses (standing, sitting, walking)
- [ ] Verify success rate >85%
- [ ] Check generation time <30s per pose
- [ ] Test error handling (API timeout, invalid image)

### Phase 2 - Text-to-Avatar:
- [ ] Generate avatar from text prompt
- [ ] Verify gender matches prompt
- [ ] Verify age range matches
- [ ] Check face consistency
- [ ] Save to avatar collection
- [ ] Test with various prompts
- [ ] Check generation time <15s

### Phase 3 - Fashion Enhancement:
- [ ] Add hijab to generated pose
- [ ] Test different hijab styles
- [ ] Add accessories (jewelry, bag)
- [ ] Verify natural placement
- [ ] Check quality after enhancement
- [ ] Test with various poses

### Phase 4 - Background & Themes:
- [ ] Remove background successfully
- [ ] Generate scene backgrounds
- [ ] Apply profession theme (doctor, pilot)
- [ ] Verify realistic composition
- [ ] Check lighting consistency

### Integration Tests:
- [ ] Full pipeline: Avatar → Pose → Fashion → Background → Theme
- [ ] Batch generation (10 poses)
- [ ] Batch generation (50 poses)
- [ ] Concurrent generations (2 users)
- [ ] Error recovery (API failure mid-batch)
- [ ] Progress tracking accuracy

---

## 🐛 TROUBLESHOOTING

### Issue: Hugging Face API Timeout
**Symptom:** Request takes >60s or times out
**Cause:** Model cold-starting (first load)
**Solution:**
```typescript
// Add retry logic with exponential backoff
const maxRetries = 3
let attempt = 0
while (attempt < maxRetries) {
  try {
    return await hf.imageToImage(...)
  } catch (error) {
    if (error.message.includes('loading')) {
      await sleep(Math.pow(2, attempt) * 1000) // 1s, 2s, 4s
      attempt++
    } else {
      throw error
    }
  }
}
```

### Issue: Poor Quality Output
**Symptom:** Generated pose looks distorted or low quality
**Cause:**
1. Avatar image too low resolution (<512px)
2. Pose template incompatible with avatar
3. Prompt not optimized

**Solution:**
1. Resize avatar to min 512x512
2. Filter pose templates by compatibility
3. Improve prompt:
```typescript
const prompt = `
  professional photo, high quality, 8k, detailed,
  natural lighting, sharp focus, realistic,
  ${avatarCharacteristics},
  ${poseDescription}
`
const negativePrompt = `
  ugly, blurry, low quality, distorted, deformed,
  extra limbs, bad anatomy, mutation,
  watermark, text, logo
`
```

### Issue: Fashion Enhancement Looks Unnatural
**Symptom:** Hijab or accessories don't blend well
**Cause:** Inpainting mask or prompt not precise

**Solution:**
1. Use SAM for precise mask generation
2. Improve inpainting prompt:
```typescript
const inpaintPrompt = `
  ${fashionItem} worn naturally,
  matching lighting and color of the scene,
  realistic fabric texture,
  proper shadows and highlights
`
```

### Issue: Background Removal Cuts Off Person
**Symptom:** rembg removes part of the person
**Cause:** Model confusion with similar colors

**Solution:**
1. Use SAM instead of rembg (more accurate)
2. Or use ControlNet Canny edge detection
3. Manual mask refinement option

### Issue: Generation Fails Mid-Batch
**Symptom:** Some poses succeed, others fail
**Cause:** API rate limit or quota exceeded

**Solution:**
```typescript
// Add rate limiting
const RATE_LIMIT = 5 // poses per minute
const queue = new Queue('pose-generation', {
  limiter: {
    max: RATE_LIMIT,
    duration: 60000 // 1 minute
  }
})
```

### Issue: High API Costs
**Symptom:** Monthly bill too high
**Cause:** Too many API calls, using HD models

**Solution:**
1. Cache generated poses
2. Use SD models for preview, HD for final
3. Implement credit system to limit usage
4. Self-host models on GPU server (long-term)

---

## 💾 DATABASE SCHEMA REFERENCE

### Relevant Tables:

```prisma
model Avatar {
  id              String   @id @default(cuid())
  userId          String
  name            String
  baseImageUrl    String   // Original upload
  thumbnailUrl    String?
  gender          String?
  ageRange        String?
  style           String?
  sourceType      String   // "upload" | "ai_generated"
  generationPrompt String? // For text-to-avatar
  faceEmbedding   String?  // For consistency
  usageCount      Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model PoseTemplate {
  id              String   @id @default(cuid())
  category        String   // "fashion-standing", "skincare-application"
  keypointsJson   String   // OpenPose format
  previewUrl      String
  difficulty      String   // "simple", "medium", "complex"
  tags            String   // JSON array
  gender          String?
  productPlacement String?
  successRate     Float    @default(0.95)
  isActive        Boolean  @default(true)
}

model PoseGeneration {
  id              String   @id @default(cuid())
  userId          String
  avatarId        String
  totalPoses      Int
  selectedPoseIds String   // JSON array
  quality         String   // "sd" | "hd"
  fashionSettings String?  // JSON
  backgroundSettings String? // JSON
  professionTheme String?
  provider        String   // "huggingface"
  modelId         String
  basePrompt      String
  negativePrompt  String?
  status          String   @default("pending")
  progress        Int      @default(0)
  successfulPoses Int      @default(0)
  failedPoses     Int      @default(0)
  createdAt       DateTime @default(now())
  completedAt     DateTime?
}

model GeneratedPose {
  id              String   @id @default(cuid())
  generationId    String
  userId          String
  avatarId        String
  poseTemplateId  String
  prompt          String
  outputUrl       String   // Final image
  success         Boolean  @default(true)
  qualityScore    Float?
  generationTime  Int      // seconds
  provider        String
  createdAt       DateTime @default(now())
}
```

---

## 📊 MONITORING & METRICS

### Key Metrics to Track:

1. **Generation Success Rate**
   - Target: >90%
   - Track per pose template
   - Alert if <80%

2. **Average Generation Time**
   - Target: <30s per pose
   - Track per quality setting (SD/HD)
   - Alert if >60s

3. **API Costs**
   - Track per provider (HF, Segmind, ModelsLab)
   - Budget alert thresholds
   - Cost per successful generation

4. **User Satisfaction**
   - Track user ratings (1-5 stars)
   - Track retry rate
   - Track export rate

5. **System Health**
   - Queue depth (should be <100)
   - Failed job rate (should be <5%)
   - API error rate

### Monitoring Implementation:

```typescript
// Track metrics in database
await prisma.designMetrics.upsert({
  where: {
    userId_designType_period: {
      userId,
      designType: 'pose',
      period: '2025-10'
    }
  },
  update: {
    timesCreated: { increment: 1 },
    avgCreationTime: newAverage,
    totalTimeSaved: estimatedSavings
  },
  create: {
    userId,
    designType: 'pose',
    period: '2025-10',
    timesCreated: 1,
    avgCreationTime: generationTime,
    totalTimeSaved: estimatedSavings
  }
})
```

---

## 🚀 DEPLOYMENT NOTES

### Pre-Deployment Checklist:

- [ ] All API keys in production .env
- [ ] Storage paths configured correctly
- [ ] Redis connection working (for BullMQ)
- [ ] Database migrations applied
- [ ] Dependencies installed (bun install)
- [ ] Canvas dependencies available (libcairo2-dev)
- [ ] Test generation on dev.lumiku.com
- [ ] Monitor logs for errors
- [ ] Set up error alerting (Sentry)

### Production Environment Variables:

```bash
# Production .env (Coolify/dev.lumiku.com)
NODE_ENV=production
DATABASE_URL=postgresql://prod_user:prod_pass@host:5432/lumiku
REDIS_URL=redis://prod_redis:6379

# AI APIs
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxx
SEGMIND_API_KEY=xxxxx
MODELSLAB_API_KEY=xxxxx

# Storage (use absolute paths)
AVATAR_STORAGE_PATH=/var/www/lumiku/uploads/avatars
POSE_OUTPUT_PATH=/var/www/lumiku/uploads/pose-generator

# Limits
MAX_AVATAR_SIZE_MB=10
MAX_POSES_PER_GENERATION=100
```

### Server Requirements:

- **CPU:** 2+ cores
- **RAM:** 4GB minimum (8GB recommended)
- **Storage:** 50GB+ for pose outputs
- **Redis:** Required for BullMQ
- **Network:** Fast connection to Hugging Face API

---

## 📞 RECOVERY INSTRUCTIONS (If Claude Errors)

### What to Tell New Claude Session:

1. **Show this document first**
2. **Current status:** Check which files have been created
3. **Resume from:** Find last completed phase
4. **Reference docs:**
   - `AVATAR_POSE_TODO_LATER.md` - Original implementation plan
   - `AVATAR_POSE_MASTER_REFERENCE.md` - Complete technical specs
   - This document - AI implementation guide

### Quick Status Check:

```bash
# Check which services exist
ls backend/src/apps/pose-generator/services/
ls backend/src/apps/avatar-creator/services/
ls backend/src/lib/

# Check if dependencies installed
cd backend && bun pm ls | grep huggingface
cd backend && bun pm ls | grep canvas

# Check environment variables
cat backend/.env | grep HUGGINGFACE
```

### Resume Points:

**If Phase 1 incomplete:**
- Check if `controlnet.service.ts` exists
- Check if `huggingface-client.ts` exists
- Check if `pose-generation.service.ts` still has TODO

**If Phase 2 incomplete:**
- Check if `avatar-ai.service.ts` exists
- Check if POST /avatars/generate endpoint exists

**If Phase 3 incomplete:**
- Check if `fashion-enhancement.service.ts` exists

**If Phase 4 incomplete:**
- Check if `background.service.ts` exists
- Check if `theme-processor.service.ts` exists

---

## 🎯 SUCCESS CRITERIA

### Phase 1 Complete When:
- ✅ Real ControlNet integration working
- ✅ Can generate 1 pose from avatar + template
- ✅ Success rate >85%
- ✅ Generation time <30s
- ✅ Images saved to storage correctly
- ✅ Database records created

### Phase 2 Complete When:
- ✅ Text-to-avatar generation working
- ✅ Generated avatars look realistic
- ✅ Face consistency maintained
- ✅ Saved to avatar collection
- ✅ UI has "Generate from Text" tab

### Phase 3 Complete When:
- ✅ Fashion enhancement working
- ✅ Hijab styles apply correctly
- ✅ Accessories positioned naturally
- ✅ Quality maintained after enhancement

### Phase 4 Complete When:
- ✅ Background removal working
- ✅ Scene backgrounds generated
- ✅ Profession themes applied correctly
- ✅ Final composite looks professional

### Full System Complete When:
- ✅ All 4 phases working
- ✅ Full pipeline: Avatar → Pose → Fashion → Background → Theme
- ✅ Batch generation (50+ poses) working
- ✅ Success rate >90%
- ✅ Error handling robust
- ✅ Deployed to dev.lumiku.com
- ✅ User can complete full workflow
- ✅ Documentation updated

---

**END OF MASTER GUIDE**

**Remember:** This document is your recovery point. If Claude errors, show this first!

**Last Updated:** 2025-10-11
**Status:** Ready for Implementation
**Next Action:** Start Phase 1 - ControlNet Integration
