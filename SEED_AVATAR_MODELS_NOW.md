# Seed Avatar Creator AI Models - Production Guide

**Status:** Deployment triggered (UUID: t0sw4kokwkk0c0gk40ockogc)
**Date:** October 14, 2025
**Purpose:** Add FLUX.1-dev + Realism LoRA models to production database

---

## Step 1: Verify Build Completion

1. Open Coolify: https://cf.avolut.com
2. Navigate to Avatar Creator application (UUID: t0sw4kokwkk0c0gk40ockogc)
3. Check deployment status - wait for "Deployed" status (should take 3-5 minutes)
4. Look for green checkmark indicating successful build

---

## Step 2: Seed AI Models via Coolify Terminal

### Open Terminal
1. In Coolify, click on Avatar Creator application
2. Click "Terminal" tab or "Execute Command" button
3. A terminal session will open in the container

### Run Seed Command

```bash
# Navigate to backend directory
cd /app/backend

# Run the AI models seed script
bun run seed

# Expected output:
# 🌱 Starting database seeding...
# ✅ Seeding AI models...
# ✅ Created/Updated AI model: FLUX.1-dev Base (free tier)
# ✅ Created/Updated AI model: FLUX.1-dev + Realism LoRA (basic tier)
# ✅ Created/Updated AI model: FLUX.1-dev HD + Realism LoRA (pro tier)
# ✅ Created/Updated AI model: FLUX.1-schnell Fast (basic tier)
# ✅ Seeded 4 AI models for avatar-creator
# 🎉 Database seeding completed successfully
```

### If seed command fails, try direct database query:

```bash
# Run the seed script directly
node /app/backend/prisma/seeds/ai-models.seed.js

# OR use Prisma CLI
bunx prisma db seed
```

---

## Step 3: Verify Models Were Created

### Option A: Run verification script

```bash
cd /app
node verify-avatar-models.js

# Expected output:
# ✅ Connected to production database
# ✅ Found 4 AI models for avatar-creator:
#    1. FLUX.1-dev Base (free) - 8 credits
#    2. FLUX.1-dev + Realism LoRA (basic) - 12 credits
#    3. FLUX.1-dev HD + Realism LoRA (pro) - 15 credits
#    4. FLUX.1-schnell Fast (basic) - 6 credits
# ✅ All models configured correctly
```

### Option B: Check via Prisma Studio

```bash
bunx prisma studio
# Opens web interface at localhost:5555
# Navigate to AIModel table
# Verify 4 records exist with appId = 'avatar-creator'
```

### Option C: Direct SQL query

```bash
cd /app/backend
bunx prisma db execute --stdin <<EOF
SELECT
  "modelKey",
  "name",
  "tier",
  "creditCost",
  "enabled"
FROM "AIModel"
WHERE "appId" = 'avatar-creator'
ORDER BY "tier", "creditCost";
EOF
```

---

## Step 4: Restart Services

After seeding, restart backend and worker to pick up new models:

```bash
# Option A: Via pm2 (if using pm2)
pm2 restart backend
pm2 restart worker

# Option B: Via Coolify (recommended)
# Go to Coolify UI -> Avatar Creator -> Click "Restart"
# This will restart all containers
```

---

## Step 5: Verify Dashboard Works

### Test Dashboard
1. Open: https://dev.lumiku.com/dashboard
2. **Expected:** Dashboard loads without "Page Error"
3. **Expected:** See 3 apps: Video Mixer, Carousel Mix, **Avatar Creator**
4. Avatar Creator card should show:
   - Purple icon (user-circle)
   - "Avatar Creator" title
   - "Create realistic AI avatars" description

### Test API Response

Open browser console on dashboard and run:

```javascript
fetch('https://dev.lumiku.com/api/apps', {
  headers: { 'Authorization': 'Bearer YOUR_JWT_TOKEN' }
})
  .then(r => r.json())
  .then(data => {
    console.log('Apps count:', data.apps.length)
    console.log('Apps:', data.apps.map(a => a.name))
    console.log('Avatar Creator found:', data.apps.some(a => a.appId === 'avatar-creator'))
  })
```

