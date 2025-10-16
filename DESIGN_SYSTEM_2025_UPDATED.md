# Lumiku Design System 2025

## Overview

This design system defines the visual language, components, and patterns for the Lumiku AI creative platform. Based on 2025 design trends, it prioritizes mobile-first design, system-adaptive theming, and sophisticated simplicity.

**Design Philosophy**: Premium minimalism with personality—clean interfaces with purposeful details that signal quality without over-design.

---

## 1. Color System

### 1.1 Core Palette

#### Light Mode
```css
--color-background: #FAFAFA;      /* Main background */
--color-surface: #FFFFFF;         /* Cards, panels */
--color-surface-elevated: #FFFFFF; /* Elevated elements */

--color-text-primary: #0A0A0A;    /* Headings, primary text */
--color-text-secondary: #525252;  /* Body text, descriptions */
--color-text-tertiary: #A3A3A3;   /* Captions, metadata */

--color-border: rgba(0,0,0,0.08); /* Subtle borders */
--color-border-strong: rgba(0,0,0,0.12); /* Hover states */

--color-overlay: rgba(0,0,0,0.4); /* Modal backdrops */
```

#### Dark Mode
```css
--color-background: #0A0A0A;      /* Main background */
--color-surface: #171717;         /* Cards, panels */
--color-surface-elevated: #262626; /* Elevated elements */

--color-text-primary: #FAFAFA;    /* Headings, primary text */
--color-text-secondary: #A3A3A3;  /* Body text, descriptions */
--color-text-tertiary: #525252;   /* Captions, metadata */

--color-border: rgba(255,255,255,0.1); /* Subtle borders */
--color-border-strong: rgba(255,255,255,0.15); /* Hover states */

--color-overlay: rgba(0,0,0,0.7); /* Modal backdrops */
```

### 1.2 Brand Colors

#### Primary (Indigo)
```css
--color-primary-50: #EEF2FF;
--color-primary-100: #E0E7FF;
--color-primary-200: #C7D2FE;
--color-primary-300: #A5B4FC;
--color-primary-400: #818CF8;
--color-primary-500: #6366F1;  /* Main brand color */
--color-primary-600: #4F46E5;
--color-primary-700: #4338CA;
--color-primary-800: #3730A3;
--color-primary-900: #312E81;
```

**Usage**:
- Primary CTA buttons
- Active navigation states
- Links and interactive elements
- Progress indicators
- Focus rings

### 1.3 Semantic Colors

#### Success (Green)
```css
--color-success-light: #D1FAE5;
--color-success: #10B981;
--color-success-dark: #059669;
```

#### Error (Red)
```css
--color-error-light: #FEE2E2;
--color-error: #EF4444;
--color-error-dark: #DC2626;
```

#### Warning (Amber)
```css
--color-warning-light: #FEF3C7;
--color-warning: #F59E0B;
--color-warning-dark: #D97706;
```

#### Info (Blue)
```css
--color-info-light: #DBEAFE;
--color-info: #3B82F6;
--color-info-dark: #2563EB;
```

### 1.4 App Category Colors

Used for app icons and category indicators:

```css
--color-category-image: #8B5CF6;    /* Purple */
--color-category-video: #EC4899;    /* Pink */
--color-category-avatar: #3B82F6;   /* Blue */
--color-category-text: #10B981;     /* Green */
--color-category-audio: #F59E0B;    /* Amber */
--color-category-utility: #6366F1;  /* Indigo */
```

---

## 2. Typography

### 2.1 Font Stack

**Primary**: Inter (variable)
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
```

**Fallback** (if Inter unavailable):
- iOS: SF Pro
- Android: Roboto
- Windows: Segoe UI

### 2.2 Type Scale

#### Mobile (< 768px)
```css
/* Display */
--font-size-display: 32px;
--font-weight-display: 700;
--line-height-display: 1.2;
--letter-spacing-display: -0.02em;

/* Heading 1 */
--font-size-h1: 24px;
--font-weight-h1: 600;
--line-height-h1: 1.3;
--letter-spacing-h1: -0.01em;

