# 📚 Avatar Creator - Implementation Reference & Error Prevention

**Purpose**: Quick reference untuk implementation Phase 2-8
**Avoid**: Common errors dan bugs
**Ensure**: Seamless integration dengan Lumiku ecosystem

---

## 🗺️ Lumiku Architecture Patterns

### 1. File Structure Pattern
```
backend/src/apps/{app-name}/
├── plugin.config.ts       # Plugin metadata + config
├── routes.ts              # Hono route handlers
├── types.ts               # TypeScript interfaces
├── services/              # Business logic
│   └── {app}.service.ts
├── repositories/          # Database queries
│   └── {app}.repository.ts
├── workers/               # Background jobs (BullMQ)
│   └── {worker}.worker.ts
└── providers/             # External APIs
    └── {provider}.provider.ts
```

**✅ Avatar Creator follows this**

### 2. Route Handler Pattern
```typescript
// Pattern used in carousel-mix, video-mixer:
app.post('/endpoint', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const body = await c.req.json() // or parseBody() for multipart

    // Validation
    if (!body.field) {
      return c.json({ error: 'Field required' }, 400)
    }

    // Service call
    const result = await service.doSomething(userId, body)

    return c.json({ data: result })
  } catch (error: any) {
    console.error('Error:', error)
    return c.json({ error: error.message || 'Failed' }, 500)
  }
})
```

### 3. Service Layer Pattern
```typescript
// Business logic separation
export class AvatarCreatorService {
  async createAvatar(userId: string, data: CreateData) {
    // 1. Validate input
    // 2. Process files/data
    // 3. Call repository
    // 4. Return result

    const avatar = await repository.createAvatar({
      userId,
      ...processedData
    })

    return avatar
  }
}

// Singleton export
export const avatarService = new AvatarCreatorService()
```

### 4. Repository Pattern
```typescript
// Pure database operations
export async function findByUserId(userId: string) {
  return prisma.model.findMany({
    where: { userId },
    include: { relations: true },
    orderBy: { createdAt: 'desc' }
  })
}

// ❌ DON'T: Business logic in repository
// ✅ DO: Only Prisma queries
```

---

## 🚨 Common Errors & Solutions

### Error 1: Prisma Client Not Generated
```
Error: Cannot find module '@prisma/client'
```

**Solution:**
```bash
cd backend
npx prisma generate
```

**When to run:**
- After schema changes
- After git pull
- After migration

### Error 2: Type Mismatch (Prisma vs TypeScript)
```
Type 'string | null' is not assignable to type 'string'
```

**Solution:**
```typescript
// ❌ Wrong:
const name: string = avatar.personaName

// ✅ Correct:
const name: string = avatar.personaName || ''
// Or:
const name: string | null = avatar.personaName
```

### Error 3: Multipart Form-Data Not Parsed
```
Error: req.parseBody is not a function
```

**Solution:**
```typescript
// For file uploads:
const body = await c.req.parseBody()
const file = body.image as File

// For JSON:
const body = await c.req.json()
```

### Error 4: File Upload Path Issues
```
Error: ENOENT: no such file or directory
```

**Solution:**
```typescript
import path from 'path'
import fs from 'fs/promises'

// Create directory first
const uploadDir = path.join(process.cwd(), 'uploads', 'avatar-creator', userId)
await fs.mkdir(uploadDir, { recursive: true })

// Then save file
const filename = `${Date.now()}-${file.name}`
const filepath = path.join(uploadDir, filename)
await fs.writeFile(filepath, Buffer.from(await file.arrayBuffer()))

// Save relative path in DB (not absolute!)
const relativePath = `/uploads/avatar-creator/${userId}/${filename}`
```

### Error 5: Foreign Key Constraint Failed
```
Error: Foreign key constraint failed on the field: `projectId`
```

**Solution:**
```typescript
// Always verify parent exists
const project = await repository.findProjectById(projectId, userId)
if (!project) {
  throw new Error('Project not found')
}

// Then create child
const avatar = await repository.createAvatar({
  projectId,
  ...
})
```

### Error 6: JSON Parse Error
```
Error: Unexpected token in JSON at position 0
```

**Solution:**
```typescript
// Stringify before saving
personaPersonality: JSON.stringify(["friendly", "professional"])

// Parse when reading
const personality: string[] = avatar.personaPersonality
  ? JSON.parse(avatar.personaPersonality)
  : []
```

