# Execute Database Seed in Production

## Summary

The Coolify API doesn't provide a direct command execution endpoint. You need to SSH into the Coolify server and execute the seed command in the running container.

## Environment Details

- **Server**: localhost (Coolify host)
- **Application**: dev-superlumiku
- **Container Name Pattern**: `d8ggwoo484k8ok48g8k8cgwk-*`
- **Database URL**: Already configured in environment variables

## Method 1: Via Coolify Web UI (Recommended)

### Step 1: Access Coolify Terminal
1. Go to https://cf.avolut.com
2. Navigate to your project → dev-superlumiku application
3. Click on "Terminal" or "Execute Command" tab (if available)

### Step 2: Execute Seed Command
Run this command in the terminal:
```bash
cd /app/backend && bunx prisma db seed
```

### Expected Output:
```
🌱 Starting database seeding...
=====================================

🌱 Seeding subscription plans...
✅ Seeded 4 subscription plans

🌱 Seeding AI models...
✅ Seeded 18 AI models

🌱 Migrating existing users...
✅ Migrated X users

🌱 Seeding Pose Generator...
✅ Seeded X pose categories
✅ Seeded Y poses

🌱 Creating test user...
✅ Created test user
💰 Credit balance: 100

=====================================
✅ Database seeding completed successfully!
```

## Method 2: Via SSH to Coolify Server

### Step 1: SSH into Coolify Server
```bash
ssh root@<your-coolify-server-ip>
```

### Step 2: Find Running Container
```bash
docker ps | grep d8ggwoo484k8ok48g8k8cgwk
```

This will show something like:
```
d8ggwoo484k8ok48g8k8cgwk-000726218104   d8ggwoo484k8ok48g8k8cgwk:a844dc...   Up 2 hours   0.0.0.0:3000->3000/tcp
```

### Step 3: Execute Seed Command in Container
```bash
# Replace CONTAINER_NAME with the actual container name from previous step
docker exec -it d8ggwoo484k8ok48g8k8cgwk-000726218104 sh -c "cd /app/backend && bunx prisma db seed"
```

### Alternative: Direct execution
```bash
docker exec d8ggwoo484k8ok48g8k8cgwk-000726218104 /bin/sh -c "cd /app/backend && bunx prisma db seed"
```

## Method 3: Via Database Direct SQL (Fallback)

If the seed script doesn't work, you can manually insert the AI models:

### Step 1: Connect to PostgreSQL
```bash
docker exec -it ycwc4s4ookos40k44gc8oooc psql -U postgres -d lumiku-dev
```

### Step 2: Insert AI Models Manually
```sql
-- Insert Avatar Creator AI Models
INSERT INTO "AIModel" (id, "appId", name, tier, "modelId", "creditCost", enabled, description)
VALUES
  ('avatar-flux-dev-base', 'avatar-creator', 'FLUX.1-dev Base', 'FREE', 'black-forest-labs/FLUX.1-dev', 8, true, 'Base FLUX.1-dev model for high-quality avatar generation'),
  ('avatar-flux-schnell', 'avatar-creator', 'FLUX.1-schnell Fast', 'BASIC', 'black-forest-labs/FLUX.1-schnell', 6, true, 'Fast generation with FLUX.1-schnell (4-step inference)'),
  ('avatar-flux-dev-realism', 'avatar-creator', 'FLUX.1-dev + Realism LoRA', 'BASIC', 'black-forest-labs/FLUX.1-dev', 12, true, 'Enhanced realism with XLabs-AI/flux-RealismLora'),
  ('avatar-flux-dev-hd-realism', 'avatar-creator', 'FLUX.1-dev HD + Realism LoRA', 'PRO', 'black-forest-labs/FLUX.1-dev', 15, true, 'Maximum quality HD generation with realism enhancement')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  tier = EXCLUDED.tier,
  "modelId" = EXCLUDED."modelId",
  "creditCost" = EXCLUDED."creditCost",
  enabled = EXCLUDED.enabled,
  description = EXCLUDED.description;
```

