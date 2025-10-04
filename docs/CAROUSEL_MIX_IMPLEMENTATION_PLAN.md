# Carousel Mix - Implementation Plan

**Created:** 2025-10-02
**Status:** Planning → Implementation
**Based on:** PLUGIN_ARCHITECTURE.md, ADD_NEW_APP_PROMPT.md

---

## App Overview

**Carousel Mix** adalah app untuk membuat susunan slide postingan carousel secara otomatis dengan kombinasi gambar/video dan text overlays.

### User Requirements (Original Request)

```
Buatin app baru namanya Carousel Mix.

fungsinya membuat susunan slide postingan carousel secara otomatis.
Mendapatkan estimasi possible combination dan bisa menentukan akan generate berapa banyak.
Bisa preview hasil generate, bisa download satu persatu set slidenya dan bisa sekaligus.
Bisa membuat project/folder untuk setiap generate.

Icon: Stack (layers di lucide.dev)
Warna: Blue

Yang bisa dilakukan user:
- Membuat project bulk generator
- Menentukan jumlah slide yang akan di generate → per 2 slide memakan 1 credit (maksimal 8 slide)
- upload gambar / video slide
- Memasukkan text
- Setting text position, text alignment, text style, font size
- Save project, edit project

Data yang disimpan:
- Nama Folder/Project
```

---

## Architecture

### Plugin Configuration

```typescript
// backend/src/apps/carousel-mix/plugin.config.ts
{
  appId: 'carousel-mix',
  name: 'Carousel Mix',
  description: 'Generate carousel posts automatically with smart combinations',
  icon: 'layers',
  version: '1.0.0',
  routePrefix: '/api/apps/carousel-mix',
  credits: {
    generateCarousel2: 1,   // 2 slides = 1 credit
    generateCarousel4: 2,   // 4 slides = 2 credits
    generateCarousel6: 3,   // 6 slides = 3 credits
    generateCarousel8: 4,   // 8 slides = 4 credits (max)
  },
  access: {
    requiresAuth: true,
    requiresSubscription: false,
    minSubscriptionTier: null,
    allowedRoles: ['user', 'admin'],
  },
  features: {
    enabled: true,
    beta: false,
    comingSoon: false,
  },
  dashboard: {
    order: 6,
    color: 'blue',
    stats: {
      enabled: true,
      endpoint: '/api/apps/carousel-mix/stats',
    },
  },
}
```

---

## Database Schema

### Prisma Models

```prisma
// Add to backend/prisma/schema.prisma

model CarouselProject {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  slides      CarouselSlide[]
  texts       CarouselText[]
  generations CarouselGeneration[]

  @@index([userId])
}

model CarouselSlide {
  id          String   @id @default(cuid())
  projectId   String
  fileName    String
  filePath    String
  fileType    String   // 'image' or 'video'
  fileSize    Int
  order       Int      // Display order
  createdAt   DateTime @default(now())

  project CarouselProject @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
}

model CarouselText {
  id          String   @id @default(cuid())
  projectId   String
  content     String   @db.Text
  position    String   @default("center") // top-left, top-center, top-right, center-left, center, center-right, bottom-left, bottom-center, bottom-right
  alignment   String   @default("center") // left, center, right
  fontSize    Int      @default(24)
  fontColor   String   @default("#FFFFFF")
  fontWeight  String   @default("normal") // normal, bold
  order       Int      // Which slide gets this text
  createdAt   DateTime @default(now())

  project CarouselProject @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
}

model CarouselGeneration {
  id                 String    @id @default(cuid())
  projectId          String
  status             String    @default("pending") // pending, processing, completed, failed
  numSlides          Int       // 2, 4, 6, or 8
  numSetsGenerated   Int       // How many carousel sets were generated
  creditUsed         Int
  outputPath         String?   // Path to ZIP file
  errorMessage       String?
  createdAt          DateTime  @default(now())
  completedAt        DateTime?

  project CarouselProject @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@index([status])
}
```

---

## Backend Implementation

### Folder Structure

```
backend/src/apps/carousel-mix/
├── plugin.config.ts
├── routes.ts
├── services/
│   ├── carousel.service.ts
│   └── combination.service.ts
├── repositories/
│   └── carousel.repository.ts
└── workers/
    └── carousel-generator.worker.ts
```

