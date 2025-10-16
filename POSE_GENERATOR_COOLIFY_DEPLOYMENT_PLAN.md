# Pose Generator - Coolify Production Deployment Plan

**Generated:** 2025-10-16
**Status:** READY FOR DEPLOYMENT (with critical blockers identified)
**Environment:** dev.lumiku.com (Coolify)

---

## EXECUTIVE SUMMARY

### Current Status
- **Backend:** 100% complete and registered in plugin loader
- **Frontend:** 100% complete with React Router integration
- **Database:** Seeds ready (categories, poses, test data)
- **Local Environment:** Server runs successfully on localhost:3000
- **Production Environment:** **POSE GENERATOR NOT VISIBLE** on dev.lumiku.com

### Critical Blocker Identified

**PRIMARY ISSUE: MISSING AI MODELS IN DATABASE**

The Pose Generator app is **FILTERED OUT** by the dashboard because it has NO AI models registered in the database.

**Evidence:**
```bash
# backend/prisma/seeds/ai-models.seed.ts analysis
Total models: 21 apps
- video-generator: 4 models ✓
- poster-editor: 3 models ✓
- video-mixer: 1 model ✓
- carousel-mix: 1 model ✓
- looping-flow: 1 model ✓
- avatar-creator: 4 models ✓
- pose-generator: 0 models ❌ MISSING!
```

**Root Cause:** The frontend `Dashboard.tsx` and API `/api/apps` endpoint filter out apps that have ZERO associated AI models. This is by design for access control.

**Impact:** Pose Generator is fully functional but INVISIBLE to users.

---

## DEPLOYMENT BLOCKERS (MUST FIX BEFORE DEPLOY)

### 🔴 BLOCKER #1: Add Pose Generator AI Models to Seed

**File:** `C:\Users\yoppi\Downloads\Lumiku App\backend\prisma\seeds\ai-models.seed.ts`

**Required Models:**
```typescript
// Add to models array in ai-models.seed.ts (after avatar-creator models)

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

**Action Required:**
1. Edit `backend/prisma/seeds/ai-models.seed.ts`
2. Add the 3 models above to the `models` array (after avatar-creator models, before the closing bracket)
3. Save the file
4. Commit the changes

**Verification Command:**
```bash
cd backend
bun prisma/seed.ts
# Should output: "✅ Seeded 24 AI models" (21 existing + 3 new)
```

---

## FILES NEEDING COMMIT

### Modified Files (Already Tracked)
```bash
M  .claude/settings.local.json          # Claude Code settings (optional - can skip)
M  backend/src/index.ts                 # ✓ Database optional in dev mode fix
M  backend/src/app.ts                   # ✓ Cache control middleware added
```

### New Files (Untracked - Critical for Deployment)
```bash
# Backend - Pose Generator Schemas
?? backend/src/apps/pose-generator/schemas/
   └── validation.schemas.ts            # ✓ Input validation schemas

# Frontend - Complete Implementation
?? frontend/src/apps/pose-generator/    # ✓ Full frontend app (already committed)
?? frontend/src/apps/PoseGenerator.tsx  # ✓ Main entry component

# Database - Seed Data
?? backend/prisma/seeds/data/
   ├── pose-categories.ts               # ✓ 33 categories hierarchy
   └── pose-library.ts                  # ✓ 150+ curated poses
?? backend/prisma/seeds/pose-generator.seed.ts  # ✓ Main seed script
```

### Git Status Summary
```bash
# Files to commit:
- backend/src/index.ts                                    (REQUIRED)
- backend/src/app.ts                                      (REQUIRED)
- backend/src/apps/pose-generator/schemas/                (REQUIRED)
- backend/prisma/seeds/ai-models.seed.ts                  (REQUIRED - after adding models)

# Optional (documentation):
- .claude/settings.local.json                             (OPTIONAL)
```

---

## ENVIRONMENT VARIABLES REQUIRED

### Production Environment (Coolify)

**Critical Variables** (must be set in Coolify UI):

```bash
# ========================================
# Database (PostgreSQL)
# ========================================
DATABASE_URL="postgresql://user:password@host:5432/lumiku_prod?schema=public"

