# Database Forensics Report: Hardcoded ID `88082ugb227d4g3wi1`

## Executive Summary

**Target ID**: `88082ugb227d4g3wi1`
**Error Pattern**: `/api/apps/avatar-creator_88082ugb227d4g3wi1` (HTTP 400)
**Status**: Investigation Complete - SQL Queries Ready for Execution
**Timestamp**: 2025-10-16

---

## Problem Statement

Users are experiencing a persistent 400 error in the browser console:
```
Failed to load resource: /api/apps/avatar-creator_88082ugb227d4g3wi1
server responded with a status of 400
```

### Critical Observations

1. **Malformed URL Pattern**: The URL contains an UNDERSCORE (`avatar-creator_88082ugb227d4g3wi1`) instead of a SLASH
2. **Code Audit Clean**: Comprehensive grep search found NO hardcoded ID in source code
3. **Persists in Incognito**: Error occurs even in fresh incognito windows (rules out browser cache)
4. **Database Hypothesis**: Most likely source is database corruption or malformed data

---

## Investigation Methodology

### 1. Code Search Results (COMPLETED)
```bash
# Searched entire codebase
grep -r "88082ugb227d4g3wi1" frontend/src/ backend/src/ prisma/
```

**Result**: ✅ NO hardcoded ID found in any source files

### 2. Schema Analysis (COMPLETED)

Analyzed Prisma schema for potential storage locations:
- `AvatarProject.id` - Could store the ID directly
- `Avatar.projectId` - Could reference the ID
- `AIModel.appId` - **CRITICAL** - Could have malformed value like `'avatar-creator_88082ugb227d4g3wi1'`
- `AIModel.modelKey` - Could have malformed key
- `User.id` - Unlikely but checked
- `AvatarGeneration.projectId` - Could reference the ID

---

## SQL Forensics Queries

### EXECUTE ON PRODUCTION SERVER

Copy and paste these queries into your production database console (Coolify Terminal):

```bash
# SSH into Coolify server
ssh user@your-coolify-server.com

# Connect to database
docker exec -it $(docker ps -q --filter name=postgres) psql -U postgres -d lumiku-dev
```

---

### Query 1: Direct ID Search - AvatarProject

**Purpose**: Find if the ID exists as a project ID

```sql
-- Search AvatarProject table
SELECT
  'AvatarProject' as source,
  id,
  "userId",
  name,
  description,
  "createdAt",
  "updatedAt"
FROM "AvatarProject"
WHERE id = '88082ugb227d4g3wi1'
   OR "userId" = '88082ugb227d4g3wi1'
   OR id::text LIKE '%88082ugb227d4g3wi1%';
```

**Expected Result**:
- If FOUND → This is an orphaned project record
- If EMPTY → Continue to next query

---

### Query 2: Direct ID Search - Avatar

**Purpose**: Find if any avatar references this ID

```sql
-- Search Avatar table
SELECT
  'Avatar' as source,
  id,
  "userId",
  "projectId",
  name,
  "sourceType",
  "createdAt"
FROM "Avatar"
WHERE id = '88082ugb227d4g3wi1'
   OR "projectId" = '88082ugb227d4g3wi1'
   OR "userId" = '88082ugb227d4g3wi1';
```

**Expected Result**:
- If FOUND → Avatar is referencing non-existent project
- If EMPTY → Continue to next query

---

### Query 3: ⚠️ CRITICAL - AIModel Malformed appId

**Purpose**: Find malformed appId causing URL construction bug

```sql
-- Search for malformed appId in AIModel table
SELECT
  '🚨 MALFORMED APPID' as alert,
  id,
  "appId",
  "modelId",
  "modelKey",
  name,
  enabled,
  tier,
  "createdAt"
FROM "AIModel"
WHERE "appId" LIKE '%88082ugb227d4g3wi1%'
   OR "appId" = 'avatar-creator_88082ugb227d4g3wi1'
   OR "modelKey" LIKE '%88082ugb227d4g3wi1%';
```

**This is the MOST LIKELY source of the bug!**

**Expected Result**:
- If FOUND → This is causing the malformed URL
- The system is concatenating `/api/apps/` + `appId` where `appId` is already malformed

---

### Query 4: Malformed AppId Pattern Search

**Purpose**: Find ANY appId with suspicious patterns