**Expected output:**
```
Apps count: 3
Apps: ["Video Mixer", "Carousel Mix", "Avatar Creator"]
Avatar Creator found: true
```

---

## Step 6: Test Avatar Generation

### Via API

```bash
# Get JWT token from localStorage in browser
# Then test generate endpoint

curl -X POST https://dev.lumiku.com/api/apps/avatar-creator/projects/PROJECT_ID/avatars/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Avatar",
    "prompt": "Professional headshot of a young business professional",
    "gender": "male",
    "ageRange": "25-35",
    "width": 768,
    "height": 768
  }'

# Expected: Returns generation job with status 'queued'
```

### Via Dashboard
1. Navigate to Avatar Creator in dashboard
2. Create a new project
3. Click "Generate Avatar"
4. Fill in prompt: "Professional headshot of a young business professional"
5. Click "Generate"
6. **Expected:** Generation starts, worker processes it
7. **Expected:** Avatar appears after 30-60 seconds

---

## Step 7: Check Worker Logs

Monitor worker to see AI model selection:

```bash
# In Coolify Terminal
pm2 logs worker --lines 50

# OR via Docker
docker logs -f WORKER_CONTAINER_ID

# Expected logs:
# 🎨 Processing avatar generation: job-123
# 📸 Generating avatar for user user-456
# 📝 Prompt: Professional headshot...
# 🤖 AI Model: black-forest-labs/FLUX.1-dev + Realism LoRA
# 🎨 LoRA: XLabs-AI/flux-RealismLora (scale: 0.9)
# ⚙️  Steps: 30, Guidance: 3.5
# ✅ Avatar generated successfully with model configuration
# ✅ Avatar created successfully: avatar-789
```

---

## Troubleshooting

### Issue: "No AI models found"

**Symptom:** Backend logs show `Avatar Creator: 0 models available`

**Fix:**
```bash
# Re-run seed command
cd /app/backend
bun run seed

# Restart backend
pm2 restart backend
```

### Issue: "Dashboard still shows Page Error"

**Symptom:** Frontend still crashes after seeding

**Diagnosis:**
1. Check API response: `curl https://dev.lumiku.com/api/apps -H "Auth: Bearer TOKEN"`
2. Verify apps count: Should be 3
3. Check browser console for specific error

**Fix:**
```bash
# Clear Redis cache (if enabled)
redis-cli FLUSHDB

# Hard refresh browser: Ctrl + Shift + R
# OR clear localStorage
localStorage.clear()
location.reload()
```

### Issue: "Worker not picking up new models"

**Symptom:** Worker still uses default FLUX.1-dev without LoRA

**Fix:**
```bash
# Restart worker service
pm2 restart worker

# Verify worker connected to Redis
pm2 logs worker | grep "Avatar Generator Worker started"
```

### Issue: "TypeScript errors during seed"

**Symptom:** `bun run seed` fails with TS errors

**Fix:**
```bash
# Run seed directly with JS
node /app/backend/prisma/seeds/ai-models.seed.js

# OR bypass TypeScript
bun --no-check run seed
```

---

## Success Criteria Checklist

- [ ] ✅ Build completed successfully in Coolify
- [ ] ✅ Seed command executed without errors
- [ ] ✅ Verification script shows 4 AI models
- [ ] ✅ Backend and worker services restarted
- [ ] ✅ Dashboard loads without "Page Error"
- [ ] ✅ Avatar Creator appears in app list (3 total apps)
- [ ] ✅ API returns Avatar Creator with credits config
- [ ] ✅ Avatar generation works end-to-end
- [ ] ✅ Worker logs show LoRA model usage
- [ ] ✅ Generated avatars have high quality (realistic)

---

## Expected Timeline

