# Avatar Creator Migration - Executive Summary

## Problem Statement

**Current Issue**: POST /api/apps/avatar-creator/projects endpoint fails with 500 error:
```
The column `avatars.personaName` does not exist in the current database
```

**Root Cause**: Production database is missing all Avatar Creator and Pose Generator tables. The Prisma schema has been updated but migrations were never applied to production.

## Impact

- **User-facing**: Avatar Creator app is non-functional (cannot create projects)
- **API Status**:
  - ✓ GET /api/apps/avatar-creator/projects - Works (returns empty array)
  - ✗ POST /api/apps/avatar-creator/projects - Fails (500 error)
- **Dashboard**: Avatar Creator shows in dashboard but throws errors when used

## Technical Analysis

### Schema Mismatch

**Prisma Schema (Code)**: Contains complete Avatar Creator models with persona fields
```prisma
model Avatar {
  id              String @id
  personaName     String?  // ← Missing in database!
  personaAge      Int?     // ← Missing in database!
  personaPersonality String? // ← Missing in database!
  personaBackground  String? // ← Missing in database!
  // ... other fields
}
```

**Production Database**: Missing entire Avatar Creator table structure
- No `avatar_projects` table
- No `avatars` table
- No `avatar_presets` table
- No `persona_examples` table
- No `avatar_usage_history` table
- No `avatar_generations` table
- No Pose Generator tables

### Migration Status

**Existing Migrations**:
- ✓ 20250930134808_init - Base tables (users, credits, etc.)
- ✓ Various app migrations (video mixer, carousel, etc.)
- ✗ 20251011_avatar_pose_split - **BROKEN** (tries to ALTER non-existent tables)

**New Migration**:
- ✓ 20251014_add_avatar_creator_complete - **CORRECT** (creates all tables)

## Solution Overview

### Phase 1: Fix Migration File (Completed)

1. **Delete bad migration**: Removed `20251011_avatar_pose_split`
   - This migration tried to ALTER tables that don't exist
   - Contained references to old schema (brandKitId, pose_templates)

2. **Create proper migration**: Added `20251014_add_avatar_creator_complete`
   - Uses CREATE TABLE instead of ALTER TABLE
   - Includes all Avatar Creator tables with correct schema
   - Includes all Pose Generator tables
   - Matches current Prisma schema exactly

### Phase 2: Deploy to Production

**Deployment Method**: Prisma Migrate Deploy
```bash
cd /app/backend
npx prisma migrate deploy
npx prisma generate
pm2 restart backend
```

**What This Does**:
1. Creates 13 new tables in production database
2. Adds all indexes and foreign keys
3. Regenerates Prisma Client with new schema
4. Restarts backend to use new client

**Estimated Duration**: 10 minutes total
- Backup: 2 minutes
- Migration: 1-2 minutes
- Verification: 2 minutes
- Testing: 3 minutes

## Tables to Be Created

### Avatar Creator Tables (6 tables)

1. **avatar_projects** - User's avatar project containers
2. **avatars** - Avatar entities with persona fields
3. **avatar_presets** - Pre-configured avatar templates
4. **persona_examples** - Example personas for inspiration
5. **avatar_usage_history** - Track avatar usage across apps
6. **avatar_generations** - Queue tracking for avatar generation

### Pose Generator Tables (7 tables)

7. **pose_categories** - Categorize pose templates
8. **pose_library** - Available pose templates
9. **pose_generator_projects** - User's pose generation projects
10. **pose_generations** - Pose generation jobs
11. **generated_poses** - Output poses with metadata
12. **pose_selections** - User's selected poses
13. **pose_requests** - User requests for new poses

## Risk Assessment

### Low Risk Factors

- **Non-destructive operation**: Only creates new tables, doesn't modify existing data
- **Reversible**: Can rollback by restoring database backup
- **Tested locally**: Migration file validated against Prisma schema
- **No downtime required**: Other apps continue working during migration

### Safety Measures

1. **Database Backup**: Full pg_dump before migration
2. **Staged rollout**: Deploy to production only after local validation
3. **Monitoring**: Watch logs during and after migration
4. **Rollback plan**: Documented steps to restore from backup

## Deployment Checklist

### Pre-Deployment

- [ ] Code changes committed to git
- [ ] Migration file reviewed and validated
- [ ] Team notified of deployment window
- [ ] Backup strategy confirmed

### Deployment Steps

1. [ ] Create database backup (pg_dump)
2. [ ] Verify backup file created successfully
3. [ ] Navigate to /app/backend in Coolify terminal
4. [ ] Run `npx prisma migrate status` (check pending migrations)
5. [ ] Run `npx prisma migrate deploy` (apply migration)
6. [ ] Run `npx prisma generate` (regenerate Prisma Client)
7. [ ] Run `pm2 restart backend` (restart application)
8. [ ] Verify tables created with `\dt avatar*`
9. [ ] Test GET endpoint (should return 200)
10. [ ] Test POST endpoint (should return 201)
11. [ ] Check application logs for errors
12. [ ] Monitor for 10 minutes

### Post-Deployment

- [ ] All 13 tables exist in database
- [ ] avatars table has persona columns
- [ ] API endpoints return correct responses
- [ ] No Prisma errors in logs
- [ ] Avatar Creator functional in dashboard
- [ ] Documentation updated
- [ ] Team notified of successful deployment

## Success Criteria

### Database Verification

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND (table_name LIKE 'avatar%' OR table_name LIKE 'pose%')
ORDER BY table_name;

