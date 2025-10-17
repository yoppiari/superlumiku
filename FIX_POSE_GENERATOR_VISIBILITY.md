# QUICK FIX: Make Pose Generator Visible to All Users

## Problem

Pose Generator does NOT appear in dashboard for FREE tier users because:
- All pose-generator AI models require BASIC+ tier
- Access control filters out apps with zero accessible models

## Solution: Add FREE Tier Model

Add a basic quality, free tier model so all users can try pose generator.

---

## Step 1: Edit ai-models.seed.ts

**File**: `C:\Users\yoppi\Downloads\Lumiku App\backend\prisma\seeds\ai-models.seed.ts`

**Location**: Add this BEFORE line 213 (before the existing pose-generator models)

```typescript
// ==========================================
// POSE GENERATOR MODELS - FREE TIER
// ==========================================
{
  appId: 'pose-generator',
  modelId: 'flux-controlnet-free',
  modelKey: 'pose-generator:flux-controlnet-free',
  name: 'FLUX ControlNet Free',
  description: 'Basic pose generation with reduced quality for free tier users (512x512, faster processing)',
  provider: 'huggingface',
  tier: 'free', // 🆓 FREE TIER - This is the key change!
  creditCost: 20, // Lower cost than standard (30 credits)
  creditPerPixel: null,
  quotaCost: 1,
  capabilities: JSON.stringify({
    modelId: 'black-forest-labs/FLUX.1-dev',
    controlnetModel: 'InstantX/FLUX.1-dev-Controlnet-Union',
    controlnetType: 'openpose',
    width: 512,        // Smaller resolution than standard (768x768)
    height: 512,
    numInferenceSteps: 20, // Fewer steps = faster but lower quality
    guidanceScale: 3.5,
    controlnetConditioningScale: 0.7, // Lower conditioning for free tier
    maxWidth: 768,     // Max 768x768 for free tier
    maxHeight: 768,
    quality: 'basic',
    processingTime: '30-45s',
    poseGuidance: true,
    features: ['pose-to-avatar', 'controlnet', 'free-tier', 'basic-quality']
  }),
  enabled: true,
  beta: false
},
```

---

## Step 2: Run Seed Script

**Option A: Coolify Production**
```bash
# SSH into Coolify container
# Navigate to backend directory
cd /app/backend

# Run seed
bun prisma db seed
```

**Option B: Local Development**
```bash
cd "C:\Users\yoppi\Downloads\Lumiku App\backend"
bun prisma db seed
```

---

## Step 3: Verify in Database

**Check if model was created:**
```sql
SELECT
    "modelId",
    "modelKey",
    "tier",
    "creditCost",
    "enabled"
FROM "AIModel"
WHERE "appId" = 'pose-generator'
ORDER BY "tier", "creditCost";
```

**Expected output:**
```
modelId                        | tier       | creditCost | enabled
-------------------------------|------------|------------|--------
flux-controlnet-free           | free       | 20         | true    ⬅️ NEW
flux-controlnet-standard       | basic      | 30         | true
background-changer-sam         | basic      | 10         | true
flux-controlnet-pro            | pro        | 40         | true
```

---

## Step 4: Test API

**Login as FREE tier user:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@lumiku.com","password":"password123"}'
```

**Get apps (should now include pose-generator):**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/apps
```

**Expected response:**
```json
{
  "apps": [
    {
      "appId": "avatar-creator",
      "name": "Avatar Creator",
      "availableModels": 1
    },
    {
      "appId": "video-mixer",
      "name": "Video Mixer",
      "availableModels": 1
    },
    {
      "appId": "pose-generator",      ⬅️ NOW VISIBLE
      "name": "Pose Generator",
      "availableModels": 1            ⬅️ 1 free tier model
    }
  ]
}
```

---

## Step 5: Verify Models API

**Get pose-generator models for FREE tier user:**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/apps/pose-generator/models
```

**Expected response:**
```json
{
  "models": [
    {
      "modelId": "flux-controlnet-free",
      "modelKey": "pose-generator:flux-controlnet-free",
      "name": "FLUX ControlNet Free",
      "tier": "free",
      "creditCost": 20,
      "enabled": true
    }
  ]
}
```

---

## Alternative: Upgrade User to BASIC Tier

If you don't want to add a free model, upgrade the test user:

```sql
UPDATE "User"
SET "subscriptionTier" = 'basic'
WHERE email = 'test@lumiku.com';
```

**Impact**:
- User can now see Pose Generator
- User can access 2 models: flux-controlnet-standard (30 credits), background-changer-sam (10 credits)

---

## Rollback (If Needed)

**Disable the free model:**
```sql
UPDATE "AIModel"
SET "enabled" = false
WHERE "modelKey" = 'pose-generator:flux-controlnet-free';
```

**Or delete it:**
```sql
DELETE FROM "AIModel"
WHERE "modelKey" = 'pose-generator:flux-controlnet-free';
```

---

## Summary

**Before Fix**:
- FREE tier users: 0 pose-generator models → App hidden
- BASIC tier users: 2 models → App visible
- PRO tier users: 3 models → App visible

**After Fix**:
- FREE tier users: 1 model (flux-controlnet-free) → App visible ✅
- BASIC tier users: 3 models (free + 2 basic) → App visible ✅
- PRO tier users: 4 models (free + 2 basic + 1 pro) → App visible ✅

**Timeline**: 10 minutes
**Risk**: Low (only adds new model, doesn't modify existing functionality)
**Testing**: Required (verify free tier users can see and use pose-generator)
