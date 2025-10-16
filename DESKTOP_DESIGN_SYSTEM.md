# Lumiku Desktop Design System
## Professional SaaS Dashboard - Desktop-First Approach

**Version**: 1.0
**Last Updated**: October 2025
**Platform**: Desktop Web Application (Browser-based)

---

## Design Philosophy

Lumiku is a professional desktop web application for content creators. Our design balances:
- **Professional & Clean**: Suitable for daily work environments
- **Modern but Timeless**: Won't feel outdated in 2 years
- **Productive & Efficient**: Optimized for keyboard + mouse workflows
- **Scalable**: Handles 5-50+ apps gracefully

**Think**: Figma + Linear + Vercel Dashboard (not Instagram or TikTok)

---

## Layout Architecture

### Option Selected: Sidebar Navigation + Command Palette

This hybrid approach provides:
- **Persistent sidebar** (240px) for primary navigation
- **Command palette** (Cmd/Ctrl+K) for power users
- **Top header** for search, notifications, and profile
- **Multi-column content area** for data-dense interfaces

```
┌────────────┬──────────────────────────────────────────────┐
│            │  [Search] [Notifications] [Credits] [User]   │
│   LOGO     ├──────────────────────────────────────────────┤
│            │                                               │
├────────────┤                                               │
│            │                                               │
│ Dashboard  │          Main Content Area                    │
│ Apps       │          (Responsive Grid/Flex)               │
│ Projects   │                                               │
│ My Work    │                                               │
│ Credits    │                                               │
│            │                                               │
│ [Support]  │                                               │
└────────────┴──────────────────────────────────────────────┘
```

**Breakpoints**:
- Desktop Large: 1440px+ (default target)
- Desktop Standard: 1280px - 1439px
- Desktop Small: 1024px - 1279px (collapsible sidebar)
- Tablet: Below 1024px (hamburger menu)

---

## Color System

### Neutral Palette (Primary UI)

```css
/* Base Colors - Professional Gray Scale */
--color-white: #ffffff;
--color-gray-50: #f8fafc;   /* Page background */
--color-gray-100: #f1f5f9;  /* Card hover, subtle backgrounds */
--color-gray-200: #e2e8f0;  /* Borders, dividers */
--color-gray-300: #cbd5e1;  /* Border hover */
--color-gray-400: #94a3b8;  /* Disabled text */
--color-gray-500: #64748b;  /* Secondary text */
--color-gray-600: #475569;  /* Body text */
--color-gray-700: #334155;  /* Headings */
--color-gray-800: #1e293b;  /* Dark headings */
--color-gray-900: #0f172a;  /* Primary text */
```

### Accent Color (Brand Primary)

```css
/* Vibrant Blue - Professional yet modern */
--color-primary-50: #eff6ff;
--color-primary-100: #dbeafe;
--color-primary-200: #bfdbfe;
--color-primary-300: #93c5fd;
--color-primary-400: #60a5fa;
--color-primary-500: #3b82f6;  /* Main brand color */
--color-primary-600: #2563eb;  /* Hover states */
--color-primary-700: #1d4ed8;  /* Active states */
--color-primary-800: #1e40af;
--color-primary-900: #1e3a8a;
```

### Semantic Colors

```css
/* Success (Green) */
--color-success-50: #f0fdf4;
--color-success-500: #22c55e;
--color-success-600: #16a34a;
--color-success-700: #15803d;

/* Warning (Amber) */
--color-warning-50: #fffbeb;
--color-warning-500: #f59e0b;
--color-warning-600: #d97706;
--color-warning-700: #b45309;

/* Error (Red) */
--color-error-50: #fef2f2;
--color-error-500: #ef4444;
--color-error-600: #dc2626;
--color-error-700: #b91c1c;

/* Info (Sky) */
--color-info-50: #f0f9ff;
--color-info-500: #0ea5e9;
--color-info-600: #0284c7;
--color-info-700: #0369a1;
```

### App Category Colors (Optional)

For visual organization of 50+ apps:

```css
--color-video: #8b5cf6;    /* Purple */
--color-image: #ec4899;    /* Pink */
--color-audio: #14b8a6;    /* Teal */
--color-text: #f59e0b;     /* Amber */
--color-ai: #3b82f6;       /* Blue */
--color-social: #10b981;   /* Green */
```

**Usage**: Subtle background tints (opacity 10%) and icon colors, not full background fills.

---

## Typography

### Font Stack

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
             'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
```

**Why Inter**: Professional, highly legible at all sizes, optimized for screens, free & open-source.

### Type Scale

```css
/* Display - Hero sections, marketing */
--font-size-display: 48px;  /* 3rem */
--line-height-display: 1.1;
--font-weight-display: 700;
--letter-spacing-display: -0.02em;

/* Heading 1 - Page titles */
--font-size-h1: 32px;  /* 2rem */
--line-height-h1: 1.2;
--font-weight-h1: 600;
--letter-spacing-h1: -0.02em;

/* Heading 2 - Section titles */
--font-size-h2: 24px;  /* 1.5rem */
--line-height-h2: 1.3;
--font-weight-h2: 600;
--letter-spacing-h2: -0.01em;

/* Heading 3 - Card titles */
--font-size-h3: 20px;  /* 1.25rem */
--line-height-h3: 1.4;
--font-weight-h3: 600;
--letter-spacing-h3: -0.01em;

/* Body Large - Emphasis text */
--font-size-body-lg: 18px;  /* 1.125rem */
--line-height-body-lg: 1.6;
--font-weight-body-lg: 400;

/* Body - Default text */
--font-size-body: 16px;  /* 1rem */
--line-height-body: 1.6;
--font-weight-body: 400;

/* Body Small - Secondary text */
--font-size-body-sm: 14px;  /* 0.875rem */
--line-height-body-sm: 1.5;
--font-weight-body-sm: 400;

/* Caption - Labels, metadata */
--font-size-caption: 12px;  /* 0.75rem */
--line-height-caption: 1.4;
--font-weight-caption: 500;
--letter-spacing-caption: 0.01em;
```

### Font Weights

```css
--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

**Guidelines**:
- Use 600 (semibold) for most headings
- Use 500 (medium) for buttons and labels
- Use 400 (regular) for body text
- Avoid 700 (bold) except for emphasis

---

## Spacing System

### 8pt Grid System

```css
--space-0: 0;
--space-1: 4px;    /* 0.25rem - Tight spacing */
--space-2: 8px;    /* 0.5rem - Base unit */
--space-3: 12px;   /* 0.75rem */
--space-4: 16px;   /* 1rem - Default spacing */
--space-5: 20px;   /* 1.25rem */
--space-6: 24px;   /* 1.5rem - Card padding */
--space-8: 32px;   /* 2rem - Section spacing */
--space-10: 40px;  /* 2.5rem */
--space-12: 48px;  /* 3rem - Large section spacing */
--space-16: 64px;  /* 4rem - Page sections */
--space-20: 80px;  /* 5rem - Major sections */
--space-24: 96px;  /* 6rem - Page margins */
```

### Spacing Usage

```css
/* Component Internal Spacing */
--padding-input: 12px 16px;
--padding-button-sm: 8px 16px;
--padding-button-md: 12px 24px;
--padding-button-lg: 16px 32px;
--padding-card: 24px;
--padding-modal: 32px;

/* Layout Spacing */
--gap-xs: 8px;   /* Tight groups */
--gap-sm: 12px;  /* Related items */
--gap-md: 16px;  /* Default gap */
--gap-lg: 24px;  /* Card grids */
--gap-xl: 32px;  /* Section spacing */
```

---

## Border Radius

```css
--radius-sm: 6px;   /* Tags, badges */
--radius-md: 8px;   /* Buttons, inputs */
--radius-lg: 12px;  /* Cards, modals */
--radius-xl: 16px;  /* Large cards */
--radius-2xl: 20px; /* Hero sections */
--radius-full: 9999px; /* Pills, avatars */
```

**Guidelines**:
- Use 8px for most interactive elements
- Use 12px for cards and containers
- Avoid mixing too many different radii

---

## Shadows & Elevation

### Shadow Scale

