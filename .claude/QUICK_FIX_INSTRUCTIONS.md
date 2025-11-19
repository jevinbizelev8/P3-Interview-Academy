# Quick Fix: Replit Statusline Persistence

**Problem**: Statusline configuration keeps disappearing after container restarts
**Solution**: 3-step automated restoration system
**Time**: 5 minutes to implement

---

## 🚨 TL;DR - Run These Commands Now

```bash
# Step 1: Sync workspace backup to latest version
cp /home/runner/.claude/statusline-command.sh \
   /home/runner/workspace/.claude/statusline-command.sh

# Step 2: Add alias to your shell (one-time setup)
echo 'alias restore-statusline="/home/runner/workspace/.claude/restore-config.sh"' >> ~/.bashrc
source ~/.bashrc

# Step 3: Test restoration
restore-statusline

# Step 4: Commit to git (preserves setup across Repls)
cd /home/runner/workspace
git add .claude/statusline-command.sh .claude/restore-config.sh .claude/check-health.sh
git commit -m "feat(statusline): Add restoration script for Replit persistence"
git push
```

**Done!** Next time the container restarts, just run: `restore-statusline`

---

## 📋 What This Does

### Before Fix
1. Container restarts (every 1-24 hours due to inactivity)
2. `/home/runner/.claude/` directory is destroyed
3. Statusline stops working
4. You spend "many sessions" reconfiguring manually
5. Repeat every few days

### After Fix
1. Container restarts
2. You run: `restore-statusline` (or it runs automatically)
3. 30 seconds later, statusline works
4. No manual reconfiguration needed

---

## 🔍 Understanding the Problem

### Replit Has Two Filesystems

**Ephemeral Storage** (`/home/runner/`):
- 32GB overlay filesystem
- **DESTROYED** on container restart
- Contains: `~/.claude/statusline-command.sh`, `~/.claude/settings.json`
- **This is why your config keeps disappearing!**

**Persistent Storage** (`/home/runner/workspace/`):
- 256GB btrfs filesystem
- **SURVIVES** container restarts
- Contains: Your git repo, project files, data
- **This is where we backup the config**

### Your Current Situation

```
/home/runner/.claude/statusline-command.sh     ← ACTIVE (ephemeral, 6088 bytes, Nov 1)
/home/runner/.claude/settings.json             ← ACTIVE (ephemeral)
/home/runner/workspace/.claude/statusline-command.sh  ← BACKUP (persistent, 5637 bytes, Oct 31)
/home/runner/workspace/.claude/data/usage-stats.json  ← DATA (persistent)
```

**Problem**: Active version (6088 bytes) is newer than backup (5637 bytes)
- You've made 16 lines of improvements
- If container restarts NOW, you'll lose those improvements
- Backup will restore old version

**Solution**: Sync active → backup (Step 1 above), then use restoration script

---

## 🛠️ The Fix (Detailed)

### Files Created

1. **`restore-config.sh`** - Restoration script
   - Location: `/home/runner/workspace/.claude/restore-config.sh`
   - Purpose: Copies config from workspace to home directory
   - Usage: Run `restore-statusline` after container restart

2. **`check-health.sh`** - Health check script
   - Location: `/home/runner/workspace/.claude/check-health.sh`
   - Purpose: Verifies configuration status
   - Usage: Run anytime to check if statusline is healthy

3. **Alias in `.bashrc`** - Shell convenience
   - Adds: `alias restore-statusline="..."`
   - Purpose: Easy command to restore config
   - Usage: Just type `restore-statusline` in shell

### How Restoration Works

```bash
restore-statusline
```

**What it does:**
1. Checks if `~/.claude/statusline-command.sh` exists
   - If YES → "Already configured" (no action needed)
   - If NO → Proceed with restoration
2. Creates `~/.claude/` directory
3. Copies `statusline-command.sh` from workspace to home
4. Creates `settings.json` with correct configuration
5. Sets executable permissions
6. Confirms success

**Time**: ~1 second
**Result**: Statusline ready to use

---

## 🧪 Testing

### Test 1: Check Current Health

```bash
/home/runner/workspace/.claude/check-health.sh
```

**Expected output:**
```
🏥 Claude Code Statusline Health Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 Configuration Files (Ephemeral - ~/.claude/):
   ✅ Script: ~/.claude/statusline-command.sh (6.0K)
   ✅ Settings: ~/.claude/settings.json (142)

💾 Backup Files (Persistent - ~/workspace/.claude/):
   ✅ Backup script: ~/workspace/.claude/statusline-command.sh (6.0K)
   ✅ Restoration script: ~/workspace/.claude/restore-config.sh (1.5K)

📊 Data Files (Persistent - ~/workspace/.claude/data/):
   ✅ State file: usage-stats.json (1.2K)
      Today: $13.87 | This week: $47.33
   ✅ Debug log: statusline-debug.log (557K, 5942 lines)

🔍 Version Synchronization:
   ✅ Scripts are synchronized (MD5: e00244f41321241...)

🧪 Functionality Test:
   ✅ Script executes successfully

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Overall Status: HEALTHY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Test 2: Simulate Container Restart

```bash
# WARNING: This deletes your home directory .claude folder
# Only do this if you've completed Step 1 (backup sync)

