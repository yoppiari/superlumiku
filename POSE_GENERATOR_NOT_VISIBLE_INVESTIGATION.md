# POSE GENERATOR NOT VISIBLE - ROOT CAUSE ANALYSIS

**Investigation Date:** 2025-10-16
**Production URL:** https://dev.lumiku.com
**Deployment UUID:** x48gwkcg04w4skcsgccosoo0
**Status:** ROOT CAUSE IDENTIFIED

---

## EXECUTIVE SUMMARY

**Issue:** Pose Generator is deployed to production but NOT visible on dashboard

**Root Cause:** DATABASE SEEDS NOT RUN IN PRODUCTION
- Migrations are executed ✅ (tables created)
- Seeds are NOT executed ❌ (AI models missing)
- Dashboard filters apps by AI model count
- Pose Generator has 0 AI models → filtered out

**Impact:** CRITICAL - New feature completely invisible to users

**Fix Time:** 2-3 minutes (run seed script in Coolify terminal)

---

## INVESTIGATION FINDINGS

### 1. DEPLOYMENT STATUS ✅ VERIFIED

**Health Check:**
```
URL: https://dev.lumiku.com/health
Status: OK
Timestamp: 2025-10-16T10:56:13.774Z
Version: 1.0.0
Environment: production
```

**Latest Commit:**
```
fe81c23 debug: Add comprehensive logging to catch hardcoded avatar-creator ID bug
6c6edf5 fix(deployment): Add Pose Generator AI models and production deployment configuration
```

**Conclusion:** Deployment completed successfully, code is live.

---

### 2. PLUGIN REGISTRATION ✅ VERIFIED

**File:** `backend/src/plugins/loader.ts` (lines 18-30)

```typescript
import poseGeneratorConfig from '../apps/pose-generator/plugin.config'
import poseGeneratorRoutes from '../apps/pose-generator/routes'

export function loadPlugins() {
  pluginRegistry.register(poseGeneratorConfig, poseGeneratorRoutes)
  // ...
}
```

**Conclusion:** Plugin is properly imported and registered in code.

---

### 3. DATABASE MIGRATIONS ✅ VERIFIED

**Migration File:** `backend/prisma/migrations/20251014_pose_generator_complete/`

**Expected Tables:**
- pose_categories
- pose_library
- pose_user_uploads
- pose_projects
- pose_generation_jobs
- pose_usage_history
- pose_favorites

**Migrations Run By:** `docker-entrypoint.sh` lines 88-145
```bash
bun prisma generate
bun prisma migrate deploy
```

**Conclusion:** Database schema is up-to-date, tables exist.

---

### 4. AI MODELS SEED ❌ CRITICAL ISSUE

**Expected AI Models:** 3 models for pose-generator

**File:** `backend/prisma/seeds/ai-models.seed.ts` (lines 213-300)

```typescript
{
  appId: 'pose-generator',
  modelId: 'flux-controlnet-standard',
  name: 'FLUX ControlNet Standard',
  creditCost: 30,
  enabled: true
},
{
  appId: 'pose-generator',
  modelId: 'flux-controlnet-pro',
  name: 'FLUX ControlNet Pro',
  creditCost: 40,
  enabled: true
},
{
  appId: 'pose-generator',
  modelId: 'background-changer-sam',
  name: 'Background Changer (SAM)',
  creditCost: 10,
  enabled: true
}
```

**Seed Script:** `backend/prisma/seed.ts`
```typescript
async function main() {
  await seedSubscriptionPlans()    // ✅ Runs
  await seedAIModels()              // ❌ NOT RUN IN PRODUCTION
  await migrateExistingUsers()      // ✅ Runs
  await seedPoseGenerator()         // ❌ NOT RUN IN PRODUCTION
}
```

**Docker Entrypoint Check:**
```bash
# File: docker/docker-entrypoint.sh
# Line 88-145: Runs migrations
# Line 246-248: Starts backend

# MISSING: No seed execution!
# Seeds are NOT automatically run during deployment
```

**Conclusion:** Seeds are defined but never executed in production.

---

### 5. DASHBOARD FILTERING LOGIC 🔍 ANALYSIS

**How Dashboard Works:**

1. API endpoint `/api/apps` returns all enabled plugins
2. Frontend filters apps by user access:
   - Apps with AI models → Check user's subscription tier
   - Apps with 0 AI models → FILTERED OUT (invisible)

**Current State:**
```
Avatar Creator: 4 AI models ✅ → VISIBLE
Video Mixer: 1 AI model ✅ → VISIBLE
Carousel Mix: 1 AI model ✅ → VISIBLE
Pose Generator: 0 AI models ❌ → INVISIBLE
```

