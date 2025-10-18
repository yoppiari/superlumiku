# PhotoMaker V2 Deployment Summary

**Status:** ✅ DEPLOYED TO dev.lumiku.com
**Date:** 2025-10-17
**Deployment UUID:** g0kocs84w0wgw4skok8soo4s

---

## 🎉 What Was Deployed

### Backend Implementation
✅ **PhotoMaker Client Added** (`backend/src/lib/huggingface-client.ts`)
- New method: `photoMakerGeneration()`
- Supports 1-4 input photos
- Automatic "img" token management for identity preservation
- Comprehensive error handling with retry logic
- Model loading detection and rate limit protection

### AI Models Added
✅ **3 PhotoMaker Tiers** (`backend/prisma/seeds/ai-models.seed.ts`)

| Model | Tier | Resolution | Credits | Processing Time |
|-------|------|------------|---------|-----------------|
| photomaker-basic | Basic | 512x512 | 18 | 60-90s |
| photomaker-pro | Pro | 1024x1024 | 25 | 90-120s |
| photomaker-enterprise | Enterprise | 1536x1536 | 35 | 120-180s |

---

## 📋 Post-Deployment Steps

### 1. Seed PhotoMaker Models to Database

SSH ke Coolify terminal atau gunakan Coolify web terminal:

```bash
cd backend
bun run prisma db seed
```

**Expected Output:**
```
🌱 Starting database seeding...
🌱 Seeding AI models...
✅ Seeded XX AI models (including 3 PhotoMaker models)
```

### 2. Verify Models in Database

```bash
cd backend
bunx prisma studio
```

Navigate to `AIModel` table dan verify models exist:
- `avatar-creator:photomaker-basic`
- `avatar-creator:photomaker-pro`
- `avatar-creator:photomaker-enterprise`

---

## 🧪 How to Test PhotoMaker

### Option 1: Direct API Test (Backend Ready)

PhotoMaker client sudah ready di backend. Untuk test:

```typescript
import { hfClient } from './src/lib/huggingface-client'
import fs from 'fs'

// Load test photo
const photoBuffer = fs.readFileSync('test-photo.jpg')

// Generate avatar
const result = await hfClient.photoMakerGeneration({
  inputPhotos: [photoBuffer],
  prompt: 'A professional headshot, studio lighting',
  width: 512,
  height: 512,
  numInferenceSteps: 50,
  guidanceScale: 7.5,
  styleStrength: 20
})

// Save result
fs.writeFileSync('generated-avatar.jpg', result)
```

### Option 2: Via API Route (Frontend Integration Needed)

**NOTE:** API route handler belum diimplementasi. Perlu tambahkan:

```typescript
// backend/src/apps/avatar-creator/routes.ts
app.post('/projects/:projectId/avatars/generate-from-photos', async (c) => {
  const body = await c.req.parseBody()
  const photos = body.photos // multipart/form-data
  const prompt = body.prompt

  // Call PhotoMaker
  const result = await hfClient.photoMakerGeneration({
    inputPhotos: photos.map(p => Buffer.from(p)),
    prompt,
    // ... other params
  })

  return c.json({ success: true, imageUrl: '...' })
})
```

---

## 🔑 Features Implemented

### PhotoMaker V2 Capabilities

✅ **Identity Preservation**
- Zero-shot generation (no training needed)
- Upload 1-4 photos for better consistency
- Maintains facial features across style changes

✅ **Studio Quality**
- SDXL-based photorealistic output
- Professional portrait quality
- Style customization via prompts

✅ **Smart Prompt Enhancement**
- Automatic "img" token injection
- Example: "studio lighting" → "studio lighting, img person"
- Preserves identity while applying styles

✅ **Multi-Photo Support**
- Min: 1 photo
- Max: 4 photos
- More photos = better identity consistency

✅ **Style Control**
- `styleStrength`: 0-100 (default: 20-30)
- Higher = stronger style application
- Lower = closer to original photo

---

## 💡 Usage Examples

### Example 1: Professional Headshot

```typescript
await hfClient.photoMakerGeneration({
  inputPhotos: [userPhoto],
  prompt: 'A professional business headshot, studio lighting, corporate attire',
  width: 1024,
  height: 1024,
  styleStrength: 25
})
```

### Example 2: Artistic Portrait

```typescript
await hfClient.photoMakerGeneration({
  inputPhotos: [userPhoto1, userPhoto2], // Multiple photos for consistency
  prompt: 'An artistic portrait in oil painting style, warm colors',
  width: 1024,
  height: 1024,
  styleStrength: 30,
  negativePrompt: 'ugly, blurry, distorted'
})
```

### Example 3: Casual Style

```typescript
await hfClient.photoMakerGeneration({
  inputPhotos: [userPhoto],
  prompt: 'A casual outdoor portrait, natural lighting, smiling',
  width: 512,
  height: 512,
  styleStrength: 20
})
```

---

## 🚀 Next Steps for Full Implementation

### Frontend (Not Yet Implemented)

**Required Components:**
1. **Photo Upload UI** - Drag & drop for 1-4 photos
2. **Generation Mode Selector** - Toggle between "Text to Image" and "Photo to Avatar"
3. **Model Selector** - Choose between Basic/Pro/Enterprise tiers
4. **API Integration** - Connect to backend route

**Estimated Time:** 4-6 hours

### Backend API Route (Not Yet Implemented)

