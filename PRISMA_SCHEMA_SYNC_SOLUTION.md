# Prisma Schema Synchronization Fix - Production Database

## Issue Summary

**Problem**: POST /api/apps/avatar-creator/projects fails with:
```
The column `avatars.personaName` does not exist in the current database
```

**Root Cause**: Production database does NOT have Avatar Creator tables at all. The Prisma schema.prisma has the complete Avatar Creator model, but migrations haven't been applied to production database.

**Analysis**:
- Initial migration (20250930134808_init) created base tables (users, sessions, credits, etc.)
- Avatar Creator tables were never migrated to production
- Migration 20251011_avatar_pose_split tries to ALTER tables that don't exist
- DRAFT_avatar_creator.sql has the correct schema but was never executed

## Production Database State

**Tables that EXIST**:
- users, sessions, devices
- credits, payments
- app_usages, tool_configs
- video_mixer_*, carousel_*, looping_flow_*
- ai_models, subscription_*, quota_usages, model_usages

**Tables that DO NOT EXIST** (need to be created):
- avatar_projects
- avatars
- avatar_presets
- persona_examples
- avatar_usage_history
- avatar_generations
- pose_categories
- pose_library
- pose_generator_projects
- pose_generations
- generated_poses
- pose_selections
- pose_requests

## Solution: Prisma Migrate Deploy

We need to create a proper migration that adds all Avatar Creator and Pose Generator tables to the production database.

### Step 1: Create Migration (Local - Development)

This generates the migration SQL based on schema.prisma:

```bash
# Navigate to backend directory
cd backend

# Create migration for Avatar Creator tables
npx prisma migrate dev --name add_avatar_creator_and_pose_generator --create-only

# This will create: backend/prisma/migrations/[timestamp]_add_avatar_creator_and_pose_generator/migration.sql
```

**Important**: Use `--create-only` to generate the migration WITHOUT applying it locally. This allows you to review the SQL first.

### Step 2: Review Generated Migration

The migration should contain CREATE TABLE statements for:
- avatar_projects
- avatars (with personaName, personaAge, personaPersonality, personaBackground)
- avatar_presets
- persona_examples
- avatar_usage_history
- avatar_generations
- All Pose Generator tables

### Step 3: Deploy to Production (Coolify Terminal)

#### Method A: Using Prisma Migrate Deploy (Recommended)

```bash
# SSH into Coolify container
# In Coolify UI: Application > Terminal

# Navigate to app directory
cd /app

# Deploy pending migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Restart application
pm2 restart backend
```

#### Method B: Manual SQL Execution (Fallback)

If Prisma migrate fails, manually execute SQL:

```bash
# Connect to PostgreSQL
psql $DATABASE_URL

# Execute migration SQL
\i /app/prisma/migrations/[timestamp]_add_avatar_creator_and_pose_generator/migration.sql

# Verify tables created
\dt avatar*
\dt pose*

# Exit psql
\q

# Generate Prisma Client
npx prisma generate

# Restart application
pm2 restart backend
```

## Pre-Migration Checklist

- [ ] **Backup Production Database** (CRITICAL!)
  ```bash
  # In Coolify terminal
  pg_dump $DATABASE_URL > /app/backups/pre_avatar_migration_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] **Verify DATABASE_URL is set**
  ```bash
  echo $DATABASE_URL
  ```

- [ ] **Check Prisma migration status**
  ```bash
  npx prisma migrate status
  ```

- [ ] **Verify no pending local changes**
  ```bash
  git status
  ```

## Step-by-Step Execution Plan

### Phase 1: Preparation (5 minutes)

1. **Create database backup**
   ```bash
   # In Coolify terminal
   pg_dump $DATABASE_URL > /app/backups/backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Check migration status**
   ```bash
   cd /app/backend
   npx prisma migrate status
   ```

3. **Expected output**:
   ```
   Following migration have not been applied:
   20251011_avatar_pose_split
   ```

### Phase 2: Fix Migration (10 minutes)

**Problem**: The `20251011_avatar_pose_split` migration is WRONG. It tries to ALTER tables that don't exist.

**Solution**: We need to replace it with CREATE TABLE statements.

#### Option A: Delete bad migration and regenerate

