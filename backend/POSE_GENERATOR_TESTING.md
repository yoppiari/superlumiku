# Pose Generator - Testing Guide

Complete guide for testing Pose Generator API endpoints, WebSocket connections, and BullMQ queue management.

## Table of Contents

1. Prerequisites
2. Environment Setup
3. API Endpoint Testing
4. WebSocket Testing
5. BullMQ Queue Monitoring
6. Integration Testing
7. Troubleshooting

## Prerequisites

Before testing, ensure you have:

- Backend server running (npm run dev)
- Database seeded with pose data (npm run prisma:seed)
- Test user account created (from seed)
- curl installed for API testing
- Redis running (for queue management)

Test Credentials:
- Email: test@lumiku.com
- Password: password123

## Environment Setup

### Get Authentication Token

First, you need a valid JWT token:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@lumiku.com", "password": "password123"}'
```

Save the token:
```bash
TOKEN="your_jwt_token_here"
```

### Verify Database Setup

Check that pose categories and poses are seeded:

```bash
curl -X GET http://localhost:3000/api/pose-generator/categories \
  -H "Authorization: Bearer $TOKEN"
```

## API Endpoint Testing

### Get Pose Categories

Retrieve all pose categories with hierarchy:

```bash
curl -X GET http://localhost:3000/api/pose-generator/categories \
  -H "Authorization: Bearer $TOKEN"
```

### Get Poses by Category

Retrieve all poses in a specific category:

```bash
curl -X GET "http://localhost:3000/api/pose-generator/poses/professional" \
  -H "Authorization: Bearer $TOKEN"
```

With pagination:

```bash
curl -X GET "http://localhost:3000/api/pose-generator/poses/professional?skip=0&take=10" \
  -H "Authorization: Bearer $TOKEN"
```

### Search Poses

Search poses by tag or difficulty:

```bash
curl -X GET "http://localhost:3000/api/pose-generator/search?tag=professional&difficulty=beginner" \
  -H "Authorization: Bearer $TOKEN"
```

### Create Pose Generation Project

Create a new pose generation project:

```bash
curl -X POST http://localhost:3000/api/pose-generator/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"projectName": "Test Poses", "avatarImageUrl": "https://example.com/avatar.jpg"}'
```

### Start Pose Generation

Start generating poses for a project:

```bash
curl -X POST "http://localhost:3000/api/pose-generator/projects/{projectId}/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "generationType": "GALLERY_REFERENCE",
    "poseIds": ["pose_1", "pose_2", "pose_3"],
    "batchSize": 2,
    "exportFormats": ["instagram_story", "tiktok"]
  }'
```

### Get Generation Status

Check the status of an ongoing generation:

```bash
curl -X GET "http://localhost:3000/api/pose-generator/generations/{generationId}" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Generated Poses

Retrieve generated poses from a generation:

```bash
curl -X GET "http://localhost:3000/api/pose-generator/generations/{generationId}/poses" \
  -H "Authorization: Bearer $TOKEN"
```

## WebSocket Testing

### Connect to Generation Updates

WebSocket URL: ws://localhost:3000/ws/pose-generator

Using JavaScript console:

```javascript
const token = "your_token";
const generationId = "gen_id";

const ws = new WebSocket("ws://localhost:3000/ws/pose-generator");

ws.onopen = () => {
  console.log("Connected");
  ws.send(JSON.stringify({
    type: "subscribe",
    generationId: generationId,
    token: token
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Update:", data);
};

ws.onerror = (error) => {
  console.error("WebSocket error:", error);
};

ws.onclose = () => {
  console.log("Disconnected");
};
```

Expected WebSocket Messages:

```json
{"type": "connected"}
{"type": "update", "status": "processing", "progress": 50, "posesCompleted": 3}
{"type": "update", "status": "completed", "progress": 100, "posesCompleted": 6}
```

## BullMQ Queue Monitoring

### Access Redis CLI

```bash
redis-cli

KEYS "*"
LLEN "pose-generator:queue"
ZRANGE "pose-generator:waiting" 0 -1
ZRANGE "pose-generator:active" 0 -1
ZRANGE "pose-generator:completed" 0 -1
```

### View Queue Statistics (Admin API)

```bash
curl -X GET http://localhost:3000/api/admin/queue/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Retry Failed Jobs

```bash
curl -X POST http://localhost:3000/api/admin/queue/retry-job \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jobId": "job_123"}'
```

## Integration Testing

Complete workflow test:

```bash
#!/bin/bash

TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@lumiku.com", "password": "password123"}' \
  | jq -r '.data.token')

echo "Token: $TOKEN"

# Get categories
curl -s -X GET http://localhost:3000/api/pose-generator/categories \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Create project
PROJECT_ID=$(curl -s -X POST http://localhost:3000/api/pose-generator/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"projectName": "Test"}' | jq -r '.data.id')

echo "Project ID: $PROJECT_ID"

# Start generation
GEN_ID=$(curl -s -X POST "http://localhost:3000/api/pose-generator/projects/$PROJECT_ID/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"generationType": "GALLERY_REFERENCE", "poseIds": ["pose_1"]}' \
  | jq -r '.data.generationId')

echo "Generation ID: $GEN_ID"

# Poll status
for i in {1..10}; do
  curl -s -X GET "http://localhost:3000/api/pose-generator/generations/$GEN_ID" \
    -H "Authorization: Bearer $TOKEN" | jq '.data.status'
  sleep 2
done
```

## Troubleshooting

### Common Issues

**"Unauthorized - Invalid token"**
- Ensure token is valid (7 days default)
- Check format includes "Bearer " prefix
- Re-authenticate for fresh token

**"Forbidden - Insufficient credits"**
- Add test credits via database:
```bash
psql $DATABASE_URL -c "INSERT INTO credits (user_id, amount, balance, type) VALUES ('user_123', 1000, 1000, 'bonus');"
```

**WebSocket disconnects immediately**
- Verify endpoint is correct
- Check token validity
- Verify generation ID exists

**Queue jobs stuck in "active" status**
- Ensure worker is running: npm run worker
- Manually retry via API

**Generation times out**
- Increase timeout: GENERATION_TIMEOUT_MS=300000
- Reduce batch size
- Check AI service status

## Performance Testing

Load test with multiple concurrent generations:

```bash
TOKEN="your_token"

for i in {1..5}; do
  (
    PROJECT_ID=$(curl -s -X POST http://localhost:3000/api/pose-generator/projects \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"projectName\": \"Test $i\"}" | jq -r '.data.id')

    curl -s -X POST "http://localhost:3000/api/pose-generator/projects/$PROJECT_ID/generate" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"generationType": "GALLERY_REFERENCE", "poseIds": ["pose_1"]}' | jq '.'
  ) &
done

wait
```

## Debugging

Enable debug logging in code:

```typescript
import { logger } from '../lib/logger'

logger.debug('Generation started', { generationId, userId })
logger.error('Generation failed', { error, generationId })
```

Monitor Redis commands:

```bash
redis-cli MONITOR
```

Check memory usage:

```bash
redis-cli INFO memory
```

