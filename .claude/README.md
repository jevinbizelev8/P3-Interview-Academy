# Claude Code Statusline - Replit Environment

## Quick Reference

### After Container Restart (Statusline Missing)
```bash
restore-statusline
```
**Time**: 30 seconds
**Result**: Statusline fully operational

### Check Health Anytime
```bash
~/workspace/.claude/check-health.sh
```
**Shows**: Config status, version sync, cost summary

### Sync Versions (After Script Edits)
```bash
cp ~/.claude/statusline-command.sh ~/workspace/.claude/
```
**Why**: Keeps backup current

---

## Files in This Directory

| File | Purpose | When to Use |
|------|---------|-------------|
| `statusline-command.sh` | Main statusline script (backup) | Auto-used by restore script |
| `restore-config.sh` | Restoration automation | After container restart |
| `check-health.sh` | Health check utility | Anytime (diagnostics) |
| `QUICK_FIX_INSTRUCTIONS.md` | Quick start guide | When statusline breaks |
| `data/usage-stats.json` | Cost tracking state (persistent) | Auto-managed by script |
| `data/statusline-debug.log` | Debug output | Troubleshooting |

---

## Why This Setup Exists

**Problem**: Replit containers restart periodically (1-24 hours of inactivity)

**Impact**: Claude Code configuration in `/home/runner/.claude/` is lost

**Solution**: 
- Backup stored in persistent workspace (`~/workspace/.claude/`)
- Automated restoration script copies config back
- One command restores everything

**Result**: 30 seconds to restore vs "many sessions" of manual work

---

## Filesystem Architecture

```
/home/runner/.claude/              ← EPHEMERAL (destroyed on restart)
├── statusline-command.sh           Active script (copied from backup)
└── settings.json                   Active config (recreated by restore)

/home/runner/workspace/.claude/    ← PERSISTENT (survives restarts)
├── statusline-command.sh           Authoritative backup (6088 bytes)
├── restore-config.sh               Restoration automation
├── check-health.sh                 Health check utility
└── data/
    ├── usage-stats.json            Cost tracking state (PERSISTENT)
    └── statusline-debug.log        Debug output (PERSISTENT)
```

**Key Insight**: Configuration is ephemeral, data is persistent

---

## Troubleshooting

### Issue: Statusline not displaying
1. Check if config exists: `ls ~/.claude/statusline-command.sh`
2. If missing: `restore-statusline`
3. Restart Claude Code CLI

### Issue: Shows "$0.00"
**Normal behavior** - New session hasn't generated transcript yet. Costs appear after first interaction.

### Issue: "Scripts out of sync"
```bash
# Update backup to latest version
cp ~/.claude/statusline-command.sh ~/workspace/.claude/

# Verify sync
~/workspace/.claude/check-health.sh
```

### Issue: "alias restore-statusline not found"
```bash
# Reload shell config
source ~/.bashrc

# Or use full path
/home/runner/workspace/.claude/restore-config.sh
```

---

## Documentation

- **Quick Start**: `QUICK_FIX_INSTRUCTIONS.md` (this directory)
- **Deep Dive**: `/home/runner/workspace/docs/statusline/REPLIT_PERSISTENCE_DEFINITIVE_ANSWER.md`
- **User Guide**: `/home/runner/workspace/docs/statusline/GUIDE.md`
- **Pricing**: `/home/runner/workspace/docs/statusline/PRICING_REFERENCE.md`
- **Summary**: `/home/runner/workspace/docs/statusline/IMPLEMENTATION_SUMMARY.md`

---

## Setup (One-Time)

If you haven't set up the alias yet:

```bash
# Add convenience alias
echo 'alias restore-statusline="/home/runner/workspace/.claude/restore-config.sh"' >> ~/.bashrc
source ~/.bashrc

# Test it
restore-statusline
```

---

**Last Updated**: 2025-11-01
**Status**: ✅ Fully implemented and tested
**Confidence**: HIGH (filesystem analysis confirmed)