```bash
# In local development (NOT production!)
cd backend

# Delete bad migration
rm -rf prisma/migrations/20251011_avatar_pose_split

# Create fresh migration
npx prisma migrate dev --name add_avatar_creator_complete

# Review the generated SQL
cat prisma/migrations/[timestamp]_add_avatar_creator_complete/migration.sql

# If it looks good, commit and deploy
git add prisma/migrations/
git commit -m "fix: Add complete Avatar Creator migration with CREATE TABLE statements"
git push
```

#### Option B: Fix migration SQL directly

Edit `backend/prisma/migrations/20251011_avatar_pose_split/migration.sql` and replace with:

```sql
-- Migration: Add Avatar Creator and Pose Generator tables
-- Date: 2025-10-14

-- ========================================
-- CREATE TABLE: avatar_projects
-- ========================================

CREATE TABLE IF NOT EXISTS "avatar_projects" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "avatar_projects_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "avatar_projects_userId_idx" ON "avatar_projects"("userId");
CREATE INDEX IF NOT EXISTS "avatar_projects_userId_createdAt_idx" ON "avatar_projects"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "avatar_projects_userId_updatedAt_idx" ON "avatar_projects"("userId", "updatedAt" DESC);

-- ========================================
-- CREATE TABLE: avatars
-- ========================================

CREATE TABLE IF NOT EXISTS "avatars" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseImageUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "personaName" TEXT,
    "personaAge" INTEGER,
    "personaPersonality" TEXT,
    "personaBackground" TEXT,
    "gender" TEXT,
    "ageRange" TEXT,
    "ethnicity" TEXT,
    "bodyType" TEXT,
    "hairStyle" TEXT,
    "hairColor" TEXT,
    "eyeColor" TEXT,
    "skinTone" TEXT,
    "style" TEXT,
    "sourceType" TEXT NOT NULL,
    "generationPrompt" TEXT,
    "seedUsed" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "avatars_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "avatars_userId_idx" ON "avatars"("userId");
CREATE INDEX IF NOT EXISTS "avatars_projectId_idx" ON "avatars"("projectId");
CREATE INDEX IF NOT EXISTS "avatars_sourceType_idx" ON "avatars"("sourceType");
CREATE INDEX IF NOT EXISTS "avatars_userId_usageCount_idx" ON "avatars"("userId", "usageCount" DESC);
CREATE INDEX IF NOT EXISTS "avatars_userId_lastUsedAt_idx" ON "avatars"("userId", "lastUsedAt" DESC);
CREATE INDEX IF NOT EXISTS "avatars_userId_createdAt_idx" ON "avatars"("userId", "createdAt" DESC);

-- Add Foreign Keys
ALTER TABLE "avatars" ADD CONSTRAINT "avatars_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "avatar_projects"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ========================================
-- CREATE TABLE: avatar_presets
-- ========================================

CREATE TABLE IF NOT EXISTS "avatar_presets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "previewImageUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "personaTemplate" TEXT NOT NULL,
    "visualAttributes" TEXT NOT NULL,
    "generationPrompt" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "avatar_presets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "avatar_presets_category_idx" ON "avatar_presets"("category");
CREATE INDEX IF NOT EXISTS "avatar_presets_isPublic_idx" ON "avatar_presets"("isPublic");
CREATE INDEX IF NOT EXISTS "avatar_presets_category_isPublic_idx" ON "avatar_presets"("category", "isPublic");
CREATE INDEX IF NOT EXISTS "avatar_presets_usageCount_idx" ON "avatar_presets"("usageCount" DESC);

-- ========================================
-- CREATE TABLE: persona_examples
-- ========================================

CREATE TABLE IF NOT EXISTS "persona_examples" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "personaName" TEXT NOT NULL,
    "personaAge" INTEGER NOT NULL,
    "personaPersonality" TEXT NOT NULL,
    "personaBackground" TEXT NOT NULL,
    "suggestedAttributes" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "persona_examples_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "persona_examples_category_idx" ON "persona_examples"("category");
CREATE INDEX IF NOT EXISTS "persona_examples_isActive_idx" ON "persona_examples"("isActive");
CREATE INDEX IF NOT EXISTS "persona_examples_category_isActive_displayOrder_idx" ON "persona_examples"("category", "isActive", "displayOrder");

-- ========================================
-- CREATE TABLE: avatar_usage_history
-- ========================================

CREATE TABLE IF NOT EXISTS "avatar_usage_history" (
    "id" TEXT NOT NULL,
    "avatarId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "appName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avatar_usage_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "avatar_usage_history_avatarId_idx" ON "avatar_usage_history"("avatarId");
CREATE INDEX IF NOT EXISTS "avatar_usage_history_userId_idx" ON "avatar_usage_history"("userId");
CREATE INDEX IF NOT EXISTS "avatar_usage_history_appId_idx" ON "avatar_usage_history"("appId");
CREATE INDEX IF NOT EXISTS "avatar_usage_history_avatarId_createdAt_idx" ON "avatar_usage_history"("avatarId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "avatar_usage_history_userId_createdAt_idx" ON "avatar_usage_history"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "avatar_usage_history_appId_createdAt_idx" ON "avatar_usage_history"("appId", "createdAt");
CREATE INDEX IF NOT EXISTS "avatar_usage_history_referenceId_referenceType_idx" ON "avatar_usage_history"("referenceId", "referenceType");

ALTER TABLE "avatar_usage_history" ADD CONSTRAINT "avatar_usage_history_avatarId_fkey"
    FOREIGN KEY ("avatarId") REFERENCES "avatars"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ========================================
-- CREATE TABLE: avatar_generations
-- ========================================

CREATE TABLE IF NOT EXISTS "avatar_generations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "avatarId" TEXT,
    "projectId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "prompt" TEXT NOT NULL,
    "options" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "avatar_generations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "avatar_generations_userId_idx" ON "avatar_generations"("userId");
CREATE INDEX IF NOT EXISTS "avatar_generations_status_idx" ON "avatar_generations"("status");
CREATE INDEX IF NOT EXISTS "avatar_generations_projectId_idx" ON "avatar_generations"("projectId");
CREATE INDEX IF NOT EXISTS "avatar_generations_avatarId_idx" ON "avatar_generations"("avatarId");
CREATE INDEX IF NOT EXISTS "avatar_generations_userId_status_idx" ON "avatar_generations"("userId", "status");
CREATE INDEX IF NOT EXISTS "avatar_generations_userId_createdAt_idx" ON "avatar_generations"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "avatar_generations_status_createdAt_idx" ON "avatar_generations"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "avatar_generations_projectId_createdAt_idx" ON "avatar_generations"("projectId", "createdAt" DESC);

-- ========================================
-- Pose Generator Tables (if needed)
-- Add similar CREATE TABLE statements for:
-- - pose_categories
-- - pose_library
-- - pose_generator_projects
-- - pose_generations
-- - generated_poses
-- - pose_selections
-- - pose_requests
-- ========================================
```

