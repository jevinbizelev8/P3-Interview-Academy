# Statusline Quick Fix for Replit

**TL;DR**: The statusline works correctly. Documentation just needs path updates.

---

## Problem

Documentation says state file is at:
```bash
~/.claude/data/usage-stats.json  # ❌ WRONG for Replit
```

Actual location in Replit:
```bash
~/workspace/.claude/data/usage-stats.json  # ✅ CORRECT
```

---

## Solution: Update These Commands in Documentation

### Files to Update
1. `docs/statusline/README.md`
2. `docs/statusline/GUIDE.md`
3. `docs/statusline/PRICING_REFERENCE.md`

### Find and Replace

#### Pattern 1: Tilde paths
```bash
# FIND
~/.claude/data/usage-stats.json

# REPLACE
~/workspace/.claude/data/usage-stats.json
```

#### Pattern 2: Absolute paths
```bash
# FIND
/home/runner/.claude/data/usage-stats.json

# REPLACE
/home/runner/workspace/.claude/data/usage-stats.json
```

#### Pattern 3: Command examples
```bash
# FIND
cat ~/.claude/data/usage-stats.json | jq .

# REPLACE
cat ~/workspace/.claude/data/usage-stats.json | jq .
```

---

## Add This Section to GUIDE.md

Insert after the "Files and Storage" section:

```markdown
### Replit Environment

In Replit, files are stored in the **workspace directory** for persistence:

**Why workspace instead of home?**
- `/home/runner/` uses overlay filesystem (ephemeral, may reset)
- `/home/runner/workspace/` uses btrfs (persistent across restarts)
- State file needs to survive container restarts

**Accessing your data in Replit:**
```bash
# View usage stats
cat ~/workspace/.claude/data/usage-stats.json | jq .

# Check today's cost
TODAY=$(date +%Y-%m-%d)
cat ~/workspace/.claude/data/usage-stats.json | jq ".daily[\"$TODAY\"].cost"

# View debug log
tail -50 ~/workspace/.claude/data/statusline-debug.log
```

**Optional convenience symlink:**
```bash
mkdir -p ~/.claude/data
ln -s ~/workspace/.claude/data/usage-stats.json ~/.claude/data/usage-stats.json
```

Now you can use both paths interchangeably.
```

---

## Quick Verification Commands

After making changes, test with these commands:

```bash
# 1. Verify state file exists and is valid
cat ~/workspace/.claude/data/usage-stats.json | jq .

# 2. Test statusline script manually
echo '{"session_id":"test","workspace":{"current_dir":"'"$(pwd)"'"}}' | ~/.claude/statusline-command.sh

# 3. Check settings point to correct script
cat ~/.claude/settings.json | jq '.statusLine.command'
# Should output: "/home/runner/.claude/statusline-command.sh"

# 4. Verify both scripts are identical
md5sum ~/.claude/statusline-command.sh ~/workspace/.claude/statusline-command.sh
# Should show same hash for both
```

Expected output:
```
Session: 0↑/0↓ $0.00 │ Today: $0.00 │ Week: $0.00 │ 0m │ HH:MM │ ~/workspace [branch]
```

---

## Common Issues Resolved

### "I can't find ~/.claude/data/usage-stats.json"
**Fix**: Use `~/workspace/.claude/data/usage-stats.json` instead

### "Statusline shows $0.00 but I used it yesterday"
**Check**: Did you provide transcript in test? Real usage updates automatically
```bash
# View yesterday's costs
cat ~/workspace/.claude/data/usage-stats.json | jq '.daily'
```

### "Debug log shows data but statusline doesn't"
**Normal**: New sessions start at $0.00, update after first response

---

## No Code Changes Needed

✅ Script is correct (hardcodes workspace path)
✅ Settings file is correct (points to home directory script)
✅ Both script copies are identical
✅ State file persists correctly

Only documentation needs updating to match actual behavior.

---

## See Also

- **Full Analysis**: `docs/statusline/REPLIT_PERSISTENCE_ANALYSIS.md`
- **User Guide**: `docs/statusline/GUIDE.md`
- **Pricing Details**: `docs/statusline/PRICING_REFERENCE.md`