### API Endpoints

#### Projects
- `POST /api/apps/carousel-mix/projects` - Create project (0 credits)
- `GET /api/apps/carousel-mix/projects` - List user's projects (0 credits)
- `GET /api/apps/carousel-mix/projects/:id` - Get project details (0 credits)
- `PUT /api/apps/carousel-mix/projects/:id` - Update project (0 credits)
- `DELETE /api/apps/carousel-mix/projects/:id` - Delete project (0 credits)

#### Slides
- `POST /api/apps/carousel-mix/projects/:id/slides` - Upload slide (0 credits)
- `DELETE /api/apps/carousel-mix/slides/:id` - Delete slide (0 credits)
- `PUT /api/apps/carousel-mix/slides/:id/order` - Reorder slides (0 credits)

#### Texts
- `POST /api/apps/carousel-mix/projects/:id/texts` - Add text (0 credits)
- `PUT /api/apps/carousel-mix/texts/:id` - Update text settings (0 credits)
- `DELETE /api/apps/carousel-mix/texts/:id` - Delete text (0 credits)

#### Generation
- `GET /api/apps/carousel-mix/projects/:id/combinations` - Calculate possible combinations (0 credits)
- `POST /api/apps/carousel-mix/projects/:id/generate` - Generate carousels (CREDITS BASED ON SLIDES)
- `GET /api/apps/carousel-mix/projects/:id/generations` - Get generation history (0 credits)
- `GET /api/apps/carousel-mix/generations/:id/download` - Download result ZIP (0 credits)

#### Stats
- `GET /api/apps/carousel-mix/stats` - User stats (0 credits)

---

## Credit Calculation Logic

```typescript
function calculateCredits(numSlides: number): number {
  // Per 2 slides = 1 credit
  // Max 8 slides = 4 credits
  if (numSlides < 2) return 0
  if (numSlides > 8) return 4 // Cap at 8 slides

  return Math.ceil(numSlides / 2)
}

// Examples:
// 2 slides → 1 credit
// 3 slides → 2 credits
// 4 slides → 2 credits
// 5 slides → 3 credits
// 6 slides → 3 credits
// 7 slides → 4 credits
// 8 slides → 4 credits
```

---

## Combination Algorithm

### Logic

Given:
- N slides
- M text overlays
- User wants X carousel sets

Calculate all possible combinations of:
- Slide order permutations
- Text placement on slides

```typescript
// Simplified example
function calculatePossibleCombinations(
  numSlides: number,
  numTexts: number
): number {
  // Factorial for slide permutations
  const slidePermutations = factorial(numSlides)

  // Each text can go on any slide (or none)
  const textCombinations = Math.pow(numSlides + 1, numTexts)

  return slidePermutations * textCombinations
}
```

---

## Generation Process

### Step-by-Step

1. **Validate Input**
   - Check slides exist
   - Check slide count (2-8)
   - Check credit balance

2. **Calculate Combinations**
   - Generate all possible orders
   - Shuffle or pick random combinations
   - Limit to user's requested count

3. **For Each Combination**
   - Create temporary folder
   - Copy slides in order
   - Apply text overlays using canvas/sharp
   - Save to output folder

4. **Package Results**
   - Create ZIP file with all sets
   - Structure:
     ```
     carousel_generation_123.zip
     ├── set_001/
     │   ├── slide_1.jpg
     │   ├── slide_2.jpg
     │   └── ...
     ├── set_002/
     │   └── ...
     └── set_003/
         └── ...
     ```

5. **Update Database**
   - Mark generation as completed
   - Update output path
   - Record completion time

---

## Frontend Implementation

### Component Structure

```
frontend/src/apps/CarouselMix/
├── index.tsx (main page)
├── components/
│   ├── ProjectCard.tsx
│   ├── SlideUploader.tsx
│   ├── TextEditor.tsx
│   ├── CombinationPreview.tsx
│   ├── GenerationForm.tsx
│   └── GenerationHistory.tsx
└── hooks/
    ├── useCarouselProject.ts
    └── useGenerations.ts
```

### Main Page Layout

