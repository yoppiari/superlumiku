# CRITICAL: Production Login Fix

## Issue Summary

**Status**: CRITICAL - Users cannot login
**Root Cause**: Database schema mismatch - `users` table missing Pose Generator columns
**Error**: `The column users.unlimitedPoseActive does not exist in the current database`

## Root Cause Analysis

### What Happened

1. Migration `20251014_add_avatar_creator_complete` was deployed
2. The migration created all Avatar Creator and Pose Generator **tables**
3. **BUT** it did NOT add the Pose Generator columns to the existing `users` table
4. Prisma schema expects these columns, but they don't exist in production database
5. Every login query fails with "column does not exist" error

### Why It Happened

The migration file only contained `CREATE TABLE` statements for new tables.
It was missing the `ALTER TABLE users` statements to add:
- `unlimitedPoseActive`
- `unlimitedPoseDailyQuota`
- `unlimitedPoseQuotaUsed`
- `unlimitedPoseQuotaResetAt`
- `unlimitedPoseExpiresAt`

## IMMEDIATE FIX (5 minutes)

### Step 1: Connect to Production Database

**Using Coolify Terminal**:

```bash
# Connect to PostgreSQL container
psql $DATABASE_URL
```

### Step 2: Add Missing Columns

Copy-paste this entire SQL block:

```sql
-- Add Pose Generator columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS "unlimitedPoseActive" BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "unlimitedPoseDailyQuota" INTEGER DEFAULT 100;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "unlimitedPoseQuotaUsed" INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "unlimitedPoseQuotaResetAt" TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "unlimitedPoseExpiresAt" TIMESTAMP;
```

### Step 3: Verify Columns Added

```sql
-- Check columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name LIKE 'unlimited%'
ORDER BY column_name;
```

**Expected output** (5 rows):
```
         column_name          |    data_type     | column_default
------------------------------+------------------+----------------
 unlimitedPoseActive          | boolean          | false
 unlimitedPoseDailyQuota      | integer          | 100
 unlimitedPoseExpiresAt       | timestamp        | NULL
 unlimitedPoseQuotaResetAt    | timestamp        | NULL
 unlimitedPoseQuotaUsed       | integer          | 0
```

### Step 4: Test Login

1. Exit psql: `\q`
2. Test login endpoint:

```bash
curl -X POST https://dev.lumiku.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-test-email@example.com",
    "password": "your-password"
  }'
```

**Expected**: `200 OK` with user data and token
**Before fix**: `500 Internal Server Error` with Prisma error

## Step 5: Mark Migration as Resolved

Now that columns are manually added, mark the migration as applied:

```bash
cd backend
bunx prisma migrate resolve --applied 20251014_add_avatar_creator_complete
bunx prisma migrate status
```

## Alternative Methods

### Method 1: Using Coolify Database UI

1. Go to Coolify Dashboard
2. Navigate to PostgreSQL database (UUID: `ycwc4s4ookos40k44gc8oooc`)
3. Click "Execute Query"
4. Paste the ALTER TABLE statements from Step 2
5. Click "Run Query"

### Method 2: Using Environment Variable

```bash
# From local machine with production DATABASE_URL
export DATABASE_URL="your-production-database-url"
psql $DATABASE_URL -f FIX_PRODUCTION_LOGIN_NOW.sql
```

## Verification Checklist

- [ ] Connected to production PostgreSQL database
- [ ] Executed all 5 ALTER TABLE statements
- [ ] Verified 5 columns returned from SELECT query
- [ ] Tested login endpoint - returns 200 OK
- [ ] Marked migration as resolved
- [ ] Verified `bunx prisma migrate status` shows no pending migrations

## Post-Fix Actions

### 1. Update Migration File (Prevent Future Issues)

The migration file should be updated to include these ALTER TABLE statements:

**File**: `backend/prisma/migrations/20251014_add_avatar_creator_complete/migration.sql`

Add at the end (before foreign key constraints):

```sql
-- ========================================
-- ALTER TABLE: users (Pose Generator Integration)
-- ========================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS "unlimitedPoseActive" BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "unlimitedPoseDailyQuota" INTEGER DEFAULT 100;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "unlimitedPoseQuotaUsed" INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "unlimitedPoseQuotaResetAt" TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "unlimitedPoseExpiresAt" TIMESTAMP;
```

### 2. Create Missing Migration

Alternatively, create a new migration for just the user columns:

```bash
cd backend

# Create new migration
bunx prisma migrate dev --name add_pose_unlimited_fields_to_users

# This will generate a migration file with just the ALTER TABLE statements
```

### 3. Test on Staging First

For future schema changes:
1. Test migration on staging database first
2. Verify all columns are created
3. Run `bunx prisma migrate status` to check for issues
4. Only then deploy to production

## Why This Happened

### Migration File Analysis

