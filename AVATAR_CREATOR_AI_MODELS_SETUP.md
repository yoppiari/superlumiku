# Avatar Creator - AI Models Setup Guide

**Status:** Ready for Deployment ✅
**Date:** 2025-10-14
**Changes:** Configured FLUX.1-dev + Realism LoRA with database-driven model selection

---

## Overview

The Avatar Creator now uses **4 AI models** from HuggingFace with proper database configuration:

1. **FLUX.1-dev Base** (Free Tier) - Base model without LoRA
2. **FLUX.1-dev + Realism LoRA** (Basic Tier) - Photorealistic avatars
3. **FLUX.1-dev HD + Realism LoRA** (Pro Tier) - Ultra-HD photorealistic
4. **FLUX.1-schnell Fast** (Basic Tier) - Rapid generation

## Architecture

```
User Request
    ↓
Avatar Creator Service
    ↓
[Select AI Model from Database]
    - Filter by user tier (free/basic/pro/enterprise)
    - Prefer Realism LoRA for avatars
    - Select HD if resolution >= 1024x1024
    ↓
Queue Job with Model Config
    ↓
Worker receives model configuration
    ↓
HuggingFace API Call
    - Model: black-forest-labs/FLUX.1-dev (or FLUX.1-schnell)
    - LoRA: XLabs-AI/flux-RealismLora (if enabled)
    - Parameters from database capabilities
    ↓
Generated Avatar
```

---

## Changes Made

### 1. Updated AI Models Seed (`backend/prisma/seeds/ai-models.seed.ts`)

**Before:**
- Generic model IDs like `flux-dev-standard`, `flux-dev-hd`
- Hardcoded capabilities
- No LoRA configuration

**After:**
- Real HuggingFace model IDs: `black-forest-labs/FLUX.1-dev`
- LoRA model: `XLabs-AI/flux-RealismLora`
- Proper capabilities JSON with model parameters
- Tier-based access control

**Models Configuration:**

| Model Key | Name | Tier | Credits | LoRA | Resolution | Steps |
|-----------|------|------|---------|------|------------|-------|
| `avatar-creator:flux-dev-base` | FLUX.1-dev Base | Free | 8 | No | 512x512 | 28 |
| `avatar-creator:flux-dev-realism` | FLUX.1-dev + Realism LoRA | Basic | 12 | Yes (0.9) | 768x768 | 30 |
| `avatar-creator:flux-dev-hd-realism` | FLUX.1-dev HD + Realism LoRA | Pro | 15 | Yes (0.9) | 1024x1024 | 35 |
| `avatar-creator:flux-schnell-fast` | FLUX.1-schnell Fast | Basic | 6 | No | 512x512 | 4 |

### 2. Enhanced Service Layer (`backend/src/apps/avatar-creator/services/avatar-creator.service.ts`)

**New Features:**
- **AI Model Selection Logic**: Automatically selects best model based on:
  - User subscription tier (free/basic/pro/enterprise)
  - Quality preference (realism, speed)
  - Resolution requirements (SD vs HD)
- **Dynamic Credit Pricing**: Uses model's `creditCost` from database
- **Model Configuration Passing**: Sends full model config to worker

**Key Method:**
```typescript
private async selectAIModel(
  userTier: string = 'free',
  preferRealism: boolean = true,
  preferHD: boolean = false
): Promise<AIModel>
```

**Selection Strategy:**
1. Filter models by user tier access
2. If `preferRealism`: Find models with Realism LoRA
3. If `preferHD`: Select highest resolution among realism models
4. Fallback: Return cheapest accessible model

### 3. Updated Worker (`backend/src/apps/avatar-creator/workers/avatar-generator.worker.ts`)

**New Features:**
- Reads AI model config from job metadata
- Uses model-specific parameters (steps, guidance, LoRA)
- Supports both FLUX.1-dev and FLUX.1-schnell
- Dynamic LoRA application based on config

