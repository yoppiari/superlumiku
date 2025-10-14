@echo off
REM ============================================
REM Lumiku App - Post-Deployment Validation Script
REM ============================================
REM This script validates the deployed application
REM by testing critical endpoints, services, and functionality
REM
REM Usage: deploy-post-validate.bat [environment] [base-url]
REM Example: deploy-post-validate.bat production https://app.lumiku.com
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

set BASE_URL=%2
if "%BASE_URL%"=="" (
    if "%ENVIRONMENT%"=="production" (
        set BASE_URL=https://app.lumiku.com
    ) else (
        set BASE_URL=https://dev.lumiku.com
    )
)

set ERROR_COUNT=0
set WARNING_COUNT=0
set SUCCESS_COUNT=0
set LOG_FILE=post-deployment-validation-%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%%time:~6,2%.log
set LOG_FILE=%LOG_FILE: =0%

echo ============================================
echo %BLUE%Lumiku App - Post-Deployment Validation%NC%
echo ============================================
echo Environment: %ENVIRONMENT%
echo Base URL: %BASE_URL%
echo Started: %date% %time%
echo Log file: %LOG_FILE%
echo ============================================
echo.

REM Initialize log
echo Lumiku App - Post-Deployment Validation > %LOG_FILE%
echo Environment: %ENVIRONMENT% >> %LOG_FILE%
echo Base URL: %BASE_URL% >> %LOG_FILE%
echo Started: %date% %time% >> %LOG_FILE%
echo. >> %LOG_FILE%

REM ============================================
REM Test 1: Health Check Endpoint
REM ============================================
echo %BLUE%[Test 1/10] Health Check Endpoint%NC%
echo [Test 1/10] Health Check Endpoint >> %LOG_FILE%

curl -s -o health-response.json -w "%%{http_code}" "%BASE_URL%/health" > http-code.tmp
set /p HTTP_CODE=<http-code.tmp

if "%HTTP_CODE%"=="200" (
    echo %GREEN%  + Health endpoint returned 200 OK%NC%
    echo   + Health endpoint OK >> %LOG_FILE%
    type health-response.json >> %LOG_FILE%
    set /a SUCCESS_COUNT+=1
) else (
    echo %RED%  X Health endpoint failed (HTTP %HTTP_CODE%)%NC%
    echo   X Health endpoint failed: HTTP %HTTP_CODE% >> %LOG_FILE%
    set /a ERROR_COUNT+=1
)

del health-response.json http-code.tmp 2>nul
echo.

REM ============================================
REM Test 2: API Base Endpoint
REM ============================================
echo %BLUE%[Test 2/10] API Base Endpoint%NC%
echo [Test 2/10] API Base Endpoint >> %LOG_FILE%

curl -s -o api-response.json -w "%%{http_code}" "%BASE_URL%/api" > http-code.tmp
set /p HTTP_CODE=<http-code.tmp

if "%HTTP_CODE%"=="200" (
    echo %GREEN%  + API base endpoint returned 200 OK%NC%
    echo   + API endpoint OK >> %LOG_FILE%
    set /a SUCCESS_COUNT+=1
) else (
    echo %YELLOW%  ! API base endpoint returned HTTP %HTTP_CODE%%NC%
    echo   ! API endpoint: HTTP %HTTP_CODE% >> %LOG_FILE%
    set /a WARNING_COUNT+=1
)

del api-response.json http-code.tmp 2>nul
echo.

REM ============================================
REM Test 3: Database Connection (via health endpoint)
REM ============================================
echo %BLUE%[Test 3/10] Database Connection%NC%
echo [Test 3/10] Database Connection >> %LOG_FILE%

curl -s "%BASE_URL%/health" | findstr /C:"database" >nul
if %ERRORLEVEL% EQU 0 (
    echo %GREEN%  + Database connection verified%NC%
    echo   + Database connection OK >> %LOG_FILE%
    set /a SUCCESS_COUNT+=1
) else (
    echo %YELLOW%  ! Could not verify database connection%NC%
    echo   ! Database verification inconclusive >> %LOG_FILE%
    set /a WARNING_COUNT+=1
)

echo.

REM ============================================
REM Test 4: Redis Connection
REM ============================================
echo %BLUE%[Test 4/10] Redis Connection%NC%
echo [Test 4/10] Redis Connection >> %LOG_FILE%

curl -s "%BASE_URL%/health" | findstr /C:"redis" >nul
if %ERRORLEVEL% EQU 0 (
    echo %GREEN%  + Redis connection verified%NC%
    echo   + Redis connection OK >> %LOG_FILE%
    set /a SUCCESS_COUNT+=1
) else (
    echo %YELLOW%  ! Could not verify Redis connection%NC%
    echo   ! Redis verification inconclusive >> %LOG_FILE%
    set /a WARNING_COUNT+=1
)