rm -rf ~/.claude/
restore-statusline
```

**Expected output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 Claude Code Statusline Restoration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 Creating ~/.claude directory...
📋 Copying statusline script from workspace...
   ✅ Script restored: /home/runner/.claude/statusline-command.sh
⚙️  Creating settings.json...
   ✅ Settings created: /home/runner/.claude/settings.json

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 Restoration complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Next steps:
1. Start Claude Code CLI
2. Statusline should appear automatically
3. Data persists in: /home/runner/workspace/.claude/data/usage-stats.json
```

### Test 3: Verify Files Restored

```bash
ls -lh ~/.claude/statusline-command.sh ~/.claude/settings.json
```

**Expected output:**
```
-rw-r--r-- 1 runner runner  142 Nov  1 07:30 /home/runner/.claude/settings.json
-rwxr-xr-x 1 runner runner 6.0K Nov  1 07:30 /home/runner/.claude/statusline-command.sh
```

### Test 4: Verify Statusline Works

```bash
echo '{"session_id":"test","workspace":{"current_dir":"'"$(pwd)"'"}}' | \
  ~/.claude/statusline-command.sh
```

**Expected output** (something like):
```
Session: 0↑/0↓ $0.00 │ Today: $13.87 │ Week: $47.33 │ 0m │ 07:30 │ ~/workspace [redesign/mvp-founder-design]
```

---

## 📅 Daily Workflow

### Normal Usage (No Container Restart)
1. Open Replit
2. Start Claude Code
3. Statusline works automatically
4. No action needed

### After Container Restart
1. Open Replit
2. Notice statusline is missing (or run health check)
3. Run: `restore-statusline`
4. Start Claude Code
5. Statusline works

### Weekly Maintenance
```bash
# Check health
~/workspace/.claude/check-health.sh

# If out of sync, update backup
cp ~/.claude/statusline-command.sh ~/workspace/.claude/

# Commit changes
cd ~/workspace
git add .claude/
git commit -m "chore(statusline): Update backup"
git push
```

---

## 🆘 Troubleshooting

### Problem: "alias not found"

**Cause**: Alias not loaded in current shell

**Solution**:
```bash
source ~/.bashrc
# OR just use full path
/home/runner/workspace/.claude/restore-config.sh
```

### Problem: "Script execution failed"

**Cause**: Missing dependencies (jq, bc)

**Solution**:
```bash
# Replit should have these, but if not:
nix-env -iA nixpkgs.jq nixpkgs.bc
```

### Problem: "Configuration already exists"

**Cause**: Restoration script detects existing config

**Solution** (if you want to force restore):
```bash
rm -rf ~/.claude/
restore-statusline
```

### Problem: "Workspace backup missing"

**Cause**: Backup script not in workspace (didn't run Step 1)

**Solution**:
```bash
# Check if home version exists
ls -lh ~/.claude/statusline-command.sh

# If yes, copy to workspace
cp ~/.claude/statusline-command.sh ~/workspace/.claude/

# Then run restoration
restore-statusline
```

### Problem: "Statusline shows $0.00"

**Cause**: New session, no transcript generated yet

**Solution**: This is normal! Wait for first Claude Code interaction. Costs appear after transcript is created.

### Problem: "Scripts out of sync"

**Cause**: You edited home version but didn't update backup

**Solution**:
```bash
# Copy latest version to workspace
cp ~/.claude/statusline-command.sh ~/workspace/.claude/

# Verify sync
~/workspace/.claude/check-health.sh
```

---

## 📚 Additional Resources

- **Detailed Analysis**: `/home/runner/workspace/docs/statusline/REPLIT_PERSISTENCE_DEFINITIVE_ANSWER.md`
- **User Guide**: `/home/runner/workspace/docs/statusline/GUIDE.md`
- **Pricing Reference**: `/home/runner/workspace/docs/statusline/PRICING_REFERENCE.md`
- **Restoration Script**: `/home/runner/workspace/.claude/restore-config.sh`
- **Health Check**: `/home/runner/workspace/.claude/check-health.sh`

---

## 🎯 Success Criteria

After implementing this fix, you should be able to:

- ✅ Restore statusline in 30 seconds after container restart
- ✅ Run single command: `restore-statusline`
- ✅ No manual editing of files
- ✅ No "many sessions" wasted reconfiguring
- ✅ Configuration preserved in git (survives Repl clones)
- ✅ Data (costs) always persists automatically

---

**Document Version**: 1.0
**Last Updated**: 2025-11-01
**Status**: ✅ Ready for implementation