/* Heading 2 */
--font-size-h2: 20px;
--font-weight-h2: 600;
--line-height-h2: 1.3;
--letter-spacing-h2: -0.01em;

/* Heading 3 */
--font-size-h3: 18px;
--font-weight-h3: 600;
--line-height-h3: 1.4;
--letter-spacing-h3: 0;

/* Body Large */
--font-size-body-lg: 16px;
--font-weight-body-lg: 400;
--line-height-body-lg: 1.6;
--letter-spacing-body-lg: 0;

/* Body */
--font-size-body: 15px;
--font-weight-body: 400;
--line-height-body: 1.6;
--letter-spacing-body: 0;

/* Body Small */
--font-size-body-sm: 14px;
--font-weight-body-sm: 400;
--line-height-body-sm: 1.5;
--letter-spacing-body-sm: 0;

/* Caption */
--font-size-caption: 12px;
--font-weight-caption: 500;
--line-height-caption: 1.4;
--letter-spacing-caption: 0.01em;
```

#### Desktop (≥ 768px)
```css
--font-size-display: 40px;
--font-size-h1: 28px;
--font-size-h2: 22px;
--font-size-h3: 18px;
--font-size-body-lg: 17px;
--font-size-body: 15px;
--font-size-body-sm: 14px;
--font-size-caption: 13px;
```

### 2.3 Font Weights

```css
--font-weight-regular: 400;
--font-weight-medium: 500;   /* UI elements */
--font-weight-semibold: 600; /* Headings */
--font-weight-bold: 700;     /* Display, emphasis */
```

**Usage Guidelines**:
- Regular (400): Body text, descriptions
- Medium (500): UI labels, buttons, captions
- Semibold (600): Headings, cards titles
- Bold (700): Display text, emphasis

---

## 3. Spacing System

### 3.1 Base Unit

Base: 4px (0.25rem)

### 3.2 Scale

```css
--space-0: 0px;
--space-1: 4px;    /* 0.25rem */
--space-2: 8px;    /* 0.5rem */
--space-3: 12px;   /* 0.75rem */
--space-4: 16px;   /* 1rem */
--space-5: 20px;   /* 1.25rem */
--space-6: 24px;   /* 1.5rem */
--space-8: 32px;   /* 2rem */
--space-10: 40px;  /* 2.5rem */
--space-12: 48px;  /* 3rem */
--space-16: 64px;  /* 4rem */
--space-20: 80px;  /* 5rem */
--space-24: 96px;  /* 6rem */
```

### 3.3 Usage

**Component Padding**:
- Button: 12px 20px (vertical, horizontal)
- Card: 16px (mobile), 20px (desktop)
- Input: 12px 16px
- Modal: 20px (mobile), 24px (desktop)

**Component Spacing** (gap between elements):
- Tight: 8px (related items)
- Normal: 16px (default)
- Loose: 24px (sections)
- Section: 48px (major sections)

**Layout Margins**:
- Mobile: 16px (sides), 20px (top/bottom)
- Desktop: 24px (sides), 32px (top/bottom)

---

## 4. Border Radius

```css
--radius-sm: 6px;   /* Buttons, chips */
--radius-md: 8px;   /* Inputs, small cards */
--radius-lg: 12px;  /* Cards, modals */
--radius-xl: 16px;  /* Large cards, panels */
--radius-2xl: 20px; /* Feature sections */
--radius-full: 9999px; /* Circular elements */
```

**Usage**:
- Buttons: 6-8px
- Cards: 12px
- Modals: 16px
- Input fields: 8px
- Avatar/Icons: 8-12px (not full circle unless profile images)

---

## 5. Shadows

### 5.1 Elevation System

```css
/* Subtle (default cards) */
--shadow-sm: 0 1px 2px rgba(0,0,0,0.04),
             0 1px 3px rgba(0,0,0,0.06);

/* Elevated (hover state, dropdowns) */
--shadow-md: 0 2px 4px rgba(0,0,0,0.06),
             0 4px 8px rgba(0,0,0,0.08);

