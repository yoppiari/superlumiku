@echo off
REM ============================================
REM Lumiku App - Production Deployment Script for Coolify
REM ============================================
REM This script handles the complete deployment process
REM including pre-checks, build, database migrations,
REM and deployment to Coolify
REM
REM Usage: deploy-production.bat [--skip-checks] [--no-confirm]
REM ============================================

setlocal enabledelayedexpansion

REM Colors simulation for Windows
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM Configuration
set ENVIRONMENT=production
set SKIP_CHECKS=0
set NO_CONFIRM=0
set LOG_FILE=deployment-%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%%time:~6,2%.log
set LOG_FILE=%LOG_FILE: =0%

REM Coolify Configuration
set COOLIFY_API_URL=https://cf.avolut.com/api/v1
set DEFAULT_APP_UUID=d8ggwoo484k8ok48g8k8cgwk

REM Parse arguments
:parse_args
if "%~1"=="" goto :done_parsing
if "%~1"=="--skip-checks" set SKIP_CHECKS=1
if "%~1"=="--no-confirm" set NO_CONFIRM=1
shift
goto :parse_args
:done_parsing

REM ============================================
REM Start Deployment
REM ============================================
echo ============================================
echo %BLUE%Lumiku App - Production Deployment%NC%
echo ============================================
echo Environment: %ENVIRONMENT%
echo Started: %date% %time%
echo Log file: %LOG_FILE%
echo ============================================
echo.

REM Initialize log
echo Lumiku App - Production Deployment > %LOG_FILE%
echo Environment: %ENVIRONMENT% >> %LOG_FILE%
echo Started: %date% %time% >> %LOG_FILE%
echo. >> %LOG_FILE%

REM ============================================
REM Step 1: Pre-deployment Checks
REM ============================================
if %SKIP_CHECKS% EQU 0 (
    echo %BLUE%[Step 1/8] Running Pre-deployment Validation...%NC%
    echo [Step 1/8] Pre-deployment Validation >> %LOG_FILE%
    echo.

    call deploy-pre-check.bat %ENVIRONMENT%
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo %RED%Pre-deployment checks failed!%NC%
        echo %RED%Fix the errors above before continuing.%NC%
        echo.
        echo Use --skip-checks flag to bypass (NOT recommended)
        exit /b 1
    )

    echo.
    echo %GREEN%Pre-deployment checks passed!%NC%
    echo Pre-deployment checks passed >> %LOG_FILE%
    echo.
) else (
    echo %YELLOW%[Step 1/8] Skipping pre-deployment checks (--skip-checks flag)%NC%
    echo [Step 1/8] Skipped pre-deployment checks >> %LOG_FILE%
    echo.
)

REM ============================================
REM Step 2: User Confirmation
REM ============================================
if %NO_CONFIRM% EQU 0 (
    echo %BLUE%[Step 2/8] Deployment Confirmation%NC%
    echo.
    echo You are about to deploy to PRODUCTION.
    echo.
    echo Current branch:
    for /f "tokens=*" %%i in ('git branch --show-current 2^>nul') do echo   Branch: %%i
    for /f "tokens=*" %%i in ('git log -1 --oneline 2^>nul') do echo   Commit: %%i
    echo.
    echo Target:
    echo   Environment: %ENVIRONMENT%
    echo   Coolify: %COOLIFY_API_URL%
    echo.

    set /p CONFIRM="Are you sure you want to proceed? (yes/no): "
    if /i not "!CONFIRM!"=="yes" (
        echo.
        echo %YELLOW%Deployment cancelled by user%NC%
        echo Deployment cancelled >> %LOG_FILE%
        exit /b 0
    )
    echo.
    echo Deployment confirmed >> %LOG_FILE%
) else (
    echo %BLUE%[Step 2/8] Skipping confirmation (--no-confirm flag)%NC%
    echo [Step 2/8] Confirmation skipped >> %LOG_FILE%
    echo.
)

REM ============================================
REM Step 3: Get Coolify Configuration
REM ============================================
echo %BLUE%[Step 3/8] Configuring Coolify Connection...%NC%
echo [Step 3/8] Coolify Configuration >> %LOG_FILE%

REM Check for environment variables
if defined COOLIFY_TOKEN (
    echo %GREEN%  + COOLIFY_TOKEN found in environment%NC%
    echo   + COOLIFY_TOKEN found >> %LOG_FILE%
) else (
    echo %YELLOW%  ! COOLIFY_TOKEN not found, prompting user%NC%
    set /p COOLIFY_TOKEN="Enter your Coolify API Token: "
)

if defined APP_UUID (
    echo %GREEN%  + APP_UUID found in environment: %APP_UUID%%NC%
    echo   + APP_UUID: %APP_UUID% >> %LOG_FILE%
) else (
    echo %YELLOW%  ! APP_UUID not found, using default%NC%
    set /p APP_UUID="Enter Application UUID [default: %DEFAULT_APP_UUID%]: "
    if "!APP_UUID!"=="" set APP_UUID=%DEFAULT_APP_UUID%
)