# ========================================
# Redis (Required for Queue + WebSocket)
# ========================================
REDIS_HOST="redis-container-name"
REDIS_PORT="6379"
REDIS_PASSWORD=""  # Set if Redis has auth enabled

# ========================================
# AI Services (Required for Pose Generation)
# ========================================
HUGGINGFACE_API_KEY="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # CRITICAL!

# AI Models (FLUX + ControlNet)
FLUX_MODEL="black-forest-labs/FLUX.1-dev"
SDXL_MODEL="stabilityai/stable-diffusion-xl-base-1.0"

# ========================================
# Server Configuration
# ========================================
NODE_ENV="production"
PORT="3000"

# JWT
JWT_SECRET="your-production-secret-min-32-chars"
JWT_EXPIRES_IN="7d"

# CORS
CORS_ORIGIN="https://dev.lumiku.com"

# ========================================
# File Storage
# ========================================
UPLOAD_DIR="./uploads"
OUTPUT_DIR="./uploads/outputs"
MAX_FILE_SIZE="524288000"

# ========================================
# Rate Limiting
# ========================================
RATE_LIMIT_WINDOW_MS="900000"
RATE_LIMIT_MAX_REQUESTS="100"
```

**New Variables for Pose Generator:**
```bash
# Pose Generator Specific (Optional - has defaults)
WORKER_CONCURRENCY="5"                    # BullMQ worker concurrency
WORKER_NAME="pose-generator-worker-prod"  # Worker identifier
```

**Verification in Coolify:**
- Navigate to: Application → Environment Variables
- Ensure ALL variables above are set
- Pay special attention to: `HUGGINGFACE_API_KEY`, `REDIS_HOST`, `DATABASE_URL`

---

## DOCKER BUILD VERIFICATION

### Current Dockerfile Status: ✅ READY

**File:** `C:\Users\yoppi\Downloads\Lumiku App\backend\Dockerfile`

**Multi-stage Build Configuration:**
```dockerfile
# Stage 1: Base (dependencies + Prisma)
FROM oven/bun:1 AS base
- ✓ Copies package.json + bun.lockb
- ✓ Installs dependencies with --frozen-lockfile
- ✓ Generates Prisma client

# Stage 2: Production Runtime
FROM oven/bun:1-alpine AS production
- ✓ Production dependencies only
- ✓ Copies Prisma schema + generates client
- ✓ Copies source code (src/)
- ✓ Creates non-root user for security
- ✓ Health check on /health endpoint
- ✓ CMD: bun src/index.ts
```

**Build Optimization:**
- Layer caching: ✓ Enabled (package.json cached separately)
- .dockerignore: ✓ Present (excludes node_modules, logs, docs)
- Health check: ✓ Configured (30s interval, /health endpoint)
- Security: ✓ Non-root user (nodejs:nodejs)

**Expected Build Time:** 3-5 minutes (production mode)

---

## PM2 WORKER CONFIGURATION

### Ecosystem Config: ✅ READY

**File:** `C:\Users\yoppi\Downloads\Lumiku App\backend\ecosystem.config.js`

**Configured Processes:**

1. **lumiku-api** (Main Server)
   - Script: `./src/index.ts`
   - Interpreter: `bun`
   - Port: 3000
   - Memory: 1GB max
   - Logs: `./logs/api-*.log`

2. **pose-generator-worker** (Background Worker)
   - Script: `./src/apps/pose-generator/worker.ts`
   - Interpreter: `bun`
   - Concurrency: 5 jobs
   - Memory: 2GB max (for image processing)
   - Logs: `./logs/worker-*.log`
   - Kill timeout: 30s (allows job completion)

**Production Start Command:**
```bash
pm2 start ecosystem.config.js --env production
pm2 save
```

---

## DEPLOYMENT CHECKLIST

### Phase 1: Pre-Deployment (LOCAL)

**Step 1: Add Pose Generator AI Models**
```bash
# 1. Edit ai-models.seed.ts
code backend/prisma/seeds/ai-models.seed.ts

# 2. Add 3 models (flux-controlnet-standard, flux-controlnet-pro, background-changer-sam)
# See "BLOCKER #1" section above for exact code

# 3. Test seed locally
cd backend
bun prisma/seed.ts

