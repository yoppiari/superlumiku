@echo off
REM ============================================
REM Coolify Environment Variable Update Script (Windows)
REM ============================================
REM This script updates the HuggingFace API key in Coolify
REM Date: 2025-10-13
REM Reason: API key rotation after security exposure

echo ============================================
echo Coolify Environment Variable Update
echo ============================================
echo.

REM Step 1: Get user inputs
echo Step 1: Configuration
echo Please provide the following information:
echo.

set /p COOLIFY_TOKEN="Enter your Coolify API Token: "
set /p NEW_HF_KEY="Enter your new HuggingFace API Key (hf_...): "
set /p APP_UUID="Enter your Application UUID [default: d8ggwoo484k8ok48g8k8cgwk]: "
if "%APP_UUID%"=="" set APP_UUID=d8ggwoo484k8ok48g8k8cgwk

echo.
echo Configuration set:
echo   - App UUID: %APP_UUID%
echo   - Keys configured (hidden for security)
echo.

set /p CONFIRM="Is this correct? (y/n): "
if /i not "%CONFIRM%"=="y" (
    echo Aborted by user
    exit /b 1
)

REM Step 2: Update environment variable
echo.
echo Step 2: Updating environment variable...

curl -X PATCH "https://cf.avolut.com/api/v1/applications/%APP_UUID%/envs" ^
  -H "Authorization: Bearer %COOLIFY_TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"HUGGINGFACE_API_KEY\": \"%NEW_HF_KEY%\"}" ^
  -w "\nHTTP Status: %%{http_code}\n"

if %ERRORLEVEL% NEQ 0 (
    echo Failed to update environment variable
    exit /b 1
)

echo Environment variable updated successfully

REM Step 3: Trigger redeployment
echo.
echo Step 3: Triggering redeployment...

curl -X POST "https://cf.avolut.com/api/v1/deploy?uuid=%APP_UUID%&force=true" ^
  -H "Authorization: Bearer %COOLIFY_TOKEN%" ^
  -w "\nHTTP Status: %%{http_code}\n"

if %ERRORLEVEL% NEQ 0 (
    echo Failed to trigger redeployment
    echo Note: Environment variable was updated, but deployment failed.
    echo You may need to manually trigger deployment from Coolify dashboard.
    exit /b 1
)

echo Redeployment triggered successfully

REM Step 4: Test the new API key
echo.
echo Step 4: Testing new API key...

curl https://api-inference.huggingface.co/models/bert-base-uncased ^
  -H "Authorization: Bearer %NEW_HF_KEY%" ^
  -H "Content-Type: application/json" ^
  -d "{\"inputs\":\"test\"}" ^
  -w "\nHTTP Status: %%{http_code}\n"

REM Summary
echo.
echo ============================================
echo Update Complete!
echo ============================================
echo.
echo Next steps:
echo 1. Monitor deployment logs in Coolify dashboard
echo 2. Wait for deployment to complete (2-5 minutes)
echo 3. Test Avatar Generator in Lumiku UI
echo 4. Verify no authentication errors in logs
echo.
echo Coolify Dashboard: https://cf.avolut.com
echo Lumiku App: https://dev.lumiku.com
echo.
echo All done!
pause
