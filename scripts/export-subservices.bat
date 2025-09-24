@echo off
echo ========================================
echo    HIVE CRM - Subservices Export
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

REM Check if we're in the right directory
if not exist "get-subservices.js" (
    echo ERROR: get-subservices.js not found
    echo Please run this script from the scripts directory
    pause
    exit /b 1
)

REM Check Node.js version (requires 18+ for fetch support)
echo Checking Node.js version...
node -e "const version = process.version; const major = parseInt(version.slice(1).split('.')[0]); if (major < 18) { console.log('ERROR: Node.js 18+ required, current version:', version); process.exit(1); } else { console.log('Node.js version OK:', version); }"
if %errorlevel% neq 0 (
    echo ERROR: Node.js 18+ is required for fetch support
    echo Please upgrade to Node.js 18 or higher
    pause
    exit /b 1
)
echo.

echo Starting subservices export...
echo This will fetch all subservices from the CRM and save them to Data/sub-service/data.ts
echo.
echo NOTE: You need to provide your session_id from localStorage
echo.
echo To get your session_id:
echo 1. Login to the application in your browser
echo 2. Open browser console (F12)
echo 3. Run: localStorage.getItem("session_id")
echo 4. Copy the session_id
echo.
echo Then run: node get-subservices.js --session-id=YOUR_SESSION_ID
echo.
echo Alternatively, use the browser script (easier):
echo 1. Login to the application
echo 2. Open browser console (F12)
echo 3. Copy and paste the content of get-subservices-browser.js
echo 4. Run: exportSubservices()
echo.
echo Press any key to continue...
pause >nul

REM Run the export script (will show usage instructions)
node get-subservices.js

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo    Export completed successfully!
    echo ========================================
    echo.
    echo Files created:
    echo - Data/sub-service/data.ts (TypeScript data file)
    echo - Data/sub-service/subservices-raw.json (Raw JSON backup)
    echo.
) else (
    echo.
    echo ========================================
    echo    Export failed!
    echo ========================================
    echo.
)

echo Press any key to exit...
pause >nul
