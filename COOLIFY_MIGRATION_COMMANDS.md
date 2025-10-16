# Coolify Migration & Deployment Commands

**CRITICAL**: Execute these commands in the **exact order** specified below. Each step includes verification commands to confirm success before proceeding.

---

## Prerequisites Checklist

Before running any commands, verify:

- [ ] `.env.coolify.template` has been copied to Coolify environment variables
- [ ] All `[REQUIRED]` placeholders in `.env` have been replaced with actual values
- [ ] `JWT_SECRET` has been generated (64 chars minimum)
- [ ] `REDIS_PASSWORD` has been generated (32 chars minimum)
- [ ] `HUGGINGFACE_API_KEY` has been obtained from Hugging Face
- [ ] PostgreSQL and Redis services are running in Coolify
- [ ] Persistent volume is mounted at `/app/backend/uploads`

---

## Step 1: Verify Environment Setup

**Open Coolify Terminal** for your backend application and run:

```bash
# Check Node.js version (should be 18+ or 20+)
node --version

# Verify environment variables are loaded
echo "Checking critical environment variables..."
echo "DATABASE_URL exists: $([ -n "$DATABASE_URL" ] && echo 'YES' || echo 'NO')"
echo "JWT_SECRET exists: $([ -n "$JWT_SECRET" ] && echo 'YES' || echo 'NO')"
echo "REDIS_HOST exists: $([ -n "$REDIS_HOST" ] && echo 'YES' || echo 'NO')"
echo "HUGGINGFACE_API_KEY exists: $([ -n "$HUGGINGFACE_API_KEY" ] && echo 'YES' || echo 'NO')"

# Check directory structure
ls -la /app/backend/
```

**Expected Output**: All environment variables should show `YES`. If any show `NO`, stop and fix environment configuration.

---

## Step 2: Database Connection Test

Test PostgreSQL connection before running migrations:

```bash
# Navigate to backend directory
cd /app/backend

# Test database connection using Prisma
npx prisma db execute --stdin <<SQL
SELECT NOW() as current_time;
SQL
```

**Expected Output**: Should show current database timestamp. If connection fails, verify `DATABASE_URL` in environment variables.

**Troubleshooting**:
- If connection refused: Check PostgreSQL service is running
- If authentication failed: Verify `POSTGRES_PASSWORD` matches Coolify service
- If database not found: Create database first using Coolify PostgreSQL UI

---

## Step 3: Run Database Migrations

**CRITICAL**: This creates all required tables in production database.

```bash
# Navigate to backend directory (if not already there)
cd /app/backend

# Generate Prisma Client
npx prisma generate

# Run all pending migrations
npx prisma migrate deploy

# Verify migrations succeeded
npx prisma migrate status
```

**Expected Output**:
```
✓ All migrations have been applied successfully
```

**Verification**: Check that tables exist:

```bash
npx prisma db execute --stdin <<SQL
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
SQL
```

**Expected Tables** (should include):
- `User`
- `App`
- `AIModel`
- `CreditTransaction`
- `AvatarGeneration`
- `PoseGeneration`
- `_prisma_migrations`

**If migrations fail**:
```bash
# Check migration status
npx prisma migrate status

# If stuck, reset and re-apply (DANGER: Only for fresh deployment)
npx prisma migrate reset --force
npx prisma migrate deploy
```

---

## Step 4: Seed AI Models (CRITICAL)

**This step populates the database with AI models required for the dashboard.**

```bash
# Navigate to backend directory
cd /app/backend

# Run AI models seed
npm run db:seed:ai-models

# Alternative if npm script not available
npx tsx prisma/seeds/ai-models.seed.ts
```

**Expected Output**:
```
🌱 Seeding AI models...
✅ Seeded 20 AI models
```

**Verification**: Check that AI models exist in database:

```bash
npx prisma db execute --stdin <<SQL
SELECT app_id, COUNT(*) as model_count
FROM "AIModel"
GROUP BY app_id
ORDER BY app_id;
SQL
```

