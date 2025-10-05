# Panduan Konfigurasi Duitku untuk Lumiku

## 🔍 Analisis Berdasarkan Screenshot & Dokumentasi

### ✅ Yang Sudah Benar:
1. **Domain Production**: `app.lumiku.com` ✅
2. **Nama Proyek**: Lumiku ✅
3. **Callback URL Pattern**: `https://app.lumiku.com/api/.../callback` ✅

### ⚠️ Perbedaan yang Ditemukan:

#### Dari Screenshot Duitku:
```
Callback URL: https://app.lumiku.com/api/mainapp/payment/callback
```

#### Dari Code Backend Lumiku:
```
Route: /api/payment/duitku/callback
Full URL: https://app.lumiku.com/api/payment/duitku/callback
```

**❌ TIDAK MATCH!** Screenshot Duitku menggunakan `/api/mainapp/payment/callback` tapi code backend menggunakan `/api/payment/duitku/callback`

---

## 🛠️ Solusi: 2 Opsi

### Opsi 1: Update Callback URL di Duitku Dashboard (RECOMMENDED)

**Langkah:**
1. Login ke Duitku Dashboard: https://sandbox.duitku.com
2. Go to **Proyek Saya** > Edit Proyek "Lumiku"
3. Update **Url Callback Proyek** menjadi:
   ```
   https://app.lumiku.com/api/payment/duitku/callback
   ```
4. Klik **Simpan**

**Environment Variables untuk Coolify:**
```env
DUITKU_CALLBACK_URL=https://app.lumiku.com/api/payment/duitku/callback
DUITKU_RETURN_URL=https://app.lumiku.com/payments/status
```

---

### Opsi 2: Update Route Backend (Jika mau sesuaikan dengan Duitku)

Ubah route di backend dari `/api/payment` ke `/api/mainapp/payment`

**Tapi ini TIDAK RECOMMENDED** karena:
- `/api/mainapp/payment` tidak konsisten dengan struktur route lain
- `/api/payment` lebih clean dan RESTful

---

## 📝 Cara Mendapatkan Merchant Code & API Key

### 1. Merchant Code
Dari screenshot Anda, kemungkinan Merchant Code adalah: **`DS25180`**

Cara memastikan:
1. Login ke Duitku Dashboard
2. Go to **Dashboard** atau **Proyek Saya**
3. Lihat detail proyek "Lumiku"
4. Merchant Code biasanya tertera jelas (contoh: DS25180, D12345, dll)

### 2. API Key (Merchant Key)
1. Di halaman Detail Proyek "Lumiku"
2. Click link biru: **"Klik disini untuk melihat API Key (Merchant Key)"**
3. Masukkan password Anda
4. Copy API Key yang muncul

---

## 🔐 Environment Variables FINAL (CORRECTED)

```env
# ========================================
# DOMAIN & CORS
# ========================================
CORS_ORIGIN=https://app.lumiku.com

# ========================================
# DUITKU PAYMENT GATEWAY
# ========================================
DUITKU_MERCHANT_CODE=DS25180
DUITKU_API_KEY=<copy-dari-dashboard-duitku>
DUITKU_ENV=sandbox

# IMPORTANT: Route yang benar sesuai backend code
DUITKU_CALLBACK_URL=https://app.lumiku.com/api/payment/duitku/callback
DUITKU_RETURN_URL=https://app.lumiku.com/payments/status
```

---

## 📍 Update yang Diperlukan di Duitku Dashboard

### 1. Website Proyek
```
https://app.lumiku.com
```
✅ Sudah benar di screenshot

### 2. Url Callback Proyek
```
UBAH DARI: https://app.lumiku.com/api/mainapp/payment/callback
UBAH KE:   https://app.lumiku.com/api/payment/duitku/callback
```

### 3. Return URL (Optional, biasanya dikirim via API)
```
https://app.lumiku.com/payments/status
```

---

## 🚀 API Endpoints Duitku

### Sandbox (Development/Testing):
- **Base URL**: `https://sandbox.duitku.com/webapi/api`
- **API Docs**: https://docs.duitku.com/api/en/

### Production:
- **Base URL**: `https://passport.duitku.com/webapi/api`
- Switch setelah testing berhasil

---

## ✅ Checklist Sebelum Deploy

- [ ] Merchant Code sudah didapat: `DS25180` (atau cek di dashboard)
- [ ] API Key sudah didapat dari dashboard (click link biru)
- [ ] Callback URL di Duitku dashboard sudah diupdate ke: `https://app.lumiku.com/api/payment/duitku/callback`
- [ ] Environment variables sudah di-paste di Coolify
- [ ] `DUITKU_ENV=sandbox` untuk testing
- [ ] Domain `app.lumiku.com` sudah pointing ke Coolify
- [ ] SSL certificate aktif untuk `app.lumiku.com`

---

## 🧪 Testing Setelah Deploy

1. **Test Payment Creation**:
   ```bash
   curl -X POST https://app.lumiku.com/api/payment/duitku/create \
     -H "Authorization: Bearer <your-jwt-token>" \
     -H "Content-Type: application/json" \
     -d '{
       "packageId": "basic",
       "credits": 100,
       "amount": 50000,
       "productName": "100 Credits"
     }'
   ```

2. **Test Callback Endpoint** (simulasi dari Duitku):
   ```bash
   curl -X POST https://app.lumiku.com/api/payment/duitku/callback \
     -H "Content-Type: application/json" \
     -d '{
       "merchantOrderId": "ORDER123",
       "resultCode": "00",
       "reference": "DUITKU123"
     }'
   ```

3. **Check di Duitku Dashboard** bahwa callback URL accessible

---

## 📌 File yang Sudah Dibuat

1. **COOLIFY_ENV_CORRECTED.txt** - Environment variables dengan domain & callback URL yang benar
2. **Dokumen ini** - Panduan lengkap konfigurasi Duitku

---

## 🔄 Next Steps

1. ✅ Dapatkan Merchant Code & API Key dari Duitku Dashboard
2. ✅ Update Callback URL di Duitku Dashboard
3. ✅ Copy environment variables dari `COOLIFY_ENV_CORRECTED.txt`
4. ✅ Paste di Coolify Environment Variables
5. ✅ Update `DUITKU_MERCHANT_CODE` dan `DUITKU_API_KEY` dengan nilai asli
6. ✅ Save & Redeploy
7. ✅ Test payment flow

---

**Catatan Penting**:
- Gunakan `DUITKU_ENV=sandbox` untuk testing
- Setelah testing sukses, switch ke `production` mode
- Domain `app.lumiku.com` harus sudah configured di Coolify dengan SSL
