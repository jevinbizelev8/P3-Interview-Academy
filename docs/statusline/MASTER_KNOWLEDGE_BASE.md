# Claude Code Statusline - Master Knowledge Base

**Complete consolidated knowledge for AWS Bedrock cost tracking in Replit**

---

## Executive Summary

The Claude Code statusline provides real-time AWS Bedrock API usage and cost tracking with Replit persistence. After solving recurring "many sessions" configuration loss, the system now requires only **30 seconds** to restore after container restarts.

**Current Status**: ✅ Production-ready
**Version**: 2.0 (Replit Persistence Solution)
**Last Updated**: 2025-11-01

---

## Quick Start

### For New Users

1. **One-time setup** (already done):
   - Statusline script: `~/.claude/statusline-command.sh`
   - Backup location: `~/workspace/.claude/statusline-command.sh`
   - Settings configured: `~/.claude/settings.json`
   - Data directory: `~/workspace/.claude/data/` (persistent)

2. **After container restart**:
   ```bash
   ~/workspace/.claude/restore-config.sh
   ```
   **Time**: 30 seconds

3. **Verify it works**:
   ```bash
   ~/workspace/.claude/check-health.sh
   ```

### Expected Display

```
Session: 7.3M↑/16.8K↓ $12.83 │ Today: $17.00 │ Week: $50.46 │ 21m │ 07:31 │ ~/workspace [branch]
```

**Components**:
- **Session**: Current session input/output tokens and cost
- **Today**: Cumulative cost for all sessions today
- **Week**: Cumulative cost for ISO week (Monday-Sunday)
- **Duration**: Session elapsed time
- **Time**: Current time
- **Directory**: Working directory with git branch

---

## Architecture

### Replit Filesystem Design

```
❌ EPHEMERAL: /home/runner/
   └── .claude/
       ├── statusline-command.sh  ← DELETED on restart
       └── settings.json          ← DELETED on restart

✅ PERSISTENT: /home/runner/workspace/
   └── .claude/
       ├── statusline-command.sh  ← SURVIVES forever
       ├── settings.json          ← SURVIVES forever
       ├── restore-config.sh      ← Restoration script
       ├── check-health.sh        ← Health check
       ├── aliases.sh             ← Convenience aliases
       └── data/
           ├── usage-stats.json   ← Cost history (persistent)
           └── statusline-debug.log ← Debug logs
```

### Mount Points (Verified)

```bash
# Ephemeral overlay (32GB)
overlay on /home/runner

# Persistent btrfs (256GB)
/dev/nbd65 on /home/runner/workspace
```

**Key Insight**: Replit containers restart every 1-24 hours, wiping `/home/runner/` but preserving `/home/runner/workspace/`.

---

## Technical Implementation

### Token Extraction (JSONL Format)

Claude Code transcripts are newline-delimited JSON. Each line contains:

```json
{
  "message": {
    "usage": {
      "input_tokens": 10,
      "cache_creation_input_tokens": 29549,
      "cache_read_input_tokens": 1880440,
      "output_tokens": 4
    }
  }
}
```

**Parsing Logic**:
```bash
# Read line-by-line from JSONL transcript
while IFS= read -r line; do
  FRESH_INPUT=$((FRESH_INPUT + $(echo "$line" | jq -r '.message.usage.input_tokens // 0')))
  CACHE_WRITE=$((CACHE_WRITE + $(echo "$line" | jq -r '.message.usage.cache_creation_input_tokens // 0')))
  CACHE_READ=$((CACHE_READ + $(echo "$line" | jq -r '.message.usage.cache_read_input_tokens // 0')))
  OUTPUT_TOKENS=$((OUTPUT_TOKENS + $(echo "$line" | jq -r '.message.usage.output_tokens // 0')))
done < "$TRANSCRIPT_PATH"
```

### Cost Calculation (AWS Bedrock Sonnet 4.5)

**Pricing Tiers**:
| Token Type | Per 1K | Cost Multiplier |
|------------|--------|-----------------|
| Fresh input | $0.003 | 1x (baseline) |
| Cache write | $0.00375 | 1.25x (premium for storage) |
| Cache read | $0.0003 | 0.1x (90% discount!) |
| Output | $0.015 | 5x (most expensive) |

**Implementation**:
```bash
FRESH_COST=$(awk "BEGIN {printf \"%.6f\", ($FRESH_INPUT * 0.003 / 1000)}")
CACHE_WRITE_COST=$(awk "BEGIN {printf \"%.6f\", ($CACHE_WRITE * 0.00375 / 1000)}")
CACHE_READ_COST=$(awk "BEGIN {printf \"%.6f\", ($CACHE_READ * 0.0003 / 1000)}")
OUTPUT_COST=$(awk "BEGIN {printf \"%.6f\", ($OUTPUT_TOKENS * 0.015 / 1000)}")

SESSION_COST=$(awk "BEGIN {printf \"%.4f\", $FRESH_COST + $CACHE_WRITE_COST + $CACHE_READ_COST + $OUTPUT_COST}")
```