### Error 7: HuggingFace Model Loading
```
Error: Model is currently loading. Estimated time: 20s
```

**Solution:**
```typescript
// Use built-in retry mechanism
const result = await hfClient.withRetry(
  () => hfClient.fluxTextToImage(params),
  3, // max retries
  5000 // base delay
)

// Or handle manually
try {
  const result = await hfClient.fluxTextToImage(params)
} catch (error: any) {
  if (error.message === 'MODEL_LOADING') {
    // Queue for retry or return pending status
    await updateGenerationStatus(id, 'pending')
  }
}
```

### Error 8: Queue Worker Not Processing
```
Jobs stuck in pending status
```

**Solution:**
```bash
# Check Redis
redis-cli ping
# Should return: PONG

# Check worker is running
ps aux | grep worker
# Or with PM2:
pm2 list

# Check queue
curl http://localhost:3000/api/queue/status
```

**Start worker:**
```bash
cd backend
node dist/workers/avatar-generator.worker.js
# Or:
pm2 start dist/workers/avatar-generator.worker.js --name avatar-worker
```

### Error 9: Image Too Large
```
Error: Request entity too large
```

**Solution:**
```typescript
// Add validation
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

if (file.size > MAX_FILE_SIZE) {
  return c.json({ error: 'File too large (max 10MB)' }, 400)
}

if (!ALLOWED_TYPES.includes(file.type)) {
  return c.json({ error: 'Invalid file type' }, 400)
}
```

### Error 10: Zustand State Not Updating (Frontend)
```
State changes but UI doesn't update
```

**Solution:**
```typescript
// ❌ Wrong with immer:
set((state) => {
  state.currentProject.avatars = [newAvatar, ...state.currentProject.avatars]
})

// ✅ Correct with immer:
set((state) => {
  state.currentProject.avatars.unshift(newAvatar)
})

// Or without immer:
set({ currentProject: {
  ...state.currentProject,
  avatars: [newAvatar, ...state.currentProject.avatars]
}})
```

---

## 📋 Phase-by-Phase Checklist

### Phase 2: Basic API + Service
- [ ] Service class created
- [ ] File upload handling
- [ ] Thumbnail generation (sharp)
- [ ] All CRUD routes implemented
- [ ] Error handling in all endpoints
- [ ] Test with curl

### Phase 3: FLUX Generation
- [ ] Prompt builder function
- [ ] FLUX provider created
- [ ] Queue setup (avatarQueue)
- [ ] Worker created and tested
- [ ] Status updates working
- [ ] Images saving correctly

### Phase 4: Frontend Core
- [ ] Store enhanced
- [ ] Projects list view
- [ ] Project detail view
- [ ] Upload modal
- [ ] Avatar cards displaying
- [ ] Delete confirmations

### Phase 5: Frontend AI
- [ ] Generate tab in modal
- [ ] Prompt builder UI
- [ ] Attributes selectors
- [ ] Generation progress
- [ ] Auto-refresh on complete

### Phase 6: Presets
- [ ] Seed data script
- [ ] Preset gallery component
- [ ] Persona selector component
- [ ] One-click apply
- [ ] Category filtering

### Phase 7: Advanced
- [ ] Usage tracking working
- [ ] Detail modal complete
- [ ] Public API for apps
- [ ] Search & filter
- [ ] Edit avatar working

### Phase 8: Polish
- [ ] All loading states
- [ ] Error messages friendly
- [ ] Mobile responsive
- [ ] Performance optimized
- [ ] No console errors

---

## 🔗 Key File References

### Backend
| File | Line Numbers | Purpose |
|------|--------------|---------|
| `huggingface-client.ts` | 122-190 | FLUX generation |
| `queue.ts` | 1-204 | Queue setup pattern |
| `storage.ts` | (exists) | File storage helper |
| `carousel-mix/routes.ts` | Full file | Route pattern example |
| `video-mixer/services/*.service.ts` | Full file | Service pattern example |

### Frontend
| File | Line Numbers | Purpose |
|------|--------------|---------|
| `carouselMixStore.ts` | Full file | Zustand + immer pattern |
| `CarouselMix.tsx` | 1-273 | Project list/detail pattern |
| `CreateProjectModal.tsx` | Full file | Modal pattern |
| `App.tsx` | 16, 57-58 | Routing pattern |
| `Dashboard.tsx` | 240-288 | App card rendering |

