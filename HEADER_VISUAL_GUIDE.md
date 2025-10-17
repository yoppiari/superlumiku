# UnifiedHeader Visual Guide

> A visual, diagram-based guide to understanding and implementing UnifiedHeader

## 📐 UnifiedHeader Anatomy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  UnifiedHeader Component                                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌────┐  ┌────┐  ┌──────────────┐  ┌────────────┐     ┌──────┐  ┌────────┐ │
│  │ ←  │  │ 🏠 │  │  📦 [Icon]   │  │   Apps ▼   │ ... │ 💰 999│  │ 👤 ▼  │ │
│  │Back│  │Home│  │  App Title   │  │  Switcher  │     │Credits│  │Profile│ │
│  └────┘  └────┘  │  Subtitle    │  └────────────┘     └──────┘  └────────┘ │
│                   └──────────────┘                                           │
│                                                                               │
│  ◄────────────────────────────────────────────────────────────────────────► │
│  Left Section: Navigation & Identity      Right Section: Actions & User      │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

REQUIRED PROPS:
  title ──────────────────► "App Title"
  icon ───────────────────► 📦 Component
  currentAppId ───────────► "app-name"

OPTIONAL PROPS:
  subtitle ───────────────► "Brief description"
  iconColor ──────────────► "bg-blue-50 text-blue-700"
  showBackButton ─────────► true/false
  backPath ───────────────► "/dashboard" or "/apps/app-name"
  actions ────────────────► Custom React components
```

---

## 🎨 Color System Visual

### Color Anatomy
```
iconColor = "bg-[color]-50 text-[color]-700"
             ↓               ↓
          Background      Text Color
          (Light Shade)   (Dark Shade)
```

### Color Palette by App Type

```
┌─────────────────────────────────────────────────────┐
│  AVATAR / CHARACTER APPS                            │
│  ┌──────────────────────────────────────┐          │
│  │  bg-purple-50   text-purple-700      │          │
│  │  ┌────────┐                           │          │
│  │  │   👤   │  Avatar Creator           │          │
│  │  └────────┘                           │          │
│  └──────────────────────────────────────┘          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  AI GENERATION APPS                                 │
│  ┌──────────────────────────────────────┐          │
│  │  bg-indigo-50   text-indigo-700      │          │
│  │  ┌────────┐                           │          │
│  │  │   ✨   │  Pose Generator           │          │
│  │  └────────┘                           │          │
│  └──────────────────────────────────────┘          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  VIDEO / MEDIA APPS                                 │
│  ┌──────────────────────────────────────┐          │
│  │  bg-blue-50     text-blue-700        │          │
│  │  ┌────────┐                           │          │
│  │  │   🎬   │  Video Mixer              │          │
│  │  └────────┘                           │          │
│  └──────────────────────────────────────┘          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  EDITING APPS                                       │
│  ┌──────────────────────────────────────┐          │
│  │  bg-green-50    text-green-700       │          │
│  │  ┌────────┐                           │          │
│  │  │   🖼️   │  Poster Editor            │          │
│  │  └────────┘                           │          │
│  └──────────────────────────────────────┘          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  BACKGROUND / UTILITY APPS                          │
│  ┌──────────────────────────────────────┐          │
│  │  bg-orange-50   text-orange-700      │          │
│  │  ┌────────┐                           │          │
│  │  │   🔧   │  Background Remover       │          │
│  │  └────────┘                           │          │
│  └──────────────────────────────────────┘          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  ANALYTICS / REPORTS                                │
│  ┌──────────────────────────────────────┐          │
│  │  bg-slate-50    text-slate-700       │          │
│  │  ┌────────┐                           │          │
│  │  │   📊   │  Analytics Dashboard      │          │
│  │  └────────┘                           │          │
│  └──────────────────────────────────────┘          │
└─────────────────────────────────────────────────────┘
```

---

## 🗺️ Navigation Flow Diagram

### App List View → Project Detail View

```
┌─────────────────────────────────────┐
│  Dashboard (/dashboard)             │
│  ┌────────────────────────────────┐ │
│  │  🏠 Dashboard                  │ │
│  │  [App Grid]                    │ │
│  │                                │ │
│  │  Click "My App" ───────┐       │ │
│  └────────────────────────│───────┘ │
└────────────────────────────│─────────┘
                             ↓