echo.

REM ============================================
REM Test 5: Authentication Endpoints
REM ============================================
echo %BLUE%[Test 5/10] Authentication Endpoints%NC%
echo [Test 5/10] Authentication Endpoints >> %LOG_FILE%

REM Test login endpoint (should return 400/401 for invalid credentials, not 500)
curl -s -o auth-response.json -w "%%{http_code}" ^
    -X POST "%BASE_URL%/api/auth/login" ^
    -H "Content-Type: application/json" ^
    -d "{\"email\":\"test@test.com\",\"password\":\"test\"}" > http-code.tmp
set /p HTTP_CODE=<http-code.tmp

if "%HTTP_CODE%"=="400" (
    echo %GREEN%  + Login endpoint responding correctly (400 for invalid data)%NC%
    echo   + Login endpoint OK >> %LOG_FILE%
    set /a SUCCESS_COUNT+=1
) else if "%HTTP_CODE%"=="401" (
    echo %GREEN%  + Login endpoint responding correctly (401 unauthorized)%NC%
    echo   + Login endpoint OK >> %LOG_FILE%
    set /a SUCCESS_COUNT+=1
) else if "%HTTP_CODE%"=="429" (
    echo %GREEN%  + Login endpoint with rate limiting active (429)%NC%
    echo   + Login endpoint OK (rate limited) >> %LOG_FILE%
    set /a SUCCESS_COUNT+=1
) else if "%HTTP_CODE%"=="500" (
    echo %RED%  X Login endpoint returning server error (500)%NC%
    echo   X Login endpoint error: 500 >> %LOG_FILE%
    type auth-response.json >> %LOG_FILE%
    set /a ERROR_COUNT+=1
) else (
    echo %YELLOW%  ! Login endpoint returned HTTP %HTTP_CODE%%NC%
    echo   ! Login endpoint: HTTP %HTTP_CODE% >> %LOG_FILE%
    set /a WARNING_COUNT+=1
)

del auth-response.json http-code.tmp 2>nul
echo.

REM ============================================
REM Test 6: Rate Limiting
REM ============================================
echo %BLUE%[Test 6/10] Rate Limiting%NC%
echo [Test 6/10] Rate Limiting >> %LOG_FILE%

echo Testing rate limiting by making multiple requests...
set RATE_LIMIT_TRIGGERED=0

for /L %%i in (1,1,10) do (
    curl -s -o nul -w "%%{http_code}" ^
        -X POST "%BASE_URL%/api/auth/login" ^
        -H "Content-Type: application/json" ^
        -d "{\"email\":\"test@test.com\",\"password\":\"test\"}" > http-code.tmp
    set /p HTTP_CODE=<http-code.tmp

    if "!HTTP_CODE!"=="429" (
        set RATE_LIMIT_TRIGGERED=1
    )
)

if %RATE_LIMIT_TRIGGERED% EQU 1 (
    echo %GREEN%  + Rate limiting is active (429 Too Many Requests)%NC%
    echo   + Rate limiting working >> %LOG_FILE%
    set /a SUCCESS_COUNT+=1
) else (
    echo %YELLOW%  ! Rate limiting not triggered (might be configured with high limits)%NC%
    echo   ! Rate limiting not verified >> %LOG_FILE%
    set /a WARNING_COUNT+=1
)

del http-code.tmp 2>nul
echo.

REM ============================================
REM Test 7: CORS Configuration
REM ============================================
echo %BLUE%[Test 7/10] CORS Configuration%NC%
echo [Test 7/10] CORS Configuration >> %LOG_FILE%

curl -s -I "%BASE_URL%/api" | findstr /C:"Access-Control-Allow-Origin" >nul
if %ERRORLEVEL% EQU 0 (
    echo %GREEN%  + CORS headers present%NC%
    echo   + CORS configured >> %LOG_FILE%
    set /a SUCCESS_COUNT+=1
) else (
    echo %YELLOW%  ! CORS headers not detected%NC%
    echo   ! CORS headers not found >> %LOG_FILE%
    set /a WARNING_COUNT+=1
)

echo.

REM ============================================
REM Test 8: Dashboard API
REM ============================================
echo %BLUE%[Test 8/10] Dashboard API%NC%
echo [Test 8/10] Dashboard API >> %LOG_FILE%

curl -s -o apps-response.json -w "%%{http_code}" "%BASE_URL%/api/apps" > http-code.tmp
set /p HTTP_CODE=<http-code.tmp

if "%HTTP_CODE%"=="200" (
    echo %GREEN%  + Dashboard apps endpoint accessible%NC%
    echo   + Dashboard API OK >> %LOG_FILE%
    set /a SUCCESS_COUNT+=1
) else if "%HTTP_CODE%"=="401" (
    echo %GREEN%  + Dashboard apps endpoint requires auth (401)%NC%
    echo   + Dashboard API OK (auth required) >> %LOG_FILE%
    set /a SUCCESS_COUNT+=1
) else (
    echo %YELLOW%  ! Dashboard apps endpoint returned HTTP %HTTP_CODE%%NC%
    echo   ! Dashboard API: HTTP %HTTP_CODE% >> %LOG_FILE%
    set /a WARNING_COUNT+=1
)