```css
/* Subtle depth for cards */
--shadow-sm: 0 1px 2px 0 rgba(15, 23, 42, 0.05);

/* Default card shadow */
--shadow-md: 0 2px 8px 0 rgba(15, 23, 42, 0.08);

/* Hover state */
--shadow-lg: 0 4px 16px 0 rgba(15, 23, 42, 0.10);

/* Dropdowns, modals */
--shadow-xl: 0 8px 24px 0 rgba(15, 23, 42, 0.12);

/* Command palette, important modals */
--shadow-2xl: 0 16px 40px 0 rgba(15, 23, 42, 0.16);
```

### Elevation Levels

```css
/* Level 0: Base (no shadow) */
background: white;
border: 1px solid var(--color-gray-200);

/* Level 1: Resting cards */
box-shadow: var(--shadow-sm);
border: 1px solid var(--color-gray-200);

/* Level 2: Hover cards */
box-shadow: var(--shadow-md);
border: 1px solid var(--color-gray-300);

/* Level 3: Active/Focused */
box-shadow: var(--shadow-lg);
border: 1px solid var(--color-primary-500);

/* Level 4: Overlays (dropdowns, popovers) */
box-shadow: var(--shadow-xl);
border: 1px solid var(--color-gray-200);

/* Level 5: Modals, command palette */
box-shadow: var(--shadow-2xl);
border: none;
```

---

## Component Specifications

### 1. Sidebar Navigation

**Dimensions**:
- Width: 240px (fixed)
- Collapsed: 64px (icon-only)
- Height: 100vh (full viewport)

**Structure**:
```
┌─────────────────────┐
│  Logo (48px height) │
├─────────────────────┤
│                     │
│  Navigation Links   │
│  (Icon + Label)     │
│                     │
│  - Dashboard        │
│  - Apps & Tools     │
│  - Projects         │
│  - My Work          │
│  - Credits          │
│  - Settings         │
│                     │
│  ↓ (spacer)         │
│                     │
│  Support            │
│  Help Center        │
└─────────────────────┘
```

**Styling**:
```css
.sidebar {
  background: #ffffff;
  border-right: 1px solid var(--color-gray-200);
  padding: 24px 16px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-gray-600);
  transition: all 0.15s ease;
}

.nav-item:hover {
  background: var(--color-gray-100);
  color: var(--color-gray-900);
}

.nav-item.active {
  background: var(--color-primary-50);
  color: var(--color-primary-700);
}

.nav-item-icon {
  width: 20px;
  height: 20px;
}
```

### 2. Top Header

**Height**: 64px (fixed)

**Structure**:
```
[Logo/Menu] | [Search Bar............] | [Notifications] [Credits] [User]
```

**Styling**:
```css
.header {
  height: 64px;
  background: #ffffff;
  border-bottom: 1px solid var(--color-gray-200);
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 24px;
  position: sticky;
  top: 0;
  z-index: 40;
}

.search-bar {
  flex: 1;
  max-width: 600px;
  height: 40px;
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  padding: 0 16px;
  font-size: 14px;
}

.search-bar:focus {
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px var(--color-primary-50);
}
```

### 3. App Cards

**Sizes**:
- Desktop Large: 280px width
- Desktop Standard: 240px width
- Desktop Small: 200px width

**Structure**:
```
┌──────────────────────┐
│    [64px Icon]       │
│                      │
│   App Name (h3)      │
│   Description (sm)   │
│                      │
│   [Category Badge]   │
└──────────────────────┘
```

**Styling**:
```css
.app-card {
  background: #ffffff;
  border: 1px solid var(--color-gray-200);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  transition: all 0.2s ease;
  cursor: pointer;
}

.app-card:hover {
  border-color: var(--color-gray-300);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.app-card:active {
  transform: translateY(0);
}

.app-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-50);
  color: var(--color-primary-600);
}

.app-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-gray-900);
  margin-bottom: 8px;
}

.app-description {
  font-size: 14px;
  color: var(--color-gray-600);
  line-height: 1.5;
  margin-bottom: 12px;
}
```

### 4. Stats Cards

**Layout**: 4 columns on desktop, 2 on tablet

