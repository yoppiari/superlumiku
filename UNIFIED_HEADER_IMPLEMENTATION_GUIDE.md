# 🎨 Unified Header Implementation Guide - Lumiku App

## 📋 Executive Summary

Dokumentasi ini menjelaskan implementasi **UnifiedHeader** - komponen header yang seamless dan konsisten untuk semua aplikasi di platform Lumiku. Header ini dirancang untuk memberikan user experience yang superior dengan navigasi yang mudah, akses cepat ke fitur-fitur penting, dan konsistensi visual di seluruh platform.

---

## 🎯 Fitur Utama

### 1. **Navigasi Mudah ke Dashboard**
- ✅ Tombol Home selalu visible di header
- ✅ Klik langsung kembali ke Central Hub Dashboard
- ✅ Konsisten di semua aplikasi

### 2. **App Switcher Terintegrasi**
- ✅ Dropdown menu untuk pindah aplikasi
- ✅ Tidak perlu kembali ke dashboard untuk pindah app
- ✅ Highlight aplikasi yang sedang aktif
- ✅ Quick access ke semua apps

### 3. **Credit Display Seamless**
- ✅ Balance selalu visible di header
- ✅ Clickable untuk langsung ke halaman pembelian credits
- ✅ Auto-update ketika balance berubah
- ✅ Responsive design (adapt di mobile)

### 4. **Profile Menu Terintegrasi**
- ✅ Avatar user dengan initials
- ✅ Dropdown menu: Profile, Settings, Buy Credits, Logout
- ✅ Konsisten di semua halaman
- ✅ Click-outside detection

---

## 📁 File Structure

```
frontend/src/
├── components/
│   ├── UnifiedHeader.tsx          # Main header component (NEW)
│   └── ProfileDropdown.tsx        # User profile menu (existing)
├── pages/
│   └── HeaderDemo.tsx             # Demo page untuk testing (NEW)
├── App.tsx                        # Route setup (updated)
└── stores/
    └── authStore.ts               # User & credit state management
```

---

## 🚀 Quick Start - Testing Lokal

### 1. **Akses Halaman Demo**

Buka browser dan navigasi ke:
```
http://localhost:5173/header-demo
```

### 2. **Test Berbagai Konfigurasi**

Di halaman demo, Anda bisa:
- Switch antar aplikasi untuk melihat header di setiap app
- Test navigasi: Home button, Back button, App switcher
- Test credit display (clickable)
- Test profile dropdown
- Lihat konsistensi visual

### 3. **Test Responsive**

- Desktop (1400px+): Full layout dengan semua fitur
- Tablet (768px - 1400px): App switcher visible
- Mobile (<768px): Compact layout, username hidden

---

## 💻 Cara Implementasi di App Anda

### Basic Usage

```tsx
import UnifiedHeader from '../components/UnifiedHeader'
import { UserCircle } from 'lucide-react'

function YourApp() {
  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedHeader
        title="Your App Name"
        subtitle="App description"
        icon={<UserCircle className="w-5 h-5" />}
        iconColor="bg-purple-50 text-purple-700"
        currentAppId="your-app-id"
      />

      {/* Your app content */}
    </div>
  )
}
```

### Advanced Usage (dengan Actions & Custom Back)

```tsx
<UnifiedHeader
  title="Avatar Creator"
  subtitle="Create and manage AI avatars"
  icon={<UserCircle className="w-5 h-5" />}
  iconColor="bg-purple-50 text-purple-700"
  showBackButton={true}
  backPath="/apps/avatar-creator"
  currentAppId="avatar-creator"
  actions={
    <>
      <button className="px-4 py-2 bg-purple-600 text-white rounded-lg">
        <Plus className="w-4 h-4 inline mr-2" />
        New Project
      </button>
      <button className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg">
        Export
      </button>
    </>
  }
/>
```

---

## 📝 Props Documentation

### UnifiedHeaderProps

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | `string` | ✅ Yes | - | App title to display |
| `subtitle` | `string` | ❌ No | - | Optional subtitle/description |
| `icon` | `React.ReactNode` | ❌ No | - | Icon component (dari Lucide) |
| `iconColor` | `string` | ❌ No | `'bg-blue-50 text-blue-700'` | Tailwind classes untuk background icon |
| `showBackButton` | `boolean` | ❌ No | `true` | Show/hide back button |
| `backPath` | `string` | ❌ No | `'/dashboard'` | Custom back path |
| `currentAppId` | `string` | ❌ No | - | App ID untuk highlight di app switcher |
| `actions` | `React.ReactNode` | ❌ No | - | Custom action buttons |

---

## 🎨 Icon Color Presets

Gunakan color scheme yang konsisten untuk setiap app:

```tsx
// Avatar Creator - Purple
iconColor="bg-purple-50 text-purple-700"

// Pose Generator - Indigo
iconColor="bg-indigo-50 text-indigo-700"

// Carousel Mix - Blue
iconColor="bg-blue-50 text-blue-700"

// Video Mixer - Blue
iconColor="bg-blue-50 text-blue-700"

// Poster Editor - Green
iconColor="bg-green-50 text-green-700"
```

---

## 🔧 Technical Specifications

### Header Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ [←] [🏠] [Icon] Title            [Apps ▼] [💰Credits] [👤Menu] │
│              Subtitle                                            │
└─────────────────────────────────────────────────────────────────┘
```

### CSS Properties

- **Position:** `sticky top-0 z-50`
- **Max Width:** `1400px` (konsisten semua apps)
- **Background:** `bg-white border-b border-slate-200`
- **Padding:** `px-6 py-4`
- **Layout:** Flexbox with `justify-between`

### Responsive Breakpoints

```tsx
// Mobile (<640px)
- Username hidden di ProfileDropdown
- Credit label "Credits" hidden, hanya angka
- App switcher hidden (akan ada mobile menu nanti)

