# Export Formats - Quick Reference

Quick copy-paste examples for using the export format system.

## Generate with Exports

```typescript
POST /api/apps/pose-generator/generate
{
  "projectId": "proj_abc123",
  "generationType": "GALLERY_REFERENCE",
  "selectedPoseIds": ["pose_1", "pose_2"],
  "batchSize": 4,
  "exportFormats": [
    "instagram_post",
    "instagram_story",
    "shopee_product"
  ]
}
```

## Download ZIP

```bash
# All formats
curl -O -J "http://localhost:3000/api/apps/pose-generator/generations/{generationId}/export-zip" \
  -H "Authorization: Bearer $TOKEN"

# Specific formats
curl -O -J "http://localhost:3000/api/apps/pose-generator/generations/{generationId}/export-zip?formats=instagram_post,shopee_product" \
  -H "Authorization: Bearer $TOKEN"
```

## Regenerate Single Format

```bash
curl -X POST "http://localhost:3000/api/apps/pose-generator/poses/{poseId}/regenerate-export" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"format": "instagram_story"}'
```

## All Available Formats

### Social Media (5)
- `instagram_story` - 1080x1920
- `instagram_feed` - 1080x1080
- `instagram_portrait` - 1080x1350
- `tiktok` - 1080x1920
- `facebook_post` - 1200x630
- `twitter_post` - 1200x675
- `linkedin_post` - 1200x627

### E-Commerce (3)
- `shopee_product` - 1000x1000
- `tokopedia_product` - 1200x1200
- `lazada_product` - 1000x1000

### Print (2)
- `print_a4` - 2480x3508
- `print_4x6` - 1800x1200

### Special (1)
- `original` - No resize

## Recommended Presets

```javascript
// Social media influencer
const socialFormats = [
  'instagram_story',
  'instagram_feed',
  'tiktok',
  'facebook_post'
]

// E-commerce seller
const ecommerceFormats = [
  'shopee_product',
  'tokopedia_product',
  'lazada_product',
  'original'
]

// Professional use
const professionalFormats = [
  'linkedin_post',
  'twitter_post',
  'original'
]

// All platforms
const allFormats = [
  'instagram_story',
  'instagram_feed',
  'tiktok',
  'shopee_product',
  'tokopedia_product',
  'facebook_post'
]
```

## Response Structure

```typescript
// Pose with exports
{
  "id": "pose_123",
  "outputImageUrl": "/uploads/poses/gen_abc/pose_123.png",
  "thumbnailUrl": "/uploads/poses/gen_abc/pose_123_thumb.png",
  "exportFormats": {
    "instagram_post": "/uploads/poses/gen_abc/exports/pose_123_instagram_post.jpg",
    "instagram_story": "/uploads/poses/gen_abc/exports/pose_123_instagram_story.jpg",
    "shopee_product": "/uploads/poses/gen_abc/exports/pose_123_shopee_product.jpg"
  }
}
```

## Code Example (TypeScript)

```typescript
import { exportService } from './services/export.service'

// Generate exports
const exportUrls = await exportService.generateExports({
  sourceImagePath: '/uploads/poses/gen_abc/pose_123.png',
  generationId: 'gen_abc',
  poseId: 'pose_123',
  selectedFormats: ['instagram_post', 'shopee_product'],
})

// Create ZIP
const zipBuffer = await exportService.createExportZip({
  generationId: 'gen_abc',
  poseIds: ['pose_123', 'pose_456'],
  formats: ['instagram_story', 'tiktok'],
})

// Regenerate format
const newUrl = await exportService.regenerateExport({
  sourceImagePath: '/uploads/poses/gen_abc/pose_123.png',
  generationId: 'gen_abc',
  poseId: 'pose_123',
  formatName: 'instagram_story',
})
```

## Testing Commands

```bash
# Test export generation
npm run test:exports

# Check export files
ls -la /app/backend/uploads/poses/*/exports/

# Verify database
# SELECT "exportFormats" FROM "GeneratedPose" WHERE id = 'pose_123';

# Test ZIP download
curl -O -J http://localhost:3000/api/apps/pose-generator/generations/gen_123/export-zip \
  -H "Authorization: Bearer test_token"
unzip -l poses-gen_123.zip
```

## Error Codes

| Code | Message | Solution |
|------|---------|----------|
| 400  | Invalid format | Check format name against available formats |
| 403  | Forbidden | Verify you own the generation/pose |
| 404  | Not found | Check generation/pose ID exists |
| 500  | Internal error | Check server logs, retry operation |

## Performance Tips

1. **Parallel Generation**: Request multiple formats at once
2. **Selective Formats**: Only generate formats you'll use
3. **ZIP for Bulk**: Use ZIP download for multiple poses
4. **Regenerate Sparingly**: Exports persist, no need to regenerate

## Cost

**All export operations are FREE** - no credits charged!

---

For full documentation, see [EXPORT_FORMATS.md](./EXPORT_FORMATS.md)
