# Pose Generator Premium UI - Implementation Guide

## Quick Start

This guide shows you how to integrate the premium UI components into your Pose Generator app.

---

## Step 1: Import Styles

Add the animation CSS to your main component:

```tsx
// In frontend/src/apps/PoseGenerator.tsx
import './pose-generator/styles/animations.css'
```

Or import globally in your main app file:

```tsx
// In frontend/src/App.tsx
import './apps/pose-generator/styles/animations.css'
```

---

## Step 2: Update Tailwind Config

Extend your Tailwind configuration with the design tokens:

```javascript
// frontend/tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', sans-serif'],
      },
      colors: {
        // Add premium color extensions
        blue: {
          500: '#3b82f6',
          600: '#2563eb',
        },
        purple: {
          600: '#8b5cf6',
          700: '#7c3aed',
        },
        // ... add other colors as needed
      },
      boxShadow: {
        'premium': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.05)',
        'premium-lg': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.05)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.1)',
      },
      animation: {
        'fadeIn': 'fadeIn 300ms ease-out',
        'fadeInUp': 'fadeInUp 400ms ease-out',
        'scaleIn': 'scaleIn 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer': 'shimmer 2s infinite linear',
      },
    },
  },
  plugins: [],
}
```

---

## Step 3: Replace Existing Components

### A. Replace Pose Selection (Step 2)

**Before** (in PoseGenerator.tsx):
```tsx
{currentStep === 2 && (
  <div className="bg-white rounded-xl border border-slate-200 p-6">
    <h2 className="text-lg font-semibold text-slate-900 mb-4">
      Choose Poses ({selectedPoses.length}/50)
    </h2>
    {/* ... old grid code ... */}
  </div>
)}
```

**After**:
```tsx
import PoseLibrary from './pose-generator/components/PoseLibrary'

{currentStep === 2 && (
  <PoseLibrary
    poses={poseTemplates}
    selectedPoses={selectedPoses}
    onTogglePose={handleTogglePose}
    categoryFilter={categoryFilter}
    onCategoryChange={setCategoryFilter}
    loading={loadingPoses}
    maxSelection={50}
  />
)}
```

### B. Replace Progress Display (Step 4)

**Before**:
```tsx
{selectedGeneration && (
  <div className="border border-slate-200 rounded-lg p-4">
    <div className="flex items-center justify-between mb-2">
      <span>{selectedGeneration.status}</span>
      <span>{selectedGeneration.progress}%</span>
    </div>
    {/* ... old progress bar ... */}
  </div>
)}
```

**After**:
```tsx
import GenerationProgress from './pose-generator/components/GenerationProgress'

{selectedGeneration && selectedGeneration.status === 'processing' && (
  <GenerationProgress
    generationId={selectedGeneration.id}
    totalPoses={selectedGeneration.totalPoses}
    completedPoses={selectedGeneration.successfulPoses}
    failedPoses={selectedGeneration.failedPoses}
    status={selectedGeneration.status}
    estimatedTimeRemaining={calculateEstimatedTime(selectedGeneration)}
    recentPoses={generatedPoses.slice(-5)}
    onComplete={() => {
      loadGenerations()
      setShowConfetti(true)
    }}
  />
)}
```

### C. Wrap Configuration Step with Wizard

**Before**:
```tsx
{/* Step 3: Configure */}
{currentStep === 3 && (
  <div className="bg-white rounded-xl border border-slate-200 p-6">
    {/* ... configuration form ... */}
  </div>
)}
```

**After**:
```tsx
import GenerationWizard from './pose-generator/components/GenerationWizard'

<GenerationWizard
  currentStep={currentStep}
  totalSteps={4}
  onStepChange={setCurrentStep}
  onNext={() => {
    // Validation logic
    if (validateCurrentStep()) {
      setCurrentStep(currentStep + 1)
    }
  }}
  onBack={() => setCurrentStep(currentStep - 1)}
  onSubmit={handleGenerate}
  canProceed={canProceed}
  isSubmitting={generating}
  creditCost={calculateCreditCost()}
  validationErrors={validationErrors}
>
  {/* Step content goes here */}
  {currentStep === 1 && <AvatarSelection />}
  {currentStep === 2 && <PoseLibrary />}
  {currentStep === 3 && <ConfigurationForm />}
  {currentStep === 4 && <ResultsView />}
</GenerationWizard>
```

---

## Step 4: Add Dashboard Widgets

In your main Dashboard component:

```tsx
// frontend/src/apps/Dashboard.tsx
import PoseGeneratorStatsWidget from './pose-generator/components/PoseGeneratorStatsWidget'
import RecentGenerationsWidget from './pose-generator/components/RecentGenerationsWidget'

export default function Dashboard() {
  const [poseStats, setPoseStats] = useState({
    totalGenerations: 0,
    totalPoses: 0,
    recentPoses: [],
    generationTrend: []
  })

  useEffect(() => {
    loadPoseGeneratorStats()
  }, [])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pose Generator Stats */}
      <PoseGeneratorStatsWidget
        totalGenerations={poseStats.totalGenerations}
        totalPoses={poseStats.totalPoses}
        recentPoses={poseStats.recentPoses}
        generationTrend={poseStats.generationTrend}
      />

      {/* Recent Generations Timeline */}
      <RecentGenerationsWidget
        generations={recentGenerations}
        maxItems={5}
      />
    </div>
  )
}
```

---

## Step 5: Add Export Format Selector (Optional)

If you want to add export functionality:

```tsx
import ExportFormatSelector from './pose-generator/components/ExportFormatSelector'

const [selectedFormats, setSelectedFormats] = useState<string[]>([])

const handleToggleFormat = (formatId: string) => {
  setSelectedFormats(prev =>
    prev.includes(formatId)
      ? prev.filter(id => id !== formatId)
      : [...prev, formatId]
  )
}

const handleExport = async () => {
  // Export logic
  console.log('Exporting formats:', selectedFormats)
}

// In your component render:
<ExportFormatSelector
  selectedFormats={selectedFormats}
  onToggleFormat={handleToggleFormat}
  onExport={handleExport}
/>
```

---

## Step 6: Helper Functions

Add these helper functions to your component:

```tsx
// Calculate estimated time remaining
const calculateEstimatedTime = (generation: Generation) => {
  const avgTimePerPose = 5 // seconds
  const remaining = generation.totalPoses - generation.successfulPoses
  return remaining * avgTimePerPose
}

// Calculate credit cost
const calculateCreditCost = () => {
  let cost = selectedPoses.length * 10 // Base: 10 credits per pose

  if (quality === 'hd') cost *= 2
  if (enableFashion) cost += selectedPoses.length * 5
  if (enableBackground) cost += selectedPoses.length * 3
  if (enableProfession) cost += selectedPoses.length * 5

  return cost
}

// Validate current step
const validateCurrentStep = () => {
  const errors: string[] = []

  if (currentStep === 1 && !selectedAvatar) {
    errors.push('Please select an avatar')
  }

  if (currentStep === 2 && selectedPoses.length === 0) {
    errors.push('Please select at least one pose')
  }

  if (currentStep === 3) {
    if (enableFashion && !hijabStyle) {
      errors.push('Please select a hijab style')
    }
    if (enableBackground && backgroundType === 'custom' && !customBackground) {
      errors.push('Please describe your custom background')
    }
  }

  setValidationErrors(errors)
  return errors.length === 0
}

// Get generation trend data (for stats widget)
const getGenerationTrend = async () => {
  // Fetch last 7 days of generation counts
  const last7Days = await api.get('/api/apps/pose-generator/stats/trend')
  return last7Days.data.counts // [10, 15, 12, 20, 25, 30, 28]
}
```

---

## Step 7: Polling for Live Updates

For real-time progress updates:

```tsx
import { useEffect, useRef } from 'react'

const useGenerationPolling = (generationId: string | null, interval = 2000) => {
  const pollRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!generationId) return

    const poll = async () => {
      try {
        const res = await api.get(`/api/apps/pose-generator/generations/${generationId}`)
        const generation = res.data.generation

        // Update state
        setSelectedGeneration(generation)

        // Stop polling if complete
        if (generation.status === 'completed' || generation.status === 'failed') {
          if (pollRef.current) {
            clearInterval(pollRef.current)
          }
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }

    // Start polling
    pollRef.current = setInterval(poll, interval)

    // Cleanup
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
      }
    }
  }, [generationId, interval])
}

// Usage:
useGenerationPolling(selectedGeneration?.id)
```

---

## Step 8: Responsive Design Adjustments

The components are responsive by default, but you may want to adjust layouts:

```tsx
{/* Mobile: Stack widgets */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <PoseGeneratorStatsWidget {...props} />
  <RecentGenerationsWidget {...props} />
</div>

{/* Tablet: Adjust masonry grid columns */}
<PoseLibrary
  {...props}
  className="masonry-cols-2 md:masonry-cols-3 lg:masonry-cols-4"
/>

{/* Mobile: Simplify wizard steps */}
<GenerationWizard
  {...props}
  mobileView={isMobile} // Pass mobile flag
/>
```

---

## Step 9: Performance Optimization

### Lazy Load Components

```tsx
import { lazy, Suspense } from 'react'

const PoseLibrary = lazy(() => import('./pose-generator/components/PoseLibrary'))
const GenerationProgress = lazy(() => import('./pose-generator/components/GenerationProgress'))

// Usage:
<Suspense fallback={<div className="skeleton-loader h-96" />}>
  <PoseLibrary {...props} />
</Suspense>
```