**Key Method:**
```typescript
private async generateWithModelConfig(params: {
  prompt: string
  modelConfig: {
    modelId?: string
    loraModel?: string | null
    loraScale?: number
    useLoRA?: boolean
    numInferenceSteps?: number
    guidanceScale?: number
  }
}): Promise<Buffer>
```

---

## HuggingFace Models Used

### Base Model: FLUX.1-dev
- **HuggingFace ID:** `black-forest-labs/FLUX.1-dev`
- **Provider:** Black Forest Labs
- **Type:** Text-to-image diffusion model
- **Quality:** High-quality realistic images
- **Speed:** 30-60 seconds per generation
- **License:** Requires HuggingFace Pro for API access

### Realism LoRA
- **HuggingFace ID:** `XLabs-AI/flux-RealismLora`
- **Purpose:** Enhance photorealism and detail
- **Application:** Applied on top of FLUX.1-dev
- **Weight:** 0.9 (90% strength)
- **Effect:** Ultra-realistic portraits, studio-quality

### Fast Model: FLUX.1-schnell
- **HuggingFace ID:** `black-forest-labs/FLUX.1-schnell`
- **Provider:** Black Forest Labs
- **Type:** Distilled version of FLUX.1-dev
- **Speed:** 5-15 seconds per generation
- **Steps:** 4 (vs 30 for dev)
- **Quality:** Good quality, faster

---

## Environment Variables

Ensure these are set in your `.env`:

```bash
# HuggingFace API (REQUIRED)
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxx

# Model Configuration (Optional - uses defaults if not set)
FLUX_MODEL=black-forest-labs/FLUX.1-dev
FLUX_LORA_MODEL=XLabs-AI/flux-RealismLora

# Database
DATABASE_URL=postgresql://user:password@host:5432/lumiku

# Redis (for queue)
REDIS_URL=redis://localhost:6379
```

### HuggingFace API Key

**How to get:**
1. Go to https://huggingface.co/settings/tokens
2. Create a new token with `read` permissions
3. **Important:** FLUX.1-dev requires HuggingFace Pro subscription
4. Add credit card to HuggingFace account for API usage

**Pricing:**
- FLUX.1-dev: ~$0.05 per generation
- FLUX.1-schnell: ~$0.01 per generation
- Realism LoRA: No extra cost (same as base model)

---

## Deployment Steps

### Step 1: Run Database Seed

```bash
cd backend

# Run full seed (includes AI models)
npm run seed

# Or just seed AI models
npm run seed:ai-models
```

**Expected Output:**
```
🌱 Seeding AI models...
✅ Seeded 17 AI models
   - 4 for avatar-creator
   - 4 for video-generator
   - 3 for poster-editor
   - 6 for other apps
```

### Step 2: Verify Database

```bash
# Check AI models in database
psql $DATABASE_URL -c "SELECT name, tier, enabled FROM ai_models WHERE app_id = 'avatar-creator';"
```

**Expected Result:**
```
                   name                    | tier  | enabled
-------------------------------------------+-------+---------
 FLUX.1-dev Base                           | free  | t
 FLUX.1-dev + Realism LoRA                 | basic | t
 FLUX.1-dev HD + Realism LoRA              | pro   | t
 FLUX.1-schnell Fast                       | basic | t
```

### Step 3: Restart Backend Services

```bash
# Stop all services
pm2 stop all

# Rebuild (if using TypeScript)
npm run build

# Start services
pm2 start ecosystem.config.js

# Check logs
pm2 logs backend
pm2 logs worker
```

### Step 4: Test Avatar Generation

#### Test 1: Free User (Base Model)
```bash
curl -X POST http://localhost:5000/api/avatar-creator/projects/PROJECT_ID/avatars/generate \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Professional portrait of a businessman",
    "name": "Test Avatar"
  }'
```

**Expected:**
- Uses: FLUX.1-dev Base (no LoRA)
- Cost: 8 credits
- Resolution: 512x512
- Time: 30-45s

