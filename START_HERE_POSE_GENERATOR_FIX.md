# START HERE: Pose Generator Not Visible Fix

**Last Updated:** 2025-10-16
**Status:** Root cause identified, ready to fix
**Time to Fix:** 2-3 minutes

---

## Quick Navigation

Choose your path based on your role and time:

### 1. Executive / Manager (2 min read)
📄 **Read:** `EXECUTIVE_SUMMARY_POSE_GENERATOR_INVISIBLE.md`
- What happened
- Why it happened
- Business impact
- Fix timeline

### 2. DevOps / Engineer (1 min action)
🚀 **Execute:** `COPY_PASTE_TO_COOLIFY_TERMINAL.txt`
- Copy/paste commands
- Run in Coolify terminal
- Verify success
- Test dashboard

### 3. Technical Investigation (10 min read)
🔍 **Read:** `POSE_GENERATOR_NOT_VISIBLE_INVESTIGATION.md`
- Complete root cause analysis
- Database state examination
- Plugin registration verification
- API endpoint testing
- Prevention strategies

### 4. Visual Guide (5 min read)
📊 **Read:** `POSE_GENERATOR_INVISIBLE_QUICK_FIX.md`
- Flow diagrams
- Current state analysis
- Step-by-step fix
- Verification checklist

### 5. Automated Script (1 min execution)
⚙️ **Run:** `FIX_POSE_GENERATOR_NOW.sh`
- Self-contained bash script
- Runs seed and verification
- Color-coded output
- Success/failure detection

### 6. Database Verification (2 min)
🗄️ **Run:** `verify-pose-generator-data.sql`
- Comprehensive SQL checks
- AI models verification
- Category and pose counts
- Data integrity checks
- Summary report

---

## TL;DR - The One Command Fix

```bash
cd /app/backend && bun prisma/seed.ts
```

**Where to run:** Coolify → Applications → Lumiku → Terminal
**Time:** 2-3 minutes
**Restart needed:** No

---

## Problem Summary

**What's wrong?**
Pose Generator is deployed but invisible on dashboard.

**Why?**
Database not seeded with AI models (0 models = filtered out).

**Fix?**
Run seed script to insert AI models and pose data.

**Risk?**
Very low - seeds are idempotent (safe to run multiple times).

---

## Current State

```
Production: https://dev.lumiku.com
Health: ✅ OK (service running)
Code: ✅ Deployed (latest commit)
Migrations: ✅ Complete (tables exist)
Seeds: ❌ Not run (data missing)
Dashboard: ❌ Pose Generator invisible
```

---

## File Directory

```
Investigation & Fix Documentation
├── START_HERE_POSE_GENERATOR_FIX.md ← You are here
├── EXECUTIVE_SUMMARY_POSE_GENERATOR_INVISIBLE.md
├── POSE_GENERATOR_NOT_VISIBLE_INVESTIGATION.md
├── POSE_GENERATOR_INVISIBLE_QUICK_FIX.md
├── COPY_PASTE_TO_COOLIFY_TERMINAL.txt
├── FIX_POSE_GENERATOR_NOW.sh
└── verify-pose-generator-data.sql
```

---

## Quick Action Guide

### Step 1: Open Coolify
1. Go to your Coolify dashboard
2. Navigate: Applications → Lumiku Backend
3. Click: "Terminal" tab

### Step 2: Run Seed Command
Copy and paste:
```bash
cd /app/backend && bun prisma/seed.ts
```

### Step 3: Wait for Completion (2-3 min)
Expected output:
```
🌱 Starting database seeding...
✅ Seeded 4 subscription plans
✅ Seeded 28 AI models
✅ Seeded 33 categories
✅ Seeded 150 poses
✅ Database seeding completed successfully!
```

### Step 4: Verify (Optional)
```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"AIModel\" WHERE \"appId\" = 'pose-generator';"
```
Expected: `3`

### Step 5: Test Dashboard
1. Open: https://dev.lumiku.com/dashboard
2. Login: test@lumiku.com / password123
3. Look for: Pose Generator (should now be visible!)

---

## What Gets Seeded?

### Subscription Plans (4)
- Free: 0 credits/month
- Basic: 100 credits/month
- Pro: 500 credits/month
- Enterprise: Unlimited

### AI Models (28 total, 3 for Pose Generator)
1. **FLUX ControlNet Standard** (30 credits)
   - Standard quality pose-to-avatar
   - 768x768 resolution
   - 45-60s processing

2. **FLUX ControlNet Pro** (40 credits)
   - Premium quality pose-to-avatar
   - 1024x1024 resolution
   - 60-90s processing

3. **Background Changer (SAM)** (10 credits)
   - AI background replacement
   - Segment Anything Model
   - 15-30s processing

### Pose Categories (33)
**Top-level (6):**
- Portraits
- Fashion & Modeling
- Action & Sports
- Business & Professional
- Artistic & Creative
- Lifestyle & Candid

