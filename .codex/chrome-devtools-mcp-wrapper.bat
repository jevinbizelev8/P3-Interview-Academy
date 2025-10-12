@echo off
setlocal

set "PORT=9222"
set "chromePath="

rem Candidate Chrome locations, most common first
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" set "chromePath=C:\Program Files\Google\Chrome\Application\chrome.exe"
if not defined chromePath if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" set "chromePath=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
if not defined chromePath if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" set "chromePath=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
if not defined chromePath if exist "%LOCALAPPDATA%\Google\Chrome SxS\Application\chrome.exe" set "chromePath=%LOCALAPPDATA%\Google\Chrome SxS\Application\chrome.exe"

if not defined chromePath (
  echo [ERROR] Unable to locate chrome.exe. Update chrome-devtools-mcp-wrapper.bat.
  exit /b 1
)

echo [INFO] Using Chrome at: %chromePath%

:CHECK_PORT
powershell -NoLogo -NoProfile -Command "try { $null = Invoke-WebRequest -Uri 'http://localhost:%PORT%/json/version' -UseBasicParsing -TimeoutSec 2; exit 0 } catch { exit 1 }"
if %ERRORLEVEL%==0 goto START_MCP

echo [INFO] Remote debugging port %PORT% not reachable. Starting Chrome...
start "" "%chromePath%" --remote-debugging-port=%PORT% --user-data-dir="%TEMP%\chrome-debug-profile"

set /a retries=0
:WAIT_FOR_PORT
set /a retries+=1
if %retries% gtr 15 (
  echo [WARN] Chrome has not opened port %PORT% yet. Continuing anyway.
  goto START_MCP
)
ping -n 2 127.0.0.1 >nul
powershell -NoLogo -NoProfile -Command "try { $null = Invoke-WebRequest -Uri 'http://localhost:%PORT%/json/version' -UseBasicParsing -TimeoutSec 2; exit 0 } catch { exit 1 }"
if %ERRORLEVEL%==0 goto START_MCP
goto WAIT_FOR_PORT

:START_MCP
echo [INFO] Launching chrome-devtools MCP server...
echo [INFO] (If Chrome closes later, rerun the MCP command.)
npx -y chrome-devtools-mcp@latest --executablePath "%chromePath%"
set "exitCode=%ERRORLEVEL%"
echo [INFO] chrome-devtools MCP exited with code %exitCode%.
exit /b %exitCode%