### Weekly Aggregation (ISO Week)

**Problem Solved**: Original logic used month-based filtering, which failed across month boundaries (Week 44 spans Oct 31 and Nov 1).

**Solution**:
```bash
# Iterate through daily costs and sum those from current ISO week
WEEKLY_COST=0
for date_key in $(echo "$SESSION_DATA" | jq -r '.daily | keys[]'); do
  date_week=$(date -d "$date_key" +%Y-W%V)
  if [ "$date_week" = "$WEEK" ]; then
    day_cost=$(echo "$SESSION_DATA" | jq -r ".daily[\"$date_key\"].cost // 0")
    WEEKLY_COST=$(awk "BEGIN {printf \"%.4f\", $WEEKLY_COST + $day_cost}")
  fi
done
```

**ISO Week Format**: `YYYY-WNN` (e.g., `2025-W44`)
- Week starts Monday, ends Sunday
- Week 1 contains first Thursday of year
- Handles year boundaries correctly

### State File Format

**Location**: `~/workspace/.claude/data/usage-stats.json`

```json
{
  "sessions": {
    "bcaeca5f-dad9-495a-aa64-aaaf1fb0a657": {
      "input_tokens": 6737735,
      "output_tokens": 13386,
      "cost": 10.8237,
      "start_time": "2025-11-01T06:05:40.779Z",
      "last_update": "2025-11-01T07:31:22.000Z"
    }
  },
  "daily": {
    "2025-10-31": {
      "cost": 33.4566,
      "date": "2025-10-31"
    },
    "2025-11-01": {
      "cost": 17.0036,
      "date": "2025-11-01"
    }
  },
  "weekly": {
    "2025-W44": {
      "cost": 50.4602,
      "week": "2025-W44"
    }
  }
}
```

**Data Persistence**: Symlinked from `/home/runner/.claude/data` to `/home/runner/workspace/.claude/data` to survive container restarts.

---

## Problem History & Resolution

### The "Many Sessions" Problem

**Symptoms**:
- Statusline works initially
- After closing Claude Code and reopening (or after container restart)
- Statusline shows all $0.00 or disappears
- Required "many sessions" to fix

**Root Cause**:
- Claude Code stores configuration in `/home/runner/.claude/`
- Replit containers restart every 1-24 hours
- Container restarts wipe `/home/runner/` (ephemeral overlay filesystem)
- Configuration lost every time

**Failed Solutions Attempted**:
1. ❌ Symlinks from home to workspace (settings.json also ephemeral)
2. ❌ Moving everything to workspace (Claude Code expects `~/.claude/`)
3. ❌ Changing settings.json path (not configurable)

**Working Solution**:
1. ✅ Store backups in persistent workspace
2. ✅ Create automated restoration script
3. ✅ Symlink data directory for persistence
4. ✅ One-command restoration (30 seconds)
5. ✅ Git-track all configuration

### Historical Issues Fixed

