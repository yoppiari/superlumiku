@echo off
REM ============================================
REM Avatar Creator AI Models - Quick Seed Script (Windows)
REM
REM This script seeds the AI models for Avatar Creator
REM Run this after setting up the database
REM ============================================

echo ==============================================
echo Avatar Creator - AI Models Setup
echo ==============================================
echo.

REM Check if we're in the right directory
if not exist "backend\package.json" (
    echo ❌ Error: Run this script from project root
    echo    Current directory: %CD%
    exit /b 1
)

REM Check environment variables
echo 🔍 Checking environment variables...
if "%DATABASE_URL%"=="" (
    echo ⚠️  Warning: DATABASE_URL not set
    echo    Loading from .env file...
    if exist ".env" (
        for /f "tokens=*" %%i in (.env) do set %%i
    ) else (
        echo ❌ Error: .env file not found
        exit /b 1
    )
)

if "%HUGGINGFACE_API_KEY%"=="" (
    echo ⚠️  Warning: HUGGINGFACE_API_KEY not set
    echo    This is required for Avatar Creator to work
    echo    Get your key from: https://huggingface.co/settings/tokens
)

echo ✅ Environment check passed
echo.

REM Navigate to backend
cd backend

echo 📦 Installing dependencies...
call npm install

echo.
echo 🌱 Seeding AI models...
echo    This will create/update AI models in the database
echo.

REM Run seed
call npm run seed

echo.
echo ==============================================
echo ✅ AI Models Setup Complete!
echo ==============================================
echo.
echo Next steps:
echo 1. Verify models in database:
echo    psql %DATABASE_URL% -c "SELECT name, tier, enabled FROM ai_models WHERE app_id = 'avatar-creator';"
echo.
echo 2. Restart backend services:
echo    pm2 restart backend
echo    pm2 restart worker
echo.
echo 3. Test avatar generation:
echo    Check AVATAR_CREATOR_AI_MODELS_SETUP.md for test commands
echo.
echo 4. Monitor logs:
echo    pm2 logs worker
echo.

cd ..
pause