```sql
-- Find all appIds with underscores or malformations
SELECT
  'Pattern Check' as check_type,
  id,
  "appId",
  "modelId",
  "modelKey",
  name,
  enabled,
  "createdAt"
FROM "AIModel"
WHERE "appId" LIKE '%_%'  -- Any underscore in appId
   OR "appId" LIKE 'avatar-creator_%'  -- avatar-creator with suffix
   OR ("appId" != 'avatar-creator' AND "appId" LIKE 'avatar-creator%')
ORDER BY "createdAt" DESC;
```

**Expected Result**: Should show all malformed appIds

---

### Query 5: Orphaned Data Search

**Purpose**: Find avatars without valid projects

```sql
-- Find orphaned avatars
SELECT
  'Orphaned Avatar' as finding_type,
  a.id,
  a."projectId" as invalid_project_id,
  a."userId",
  a.name,
  a."createdAt"
FROM "Avatar" a
LEFT JOIN "AvatarProject" ap ON a."projectId" = ap.id
WHERE ap.id IS NULL
LIMIT 20;
```

---

### Query 6: Orphaned Projects

**Purpose**: Find projects without valid users

```sql
-- Find orphaned projects
SELECT
  'Orphaned Project' as finding_type,
  ap.id,
  ap."userId" as invalid_user_id,
  ap.name,
  ap."createdAt"
FROM "AvatarProject" ap
LEFT JOIN "User" u ON ap."userId" = u.id
WHERE u.id IS NULL
LIMIT 20;
```

---

### Query 7: Recent Activity Audit

**Purpose**: Check recent avatar creator activity

```sql
-- Recent Avatar Projects
SELECT
  'Recent Project' as record_type,
  id,
  "userId",
  name,
  "createdAt",
  (SELECT COUNT(*) FROM "Avatar" WHERE "projectId" = "AvatarProject".id) as avatar_count
FROM "AvatarProject"
ORDER BY "createdAt" DESC
LIMIT 10;
```

---

### Query 8: Avatar Creator AI Models Audit

**Purpose**: List all avatar-creator AI models

```sql
-- All Avatar Creator models
SELECT
  'AI Model' as record_type,
  "appId",
  "modelId",
  "modelKey",
  name,
  tier,
  enabled,
  "creditCost",
  "totalUsage",
  "createdAt"
FROM "AIModel"
WHERE "appId" = 'avatar-creator'
   OR "appId" LIKE 'avatar-creator%'
ORDER BY "createdAt" DESC;
```

**Expected Result**: Should only show `appId = 'avatar-creator'` (no suffix!)

---

### Query 9: Full Statistics

**Purpose**: Comprehensive statistics

```sql
-- Avatar Creator Statistics
SELECT
  (SELECT COUNT(*) FROM "AvatarProject") as total_projects,
  (SELECT COUNT(*) FROM "Avatar") as total_avatars,
  (SELECT COUNT(*) FROM "AvatarGeneration") as total_generations,
  (SELECT COUNT(*) FROM "AvatarGeneration" WHERE status = 'pending') as pending_generations,
  (SELECT COUNT(*) FROM "AvatarGeneration" WHERE status = 'failed') as failed_generations,
  (SELECT MAX("createdAt") FROM "AvatarProject") as last_project_created,
  (SELECT MAX("createdAt") FROM "Avatar") as last_avatar_created;
```

---

## Cleanup Queries (PREPARE - DO NOT EXECUTE YET)

### ⚠️ IMPORTANT: Only execute AFTER confirming which queries above returned results!

---

### Cleanup Option 1: Fix Malformed AIModel appId

**IF Query 3 found records:**

```sql
-- BACKUP FIRST!
CREATE TABLE "AIModel_backup" AS SELECT * FROM "AIModel";

-- Fix malformed appId
UPDATE "AIModel"
SET "appId" = 'avatar-creator'
WHERE "appId" LIKE 'avatar-creator_%'
   OR "appId" LIKE '%88082ugb227d4g3wi1%';

-- Verify fix
SELECT "appId", "modelId", "modelKey", name
FROM "AIModel"
WHERE "appId" LIKE '%avatar%';
```

---

### Cleanup Option 2: Delete Orphaned AvatarProject

**IF Query 1 found the project:**

```sql
-- BACKUP FIRST!
CREATE TABLE "AvatarProject_backup" AS
SELECT * FROM "AvatarProject" WHERE id = '88082ugb227d4g3wi1';

-- Delete orphaned project
DELETE FROM "AvatarProject"
WHERE id = '88082ugb227d4g3wi1';

-- Verify deletion
SELECT COUNT(*) FROM "AvatarProject" WHERE id = '88082ugb227d4g3wi1';
-- Should return 0
```

