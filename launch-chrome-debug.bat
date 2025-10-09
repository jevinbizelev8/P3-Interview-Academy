@echo off
echo ===============================================
echo  Chrome DevTools MCP - Debug Mode Launcher
echo ===============================================
echo.

set "skipPause="
if /I "%SKIP_PAUSE%"=="1" set "skipPause=1"

REM Close all Chrome instances first
echo Closing existing Chrome instances...
taskkill /F /IM chrome.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Launching Chrome with remote debugging on port 9222...
echo.

set "chromePath="
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" set "chromePath=C:\Program Files\Google\Chrome\Application\chrome.exe"
if not defined chromePath (
    if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" set "chromePath=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
)
if not defined chromePath (
    if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" set "chromePath=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
)
if not defined chromePath (
    if exist "%LOCALAPPDATA%\Google\Chrome SxS\Application\chrome.exe" set "chromePath=%LOCALAPPDATA%\Google\Chrome SxS\Application\chrome.exe"
)

if not defined chromePath (
    echo ERROR: Chrome installation not found!
    echo Checked the following locations:
    echo   C:\Program Files\Google\Chrome\Application\chrome.exe
    echo   C:\Program Files (x86)\Google\Chrome\Application\chrome.exe
    echo   %LOCALAPPDATA%\Google\Chrome\Application\chrome.exe
    echo   %LOCALAPPDATA%\Google\Chrome SxS\Application\chrome.exe
    echo.
    echo Please install Chrome or update this script with the correct path.
    if not defined skipPause pause
    exit /b 1
)

echo Using Chrome at: %chromePath%
start "" "%chromePath%" --remote-debugging-port=9222 --user-data-dir="%TEMP%\chrome-debug-profile"
goto :success

:success
echo.
echo [OK] Chrome launched successfully!
echo [OK] Remote debugging enabled on port 9222
echo.

echo To verify, open this URL in Chrome:
echo   http://localhost:9222/json
echo.

echo Next steps:
echo   1. Verify debugging at http://localhost:9222/json
echo   2. Restart Claude Code to load MCP
echo   3. Test with: "Navigate to google.com"
echo.

echo Press any key to exit (Chrome will keep running)...
if defined skipPause goto :eof
pause >nul
