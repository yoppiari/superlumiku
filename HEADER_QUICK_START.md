# 🚀 Quick Start - Unified Header Testing

## Test Sekarang di Lokal!

### 1. Buka Browser
```
http://localhost:5174/header-demo
```

### 2. Apa yang Bisa Anda Test?

#### ✅ Navigasi
- **Home Button** (🏠): Klik untuk ke dashboard
- **Back Button** (←): Klik untuk kembali ke halaman sebelumnya
- **App Switcher** (Apps ▼): Klik untuk lihat dropdown semua aplikasi

#### ✅ Credit Display
- **Credit Badge**: Lihat balance Anda
- **Click**: Klik badge untuk ke halaman pembelian credits
- **Auto-Update**: Balance update otomatis

#### ✅ Profile Menu
- **Avatar**: Klik untuk buka menu
- **Menu Items**: Profile, Settings, Buy Credits, Logout
- **Click Outside**: Menu auto-close

#### ✅ Responsive Design
- Test di berbagai ukuran layar
- Mobile, Tablet, Desktop
- Resize browser window

---

## Demo Controls

Di halaman demo, ada panel kontrol untuk switch antar aplikasi:

1. **Avatar Creator** - Purple theme
2. **Pose Generator** - Indigo theme
3. **Carousel Mix** - Blue theme
4. **Video Mixer** - Blue theme
5. **Poster Editor** - Green theme
6. **Dashboard** - No icon, no back button

Klik card aplikasi untuk melihat bagaimana header terlihat di setiap app.

---

## Fitur yang Bisa Dicoba

### App Switcher Dropdown
1. Klik tombol "Apps" di header
2. Lihat daftar semua aplikasi
3. Aplikasi aktif akan di-highlight dengan dot biru
4. Klik aplikasi lain untuk simulasi navigasi
5. Klik "Back to Dashboard" untuk ke dashboard

### Credit Badge
1. Hover pada badge credits
2. Icon berubah warna ke biru
3. Click untuk navigate ke `/credits`

### Profile Menu
1. Klik avatar di kanan atas
2. Lihat user info (nama, email)
3. Akses menu items
4. Click outside untuk close

---

## Visual Comparison

### Before (Inconsistent Headers)
```
Avatar Creator:  max-w-6xl,  py-8,  badge style
Carousel Mix:    max-w-6xl,  py-8,  badge style
Video Mixer:     max-w-[1920px], py-8, badge style
Poster Editor:   max-w-7xl,  py-8,  inline style
Dashboard:       max-w-[1400px], py-8, badge style
```

### After (Unified Header)
```
ALL APPS:        max-w-[1400px], py-4, consistent badge + app switcher
```

---

## Key Improvements

### 1. Konsistensi Visual
- ✅ Same max-width (1400px)
- ✅ Same padding (py-4)
- ✅ Same credit badge style
- ✅ Same layout structure

### 2. Enhanced Navigation
- ✅ Home button (tidak ada sebelumnya)
- ✅ App switcher (tidak ada sebelumnya)
- ✅ Highlight active app
- ✅ Quick app switch

### 3. Better UX
- ✅ Clickable credit badge
- ✅ Consistent profile menu
- ✅ Mobile responsive
- ✅ Smooth animations

---

## Testing Checklist

### Desktop (>768px)
- [ ] Home button visible dan works
- [ ] Back button visible (jika `showBackButton={true}`)
- [ ] App icon dan title visible
- [ ] App switcher dropdown works
- [ ] Credit badge clickable
- [ ] Profile menu works
- [ ] Custom actions visible (jika ada)

### Tablet (640px - 768px)
- [ ] Layout adjust dengan baik
- [ ] Username visible di profile
- [ ] Credit label visible
- [ ] All navigation works

### Mobile (<640px)
- [ ] Layout compact
- [ ] Username hidden
- [ ] Credit label hidden (hanya angka)
- [ ] Touch targets cukup besar
- [ ] Menu tetap accessible

---

## Next Steps

1. ✅ Test semua konfigurasi di demo page
2. ✅ Verify navigasi works
3. ✅ Test responsive di berbagai device
4. 📝 Give feedback atau approval
5. 🔧 Refactor apps untuk menggunakan UnifiedHeader
6. 🚀 Deploy ke dev.lumiku.com

---

## Feedback

Jika ada masalah atau saran:
1. Test di demo page terlebih dahulu
2. Screenshot issue jika ada
3. Jelaskan expected behavior
4. Suggest improvement

---

**Ready to test? Buka browser sekarang!**

```
http://localhost:5174/header-demo
```
