@echo off
REM ══════════════════════════════════════════════════════════════════════════════
REM SUPABASE EDGE FUNCTION DEPLOYMENT SCRIPT (Windows)
REM Deploys the restaurant API with Foursquare integration
REM ══════════════════════════════════════════════════════════════════════════════

echo.
echo ════════════════════════════════════════
echo 🚀 SyncScript Restaurant API Deployment
echo ════════════════════════════════════════
echo.

REM Check if Supabase CLI is installed
echo 1️⃣  Checking Supabase CLI...
where supabase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Supabase CLI not found
    echo.
    echo Install it with:
    echo   scoop install supabase
    echo   OR
    echo   npm install -g supabase
    echo.
    pause
    exit /b 1
)
echo ✅ Supabase CLI found
echo.

REM Check if logged in
echo 2️⃣  Checking Supabase login...
supabase projects list >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Not logged in to Supabase
    echo.
    echo Please login first:
    echo   supabase login
    echo.
    pause
    exit /b 1
)
echo ✅ Logged in to Supabase
echo.

REM Check if project is linked
echo 3️⃣  Checking project link...
if not exist .supabase\config.toml (
    echo ⚠️  Project not linked
    echo.
    set /p PROJECT_REF="Enter your Supabase project ref: "
    echo.
    echo Linking project...
    supabase link --project-ref %PROJECT_REF%
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to link project
        pause
        exit /b 1
    )
    echo ✅ Project linked
) else (
    echo ✅ Project already linked
)
echo.

REM Verify secrets
echo 4️⃣  Checking Foursquare API secrets...
echo ⚠️  Make sure you've added these secrets in Supabase Dashboard:
echo    - FOURSQUARE_CLIENT_ID
echo    - FOURSQUARE_CLIENT_SECRET
echo.
set /p SECRETS_CONFIRMED="Have you added the Foursquare secrets? (y/n): "
if /i not "%SECRETS_CONFIRMED%"=="y" (
    echo.
    echo Please add secrets first:
    echo 1. Go to Supabase Dashboard
    echo 2. Navigate to Edge Functions ^> Secrets
    echo 3. Add:
    echo    FOURSQUARE_CLIENT_ID = UJV3LJWJR4IKQTDKUR4WWKUVABOFHWALD5NL2U2CDGH0KQQZ
    echo    FOURSQUARE_CLIENT_SECRET = FD1RR0X0WYSBUZQRHKHV3A0PA4MP4423I0LAMQ4SLI504SOF
    echo.
    pause
    exit /b 1
)
echo ✅ Secrets confirmed
echo.

REM Deploy function
echo 5️⃣  Deploying edge function...
echo This may take 30-60 seconds...
echo.
supabase functions deploy server

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Deployment failed
    echo.
    echo Troubleshooting:
    echo 1. Check the error message above
    echo 2. Verify your code syntax
    echo 3. Ensure all files exist in /supabase/functions/server/
    echo 4. Try: supabase functions deploy server --debug
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Deployment successful!
echo.

REM Test the deployment
echo 6️⃣  Testing restaurant API...
echo.
set /p TEST_API="Would you like to view function logs? (y/n): "
if /i "%TEST_API%"=="y" (
    echo.
    echo Opening function logs...
    echo Watch for: '✅ Found X restaurants from Foursquare'
    echo Press Ctrl+C to stop when done
    echo.
    supabase functions logs server --tail
)

echo.
echo ════════════════════════════════════════
echo 🎉 DEPLOYMENT COMPLETE!
echo ════════════════════════════════════════
echo.
echo Next steps:
echo 1. Open your SyncScript app
echo 2. Click + button on calendar card
echo 3. Select 'Dining/Restaurant'
echo 4. Enter price ^> budget
echo 5. Click 'Find Alternatives'
echo 6. See REAL Foursquare results! 🎊
echo.
echo Monitoring:
echo   View logs: supabase functions logs server --tail
echo   List functions: supabase functions list
echo.
echo Documentation:
echo   Full guide: /DEPLOY_RESTAURANT_API.md
echo   User guide: /QUICK_EVENT_CREATION_GUIDE.md
echo.
pause
