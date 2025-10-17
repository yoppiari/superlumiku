# Fix Avatar Generation 400 Error

## 🔍 Root Cause Identified

**The 400 error is caused by sending LoRA parameters to HuggingFace API, which does NOT support them.**

### Issues Found:
1. ✅ **LoRA parameters not supported** - HuggingFace Inference API doesn't accept `lora` and `lora_scale`
2. ✅ **FLUX.1-dev may require PRO** - Your API key might not have access to FLUX.1-dev
3. ✅ **Fixed in code** - Removed LoRA parameters and added FLUX.1-schnell fallback

---

## ✅ Fix Applied

### Changes Made to `backend/src/lib/huggingface-client.ts`:

1. **Removed LoRA parameters** from API request (lines 151-154)
   - Deleted: `requestBody.parameters.lora`
   - Deleted: `requestBody.parameters.lora_scale`

2. **Added enhanced error logging** (lines 183-198)
   - Shows exact HuggingFace error response
   - Helps diagnose future issues

3. **Added FLUX.1-schnell fallback** (lines 217-273)
   - Automatically falls back to free tier model if FLUX.1-dev fails
   - FLUX.1-schnell is faster and requires no PRO subscription

4. **Simplified request parameters**
   - Only sends parameters supported by HuggingFace Inference API
   - Conditional negative prompt (some models don't support it)

---

## 🚀 Deployment Steps

### Step 1: Commit Changes Locally

```bash
cd "C:\Users\yoppi\Downloads\Lumiku App"
git add backend/src/lib/huggingface-client.ts
git commit -m "fix(avatar-creator): Remove LoRA parameters causing 400 error from HuggingFace API"
git push origin development
```

### Step 2: Deploy to Coolify

1. Go to Coolify dashboard
2. Navigate to Lumiku app
3. Click "Redeploy" (will pull latest code from development branch)
4. Wait for build to complete (~3-5 minutes)

### Step 3: Restart Avatar Worker on Server

```bash
# SSH to dev.lumiku.com
ssh user@dev.lumiku.com

# Navigate to backend directory
cd /path/to/lumiku/backend

# Restart worker
pm2 restart avatar-worker

# Check worker logs
pm2 logs avatar-worker --lines 50
```

### Step 4: Test Avatar Generation

```bash
# In Coolify terminal or SSH
cd /path/to/lumiku/backend

# Run test script to verify API
bun run scripts/test-flux-api.ts

# Expected output:
# ✅ FLUX.1-schnell (free): SUCCESS
# ✅ FLUX.1-dev (base): SUCCESS or FALLBACK
```

### Step 5: Test from Frontend

1. Go to https://dev.lumiku.com/avatar-creator
2. Create a new avatar with text-to-image
3. Submit generation
4. Monitor worker logs: `pm2 logs avatar-worker`

**Expected logs:**
```
🎨 FLUX Generation Request:
   Model: black-forest-labs/FLUX.1-dev
   Prompt: A professional headshot...
   Parameters: { width: 1024, height: 1024, ... }
✅ FLUX generation successful (234567 bytes)
```

**OR if fallback triggers:**
```
⚠️  FLUX.1-dev failed, trying FLUX.1-schnell fallback...
🔄 Using FLUX.1-schnell fallback (free tier)
✅ FLUX.1-schnell fallback successful
```

---

## 🔧 Alternative: Force FLUX.1-schnell

If FLUX.1-dev keeps failing, force the app to use FLUX.1-schnell:

### Option A: Environment Variable (Recommended)

In Coolify:
1. Go to Environment Variables
2. Add: `FLUX_MODEL=black-forest-labs/FLUX.1-schnell`
3. Redeploy

### Option B: Update Default Model in Seed

Edit `backend/prisma/seeds/ai-models.seed.ts`:

```typescript
// Change line 350 (flux-dev-base model)
capabilities: JSON.stringify({
  modelId: 'black-forest-labs/FLUX.1-schnell', // Changed from FLUX.1-dev
  // ...
}),
```

Then run:
```bash
bun run prisma db seed
```

---

## 📊 What Changed

### Before (BROKEN ❌)
```typescript
const requestBody = {
  inputs: params.prompt,
  parameters: {
    width: 1024,
    height: 1024,
    num_inference_steps: 30,
    guidance_scale: 3.5,
    lora: 'XLabs-AI/flux-RealismLora',        // ❌ NOT SUPPORTED
    lora_scale: 0.9                            // ❌ NOT SUPPORTED
  }
}
```

**Result:** 400 Bad Request

### After (FIXED ✅)
```typescript
const requestBody = {
  inputs: params.prompt,
  parameters: {
    width: 1024,
    height: 1024,
    num_inference_steps: 30,
    guidance_scale: 3.5
    // LoRA parameters removed ✅
  }
}
```

**Result:** 200 OK or automatic fallback to FLUX.1-schnell

---

## 🧪 Test the Fix Locally (Optional)

```bash
# Install dependencies
cd backend
bun install

# Set API key
export HUGGINGFACE_API_KEY=YOUR_HUGGINGFACE_API_KEY_HERE

# Run test script
bun run scripts/test-flux-api.ts

# Check output folder
ls test-outputs/
# Should see: black-forest-labs_FLUX.1-schnell_test.jpg
```

---

## 📋 Verification Checklist

After deployment:

- [ ] Code deployed to Coolify (check deployment logs)
- [ ] Avatar worker restarted (`pm2 list` shows running)
- [ ] Test script passes (`bun run scripts/test-flux-api.ts`)
- [ ] Avatar generation works from frontend
- [ ] Check logs show "FLUX generation successful" or "fallback successful"
- [ ] Generated avatar appears in dashboard
- [ ] No 400 errors in worker logs

---

## 🆘 Troubleshooting

### If still getting 400 error:

1. **Check exact error message in logs:**
   ```bash
   pm2 logs avatar-worker | grep "Error Data"
   ```

2. **Verify API key is valid:**
   - Go to https://huggingface.co/settings/tokens
   - Check token has "Read" permission
   - Check token not expired

3. **Test API key manually:**
   ```bash
   curl https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell \
     -H "Authorization: Bearer YOUR_HUGGINGFACE_API_KEY_HERE" \
     -H "Content-Type: application/json" \
     -d '{"inputs":"a cat"}'
   ```

4. **Force FLUX.1-schnell:**
   - Set `FLUX_MODEL=black-forest-labs/FLUX.1-schnell` in Coolify
   - Redeploy

### If getting "Model Loading" error:

This is normal - the model is cold starting. The worker will retry automatically:
```
Model loading, retrying in 5000ms (attempt 1/3)
```

Wait 30-60 seconds and it should succeed.

---

## 📚 Additional Information

### Why LoRA Doesn't Work

HuggingFace Inference API is a **simplified API** that doesn't support advanced features like:
- LoRA adapters
- Custom schedulers
- ControlNet (requires separate endpoint)
- Multi-model pipelines

To use LoRA with FLUX, you need:
- **Replicate API** (supports LoRA)
- **ComfyUI** (full control)
- **Custom endpoint** (self-hosted)
- **HuggingFace Spaces** (with custom code)

### FLUX.1-schnell vs FLUX.1-dev

| Feature | FLUX.1-schnell | FLUX.1-dev |
|---------|----------------|------------|
| Speed | 5-15s | 30-60s |
| Quality | Good | Excellent |
| Steps | 4 | 28-50 |
| Guidance | None (0) | Yes (3.5) |
| API Tier | Free | PRO* |
| Cost | Lower | Higher |

*May require HuggingFace PRO subscription depending on API key tier

---

## ✅ Summary

**Root Cause:** Sending unsupported `lora` and `lora_scale` parameters to HuggingFace API

**Fix:** Removed LoRA parameters + added FLUX.1-schnell fallback

**Next Steps:**
1. Deploy code to Coolify
2. Restart avatar-worker
3. Test avatar generation
4. Verify success in logs

**Expected Result:** Avatar generation works with FLUX.1-dev or automatically falls back to FLUX.1-schnell (free tier)