/* Floating (modals, popovers) */
--shadow-lg: 0 4px 8px rgba(0,0,0,0.08),
             0 8px 16px rgba(0,0,0,0.1);

/* Prominent (sheets, large modals) */
--shadow-xl: 0 8px 16px rgba(0,0,0,0.1),
             0 16px 32px rgba(0,0,0,0.12);
```

### 5.2 Dark Mode Shadows

In dark mode, use lighter shadows with reduced opacity:
```css
--shadow-sm-dark: 0 1px 2px rgba(0,0,0,0.2),
                  0 1px 3px rgba(0,0,0,0.3);

--shadow-md-dark: 0 2px 4px rgba(0,0,0,0.3),
                  0 4px 8px rgba(0,0,0,0.4);

--shadow-lg-dark: 0 4px 8px rgba(0,0,0,0.4),
                  0 8px 16px rgba(0,0,0,0.5);
```

---

## 6. Animation & Transitions

### 6.1 Duration

```css
--duration-fast: 150ms;     /* Micro-interactions */
--duration-normal: 200ms;   /* Default transitions */
--duration-slow: 300ms;     /* Page transitions */
--duration-slower: 500ms;   /* Complex animations */
```

### 6.2 Easing

```css
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1); /* Default */
--ease-in: cubic-bezier(0.4, 0, 1, 1);         /* Enter */
--ease-out: cubic-bezier(0, 0, 0.2, 1);        /* Exit */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);   /* Both */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55); /* Playful */
```

### 6.3 Common Transitions

```css
/* Default (all props) */
transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);

/* Specific properties (better performance) */
transition: opacity 200ms ease, transform 200ms ease;

/* Hover lift effect */
transition: box-shadow 200ms ease, transform 200ms ease;
```

### 6.4 Motion Principles

1. **Respect User Preferences**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

2. **Purposeful Motion**: Every animation should have a clear purpose (feedback, spatial relationship, attention)

3. **Performance**: Use `transform` and `opacity` for animations (GPU-accelerated)

---

## 7. Components

### 7.1 Buttons

#### Primary Button
```css
.button-primary {
  background: var(--color-primary-500);
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  border: none;
  box-shadow: 0 1px 2px rgba(99,102,241,0.3);
  transition: all 200ms ease;
}

.button-primary:hover {
  background: var(--color-primary-600);
  box-shadow: 0 4px 8px rgba(99,102,241,0.4);
  transform: translateY(-1px);
}

.button-primary:active {
  transform: scale(0.98);
}
```

#### Secondary Button
```css
.button-secondary {
  background: var(--color-surface);
  color: var(--color-text-primary);
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  border: 1px solid var(--color-border);
  transition: all 200ms ease;
}

.button-secondary:hover {
  border-color: var(--color-border-strong);
  background: var(--color-background);
  box-shadow: var(--shadow-sm);
}
```

#### Ghost Button
```css
.button-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  border: none;
  transition: all 200ms ease;
}

.button-ghost:hover {
  background: var(--color-background);
  color: var(--color-text-primary);
}
```

### 7.2 Cards

#### Standard Card
```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 20px;
  box-shadow: var(--shadow-sm);
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

#### App Card (Grid Item)
```css
.app-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  transition: all 200ms ease;
}

.app-card:hover {
  border-color: var(--color-primary-500);
  box-shadow: 0 4px 12px rgba(99,102,241,0.15);
  transform: translateY(-2px);
}

.app-card-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.app-card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.app-card-description {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.5;
}
```

### 7.3 Input Fields

```css
.input {
  width: 100%;
  padding: 12px 16px;
  font-size: 15px;
  color: var(--color-text-primary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  transition: all 200ms ease;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
}

.input::placeholder {
  color: var(--color-text-tertiary);
}
```

### 7.4 Search Bar

```css
.search-bar {
  position: relative;
  width: 100%;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 44px;
  font-size: 15px;
  color: var(--color-text-primary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  transition: all 200ms ease;
}

.search-input:focus {
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-tertiary);
}
```

### 7.5 Bottom Navigation

