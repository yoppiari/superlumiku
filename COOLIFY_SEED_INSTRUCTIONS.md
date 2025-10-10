# Coolify: Seed Pose Templates Database

## Prerequisites

✅ Deployment completed (check Coolify UI)
✅ Application running at https://dev.lumiku.com
✅ Seed script available at `/app/backend/scripts/seed-pose-templates.ts`

## Step 1: Verify Seed Script Deployed

Run in Coolify terminal:

```bash
# Check if seed script exists
ls -la /app/backend/scripts/seed-pose-templates.ts

# If exists, you'll see file size (~7-8 KB)
# If not found, wait for deployment to complete or trigger redeploy
```

## Step 2: Install Python Dependencies

```bash
pip3 install datasets pillow
```

## Step 3: Download Fashion Dataset (800 samples)

Copy and paste this entire block into Coolify terminal:

```bash
python3 << 'EOPYTHON'
from datasets import load_dataset
from pathlib import Path
import json

# Configuration
DATASET_NAME = "SaffalPoosh/deepFashion-with-masks"
SAMPLE_LIMIT = 800
OUTPUT_DIR = Path("/app/backend/storage/pose-dataset/fashion")

print("=" * 60)
print("Fashion Dataset Downloader for Coolify")
print("=" * 60)
print(f"Dataset: {DATASET_NAME}")
print(f"Samples: {SAMPLE_LIMIT}")
print(f"Output: {OUTPUT_DIR}\n")

# Create output directory
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
print(f"[OK] Output directory created: {OUTPUT_DIR}\n")

# Load dataset
print("[LOAD] Loading dataset from Hugging Face...")
print("This may take a few minutes depending on network speed...")
dataset = load_dataset(DATASET_NAME, split=f"train[:{SAMPLE_LIMIT}]")
print(f"[OK] Loaded {len(dataset)} samples\n")

# Process samples
print(f"[PROCESS] Processing {len(dataset)} samples...")
metadata = []

for idx, sample in enumerate(dataset):
    # Progress indicator every 100 samples
    if (idx + 1) % 100 == 0:
        print(f"   Progress: {idx + 1}/{len(dataset)} ({(idx+1)/len(dataset)*100:.1f}%)")

    # Save images
    image_filename = f"fashion_{idx:04d}_image.jpg"
    mask_filename = f"fashion_{idx:04d}_mask.jpg"

    sample['image'].save(OUTPUT_DIR / image_filename)
    sample['mask'].save(OUTPUT_DIR / mask_filename)

    # Build metadata
    item = {
        "id": f"fashion_{idx:04d}",
        "category": "fashion",
        "gender": sample.get("gender", "unknown"),
        "pose": sample.get("pose", "unknown"),
        "cloth": sample.get("cloth", "unknown"),
        "caption": sample.get("caption", ""),
        "pid": sample.get("pid", ""),
        "image_filename": image_filename,
        "mask_filename": mask_filename,
        "mask_overlay_filename": ""
    }
    metadata.append(item)

# Save metadata
metadata_path = OUTPUT_DIR / "metadata.json"
with open(metadata_path, 'w') as f:
    json.dump(metadata, f, indent=2)

print("\n" + "=" * 60)
print("[SUCCESS] Fashion dataset download complete!")
print(f"   Samples: {len(metadata)}")
print(f"   Files: {len(metadata) * 2 + 1} (images + masks + metadata)")
print(f"   Location: {OUTPUT_DIR}")
print(f"   Metadata: {metadata_path}")

# Statistics
gender_counts = {}
for item in metadata:
    gender = item.get('gender', 'unknown').upper()
    gender_counts[gender] = gender_counts.get(gender, 0) + 1

print("\n[STATS] Gender Distribution:")
for gender, count in sorted(gender_counts.items(), key=lambda x: x[1], reverse=True):
    percentage = (count / len(metadata)) * 100
    print(f"   {gender}: {count} ({percentage:.1f}%)")

print("\n[DONE] Ready for database seeding!")
print("=" * 60)
EOPYTHON
```

