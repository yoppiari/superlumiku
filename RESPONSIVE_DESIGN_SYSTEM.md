# Lumiku Responsive Design System

A comprehensive design system for building hybrid responsive interfaces that work excellently on both desktop and smartphone.

## Design Philosophy

**Hybrid Responsive Approach**: Not mobile-first, not desktop-first, but **content-first** with platform-specific optimizations.

- Desktop (1024px+): Professional SaaS interface with sidebar navigation
- Tablet (768px-1023px): Responsive grids with touch-friendly targets
- Mobile (< 768px): Compact, thumb-friendly interface

## Color System

### Base Colors

```css
--color-white: #ffffff;
--color-background: #F8F9FA;
--color-surface: #FFFFFF;
--color-sidebar: #0F172A;
```

### Text Colors

```css
--color-text-primary: #1E293B;    /* Headlines, body text */
--color-text-secondary: #64748B;  /* Descriptions, labels */
--color-text-tertiary: #94A3B8;   /* Placeholders, disabled text */
```

### Brand Accent (Blue)

```css
--color-accent-primary: #3B82F6;  /* Primary actions, links */
--color-accent-hover: #2563EB;    /* Hover states */
--color-accent-light: #DBEAFE;    /* Backgrounds, highlights */
```

### Semantic Colors

```css
--color-success: #10B981;  /* Success states, positive actions */
--color-warning: #F59E0B;  /* Warnings, beta badges */
--color-error: #EF4444;    /* Errors, destructive actions */
```

### Category Colors

Used for app icons and category identification:

```css
--color-video: #8B5CF6;   /* Purple - Video apps */
--color-image: #EC4899;   /* Pink - Image apps */
--color-audio: #10B981;   /* Green - Audio apps */
--color-text: #F59E0B;    /* Orange - Text apps */
--color-ai: #3B82F6;      /* Blue - AI apps */
```

### Border Colors

```css
--color-border-light: #E2E8F0;   /* Default borders */
--color-border-medium: #CBD5E1;  /* Hover, active states */
```

## Typography

### Font Family

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
```

### Desktop Typography Scale

```css
/* Headings */
--heading-1: 32px / 700;      /* Page titles */
--heading-2: 24px / 600;      /* Section titles */
--heading-3: 20px / 600;      /* Subsection titles */

/* Body */
--body-large: 16px / 500;     /* Emphasis text */
--body: 16px / 400;           /* Body text */
--body-small: 14px / 500;     /* Labels, buttons */

/* Utility */
--caption: 14px / 400;        /* Captions, descriptions */
--small: 13px / 500;          /* Metadata, timestamps */
--tiny: 12px / 500;           /* Helper text */
--micro: 11px / 600;          /* Keyboard shortcuts */
```

### Mobile Typography Scale

Optimized for smaller screens:

```css
/* Headings */
--heading-1-mobile: 24px / 700;
--heading-2-mobile: 20px / 600;
--heading-3-mobile: 18px / 600;

/* Body */
--body-mobile: 15px / 400;
--body-small-mobile: 13px / 500;

/* Utility */
--caption-mobile: 13px / 400;
--small-mobile: 12px / 500;
```

## Spacing System

### Desktop Spacing

```css
--space-desktop-container: 32px;  /* Page padding */
--space-desktop-card: 24px;       /* Card padding */
--space-desktop-gap: 24px;        /* Grid gaps */
```

### Mobile Spacing

```css
--space-mobile-container: 16px;   /* Page padding */
--space-mobile-card: 16px;        /* Card padding */
--space-mobile-gap: 16px;         /* Grid gaps */
```

### Universal Spacing Scale

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

## Layout System

### Breakpoints

```css
/* Mobile */
@media (max-width: 374px) { /* Small mobile */ }
@media (max-width: 767px) { /* Mobile */ }

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) { /* Tablet */ }

/* Desktop */
@media (min-width: 1024px) { /* Desktop */ }
@media (min-width: 1280px) { /* Large desktop */ }
@media (min-width: 1440px) { /* Extra large desktop */ }
```

### Layout Constants

```css
--sidebar-width: 240px;
--header-height-desktop: 64px;
--header-height-mobile: 56px;
--max-content-width: 1400px;
```

### Grid Systems

#### Desktop App Grid

```css
.app-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

@media (max-width: 1279px) {
  grid-template-columns: repeat(3, 1fr);
}
```

#### Mobile App Grid

```css
@media (max-width: 767px) {
  .app-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}
```

#### Stats Grid

```css
/* Desktop: 4 columns */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

/* Tablet: 2x2 grid */
@media (max-width: 1023px) {
  grid-template-columns: repeat(2, 1fr);
}

