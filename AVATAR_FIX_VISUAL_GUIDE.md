# Avatar Generation Fix - Visual Guide

## 🔴 BEFORE (Broken)

```
User submits avatar request
         ↓
Worker receives job
         ↓
Build FLUX request with LoRA parameters ❌
{
  "inputs": "A professional headshot...",
  "parameters": {
    "width": 1024,
    "height": 1024,
    "num_inference_steps": 30,
    "guidance_scale": 3.5,
    "lora": "XLabs-AI/flux-RealismLora",        ← NOT SUPPORTED
    "lora_scale": 0.9                            ← NOT SUPPORTED
  }
}
         ↓
POST to HuggingFace API
         ↓
🚫 400 Bad Request
{
  "error": "Invalid parameters: lora, lora_scale"
}
         ↓
Generation fails
         ↓
User sees error
Credits lost (need refund)
```

---

## ✅ AFTER (Fixed)

```
User submits avatar request
         ↓
Worker receives job
         ↓
Build FLUX request WITHOUT LoRA ✅
{
  "inputs": "A professional headshot...",
  "parameters": {
    "width": 1024,
    "height": 1024,
    "num_inference_steps": 30,
    "guidance_scale": 3.5
    // NO LoRA parameters ✅
  }
}
         ↓
POST to HuggingFace API (FLUX.1-dev)
         ↓
         ├─→ ✅ 200 OK
         │   └─→ Generate avatar
         │       └─→ Success!
         │
         └─→ ❌ 400 Bad Request (no PRO access)
             └─→ Automatic fallback to FLUX.1-schnell
                 {
                   "inputs": "...",
                   "parameters": {
                     "width": 1024,
                     "height": 1024,
                     "num_inference_steps": 4,
                     "guidance_scale": 0
                   }
                 }
                 └─→ ✅ 200 OK
                     └─→ Generate avatar (faster, good quality)
                         └─→ Success!
```

---

## 📊 Request Comparison

### ❌ Old Request (Causes 400 Error)

```json
{
  "inputs": "A professional headshot of a 25-year-old woman",
  "parameters": {
    "negative_prompt": "ugly, blurry, low quality",
    "width": 1024,
    "height": 1024,
    "num_inference_steps": 30,
    "guidance_scale": 3.5,
    "lora": "XLabs-AI/flux-RealismLora",        ← CAUSES ERROR
    "lora_scale": 0.9                            ← CAUSES ERROR
  }
}
```

**Response:**
```json
{
  "error": "Unknown parameter(s): lora, lora_scale"
}
```

**Status:** `400 Bad Request`

---

### ✅ New Request (Works)

```json
{
  "inputs": "A professional headshot of a 25-year-old woman",
  "parameters": {
    "width": 1024,
    "height": 1024,
    "num_inference_steps": 30,
    "guidance_scale": 3.5,
    "negative_prompt": "ugly, blurry, low quality"
  }
}
```

**Response:**
```
[Binary image data - 234567 bytes]
```

**Status:** `200 OK`

---

## 🔄 Fallback Flow

```
┌─────────────────────────────────────────┐
│  Try FLUX.1-dev (Best Quality)          │
│  Model: black-forest-labs/FLUX.1-dev    │
└──────────────┬──────────────────────────┘
               │
         ┌─────┴─────┐
         │           │
    ✅ Success   ❌ 400 Error
         │           │
         │      ┌────┴────────────────────────────┐
         │      │ Fallback to FLUX.1-schnell      │
         │      │ (Free Tier, Faster)             │
         │      └────┬────────────────────────────┘
         │           │
         │      ✅ Success
         │           │
         └───────┬───┘
                 │
         ┌───────▼──────┐
         │ Avatar Ready │
         └──────────────┘
```

---

## 🎯 Key Changes

### File: `backend/src/lib/huggingface-client.ts`

#### Change 1: Removed LoRA Parameters

**Before:**
```typescript
// Lines 151-154 (OLD CODE)
if (params.useLoRA !== false) {
  requestBody.parameters.lora = loraModel
  requestBody.parameters.lora_scale = params.loraScale || 0.9
}
```

**After:**
```typescript
// REMOVED - LoRA not supported by HuggingFace Inference API
// Parameters now only include: width, height, steps, guidance, negative_prompt
```

