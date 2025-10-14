@echo off
REM ============================================
REM Lumiku App - Pre-Deployment Validation Script
REM ============================================
REM This script validates the environment and codebase
REM before deploying to production on Coolify
REM
REM Usage: deploy-pre-check.bat [environment]
REM Example: deploy-pre-check.bat production
REM ============================================

setlocal enabledelayedexpansion

REM Colors simulation for Windows
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM Configuration
set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=production

set ERROR_COUNT=0
set WARNING_COUNT=0
set LOG_FILE=deployment-pre-check-%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%%time:~6,2%.log
set LOG_FILE=%LOG_FILE: =0%

echo ============================================
echo %BLUE%Lumiku App - Pre-Deployment Validation%NC%
echo ============================================
echo Environment: %ENVIRONMENT%
echo Started: %date% %time%
echo Log file: %LOG_FILE%
echo ============================================
echo.

REM Start logging
echo Lumiku App - Pre-Deployment Validation > %LOG_FILE%
echo Environment: %ENVIRONMENT% >> %LOG_FILE%
echo Started: %date% %time% >> %LOG_FILE%
echo. >> %LOG_FILE%

REM ============================================
REM 1. Environment Variables Validation
REM ============================================
echo %BLUE%[1/9] Checking Environment Variables...%NC%
echo [1/9] Checking Environment Variables... >> %LOG_FILE%

REM Check for .env files
if not exist ".env.%ENVIRONMENT%" (
    echo %RED%  X .env.%ENVIRONMENT% not found%NC%
    echo   X .env.%ENVIRONMENT% not found >> %LOG_FILE%
    set /a ERROR_COUNT+=1
) else (
    echo %GREEN%  + .env.%ENVIRONMENT% exists%NC%
    echo   + .env.%ENVIRONMENT% exists >> %LOG_FILE%
)

if not exist "backend\.env" (
    echo %YELLOW%  ! backend\.env not found (using .env.%ENVIRONMENT%)%NC%
    echo   ! backend\.env not found >> %LOG_FILE%
    set /a WARNING_COUNT+=1
) else (
    echo %GREEN%  + backend\.env exists%NC%
    echo   + backend\.env exists >> %LOG_FILE%
)

REM Check critical environment variables
call :check_env_var "DATABASE_URL"
call :check_env_var "JWT_SECRET"
call :check_env_var "REDIS_HOST"
call :check_env_var "REDIS_PORT"
call :check_env_var "NODE_ENV"
call :check_env_var "PORT"
call :check_env_var "CORS_ORIGIN"

REM Warn about sensitive variables
call :warn_env_var "DUITKU_API_KEY"
call :warn_env_var "ANTHROPIC_API_KEY"
call :warn_env_var "HUGGINGFACE_API_KEY"

echo.

REM ============================================
REM 2. Git Status Check
REM ============================================
echo %BLUE%[2/9] Checking Git Status...%NC%
echo [2/9] Checking Git Status... >> %LOG_FILE%

git status >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo %RED%  X Not a git repository%NC%
    echo   X Not a git repository >> %LOG_FILE%
    set /a ERROR_COUNT+=1
) else (
    echo %GREEN%  + Git repository detected%NC%
    echo   + Git repository detected >> %LOG_FILE%

    REM Check for uncommitted changes
    git diff --quiet
    if %ERRORLEVEL% NEQ 0 (
        echo %YELLOW%  ! Uncommitted changes detected%NC%
        echo   ! Uncommitted changes detected >> %LOG_FILE%
        set /a WARNING_COUNT+=1
        git status --short >> %LOG_FILE%
    ) else (
        echo %GREEN%  + No uncommitted changes%NC%
        echo   + No uncommitted changes >> %LOG_FILE%
    )

    REM Get current branch
    for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
    echo %BLUE%  * Current branch: !CURRENT_BRANCH!%NC%
    echo   * Current branch: !CURRENT_BRANCH! >> %LOG_FILE%

    REM Get latest commit
    for /f "tokens=*" %%i in ('git log -1 --oneline') do set LATEST_COMMIT=%%i
    echo %BLUE%  * Latest commit: !LATEST_COMMIT!%NC%
    echo   * Latest commit: !LATEST_COMMIT! >> %LOG_FILE%
)

echo.

REM ============================================
REM 3. Node/Bun and Dependencies Check
REM ============================================
echo %BLUE%[3/9] Checking Runtime and Dependencies...%NC%
echo [3/9] Checking Runtime and Dependencies... >> %LOG_FILE%

