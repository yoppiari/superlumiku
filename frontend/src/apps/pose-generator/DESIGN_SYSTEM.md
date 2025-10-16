# Pose Generator Premium Design System

## Overview

This design system provides a comprehensive set of guidelines, components, and utilities for creating a premium, polished user experience in the Pose Generator application. Every element is designed to feel intentional, delightful, and worthy of a top-tier SaaS product.

---

## Table of Contents

1. [Design Principles](#design-principles)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Components](#components)
6. [Animations](#animations)
7. [Micro-interactions](#micro-interactions)
8. [Performance Guidelines](#performance-guidelines)

---

## Design Principles

### Premium Feel
- **Generous Whitespace**: Never crowd elements. Breathing room creates luxury.
- **Multi-layer Shadows**: Use 2-3 shadow layers for depth perception.
- **Smooth Animations**: 60fps minimum, respect reduced-motion preferences.
- **Progressive Disclosure**: Show only what's needed, reveal more on interaction.

### User-Centric UX
- **Obvious Actions**: Primary actions should be unmistakable.
- **Instant Feedback**: Every interaction gets visual confirmation within 100ms.
- **Error Prevention**: Validate before allowing destructive actions.
- **Smart Defaults**: Pre-select the most common options.

### Emotional Connection
- **Delight Moments**: Confetti on success, subtle celebrations.
- **Personality**: Use appropriate emojis and friendly copy.
- **Anticipation**: Loading states that feel like progress, not waiting.

---

## Color System

### Primary Palette

```typescript
// Primary (Blue)
primary: {
  500: '#3b82f6',  // Main brand color
  600: '#2563eb',  // Hover states
  700: '#1d4ed8',  // Active states
}

// Secondary (Purple)
secondary: {
  600: '#8b5cf6',  // Accent color
  700: '#7c3aed',  // Hover states
}

// Success (Green)
success: {
  500: '#10b981',
  600: '#059669',
}

// Warning (Yellow)
warning: {
  500: '#f59e0b',
  600: '#d97706',
}

// Error (Red)
error: {
  500: '#ef4444',
  600: '#dc2626',
}
```

### Semantic Colors

```typescript
// Difficulty Levels
beginner: '#10b981'    // Green
intermediate: '#f59e0b' // Yellow
advanced: '#ef4444'     // Red
expert: '#8b5cf6'       // Purple

// Status Indicators
pending: '#64748b'      // Slate
processing: '#3b82f6'   // Blue
completed: '#10b981'    // Green
failed: '#ef4444'       // Red
```

### Gradients

```css
/* Primary Gradient */
background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);

/* Success Gradient */
background: linear-gradient(135deg, #10b981 0%, #059669 100%);

/* Premium Glass */
background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%);
backdrop-filter: blur(10px);
```

---

## Typography

### Font Family
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
```

### Scale

| Name | Size | Use Case |
|------|------|----------|
| xs   | 12px | Helper text, badges |
| sm   | 14px | Body text, labels |
| base | 16px | Default body |
| lg   | 18px | Subheadings |
| xl   | 20px | Card titles |
| 2xl  | 24px | Section headers |
| 3xl  | 30px | Page headers |
| 4xl  | 36px | Hero text |
| 5xl  | 48px | Large numbers, stats |

### Weights

- **400 (Normal)**: Body text
- **500 (Medium)**: Emphasized text
- **600 (Semibold)**: Headings, buttons
- **700 (Bold)**: Important headings
- **800 (Extrabold)**: Hero text, large numbers

### Line Height

- **Tight (1.2)**: Large headings, numbers
- **Normal (1.5)**: Body text
- **Relaxed (1.75)**: Long-form content

---

## Spacing & Layout

### 8px Grid System

All spacing follows an 8px base grid:

```typescript
spacing: {
  xs: '4px',   // 0.5 unit
  sm: '8px',   // 1 unit
  md: '16px',  // 2 units
  lg: '24px',  // 3 units
  xl: '32px',  // 4 units
  2xl: '40px', // 5 units
  3xl: '48px', // 6 units
  4xl: '64px', // 8 units
}
```

### Border Radius

```typescript
borderRadius: {
  sm: '4px',   // Small elements (badges)
  md: '8px',   // Cards, inputs
  lg: '12px',  // Modals, panels
  xl: '16px',  // Large containers
  2xl: '20px', // Premium cards
  full: '9999px', // Pills, avatars
}
```

### Shadows (Multi-layer for Depth)

```css
/* Premium Shadow (3 layers) */
shadow-premium:
  0 4px 6px -1px rgba(0, 0, 0, 0.1),
  0 2px 4px -1px rgba(0, 0, 0, 0.06),
  0 0 0 1px rgba(0, 0, 0, 0.05);

/* Premium Large */
shadow-premium-lg:
  0 20px 25px -5px rgba(0, 0, 0, 0.1),
  0 10px 10px -5px rgba(0, 0, 0, 0.04),
  0 0 0 1px rgba(0, 0, 0, 0.05);

/* Glow Effects */
shadow-glow-blue:
  0 0 20px rgba(59, 130, 246, 0.3),
  0 0 40px rgba(59, 130, 246, 0.1);
```

---

## Components

### PoseLibrary

**Purpose**: Display pose templates with masonry grid layout and premium hover effects.

**Features**:
- Masonry grid (not uniform) for visual interest
- Blur-up image loading
- Stagger animations (50ms delay per item)
- Hover effects: scale(1.05), glow shadow
- Difficulty badges with color coding
- Featured pose indicators
- Category filtering with smooth transitions

**Usage**:
```tsx
import PoseLibrary from './components/PoseLibrary'

<PoseLibrary
  poses={poseTemplates}
  selectedPoses={selectedPoses}
  onTogglePose={handleTogglePose}
  categoryFilter={categoryFilter}
  onCategoryChange={setCategoryFilter}
  loading={loadingPoses}
  maxSelection={50}
/>
```

**Key Classes**:
- `.hover-lift`: Lifts element on hover (-4px translate)
- `.hover-glow`: Adds blue glow on hover
- `.stagger-item`: Automatically staggers animation
- `.skeleton-loader`: Shimmer loading effect

---

### GenerationProgress

**Purpose**: Animated circular progress ring with real-time updates.

**Features**:
- SVG circular progress ring (90px radius)
- Animated counter (counting up effect)
- Particle effects around ring
- Confetti animation at 100%
- Thumbnail carousel of completed poses
- Dynamic time remaining color (green=fast, red=slow)

**Usage**:
```tsx
import GenerationProgress from './components/GenerationProgress'

<GenerationProgress
  generationId={generation.id}
  totalPoses={50}
  completedPoses={25}
  failedPoses={0}
  status="processing"
  estimatedTimeRemaining={120}
  recentPoses={recentPoses}
  onComplete={() => console.log('Done!')}
/>
```

**Key Animations**:
- Progress ring: 1s ease-out transition
- Counter: Cubic ease-out over 500ms
- Confetti: Particles with gravity simulation
- Shimmer: 2s infinite on progress bar

---

### ExportFormatSelector

**Purpose**: Visual format cards with aspect ratio previews.

**Features**:
- Platform logos and icons
- Aspect ratio visual preview boxes
- Expandable category sections
- Animated check/uncheck transitions
- Recommended format badges
- Hover effects: lift + border glow

**Usage**:
```tsx
import ExportFormatSelector from './components/ExportFormatSelector'

<ExportFormatSelector
  selectedFormats={selectedFormats}
  onToggleFormat={handleToggleFormat}
  onExport={handleExport}
/>
```

**Format Categories**:
- Social Media: Instagram, TikTok, Facebook, etc.
- E-commerce: Shopify, Shopee, Tokopedia, etc.
- Print: 4x6", 5x7", A4, etc.
- Custom: HD, 4K, etc.

---

### GenerationWizard

**Purpose**: Multi-step wizard with animated transitions.

**Features**:
- Step indicator with icons and progress ring
- Animated step transitions (slide + fade)
- Overall progress bar with gradient
- Validation error display with shake animation
- Credit cost indicator
- Keyboard shortcuts (→ for next, ← for back)

**Usage**:
```tsx
import GenerationWizard from './components/GenerationWizard'

<GenerationWizard
  currentStep={currentStep}
  totalSteps={4}
  onStepChange={setCurrentStep}
  onNext={handleNext}
  onBack={handleBack}
  onSubmit={handleSubmit}
  canProceed={!validationErrors.length}
  creditCost={100}
  validationErrors={errors}
>
  {/* Step content */}
</GenerationWizard>
```

**Step States**:
- Active: Pulsing ring, blue gradient, scale(1.1)
- Completed: Green checkmark, scale(1)
- Pending: Gray, scale(0.95)

---

### Dashboard Widgets

#### PoseGeneratorStatsWidget

**Features**:
- Gradient background (blue → purple → pink)
- Animated counter with counting effect
- Sparkline chart of generation trend
- Glass morphism overlay
- Recent pose thumbnails
- Shine effect on hover
- CTA button with gradient hover

**Usage**:
```tsx
import PoseGeneratorStatsWidget from './components/PoseGeneratorStatsWidget'

<PoseGeneratorStatsWidget
  totalGenerations={50}
  totalPoses={1250}
  recentPoses={recentPoses}
  generationTrend={[10, 15, 12, 20, 25, 30, 28]}
/>
```

#### RecentGenerationsWidget

**Features**:
- Vertical timeline layout
- Status badges with semantic colors
- Progress bars for processing items
- Thumbnail previews with stagger hover
- Hover effects on timeline items
- Time ago formatting

**Usage**:
```tsx
import RecentGenerationsWidget from './components/RecentGenerationsWidget'

<RecentGenerationsWidget
  generations={recentGenerations}
  maxItems={5}
/>
```

---

## Animations

### Duration Guidelines

```typescript
duration: {
  fast: '150ms',    // Micro-interactions, hovers
  normal: '300ms',  // Standard transitions
  slow: '500ms',    // Major state changes
  slower: '700ms',  // Page transitions
}
```

### Timing Functions

```typescript
timing: {
  spring: 'cubic-bezier(0.16, 1, 0.3, 1)',     // Smooth, natural
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Playful
  ease: 'cubic-bezier(0.4, 0, 0.2, 1)',        // Default easing
}
```

### Common Animations

#### Fade In Up
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeInUp {
  animation: fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1);
}
```

#### Scale In
```css
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-scaleIn {
  animation: scaleIn 300ms cubic-bezier(0.16, 1, 0.3, 1);
}
```

#### Shimmer (Loading)
```css
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.shimmer {
  animation: shimmer 2s infinite linear;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.4) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  background-size: 1000px 100%;
}
```

#### Stagger Animation
```css
.stagger-item {
  animation: fadeInUp 400ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

.stagger-item:nth-child(1) { animation-delay: 0ms; }
.stagger-item:nth-child(2) { animation-delay: 50ms; }
.stagger-item:nth-child(3) { animation-delay: 100ms; }
/* ... continues up to 10, then max 500ms */
```

---

## Micro-interactions

### Hover Effects

#### Lift + Shadow
```css
.hover-lift {
  transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}
```

#### Scale
```css
.hover-scale:hover {
  transform: scale(1.05);
}

.hover-scale-sm:hover {
  transform: scale(1.02);
}
```

#### Glow
```css
.hover-glow {
  transition: box-shadow 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

.hover-glow:hover {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2),
              0 8px 16px rgba(59, 130, 246, 0.2);
}
```

#### Shine
```css
.hover-shine {
  position: relative;
  overflow: hidden;
}

.hover-shine::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  transition: left 500ms cubic-bezier(0.16, 1, 0.3, 1);
}

.hover-shine:hover::after {
  left: 100%;
}
```

### Click Feedback

#### Ripple Effect
```tsx
const handleClick = (e: React.MouseEvent) => {
  const button = e.currentTarget
  const ripple = document.createElement('span')
  const rect = button.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  const x = e.clientX - rect.left - size / 2
  const y = e.clientY - rect.top - size / 2

  ripple.style.width = ripple.style.height = `${size}px`
  ripple.style.left = `${x}px`
  ripple.style.top = `${y}px`
  ripple.classList.add('ripple')

  button.appendChild(ripple)

  setTimeout(() => ripple.remove(), 600)
}
```

```css
@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

.ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  animation: ripple 600ms ease-out;
  pointer-events: none;
}
```

### Success Celebrations

#### Confetti
```tsx
const triggerConfetti = () => {
  // Create 100 confetti particles
  // Random colors, positions, velocities
  // Gravity simulation
  // Clean up after animation
}
```

#### Checkmark Animation
```css
@keyframes checkmark {
  0% {
    stroke-dashoffset: 100;
  }
  100% {
    stroke-dashoffset: 0;
  }
}

.success-checkmark path {
  stroke-dasharray: 100;
  animation: checkmark 500ms ease-out forwards;
}
```

---

## Performance Guidelines

### Animation Performance

1. **Use GPU Acceleration**
```css
.gpu-accelerated {
  transform: translateZ(0);
  will-change: transform;
}
```

2. **Limit will-change**
- Only add `will-change` during animation
- Remove after animation completes
```tsx
element.style.willChange = 'transform'
// ... animate ...
element.style.willChange = 'auto'
```

3. **Prefer transform and opacity**
- These are GPU-accelerated
- Avoid animating width, height, top, left

4. **Respect User Preferences**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Image Loading

1. **Blur-up Technique**
```tsx
const [loaded, setLoaded] = useState(false)

<img
  src={highRes}
  onLoad={() => setLoaded(true)}
  className={loaded ? 'opacity-100' : 'opacity-0'}
  style={{ transition: 'opacity 500ms' }}
/>
```

2. **Lazy Loading**
```tsx
<img src={url} loading="lazy" />
```

3. **Skeleton Loaders**
```css
.skeleton-loader {
  animation: skeleton 1.5s ease-in-out infinite;
  background: linear-gradient(
    90deg,
    #f3f4f6 0%,
    #e5e7eb 50%,
    #f3f4f6 100%
  );
}
```

### Scroll Performance

1. **Virtual Scrolling** for long lists (>100 items)
2. **Intersection Observer** for lazy loading
3. **Debounce scroll events** (100-200ms)

---

## Component Checklist

When creating a new component, ensure it has:

- [ ] Hover states on interactive elements
- [ ] Loading states with skeleton or spinner
- [ ] Error states with helpful messages
- [ ] Empty states with illustration and CTA
- [ ] Disabled states (50% opacity, cursor-not-allowed)
- [ ] Focus states (visible outline for keyboard nav)
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Dark mode support (if applicable)
- [ ] Accessibility (ARIA labels, keyboard shortcuts)
- [ ] Animation respects prefers-reduced-motion
- [ ] TypeScript types for all props
- [ ] JSDoc comments for complex logic

---

## Quick Reference

### Common Utility Classes

```css
/* Animations */
.animate-fadeIn
.animate-fadeInUp
.animate-scaleIn
.animate-pulse
.animate-spin
.animate-shake
.animate-bounce

/* Hover Effects */
.hover-lift
.hover-scale
.hover-scale-sm
.hover-glow
.hover-shine

/* Shadows */
.shadow-premium
.shadow-premium-lg
.shadow-glow-blue
.shadow-glow-purple

/* Loading */
.skeleton-loader
.shimmer

/* Layout */
.glass (glass morphism)
.glass-dark

/* Transitions */
.transition-fast (150ms)
.transition-normal (300ms)
.transition-slow (500ms)
```

### Color Class Naming

```
bg-{color}-{shade}
text-{color}-{shade}
border-{color}-{shade}

Examples:
bg-blue-500
text-slate-700
border-purple-600
```

---

## File Structure

```
pose-generator/
├── components/
│   ├── PoseLibrary.tsx
│   ├── GenerationProgress.tsx
│   ├── ExportFormatSelector.tsx
│   ├── GenerationWizard.tsx
│   ├── PoseGeneratorStatsWidget.tsx
│   └── RecentGenerationsWidget.tsx
├── styles/
│   ├── animations.css
│   └── design-tokens.ts
└── DESIGN_SYSTEM.md
```

---

## Resources

### Design Inspiration
- [Shopify Polaris](https://polaris.shopify.com/)
- [Linear Design System](https://linear.app/design)
- [Figma Design System](https://www.figma.com/design-systems/)

### Animation Libraries
- [Framer Motion](https://www.framer.com/motion/)
- [React Spring](https://www.react-spring.dev/)
- [GSAP](https://greensock.com/gsap/)

### Tools
- [CSS Gradient Generator](https://cssgradient.io/)
- [Cubic Bezier Editor](https://cubic-bezier.com/)
- [Shadow Generator](https://shadows.brumm.af/)

---

## Conclusion

This design system is a living document. As new patterns emerge and components are added, update this documentation to maintain consistency across the application.

**Remember**: Premium design is in the details. Take the extra time to perfect animations, transitions, and micro-interactions. Users may not consciously notice these details, but they'll feel the difference.
