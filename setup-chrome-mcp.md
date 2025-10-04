# Chrome DevTools MCP Setup Guide

## What is Chrome DevTools MCP?

The Chrome DevTools MCP (Model Context Protocol) allows Claude Code to interact with Chrome browser, enabling:
- Navigate to URLs and interact with pages
- Run JavaScript in the browser console
- Inspect DOM elements
- Take screenshots
- Monitor network requests
- Debug web applications

## Installation Status

✅ MCP Server Installed: `chrome-devtools-mcp@latest`
- Installed via: `claude mcp add chrome-devtools npx chrome-devtools-mcp@latest`

## Setup Steps

### Step 1: Launch Chrome with Remote Debugging

Choose one of these methods:

#### Option A: Windows Command Line
```cmd
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
```

#### Option B: PowerShell
```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
```

If Chrome was installed just for your Windows user account (no administrator rights), the executable usually lives at `%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe`. The launch script now checks that location automatically, but you can also run it manually:
```powershell
& "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
```

#### Option C: Create a Shortcut (Recommended for regular use)
1. Right-click Chrome shortcut
2. Select "Properties"
3. In "Target" field, add at the end: ` --remote-debugging-port=9222`
4. Should look like: `"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222`

#### Option D: Chrome Canary (Alternative)
```cmd
"C:\Users\%USERNAME%\AppData\Local\Google\Chrome SxS\Application\chrome.exe" --remote-debugging-port=9222
```

### Step 2: Verify Chrome is Running with Debugging

Once Chrome launches, verify the debugging port is active:

1. Open this URL in Chrome: `http://localhost:9222/json`
2. You should see JSON data showing open tabs
3. If you see JSON data, Chrome is ready for MCP connection

### Step 3: Restart Claude Code

The MCP server needs Claude Code to restart to load properly:

1. Close this Claude Code window/tab
2. Reopen Claude Code
3. The Chrome DevTools MCP should now be available

### Step 4: Test the Connection

After restarting Claude Code, test with commands like:
- "Navigate to google.com in Chrome"
- "Take a screenshot of the current page"
- "Run console.log('test') in the browser"
- "What's on my current Chrome tab?"

## Troubleshooting

### Chrome Won't Launch with Debugging
- Make sure all Chrome instances are closed first
- Try running the command as Administrator
- Check Chrome installation path is correct

### MCP Not Working After Restart
- Verify Chrome is running with `http://localhost:9222/json`
- Check Claude Code MCP settings with `claude mcp list`
- Ensure no firewall is blocking port 9222

### Port Already in Use
If port 9222 is busy, use a different port:
```cmd
chrome.exe --remote-debugging-port=9223
```
Then update MCP config to use port 9223

## Quick Start Script

I'll create a batch script to launch Chrome with debugging easily.

## Use Cases for P3 Interview Academy

With Chrome MCP, you can:
1. **Test staging environment** - Navigate and interact with staging site
2. **Debug email verification** - Monitor network calls to `/api/auth/verify-email`
3. **Test signup flow** - Fill forms and verify behavior
4. **Screenshot testing** - Capture UI states for documentation
5. **Performance monitoring** - Track API response times in browser

## Next Steps

1. Run the batch script created below to launch Chrome
2. Restart Claude Code
3. Test with "Navigate to our staging environment"
