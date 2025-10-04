# Carousel Mix - Position-Based Architecture Implementation Plan

**Created**: 2025-10-03
**Status**: Planning Phase
**Priority**: CRITICAL - Current implementation is fundamentally wrong

---

## Problem Statement

### Current Implementation (WRONG ❌)
- All slides go into one global pool
- All texts go into one global pool
- Random selection from pools without position awareness
- No concept of "slide position" in carousel
- Cannot create meaningful combinations

### Correct Implementation (TARGET ✅)
- Each **slide position** (1, 2, 3, ..., N) has its own variations:
  - Multiple **image variations** for position 1
  - Multiple **text variations** for position 1 (each with style, alignment, position)
  - Same for position 2, 3, etc.
- **Combinatorial generation**: Position1_variations × Position2_variations × ... × PositionN_variations
- User generates **M sets** (M complete carousels)

---

## Example Scenario

### Setup:
User wants 3-slide carousel with variations:

**Slide Position 1:**
- Images: `gambar1a.png`, `gambar1b.png`, `gambar1c.png` (3 variations)
- Texts: `"Selamat Pagi!"`, `"Good Morning!"` (2 variations)
- Total variations for position 1: **3 × 2 = 6**

**Slide Position 2:**
- Images: `gambar2a.png`, `gambar2b.png` (2 variations)
- Texts: `"Tips Hari Ini"`, `"Motivasi Kerja"`, `"Quote Inspiratif"` (3 variations)
- Total variations for position 2: **2 × 3 = 6**

**Slide Position 3:**
- Images: `gambar3a.png`, `gambar3b.png` (2 variations)
- Texts: `"Terima Kasih"`, `"Thank You"` (2 variations)
- Total variations for position 3: **2 × 2 = 4**

### Possible Combinations:
**6 × 6 × 4 = 144 unique carousel combinations**

### Generation:
User requests **10 sets** → System generates 10 unique carousels (each with 3 slides)

---

## Architecture Changes

### 1. Database Schema (Prisma)

#### Current Schema Issues:
```prisma
model CarouselSlide {
  order Int // Just display order, NOT position in carousel
}

model CarouselText {
  order Int // Says "Which slide index" but not enforced properly
}
```

#### New Schema (Add `slidePosition` field):
```prisma
model CarouselSlide {
  id           String   @id @default(cuid())
  projectId    String
  slidePosition Int     // NEW: Which position in carousel (1, 2, 3, ..., N)
  fileName     String
  filePath     String
  fileType     String
  fileSize     Int
  width        Int?
  height       Int?
  thumbnail    String?
  order        Int      // KEEP: Display order within same position (for UI sorting)
  createdAt    DateTime @default(now())

  project CarouselProject @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId, slidePosition]) // NEW: Index for querying by position
  @@map("carousel_slides")
}

model CarouselText {
  id            String   @id @default(cuid())
  projectId     String
  slidePosition Int      // NEW: Which position in carousel (1, 2, 3, ..., N)
  content       String
  styleData     String?  // JSON: TextStyle
  positionData  String?  // JSON: TextPosition

  // Legacy fields (keep for backward compatibility)
  position      String   @default("center")
  alignment     String   @default("center")
  fontSize      Int      @default(24)
  fontColor     String   @default("#FFFFFF")
  fontWeight    String   @default("normal")

  order         Int      // KEEP: Display order within same position
  createdAt     DateTime @default(now())

  project CarouselProject @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId, slidePosition]) // NEW: Index for querying by position
  @@map("carousel_texts")
}
```

**Migration:**
```bash
npx prisma migrate dev --name add_slide_position_to_carousel_mix
```

---

### 2. State Management (Zustand Store)

#### Current Store Structure (WRONG):
```typescript
interface Project {
  slides: Slide[]  // All slides in one array
  texts: TextVariation[]  // All texts in one array
}
```