### Phase 3: Deploy Migration (5 minutes)

After fixing the migration locally and pushing to repo:

```bash
# In Coolify UI: Trigger redeploy or wait for automatic deployment

# Once deployed, SSH into Coolify terminal
cd /app/backend

# Deploy migration
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Restart backend
pm2 restart backend
```

### Phase 4: Verification (5 minutes)

```bash
# 1. Check tables exist
psql $DATABASE_URL -c "\dt avatar*"

# Expected output:
#  Schema |       Name           | Type  |  Owner
# --------+----------------------+-------+----------
#  public | avatar_generations   | table | postgres
#  public | avatar_presets       | table | postgres
#  public | avatar_projects      | table | postgres
#  public | avatar_usage_history | table | postgres
#  public | avatars              | table | postgres
#  public | persona_examples     | table | postgres

# 2. Check avatars table has personaName column
psql $DATABASE_URL -c "\d avatars"

# Expected output should include:
#  personaName          | text                        |           |          |
#  personaAge           | integer                     |           |          |
#  personaPersonality   | text                        |           |          |
#  personaBackground    | text                        |           |          |

# 3. Test API endpoint
curl -X POST https://dev.lumiku.com/api/apps/avatar-creator/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Project","description":"Migration test"}'

# Expected: 201 Created with project JSON

# 4. Check application logs
pm2 logs backend --lines 50
```

