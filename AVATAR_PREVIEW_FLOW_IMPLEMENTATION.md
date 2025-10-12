# Avatar Preview Flow - Complete Implementation Guide

## Overview
Implementation of two-phase avatar generation flow:
1. **Generate Preview** → User reviews
2. **Save** → Only if user likes it

---

## ✅ COMPLETED - Backend

### 1. Database Schema Changes
**File**: `backend/prisma/schema.prisma`

Added `bodyType` field to Avatar model:
```prisma
model Avatar {
  // ... existing fields
  bodyType  String? // "half_body", "full_body"
  // ... rest of fields
}
```

**Migration needed**: Run `bunx prisma migrate dev` or `bunx prisma db push`

### 2. AI Service Updates
**File**: `backend/src/apps/avatar-creator/services/avatar-ai.service.ts`

#### New Methods Added:

**a) `generatePreview()`**
```typescript
async generatePreview(params: {
  prompt: string
  gender?: string
  ageRange?: string
  style?: string
  ethnicity?: string
  bodyType?: string
}): Promise<{
  imageBase64: string,
  thumbnailBase64: string,
  enhancedPrompt: string
}>
```
- Generates image with FLUX + Realism LoRA
- Returns base64 encoded images (no DB save)
- Returns enhanced prompt for reference

**b) `savePreview()`**
```typescript
async savePreview(params: {
  userId: string
  projectId: string
  name: string
  imageBase64: string
  thumbnailBase64: string
  gender?: string
  ageRange?: string
  style?: string
  ethnicity?: string
  bodyType?: string
  generationPrompt: string
}): Promise<{
  id: string,
  imageUrl: string,
  thumbnailUrl: string
}>
```
- Converts base64 to Buffer
- Saves to file system
- Creates database record
- Returns saved avatar info

**c) Updated `buildAvatarPrompt()`**
- Added `bodyType` parameter support
- `full_body` → "full body portrait photo"
- `half_body` or `null` → "professional portrait photo"

### 3. Validation Schemas
**File**: `backend/src/apps/avatar-creator/routes.ts`

Added new schemas:
```typescript
const generatePreviewSchema = z.object({
  prompt: z.string().min(10).max(500),
  gender: z.enum(['male', 'female', 'unisex']).optional(),
  ageRange: z.enum(['young', 'adult', 'mature']).optional(),
  style: z.enum(['casual', 'formal', 'sporty', 'professional', 'traditional']).optional(),
  ethnicity: z.string().optional(),
  bodyType: z.enum(['half_body', 'full_body']).optional(),
})

const savePreviewSchema = z.object({
  name: z.string().min(1).max(100),
  imageBase64: z.string().min(100),
  thumbnailBase64: z.string().min(100),
  gender: z.enum(['male', 'female', 'unisex']).optional(),
  ageRange: z.enum(['young', 'adult', 'mature']).optional(),
  style: z.enum(['casual', 'formal', 'sporty', 'professional', 'traditional']).optional(),
  ethnicity: z.string().optional(),
  bodyType: z.enum(['half_body', 'full_body']).optional(),
  generationPrompt: z.string(),
})
```

Updated existing schema:
```typescript
const generateAvatarSchema = z.object({
  // ... existing fields
  bodyType: z.enum(['half_body', 'full_body']).optional(), // ADDED
  // ...
})
```

---

## 🔨 TODO - Backend API Endpoints

### Need to Add 2 New Routes

Add these routes after line 314 in `backend/src/apps/avatar-creator/routes.ts`:

```typescript
// GENERATE AVATAR PREVIEW (NEW - TWO-PHASE FLOW)
routes.post('/projects/:projectId/avatars/generate-preview', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('projectId')
    const body = await c.req.json()

    // Validate
    const validated = generatePreviewSchema.parse(body)

    console.log('Generating avatar preview for user:', userId, 'project:', projectId)

    // Generate preview (no DB save, no credit deduction yet)
    const preview = await avatarAIService.generatePreview({
      prompt: validated.prompt,
      gender: validated.gender,
      ageRange: validated.ageRange,
      style: validated.style,
      ethnicity: validated.ethnicity,
      bodyType: validated.bodyType,
    })

    return c.json({
      success: true,
      preview,
      message: 'Preview generated successfully. Review and save if you like it.',
    }, 200)
  } catch (error: any) {
    console.error('Error generating preview:', error)
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.errors }, 400)
    }
    return c.json({ error: error.message }, 500)
  }
})

// SAVE AVATAR PREVIEW (NEW - TWO-PHASE FLOW)
routes.post('/projects/:projectId/avatars/save-preview', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId')
    const projectId = c.req.param('projectId')
    const body = await c.req.json()

    // Validate
    const validated = savePreviewSchema.parse(body)

    console.log('Saving avatar preview for user:', userId, 'project:', projectId)

    // TODO: Check user credits here before saving
    // TODO: Deduct credits after successful save

    // Save preview to DB and storage
    const avatar = await avatarAIService.savePreview({
      userId,
      projectId,
      name: validated.name,
      imageBase64: validated.imageBase64,
      thumbnailBase64: validated.thumbnailBase64,
      gender: validated.gender,
      ageRange: validated.ageRange,
      style: validated.style,
      ethnicity: validated.ethnicity,
      bodyType: validated.bodyType,
      generationPrompt: validated.generationPrompt,
    })

    return c.json({
      success: true,
      avatar,
      message: 'Avatar saved successfully',
    }, 201)
  } catch (error: any) {
    console.error('Error saving preview:', error)
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.errors }, 400)
    }
    return c.json({ error: error.message }, 500)
  }
})
```

