# Avatar Creator Troubleshooting Guide

**Document Type**: Support & Operations Runbook
**Target Audience**: Support Engineers, Developers, DevOps
**Last Updated**: 2025-10-14

## Quick Reference

### Common Issues & Solutions

| Symptom | Likely Cause | Quick Fix |
|---------|--------------|-----------|
| 500 on all endpoints | Prisma import error | Check import syntax |
| 500 on create/update | Missing DB columns | Run migration SQL |
| TypeError: undefined | Prisma client not initialized | Restart application |
| Column does not exist | Schema not migrated | Execute ALTER TABLE commands |
| Prisma client error | Version mismatch | Run `npx prisma generate` |

---

## Table of Contents

1. [HTTP 500 Errors](#http-500-errors)
2. [Database Errors](#database-errors)
3. [Import & Module Errors](#import--module-errors)
4. [Prisma Client Issues](#prisma-client-issues)
5. [Performance Issues](#performance-issues)
6. [Data Integrity Issues](#data-integrity-issues)
7. [Deployment Issues](#deployment-issues)
8. [Diagnostic Tools](#diagnostic-tools)

---

## HTTP 500 Errors

### Error: "Cannot read property 'avatarProject' of undefined"

**Full Error**:
```
TypeError: Cannot read property 'avatarProject' of undefined
  at findProjectsByUserId (avatar-creator.repository.ts:23)
  at AvatarCreatorService.getUserProjects (avatar-creator.service.ts:45)
```

**Root Cause**: Incorrect Prisma import - using named import instead of default import

**Diagnostic**:
```bash
# Check import statement
grep "import.*prisma" backend/src/apps/avatar-creator/repositories/avatar-creator.repository.ts

# Incorrect:
import { prisma } from '../../../db/client'  # ❌

# Correct:
import prisma from '../../../db/client'      # ✅
```

**Solution**:
```bash
# Edit the file
nano backend/src/apps/avatar-creator/repositories/avatar-creator.repository.ts

# Change line 1 to:
import prisma from '../../../db/client'

# Rebuild and restart
npm run build
pm2 restart lumiku-backend
```

**Verification**:
```bash
curl -X GET http://localhost:3000/api/apps/avatar-creator/projects \
  -H "Authorization: Bearer $TOKEN"

# Should return: 200 OK (not 500)
```

---

### Error: "column 'personaName' does not exist"

**Full Error**:
```
error: column "personaName" of relation "avatars" does not exist
  at Parser.parseErrorMessage (node_modules/pg-protocol/src/parser.ts:369)
```

**Root Cause**: Database schema not synchronized with Prisma schema

**Diagnostic**:
```sql
-- Check table structure
\d avatars

-- Count columns
SELECT COUNT(*)
FROM information_schema.columns
WHERE table_name = 'avatars';

-- Expected: 26 columns
-- If less than 26, schema is out of sync
```

**Solution**:
```sql
-- Run full migration (see DEPLOYMENT_STEPS_AVATAR_CREATOR.md)
BEGIN TRANSACTION;

ALTER TABLE avatars ADD COLUMN IF NOT EXISTS "personaName" TEXT;
ALTER TABLE avatars ADD COLUMN IF NOT EXISTS "personaAge" INTEGER;
-- ... (all 18 columns)

COMMIT;
```

**Verification**:
```sql
-- Verify columns exist
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'avatars'
  AND column_name IN ('personaName', 'gender', 'sourceType');

-- Should return 3 rows
```

---

### Error: "500 on POST but 200 on GET"

**Symptom**: GET endpoints work, but POST/PUT/DELETE return 500

**Root Cause**: Partial schema migration - read-only columns exist, write columns missing

**Diagnostic**:
```bash
# Test read operation
curl -X GET http://localhost:3000/api/apps/avatar-creator/projects \
  -H "Authorization: Bearer $TOKEN"
# Returns: 200 OK ✓

# Test write operation
curl -X POST http://localhost:3000/api/apps/avatar-creator/projects \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test"}'
# Returns: 500 Error ✗

# Check application logs
pm2 logs lumiku-backend --lines 50 | grep ERROR
```

**Solution**:
```sql
-- Check which columns are missing
SELECT column_name
FROM (
  VALUES
    ('personaName'), ('personaAge'), ('gender'), ('sourceType'),
    ('usageCount'), ('lastUsedAt')
    -- ... list all expected columns
) AS expected(column_name)
WHERE NOT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'avatars'
    AND columns.column_name = expected.column_name
);

-- Add missing columns
ALTER TABLE avatars ADD COLUMN "columnName" TYPE;
```

---

## Database Errors

### Error: "relation 'avatars' does not exist"

**Full Error**:
```
error: relation "avatars" does not exist
```

**Root Cause**: Database migrations never ran, tables not created

**Diagnostic**:
```sql
-- List all tables
\dt

-- Check if avatar tables exist
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE '%avatar%';
```

**Solution**:
```bash
# Run Prisma migrations
cd backend
npx prisma migrate deploy

# Or reset database (DEVELOPMENT ONLY)
npx prisma migrate reset
npx prisma db push
```

---

### Error: "unique constraint violation on avatars.id"

**Full Error**:
```
error: duplicate key value violates unique constraint "avatars_pkey"
Detail: Key (id)=(ckx123) already exists.
```

**Root Cause**: ID generation conflict or manual data insertion

**Diagnostic**:
```sql
-- Check for duplicate IDs
SELECT id, COUNT(*)
FROM avatars
GROUP BY id
HAVING COUNT(*) > 1;

-- Check ID format
SELECT id FROM avatars LIMIT 5;
-- Expected format: ckx... (cuid)
```

**Solution**:
```sql
-- Option 1: Delete duplicate (if safe)
DELETE FROM avatars
WHERE id = 'duplicate-id'
  AND "createdAt" = (
    SELECT MIN("createdAt")
    FROM avatars
    WHERE id = 'duplicate-id'
  );

-- Option 2: Regenerate IDs (complex - avoid)
-- Contact database administrator
```

---

### Error: "foreign key constraint violation"

**Full Error**:
```
error: update or delete on table "avatar_projects" violates foreign key constraint
Detail: Key is still referenced from table "avatars"
```

**Root Cause**: Attempting to delete project with existing avatars

**Diagnostic**:
```sql
-- Check for orphaned avatars
SELECT a.id, a.name, a.projectId
FROM avatars a
LEFT JOIN avatar_projects p ON a.projectId = p.id
WHERE p.id IS NULL;
```

**Solution**:
```typescript
// Application should cascade delete
// Check Prisma schema has onDelete: Cascade

model Avatar {
  projectId String
  project   AvatarProject @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

// If not set, regenerate Prisma client:
npx prisma generate
```

---

## Import & Module Errors

### Error: "Cannot find module '../../../db/client'"

**Full Error**:
```
Error: Cannot find module '../../../db/client'
  at Function.Module._resolveFilename (internal/modules/cjs/loader.js:880)
```

**Root Cause**: Incorrect file path or missing build artifacts

**Diagnostic**:
```bash
# Check if file exists
ls -la backend/src/db/client.ts
ls -la backend/dist/db/client.js  # Compiled version

# Check relative path
cd backend/src/apps/avatar-creator/repositories
realpath ../../../db/client.ts
# Should point to: backend/src/db/client.ts
```

**Solution**:
```bash
# Rebuild TypeScript
cd backend
npm run build

# Verify compiled files
ls -la dist/db/client.js
ls -la dist/apps/avatar-creator/repositories/avatar-creator.repository.js

# Restart application
pm2 restart lumiku-backend
```

---

### Error: "ESM/CommonJS module compatibility"

**Symptom**: Import works in TypeScript but fails in compiled JavaScript

**Diagnostic**:
```bash
# Check tsconfig.json
cat backend/tsconfig.json | grep module

# Check package.json
cat backend/package.json | grep '"type"'
```

**Solution**:
```typescript
// Ensure consistent module format
// backend/tsconfig.json
{
  "compilerOptions": {
    "module": "commonjs",
    "esModuleInterop": true
  }
}

// backend/package.json
{
  "type": "commonjs"  // Or omit for default CommonJS
}
```

---

## Prisma Client Issues

### Error: "Prisma Client validation error"

**Full Error**:
```
Invalid `prisma.avatarProject.create()` invocation:
Unknown argument `invalidField`. Did you mean `name`?
```

**Root Cause**: Code using fields not in Prisma schema

**Diagnostic**:
```bash
# Check Prisma schema
cat backend/prisma/schema.prisma | grep -A 20 "model AvatarProject"

# Verify Prisma client is up to date
npx prisma validate
```

**Solution**:
```bash
# Regenerate Prisma client
cd backend
npx prisma generate

# Rebuild application
npm run build
pm2 restart lumiku-backend
```

---

### Error: "Prisma Client initialization error"

**Full Error**:
```
PrismaClientInitializationError: Can't reach database server
```

**Root Cause**: Database connection failed

**Diagnostic**:
```bash
# Check DATABASE_URL
echo $DATABASE_URL
# Should be: postgresql://user:pass@host:port/db

# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check database is running
systemctl status postgresql
# OR
docker ps | grep postgres
```

**Solution**:
```bash
# Fix environment variable
export DATABASE_URL="postgresql://correct:credentials@host:port/db"

# Restart application
pm2 restart lumiku-backend

# Or update .env file
echo "DATABASE_URL=postgresql://..." >> backend/.env
```

---

### Error: "Prisma schema and client out of sync"

**Full Error**:
```
Error: The Prisma Client is not compatible with the schema.
Please run `prisma generate` to update it.
```

**Solution**:
```bash
cd backend

# Regenerate client
npx prisma generate

# Rebuild application
npm run build

# Clear any caches
rm -rf node_modules/.cache
rm -rf dist

# Reinstall and rebuild
npm install
npm run build

# Restart
pm2 restart lumiku-backend
```

---

## Performance Issues

### Slow Response Times (>1 second)

**Symptom**: Avatar Creator endpoints respond slowly

**Diagnostic**:
```sql
-- Check query performance
EXPLAIN ANALYZE
SELECT * FROM avatar_projects
WHERE userId = 'user123';

-- Check missing indexes
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('avatar_projects', 'avatars');

-- Check table bloat
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename IN ('avatar_projects', 'avatars');
```

**Solution**:
```sql
-- Recreate missing indexes (from Prisma schema)
CREATE INDEX IF NOT EXISTS "avatars_userId_idx" ON avatars(userId);
CREATE INDEX IF NOT EXISTS "avatars_projectId_idx" ON avatars(projectId);
CREATE INDEX IF NOT EXISTS "avatars_sourceType_idx" ON avatars(sourceType);

-- Analyze tables
ANALYZE avatar_projects;
ANALYZE avatars;

-- Vacuum if bloated
VACUUM ANALYZE avatars;
```

---

### High Database CPU Usage

**Diagnostic**:
```sql
-- Find slow queries
SELECT
  pid,
  now() - query_start AS duration,
  query
FROM pg_stat_activity
WHERE state = 'active'
  AND query NOT LIKE '%pg_stat_activity%'
ORDER BY duration DESC;

-- Check lock waits
SELECT
  blocked_locks.pid AS blocked_pid,
  blocked_activity.query AS blocked_query,
  blocking_locks.pid AS blocking_pid,
  blocking_activity.query AS blocking_query
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

**Solution**:
```sql
-- Kill long-running query (if safe)
SELECT pg_cancel_backend(pid);

-- Optimize common queries
-- Add composite indexes for frequent queries
CREATE INDEX "avatars_userId_createdAt_idx"
ON avatars(userId, "createdAt" DESC);
```

---

## Data Integrity Issues

### Avatars Without Projects

**Symptom**: Orphaned avatars exist after project deletion

**Diagnostic**:
```sql
-- Find orphaned avatars
SELECT a.id, a.name, a.projectId
FROM avatars a
LEFT JOIN avatar_projects p ON a.projectId = p.id
WHERE p.id IS NULL;
```

**Solution**:
```sql
-- Option 1: Delete orphaned avatars
DELETE FROM avatars
WHERE projectId NOT IN (
  SELECT id FROM avatar_projects
);

-- Option 2: Create dummy project (if data recovery needed)
INSERT INTO avatar_projects (id, userId, name, description)
SELECT DISTINCT
  projectId,
  userId,
  'Recovered Project',
  'Auto-created to recover orphaned avatars'
FROM avatars
WHERE projectId NOT IN (SELECT id FROM avatar_projects);
```

---

### NULL Values in Required Fields

**Diagnostic**:
```sql
-- Find NULL values in required fields
SELECT id, name, baseImageUrl, sourceType
FROM avatars
WHERE name IS NULL
   OR baseImageUrl IS NULL
   OR sourceType IS NULL;
```

**Solution**:
```sql
-- Fix NULL values with defaults
UPDATE avatars
SET sourceType = 'uploaded'
WHERE sourceType IS NULL;

-- Add NOT NULL constraint (after fixing data)
ALTER TABLE avatars ALTER COLUMN sourceType SET NOT NULL;
```

---

## Deployment Issues

### Post-Deployment 500 Errors

**Symptom**: Errors appear immediately after deployment

**Diagnostic Checklist**:
```bash
# 1. Check application is running
pm2 list | grep lumiku-backend

# 2. Check recent logs
pm2 logs lumiku-backend --lines 100 | tail -50

# 3. Verify environment variables
pm2 env 0  # Replace 0 with PM2 process ID

# 4. Check database connectivity
psql $DATABASE_URL -c "SELECT 1;"

# 5. Verify build succeeded
ls -la backend/dist/apps/avatar-creator/

# 6. Check import syntax in built code
grep "prisma" backend/dist/apps/avatar-creator/repositories/avatar-creator.repository.js
```

**Solution**:
```bash
# Force clean rebuild
cd backend
rm -rf dist node_modules/.cache
npm run build

# Restart with fresh environment
pm2 delete lumiku-backend
pm2 start ecosystem.config.js

# Tail logs for errors
pm2 logs lumiku-backend --lines 0
```

---

## Diagnostic Tools

### Quick Health Check Script

```bash
#!/bin/bash
# File: check-avatar-creator-health.sh

echo "=== Avatar Creator Health Check ==="
echo ""

# 1. Check application status
echo "1. Application Status:"
pm2 list | grep lumiku-backend
echo ""

# 2. Test API endpoint
echo "2. API Endpoint Test:"
curl -s -o /dev/null -w "GET /projects: %{http_code}\n" \
  http://localhost:3000/api/apps/avatar-creator/projects \
  -H "Authorization: Bearer $TOKEN"
echo ""

# 3. Check database schema
echo "3. Database Schema Check:"
psql $DATABASE_URL -t -c "
SELECT COUNT(*) || ' columns in avatars table'
FROM information_schema.columns
WHERE table_name = 'avatars';
"
echo ""

# 4. Check for errors in logs
echo "4. Recent Errors:"
pm2 logs lumiku-backend --lines 100 --nostream | grep -i "error" | tail -5
echo ""

echo "=== Health Check Complete ==="
```

### Database Schema Validator

```sql
-- File: validate-avatar-schema.sql
-- Check all expected columns exist

WITH expected_columns AS (
  SELECT unnest(ARRAY[
    'id', 'userId', 'projectId', 'name', 'baseImageUrl', 'thumbnailUrl',
    'personaName', 'personaAge', 'personaPersonality', 'personaBackground',
    'gender', 'ageRange', 'ethnicity', 'bodyType',
    'hairStyle', 'hairColor', 'eyeColor', 'skinTone', 'style',
    'sourceType', 'generationPrompt', 'seedUsed', 'usageCount', 'lastUsedAt',
    'createdAt', 'updatedAt'
  ]) AS column_name
),
actual_columns AS (
  SELECT column_name
  FROM information_schema.columns
  WHERE table_name = 'avatars'
)
SELECT
  e.column_name,
  CASE
    WHEN a.column_name IS NULL THEN '❌ MISSING'
    ELSE '✓ EXISTS'
  END AS status
FROM expected_columns e
LEFT JOIN actual_columns a ON e.column_name = a.column_name
ORDER BY
  CASE WHEN a.column_name IS NULL THEN 0 ELSE 1 END,
  e.column_name;
```

### Import Syntax Checker

```bash
#!/bin/bash
# File: check-prisma-imports.sh

echo "Checking Prisma import syntax..."

# Find all files importing prisma
grep -rn "import.*prisma.*from.*db/client" backend/src/apps/avatar-creator/

echo ""
echo "Expected: import prisma from '../../../db/client'"
echo "Incorrect: import { prisma } from '../../../db/client'"
```

---

## Escalation Process

### When to Escalate

Escalate to senior engineer if:
- [ ] Issue persists after trying all solutions
- [ ] Data corruption detected
- [ ] Production outage >15 minutes
- [ ] Multiple apps affected
- [ ] Security vulnerability discovered

### Escalation Contacts

1. **Level 1**: Team Lead
2. **Level 2**: Database Administrator
3. **Level 3**: CTO / Technical Director

### Information to Provide

When escalating, include:
```
Subject: [URGENT] Avatar Creator Issue - <Brief Description>

Environment: Production / Staging / Development
Affected Users: <number or "all users">
Started At: <timestamp>
Error Message: <full error>
Steps Taken: <list all attempted solutions>
Current Status: <working/broken/partially working>

Logs: <attach last 100 lines>
Database State: <attach schema validation output>
```

---

## Preventive Measures

### Regular Maintenance

```bash
# Weekly: Check database health
psql $DATABASE_URL -c "
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  last_vacuum,
  last_analyze
FROM pg_stat_user_tables
WHERE tablename LIKE '%avatar%';
"

# Weekly: Check for slow queries
# Review pg_stat_statements

# Monthly: Vacuum and analyze
psql $DATABASE_URL -c "VACUUM ANALYZE avatars;"
```

### Monitoring Alerts

Set up alerts for:
- [ ] 500 error rate >5% in 5 minutes
- [ ] Response time >1 second average
- [ ] Database connection failures
- [ ] Disk space <20%
- [ ] CPU usage >80% sustained

---

## FAQ

**Q: Can I run the migration SQL multiple times?**
A: Yes, the `IF NOT EXISTS` clause makes it idempotent.

**Q: Will the migration lock the table?**
A: No, `ADD COLUMN IF NOT EXISTS` is non-blocking in PostgreSQL.

**Q: How do I verify the fix worked?**
A: Run the health check script and test creating a project via API.

**Q: Can I rollback the migration?**
A: Not recommended. See DEPLOYMENT_STEPS_AVATAR_CREATOR.md for rollback procedure.

**Q: Why are migrations in .gitignore?**
A: Historical decision. Recommended to track migrations in future.

---

## Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-14 | 1.0 | Initial troubleshooting guide | Dev Team |

---

**Document Status**: PRODUCTION READY
**Next Review**: 2025-11-14