**Expected Output** (minimum):
```
app_id            | model_count
------------------|------------
avatar-creator    | 4
carousel-mix      | 1
looping-flow      | 1
pose-generator    | 3  <-- NEW MODELS
poster-editor     | 3
video-generator   | 4
video-mixer       | 1
```

**CRITICAL**: Verify `pose-generator` has exactly **3 models**. If missing, re-run seed.

---

## Step 5: Verify Pose Generator Models

Confirm the 3 new Pose Generator models are correctly seeded:

```bash
npx prisma db execute --stdin <<SQL
SELECT
  model_id,
  name,
  tier,
  credit_cost,
  enabled
FROM "AIModel"
WHERE app_id = 'pose-generator'
ORDER BY credit_cost;
SQL
```

**Expected Output**:
```
model_id                    | name                         | tier  | credit_cost | enabled
----------------------------|------------------------------|-------|-------------|--------
background-changer-sam      | Background Changer (SAM)     | basic | 10          | true
flux-controlnet-standard    | FLUX ControlNet Standard     | basic | 30          | true
flux-controlnet-pro         | FLUX ControlNet Pro          | pro   | 40          | true
```

**If models are missing**:
```bash
# Re-run seed file
npm run db:seed:ai-models

# Check for errors in seed execution
npx tsx --trace-warnings prisma/seeds/ai-models.seed.ts
```

---

## Step 6: Test Redis Connection

Verify Redis is accessible and workers can connect:

```bash
# Test Redis connection using Node
node -e "
const Redis = require('ioredis');
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  lazyConnect: true
});

redis.connect()
  .then(() => {
    console.log('✅ Redis connection successful');
    return redis.set('test-key', 'test-value');
  })
  .then(() => redis.get('test-key'))
  .then(value => {
    console.log('✅ Redis read/write test passed:', value);
    return redis.quit();
  })
  .catch(err => {
    console.error('❌ Redis connection failed:', err.message);
    process.exit(1);
  });
"
```

**Expected Output**:
```
✅ Redis connection successful
✅ Redis read/write test passed: test-value
```

**If Redis fails**:
- Verify `REDIS_HOST` and `REDIS_PORT` are correct
- Check `REDIS_PASSWORD` matches Coolify Redis service
- Ensure Redis service is running in Coolify

---

## Step 7: Create Storage Directories

Ensure upload directories exist with correct permissions:

```bash
# Create required directories
mkdir -p /app/backend/uploads/avatars
mkdir -p /app/backend/uploads/pose-generator
mkdir -p /app/backend/uploads/outputs
mkdir -p /app/backend/uploads/temp

# Set permissions (if running as root)
chmod -R 755 /app/backend/uploads

# Verify directories exist
ls -la /app/backend/uploads/
```

**Expected Output**: All directories should exist with proper permissions.

**CRITICAL**: Verify persistent volume is mounted in Coolify settings:
- Go to Coolify > Your App > Storage
- Ensure volume mounted at `/app/backend/uploads`

---

## Step 8: Health Check

Test application health endpoint:

```bash
# If application is running locally in container
curl http://localhost:3000/api/health

# Or from outside (replace with your domain)
curl https://your-domain.com/api/health
```

**Expected Output**:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-16T...",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

**If health check fails**:
```bash
# Check application logs
pm2 logs

# Or check Docker logs in Coolify
docker logs $(docker ps -q --filter name=your-app)
```

---

## Step 9: Restart Application

After successful migrations and seeding, restart the application:

**In Coolify Dashboard**:
1. Go to your backend application
2. Click "Restart" button
3. Wait for deployment to complete
4. Check deployment logs for errors

**Or via terminal** (if using PM2):
```bash
pm2 restart all
pm2 logs
```

---

## Step 10: Final Verification

Run comprehensive checks to ensure everything works:

```bash
# 1. Check database has data
npx prisma db execute --stdin <<SQL
SELECT
  (SELECT COUNT(*) FROM "User") as users,
  (SELECT COUNT(*) FROM "App") as apps,
  (SELECT COUNT(*) FROM "AIModel") as ai_models;
SQL

# 2. Verify Pose Generator models
npx prisma db execute --stdin <<SQL
SELECT model_key, enabled
FROM "AIModel"
WHERE app_id = 'pose-generator';
SQL

# 3. Test API endpoint (replace with your domain)
curl https://your-domain.com/api/mainapp/apps

# 4. Check worker status (if using PM2)
pm2 status
```