/* Mobile: 2 columns */
@media (max-width: 767px) {
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
```

## Shadows

```css
--shadow-sm: 0 1px 2px 0 rgba(15, 23, 42, 0.05);
--shadow-md: 0 2px 8px 0 rgba(15, 23, 42, 0.08);
--shadow-lg: 0 4px 16px 0 rgba(15, 23, 42, 0.10);
--shadow-xl: 0 8px 24px 0 rgba(15, 23, 42, 0.12);
--shadow-2xl: 0 16px 40px 0 rgba(15, 23, 42, 0.16);
```

### Shadow Usage

- `shadow-sm`: Hover states on cards
- `shadow-md`: Active/selected cards
- `shadow-lg`: Elevated cards, dropdowns
- `shadow-xl`: Modals, command palette
- `shadow-2xl`: Full-screen overlays

## Border Radius

```css
--radius-sm: 6px;    /* Small elements, badges */
--radius-md: 8px;    /* Buttons, inputs, filters */
--radius-lg: 12px;   /* Cards, app icons */
--radius-xl: 16px;   /* Large cards, modals */
--radius-full: 9999px; /* Pills, circular avatars */
```

## Transitions

```css
--transition-fast: 0.15s ease;    /* Micro-interactions */
--transition-normal: 0.2s ease;   /* Standard interactions */
--transition-slow: 0.3s ease;     /* Page transitions */
```

### Transition Usage

```css
/* Hover effects */
transition: all var(--transition-fast);

/* Navigation state changes */
transition: background var(--transition-normal);

/* Transform animations */
transition: transform var(--transition-slow);
```

## Component Specifications

### 1. Sidebar (Desktop Only)

**Desktop (1024px+)**
```css
width: 240px;
height: 100vh;
background: #0F172A;
position: fixed;
```

**Mobile (< 768px)**
```css
transform: translateX(-100%); /* Hidden by default */
transform: translateX(0);      /* When open */
```

### 2. Navigation Items

**Touch Target Sizes**
```css
/* Desktop */
padding: 10px 12px;
min-height: 40px;

/* Mobile */
padding: 12px;
min-height: 44px; /* iOS minimum touch target */
```

### 3. App Cards

**Desktop (240px width)**
```css
.app-card {
  padding: 24px;
  border-radius: 12px;
  min-height: auto;
}

.app-icon {
  width: 64px;
  height: 64px;
  font-size: 32px;
}

.app-name {
  font-size: 16px;
}

.app-description {
  display: block;
  font-size: 14px;
}
```

**Mobile (~160px width)**
```css
.app-card {
  padding: 16px;
  min-height: auto;
}

.app-icon {
  width: 48px;
  height: 48px;
  font-size: 24px;
}

.app-name {
  font-size: 14px;
}

.app-description {
  display: none; /* Hidden for compact layout */
}
```

### 4. Stats Cards

**Desktop**
```css
.stat-card {
  padding: 24px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  font-size: 24px;
}

.stat-value {
  font-size: 32px;
}

.stat-label {
  font-size: 14px;
}
```

**Mobile**
```css
.stat-card {
  padding: 16px;
}

.stat-icon {
  width: 40px;
  height: 40px;
  font-size: 20px;
}

.stat-value {
  font-size: 24px;
}

.stat-label {
  font-size: 13px;
}
```

### 5. Search & Command Palette

**Desktop**
```css
.search-input {
  width: 100%;
  max-width: 600px;
  height: 40px;
}

.command-palette {
  width: 640px;
  max-height: 80vh;
}
```

**Mobile**
```css
.search-input {
  width: 100%;
  height: 40px;
}

.command-palette {
  width: calc(100vw - 40px);
  max-height: calc(100vh - 40px);
  margin: 20px;
}
```

### 6. Header

**Desktop**
```css
.header {
  height: 64px;
  padding: 0 32px;
}
```

**Mobile**
```css
.header {
  height: 56px;
  padding: 0 16px;
}
```

## Responsive Patterns

### 1. Navigation Pattern

**Desktop**: Persistent sidebar
```
┌────────┬────────────┐
│ Side   │  Content   │
│ bar    │            │
│        │            │
└────────┴────────────┘
```

**Mobile**: Hamburger menu with slide-in overlay
```
┌──────────────────┐
│ [☰] Header       │
├──────────────────┤
│                  │
│    Content       │
│   (Full width)   │
│                  │
└──────────────────┘
```

### 2. Content Grid Pattern

**Desktop**: 4 columns
```
┌───┬───┬───┬───┐
│ 1 │ 2 │ 3 │ 4 │
└───┴───┴───┴───┘
```

**Tablet**: 3 columns
```
┌───┬───┬───┐
│ 1 │ 2 │ 3 │
└───┴───┴───┘
```

**Mobile**: 2 columns
```
┌───┬───┐
│ 1 │ 2 │
└───┴───┘
```

### 3. Stats Cards Pattern

**Desktop**: Row of 4
```
┌───┬───┬───┬───┐
│ 1 │ 2 │ 3 │ 4 │
└───┴───┴───┴───┘
```

**Tablet/Mobile**: 2x2 grid
```
┌───┬───┐
│ 1 │ 2 │
├───┼───┤
│ 3 │ 4 │
└───┴───┘
```

## Touch Target Guidelines

### Minimum Touch Targets

Following Apple HIG and Material Design:

```css
/* Minimum touch target */
min-height: 44px;
min-width: 44px;

/* Recommended spacing between targets */
gap: 8px;
```

### Touch-Friendly Zones

**Thumb Zone (Mobile)**
- Primary actions: Bottom 1/3 of screen
- Secondary actions: Middle 1/3
- Tertiary actions: Top 1/3

**One-Handed Use**
- Important actions: Within 75% of screen width from either edge
- Avoid placing critical actions in center top

## Accessibility

### Color Contrast

All text meets WCAG 2.1 AA standards:

```css
/* Primary text on white */
--color-text-primary: #1E293B; /* Ratio: 13.5:1 */

/* Secondary text on white */
--color-text-secondary: #64748B; /* Ratio: 5.4:1 */

/* White text on primary */
color: white;
background: #3B82F6; /* Ratio: 4.6:1 */
```

### Focus States

```css
element:focus {
  outline: none;
  box-shadow: 0 0 0 3px var(--color-accent-light);
  border-color: var(--color-accent-primary);
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Performance Guidelines

### CSS Optimization

1. Use `transform` and `opacity` for animations (GPU-accelerated)
2. Avoid animating `width`, `height`, `margin`, `padding`
3. Use `will-change` sparingly for critical animations

```css
/* Good */
.app-card:hover {
  transform: translateY(-4px);
}

/* Avoid */
.app-card:hover {
  margin-top: -4px;
}
```

### Image Optimization

```html
<!-- Responsive images -->
<img
  src="image-400.jpg"
  srcset="image-400.jpg 400w, image-800.jpg 800w, image-1200.jpg 1200w"
  sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 25vw"
  alt="Description"
/>
```

## Z-Index Scale

```css
--z-base: 1;
--z-dropdown: 10;
--z-sticky: 20;
--z-fixed: 30;
--z-overlay: 40;
--z-sidebar: 50;
--z-modal: 90;
--z-command-palette: 999;
```

## Icon System

### Icon Sizes

```css
--icon-xs: 12px;   /* Inline with text */
--icon-sm: 16px;   /* Buttons, labels */
--icon-md: 20px;   /* Navigation */
--icon-lg: 24px;   /* Stat cards */
--icon-xl: 32px;   /* App cards (desktop) */
--icon-2xl: 48px;  /* App cards (mobile) */
```

### Icon Guidelines

- Always include `stroke-width="2"` for consistency
- Use `currentColor` for stroke/fill to inherit text color
- Ensure icons have proper aria labels or are hidden from screen readers

## Component States

### Interactive States

```css
/* Default */
element {
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
}

/* Hover */
element:hover {
  background: var(--color-background);
  border-color: var(--color-border-medium);
  transform: translateY(-2px);
}

/* Active/Pressed */
element:active {
  transform: translateY(0);
}

/* Focus */
element:focus {
  border-color: var(--color-accent-primary);
  box-shadow: 0 0 0 3px var(--color-accent-light);
}

/* Disabled */
element:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
```

## Badge System

### Badge Variants

```css
/* Beta Badge */
.app-badge.beta {
  background: rgba(245, 158, 11, 0.1);
  color: #F59E0B;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

/* New Badge */
.app-badge.new {
  background: rgba(16, 185, 129, 0.1);
  color: #10B981;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

/* Soon Badge */
.app-badge.soon {
  background: rgba(148, 163, 184, 0.1);
  color: #64748B;
  border: 1px solid rgba(148, 163, 184, 0.2);
}
```

## Animation System

### Keyframe Animations

```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Scale In */
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

/* Slide Up */
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
```

### Usage

```css
/* Modal entrance */
.modal {
  animation: scaleIn 0.2s ease;
}

/* Overlay */
.overlay {
  animation: fadeIn 0.15s ease;
}
```

## Summary

This design system provides a comprehensive foundation for building responsive interfaces that:

1. Work excellently on both desktop and mobile
2. Maintain visual consistency across breakpoints
3. Provide platform-appropriate interactions
4. Meet accessibility standards
5. Perform smoothly on all devices

Use this system as a reference when implementing new features or components in the Lumiku platform.
