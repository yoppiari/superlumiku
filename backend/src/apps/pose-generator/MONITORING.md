# Monitoring & Observability

## Overview

The Pose Generator includes comprehensive monitoring and observability features to track system health, performance, and usage patterns. This document covers metrics endpoints, logging, performance tracking, and integration with external monitoring services.

## Metrics Endpoints

### System Metrics
```bash
GET /api/apps/pose-generator/metrics?period=24h
Authorization: Bearer <jwt-token>
```

**Admin Only**: This endpoint requires ADMIN role.

**Query Parameters:**
- `period`: Time period for metrics (default: `24h`)
  - `1h`: Last 1 hour
  - `24h`: Last 24 hours
  - `7d`: Last 7 days
  - `30d`: Last 30 days

**Response:**
```json
{
  "totalGenerations": 150,
  "activeGenerations": 3,
  "completedGenerations": 140,
  "failedGenerations": 7,
  "avgGenerationTime": 25000,
  "avgPosesPerGeneration": 3.5,
  "successRate": 93.33,
  "queueDepth": 12,
  "queueWaiting": 10,
  "queueActive": 2,
  "queueFailed": 5,
  "totalPosesGenerated": 525,
  "totalCreditsSpent": 15750,
  "totalCreditsRefunded": 210,
  "startTime": "2025-10-13T10:30:00.000Z",
  "endTime": "2025-10-14T10:30:00.000Z"
}
```

### Top Users
```bash
GET /api/apps/pose-generator/metrics/top-users?limit=10
Authorization: Bearer <jwt-token>
```

**Admin Only**: This endpoint requires ADMIN role.

**Query Parameters:**
- `limit`: Number of users to return (default: `10`)

**Response:**
```json
{
  "users": [
    {
      "userId": "user_123",
      "generationCount": 25,
      "totalPoses": 87,
      "successRate": 95.5
    }
  ]
}
```

### Popular Poses
```bash
GET /api/apps/pose-generator/metrics/popular-poses?limit=20
Authorization: Bearer <jwt-token>
```

**Available to all authenticated users.**

**Query Parameters:**
- `limit`: Number of poses to return (default: `20`)

**Response:**
```json
{
  "poses": [
    {
      "poseId": "pose_abc",
      "name": "Standing Confident",
      "usageCount": 156,
      "category": "Business Portraits"
    }
  ]
}
```

### Error Analysis
```bash
GET /api/apps/pose-generator/metrics/errors
Authorization: Bearer <jwt-token>
```

**Admin Only**: This endpoint requires ADMIN role.

**Response:**
```json
{
  "errors": [
    {
      "errorType": "FLUX_API_ERROR",
      "count": 12,
      "lastOccurred": "2025-10-14T09:45:00.000Z"
    },
    {
      "errorType": "TIMEOUT_ERROR",
      "count": 5,
      "lastOccurred": "2025-10-14T08:30:00.000Z"
    }
  ]
}
```

**Error Types:**
- `FLUX_API_ERROR`: Issues with FLUX API calls
- `STORAGE_ERROR`: Problems uploading to Supabase Storage
- `CREDIT_ERROR`: Credit validation or deduction failures
- `TIMEOUT_ERROR`: Generation timeouts
- `NETWORK_ERROR`: Network connectivity issues
- `CONTROLNET_ERROR`: ControlNet processing failures
- `VALIDATION_ERROR`: Input validation failures
- `UNKNOWN_ERROR`: Unclassified errors

## Key Metrics to Monitor

### Health Indicators

| Metric | Status | Action |
|--------|--------|--------|
| Success Rate > 95% | ✅ Good | Normal operation |
| Success Rate 90-95% | ⚠️ Warning | Investigate errors |
| Success Rate < 90% | 🚨 Critical | Immediate action required |

### Performance Indicators

| Metric | Status | Action |
|--------|--------|--------|
| Avg Time < 30s per pose | ✅ Good | Optimal performance |
| Avg Time 30-60s | ⚠️ Slow | Check FLUX API latency |
| Avg Time > 60s | 🚨 Critical | Investigate bottlenecks |