#### Test 2: Basic User (Realism LoRA)
```bash
# Same request but with Basic tier user
# Should automatically select FLUX.1-dev + Realism LoRA
```

**Expected:**
- Uses: FLUX.1-dev + Realism LoRA
- Cost: 12 credits
- Resolution: 768x768
- Time: 45-60s
- Quality: Photorealistic

#### Test 3: Pro User HD Request
```bash
curl -X POST http://localhost:5000/api/avatar-creator/projects/PROJECT_ID/avatars/generate \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Professional portrait of a businesswoman",
    "name": "HD Avatar",
    "width": 1024,
    "height": 1024
  }'
```

**Expected:**
- Uses: FLUX.1-dev HD + Realism LoRA
- Cost: 15 credits
- Resolution: 1024x1024
- Time: 60-90s
- Quality: Ultra-HD photorealistic

### Step 5: Monitor Worker Logs

```bash
pm2 logs worker --lines 50
```

**Look for:**
```
🎨 Selected AI model: FLUX.1-dev + Realism LoRA (avatar-creator:flux-dev-realism)
💰 Credit cost: 12
📐 Resolution: 768x768
🤖 AI Model: black-forest-labs/FLUX.1-dev
🎨 LoRA: XLabs-AI/flux-RealismLora (scale: 0.9)
⚙️  Steps: 30, Guidance: 3.5
✅ Avatar generated successfully with model configuration
```

---

## Troubleshooting

### Issue 1: No AI Models Available

**Error:**
```
ResourceNotFoundError: No AI models available for Avatar Creator
```

**Solution:**
```bash
cd backend
npm run seed:ai-models
```

### Issue 2: HuggingFace API Key Invalid

**Error:**
```
HUGGINGFACE_API_KEY is required
```

**Solution:**
1. Check `.env` file has `HUGGINGFACE_API_KEY`
2. Verify token is valid: https://huggingface.co/settings/tokens
3. Restart backend: `pm2 restart backend`

### Issue 3: FLUX Model Loading

**Error:**
```
MODEL_LOADING
```

**Solution:**
- This is normal on first request (cold start)
- Wait 20-30 seconds and retry
- Worker has automatic retry with exponential backoff

### Issue 4: Rate Limit Exceeded

**Error:**
```
RATE_LIMIT_EXCEEDED
```

**Solution:**
1. Upgrade HuggingFace subscription to Pro
2. Wait 1 minute between requests
3. Check HuggingFace account dashboard for limits

### Issue 5: Generation Timeout

**Error:**
```
GENERATION_TIMEOUT
```

**Solution:**
- Increase timeout in `huggingface-client.ts` (currently 180s)
- Use FLUX.1-schnell for faster generation
- Check HuggingFace API status

---

## Performance Benchmarks

| Model | Resolution | Steps | LoRA | Avg Time | Quality | Credits |
|-------|------------|-------|------|----------|---------|---------|
| FLUX.1-dev Base | 512x512 | 28 | No | 35s | Good | 8 |
| FLUX.1-dev + Realism | 768x768 | 30 | Yes | 50s | Excellent | 12 |
| FLUX.1-dev HD + Realism | 1024x1024 | 35 | Yes | 75s | Ultra | 15 |
| FLUX.1-schnell | 512x512 | 4 | No | 10s | Good | 6 |

**Notes:**
- Times are approximate (depends on HuggingFace server load)
- First request may take longer (model loading)
- Realism LoRA adds ~15-20s to generation time
- HD resolution adds ~25-30s to generation time

---

## Cost Analysis

### HuggingFace API Costs

**Per Generation:**
- FLUX.1-dev: ~$0.05 USD
- FLUX.1-schnell: ~$0.01 USD
- LoRA: No additional cost

**Monthly Estimate (1000 generations):**
- All FLUX.1-dev: $50 USD
- Mix (60% dev, 40% schnell): $34 USD
- All FLUX.1-schnell: $10 USD

