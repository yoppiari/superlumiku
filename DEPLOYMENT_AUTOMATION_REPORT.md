# Coolify Deployment Automation Report

**Date**: 2025-10-16
**Application**: dev-superlumiku
**Deployment UUID**: l800go4wwsogswswoko4oskc
**Status**: IN PROGRESS (Building)

---

## Executive Summary

I've analyzed the deployment errors and automated what was possible via the Coolify API. The deployment is currently building with force rebuild enabled to clear build cache.

### What Was Automated via API

1. **Environment Variable Analysis** - Fetched and analyzed all current env vars
2. **Database Hostname Issue Identified** - Found external IP being used instead of internal Docker hostname
3. **Force Rebuild Triggered** - Deployment queued and currently building

### What Requires Manual Action (Coolify UI)

Due to **read-only API key permissions**, you must manually update environment variables in the Coolify web UI.

---

## Problem Analysis

### Error 1: PostgreSQL Connection Refused

**Root Cause**: Application is using external IP address (`107.155.75.50:5986`) to connect to PostgreSQL database instead of internal Docker hostname.

**Impact**:
- Database migrations fail
- Application cannot start
- Connection refused errors

**Why This Happens**:
- Docker containers on the same network should communicate using container names
- External IPs require network routing and may be blocked by firewall rules
- Internal Docker hostnames provide direct container-to-container communication

### Error 2: Missing Module (Build Cache)

**Root Cause**: Docker build cache contains stale references to pose-generator WebSocket module.

**Impact**:
- False positive error messages
- Confusing deployment logs

**Solution**: Force rebuild (already triggered via API)

### Error 3: Migration Failed State

**Root Cause**: Migration `20251014_add_avatar_creator_complete` started but marked as failed in Prisma's migration history.

**Impact**:
- Cannot run new migrations
- Database schema may be inconsistent

**Solution**: Mark migration as applied or rolled back (requires terminal access)

---

## Actions Taken (Automated)

### 1. Environment Variable Analysis

**API Call**:
```bash
curl -H "Authorization: Bearer 5|..." \
  https://cf.avolut.com/api/v1/applications/d8ggwoo484k8ok48g8k8cgwk/envs
```

**Results**:
- Fetched 39 environment variables
- Identified DATABASE_URL using external IP: `107.155.75.50:5986`
- Identified POSTGRES_HOST using external IP: `107.155.75.50`
- Confirmed Redis configuration is correct (already using internal hostname)

### 2. Database Resource Discovery

**API Call**:
```bash
curl -H "Authorization: Bearer 5|..." \
  https://cf.avolut.com/api/v1/databases
```

**Results**:
- Found PostgreSQL database: **pges** (UUID: `ycwc4s4ookos40k44gc8oooc`)
- Confirmed internal hostname: `ycwc4s4ookos40k44gc8oooc`
- Confirmed internal port: `5432`
- External port: `5986` (for external access only)

### 3. Force Rebuild Deployment Triggered

**API Call**:
```bash
curl -X POST \
  -H "Authorization: Bearer 5|..." \
  "https://cf.avolut.com/api/v1/deploy?uuid=d8ggwoo484k8ok48g8k8cgwk&force=true"
```

**Response**:
```json
{
  "deployments": [{
    "message": "Application dev-superlumiku deployment queued.",
    "resource_uuid": "d8ggwoo484k8ok48g8k8cgwk",
    "deployment_uuid": "l800go4wwsogswswoko4oskc"
  }]
}
```

**Status**: Currently building (Stage 2: Backend builder installing dependencies)

---

## Actions Required (Manual)

### CRITICAL: Update Environment Variables

You **MUST** update these environment variables in Coolify UI before the deployment can succeed:

#### Navigate to Coolify
1. Go to: https://cf.avolut.com
2. Navigate to: **Applications** > **dev-superlumiku** > **Environment Variables**

#### Update DATABASE_URL

**Current (Incorrect)**:
```
postgres://postgres:6LP0Ojegy7IUU6kaX9lLkmZRUiAdAUNOltWyL3LegfYGR6rPQtB4DUSVqjdA78ES@107.155.75.50:5986/lumiku-dev
```

**New (Correct)**:
```
postgresql://postgres:6LP0Ojegy7IUU6kaX9lLkmZRUiAdAUNOltWyL3LegfYGR6rPQtB4DUSVqjdA78ES@ycwc4s4ookos40k44gc8oooc:5432/lumiku-dev
```

**Changes**:
- Hostname: `107.155.75.50` → `ycwc4s4ookos40k44gc8oooc`
- Port: `5986` → `5432`
- Scheme: `postgres://` → `postgresql://` (best practice)

#### Update POSTGRES_HOST

**Current (Incorrect)**:
```
107.155.75.50
```

**New (Correct)**:
```
ycwc4s4ookos40k44gc8oooc
```

#### Save Changes
Click "Save" or "Update" in Coolify UI.

---

## Post-Deployment Steps (After Env Vars Updated)

### Step 1: Resolve Migration State

Access Coolify Terminal:
- **Coolify UI**: Applications > dev-superlumiku > Terminal
- **Or**: SSH into running container

Run this command:
```bash
cd backend && bunx prisma migrate resolve --applied 20251014_add_avatar_creator_complete
```

Verify:
```bash
bunx prisma migrate status
```

### Step 2: Test Database Connection

```bash
cd backend
bunx prisma db pull
```

Expected: No "Connection refused" errors

### Step 3: Verify Application Health

```bash
curl https://dev.lumiku.com/api/health
```

Expected: HTTP 200 OK

---

## Database Configuration Reference

### PostgreSQL Database Details

