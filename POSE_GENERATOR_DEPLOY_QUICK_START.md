# Pose Generator - Deploy Quick Start

**CRITICAL BLOCKER:** Pose Generator has ZERO AI models in database seed!

---

## WHY POSE GENERATOR IS INVISIBLE

**Root Cause:** Dashboard filters out apps with 0 AI models (by design for access control)

**Current Status:**
- Backend: 100% complete ✅
- Frontend: 100% complete ✅
- Database seeds: ✅ Categories (33), Poses (150+)
- **AI Models: ❌ MISSING (0 models)**

**Impact:** Pose Generator is fully functional but INVISIBLE to users on dev.lumiku.com

---

## FIX IN 3 STEPS

### Step 1: Add AI Models (5 minutes)

**Edit file:** `backend/prisma/seeds/ai-models.seed.ts`

**Find this line** (around line 336):
```typescript
    }
  ]  // ← This closing bracket for the models array

  for (const model of models) {
```

**ADD BEFORE the closing bracket `]`:**

```typescript
    },  // ← Add comma after avatar-creator's last model

    // ==========================================
    // POSE GENERATOR MODELS (FLUX.1-dev + ControlNet)
    // ==========================================
    {
      appId: 'pose-generator',
      modelId: 'flux-controlnet-standard',
      modelKey: 'pose-generator:flux-controlnet-standard',
      name: 'FLUX.1-dev + ControlNet Standard',
      description: 'Generate professional avatar poses with FLUX.1-dev and OpenPose ControlNet guidance',
      provider: 'huggingface',
      tier: 'basic',
      creditCost: 30,
      creditPerPixel: null,
      quotaCost: 3,
      capabilities: JSON.stringify({
        modelId: 'black-forest-labs/FLUX.1-dev',
        controlnetType: 'openpose',
        controlnetModel: 'lllyasviel/control_v11p_sd15_openpose',
        width: 768,
        height: 768,
        numInferenceSteps: 30,
        guidanceScale: 7.5,
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 'standard',
        processingTime: '45-60s',
        features: ['pose-control', 'openpose', 'flux-generation', 'professional-quality']
      }),
      enabled: true,
      beta: false
    },
    {
      appId: 'pose-generator',
      modelId: 'flux-controlnet-pro',
      modelKey: 'pose-generator:flux-controlnet-pro',
      name: 'FLUX.1-dev + ControlNet Pro (HD)',
      description: 'Premium HD pose generation with FLUX.1-dev, OpenPose ControlNet, and enhanced detail',
      provider: 'huggingface',
      tier: 'pro',
      creditCost: 40,
      creditPerPixel: null,
      quotaCost: 4,
      capabilities: JSON.stringify({
        modelId: 'black-forest-labs/FLUX.1-dev',
        controlnetType: 'openpose',
        controlnetModel: 'lllyasviel/control_v11p_sd15_openpose',
        width: 1024,
        height: 1024,
        numInferenceSteps: 40,
        guidanceScale: 7.5,
        maxWidth: 1536,
        maxHeight: 1536,
        quality: 'high',
        processingTime: '60-90s',
        highResolution: true,
        features: ['pose-control', 'openpose', 'flux-generation', 'ultra-hd', 'professional-grade']
      }),
      enabled: true,
      beta: false
    },
    {
      appId: 'pose-generator',
      modelId: 'background-changer-sam',
      modelKey: 'pose-generator:background-changer-sam',
      name: 'SAM Background Changer',
      description: 'Segment Anything Model (SAM) for precise background replacement',
      provider: 'huggingface',
      tier: 'basic',
      creditCost: 10,
      creditPerPixel: null,
      quotaCost: 1,
      capabilities: JSON.stringify({
        modelId: 'facebook/sam-vit-huge',
        segmentationType: 'automatic',
        backgroundModes: ['ai_generate', 'solid_color', 'upload'],
        maxResolution: '1024x1024',
        processingTime: '10-20s',
        features: ['precise-segmentation', 'background-removal', 'compositing']
      }),
      enabled: true,
      beta: false
    }
```

**Verify locally:**
```bash
cd backend
bun prisma/seed.ts

# Expected output:
# ✅ Seeded 24 AI models (was 21, now 24)
```

---

### Step 2: Commit & Push (2 minutes)

```bash
cd "C:\Users\yoppi\Downloads\Lumiku App"

# Stage all changes
git add backend/src/index.ts
git add backend/src/app.ts
git add backend/prisma/seeds/ai-models.seed.ts
git add backend/src/apps/pose-generator/schemas/

# Commit
git commit -m "feat(pose-generator): Add AI models and enable production deployment

- Add 3 AI models for Pose Generator (FLUX + ControlNet + SAM)
- Fix database connection optional in development
- Add cache control middleware for API

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to trigger Coolify deployment
git push origin development
```

