# AWS Bedrock Sonnet 4.5 Pricing - Quick Reference

## Official Pricing (as of 2025-10-31)
Source: https://aws.amazon.com/bedrock/pricing/

| Token Type | Per 1K | Per 1M | Relative Cost | When It's Used |
|------------|--------|--------|---------------|----------------|
| **Fresh Input** | $0.003 | $3.00 | 1.0x (baseline) | New content not in cache |
| **Cache Write** | $0.00375 | $3.75 | 1.25x (+25%) | Writing to cache |
| **Cache Read** | $0.0003 | $0.30 | 0.1x (-90%) | Reading from cache |
| **Output** | $0.015 | $15.00 | 5.0x (+400%) | Claude's responses |

## Quick Math

### Cache Economics
- **Break-even**: Cache profitable after just 0.28 reads (less than 1 full reuse!)
- **ROI**: Each cache read saves 90% ($0.0027 per 1K tokens)
- **Strategy**: Always worth caching content reused 2+ times

### Cost Comparison Examples

**100K tokens as fresh input:**
- Cost: 100 × $0.003 = $0.30

**100K tokens cached then read:**
- Write: 100 × $0.00375 = $0.375
- Read: 100 × $0.0003 = $0.03
- Total first use: $0.405 (35% more expensive)
- Total second use: $0.405 + $0.03 = $0.435 (27.5% cheaper than 2× fresh)
- Total third use: $0.405 + $0.06 = $0.465 (48% cheaper than 3× fresh)

**Output is expensive:**
- 100K output: 100 × $0.015 = $1.50 (5x more than input!)

## Viewing Cost Breakdown

```bash
# See detailed cost breakdown for current session
tail -50 ~/.claude/data/statusline-debug.log | grep -A 8 "COST BREAKDOWN"

# Example output:
# === COST BREAKDOWN ===
# Fresh input: 45230 tokens = $0.135690
# Cache write: 12500 tokens = $0.046875
# Cache read: 189000 tokens = $0.056700 (90% discount!)
# Output: 8420 tokens = $0.126300
# Calculated total: $0.365565
# Provided cost (authoritative): $0.365600
```

## StatusLine Display

```
Session: 442.9K↑/11.9K↓ $0.74 │ Today: $1.47 │ Week: $1.47 │ 1h10m │ 10:36 │ ~/workspace [main]
         ^^^^^^ ^^^^^^  ^^^^^     ^^^^^^^^^^^^   ^^^^^^^^^^^   ^^^^^
         Input  Output  Session   Daily total    Weekly total  Duration
```

- **Input tokens** = fresh + cache_write + cache_read (all input types combined)
- **Output tokens** = generated responses
- **Session cost** = actual AWS charge (100% accurate)

## Cost Optimization Tips

### 1. Leverage Caching (90% savings!)
- Long sessions automatically benefit from caching
- File content is cached by Claude Code
- Cache breaks even after <1 full reuse

### 2. Manage Output Length (5x cost multiplier)
- Request concise responses: "briefly explain...", "summarize..."
- Avoid asking for verbose examples when short ones suffice
- Use "show only the changes" for code edits

### 3. Monitor Your Costs
```bash
# Check today's spending
cat ~/workspace/.claude/data/usage-stats.json | jq '.daily["2025-10-31"].cost'

# Check weekly spending
cat ~/workspace/.claude/data/usage-stats.json | jq '.weekly["2025-W43"].cost'

# Find most expensive session
cat ~/workspace/.claude/data/usage-stats.json | jq '.sessions | to_entries | max_by(.value.cost)'
```

## Typical Session Costs

### File-Heavy Session (reading codebase)
- Input: 500K (mostly cache reads at 90% discount)
- Output: 20K (short responses)
- **Cost: ~$0.50** (vs ~$2.00 without cache)

### Code Generation Session
- Input: 50K
- Output: 200K (extensive code generation)
- **Cost: ~$3.15** (output is 95% of cost)

### Conversational Session
- Input: 100K (mixed fresh + cache)
- Output: 150K
- **Cost: ~$2.55** (balanced usage)

## Configuration Files

- **Script**: `/home/runner/.claude/statusline-command.sh`
- **Guide**: `/home/runner/workspace/STATUSLINE_GUIDE.md`
- **State**: `/home/runner/workspace/.claude/data/usage-stats.json`
- **Debug Log**: `/home/runner/workspace/.claude/data/statusline-debug.log`

## Verification

**Pricing constants in script (lines 17-20):**
```bash
BEDROCK_INPUT_COST_PER_1K=0.003          # Fresh input
BEDROCK_OUTPUT_COST_PER_1K=0.015         # Output
BEDROCK_CACHE_WRITE_COST_PER_1K=0.00375  # Cache write
BEDROCK_CACHE_READ_COST_PER_1K=0.0003    # Cache read
```

These match official AWS Bedrock pricing as of 2025-10-31.

## Key Takeaways

1. **Cache is incredibly cost-effective** - 90% discount on reads
2. **Output is expensive** - 5x more than input
3. **Cache breaks even fast** - Profitable after <1 full reuse
4. **Your costs are accurate** - Direct from AWS, not estimated
5. **Debug logs show breakdown** - See exactly where costs come from

---

**Last Updated**: 2025-10-31
**Pricing Source**: https://aws.amazon.com/bedrock/pricing/
**Model**: Claude Sonnet 4.5 (global.anthropic.claude-sonnet-4-5-20250929-v1:0)
