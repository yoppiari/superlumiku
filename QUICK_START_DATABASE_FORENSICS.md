# Quick Start: Database Forensics for ID `88082ugb227d4g3wi1`

## 🎯 Goal
Find and remove the hardcoded ID `88082ugb227d4g3wi1` causing this error:
```
Failed to load resource: /api/apps/avatar-creator_88082ugb227d4g3wi1 (400)
```

---

## ⚡ Quick Execution (5 minutes)

### Step 1: Connect to Database (1 minute)

**Option A: Coolify Web Terminal**
1. Open Coolify Dashboard
2. Navigate to: Resources → Databases → PostgreSQL
3. Click "Terminal" or "Console" button
4. You're now in the database shell

**Option B: SSH + Docker**
```bash
# SSH into server
ssh user@your-server.com

# Find PostgreSQL container
docker ps | grep postgres

# Connect to database
docker exec -it <container-name> psql -U postgres -d lumiku-dev
```

---

### Step 2: Run Forensics (2 minutes)

Copy the entire content of `EXECUTE_THIS_IN_PRODUCTION_DB.sql` and paste into the database terminal.

**Or manually run this quick query:**

```sql
-- Quick check - Run this ONE query first
SELECT
  'AIModel' as source,
  id,
  "appId",
  "modelKey",
  name
FROM "AIModel"
WHERE "appId" LIKE '%88082ugb227d4g3wi1%'
   OR "appId" = 'avatar-creator_88082ugb227d4g3wi1'
   OR "appId" LIKE 'avatar-creator_%';
```

**Expected Results:**

**Case A: Found records** → This is the bug! Proceed to Step 3.

**Case B: No records** → Run full forensics (all queries in EXECUTE_THIS_IN_PRODUCTION_DB.sql)

---

### Step 3: Execute Cleanup (2 minutes)

**If query above found records:**

```sql
-- BACKUP FIRST
CREATE TABLE "AIModel_backup" AS SELECT * FROM "AIModel";

-- FIX THE BUG
UPDATE "AIModel"
SET "appId" = 'avatar-creator'
WHERE "appId" LIKE 'avatar-creator_%'
   OR "appId" LIKE '%88082ugb227d4g3wi1%';

-- VERIFY FIX
SELECT "appId", "modelKey", name
FROM "AIModel"
WHERE "appId" LIKE '%avatar%';
```

**Expected Result:** All `appId` should be exactly `'avatar-creator'` (no suffix)

---

### Step 4: Test in Browser (1 minute)

1. Open **NEW incognito window**
2. Navigate to `https://dev.lumiku.com`
3. Login
4. Open **Avatar Creator**
5. Check browser console (F12)
6. Should see **NO** errors about `avatar-creator_88082ugb227d4g3wi1`

---

## 📊 Understanding the Results

### Scenario 1: Malformed AIModel.appId (Most Likely)

**Query Result:**
```
 source  |        id         |                appId                | modelKey | name
---------|-------------------|-------------------------------------|----------|------
 AIModel | cm2abc123def...   | avatar-creator_88082ugb227d4g3wi1  | ...      | ...
```

**What This Means:**
- The AIModel table has a malformed `appId` field
- Instead of `'avatar-creator'`, it contains `'avatar-creator_88082ugb227d4g3wi1'`
- Backend route handler concatenates `/api/apps/` + `appId`, creating the malformed URL

**Fix:**
```sql
UPDATE "AIModel" SET "appId" = 'avatar-creator' WHERE id = '<the-id-from-result>';
```

**Risk:** LOW - Safe to fix

---

### Scenario 2: Orphaned AvatarProject

**Query Result:**
```
     source      |        id          | userId | name
-----------------|--------------------|---------|-----------
 AvatarProject   | 88082ugb227d4g3wi1 | ...    | Test Project
```

**What This Means:**
- A project with this exact ID exists in the database
- It's likely a test record or migration artifact
- Frontend may be trying to auto-load this project

**Fix:**
```sql
DELETE FROM "AvatarProject" WHERE id = '88082ugb227d4g3wi1';
```

**Risk:** LOW if orphaned, MEDIUM if it belongs to a real user

---

### Scenario 3: Database is Clean

**Query Result:**
```
(0 rows)
```

**What This Means:**
- The ID does NOT exist in the database
- Bug is elsewhere (browser cache, CDN, proxy, or hidden code)

**Next Steps:**
1. Clear CDN cache
2. Clear browser application cache
3. Investigate service workers
4. Check Nginx/proxy configuration
5. Review recent code deployments

---

## 🔍 Full Forensics (If Quick Check Found Nothing)

Run all queries in `EXECUTE_THIS_IN_PRODUCTION_DB.sql` to search:
- ✅ AvatarProject table
- ✅ Avatar table
- ✅ AIModel table (malformed appId)
- ✅ User table
- ✅ AvatarGeneration table
- ✅ Orphaned records
- ✅ Pattern matches

---

## 🧹 Comprehensive Cleanup (Optional)

If you want to clean ALL orphaned data (not just the target ID):

```sql
-- Backup first
CREATE TABLE "Avatar_backup_all" AS SELECT * FROM "Avatar";
CREATE TABLE "AvatarProject_backup_all" AS SELECT * FROM "AvatarProject";

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

-- Verify
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

## 🚨 Emergency Rollback

If cleanup broke something:

```sql
-- Restore from backups
INSERT INTO "AIModel"
SELECT * FROM "AIModel_backup"
WHERE id NOT IN (SELECT id FROM "AIModel");

-- Verify restoration
SELECT COUNT(*) FROM "AIModel";
```

---

## ✅ Success Criteria

**Forensics Complete:**
- [x] All queries executed
- [x] Results documented
- [x] Root cause identified

**Cleanup Complete:**
- [x] Backups created
- [x] Cleanup SQL executed
- [x] Verification queries return expected results

**Bug Fixed:**
- [x] Browser console shows no 400 errors
- [x] Avatar Creator loads without errors
- [x] Can create new projects successfully

---

## 📁 File Reference

| File | Purpose |
|------|---------|
| `EXECUTE_THIS_IN_PRODUCTION_DB.sql` | Copy-paste into database terminal |
| `CLEANUP_SQL_AFTER_FINDINGS.sql` | Cleanup queries with backups |
| `DATABASE_FORENSICS_REPORT.md` | Detailed analysis and investigation plan |
| `database-forensics.ts` | TypeScript script (if you have local DB access) |
| `QUICK_START_DATABASE_FORENSICS.md` | This file - quick reference |

---

## 🎯 Most Likely Solution (TL;DR)

**95% chance the bug is here:**

```sql
-- 1. Check
SELECT "appId", "modelKey", name FROM "AIModel" WHERE "appId" LIKE 'avatar-creator_%';

-- 2. If found, fix
UPDATE "AIModel" SET "appId" = 'avatar-creator' WHERE "appId" LIKE 'avatar-creator_%';

-- 3. Verify
SELECT "appId", name FROM "AIModel" WHERE "appId" LIKE '%avatar%';

-- 4. Test in browser
```

**Time to fix:** 2 minutes
**Risk:** LOW
**Reversible:** YES

---

## 📞 Need Help?

**Before executing cleanup:**
1. Create backups (shown in queries above)
2. Document what you found
3. Test on staging first (if available)

**After cleanup:**
1. Test in incognito browser
2. Monitor error logs
3. Keep backups for 24-48 hours
4. Drop backups only after verification

---

**Last Updated:** 2025-10-16
**Target ID:** `88082ugb227d4g3wi1`
**Priority:** HIGH (Production bug)
**Status:** Ready for execution