**Expected Duration**: 5-10 minutes (depending on network speed)

## Step 4: Verify Download

```bash
# Check number of files
find /app/backend/storage/pose-dataset/fashion/ -type f | wc -l
# Should output: 1601 (800 images + 800 masks + 1 metadata.json)

# Check metadata
head -50 /app/backend/storage/pose-dataset/fashion/metadata.json

# Check a sample image
ls -lh /app/backend/storage/pose-dataset/fashion/ | head -20
```

## Step 5: Run Seed Script

```bash
cd /app/backend
bun run scripts/seed-pose-templates.ts --fashion-only
```

**Expected Output:**
```
[SEED] Starting Pose Templates Seeding
==================================================
[OK] Database connected

[FASHION] Seeding fashion poses...
[FASHION] Loading 800 fashion poses
   [FASHION] Seeded 50/800...
   [FASHION] Seeded 100/800...
   ...
   [FASHION] Seeded 800/800...
[OK] Fashion poses seeded: 800

==================================================
[SUCCESS] Pose Templates Seeding Complete!
   Total poses seeded: 800
==================================================

[VERIFY] Total poses in database: 800

[STATS] Database Statistics:
   By category:
      fashion: 800
   By difficulty:
      easy: ~400
      medium: ~300
      hard: ~100
   By gender:
      female: ~696
      male: ~104
```

## Step 6: Verify Database

```bash
# Open Prisma Studio (if accessible)
cd /app/backend
bun run prisma studio

# Or query directly
cd /app/backend
bun run prisma db seed
```

## Troubleshooting

### Issue: "pip3: command not found"

```bash
# Install pip first
apt-get update && apt-get install -y python3-pip
```

### Issue: "datasets module not found"

```bash
# Reinstall with verbose output
pip3 install --upgrade datasets pillow
```

### Issue: "Permission denied" on /app/backend/storage

```bash
# Fix permissions
chmod -R 755 /app/backend/storage
chown -R root:root /app/backend/storage
```

### Issue: "Module not found: seed-pose-templates.ts"

The deployment might not be complete. Check:
1. Go to Coolify UI → Deployments tab
2. Wait for deployment to finish (green checkmark)
3. Or trigger manual redeploy

### Issue: Database connection error

```bash
# Check DATABASE_URL environment variable
env | grep DATABASE_URL

# Test database connection
cd /app/backend
bun run prisma db pull
```

## Optional: Download Lifestyle Dataset (300 samples)

If you want to add lifestyle poses too:

```bash
python3 << 'EOPYTHON'
from datasets import load_dataset
from pathlib import Path
import json

OUTPUT_DIR = Path("/app/backend/storage/pose-dataset/lifestyle")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

print("Downloading 300 lifestyle poses...")
dataset = load_dataset("raulc0399/open_pose_controlnet", split="train[:300]")

metadata = []
for idx, sample in enumerate(dataset):
    if (idx + 1) % 50 == 0:
        print(f"Progress: {idx + 1}/300")

    img_file = f"lifestyle_{idx:04d}_image.jpg"
    cond_file = f"lifestyle_{idx:04d}_conditioning.jpg"

    sample['image'].save(OUTPUT_DIR / img_file)
    sample['conditioning_image'].save(OUTPUT_DIR / cond_file)

    metadata.append({
        "id": f"lifestyle_{idx:04d}",
        "category": "lifestyle",
        "text": sample.get("text", ""),
        "image_filename": img_file,
        "conditioning_filename": cond_file,
    })

with open(OUTPUT_DIR / "metadata.json", 'w') as f:
    json.dump(metadata, f)

print(f"✅ Downloaded {len(metadata)} lifestyle poses!")
EOPYTHON

# Then seed lifestyle poses
cd /app/backend
bun run scripts/seed-pose-templates.ts --lifestyle-only
```

---

**Next Steps After Seeding:**
1. Test pose template queries via API
2. Build pose selection UI
3. Integrate with ControlNet for avatar generation
4. Week 2 Day 2: API endpoints for pose templates

**Status**: Week 2 Day 1 - Dataset seeding ready 🎯
