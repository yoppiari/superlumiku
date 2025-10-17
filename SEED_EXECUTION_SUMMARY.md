# Database Seed Execution Summary

## Mission Status: Ready for Manual Execution

The Coolify API does not provide a direct command execution endpoint (`/execute`, `/exec`, `/command`, or `/shell`). Therefore, the database seed must be executed manually via one of the methods documented below.

## What Was Done

### 1. API Exploration
- ✅ Tested Coolify API for execute endpoints
- ✅ Verified application status: **running:healthy**
- ✅ Retrieved environment variables and container details
- ✅ Attempted post-deployment command approach (caused failed restart)
- ✅ Reverted post-deployment command to prevent future issues
- ✅ Determined manual execution is required

### 2. Documentation Created

I've created comprehensive documentation to help you execute the seed:

| File | Purpose |
|------|---------|
| `EXECUTE_SEED_IN_PRODUCTION.md` | Complete guide with all methods and troubleshooting |
| `SEED_PRODUCTION_QUICK_COMMANDS.sh` | Automated bash script for easy execution |
| `SEED_PRODUCTION_SQL_FALLBACK.sql` | SQL script if Prisma seed fails |
| `COPY_PASTE_SEED_COMMANDS.txt` | Quick copy-paste commands |

### 3. Container Information Retrieved

From Coolify API:
- **Container Naming Pattern**: `d8ggwoo484k8ok48g8k8cgwk-*`
- **Current Status**: running:healthy
- **Network**: coolify
- **Database Container**: ycwc4s4ookos40k44gc8oooc
- **Redis Container**: u8s0cgsks4gcwo84ccskwok4
- **Database**: lumiku-dev
- **Database User**: postgres

## How to Execute the Seed

### RECOMMENDED: Method 1 - Coolify Web UI

This is the easiest method if Coolify UI supports it:

1. **Open Coolify**: https://cf.avolut.com
2. **Navigate to**: Project → dev-superlumiku → Terminal (or Execute Command)
3. **Execute**:
   ```bash
   cd /app/backend && bunx prisma db seed
   ```
4. **Wait** for completion (30-60 seconds)

### ALTERNATIVE: Method 2 - SSH Access

If you have SSH access to the Coolify server:

```bash
# 1. SSH into server
ssh root@<your-coolify-server-ip>

# 2. Find container
CONTAINER=$(docker ps --filter "name=d8ggwoo484k8ok48g8k8cgwk" --format "{{.Names}}" | head -1)

# 3. Execute seed
docker exec $CONTAINER sh -c "cd /app/backend && bunx prisma db seed"

# 4. Verify
docker exec ycwc4s4ookos40k44gc8oooc psql -U postgres -d lumiku-dev \
  -c "SELECT COUNT(*) FROM \"AIModel\" WHERE \"appId\" = 'avatar-creator';"
```

### FALLBACK: Method 3 - Direct SQL

If Prisma seed doesn't work:

```bash
# Connect to database
docker exec -it ycwc4s4ookos40k44gc8oooc psql -U postgres -d lumiku-dev

# Execute SQL (see SEED_PRODUCTION_SQL_FALLBACK.sql for complete script)
# Or paste the INSERT statements directly
```

## Expected Seed Results

The seed will populate:

### Subscription Plans (4)
- Free Plan (50 credits/month)
- Basic Plan (500 credits/month)
- Pro Plan (1,500 credits/month)
- Enterprise Plan (5,000 credits/month)

### Avatar Creator AI Models (4)
| Model | Tier | Credits | Description |
|-------|------|---------|-------------|
| FLUX.1-dev Base | FREE | 8 | Base model for general avatars |
| FLUX.1-schnell Fast | BASIC | 6 | Fast 4-step inference |
| FLUX.1-dev + Realism LoRA | BASIC | 12 | Enhanced photorealism |
| FLUX.1-dev HD + Realism LoRA | PRO | 15 | Maximum quality HD |

### Pose Generator AI Models (3)
| Model | Tier | Credits | Description |
|-------|------|---------|-------------|
| SD 1.5 + OpenPose | FREE | 5 | Base pose-to-image |
| SDXL + OpenPose | BASIC | 10 | Enhanced quality |
| SDXL HD + OpenPose | PRO | 15 | High-definition |

### Other AI Models (11)
- Video Generator (2 models)
- Background Remover (1 model)
- Image Upscaler (2 models)
- Fashion AI (1 model)
- Product Photography (2 models)
- Interior Design (1 model)
- Logo Generator (1 model)
- Social Media Content (1 model)

