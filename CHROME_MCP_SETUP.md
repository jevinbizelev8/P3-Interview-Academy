# Chrome DevTools MCP Setup - Complete Guide

## ✅ What I've Done

1. **Created Setup Documentation**: [setup-chrome-mcp.md](setup-chrome-mcp.md)
2. **Created Launch Script**: [launch-chrome-debug.bat](launch-chrome-debug.bat)
3. **Attempted to Launch Chrome**: Chrome process started

## 🔧 Manual Setup Required

Chrome was launched, but the debugging port may need manual verification. Here's what you need to do:

### Step 1: Verify Chrome is Running with Debugging

1. **Check if Chrome opened** - You should see a new Chrome window
2. **Open this URL in Chrome**: `http://localhost:9222/json`
3. **You should see JSON data** showing open tabs

If you see JSON data, Chrome is ready! ✅

### Step 2: Restart Claude Code

**IMPORTANT**: Claude Code needs to restart to load the Chrome MCP:

1. **Save your work** (all changes are committed to git)
2. **Close this Claude Code window/tab**
3. **Reopen Claude Code**
4. The Chrome DevTools MCP should now be loaded

### Step 3: Test Chrome MCP

After restarting Claude Code, try these commands:

- "Navigate to google.com in Chrome"
- "What's on my current Chrome tab?"
- "Take a screenshot of the page"
- "Run console.log('Hello from Claude!') in the browser console"

## 🚀 Quick Launch for Future Use

### Option A: Use the Batch Script
Double-click `launch-chrome-debug.bat` to launch Chrome with debugging

### Option B: Manual Command
```powershell
Start-Process "C:\Program Files\Google\Chrome\Application\chrome.exe" -ArgumentList "--remote-debugging-port=9222","--user-data-dir=$env:TEMP\chrome-debug-profile"
```

### Option C: Create Desktop Shortcut
1. Create new Chrome shortcut
2. In Properties > Target, add: `--remote-debugging-port=9222`
3. Double-click shortcut anytime

## 🎯 Use Cases for P3 Interview Academy

Once Chrome MCP is working, you can:

### 1. Test Staging Environment
```
"Navigate to http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com"
```

### 2. Test Email Verification Flow
```
"Fill out the signup form on the current page"
"Click the signup button and monitor network requests"
"Check if the verification email message appears"
```

### 3. Debug Frontend Issues
```
"What errors are in the console?"
"Take a screenshot of the current page"
"Inspect the signup form elements"
```

### 4. Test Password Reset
```
"Navigate to the forgot password page"
"Fill in the email field with test@example.com"
"Monitor the API call to /api/auth/forgot-password"
```

### 5. Performance Testing
```
"Navigate to the staging homepage and measure load time"
"Take a screenshot of the performance tab"
```

## ⚠️ Troubleshooting

### Chrome Didn't Launch
- Run `launch-chrome-debug.bat` manually
- Or run PowerShell command above
- Check Task Manager for Chrome.exe

### Debugging Port Not Responding
- Chrome may need 5-10 seconds to fully start
- Visit `http://localhost:9222/json` in browser to verify
- If you see "Connection refused", restart Chrome with the script

### MCP Not Available After Restart
- Verify MCP is installed: Run `claude mcp list` in terminal
- Should see: `chrome-devtools`
- If missing, reinstall: `claude mcp add chrome-devtools npx chrome-devtools-mcp@latest`

### Port Already in Use
If port 9222 is busy:
1. Change port in launch script to 9223
2. Update MCP configuration to use new port

## 📋 Checklist

Before using Chrome MCP:
- [ ] Chrome MCP installed (`claude mcp add chrome-devtools ...`)
- [ ] Chrome launched with debugging (`launch-chrome-debug.bat`)
- [ ] Debugging port verified (`http://localhost:9222/json` shows data)
- [ ] Claude Code restarted to load MCP
- [ ] Test command works (e.g., "Navigate to google.com")

## 🔍 Current Status

✅ **MCP Server Installed**: `chrome-devtools-mcp@latest`
✅ **Documentation Created**: Setup guide and scripts ready
✅ **Chrome Process Started**: May need manual verification
⏳ **Pending**: Restart Claude Code to activate MCP
⏳ **Pending**: Test MCP functionality

## 📝 Next Steps

1. **Check if Chrome window opened** on your desktop
2. **Verify debugging**: Open `http://localhost:9222/json` in browser
3. **Restart Claude Code**: Close and reopen this application
4. **Test**: Ask me to "Navigate to google.com in Chrome"

---

**Note**: If you have any issues, you can always close Chrome completely and restart it using `launch-chrome-debug.bat`

**Created**: 2025-01-04
**For**: P3 Interview Academy Development
