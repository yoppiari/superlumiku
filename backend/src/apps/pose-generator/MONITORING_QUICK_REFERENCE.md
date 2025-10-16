# Monitoring Quick Reference

## Quick Start

### 1. Check System Health
```bash
curl http://localhost:3000/api/apps/pose-generator/health
```

### 2. Get System Metrics (Admin)
```bash
curl -H "Authorization: Bearer <admin-token>" \
  "http://localhost:3000/api/apps/pose-generator/metrics?period=24h"
```

### 3. Add Logging to Your Code
```typescript
import { workerLogger } from './lib/logger'

workerLogger.info('Processing started', { generationId, poseCount })
workerLogger.error('Processing failed', { generationId, error: err.message }, err)
```

### 4. Track Performance
```typescript
import { performanceTracker } from './lib/performance'

const result = await performanceTracker.measure('operation-name', async () => {
  return await doWork()
})
```

## Endpoints at a Glance

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /health` | None | Health check |
| `GET /metrics?period=24h` | Admin | System metrics |
| `GET /metrics/top-users?limit=10` | Admin | Top users |
| `GET /metrics/popular-poses?limit=20` | User | Popular poses |
| `GET /metrics/errors` | Admin | Error analysis |

## Metrics Thresholds

### 🟢 Healthy
- Success Rate: > 95%
- Avg Time/Pose: < 30s
- Queue Depth: < 100
- Refund Rate: < 5%

### 🟡 Warning
- Success Rate: 90-95%
- Avg Time/Pose: 30-60s
- Queue Depth: 100-500
- Refund Rate: 5-10%

### 🔴 Critical
- Success Rate: < 90%
- Avg Time/Pose: > 60s
- Queue Depth: > 500
- Refund Rate: > 10%

## Common Use Cases

### Monitor System Health
```typescript
import { metricsService } from './services/metrics.service'

// Get last 24 hours metrics
const metrics = await metricsService.getSystemMetrics({
  startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
  endDate: new Date(),
})

console.log(`Success Rate: ${metrics.successRate}%`)
console.log(`Queue Depth: ${metrics.queueDepth}`)
```

### Log Important Events
```typescript
import { workerLogger } from './lib/logger'

// Start of operation
workerLogger.info('Generation started', {
  generationId,
  userId,
  poseCount: 4,
})

// Success
workerLogger.info('Generation completed', {
  generationId,
  duration: 120000,
  posesGenerated: 4,
})

// Failure
workerLogger.error('Generation failed', {
  generationId,
  error: 'FLUX API timeout',
}, error)
```

### Track Performance
```typescript
import { performanceTracker } from './lib/performance'

// Track FLUX API call
const image = await performanceTracker.measure(
  `flux-api-${poseId}`,
  async () => {
    return await fluxClient.generateImage({
      prompt,
      controlnetUrl,
    })
  }
)
// Logs: [Performance] flux-api-pose_123: 25000ms

// Track storage upload
const url = await performanceTracker.measure(
  `storage-upload-${poseId}`,
  async () => {
    return await storageService.uploadImage(buffer, path)
  }
)
// Logs: [Performance] storage-upload-pose_123: 3000ms
```

### Analyze Errors
```typescript
import { metricsService } from './services/metrics.service'

// Get error breakdown
const errors = await metricsService.getErrorAnalysis()

errors.forEach(({ errorType, count, lastOccurred }) => {
  console.log(`${errorType}: ${count} occurrences`)
  console.log(`Last seen: ${lastOccurred}`)
})

// Example output:
// FLUX_API_ERROR: 12 occurrences
// Last seen: 2025-10-14T09:45:00.000Z
//
// TIMEOUT_ERROR: 5 occurrences
// Last seen: 2025-10-14T08:30:00.000Z
```

### Record Analytics Events
```typescript
import { metricsService } from './services/metrics.service'

// Generation started
await metricsService.recordEvent({
  type: 'generation_started',
  generationId,
  userId,
  metadata: { poseCount: 4, generationType: 'GALLERY_REFERENCE' },
})

// Generation completed
await metricsService.recordEvent({
  type: 'generation_completed',
  generationId,
  userId,
  metadata: { duration: 120000, posesGenerated: 4 },
})

// Export generated
await metricsService.recordEvent({
  type: 'export_generated',
  generationId,
  metadata: { format: 'instagram_story', exportCount: 4 },
})
```

## Integration Examples

### Add Logging to Worker
```typescript
// In worker.ts
import { workerLogger, performanceTracker } from './lib/logger'

async function processGeneration(job: Job<PoseGenerationJob>) {
  const { generationId, poseCount } = job.data

  workerLogger.info('Starting generation', { generationId, poseCount })

  try {
    const result = await performanceTracker.measure(
      `generation-${generationId}`,
      async () => {
        // Do work here
        return await generatePoses(job.data)
      }
    )

    workerLogger.info('Generation completed', {
      generationId,
      posesGenerated: result.poses.length,
    })

    return result
  } catch (error) {
    workerLogger.error('Generation failed', {
      generationId,
      error: error.message,
    }, error)

    throw error
  }
}
```

### Add Performance Tracking to API Calls
```typescript
// In flux-api.service.ts
import { fluxLogger, performanceTracker } from '../lib/logger'

async function generateImage(params: FluxParams) {
  fluxLogger.info('Calling FLUX API', {
    prompt: params.prompt.substring(0, 50),
    controlnetUrl: params.controlnetUrl,
  })

  const result = await performanceTracker.measure(
    'flux-api-call',
    async () => {
      const response = await fetch(FLUX_API_URL, {
        method: 'POST',
        body: JSON.stringify(params),
      })

      return await response.json()
    }
  )

  fluxLogger.info('FLUX API response received', {
    imageUrl: result.output?.[0],
  })

  return result
}
```

## Troubleshooting

### High Failure Rate
1. Check error analysis: `GET /metrics/errors`
2. Review recent logs for error patterns
3. Check FLUX API status
4. Verify Supabase Storage connectivity

### Slow Performance
1. Check metrics: `GET /metrics?period=1h`
2. Review performance logs
3. Check FLUX API latency
4. Verify network connectivity

### Queue Backlog
1. Check queue depth: `GET /health`
2. Check active worker count
3. Review processing rate in logs
4. Consider scaling workers

## Next Steps

1. **Setup Alerts**: Configure alerts for critical thresholds
2. **Dashboard**: Create Grafana dashboard for visualization
3. **External Logging**: Integrate with Sentry or DataDog
4. **Analytics**: Connect to Posthog or Mixpanel
5. **Monitoring**: Set up regular health checks

## Resources

- Full Documentation: `MONITORING.md`
- Metrics Service: `services/metrics.service.ts`
- Logger: `lib/logger.ts`
- Performance Tracker: `lib/performance.ts`