### Phase 5: Seed Data (Optional)

If Avatar Creator needs seed data (presets, examples):

```bash
cd /app/backend
npx prisma db seed
```

## Rollback Plan

If migration fails or causes issues:

### Immediate Rollback

```bash
# 1. Restore database from backup
psql $DATABASE_URL < /app/backups/backup_[timestamp].sql

# 2. Revert application to previous deployment
# In Coolify UI: Deployments > Select previous successful deployment > Redeploy

# 3. Verify application is working
curl https://dev.lumiku.com/api/health
```

### Prisma Migration Rollback

Prisma doesn't have built-in rollback, so you must:

```bash
# 1. Mark migration as rolled back in _prisma_migrations table
psql $DATABASE_URL

UPDATE "_prisma_migrations"
SET rolled_back_at = NOW()
WHERE migration_name = '20251011_avatar_pose_split';

\q

# 2. Manually drop created tables
psql $DATABASE_URL

DROP TABLE IF EXISTS "avatar_generations" CASCADE;
DROP TABLE IF EXISTS "avatar_usage_history" CASCADE;
DROP TABLE IF EXISTS "avatars" CASCADE;
DROP TABLE IF EXISTS "avatar_presets" CASCADE;
DROP TABLE IF EXISTS "persona_examples" CASCADE;
DROP TABLE IF EXISTS "avatar_projects" CASCADE;

\q
```

## Quick Fix Commands (Copy-Paste Ready)

### For Coolify Terminal

```bash
# Backup first (REQUIRED!)
pg_dump $DATABASE_URL > /app/backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Navigate to app
cd /app/backend

# Check migration status
npx prisma migrate status

# Deploy migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Restart backend
pm2 restart backend

# Verify tables created
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'avatar%' OR table_name LIKE 'pose%';"

# Test endpoint
curl -X GET https://dev.lumiku.com/api/apps/avatar-creator/projects \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Expected Timeline

- Backup: 2 minutes
- Migration generation (local): 5 minutes
- Commit & push: 2 minutes
- Coolify deployment: 3-5 minutes
- Migration execution: 1-2 minutes
- Verification: 3 minutes

**Total**: ~15-20 minutes

## Success Criteria

- [ ] All avatar_* and pose_* tables exist in production database
- [ ] avatars table has personaName, personaAge, personaPersonality, personaBackground columns
- [ ] POST /api/apps/avatar-creator/projects returns 201 Created
- [ ] GET /api/apps/avatar-creator/projects returns 200 OK
- [ ] No Prisma client errors in application logs
- [ ] Avatar Creator visible and functional in dashboard

## Post-Migration Actions

1. **Test full Avatar Creator workflow**:
   - Create project
   - Upload avatar
   - View avatar details
   - Delete project

2. **Monitor application logs** for 30 minutes:
   ```bash
   pm2 logs backend --lines 100 --follow
   ```

3. **Update documentation** with migration timestamp

4. **Notify team** of successful migration

## Troubleshooting

### Error: "Migration 20251011_avatar_pose_split failed"

**Cause**: Migration tries to ALTER tables that don't exist.

**Fix**: Replace migration SQL with CREATE TABLE statements (see Phase 2).

### Error: "relation 'avatars' already exists"

**Cause**: Tables were partially created.

**Fix**:
```bash
# Check what exists
psql $DATABASE_URL -c "\dt avatar*"

# If incomplete, drop and recreate
DROP TABLE IF EXISTS "avatars" CASCADE;
# Then re-run migration
```

### Error: "Prisma Client not generated"

**Fix**:
```bash
npx prisma generate
pm2 restart backend
```

### Application still shows 500 error after migration

**Check**:
1. Prisma Client regenerated? `npx prisma generate`
2. Backend restarted? `pm2 restart backend`
3. DATABASE_URL correct? `echo $DATABASE_URL`
4. Migration actually applied? `npx prisma migrate status`

## Contact Information

If migration fails or you encounter issues:
- Check application logs: `pm2 logs backend`
- Check database logs: `psql $DATABASE_URL`
- Review this document's Rollback Plan section
- Contact DevOps team with migration timestamp and error messages
