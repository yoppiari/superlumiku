# Avatar Creator Database Schema Fix Guide

## Executive Summary

**Status**: ✅ MIGRATION EXISTS - Need to Apply to Production
**Issue**: `avatar_generations` table missing `projectId` column in production
**Root Cause**: Migration `20251014_add_avatar_creator_complete` not applied to production database
**Solution**: Deploy pending migrations to production
**Estimated Time**: 5-10 minutes
**Risk Level**: LOW (migration uses transactions and IF NOT EXISTS)

---

## Error Analysis

### Error 1: Database Column Missing
```
Invalid `prisma.avatarGeneration.create()` invocation:
The column 'projectId' does not exist in the current database.
```

**What this means**: The production database is missing the `projectId` column in the `avatar_generations` table, but the application code expects it to exist.

### Root Cause
The migration file `20251014_add_avatar_creator_complete/migration.sql` creates the complete schema including:
- `avatar_projects` table
- `avatars` table
- `avatar_generations` table (with `projectId` column - line 173)
- All other Avatar Creator tables

**However**, this migration was never executed in production. The seed script ran successfully (which is why Avatar Creator appears in dashboard), but the actual table creation didn't happen.

---

## Migration File Analysis

### File: `backend/prisma/migrations/20251014_add_avatar_creator_complete/migration.sql`