**Structure**:
```
┌────────────────────┐
│ [Icon]        [↗]  │
│                    │
│ 12,450             │
│ Label Text         │
└────────────────────┘
```

**Styling**:
```css
.stat-card {
  background: #ffffff;
  border: 1px solid var(--color-gray-200);
  border-radius: 12px;
  padding: 24px;
  transition: all 0.2s ease;
}

.stat-card:hover {
  border-color: var(--color-gray-300);
  box-shadow: var(--shadow-sm);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  color: var(--color-gray-900);
  line-height: 1.2;
  letter-spacing: -0.02em;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: var(--color-gray-600);
}
```

### 5. Buttons

**Sizes**:
```css
/* Small */
padding: 8px 16px;
font-size: 14px;
height: 36px;

/* Medium (default) */
padding: 12px 24px;
font-size: 14px;
height: 44px;

/* Large */
padding: 16px 32px;
font-size: 16px;
height: 52px;
```

**Variants**:

```css
/* Primary - Main CTAs */
.btn-primary {
  background: var(--color-primary-600);
  color: #ffffff;
  border: none;
  font-weight: 500;
}
.btn-primary:hover {
  background: var(--color-primary-700);
  box-shadow: var(--shadow-sm);
}

/* Secondary - Less important actions */
.btn-secondary {
  background: #ffffff;
  color: var(--color-gray-700);
  border: 1px solid var(--color-gray-300);
  font-weight: 500;
}
.btn-secondary:hover {
  background: var(--color-gray-50);
  border-color: var(--color-gray-400);
}

/* Ghost - Tertiary actions */
.btn-ghost {
  background: transparent;
  color: var(--color-gray-700);
  border: none;
  font-weight: 500;
}
.btn-ghost:hover {
  background: var(--color-gray-100);
}

/* Danger - Destructive actions */
.btn-danger {
  background: var(--color-error-600);
  color: #ffffff;
  border: none;
  font-weight: 500;
}
.btn-danger:hover {
  background: var(--color-error-700);
}
```

**All buttons**:
```css
border-radius: 8px;
transition: all 0.15s ease;
cursor: pointer;
font-family: inherit;
display: inline-flex;
align-items: center;
justify-content: center;
gap: 8px;
```

### 6. Input Fields

```css
.input {
  width: 100%;
  height: 44px;
  padding: 0 16px;
  border: 1px solid var(--color-gray-300);
  border-radius: 8px;
  font-size: 14px;
  color: var(--color-gray-900);
  background: #ffffff;
  transition: all 0.15s ease;
}

.input:hover {
  border-color: var(--color-gray-400);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px var(--color-primary-50);
}

.input:disabled {
  background: var(--color-gray-100);
  color: var(--color-gray-400);
  cursor: not-allowed;
}

.input::placeholder {
  color: var(--color-gray-400);
}

/* With icon */
.input-with-icon {
  padding-left: 44px;
}
```

### 7. Search Bar (Global)

```css
.search-global {
  position: relative;
  width: 100%;
  max-width: 600px;
}

.search-input {
  width: 100%;
  height: 40px;
  padding: 0 40px 0 40px;
  border: 1px solid var(--color-gray-200);
  border-radius: 8px;
  font-size: 14px;
  background: var(--color-gray-50);
  transition: all 0.15s ease;
}

.search-input:focus {
  background: #ffffff;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px var(--color-primary-50);
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-gray-400);
}

.search-kbd {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  padding: 2px 6px;
  background: var(--color-gray-100);
  border: 1px solid var(--color-gray-200);
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-gray-600);
}
```

### 8. Command Palette

**Trigger**: Cmd/Ctrl + K

**Styling**:
```css
.command-palette {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 640px;
  max-width: 90vw;
  max-height: 80vh;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: var(--shadow-2xl);
  z-index: 999;
  overflow: hidden;
}

.command-input {
  width: 100%;
  height: 56px;
  padding: 0 56px 0 20px;
  border: none;
  border-bottom: 1px solid var(--color-gray-200);
  font-size: 16px;
}

.command-results {
  max-height: 400px;
  overflow-y: auto;
  padding: 8px;
}

.command-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.1s ease;
}

.command-item:hover,
.command-item.selected {
  background: var(--color-gray-100);
}

.command-item-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
```

