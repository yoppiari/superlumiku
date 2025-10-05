# PowerShell script to copy environment variables to clipboard
# Run this, then paste in Coolify UI Environment Variables section

$envContent = @"
DATABASE_URL=postgresql://lumiku_user:LumikuSecure2025!@postgres:5432/lumiku_production?schema=public
POSTGRES_USER=lumiku_user
POSTGRES_PASSWORD=LumikuSecure2025!
POSTGRES_DB=lumiku_production
POSTGRES_HOST=postgres
PORT=3000
NODE_ENV=production
JWT_SECRET=zvgDJtehGk1RJIbKDy8cB+UflTPP+m11quRZDX42HFU=
JWT_EXPIRES_IN=7d
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
UPLOAD_PATH=./uploads
OUTPUT_PATH=./outputs
MAX_FILE_SIZE=524288000
FFMPEG_PATH=ffmpeg
FFPROBE_PATH=ffprobe
CORS_ORIGIN=https://cf.avolut.com
DUITKU_MERCHANT_CODE=your-merchant-code
DUITKU_API_KEY=your-api-key
DUITKU_ENV=production
DUITKU_CALLBACK_URL=https://cf.avolut.com/api/payments/callback
DUITKU_RETURN_URL=https://cf.avolut.com/payments/status
ANTHROPIC_API_KEY=
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
"@

# Copy to clipboard
Set-Clipboard -Value $envContent

Write-Host "✅ Environment variables copied to clipboard!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open Coolify: https://cf.avolut.com" -ForegroundColor Cyan
Write-Host "2. Go to SuperLumiku application" -ForegroundColor Cyan
Write-Host "3. Click Configuration tab" -ForegroundColor Cyan
Write-Host "4. Scroll to Environment Variables section" -ForegroundColor Cyan
Write-Host "5. Press Ctrl+V to paste all variables" -ForegroundColor Cyan
Write-Host "6. Click Save" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANT: Update these values:" -ForegroundColor Red
Write-Host "   - DUITKU_MERCHANT_CODE (your production merchant code)" -ForegroundColor Yellow
Write-Host "   - DUITKU_API_KEY (your production API key)" -ForegroundColor Yellow
Write-Host ""