```
┌─────────────────────────────────────────────────┐
│  Carousel Mix                    Credits: 100   │
├─────────────────────────────────────────────────┤
│  [+ New Project]                                │
├─────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌───────────────┐          │
│  │ Project 1     │  │ Project 2     │          │
│  │ 5 slides      │  │ 3 slides      │          │
│  │ 2 texts       │  │ 1 text        │          │
│  └───────────────┘  └───────────────┘          │
└─────────────────────────────────────────────────┘
```

### Project Detail Page

```
┌─────────────────────────────────────────────────┐
│  ← Back to Projects      Project: Summer Promo │
├─────────────────────────────────────────────────┤
│  SLIDES (5/8)                                   │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ [+ Upload]│
│  │Img1│ │Img2│ │Img3│ │Img4│ │Img5│           │
│  └────┘ └────┘ └────┘ └────┘ └────┘           │
├─────────────────────────────────────────────────┤
│  TEXT OVERLAYS (2)               [+ Add Text]  │
│  • "Big Sale!" (center, 32px)                  │
│  • "Up to 50% OFF" (bottom-center, 24px)       │
├─────────────────────────────────────────────────┤
│  GENERATION                                     │
│  Possible combinations: 120                     │
│  Generate how many sets? [  5  ] [Calculate]   │
│  Cost: 3 credits (6 slides × 5 sets)           │
│  [Generate Carousels]                          │
├─────────────────────────────────────────────────┤
│  HISTORY                                        │
│  • Oct 2, 10:30 - 5 sets - Completed [Download]│
│  • Oct 1, 15:45 - 3 sets - Processing...       │
└─────────────────────────────────────────────────┘
```

---

## Implementation Checklist

### Phase 1: Database Setup ✅
- [ ] Add Prisma models to schema.prisma
- [ ] Run migration: `bun prisma migrate dev --name add-carousel-mix`
- [ ] Verify tables created

### Phase 2: Backend Core ✅
- [ ] Create plugin.config.ts
- [ ] Create carousel.repository.ts
- [ ] Create carousel.service.ts
- [ ] Create combination.service.ts
- [ ] Create routes.ts with credit middleware
- [ ] Register plugin in loader.ts

### Phase 3: File Upload ✅
- [ ] Setup multer for image/video upload
- [ ] Add file validation (JPG, PNG, MP4)
- [ ] Implement storage helpers
- [ ] Test upload endpoint

### Phase 4: Text Overlay ✅
- [ ] Install canvas/sharp for image manipulation
- [ ] Implement text rendering on images
- [ ] Support all 9 position options
- [ ] Support font customization

### Phase 5: Generation Logic ✅
- [ ] Implement combination algorithm
- [ ] Create carousel generator worker
- [ ] Generate output folders
- [ ] Create ZIP packaging
- [ ] Test full generation flow

### Phase 6: Frontend UI ✅
- [ ] Create CarouselMix main page
- [ ] Build ProjectCard component
- [ ] Build SlideUploader component
- [ ] Build TextEditor component
- [ ] Build CombinationPreview component
- [ ] Build GenerationForm component
- [ ] Build GenerationHistory component
- [ ] Add routing in App.tsx

### Phase 7: Integration & Testing ✅
- [ ] Test project CRUD
- [ ] Test slide upload
- [ ] Test text management
- [ ] Test combination calculation
- [ ] Test generation with credits
- [ ] Test download functionality
- [ ] Test error handling
- [ ] Test insufficient credits scenario

---

## Technical Dependencies

### Backend
```json
{
  "sharp": "^0.32.0",        // Image manipulation
  "archiver": "^6.0.0",      // ZIP creation
  "uuid": "^9.0.0"           // Unique IDs
}
```

### Frontend
```json
{
  "react-dropzone": "^14.0.0",  // File upload
  "lucide-react": "latest"       // Icons (layers, upload, etc)
}
```

---

## Credit Cost Summary

| Action | Credits |
|--------|---------|
| Create project | 0 |
| Upload slide | 0 |
| Add text | 0 |
| Generate 2-slide carousel | 1 |
| Generate 4-slide carousel | 2 |
| Generate 6-slide carousel | 3 |
| Generate 8-slide carousel | 4 |

**Note:** Cost is per carousel set. If generating 5 sets of 4-slide carousels, total cost = 2 credits × 5 = 10 credits.

