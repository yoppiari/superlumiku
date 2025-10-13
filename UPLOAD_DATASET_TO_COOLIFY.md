# Upload Pose Dataset to Coolify

## Step 1: Compress Dataset Locally (Faster Upload)

Compress dataset ke ZIP untuk upload lebih cepat:

```bash
# Windows (PowerShell)
cd "C:\Users\yoppi\Downloads\Lumiku App\backend\storage"
Compress-Archive -Path "pose-dataset" -DestinationPath "pose-dataset.zip"
```

## Step 2: Upload to Coolify

```bash
# Upload ZIP file
scp "C:\Users\yoppi\Downloads\Lumiku App\backend\storage\pose-dataset.zip" root@cf.avolut.com:/tmp/

# Or upload uncompressed (slower, 1601 files)
scp -r "C:\Users\yoppi\Downloads\Lumiku App\backend\storage\pose-dataset" root@cf.avolut.com:/tmp/
```

## Step 3: Extract and Move in Coolify Terminal

Jalankan di Coolify terminal:

```bash
# Option A: If uploaded ZIP
cd /tmp
unzip pose-dataset.zip
mkdir -p /app/backend/storage
mv pose-dataset /app/backend/storage/
rm pose-dataset.zip

# Option B: If uploaded folder directly
mkdir -p /app/backend/storage
mv /tmp/pose-dataset /app/backend/storage/

# Verify
ls -la /app/backend/storage/pose-dataset/fashion/
cat /app/backend/storage/pose-dataset/fashion/metadata.json | head -20
```

## Step 4: Run Seed Script

```bash
cd /app/backend
bun run scripts/seed-pose-templates.ts --fashion-only
```

---

## Alternative: Direct SCP to App Directory

If you have direct access to app path in Coolify:

```bash
# Find app path first (run in Coolify terminal)
pwd  # Should show /app or similar

# Then from local Windows (PowerShell)
scp -r "C:\Users\yoppi\Downloads\Lumiku App\backend\storage\pose-dataset" root@cf.avolut.com:/app/backend/storage/
```

---

## Troubleshooting

### Permission Denied
```bash
# Fix permissions in Coolify
chmod -R 755 /app/backend/storage/pose-dataset
```

### Disk Space Check
```bash
# Check available space
df -h /app
```

### Upload Progress Monitor
```bash
# Use rsync for better progress monitoring
rsync -avz --progress "C:\Users\yoppi\Downloads\Lumiku App\backend\storage\pose-dataset/" root@cf.avolut.com:/tmp/pose-dataset/
```