### Queue Indicators

| Metric | Status | Action |
|--------|--------|--------|
| Queue Depth < 100 | ✅ Healthy | Normal load |
| Queue Depth 100-500 | ⚠️ Busy | Monitor closely |
| Queue Depth > 500 | 🚨 Overloaded | Scale workers |

### Credit Indicators

| Metric | Status | Action |
|--------|--------|--------|
| Refund Rate < 5% | ✅ Good | Stable system |
| Refund Rate 5-10% | ⚠️ Warning | Check failures |
| Refund Rate > 10% | 🚨 Critical | System issues |

## Structured Logging

The Pose Generator uses structured logging with the following components:

### Log Levels
- **DEBUG**: Detailed diagnostic information
- **INFO**: General informational messages
- **WARN**: Warning messages (non-critical issues)
- **ERROR**: Error messages (critical issues)

### Log Components
- **Worker**: Background job processing
- **Storage**: File upload and management
- **FLUX**: FLUX API interactions
- **Metrics**: Metrics collection and analysis

### Example Log Entry
```json
{
  "timestamp": "2025-10-14T10:30:00.000Z",
  "level": "INFO",
  "component": "Worker",
  "message": "Generated pose successfully",
  "metadata": {
    "generationId": "gen_123",
    "poseId": "pose_456",
    "duration": 25000
  }
}
```

### Using the Logger

```typescript
import { workerLogger, storageLogger, fluxLogger } from './lib/logger'

// Worker logs
workerLogger.info('Processing generation job', {
  generationId,
  poseCount: 4,
})

// Storage logs
storageLogger.error('Failed to upload image', {
  generationId,
  poseId,
  error: error.message,
}, error)

// FLUX API logs
fluxLogger.debug('Calling FLUX API', {
  prompt,
  controlnetUrl,
})
```

## Performance Tracking

### Using Performance Tracker

```typescript
import { performanceTracker } from './lib/performance'

// Manual timing
performanceTracker.start('generate-pose-123')
// ... do work ...
const duration = performanceTracker.end('generate-pose-123')

// Automatic timing with measure()
const result = await performanceTracker.measure(
  'flux-api-call',
  async () => {
    return await fluxClient.generateImage(params)
  }
)
```

### Performance Metrics Logged

- FLUX API call duration
- Image upload duration
- Total pose generation time
- Queue processing time
- Database query time

## Alerts and Notifications

### Recommended Alerts

1. **High Failure Rate**
   - Condition: Failure rate > 10% over 1 hour
   - Severity: Critical
   - Action: Check FLUX API status, review error logs

2. **Queue Backlog**
   - Condition: Queue waiting > 500 jobs
   - Severity: Warning
   - Action: Scale up workers, check processing rate

3. **Slow Generation**
   - Condition: Average generation time > 60s
   - Severity: Warning
   - Action: Check FLUX API latency, network connectivity

4. **Credit Refund Spike**
   - Condition: Credits refunded > 1000/hour
   - Severity: Critical
   - Action: Investigate system failures, check error patterns

5. **Worker Downtime**
   - Condition: No jobs processed for 10 minutes
   - Severity: Critical
   - Action: Check worker health, restart if needed

## Integration with External Services

### Sentry (Error Tracking)

Install Sentry SDK:
```bash
npm install @sentry/node
```

Add to `worker.ts`:
```typescript
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})

// Wrap worker execution
try {
  await processGeneration(job)
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      component: 'pose-generator',
      generationId: job.data.generationId,
    },
  })
  throw error
}
```

### Prometheus (Metrics)

Install Prometheus client:
```bash
npm install prom-client
```