**Sub-categories (27):**
- Headshots, Full Body, Side Profile, etc.
- Runway, Editorial, Casual, etc.
- Running, Jumping, Yoga, etc.
- [22 more...]

### Pose Library (150+)
- **Beginner:** 75 poses (50%)
- **Intermediate:** 52 poses (35%)
- **Advanced:** 23 poses (15%)

**Gender Suitability:**
- Unisex: 100 poses
- Female: 30 poses
- Male: 20 poses

**Special:**
- Premium: 30 poses
- Featured: 15 poses

---

## Troubleshooting

### Issue: "bun: command not found"
**Try:**
```bash
node /app/backend/prisma/seed.ts
```

### Issue: Seed completes but Pose Generator still invisible
**Try:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Check AI models:
   ```bash
   psql "$DATABASE_URL" -c "SELECT * FROM \"AIModel\" WHERE \"appId\" = 'pose-generator';"
   ```
3. Check backend logs:
   ```bash
   pm2 logs backend --lines 50 | grep -i pose
   ```

### Issue: Seed fails with database error
**Try:**
1. Check database connection:
   ```bash
   psql "$DATABASE_URL" -c "SELECT version();"
   ```
2. Check migrations are up to date:
   ```bash
   cd /app/backend && bun prisma migrate status
   ```
3. Re-run migrations if needed:
   ```bash
   bun prisma migrate deploy
   ```

### Issue: Permission denied
**Try:**
```bash
chmod +x /app/backend/prisma/seed.ts
bun /app/backend/prisma/seed.ts
```

---

## FAQ

**Q: Will this affect existing users?**
A: No. Seeds only add AI models and pose library. User data untouched.

**Q: Do I need to restart the backend?**
A: No. Seeds just insert data. Changes are immediate.

**Q: Is it safe to run seeds multiple times?**
A: Yes. Seeds use `upsert` (update-or-insert). No duplicates.

**Q: Why did this happen?**
A: Docker entrypoint runs migrations (CREATE TABLE) but not seeds (INSERT DATA). Seeds must be run manually or added to entrypoint.

**Q: How do we prevent this in the future?**
A: Add auto-seeding to `docker/docker-entrypoint.sh`. See long-term fix in investigation doc.

**Q: What if I want to verify before running?**
A: Run the SQL verification script:
```bash
psql "$DATABASE_URL" < verify-pose-generator-data.sql
```

---

## Success Criteria

After running the fix, you should see:

### Database ✅
```sql
-- AI Models: 3
-- Categories: 33
-- Poses: 150+
```

### Dashboard ✅
```
✅ Avatar Creator
✅ Video Mixer
✅ Carousel Mix
✅ Pose Generator (NEW!)
```

### Pose Generator App ✅
- Click Pose Generator
- See category selector
- Click a category
- See list of poses
- Click a pose
- See generation interface

---

## Next Steps After Fix

### Immediate
- [ ] Verify Pose Generator visible on dashboard
- [ ] Test selecting a category
- [ ] Test selecting a pose
- [ ] Test generating an avatar (end-to-end)

### Short-term
- [ ] Add auto-seeding to docker-entrypoint.sh
- [ ] Test auto-seeding in staging
- [ ] Deploy auto-seeding to production
- [ ] Update deployment documentation

### Long-term
- [ ] Add health check for AI models
- [ ] Add monitoring for app visibility
- [ ] Create deployment checklist
- [ ] Document seed vs migration difference

---

## Documentation Index

| File | Type | Time | Audience |
|------|------|------|----------|
| `EXECUTIVE_SUMMARY_POSE_GENERATOR_INVISIBLE.md` | Summary | 2 min | Executives, Managers |
| `POSE_GENERATOR_NOT_VISIBLE_INVESTIGATION.md` | Investigation | 10 min | Engineers, DevOps |
| `POSE_GENERATOR_INVISIBLE_QUICK_FIX.md` | Guide | 5 min | Engineers |
| `COPY_PASTE_TO_COOLIFY_TERMINAL.txt` | Commands | 1 min | Anyone |
| `FIX_POSE_GENERATOR_NOW.sh` | Script | 3 min | Automation |
| `verify-pose-generator-data.sql` | SQL | 2 min | Database admins |

---

## Key Contacts

- **Production:** https://dev.lumiku.com
- **Health:** https://dev.lumiku.com/health
- **Dashboard:** https://dev.lumiku.com/dashboard
- **Test User:** test@lumiku.com / password123

---

## Status Updates

### 2025-10-16 - Initial Investigation
- ✅ Deployment verified (code is live)
- ✅ Plugin registration verified
- ✅ Database tables verified (migrations ran)
- ✅ Root cause identified (seeds not run)
- ✅ Fix documented and ready
- ⏳ Waiting for seed execution

---

**Created by:** Claude Code (Lumiku Deployment Specialist)
**Investigation Date:** 2025-10-16
**Documentation:** 7 files, 500+ lines
**Confidence:** Very High (100%)

**Ready to fix?** Start with `COPY_PASTE_TO_COOLIFY_TERMINAL.txt`