**Expected Results**:
- Users: 0 or more (depending on if you've seeded users)
- Apps: 8+ (should include pose-generator)
- AI Models: 20+ (minimum, should include 3 pose-generator models)
- API endpoint returns JSON with list of apps
- Workers are running without errors

---

## Rollback Procedure (Emergency Only)

If deployment fails and you need to rollback:

```bash
# 1. Check migration history
npx prisma migrate status

# 2. Rollback last migration (DANGER: Data loss possible)
npx prisma migrate resolve --rolled-back "migration_name"

# 3. Or reset to specific migration
# Note: This is destructive and should only be used in development
npx prisma migrate reset --force

# 4. Restore from backup (recommended for production)
# Use Coolify PostgreSQL backup feature
```

**IMPORTANT**: Always backup database before major migrations in production.

---

## Troubleshooting Guide

### Issue: "Module not found" errors

```bash
# Reinstall dependencies
cd /app/backend
npm install

# Rebuild native modules
npm rebuild
```

### Issue: "Cannot connect to database"

```bash
# Check PostgreSQL service status in Coolify
# Verify DATABASE_URL environment variable
echo $DATABASE_URL

# Test direct connection
psql $DATABASE_URL -c "SELECT 1;"
```

### Issue: "Redis connection timeout"

```bash
# Check Redis service status in Coolify
# Verify Redis environment variables
echo "Host: $REDIS_HOST"
echo "Port: $REDIS_PORT"
echo "Password length: ${#REDIS_PASSWORD}"

# Test Redis CLI connection
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD ping
```

### Issue: "Pose Generator models not showing in dashboard"

This is the critical blocker. Verify:

```bash
# 1. Check if models exist in database
npx prisma db execute --stdin <<SQL
SELECT * FROM "AIModel" WHERE app_id = 'pose-generator';
SQL

# 2. If empty, re-run seed
npm run db:seed:ai-models

# 3. Verify seed file has latest changes
cat backend/prisma/seeds/ai-models.seed.ts | grep -A 5 "pose-generator"

# 4. Clear application cache (if using Redis)
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD FLUSHALL
```

### Issue: "Permission denied" on uploads directory

```bash
# Check directory permissions
ls -la /app/backend/uploads/

# Fix permissions
chmod -R 755 /app/backend/uploads/
chown -R node:node /app/backend/uploads/

# Verify persistent volume is mounted
df -h | grep uploads
```

---

## Post-Deployment Checklist

After successful deployment, verify:

- [ ] Database migrations completed (check `npx prisma migrate status`)
- [ ] AI models seeded (minimum 20 models)
- [ ] Pose Generator has 3 models (flux-controlnet-standard, flux-controlnet-pro, background-changer-sam)
- [ ] Redis connected (check health endpoint)
- [ ] Storage directories exist with permissions
- [ ] Health endpoint returns 200 OK
- [ ] Dashboard loads without errors
- [ ] Avatar Creator visible in dashboard
- [ ] Pose Generator visible in dashboard (CRITICAL FIX)
- [ ] Background workers running
- [ ] Logs show no errors

---

## Support & Documentation

- **Prisma Migrations**: https://www.prisma.io/docs/concepts/components/prisma-migrate
- **Coolify Docs**: https://coolify.io/docs
- **Redis Connection**: https://redis.io/docs/connect/cli/

---

## Quick Reference Commands

```bash
# Check migration status
npx prisma migrate status

# Run migrations
npx prisma migrate deploy

# Seed AI models
npm run db:seed:ai-models

# View AI models in database
npx prisma studio

# Restart application
pm2 restart all

# View logs
pm2 logs

# Health check
curl http://localhost:3000/api/health
```

---

**Last Updated**: 2025-10-16
**Version**: 1.0.0
**Critical Fix**: Added 3 Pose Generator AI models to resolve dashboard filtering issue
