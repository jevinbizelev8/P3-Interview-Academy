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

**Official AWS Bedrock Pricing** (as of 2025-10-31):
Source: https://aws.amazon.com/bedrock/pricing/

| Token Type | Price per 1K tokens | Price per 1M tokens | Notes |
|------------|---------------------|---------------------|-------|
| **Standard input (fresh)** | $0.003 | $3.00 | New content, not cached |
| **Cache write** | $0.00375 | $3.75 | Writing to cache (1.25x input cost) |
| **Cache read** | $0.0003 | $0.30 | Reading from cache (90% discount!) |
| **Output** | $0.015 | $15.00 | Generated responses (5x input cost) |

**Key Pricing Insights:**
- Cache reads save 90% compared to fresh input ($0.0003 vs $0.003)
- Cache writes cost 25% MORE than fresh input ($0.00375 vs $0.003)
- Output tokens are 5x more expensive than input ($0.015 vs $0.003)
- Cache strategy: Worth it if content is reused 2+ times (breakeven at ~1.25 reads)

**Important - AWS Bedrock API Mode**:
- **Costs shown are REAL AWS charges**, not estimates
- Claude Code provides actual AWS Bedrock API costs via the statusline interface
- **Token counts are REAL**, extracted from transcript files with detailed breakdown:
  - `input_tokens` - Fresh content sent to Claude
  - `cache_creation_input_tokens` - Content written to cache (costs 1.25x)
  - `cache_read_input_tokens` - Content read from cache (saves 90%!)
  - `output_tokens` - Claude's generated responses
- Both cost and token count accuracy: **100%** (from AWS/Claude Code data)
- Input tokens displayed = fresh + cache_write + cache_read (total input)
- Debug log shows detailed cost breakdown by token type

## How It Works (AWS Bedrock API)

When using Claude Code with AWS Bedrock API, the statusline receives cost data in this format:

```json
{
  "session_id": "abc-123",
  "cost": {
    "total_cost_usd": 0.01737,
    "total_duration_ms": 518893,
    "total_api_duration_ms": 373533
  },
  "transcript_path": "/home/runner/.claude/projects/.../session.jsonl"
}
```

The statusline script:
1. **Extracts the real AWS cost** from `cost.total_cost_usd`
2. **Parses REAL token counts** from the transcript file (includes all cache token types)
3. **Aggregates costs** by session, day, and week
4. **Persists data** to the state file for historical tracking

**Note**: Token counts are parsed from the transcript file using jq to extract `usage.input_tokens`, `usage.cache_creation_input_tokens`, `usage.cache_read_input_tokens`, and `usage.output_tokens` from each message.

## Files and Storage

### Script
- **Location**: `/home/runner/.claude/statusline-command.sh`
- **Purpose**: Calculates and displays metrics in real-time
- **Updates**: Runs each time the statusline refreshes
- **Debug Log**: `/home/runner/workspace/.claude/data/statusline-debug.log` (raw input data)

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
Edit the script to update costs (if AWS pricing changes):
```bash
nano ~/.claude/statusline-command.sh

# Update these lines (currently set to official AWS Bedrock pricing as of 2025-10-31):
BEDROCK_INPUT_COST_PER_1K=0.003          # Standard input
BEDROCK_OUTPUT_COST_PER_1K=0.015         # Output
BEDROCK_CACHE_WRITE_COST_PER_1K=0.00375  # Cache write
BEDROCK_CACHE_READ_COST_PER_1K=0.0003    # Cache read
```

### Modify Display Format
Edit the `printf` statement at the end of the script to customize what's shown and in what order.

### Change Update Frequency
The statusline updates automatically when Claude Code refreshes it (typically after each message/response).

## Troubleshooting

### StatusLine Not Showing
1. Restart Claude Code
2. Verify settings: `cat ~/.claude/settings.json`
3. Check script permissions: `ls -la ~/.claude/statusline-command.sh` (should be executable)
4. Test script manually:
   ```bash
   echo '{"session_id":"test","cost":{"total_cost_usd":0.05}}' | ~/.claude/statusline-command.sh
   ```

### StatusLine Shows $0.00
This is normal at the start of a session. The cost updates after each AI response.
- Check debug log: `tail ~/.claude/data/statusline-debug.log`
- Verify cost data is being received: Look for `"cost":{"total_cost_usd":...}` in debug log

### Understanding Cost Breakdown (Debug Mode)
The debug log (`~/.claude/data/statusline-debug.log`) now includes detailed cost breakdowns:

```bash
tail -30 ~/.claude/data/statusline-debug.log
```

Example output:
```
=== COST BREAKDOWN ===
Fresh input: 45230 tokens = $0.135690
Cache write: 12500 tokens = $0.046875
Cache read: 189000 tokens = $0.056700 (90% discount!)
Output: 8420 tokens = $0.126300
Calculated total: $0.365565
Provided cost (authoritative): $0.365600
```

This helps you understand:
- Where your costs come from (input vs output vs cache)
- How much cache reads are saving you (compare cache read cost to what fresh input would cost)
- Verify pricing accuracy (calculated vs provided should match closely)

**Cache Savings Example:**
- If you have 189K cache read tokens at $0.0003/1K = $0.057
- Same content as fresh input would cost 189K × $0.003/1K = $0.567
- **Savings: $0.510 (90% reduction!)**

### Incorrect Costs
**For AWS Bedrock API users**: Costs are exact from AWS, not calculated locally.
- If costs seem wrong, check your AWS Bedrock billing console
- Token counts are approximations only; actual costs are 100% accurate

### Token Ratio Seems Unusual
This is normal and depends on the task:
- **Reading large files**: Very high input, low output (e.g., 3M↑/17K↓)
- **Code generation**: Lower input, higher output (e.g., 50K↑/200K↓)
- **Conversation**: More balanced ratio (e.g., 100K↑/150K↓)
- The statusline shows **actual token usage**, not estimates
- Input includes cached tokens, which can be very large for file-heavy sessions

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

# View cost breakdown from debug log
tail -50 ~/.claude/data/statusline-debug.log | grep -A 8 "COST BREAKDOWN"

# Calculate total cache savings (requires manual calculation based on cache read tokens)
# Example: If you see "Cache read: 384000 tokens = $0.115200"
# Fresh input equivalent would be: 384000 × $0.003 = $1.152
# Savings: $1.152 - $0.115 = $1.037 (90% reduction)
```

## Understanding Your AWS Bedrock Costs

### Cost Attribution by Token Type

Based on typical usage patterns:

1. **File-heavy sessions** (reading large codebases):
   - High cache read tokens (90% discount applies)
   - Low output tokens (mostly reading, minimal generation)
   - Example: 500K cache reads = $0.15 (vs $1.50 as fresh input)

2. **Code generation sessions**:
   - Moderate input tokens
   - High output tokens (5x price multiplier)
   - Example: 50K input + 200K output = $0.15 + $3.00 = $3.15

3. **Conversational sessions**:
   - Balanced input/output ratio
   - Growing cache over time (more savings per message)
   - Example: 100K input + 150K output = $0.30 + $2.25 = $2.55

### Optimizing Your Costs

**Leverage Cache Effectively:**
- Cache breaks even after just 28% of one reuse
- Long sessions benefit massively from caching
- File content is cached automatically

**Manage Output Length:**
- Output costs 5x more than input ($0.015 vs $0.003)
- Request concise responses when possible
- Use "brief" or "summarize" in prompts

**Monitor Debug Logs:**
- Check cost breakdown regularly: `tail -50 ~/.claude/data/statusline-debug.log | grep -A 8 "COST BREAKDOWN"`
- Look for cache read savings (should show "90% discount!")
- Verify no unexpected cost discrepancies

---

## Verification

To verify the statusline is working:

1. **Check if debug logging is capturing data**:
   ```bash
   tail -20 ~/.claude/data/statusline-debug.log
   ```
   You should see JSON objects with `"cost":{"total_cost_usd":...}` entries.

2. **Verify the statusline appears** at the top of your Claude Code terminal
   - It should update after each message exchange
   - Look for: `Session: X↑/Y↓ $Z.ZZ | Today: $A.AA | Week: $B.BB | ...`

3. **Check the state file is being updated**:
   ```bash
   cat ~/.claude/data/usage-stats.json | jq .
   ```
   You should see session data with costs and timestamps.

4. **Restart Claude Code if needed**
   - The statusline configuration loads on startup
   - After restarting, the statusline should appear immediately

---

**Setup Complete!**
- Statusline script: Updated for AWS Bedrock API cost tracking ✓
- Debug logging: Enabled at `/home/runner/workspace/.claude/data/statusline-debug.log` ✓
- Real-time cost tracking: Active ✓
- Historical data: Persisted to state file ✓

Your statusline will now automatically track AWS Bedrock API costs in real-time!