// Tablet (640px - 768px)
- Credit display dengan label
- Username visible di ProfileDropdown

// Desktop (768px+)
- Full layout dengan App switcher
- Semua fitur visible
```

---

## 📊 State Management

### Credit Balance

Header otomatis fetch credit balance dari API:

```tsx
// Di UnifiedHeader.tsx
useEffect(() => {
  const fetchBalance = async () => {
    const balanceData = await creditsService.getBalance()
    setCreditBalance(balanceData?.balance ?? 0)
  }
  fetchBalance()
}, [])
```

Balance juga auto-update ketika `user.creditBalance` berubah di Zustand store.

### App Switcher State

```tsx
const [showAppSwitcher, setShowAppSwitcher] = useState(false)
```

Dengan click-outside detection untuk auto-close.

---

## 🔄 Migration Guide - Refactor Existing Apps

### Before (Old Header - Inconsistent)

```tsx
// Di setiap app file
<div className="bg-white border-b border-slate-200 sticky top-0 z-50">
  <div className="max-w-6xl mx-auto px-6 md:px-10 py-8">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700">
            <UserCircle className="w-5 h-5" />
          </div>
          <div>
            <h1>Avatar Creator</h1>
            <p>Create and manage AI avatars</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5 bg-slate-50">
          <Coins className="w-[1.125rem] h-[1.125rem]" />
          <span>{creditBalance} Credits</span>
        </div>
        <ProfileDropdown />
      </div>
    </div>
  </div>
</div>
```

### After (New UnifiedHeader - Seamless)

```tsx
import UnifiedHeader from '../components/UnifiedHeader'
import { UserCircle } from 'lucide-react'

<UnifiedHeader
  title="Avatar Creator"
  subtitle="Create and manage AI avatars"
  icon={<UserCircle className="w-5 h-5" />}
  iconColor="bg-purple-50 text-purple-700"
  currentAppId="avatar-creator"
/>
```

**Benefits:**
- ✅ 30+ lines reduced to 6 lines
- ✅ Konsistensi terjamin
- ✅ App switcher otomatis ada
- ✅ Easy maintenance

---

## 📋 Implementation Checklist

### Phase 1: Testing (Current)
- [x] Buat UnifiedHeader component
- [x] Buat HeaderDemo page
- [x] Add route `/header-demo`
- [ ] Test di localhost semua konfigurasi
- [ ] Test responsive (mobile, tablet, desktop)
- [ ] Approval dari user

### Phase 2: Refactoring
- [ ] Refactor AvatarCreator.tsx
- [ ] Refactor PoseGenerator (new)
- [ ] Refactor CarouselMix.tsx
- [ ] Refactor VideoMixer.tsx
- [ ] Refactor PosterEditor.tsx
- [ ] Update Dashboard.tsx
- [ ] Update MyWork.tsx

### Phase 3: Testing & Polish
- [ ] Test semua apps setelah refactor
- [ ] Verify navigasi works
- [ ] Verify credit display updates
- [ ] Verify app switcher highlights
- [ ] Performance check

### Phase 4: Deployment
- [ ] Deploy ke dev.lumiku.com
- [ ] Staging test
- [ ] User acceptance test
- [ ] Production deployment

---

## 🐛 Known Issues & Solutions

### Issue 1: Credit Balance tidak update setelah generation
**Solution:** UnifiedHeader sudah handle auto-update via useEffect yang listen ke `user.creditBalance`

### Issue 2: App switcher dropdown not closing on navigation
**Solution:** Sudah ada `setShowAppSwitcher(false)` di `handleAppSwitch`

### Issue 3: Mobile - App switcher terlalu kecil
**Solution:** Hidden di mobile (`hidden md:block`), akan ada mobile menu nanti

---

## 🎯 Next Features (Future Enhancement)

1. **Mobile App Menu**
   - Hamburger menu untuk mobile
   - Slide-out drawer dengan app list
   - Touch-friendly navigation

2. **Breadcrumb Navigation**
   - Show navigation path (Dashboard > App > Project)
   - Clickable breadcrumbs
   - Auto-collapse di mobile

3. **Quick Actions Menu**
   - Global search
   - Recent apps
   - Keyboard shortcuts

4. **Notification Center**
   - Credit alerts
   - Generation completion alerts
   - System notifications

---

## 📸 Screenshots

### Desktop View
```
┌────────────────────────────────────────────────────────────────────┐
│ [←] [🏠] [👤] Avatar Creator      [Apps ▼] [💰 1,250 Credits] [JD▼]│
│              Create and manage...                                   │
└────────────────────────────────────────────────────────────────────┘
```

### App Switcher Dropdown
```
┌─────────────────────────┐
│ SWITCH APP              │
├─────────────────────────┤
│ [👤] Avatar Creator  ●  │
│ [✨] Pose Generator      │
│ [📊] Carousel Mix        │
│ [🎬] Video Mixer         │
│ [🖼️] Poster Editor       │
├─────────────────────────┤
│ [🏠] Back to Dashboard  │
└─────────────────────────┘
```

---

## 🤝 Support & Contact

Jika ada issue atau pertanyaan:
1. Test di `/header-demo` terlebih dahulu
2. Check console untuk errors
3. Verify props yang dipass ke UnifiedHeader
4. Contact development team

---

## 📚 References

- Component: `frontend/src/components/UnifiedHeader.tsx`
- Demo: `frontend/src/pages/HeaderDemo.tsx`
- Auth Store: `frontend/src/stores/authStore.ts`
- Credit Service: `frontend/src/services/creditsService.ts`

---

**Last Updated:** 2025-01-17
**Version:** 1.0.0
**Status:** Ready for Testing 🚀