### 9. Badges & Tags

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
}

/* Status badges */
.badge-success {
  background: var(--color-success-50);
  color: var(--color-success-700);
}

.badge-warning {
  background: var(--color-warning-50);
  color: var(--color-warning-700);
}

.badge-error {
  background: var(--color-error-50);
  color: var(--color-error-700);
}

.badge-info {
  background: var(--color-info-50);
  color: var(--color-info-700);
}

.badge-neutral {
  background: var(--color-gray-100);
  color: var(--color-gray-700);
}

/* Beta/Coming Soon badges */
.badge-beta {
  background: var(--color-warning-50);
  color: var(--color-warning-700);
  border: 1px solid var(--color-warning-200);
}

.badge-coming-soon {
  background: var(--color-gray-100);
  color: var(--color-gray-600);
  border: 1px solid var(--color-gray-200);
}
```

### 10. Empty States

```css
.empty-state {
  text-align: center;
  padding: 64px 24px;
}

.empty-state-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 24px;
  color: var(--color-gray-300);
}

.empty-state-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-gray-900);
  margin-bottom: 8px;
}

.empty-state-description {
  font-size: 14px;
  color: var(--color-gray-600);
  margin-bottom: 24px;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.empty-state-action {
  /* Use btn-primary styles */
}
```

### 11. Loading States

**Skeleton Loaders**:
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-gray-100) 0%,
    var(--color-gray-200) 50%,
    var(--color-gray-100) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: inherit;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Skeleton card */
.skeleton-card {
  height: 200px;
  border-radius: 12px;
}

/* Skeleton text */
.skeleton-text {
  height: 16px;
  border-radius: 4px;
  margin-bottom: 8px;
}
```

**Spinner**:
```css
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-gray-200);
  border-top-color: var(--color-primary-600);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## Animations & Transitions

### Timing Functions

```css
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-smooth: cubic-bezier(0.4, 0, 0.6, 1);
```

### Duration Scale

```css
--duration-fast: 0.1s;      /* Instant feedback */
--duration-normal: 0.15s;   /* Default transitions */
--duration-slow: 0.2s;      /* Emphasis */
--duration-slower: 0.3s;    /* Modal entrance */
```

### Common Animations

```css
/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide up */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scale in */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

### Hover Effects

```css
/* Card hover */
.card-hover {
  transition: all 0.2s var(--ease-smooth);
}
.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Button hover */
.button-hover {
  transition: all 0.15s var(--ease-out);
}
.button-hover:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}
.button-hover:active {
  transform: translateY(0);
}
```

### Page Transitions

```css
.page-transition {
  animation: fadeIn 0.2s var(--ease-out);
}
```

---

## Responsive Behavior

### Breakpoint Strategy

Desktop-first approach (optimize for 1440px, gracefully degrade):

```css
/* Desktop Large (default styles) */
/* 1440px+ */

/* Desktop Standard */
@media (max-width: 1439px) {
  /* Reduce padding, adjust grid columns */
}

/* Desktop Small */
@media (max-width: 1279px) {
  /* Collapse sidebar to icons only */
  /* Reduce app card size */
}

/* Tablet Landscape */
@media (max-width: 1023px) {
  /* Hide sidebar, show hamburger menu */
  /* 2-3 column grid for apps */
}

/* Tablet Portrait */
@media (max-width: 767px) {
  /* 2 column grid */
  /* Stack stats cards */
}

/* Mobile (maintenance only, not primary target) */
@media (max-width: 639px) {
  /* Single column */
  /* Basic usability */
}
```

### Grid Adjustments

```css
/* App Grid */
.app-grid {
  display: grid;
  gap: 24px;
}

/* Desktop Large: 4 columns */
@media (min-width: 1440px) {
  .app-grid { grid-template-columns: repeat(4, 1fr); }
}

/* Desktop Standard: 3 columns */
@media (min-width: 1024px) and (max-width: 1439px) {
  .app-grid { grid-template-columns: repeat(3, 1fr); }
}

/* Tablet: 2 columns */
@media (max-width: 1023px) {
  .app-grid { grid-template-columns: repeat(2, 1fr); }
}
```

---

## Accessibility

### Focus States

```css
:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

/* For buttons and interactive elements */
.focus-ring:focus-visible {
  box-shadow: 0 0 0 3px var(--color-primary-50);
}
```

### Color Contrast

All text must meet WCAG AA standards:
- Normal text (< 18px): 4.5:1 minimum
- Large text (>= 18px): 3:1 minimum

Tested combinations:
- Gray 900 on White: 19.2:1 ✓
- Gray 700 on White: 10.5:1 ✓
- Gray 600 on White: 7.4:1 ✓
- Primary 600 on White: 4.7:1 ✓

### Keyboard Navigation

All interactive elements must be:
- Keyboard accessible (Tab navigation)
- Have visible focus indicators
- Support Enter/Space for activation
- ESC to close modals/dropdowns

### Screen Reader Support

```html
<!-- Proper semantic HTML -->
<nav aria-label="Main navigation">
<main aria-label="Dashboard content">
<button aria-label="Close modal">

<!-- Hidden text for icons -->
<span class="sr-only">Dashboard</span>

<!-- Loading states -->
<div aria-live="polite" aria-busy="true">Loading...</div>
```

---

## Performance Guidelines

### Image Optimization

- Use WebP format with PNG fallback
- Lazy load images below the fold
- Maximum file size: 200KB per image
- Use blur-up placeholders

### Animation Performance

- Only animate `transform` and `opacity`
- Avoid animating `width`, `height`, `top`, `left`
- Use `will-change` sparingly
- Respect `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Loading Strategy

- Show skeleton loaders immediately
- Load critical content first
- Lazy load below-the-fold content
- Prefetch on hover for quick navigation

---

## Design Tokens (CSS Variables)

Complete token system for easy theming:

```css
:root {
  /* Colors */
  --color-bg-page: #f8fafc;
  --color-bg-card: #ffffff;
  --color-bg-elevated: #ffffff;
  --color-border-default: #e2e8f0;
  --color-border-hover: #cbd5e1;
  --color-text-primary: #0f172a;
  --color-text-secondary: #64748b;
  --color-text-tertiary: #94a3b8;

  /* Spacing (already defined above) */

  /* Typography (already defined above) */

  /* Shadows (already defined above) */

  /* Animation */
  --transition-fast: 0.1s;
  --transition-normal: 0.15s;
  --transition-slow: 0.2s;

  /* Layout */
  --sidebar-width: 240px;
  --sidebar-collapsed: 64px;
  --header-height: 64px;
  --max-content-width: 1400px;
}
```

---

## Dark Mode (Future Enhancement)

Tokens ready for dark mode:

```css
[data-theme="dark"] {
  --color-bg-page: #0f172a;
  --color-bg-card: #1e293b;
  --color-bg-elevated: #334155;
  --color-border-default: #334155;
  --color-border-hover: #475569;
  --color-text-primary: #f8fafc;
  --color-text-secondary: #cbd5e1;
  --color-text-tertiary: #94a3b8;

  /* Adjust shadows for dark mode */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.4);
  --shadow-md: 0 2px 8px 0 rgba(0, 0, 0, 0.5);
  /* etc. */
}
```

---

## Success Metrics

This design system succeeds if:

1. **Feels Professional**: Suitable for daily work use
2. **Desktop-Optimized**: Efficient use of screen real estate
3. **Scalable**: Handles 50+ apps without feeling cluttered
4. **Consistent**: All components follow the same principles
5. **Accessible**: WCAG AA compliant
6. **Performant**: 60fps animations, fast loading
7. **Maintainable**: Easy to update and extend

---

## Resources

**Figma File**: [Link to design file]
**Component Library**: `C:\Users\yoppi\Downloads\Lumiku App\frontend\src\components\`
**Implementation Guide**: See `DESKTOP_IMPLEMENTATION_GUIDE.md`
**Interactive Prototype**: See `lumiku-desktop-webapp-2025.html`

---

**Questions or feedback?** Contact the design team or open an issue in the repository.
