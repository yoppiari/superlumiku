# Database Seeding Commands for Production

## Summary

The seed will populate the production database with:
- **4 Avatar Creator Models** (FREE, BASIC, PRO tiers)
- **3 Pose Generator Models** (ControlNet + Background Changer)
- **4 Video Generator Models** (Various tiers)
- **3 Poster Editor Models**
- **4 Other App Models** (Video Mixer, Carousel Mix, Looping Flow)
- **Subscription Plans** (Free, Basic, Pro, Enterprise)
- **Pose Generator Categories & Poses**

**Total: 18 AI Models across 6 applications**

---

## Avatar Creator Models (4 models)

The following models will be available for avatar generation:

### 1. FLUX.1-dev Base (FREE tier)
- **Model Key**: `avatar-creator:flux-dev-base`
- **Credit Cost**: 8 credits
- **Resolution**: 512x512 (max 1024x1024)
- **Processing**: 30-45 seconds
- **Features**: Standard quality, no LoRA
- **Access**: All users

### 2. FLUX.1-dev + Realism LoRA (BASIC tier)
- **Model Key**: `avatar-creator:flux-dev-realism`
- **Credit Cost**: 12 credits
- **Resolution**: 768x768 (max 1024x1024)
- **Processing**: 45-60 seconds
- **Features**: Ultra-realistic, photorealistic portraits
- **Access**: BASIC+ users

### 3. FLUX.1-dev HD + Realism LoRA (PRO tier)
- **Model Key**: `avatar-creator:flux-dev-hd-realism`
- **Credit Cost**: 15 credits
- **Resolution**: 1024x1024 (max 1536x1536)
- **Processing**: 60-90 seconds
- **Features**: Ultra HD, maximum detail, premium quality
- **Access**: PRO+ users

### 4. FLUX.1-schnell Fast (BASIC tier)
- **Model Key**: `avatar-creator:flux-schnell-fast`
- **Credit Cost**: 6 credits
- **Resolution**: 512x512 (max 1024x1024)
- **Processing**: 5-15 seconds
- **Features**: Rapid generation, good quality, fast mode
- **Access**: BASIC+ users

---

## Execution Commands

### Method 1: SSH to Server (RECOMMENDED)

```bash
# 1. SSH into Coolify server
ssh root@dev.lumiku.com

# 2. Find the container ID
docker ps | grep dev-superlumiku

# Example output:
# abc123def456  dev-superlumiku  ...

# 3. Execute seed command in container
docker exec -it abc123def456 sh -c "cd /app/backend && bunx prisma db seed"

# Alternative: Enter container shell first
docker exec -it abc123def456 sh
cd /app/backend
bunx prisma db seed
exit
```

### Method 2: Coolify Web UI Terminal

1. Navigate to: https://cf.avolut.com
2. Go to: **Applications** → **dev-superlumiku**
3. Click on: **Terminal** tab
4. Execute:
   ```bash
   cd /app/backend
   bunx prisma db seed
   ```

### Method 3: Post-Deployment Hook (Automatic)

Add to Coolify Application Settings → **Post Deployment Command**:

```bash
cd /app/backend && bunx prisma db seed
```

This will run automatically after every successful deployment.

---

## Expected Output

When the seed runs successfully, you should see:

```
🌱 Starting database seeding...
=====================================

🌱 Seeding subscription plans...
✅ Seeded 4 subscription plans

🌱 Seeding AI models...
✅ Seeded 18 AI models

🌱 Migrating existing users...
✅ Migrated 0 users (or number of existing users)

🌱 Seeding Pose Generator...
✅ Seeded X pose categories
✅ Seeded Y poses

🌱 Creating test user...
✅ Created test user: {
  id: '...',
  email: 'test@lumiku.com',
  name: 'Test User',
  accountType: 'payg',
  tier: 'free'
}
💰 Credit balance: 100

=====================================
✅ Database seeding completed successfully!

Test credentials:
Email: test@lumiku.com
Password: password123
```

---

## Verification Commands

### Check AI Models in Database

```bash
# Inside container or via psql
psql $DATABASE_URL -c "SELECT \"appId\", \"modelKey\", \"tier\", \"creditCost\", \"enabled\" FROM \"AIModel\" WHERE \"appId\" = 'avatar-creator';"
```

