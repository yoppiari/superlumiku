# Avatar Creator Database Migration Deployment Guide

## Problem
- Avatar Creator tables don't exist in production database
- Migration files are blocked by `.gitignore`
- Need to execute SQL migration directly on production server

## Solution Overview
Execute the SQL migration directly on the Coolify server using Docker commands.

## Prerequisites
- SSH access to dev.lumiku.com server
- Coolify application running: `dev-superlumiku`
- Database connection string in environment variables

---

## Method 1: Execute via SSH (Recommended)

### Step 1: Connect to Server
```bash
ssh user@dev.lumiku.com
```

### Step 2: Upload and Execute Migration Script

Upload the migration script to the server:
```bash
# On your local machine
scp deploy-avatar-migration.sh user@dev.lumiku.com:/tmp/
```

Then execute on server:
```bash
ssh user@dev.lumiku.com "bash /tmp/deploy-avatar-migration.sh"
```

**OR** execute all commands manually (see Method 2 below).

---

## Method 2: Manual Docker Commands

If you have direct server access, run these commands:

### 1. Find Running Container
```bash
CONTAINER_ID=$(docker ps --filter "name=dev-superlumiku" --format "{{.ID}}" | head -n1)
echo "Container ID: $CONTAINER_ID"
```

### 2. Copy Migration SQL to Container

First, ensure the migration SQL file is on the server at `/tmp/avatar_migration.sql`.

You can create it manually or use this command:
```bash
cat > /tmp/avatar_migration.sql << 'EOF'
[Paste the entire SQL migration content from backend/prisma/migrations/20251014_add_avatar_creator_complete/migration.sql]
EOF
```

Then copy to container:
```bash
docker cp /tmp/avatar_migration.sql $CONTAINER_ID:/tmp/avatar_migration.sql
```

### 3. Execute Migration
```bash
docker exec -i $CONTAINER_ID bash -c 'psql "$DATABASE_URL" -f /tmp/avatar_migration.sql'
```

### 4. Verify Tables Created
```bash
docker exec -i $CONTAINER_ID bash -c 'psql "$DATABASE_URL" -c "\dt" | grep -E "avatar|pose"'
```

Expected output should show:
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

### 5. Restart Application
```bash
docker restart $CONTAINER_ID
```

### 6. Verify Container is Running
```bash
docker ps | grep dev-superlumiku
```

Wait 30-60 seconds for the application to fully restart.

---

## Method 3: Using Coolify UI Terminal

1. **Access Coolify Dashboard**
   - Go to: https://cf.avolut.com
   - Navigate to Applications > dev-superlumiku

2. **Open Terminal**
   - Click on "Terminal" tab
   - This gives you direct shell access to the container

3. **Create Migration File**
   ```bash
   cat > /tmp/avatar_migration.sql << 'EOF'
   [Paste SQL migration content]
   EOF
   ```

4. **Execute Migration**
   ```bash
   psql "$DATABASE_URL" -f /tmp/avatar_migration.sql
   ```

5. **Verify Tables**
   ```bash
   psql "$DATABASE_URL" -c "\dt" | grep avatar
   ```

6. **Restart from Coolify UI**
   - Click "Restart" button in Coolify dashboard

---

## Method 4: Using Prisma Migrate Deploy (Alternative)

If you can push the migration files to Git:

### Option A: Temporarily Remove .gitignore Block

1. **Edit `.gitignore`**
   ```bash
   # Comment out this line temporarily:
   # backend/prisma/migrations/
   ```

2. **Commit and Push Migration**
   ```bash
   git add backend/prisma/migrations/20251014_add_avatar_creator_complete/
   git commit -m "feat: Add Avatar Creator database migration"
   git push origin development
   ```

3. **Deployment will auto-run migration**
   - Coolify will redeploy
   - Migration runs automatically during build

4. **Restore `.gitignore`**
   ```bash
   # Uncomment:
   backend/prisma/migrations/
   ```
   ```bash
   git commit -m "chore: Restore migrations .gitignore"
   git push origin development
   ```

### Option B: Use `prisma migrate deploy` in Container

```bash
# SSH to server
ssh user@dev.lumiku.com

# Get container ID
CONTAINER_ID=$(docker ps --filter "name=dev-superlumiku" --format "{{.ID}}" | head -n1)

# Execute Prisma migrate deploy
docker exec -i $CONTAINER_ID bash -c 'cd /app/backend && npx prisma migrate deploy'
```

