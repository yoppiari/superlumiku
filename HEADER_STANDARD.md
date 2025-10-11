# Header Standard - Aplikasi Lumiku

Dokumentasi standar header untuk semua aplikasi di Lumiku Platform.

## 📋 Standar Header Utama (Project List View)

Berdasarkan referensi: **Carousel Mix** (`carousel-mix`)

### Layout Struktur:
```tsx
<header className="bg-white border-b border-slate-200 sticky top-0 z-50">
  <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">
    <div className="flex items-center justify-between">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Back Button */}
        <button onClick={() => navigate('/dashboard')}>
          <ArrowLeft />
        </button>

        {/* Icon + Title */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-{color}-50 text-{color}-700">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-[1.75rem] font-semibold text-slate-900 tracking-tighter">
              App Name
            </h1>
            <p className="text-sm md:text-[0.9375rem] text-slate-600">
              App description
            </p>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Credit Balance - Simple Version */}
        <div className="flex items-center gap-2 text-slate-600">
          <Coins className="w-5 h-5" />
          <span className="font-medium text-slate-900">{credits} Credits</span>
        </div>

        {/* Profile Dropdown */}
        <ProfileDropdown />
      </div>
    </div>
  </div>
</header>
```

## 🎨 Design System

### Colors (warna tema per aplikasi):
- **Video Generator**: `blue` (bg-blue-50, text-blue-700)
- **Poster Editor**: `green` (bg-green-50, text-green-700)
- **Carousel Mix**: `blue` (bg-blue-50, text-blue-700)
- **Video Mixer**: `blue` (bg-blue-50, text-blue-700)
- **Looping Flow**: `blue` (bg-blue-50, text-blue-700)

### Spacing:
- Container: `max-w-7xl mx-auto`
- Padding: `px-6 md:px-10 py-8`
- Gap antara elemen: `gap-3`, `gap-4`, `gap-4 md:gap-6`

### Typography:
- Title: `text-2xl md:text-[1.75rem] font-semibold text-slate-900 tracking-tighter`
- Subtitle: `text-sm md:text-[0.9375rem] text-slate-600`

### Components:
- Border: `border-b border-slate-200`
- Sticky: `sticky top-0 z-50`
- Icon size: `w-5 h-5`
- Icon container: `w-11 h-11 rounded-xl`

## 🔙 Back Button

### Wajib ada di semua aplikasi:
```tsx
<button
  onClick={() => navigate('/dashboard')}
  className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-600 hover:text-slate-900"
>
  <ArrowLeft className="w-5 h-5" />
</button>
```

**Catatan**: Back button harus selalu kembali ke `/dashboard`

## 💳 Credit Balance Display

### Standard format (Simple Version - Carousel Mix Style):
```tsx
<div className="flex items-center gap-2 text-slate-600">
  <Coins className="w-5 h-5" />
  <span className="font-medium text-slate-900">
    {(user?.creditBalance || 0).toLocaleString()} Credits
  </span>
</div>
```

**Catatan**:
- Icon size: `w-5 h-5` (bukan w-[1.125rem])
- Gap: `gap-2` (bukan gap-2.5)
- TIDAK menggunakan background, border, atau padding
- Text color: `text-slate-600` untuk container, `text-slate-900` untuk angka

## 👤 Profile Dropdown

### Import & Usage:
```tsx
import ProfileDropdown from '../components/ProfileDropdown'

// Di header:
<ProfileDropdown />
```

## 🔘 Action Button (New Project)

### PENTING: Button ada di CONTENT area, BUKAN di header!

Berdasarkan Carousel Mix, button "New Project" ditempatkan di dalam content area:

```tsx
<main className="max-w-7xl mx-auto px-6 md:px-10 py-8">
  {/* New Project Button */}
  <button
    onClick={() => setShowCreateModal(true)}
    className="mb-6 px-6 py-3 bg-{color}-600 text-white rounded-lg hover:bg-{color}-700 flex items-center gap-2 shadow-lg font-medium"
  >
    <Plus className="w-5 h-5" />
    New Project
  </button>

  {/* Projects Grid */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    ...
  </div>
</main>
```

**Styling:**
- Margin bottom: `mb-6`
- Shadow: `shadow-lg`
- Full text (tidak ada `hidden md:inline`)
- Flex layout untuk align icon + text

## 📱 Responsive Design

### Breakpoints:
- `md:` untuk tablet dan desktop (>= 768px)
- Default untuk mobile

## 📦 Required Imports

```tsx
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import ProfileDropdown from '../components/ProfileDropdown'
import { ArrowLeft, Coins, [AppIcon] } from 'lucide-react'
```

## ✅ Checklist Header

Setiap aplikasi harus memiliki:
- [x] Back button ke dashboard
- [x] App icon dengan background warna tema
- [x] Title dengan typography standar
- [x] Subtitle/description
- [x] Credit balance display
- [x] ProfileDropdown component
- [x] Sticky header dengan border-bottom
- [x] Responsive layout
- [x] Max width 7xl
- [x] Consistent padding dan spacing

## 🚫 Jangan Lakukan

- ❌ Jangan gunakan modal untuk project detail (gunakan fullscreen)
- ❌ Jangan skip back button
- ❌ Jangan gunakan warna selain yang sudah ditentukan
- ❌ Jangan ubah ukuran typography tanpa alasan kuat
- ❌ Jangan hardcode credit balance (gunakan `user?.creditBalance`)
- ❌ Jangan taruh button "New Project" di header (taruh di content area)
- ❌ Jangan gunakan background/border untuk credit balance display
- ❌ Jangan gunakan gap atau spacing yang berbeda dari standar

## 📝 Example: Project Detail View

Untuk view detail project:
```tsx
{selectedProject && (
  <div className="fixed inset-0 bg-slate-50 z-50">
    {/* Header sama seperti di atas, tapi: */}
    <div className="flex items-center gap-4">
      {/* Back button kembali ke project list, bukan dashboard */}
      <button onClick={() => setSelectedProject(null)}>
        <ArrowLeft />
      </button>
      {/* Title menggunakan nama project */}
      <h1>{selectedProject.name}</h1>
    </div>
  </div>
)}
```

---

**Last Updated**: 2025-10-07
**Reference App**: Carousel Mix
**Status**: ✅ Active Standard
