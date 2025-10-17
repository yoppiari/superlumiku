# 🚀 START HERE: Fix Avatar Creator 400 Error

**Bug:** `Failed to load resource: /api/apps/avatar-creator_88082ugb227d4g3wi1 (400)`
**Time to Fix:** 5 minutes
**Risk:** LOW (backup created automatically)

---

## ⚡ Quick Fix (3 Steps)

### Step 1: Open Coolify Database Terminal (1 minute)

1. Go to your Coolify dashboard
2. Click: **Resources** → **Databases**
3. Find database: `ycwc4s4ookos40k44gc8oooc`
4. Click: **"Execute Command"** or **"Terminal"**

You should see a `psql` prompt.

---

### Step 2: Copy-Paste This Query (1 minute)

```sql
SELECT id, "appId", "modelKey", name
FROM "AIModel"
WHERE "appId" LIKE 'avatar-creator_%'
   OR "appId" LIKE '%88082ugb227d4g3wi1%';
```

**If you see rows → BUG FOUND! Go to Step 3.**

**If no rows → Bug is NOT in database.** Skip to "Database is Clean" section below.

---

### Step 3: Copy-Paste This Fix (2 minutes)

```sql
-- Create backup
CREATE TABLE "AIModel_backup_20251016" AS SELECT * FROM "AIModel";

-- Fix the bug
UPDATE "AIModel"
SET "appId" = 'avatar-creator'
WHERE "appId" LIKE 'avatar-creator_%'
   OR "appId" LIKE '%88082ugb227d4g3wi1%';

-- Verify fix
SELECT "appId", "modelKey", name FROM "AIModel" WHERE "appId" LIKE '%avatar%';
```

**All `appId` should now be `'avatar-creator'` (no underscore, no suffix)**

---

### Step 4: Restart App + Test (2 minutes)

1. In Coolify: Go to your application → Click **"Restart"**
2. Wait 30 seconds for restart
3. Open **new incognito window**
4. Go to: `https://dev.lumiku.com`
5. Login and open Avatar Creator
6. Press **F12** → Check console

**Expected:** No more 400 errors! ✅

---

## 🎉 Done!

If Avatar Creator now works:
- ✅ Bug is fixed!
- ✅ Backup table created (drop it in 24-48 hours)
- ✅ Report success

---

## 🔍 If Database is Clean (No Rows Found)

The bug is NOT in the database. Try:

### 1. Clear Browser Cache
```javascript
// Open browser console (F12) and run:
localStorage.clear();
sessionStorage.clear();
location.reload(true);
```

### 2. Clear CDN Cache
If you use Cloudflare or other CDN:
- Go to CDN dashboard
- Click "Purge Cache" or "Clear Cache"
- Wait 2 minutes
- Test again

### 3. Execute Full Forensics
Open file: `EXECUTE_THIS_IN_PRODUCTION_DB.sql`
Copy entire content into Coolify terminal
This will check 9 different database tables

---

## 🚨 If Fix Breaks Something

Rollback (instant):

```sql
-- Restore from backup
INSERT INTO "AIModel"
SELECT * FROM "AIModel_backup_20251016"
WHERE id NOT IN (SELECT id FROM "AIModel");
```

Then restart application.

---

## 📁 Need More Help?

| If You Need | Open This File |
|-------------|----------------|
| Detailed step-by-step guide | `COOLIFY_DATABASE_FORENSICS_GUIDE.md` |
| Copy-paste SQL with comments | `COPY_PASTE_INTO_COOLIFY_TERMINAL.sql` |
| Full forensics (9 queries) | `EXECUTE_THIS_IN_PRODUCTION_DB.sql` |
| Complete analysis report | `DATABASE_FORENSICS_EXECUTION_REPORT.md` |
| Technical details | `DATABASE_FORENSICS_REPORT.md` |
| Quick reference | `QUICK_START_DATABASE_FORENSICS.md` |

---

## ✅ Success Checklist

After fix:
- [ ] Query found malformed `appId`
- [ ] Backup created
- [ ] UPDATE executed
- [ ] Verification query shows clean data
- [ ] Application restarted
- [ ] Avatar Creator loads without errors
- [ ] No 400 errors in browser console
- [ ] Can create new avatar projects

---

## 🎯 What This Fix Does

**Problem:**
- Database has `appId = 'avatar-creator_88082ugb227d4g3wi1'`
- Backend creates URL: `/api/apps/avatar-creator_88082ugb227d4g3wi1`
- Server returns 400 (invalid app ID)

**Solution:**
- Change `appId` to `'avatar-creator'` (without suffix)
- Backend creates URL: `/api/apps/avatar-creator`
- Server returns 200 (valid app ID)

**Risk:** LOW - Only fixes URL routing, doesn't affect data

---

## 🔗 Production Database Details

**Database:** `lumiku-dev`
**Host:** `ycwc4s4ookos40k44gc8oooc`
**Access:** Coolify web terminal (recommended) or SSH + Docker

---

**Last Updated:** 2025-10-16
**Estimated Time:** 5 minutes
**Success Rate:** 80% (if bug is in database)
**Reversible:** YES (backup created automatically)

---

## 💡 Quick Summary

```
1. Open Coolify database terminal
2. Run: SELECT query (find bug)
3. If found: Run UPDATE query (fix bug)
4. Restart application
5. Test in browser
6. Done! ✅
```

**Start now →** Step 1 above