### Step 3: Verify Models Inserted
```sql
SELECT id, name, tier, "creditCost" FROM "AIModel" WHERE "appId" = 'avatar-creator';
```

Expected output:
```
              id               |             name              | tier  | creditCost
-------------------------------+-------------------------------+-------+------------
 avatar-flux-dev-base          | FLUX.1-dev Base              | FREE  |          8
 avatar-flux-schnell           | FLUX.1-schnell Fast          | BASIC |          6
 avatar-flux-dev-realism       | FLUX.1-dev + Realism LoRA    | BASIC |         12
 avatar-flux-dev-hd-realism    | FLUX.1-dev HD + Realism LoRA | PRO   |         15
```

## Verification After Seeding

### 1. Check Database
```bash
docker exec -it ycwc4s4ookos40k44gc8oooc psql -U postgres -d lumiku-dev -c "SELECT COUNT(*) FROM \"AIModel\" WHERE \"appId\" = 'avatar-creator';"
```

Expected: `4` models

### 2. Check API Endpoint
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://dev.lumiku.com/api/apps | grep -A 5 avatar-creator
```

### 3. Check Dashboard
1. Login to https://dev.lumiku.com
2. Navigate to Dashboard
3. Verify "Avatar Creator" app appears in the app grid
4. Click on Avatar Creator
5. Verify AI model dropdown shows 4 models

### 4. Test Avatar Generation
1. Select an AI model from dropdown
2. Enter a prompt: "professional headshot of a business person"
3. Click "Generate Avatar"
4. Verify generation completes without "No AI models available" error

## Troubleshooting

### Issue: "bunx: command not found"
**Solution**: Bun is installed, try:
```bash
docker exec -it CONTAINER_NAME /bin/sh -c "cd /app/backend && bun run prisma:seed"
```

### Issue: "Cannot find module '@prisma/client'"
**Solution**: Generate Prisma client first:
```bash
docker exec -it CONTAINER_NAME /bin/sh -c "cd /app/backend && bunx prisma generate && bunx prisma db seed"
```

### Issue: "Database connection failed"
**Solution**: Check DATABASE_URL environment variable is set:
```bash
docker exec -it CONTAINER_NAME env | grep DATABASE_URL
```

### Issue: Seed script errors
**Solution**: Check seed file exists:
```bash
docker exec -it CONTAINER_NAME ls -la /app/backend/prisma/seeds/
```

### Issue: Models inserted but not showing in dashboard
**Root Causes**:
1. Frontend cache - Clear browser cache and hard refresh (Ctrl+Shift+R)
2. API not returning models - Check `/api/apps` endpoint response
3. Icon mapping missing - Check `iconMap` in Dashboard.tsx includes 'User' icon

## Container Information

From Coolify API, your container details:
- **Network**: coolify
- **Port**: 3000
- **Image**: d8ggwoo484k8ok48g8k8cgwk:a844dc16f1c3054ef75b9de9be089cc9af881e44
- **Database Container**: ycwc4s4ookos40k44gc8oooc (PostgreSQL)
- **Redis Container**: u8s0cgsks4gcwo84ccskwok4

## Environment Variables (Already Configured)

- `DATABASE_URL`: postgresql://postgres:***@ycwc4s4ookos40k44gc8oooc:5432/lumiku-dev
- `POSTGRES_HOST`: ycwc4s4ookos40k44gc8oooc
- `POSTGRES_USER`: postgres
- `POSTGRES_DB`: lumiku-dev
- `REDIS_HOST`: u8s0cgsks4gcwo84ccskwok4

## Next Steps After Successful Seed

1. ✅ Verify 4 Avatar Creator AI models in database
2. ✅ Verify Avatar Creator appears in dashboard
3. ✅ Test avatar generation with each model
4. ✅ Verify credit deduction works correctly
5. ✅ Check error handling still works properly
6. ✅ Monitor application logs for any issues

## Support

If you encounter issues:
1. Check Coolify application logs
2. Check container logs: `docker logs CONTAINER_NAME`
3. Check database connectivity
4. Verify seed file contents match expected structure