---

#### Change 2: Enhanced Error Logging

**Before:**
```typescript
// Line 187 (OLD CODE)
console.error('FLUX generation error:', error.response?.data || error.message)
```

**After:**
```typescript
// Lines 184-198 (NEW CODE)
console.error('❌ FLUX generation error:')
console.error('   Status:', error.response?.status)
console.error('   Status Text:', error.response?.statusText)
console.error('   Error Data:', JSON.stringify(error.response?.data, null, 2))
console.error('   Error Message:', error.message)

// Parse buffer errors
if (error.response?.data instanceof ArrayBuffer || Buffer.isBuffer(error.response?.data)) {
  try {
    const errorText = Buffer.from(error.response.data).toString('utf-8')
    console.error('   Parsed Error:', errorText)
  } catch (e) {
    console.error('   Could not parse error data')
  }
}
```

**Benefit:** You can now see **exact error details** from HuggingFace

---

#### Change 3: Automatic Fallback

**Before:**
```typescript
// Just threw error
throw error
```

**After:**
```typescript
// Lines 217-220 (NEW CODE)
if (error.response?.status === 400 && modelId.includes('FLUX.1-dev')) {
  console.log('⚠️  FLUX.1-dev failed, trying FLUX.1-schnell fallback...')
  return this.fluxSchnellFallback(params)
}
```

**Benefit:** Automatic graceful degradation to free tier model

---

#### Change 4: New Fallback Method

**New Code (Lines 230-273):**
```typescript
private async fluxSchnellFallback(params: {...}): Promise<Buffer> {
  const modelId = 'black-forest-labs/FLUX.1-schnell'

  console.log(`🔄 Using FLUX.1-schnell fallback (free tier)`)

  const requestBody = {
    inputs: params.prompt,
    parameters: {
      width: params.width || 1024,
      height: params.height || 1024,
      num_inference_steps: 4,      // Schnell uses only 4 steps
      guidance_scale: 0,            // Schnell doesn't use guidance
    }
  }

  const response = await axios.post(
    `https://api-inference.huggingface.co/models/${modelId}`,
    requestBody,
    { /* ... */ }
  )

  console.log(`✅ FLUX.1-schnell fallback successful`)
  return Buffer.from(response.data)
}
```

**Benefit:** Fast, free-tier model as backup

---

## 📈 Expected Logs

### ✅ Successful Generation (FLUX.1-dev)

```
🎨 Processing avatar generation: 12345
📝 Prompt: A professional headshot of a 25-year-old woman...
🤖 AI Model: black-forest-labs/FLUX.1-dev
⚙️  Steps: 30, Guidance: 3.5

🎨 FLUX Generation Request:
   Model: black-forest-labs/FLUX.1-dev
   Prompt: A professional headshot of a 25-year-old woman...
   Parameters: { width: 1024, height: 1024, num_inference_steps: 30, guidance_scale: 3.5 }

✅ FLUX generation successful (234567 bytes)
✅ Avatar created successfully: avatar-abc-123
```

---

### ✅ Successful Generation (FLUX.1-schnell Fallback)

```
🎨 Processing avatar generation: 12345
📝 Prompt: A professional headshot of a 25-year-old woman...
🤖 AI Model: black-forest-labs/FLUX.1-dev
⚙️  Steps: 30, Guidance: 3.5

🎨 FLUX Generation Request:
   Model: black-forest-labs/FLUX.1-dev
   Prompt: A professional headshot of a 25-year-old woman...
   Parameters: { width: 1024, height: 1024, num_inference_steps: 30, guidance_scale: 3.5 }

❌ FLUX generation error:
   Status: 400
   Status Text: Bad Request
   Error Data: { "error": "Model access denied. Upgrade to PRO." }

⚠️  FLUX.1-dev failed, trying FLUX.1-schnell fallback...
🔄 Using FLUX.1-schnell fallback (free tier)
✅ FLUX.1-schnell fallback successful

✅ Avatar created successfully: avatar-abc-123
```

---

### ❌ Old Error (Before Fix)

```
🎨 Processing avatar generation: 12345
📝 Prompt: A professional headshot of a 25-year-old woman...