# Expected output:
# ✅ Seeded 24 AI models (21 + 3 new)
# ✅ Seeded 33 categories
# ✅ Seeded 150+ poses
```

**Step 2: Commit All Changes**
```bash
cd "C:\Users\yoppi\Downloads\Lumiku App"

# Stage modified files
git add backend/src/index.ts
git add backend/src/app.ts
git add backend/prisma/seeds/ai-models.seed.ts

# Stage new Pose Generator files
git add backend/src/apps/pose-generator/schemas/
git add backend/prisma/seeds/data/
git add backend/prisma/seeds/pose-generator.seed.ts

# Verify staged files
git status

# Commit
git commit -m "feat(pose-generator): Add Pose Generator with AI models and database seeds

- Add 3 AI models for Pose Generator (FLUX + ControlNet)
- Add pose categories and library seed data (150+ poses)
- Fix database connection to be optional in development
- Add cache control middleware for API routes

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Step 3: Push to Repository**
```bash
# Push to development branch
git push origin development

# Coolify will detect the push and auto-deploy
```

---

### Phase 2: Coolify Deployment (AUTO)

**Coolify will automatically:**
1. Detect git push webhook
2. Pull latest code from `development` branch
3. Build Docker image using `backend/Dockerfile`
4. Run Prisma migrations: `prisma migrate deploy`
5. Start container with production environment
6. Health check on `http://localhost:3000/health`

**Monitoring Build Logs:**
- Navigate to: Coolify Dashboard → lumiku-app → Deployments
- Click on latest deployment
- Watch real-time build logs
- Expected duration: 3-5 minutes

**Build Stages to Monitor:**
```
[1/4] Building base stage...
  ✓ Installing dependencies
  ✓ Generating Prisma client

[2/4] Building production stage...
  ✓ Copying source code
  ✓ Creating non-root user

[3/4] Running migrations...
  ✓ prisma migrate deploy

[4/4] Starting server...
  ✓ Health check passed (http://localhost:3000/health)
```

---

### Phase 3: Post-Deployment (PRODUCTION)

**Step 1: Connect to Production Server**
```bash
# SSH into dev.lumiku.com
ssh user@dev.lumiku.com

# Navigate to application directory
cd /path/to/lumiku-app/backend
```

**Step 2: Run Database Seeds**
```bash
# CRITICAL: Seed AI models first (enables Pose Generator in dashboard)
bun prisma/seed.ts

# Expected output:
# ✅ Seeded 24 AI models
# ✅ Seeded 33 pose categories
# ✅ Seeded 150+ poses
# ✅ Created test user

# Verify Pose Generator models exist
psql $DATABASE_URL -c "SELECT * FROM \"AIModel\" WHERE \"appId\" = 'pose-generator';"

# Expected: 3 rows (flux-controlnet-standard, flux-controlnet-pro, background-changer-sam)
```

**Step 3: Start PM2 Workers**
```bash
# Start all services (API + Worker)
pm2 start ecosystem.config.js --env production

# Verify processes are running
pm2 list

# Expected output:
# ┌────┬─────────────────────────┬─────────┬─────────┬─────────┬──────────┐
# │ id │ name                    │ mode    │ status  │ cpu     │ memory   │
# ├────┼─────────────────────────┼─────────┼─────────┼─────────┼──────────┤
# │ 0  │ lumiku-api              │ fork    │ online  │ 0%      │ 125 MB   │
# │ 1  │ pose-generator-worker   │ fork    │ online  │ 0%      │ 85 MB    │
# └────┴─────────────────────────┴─────────┴─────────┴─────────┴──────────┘

# Save PM2 configuration
pm2 save

# Setup PM2 to auto-start on server reboot
pm2 startup
# Follow the command it outputs (copy-paste to terminal)
```

**Step 4: Verify Services**
```bash
# Check API health
curl http://localhost:3000/health
# Expected: {"status":"ok","timestamp":"2025-10-16T..."}

# Check Pose Generator plugin loaded
curl http://localhost:3000/api/apps | grep pose-generator
# Expected: JSON with pose-generator app data

# Check Redis connection
redis-cli ping
# Expected: PONG

# Check worker logs
pm2 logs pose-generator-worker --lines 20
# Expected: "[Queue] Connected to Redis", "Worker ready"
```