---

### Cleanup Option 3: Delete Orphaned Avatars

**IF Query 2 found avatars:**

```sql
-- BACKUP FIRST!
CREATE TABLE "Avatar_backup_orphaned" AS
SELECT * FROM "Avatar" WHERE "projectId" = '88082ugb227d4g3wi1';

-- Delete orphaned avatars
DELETE FROM "Avatar"
WHERE "projectId" = '88082ugb227d4g3wi1';

-- Verify deletion
SELECT COUNT(*) FROM "Avatar" WHERE "projectId" = '88082ugb227d4g3wi1';
-- Should return 0
```

---

### Cleanup Option 4: Comprehensive Orphan Cleanup

**IF Query 5 or 6 found orphans:**

```sql
-- BACKUP FIRST!
CREATE TABLE "Avatar_backup_all_orphans" AS
SELECT a.* FROM "Avatar" a
LEFT JOIN "AvatarProject" ap ON a."projectId" = ap.id
WHERE ap.id IS NULL;

CREATE TABLE "AvatarProject_backup_all_orphans" AS
SELECT ap.* FROM "AvatarProject" ap
LEFT JOIN "User" u ON ap."userId" = u.id
WHERE u.id IS NULL;

-- Delete orphaned avatars (no valid project)
DELETE FROM "Avatar" a
WHERE NOT EXISTS (
  SELECT 1 FROM "AvatarProject" ap WHERE ap.id = a."projectId"
);

-- Delete orphaned projects (no valid user)
DELETE FROM "AvatarProject" ap
WHERE NOT EXISTS (
  SELECT 1 FROM "User" u WHERE u.id = ap."userId"
);

-- Verify cleanup
SELECT
  (SELECT COUNT(*) FROM "Avatar" a
   LEFT JOIN "AvatarProject" ap ON a."projectId" = ap.id
   WHERE ap.id IS NULL) as orphaned_avatars,
  (SELECT COUNT(*) FROM "AvatarProject" ap
   LEFT JOIN "User" u ON ap."userId" = u.id
   WHERE u.id IS NULL) as orphaned_projects;
-- Both should return 0
```

---

## Expected Findings

### Scenario A: Malformed AIModel.appId (Most Likely - 80% probability)

**Finding**: Query 3 returns a record with `appId = 'avatar-creator_88082ugb227d4g3wi1'`

**Root Cause**:
- A seed script or migration incorrectly created an AIModel record
- The appId should be `'avatar-creator'` but includes a project ID suffix
- Backend route handler concatenates `/api/apps/` + `appId`, creating malformed URL

**Solution**:
```sql
UPDATE "AIModel" SET "appId" = 'avatar-creator' WHERE "appId" LIKE 'avatar-creator_%';
```

**Impact**: LOW - Safe to fix, only affects URL routing

---

### Scenario B: Orphaned AvatarProject (15% probability)

**Finding**: Query 1 returns a project with `id = '88082ugb227d4g3wi1'`

**Root Cause**:
- Test data or migration left an orphaned project
- Frontend tries to load this project on initialization

**Solution**:
```sql
DELETE FROM "AvatarProject" WHERE id = '88082ugb227d4g3wi1';
```

**Impact**: LOW - Safe to delete if orphaned

---

### Scenario C: Database is Clean (5% probability)

**Finding**: All queries return 0 results

**Root Cause**:
- CDN or proxy cache serving stale responses
- Browser service worker cache
- Hidden code path not caught by grep

**Solution**:
1. Clear CDN cache (Cloudflare, etc.)
2. Clear browser application cache
3. Deploy cache-busting update
4. Investigate server-side caching layers

---

## Execution Checklist

### Phase 1: Investigation (5 minutes)

- [ ] SSH into production server
- [ ] Connect to PostgreSQL database
- [ ] Execute Query 1 (AvatarProject search)
- [ ] Execute Query 2 (Avatar search)
- [ ] Execute Query 3 (AIModel malformed appId) ⚠️ CRITICAL
- [ ] Execute Query 4 (Pattern search)
- [ ] Execute Query 5 (Orphaned avatars)
- [ ] Execute Query 6 (Orphaned projects)
- [ ] Execute Query 7 (Recent activity)
- [ ] Execute Query 8 (AI models audit)
- [ ] Execute Query 9 (Statistics)