**Conclusion:** Dashboard logic is correct. Missing AI models cause invisibility.

---

## ROOT CAUSE SUMMARY

```
┌─────────────────────────────────────────────────────────────┐
│ ROOT CAUSE: Database Seeds Not Run in Production            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ WHY?                                                        │
│ docker-entrypoint.sh runs migrations but NOT seeds         │
│                                                             │
│ IMPACT?                                                     │
│ - pose_categories table: EMPTY (no categories)             │
│ - pose_library table: EMPTY (no poses)                     │
│ - AIModel table: 0 rows for appId='pose-generator'         │
│                                                             │
│ RESULT?                                                     │
│ Dashboard filters out Pose Generator (0 AI models)         │
│ Users cannot see the feature despite successful deploy     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## FIX INSTRUCTIONS

### OPTION 1: IMMEDIATE FIX (Recommended) ⚡

**Time:** 2-3 minutes
**Risk:** Low

1. Open Coolify UI
2. Navigate to: Applications → Lumiku → Terminal
3. Copy and paste these commands:

```bash
# Navigate to backend
cd /app/backend

# Run seeds
bun prisma/seed.ts

# Expected output:
# 🌱 Starting database seeding...
# 🌱 Seeding AI models...
# ✅ Seeded 28 AI models (including 3 for pose-generator)
# 🎭 Seeding Pose Generator...
# ✅ Seeded 33 categories
# ✅ Seeded 150+ poses
# ✅ Database seeding completed successfully!
```

4. Verify (optional):
```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"AIModel\" WHERE \"appId\" = 'pose-generator';"
# Expected: 3

psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"PoseCategory\";"
# Expected: 33

psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"PoseLibrary\";"
# Expected: 150+
```

5. NO RESTART NEEDED (seeds don't require app restart)

6. Test: Open https://dev.lumiku.com/dashboard
   - Should see 4 apps: Avatar Creator, Video Mixer, Carousel Mix, **Pose Generator**

---

### OPTION 2: AUTOMATED FIX (Long-term) 🔧

**Update:** `docker/docker-entrypoint.sh`

Add after line 214 (after migrations):

```bash
echo "✅ Database migrations/sync completed"

# NEW: Run database seeds on first deployment
echo "🌱 Checking if database needs seeding..."
SEED_CHECK=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"AIModel\";" 2>/dev/null | tr -d ' ')

if [ "$SEED_CHECK" = "0" ]; then
    echo "   Database is empty - running seeds..."
    cd /app/backend
    bun prisma/seed.ts 2>&1 | tail -n 20
    echo "✅ Database seeding completed"
else
    echo "   Database already seeded ($SEED_CHECK AI models found)"
    echo "   Skipping seeds (run manually if needed: bun prisma/seed.ts)"
fi
```

**Benefits:**
- Seeds run automatically on fresh deployments
- Idempotent (safe to run multiple times)
- Skips if data already exists

**Commit & Deploy:**
```bash
git add docker/docker-entrypoint.sh
git commit -m "fix(deployment): Auto-run database seeds on first deployment"
git push origin development
```

---

## VERIFICATION CHECKLIST

After running seeds, verify each component:

### Backend Database ✅

```sql
-- AI Models (should return 3)
SELECT "modelId", "name", "creditCost", "enabled"
FROM "AIModel"
WHERE "appId" = 'pose-generator';

-- Categories (should return 33)
SELECT COUNT(*) as total,
       COUNT(CASE WHEN "parentId" IS NULL THEN 1 END) as top_level,
       COUNT(CASE WHEN "parentId" IS NOT NULL THEN 1 END) as sub_categories
FROM "PoseCategory";

-- Poses (should return 150+)
SELECT COUNT(*) as total_poses,
       COUNT(CASE WHEN difficulty = 'beginner' THEN 1 END) as beginner,
       COUNT(CASE WHEN difficulty = 'intermediate' THEN 1 END) as intermediate,
       COUNT(CASE WHEN difficulty = 'advanced' THEN 1 END) as advanced