---

## 🎨 UI/UX Patterns

### Color System
```typescript
// Avatar Creator theme: Purple
const colors = {
  bg: 'bg-purple-50',
  text: 'text-purple-700',
  button: 'bg-purple-600 hover:bg-purple-700',
  border: 'border-purple-300',
  badge: 'bg-purple-100 text-purple-700'
}
```

### Loading States
```typescript
// Always show loading
{isLoading ? (
  <div className="flex items-center justify-center py-8">
    <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
    <span className="ml-2">Loading...</span>
  </div>
) : (
  <Content />
)}
```

### Error Handling
```typescript
// User-friendly messages
try {
  await action()
  alert('Success!') // Or toast notification
} catch (error: any) {
  const message = error.response?.data?.error || error.message || 'Something went wrong'
  alert(message)
}
```

---

## 🚀 Performance Tips

### 1. Lazy Load Images
```typescript
<img
  src={avatar.thumbnailUrl || avatar.baseImageUrl}
  alt={avatar.name}
  loading="lazy"
  className="w-full h-full object-cover"
/>
```

### 2. Pagination
```typescript
// Don't load all avatars at once
const limit = 20
const { avatars, total } = await repository.findAvatarsByUserId(userId, limit, offset)
```

### 3. Thumbnail Generation
```typescript
import sharp from 'sharp'

// Create thumbnail on upload
const thumbnail = await sharp(buffer)
  .resize(300, 300, { fit: 'cover' })
  .jpeg({ quality: 80 })
  .toBuffer()

await fs.writeFile(thumbnailPath, thumbnail)
```

### 4. Memoization (Frontend)
```typescript
import { useMemo } from 'react'

const filteredAvatars = useMemo(() => {
  return avatars.filter(a => a.gender === selectedGender)
}, [avatars, selectedGender])
```

---

## 📝 Environment Variables

```env
# Already exists
HUGGINGFACE_API_KEY=hf_xxx
FLUX_MODEL=black-forest-labs/FLUX.1-dev
FLUX_LORA_MODEL=XLabs-AI/flux-RealismLora

# May need to add
AVATAR_STORAGE_PATH=uploads/avatar-creator
AVATAR_MAX_FILE_SIZE=10485760
AVATAR_THUMBNAIL_SIZE=300
```

---

## ✅ Testing Commands

### Backend API Testing
```bash
# Health check
curl http://localhost:3000/api/apps/avatar-creator/health

# Create project
curl -X POST http://localhost:3000/api/apps/avatar-creator/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Project","description":"My first project"}'

# Upload avatar
curl -X POST http://localhost:3000/api/apps/avatar-creator/projects/{id}/avatars/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@avatar.jpg" \
  -F "name=Test Avatar" \
  -F "gender=female" \
  -F "ageRange=adult"

# Generate avatar
curl -X POST http://localhost:3000/api/apps/avatar-creator/projects/{id}/avatars/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"AI Avatar",
    "prompt":"Professional Indonesian woman with hijab",
    "gender":"female",
    "ageRange":"adult"
  }'
```

### Database Testing
```sql
-- Check avatar created
SELECT id, name, sourceType, createdAt FROM avatars WHERE userId = 'xxx';

-- Check persona data
SELECT personaName, personaAge, personaPersonality FROM avatars WHERE id = 'xxx';

-- Check usage
SELECT COUNT(*) FROM avatar_usage_history WHERE avatarId = 'xxx';
```

---

## 🎯 Success Metrics

**Phase 2:**
- ✅ Can create project via API
- ✅ Can upload avatar
- ✅ Thumbnail generated
- ✅ Files saved correctly

**Phase 3:**
- ✅ AI generation completes successfully
- ✅ Image quality is photo-realistic
- ✅ Queue processing works
- ✅ Status updates correctly

**Phase 4-7:**
- ✅ Full UI workflow works
- ✅ No errors in console
- ✅ Fast page loads (<3s)
- ✅ Mobile responsive

**Phase 8:**
- ✅ Production ready
- ✅ All tests passing
- ✅ Documentation complete

---

**Last Updated**: 2025-10-13
**Maintainer**: Claude (Sonnet 4.5)
**Purpose**: Quick reference for Avatar Creator development