The migration file `20251014_add_avatar_creator_complete/migration.sql` contains:
- ✅ CREATE TABLE for 12 new tables (pose_categories, pose_library, etc.)
- ✅ CREATE INDEX for performance
- ✅ ALTER TABLE for foreign keys
- ❌ **MISSING** ALTER TABLE for users table columns

### Prisma Schema vs Database

**Prisma Schema** (schema.prisma):
```prisma
model User {
  // ... existing fields

  // Pose Generator Unlimited Tier
  unlimitedPoseActive       Boolean   @default(false)
  unlimitedPoseDailyQuota   Int       @default(100)
  unlimitedPoseQuotaUsed    Int       @default(0)
  unlimitedPoseQuotaResetAt DateTime?
  unlimitedPoseExpiresAt    DateTime?
}
```

**Production Database**: These columns don't exist!

### Migration State

```bash
bunx prisma migrate status
# Output:
# 20251014_add_avatar_creator_complete - FAILED
```

The migration was marked as FAILED, so Prisma won't apply it even on restart.

## How to Prevent This in Future

### 1. Always Test Migrations Locally

```bash
# Before deploying
cd backend

# Reset database (dev only!)
bunx prisma migrate reset

# Run all migrations fresh
bunx prisma migrate dev

# Verify schema matches
bunx prisma migrate status
```

### 2. Use Prisma Migrate Properly

**DON'T** manually create migration SQL files
**DO** use `prisma migrate dev` to auto-generate correct SQL

```bash
# Correct workflow:
# 1. Edit schema.prisma
# 2. Run migrate dev
bunx prisma migrate dev --name your_migration_name

# Prisma will:
# - Compare schema to database
# - Generate SQL with ALL necessary ALTER TABLE statements
# - Apply migration
# - Mark as applied
```

### 3. Check Migration SQL Before Deploy

Always review generated migration SQL:

```bash
# After prisma migrate dev
cat prisma/migrations/XXXXXXXX_migration_name/migration.sql
```

Look for:
- ✅ All expected tables created
- ✅ All expected columns added
- ✅ All indexes created
- ✅ All foreign keys set

### 4. Staging Environment Testing

1. Deploy to staging first
2. Run migrations
3. Check `prisma migrate status`
4. Test all endpoints (login, register, etc.)
5. Only then deploy to production

## Technical Details

### Database Connection

```bash
# Production database
Host: PostgreSQL container in Coolify
Port: 5432
Database: lumiku_production
Connection: Via DATABASE_URL environment variable
```

### Affected Tables

**Direct Impact**:
- `users` table - missing 5 columns

**Indirect Impact**:
- All login queries fail
- User sessions cannot be validated
- Dashboard loads fail (no user data)

### Affected Queries

Every query that selects from `users` table fails:

```typescript
// This fails:
const user = await prisma.user.findUnique({
  where: { email: userEmail }
});

// Error: The column `users.unlimitedPoseActive` does not exist
```

### Why Login Specifically?

Login is the first query that:
1. Selects all user fields (including new Pose Generator fields)
2. Prisma client expects these fields based on schema
3. PostgreSQL returns error because columns don't exist
4. API returns 500 error to client

## Recovery Time

**Estimated**: 5 minutes
- 1 min: Connect to database
- 1 min: Run ALTER TABLE statements
- 1 min: Verify columns added
- 1 min: Test login
- 1 min: Mark migration resolved

## Communication Template

**To Users**:
```
We're experiencing a temporary login issue.
Our team is actively working on a fix.
ETA: 5 minutes

Update: Login has been restored. Thank you for your patience.
```

**To Team**:
```
CRITICAL: Production login broken
Cause: Missing database columns
Fix: Running ALTER TABLE statements now
ETA: 5 minutes
Status: IN PROGRESS / RESOLVED
```

## Success Criteria

Login is considered fixed when:
- ✅ All 5 columns exist in `users` table
- ✅ Login endpoint returns 200 OK
- ✅ User data includes new fields
- ✅ Dashboard loads without errors
- ✅ Migration marked as resolved
- ✅ No Prisma errors in logs

## Files Involved

**SQL Fix Script**:
- `FIX_PRODUCTION_LOGIN_NOW.sql` - Ready to run in production

**Migration File** (needs update):
- `backend/prisma/migrations/20251014_add_avatar_creator_complete/migration.sql`

**Prisma Schema**:
- `backend/prisma/schema.prisma` - Already correct

## Support

If issues persist after fix:

1. Check Prisma logs:
```bash
pm2 logs backend --lines 100 | grep prisma
```

2. Verify database connection:
```bash
psql $DATABASE_URL -c "SELECT version();"
```

3. Check migration status:
```bash
cd backend && bunx prisma migrate status
```

4. Regenerate Prisma client:
```bash
cd backend && bunx prisma generate
pm2 restart backend
```

---

**Priority**: P0 - CRITICAL
**Impact**: All users cannot login
**Estimated Fix Time**: 5 minutes
**Risk Level**: Low (ALTER TABLE with IF NOT EXISTS is safe)