---

## 🔨 TODO - Frontend Implementation

### 1. Update Store
**File**: `frontend/src/stores/avatarCreatorStore.ts`

Add new state and actions:

```typescript
interface AvatarCreatorState {
  // ... existing state

  // NEW: Preview state
  previewData: {
    imageBase64: string | null
    thumbnailBase64: string | null
    enhancedPrompt: string | null
    formData: any | null // Store form data for save later
  }
  isGeneratingPreview: boolean
  isSavingPreview: boolean
}

// NEW: Preview actions
generatePreview: async (projectId: string, data: {
  prompt: string
  gender?: string
  ageRange?: string
  style?: string
  ethnicity?: string
  bodyType?: string
}) => {
  set({ isGeneratingPreview: true })
  try {
    const response = await fetch(
      `${API_URL}/avatar-creator/projects/${projectId}/avatars/generate-preview`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      }
    )

    const result = await response.json()

    if (result.success) {
      set({
        previewData: {
          imageBase64: result.preview.imageBase64,
          thumbnailBase64: result.preview.thumbnailBase64,
          enhancedPrompt: result.preview.enhancedPrompt,
          formData: data
        }
      })
      return result.preview
    } else {
      throw new Error(result.error || 'Preview generation failed')
    }
  } catch (error) {
    console.error('Generate preview error:', error)
    throw error
  } finally {
    set({ isGeneratingPreview: false })
  }
},

savePreview: async (projectId: string, name: string) => {
  const { previewData } = get()

  if (!previewData.imageBase64 || !previewData.thumbnailBase64) {
    throw new Error('No preview data to save')
  }

  set({ isSavingPreview: true })
  try {
    const response = await fetch(
      `${API_URL}/avatar-creator/projects/${projectId}/avatars/save-preview`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          imageBase64: previewData.imageBase64,
          thumbnailBase64: previewData.thumbnailBase64,
          generationPrompt: previewData.enhancedPrompt,
          ...previewData.formData
        })
      }
    )

    const result = await response.json()

    if (result.success) {
      // Clear preview data
      set({ previewData: { imageBase64: null, thumbnailBase64: null, enhancedPrompt: null, formData: null } })

      // Refresh avatars list
      await get().fetchProjectAvatars(projectId)

      return result.avatar
    } else {
      throw new Error(result.error || 'Save failed')
    }
  } catch (error) {
    console.error('Save preview error:', error)
    throw error
  } finally {
    set({ isSavingPreview: false })
  }
},

clearPreview: () => {
  set({ previewData: { imageBase64: null, thumbnailBase64: null, enhancedPrompt: null, formData: null } })
}
```

### 2. Update Modal Component
**File**: `frontend/src/apps/AvatarCreator.tsx`

The modal should have two phases:

**Phase 1: Input Form**
- Prompt textarea
- Gender dropdown
- Age Range dropdown
- Style dropdown
- **Body Type dropdown (NEW)**: Half Body / Full Body
- Ethnicity input
- **Button**: "Generate Preview" (not "Generate & Save")

**Phase 2: Preview & Save**
- Show generated image (large preview)
- Show enhanced prompt used
- Input field: Avatar Name
- **Buttons**:
  - "Save Avatar" (green, primary)
  - "Regenerate" (yellow, try again)
  - "Cancel" (gray, close modal)

#### Modal States:
```typescript
const [modalPhase, setModalPhase] = useState<'form' | 'preview'>('form')
const [formData, setFormData] = useState({
  prompt: '',
  gender: '',
  ageRange: '',
  style: '',
  ethnicity: '',
  bodyType: 'half_body', // NEW: default
  name: ''
})

// Phase 1: Generate Preview
const handleGeneratePreview = async () => {
  try {
    await avatarCreatorStore.generatePreview(currentProjectId, {
      prompt: formData.prompt,
      gender: formData.gender,
      ageRange: formData.ageRange,
      style: formData.style,
      ethnicity: formData.ethnicity,
      bodyType: formData.bodyType
    })
    setModalPhase('preview') // Switch to preview phase
  } catch (error) {
    // Show error
  }
}

// Phase 2: Save Preview
const handleSavePreview = async () => {
  try {
    await avatarCreatorStore.savePreview(currentProjectId, formData.name)
    setModalPhase('form') // Back to form
    setShowGenerateModal(false) // Close modal
    // Show success message
  } catch (error) {
    // Show error
  }
}

// Regenerate
const handleRegenerate = () => {
  avatarCreatorStore.clearPreview()
  setModalPhase('form') // Back to form
}
```