**Step 5: Test Pose Generator**
```bash
# Access dashboard
open https://dev.lumiku.com

# Login with test credentials:
# Email: test@lumiku.com
# Password: password123

# Verify Pose Generator card appears on dashboard
# Expected: "Pose Generator" card with indigo color theme

# Click "Pose Generator" → Should navigate to /apps/pose-generator
# Expected: Dashboard page with "Create New Project" button
```

---

## VERIFICATION CHECKLIST

### Backend Verification
- [ ] Server starts without errors: `bun src/index.ts`
- [ ] Health endpoint responds: `curl http://localhost:3000/health`
- [ ] Pose Generator plugin registered: Check logs for "Loaded 5 plugins"
- [ ] Database connected: Check logs for "Database connected successfully"
- [ ] Redis connected: Check logs for "Redis connected successfully"
- [ ] WebSocket server initialized: Check logs for "WebSocket server initialized"
- [ ] Worker starts: `bun src/apps/pose-generator/worker.ts`

### Database Verification
- [ ] AI models seeded: `SELECT COUNT(*) FROM "AIModel" WHERE "appId" = 'pose-generator';` → 3
- [ ] Pose categories seeded: `SELECT COUNT(*) FROM "PoseCategory";` → 33
- [ ] Pose library seeded: `SELECT COUNT(*) FROM "PoseLibrary";` → 150+
- [ ] Test user created: `SELECT * FROM "User" WHERE email = 'test@lumiku.com';` → 1 row

### Frontend Verification
- [ ] Dashboard loads: https://dev.lumiku.com
- [ ] Login works with test credentials
- [ ] Pose Generator card visible on dashboard
- [ ] Pose Generator route accessible: /apps/pose-generator
- [ ] Dashboard page renders without errors
- [ ] Create project button works
- [ ] WebSocket connects (check browser DevTools Network tab)

### API Verification
- [ ] `/api/apps` returns Pose Generator app
- [ ] `/api/apps/pose-generator/categories` returns categories
- [ ] `/api/apps/pose-generator/poses` returns pose library
- [ ] `/api/apps/pose-generator/projects` (auth required) works
- [ ] WebSocket endpoint accessible: `ws://dev.lumiku.com/pose-generator`

---

## POTENTIAL DEPLOYMENT ISSUES & FIXES

### Issue #1: Pose Generator Not Visible on Dashboard

**Symptoms:** App doesn't appear in dashboard after deployment

**Root Causes:**
1. **No AI models in database** (MOST COMMON)
   - Fix: Run `bun prisma/seed.ts` in production
   - Verify: `psql $DATABASE_URL -c "SELECT * FROM \"AIModel\" WHERE \"appId\" = 'pose-generator';"`

2. **Plugin not enabled**
   - Check: `backend/src/apps/pose-generator/plugin.config.ts`
   - Ensure: `features.enabled: true`

3. **Dashboard caching issue**
   - Fix: Hard refresh browser (Ctrl+Shift+R)
   - Or: Clear browser cache

**Debug Steps:**
```bash
# 1. Check API response
curl https://dev.lumiku.com/api/apps -H "Authorization: Bearer YOUR_TOKEN"

# 2. If Pose Generator is in API but not dashboard:
# → Frontend caching issue (hard refresh)

# 3. If Pose Generator NOT in API:
# → Check AI models exist in database
psql $DATABASE_URL -c "SELECT * FROM \"AIModel\" WHERE \"appId\" = 'pose-generator';"

# If 0 rows → Run seed:
bun prisma/seed.ts
```

---

### Issue #2: Docker Build Fails

**Symptoms:** Coolify build fails with errors

**Common Causes:**

1. **Prisma generation fails**
   ```
   Error: @prisma/client did not initialize yet
   ```
   **Fix:** Ensure `bunx prisma generate` runs in Dockerfile
   **Verify:** Check Dockerfile line 34 and line 80

2. **Missing dependencies**
   ```
   Error: Cannot find module 'bullmq'
   ```
   **Fix:** Run `bun install` locally, commit `bun.lockb`
   **Verify:** `git status bun.lockb` should show no changes