### Memoize Expensive Components

```tsx
import { memo } from 'react'

const PoseLibrary = memo(PoseLibraryComponent, (prev, next) => {
  return (
    prev.poses === next.poses &&
    prev.selectedPoses === next.selectedPoses &&
    prev.categoryFilter === next.categoryFilter
  )
})
```

### Virtual Scrolling for Large Lists

```tsx
import { FixedSizeGrid } from 'react-window'

// For 1000+ poses, use virtual scrolling:
<FixedSizeGrid
  columnCount={4}
  columnWidth={200}
  height={600}
  rowCount={Math.ceil(poses.length / 4)}
  rowHeight={250}
  width={800}
>
  {({ columnIndex, rowIndex, style }) => (
    <div style={style}>
      <PoseCard pose={poses[rowIndex * 4 + columnIndex]} />
    </div>
  )}
</FixedSizeGrid>
```

---

## Step 10: Testing Checklist

Before deploying, test:

- [ ] **Animations**: All animations run at 60fps
- [ ] **Hover States**: All interactive elements have hover effects
- [ ] **Loading States**: Skeleton loaders appear correctly
- [ ] **Error Handling**: Validation errors display properly
- [ ] **Responsive**: Works on mobile (375px), tablet (768px), desktop (1440px)
- [ ] **Keyboard Navigation**: Tab through all interactive elements
- [ ] **Screen Reader**: ARIA labels are present
- [ ] **Reduced Motion**: Animations disabled when `prefers-reduced-motion: reduce`
- [ ] **Empty States**: Show helpful messages when no data
- [ ] **Edge Cases**: Test with 0 poses, 1 pose, 1000+ poses

---

## Common Issues & Solutions

### Issue: Animations Not Working

**Solution**: Ensure animations.css is imported:
```tsx
import './pose-generator/styles/animations.css'
```

### Issue: Styles Not Applied

**Solution**: Check Tailwind content paths include pose-generator:
```javascript
content: [
  "./src/**/*.{js,ts,jsx,tsx}",
  "./src/apps/pose-generator/**/*.{js,ts,jsx,tsx}",
],
```

### Issue: Images Not Loading

**Solution**: Check CORS headers on your image server:
```javascript
// backend/src/middleware/cors.middleware.ts
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}))
```

### Issue: Progress Ring Not Updating

**Solution**: Ensure SVG viewBox is correct:
```tsx
<svg width="240" height="240" viewBox="0 0 240 240">
  {/* ... circles ... */}
</svg>
```

### Issue: Confetti Not Showing

**Solution**: Check canvas positioning:
```css
canvas {
  position: fixed;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 9999;
}
```

---

## Advanced Customization

### Custom Color Scheme

Override design tokens:

```typescript
// Create custom-tokens.ts
import { designTokens } from './design-tokens'

export const customTokens = {
  ...designTokens,
  colors: {
    ...designTokens.colors,
    primary: {
      ...designTokens.colors.primary,
      500: '#ff6b6b', // Your custom primary color
    },
  },
}
```

### Custom Animations

Add to animations.css:

```css
@keyframes customBounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

.animate-custom-bounce {
  animation: customBounce 1s ease-in-out infinite;
}
```

### Custom Components

Follow the pattern:

```tsx
// MyCustomWidget.tsx
import { designTokens } from '../styles/design-tokens'
import '../styles/animations.css'

export default function MyCustomWidget({ data }) {
  return (
    <div className="bg-white rounded-2xl shadow-premium p-6 animate-fadeIn">
      {/* Your content */}
    </div>
  )
}
```

---

## File Checklist

After implementation, you should have:

```
frontend/src/apps/pose-generator/
├── components/
│   ├── PoseLibrary.tsx ✓
│   ├── GenerationProgress.tsx ✓
│   ├── ExportFormatSelector.tsx ✓
│   ├── GenerationWizard.tsx ✓
│   ├── PoseGeneratorStatsWidget.tsx ✓
│   └── RecentGenerationsWidget.tsx ✓
├── styles/
│   ├── animations.css ✓
│   └── design-tokens.ts ✓
├── DESIGN_SYSTEM.md ✓
└── IMPLEMENTATION_GUIDE.md ✓ (this file)
```

---

## Next Steps

1. **Integrate Components**: Follow steps 1-6 above
2. **Test Thoroughly**: Use the testing checklist
3. **Gather Feedback**: Show to users, collect input
4. **Iterate**: Refine based on real-world usage
5. **Document**: Add usage examples to your team docs

---

## Support

For questions or issues:
- Review `DESIGN_SYSTEM.md` for component details
- Check `design-tokens.ts` for color/spacing values
- Look at `animations.css` for available animations
- Refer to component source code for TypeScript types

Remember: Premium design is achieved through attention to detail. Take the time to perfect each interaction, and your users will notice the difference.