**Coolify will auto-deploy** (3-5 minutes build time)

---

### Step 3: Production Setup (5 minutes)

**SSH into production server:**
```bash
ssh user@dev.lumiku.com
cd /path/to/lumiku-app/backend
```

**Run database seed:**
```bash
# This adds AI models to production database
bun prisma/seed.ts

# Expected output:
# ✅ Seeded 24 AI models
# ✅ Seeded 33 pose categories
# ✅ Seeded 150+ poses
```

**Verify AI models exist:**
```bash
psql $DATABASE_URL -c "SELECT * FROM \"AIModel\" WHERE \"appId\" = 'pose-generator';"

# Expected: 3 rows
# - flux-controlnet-standard
# - flux-controlnet-pro
# - background-changer-sam
```

**Start PM2 workers:**
```bash
pm2 start ecosystem.config.js --env production
pm2 save

# Verify running
pm2 list

# Expected:
# lumiku-api (online)
# pose-generator-worker (online)
```

---

## VERIFICATION (1 minute)

**Test in browser:**
1. Navigate to: https://dev.lumiku.com
2. Login: test@lumiku.com / password123
3. **Pose Generator card should now be VISIBLE** (indigo color)
4. Click "Pose Generator"
5. Should see dashboard with "Create New Project" button

**Test API:**
```bash
curl https://dev.lumiku.com/api/apps | grep pose-generator
# Should return JSON with pose-generator app data
```

---

## IF STILL NOT VISIBLE

**Hard refresh browser:** Ctrl+Shift+R (clears cache)

**Check AI models in production:**
```bash
ssh user@dev.lumiku.com
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"AIModel\" WHERE \"appId\" = 'pose-generator';"

# If 0: Run seed again
bun prisma/seed.ts
```

**Check API response:**
```bash
curl https://dev.lumiku.com/api/apps -H "Authorization: Bearer YOUR_TOKEN"

# If Pose Generator is in API but not dashboard:
# → Frontend caching (hard refresh)

# If Pose Generator NOT in API:
# → AI models missing (run seed)
```

---

## ENVIRONMENT VARIABLES (Coolify UI)

**Ensure these are set in Coolify:**

```bash
# Critical for Pose Generator:
HUGGINGFACE_API_KEY="hf_xxxxxxxxxxxxx"  # REQUIRED!
REDIS_HOST="redis"                      # REQUIRED for queue
REDIS_PORT="6379"                       # REQUIRED for queue
DATABASE_URL="postgresql://..."         # REQUIRED

# AI Models:
FLUX_MODEL="black-forest-labs/FLUX.1-dev"
SDXL_MODEL="stabilityai/stable-diffusion-xl-base-1.0"

# Worker settings (optional):
WORKER_CONCURRENCY="5"
WORKER_NAME="pose-generator-worker-prod"
```

---

## TROUBLESHOOTING

### Pose Generator card not visible
**Fix:** Run `bun prisma/seed.ts` in production + hard refresh browser

### Worker not processing jobs
**Fix:** `pm2 restart pose-generator-worker`

### WebSocket not connecting
**Fix:** Check `REDIS_HOST` and `REDIS_PORT` in Coolify environment

### Generation fails
**Fix:** Check `HUGGINGFACE_API_KEY` is set in Coolify

---

## ROLLBACK IF NEEDED

**Coolify UI method:**
1. Navigate to: Coolify → lumiku-app → Deployments
2. Find previous working deployment
3. Click "Redeploy"

**Manual method:**
```bash
# Disable Pose Generator
# Edit: backend/src/apps/pose-generator/plugin.config.ts
features: { enabled: false }

git add .
git commit -m "fix: Temporarily disable Pose Generator"
git push origin development
```

---

## TOTAL TIME: ~15 MINUTES

- Step 1 (Add models): 5 min
- Step 2 (Commit+push): 2 min
- Auto-deploy: 3-5 min (Coolify)
- Step 3 (Production setup): 5 min
- **Total: 15-17 minutes**

---

## SUCCESS CRITERIA ✅

- [ ] AI models added to seed file (3 models)
- [ ] Code committed and pushed
- [ ] Coolify deployment successful
- [ ] Seeds run in production (24 AI models)
- [ ] PM2 workers running (lumiku-api + pose-generator-worker)
- [ ] Pose Generator card VISIBLE on dashboard (indigo color)
- [ ] Can navigate to /apps/pose-generator
- [ ] Dashboard page loads without errors

---

**Next:** After successful deployment, see `POSE_GENERATOR_COOLIFY_DEPLOYMENT_PLAN.md` for full details.
