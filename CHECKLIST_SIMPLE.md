# ✅ CHECKLIST SEDERHANA - LAKUKAN INI SEKARANG

## 🔴 LANGKAH 1: Reset Password Database (5 menit)

1. Buka Coolify: https://cf.avolut.com
2. Masuk ke Database service Lumiku
3. Klik "Execute SQL" atau buka database console
4. Copy-paste isi file: **RESET_USER_PASSWORDS.sql**
5. Klik Execute
6. ✅ Verify: Harus ada konfirmasi "4 rows updated"

---

## 🔴 LANGKAH 2: Revoke HuggingFace API Key Lama (2 menit)

1. Buka: https://huggingface.co/settings/tokens
2. Login dengan akun HuggingFace Anda
3. Cari token yang mulai dengan: `hf_AjbeTNQjgTPlnzYe...`
4. Klik tombol **"Delete"** atau **"Revoke"**
5. ✅ Confirm deletion

---

## 🔴 LANGKAH 3: Generate HuggingFace API Key Baru (3 menit)

Masih di: https://huggingface.co/settings/tokens

1. Klik **"New token"**
2. Isi form:
   - Name: `lumiku-production-2025-10-13`
   - Type: **Read**
3. Klik **"Generate"**
4. **COPY TOKEN SEGERA** (format: `hf_....`)
5. Simpan sementara di notepad

---

## 🔴 LANGKAH 4: Update Coolify Environment Variables (5 menit)

### Update HUGGINGFACE_API_KEY:

1. Buka Coolify: https://cf.avolut.com
2. Cari aplikasi: **Lumiku Backend** atau **Lumiku App**
3. Klik aplikasi → Tab **"Environment Variables"**
4. Cari variable: `HUGGINGFACE_API_KEY`
5. Klik **Edit**
6. Paste token baru yang baru di-copy
7. Klik **Save**

### Update JWT_SECRET (PRODUCTION):

1. Masih di Environment Variables
2. Cari: `JWT_SECRET`
3. Generate secret baru dengan command ini di terminal:
   ```bash
   openssl rand -hex 32
   ```
4. Copy hasil (64 karakter)
5. Update JWT_SECRET dengan nilai baru
6. Klik **Save**

---

## 🔴 LANGKAH 5: Redeploy Application (1 menit)

1. Masih di Coolify dashboard
2. Klik tombol **"Deploy"** atau **"Restart"**
3. Tunggu deployment selesai (2-5 menit)
4. ✅ Verify: Cek logs, pastikan tidak ada error

---

## 🔴 LANGKAH 6: Notify Users (10 menit)

Buka file: **NEW_USER_CREDENTIALS.txt**

Kirim pesan ke masing-masing user:

### Template Pesan:

```
Hi [Nama],

Password akun Lumiku kamu telah direset karena security update.

Password baru (temporary):
[PASTE PASSWORD DARI FILE]

Silakan login di: https://dev.lumiku.com
Setelah login, segera ganti password kamu.

Terima kasih!
```

### Checklist:
- [ ] ardianfaisal.id@gmail.com - Sent
- [ ] iqbal.elvo@gmail.com - Sent
- [ ] galuh.inteko@gmail.com - Sent
- [ ] dilla.inteko@gmail.com - Sent

### ⚠️ PENTING:
Setelah semua user di-notify, **DELETE file NEW_USER_CREDENTIALS.txt**

---

## 🔴 LANGKAH 7: Test Everything (5 menit)

### Test 1: Login User
1. Buka: https://dev.lumiku.com
2. Login dengan salah satu user + password baru
3. ✅ Harus berhasil login

### Test 2: Avatar Generator
1. Setelah login, buka Avatar Generator
2. Upload foto atau pakai sample
3. Klik "Generate Avatar"
4. ✅ Harus berhasil generate (tidak ada error 401)

### Test 3: Check Logs
1. Buka Coolify → Application → Logs
2. ✅ Tidak ada error "401 Unauthorized"
3. ✅ Tidak ada error "Invalid API key"
4. ✅ Avatar generation sukses

---

## ✅ FINAL VERIFICATION

Jika semua di bawah ini ✅, maka SELESAI!

- [ ] SQL script executed (4 rows updated)
- [ ] Old HuggingFace key revoked
- [ ] New HuggingFace key generated & updated in Coolify
- [ ] JWT_SECRET updated in Coolify (production)
- [ ] Application redeployed successfully
- [ ] All 4 users notified with new passwords
- [ ] User login tested (works)
- [ ] Avatar Generator tested (works)
- [ ] No authentication errors in logs
- [ ] NEW_USER_CREDENTIALS.txt file DELETED

---

## 🎯 ESTIMATED WAKTU TOTAL: 30-35 MENIT

---

## 📞 JIKA ADA MASALAH

### Error: SQL script gagal
- Check apakah database service running
- Coba run satu UPDATE statement saja dulu
- Verify user email exists dengan: `SELECT * FROM "User" WHERE email = '...'`

### Error: HuggingFace key tidak work
- Verify key di-copy dengan benar (tidak ada spasi/newline)
- Pastikan permission = "Read"
- Test key dengan curl (lihat HUGGINGFACE_API_KEY_ROTATION.md)
- Restart application setelah update env var

### Error: User tidak bisa login
- Verify SQL script sukses (check updatedAt timestamp)
- Pastikan password di-copy dengan benar
- Check bcrypt hash di database (harus mulai dengan $2b$10$)

---

## 📁 FILES YANG SUDAH DIBUKA

1. ✅ NEW_USER_CREDENTIALS.txt - Password users
2. ✅ RESET_USER_PASSWORDS.sql - SQL script
3. ✅ HUGGINGFACE_API_KEY_ROTATION.md - Panduan detail HF
4. ✅ SECURITY_FIX_IMMEDIATE_ACTIONS.md - Dokumentasi lengkap
5. ✅ SECURITY_FIX_SUMMARY.md - Summary complete

---

## 🚀 MULAI SEKARANG!

**Estimated waktu**: 30-35 menit
**Start**: [Isi waktu mulai]
**Target selesai**: [Isi target waktu]

---

**🔴 JANGAN DEPLOY KE PRODUCTION SEBELUM SEMUA CHECKLIST SELESAI** 🔴

Good luck! 💪
