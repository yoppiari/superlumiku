# POSE GENERATOR NOT VISIBLE - QUICK FIX GUIDE

## TL;DR

**Problem:** Pose Generator deployed but invisible on dashboard
**Cause:** Database not seeded (0 AI models)
**Fix:** Run one command in Coolify terminal (2 min)
**Status:** Code is live ✅ | Data is missing ❌

---

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT FLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Code Push to GitHub              ✅ DONE               │
│     ↓                                                       │
│  2. Coolify Build Triggered          ✅ DONE               │
│     ↓                                                       │
│  3. Docker Build (Frontend + Backend) ✅ DONE              │
│     ↓                                                       │
│  4. Run Migrations (CREATE TABLES)   ✅ DONE               │
│     ↓                                                       │
│  5. Run Seeds (INSERT DATA)          ❌ MISSING ← BLOCKER  │
│     ↓                                                       │
│  6. App Starts                       ✅ DONE               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Current State

### Database Schema ✅

```sql
-- Tables exist (migrations ran)
PoseCategory      -- 0 rows ❌
PoseLibrary       -- 0 rows ❌
AIModel (pose-*)  -- 0 rows ❌ ← This is why it's invisible
```

### Dashboard Logic 🔍

```typescript
// Frontend filters apps
apps.filter(app => {
  const models = getAIModelsForApp(app.id)
  return models.length > 0  // ← Pose Generator has 0 = filtered out
})
```

### Result

```
Avatar Creator:  4 models ✅ → VISIBLE
Video Mixer:     1 model  ✅ → VISIBLE
Carousel Mix:    1 model  ✅ → VISIBLE
Pose Generator:  0 models ❌ → INVISIBLE
```

---

## THE FIX (One Command)

### Open Coolify Terminal

1. Coolify Dashboard → Applications → Lumiku
2. Click "Terminal" tab
3. Paste this:

```bash
cd /app/backend && bun prisma/seed.ts
```

### What This Does

```
🌱 Seeds subscription plans (4 plans)
🌱 Seeds AI models (28 models total):
   - 4 for avatar-creator
   - 1 for video-mixer
   - 1 for carousel-mix
   - 1 for looping-flow
   - 3 for pose-generator ← THIS FIXES IT!
   - 18 for other apps

🎭 Seeds Pose Generator:
   - 33 categories (6 top-level, 27 sub-categories)
   - 150+ poses (beginner, intermediate, advanced)
   - Placeholder images
   - ControlNet metadata
```

### Expected Output (2-3 min)

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
    [... 27 more sub-categories ...]
  Setting parent relationships...
✅ Seeded 33 categories

🎭 Seeding Pose Library...
  ✓ 10 poses seeded...
  ✓ 20 poses seeded...
  ✓ 30 poses seeded...
  [...]
  ✓ 150 poses seeded...
✅ Seeded 150 poses

📊 Seeding Statistics:
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Total Poses: 150
  Difficulty Distribution:
    - Beginner: 75 (50%)
    - Intermediate: 52 (35%)
    - Advanced: 23 (15%)
  Gender Suitability:
    - Unisex: 100
    - Female: 30
    - Male: 20
  Premium Poses: 30
  Featured Poses: 15
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ Pose Generator Seed Complete!

=====================================
✅ Database seeding completed successfully!
```

---

## Verification

### Check AI Models

```bash
psql "$DATABASE_URL" -c "SELECT \"modelId\", \"name\", \"creditCost\" FROM \"AIModel\" WHERE \"appId\" = 'pose-generator';"
```

**Expected:**

| modelId | name | creditCost |
|---------|------|------------|
| flux-controlnet-standard | FLUX ControlNet Standard | 30 |
| flux-controlnet-pro | FLUX ControlNet Pro | 40 |
| background-changer-sam | Background Changer (SAM) | 10 |

### Check Categories

```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"PoseCategory\";"
```

**Expected:** 33

### Check Poses

```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"PoseLibrary\";"
```

**Expected:** 150+

---

## Test Dashboard

1. **Open:** https://dev.lumiku.com/dashboard
2. **Login:** test@lumiku.com / password123
3. **Expect:** 4 apps visible:
   - Avatar Creator ✅
   - Video Mixer ✅
   - Carousel Mix ✅
   - **Pose Generator** ✅ ← NEW!

4. **Click Pose Generator** → Should load category selector
5. **Select a category** → Should show poses
6. **Click a pose** → Should load generation interface

---

## Why This Happened

### Docker Entrypoint Analysis

**File:** `docker/docker-entrypoint.sh`

```bash
# Line 88-145: Database migrations
echo "🗄️  Running database migrations..."
bun prisma generate
bun prisma migrate deploy  # ✅ Runs (creates tables)