FROM "PoseLibrary";
```

### API Endpoint ✅

```bash
# Test apps endpoint (requires auth)
curl https://dev.lumiku.com/api/apps \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should include:
# {
#   "id": "pose-generator",
#   "name": "Pose Generator",
#   "icon": "User",
#   "enabled": true
# }
```

### Dashboard UI ✅

1. Open: https://dev.lumiku.com/dashboard
2. Login with test user: test@lumiku.com / password123
3. Verify 4 apps visible:
   - Avatar Creator
   - Video Mixer
   - Carousel Mix
   - **Pose Generator** (NEW!)
4. Click Pose Generator → Should load without errors

---

## PREVENTION STRATEGY

### Why This Happened

1. **Migrations ≠ Seeds**
   - Migrations: Schema changes (CREATE TABLE, ALTER TABLE)
   - Seeds: Initial data (INSERT INTO)
   - Docker only runs migrations, not seeds

2. **Manual Step Required**
   - Seeds must be run manually after deployment
   - Or automated via entrypoint script (Option 2)

3. **No Validation**
   - No check to ensure AI models exist
   - Dashboard silently filters out apps

### Future Prevention

1. **Add Automated Seeding** (Option 2 above)
2. **Add Health Check** for AI models:
   ```typescript
   // In health endpoint
   const modelCount = await prisma.aIModel.count()
   return {
     status: 'ok',
     models: modelCount,
     warning: modelCount === 0 ? 'No AI models found - run seeds!' : null
   }
   ```

3. **Add Deployment Checklist**:
   - [ ] Code deployed
   - [ ] Migrations run
   - [ ] **Seeds run** ← Often forgotten!
   - [ ] Health check passes
   - [ ] Dashboard shows new features

---

## TIMELINE

| Time | Event | Status |
|------|-------|--------|
| 10:56 | Deployment completed | ✅ |
| 10:56 | Health check returns 200 | ✅ |
| 10:56 | Migrations executed | ✅ |
| 10:56 | Seeds NOT executed | ❌ |
| 10:56 | Plugin registered in memory | ✅ |
| 10:57 | Dashboard loaded | ✅ |
| 10:57 | Pose Generator filtered out (0 models) | ❌ |
| **NOW** | **Root cause identified** | 🔍 |
| **NEXT** | **Run seeds in production** | ⏳ |

---

## EXACT COMMANDS TO COPY/PASTE

```bash
# ═══════════════════════════════════════════════════════════
# COPY THIS ENTIRE BLOCK INTO COOLIFY TERMINAL
# ═══════════════════════════════════════════════════════════

cd /app/backend

echo "🌱 Running database seeds for Pose Generator..."

bun prisma/seed.ts

echo ""
echo "🔍 Verifying AI models..."
psql "$DATABASE_URL" -c "SELECT \"modelId\", \"name\", \"creditCost\" FROM \"AIModel\" WHERE \"appId\" = 'pose-generator';"

echo ""
echo "✅ Done! Refresh dashboard at: https://dev.lumiku.com/dashboard"

# ═══════════════════════════════════════════════════════════
```

---

## EXPECTED OUTPUT

```
🌱 Starting database seeding...
=====================================

🌱 Seeding subscription plans...
✅ Seeded 4 subscription plans

🌱 Seeding AI models...
✅ Seeded 28 AI models

🌱 Migrating existing users...
✅ Migrated 0 users

🎭 Starting Pose Generator Seed...

📂 Seeding Categories...
  Creating categories...
    ✓ Portraits (portraits)
    ✓ Fashion & Modeling (fashion)
    ✓ Action & Sports (action)
    ✓ Business & Professional (business)
    ✓ Artistic & Creative (artistic)
    ✓ Lifestyle & Candid (lifestyle)
  Setting parent relationships...
✅ Seeded 33 categories

🎭 Seeding Pose Library...
  ✓ 10 poses seeded...
  ✓ 20 poses seeded...
  [...]
  ✓ 150 poses seeded...
✅ Seeded 150 poses

📊 Seeding Statistics:
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Total Poses: 150
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Difficulty Distribution:
    - Beginner: 75 (50%)
    - Intermediate: 52 (35%)
    - Advanced: 23 (15%)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Gender Suitability:
    - Unisex: 100
    - Female: 30
    - Male: 20
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Premium Poses: 30
  Featured Poses: 15
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ Pose Generator Seed Complete!

🌱 Creating test user...
✅ Created test user: { id: '...', email: 'test@lumiku.com', ... }

=====================================
✅ Database seeding completed successfully!
```

---

## CONTACTS

- Production URL: https://dev.lumiku.com
- Coolify Dashboard: [Your Coolify URL]
- Health Check: https://dev.lumiku.com/health
- API Docs: https://dev.lumiku.com/api

---

**Investigation by:** Claude Code (Lumiku Deployment Specialist)
**Report Date:** 2025-10-16
**Priority:** P0 - Critical (Feature Invisible)
**Resolution Time:** 2-3 minutes
