# Pose Storage Service - Quick Reference

## Overview

The Pose Storage Service provides a unified interface for storing and retrieving pose images with automatic thumbnail generation. It supports both local filesystem storage (default) and Cloudflare R2 (cloud storage).

## Basic Usage

### Import

```typescript
import { poseStorageService } from './services/storage.service'
```

### Save Pose with Thumbnail

```typescript
// Generate or receive image buffer
const imageBuffer = await generateImage()

// Save with automatic thumbnail
const result = await poseStorageService.savePoseWithThumbnail({
  imageBuffer,
  generationId: 'gen_abc123',
  poseId: 'pose_xyz789',
  poseLibraryId: 'lib_optional', // Optional
})

// Result contains URLs
console.log(result.imageUrl)       // Full-size image URL
console.log(result.thumbnailUrl)   // 400x400 thumbnail URL
console.log(result.originalImageUrl) // Same as imageUrl
```

### Delete Pose

```typescript
await poseStorageService.deletePose({
  generationId: 'gen_abc123',
  poseId: 'pose_xyz789',
})
```

### Check Storage Mode

```typescript
const mode = poseStorageService.getStorageMode()
console.log(`Storage mode: ${mode}`) // 'local' or 'r2'
```

### Initialize Storage (Startup)

```typescript
// Called automatically in index.ts
await poseStorageService.initializeLocalStorage()
```

## Storage Structure

### Local Mode

```
/app/backend/uploads/
└── poses/
    └── {generationId}/
        ├── {poseId}.png
        └── {poseId}_thumb.png
```

**URLs:**
- Full: `/uploads/poses/{generationId}/{poseId}.png`
- Thumb: `/uploads/poses/{generationId}/{poseId}_thumb.png`

### R2 Mode

```
lumiku-poses (bucket)
└── poses/
    └── {generationId}/
        ├── {poseId}.png
        └── {poseId}_thumb.png
```

**URLs:**
- Full: `https://poses.lumiku.com/poses/{generationId}/{poseId}.png`
- Thumb: `https://poses.lumiku.com/poses/{generationId}/{poseId}_thumb.png`

## Configuration

### Environment Variables

```bash
# Storage mode
STORAGE_MODE=local  # or 'r2'

# Local storage path
UPLOAD_PATH=/app/backend/uploads

# R2 configuration (only if STORAGE_MODE=r2)
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=lumiku-poses
R2_PUBLIC_URL=https://poses.lumiku.com
```

## Error Handling

### Save Errors

```typescript
try {
  const result = await poseStorageService.savePoseWithThumbnail({
    imageBuffer,
    generationId,
    poseId,
  })
} catch (error) {
  console.error('Storage failed:', error)
  // Error types:
  // - Invalid image buffer (sharp fails)
  // - Disk space full (local mode)
  // - Network error (R2 mode)
  // - Permission denied
}
```

### Delete Errors

```typescript
// Delete errors are logged but don't throw
await poseStorageService.deletePose({ generationId, poseId })
// If deletion fails, a warning is logged but execution continues
```

## Worker Integration Pattern

```typescript
import { poseStorageService } from '../services/storage.service'

async function generatePose() {
  // 1. Generate image
  const imageBuffer = await generateImageWithAI()

  // 2. Create database record (status: processing)
  const pose = await prisma.generatedPose.create({
    data: {
      generationId,
      outputImageUrl: '',
      thumbnailUrl: '',
      status: 'processing',
      // ... other fields
    },
  })

  try {
    // 3. Upload to storage
    const { imageUrl, thumbnailUrl } = await poseStorageService.savePoseWithThumbnail({
      imageBuffer,
      generationId,
      poseId: pose.id,
    })

    // 4. Update database with URLs
    await prisma.generatedPose.update({
      where: { id: pose.id },
      data: {
        outputImageUrl: imageUrl,
        thumbnailUrl: thumbnailUrl,
        status: 'completed',
      },
    })
  } catch (error) {
    // 5. Mark as failed if storage fails
    await prisma.generatedPose.update({
      where: { id: pose.id },
      data: {
        status: 'failed',
        errorMessage: error.message,
      },
    })
    throw error
  }
}
```

## Thumbnail Generation

Thumbnails are automatically generated with these settings:

- **Size:** 400x400 pixels
- **Fit:** Cover (maintains aspect ratio, crops if needed)
- **Format:** PNG
- **Quality:** 85%

### Custom Thumbnail (Advanced)

If you need custom thumbnail sizes, use the `sharp` library directly:

```typescript
import sharp from 'sharp'

const customThumb = await sharp(imageBuffer)
  .resize(200, 200, { fit: 'contain' })
  .png({ quality: 90 })
  .toBuffer()

// Then upload manually
await poseStorageService.saveLocal('custom-path', customThumb)
```

## Migration from Local to R2

### Step 1: Prepare R2

```bash
# Create bucket
# Generate API tokens
# Configure custom domain (optional)
```

### Step 2: Update Environment