❌ Generation failed for gen-abc-123:
   errorCode: AI_PROVIDER_ERROR
   errorMessage: Request failed with status code 400
   errorCategory: ai_provider

❌ Avatar generation failed: 12345
Error: Request failed with status code 400
```

---

## 🧪 Testing the Fix

### Local Test (Before Deployment)

```bash
# 1. Install dependencies
cd backend
bun install

# 2. Set API key
export HUGGINGFACE_API_KEY=YOUR_HUGGINGFACE_API_KEY_HERE

# 3. Run test script
bun run scripts/test-flux-api.ts
```

**Expected Output:**
```
🧪 FLUX API Test Suite
API Key: hf_oocboYx...

============================================================
Testing: black-forest-labs/FLUX.1-schnell
============================================================
Request: {
  "inputs": "A professional headshot of a 25-year-old woman with brown hair",
  "parameters": {
    "width": 512,
    "height": 512,
    "num_inference_steps": 4,
    "guidance_scale": 0
  }
}
✅ SUCCESS!
   Status: 200
   Content-Type: image/jpeg
   Size: 124532 bytes
   Saved: test-outputs/black-forest-labs_FLUX.1-schnell_test.jpg

============================================================
SUMMARY
============================================================
FLUX.1-schnell (free):          ✅ WORKS
FLUX.1-dev (base):              ✅ WORKS or ❌ FAILED
FLUX.1-dev (with negative):     ✅ WORKS or ❌ FAILED

📋 RECOMMENDATIONS:
   ⚠️  Your API key does not have access to FLUX.1-dev
   💡 Use FLUX.1-schnell (free tier) or upgrade to HuggingFace PRO
   🔧 Update .env: FLUX_MODEL=black-forest-labs/FLUX.1-schnell
```

---

### Production Test (After Deployment)

```bash
# In Coolify terminal
cd backend
bun run scripts/test-flux-api.ts

# Then test actual generation
# 1. Go to https://dev.lumiku.com/avatar-creator
# 2. Click "Text to Image"
# 3. Enter: "A professional headshot of a young woman"
# 4. Click "Generate"
# 5. Monitor logs: pm2 logs avatar-worker
```

---

## 🎓 Why This Fix Works

### Problem: HuggingFace Inference API is Simplified

HuggingFace offers **two types of APIs**:

1. **Inference API** (What we use)
   - Simple, fast, serverless
   - ❌ **No LoRA support**
   - ❌ **No custom pipelines**
   - ✅ Basic parameters only

2. **Custom Endpoints** (Enterprise)
   - Full control
   - ✅ LoRA support
   - ✅ Custom code
   - 💰 More expensive

### Solution: Use Only Supported Parameters

We removed the unsupported parameters and added fallback logic.

**Supported Parameters:**
- ✅ `inputs` (prompt)
- ✅ `width`, `height`
- ✅ `num_inference_steps`
- ✅ `guidance_scale`
- ✅ `negative_prompt`
- ✅ `seed`

**Unsupported Parameters:**
- ❌ `lora` (our mistake)
- ❌ `lora_scale` (our mistake)
- ❌ `scheduler` (not available)
- ❌ `controlnet` (separate model)

---

## ✅ Success Criteria

After deployment, you should see:

1. ✅ No 400 errors in worker logs
2. ✅ Avatar generation completes successfully
3. ✅ Generated images appear in dashboard
4. ✅ One of these log patterns:
   - "FLUX generation successful" (FLUX.1-dev works)
   - OR "FLUX.1-schnell fallback successful" (fallback works)
5. ✅ Credits deducted correctly
6. ✅ No credit refunds needed

---

## 📞 Need Help?

If you still see errors after this fix:

1. **Check the exact error in logs:**
   ```bash
   pm2 logs avatar-worker | grep "Error Data"
   ```

2. **Share the output of:**
   ```bash
   bun run scripts/test-flux-api.ts
   ```

3. **Verify API key:**
   - Check at https://huggingface.co/settings/tokens
   - Ensure "Read" permission enabled
   - Check not expired

4. **Try manual curl:**
   ```bash
   curl https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell \
     -H "Authorization: Bearer YOUR_KEY" \
     -d '{"inputs":"test"}'
   ```
