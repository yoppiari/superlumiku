# Lumiku Simple Dashboard - Design System

**Version:** 2.0
**Date:** October 2025
**Philosophy:** Pin-First, Mobile-Comfortable, Generous Spacing

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing System](#spacing-system)
5. [Components](#components)
6. [Layout Guidelines](#layout-guidelines)
7. [Interaction Patterns](#interaction-patterns)
8. [Accessibility](#accessibility)

---

## Design Philosophy

### Core Principles

#### 1. Pin-First Dashboard
- **Dashboard shows ONLY pinned apps** (3-6 max)
- All other apps live in a separate "All Apps" modal
- Think: iPhone home screen, not app store

#### 2. Mobile-Comfortable
- Generous padding: 20-24px (not 16px)
- Large touch targets: 48px minimum
- Spacious cards: 200px+ height
- Clear visual hierarchy

#### 3. Simplified Information
- Show only what matters
- Horizontal scroll for stats (mobile)
- 3-5 recent items (not 10)
- Less cognitive load

#### 4. Premium Feel
- Smooth animations (60fps)
- Generous whitespace
- Polished interactions
- Delightful micro-interactions

---

## Color System

### Base Colors

```css
/* Neutrals - Calming & Spacious */
--background: #FAFBFC;        /* Main background */
--surface: #FFFFFF;           /* Cards, modals */
--border: #E5E7EB;            /* Default borders */
--border-hover: #D1D5DB;      /* Hover state */

/* Text */
--text-primary: #111827;      /* Headings, important text */
--text-secondary: #6B7280;    /* Body text, labels */
--text-tertiary: #9CA3AF;     /* Subtle text, metadata */

/* Accent */
--accent: #3B82F6;            /* Primary actions */
--accent-hover: #2563EB;      /* Hover state */

/* Star/Pin System */
--star: #F59E0B;              /* Star icon, pinned state */
--star-bg: #FEF3C7;           /* Star background */
```

### App Theme Colors

```css
/* Blue - Avatar Creator, Looping Flow */
--blue: #3B82F6;
--blue-bg: #EFF6FF;

/* Green - Pose Generator */
--green: #10B981;
--green-bg: #ECFDF5;

/* Purple - Premium features */
--purple: #8B5CF6;
--purple-bg: #F5F3FF;

/* Orange - Carousel Mix */
--orange: #F97316;
--orange-bg: #FFF7ED;

/* Red - Video Mixer */
--red: #EF4444;
--red-bg: #FEF2F2;
```

### Color Usage Guidelines

| Element | Color | Usage |
|---------|-------|-------|
| Page background | `--background` | Always |
| Cards | `--surface` | Default state |
| Borders | `--border` | Default |
| Borders (hover) | `--border-hover` | Interactive elements |
| Headings | `--text-primary` | H1, H2, H3 |
| Body text | `--text-secondary` | Paragraphs, labels |
| Metadata | `--text-tertiary` | Timestamps, counts |
| Primary button | `--accent` | CTAs |
| Star icon | `--star` | Pinned indicator |

---

## Typography

### Font Stack

```css
--font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
             'Helvetica Neue', Arial, sans-serif;
```

### Type Scale

#### Mobile (< 768px)
```css
--text-xs: 14px;      /* Metadata, small labels */
--text-sm: 15px;      /* Secondary text */
--text-base: 16px;    /* Body text (DEFAULT) */
--text-lg: 18px;      /* Card titles */
--text-xl: 22px;      /* Section headings */
--text-2xl: 28px;     /* Page heading */
```

#### Desktop (≥ 768px)
```css
--text-xs: 14px;
--text-sm: 15px;
--text-base: 16px;
--text-lg: 18px;
--text-xl: 24px;      /* Larger section headings */
--text-2xl: 36px;     /* Larger page heading */
```

### Font Weights

```css
--weight-regular: 400;    /* Body text */
--weight-medium: 500;     /* Labels, subtle emphasis */
--weight-semibold: 600;   /* Buttons, card titles */
--weight-bold: 700;       /* Headings, important text */
```

### Line Heights

```css
--leading-tight: 1.2;     /* Headings */
--leading-normal: 1.5;    /* Body text */
--leading-relaxed: 1.6;   /* Long-form content */
```

### Typography Examples

```css
/* Page Heading */
.page-heading {
  font-size: var(--text-2xl);
  font-weight: var(--weight-bold);
  letter-spacing: -0.02em;
  line-height: var(--leading-tight);
  color: var(--text-primary);
}

/* Section Heading */
.section-heading {
  font-size: var(--text-xl);
  font-weight: var(--weight-bold);
  letter-spacing: -0.02em;
  color: var(--text-primary);
}

/* Card Title */
.card-title {
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
  color: var(--text-primary);
}

/* Body Text */
.body-text {
  font-size: var(--text-base);
  font-weight: var(--weight-regular);
  line-height: var(--leading-normal);
  color: var(--text-secondary);
}

/* Small Text */
.small-text {
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--text-secondary);
}

/* Metadata */
.metadata {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}
```

---

## Spacing System

### Spacing Scale

```css
/* Base Units */
--space-xs: 8px;
--space-sm: 12px;
--space-md: 16px;
--space-lg: 20px;
--space-xl: 24px;
--space-2xl: 32px;
--space-3xl: 40px;
--space-4xl: 56px;
```

### Layout Spacing

#### Mobile (< 768px)
```css
--container-padding: 20px;    /* Screen edges */
--card-padding: 24px;         /* Inside cards */
--card-gap: 20px;             /* Between cards */
--section-gap: 40px;          /* Between sections */
```

#### Desktop (≥ 768px)
```css
--container-padding: 40px;
--card-padding: 32px;
--card-gap: 24px;
--section-gap: 56px;
```

### Spacing Usage

| Context | Spacing | Usage |
|---------|---------|-------|
| Screen padding | 20px mobile, 40px desktop | Left/right container edges |
| Card padding | 24px mobile, 32px desktop | Inside card content |
| Card gap | 20px mobile, 24px desktop | Between grid items |
| Section gap | 40px mobile, 56px desktop | Between major sections |
| Element gap | 8-16px | Between related elements |

---

## Components

### 1. Header

#### Specifications
```css
.header {
  height: auto;
  padding: 20px (mobile) / 32px (desktop);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
}
```

#### Elements
- **Logo**: 22px (mobile), 36px (desktop), weight 700
- **Menu button**: 48px × 48px touch target
- **Credit badge**: Min height 48px, padding 12px 16px
- **User avatar**: 48px × 48px circle

---

### 2. Stat Cards

#### Quick Stats (Horizontal Scroll - Mobile)

**Featured Credit Card:**
```css
.stat-card.featured {
  min-width: 280px;
  padding: 24px;
  background: linear-gradient(135deg, var(--purple-bg), var(--blue-bg));
  border: 2px solid var(--purple);
  border-radius: 16px;
}
```

**Regular Stats:**
```css
.stat-card {
  min-width: 280px;
  padding: 24px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
}
```

**Elements:**
- Icon: 48px × 48px, colored background
- Value: 36px, weight 700
- Label: 15px, weight 500, secondary color
- Action button: Full width, 48px height

---

### 3. Pinned App Cards

#### Mobile (Full Width / 2-Column)
```css
.app-card {
  padding: 24px;
  min-height: 200px;
  border: 2px solid var(--border);
  border-radius: 16px;
  background: var(--surface);
}
```

#### Desktop (3-Column)
```css
.app-card {
  padding: 32px;
  min-height: 240px;
}
```

#### Elements
- **Star badge**: 32px circle, top-right absolute
- **Icon**: 72px (mobile), 80px (desktop), gradient background
- **Name**: 18px, weight 700
- **Description**: 15px, secondary color
- **Metadata**: 14px, tertiary color, badges

#### States
```css
/* Default */
border: 2px solid var(--border);

/* Hover */
border-color: var(--text-primary);
box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
transform: translateY(-4px);

/* Top accent line (hover) */
::before {
  height: 4px;
  background: linear-gradient(90deg, var(--blue), var(--purple));
  opacity: 1;
}
```

---

### 4. View All Apps Button

```css
.view-all-apps {
  padding: 24px;
  min-height: 200px (mobile) / 240px (desktop);
  background: linear-gradient(135deg, var(--blue), var(--purple));
  color: white;
  border-radius: 16px;
  text-align: center;
}
```

**Elements:**
- Icon: 48px
- Title: 22px (mobile), weight 700
- Subtitle: 15px, opacity 0.9

---

### 5. Recent Work Items

```css
.recent-item {
  padding: 20px;
  min-height: 56px;
  background: var(--background);
  border-radius: 12px;
  gap: 16px;
}
```

**Elements:**
- Thumbnail: 64px × 64px, rounded 12px
- Title: 16px, weight 600
- Meta: 14px, tertiary color
- Action button: 48px × 48px

**Hover:**
```css
background: var(--surface);
box-shadow: 0 1px 2px rgba(0,0,0,0.05);
transform: translateX(4px);
```

---

### 6. All Apps Modal

#### Structure
```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  padding: 20px;
}

.modal {
  max-width: 1200px;
  max-height: 90vh;
  border-radius: 20px;
  background: var(--surface);
}
```

#### Sections
- **Header**: Padding 24px, border-bottom
- **Search**: Padding 24px, input 48px height
- **Filters**: Horizontal scroll chips
- **Content**: Grid, auto-fill minmax(250px, 1fr)

#### App Cards
```css
.all-apps-card {
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: 16px;
  text-align: center;
}

.all-apps-card.pinned {
  border-color: var(--star);
  background: var(--star-bg);
}
```

---

## Layout Guidelines

### Grid Systems

#### Mobile (< 640px)
- **Stats**: Horizontal scroll, 280px cards
- **Apps**: 1 column (full width)
- **Recent**: List view

#### Tablet (640px - 1023px)
- **Stats**: Horizontal scroll
- **Apps**: 2 columns
- **Recent**: List view

#### Desktop (≥ 1024px)
- **Stats**: Flex row (no scroll)
- **Apps**: 3 columns
- **Recent**: List view or sidebar

### Container Widths

```css
.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px (mobile) / 40px (desktop);
}
```

### Breakpoints

```css
/* Mobile first */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

---

## Interaction Patterns

### Touch Targets

**Minimum:** 48px × 48px
**Ideal:** 56px × 56px

```css
.button {
  min-height: 48px;
  min-width: 48px;
  padding: 12px 20px;
}
```

### Hover States

```css
/* Cards */
.card:hover {
  border-color: var(--border-hover);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
  transition: all 0.2s;
}

/* Buttons */
.button:hover {
  background: var(--accent-hover);
  transform: scale(1.02);
  transition: all 0.2s;
}
```

### Active States

```css
.button:active {
  transform: scale(0.98);
}
```

### Focus States

```css
*:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

### Loading States

```css
.loading {
  opacity: 0.6;
  cursor: wait;
  pointer-events: none;
}
```

### Animations

**Durations:**
- Quick: 150ms (hover)
- Normal: 200ms-250ms (transitions)
- Slow: 300ms (modals)

**Easings:**
```css
--ease-default: ease;
--ease-in: ease-in;
--ease-out: ease-out;
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

**Respect User Preferences:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Star/Pin System

### Visual States

#### Pinned (On Dashboard)
```css
.star-badge {
  background: var(--star-bg);
  border: 1px solid var(--star);
}

.star-icon {
  fill: var(--star);
  color: var(--star);
}
```

#### Unpinned (In Modal)
```css
.pin-toggle {
  background: var(--background);
  border: 1px solid var(--border);
}

.star-icon {
  fill: none;
  stroke: var(--text-secondary);
}
```

### Interaction
- Click star to toggle pin/unpin
- Maximum 6 pinned apps
- Show count badge: "Pinned Apps (5)"
- Toast notification on change

---

## Accessibility

### Semantic HTML
```html
<header role="banner">
<main role="main">
<nav role="navigation">
<button aria-label="Menu">
<input aria-label="Search apps">
```

### Keyboard Navigation
- Tab order follows visual order
- Enter/Space activates buttons
- Escape closes modals
- Arrow keys for lists (optional)

### Screen Readers
```html
<button aria-label="Unpin Avatar Creator">
<div role="status" aria-live="polite">
  Avatar Creator pinned to dashboard
</div>
```

### Color Contrast

All text meets WCAG AA:
- Large text (18px+): 3:1 minimum
- Normal text: 4.5:1 minimum
- UI components: 3:1 minimum

### Motion
```css
@media (prefers-reduced-motion: reduce) {
  /* Disable animations */
}
```

---

## Implementation Checklist

### Mobile First
- [ ] All spacing uses mobile values first
- [ ] Touch targets are 48px minimum
- [ ] Cards are comfortable to tap
- [ ] Text is readable (16px base)
- [ ] Horizontal scroll works smoothly

### Pin System
- [ ] Star badge on pinned apps
- [ ] Pin/unpin toggle works
- [ ] Max 6 pinned apps enforced
- [ ] Dashboard shows only pinned
- [ ] All Apps modal shows all

### Performance
- [ ] Animations are 60fps
- [ ] Images are optimized
- [ ] Fonts are preloaded
- [ ] No layout shift (CLS)

### Accessibility
- [ ] Semantic HTML
- [ ] Keyboard navigation
- [ ] Screen reader tested
- [ ] Color contrast passes
- [ ] Focus visible

---

## Design Tokens (CSS Variables)

```css
:root {
  /* Colors */
  --background: #FAFBFC;
  --surface: #FFFFFF;
  --border: #E5E7EB;
  --text-primary: #111827;
  --text-secondary: #6B7280;
  --accent: #3B82F6;
  --star: #F59E0B;

  /* Spacing */
  --space-xs: 8px;
  --space-md: 16px;
  --space-xl: 24px;
  --space-3xl: 40px;

  /* Typography */
  --text-base: 16px;
  --text-lg: 18px;
  --text-xl: 22px;
  --text-2xl: 28px;

  /* Borders */
  --border-radius: 12px;
  --border-radius-lg: 16px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
}
```

---

## Quick Reference

### Component Sizes
- Header height: Auto (sticky)
- Stat card: 280px min-width
- App card: 200px min-height (mobile), 240px (desktop)
- Recent item: 56px min-height
- Touch target: 48px minimum

### Common Patterns
- Card padding: 24px (mobile), 32px (desktop)
- Card gap: 20px (mobile), 24px (desktop)
- Border radius: 12px (small), 16px (medium), 20px (large)
- Border width: 1px (default), 2px (emphasis)

### Color Usage
- Background: #FAFBFC
- Cards: #FFFFFF
- Borders: #E5E7EB
- Text: #111827 (primary), #6B7280 (secondary)
- Accent: #3B82F6
- Star: #F59E0B

---

**Last Updated:** October 14, 2025
**Version:** 2.0 - Simplified Pin-First Design
