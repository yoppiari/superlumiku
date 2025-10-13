# Cara Restart Backend untuk Load Poster Editor Plugin

Backend perlu direstart untuk load plugin `poster-editor` yang baru dibuat.

## Langkah-langkah:

### 1. Kill Backend yang Lama

**Cara Manual (Termudah):**
1. Buka **Task Manager** (Ctrl+Shift+Esc)
2. Cari proses `node.exe` atau `bun.exe` yang menggunakan banyak memory
3. Klik kanan → **End Task**

**Atau via Command Line:**
```cmd
netstat -ano | findstr :3000
```
Lihat PID di kolom terakhir, lalu:
```cmd
taskkill /PID [PID_NUMBER] /F
```

### 2. Start Backend Baru

Buka **Command Prompt** atau **PowerShell** baru, lalu jalankan:

```bash
cd "C:\Users\yoppi\Downloads\Lumiku App\backend"
bun run src/index.ts
```

### 3. Verifikasi Plugin Ter-load

Lihat output saat backend start, seharusnya ada:

```
✅ Plugin registered: Smart Poster Editor (poster-editor)

📦 Loaded 5 plugins  ← Harusnya 5, bukan 4!
✅ Enabled: 5
🚀 Dashboard apps: 5

🔌 Mounted: Smart Poster Editor at /api/apps/poster-editor
```

### 4. Refresh Dashboard

1. Buka browser di `http://localhost:5173/dashboard`
2. Reload halaman (F5 atau Ctrl+R)
3. **Smart Poster Editor** seharusnya muncul di Apps & Tools!

---

## Troubleshooting

### Port 3000 masih digunakan

Jika error `EADDRINUSE`, backend lama masih running. Ulangi langkah 1 untuk kill semua proses.

### Plugin masih tidak muncul

1. Cek apakah backend benar-benar restart (lihat console log)
2. Pastikan file `backend/src/plugins/loader.ts` sudah include poster-editor
3. Clear browser cache dan reload

### Frontend tidak connect

1. Pastikan frontend running di `http://localhost:5173`
2. Cek Network tab di DevTools untuk lihat API calls
3. Pastikan CORS diaktifkan di backend

---

## Quick Commands

**Kill semua node processes:**
```cmd
taskkill /IM node.exe /F
taskkill /IM bun.exe /F
```

**Start backend:**
```cmd
cd backend
bun run src/index.ts
```

**Start frontend:**
```cmd
cd frontend
npm run dev
```

---

Setelah backend restart, **Smart Poster Editor** akan muncul di dashboard! 🎉