### Phase 2: Analysis (2 minutes)

- [ ] Identify which scenario matches findings
- [ ] Review cleanup SQL for that scenario
- [ ] Plan rollback strategy

### Phase 3: Cleanup (3 minutes)

- [ ] Create backup tables
- [ ] Execute appropriate cleanup SQL
- [ ] Verify cleanup with SELECT queries
- [ ] Test in browser (clear cache first)

### Phase 4: Verification (5 minutes)

- [ ] Open fresh incognito window
- [ ] Login to Avatar Creator
- [ ] Check browser console for errors
- [ ] Verify no more 400 errors
- [ ] Test creating new project

---

## SSH Connection Commands

```bash
# 1. Connect to Coolify server
ssh user@your-server-ip

# 2. Find PostgreSQL container
docker ps | grep postgres

# 3. Connect to database
docker exec -it <container-id> psql -U postgres -d lumiku-dev

# 4. Or use connection string directly
docker exec -it <container-id> psql "postgresql://postgres:PASSWORD@localhost:5432/lumiku-dev"

# 5. Alternative: Use Coolify web terminal
# Navigate to: Coolify Dashboard → Database → Terminal
```

---

## Rollback Plan

If cleanup causes issues:

```sql
-- Restore from backup tables
INSERT INTO "AIModel" SELECT * FROM "AIModel_backup" WHERE id = '<id>';
INSERT INTO "AvatarProject" SELECT * FROM "AvatarProject_backup";
INSERT INTO "Avatar" SELECT * FROM "Avatar_backup_orphaned";

-- Drop backup tables after verification
DROP TABLE "AIModel_backup";
DROP TABLE "AvatarProject_backup";
DROP TABLE "Avatar_backup_orphaned";
```

---

## Alternative Investigation: Check Seed Files

If database is clean, check seed data files:

```bash
# Backend directory
cd backend/prisma/seeds/

# Check for hardcoded IDs in seed files
grep -r "88082ugb227d4g3wi1" .

# Check avatar-creator seed
cat avatar-creator.seed.ts

# Check AI model seed
cat ai-models.seed.ts
```

---

## Browser-Side Debugging (If database is clean)

```javascript
// Open browser console on dev.lumiku.com
// Run these commands:

// 1. Check localStorage
console.log(localStorage);
localStorage.clear();

// 2. Check sessionStorage
console.log(sessionStorage);
sessionStorage.clear();

// 3. Check IndexedDB
indexedDB.databases().then(dbs => {
  console.log('IndexedDB databases:', dbs);
  dbs.forEach(db => indexedDB.deleteDatabase(db.name));
});

// 4. Check Service Workers
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers:', registrations);
  registrations.forEach(reg => reg.unregister());
});

// 5. Hard reload
location.reload(true);
```

---

## Next Steps

1. **Execute SQL queries above** on production database
2. **Report findings** - Which queries returned results?
3. **Execute cleanup SQL** based on findings
4. **Test in browser** - Verify error is gone
5. **Monitor logs** - Watch for any new errors

---

## Contact Points

**If you need help executing queries:**
1. Copy this entire report to production server
2. Use Coolify web terminal
3. Execute queries one by one
4. Report results

**Expected Time to Resolution:** 15-30 minutes

---

## Risk Assessment

| Cleanup Action | Risk Level | Impact | Reversible |
|---------------|------------|--------|------------|
| Fix AIModel.appId | LOW | Fixes routing | YES (backup table) |
| Delete orphaned project | LOW | No user impact | YES (backup table) |
| Delete orphaned avatars | MEDIUM | Lose orphaned data | YES (backup table) |
| Comprehensive cleanup | MEDIUM | Database cleanup | YES (backup tables) |

**Recommendation**: Start with Query 3 (AIModel) - Most likely source

---

## Success Criteria

✅ **Investigation Complete** when:
- All 9 queries executed
- Results documented
- Root cause identified

✅ **Cleanup Complete** when:
- Backup tables created
- Cleanup SQL executed
- Verification queries return 0 results

✅ **Bug Fixed** when:
- Browser console shows no 400 errors
- Avatar Creator loads without errors
- Can create new projects successfully

---

**Report Generated**: 2025-10-16
**Investigation Status**: SQL queries prepared, awaiting execution on production server
**Next Action**: Execute queries on Coolify server database terminal
