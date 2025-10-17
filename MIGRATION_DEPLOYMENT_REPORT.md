# Migration Deployment Report - Production Database Schema Sync

**Date**: 2025-10-16
**Environment**: Production (dev.lumiku.com)
**Database**: PostgreSQL (via Coolify)
**Status**: Ready for Manual Execution

---

## Executive Summary

The production database schema is out of sync with the Prisma schema. After force-deleting the "Professional Muda" project, missing columns were detected. This report provides the deployment plan and step-by-step instructions to sync the schema safely.

---

## Missing Columns Detected

### 1. `avatar_generations` Table
- **Missing**: `avatarId` (TEXT, nullable)
- **Missing**: `projectId` (TEXT, not null)
- **Impact**: Avatar generation operations will fail
- **Resolved by**: Migration `20251014_add_avatar_creator_complete`

### 2. `pose_generations` Table
- **Missing**: `generationType` (TEXT, not null)
- **Impact**: Pose generation operations will fail
- **Resolved by**: Migration `20251014_add_avatar_creator_complete`

---

## Pending Migrations Analysis

Total migrations found: **22**

### Migrations to be Applied (Expected 4):

1. **20251014_add_avatar_creator_complete** (PRIMARY FIX)
   - Creates all Avatar Creator tables
   - Creates all Pose Generator tables
   - Adds missing columns to `avatar_generations` and `pose_generations`
   - Adds user columns for Pose Generator unlimited tier
   - **Status**: Contains the critical schema fixes

2. **20251015_add_recovery_indexes**
   - Adds performance indexes for recovery operations
   - **Status**: Safe to apply

3. **20251015_add_variation_key_to_generated_pose**
   - Adds `variationKey` column to `generated_poses` table
   - **Status**: Safe to apply

4. **20251016_p2_performance_indexes**
   - Adds P2 performance optimization indexes
   - **Status**: Safe to apply

---

## Migration Safety Analysis

### ✅ Safe to Deploy

All pending migrations are **production-safe**:
- Use `CREATE TABLE IF NOT EXISTS` (idempotent)
- Use `CREATE INDEX IF NOT EXISTS` (idempotent)
- Use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` (idempotent)
- Wrapped in transactions (atomic operations)
- No data modifications
- No column drops
- No destructive operations

### 🛡️ Rollback Strategy

**Automatic Rollback**: If any statement fails, Prisma will:
1. Halt migration execution
2. Rollback the entire transaction
3. Report the error
4. Leave database in original state

**Manual Rollback**: Not needed (automatic transaction rollback)

---

## Deployment Instructions

### Option 1: Simple Command (Recommended)

1. **Access Coolify Terminal**:
   - Navigate to: Coolify > Applications > Lumiku > Terminal

2. **Run these commands** (one by one):
   ```bash
   cd /app/backend
   npx prisma migrate status
   npx prisma migrate deploy
   npx prisma migrate status
   ```

3. **Expected Output**:
   ```
   Prisma Migrate applied the following migration(s):

   migrations/
     └─ 20251014_add_avatar_creator_complete/
         └─ migration.sql
     └─ 20251015_add_recovery_indexes/
         └─ migration.sql
     └─ 20251015_add_variation_key_to_generated_pose/
         └─ migration.sql
     └─ 20251016_p2_performance_indexes/
         └─ migration.sql
   ```

### Option 2: Full Verification Script

Use the script: `DEPLOY_MIGRATIONS_NOW.sh`

Copy the entire script content and paste into Coolify terminal.

**Features**:
- ✅ Checks database connectivity
- ✅ Shows migration status before and after
- ✅ Deploys migrations
- ✅ Verifies missing columns now exist
- ✅ Shows recently applied migrations

### Option 3: Step-by-Step Manual Commands

Use the file: `SIMPLE_MIGRATION_DEPLOY.txt`

Contains individual commands with explanations for manual execution.

---

## Post-Deployment Verification

### Step 1: Verify Columns Exist

Run in Coolify terminal:

```bash
# Check avatar_generations columns
npx prisma db execute --stdin <<'EOF'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'avatar_generations'
AND column_name IN ('avatarId', 'projectId')
ORDER BY column_name;
EOF

# Expected output:
# column_name | data_type | is_nullable
# ------------+-----------+------------
# avatarId    | text      | YES
# projectId   | text      | NO
```

```bash
# Check pose_generations column
npx prisma db execute --stdin <<'EOF'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'pose_generations'
AND column_name = 'generationType'
ORDER BY column_name;
EOF

# Expected output:
# column_name     | data_type | is_nullable
# ----------------+-----------+------------
# generationType  | text      | NO
```

### Step 2: Verify Migrations Applied

```bash
npx prisma db execute --stdin <<'EOF'
SELECT migration_name, finished_at, rolled_back_at
FROM _prisma_migrations
ORDER BY finished_at DESC
LIMIT 5;
EOF
```

**Expected output** (recent migrations):
- `20251016_p2_performance_indexes`
- `20251015_add_variation_key_to_generated_pose`
- `20251015_add_recovery_indexes`
- `20251014_add_avatar_creator_complete`

### Step 3: Check Application Health

```bash
# Test health endpoint
curl https://dev.lumiku.com/health