**Total**: 18 AI models across 8 apps

## Verification Steps

After executing the seed:

### 1. Database Verification
```bash
# Count models
docker exec ycwc4s4ookos40k44gc8oooc psql -U postgres -d lumiku-dev \
  -c "SELECT COUNT(*) FROM \"AIModel\" WHERE \"appId\" = 'avatar-creator';"
# Expected: 4

# List models
docker exec ycwc4s4ookos40k44gc8oooc psql -U postgres -d lumiku-dev \
  -c "SELECT id, name, tier, \"creditCost\" FROM \"AIModel\" WHERE \"appId\" = 'avatar-creator';"
```

### 2. API Verification
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://dev.lumiku.com/api/apps \
  | grep -A 10 avatar-creator
```

### 3. Dashboard Verification
1. Open: https://dev.lumiku.com
2. Login to your account
3. Navigate to Dashboard
4. Verify "Avatar Creator" app is visible
5. Click Avatar Creator
6. Verify AI model dropdown shows 4 models

### 4. Generation Test
1. Select any AI model
2. Enter prompt: "professional business headshot"
3. Click "Generate Avatar"
4. Verify generation completes without errors
5. Verify credits are deducted
6. Verify avatar appears in history

## Troubleshooting Common Issues

### Issue 1: "bunx: command not found"
**Solution**:
```bash
docker exec CONTAINER sh -c "cd /app/backend && bun run prisma:seed"
```

### Issue 2: "Cannot find module '@prisma/client'"
**Solution**:
```bash
docker exec CONTAINER sh -c "cd /app/backend && bunx prisma generate && bunx prisma db seed"
```

### Issue 3: "Database connection failed"
**Check**:
```bash
docker exec CONTAINER env | grep DATABASE_URL
```

### Issue 4: Models seeded but not showing in dashboard
**Solutions**:
1. Clear browser cache (Ctrl+Shift+R)
2. Check API response includes Avatar Creator
3. Verify icon mapping includes 'User' icon
4. Check browser console for errors

### Issue 5: "No AI models available" error persists
**Root Cause**: Models may not match user's subscription tier

**Check**:
```sql
-- Check user tier
SELECT email, "subscriptionTier" FROM "User" LIMIT 5;

-- Check models accessible to FREE tier
SELECT id, name, tier FROM "AIModel"
WHERE "appId" = 'avatar-creator' AND tier = 'FREE';
```

**Solution**: Ensure at least one FREE tier model exists (FLUX.1-dev Base)

## Safety Notes

1. **Idempotent**: The seed script is safe to run multiple times
   - Uses `ON CONFLICT ... DO UPDATE`
   - Won't create duplicates
   - Won't delete existing data

2. **Non-Destructive**: The seed will:
   - ✅ Add missing models
   - ✅ Update existing models
   - ✅ Migrate users to free plan
   - ❌ NOT delete any data
   - ❌ NOT affect existing users' credits

3. **Rollback**: If something goes wrong:
   ```sql
   -- Remove only Avatar Creator models
   DELETE FROM "AIModel" WHERE "appId" = 'avatar-creator';
   ```

## Next Steps After Successful Seed

1. ✅ Verify 4 Avatar Creator models in database
2. ✅ Test dashboard shows Avatar Creator app
3. ✅ Test avatar generation with each model tier
4. ✅ Verify credit deduction works correctly
5. ✅ Monitor application logs for any issues
6. ✅ Test with different user subscription tiers
7. ✅ Document any additional findings

## Support Files Reference

- **Complete Guide**: `EXECUTE_SEED_IN_PRODUCTION.md`
- **Quick Commands**: `COPY_PASTE_SEED_COMMANDS.txt`
- **Automated Script**: `SEED_PRODUCTION_QUICK_COMMANDS.sh`
- **SQL Fallback**: `SEED_PRODUCTION_SQL_FALLBACK.sql`

## Contact & Assistance

If you encounter any issues:
1. Check the troubleshooting section in `EXECUTE_SEED_IN_PRODUCTION.md`
2. Review container logs: `docker logs CONTAINER_NAME --tail 50`
3. Check database connectivity
4. Verify seed file exists in container: `/app/backend/prisma/seeds/`

---

**Status**: Ready for manual execution via Coolify Web UI or SSH

**Last Updated**: 2025-10-17

**Application Status**: running:healthy ✅