**2025-10-31**:
1. ✅ Token extraction logic (was looking for `.interactions[]`, should parse JSONL)
2. ✅ Cost calculation (was using simplified pricing, now cache-aware)
3. ✅ State file handling (wasn't persisting correctly)
4. ✅ Duration tracking (epoch calculation issues)

**2025-11-01**:
1. ✅ Weekly cost aggregation (month-based → ISO week-based)
2. ✅ Replit persistence (added restoration script)
3. ✅ Version drift (active script differed from backup)
4. ✅ Documentation consolidation (11 guides created)

---

## Restoration System

### Automatic Restoration Script

**File**: `~/workspace/.claude/restore-config.sh`

**What it does**:
1. Creates `/home/runner/.claude/` directory
2. Copies `statusline-command.sh` from workspace to home
3. Copies or creates `settings.json`
4. Creates symlink: `~/.claude/data` → `~/workspace/.claude/data`
5. Verifies permissions and executability

**Usage**:
```bash
~/workspace/.claude/restore-config.sh
```

**Output**:
```
🔧 Restoring Claude Code statusline configuration...

✅ Statusline configuration restored!

To verify, run:
  ~/workspace/.claude/check-health.sh
```

### Health Check Script

**File**: `~/workspace/.claude/check-health.sh`

**What it checks**:
- Active script exists and is executable
- Backup script exists
- Versions are in sync (MD5 hash comparison)
- Settings file exists
- Data directory is symlinked correctly
- State file contains valid JSON
- Current costs (today and week)

**Usage**:
```bash
~/workspace/.claude/check-health.sh
```

**Expected Output**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Claude Code Statusline - Health Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Active Script: /home/runner/.claude/statusline-command.sh (6088 bytes)
✅ Backup Script: ~/workspace/.claude/statusline-command.sh (6088 bytes)
✅ Version Sync: IN SYNC (MD5: e00244f4...)
✅ Settings: /home/runner/.claude/settings.json
✅ Data Link: Symlink → ~/workspace/.claude/data
✅ Usage Data: Today $17.00 | Week $50.46

Testing statusline output:
Session: 7.3M↑/16.8K↓ $12.83 │ Today: $17.00 │ Week: $50.46 │ 21m │ 07:31 │ ~/workspace [branch]
```

---

## Common Workflows

### Daily Development

**Normal operation**:
- Statusline updates automatically on each Claude Code interaction
- No manual intervention needed
- Costs accumulate in state file

**If container restarted** (detect by seeing $0.00):
```bash
~/workspace/.claude/restore-config.sh
```

### Weekly Maintenance

**Monday morning** (new week):
```bash
# Check week totals reset correctly
~/workspace/.claude/check-health.sh
```

**After editing statusline script**:
```bash
# Sync versions to prevent loss
cp ~/.claude/statusline-command.sh ~/workspace/.claude/

# Commit the update
git add .claude/statusline-command.sh
git commit -m "Update statusline script"
git push
```

### Troubleshooting

**Problem: All costs show $0.00**
```bash
# Restore configuration
~/workspace/.claude/restore-config.sh

# If still broken, check health
~/workspace/.claude/check-health.sh
```

**Problem: Version drift detected**
```bash
# Sync from active to backup
cp ~/.claude/statusline-command.sh ~/workspace/.claude/

# Or sync from backup to active
cp ~/workspace/.claude/statusline-command.sh ~/.claude/

# Verify sync
~/workspace/.claude/check-health.sh
```

**Problem: Week total missing yesterday**
```bash
# Check state file has daily entries
cat ~/workspace/.claude/data/usage-stats.json | jq '.daily'

# Check week calculation
TODAY=$(date +%Y-%m-%d)
WEEK=$(date +%Y-W%V)
echo "Today: $TODAY | Week: $WEEK"
```

**Problem: Session duration stuck at 0m**
```bash
# Check session start time
cat ~/workspace/.claude/data/usage-stats.json | jq '.sessions[] | {start_time, last_update}'

# Verify date parsing works
date -d "2025-11-01T06:05:40.779Z" +%s
```

---

## Cost Analysis

### Typical Session Costs

**Small session** (10 minutes, basic queries):
- Input: ~100K tokens
- Output: ~2K tokens
- Cost: ~$0.50

**Medium session** (1 hour, development work):
- Input: ~1M tokens (mostly cache reads)
- Output: ~10K tokens
- Cost: ~$2-5

**Large session** (3+ hours, complex tasks):
- Input: ~5M tokens (mix of fresh and cache)
- Output: ~20K tokens
- Cost: ~$10-20

**Cache Impact**:
- Without cache: 1M input tokens = $3.00
- With cache read: 1M input tokens = $0.30 (90% savings!)
- Cache write overhead: +25% first time, then 90% savings after

### Weekly Cost Tracking

**Example Week 44 (Oct 27 - Nov 2)**:
```
Mon: $8.45   (fresh work, building cache)
Tue: $12.33  (heavy development, cache building)
Wed: $15.67  (peak usage)
Thu: $9.82   (cache reads saving money)
Fri: $7.45   (mostly cache reads)
Sat: $2.10   (light usage)
Sun: $1.20   (minimal)
─────────────
Total: $57.02
```

**Monthly Projection**: $200-250 for active development

---

## File Reference

### Core Files

| Path | Purpose | Persists | Size |
|------|---------|----------|------|
| `~/.claude/statusline-command.sh` | Active script used by Claude Code | ❌ No | 6KB |
| `~/workspace/.claude/statusline-command.sh` | Backup copy | ✅ Yes | 6KB |
| `~/.claude/settings.json` | Claude Code configuration | ❌ No | <1KB |
| `~/workspace/.claude/settings.json` | Backup configuration | ✅ Yes | <1KB |
| `~/workspace/.claude/data/usage-stats.json` | Cost history | ✅ Yes | ~1KB |
| `~/workspace/.claude/data/statusline-debug.log` | Debug logs | ✅ Yes | ~50KB |

### Utility Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `restore-config.sh` | Restore after container restart | `~/workspace/.claude/restore-config.sh` |
| `check-health.sh` | Verify configuration | `~/workspace/.claude/check-health.sh` |
| `aliases.sh` | Convenience aliases | Source in shell startup |

### Documentation

| Document | Purpose | Audience |
|----------|---------|----------|
| `MASTER_KNOWLEDGE_BASE.md` | This file - complete reference | Developers |
| `README.md` | Quick overview | All users |
| `GUIDE.md` | Complete user guide | End users |
| `REPLIT_PERSISTENCE_DEFINITIVE_ANSWER.md` | Technical deep dive | DevOps |
| `USAGE_INSTRUCTIONS.md` | Quick reference | Daily users |
| `QUICK_FIX_INSTRUCTIONS.md` | Copy-paste commands | Troubleshooting |
| `PRICING_REFERENCE.md` | AWS cost breakdown | Finance |

---

## Best Practices

### Development

1. **Always sync versions after editing**:
   ```bash
   cp ~/.claude/statusline-command.sh ~/workspace/.claude/
   ```

2. **Test changes before committing**:
   ```bash
   ~/workspace/.claude/check-health.sh
   ```

3. **Commit configuration to git**:
   ```bash
   git add .claude/
   git commit -m "Update statusline configuration"
   git push
   ```

### Operations

1. **Run health check weekly**:
   ```bash
   ~/workspace/.claude/check-health.sh
   ```

2. **Monitor costs**:
   ```bash
   cat ~/workspace/.claude/data/usage-stats.json | jq .
   ```

3. **Review debug logs for issues**:
   ```bash
   tail -50 ~/workspace/.claude/data/statusline-debug.log
   ```

### Team Collaboration

1. **Share restoration script** with team members
2. **Document Replit-specific quirks** in team wiki
3. **Track cost budgets** using weekly totals
4. **Version control** all configuration changes

---

## Advanced Topics

### Custom Pricing

To adjust for different models, edit pricing constants in script:

```bash
BEDROCK_INPUT_COST_PER_1K=0.003   # Fresh input
BEDROCK_CACHE_WRITE_PER_1K=0.00375  # Cache write
BEDROCK_CACHE_READ_PER_1K=0.0003    # Cache read
BEDROCK_OUTPUT_COST_PER_1K=0.015    # Output
```

### Custom Display Format

Modify line 148 in `statusline-command.sh`:

```bash
printf "Session: %s↑/%s↓ \$%.2f │ Today: \$%.2f │ Week: \$%.2f │ %s │ %s │ %s%s" \
  "$INPUT_DISPLAY" \
  "$OUTPUT_DISPLAY" \
  "$SESSION_COST" \
  "$TODAY_COST" \
  "$WEEK_COST" \
  "$DURATION" \
  "$CURRENT_TIME" \
  "$DIR_DISPLAY" \
  "$GIT_BRANCH"
```

### Data Export

Export cost history for analysis:

```bash
# Export all sessions
cat ~/workspace/.claude/data/usage-stats.json | jq '.sessions' > sessions.json

# Export daily costs
cat ~/workspace/.claude/data/usage-stats.json | jq '.daily' > daily-costs.json

# Export as CSV
cat ~/workspace/.claude/data/usage-stats.json | jq -r '.daily | to_entries | .[] | [.key, .value.cost] | @csv' > costs.csv
```

---

## Support & Contact

**Issues**:
1. Check health: `~/workspace/.claude/check-health.sh`
2. Review debug logs: `tail -50 ~/workspace/.claude/data/statusline-debug.log`
3. Consult documentation: See files above

**Updates**:
- Watch CLAUDE.md for recent updates
- Check git commits for changes
- Review ops-log for monthly summaries

---

## Appendix: Command Reference

### One-Line Commands

```bash
# Restore configuration
~/workspace/.claude/restore-config.sh

# Check health
~/workspace/.claude/check-health.sh

# View costs
cat ~/workspace/.claude/data/usage-stats.json | jq .

# Sync versions
cp ~/.claude/statusline-command.sh ~/workspace/.claude/

# Test statusline
echo '{"session_id":"test","workspace":{"current_dir":"'$(pwd)'"}}' | ~/.claude/statusline-command.sh

# View debug log
tail -50 ~/workspace/.claude/data/statusline-debug.log

# Check today's cost
TODAY=$(date +%Y-%m-%d) && cat ~/workspace/.claude/data/usage-stats.json | jq ".daily[\"$TODAY\"].cost"

# Check week's cost
WEEK=$(date +%Y-W%V) && cat ~/workspace/.claude/data/usage-stats.json | jq ".weekly[\"$WEEK\"].cost"
```

---

**Document Version**: 1.0
**Last Updated**: 2025-11-01
**Maintainer**: P3 Interview Academy DevOps Team
**Status**: ✅ Production-ready
