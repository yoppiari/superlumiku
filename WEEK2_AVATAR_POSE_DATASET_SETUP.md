# Week 2: Avatar & Pose Generator - Dataset Setup

## Overview
Week 2 focuses on preparing pose template datasets for the Avatar & Pose Generator system.

**Goal**: Seed 700-1,100 pose templates into production database

## Progress Summary

### ✅ Completed Tasks

1. **Download Fashion Dataset** (800 samples)
   - Source: `SaffalPoosh/deepFashion-with-masks` (Hugging Face)
   - Downloaded: 800 fashion model poses locally
   - Files: 1,601 files (800 images + 800 masks + metadata.json)
   - Gender distribution: 696 Women (87%), 104 Men (13%)
   - Compressed: 12.56 MB ZIP file

2. **Create Seed Script**
   - File: `backend/scripts/seed-pose-templates.ts`
   - Features:
     - Batch processing (50 records/batch)
     - Fashion & lifestyle dataset support
     - Automatic difficulty assignment
     - Tag generation
     - Statistics reporting
   - Status: ✅ Committed to `development` branch

3. **Setup Git Branch Policy**
   - Created `.claude/BRANCH_POLICY.md`
   - Default branch: `development` (deployed to dev.lumiku.com)
   - Production branch: `main` (deployed to app.lumiku.com)

4. **Deploy to Coolify**
   - ✅ Pushed seed script to `development` branch
   - ✅ Triggered Coolify deployment via API
   - Deployment UUID: `uw0kw8c80kc0w4cw4c448kkw`
   - Auto-deploy: Enabled

### 🔄 In Progress

5. **Wait for Coolify Deployment**
   - Estimated time: 2-5 minutes
   - Will pull latest code from `development` branch
   - Seed script will be available at `/app/backend/scripts/seed-pose-templates.ts`

### 📋 Next Steps

6. **Download Dataset on Coolify Server**
   - Use Python script directly on server
   - Download fashion dataset (800 samples)
   - Optionally download lifestyle dataset (300 samples)

7. **Seed Production Database**
   - Run seed script: `bun run scripts/seed-pose-templates.ts --fashion-only`
   - Verify seeded data with Prisma Studio
   - Check pose_templates table statistics

## Deployment Instructions

### Option 1: Download Dataset on Coolify (Recommended)

```bash
# SSH to Coolify container
ssh root@cf.avolut.com

# Navigate to app directory
cd /app

# Install Python dependencies
pip install datasets pillow

# Create download script for fashion dataset
cat > backend/scripts/download-fashion-dataset.py << 'EOF'
# [Script content - see below]
EOF

# Download datasets
cd backend/scripts
python download-fashion-dataset.py
python download-lifestyle-dataset.py

# Verify downloads
ls -la ../storage/pose-dataset/fashion/
ls -la ../storage/pose-dataset/lifestyle/

# Run seed script
cd ..
bun run scripts/seed-pose-templates.ts
```

### Option 2: Upload Local Dataset (Alternative)

If network on Coolify is limited, upload local dataset:

```bash
# From local machine
scp -r backend/storage/pose-dataset root@cf.avolut.com:/app/backend/storage/

# Then SSH and run seed script
ssh root@cf.avolut.com
cd /app/backend
bun run scripts/seed-pose-templates.ts
```

## Dataset Structure

```
backend/storage/pose-dataset/
├── fashion/
│   ├── metadata.json (800 items)
│   ├── fashion_0000_image.jpg
│   ├── fashion_0000_mask.jpg
│   └── ... (1,600 files total)
└── lifestyle/
    ├── metadata.json (300 items)
    ├── lifestyle_0000_image.jpg
    ├── lifestyle_0000_conditioning.jpg (OpenPose skeleton)
    └── ... (600 files total)
```

## Seed Script Usage

```bash
# Seed all datasets
bun run scripts/seed-pose-templates.ts

# Seed fashion only
bun run scripts/seed-pose-templates.ts --fashion-only

# Seed lifestyle only
bun run scripts/seed-pose-templates.ts --lifestyle-only

# Limit number of poses
bun run scripts/seed-pose-templates.ts --limit=100
```

## Expected Results

After seeding:
- **Fashion poses**: 800 records
- **Lifestyle poses**: 300 records (pending download)
- **Total**: 1,100 pose templates

Database statistics:
```
By category:
  fashion: 800
  lifestyle: 300

By difficulty:
  easy: ~400
  medium: ~500
  hard: ~200

By gender:
  female: ~696
  male: ~104
  unisex: ~300
```

## Troubleshooting

### Network Issues During Download

If Hugging Face download fails:
1. Check internet connection
2. Try smaller batch: `--limit=100`
3. Use alternative mirror (if available)
4. Upload from local instead

### Database Connection Issues

If Prisma can't connect:
1. Check `DATABASE_URL` in Coolify env vars
2. Verify PostgreSQL service is running
3. Test connection: `bun run prisma db pull`

### Seed Script Errors

Common issues:
- **Missing metadata.json**: Re-run download script
- **Duplicate entries**: Script uses `skipDuplicates: true`, safe to re-run
- **Out of memory**: Reduce `BATCH_SIZE` in script

## Next: Week 2 Day 2

After dataset seeding:
1. Test pose template queries
2. Build pose selection API endpoints
3. Integrate with Avatar Generator UI
4. Test ControlNet pose generation

---

**Status**: Week 2 Day 1 - Dataset preparation in progress
**Last Updated**: 2025-10-10
