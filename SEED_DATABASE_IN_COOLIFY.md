# Seed Database in Coolify - Step by Step Guide

## ✅ Fix Applied

The `package.json` has been updated with the correct Prisma seed configuration:

```json
"prisma": {
  "seed": "bun run prisma/seed.ts"
}
```

**Git commit pushed to development branch:** `5fcf499`

---

## 🚀 Deployment Status

Your latest commit has been pushed successfully. Coolify should auto-deploy soon.

**Check deployment status:**
1. Go to Coolify dashboard: https://dev.lumiku.com (or your Coolify URL)
2. Navigate to your app: **d8ggwoo484k8ok48g8k8cgwk**
3. Check "Deployments" tab - you should see a new deployment starting for commit `5fcf499`

---

## 📋 After Deployment Completes

Once the deployment shows **SUCCESS**, follow these steps in the Coolify terminal:

### Step 1: Access Coolify Terminal

1. Open your Coolify dashboard
2. Navigate to your application
3. Click on **"Terminal"** or **"Execute Command"**

### Step 2: Navigate to Backend Directory

```bash
cd backend
```

### Step 3: Verify Package.json Configuration

```bash
cat package.json | grep -A 3 '"prisma"'
```

**Expected output:**
```json
"prisma": {
  "seed": "bun run prisma/seed.ts"
},
```

### Step 4: Run Prisma Seed

```bash
bunx prisma db seed
```

**Expected output:**
```
🌱 Starting database seeding...
=====================================

🌱 Seeding Subscription Plans...
✓ Subscription Plans seeded: 3 plans created/updated

🌱 Seeding AI Models...
✓ AI Models seeded: X models created/updated

🌱 Migrating Existing Users...
✓ Migrated X users to new credit system

🌱 Seeding Pose Generator...
✓ Pose Categories seeded: X categories created
✓ Pose Library seeded: X poses created

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

### Step 5: Verify AI Models Were Created

```bash
bunx prisma studio
# OR use psql:
psql $DATABASE_URL -c "SELECT id, name, \"appId\", \"modelType\" FROM \"AIModel\" LIMIT 10;"
```

**Expected:** You should see AI models for Avatar Creator with appId = `avatar-creator`

### Step 6: Verify Dashboard Shows Avatar Creator

Open your browser and go to:
```
https://dev.lumiku.com/dashboard
```

**You should now see:**
- Avatar Creator card in the dashboard
- All other apps with AI models
- No more "No apps available" message

---

## 🐛 Troubleshooting

### Error: "bunx: command not found"

If `bunx` is not available, try:

```bash
# Option 1: Use bun directly
bun run prisma/seed.ts

# Option 2: Use npx
npx prisma db seed

# Option 3: Install and use bunx
npm install -g bunx
bunx prisma db seed
```

### Error: "Cannot find module 'prisma/seed.ts'"

Check current directory:
```bash
pwd
ls -la prisma/
```

Make sure you're in the `backend` directory. If not:
```bash
cd /app/backend  # or wherever backend is located
```

### Error: Database connection issues

Verify DATABASE_URL is set:
```bash
echo $DATABASE_URL
```

If empty, check environment variables in Coolify dashboard.

### Error: "Seed already executed" or conflicts

Reset and re-seed (⚠️ DEVELOPMENT ONLY):
```bash
bunx prisma migrate reset --force
bunx prisma db seed
```

---

## 📊 Verification Commands

After seeding, verify everything worked:

### Check AI Models Count
```bash
psql $DATABASE_URL -c "SELECT \"appId\", COUNT(*) FROM \"AIModel\" GROUP BY \"appId\";"
```

### Check Subscription Plans
```bash
psql $DATABASE_URL -c "SELECT * FROM \"SubscriptionPlan\";"
```

### Check Pose Generator Data
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) as categories FROM \"PoseCategory\";"
psql $DATABASE_URL -c "SELECT COUNT(*) as poses FROM \"PoseLibraryItem\";"
```

### Check Test User
```bash
psql $DATABASE_URL -c "SELECT email, \"accountType\", \"subscriptionTier\" FROM \"User\" WHERE email = 'test@lumiku.com';"
```

---

## ✅ Success Criteria

You'll know everything worked when:

1. ✅ Seed command completes without errors
2. ✅ AI models exist in database for all apps
3. ✅ Avatar Creator appears in dashboard at dev.lumiku.com
4. ✅ All app cards are visible (not filtered out)
5. ✅ Test user can login with test@lumiku.com / password123
6. ✅ Credits system is populated for existing users

---

## 🔄 If Deployment Hasn't Started Yet

If Coolify hasn't auto-deployed the latest commit, manually trigger it:

### Option 1: Via Coolify UI
1. Go to Coolify dashboard
2. Navigate to your app
3. Click **"Deploy"** button
4. Select branch: **development**
5. Wait for deployment to complete

### Option 2: Via Git Webhook (if configured)
The push to development should have triggered a webhook.
Check Coolify → Settings → Webhooks to verify it's enabled.

### Option 3: Force Pull in Coolify Terminal
```bash
# In Coolify terminal (root directory)
git pull origin development
pm2 restart all
```

---

## 📝 Summary

**What was fixed:**
- ✅ Updated `backend/package.json` prisma.seed configuration
- ✅ Changed from `"bun prisma/seed.ts"` to `"bun run prisma/seed.ts"`
- ✅ Committed to development branch
- ✅ Pushed to GitHub

**What you need to do:**
1. ⏳ Wait for Coolify deployment to complete (check dashboard)
2. 🖥️ Open Coolify terminal
3. 📂 `cd backend`
4. 🌱 `bunx prisma db seed`
5. ✅ Verify dashboard shows Avatar Creator

**Expected result:**
- Database is fully seeded
- AI models populated
- Avatar Creator appears in dashboard
- All apps accessible

---

## 🆘 Need Help?

If you encounter any issues:

1. **Check deployment logs** in Coolify dashboard
2. **Share error messages** from terminal
3. **Verify database connection** with `psql $DATABASE_URL -c "SELECT version();"`
4. **Check app logs** with `pm2 logs backend`

---

**Last updated:** After commit `5fcf499` - Prisma seed configuration fix
