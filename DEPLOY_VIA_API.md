# Deploy Migrations via Coolify API (Alternative to Terminal)

If the terminal approach doesn't work, you can trigger migration commands via Coolify's API.

## Environment

```bash
COOLIFY_API_KEY="6|F8fuUh0PBuxLkX6aizP74MfczFueW6TjL5fBdSG57c7177d8"
COOLIFY_BASE_URL="https://cf.avolut.com"
APP_ID="d8ggwoo484k8ok48g8k8cgwk"
```

## Method 1: Execute Command via API

### Using cURL

```bash
curl -X POST "https://cf.avolut.com/api/v1/deploy" \
  -H "Authorization: Bearer 6|F8fuUh0PBuxLkX6aizP74MfczFueW6TjL5fBdSG57c7177d8" \
  -H "Content-Type: application/json" \
  -d '{
    "applicationId": "d8ggwoo484k8ok48g8k8cgwk",
    "command": "cd /app/backend && bunx prisma migrate deploy"
  }'
```

### Using PowerShell (Windows)

```powershell
$headers = @{
    "Authorization" = "Bearer 6|F8fuUh0PBuxLkX6aizP74MfczFueW6TjL5fBdSG57c7177d8"
    "Content-Type" = "application/json"
}

$body = @{
    applicationId = "d8ggwoo484k8ok48g8k8cgwk"
    command = "cd /app/backend && bunx prisma migrate deploy"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://cf.avolut.com/api/v1/deploy" -Method POST -Headers $headers -Body $body
```

## Method 2: Redeploy with Post-Deployment Hook

You can add a post-deployment script that automatically runs migrations after each deployment.

### Create Post-Deployment Script

Create file: `backend/scripts/post-deploy.sh`

```bash
#!/bin/bash
set -e

echo "Running post-deployment tasks..."

# Navigate to backend directory
cd /app/backend

# Run database migrations
echo "Deploying database migrations..."
bunx prisma migrate deploy

# Verify migration status
echo "Checking migration status..."
bunx prisma migrate status

# Seed database if needed (optional)
# echo "Seeding database..."
# bun run prisma:seed

echo "Post-deployment tasks completed successfully!"
```

### Update Dockerfile to Include Script

Add to Dockerfile (after line 79):

```dockerfile
# Copy post-deployment script
COPY backend/scripts/post-deploy.sh /app/backend/scripts/
RUN chmod +x /app/backend/scripts/post-deploy.sh
```

### Configure Coolify to Run Script

In Coolify UI:
1. Go to your application settings
2. Find "Post Deployment Command" section
3. Add: `/app/backend/scripts/post-deploy.sh`

## Method 3: Manual Docker Exec

If you have SSH access to the Coolify server:

```bash
# SSH into Coolify server
ssh user@cf.avolut.com

# Find container ID
docker ps | grep lumiku

# Execute migration command
docker exec <container-id> sh -c "cd /app/backend && bunx prisma migrate deploy"

# Check migration status
docker exec <container-id> sh -c "cd /app/backend && bunx prisma migrate status"

# Seed database
docker exec <container-id> sh -c "cd /app/backend && bun run prisma:seed"
```

## Method 4: Add to Docker Entrypoint

Modify `docker/docker-entrypoint.sh` to run migrations on startup:

```bash
#!/bin/bash
set -e

echo "Starting Lumiku application..."

# Run database migrations
echo "Running database migrations..."
cd /app/backend
bunx prisma migrate deploy || echo "Migration failed or no pending migrations"

# Generate Prisma client (ensure it's up to date)
bunx prisma generate || echo "Prisma generate failed"

# Start services
echo "Starting services..."
# ... rest of entrypoint script
```

**WARNING**: This runs migrations on EVERY container start, which can be slow. Use with caution.

## Method 5: GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Coolify

on:
  push:
    branches: [main, production]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Coolify Deployment
        run: |
          curl -X POST "https://cf.avolut.com/api/v1/deploy" \
            -H "Authorization: Bearer ${{ secrets.COOLIFY_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{
              "applicationId": "${{ secrets.COOLIFY_APP_ID }}",
              "force": true
            }'

      - name: Wait for deployment
        run: sleep 60

      - name: Run migrations
        run: |
          curl -X POST "https://cf.avolut.com/api/v1/execute" \
            -H "Authorization: Bearer ${{ secrets.COOLIFY_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{
              "applicationId": "${{ secrets.COOLIFY_APP_ID }}",
              "command": "cd /app/backend && bunx prisma migrate deploy"
            }'
```

## Recommended Approach

**For immediate fix**: Use Method 1 (Terminal with bunx command)

**For long-term**: Use Method 2 (Post-deployment hook) + Method 5 (GitHub Actions)

This ensures:
- Migrations run automatically after each deployment
- No manual intervention needed
- Consistent deployment process
- Audit trail via GitHub Actions logs

## Verification

After running migrations via any method:

```bash
# Check migration status
bunx prisma migrate status

# Verify database schema
bunx prisma db pull

# Test application
curl https://dev.lumiku.com/health
curl https://dev.lumiku.com/api/apps
```

## Troubleshooting

### API returns 401 Unauthorized
- Check API key is correct
- Verify key has permissions for the application

### API returns 404 Not Found
- Verify application ID is correct
- Check Coolify API endpoint URL

### Command fails silently
- Check Coolify application logs
- Verify container is running
- Test command manually in terminal first

### Migration fails with timeout
- Increase timeout in Coolify settings
- Run migration in smaller batches
- Check database connection pooling

## Security Notes

- Never commit API keys to version control
- Use environment variables or secrets management
- Rotate API keys regularly
- Limit API key permissions to minimum required
- Use separate API keys for dev/staging/production

## Support

If all methods fail:
1. Check Coolify documentation: https://coolify.io/docs
2. Check Coolify Discord/GitHub for known issues
3. Verify database connectivity from container
4. Contact Coolify support with application ID and error logs
