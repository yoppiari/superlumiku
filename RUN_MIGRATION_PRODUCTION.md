# 🚀 MIGRATION GUIDE - PRODUCTION (dev.lumiku.com)

**Tanggal**: 2025-10-11
**Target**: Split Avatar Generator menjadi 2 aplikasi terpisah

---

## 📋 LANGKAH-LANGKAH MIGRATION

### Step 1: Buka Coolify Terminal

1. Buka Coolify dashboard: https://cf.avolut.com
2. Pilih project **dev-superlumiku**
3. Klik tab **"Terminal"**

### Step 2: Jalankan Migration Commands

Copy-paste command berikut **SATU PER SATU** di Coolify Terminal:

```bash
# 1. Masuk ke direktori backend
cd /app/backend

# 2. Jalankan Prisma migration (AUTOMATIC)
bun prisma migrate deploy

# 3. Generate Prisma Client baru
bun prisma generate

# 4. Verify migration sukses
bun prisma migrate status
```

### Step 3: Restart Application

Setelah migration selesai:

1. Kembali ke tab **"Deployments"**
2. Klik tombol **"Restart"** (icon hijau)
3. Tunggu aplikasi restart (~10-20 detik)

### Step 4: Verify di Dashboard

1. Buka: https://dev.lumiku.com/dashboard
2. Refresh halaman (Ctrl+F5)
3. **Yang HARUS terlihat**:
   - ✅ **Avatar Creator** (purple icon, user-circle)
   - ✅ **Pose Generator** (blue icon, sparkles)
   - ❌ **Avatar & Pose Generator** (aplikasi lama HILANG)

---

## 🔧 ALTERNATIF: Manual SQL Migration

Jika `bun prisma migrate deploy` error, gunakan SQL manual:

```bash
# 1. Download migration file ke container
cd /app
cat > migration.sql << 'EOF'
-- ALTER TABLE Avatar
ALTER TABLE "avatars" ALTER COLUMN "brandKitId" DROP NOT NULL;
ALTER TABLE "avatars" ADD COLUMN IF NOT EXISTS "usageCount" INTEGER NOT NULL DEFAULT 0;

-- ALTER TABLE PoseTemplate
ALTER TABLE "pose_templates" ADD COLUMN IF NOT EXISTS "fashionCategory" TEXT;
ALTER TABLE "pose_templates" ADD COLUMN IF NOT EXISTS "sceneType" TEXT;
ALTER TABLE "pose_templates" ADD COLUMN IF NOT EXISTS "professionTheme" TEXT;

-- CREATE INDEXES
CREATE INDEX IF NOT EXISTS "pose_templates_fashionCategory_idx" ON "pose_templates"("fashionCategory");
CREATE INDEX IF NOT EXISTS "pose_templates_sceneType_idx" ON "pose_templates"("sceneType");

-- ALTER TABLE PoseGenerationProject
ALTER TABLE "pose_generation_projects" DROP COLUMN IF EXISTS "brandKitId";

-- ALTER TABLE PoseGeneration
ALTER TABLE "pose_generations" ALTER COLUMN "projectId" DROP NOT NULL;
ALTER TABLE "pose_generations" DROP COLUMN IF EXISTS "brandKitId";
ALTER TABLE "pose_generations" DROP COLUMN IF EXISTS "poseDistribution";
ALTER TABLE "pose_generations" ADD COLUMN IF NOT EXISTS "selectedPoseIds" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "pose_generations" ADD COLUMN IF NOT EXISTS "batchSize" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "pose_generations" ADD COLUMN IF NOT EXISTS "quality" TEXT NOT NULL DEFAULT 'sd';
ALTER TABLE "pose_generations" ADD COLUMN IF NOT EXISTS "fashionSettings" TEXT;
ALTER TABLE "pose_generations" ADD COLUMN IF NOT EXISTS "backgroundSettings" TEXT;
ALTER TABLE "pose_generations" ADD COLUMN IF NOT EXISTS "professionTheme" TEXT;

-- ALTER TABLE GeneratedPose
ALTER TABLE "generated_poses" ALTER COLUMN "productId" DROP NOT NULL;
ALTER TABLE "generated_poses" ALTER COLUMN "generationTime" SET DEFAULT 0;

-- Update foreign key constraints
ALTER TABLE "avatars" DROP CONSTRAINT IF EXISTS "avatars_brandKitId_fkey";
ALTER TABLE "avatars" ADD CONSTRAINT "avatars_brandKitId_fkey"
  FOREIGN KEY ("brandKitId") REFERENCES "brand_kits"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "generated_poses" DROP CONSTRAINT IF EXISTS "generated_poses_productId_fkey";
ALTER TABLE "generated_poses" ADD CONSTRAINT "generated_poses_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pose_generations" DROP CONSTRAINT IF EXISTS "pose_generations_projectId_fkey";
ALTER TABLE "pose_generations" ADD CONSTRAINT "pose_generations_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "pose_generation_projects"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
EOF

# 2. Jalankan SQL migration
psql $DATABASE_URL -f migration.sql

# 3. Generate Prisma Client
bun prisma generate
```

---

## ⚠️ TROUBLESHOOTING

### Error: "Column already exists"
Aman, skip error dan lanjutkan. Artinya kolom sudah ada.

### Error: "Cannot reach database"
Check DATABASE_URL environment variable:
```bash
echo $DATABASE_URL
```

### Migration sukses tapi app masih error
Restart aplikasi via Coolify dashboard.

### Aplikasi lama masih muncul
Clear browser cache dan refresh (Ctrl+Shift+R)

---

## ✅ SUCCESS INDICATORS

Setelah migration sukses, Anda akan lihat di logs:

```
✅ Plugin registered: Avatar Creator (avatar-creator)
✅ Plugin registered: Pose Generator (pose-generator)
📦 Loaded 7 plugins
✅ Enabled: 7
🚀 Dashboard apps: 7
```

Dan di dashboard:
- **Avatar Creator** dengan icon user-circle (purple)
- **Pose Generator** dengan icon sparkles (blue)

---

**Ready to proceed?** 🚀
