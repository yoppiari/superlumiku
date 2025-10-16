# Coolify Deployment Fix - Step-by-Step Guide

## Problem Analysis

The deployment is failing due to **PostgreSQL connection issues**. The application is trying to connect to the database using an external IP address (`107.155.75.50:5986`) instead of the internal Docker hostname.

### Root Causes Identified

1. **DATABASE_URL** uses external IP instead of Docker internal hostname
2. **POSTGRES_HOST** uses external IP instead of Docker internal hostname
3. Migration failed state needs to be resolved
4. Build cache issue causing false "missing module" error

---

## Part 1: Fix Environment Variables (MANUAL - Coolify UI)

The Coolify API key provided has **read-only permissions**, so you need to update environment variables manually through the Coolify web UI.

### Steps to Update Environment Variables

1. **Navigate to Coolify**:
   - Go to: https://cf.avolut.com
   - Login with your credentials
   - Navigate to: Applications > dev-superlumiku > Environment Variables

2. **Update DATABASE_URL**:
   - Find the `DATABASE_URL` variable
   - **Current value**:
     ```
     postgres://postgres:6LP0Ojegy7IUU6kaX9lLkmZRUiAdAUNOltWyL3LegfYGR6rPQtB4DUSVqjdA78ES@107.155.75.50:5986/lumiku-dev
     ```
   - **Change to** (replace external IP with internal Docker hostname):
     ```
     postgresql://postgres:6LP0Ojegy7IUU6kaX9lLkmZRUiAdAUNOltWyL3LegfYGR6rPQtB4DUSVqjdA78ES@ycwc4s4ookos40k44gc8oooc:5432/lumiku-dev
     ```

3. **Update POSTGRES_HOST**:
   - Find the `POSTGRES_HOST` variable
   - **Current value**: `107.155.75.50`
   - **Change to**: `ycwc4s4ookos40k44gc8oooc`

4. **Save Changes**:
   - Click "Save" or "Update" button in Coolify UI

### Why This Fix Works

- `ycwc4s4ookos40k44gc8oooc` is the **internal Docker container name** for your PostgreSQL database
- Docker containers on the same network (coolify) can communicate using container names
- This eliminates network routing issues and connection refused errors
- Port changes from `5986` (external) to `5432` (internal Docker default)

---

## Part 2: Resolve Migration Failed State (MANUAL - Coolify Terminal)

After updating environment variables, you need to fix the migration state.

### Option A: Mark Migration as Applied (Recommended)

Use this if the migration actually ran but Prisma thinks it failed.

1. **Access Coolify Terminal**:
   - In Coolify UI: Applications > dev-superlumiku > Terminal
   - Or SSH into the container

2. **Run this command**:
   ```bash
   cd backend && bunx prisma migrate resolve --applied 20251014_add_avatar_creator_complete
   ```

3. **Verify migration status**:
   ```bash
   bunx prisma migrate status
   ```

### Option B: Roll Back and Re-apply (If Option A Fails)

If the migration is truly corrupted:

1. **Mark as rolled back**:
   ```bash
   cd backend && bunx prisma migrate resolve --rolled-back 20251014_add_avatar_creator_complete
   ```

2. **Re-deploy migration**:
   ```bash
   bunx prisma migrate deploy
   ```

3. **Verify**:
   ```bash
   bunx prisma migrate status
   ```

---

## Part 3: Trigger Force Rebuild (AUTOMATED)

I will trigger a force rebuild via Coolify API to clear build cache and deploy with new environment variables.

**API Command** (will be executed automatically):
```bash
curl -X POST \
  -H "Authorization: Bearer 5|CJbL8liBi6ra65UfLhGlru4YexDVur9U86E9ZxYGc478ab97" \
  https://cf.avolut.com/api/v1/deploy?uuid=d8ggwoo484k8ok48g8k8cgwk&force=true
```

---

## Part 4: Post-Deployment Verification

After deployment completes, verify everything is working:

### 1. Test Database Connection
```bash
# In Coolify terminal
cd backend
bunx prisma db pull
```

Expected: Should connect successfully without "Connection refused" error

### 2. Check Migration Status
```bash
bunx prisma migrate status
```

Expected: All migrations should show as "Applied"

### 3. Test Application Health
```bash
curl https://dev.lumiku.com/api/health
```

Expected: Should return 200 OK with health status

### 4. Check Logs
In Coolify UI, check deployment logs for:
- No PostgreSQL connection errors
- No migration errors
- Application starts successfully

---

## Summary of Changes

| Variable | Old Value | New Value | Reason |
|----------|-----------|-----------|--------|
| DATABASE_URL | `postgres://...@107.155.75.50:5986/...` | `postgresql://...@ycwc4s4ookos40k44gc8oooc:5432/...` | Use internal Docker hostname |
| POSTGRES_HOST | `107.155.75.50` | `ycwc4s4ookos40k44gc8oooc` | Use internal Docker hostname |

---

## Database Information

For reference, your PostgreSQL database details:

- **Database Name**: pges
- **Database UUID**: ycwc4s4ookos40k44gc8oooc
- **Internal Hostname**: ycwc4s4ookos40k44gc8oooc
- **Internal Port**: 5432
- **External Port**: 5986
- **User**: postgres
- **Password**: 6LP0Ojegy7IUU6kaX9lLkmZRUiAdAUNOltWyL3LegfYGR6rPQtB4DUSVqjdA78ES
- **Database**: postgres (default)

**Important**: You're using `/lumiku-dev` as the database name in DATABASE_URL, which is correct for your application.

---

## Troubleshooting

### If Connection Still Fails After Fix

1. **Check Docker Network**:
   ```bash
   docker network inspect coolify
   ```
   Verify both app and database containers are on the same network.

2. **Check Database Container**:
   ```bash
   docker ps | grep ycwc4s4ookos40k44gc8oooc
   ```
   Ensure database container is running.

3. **Test Connection from App Container**:
   ```bash
   # In app terminal
   nc -zv ycwc4s4ookos40k44gc8oooc 5432
   ```
   Should show "Connection succeeded"

### If Migration Issues Persist

1. **Reset Prisma Client**:
   ```bash
   cd backend
   bunx prisma generate
   ```

2. **Check Migration Files**:
   ```bash
   ls -la prisma/migrations/
   ```

3. **Manual Migration** (last resort):
   ```bash
   bunx prisma migrate deploy --force
   ```

---

## Next Steps

1. **YOU DO**: Update environment variables in Coolify UI (Part 1)
2. **I WILL DO**: Trigger force rebuild via API (Part 3)
3. **YOU DO**: Resolve migration state in terminal (Part 2)
4. **BOTH**: Verify deployment success (Part 4)

Let me know once you've updated the environment variables, and I'll trigger the rebuild!
