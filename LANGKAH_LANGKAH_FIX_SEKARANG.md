# 🚀 Cara Fix Background Remover - API 500 Error

## Masalah Saat Ini
- Frontend Background Remover sudah muncul ✅
- Tapi API return 500 error ❌
- Penyebab: **Tabel database belum dibuat**

---

## 📋 LANGKAH 1: Execute SQL di Coolify (5 menit)

### Buka File SQL
File **EXECUTE_THIS_SQL_NOW.txt** sudah dibuka di Notepad.

### Copy Semua Isi File
- Press **Ctrl+A** (select all)
- Press **Ctrl+C** (copy)

### Login ke Coolify
1. Buka browser: https://cf.avolut.com
2. Login dengan credentials Anda

### Buka Database Terminal
1. Pilih database untuk aplikasi **dev-superlumiku**
2. Cari menu **"Terminal"** atau **"Execute SQL"** atau **"psql"**
3. Klik untuk membuka SQL terminal

### Paste dan Execute
1. **Ctrl+V** untuk paste semua SQL
2. Tekan **Enter** atau klik **Execute**
3. Tunggu sampai selesai (~10-20 detik)

### Verifikasi Output
Harus muncul tabel dengan jumlah kolom:
```
 table_name                            | column_count
---------------------------------------+--------------
 background_removal_batches            | 23
 background_removal_jobs               | 22
 background_remover_subscription_usage | 9
 background_remover_subscriptions      | 17
```

✅ **Jika muncul seperti ini = SQL berhasil!**

---

## 🔄 LANGKAH 2: Restart Backend di Coolify (2 menit)

### Option A: Via Coolify UI
1. Di Coolify, buka aplikasi **dev-superlumiku** (d8ggwoo484k8ok48g8k8cgwk)
2. Klik tombol **"Redeploy"** atau **"Restart"**
3. Tunggu sampai status menjadi **"Running"** (~2-3 menit)

### Option B: Via Docker Command (jika ada akses SSH)
```bash
docker restart d8ggwoo484k8ok48g8k8cgwk
```

⚠️ **Mengapa perlu restart?**
Supaya Prisma Client membaca tabel baru yang sudah dibuat.

---

## ✅ LANGKAH 3: Test di Browser (2 menit)

### Buka Background Remover
1. Buka: https://dev.lumiku.com
2. Login jika belum
3. Klik card **Background Remover Pro**

### Cek Network di DevTools
1. Press **F12** (buka DevTools)
2. Pilih tab **"Network"**
3. Refresh page (**F5** atau **Ctrl+R**)

### Verifikasi API Calls
Seharusnya semua API return **200 OK**:
- ✅ `/api/background-remover/subscription` → 200 OK
- ✅ `/api/background-remover/jobs` → 200 OK
- ✅ `/api/background-remover/stats` → 200 OK

❌ **Jika masih 500**: Tunggu 1-2 menit lagi (backend mungkin masih restart)

---

## 🎯 LANGKAH 4: Test Upload Image (3 menit)

### Pilih Tab "Single Upload"
1. Pilih tier: **Basic** (3 credits - paling murah)
2. Klik **"Choose Image"**
3. Upload foto dengan background (misalnya foto produk)

### Monitor Progress
- Loading spinner akan muncul
- Status akan update: **Processing → Completed**
- Preview hasil akan muncul (background sudah hilang)

### Download Hasil
- Klik tombol **"Download"**
- Gambar hasil tanpa background akan terdownload

✅ **Jika bisa upload dan download = SUKSES TOTAL!**

---

## 📊 Timeline Keseluruhan

| Waktu | Aksi |
|-------|------|
| 0:00 | Execute SQL di Coolify database |
| 0:01 | Verifikasi 4 tabel berhasil dibuat |
| 0:02 | Restart backend di Coolify |
| 0:05 | Backend selesai restart |
| 0:06 | Test endpoints di browser (200 OK) |
| 0:07 | Test upload single image |
| 0:10 | **✅ Background Remover FULL WORKING** |

---

## ❓ Troubleshooting

### Masalah: SQL Error saat Execute
**Solusi**:
- Pastikan copy SEMUA isi file (dari baris pertama sampai terakhir)
- Pastikan tidak ada karakter aneh yang ter-copy

### Masalah: Tabel tidak muncul setelah execute
**Solusi**:
- Cek apakah ada error message di terminal
- Coba run ulang SQL (safe untuk di-run berulang kali)

### Masalah: API masih 500 setelah restart
**Solusi**:
- Tunggu 2-3 menit (backend perlu waktu untuk fully restart)
- Cek logs di Coolify untuk error message
- Verifikasi tabel benar-benar sudah ada:
  ```sql
  SELECT * FROM information_schema.tables
  WHERE table_name LIKE 'background_%';
  ```

### Masalah: Upload gagal
**Solusi**:
- Cek credits balance di dashboard (minimal 3 credits untuk Basic tier)
- Cek ukuran file (max 10MB)
- Cek format file (PNG, JPG, JPEG only)

---

## 📞 Need Help?

Jika ada error atau stuck:
1. Screenshot error message
2. Copy error dari browser console (F12)
3. Copy error dari Coolify logs
4. Kirim ke developer

---

## ✨ Fitur Background Remover

Setelah berhasil, kamu bisa:

### 4 Quality Tiers
- **Basic** (3 credits): RMBG-1.4, cukup untuk kebutuhan standar
- **Standard** (8 credits): RMBG-2.0, kualitas lebih baik
- **Professional** (15 credits): RMBG-2.0 premium
- **Industry** (25 credits): Kualitas tertinggi untuk production

### Batch Processing
- Upload 5-500 images sekaligus
- Auto discount 5-20% untuk volume besar
- Download semua hasil dalam 1 ZIP file

### Subscription Plans
- **Starter** (Rp 99K/month): 50 removals/day
- **Pro** (Rp 299K/month): 200 removals/day
- Hemat 40-60% dibanding pakai credits

### Job History
- Lihat semua hasil removal sebelumnya
- Re-download hasil kapanpun
- Track credits usage per job

---

**Status**: 🔥 Ready to execute! File EXECUTE_THIS_SQL_NOW.txt sudah dibuka.
**Action**: Copy-paste ke Coolify database terminal sekarang!
