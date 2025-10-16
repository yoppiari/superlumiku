# Avatar Creator Hardcoded ID Debug Guide

## Problem

Error appears in console (even in incognito mode):
```
Failed to load resource: /api/apps/avatar-creator_88082ugb227d4g3wi1
Failed to delete project: ce
```

## Investigation Results

After thorough code investigation:

- ✅ **Frontend code is CLEAN** - No hardcoded ID `88082ugb227d4g3wi1` found
- ✅ **Backend code is CLEAN** - No hardcoded ID found
- ✅ **Seed data is CLEAN** - No hardcoded ID found
- ✅ **Store initialization is CLEAN** - No default project ID
- ✅ **Route configuration is CORRECT** - Uses `/api/apps/avatar-creator/` (with slash)

## Root Cause: **URL Construction Bug OR Database Corruption**

The error shows `/api/apps/avatar-creator_88082ugb227d4g3wi1` with an **UNDERSCORE** instead of **SLASH**.

This suggests one of these scenarios:

### Scenario 1: Database Has Malformed appId
The `AIModel` table might have a record with:
```sql
appId = 'avatar-creator_88082ugb227d4g3wi1'
```

Instead of:
```sql
appId = 'avatar-creator'
```

### Scenario 2: Stale Browser State
- Service Worker cache
- IndexedDB with old data
- Browser extension interfering

### Scenario 3: Frontend Logic Bug (Hidden)
Some code path we haven't checked yet is concatenating strings incorrectly.

## Debugging Steps Added

### Backend Logging (ADDED)

1. **404 Handler** - Now logs all 404s with underscore in URL:
   - File: `backend/src/app.ts`
   - Will log: method, path, headers, query params

2. **Avatar Creator Route Middleware** - Logs ALL requests:
   - File: `backend/src/apps/avatar-creator/routes.ts`
   - Will log: Every request to avatar-creator
   - Will warn: Suspicious patterns (underscores, long IDs)

## How to Debug in Production

### Step 1: Deploy Code with Logging

```bash
# From project root
git add .
git commit -m "debug: Add comprehensive logging for avatar-creator routes"
git push origin development
```

Wait for Coolify deployment to complete.

### Step 2: Monitor Logs

```bash
# SSH into production server
ssh user@dev.lumiku.com

# View backend logs in real-time
pm2 logs backend --lines 100

# Or view Docker logs if using Coolify
docker logs -f <container-id>
```

### Step 3: Reproduce Error

1. Open **NEW** incognito window
2. Navigate to `https://dev.lumiku.com/login`
3. Login
4. Click "Avatar Creator" from dashboard
5. Check console for error
6. **Watch backend logs simultaneously**

### Step 4: Analyze Logs

Look for lines like:
```
[Avatar Creator] GET /projects
[Avatar Creator] SUSPICIOUS REQUEST: GET /_88082ugb227d4g3wi1
```

This will tell you:
- What endpoint is being called
- What the full URL looks like
- Headers (to identify source)

### Step 5: Check Database

```bash
# Connect to database
psql $DATABASE_URL

# Check for malformed appId
SELECT * FROM "AIModel" WHERE "appId" LIKE '%_%';

# Check for hardcoded project IDs
SELECT * FROM "AvatarProject" WHERE id = '88082ugb227d4g3wi1';

# Check if appId column has wrong format
SELECT DISTINCT "appId" FROM "AIModel" WHERE "appId" LIKE 'avatar-creator%';
```

### Step 6: Frontend Network Tab

1. Open DevTools > Network tab
2. Filter: `avatar-creator`
3. Reproduce error
4. Check **Request URL** column
5. Look for the malformed URL

If you see: `/api/apps/avatar-creator_88082ugb227d4g3wi1`

Click on it and check:
- **Initiator** tab - Shows which code made the request
- **Call Stack** - Shows the exact function

## Possible Fixes

### Fix 1: Clean Database

If database has malformed records:

```sql
-- Find malformed records
SELECT * FROM "AIModel" WHERE "appId" LIKE '%_%' AND "appId" NOT LIKE '%-%';

-- Fix if found
UPDATE "AIModel"
SET "appId" = 'avatar-creator'
WHERE "appId" LIKE 'avatar-creator_%';
```

### Fix 2: Clear Browser State

```javascript
// Run in browser console
localStorage.clear()
sessionStorage.clear()
indexedDB.databases().then(dbs => {
  dbs.forEach(db => indexedDB.deleteDatabase(db.name))
})
location.reload()
```

### Fix 3: Unregister Service Workers

```javascript
// Run in browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister())
})
```

## Expected Outcome

After logging is deployed and you reproduce the error:

1. **Backend logs will show** the exact malformed request
2. **Network tab will show** which component made the request
3. **Console will show** if it's from a store, component, or service

## Quick Test

To verify logging is working:

```bash
# Make a test request with underscore
curl https://dev.lumiku.com/api/apps/avatar-creator_test123

# Check logs - should see:
# [Avatar Creator] SUSPICIOUS REQUEST: GET /_test123
```

## Summary

✅ **Code is clean** - No hardcoded ID in source
🔍 **Logging added** - Will catch the request when it happens
🎯 **Next step** - Deploy, reproduce, and check logs

The logs will definitively tell us where this request is coming from.

---

## When You Find It

Once logs show the source:

1. **If it's database** → Run SQL fix
2. **If it's browser cache** → Clear storage
3. **If it's code we missed** → Fix the specific line

The comprehensive logging will make it impossible for this bug to hide!