REM Check for Bun (preferred) or Node
bun --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('bun --version') do set BUN_VERSION=%%i
    echo %GREEN%  + Bun version: !BUN_VERSION!%NC%
    echo   + Bun version: !BUN_VERSION! >> %LOG_FILE%
    set RUNTIME=bun
) else (
    node --version >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
        echo %YELLOW%  ! Node.js version: !NODE_VERSION! (Bun recommended)%NC%
        echo   ! Node.js version: !NODE_VERSION! >> %LOG_FILE%
        set /a WARNING_COUNT+=1
        set RUNTIME=node
    ) else (
        echo %RED%  X Neither Bun nor Node.js found%NC%
        echo   X Neither Bun nor Node.js found >> %LOG_FILE%
        set /a ERROR_COUNT+=1
        set RUNTIME=none
    )
)

REM Check for node_modules
if not exist "node_modules" (
    echo %YELLOW%  ! node_modules not found - dependencies need to be installed%NC%
    echo   ! node_modules missing >> %LOG_FILE%
    set /a WARNING_COUNT+=1
) else (
    echo %GREEN%  + node_modules exists%NC%
    echo   + node_modules exists >> %LOG_FILE%
)

if not exist "backend\node_modules" (
    echo %YELLOW%  ! backend\node_modules not found%NC%
    echo   ! backend\node_modules missing >> %LOG_FILE%
    set /a WARNING_COUNT+=1
) else (
    echo %GREEN%  + backend\node_modules exists%NC%
    echo   + backend\node_modules exists >> %LOG_FILE%
)

if not exist "frontend\node_modules" (
    echo %YELLOW%  ! frontend\node_modules not found%NC%
    echo   ! frontend\node_modules missing >> %LOG_FILE%
    set /a WARNING_COUNT+=1
) else (
    echo %GREEN%  + frontend\node_modules exists%NC%
    echo   + frontend\node_modules exists >> %LOG_FILE%
)

echo.

REM ============================================
REM 4. TypeScript Compilation Check
REM ============================================
echo %BLUE%[4/9] Running TypeScript Compilation Check...%NC%
echo [4/9] TypeScript Compilation Check... >> %LOG_FILE%

cd backend
if "%RUNTIME%"=="bun" (
    bun run build >> ..\%LOG_FILE% 2>&1
) else if "%RUNTIME%"=="node" (
    npm run build >> ..\%LOG_FILE% 2>&1
)

if %ERRORLEVEL% NEQ 0 (
    echo %RED%  X Backend TypeScript compilation failed%NC%
    echo   X Backend compilation failed >> ..\%LOG_FILE%
    set /a ERROR_COUNT+=1
) else (
    echo %GREEN%  + Backend compiled successfully%NC%
    echo   + Backend compiled successfully >> ..\%LOG_FILE%
)
cd ..

cd frontend
if "%RUNTIME%"=="bun" (
    bun run build >> ..\%LOG_FILE% 2>&1
) else if "%RUNTIME%"=="node" (
    npm run build >> ..\%LOG_FILE% 2>&1
)

if %ERRORLEVEL% NEQ 0 (
    echo %RED%  X Frontend TypeScript compilation failed%NC%
    echo   X Frontend compilation failed >> ..\%LOG_FILE%
    set /a ERROR_COUNT+=1
) else (
    echo %GREEN%  + Frontend compiled successfully%NC%
    echo   + Frontend compiled successfully >> ..\%LOG_FILE%
)
cd ..

echo.

REM ============================================
REM 5. Database Connection Check
REM ============================================
echo %BLUE%[5/9] Checking Database Connection...%NC%
echo [5/9] Checking Database Connection... >> %LOG_FILE%

REM This is a simplified check - actual connection test would require running a script
if exist "backend\prisma\schema.prisma" (
    echo %GREEN%  + Prisma schema found%NC%
    echo   + Prisma schema found >> %LOG_FILE%

    REM Check if Prisma client is generated
    if exist "backend\node_modules\.prisma\client" (
        echo %GREEN%  + Prisma client generated%NC%
        echo   + Prisma client generated >> %LOG_FILE%
    ) else (
        echo %YELLOW%  ! Prisma client not generated%NC%
        echo   ! Prisma client not generated >> %LOG_FILE%
        set /a WARNING_COUNT+=1
    )
) else (
    echo %RED%  X Prisma schema not found%NC%
    echo   X Prisma schema not found >> %LOG_FILE%
    set /a ERROR_COUNT+=1
)