3. **TypeScript errors**
   ```
   Error: Type 'NodeJS.Timeout' is not assignable
   ```
   **Fix:** Already fixed in `backend/src/index.ts` (no NodeJS.Timeout usage)
   **Verify:** `bun build src/index.ts` should succeed locally

---

### Issue #3: Worker Not Processing Jobs

**Symptoms:** Pose generation stuck at "pending" status

**Root Causes:**

1. **Worker not running**
   ```bash
   # Check PM2 status
   pm2 list

   # If pose-generator-worker is "stopped":
   pm2 start ecosystem.config.js --env production
   pm2 save
   ```

2. **Redis connection failed**
   ```bash
   # Check worker logs
   pm2 logs pose-generator-worker

   # If "Redis connection error":
   # → Check REDIS_HOST and REDIS_PORT in Coolify environment
   ```

3. **Queue stuck**
   ```bash
   # Check queue length
   redis-cli LLEN bull:pose-generation:wait

   # If > 0 but worker idle:
   # → Restart worker
   pm2 restart pose-generator-worker
   ```

---

### Issue #4: WebSocket Not Connecting

**Symptoms:** Real-time updates not working, "Connecting..." forever

**Root Causes:**

1. **WebSocket endpoint not exposed**
   - Check: Coolify should expose port 3000 for both HTTP and WebSocket
   - Fix: Ensure Coolify network settings allow WebSocket upgrade

2. **Redis pub/sub not working**
   ```bash
   # Test Redis pub/sub
   redis-cli SUBSCRIBE test
   # In another terminal:
   redis-cli PUBLISH test "hello"

   # Should see message in first terminal
   ```

3. **CORS issue**
   ```bash
   # Check browser console for CORS errors
   # If CORS error:
   # → Verify CORS_ORIGIN in Coolify environment matches frontend domain
   ```

**Debug WebSocket:**
```javascript
// Browser DevTools Console
const ws = new WebSocket('ws://dev.lumiku.com/pose-generator');
ws.onopen = () => console.log('Connected');
ws.onerror = (e) => console.error('Error:', e);
ws.onmessage = (m) => console.log('Message:', m.data);

// Expected: "Connected" after 1-2 seconds
```

---

## ROLLBACK PLAN

If deployment fails and Pose Generator breaks production:

**Step 1: Quick Rollback (Coolify UI)**
```
1. Navigate to: Coolify Dashboard → lumiku-app → Deployments
2. Find previous working deployment
3. Click "Redeploy" on that deployment
4. Wait 3-5 minutes for rollback to complete
```

**Step 2: Manual Rollback (SSH)**
```bash
# SSH into server
ssh user@dev.lumiku.com

# Stop PM2 workers
pm2 stop all

# Revert git to previous commit
git log --oneline  # Find previous commit hash
git checkout <previous-commit-hash>

# Rebuild if needed
bun install
bun prisma generate

# Restart services
pm2 restart all
```

**Step 3: Disable Pose Generator**
```typescript
// Edit: backend/src/apps/pose-generator/plugin.config.ts
features: {
  enabled: false,  // Change to false
  beta: false,
  comingSoon: true,  // Change to true
}

// Commit and push
git add backend/src/apps/pose-generator/plugin.config.ts
git commit -m "fix: Temporarily disable Pose Generator"
git push origin development
```

---

## DEPLOYMENT COMMANDS (QUICK REFERENCE)

### Local Development
```bash
# Start server
cd backend
bun --watch src/index.ts

# Start worker
bun --watch src/apps/pose-generator/worker.ts

# Run all seeds
bun prisma/seed.ts

# Run Pose Generator seed only
bun prisma/seeds/pose-generator.seed.ts

# PM2 (development)
npm run pm2:start
npm run pm2:logs
npm run pm2:status
```

### Production (SSH into dev.lumiku.com)
```bash
# Run seeds
cd /path/to/lumiku-app/backend
bun prisma/seed.ts

# Start services
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# Monitor
pm2 list
pm2 logs
pm2 monit

# Restart services
pm2 restart all

# Stop services
pm2 stop all

# View logs
pm2 logs lumiku-api --lines 100
pm2 logs pose-generator-worker --lines 100
```

