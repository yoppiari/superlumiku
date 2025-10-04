# Template Bikin App Baru (Bahasa Awam)

## Cara Pakai

1. Copy template di bawah
2. Isi dengan bahasa biasa seperti jelasin ke teman
3. Paste ke Claude Code
4. Claude akan otomatis translate & execute semua step untuk bikin app lengkap!

---

## Template Simple

```
Buatin app baru namanya [NAMA APP].

Fungsinya buat [KEGUNAAN APP, contoh: bikin invoice, atur jadwal, tracking habits].

Icon: [NAMA ICON, contoh: file-text, calendar, check-circle] - cek di lucide.dev
Warna: [blue/green/purple/orange/red]

Yang bisa dilakukan user:
- [AKSI 1, contoh: bikin invoice baru] → pakai [JUMLAH] credits
- [AKSI 2, contoh: edit invoice] → pakai [JUMLAH] credits
- [AKSI 3, contoh: hapus invoice] → pakai [JUMLAH] credits

Data yang disimpan:
- [NAMA DATA 1, contoh: Invoice]: butuh simpan [FIELD APA AJA, contoh: nomor invoice, nama client, total harga, tanggal jatuh tempo]
- [NAMA DATA 2, jika ada]: butuh simpan [FIELD APA AJA]

Bikin lengkap ya, backend sama frontend!
```

---

## Contoh Nyata

### Invoice Generator

```
Buatin app baru namanya Invoice Generator.

Fungsinya buat bikin dan kelola invoice profesional untuk bisnis kecil.

Icon: file-text
Warna: green

Yang bisa dilakukan user:
- Bikin invoice baru → pakai 10 credits
- Edit invoice → pakai 3 credits
- Hapus invoice → pakai 2 credits
- Tambahin item ke invoice → pakai 1 credit
- Download PDF invoice → pakai 5 credits
- Kirim invoice ke email client → pakai 3 credits

Data yang disimpan:
- Invoice: butuh simpan nomor invoice, nama client, email client, total harga, status (lunas/belum), tanggal jatuh tempo
- Item Invoice: butuh simpan deskripsi barang, jumlah, harga satuan, total harga

Bikin lengkap ya, backend sama frontend!
```

### Habit Tracker

```
Buatin app baru namanya Habit Tracker.

Fungsinya buat tracking kebiasaan harian dan liat progress.

Icon: check-circle
Warna: blue

Yang bisa dilakukan user:
- Bikin habit baru → pakai 5 credits
- Centang habit hari ini → pakai 1 credit
- Liat statistik progress → gratis
- Minta saran dari AI → pakai 10 credits

Data yang disimpan:
- Habit: butuh simpan nama habit, target per minggu, icon, warna
- Check-in: butuh simpan kapan user centang habit, catatan

Bikin lengkap ya, backend sama frontend!
```

### Reminder & Notes

```
Buatin app baru namanya Quick Notes.

Fungsinya buat bikin catatan cepat dan set reminder.

Icon: sticky-note
Warna: orange

Yang bisa dilakukan user:
- Bikin note baru → pakai 2 credits
- Edit note → pakai 1 credit
- Hapus note → pakai 1 credit
- Set reminder → pakai 3 credits
- AI ringkasin note panjang → pakai 8 credits

Data yang disimpan:
- Note: butuh simpan judul, isi note, kategori, dibuat kapan
- Reminder: butuh simpan kapan mau diingetin, udah dikirim atau belum

Bikin lengkap ya, backend sama frontend!
```

---

## Yang Terjadi di Balik Layar

Pas kamu paste prompt kayak di atas, Claude Code akan:

1. ✅ **Translate** prompt bahasa awam kamu ke parameter teknis
2. ✅ **Generate** struktur folder & boilerplate code
3. ✅ **Setup database** models & migrations
4. ✅ **Implement backend** (API, logic, validation)
5. ✅ **Create frontend** UI yang cantik & responsive dengan:
   - Header sticky (tetap di atas pas scroll)
   - Save indicator di header (kalau ada auto-save)
   - Credit balance & profile dropdown
   - Responsive design (mobile, tablet, desktop)
6. ✅ **Connect** semuanya (routing, plugin registry)
7. ✅ **Test** semua fitur berfungsi

**Hasilnya**: App lengkap siap pakai dalam 1-2 menit! ⚡

**Catatan**: Claude yang akan translate prompt kamu. Jadi tulis se-natural mungkin, ga perlu format khusus!

## Standard UI/UX yang Otomatis Diterapkan

Setiap app baru otomatis mengikuti standard ini:

### Header (Wajib)
- ✅ Sticky di atas (ga ilang pas scroll)
- ✅ Tombol back ke dashboard
- ✅ Icon & nama app
- ✅ Credit balance
- ✅ Profile dropdown
- ✅ Save indicator (kalau ada auto-save)

### Layout
- ✅ Warna konsisten (slate theme)
- ✅ Responsive (mobile, tablet, desktop)
- ✅ Spacing & padding seragam
- ✅ Icons dari Lucide

**Penting**: Semua ini otomatis! Kamu cuma perlu jelasin fungsi app-nya aja.

---

## Tips Biar Lancar

- **Icon**: Cari icon yang cocok di [lucide.dev](https://lucide.dev/icons), copy nama icon-nya aja
- **Warna**: Pilih yang sesuai vibes app-nya (blue, green, purple, orange, red)
- **Credits**:
  - Aksi simple (hapus, edit dikit) → 1-3 credits
  - Aksi biasa (bikin baru, update) → 5-10 credits
  - Aksi kompleks (pakai AI, generate PDF) → 10-20 credits
- **Data**: Jelasin sejelas mungkin apa aja yang perlu disimpan, kayak ngomong ke teman

---

## Contoh Lebih Gampang Lagi

Kamu juga bisa nulis super simple kayak gini:

```
Bikinin app buat tracking pengeluaran bulanan dong.
User bisa tambahin pengeluaran, liat total per kategori, sama export ke Excel.
Pakai icon wallet, warna merah.
Tambahin pengeluaran: 3 credits
Export: 5 credits
```

Claude Code bakalan ngerti dan translate sendiri ke struktur lengkapnya!
