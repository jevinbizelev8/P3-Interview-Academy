# Statusline Documentation

AWS Bedrock cost tracking for Claude Code using real-time token usage monitoring.

## Quick Links

- **[User Guide](GUIDE.md)** - Complete setup and usage guide
- **[Pricing Reference](PRICING_REFERENCE.md)** - AWS Bedrock pricing breakdown
- **[Technical Reports](TOKEN_FIX_REPORT.md)** - Fix history and technical details

## Overview

The statusline displays real-time AWS Bedrock API usage and costs:

```
Session: 3.4M↑/17.2K↓ $0.18 │ Today: $2.45 │ Week: $15.30 │ 45m │ 15:30 │ ~/project [main]
```

### Components

| Display | Description |
|---------|-------------|
| **Session** | Current session input/output tokens and cost |
| **Today** | Cumulative cost for all sessions today |
| **Week** | Cumulative cost for this week (Monday-Sunday) |
| **Duration** | Current session elapsed time |
| **Time** | Current time |
| **Directory** | Current working directory |
| **Git Branch** | Current git branch (if in repo) |

## Features

✅ **100% Accurate Costs** - Uses real AWS Bedrock charges
✅ **Real Token Counts** - Extracts from transcript files (not estimates)
✅ **Cache-Aware** - Tracks fresh, cache write, and cache read tokens
✅ **API Auto-Detection** - Shows full tracking for AWS Bedrock, minimal for standard API
✅ **Persistent History** - Tracks daily and weekly totals across sessions

## Pricing (AWS Bedrock Sonnet 4.5)

| Token Type | Per 1K | Savings |
|------------|--------|---------|
| Fresh Input | $0.003 | baseline |
| Cache Write | $0.00375 | -25% (premium) |
| Cache Read | $0.0003 | **+90%** 🎉 |
| Output | $0.015 | 5x input |

See [Pricing Reference](PRICING_REFERENCE.md) for detailed breakdown.

## Files

### Configuration
- **Script**: `~/.claude/statusline-command.sh` - Main statusline script
- **Settings**: `~/.claude/settings.json` - Claude Code configuration

### Data
- **State**: `~/.claude/data/usage-stats.json` - Session history and totals
- **Debug Log**: `~/.claude/data/statusline-debug.log` - Detailed activity log

### Documentation
- **Guide**: `docs/statusline/GUIDE.md` - Complete user guide
- **Pricing**: `docs/statusline/PRICING_REFERENCE.md` - Cost breakdown
- **Technical**: `docs/statusline/TOKEN_FIX_REPORT.md` - Implementation details

## Quick Commands

```bash
# View usage stats
cat ~/.claude/data/usage-stats.json | jq .

# Check today's cost
cat ~/.claude/data/usage-stats.json | jq '.daily["2025-10-31"].cost'

# View recent debug log
tail -20 ~/.claude/data/statusline-debug.log

# Calculate all-time total
cat ~/.claude/data/usage-stats.json | jq '[.sessions[].cost] | add'

# View cost breakdown
tail -50 ~/.claude/data/statusline-debug.log | grep -A 8 "COST BREAKDOWN"
```

## API Detection

The statusline automatically detects which Claude API is being used:

**AWS Bedrock API (claude-bed):**
- Shows full cost tracking with tokens
- Tracks session, daily, and weekly totals
- Monitors cache usage

**Standard Anthropic API (claude-sub):**
- Shows minimal display (time, directory, git only)
- No cost tracking (subscription-based)

## Status

**Last Updated**: 2025-10-31
**Version**: 2.0
**Status**: ✅ Production-ready

### Recent Updates

- **2025-10-31**: **CRITICAL FIX #2** - Fixed state file handling so daily/weekly costs and session duration now work
- **2025-10-31**: **CRITICAL FIX #1** - Switched to token-based cost calculation (was showing $1 instead of actual $20+ costs)
- **2025-10-31**: Added accurate cache pricing (write $0.00375, read $0.0003)
- **2025-10-31**: Fixed token tracking to use real counts from transcripts
- **2025-10-31**: Added API auto-detection for Bedrock vs Standard API
- **2025-10-31**: Enhanced cost breakdown in debug logs

## Support

For issues or questions:
1. Check the [User Guide](GUIDE.md) for troubleshooting
2. View debug log: `tail -50 ~/.claude/data/statusline-debug.log`
3. Test script manually: `echo '{"session_id":"test","cost":{"total_cost_usd":0.01},"workspace":{"current_dir":"/home/runner/workspace"}}' | ~/.claude/statusline-command.sh`

## Customization

To modify the statusline, use the `statusline-setup` agent:

```
Use the statusline-setup agent to configure my statusline to show XYZ...
```

**Important**: Always use the statusline-setup agent for changes to ensure proper configuration.

---

**Documentation Version**: 2.0
**Last Reviewed**: 2025-10-31
