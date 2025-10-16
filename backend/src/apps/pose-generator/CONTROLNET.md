# ControlNet Integration

## Current Implementation (Phase 4B)

### What's Implemented
1. **ControlNet Map Loading** - Loads pre-computed pose maps from library
2. **Map Caching** - Local cache to avoid re-downloading
3. **Pose Description Extraction** - Enhances prompts with pose-specific keywords
4. **Map Processing** - Resizes and normalizes maps for FLUX input

### Pose Guidance Strategy
Currently uses **prompt-based pose guidance**:
- Extracts keywords from pose name ("arms crossed", "standing", etc.)
- Adds detailed pose description to prompt
- Uses strong negative prompts to prevent anatomical errors

### Future: Full ControlNet
When FLUX.1-dev adds better ControlNet support:
- Pass skeleton image directly to model
- Control pose with strength parameter (0.5-1.0)
- Support custom pose uploads
- Real-time pose preview

## Usage

Pose generation automatically uses ControlNet if available:
```typescript
// No code changes needed - automatic!
POST /api/apps/pose-generator/generate
{
  "selectedPoseIds": ["pose_with_controlnet_map"]
}
```

## ControlNet Map Format

Pre-computed maps in pose library:
- **Format:** PNG, grayscale
- **Size:** 1024x1024 (recommended)
- **Content:** OpenPose skeleton or pose outline
- **Storage:** Local or CDN URL

## Cache Management

Maps are cached at `/app/backend/uploads/controlnet-cache/`

Clear cache (admin only):
```bash
rm -rf /app/backend/uploads/controlnet-cache/*
```

## Performance

- **First use:** 2-5 seconds (download + process)
- **Cached:** <100ms (load from disk)
- **Cache size:** ~1-5 MB per pose

## Troubleshooting

**Maps not loading:**
1. Check URL is accessible
2. Verify image format (PNG/JPEG only)
3. Check cache directory permissions

**Poor pose accuracy:**
1. Verify pose description is detailed
2. Check negative prompt includes anatomy keywords
3. Consider using higher guidance_scale (3.5 → 5.0)

## Technical Architecture

### ControlNetService

Located at: `backend/src/apps/pose-generator/services/controlnet.service.ts`

**Key Methods:**
- `loadControlNetMap(url)` - Downloads and caches pose maps
- `processForFlux(buffer, width, height)` - Processes maps for FLUX API
- `extractPoseDescription(libraryPose)` - Generates pose-specific prompt enhancements
- `clearCache()` - Maintenance method to clear cached maps

### Integration Flow

```
1. Worker receives generation job
   ↓
2. ControlNetService loads map from library pose
   ↓
3. Map is cached locally (if not already cached)
   ↓
4. Map is processed to target dimensions (1024x1024)
   ↓
5. Pose description is extracted from pose name/metadata
   ↓
6. FLUX API receives enhanced prompt + pose description
   ↓
7. Generated image follows pose guidance via prompt
```

### Prompt Enhancement Examples

**Input Pose:** "Standing Confident - Arms Crossed"
**Generated Description:** "standing upright, arms crossed over chest, confident expression, facing camera directly"

**Input Pose:** "Sitting Professional - Side View"
**Generated Description:** "sitting down, professional demeanor, side profile view"

**Input Pose:** "Walking Friendly - Waving"
**Generated Description:** "walking forward, waving hand gesture, friendly smile"

## Phase 4B+ Roadmap

### Short-term (When FLUX supports it)
- Direct ControlNet conditioning with skeleton images
- Adjustable pose strength (0.0 = ignore, 1.0 = strict adherence)
- Support multiple ControlNet types (pose, depth, canny)

### Long-term
- User-uploaded pose sketches
- Real-time pose preview in frontend
- Pose editor with adjustable keypoints
- ML-based pose analysis for better descriptions

## Health Check

The health check endpoint includes ControlNet status:

```bash
GET /api/apps/pose-generator/health
```

Response includes:
```json
{
  "checks": {
    "controlNet": {
      "status": "available",
      "cacheDir": "/app/backend/uploads/controlnet-cache",
      "message": "ControlNet map caching ready"
    }
  }
}
```

## Development Notes

### Adding ControlNet Maps to Pose Library

When seeding poses, include `controlNetMapUrl`:

```typescript
await prisma.poseLibrary.create({
  data: {
    name: "Standing Confident",
    description: "Professional standing pose with arms crossed",
    controlNetMapUrl: "/uploads/controlnet/standing-confident.png",
    previewImageUrl: "/uploads/poses/standing-confident-preview.jpg",
    // ... other fields
  }
})
```

### Testing ControlNet Integration

1. **Test map loading:**
```typescript
const buffer = await controlNetService.loadControlNetMap(url)
console.log(buffer ? 'Success' : 'Failed')
```

2. **Test pose description:**
```typescript
const description = controlNetService.extractPoseDescription({
  name: "Standing - Arms Crossed",
  description: "Confident professional stance"
})
console.log(description)
// Output: "standing upright, arms crossed over chest, confident expression, Confident professional stance"
```

3. **Test cache:**
```bash
# After first generation, check cache
ls -lh /app/backend/uploads/controlnet-cache/
```

## Credits & References

- **ControlNet Paper:** [Adding Conditional Control to Text-to-Image Diffusion Models](https://arxiv.org/abs/2302.05543)
- **FLUX.1-dev:** [Black Forest Labs](https://huggingface.co/black-forest-labs/FLUX.1-dev)
- **OpenPose:** Standard pose estimation format for ControlNet maps