Add metrics exporter:
```typescript
import { register, Counter, Histogram } from 'prom-client'

// Define metrics
const generationCounter = new Counter({
  name: 'pose_generations_total',
  help: 'Total pose generations',
  labelNames: ['status'],
})

const generationDuration = new Histogram({
  name: 'pose_generation_duration_seconds',
  help: 'Pose generation duration',
  buckets: [10, 30, 60, 120, 300],
})

// Use in code
generationCounter.inc({ status: 'completed' })
generationDuration.observe(duration / 1000)

// Expose metrics endpoint
app.get('/metrics-prometheus', async (c) => {
  return c.text(await register.metrics())
})
```

### Grafana (Dashboard)

Create a Grafana dashboard with the following panels:

1. **Generation Rate** (Time series)
   - Query: `rate(pose_generations_total[5m])`

2. **Success Rate** (Gauge)
   - Query: `(pose_generations_total{status="completed"} / pose_generations_total) * 100`

3. **Queue Depth** (Time series)
   - Query: `pose_queue_depth`

4. **Average Duration** (Time series)
   - Query: `rate(pose_generation_duration_seconds_sum[5m]) / rate(pose_generation_duration_seconds_count[5m])`

5. **Error Rate by Type** (Bar chart)
   - Query: `sum by (error_type) (pose_errors_total)`

### DataDog (APM)

Install DataDog tracer:
```bash
npm install dd-trace
```

Add to application entry point:
```typescript
import tracer from 'dd-trace'

tracer.init({
  service: 'lumiku-pose-generator',
  env: process.env.NODE_ENV,
  analytics: true,
})
```

## Health Checks

### Application Health
```bash
GET /api/apps/pose-generator/health
```

**No authentication required** (for monitoring systems).

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-14T10:30:00.000Z",
  "app": "pose-generator",
  "version": "1.0.0",
  "checks": {
    "database": {
      "status": "connected"
    },
    "redis": {
      "status": "connected"
    },
    "queue": {
      "status": "operational",
      "counts": {
        "waiting": 10,
        "active": 2,
        "completed": 1500,
        "failed": 12,
        "delayed": 0
      }
    }
  },
  "phase": "Production Ready"
}
```

**Status Codes:**
- `200`: All systems healthy
- `503`: One or more systems unhealthy

## Monitoring Best Practices

### 1. Regular Monitoring
- Check metrics dashboard daily
- Review error logs weekly
- Analyze performance trends monthly

### 2. Alert Fatigue Prevention
- Set appropriate thresholds
- Use warning vs. critical severity
- Implement alert aggregation

### 3. Incident Response
- Document common issues and fixes
- Create runbooks for critical alerts
- Post-mortem analysis for major incidents

### 4. Capacity Planning
- Monitor growth trends
- Plan scaling before hitting limits
- Test at expected peak load

### 5. User Experience
- Track end-to-end generation time
- Monitor user-facing error rates
- Collect user feedback on performance

## Troubleshooting

### High Failure Rate

1. Check error analysis endpoint for error types
2. Review recent FLUX API status
3. Check Supabase Storage connectivity
4. Verify credit system functionality
5. Review worker logs for patterns

### Slow Generation

1. Check FLUX API latency
2. Verify network connectivity
3. Review queue processing rate
4. Check database query performance
5. Monitor server CPU/memory usage

### Queue Backlog

1. Check active worker count
2. Review processing rate
3. Verify Redis connectivity
4. Check for stuck jobs
5. Consider scaling workers

### Credit Refund Spike

1. Review error analysis
2. Check failure rate by error type
3. Verify generation success rate
4. Review recent system changes
5. Check FLUX API reliability

## Maintenance Tasks

### Daily
- Review health check status
- Check for critical alerts
- Monitor success rate

### Weekly
- Review error patterns
- Analyze popular poses
- Check top users activity
- Review performance trends

### Monthly
- Capacity planning review
- Performance optimization analysis
- Cost analysis (credits, API usage)
- Update monitoring thresholds

## Support

For issues or questions about monitoring:
1. Check logs for error details
2. Review metrics for patterns
3. Consult troubleshooting guide
4. Contact platform team if needed