┌─────────────────────────────────────┐
│  App List (/apps/my-app)            │
│  ┌────────────────────────────────┐ │
│  │  ← 🏠 My App                   │ │  backPath="/dashboard"
│  │  Brief description             │ │
│  │                                │ │
│  │  [Projects Grid]               │ │
│  │                                │ │
│  │  Click "Project 1" ────┐       │ │
│  └────────────────────────│───────┘ │
└────────────────────────────│─────────┘
                             ↓
┌─────────────────────────────────────┐
│  Project Detail                     │
│  (/apps/my-app/project-123)         │
│  ┌────────────────────────────────┐ │
│  │  ← 🏠 Project 1                │ │  backPath="/apps/my-app"
│  │  Project description           │ │
│  │                                │ │
│  │  [Project Content]             │ │
│  │                                │ │
│  │  Click Back (←) ───────┐       │ │
│  └────────────────────────│───────┘ │
└────────────────────────────│─────────┘
                             ↓
              (Returns to App List)
```

---

## 🔄 Props Flow Diagram

### How Props Affect the Header

```
Component Props
┌─────────────────────────────────────┐
│  title = "Avatar Creator"           │ ────┐
│  subtitle = "Create AI avatars"     │ ────┤
│  icon = <UserCircle />              │ ────┤
│  iconColor = "bg-purple-50..."      │ ────┤
│  showBackButton = true              │ ────┤
│  backPath = "/dashboard"            │ ────┤
│  currentAppId = "avatar-creator"    │ ────┤
│  actions = null                     │ ────┤
└─────────────────────────────────────┘     │
                                            │
                                            ↓
                    UnifiedHeader Renders As:
┌──────────────────────────────────────────────────────────────┐
│  ┌────┐  ┌────┐  ┌─────────────────┐  ┌──────────┐  ┌─────┐ │
│  │ ←  │  │ 🏠 │  │  👤             │  │ Apps ▼   │  │💰999│ │
│  │    │  │    │  │  Avatar Creator │  │          │  │     │ │
│  └────┘  └────┘  │  Create AI...   │  └──────────┘  └─────┘ │
│                   └─────────────────┘                         │
│  ↑       ↑       ↑   ↑        ↑         ↑                    │
│  │       │       │   │        │         │                    │
│  │       │       │   │        │         │                    │
│  show    always  icon title   subtitle  highlighted         │
│  Back    visible      &                 (currentAppId)       │
│  Button           iconColor                                  │
└──────────────────────────────────────────────────────────────┘

App Switcher Dropdown (when clicked):
┌──────────────────────────────┐
│  Switch App                  │
│  ────────────────────────    │
│  👤 Avatar Creator      ●    │ ← Highlighted (currentAppId match)
│  ✨ Pose Generator           │
│  🎬 Video Mixer              │
│  🖼️  Poster Editor            │
│  ────────────────────────    │
│  🏠 Back to Dashboard        │
└──────────────────────────────┘
```

---

## 📱 Responsive Behavior

### Desktop (1920px+)
```
┌─────────────────────────────────────────────────────────────────────┐
│  ← 🏠  📦 App Name        Apps ▼                    💰 999    👤 ▼  │
│         Subtitle                                                     │
└─────────────────────────────────────────────────────────────────────┘
     ↑    ↑    ↑              ↑                         ↑         ↑
   Back  Home Icon+Title  App Switcher              Credits    Profile
                          (Visible)
```

### Tablet (768px - 1024px)
```
┌──────────────────────────────────────────────────────────────┐
│  ← 🏠  📦 App Name        Apps ▼              💰 999    👤 ▼ │
│         Subtitle                                              │
└──────────────────────────────────────────────────────────────┘
     ↑    ↑    ↑              ↑                   ↑         ↑
   Back  Home Icon+Title  App Switcher         Credits    Profile
                          (Visible)