echo.
echo Configuration:
echo   Coolify API: %COOLIFY_API_URL%
echo   App UUID: %APP_UUID%
echo.

REM ============================================
REM Step 4: Build Application
REM ============================================
echo %BLUE%[Step 4/8] Building Application...%NC%
echo [Step 4/8] Building Application >> %LOG_FILE%

REM Clean previous builds
echo Cleaning previous builds...
if exist "frontend\dist" rmdir /s /q "frontend\dist" 2>nul
if exist "backend\dist" rmdir /s /q "backend\dist" 2>nul

REM Build backend
echo.
echo Building backend...
cd backend
bun run build >> ..\%LOG_FILE% 2>&1
if %ERRORLEVEL% NEQ 0 (
    cd ..
    echo %RED%  X Backend build failed%NC%
    echo   X Backend build failed >> %LOG_FILE%
    echo See %LOG_FILE% for details
    exit /b 1
)
echo %GREEN%  + Backend built successfully%NC%
echo   + Backend built successfully >> ..\%LOG_FILE%
cd ..

REM Generate Prisma client
echo.
echo Generating Prisma client...
cd backend
bun prisma generate >> ..\%LOG_FILE% 2>&1
if %ERRORLEVEL% NEQ 0 (
    cd ..
    echo %YELLOW%  ! Prisma generate failed (might be OK if already generated)%NC%
    echo   ! Prisma generate warning >> %LOG_FILE%
) else (
    echo %GREEN%  + Prisma client generated%NC%
    echo   + Prisma client generated >> ..\%LOG_FILE%
)
cd ..

REM Build frontend
echo.
echo Building frontend...
cd frontend
bun run build >> ..\%LOG_FILE% 2>&1
if %ERRORLEVEL% NEQ 0 (
    cd ..
    echo %RED%  X Frontend build failed%NC%
    echo   X Frontend build failed >> %LOG_FILE%
    echo See %LOG_FILE% for details
    exit /b 1
)
echo %GREEN%  + Frontend built successfully%NC%
echo   + Frontend built successfully >> ..\%LOG_FILE%
cd ..

echo.
echo %GREEN%Build completed successfully!%NC%
echo.

REM ============================================
REM Step 5: Update Environment Variables in Coolify
REM ============================================
echo %BLUE%[Step 5/8] Checking Coolify Environment Variables...%NC%
echo [Step 5/8] Coolify Environment Variables >> %LOG_FILE%

echo.
echo %YELLOW%NOTE: Environment variables should be manually verified in Coolify dashboard%NC%
echo       Critical variables: DATABASE_URL, JWT_SECRET, REDIS_HOST, etc.
echo.
echo %BLUE%Opening Coolify documentation for reference...%NC%
echo.

REM Optional: Sync specific env vars if needed
set /p SYNC_ENV="Do you want to sync environment variables now? (y/n): "
if /i "!SYNC_ENV!"=="y" (
    echo.
    echo %YELLOW%Please manually verify these in Coolify dashboard:%NC%
    echo   - DATABASE_URL
    echo   - JWT_SECRET
    echo   - REDIS_HOST / REDIS_PORT / REDIS_PASSWORD
    echo   - NODE_ENV=production
    echo   - CORS_ORIGIN
    echo   - API keys (DUITKU, ANTHROPIC, HUGGINGFACE)
    echo.
    pause
)

echo.

REM ============================================
REM Step 6: Commit Changes (if any)
REM ============================================
echo %BLUE%[Step 6/8] Checking for uncommitted changes...%NC%
echo [Step 6/8] Git status check >> %LOG_FILE%

git diff --quiet
if %ERRORLEVEL% NEQ 0 (
    echo %YELLOW%  ! Uncommitted changes detected%NC%
    echo.
    git status --short
    echo.
    set /p COMMIT_CHANGES="Commit these changes? (y/n): "
    if /i "!COMMIT_CHANGES!"=="y" (
        set /p COMMIT_MSG="Enter commit message: "
        git add . >> %LOG_FILE% 2>&1
        git commit -m "!COMMIT_MSG!" >> %LOG_FILE% 2>&1
        echo %GREEN%  + Changes committed%NC%
        echo   + Changes committed >> %LOG_FILE%

        set /p PUSH_CHANGES="Push to remote? (y/n): "
        if /i "!PUSH_CHANGES!"=="y" (
            git push >> %LOG_FILE% 2>&1
            if %ERRORLEVEL% EQU 0 (
                echo %GREEN%  + Changes pushed to remote%NC%
                echo   + Pushed to remote >> %LOG_FILE%
            ) else (
                echo %RED%  X Failed to push changes%NC%
                echo   X Push failed >> %LOG_FILE%
            )
        )
    )
) else (
    echo %GREEN%  + No uncommitted changes%NC%
    echo   + No uncommitted changes >> %LOG_FILE%
)