**Required:**
1. **Multipart/form-data Handler** - Accept photo uploads
2. **Photo Validation** - Check file type, size, count (1-4)
3. **Avatar Service Integration** - Connect PhotoMaker to existing avatar-creator service
4. **Credit Deduction** - Deduct 18/25/35 credits based on tier
5. **Storage Management** - Save generated avatars

**Estimated Time:** 3-4 hours

### Complete Integration Checklist

- [ ] Add API route handler for photo upload
- [ ] Integrate PhotoMaker with avatar-creator service
- [ ] Create frontend PhotoUploader component
- [ ] Create GenerationModeSelector component
- [ ] Update avatar store with photo generation action
- [ ] Add photo storage and cleanup logic
- [ ] Write integration tests
- [ ] Test end-to-end workflow
- [ ] Deploy to production
- [ ] Monitor generation success rates

---

## 📊 Model Specifications

### PhotoMaker V2 Technical Details

**Model:** TencentARC/PhotoMaker
**Base:** SDXL (Stable Diffusion XL)
**Architecture:** Finetuned OpenCLIP-ViT-H-14 + LoRA (rank 64)
**License:** Apache 2.0
**Provider:** Tencent ARC Lab

**Capabilities:**
- Identity-preserving generation
- Zero-shot (no training needed)
- Multi-photo input (1-4 photos)
- Style customization via text prompts
- SDXL-quality photorealistic output

**Limitations:**
- Performance may degrade on Asian male faces
- Difficulty rendering hands accurately (not issue for headshots)
- Requires HuggingFace API key with sufficient quota

---

## 🔧 Troubleshooting

### Issue: "MODEL_LOADING" Error

**Cause:** PhotoMaker model is cold-starting on HuggingFace.

**Solution:** Automatic retry with exponential backoff (implemented).

**Manual:** Wait 30-60 seconds, retry request.

---

### Issue: "RATE_LIMIT_EXCEEDED" Error

**Cause:** Too many requests to HuggingFace API.

**Solution:** Automatic retry after 1 minute (implemented).

**Manual:** Wait 1 minute, check API quota.

---

### Issue: 400 Bad Request

**Possible Causes:**
1. Invalid photo format (must be JPG/PNG)
2. Photo too large (max 5MB per photo)
3. Too many photos (max 4)
4. Invalid parameters

**Solution:** Check error logs for exact error message.

---

### Issue: Generation Takes Too Long

**Expected Times:**
- Basic (512x512): 60-90 seconds
- Pro (1024x1024): 90-120 seconds
- Enterprise (1536x1536): 120-180 seconds

**If longer:** Check HuggingFace API status, network latency.

---

## 📈 Monitoring

### Success Metrics

Track these metrics post-deployment:

```sql
-- PhotoMaker usage stats
SELECT
  COUNT(*) as total_generations,
  AVG(processing_time_ms) as avg_time_ms,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
FROM avatars
WHERE model_id IN ('photomaker-basic', 'photomaker-pro', 'photomaker-enterprise')
AND created_at > NOW() - INTERVAL '7 days';
```

### Performance Targets

- **Success Rate:** >95%
- **Avg Generation Time:** <120s
- **User Satisfaction:** >4.5/5 stars
- **Adoption Rate:** >30% of avatar generations use PhotoMaker

---

## ✅ Deployment Verification

### Check Deployment Success

1. **Verify Code Deployed:**
   ```bash
   # SSH to server
   ssh user@dev.lumiku.com

   # Check latest commit
   cd /path/to/app
   git log -1

   # Should show: "feat(avatar-creator): Add PhotoMaker V2..."
   ```

2. **Verify PhotoMaker Client Available:**
   ```bash
   # In Node/Bun REPL on server
   const { hfClient } = require('./backend/src/lib/huggingface-client')
   console.log(typeof hfClient.photoMakerGeneration) // Should be 'function'
   ```

3. **Seed Database:**
   ```bash
   cd backend
   bun run prisma db seed
   ```

4. **Verify Models Seeded:**
   ```sql
   SELECT model_key, name, credit_cost, tier
   FROM ai_models
   WHERE model_key LIKE 'avatar-creator:photomaker%';
   ```

Expected output:
```
avatar-creator:photomaker-basic       | PhotoMaker V2 Basic      | 18 | basic
avatar-creator:photomaker-pro         | PhotoMaker V2 Pro        | 25 | pro
avatar-creator:photomaker-enterprise  | PhotoMaker V2 Enterprise | 35 | enterprise
```

---

## 📞 Support

**Questions or Issues?**

1. Check logs: `pm2 logs` (if using PM2) or Coolify deployment logs
2. Verify HuggingFace API key: `echo $HUGGINGFACE_API_KEY`
3. Test API directly with curl:
   ```bash
   curl -H "Authorization: Bearer $HUGGINGFACE_API_KEY" \
     https://api-inference.huggingface.co/models/TencentARC/PhotoMaker
   ```

---

## 🎯 Summary

**What's Ready:**
- ✅ PhotoMaker client implementation
- ✅ 3 AI model tiers configured
- ✅ Error handling and retries
- ✅ Deployed to dev.lumiku.com

**What's Pending:**
- ⏳ Database seed (manual step required)
- ⏳ API route handler
- ⏳ Frontend photo upload UI
- ⏳ Full integration testing

**Estimated Time to Complete:** 8-10 hours

---

**Next Immediate Action:** Run `bun run prisma db seed` in Coolify terminal to activate PhotoMaker models! 🚀