```

### Mobile (375px - 767px)
```
┌────────────────────────────────────────────┐
│  ← 🏠  📦 App          💰 999         👤 ▼ │
│         Subtitle                            │
└────────────────────────────────────────────┘
     ↑    ↑    ↑          ↑              ↑
   Back  Home Icon+Title Credits       Profile
                         (Number only)

   App Switcher HIDDEN on mobile
```

---

## 🎯 Icon Sizing Visual

### ✅ CORRECT Icon Size
```
className="w-5 h-5"

┌─────────┐
│         │
│    ✨   │  ← Perfect size (20px × 20px)
│         │     Fits perfectly in the 44px container
└─────────┘
  20px
```

### ❌ WRONG Icon Sizes
```
className="w-4 h-4"          className="w-6 h-6"

┌─────────┐                  ┌─────────┐
│         │                  │         │
│   ✨    │ ← Too small      │   ✨    │ ← Too large
│         │                  │         │
└─────────┘                  └─────────┘
  16px                         24px
```

---

## 🔀 App Structure Flow

### Simple App (No Projects)
```
YourApp.tsx
│
└── UnifiedHeader
    │
    └── Main Content
        └── [Your App Features]

Example:
┌─────────────────────────────┐
│  ← 🏠  My App               │
│         Description          │
├─────────────────────────────┤
│                              │
│  [Main App Content]          │
│  • Feature 1                 │
│  • Feature 2                 │
│  • Feature 3                 │
│                              │
└─────────────────────────────┘
```

### Project-Based App
```
YourApp.tsx
│
├── When projectId in URL:
│   ├── UnifiedHeader (Project Name)
│   └── Project Detail Content
│
└── When no projectId:
    ├── UnifiedHeader (App Name)
    └── Projects List

Example Flow:
┌─────────────────────────────┐
│  ← 🏠  My App               │ ← /apps/my-app
│         Description          │
├─────────────────────────────┤
│  [Projects List]             │
│  ┌─────────┐  ┌─────────┐   │
│  │Project 1│  │Project 2│   │ ← Click Project 1
│  └─────────┘  └─────────┘   │
└─────────────────────────────┘
                ↓
┌─────────────────────────────┐
│  ← 🏠  Project 1            │ ← /apps/my-app/proj-123
│         Project desc         │   backPath="/apps/my-app"
├─────────────────────────────┤
│  [Project Content]           │
│  • Detail 1                  │
│  • Detail 2                  │
└─────────────────────────────┘
```

### App with Sub-Navigation
```
YourApp.tsx (Main)
│
├── UnifiedHeader (Always visible)
│
├── Sub-Navigation Tabs
│   ├── Dashboard
│   ├── Library
│   └── Settings
│
└── Route Content
    └── <Routes>
        ├── DashboardPage
        ├── LibraryPage
        └── SettingsPage

Example Layout:
┌─────────────────────────────────────────┐
│  ← 🏠  My App                           │ ← UnifiedHeader (sticky)
│         Description                      │
├─────────────────────────────────────────┤
│  [Dashboard]  [Library]  [Settings]     │ ← Sub-nav (sticky)
├─────────────────────────────────────────┤
│                                          │
│  [Page Content Changes Based on Tab]    │
│                                          │
└─────────────────────────────────────────┘
```

---

## 🚦 Implementation Decision Tree

```
                    Start: New App
                          │
                          ↓
              ┌───────────────────────┐
              │  Does your app have   │
              │  multiple projects?   │
              └───────────────────────┘
                   │              │
                  Yes            No
                   │              │
                   ↓              ↓
          ┌─────────────┐   ┌──────────────┐
          │  Use:       │   │  Use:        │
          │  Template 1 │   │  Template 3  │
          │  (Projects) │   │  (Simple)    │
          └─────────────┘   └──────────────┘
                   │
                   ↓
          ┌─────────────────────────┐
          │  Does it need           │
          │  sub-navigation?        │
          └─────────────────────────┘
                   │              │
                  Yes            No
                   │              │
                   ↓              ↓
          ┌─────────────┐   ┌──────────────┐
          │  Use:       │   │  Use:        │
          │  Template 2 │   │  Template 1  │
          │  (Tabs)     │   │  (Standard)  │
          └─────────────┘   └──────────────┘