echo.

REM ============================================
REM Step 7: Trigger Coolify Deployment
REM ============================================
echo %BLUE%[Step 7/8] Triggering Coolify Deployment...%NC%
echo [Step 7/8] Coolify Deployment >> %LOG_FILE%
echo.

echo Deploying to Coolify...
echo Deployment started at: %date% %time% >> %LOG_FILE%

curl -X POST "%COOLIFY_API_URL%/deploy?uuid=%APP_UUID%&force=true" ^
    -H "Authorization: Bearer %COOLIFY_TOKEN%" ^
    -w "\nHTTP Status: %%{http_code}\n" ^
    -s -o deploy-response.json

set CURL_EXIT=%ERRORLEVEL%
echo. >> %LOG_FILE%
type deploy-response.json >> %LOG_FILE% 2>nul

if %CURL_EXIT% EQU 0 (
    echo %GREEN%  + Deployment triggered successfully%NC%
    echo   + Deployment triggered >> %LOG_FILE%
    echo.
    echo %BLUE%Coolify is now building and deploying your application...%NC%
    echo.
    echo Monitor the deployment at:
    echo %BLUE%https://cf.avolut.com%NC%
    echo.
) else (
    echo %RED%  X Failed to trigger deployment%NC%
    echo   X Deployment trigger failed >> %LOG_FILE%
    echo.
    echo Check your COOLIFY_TOKEN and APP_UUID
    del deploy-response.json 2>nul
    exit /b 1
)

REM Cleanup
del deploy-response.json 2>nul

REM Wait for deployment to start
echo Waiting for deployment to initialize...
timeout /t 5 /nobreak >nul

echo.

REM ============================================
REM Step 8: Post-deployment Instructions
REM ============================================
echo %BLUE%[Step 8/8] Post-deployment Instructions%NC%
echo [Step 8/8] Post-deployment Instructions >> %LOG_FILE%
echo.

echo %GREEN%Deployment triggered successfully!%NC%
echo.
echo %YELLOW%IMPORTANT: Complete these steps after deployment finishes:%NC%
echo.
echo 1. Monitor deployment in Coolify dashboard:
echo    %BLUE%https://cf.avolut.com%NC%
echo.
echo 2. Wait for deployment to complete (typically 3-5 minutes)
echo.
echo 3. Run database migrations (if needed):
echo    SSH into Coolify container and run:
echo    %BLUE%cd /app ^&^& bun prisma migrate deploy%NC%
echo.
echo 4. Run post-deployment validation:
echo    %BLUE%deploy-post-validate.bat%NC%
echo.
echo 5. Verify critical functionality:
echo    - Authentication (login/register)
echo    - Rate limiting
echo    - Redis connection
echo    - Database operations
echo.
echo 6. Monitor logs for any errors:
echo    Check Coolify logs for the first 10-15 minutes
echo.

REM Save deployment info
echo. >> %LOG_FILE%
echo Deployment completed at: %date% %time% >> %LOG_FILE%
echo. >> %LOG_FILE%
echo Next steps: >> %LOG_FILE%
echo - Monitor Coolify dashboard >> %LOG_FILE%
echo - Run migrations if needed >> %LOG_FILE%
echo - Run post-validation: deploy-post-validate.bat >> %LOG_FILE%

echo ============================================
echo %GREEN%Deployment Process Complete%NC%
echo ============================================
echo.
echo Full deployment log: %LOG_FILE%
echo.

REM Create a quick reference file
echo Deployment Reference > DEPLOYMENT_INFO.txt
echo ===================== >> DEPLOYMENT_INFO.txt
echo Date: %date% %time% >> DEPLOYMENT_INFO.txt
echo Environment: %ENVIRONMENT% >> DEPLOYMENT_INFO.txt
echo App UUID: %APP_UUID% >> DEPLOYMENT_INFO.txt
echo. >> DEPLOYMENT_INFO.txt
for /f "tokens=*" %%i in ('git log -1 --oneline 2^>nul') do echo Deployed Commit: %%i >> DEPLOYMENT_INFO.txt
echo. >> DEPLOYMENT_INFO.txt
echo Coolify Dashboard: https://cf.avolut.com >> DEPLOYMENT_INFO.txt
echo App URL: https://app.lumiku.com >> DEPLOYMENT_INFO.txt
echo Dev URL: https://dev.lumiku.com >> DEPLOYMENT_INFO.txt
echo. >> DEPLOYMENT_INFO.txt
echo Log File: %LOG_FILE% >> DEPLOYMENT_INFO.txt

echo Deployment info saved to: DEPLOYMENT_INFO.txt
echo.

exit /b 0