---

## SUCCESS CRITERIA

Deployment is considered successful when:

✅ **Backend:**
- Server starts without errors
- Health endpoint responds (200 OK)
- Pose Generator plugin loaded (5 plugins total)
- WebSocket server initialized
- Worker running (PM2 shows "online")

✅ **Database:**
- 3 Pose Generator AI models exist
- 33 pose categories exist
- 150+ poses exist
- Migrations applied successfully

✅ **Frontend:**
- Dashboard loads at https://dev.lumiku.com
- Login works with test credentials
- Pose Generator card VISIBLE on dashboard
- Pose Generator app accessible at /apps/pose-generator
- WebSocket connection established

✅ **API:**
- `/api/apps` includes Pose Generator
- `/api/apps/pose-generator/categories` returns data
- `/api/apps/pose-generator/poses` returns data
- WebSocket endpoint accessible

✅ **End-to-End:**
- User can create project
- User can select pose from gallery
- User can submit generation request
- Job enqueued successfully (Redis)
- Real-time progress updates via WebSocket
- Generation completes (or shows error)

---

## NEXT STEPS AFTER DEPLOYMENT

1. **Monitor First 24 Hours:**
   - Watch error logs: `pm2 logs --err`
   - Check queue metrics: Redis queue length
   - Monitor memory usage: `pm2 monit`

2. **Real User Testing:**
   - Invite beta testers
   - Test full generation workflow
   - Gather feedback on UI/UX

3. **Performance Optimization:**
   - Monitor generation times
   - Optimize FLUX inference parameters
   - Consider scaling workers (add more PM2 instances)

4. **Feature Enhancements:**
   - Add more pose categories
   - Improve ControlNet accuracy
   - Add batch export features
   - Implement pose sharing/community

---

## SUPPORT & TROUBLESHOOTING

**Server Logs:**
```bash
# API server logs
pm2 logs lumiku-api

# Worker logs
pm2 logs pose-generator-worker

# System logs
journalctl -u lumiku-app -f
```

**Database Queries:**
```sql
-- Check Pose Generator apps
SELECT * FROM "AIModel" WHERE "appId" = 'pose-generator';

-- Check pose categories
SELECT COUNT(*), "parentId" FROM "PoseCategory" GROUP BY "parentId";

-- Check pose library
SELECT COUNT(*), "difficulty" FROM "PoseLibrary" GROUP BY "difficulty";

-- Check user credits
SELECT "balance" FROM "Credit" WHERE "userId" = 'test-user-id';
```

**Health Checks:**
```bash
# API health
curl https://dev.lumiku.com/health

# Database connection
psql $DATABASE_URL -c "SELECT version();"

# Redis connection
redis-cli ping

# Worker health
pm2 jlist | jq '.[] | select(.name == "pose-generator-worker") | .pm2_env.status'
```

---

## CONCLUSION

### Deployment Readiness: ⚠️ READY WITH BLOCKERS

**Critical Actions Required:**
1. ✅ Backend 100% complete
2. ✅ Frontend 100% complete
3. ✅ Database seeds ready
4. ❌ **Add 3 AI models to ai-models.seed.ts** (BLOCKER)
5. ✅ Docker configuration ready
6. ✅ PM2 configuration ready

**Estimated Deployment Time:**
- Code changes: 10 minutes (add AI models)
- Commit + push: 2 minutes
- Coolify build: 3-5 minutes
- Post-deployment setup: 5 minutes
- **Total: 20-25 minutes**

**Risk Assessment:**
- **Low Risk:** Backend and frontend are production-ready
- **Medium Risk:** First production deployment of new app
- **Mitigation:** Rollback plan ready, feature flag available

**Recommended Timeline:**
1. **Now:** Add AI models to seed file
2. **Today:** Commit and push to trigger deployment
3. **After deploy:** Run seeds, start workers, verify
4. **24h monitoring:** Watch logs and user feedback

---

**Generated by:** Claude Code (Lumiku Deployment Specialist)
**Date:** 2025-10-16
**Version:** 1.0
**Status:** READY FOR DEPLOYMENT (after adding AI models)
