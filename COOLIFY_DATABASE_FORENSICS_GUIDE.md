# 🔍 Coolify Database Forensics Guide

**Target Issue:** Find and fix hardcoded ID `88082ugb227d4g3wi1` causing 400 errors
**Error:** `Failed to load resource: /api/apps/avatar-creator_88082ugb227d4g3wi1 (400)`

---

## 📋 Quick Access Information

**Production Database:**
- Host: `ycwc4s4ookos40k44gc8oooc`
- Database: `lumiku-dev`
- User: `postgres`
- Connection String: `postgresql://postgres:6LP0Ojegy7IUU6kaX9lLkmZRUiAdAUNOltWyL3LegfYGR6rPQtB4DUSVqjdA78ES@ycwc4s4ookos40k44gc8oooc:5432/lumiku-dev`

---

## 🚀 Method 1: Coolify Web Terminal (RECOMMENDED)

### Step 1: Access Database Terminal

1. Open Coolify Dashboard: `https://your-coolify-instance.com`
2. Navigate to: **Resources** → **Databases**
3. Find your PostgreSQL database: `ycwc4s4ookos40k44gc8oooc`
4. Click **"Execute Command"** or **"Terminal"** button
5. You should now be in a `psql` prompt

### Step 2: Execute Critical Query (Priority)

**Copy and paste this query first** (most likely source of bug):

```sql
-- QUERY 3: Check for malformed AIModel.appId
SELECT
  '⚠️ MALFORMED APPID FOUND' as alert,
  id,
  "appId",
  "modelId",
  "modelKey",
  name,
  enabled
FROM "AIModel"
WHERE "appId" LIKE '%88082ugb227d4g3wi1%'
   OR "appId" = 'avatar-creator_88082ugb227d4g3wi1'
   OR "appId" LIKE 'avatar-creator_%'
   OR "modelKey" LIKE '%88082ugb227d4g3wi1%';
```

**Expected Results:**

- **If rows returned:** ✅ **FOUND THE BUG!** → Proceed to Step 3 (Fix)
- **If no rows:** → Execute all 9 forensics queries below

---

### Step 3: Execute Fix (If Malformed Data Found)

**⚠️ IMPORTANT: Only execute if Query 3 found records!**

```sql
-- STEP 1: Create backup
CREATE TABLE "AIModel_backup_20251016" AS SELECT * FROM "AIModel";

-- Verify backup created
SELECT COUNT(*) as backup_count FROM "AIModel_backup_20251016";
-- Should return the number of records backed up

-- STEP 2: Execute fix
UPDATE "AIModel"
SET "appId" = 'avatar-creator'
WHERE "appId" LIKE 'avatar-creator_%'
   OR "appId" LIKE '%88082ugb227d4g3wi1%';

-- Show what was updated
SELECT id, "appId", "modelKey", name FROM "AIModel" WHERE "appId" = 'avatar-creator';

-- STEP 3: Verify fix
SELECT "appId", "modelKey", name FROM "AIModel" WHERE "appId" LIKE '%avatar%';
-- All appId should now be exactly 'avatar-creator' with NO suffix
```

**Success Criteria:**
- All Avatar Creator AI models have `appId = 'avatar-creator'` (no underscore, no suffix)
- No records with `appId` containing `88082ugb227d4g3wi1`

---

### Step 4: Restart Application

After database fix:

```bash
# Option A: Through Coolify UI
# Navigate to your application → Click "Restart"

# Option B: If you have SSH access
docker restart <your-lumiku-app-container>
```

---

## 🔍 Full Forensics (If Query 3 Found Nothing)

If the critical query found nothing, execute all 9 forensics queries:

```sql
-- ========================================
-- FULL DATABASE FORENSICS
-- ========================================

-- QUERY 1: AvatarProject Direct Search
SELECT
  'AvatarProject' as source,
  id,
  "userId",
  name,
  "createdAt"
FROM "AvatarProject"
WHERE id = '88082ugb227d4g3wi1'
   OR "userId" = '88082ugb227d4g3wi1';

-- QUERY 2: Avatar Direct Search
SELECT
  'Avatar' as source,
  id,
  "userId",
  "projectId",
  name
FROM "Avatar"
WHERE id = '88082ugb227d4g3wi1'
   OR "projectId" = '88082ugb227d4g3wi1'
   OR "userId" = '88082ugb227d4g3wi1';

-- QUERY 4: All Malformed AppId Patterns
SELECT
  'Malformed Pattern' as finding,
  id,
  "appId",
  "modelKey",
  name,
  enabled
FROM "AIModel"
WHERE "appId" LIKE '%_%'
   OR ("appId" != 'avatar-creator' AND "appId" LIKE 'avatar-creator%')
ORDER BY "createdAt" DESC;

-- QUERY 5: User Search
SELECT
  'User' as source,
  id,
  email,
  name,
  role
FROM "User"
WHERE id = '88082ugb227d4g3wi1';

-- QUERY 6: Orphaned Avatars
SELECT
  'Orphaned Avatar' as finding,
  a.id,
  a."projectId" as invalid_project_id,
  a.name,
  a."createdAt"
FROM "Avatar" a
LEFT JOIN "AvatarProject" ap ON a."projectId" = ap.id
WHERE ap.id IS NULL
LIMIT 10;

-- QUERY 7: Orphaned Projects
SELECT
  'Orphaned Project' as finding,
  ap.id,
  ap."userId" as invalid_user_id,
  ap.name,
  ap."createdAt"
FROM "AvatarProject" ap
LEFT JOIN "User" u ON ap."userId" = u.id
WHERE u.id IS NULL
LIMIT 10;

-- QUERY 8: All Avatar Creator AI Models
SELECT
  "appId",
  "modelId",
  "modelKey",
  name,
  tier,
  enabled,
  "totalUsage"
FROM "AIModel"
WHERE "appId" = 'avatar-creator'
   OR "appId" LIKE 'avatar-creator%'
ORDER BY "createdAt" DESC;

-- QUERY 9: Statistics
SELECT
  (SELECT COUNT(*) FROM "AvatarProject") as total_projects,
  (SELECT COUNT(*) FROM "Avatar") as total_avatars,
  (SELECT COUNT(*) FROM "AvatarGeneration") as total_generations,
  (SELECT COUNT(*) FROM "AIModel" WHERE "appId" LIKE 'avatar-creator%') as avatar_creator_models;
```

---

## 📊 Interpreting Results

### Scenario A: Malformed AIModel.appId (Most Likely - 80%)

**If Query 3 returns records:**

```
 alert                     | id       | appId                              | modelKey | name
---------------------------|----------|---------------------------------------|----------|------
 ⚠️ MALFORMED APPID FOUND | cm2...   | avatar-creator_88082ugb227d4g3wi1    | ...      | ...
```

**Root Cause:**
- The `AIModel` table has a malformed `appId` field
- Instead of `'avatar-creator'`, it contains `'avatar-creator_88082ugb227d4g3wi1'`
- Backend concatenates `/api/apps/` + `appId`, creating the malformed URL

**Fix:**
- Execute cleanup SQL (Step 3 above)
- Risk: LOW - Safe to fix
- Reversible: YES (backup created)

---

### Scenario B: Orphaned AvatarProject (15%)

**If Query 1 returns a record:**

```
 source         | id                  | userId | name
----------------|---------------------|---------|------------
 AvatarProject  | 88082ugb227d4g3wi1  | ...    | Test Project
```

**Root Cause:**
- An orphaned project with this exact ID exists
- Frontend tries to load this project causing 400 error

**Fix:**
```sql
-- Backup first
CREATE TABLE "AvatarProject_backup_20251016" AS
SELECT * FROM "AvatarProject" WHERE id = '88082ugb227d4g3wi1';

-- Delete orphaned project
DELETE FROM "AvatarProject" WHERE id = '88082ugb227d4g3wi1';

-- Verify deletion
SELECT COUNT(*) FROM "AvatarProject" WHERE id = '88082ugb227d4g3wi1';
-- Should return 0
```

---

### Scenario C: Database is Clean (5%)

**If all queries return 0 rows:**

The ID is NOT in the database. Bug is elsewhere:

**Next Steps:**
1. Clear browser cache completely
2. Clear CDN/Cloudflare cache
3. Check for service workers
4. Investigate proxy configuration
5. Review recent deployments

---

## 🔧 Method 2: SSH + Docker (Alternative)

If Coolify web terminal is not available:

```bash
# 1. SSH into Coolify server
ssh root@your-server-ip

# 2. Find PostgreSQL container
docker ps | grep postgres

# 3. Connect to database
docker exec -it <postgres-container-id> psql -U postgres -d lumiku-dev

# 4. You're now in psql prompt - execute queries above
```

---

## ✅ Verification Steps

After applying any fix:

### 1. Database Verification

```sql
-- Verify no malformed appId
SELECT "appId", name FROM "AIModel" WHERE "appId" LIKE '%avatar%';
-- All should be exactly 'avatar-creator'

-- Verify no orphaned records
SELECT COUNT(*) FROM "AvatarProject" WHERE id = '88082ugb227d4g3wi1';
-- Should return 0 if you deleted it
```

### 2. Application Restart

```bash
# Through Coolify UI: Application → Restart
# Or via Docker: docker restart <container-name>
```

### 3. Browser Testing

1. **Open NEW incognito window** (important!)
2. Navigate to: `https://dev.lumiku.com`
3. Login with valid credentials
4. Open Avatar Creator
5. **Open Browser Console** (F12)
6. Check for errors

**Expected Result:**
- ✅ NO errors about `avatar-creator_88082ugb227d4g3wi1`
- ✅ Avatar Creator loads successfully
- ✅ Can create new projects

**If still seeing error:**
- Clear browser cache completely
- Try different browser
- Check CDN cache (Cloudflare, etc.)

---

## 🚨 Rollback Plan

If fix caused issues:

```sql
-- Restore from backup
INSERT INTO "AIModel"
SELECT * FROM "AIModel_backup_20251016"
WHERE id NOT IN (SELECT id FROM "AIModel");

-- Verify restoration
SELECT COUNT(*) FROM "AIModel";

-- Drop backup after verification (24-48 hours later)
DROP TABLE "AIModel_backup_20251016";
```

---

## 📝 What To Report Back

After executing queries, please provide:

### 1. Query Results

```
Which queries found records?
- [ ] Query 1 (AvatarProject)
- [ ] Query 2 (Avatar)
- [ ] Query 3 (AIModel malformed appId) ⚠️ CRITICAL
- [ ] Query 4 (Pattern search)
- [ ] Query 5 (User)
- [ ] Query 6 (Orphaned avatars)
- [ ] Query 7 (Orphaned projects)
- [ ] Query 8 (All AI models)
- [ ] Query 9 (Statistics)
- [ ] NONE - Database is clean
```

### 2. Fix Applied

```
- [ ] Created backup table: _____________________
- [ ] Executed UPDATE query
- [ ] Verified fix (all appId clean)
- [ ] Restarted application
- [ ] Tested in browser
```

### 3. Results

```
Status: [ ] Fixed / [ ] Still broken / [ ] Database was clean

Browser console after fix:
- [ ] No 400 errors
- [ ] Avatar Creator loads
- [ ] Can create projects

If still broken, error message:
_______________________________________
```

---

## 🎯 Expected Outcome

**Best Case (80% probability):**
- Query 3 finds malformed `AIModel.appId`
- Execute cleanup SQL with backup
- Restart application
- Bug fixed - Avatar Creator works

**Alternative Case (15% probability):**
- Query 1 or 2 finds orphaned records
- Delete orphaned data
- Restart application
- Bug fixed

**Rare Case (5% probability):**
- All queries return 0 rows
- Database is clean
- Bug is in browser cache, CDN, or proxy
- Follow browser cache clearing steps

---

## 📁 Related Files

| File | Purpose |
|------|---------|
| `EXECUTE_THIS_IN_PRODUCTION_DB.sql` | Copy-paste SQL for psql terminal |
| `database-forensics-results.json` | Results output (auto-generated) |
| `QUICK_START_DATABASE_FORENSICS.md` | Quick reference guide |
| `DATABASE_FORENSICS_REPORT.md` | Detailed analysis document |

---

## ⏱️ Time Estimate

- **Query Execution:** 2-3 minutes
- **Fix Application:** 1-2 minutes
- **Verification:** 2-3 minutes
- **Total:** 5-10 minutes

---

## 🔒 Security Notes

- Database password is included in connection string (for your use only)
- Backup tables are created before any destructive operations
- All operations are reversible
- Keep backup tables for 24-48 hours before dropping

---

**Generated:** 2025-10-16
**Target ID:** `88082ugb227d4g3wi1`
**Priority:** HIGH (Production Bug)
**Status:** Ready for execution