# Expected response:
# {"status": "ok", "timestamp": "..."}
```

### Step 4: Test Avatar Creator

1. **Access Application**: https://dev.lumiku.com
2. **Login**: Use test credentials
3. **Navigate to Avatar Creator**
4. **Verify**:
   - ✅ Page loads without errors
   - ✅ No console errors in browser
   - ✅ Can view existing projects
   - ✅ Database operations work

---

## Troubleshooting

### Issue: "Migration failed" error

**Solution**:
1. Read the exact error message
2. Check if specific column already exists
3. Migration might be partially applied
4. Run `npx prisma migrate status` to see current state

### Issue: "Database connection failed"

**Solution**:
1. Verify DATABASE_URL is set correctly
2. Check PostgreSQL service is running
3. Test connection: `npx prisma db execute --stdin <<< "SELECT 1;"`

### Issue: "Column already exists"

**Solution**:
- This is normal if migration was partially applied
- The `IF NOT EXISTS` clause will skip existing objects
- Migration will continue to next statement

### Issue: Foreign key constraint violation

**Solution**:
1. Check if orphaned records exist
2. Clean up orphaned records before migration
3. Report for manual data cleanup

---

## Migration Timeline

### Before Deployment
- **Schema Status**: Out of sync
- **Missing Columns**: 3 (avatarId, projectId, generationType)
- **Applied Migrations**: ~18 (estimated)
- **Avatar Creator Status**: Partially broken (missing columns)

### During Deployment
- **Estimated Time**: 1-3 minutes
- **Downtime**: None (columns added, no locks on tables)
- **Database Load**: Minimal (DDL operations)

### After Deployment
- **Schema Status**: Fully synced
- **Missing Columns**: 0
- **Applied Migrations**: ~22
- **Avatar Creator Status**: Fully functional

---

## Files Created for Deployment

1. **DEPLOY_MIGRATIONS_NOW.sh**
   - Full automated script with verification
   - Recommended for comprehensive deployment

2. **SIMPLE_MIGRATION_DEPLOY.txt**
   - Step-by-step commands
   - Recommended for manual control

3. **MIGRATION_DEPLOYMENT_REPORT.md** (this file)
   - Complete deployment documentation
   - Reference guide

---

## Success Criteria Checklist

- [ ] All pending migrations applied successfully
- [ ] No migration errors in output
- [ ] `avatar_generations.avatarId` column exists
- [ ] `avatar_generations.projectId` column exists
- [ ] `pose_generations.generationType` column exists
- [ ] `_prisma_migrations` table shows all 4 new migrations
- [ ] Application health endpoint returns 200 OK
- [ ] Avatar Creator page loads without errors
- [ ] No console errors in browser developer tools
- [ ] User can access existing projects
- [ ] Database operations complete successfully

---

## Next Steps

1. **Execute Migration** (choose one method above)
2. **Verify Deployment** (run verification queries)
3. **Test Application** (check Avatar Creator works)
4. **Monitor Logs** (watch for any errors)
5. **Report Status** (confirm success or report issues)

---

## Support Information

**Coolify Details**:
- Base URL: `https://cf.avolut.com`
- App ID: `d8ggwoo484k8ok48g8k8cgwk`
- Database ID: `ycwc4s4ookos40k44gc8oooc`

**Application**:
- Production URL: `https://dev.lumiku.com`
- Health Endpoint: `https://dev.lumiku.com/health`

**Database**:
- Type: PostgreSQL
- Access: Via Coolify terminal
- Connection: Managed by Coolify

---

## Deployment Commands Quick Reference

```bash
# Essential 3 commands
cd /app/backend
npx prisma migrate deploy
npx prisma migrate status

# Verification queries
npx prisma db execute --stdin <<'EOF'
SELECT column_name FROM information_schema.columns
WHERE table_name IN ('avatar_generations', 'pose_generations');
EOF
```

---

## Contact

If you encounter any issues during deployment:
1. **Capture**: Full error message from terminal
2. **Check**: Migration status with `npx prisma migrate status`
3. **Report**: Error details for analysis
4. **DO NOT**: Force through errors without review

---

**Report Status**: Ready for Execution
**Risk Level**: Low (idempotent migrations, transaction-wrapped)
**Estimated Duration**: 2-3 minutes
**Recommended Time**: Now (non-peak hours for safety)

---

## Additional Notes

- All migrations use `IF NOT EXISTS` clauses (safe to re-run)
- Wrapped in transactions (atomic operations)
- No data loss risk
- No breaking changes
- Backward compatible
- Production-tested migration patterns

**Approval**: User approved deployment
**Ready to Execute**: YES ✅

---

*End of Report*
