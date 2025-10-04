# Lumiku App - UI/UX Standards

**Audience:** Developers implementing frontend components and apps
**Last Updated:** 2025-10-03

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Header Standard](#header-standard)
3. [Color Palette](#color-palette)
4. [Typography](#typography)
5. [Component Patterns](#component-patterns)
6. [Layout Guidelines](#layout-guidelines)
7. [Responsive Design](#responsive-design)
8. [Icons & Assets](#icons--assets)

---

## Design Philosophy

### Core Principles

1. **Consistency First** - All apps must follow the same visual language
2. **User Awareness** - Users should always know where they are in the app
3. **Quick Access** - Important info (credits, profile) always visible
4. **Clean & Modern** - Use slate color scheme, proper spacing, modern typography
5. **Mobile Friendly** - Responsive design is mandatory, not optional

---

## Header Standard

**IMPORTANT:** All app pages MUST use this standardized header format for consistency.

### Header Structure

Every app page should have a header with:
- **Left side**: Back button + App icon + App name + Description
- **Right side**: Save indicator (if applicable) + Credit balance card + Profile dropdown
- **Sticky positioning**: Header must stick to top when scrolling

### Implementation Template

```tsx
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import ProfileDropdown from '../components/ProfileDropdown'
import { ArrowLeft, YourAppIcon, Coins } from 'lucide-react'

export default function YourApp() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - MUST BE STICKY */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">
          <div className="flex items-center justify-between">
            {/* Left Side */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <YourAppIcon className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-[1.75rem] font-semibold text-slate-900 tracking-tighter">
                    Your App Name
                  </h1>
                  <p className="text-sm md:text-[0.9375rem] text-slate-600">
                    Your app description here
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4 md:gap-6">
              {/* Save Indicator (Optional - only for apps with auto-save) */}
              {isSaving ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-sm text-slate-600">Saving...</span>
                </div>
              ) : lastSaved ? (
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-slate-600">Saved 2m ago</span>
                </div>
              ) : null}

              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-5 py-2.5 rounded-lg hover:bg-slate-100 transition-all">
                <Coins className="w-[1.125rem] h-[1.125rem] text-slate-600" />
                <span className="font-medium text-slate-900">
                  {(user?.creditBalance || 0).toLocaleString()} Credits
                </span>
              </div>
              <ProfileDropdown />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Your app content here */}
      </div>
    </div>
  )
}
```

### Header Variants

#### 1. Single Page App (Standard)
Use template above with your app name as title.

**Example:** Video Mixer, Simple Calculator App

#### 2. Multi-Page App with Projects
Use dynamic title based on current context.

**Example:** Carousel Mix shows project name when viewing a project.

```tsx
// When viewing specific project
<h1 className="text-2xl md:text-[1.75rem] font-semibold text-slate-900 tracking-tighter">
  {currentProject.name}
</h1>
{currentProject.description && (
  <p className="text-sm md:text-[0.9375rem] text-slate-600">
    {currentProject.description}
  </p>
)}

// When viewing projects list
<h1 className="text-2xl md:text-[1.75rem] font-semibold text-slate-900 tracking-tighter">
  Your App Name
</h1>
<p className="text-sm md:text-[0.9375rem] text-slate-600">
  Your app description
</p>
```

### Required Imports

```tsx
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import ProfileDropdown from '../components/ProfileDropdown'
import { ArrowLeft, Coins, YourAppIcon, Loader2, Check } from 'lucide-react'
```

### Save Indicator (Optional)

Only include save indicator if your app has auto-save functionality:

```tsx
// Add to your store/state
const [isSaving, setIsSaving] = useState(false)
const [lastSaved, setLastSaved] = useState<Date | null>(null)

// Implement time ago logic
const [timeAgo, setTimeAgo] = useState('')
useEffect(() => {
  if (!lastSaved) return
  const updateTimeAgo = () => {
    const diff = Math.floor((new Date().getTime() - lastSaved.getTime()) / 1000)
    if (diff < 5) setTimeAgo('just now')
    else if (diff < 60) setTimeAgo(`${diff}s ago`)
    else if (diff < 3600) setTimeAgo(`${Math.floor(diff / 60)}m ago`)
    else setTimeAgo(`${Math.floor(diff / 3600)}h ago`)
  }
  updateTimeAgo()
  const interval = setInterval(updateTimeAgo, 1000)
  return () => clearInterval(interval)
}, [lastSaved])
```

**Important:** Save indicators should ONLY appear in the header, never in the main content area.

### DO's and DON'Ts

✅ **DO:**
- Use exact class names from template for consistency
- Add `sticky top-0 z-50` to header for sticky positioning
- Show credit balance in same format (with `.toLocaleString()`)
- Include back button for easy navigation
- Use app icon in colored badge
- Import and use ProfileDropdown component
- Place save indicator ONLY in header (if needed)

❌ **DON'T:**
- Create custom header layouts
- Forget to make header sticky (`sticky top-0 z-50`)
- Change spacing/padding arbitrarily
- Hide credit balance or profile dropdown
- Use different color schemes (stick to slate)
- Hardcode user name instead of using `user?.name`
- Add save indicators in content area (header only!)

---

## Color Palette

### Primary Colors

```css
/* Slate (Main UI) */
bg-slate-50      /* Light background */
bg-slate-100     /* Hover states */
bg-slate-200     /* Borders */
bg-slate-600     /* Text secondary */
bg-slate-700     /* Badges, cards */
bg-slate-900     /* Text primary */

/* Blue (App Icons, Accents) */
bg-blue-50       /* Icon backgrounds */
text-blue-600    /* Icons */
text-blue-700    /* Emphasis */

/* Green (Success) */
bg-green-50
text-green-600
text-green-700

/* Red (Error, Delete) */
bg-red-50
text-red-600

/* Yellow (Warning) */
bg-yellow-50
text-yellow-600
```

### App Icon Colors

Each app should have a distinct color for its icon badge:

```tsx
// Blue apps
bg-blue-50 text-blue-700

// Green apps
bg-green-50 text-green-700

// Purple apps
bg-purple-50 text-purple-700

// Orange apps
bg-orange-50 text-orange-700
```

---

## Typography

### Font Sizes

```tsx
// Headings
text-2xl md:text-[1.75rem]   // App title (H1)
text-xl md:text-[1.375rem]   // Section headers (H2)
text-lg md:text-[1.25rem]    // Sub-headers (H3)

// Body text
text-sm md:text-[0.9375rem]  // Description text
text-xs md:text-[0.8125rem]  // Small text, labels

// Utility
tracking-tighter             // For headings
font-semibold               // For headings
font-medium                 // For emphasized text
```

### Text Colors

```tsx
text-slate-900   // Primary text (headings, important info)
text-slate-600   // Secondary text (descriptions, labels)
text-slate-500   // Tertiary text (metadata, timestamps)
```

---

## Component Patterns

### Buttons

#### Primary Button
```tsx
<button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold">
  Primary Action
</button>
```

#### Secondary Button
```tsx
<button className="px-5 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition">
  Secondary Action
</button>
```

#### Icon Button
```tsx
<button className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-600 hover:text-slate-900">
  <Icon className="w-5 h-5" />
</button>
```

### Cards

#### Standard Card
```tsx
<div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
  {/* Card content */}
</div>
```

#### Hover Card
```tsx
<div className="bg-white rounded-xl border border-slate-200 hover:border-slate-700 hover:shadow-soft-md transition cursor-pointer p-6">
  {/* Interactive card content */}
</div>
```

### Inputs

#### Text Input
```tsx
<input
  type="text"
  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  placeholder="Enter text..."
/>
```

#### Select
```tsx
<select className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500">
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```

---

## Layout Guidelines

### Container Widths

```tsx
// Full width apps (Video Mixer)
max-w-[1920px]

// Standard apps
max-w-7xl

// Content-focused apps
max-w-6xl

// Forms, settings
max-w-4xl
```

### Spacing

```tsx
// Page padding
px-6 md:px-10 py-8

// Content padding
p-4 lg:p-8

// Section gaps
gap-4 md:gap-6    // Standard
gap-6             // Larger
```

### Grid Layouts

```tsx
// Apps grid (Dashboard)
grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6

// Content grid (2 columns)
grid grid-cols-1 md:grid-cols-2 gap-6

// Sidebar layout
grid grid-cols-12 gap-6
```

---

## Responsive Design

### Breakpoints

```tsx
// Mobile first approach
className="text-sm md:text-base lg:text-lg"

// Hide on mobile
className="hidden md:block"

// Show only on mobile
className="block md:hidden"

// Responsive grid
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
```

### Mobile Considerations

1. **Touch Targets**: Minimum 44x44px (use `p-2` minimum for buttons)
2. **Text Scaling**: Always provide responsive text sizes
3. **Spacing**: Reduce padding on mobile (`p-4 lg:p-8`)
4. **Navigation**: Stack items vertically on mobile

---

## Icons & Assets

### Icon Library

**Use Lucide React** for all icons: https://lucide.dev/icons

```tsx
import { Icon1, Icon2 } from 'lucide-react'

// Standard size (most common)
<Icon className="w-5 h-5" />

// Small icons (in badges, small buttons)
<Icon className="w-4 h-4" />

// Large icons (empty states)
<Icon className="w-12 h-12" />
```

### Common Icons

```tsx
ArrowLeft    // Back button
Coins        // Credits
Settings     // Settings
User         // Profile
Plus         // Add/Create
Trash2       // Delete
Upload       // File upload
Download     // Download
RotateCw     // Loading/Processing
CheckCircle2 // Success
AlertCircle  // Warning/Error
```

### Icon Colors

```tsx
// Default
text-slate-600

// Emphasis
text-blue-600
text-green-600
text-red-600

// In badges
text-blue-700
```

---

## Best Practices

### Accessibility

1. Use semantic HTML (`<button>` not `<div onClick>`)
2. Add `aria-label` for icon-only buttons
3. Maintain color contrast ratios (WCAG AA)
4. Support keyboard navigation

### Performance

1. Use `React.memo()` for expensive components
2. Lazy load images with proper placeholders
3. Avoid unnecessary re-renders
4. Use proper `key` props in lists

### User Experience

1. Show loading states for async operations
2. Provide feedback for user actions (success/error messages)
3. Disable buttons during processing
4. Use optimistic updates when appropriate

---

## Examples

### Full App Example (Simple App)

See: `frontend/src/apps/VideoMixer.tsx` (lines 638-671)

### Multi-Context App Example

See: `frontend/src/apps/CarouselMix.tsx`
- Project list view (lines 117-151)
- Project detail view (lines 68-115)

---

## Checklist for New Apps

- [ ] Header follows standard format (left: back + icon + title, right: credits + profile)
- [ ] Header is sticky (`sticky top-0 z-50` classes added)
- [ ] Save indicator in header ONLY (not in content area)
- [ ] Uses slate color scheme consistently
- [ ] Responsive design implemented (mobile, tablet, desktop)
- [ ] All interactive elements have hover states
- [ ] Loading and error states implemented
- [ ] Credit balance updates after operations
- [ ] Back button navigates to `/dashboard`
- [ ] ProfileDropdown component imported and used
- [ ] Proper spacing and padding (matches existing apps)
- [ ] Icons from Lucide library with consistent sizes

---

**Remember:** When in doubt, copy the header structure from VideoMixer.tsx or CarouselMix.tsx and adapt it to your app. Consistency is more important than innovation in UI structure.