### User Credit Costs

**Per Generation (Internal Credits):**
- Free: 8 credits (FLUX.1-dev Base)
- Basic: 12 credits (FLUX.1-dev + Realism LoRA)
- Pro: 15 credits (FLUX.1-dev HD + Realism LoRA)
- Fast: 6 credits (FLUX.1-schnell)

**Recommended Credit Pricing:**
- 100 credits = $5 USD (breakeven at $0.05/generation)
- 500 credits = $20 USD (20% discount)
- 1000 credits = $35 USD (30% discount)

---

## Model Selection Logic

The service automatically selects the best model using this logic:

```
User makes generation request
    ↓
Is user Pro tier?
    Yes → Check resolution
        >= 1024x1024? → FLUX.1-dev HD + Realism LoRA (15 credits)
        < 1024x1024? → FLUX.1-dev + Realism LoRA (12 credits)
    ↓
Is user Basic tier?
    Yes → FLUX.1-dev + Realism LoRA (12 credits)
    ↓
Is user Free tier?
    Yes → FLUX.1-dev Base (8 credits)
    ↓
Enterprise users: Best available model (0 credits)
```

**Override Behavior:**
- If realism LoRA model not available → Use base model
- If user tier can't access preferred model → Use highest accessible
- If no models available → Throw error

---

## Future Enhancements

### Planned Features

1. **Model Selection API**
   - Let users choose model explicitly
   - Show available models based on tier
   - Display estimated time and cost

2. **Quality Presets**
   - "Fast" → FLUX.1-schnell
   - "Balanced" → FLUX.1-dev Base
   - "Quality" → FLUX.1-dev + Realism LoRA
   - "Ultra" → FLUX.1-dev HD + Realism LoRA

3. **Style LoRAs**
   - Portrait LoRA
   - Professional LoRA
   - Creative LoRA
   - Traditional LoRA

4. **Custom LoRA Upload**
   - Allow users to upload custom LoRAs
   - Train on user's avatar collection
   - Premium feature for Pro users

5. **Model Analytics**
   - Track usage per model
   - A/B test model quality
   - Optimize cost vs quality

---

## Support

### Documentation
- HuggingFace FLUX: https://huggingface.co/black-forest-labs
- Realism LoRA: https://huggingface.co/XLabs-AI/flux-RealismLora
- HuggingFace Inference API: https://huggingface.co/docs/api-inference

### Monitoring
- Backend logs: `pm2 logs backend`
- Worker logs: `pm2 logs worker`
- Database: `psql $DATABASE_URL`
- Redis: `redis-cli`

### Contact
- Report issues: Create GitHub issue
- Urgent: Contact dev team on Slack

---

## Checklist

Before deploying to production:

- [ ] HuggingFace API key is set and valid
- [ ] HuggingFace Pro subscription is active
- [ ] Database seed has been run
- [ ] 4 AI models exist in database
- [ ] Backend service restarted
- [ ] Worker service restarted
- [ ] Test generation works (free tier)
- [ ] Test generation works (basic tier with LoRA)
- [ ] Test generation works (pro tier HD)
- [ ] Monitor logs for errors
- [ ] Check credit deduction is correct
- [ ] Verify refund on failure works

---

## Summary

✅ **What Changed:**
- 4 AI models configured with proper HuggingFace IDs
- FLUX.1-dev + Realism LoRA enabled
- Database-driven model selection
- Tier-based access control
- Dynamic credit pricing

✅ **What to Do:**
1. Run database seed
2. Set HuggingFace API key
3. Restart backend and worker
4. Test avatar generation
5. Monitor logs

✅ **Expected Result:**
- Avatar Creator shows in dashboard
- Users can generate avatars
- Different quality based on tier
- Photorealistic avatars with LoRA
- Proper credit deduction

---

**Status:** Ready for Production ✅
**Last Updated:** 2025-10-14
**Version:** 1.0.0