---

## Error Handling

### Common Scenarios

1. **Insufficient Credits**
   - Return 402 Payment Required
   - Message: "You need X more credits to generate this carousel"

2. **Invalid Slide Count**
   - Return 400 Bad Request
   - Message: "Carousel must have between 2-8 slides"

3. **Missing Slides**
   - Return 400 Bad Request
   - Message: "Please upload at least 2 slides"

4. **Generation Failure**
   - Mark generation as "failed"
   - Save error message
   - Refund credits automatically

5. **File Too Large**
   - Return 413 Payload Too Large
   - Message: "File must be under 50MB"

---

## Future Enhancements

- [ ] Video slide support with thumbnail preview
- [ ] Advanced text effects (shadow, outline, gradient)
- [ ] Template library for common carousel types
- [ ] Batch text application (apply same text to multiple slides)
- [ ] Preview generator before actual generation
- [ ] Export to PDF format
- [ ] Social media direct posting (Instagram API)
- [ ] AI-powered text suggestions
- [ ] Collaboration features (share projects)

---

## Testing Scenarios

### Unit Tests
- Combination calculation accuracy
- Credit calculation logic
- File validation
- Text overlay positioning

### Integration Tests
- Full project creation flow
- Upload → Generate → Download
- Credit deduction and refund
- Error handling paths

### E2E Tests
- User creates project
- User uploads 4 slides
- User adds 2 texts
- User generates 3 sets
- User downloads ZIP
- Verify credit balance updated

---

## Performance Considerations

### Bottlenecks
- Image manipulation (CPU-intensive)
- ZIP creation for large generations
- Concurrent generations

### Optimizations
- Use worker threads for generation
- Implement job queue (BullMQ)
- Cache combination calculations
- Compress images before processing
- Limit concurrent generations per user

### Scaling
- Current: Synchronous processing (dev only)
- Phase 2: Background workers + Redis
- Phase 3: Separate worker servers
- Phase 4: CDN for downloads

---

## Security Considerations

- Validate file types (prevent executable upload)
- Scan uploaded files for malware
- Rate limit upload endpoints
- Implement file size limits (50MB)
- Sanitize text input (prevent XSS)
- Verify project ownership before operations
- Auto-delete old generations (after 30 days)

---

## Monitoring & Analytics

### Metrics to Track
- Total carousels generated
- Average slides per carousel
- Most popular slide counts
- Generation success rate
- Average generation time
- Total credits consumed
- User retention (repeat usage)

### Endpoints
- `GET /api/apps/carousel-mix/stats` - User stats
- Dashboard shows:
  - Total projects
  - Total carousels generated
  - Total slides uploaded
  - Credits used

---

## Documentation

### User Guide Topics
1. How to create a project
2. Uploading slides
3. Adding text overlays
4. Understanding combinations
5. Generating carousels
6. Downloading results
7. Managing projects

### API Documentation
- OpenAPI/Swagger spec
- Authentication requirements
- Rate limits
- Error codes
- Example requests/responses

---

## Support & Troubleshooting

### Common Issues

**Q: Why can't I upload more than 8 slides?**
A: Instagram carousel limit is 10, but we cap at 8 to maintain quality and cost.

**Q: How are combinations calculated?**
A: We use permutations of slide order multiplied by text placement options.

**Q: Can I preview before generating?**
A: Currently no, but it's planned for future updates.

**Q: What if generation fails?**
A: Credits are automatically refunded, and you can retry.

**Q: Can I edit after generating?**
A: No, but you can create a new project with modified settings.

---

## References

- [PLUGIN_ARCHITECTURE.md](./PLUGIN_ARCHITECTURE.md) - Plugin system guide
- [ADD_NEW_APP_PROMPT.md](./ADD_NEW_APP_PROMPT.md) - App creation template
- [CURRENT_ARCHITECTURE.md](./CURRENT_ARCHITECTURE.md) - System architecture
- [VIDEO_MIXER_CHANGELOG.md](./VIDEO_MIXER_CHANGELOG.md) - Similar app example

---

**Ready for Implementation:** Yes
**Estimated Development Time:** 2-3 days
**Complexity:** Medium
**Priority:** High (user requested)

---

Built with ❤️ for Lumiku AI Suite