echo.

REM ============================================
REM 6. Redis Configuration Check
REM ============================================
echo %BLUE%[6/9] Checking Redis Configuration...%NC%
echo [6/9] Checking Redis Configuration... >> %LOG_FILE%

REM Check if Redis is configured
if "%REDIS_HOST%"=="" (
    if "%ENVIRONMENT%"=="production" (
        echo %RED%  X REDIS_HOST not configured (REQUIRED for production)%NC%
        echo   X REDIS_HOST missing >> %LOG_FILE%
        set /a ERROR_COUNT+=1
    ) else (
        echo %YELLOW%  ! REDIS_HOST not configured%NC%
        echo   ! REDIS_HOST not configured >> %LOG_FILE%
        set /a WARNING_COUNT+=1
    )
) else (
    echo %GREEN%  + REDIS_HOST configured%NC%
    echo   + REDIS_HOST configured >> %LOG_FILE%
)

echo.

REM ============================================
REM 7. Security Configuration Check
REM ============================================
echo %BLUE%[7/9] Checking Security Configuration...%NC%
echo [7/9] Checking Security Configuration... >> %LOG_FILE%

REM Check JWT_SECRET strength
if defined JWT_SECRET (
    call :check_string_length "%JWT_SECRET%" 32
    if !ERRORLEVEL! EQU 0 (
        echo %GREEN%  + JWT_SECRET meets minimum length (32+ chars)%NC%
        echo   + JWT_SECRET length OK >> %LOG_FILE%
    ) else (
        echo %RED%  X JWT_SECRET too short (minimum 32 characters)%NC%
        echo   X JWT_SECRET too short >> %LOG_FILE%
        set /a ERROR_COUNT+=1
    )
) else (
    echo %RED%  X JWT_SECRET not set%NC%
    echo   X JWT_SECRET not set >> %LOG_FILE%
    set /a ERROR_COUNT+=1
)

REM Check if rate limiting is enabled
if "%RATE_LIMIT_ENABLED%"=="false" (
    echo %YELLOW%  ! Rate limiting is disabled%NC%
    echo   ! Rate limiting disabled >> %LOG_FILE%
    set /a WARNING_COUNT+=1
) else (
    echo %GREEN%  + Rate limiting enabled%NC%
    echo   + Rate limiting enabled >> %LOG_FILE%
)

REM Check for default/weak credentials
findstr /C:"CHANGE_THIS" .env.%ENVIRONMENT% >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo %RED%  X Default credentials detected in .env.%ENVIRONMENT%%NC%
    echo   X Default credentials detected >> %LOG_FILE%
    set /a ERROR_COUNT+=1
) else (
    echo %GREEN%  + No default credentials detected%NC%
    echo   + No default credentials detected >> %LOG_FILE%
)

echo.

REM ============================================
REM 8. File Structure Validation
REM ============================================
echo %BLUE%[8/9] Validating File Structure...%NC%
echo [8/9] Validating File Structure... >> %LOG_FILE%

call :check_file "backend\src\index.ts"
call :check_file "backend\src\app.ts"
call :check_file "backend\prisma\schema.prisma"
call :check_file "frontend\src\main.tsx"
call :check_file "package.json"
call :check_file "backend\package.json"
call :check_file "frontend\package.json"

REM Check for critical directories
call :check_directory "backend\src\routes"
call :check_directory "backend\src\middleware"
call :check_directory "backend\src\workers"
call :check_directory "frontend\src\pages"

echo.

REM ============================================
REM 9. Deployment-specific Checks
REM ============================================
echo %BLUE%[9/9] Running Deployment-specific Checks...%NC%
echo [9/9] Deployment-specific Checks... >> %LOG_FILE%

REM Check for Coolify configuration
if "%ENVIRONMENT%"=="production" (
    if not defined COOLIFY_TOKEN (
        echo %YELLOW%  ! COOLIFY_TOKEN not set (needed for automated deployment)%NC%
        echo   ! COOLIFY_TOKEN not set >> %LOG_FILE%
        set /a WARNING_COUNT+=1
    ) else (
        echo %GREEN%  + COOLIFY_TOKEN configured%NC%
        echo   + COOLIFY_TOKEN configured >> %LOG_FILE%
    )

    if not defined APP_UUID (
        echo %YELLOW%  ! APP_UUID not set (using default: d8ggwoo484k8ok48g8k8cgwk)%NC%
        echo   ! APP_UUID not set >> %LOG_FILE%
        set /a WARNING_COUNT+=1
        set APP_UUID=d8ggwoo484k8ok48g8k8cgwk
    ) else (
        echo %GREEN%  + APP_UUID configured%NC%
        echo   + APP_UUID configured >> %LOG_FILE%
    )
)

