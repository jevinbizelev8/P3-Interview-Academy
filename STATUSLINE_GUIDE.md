# AWS Bedrock Cost Tracking StatusLine Guide

## Overview

Your Claude Code statusline now displays real-time AWS Bedrock API usage and cost tracking for Sonnet 4.5.

## StatusLine Format

```
Session: 4.2K↑/7.2K↓ $0.12 │ Today: $2.45 │ Week: $15.30 │ 45m │ 15:30 │ ~/project [main]
```

### Components

| Component | Description | Example |
|-----------|-------------|---------|
| **Session** | Current session input/output tokens and cost | `4.2K↑/7.2K↓ $0.12` |
| **Today** | Cumulative cost for today (all sessions) | `$2.45` |
| **Week** | Cumulative cost for this week (Monday-Sunday) | `$15.30` |
| **Duration** | Current session duration | `45m` |
| **Time** | Current time | `15:30` |
| **Directory** | Current working directory | `~/project` |
| **Git Branch** | Current git branch (if in repo) | `[main]` |

## Pricing (AWS Bedrock Sonnet 4.5)

- **Input tokens**: $0.003 per 1K tokens ($3 per million)
- **Output tokens**: $0.015 per 1K tokens ($15 per million)
- **Thinking tokens**: Counted as input tokens

Costs shown are **estimates** based on token usage. Actual AWS billing may vary slightly.

## Files and Storage

### Script
- **Location**: `/home/runner/.claude/statusline-command.sh`
- **Purpose**: Calculates and displays metrics in real-time
- **Updates**: Runs each time the statusline refreshes

### State File
- **Location**: `/home/runner/.claude/data/usage-stats.json`
- **Purpose**: Persists session history, daily, and weekly totals
- **Retention**: Keeps session data for historical tracking

### Settings
- **Location**: `/home/runner/.claude/settings.json`
- **Configuration**:
  ```json
  {
    "statusLine": {
      "type": "command",
      "command": "/home/runner/.claude/statusline-command.sh"
    }
  }
  ```

## Usage Stats Example

```json
{
  "sessions": {
    "abc-123": {
      "input_tokens": 4224,
      "output_tokens": 7201,
      "cost": 0.1207,
      "start_time": "2025-10-31T04:00:00",
      "last_update": "2025-10-31T04:30:00"
    }
  },
  "daily": {
    "2025-10-31": {
      "cost": 2.45,
      "date": "2025-10-31"
    }
  },
  "weekly": {
    "2025-W43": {
      "cost": 15.30,
      "week": "2025-W43"
    }
  }
}
```

## Viewing Historical Data

To view detailed cost breakdown:

```bash
# View all usage stats
cat ~/.claude/data/usage-stats.json | jq .

# View today's total cost
cat ~/.claude/data/usage-stats.json | jq '.daily["2025-10-31"].cost'

# View this week's total cost
cat ~/.claude/data/usage-stats.json | jq '.weekly["2025-W43"].cost'

# List all session costs
cat ~/.claude/data/usage-stats.json | jq '.sessions[] | {cost, last_update}'

# Calculate total all-time costs
cat ~/.claude/data/usage-stats.json | jq '[.sessions[].cost] | add'
```

## Customization

### Change Pricing
Edit the script to update costs:
```bash
nano ~/.claude/statusline-command.sh

# Update these lines:
BEDROCK_INPUT_COST_PER_1K=0.003
BEDROCK_OUTPUT_COST_PER_1K=0.015
```

### Modify Display Format
Edit the `printf` statement at the end of the script to customize what's shown and in what order.

### Change Update Frequency
The statusline updates automatically when Claude Code refreshes it (typically after each message/response).

## Troubleshooting

### StatusLine Not Showing
1. Restart Claude Code
2. Verify settings: `cat ~/.claude/settings.json`
3. Test script manually: `echo '{"session_id":"test"}' | ~/.claude/statusline-command.sh`

### Incorrect Costs
1. Verify pricing constants in the script
2. Check if transcript parsing is working: Look for token counts in transcript files
3. Confirm AWS Bedrock model pricing hasn't changed

### State File Issues
If the state file gets corrupted, simply delete it and it will be recreated:
```bash
rm ~/.claude/data/usage-stats.json
```

## Future Modifications

To modify the statusline configuration, use the `statusline-setup` agent:

```
Use the statusline-setup agent to configure my statusline to show XYZ...
```

**Important**: Always use the statusline-setup agent for future changes to ensure proper configuration.

## Cost Monitoring Tips

1. **Set Daily Budgets**: Monitor the "Today" value to stay within daily budgets
2. **Weekly Reviews**: Check weekly totals to track spending trends
3. **Session Awareness**: Watch session costs for expensive operations
4. **Historical Analysis**: Use jq queries to analyze spending patterns

## Example Cost Queries

```bash
# Find most expensive session
cat ~/.claude/data/usage-stats.json | jq '.sessions | to_entries | max_by(.value.cost)'

# Calculate average daily cost
cat ~/.claude/data/usage-stats.json | jq '[.daily[].cost] | add / length'

# List sessions over $1
cat ~/.claude/data/usage-stats.json | jq '.sessions[] | select(.cost > 1)'
```

---

**Current Session Stats** (as of setup):
- You've already used **14,679 output tokens** in this session
- Current session cost: **$0.22**
- This statusline will now track all future usage automatically!
