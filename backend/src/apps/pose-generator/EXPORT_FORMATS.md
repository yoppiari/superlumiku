# Export Formats Guide

**Phase 4D: Multi-Format Export System**

This guide documents the comprehensive export format system for the Pose Generator, optimized for Indonesian social media and e-commerce platforms.

## Available Formats

### Instagram Formats

#### `instagram_story`
- **Dimensions**: 1080x1920 (9:16 Vertical)
- **Format**: JPEG
- **Quality**: 90%
- **Use Case**: Instagram Stories, Reels preview
- **Notes**: Optimized for vertical mobile viewing

#### `instagram_feed`
- **Dimensions**: 1080x1080 (1:1 Square)
- **Format**: JPEG
- **Quality**: 85%
- **Use Case**: Instagram feed posts, grid layout
- **Notes**: Classic square format for feed consistency

#### `instagram_portrait`
- **Dimensions**: 1080x1350 (4:5 Portrait)
- **Format**: JPEG
- **Quality**: 85%
- **Use Case**: Instagram feed posts (portrait orientation)
- **Notes**: More vertical space without being full 9:16

### TikTok Format

#### `tiktok`
- **Dimensions**: 1080x1920 (9:16 Vertical)
- **Format**: JPEG
- **Quality**: 90%
- **Use Case**: TikTok video thumbnails, static posts
- **Notes**: Same aspect ratio as Instagram Stories

### E-Commerce Platforms (Indonesia)

#### `shopee_product`
- **Dimensions**: 1000x1000 (1:1 Square)
- **Format**: JPEG
- **Quality**: 95%
- **Use Case**: Shopee product listings
- **Notes**: High quality for product clarity
- **Requirements**: Meets Shopee's minimum 500x500 requirement

#### `tokopedia_product`
- **Dimensions**: 1200x1200 (1:1 Square)
- **Format**: JPEG
- **Quality**: 95%
- **Use Case**: Tokopedia product listings
- **Notes**: Higher resolution for better zoom quality
- **Requirements**: Meets Tokopedia's 1200x1200 recommendation

#### `lazada_product`
- **Dimensions**: 1000x1000 (1:1 Square)
- **Format**: JPEG
- **Quality**: 95%
- **Use Case**: Lazada product listings
- **Notes**: Optimized for Lazada's platform requirements

### Web & Social Media

#### `facebook_post`
- **Dimensions**: 1200x630 (1.91:1)
- **Format**: JPEG
- **Quality**: 85%
- **Use Case**: Facebook posts, link previews
- **Notes**: Optimal for Facebook's News Feed algorithm

#### `twitter_post`
- **Dimensions**: 1200x675 (16:9)
- **Format**: JPEG
- **Quality**: 85%
- **Use Case**: Twitter posts, cards
- **Notes**: Standard widescreen aspect ratio

#### `linkedin_post`
- **Dimensions**: 1200x627 (1.91:1)
- **Format**: JPEG
- **Quality**: 85%
- **Use Case**: LinkedIn posts, articles
- **Notes**: Professional platform optimized

### Print Formats

#### `print_a4`
- **Dimensions**: 2480x3508 (A4 at 300 DPI)
- **Format**: PNG
- **Quality**: 100%
- **Use Case**: A4 size prints (210x297mm)
- **Notes**: High-resolution lossless format for printing

#### `print_4x6`
- **Dimensions**: 1800x1200 (4x6 inches at 300 DPI)
- **Format**: PNG
- **Quality**: 100%
- **Use Case**: Standard photo prints
- **Notes**: Common photo print size

### Special Format

#### `original`
- **Dimensions**: Original (no resize)
- **Format**: PNG
- **Quality**: 100%
- **Use Case**: Archival, further editing
- **Notes**: Preserves original quality and dimensions

---

## Usage

### 1. Generate with Specific Formats

Include `exportFormats` in your generation request to automatically generate exports:

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

**Benefits:**
- Exports are generated immediately after pose generation
- No additional credit cost
- Exports are ready when generation completes

### 2. Download as ZIP

Download all exports for a generation as a single ZIP file:

```bash
GET /api/apps/pose-generator/generations/{generationId}/export-zip
```

**With specific formats:**
```bash
GET /api/apps/pose-generator/generations/{generationId}/export-zip?formats=instagram_post,shopee_product,tiktok
```

**ZIP Structure:**
```
poses-{generationId}.zip
├── instagram_post/
│   ├── {poseId1}.jpg
│   ├── {poseId2}.jpg
│   └── ...
├── shopee_product/
│   ├── {poseId1}.jpg
│   ├── {poseId2}.jpg
│   └── ...
└── tiktok/
    ├── {poseId1}.jpg
    ├── {poseId2}.jpg
    └── ...
```