Expected output:
```
     appId      |              modelKey              | tier  | creditCost | enabled
----------------+-----------------------------------+-------+------------+---------
 avatar-creator | avatar-creator:flux-dev-base      | free  |          8 | t
 avatar-creator | avatar-creator:flux-dev-realism   | basic |         12 | t
 avatar-creator | avatar-creator:flux-dev-hd-realism| pro   |         15 | t
 avatar-creator | avatar-creator:flux-schnell-fast  | basic |          6 | t
```

### Count All AI Models

```bash
psql $DATABASE_URL -c "SELECT COUNT(*) as total_models FROM \"AIModel\";"
```

Expected: **18 models** (or more if you have existing models)

### Check by Application

```bash
psql $DATABASE_URL -c "SELECT \"appId\", COUNT(*) as model_count FROM \"AIModel\" GROUP BY \"appId\";"
```

Expected output:
```
      appId       | model_count
------------------+-------------
 avatar-creator   |           4
 pose-generator   |           3
 video-generator  |           4
 poster-editor    |           3
 video-mixer      |           1
 carousel-mix     |           1
 looping-flow     |           1
```

---

## Testing Avatar Creation

After seeding, test avatar generation:

### 1. Via API (cURL)

```bash
# Get auth token first
TOKEN=$(curl -X POST https://dev.lumiku.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@lumiku.com","password":"password123"}' \
  | jq -r '.token')

# Generate avatar with FREE model
curl -X POST https://dev.lumiku.com/api/apps/avatar-creator/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Professional headshot of a confident business person",
    "modelId": "flux-dev-base",
    "aspectRatio": "1:1"
  }'
```

### 2. Via Frontend Dashboard

1. Go to: https://dev.lumiku.com
2. Login with test credentials:
   - Email: `test@lumiku.com`
   - Password: `password123`
3. Navigate to **Avatar Creator** app
4. Verify that model dropdown shows all 4 models
5. Free tier user should see:
   - ✅ FLUX.1-dev Base (8 credits)
   - 🔒 FLUX.1-dev + Realism LoRA (Upgrade to BASIC)
   - 🔒 FLUX.1-dev HD + Realism LoRA (Upgrade to PRO)
   - 🔒 FLUX.1-schnell Fast (Upgrade to BASIC)

---

## Troubleshooting

### Issue 1: "Command not found: bunx"

**Solution**: Use `bun` directly
```bash
docker exec -it <container-id> sh -c "cd /app/backend && bun prisma/seed.ts"
```

### Issue 2: "Prisma Client not generated"

**Solution**: Generate Prisma client first
```bash
docker exec -it <container-id> sh -c "cd /app/backend && bunx prisma generate && bunx prisma db seed"
```

### Issue 3: "Cannot connect to database"

**Check DATABASE_URL**:
```bash
docker exec -it <container-id> sh -c "echo \$DATABASE_URL"
```

If empty, check environment variables in Coolify UI.

### Issue 4: Seed runs but models not appearing

**Check seeding logs**:
```bash
# Look for errors in seed output
docker logs <container-id> --tail 100
```

**Verify database connection**:
```bash
docker exec -it <container-id> sh -c "cd /app/backend && bunx prisma db pull"
```

---

## Important Notes

### Idempotent Seeding
The seed script uses `upsert()` operations, making it **safe to run multiple times**:
- Existing models will be **updated** with latest values
- New models will be **created**
- No duplicates will be created

### Production Safety
- ✅ Safe to run on production database
- ✅ Won't delete existing data
- ✅ Won't affect existing users
- ✅ Won't modify user credits
- ⚠️ Will update existing AI model configurations

### Credit Costs
Make sure users have sufficient credits:
- Test user gets 100 free credits (bonus)
- FREE model costs 8 credits (12 generations possible)
- BASIC model costs 12 credits (8 generations possible)
- PRO model costs 15 credits (6 generations possible)

---

## Next Steps After Seeding

1. **Verify models in dashboard**
   - Login and check Avatar Creator
   - Confirm all 4 models are listed
   - Verify tier restrictions work

2. **Test generation**
   - Generate avatar with FREE model
   - Confirm credit deduction
   - Verify image output

3. **Monitor worker**
   - Check PM2 worker is running
   - Monitor Redis queue
   - Watch for processing errors

4. **Update documentation**
   - Document available models
   - Update pricing information
   - Add usage examples

---

## Contact & Support

If you encounter issues:
1. Check Coolify deployment logs
2. Check application logs: `docker logs <container-id>`
3. Check database connectivity
4. Verify environment variables are set correctly

For database access, you'll need:
- `DATABASE_URL` environment variable
- Coolify server SSH access
- OR direct PostgreSQL access credentials