#### New Store Structure (CORRECT):
```typescript
interface SlidesByPosition {
  [position: number]: Slide[]  // Group by position
}

interface TextsByPosition {
  [position: number]: TextVariation[]  // Group by position
}

interface Project {
  id: string
  name: string
  description?: string
  numSlides: number  // How many slides per carousel (2-8)

  // Position-based grouping
  slidesByPosition: SlidesByPosition
  textsByPosition: TextsByPosition

  generations: Generation[]
  createdAt: string
  updatedAt: string
}

interface Slide {
  id: string
  projectId: string
  slidePosition: number  // NEW
  fileName: string
  filePath: string
  fileType: string
  fileSize: number
  width?: number
  height?: number
  thumbnail?: string
  order: number
  createdAt: string
}

interface TextVariation {
  id: string
  projectId: string
  slidePosition: number  // NEW
  content: string
  style: TextStyle
  position: TextPosition
  order: number
  createdAt: string
}
```

#### Store Actions (Updated):
```typescript
interface CarouselMixStore {
  // ... existing state ...

  // Updated actions
  uploadSlide: (projectId: string, file: File, slidePosition: number) => Promise<Slide>
  deleteSlide: (slideId: string) => Promise<void>

  addTextVariation: (projectId: string, slidePosition: number, data: Partial<TextVariation>) => Promise<TextVariation>
  updateTextVariation: (textId: string, updates: Partial<TextVariation>) => Promise<void>
  deleteTextVariation: (textId: string) => Promise<void>

  // NEW: Calculate combinations per position
  calculateCombinations: () => number
}
```

---

### 3. UI Components

#### InputPanel (Complete Redesign)

**Current UI (WRONG):**
```
[Slides] (global upload)
  - slide1.png
  - slide2.png
  - slide3.png

[Text Variations] (global list)
  - "Text 1"
  - "Text 2"
```

**New UI (CORRECT):**
```
[Slides per Carousel] (user selects 2-8)
  Slider: 2 ----●---- 8
  Current: 3 slides

[Slide Position 1]
  📸 Images (2):
    - gambar1a.png [x]
    - gambar1b.png [x]
    [+ Upload Image]

  📝 Text Variations (2):
    - "Selamat Pagi!" [Edit] [x]
    - "Good Morning!" [Edit] [x]
    [+ Add Text]

[Slide Position 2]
  📸 Images (1):
    - gambar2a.png [x]
    [+ Upload Image]

  📝 Text Variations (3):
    - "Tips Hari Ini" [Edit] [x]
    - "Motivasi Kerja" [Edit] [x]
    - "Quote Inspiratif" [Edit] [x]
    [+ Add Text]

[Slide Position 3]
  📸 Images (2):
    - gambar3a.png [x]
    - gambar3b.png [x]
    [+ Upload Image]

  📝 Text Variations (2):
    - "Terima Kasih" [Edit] [x]
    - "Thank You" [Edit] [x]
    [+ Add Text]
```

**Component Structure:**
```typescript
// InputPanel.tsx
<div>
  <NumSlidesSelector value={numSlides} onChange={...} />

  {Array.from({ length: numSlides }, (_, i) => (
    <SlidePositionSection
      key={i + 1}
      position={i + 1}
      slides={slidesByPosition[i + 1] || []}
      texts={textsByPosition[i + 1] || []}
      onUploadSlide={...}
      onDeleteSlide={...}
      onAddText={...}
      onEditText={...}
      onDeleteText={...}
    />
  ))}
</div>

// SlidePositionSection.tsx
<div className="border rounded-lg p-4 mb-4">
  <h3>Slide Position {position}</h3>

  <div className="mb-4">
    <h4>📸 Images ({slides.length})</h4>
    <div className="grid grid-cols-2 gap-3">
      {slides.map(slide => <SlideCard ... />)}
    </div>
    <UploadButton onUpload={(file) => onUploadSlide(file, position)} />
  </div>

  <div>
    <h4>📝 Text Variations ({texts.length})</h4>
    {texts.map(text => (
      <TextVariationCard
        text={text}
        onEdit={onEditText}
        onDelete={onDeleteText}
      />
    ))}
    <AddTextButton onClick={() => onAddText(position)} />
  </div>
</div>
```

#### ResultsPanel (Updated Calculator)

**New Combination Calculator:**
```typescript
function calculateCombinations(slidesByPosition, textsByPosition, numSlides) {
  let total = 1

  for (let pos = 1; pos <= numSlides; pos++) {
    const imageCount = slidesByPosition[pos]?.length || 0
    const textCount = textsByPosition[pos]?.length || 0

    if (imageCount === 0) {
      // No images for this position = 0 combinations
      return 0
    }

    // Images × (Texts OR 1 if no text)
    const positionVariations = imageCount * Math.max(textCount, 1)
    total *= positionVariations
  }

  return total
}
```