### 3. Re-generate Single Format

If you need to regenerate a specific export format (e.g., after editing):

```typescript
POST /api/apps/pose-generator/poses/{poseId}/regenerate-export
{
  "format": "instagram_story"
}

// Response
{
  "success": true,
  "exportUrl": "/uploads/poses/gen_123/exports/pose_456_instagram_story.jpg",
  "format": "instagram_story"
}
```

---

## Format Selection Guide

### For Social Media Influencers
Recommended formats:
- `instagram_story`
- `instagram_feed`
- `tiktok`
- `facebook_post`

### For E-Commerce Sellers
Recommended formats:
- `shopee_product`
- `tokopedia_product`
- `lazada_product`
- `original` (for marketplace variety)

### For Professional Use
Recommended formats:
- `linkedin_post`
- `twitter_post`
- `original`
- `print_a4` (for presentations)

### For Print Marketing
Recommended formats:
- `print_a4`
- `print_4x6`
- `original`

---

## Technical Details

### Image Processing
- **Library**: Sharp (high-performance Node.js image processing)
- **Resize Algorithm**: Cover with center crop
- **Color Space**: RGB
- **Compression**:
  - JPEG: Progressive encoding with mozjpeg
  - PNG: Maximum compression (level 9)

### Quality Settings

| Format Type | Quality | Rationale |
|-------------|---------|-----------|
| E-Commerce  | 95%     | Product clarity is critical |
| Social Stories | 90% | High quality for engagement |
| Social Feed | 85%     | Balance quality and file size |
| Print       | 100%    | Lossless for printing |

### File Size Estimates

| Format | Typical Size | Notes |
|--------|--------------|-------|
| instagram_story | ~400-600 KB | Depends on image complexity |
| instagram_feed | ~300-500 KB | Square format is efficient |
| shopee_product | ~600-800 KB | Higher quality, larger size |
| print_a4 | ~2-4 MB | PNG format, high resolution |
| original | ~1-3 MB | Original dimensions preserved |

---

## Performance

### Generation Speed
- **Single Format**: ~500ms per image
- **Multiple Formats**: Parallel processing (5-10 formats in ~1-2 seconds)
- **ZIP Creation**: ~100ms per 10 images

### Storage
- **Local Mode**: Stored in `/app/backend/uploads/poses/{generationId}/exports/`
- **R2 Mode**: Uploaded to Cloudflare R2 with CDN delivery
- **Retention**: Exports stored indefinitely with generation

---

## API Reference

### Export Format Object

```typescript
interface ExportFormatSpec {
  name: string          // Human-readable name
  width: number         // Width in pixels
  height: number        // Height in pixels
  format: 'jpeg' | 'png' | 'webp'  // Image format
  quality: number       // Quality percentage (0-100)
  aspectRatio: string   // Display aspect ratio
  description: string   // Usage description
}
```

### Export URLs in Database

Exports are stored in the `GeneratedPose.exportFormats` field as a JSON object:

```json
{
  "instagram_story": "/uploads/poses/gen_abc/exports/pose_123_instagram_story.jpg",
  "instagram_feed": "/uploads/poses/gen_abc/exports/pose_123_instagram_feed.jpg",
  "shopee_product": "/uploads/poses/gen_abc/exports/pose_123_shopee_product.jpg"
}
```

---

## Error Handling

### Export Generation Failures
- Individual format failures don't block pose generation
- Failed exports are logged but don't cause generation to fail
- Client can retry via regenerate endpoint

### ZIP Download Failures
- Missing files are skipped with warning
- ZIP creation continues with available files
- Error returned only if no files can be added

---

## Future Enhancements

### Planned Formats
- `whatsapp_status` (720x1280)
- `youtube_thumbnail` (1280x720)
- `pinterest_pin` (1000x1500)

### Planned Features
- Custom format definitions
- Watermark overlay support
- Batch format conversion API
- Format recommendations based on use case

---

## Credits & Costs

**Export generation is included in pose generation cost.**

- No additional credits charged for export formats
- Unlimited format regeneration
- ZIP downloads are free

**Pose Generation Cost:**
- Base: 30 credits per pose
- Exports: Free (included)
- Background changer: +10 credits per pose (optional)

---

## Support

For format requests or issues:
1. Check format specification above
2. Verify pose has been generated successfully
3. Try regenerating the specific format
4. Contact support if issue persists

**Format Addition Requests:**
Please submit via the Pose Request feature with:
- Platform name
- Required dimensions
- Use case description
- Sample reference images