| Property | Value |
|----------|-------|
| **Database Name** | pges |
| **Database UUID** | ycwc4s4ookos40k44gc8oooc |
| **Internal Hostname** | ycwc4s4ookos40k44gc8oooc |
| **Internal Port** | 5432 |
| **External IP** | 107.155.75.50 |
| **External Port** | 5986 |
| **User** | postgres |
| **Password** | 6LP0Ojegy7IUU6kaX9lLkmZRUiAdAUNOltWyL3LegfYGR6rPQtB4DUSVqjdA78ES |
| **Database** | postgres (default schema) |
| **Application DB** | lumiku-dev (application schema) |

**Note**: The application uses `/lumiku-dev` as the database name, which is correct.

### Redis Configuration (Already Correct)

| Property | Value |
|----------|-------|
| **Redis UUID** | u8s0cgsks4gcwo84ccskwok4 |
| **Internal Hostname** | u8s0cgsks4gcwo84ccskwok4 |
| **Internal Port** | 6379 |
| **Password** | 43bgTxX07rGOxcDeD2Z67qc57qSAH39KEUJXCHap7W613KVNZPnLaOBdBG2Z0Yq6 |

**Status**: No changes needed for Redis - already using internal hostname.

---

## API Key Limitations Discovered

The provided API key has **read-only permissions**:

```
{"message":"Missing required permissions: write"}
```

This prevented automated environment variable updates. To enable full automation in the future, generate a new API key with **write permissions** in Coolify settings.

---

## Current Deployment Status

**Deployment UUID**: l800go4wwsogswswoko4oskc
**Commit SHA**: e9f1a0bbb600a858d2eee81170f0b32e95ed53ef
**Branch**: development
**Force Rebuild**: Enabled
**Status**: Building (Docker image compilation in progress)

**Current Build Stage**: Installing backend dependencies (Stage 2)

**Monitor Deployment**:
- Coolify UI: https://cf.avolut.com/project/sws0ckk/environment/wgcsog0wcog040cgssoow00c/application/d8ggwoo484k8ok48g8k8cgwk/deployment/l800go4wwsogswswoko4oskc
- Logs available in Coolify deployment view

---

## Expected Timeline

1. **Now**: Building Docker image (5-10 minutes)
2. **After build completes**: Container will start
3. **On container start**: Migrations will attempt to run
4. **If env vars NOT updated**: Connection refused errors will occur
5. **After env vars updated + redeploy**: Deployment should succeed

---

## Troubleshooting Guide

### If Connection Still Fails After Env Var Update

#### Test Database Connectivity
```bash
nc -zv ycwc4s4ookos40k44gc8oooc 5432
```
Expected: "Connection succeeded"

#### Check Database Container
```bash
docker ps | grep ycwc4s4ookos40k44gc8oooc
```
Expected: Container running with status "healthy"

#### Check Docker Network
```bash
docker network inspect coolify
```
Verify both app and database containers are on the same network.

### If Migration Issues Persist

#### Regenerate Prisma Client
```bash
cd backend
bunx prisma generate
```

#### Force Migration Deploy
```bash
bunx prisma migrate deploy --force
```

#### Manual Migration Resolution
```bash
# If migration applied successfully but Prisma thinks it failed
bunx prisma migrate resolve --applied 20251014_add_avatar_creator_complete

# If migration needs to be rolled back
bunx prisma migrate resolve --rolled-back 20251014_add_avatar_creator_complete
bunx prisma migrate deploy
```

---

## Files Created for Your Reference

1. **COOLIFY_DEPLOYMENT_FIX.md** - Comprehensive step-by-step guide
2. **COPY_PASTE_COOLIFY_FIX.txt** - Quick copy/paste commands
3. **DEPLOYMENT_AUTOMATION_REPORT.md** - This document

---

## Next Steps - Action Items

### IMMEDIATE (Required for Deployment Success)

- [ ] **YOU**: Update `DATABASE_URL` in Coolify UI
- [ ] **YOU**: Update `POSTGRES_HOST` in Coolify UI
- [ ] **YOU**: Save environment variable changes
- [ ] **WAIT**: Current deployment to complete or fail
- [ ] **YOU**: Trigger new deployment (or I can do via API if needed)

### AFTER NEW DEPLOYMENT

- [ ] **YOU**: Access Coolify terminal
- [ ] **YOU**: Run migration resolution command
- [ ] **YOU**: Verify migration status
- [ ] **YOU**: Test database connection
- [ ] **YOU**: Test application health endpoint
- [ ] **VERIFY**: Application accessible at https://dev.lumiku.com

### OPTIONAL (For Future Automation)

- [ ] **YOU**: Generate new Coolify API key with write permissions
- [ ] **YOU**: Update API key in automation scripts
- [ ] **BENEFIT**: Future deployments can be fully automated

---

## Summary

### What I Did
- Analyzed deployment errors via Coolify API
- Identified root cause: External IP usage instead of internal Docker hostname
- Triggered force rebuild to clear build cache
- Created comprehensive documentation and copy/paste guides

### What You Need to Do
1. Update DATABASE_URL in Coolify UI (change hostname and port)
2. Update POSTGRES_HOST in Coolify UI (change to Docker container UUID)
3. Wait for current deployment to complete
4. Trigger new deployment (if needed)
5. Resolve migration state in terminal
6. Verify deployment success

### Expected Outcome
After environment variables are updated and deployment completes:
- PostgreSQL connection will succeed using internal Docker hostname
- Migrations will run successfully
- Application will start without errors
- https://dev.lumiku.com will be accessible and functional

---

**Need Help?**
Let me know once you've updated the environment variables, and I can trigger another deployment via API or assist with any troubleshooting steps.