**Display:**
```
Possible Combinations: 144

Breakdown:
- Position 1: 3 images × 2 texts = 6 variations
- Position 2: 2 images × 3 texts = 6 variations
- Position 3: 2 images × 2 texts = 4 variations
Total: 6 × 6 × 4 = 144

[Generate __ sets] (input: 1-144)
```

---

### 4. Backend API Changes

#### Routes (Updated)

**Upload Slide:**
```typescript
// POST /api/apps/carousel-mix/projects/:id/slides
{
  file: File,
  slidePosition: number  // NEW: Required
}
```

**Add Text Variation:**
```typescript
// POST /api/apps/carousel-mix/projects/:id/texts
{
  slidePosition: number,  // NEW: Required
  content: string,
  style: TextStyle,
  position: TextPosition
}
```

**Get Project (Response includes position grouping):**
```typescript
// GET /api/apps/carousel-mix/projects/:id
{
  id: string,
  name: string,
  numSlides: number,
  slidesByPosition: {
    1: [...],
    2: [...],
    3: [...]
  },
  textsByPosition: {
    1: [...],
    2: [...],
    3: [...]
  }
}
```

**Estimate Generation:**
```typescript
// POST /api/apps/carousel-mix/projects/:id/estimate
Request: {
  numSets: number
}

Response: {
  possibleCombinations: number,
  breakdown: {
    position: number,
    imageCount: number,
    textCount: number,
    variations: number
  }[],
  numSets: number,
  creditCost: number
}
```

---

### 5. Generation Algorithm

#### Combination Generator:
```typescript
interface CarouselSet {
  setNumber: number
  slides: {
    position: number
    image: Slide
    text: TextVariation | null
  }[]
}

function generateSets(
  numSets: number,
  numSlides: number,
  slidesByPosition: SlidesByPosition,
  textsByPosition: TextsByPosition
): CarouselSet[] {
  const sets: CarouselSet[] = []

  for (let setIdx = 0; setIdx < numSets; setIdx++) {
    const carouselSlides = []

    for (let pos = 1; pos <= numSlides; pos++) {
      // Pick random image from position
      const images = slidesByPosition[pos] || []
      if (images.length === 0) {
        throw new Error(`No images for position ${pos}`)
      }
      const image = images[Math.floor(Math.random() * images.length)]

      // Pick random text from position (or null if no texts)
      const texts = textsByPosition[pos] || []
      const text = texts.length > 0
        ? texts[Math.floor(Math.random() * texts.length)]
        : null

      carouselSlides.push({ position: pos, image, text })
    }

    sets.push({
      setNumber: setIdx + 1,
      slides: carouselSlides
    })
  }

  return sets
}
```

#### Worker (Updated):
```typescript
// carousel-mix.worker.ts
async function processGeneration(generationId: string) {
  const generation = await getGeneration(generationId)
  const project = await getProject(generation.projectId)

  // Group slides and texts by position
  const slidesByPosition = groupByPosition(project.slides)
  const textsByPosition = groupByPosition(project.texts)

  // Generate sets
  const sets = generateSets(
    generation.numSetsGenerated,
    generation.numSlides,
    slidesByPosition,
    textsByPosition
  )

  // For each set, create carousel images
  const outputPaths = []
  for (const set of sets) {
    const outputPath = await createCarousel(set, project)
    outputPaths.push(outputPath)
  }

  // Create ZIP
  const zipPath = await createZip(outputPaths)

  // Update generation status
  await updateGeneration(generationId, {
    status: 'completed',
    outputPath: zipPath,
    outputPaths: JSON.stringify(outputPaths),
    completedAt: new Date()
  })
}

async function createCarousel(set: CarouselSet, project: Project): Promise<string> {
  // Canvas composition logic
  const canvas = createCanvas(1080, 1920)  // Instagram story size
  const ctx = canvas.getContext('2d')

  // Composite slides
  for (const { position, image, text } of set.slides) {
    // Load and draw image
    const img = await loadImage(image.filePath)
    ctx.drawImage(img, x, y, width, height)

    // Draw text overlay (if exists)
    if (text) {
      ctx.font = `${text.style.fontWeight} ${text.style.fontSize}px ${text.style.fontFamily}`
      ctx.fillStyle = text.style.color
      ctx.textAlign = text.position.align
      // ... apply shadow, outline, etc.
      ctx.fillText(text.content, x, y)
    }
  }

  // Save to file
  const outputPath = path.join(OUTPUT_DIR, `carousel_set_${set.setNumber}.png`)
  await saveCanvas(canvas, outputPath)

  return outputPath
}
```