**Key Points**:
1. ✅ Uses `BEGIN`/`COMMIT` transaction (line 8, 474)
2. ✅ Uses `IF NOT EXISTS` for safety (won't fail if tables exist)
3. ✅ Creates `avatar_generations` with all required columns:
   - `id` (PRIMARY KEY)
   - `userId` (NOT NULL)
   - `avatarId` (nullable)
   - **`projectId` (NOT NULL)** ← This is what's missing!
   - `status` (default 'pending')
   - `prompt` (TEXT NOT NULL)
   - `options` (TEXT)
   - `errorMessage` (TEXT)
   - `createdAt` (timestamp)
   - `completedAt` (timestamp)

4. ✅ Creates proper indexes for performance
5. ✅ No foreign key on `projectId` (avoiding circular dependency issues)

**Why it's safe to run**:
- Transaction-based (all-or-nothing)
- IF NOT EXISTS prevents errors
- Won't affect existing data (creates new tables)

---

## Step-by-Step Fix Procedure

### Phase 1: Diagnostic (Check Current State)

**Run these commands in Coolify Terminal** (Container: `d8ggwoo484k8ok48g8k8cgwk-*`):

```bash
# Step 1: Check migration status
cd backend
bunx prisma migrate status
```

**Expected Output**:
```
Database schema is not up to date
The following migrations have not been applied:
  20251014_add_avatar_creator_complete
  20251015_add_recovery_indexes
  20251015_add_variation_key_to_generated_pose
  20251016_p2_performance_indexes
```

```bash
# Step 2: Verify avatar_generations table doesn't exist (or is incomplete)
psql $DATABASE_URL -c "\d avatar_generations"
```

**Expected Output** (one of these):
- "Did not find any relation named avatar_generations" ← Table doesn't exist
- Table exists but missing `projectId` column ← Partial schema

```bash
# Step 3: Check if avatar_projects exists (for safety)
psql $DATABASE_URL -c "\d avatar_projects"
```

---

### Phase 2: Apply Migrations

**IMPORTANT**: These commands must be run in the **application container**, not the database container.

```bash
# Step 1: Navigate to backend directory
cd /app/backend

# Step 2: Apply all pending migrations
bunx prisma migrate deploy

# Expected output:
# Applying migration `20251014_add_avatar_creator_complete`
# Applying migration `20251015_add_recovery_indexes`
# Applying migration `20251015_add_variation_key_to_generated_pose`
# Applying migration `20251016_p2_performance_indexes`
# ✓ All migrations applied successfully
```

**Alternative** (if you want to be extra cautious):

```bash
# Apply migrations one at a time
cd /app/backend

# First: Avatar Creator tables
bunx prisma migrate resolve --applied 20251014_add_avatar_creator_complete

# Then run deploy to apply remaining
bunx prisma migrate deploy
```

---

### Phase 3: Verification

**Run these queries to confirm the fix**:

```bash
# Step 1: Check migration status (should be clean)
bunx prisma migrate status

# Expected: "No pending migrations"
```

```bash
# Step 2: Verify avatar_generations table structure
psql $DATABASE_URL -c "
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'avatar_generations'
ORDER BY ordinal_position;
"
```

**Expected Output** (should include):
```
     column_name     |          data_type          | is_nullable | column_default
---------------------+-----------------------------+-------------+----------------
 id                  | text                        | NO          |
 userId              | text                        | NO          |
 avatarId            | text                        | YES         |
 projectId           | text                        | NO          | ← THIS MUST EXIST!
 status              | text                        | NO          | 'pending'
 prompt              | text                        | NO          |
 options             | text                        | YES         |
 errorMessage        | text                        | YES         |
 createdAt           | timestamp(3)...             | NO          | CURRENT_TIMESTAMP
 completedAt         | timestamp(3)...             | YES         |
```

```bash
# Step 3: Verify indexes were created
psql $DATABASE_URL -c "
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'avatar_generations'
ORDER BY indexname;
"
```

**Expected**: Should see 8 indexes:
- `avatar_generations_pkey`
- `avatar_generations_userId_idx`
- `avatar_generations_status_idx`
- `avatar_generations_projectId_idx` ← Important!
- `avatar_generations_avatarId_idx`
- `avatar_generations_userId_status_idx`
- `avatar_generations_userId_createdAt_idx`
- `avatar_generations_status_createdAt_idx`
- `avatar_generations_projectId_createdAt_idx`

```bash
# Step 4: Check all Avatar Creator tables exist
psql $DATABASE_URL -c "
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'avatar_%'
ORDER BY table_name;
"
```

**Expected Output**:
```
        table_name
--------------------------
 avatar_generations
 avatar_presets
 avatar_projects
 avatar_usage_history
 avatars
```

---

### Phase 4: Functional Test

**Test avatar generation via API**:

```bash
# Get auth token first (replace with actual user credentials)
TOKEN=$(curl -s -X POST https://dev.lumiku.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@lumiku.com","password":"password"}' \
  | jq -r '.token')

# Test avatar generation endpoint
curl -X POST https://dev.lumiku.com/api/apps/avatar-creator/avatars/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "test-project-123",
    "prompt": "Professional business avatar, 30s, friendly smile"
  }' | jq
```

**Expected Output** (SUCCESS):
```json
{
  "success": true,
  "generation": {
    "id": "clxxx...",
    "status": "pending",
    "projectId": "test-project-123",
    "prompt": "Professional business avatar...",
    "createdAt": "2025-10-17T..."
  }
}
```

**If you get this, the fix worked!** ✅

---

## Troubleshooting

### Issue 1: "Migration already applied" error

**Symptoms**:
```
Migration `20251014_add_avatar_creator_complete` was already applied.
```

**Solution**:
This is actually good! It means the migration ran. But if the column is still missing:

```bash
# Check if tables exist but are incomplete
psql $DATABASE_URL -c "\d avatar_generations"

# If projectId is missing, the migration might have failed partway
# Check migration history
psql $DATABASE_URL -c "SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;"

# If status is 'failed', you need to manually fix
# See "Manual Fix" section below
```

---

### Issue 2: Migration fails with "relation already exists"

**Symptoms**:
```
ERROR: relation "avatar_projects" already exists
```

**Solution**:
The migration uses `CREATE TABLE IF NOT EXISTS`, so this shouldn't happen. But if it does:

```bash
# Mark migration as applied without running it
bunx prisma migrate resolve --applied 20251014_add_avatar_creator_complete

# Then verify tables manually
psql $DATABASE_URL -c "\d avatar_generations"
```

---

### Issue 3: Permission denied errors

**Symptoms**:
```
ERROR: permission denied for schema public
```

**Solution**:
```bash
# Check database user permissions
psql $DATABASE_URL -c "SELECT current_user, current_database();"

# If user doesn't have CREATE permission, contact DBA
# Alternatively, run migration as superuser:
psql -U postgres $DATABASE_URL -f backend/prisma/migrations/20251014_add_avatar_creator_complete/migration.sql
```

---

### Manual Fix (Last Resort)

If migrations completely fail, you can manually create the missing column:

```sql
-- ONLY USE IF MIGRATION FAILS!
-- Connect to database
psql $DATABASE_URL

-- Add missing column
BEGIN;

ALTER TABLE avatar_generations
ADD COLUMN IF NOT EXISTS "projectId" TEXT;

-- Make it NOT NULL (but set default temporarily for existing rows)
UPDATE avatar_generations SET "projectId" = 'unknown' WHERE "projectId" IS NULL;
ALTER TABLE avatar_generations ALTER COLUMN "projectId" SET NOT NULL;

-- Add index
CREATE INDEX IF NOT EXISTS "avatar_generations_projectId_idx"
ON "avatar_generations"("projectId");

CREATE INDEX IF NOT EXISTS "avatar_generations_projectId_createdAt_idx"
ON "avatar_generations"("projectId", "createdAt" DESC);

COMMIT;

-- Mark migration as applied
\q
bunx prisma migrate resolve --applied 20251014_add_avatar_creator_complete
```

---

## Post-Deployment Checklist

After running the migration:

- [ ] ✅ `bunx prisma migrate status` shows no pending migrations
- [ ] ✅ `avatar_generations` table has `projectId` column
- [ ] ✅ All indexes created successfully
- [ ] ✅ API test returns success (not 500 error)
- [ ] ✅ Frontend shows Avatar Creator in dashboard
- [ ] ✅ Can open Avatar Creator app without errors
- [ ] ✅ Can create project successfully
- [ ] ✅ Avatar generation request doesn't fail with column error
- [ ] ✅ Credits deducted correctly

---

## Quick Reference Commands

**Copy-paste these into Coolify Terminal**:

```bash
# Full diagnostic and fix
cd /app/backend

# 1. Check status
echo "=== Migration Status ===" && bunx prisma migrate status

# 2. Apply migrations
echo "=== Applying Migrations ===" && bunx prisma migrate deploy

# 3. Verify schema
echo "=== Verifying Schema ===" && psql $DATABASE_URL -c "\d avatar_generations"

# 4. Check columns
echo "=== Column List ===" && psql $DATABASE_URL -c "
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'avatar_generations'
ORDER BY ordinal_position;
"

# 5. Final status check
echo "=== Final Status ===" && bunx prisma migrate status
```

**Expected Total Runtime**: ~2 minutes

---

## Why This Happened

The issue occurred because:

1. **Seed script ran successfully** - Added AI models to `ai_models` table
   - This made Avatar Creator visible in dashboard
   - Seed doesn't require the full schema

2. **Migration did NOT run** - Tables were never created
   - `prisma migrate deploy` was not executed in production
   - Or migration failed silently

3. **Frontend worked** - Dashboard queries only need `ai_models` table
   - Avatar Creator appeared in app list
   - Opening the app loaded the UI

4. **Backend failed** - Avatar generation needs `avatar_generations` table
   - Prisma client expects schema to match `schema.prisma`
   - Column `projectId` exists in schema but not in database
   - Result: "Column 'projectId' does not exist" error

**Prevention**:
- Always run `prisma migrate deploy` after code deployment
- Add migration check to deployment pipeline
- Monitor Prisma migration logs in production

---

## Additional Context

### Related Files
- **Schema**: `backend/prisma/schema.prisma` (lines 764-926)
- **Migration**: `backend/prisma/migrations/20251014_add_avatar_creator_complete/migration.sql`
- **Seed**: `backend/prisma/seeds/avatar-creator.seed.ts`
- **API**: `backend/src/apps/avatar-creator/routes/avatars.routes.ts`

### Database Info
- **Container**: `d8ggwoo484k8ok48g8k8cgwk-*` (app container)
- **Database**: `ycwc4s4ookos40k44gc8oooc` (database container)
- **Connection**: Use `$DATABASE_URL` environment variable

### Support
If issues persist:
1. Check Coolify logs: App → Logs → Last 500 lines
2. Check database logs: Database → Logs
3. Verify environment variables: App → Environment
4. Contact: Create GitHub issue with error logs

---

## Success Indicators

After fix, you should see:

1. **Dashboard**: ✅ Avatar Creator visible
2. **App Open**: ✅ No console errors
3. **Project Create**: ✅ Success message
4. **Avatar Generate**: ✅ "Generation started" message
5. **Database**: ✅ Row inserted in `avatar_generations`
6. **API**: ✅ 200 response (not 500)
7. **Credits**: ✅ Deducted from balance

**Time to full functionality**: ~5 minutes after migration completes

---

## Next Steps After Fix

1. **Test Avatar Upload**: Upload an image to create avatar
2. **Test AI Generation**: Generate avatar from text prompt
3. **Test Credit System**: Verify credits deducted correctly
4. **Test Project Management**: Create/edit/delete projects
5. **Monitor Logs**: Watch for any other schema-related errors
6. **Update Documentation**: Document the deployment process

---

**Last Updated**: 2025-10-17
**Status**: Ready for execution
**Estimated Fix Time**: 5-10 minutes