**Note:** This only works if migration files are in the container (which they won't be due to .gitignore).

---

## Verification After Migration

### 1. Check Tables Exist
```bash
docker exec -i $CONTAINER_ID bash -c 'psql "$DATABASE_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = '\''public'\'' AND table_name LIKE '\''avatar%'\'' OR table_name LIKE '\''pose%'\'' ORDER BY table_name;"'
```

### 2. Test Avatar Creator Endpoint

Get your auth token first:
```bash
curl -X POST https://dev.lumiku.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"your-password"}'
```

Then test the endpoint:
```bash
curl -X POST https://dev.lumiku.com/api/apps/avatar-creator/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Avatar Project",
    "description": "Testing migration"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxxxxxxxxxxxxxxx",
    "userId": "clxxxxxxxxxxxxxxxx",
    "name": "Test Avatar Project",
    "description": "Testing migration",
    "createdAt": "2025-10-14T...",
    "updatedAt": "2025-10-14T..."
  }
}
```

### 3. Check Application Logs
```bash
docker logs $CONTAINER_ID --tail 100 --follow
```

Look for:
- ✅ No database errors
- ✅ "Server running on port 3000"
- ✅ Successful health checks

---

## Troubleshooting

### Error: "relation 'avatar_projects' does not exist"
**Cause:** Migration didn't run successfully.

**Solution:**
1. Re-run migration script
2. Check PostgreSQL logs for errors
3. Verify DATABASE_URL is correct

### Error: "foreign key constraint"
**Cause:** Tables created out of order.

**Solution:**
Migration script uses `IF NOT EXISTS` and proper order. Re-run entire script.

### Error: Container not found
**Cause:** Container name doesn't match.

**Solution:**
```bash
# Find actual container name
docker ps --format "table {{.Names}}\t{{.Status}}"

# Update CONTAINER_NAME in script
```

### Migration succeeds but endpoint still fails
**Cause:** Application code not updated.

**Solution:**
1. Verify backend code has Avatar Creator plugin registered
2. Check `backend/src/plugins/loader.ts` includes avatar-creator
3. Restart container: `docker restart $CONTAINER_ID`

---

## Quick Reference Commands

```bash
# Find container
docker ps | grep lumiku

# Check database tables
docker exec -i <container-id> psql "$DATABASE_URL" -c "\dt"

# View recent logs
docker logs <container-id> --tail 50

# Restart container
docker restart <container-id>

# Execute SQL file
docker exec -i <container-id> psql "$DATABASE_URL" -f /tmp/migration.sql

# Check migration status (if using Prisma)
docker exec -i <container-id> npx prisma migrate status
```

---

## Migration SQL File Location

The complete migration SQL is in:
```
backend/prisma/migrations/20251014_add_avatar_creator_complete/migration.sql
```

This file creates **13 tables**:
1. `avatar_projects` - Project containers for avatars
2. `avatars` - Avatar entities (WITH persona fields!)
3. `avatar_presets` - Pre-made avatar templates
4. `persona_examples` - Example personas for users
5. `avatar_usage_history` - Track avatar usage across apps
6. `avatar_generations` - Generation queue/history
7. `pose_categories` - Pose library categories
8. `pose_library` - Pose reference library
9. `pose_generator_projects` - Pose generation projects
10. `pose_generations` - Pose generation queue
11. `generated_poses` - Generated pose results
12. `pose_selections` - User-selected poses
13. `pose_requests` - User pose requests

---

## Important Notes

1. **Persona Fields are CRITICAL**
   - The `avatars` table MUST have: `personaName`, `personaAge`, `personaPersonality`, `personaBackground`
   - These are used for prompt generation in other apps (Pose Generator, etc.)

2. **Foreign Keys**
   - All foreign keys use CASCADE DELETE
   - Deleting a project deletes all avatars in it
   - Deleting an avatar deletes usage history

3. **Indexes**
   - Composite indexes for common queries
   - User-based queries optimized
   - Time-based sorting indexes

4. **Data Types**
   - TEXT for flexible content (prompts, backgrounds)
   - JSONB for structured data (export formats)
   - TIMESTAMP(3) for millisecond precision

---

## Post-Migration Checklist

- [ ] All 13 tables created successfully
- [ ] Foreign keys established
- [ ] Indexes created
- [ ] Container restarted
- [ ] Application logs show no errors
- [ ] POST `/api/apps/avatar-creator/projects` endpoint works
- [ ] Prisma Client regenerated (auto-happens on restart)

---

## Next Steps After Successful Migration

1. **Seed AI Models**
   ```bash
   docker exec -i $CONTAINER_ID bun run prisma db seed
   ```

2. **Verify Dashboard Shows Avatar Creator**
   - Visit: https://dev.lumiku.com
   - Login
   - Check dashboard for "Avatar Creator" app card

3. **Test Full User Flow**
   - Create project
   - Upload/generate avatar
   - View avatar list
   - Use avatar in Pose Generator

---

## Support

If migration fails:
1. Check container logs: `docker logs <container-id>`
2. Check PostgreSQL logs
3. Verify DATABASE_URL environment variable
4. Ensure PostgreSQL version supports all SQL features (13+)

---

**Deployment Script:** `deploy-avatar-migration.sh`
**Migration SQL:** `backend/prisma/migrations/20251014_add_avatar_creator_complete/migration.sql`
**Documentation:** This file

Good luck! 🚀