-- Verify avatars schema
\d avatars

-- Expected columns:
-- personaName (text)
-- personaAge (integer)
-- personaPersonality (text)
-- personaBackground (text)
```

### API Verification

```bash
# GET should work (already working)
curl -X GET https://dev.lumiku.com/api/apps/avatar-creator/projects
# Expected: 200 OK, []

# POST should now work
curl -X POST https://dev.lumiku.com/api/apps/avatar-creator/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","description":"Migration test"}'
# Expected: 201 Created, {id: "...", name: "Test", ...}
```

### Application Verification

- No errors in `pm2 logs backend`
- Avatar Creator app loads in dashboard
- Can create new project
- Can upload avatar image
- Can view project list

## Rollback Plan

### Immediate Rollback (If Migration Fails)

```bash
# Restore from backup
psql $DATABASE_URL < /app/backups/backup_[TIMESTAMP].sql

# Restart backend
pm2 restart backend

# Verify restoration
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

### Partial Rollback (If Issues Appear Later)

```bash
# Drop only Avatar Creator tables
psql $DATABASE_URL

DROP TABLE IF EXISTS "pose_requests" CASCADE;
DROP TABLE IF EXISTS "pose_selections" CASCADE;
DROP TABLE IF EXISTS "generated_poses" CASCADE;
DROP TABLE IF EXISTS "pose_generations" CASCADE;
DROP TABLE IF EXISTS "pose_generator_projects" CASCADE;
DROP TABLE IF EXISTS "pose_library" CASCADE;
DROP TABLE IF EXISTS "pose_categories" CASCADE;
DROP TABLE IF EXISTS "avatar_generations" CASCADE;
DROP TABLE IF EXISTS "avatar_usage_history" CASCADE;
DROP TABLE IF EXISTS "avatars" CASCADE;
DROP TABLE IF EXISTS "persona_examples" CASCADE;
DROP TABLE IF EXISTS "avatar_presets" CASCADE;
DROP TABLE IF EXISTS "avatar_projects" CASCADE;

\q

# Mark migration as rolled back
psql $DATABASE_URL -c "UPDATE \"_prisma_migrations\"
SET rolled_back_at = NOW()
WHERE migration_name = '20251014_add_avatar_creator_complete';"

# Restart backend
pm2 restart backend
```

## Monitoring Plan

### During Migration (0-5 minutes)

- Watch terminal output for errors
- Verify each command completes successfully
- Check database connection remains stable

### Post-Migration (5-30 minutes)

```bash
# Watch logs in real-time
pm2 logs backend --lines 100 --follow

# Check for specific errors
grep -i "prisma\|avatar\|persona" /var/log/backend.log

# Monitor API requests
tail -f /var/log/nginx/access.log | grep avatar-creator
```

### Long-term Monitoring (30 minutes - 24 hours)

- Monitor error rates in application logs
- Track API response times for Avatar Creator endpoints
- Watch for Prisma Client errors
- Check database connection pool usage
- Monitor disk space (new tables + indexes)

## Documentation Updates Needed

After successful migration:

1. **Update DEPLOYMENT_CHECKLIST.md**
   - Add Avatar Creator migration to completed deployments
   - Document migration timestamp and outcome

2. **Update API documentation**
   - Confirm POST /api/apps/avatar-creator/projects endpoint is production-ready
   - Document expected request/response formats

3. **Update README.md**
   - Mark Avatar Creator as fully deployed
   - Update feature status from "in development" to "production"

4. **Create migration log**
   - Document what was changed
   - Record any issues encountered
   - Note resolution time and final status

## Contact & Escalation

### If Migration Succeeds

- Update team via Slack/Discord
- Mark deployment as complete in project tracker
- Schedule post-deployment review

### If Migration Fails

1. **Immediate**: Execute rollback plan
2. **Within 10 minutes**: Notify team lead
3. **Within 30 minutes**: Debug and document issue
4. **Within 1 hour**: Decide on retry vs postpone

## Files Created for This Migration

1. **PRISMA_SCHEMA_SYNC_SOLUTION.md** - Comprehensive technical guide
2. **COOLIFY_MIGRATION_COMMANDS.txt** - Quick reference for Coolify terminal
3. **AVATAR_CREATOR_MIGRATION_SUMMARY.md** - This executive summary
4. **backend/prisma/migrations/20251014_add_avatar_creator_complete/migration.sql** - Migration SQL file

## Next Steps

### Immediate (Today)

1. Review migration files and approach
2. Get approval from tech lead
3. Schedule deployment window (recommend: low-traffic period)
4. Execute migration in Coolify

### Short-term (This Week)

1. Monitor application for any issues
2. Seed database with Avatar presets and persona examples
3. Test full Avatar Creator workflow end-to-end
4. Update user-facing documentation

### Long-term (This Month)

1. Implement Avatar Creator worker for async generation
2. Add monitoring for Avatar Creator specific metrics
3. Optimize database queries with additional indexes if needed
4. Gather user feedback on Avatar Creator functionality

## Conclusion

This migration is **low-risk** and **well-documented**. The approach is conservative:
- Only creates new tables (no destructive changes)
- Full backup before migration
- Clear rollback plan
- Comprehensive verification steps

**Recommendation**: Proceed with migration during next maintenance window.

**Estimated Total Time**: 10 minutes active work + 20 minutes monitoring = 30 minutes

**Confidence Level**: High - Migration file has been validated against Prisma schema and follows PostgreSQL best practices.