```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(20px);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;
  padding-bottom: env(safe-area-inset-bottom);
}

.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: color 200ms ease;
}

.bottom-nav-item.active {
  color: var(--color-primary-500);
}

.bottom-nav-icon {
  width: 24px;
  height: 24px;
}

.bottom-nav-label {
  font-size: 11px;
  font-weight: 500;
}
```

### 7.6 Badge

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 6px;
  letter-spacing: 0.01em;
}

.badge-primary {
  background: var(--color-primary-100);
  color: var(--color-primary-700);
}

.badge-success {
  background: var(--color-success-light);
  color: var(--color-success-dark);
}

.badge-beta {
  background: #FEF3C7;
  color: #D97706;
}

.badge-new {
  background: #DBEAFE;
  color: #2563EB;
}
```

### 7.7 Loading States

#### Skeleton Screen
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface) 0%,
    var(--color-background) 50%,
    var(--color-surface) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  border-radius: 8px;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-text {
  height: 16px;
  margin-bottom: 8px;
}

.skeleton-card {
  height: 200px;
}
```

#### Progress Bar
```css
.progress-bar {
  width: 100%;
  height: 4px;
  background: var(--color-background);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary-500);
  border-radius: 2px;
  transition: width 300ms ease;
}
```

### 7.8 Empty State

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.empty-state-icon {
  width: 64px;
  height: 64px;
  color: var(--color-text-tertiary);
  margin-bottom: 16px;
}

.empty-state-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.empty-state-description {
  font-size: 15px;
  color: var(--color-text-secondary);
  margin-bottom: 20px;
}
```

---

## 8. Layout Grid

### 8.1 Mobile (< 768px)

```css
.grid-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 16px;
}
```

### 8.2 Tablet (768px - 1024px)

```css
.grid-container {
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding: 24px;
}
```

### 8.3 Desktop (≥ 1024px)

```css
.grid-container {
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
}
```

### 8.4 Responsive Breakpoints

```css
--breakpoint-sm: 640px;   /* Mobile landscape */
--breakpoint-md: 768px;   /* Tablet portrait */
--breakpoint-lg: 1024px;  /* Tablet landscape / Small desktop */
--breakpoint-xl: 1280px;  /* Desktop */
--breakpoint-2xl: 1536px; /* Large desktop */
```

---

## 9. Icons

### 9.1 Icon System

**Library**: Lucide React (or Heroicons)

**Sizes**:
```css
--icon-xs: 16px;  /* Inline text icons */
--icon-sm: 20px;  /* UI elements */
--icon-md: 24px;  /* Standard buttons, nav */
--icon-lg: 32px;  /* Large buttons */
--icon-xl: 48px;  /* Featured elements */
--icon-2xl: 64px; /* Hero sections */
```

**Usage**:
- Navigation: 24px
- Buttons: 20px
- App cards: 28-32px
- Empty states: 48-64px

### 9.2 Icon Style

- Outline style (not filled, except active states)
- Consistent stroke width (2px)
- Rounded corners
- Centered alignment

---

## 10. Accessibility

### 10.1 Color Contrast

**WCAG AA Compliance**:
- Text: Minimum 4.5:1 contrast ratio
- Large text (18px+): Minimum 3:1 contrast ratio
- UI components: Minimum 3:1 contrast ratio

### 10.2 Focus States

```css
.interactive-element:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}
```

### 10.3 Touch Targets

**Minimum size**: 44x44px (iOS) / 48x48px (Android)

```css
.touch-target {
  min-width: 44px;
  min-height: 44px;
  padding: 12px;
}
```

### 10.4 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 11. Dark Mode Implementation

### 11.1 Auto-Detection

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-background: #0A0A0A;
    --color-surface: #171717;
    /* ... other dark mode colors */
  }
}
```

### 11.2 Manual Toggle (Optional)

```html
<html data-theme="light"> <!-- or "dark" -->
```

```css
[data-theme="dark"] {
  --color-background: #0A0A0A;
  --color-surface: #171717;
  /* ... */
}
```

### 11.3 Images & Icons