REM Check build artifacts
if exist "frontend\dist" (
    echo %GREEN%  + Frontend build artifacts exist%NC%
    echo   + Frontend dist exists >> %LOG_FILE%
) else (
    echo %YELLOW%  ! Frontend dist not found (will be built during deployment)%NC%
    echo   ! Frontend dist not found >> %LOG_FILE%
    set /a WARNING_COUNT+=1
)

echo.

REM ============================================
REM Final Report
REM ============================================
echo ============================================
echo %BLUE%Pre-Deployment Validation Complete%NC%
echo ============================================
echo.

if %ERROR_COUNT% EQU 0 (
    if %WARNING_COUNT% EQU 0 (
        echo %GREEN%Result: PASS - Ready for deployment%NC%
        echo Result: PASS - Ready for deployment >> %LOG_FILE%
        echo.
        echo %GREEN%All checks passed successfully!%NC%
        echo No errors or warnings detected.
    ) else (
        echo %YELLOW%Result: PASS with warnings%NC%
        echo Result: PASS with warnings >> %LOG_FILE%
        echo.
        echo %YELLOW%Warnings: %WARNING_COUNT%%NC%
        echo Deployment can proceed, but review warnings above.
    )
) else (
    echo %RED%Result: FAIL - Cannot deploy%NC%
    echo Result: FAIL - Cannot deploy >> %LOG_FILE%
    echo.
    echo %RED%Errors: %ERROR_COUNT%%NC%
    echo %YELLOW%Warnings: %WARNING_COUNT%%NC%
    echo.
    echo Please fix the errors above before deploying.
)

echo.
echo Full log saved to: %LOG_FILE%
echo ============================================
echo.

if %ERROR_COUNT% GTR 0 (
    exit /b 1
) else (
    exit /b 0
)

REM ============================================
REM Helper Functions
REM ============================================

:check_env_var
set VAR_NAME=%~1
set VAR_VALUE=!%VAR_NAME%!
if "!VAR_VALUE!"=="" (
    echo %RED%  X %VAR_NAME% not set%NC%
    echo   X %VAR_NAME% not set >> %LOG_FILE%
    set /a ERROR_COUNT+=1
) else (
    echo %GREEN%  + %VAR_NAME% is set%NC%
    echo   + %VAR_NAME% is set >> %LOG_FILE%
)
goto :eof

:warn_env_var
set VAR_NAME=%~1
set VAR_VALUE=!%VAR_NAME%!
if "!VAR_VALUE!"=="" (
    echo %YELLOW%  ! %VAR_NAME% not set%NC%
    echo   ! %VAR_NAME% not set >> %LOG_FILE%
    set /a WARNING_COUNT+=1
) else (
    echo %GREEN%  + %VAR_NAME% is set%NC%
    echo   + %VAR_NAME% is set >> %LOG_FILE%
)
goto :eof

:check_file
if exist "%~1" (
    echo %GREEN%  + %~1 exists%NC%
    echo   + %~1 exists >> %LOG_FILE%
) else (
    echo %RED%  X %~1 not found%NC%
    echo   X %~1 not found >> %LOG_FILE%
    set /a ERROR_COUNT+=1
)
goto :eof

:check_directory
if exist "%~1" (
    echo %GREEN%  + %~1 exists%NC%
    echo   + %~1 exists >> %LOG_FILE%
) else (
    echo %RED%  X %~1 not found%NC%
    echo   X %~1 not found >> %LOG_FILE%
    set /a ERROR_COUNT+=1
)
goto :eof

:check_string_length
set "str=%~1"
set "min_len=%~2"
set "len=0"
if defined str (
    for /l %%i in (12,-1,0) do (
        set /a "len|=1<<%%i"
        for %%j in (!len!) do if "!str:~%%j,1!"=="" set /a "len&=~1<<%%i"
    )
    set /a len+=1
)
if !len! GEQ %min_len% (
    exit /b 0
) else (
    exit /b 1
)
goto :eof
