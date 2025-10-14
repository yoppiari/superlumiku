# Avatar Usage Tracking Implementation

## Overview
Implementasi sistem tracking untuk avatar yang menampilkan semua atribut, timestamp, dan history penggunaan di aplikasi.

## Perubahan Database

### 1. Update Avatar Model
- **File**: `backend/prisma/schema.prisma`
- **Perubahan**:
  - Tambah field `lastUsedAt DateTime?` - track kapan terakhir avatar digunakan
  - Tambah relasi `usageHistory AvatarUsageHistory[]`

### 2. Model Baru: AvatarUsageHistory
- **File**: `backend/prisma/schema.prisma`
- **Tujuan**: Tracking detail penggunaan avatar di setiap aplikasi
- **Fields**:
  - `avatarId` - ID avatar yang digunakan
  - `userId` - User yang menggunakan
  - `appId` - ID aplikasi (e.g., "pose-generator")
  - `appName` - Nama aplikasi (e.g., "Pose Generator")
  - `action` - Aksi yang dilakukan (e.g., "generate_pose")
  - `referenceId` - ID hasil generate (opsional)
  - `referenceType` - Tipe referensi (opsional)
  - `metadata` - Data tambahan dalam JSON
  - `createdAt` - Timestamp

### 3. Migration SQL
- **File**: `avatar-usage-tracking-migration.sql`
- **Isi**:
  ```sql
  -- Add lastUsedAt to avatars table
  ALTER TABLE "avatars" ADD COLUMN IF NOT EXISTS "lastUsedAt" TIMESTAMP(3);

  -- Create avatar_usage_history table
  CREATE TABLE IF NOT EXISTS "avatar_usage_history" (...)
  ```

## Perubahan Backend

### 1. Types
- **File**: `backend/src/apps/avatar-creator/types.ts`
- **Perubahan**:
  - Update interface `Avatar` tambah `lastUsedAt`
  - Tambah interface `AvatarUsageHistory`
  - Tambah interface `AvatarUsageSummary`

### 2. Avatar Service
- **File**: `backend/src/apps/avatar-creator/services/avatar.service.ts`
- **Method Baru**:
  - `trackUsage()` - Track penggunaan avatar
  - `getAvatarUsageHistory()` - Get detailed history
  - `getAvatarUsageSummary()` - Get summary grouped by app
- **Method Updated**:
  - `incrementUsage()` - Sekarang juga update `lastUsedAt`

### 3. Routes
- **File**: `backend/src/apps/avatar-creator/routes.ts`
- **Route Baru**:
  - `GET /avatars/:id/usage-history` - Get usage history & summary

## Perubahan Frontend

### 1. Store Types
- **File**: `frontend/src/stores/avatarCreatorStore.ts`
- **Perubahan**:
  - Update interface `Avatar` dengan `lastUsedAt` dan `updatedAt`
  - Tambah interface `AvatarUsageHistory`
  - Tambah interface `AvatarUsageSummary`

### 2. Avatar Card UI
- **File**: `frontend/src/apps/AvatarCreator.tsx`
- **Perubahan**:
  1. **Tampilan Atribut Lengkap**:
     - Gender (purple badge)
     - Age Range (blue badge)
     - Style (green badge)
     - Ethnicity (amber badge)
     - AI Generated indicator (sparkles icon)

  2. **Timestamps**:
     - Created date dengan calendar icon
     - Last used date dengan clock icon
     - Usage count

  3. **History Button**:
     - Icon history kecil di sebelah usage count
     - Klik untuk membuka modal history

### 3. Usage History Modal
- **File**: `frontend/src/components/UsageHistoryModal.tsx`
- **Fitur**:
  1. **Summary Cards**:
     - Grouped by application
     - Show count dan last used date
     - Gradient background (purple to blue)

  2. **Detailed History**:
     - List semua penggunaan
     - Show app name, action, reference ID
     - Timestamp lengkap

  3. **Empty State**:
     - Icon history besar
     - Pesan "No usage history yet"

## Cara Menggunakan

### Untuk Developer - Track Usage
Ketika avatar digunakan di aplikasi lain (e.g., Pose Generator), tambahkan tracking:

```typescript
import { avatarService } from '@/apps/avatar-creator/services/avatar.service'

// Setelah avatar digunakan untuk generate pose
await avatarService.trackUsage(
  avatarId,
  userId,
  'pose-generator',
  'Pose Generator',
  'generate_pose',
  poseId,  // ID hasil generate
  'generated_pose',
  { settings: '...' }  // metadata opsional
)
```

### Untuk User
1. Buka Avatar Creator project
2. Lihat avatar cards - semua atribut sekarang terlihat
3. Lihat timestamp di bawah atribut
4. Klik icon history (jam) untuk melihat detail penggunaan
5. Modal akan menampilkan:
   - Summary by app (berapa kali dipakai di masing-masing app)
   - Detail history lengkap

## Screenshot Structure

### Avatar Card (Improved)
```
┌─────────────────────────────────┐
│ [Avatar Image]                  │
├─────────────────────────────────┤
│ Avatar Name            ✨ (AI)  │
│ ○ female  ○ adult  ○ casual     │
│                                 │
│ 📅 Created Jan 10, 2025         │
│ 🕐 Used Jan 12                  │
│ 5 times used             [⏱️]   │ ← History icon
│                                 │
│ [Generate Poses]  [🗑️]          │
└─────────────────────────────────┘
```

### History Modal
```
┌───────────────── Usage History ──────────────────┐
│ Summary by App                                    │
│ ┌───────────────┐ ┌───────────────┐             │
│ │ Pose Generator│ │ Poster Editor │             │
│ │    25         │ │     12        │             │
│ │ Last: Jan 12  │ │ Last: Jan 10  │             │
│ └───────────────┘ └───────────────┘             │
│                                                   │
│ Detailed History                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ Pose Generator • generate_pose              │ │
│ │ Reference: generated_pose #abc12345         │ │
│ │                             Jan 12, 10:30 AM│ │
│ └─────────────────────────────────────────────┘ │
│ ...                                              │
│                                                   │
│ [Close]                                          │
└───────────────────────────────────────────────────┘
```

## Next Steps

1. **Deploy Migration**: Run migration SQL di production database
2. **Test Tracking**: Implement tracking di Pose Generator app
3. **Add More Apps**: Implement tracking di app lainnya (Poster Editor, dll)
4. **Analytics**: Bisa tambah analytics dashboard untuk admin

## Notes

- Migration SQL file sudah dibuat tapi belum di-run (karena database tidak terhubung saat development)
- Tracking otomatis akan bekerja setelah method `trackUsage()` dipanggil dari app lain
- UI sudah responsive dan mobile-friendly
- Empty state handling sudah ada untuk avatar yang belum pernah digunakan
