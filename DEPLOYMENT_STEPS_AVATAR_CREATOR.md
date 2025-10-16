# Avatar Creator Deployment Guide - Schema Migration Steps

**Document Type**: Operational Runbook
**Target Audience**: DevOps Engineers, Database Administrators
**Last Updated**: 2025-10-14

## Overview

This guide provides step-by-step instructions for deploying the Avatar Creator fix to any environment (staging, production, or new deployments). Follow these procedures to ensure proper schema synchronization and avoid 500 errors.

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Procedure](#deployment-procedure)
3. [Environment-Specific Steps](#environment-specific-steps)
4. [Verification & Testing](#verification--testing)
5. [Rollback Procedure](#rollback-procedure)
6. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Required Access
- [ ] Database admin credentials (PostgreSQL)
- [ ] SSH/terminal access to production server
- [ ] Git repository access
- [ ] Coolify/deployment platform credentials

### Required Information
```bash
# Environment variables needed
DATABASE_URL=postgresql://user:pass@host:port/db
NODE_ENV=production
```

### Backup Requirements
- [ ] Database backup completed
- [ ] Code backup/tag created
- [ ] Rollback plan documented

### Estimated Downtime
- **Code deployment**: ~2 minutes (zero downtime)
- **Database migration**: ~30 seconds (non-blocking)
- **Total impact**: Minimal to none

---

## Deployment Procedure

### Step 1: Verify Current State

#### Check Code Version
```bash
# SSH into server
cd /path/to/lumiku-app

# Check git status
git status
git log --oneline -5

# Verify current import syntax
grep -n "import.*prisma" backend/src/apps/avatar-creator/repositories/avatar-creator.repository.ts
```

**Expected Output (if bug exists)**:
```typescript
1:import { prisma } from '../../../db/client'  // ❌ WRONG
```

#### Check Database Schema
```sql
-- Connect to database
psql $DATABASE_URL

-- Check avatars table columns
\d avatars

-- Count columns
SELECT COUNT(*) FROM information_schema.columns
WHERE table_name = 'avatars';
```

**Expected Issues**:
- Column count: 8 (missing 18 columns)
- Missing: personaName, gender, sourceType, etc.

---

### Step 2: Deploy Code Fix

#### Option A: Git Pull (Recommended)

```bash
# Pull latest code with fix
git fetch origin
git checkout development  # or main branch
git pull origin development

# Verify fix applied
grep -n "import.*prisma" backend/src/apps/avatar-creator/repositories/avatar-creator.repository.ts
# Should show: import prisma from '../../../db/client'
```

#### Option B: Manual Code Fix

If pulling from git is not possible:

```bash
# Edit repository file
nano backend/src/apps/avatar-creator/repositories/avatar-creator.repository.ts

# Change line 1 from:
# import { prisma } from '../../../db/client'
# To:
# import prisma from '../../../db/client'

# Save and exit (Ctrl+O, Ctrl+X)
```

#### Rebuild Application

```bash
# Install dependencies (if needed)
cd backend
npm install

# Rebuild TypeScript
npm run build

# Restart application
pm2 restart lumiku-backend
# OR (if using Coolify)
# Deploy through Coolify dashboard
```

---

### Step 3: Run Database Migration

#### Connect to Database

```bash
# Option 1: Using psql
psql $DATABASE_URL

# Option 2: Using database GUI (pgAdmin, DBeaver, etc.)
# Connect using credentials from DATABASE_URL

# Option 3: Using Coolify database console
# Navigate to Database → Console
```

#### Execute Migration SQL

Copy and paste the following SQL into your database console:

```sql
-- ==========================================
-- Avatar Creator Schema Migration
-- Date: 2025-10-14
-- Purpose: Add missing columns to avatars table
-- Estimated Time: 30 seconds
-- Impact: Non-blocking (does not lock table)
-- ==========================================

-- Start transaction for atomicity
BEGIN TRANSACTION;

-- 1. Persona Columns (4 columns)
-- Purpose: Store character personality and background
ALTER TABLE avatars ADD COLUMN IF NOT EXISTS "personaName" TEXT;
ALTER TABLE avatars ADD COLUMN IF NOT EXISTS "personaAge" INTEGER;
ALTER TABLE avatars ADD COLUMN IF NOT EXISTS "personaPersonality" TEXT;
ALTER TABLE avatars ADD COLUMN IF NOT EXISTS "personaBackground" TEXT;

-- 2. Visual Attribute Columns (9 columns)
-- Purpose: Store avatar appearance characteristics
ALTER TABLE avatars ADD COLUMN IF NOT EXISTS "gender" TEXT;
ALTER TABLE avatars ADD COLUMN IF NOT EXISTS "ageRange" TEXT;
ALTER TABLE avatars ADD COLUMN IF NOT EXISTS "ethnicity" TEXT;
ALTER TABLE avatars ADD COLUMN IF NOT EXISTS "bodyType" TEXT;
ALTER TABLE avatars ADD COLUMN IF NOT EXISTS "hairStyle" TEXT;
ALTER TABLE avatars ADD COLUMN IF NOT EXISTS "hairColor" TEXT;
ALTER TABLE avatars ADD COLUMN IF NOT EXISTS "eyeColor" TEXT;
ALTER TABLE avatars ADD COLUMN IF NOT EXISTS "skinTone" TEXT;
ALTER TABLE avatars ADD COLUMN IF NOT EXISTS "style" TEXT;

-- 3. Generation Info Columns (5 columns)
-- Purpose: Track how avatar was created and usage statistics
ALTER TABLE avatars ADD COLUMN IF NOT EXISTS "sourceType" TEXT;
ALTER TABLE avatars ADD COLUMN IF NOT EXISTS "generationPrompt" TEXT;
ALTER TABLE avatars ADD COLUMN IF NOT EXISTS "seedUsed" INTEGER;
ALTER TABLE avatars ADD COLUMN IF NOT EXISTS "usageCount" INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE avatars ADD COLUMN IF NOT EXISTS "lastUsedAt" TIMESTAMP WITH TIME ZONE;

-- Commit all changes
COMMIT;

-- Verification query
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'avatars'
ORDER BY ordinal_position;
```

#### Expected Output

```
ALTER TABLE
ALTER TABLE
ALTER TABLE
... (18 times)
COMMIT

 column_name        | data_type                   | is_nullable | column_default
--------------------+-----------------------------+-------------+----------------
 id                 | text                        | NO          | cuid()
 userId             | text                        | NO          |
 projectId          | text                        | NO          |
 name               | text                        | NO          |
 baseImageUrl       | text                        | NO          |
 thumbnailUrl       | text                        | YES         |
 personaName        | text                        | YES         |    ← NEW
 personaAge         | integer                     | YES         |    ← NEW
 ... (all 18 new columns should appear)
```

---

### Step 4: Verify Deployment

#### Test API Endpoints

```bash
# Get authentication token first
TOKEN="your-jwt-token-here"

# Test 1: Create Project
curl -X POST http://your-domain.com/api/apps/avatar-creator/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Deployment Test Project",
    "description": "Testing post-deployment"
  }'

# Expected Response: HTTP 201 Created
# {
#   "id": "ckx...",
#   "userId": "user123",
#   "name": "Deployment Test Project",
#   "description": "Testing post-deployment",
#   "createdAt": "2025-10-14T...",
#   "updatedAt": "2025-10-14T...",
#   "avatars": []
# }

# Test 2: Get Projects
curl -X GET http://your-domain.com/api/apps/avatar-creator/projects \
  -H "Authorization: Bearer $TOKEN"

# Expected Response: HTTP 200 OK
# [
#   {
#     "id": "ckx...",
#     "name": "Deployment Test Project",
#     ...
#   }
# ]

# Test 3: Create Avatar with Full Schema
curl -X POST http://your-domain.com/api/apps/avatar-creator/projects/{projectId}/avatars \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Avatar",
    "baseImageUrl": "https://example.com/avatar.jpg",
    "sourceType": "upload",
    "personaName": "John Doe",
    "personaAge": 30,
    "gender": "male",
    "style": "professional"
  }'

# Expected Response: HTTP 201 Created
```

#### Check Application Logs

```bash
# View application logs
pm2 logs lumiku-backend --lines 50

# OR (Coolify)
# View logs in Coolify dashboard

# Look for successful startup:
# ✓ Server listening on port 3000
# ✓ Database connected
# ✓ Prisma client initialized
```

#### Verify Database Data

```sql
-- Check if test project was created
SELECT id, name, description, "createdAt"
FROM avatar_projects
ORDER BY "createdAt" DESC
LIMIT 5;

-- Verify no errors in logs
SELECT *
FROM avatars
WHERE "sourceType" IS NOT NULL  -- New column should work
LIMIT 5;
```

---

## Environment-Specific Steps

### Production Deployment

```bash
# 1. Schedule maintenance window (optional - should be zero downtime)
# 2. Create database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 3. Deploy code
git pull origin main
npm run build
pm2 restart lumiku-backend

# 4. Run migration (as shown in Step 3)

# 5. Monitor for 10 minutes
pm2 logs lumiku-backend --lines 100

# 6. Verify endpoints
curl -X GET https://app.lumiku.com/api/apps/avatar-creator/projects \
  -H "Authorization: Bearer $PROD_TOKEN"
```

### Staging Deployment

```bash
# 1. No backup needed (can restore from production)

# 2. Deploy code
git pull origin development
npm run build
pm2 restart lumiku-backend-staging

# 3. Run migration

# 4. Run full test suite
npm run test:integration
```

### Local Development Setup

```bash
# 1. Pull latest code
git pull origin development

# 2. Reset local database (if needed)
cd backend
npx prisma migrate reset

# 3. Generate Prisma client
npx prisma generate

# 4. Run development server
npm run dev

# Migration is handled automatically by Prisma in development
```

---

## Verification & Testing

### Automated Test Script

Create this test script for quick validation:

```bash
#!/bin/bash
# File: test-avatar-creator.sh

API_URL="http://localhost:3000"  # Change for production
TOKEN="your-token-here"

echo "Testing Avatar Creator Deployment..."

# Test 1: Health Check
echo "1. Health check..."
curl -s -o /dev/null -w "%{http_code}" $API_URL/health
echo ""

# Test 2: Create Project
echo "2. Creating test project..."
PROJECT_RESPONSE=$(curl -s -X POST $API_URL/api/apps/avatar-creator/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Project","description":"Automated test"}')

PROJECT_ID=$(echo $PROJECT_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "Project ID: $PROJECT_ID"

# Test 3: Get Projects
echo "3. Retrieving projects..."
curl -s $API_URL/api/apps/avatar-creator/projects \
  -H "Authorization: Bearer $TOKEN" | jq '.[0].name'

# Test 4: Cleanup
echo "4. Cleaning up test data..."
curl -s -X DELETE $API_URL/api/apps/avatar-creator/projects/$PROJECT_ID \
  -H "Authorization: Bearer $TOKEN"

echo "✅ All tests passed!"
```

Run the script:
```bash
chmod +x test-avatar-creator.sh
./test-avatar-creator.sh
```

### Manual Test Checklist

- [ ] Create new project via UI
- [ ] Upload avatar image
- [ ] Set persona fields (name, age, personality)
- [ ] Set visual attributes (gender, style, etc.)
- [ ] View avatar in project
- [ ] Delete avatar
- [ ] Delete project

---

## Rollback Procedure

### If Code Rollback Needed

```bash
# Revert to previous commit
git log --oneline -5  # Find commit hash before fix
git checkout <previous-commit-hash>

# Rebuild
npm run build
pm2 restart lumiku-backend
```

**Note**: This will restore the 500 error. Only use if new bugs introduced.

### If Database Rollback Needed

**⚠️ WARNING**: Database rollback will lose data in new columns!

```sql
-- Only use if absolutely necessary
BEGIN TRANSACTION;

-- Drop all 18 columns
ALTER TABLE avatars DROP COLUMN IF EXISTS "personaName";
ALTER TABLE avatars DROP COLUMN IF EXISTS "personaAge";
ALTER TABLE avatars DROP COLUMN IF EXISTS "personaPersonality";
ALTER TABLE avatars DROP COLUMN IF EXISTS "personaBackground";
ALTER TABLE avatars DROP COLUMN IF EXISTS "gender";
ALTER TABLE avatars DROP COLUMN IF EXISTS "ageRange";
ALTER TABLE avatars DROP COLUMN IF EXISTS "ethnicity";
ALTER TABLE avatars DROP COLUMN IF EXISTS "bodyType";
ALTER TABLE avatars DROP COLUMN IF EXISTS "hairStyle";
ALTER TABLE avatars DROP COLUMN IF EXISTS "hairColor";
ALTER TABLE avatars DROP COLUMN IF EXISTS "eyeColor";
ALTER TABLE avatars DROP COLUMN IF EXISTS "skinTone";
ALTER TABLE avatars DROP COLUMN IF EXISTS "style";
ALTER TABLE avatars DROP COLUMN IF EXISTS "sourceType";
ALTER TABLE avatars DROP COLUMN IF EXISTS "generationPrompt";
ALTER TABLE avatars DROP COLUMN IF EXISTS "seedUsed";
ALTER TABLE avatars DROP COLUMN IF EXISTS "usageCount";
ALTER TABLE avatars DROP COLUMN IF EXISTS "lastUsedAt";

COMMIT;
```

**Recommendation**: Forward-only migrations. Do not rollback database.

---

## Troubleshooting

### Issue 1: Migration SQL Fails

**Symptom**:
```
ERROR: relation "avatars" does not exist
```

**Solution**:
```sql
-- Check table name (might be different schema)
\dt

-- If table is in different schema:
SET search_path TO your_schema;
ALTER TABLE avatars ADD COLUMN ...
```

### Issue 2: Column Already Exists

**Symptom**:
```
ERROR: column "personaName" of relation "avatars" already exists
```

**Solution**:
The `IF NOT EXISTS` clause should prevent this. If error occurs:
```sql
-- Check which columns already exist
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'avatars';

-- Remove IF NOT EXISTS for missing columns only
```

### Issue 3: Application Still Returns 500

**Symptom**: Endpoints still fail after deployment

**Diagnostic Steps**:
```bash
# 1. Check if code was rebuilt
ls -la backend/dist/apps/avatar-creator/repositories/
# Should show recent build timestamp

# 2. Check if process was restarted
pm2 list
# Check uptime (should be recent)

# 3. Check import syntax in built code
grep "import.*prisma" backend/dist/apps/avatar-creator/repositories/avatar-creator.repository.js

# 4. Check application logs
pm2 logs lumiku-backend --lines 100 | grep -i error
```

**Solution**:
```bash
# Force rebuild
rm -rf backend/dist
npm run build

# Hard restart
pm2 delete lumiku-backend
pm2 start ecosystem.config.js
```

### Issue 4: Prisma Client Out of Sync

**Symptom**:
```
Error: Prisma Client does not match schema
```

**Solution**:
```bash
cd backend
npx prisma generate  # Regenerate client
npm run build        # Rebuild app
pm2 restart lumiku-backend
```

---

## Post-Deployment Monitoring

### First 24 Hours

Monitor these metrics:

```bash
# 1. Error rate
tail -f /var/log/lumiku/error.log | grep "avatar-creator"

# 2. Response times
# Check APM dashboard or logs

# 3. Database performance
SELECT
  schemaname,
  tablename,
  last_vacuum,
  last_analyze
FROM pg_stat_user_tables
WHERE tablename = 'avatars';
```

### Success Criteria

- [ ] Zero 500 errors in Avatar Creator endpoints
- [ ] Project creation response time < 200ms
- [ ] All 18 new columns accessible
- [ ] No database errors in logs
- [ ] User reports confirm functionality restored

---

## Additional Resources

### Related Documentation
- **Technical Details**: `AVATAR_CREATOR_TECHNICAL_DETAILS.md`
- **Troubleshooting Guide**: `TROUBLESHOOTING_AVATAR_CREATOR.md`
- **Prisma Schema**: `backend/prisma/schema.prisma`

### Support Contacts
- **DevOps Team**: devops@lumiku.com
- **Database Admin**: dba@lumiku.com
- **On-Call Engineer**: See PagerDuty rotation

### Emergency Rollback Contact
If critical issues arise, contact Technical Lead immediately before rolling back.

---

## Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-14 | 1.0 | Initial deployment guide | Dev Team |

---

**Document Status**: APPROVED FOR PRODUCTION USE
