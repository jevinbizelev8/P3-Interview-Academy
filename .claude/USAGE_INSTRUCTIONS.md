# Claude Code Statusline - Replit Usage Instructions

## ✅ Setup Complete!

Your statusline is now configured with automatic persistence for Replit.

---

## Current Status

✅ **Configuration Secured**: Backed up to `~/workspace/.claude/`
✅ **Data Persisting**: Week total shows **$50.46** (includes yesterday)
✅ **Scripts Synced**: Active and backup are identical
✅ **Committed to Git**: Configuration preserved forever

---

## After Container Restarts (Every 1-24 Hours)

When Replit restarts the container, run this **one command**:

```bash
~/workspace/.claude/restore-config.sh
```

**Time required**: 30 seconds ⚡

**What it does**:
- Copies statusline script from workspace to home directory
- Restores settings.json
- Creates symlink for data directory
- Verifies configuration

---

## Health Check (Optional)

To check if everything is working:

```bash
~/workspace/.claude/check-health.sh
```

**Shows**:
- Script versions (active vs backup)
- Sync status (should be "IN SYNC")
- Data directory status
- Current costs (Today and Week totals)
- Live statusline test

---

## Quick Reference

### Key Files

| Location | Purpose | Persists? |
|----------|---------|-----------|
| `~/.claude/statusline-command.sh` | Active script (used by Claude Code) | ❌ Lost on restart |
| `~/workspace/.claude/statusline-command.sh` | Backup copy | ✅ Permanent |
| `~/.claude/settings.json` | Claude Code config | ❌ Lost on restart |
| `~/workspace/.claude/settings.json` | Backup copy | ✅ Permanent |
| `~/workspace/.claude/data/usage-stats.json` | Cost history | ✅ Permanent |
| `~/workspace/.claude/restore-config.sh` | Restoration script | ✅ Permanent |
| `~/workspace/.claude/check-health.sh` | Health check script | ✅ Permanent |

### Commands

```bash
# Restore configuration after restart
~/workspace/.claude/restore-config.sh

# Check system health
~/workspace/.claude/check-health.sh

# Sync versions manually (after editing script)
cp ~/.claude/statusline-command.sh ~/workspace/.claude/

# View current costs
cat ~/workspace/.claude/data/usage-stats.json | jq .
```

---

## How It Works

### Replit's Filesystem

```
❌ EPHEMERAL (/home/runner/)
   - Wiped on container restart (every 1-24 hours)
   - Contains: Configuration files

✅ PERSISTENT (/home/runner/workspace/)
   - Survives all restarts
   - Contains: Your code, backups, data
```

### The Solution

1. **Backup**: All config files stored in `~/workspace/.claude/`
2. **Restoration**: One-command script copies files back
3. **Data Link**: Symlink ensures cost history always persists
4. **Git Tracking**: Configuration survives across all Repls

---

## Expected Behavior

### ✅ Working Correctly

Your statusline should show real data:
```
Session: 7.3M↑/16.8K↓ $12.83 │ Today: $17.00 │ Week: $50.46 │ 21m │ 07:31 │ ~/workspace [redesign/mvp-founder-design]
```

**Signs it's working:**
- Non-zero token counts (e.g., 7.3M input)
- Real costs (not $0.00)
- Yesterday's costs included in week total
- Duration tracking (e.g., 21m)

### ⚠️ Needs Restoration

If you see all zeros after a restart:
```
Session: 0↑/0↓ $0.00 │ Today: $0.00 │ Week: $0.00 │ 0m │ ...
```

**Solution**: Run `~/workspace/.claude/restore-config.sh`

---

## Troubleshooting

### Problem: Statusline shows all $0.00

**Cause**: Container restarted, configuration lost

**Fix**:
```bash
~/workspace/.claude/restore-config.sh
```

### Problem: Week total doesn't include yesterday

**Cause**: Script not updated

**Fix**:
```bash
# Update backup from active
cp ~/.claude/statusline-command.sh ~/workspace/.claude/

# Commit the update
git add .claude/statusline-command.sh
git commit -m "Update statusline script"
git push
```

### Problem: Health check shows "OUT OF SYNC"

**Cause**: Active script was edited but backup not updated

**Fix**:
```bash
cp ~/.claude/statusline-command.sh ~/workspace/.claude/statusline-command.sh
```

---

## Weekly Maintenance

### Recommended (but optional):

1. **Monday mornings**: Run health check to verify week totals
   ```bash
   ~/workspace/.claude/check-health.sh
   ```

2. **After script edits**: Sync versions to prevent loss
   ```bash
   cp ~/.claude/statusline-command.sh ~/workspace/.claude/
   ```

3. **Before long breaks**: Commit any changes
   ```bash
   git add .claude/
   git commit -m "Update statusline configuration"
   git push
   ```

---

## Documentation

Comprehensive guides available in `docs/statusline/`:

| Document | Purpose |
|----------|---------|
| `README.md` | Quick overview |
| `GUIDE.md` | Complete user guide |
| `REPLIT_PERSISTENCE_DEFINITIVE_ANSWER.md` | Deep technical analysis (36KB) |
| `REPLIT_QUICK_FIX.md` | Quick troubleshooting |
| `QUICK_FIX_INSTRUCTIONS.md` | Copy-paste commands |

---

## Support

If you encounter issues:

1. Run health check: `~/workspace/.claude/check-health.sh`
2. Check debug log: `tail -50 ~/workspace/.claude/data/statusline-debug.log`
3. Review documentation: `~/workspace/.claude/README.md`

---

**Last Updated**: 2025-11-01
**Version**: 2.0 (Replit Persistence Solution)
**Status**: ✅ Production-ready
**Time to Restore**: 30 seconds