# Line 214: Migration complete
echo "✅ Database migrations/sync completed"

# Line 246-248: Start backend
echo "🚀 Starting Backend Server..."
exec bun src/index.ts

# ❌ MISSING: No seed execution!
# Seeds are defined in backend/prisma/seed.ts
# But never called during deployment
```

### Why Migrations ≠ Seeds

| Migrations | Seeds |
|-----------|-------|
| Schema changes | Initial data |
| CREATE TABLE | INSERT INTO |
| ALTER TABLE | Starter content |
| DROP COLUMN | Test users |
| Automatic ✅ | Manual ❌ |

**In Lumiku:**
- Migrations: Run automatically via `docker-entrypoint.sh`
- Seeds: Must run manually (or add to entrypoint)

---

## Long-term Fix (Optional)

### Update Entrypoint to Auto-Seed

**File:** `docker/docker-entrypoint.sh`

Add after line 214:

```bash
echo "✅ Database migrations/sync completed"

# NEW: Auto-seed on first deployment
echo "🌱 Checking if database needs seeding..."
SEED_CHECK=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"AIModel\";" 2>/dev/null | tr -d ' ')

if [ "$SEED_CHECK" = "0" ]; then
    echo "   Database is empty - running seeds..."
    cd /app/backend
    bun prisma/seed.ts 2>&1 | tail -n 20
    echo "✅ Database seeding completed"
else
    echo "   Database already seeded ($SEED_CHECK AI models found)"
    echo "   Skipping seeds (run manually: bun prisma/seed.ts)"
fi
```

**Benefits:**
- Seeds run automatically on fresh databases
- Idempotent (safe to run multiple times)
- Skips if data exists (doesn't duplicate)

**Commit:**
```bash
git add docker/docker-entrypoint.sh
git commit -m "fix(deployment): Auto-seed database on first deployment"
git push
```

---

## FAQ

### Q: Do I need to restart the backend after seeding?

**A:** NO! Seeds just insert data, not code. Changes are immediate.

### Q: Is it safe to run seeds multiple times?

**A:** YES! Seeds use `upsert` (update-or-insert), so:
- Existing records are updated
- Missing records are created
- No duplicates

### Q: Will this affect existing users?

**A:** NO! Seeds only add:
- Subscription plans (won't change existing subscriptions)
- AI models (won't affect existing projects)
- Pose library (won't touch user data)

### Q: What if the command fails?

**A:** Try these alternatives:

```bash
# If "bun: command not found"
node /app/backend/prisma/seed.ts

# If "prisma not found"
cd /app/backend && npx prisma db seed

# If permission denied
chmod +x /app/backend/prisma/seed.ts
bun /app/backend/prisma/seed.ts
```

### Q: Can I verify before running?

**A:** Yes! Check current state:

```bash
# Check AI model count
psql "$DATABASE_URL" -c "SELECT \"appId\", COUNT(*) as models FROM \"AIModel\" GROUP BY \"appId\";"

# Expected output:
#     appId       | models
# ----------------+--------
#  avatar-creator |      4
#  video-mixer    |      1
#  carousel-mix   |      1
#  pose-generator |      0  ← This should be 3 after seeding
```

---

## Summary

```
┌─────────────────────────────────────────────────────────────┐
│ ROOT CAUSE: Seeds not run during deployment                │
├─────────────────────────────────────────────────────────────┤
│ SYMPTOM:    Pose Generator invisible on dashboard          │
│ FIX:        Run: cd /app/backend && bun prisma/seed.ts     │
│ TIME:       2-3 minutes                                     │
│ RISK:       Low (idempotent, data-only)                    │
│ RESTART:    Not needed                                      │
│ PERMANENT:  Add auto-seed to docker-entrypoint.sh          │
└─────────────────────────────────────────────────────────────┘
```

---

## Files Reference

- Investigation: `POSE_GENERATOR_NOT_VISIBLE_INVESTIGATION.md`
- Quick commands: `COPY_PASTE_TO_COOLIFY_TERMINAL.txt`
- Automated script: `FIX_POSE_GENERATOR_NOW.sh`
- This guide: `POSE_GENERATOR_INVISIBLE_QUICK_FIX.md`

---

**Report by:** Claude Code (Lumiku Deployment Specialist)
**Date:** 2025-10-16
**Status:** Root cause identified, fix ready to apply