---

### 6. Credit Calculation (Updated)

```typescript
function calculateCredits(
  numSlides: number,
  numSets: number,
  slidesByPosition: SlidesByPosition,
  textsByPosition: TextsByPosition
): number {
  const basePerCarousel = 5  // Base cost per carousel
  const perSlide = 2  // Cost per slide

  let totalTextVariations = 0
  for (let pos = 1; pos <= numSlides; pos++) {
    totalTextVariations += textsByPosition[pos]?.length || 0
  }
  const textCost = totalTextVariations * 1  // 1 credit per text variation

  const bulkMultiplier = numSets > 10 ? 1.5 : 1

  const cost = (
    (basePerCarousel * numSets) +
    (perSlide * numSlides * numSets) +
    textCost
  ) * bulkMultiplier

  return Math.ceil(cost)
}
```

---

## Implementation Phases

### Phase 1: Database & Migration (2 hours)
- [ ] Update Prisma schema with `slidePosition` field
- [ ] Create migration script
- [ ] Run migration on dev database
- [ ] Test backward compatibility

### Phase 2: Backend API (3 hours)
- [ ] Update CarouselService methods
- [ ] Update routes to handle `slidePosition`
- [ ] Update combination calculator logic
- [ ] Update credit calculation
- [ ] Test API endpoints

### Phase 3: State Management (2 hours)
- [ ] Refactor Zustand store structure
- [ ] Update actions to be position-aware
- [ ] Add combination calculator
- [ ] Test state updates

### Phase 4: Frontend UI (4 hours)
- [ ] Create SlidePositionSection component
- [ ] Update InputPanel with per-position sections
- [ ] Update NumSlidesSelector with position management
- [ ] Update ResultsPanel calculator display
- [ ] Test UI flow

### Phase 5: Generation Logic (3 hours)
- [ ] Update generateSets algorithm
- [ ] Update worker canvas composition
- [ ] Test generation with various combinations
- [ ] Verify output quality

### Phase 6: Testing & Polish (2 hours)
- [ ] End-to-end testing
- [ ] Edge case handling (empty positions, etc.)
- [ ] UI/UX refinements
- [ ] Performance optimization

**Total Estimated Time: 16 hours**

---

## Migration Strategy (Existing Data)

For existing projects with old structure:
```typescript
async function migrateExistingProjects() {
  const projects = await prisma.carouselProject.findMany({
    include: { slides: true, texts: true }
  })

  for (const project of projects) {
    // Assign slidePosition based on current order
    for (const slide of project.slides) {
      await prisma.carouselSlide.update({
        where: { id: slide.id },
        data: { slidePosition: slide.order + 1 }  // Convert order to position
      })
    }

    for (const text of project.texts) {
      await prisma.carouselText.update({
        where: { id: text.id },
        data: { slidePosition: text.order + 1 }  // Convert order to position
      })
    }
  }
}
```

---

## Success Criteria

- [ ] User can select number of slides (2-8)
- [ ] User can upload multiple images per slide position
- [ ] User can add multiple text variations per slide position
- [ ] Each text variation has independent style/alignment/position
- [ ] Combination calculator shows correct count and breakdown
- [ ] Generation produces correct carousel combinations
- [ ] All carousels in same generation have consistent structure (same positions)
- [ ] Credit calculation is accurate
- [ ] UI is intuitive and clear

---

## Risk Assessment

### High Risk:
- Data migration might fail for complex existing projects
- Combination explosion (user creates 1M+ combinations)
- Canvas rendering performance with many text effects

### Mitigation:
- Test migration on copy of database first
- Add max combinations limit (e.g., 10,000)
- Optimize canvas rendering with caching
- Add generation queue system for large batches

---

## Next Steps

1. **Review this plan** with user for approval
2. **Start Phase 1** (Database & Migration)
3. **Iterative development** with testing after each phase
4. **Update documentation** as we implement

---

**End of Implementation Plan**