```bash
STORAGE_MODE=r2
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=lumiku-poses
R2_PUBLIC_URL=https://poses.lumiku.com
```

### Step 3: Migrate Existing Files (Optional)

```bash
# Using AWS CLI
aws s3 sync /app/backend/uploads/poses/ s3://lumiku-poses/poses/ \
  --endpoint-url https://[account-id].r2.cloudflarestorage.com \
  --profile r2
```

### Step 4: Redeploy

```bash
# Commit and push
git commit -am "Switch to R2 storage"
git push

# Or redeploy in Coolify
# All new uploads go to R2 automatically
```

## Performance Tips

### Local Mode

- Use SSD for UPLOAD_PATH
- Monitor disk space regularly
- Implement cleanup for old generations
- Consider RAID for redundancy

### R2 Mode

- Use custom domain with CDN
- Enable browser caching headers
- Consider pre-signed URLs for uploads
- Batch operations when possible

## Monitoring

### Storage Usage

```bash
# Local mode
du -sh /app/backend/uploads/poses

# R2 mode
# Check in Cloudflare Dashboard
```

### Logs

```typescript
// Success logs
[Storage] Initialized in local mode
[Storage] Saved local files: /path/to/file.png
[Storage] Deleted pose: pose_xyz

// Error logs
[Storage] Failed to save pose: Error message
[Storage] Failed to delete pose: Error message
```

## Testing

```bash
# Run test script
bun run scripts/test-storage.ts

# Tests:
# - Storage initialization
# - Image saving with thumbnail
# - File verification
# - Deletion
# - Error handling
```

## Troubleshooting

### Files not saving

**Check:**
1. UPLOAD_PATH directory exists
2. Write permissions (755)
3. Disk space available
4. imageBuffer is valid PNG/JPEG

### Thumbnails not generating

**Check:**
1. `sharp` package installed
2. imageBuffer is valid image
3. Sufficient memory available
4. Check error logs

### R2 uploads failing

**Check:**
1. STORAGE_MODE=r2
2. All R2 credentials set
3. Bucket exists and accessible
4. Network connectivity
5. API token permissions

### Images not loading

**Check:**
1. Static middleware enabled (app.ts)
2. URLs match storage path
3. File permissions readable (644)
4. CORS configured if cross-origin

## Best Practices

1. **Always handle errors** when calling storage methods
2. **Update database status** after storage operations
3. **Use transactions** when coordinating database and storage
4. **Log storage operations** for debugging
5. **Monitor disk space** in local mode
6. **Plan cleanup strategy** for old generations
7. **Test migration** to R2 in staging first
8. **Backup regularly** in local mode

## Common Patterns

### Retry on Failure

```typescript
async function savePoseWithRetry(params: any, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await poseStorageService.savePoseWithThumbnail(params)
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await sleep(1000 * (i + 1))
    }
  }
}
```

### Batch Delete

```typescript
async function deleteGeneration(generationId: string) {
  const poses = await prisma.generatedPose.findMany({
    where: { generationId },
  })

  await Promise.all(
    poses.map((pose) =>
      poseStorageService.deletePose({
        generationId,
        poseId: pose.id,
      })
    )
  )
}
```

### Pre-flight Check

```typescript
async function checkStorage() {
  const mode = poseStorageService.getStorageMode()

  if (mode === 'local') {
    // Check disk space
    const stats = await fs.statfs('/app/backend/uploads')
    const freeSpace = stats.bavail * stats.bsize

    if (freeSpace < 1024 * 1024 * 100) {
      // Less than 100MB
      throw new Error('Insufficient disk space')
    }
  }
}
```

## API Reference

### Methods

#### `savePoseWithThumbnail(params)`

Saves pose image with auto-generated thumbnail.

**Parameters:**
- `imageBuffer: Buffer` - PNG/JPEG image data
- `generationId: string` - Generation identifier
- `poseId: string` - Unique pose identifier
- `poseLibraryId?: string` - Optional library reference

**Returns:**
```typescript
{
  imageUrl: string        // Full-size image URL
  thumbnailUrl: string    // Thumbnail URL (400x400)
  originalImageUrl: string // Same as imageUrl
}
```

**Throws:** Error if save fails

#### `deletePose(params)`

Deletes pose and thumbnail from storage.

**Parameters:**
- `generationId: string` - Generation identifier
- `poseId: string` - Pose identifier

**Returns:** `Promise<void>`

**Throws:** Does not throw, logs errors

#### `getStorageMode()`

Returns current storage mode.

**Returns:** `'local' | 'r2'`

#### `initializeLocalStorage()`

Creates local storage directory structure.

**Returns:** `Promise<void>`

**Throws:** Error if initialization fails

## Support

For issues:
1. Check environment variables
2. Review logs for [Storage] messages
3. Verify file permissions
4. Test with `scripts/test-storage.ts`
5. Consult `COOLIFY_STORAGE_SETUP.md`

---

**Version:** Phase 4A
**Last Updated:** 2025-10-14
**Status:** Production Ready