```

---

## 🎨 Color Selection Flowchart

```
                 What type of app?
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ↓                 ↓                 ↓
   Avatar/Character   AI Generation    Video/Media
        │                 │                 │
        ↓                 ↓                 ↓
   bg-purple-50      bg-indigo-50      bg-blue-50
   text-purple-700   text-indigo-700   text-blue-700

        │
        ↓
   ┌─────────────────────────────────┐
   │  More specific categorization?  │
   └─────────────────────────────────┘
        │                 │                 │
        ↓                 ↓                 ↓
    Editing          Background         Analytics
        │                 │                 │
        ↓                 ↓                 ↓
   bg-green-50      bg-orange-50       bg-slate-50
   text-green-700   text-orange-700    text-slate-700
```

---

## 🧪 Testing Visual Checklist

### Visual Test Points

```
Desktop (1920px)                    Mobile (375px)
┌──────────────────────────────┐   ┌────────────────┐
│ ✓ Back button visible        │   │ ✓ Back visible │
│ ✓ Home button visible        │   │ ✓ Home visible │
│ ✓ Icon + title not truncated │   │ ✓ Title shows  │
│ ✓ App switcher visible       │   │ ✗ Switcher     │
│ ✓ Credits full display       │   │   hidden       │
│ ✓ Profile dropdown works     │   │ ✓ Credits #    │
└──────────────────────────────┘   │ ✓ Profile ✓    │
                                    └────────────────┘
Tablet (768px)
┌──────────────────────────────┐
│ ✓ All elements visible       │
│ ✓ Proper spacing maintained  │
│ ✓ App switcher visible       │
│ ✓ Credits abbreviated OK     │
└──────────────────────────────┘
```

---

## 📊 Props Reference Table

| Prop | Required | Type | Default | Example | Visual Effect |
|------|----------|------|---------|---------|---------------|
| `title` | ✅ | string | - | `"My App"` | 📦 **My App** |
| `subtitle` | ❌ | string | undefined | `"Description"` | Brief description |
| `icon` | ✅ | ReactNode | - | `<Icon />` | 📦 (icon visual) |
| `iconColor` | ❌ | string | blue | `"bg-purple-50..."` | 🟣 (background color) |
| `showBackButton` | ❌ | boolean | true | `true` | ← (arrow visible) |
| `backPath` | ❌ | string | /dashboard | `"/apps/my-app"` | ← (click destination) |
| `currentAppId` | ✅ | string | - | `"my-app"` | ● (highlight in switcher) |
| `actions` | ❌ | ReactNode | null | `<Button />` | [Export] (custom button) |

---

## 🔍 Error State Visualizations

### Missing Required Prop: title
```
❌ ERROR
┌─────────────────────────────────┐
│  ← 🏠  [undefined]              │
│                                  │
└─────────────────────────────────┘
Console: "title prop is required"
```

### Missing Required Prop: icon
```
❌ ERROR
┌─────────────────────────────────┐
│  ← 🏠  [ ]  My App              │
│                                  │
└─────────────────────────────────┘
No icon displayed
```

### Wrong Icon Size
```
❌ WRONG
┌─────────────────────────────────┐
│  ← 🏠  ✨  My App  (too big)    │
│                                  │
└─────────────────────────────────┘
className="w-6 h-6"  // Should be w-5 h-5
```

### App Switcher Not Highlighting
```
❌ ISSUE
App Switcher:
┌──────────────────────┐
│  👤 Avatar Creator   │  ← No highlight
│  ✨ Pose Generator  │
└──────────────────────┘

Cause: currentAppId doesn't match
```

---

## ✅ Success States

### Perfectly Implemented Header
```
✅ PERFECT
┌─────────────────────────────────────────────────────────────┐
│  ← 🏠  📦 My App              Apps ▼        💰 999    👤 ▼  │
│         Brief description                                    │
└─────────────────────────────────────────────────────────────┘

✓ All required props provided
✓ Icon size is w-5 h-5
✓ Color scheme correct (bg-blue-50 text-blue-700)
✓ Navigation paths set correctly
✓ Responsive on all devices
```

---

**Last Updated**: 2025-01-17
**Visual Guide Version**: 1.0.0