| Step | Duration | Status |
|------|----------|--------|
| Build completion | 3-5 min | ⏳ In progress |
| Seed models | 30 sec | ⏳ Waiting |
| Restart services | 1 min | ⏳ Waiting |
| Verify dashboard | 30 sec | ⏳ Waiting |
| Test generation | 60 sec | ⏳ Waiting |
| **Total** | **5-8 min** | |

---

## Support Commands

### Check database connection
```bash
cd /app/backend
bunx prisma db execute --stdin <<EOF
SELECT COUNT(*) as total FROM "AIModel" WHERE "appId" = 'avatar-creator';
EOF
```

### List all AI models
```bash
bunx prisma db execute --stdin <<EOF
SELECT * FROM "AIModel" ORDER BY "appId", "tier", "creditCost";
EOF
```

### Check app configuration
```bash
cd /app/backend
node -e "
const { avatarCreatorConfig } = require('./src/apps/avatar-creator/plugin.config.ts')
console.log('Avatar Creator Config:')
console.log('  App ID:', avatarCreatorConfig.appId)
console.log('  Credits:', avatarCreatorConfig.credits)
console.log('  Enabled:', avatarCreatorConfig.features.enabled)
"
```

---

## What Changed in This Deployment

### Files Modified (11 total)

1. **backend/src/apps/avatar-creator/services/avatar-creator.service.ts**
   - Added `selectAIModel()` method for tier-based model selection
   - Modified `generateAvatar()` to pass AI model config to worker
   - Added `creditCost` calculation based on selected model

2. **backend/src/apps/avatar-creator/workers/avatar-generator.worker.ts**
   - Added `generateWithModelConfig()` method
   - Implements dynamic LoRA application
   - Reads model config from job metadata

3. **backend/src/apps/avatar-creator/types.ts**
   - Added `aiModel` field to `AvatarGenerationJob` metadata

4. **backend/src/lib/queue.ts**
   - Synchronized `AvatarGenerationJob` interface with types.ts
   - Added `creditCost` and `aiModel` fields

5. **backend/prisma/seeds/ai-models.seed.ts** (NEW)
   - Defines 4 FLUX model configurations
   - Implements upsert logic for idempotent seeding

6. **verify-avatar-models.js** (NEW)
   - Verification script to check models in database

7. **seed-avatar-models.sh/bat** (NEW)
   - Automated seeding scripts for Linux/Windows

8. **DEPLOY_SEED_COMMANDS.md** (NEW)
   - Step-by-step deployment guide

9. **AVATAR_CREATOR_AI_MODELS_SETUP.md** (NEW)
   - Complete technical documentation

### AI Models Added (4 models)

1. **FLUX.1-dev Base** (Free tier, 8 credits)
   - 512x512, no LoRA, basic quality

2. **FLUX.1-dev + Realism LoRA** (Basic tier, 12 credits)
   - 768x768, LoRA @ 0.9, photorealistic

3. **FLUX.1-dev HD + Realism LoRA** (Pro tier, 15 credits)
   - 1024x1024, LoRA @ 0.9, ultra HD

4. **FLUX.1-schnell Fast** (Basic tier, 6 credits)
   - 512x512, 4 steps, fast generation

---

## Next Steps After Success

1. **Monitor production usage**
   - Check worker logs for generation success rate
   - Monitor credit deductions
   - Watch for errors or failures

2. **Optimize if needed**
   - Adjust LoRA scale if quality issues
   - Tune inference steps vs speed tradeoff
   - Add more models for different styles

3. **Consider Sprint 2 optimizations**
   - Replace polling with WebSockets (per architecture review)
   - Scale to 3+ worker instances
   - Implement caching layer

---

**Deployment Triggered:** ab5cf54 (AI models configuration)
**Coolify URL:** https://cf.avolut.com/project/owkwc004ss0og488cgkccoo0/application/t0sw4kokwkk0c0gk40ockogc
**Production URL:** https://dev.lumiku.com

**Ready to proceed!** Follow the steps above once the build completes.
