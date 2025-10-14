@echo off
REM ============================================
REM Security Fixes Verification Script
REM ============================================
REM This script verifies all security fixes are in place
REM Date: 2025-10-13

setlocal enabledelayedexpansion

echo ============================================
echo Security Fixes Verification
echo ============================================
echo.

set PASS_COUNT=0
set FAIL_COUNT=0
set TOTAL_CHECKS=10

REM Check 1: Hardcoded passwords removed from admin.routes.ts
echo [1/10] Checking admin.routes.ts for hardcoded passwords...
findstr /C:"Ardian2025" /C:"Iqbal2025" /C:"Galuh2025" /C:"Dilla2025" "backend\src\routes\admin.routes.ts" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [FAIL] Hardcoded passwords still present in admin.routes.ts
    set /a FAIL_COUNT+=1
) else (
    echo [PASS] No hardcoded passwords found in admin.routes.ts
    set /a PASS_COUNT+=1
)
echo.

REM Check 2: Insecure endpoint removed
echo [2/10] Checking if insecure password endpoint was removed...
findstr /C:"update-enterprise-passwords" "backend\src\routes\admin.routes.ts" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [FAIL] Insecure endpoint still present in admin.routes.ts
    set /a FAIL_COUNT+=1
) else (
    echo [PASS] Insecure endpoint removed from admin.routes.ts
    set /a PASS_COUNT+=1
)
echo.

REM Check 3: Exposed HuggingFace key removed from .env
echo [3/10] Checking backend/.env for exposed HuggingFace key...
findstr /C:"hf_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" "backend\.env" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [FAIL] Exposed HuggingFace key still in backend/.env
    set /a FAIL_COUNT+=1
) else (
    echo [PASS] Exposed HuggingFace key removed from backend/.env
    set /a PASS_COUNT+=1
)
echo.

REM Check 4: .env is in .gitignore
echo [4/10] Checking if .env files are in .gitignore...
findstr /C:".env" ".gitignore" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [PASS] .env files are in .gitignore
    set /a PASS_COUNT+=1
) else (
    echo [FAIL] .env files NOT in .gitignore
    set /a FAIL_COUNT+=1
)
echo.

REM Check 5: backend/.env is NOT tracked by git
echo [5/10] Checking if backend/.env is tracked by git...
git ls-files "backend\.env" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [FAIL] backend/.env is tracked by git (should not be)
    set /a FAIL_COUNT+=1
) else (
    echo [PASS] backend/.env is NOT tracked by git
    set /a PASS_COUNT+=1
)
echo.

REM Check 6: JWT secret is secure (64+ characters)
echo [6/10] Checking JWT secret length...
for /f "tokens=2 delims==" %%a in ('findstr /C:"JWT_SECRET" "backend\.env"') do set JWT_SECRET=%%a
set JWT_SECRET=%JWT_SECRET:"=%
set JWT_SECRET_LEN=0
if defined JWT_SECRET (
    set JWT_SECRET_TEST=%JWT_SECRET%
    :loop
    if defined JWT_SECRET_TEST (
        set JWT_SECRET_TEST=%JWT_SECRET_TEST:~1%
        set /a JWT_SECRET_LEN+=1
        goto loop
    )
)
if %JWT_SECRET_LEN% GEQ 64 (
    echo [PASS] JWT secret is secure (64+ characters: %JWT_SECRET_LEN% chars)
    set /a PASS_COUNT+=1
) else (
    echo [FAIL] JWT secret is too short (%JWT_SECRET_LEN% chars, need 64+)
    set /a FAIL_COUNT+=1
)
echo.

REM Check 7: SQL password reset script exists
echo [7/10] Checking if SQL reset script was created...
if exist "RESET_USER_PASSWORDS.sql" (
    echo [PASS] SQL reset script exists
    set /a PASS_COUNT+=1
) else (
    echo [FAIL] SQL reset script not found
    set /a FAIL_COUNT+=1
)
echo.

REM Check 8: New credentials file exists
echo [8/10] Checking if new credentials file was created...
if exist "NEW_USER_CREDENTIALS.txt" (
    echo [PASS] New credentials file exists
    set /a PASS_COUNT+=1
) else (
    echo [FAIL] New credentials file not found
    set /a FAIL_COUNT+=1
)
echo.

REM Check 9: HuggingFace rotation guide exists
echo [9/10] Checking if HuggingFace rotation guide was created...
if exist "HUGGINGFACE_API_KEY_ROTATION.md" (
    echo [PASS] HuggingFace rotation guide exists
    set /a PASS_COUNT+=1
) else (
    echo [FAIL] HuggingFace rotation guide not found
    set /a FAIL_COUNT+=1
)
echo.

REM Check 10: Security fix documentation exists
echo [10/10] Checking if security fix documentation was created...
if exist "SECURITY_FIX_IMMEDIATE_ACTIONS.md" (
    echo [PASS] Security fix documentation exists
    set /a PASS_COUNT+=1
) else (
    echo [FAIL] Security fix documentation not found
    set /a FAIL_COUNT+=1
)
echo.

REM Summary
echo ============================================
echo Verification Complete
echo ============================================
echo.
echo Total checks: %TOTAL_CHECKS%
echo Passed: %PASS_COUNT%
echo Failed: %FAIL_COUNT%
echo.

if %FAIL_COUNT% EQU 0 (
    echo [SUCCESS] All automated security fixes verified!
    echo.
    echo Next steps:
    echo 1. Run SQL script: RESET_USER_PASSWORDS.sql
    echo 2. Notify users with credentials from: NEW_USER_CREDENTIALS.txt
    echo 3. Follow HuggingFace key rotation: HUGGINGFACE_API_KEY_ROTATION.md
    echo 4. Update Coolify environment variables
    echo 5. Deploy to production
    echo.
    exit /b 0
) else (
    echo [WARNING] Some checks failed!
    echo.
    echo Please review the failed checks above and fix them before proceeding.
    echo.
    exit /b 1
)