del apps-response.json http-code.tmp 2>nul
echo.

REM ============================================
REM Test 9: Static Assets
REM ============================================
echo %BLUE%[Test 9/10] Static Assets (Frontend)%NC%
echo [Test 9/10] Static Assets >> %LOG_FILE%

curl -s -o index-response.html -w "%%{http_code}" "%BASE_URL%/" > http-code.tmp
set /p HTTP_CODE=<http-code.tmp

if "%HTTP_CODE%"=="200" (
    findstr /C:"<!DOCTYPE" index-response.html >nul
    if !ERRORLEVEL! EQU 0 (
        echo %GREEN%  + Frontend is serving correctly%NC%
        echo   + Frontend OK >> %LOG_FILE%
        set /a SUCCESS_COUNT+=1
    ) else (
        echo %YELLOW%  ! Frontend response doesn't look like HTML%NC%
        echo   ! Frontend unexpected response >> %LOG_FILE%
        set /a WARNING_COUNT+=1
    )
) else (
    echo %RED%  X Frontend not accessible (HTTP %HTTP_CODE%)%NC%
    echo   X Frontend error: HTTP %HTTP_CODE% >> %LOG_FILE%
    set /a ERROR_COUNT+=1
)

del index-response.html http-code.tmp 2>nul
echo.

REM ============================================
REM Test 10: Response Time Check
REM ============================================
echo %BLUE%[Test 10/10] Response Time Check%NC%
echo [Test 10/10] Response Time >> %LOG_FILE%

REM Measure response time for health endpoint
curl -s -o nul -w "Response time: %%{time_total}s\n" "%BASE_URL%/health"
echo   Response time logged >> %LOG_FILE%

echo.

REM ============================================
REM Summary Report
REM ============================================
echo ============================================
echo %BLUE%Post-Deployment Validation Summary%NC%
echo ============================================
echo.

set TOTAL_TESTS=10

echo Test Results:
echo %GREEN%  Passed: %SUCCESS_COUNT%/%TOTAL_TESTS%%NC%
if %WARNING_COUNT% GTR 0 (
    echo %YELLOW%  Warnings: %WARNING_COUNT%%NC%
)
if %ERROR_COUNT% GTR 0 (
    echo %RED%  Failed: %ERROR_COUNT%%NC%
)
echo.

REM Save summary to log
echo. >> %LOG_FILE%
echo Summary: >> %LOG_FILE%
echo   Passed: %SUCCESS_COUNT%/%TOTAL_TESTS% >> %LOG_FILE%
echo   Warnings: %WARNING_COUNT% >> %LOG_FILE%
echo   Failed: %ERROR_COUNT% >> %LOG_FILE%

REM Final assessment
if %ERROR_COUNT% EQU 0 (
    if %WARNING_COUNT% EQU 0 (
        echo %GREEN%Result: ALL TESTS PASSED%NC%
        echo Result: ALL TESTS PASSED >> %LOG_FILE%
        echo.
        echo %GREEN%Deployment validated successfully!%NC%
        echo The application is running correctly.
    ) else (
        echo %YELLOW%Result: PASSED WITH WARNINGS%NC%
        echo Result: PASSED WITH WARNINGS >> %LOG_FILE%
        echo.
        echo Application is functional but has some warnings.
        echo Review the warnings above and check logs if necessary.
    )
) else (
    echo %RED%Result: VALIDATION FAILED%NC%
    echo Result: VALIDATION FAILED >> %LOG_FILE%
    echo.
    echo %RED%Critical issues detected!%NC%
    echo.
    echo Please investigate the following:
    echo 1. Check application logs in Coolify dashboard
    echo 2. Verify environment variables are set correctly
    echo 3. Ensure database migrations have been run
    echo 4. Check Redis connectivity
    echo 5. Review full validation log: %LOG_FILE%
    echo.
    echo Consider rolling back if issues persist.
)

echo.
echo Full validation log: %LOG_FILE%
echo ============================================
echo.

REM Additional recommendations
if %ERROR_COUNT% EQU 0 (
    if %WARNING_COUNT% LEQ 2 (
        echo %GREEN%Next Steps:%NC%
        echo 1. Monitor application logs for the next 30 minutes
        echo 2. Test critical user workflows manually
        echo 3. Check monitoring dashboards
        echo 4. Inform stakeholders of successful deployment
    )
)

echo.

if %ERROR_COUNT% GTR 0 (
    exit /b 1
) else (
    exit /b 0
)