- Use SVG icons (automatically adapt to color scheme)
- For images, consider opacity adjustment in dark mode
- Provide dark variants for brand logos if needed

---

## 12. Mobile-First Responsive Strategy

### 12.1 Approach

1. Design for mobile (375px) first
2. Add complexity as screen size increases
3. Use progressive enhancement

### 12.2 Patterns

**Stack on Mobile, Grid on Desktop**:
```css
.layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (min-width: 768px) {
  .layout {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }
}
```

**Hide on Mobile, Show on Desktop**:
```css
.desktop-only {
  display: none;
}

@media (min-width: 768px) {
  .desktop-only {
    display: block;
  }
}
```

**Responsive Typography**:
```css
.heading {
  font-size: clamp(24px, 5vw, 40px);
}
```

---

## 13. Performance Guidelines

### 13.1 CSS Best Practices

- Use CSS custom properties for theming
- Minimize use of `box-shadow` (expensive)
- Prefer `transform` and `opacity` for animations
- Use `will-change` sparingly

### 13.2 Image Optimization

- Use WebP format with fallbacks
- Implement lazy loading
- Provide responsive images (srcset)
- Use blur-up technique for placeholders

### 13.3 Font Loading

```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-var.woff2') format('woff2');
  font-display: swap;
  font-weight: 100 900;
}
```

---

## 14. Component States

### 14.1 Interactive States

**Hover** (desktop only):
```css
.interactive:hover {
  /* Enhanced shadow, border, or background */
}
```

**Active** (touch feedback):
```css
.interactive:active {
  transform: scale(0.98);
}
```

**Focus** (keyboard navigation):
```css
.interactive:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}
```

**Disabled**:
```css
.interactive:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
```

### 14.2 Loading State

```css
.loading {
  position: relative;
  pointer-events: none;
  opacity: 0.6;
}

.loading::after {
  content: '';
  /* Spinner or skeleton */
}
```

---

## 15. Usage Examples

### 15.1 Dashboard Layout

```html
<div class="layout-container">
  <!-- Header -->
  <header class="header">
    <h1 class="heading-h1">Dashboard</h1>
    <button class="button-primary">New Project</button>
  </header>

  <!-- Search -->
  <div class="search-bar">
    <input type="text" class="search-input" placeholder="Search apps...">
  </div>

  <!-- Grid -->
  <div class="grid-container">
    <div class="app-card">
      <div class="app-card-icon">
        <!-- Icon -->
      </div>
      <h3 class="app-card-title">Avatar Creator</h3>
      <p class="app-card-description">Create AI avatars</p>
    </div>
    <!-- More cards... -->
  </div>
</div>
```

### 15.2 Bottom Navigation

```html
<nav class="bottom-nav">
  <a class="bottom-nav-item active">
    <svg class="bottom-nav-icon"><!-- Home icon --></svg>
    <span class="bottom-nav-label">Home</span>
  </a>
  <a class="bottom-nav-item">
    <svg class="bottom-nav-icon"><!-- Explore icon --></svg>
    <span class="bottom-nav-label">Explore</span>
  </a>
  <!-- More items... -->
</nav>
```

---

## 16. Design Tokens (CSS Variables)

Complete list of design tokens for implementation:

```css
:root {
  /* Colors - Light Mode */
  --color-background: #FAFAFA;
  --color-surface: #FFFFFF;
  --color-text-primary: #0A0A0A;
  --color-text-secondary: #525252;
  --color-text-tertiary: #A3A3A3;
  --color-border: rgba(0,0,0,0.08);
  --color-primary: #6366F1;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;

  /* Typography */
  --font-size-body: 15px;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;

  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06);

  /* Animation */
  --duration-normal: 200ms;
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## Conclusion

This design system provides a comprehensive foundation for building the Lumiku application with a modern, premium feel. It prioritizes:

- **Mobile-first design** with responsive scaling
- **System-adaptive theming** (light/dark mode)
- **Performance** through optimized CSS and animations
- **Accessibility** with proper contrast and focus states
- **Scalability** with flexible grid and component system

**Next Step**: Apply this design system to create the interactive HTML prototype.
