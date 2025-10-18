# 🚨 URGENT: Fix Background Remover 500 Errors

## Problem
Background Remover API returns 500 errors because database tables don't exist.

## Quick Fix (10 Minutes)

### Step 1: Copy SQL (1 min)
Open `COPY_PASTE_FIX_BACKGROUND_REMOVER.sql` and copy entire contents.

### Step 2: Run in Production Database (2 min)

**Option A: Coolify Database Terminal**
1. Go to Coolify → Your Database → Terminal
2. Paste SQL and execute
3. Verify output shows 4 tables created

**Option B: Direct PostgreSQL Connection**
```bash
psql $DATABASE_URL -f COPY_PASTE_FIX_BACKGROUND_REMOVER.sql
```

### Step 3: Rebuild Backend Container (5 min)

**In Coolify:**
1. Go to your Backend service
2. Click "Redeploy" button
3. Wait for build to complete

**Why?** This regenerates Prisma Client to include new models.

### Step 4: Test Endpoints (2 min)

```bash
# Replace YOUR_TOKEN with your JWT token from browser console
TOKEN="your_jwt_token_here"

# Test 1: Subscription endpoint
curl https://api.lumiku.com/api/background-remover/subscription \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200 OK with { "subscription": null }

# Test 2: Jobs endpoint
curl https://api.lumiku.com/api/background-remover/jobs \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200 OK with { "jobs": [] }

# Test 3: Stats endpoint
curl https://api.lumiku.com/api/background-remover/stats \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200 OK with stats object
```

### Step 5: Test in Browser (1 min)

1. Open your app: https://lumiku.com/background-remover
2. Open browser console (F12)
3. Refresh page
4. Check Network tab - all API calls should be 200 OK ✅

---

## What Was Wrong?

**Root Cause**: Database migration was NEVER created for Background Remover models.

**What happened**:
1. ✅ Models added to `schema.prisma`
2. ✅ Backend code written and deployed
3. ✅ Frontend deployed
4. ❌ **Migration NEVER created** - tables don't exist
5. ❌ API calls fail with 500 errors

**What's fixed**:
- ✅ Creates 4 missing tables in database
- ✅ Adds all necessary indexes
- ✅ Sets up foreign keys
- ✅ Background Remover fully functional

---

## Expected Results

### Before Fix:
```
❌ /api/background-remover/subscription → 500 Internal Server Error
❌ /api/background-remover/jobs → 500 Internal Server Error
❌ /api/background-remover/stats → 500 Internal Server Error
```

### After Fix:
```
✅ /api/background-remover/subscription → 200 OK
✅ /api/background-remover/jobs → 200 OK
✅ /api/background-remover/stats → 200 OK
```

---

## Detailed Information

For complete technical analysis, see:
- `BACKGROUND_REMOVER_500_ERROR_DEBUG_REPORT.md` - Full investigation
- `CREATE_BACKGROUND_REMOVER_MIGRATION.md` - Migration guide
- `COPY_PASTE_FIX_BACKGROUND_REMOVER.sql` - SQL fix script

---

## Need Help?

If fix doesn't work:

1. **Check database logs** for SQL errors
2. **Check backend logs** for Prisma errors
3. **Verify tables exist**:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public' AND table_name LIKE 'Background%';
   ```
4. **Ensure backend rebuilt** after SQL execution
5. **Clear browser cache** and retry

---

## Timeline

- **NOW**: Run SQL in database
- **+5 min**: Rebuild backend
- **+7 min**: Test endpoints
- **+10 min**: FIXED ✅