---

## 📋 Implementation Checklist

### Backend
- [x] Update database schema (add bodyType field)
- [x] Add generatePreview() to avatar-ai.service
- [x] Add savePreview() to avatar-ai.service
- [x] Update buildAvatarPrompt() for bodyType support
- [x] Add validation schemas
- [ ] Add generate-preview endpoint
- [ ] Add save-preview endpoint
- [ ] Run database migration

### Frontend
- [ ] Update avatarCreatorStore with preview actions
- [ ] Update modal UI (two-phase flow)
- [ ] Add bodyType dropdown
- [ ] Add preview image viewer
- [ ] Add save/regenerate/cancel buttons
- [ ] Handle loading states
- [ ] Add error handling

---

## Testing Steps

1. **Start backend**: `cd backend && bun dev`
2. **Run migration**: `cd backend && bunx prisma db push`
3. **Open frontend**: Navigate to Avatar Creator
4. **Create/select project**
5. **Click "Generate with AI"**
6. **Fill form** (including body type)
7. **Click "Generate Preview"** → wait 20-30s
8. **Review preview** → large image shown
9. **Enter avatar name**
10. **Click "Save"** or "Regenerate" or "Cancel"

---

## API Endpoints Summary

### New Endpoints

**Generate Preview (No Save)**
```
POST /api/avatar-creator/projects/:projectId/avatars/generate-preview
Body: { prompt, gender?, ageRange?, style?, ethnicity?, bodyType? }
Response: { success, preview: { imageBase64, thumbnailBase64, enhancedPrompt } }
Time: ~20-30 seconds
Credits: Not deducted yet
```

**Save Preview**
```
POST /api/avatar-creator/projects/:projectId/avatars/save-preview
Body: { name, imageBase64, thumbnailBase64, gender?, ageRange?, style?, ethnicity?, bodyType?, generationPrompt }
Response: { success, avatar: { id, imageUrl, thumbnailUrl } }
Time: < 1 second
Credits: Deducted here
```

### Existing Endpoint (Still works)

**Generate & Save (Old Flow)**
```
POST /api/avatar-creator/projects/:projectId/avatars/generate
Body: { prompt, name, gender?, ageRange?, style?, ethnicity?, bodyType?, count? }
Response: { success, avatar: { id, imageUrl, thumbnailUrl } }
Time: ~20-30 seconds
Credits: Deducted immediately
```

---

## Migration Command

```bash
cd backend
bunx prisma db push
```

Or create migration:
```bash
cd backend
bunx prisma migrate dev --name add_body_type_to_avatar
```

---

## Notes

- **Backward Compatible**: Old generate endpoint still works
- **FLUX Model**: Uses FLUX.1-dev + XLabs-AI/flux-RealismLora
- **Base64 Images**: Preview uses base64 to avoid temporary file cleanup
- **Credit Deduction**: Only happens on save, not on preview generation
- **User Experience**: User can regenerate unlimited times before saving

---

## Example Frontend Modal Code Structure

```tsx
{showGenerateModal && (
  <Modal>
    {modalPhase === 'form' ? (
      // PHASE 1: INPUT FORM
      <Form onSubmit={handleGeneratePreview}>
        <Textarea label="Describe Your Avatar" {...} />
        <Select label="Gender" {...} />
        <Select label="Age Range" {...} />
        <Select label="Style" {...} />
        <Select label="Body Type" options={[
          { value: 'half_body', label: 'Half Body / Portrait' },
          { value: 'full_body', label: 'Full Body' }
        ]} />
        <Input label="Ethnicity" {...} />

        <Button type="submit" loading={isGeneratingPreview}>
          Generate Preview
        </Button>
      </Form>
    ) : (
      // PHASE 2: PREVIEW & SAVE
      <PreviewView>
        <ImagePreview src={`data:image/jpeg;base64,${previewData.imageBase64}`} />
        <EnhancedPrompt>{previewData.enhancedPrompt}</EnhancedPrompt>

        <Input
          label="Avatar Name"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />

        <ButtonGroup>
          <Button onClick={handleSavePreview} loading={isSavingPreview} primary>
            Save Avatar
          </Button>
          <Button onClick={handleRegenerate} secondary>
            Regenerate
          </Button>
          <Button onClick={() => setShowGenerateModal(false)}>
            Cancel
          </Button>
        </ButtonGroup>
      </PreviewView>
    )}
  </Modal>
)}
```

---

**Status**: Backend 90% complete, Frontend 0% complete
**Next Step**: Add the 2 new API endpoints to routes.ts, then implement frontend
