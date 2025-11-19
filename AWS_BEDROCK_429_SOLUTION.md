# AWS Bedrock 429 Error Solution Guide

## Problem Summary

Your AWS Bedrock account has extremely low rate limits for Claude Sonnet 4.5:
- **Current limit**: 2 requests per minute (RPM)
- **AWS Default**: 200 RPM for standard model, 5 RPM for 1M context model
- **Root Cause**: Account was restricted to 2 RPM (99% below AWS default)
- **Needed for development**: Match Claude Code Pro subscription (5+ RPM minimum)

## Resolution Status

**Date**: 2025-10-31
**Status**: ✅ Quota increase requests submitted - Awaiting AWS approval

### Submitted Requests

| Quota | Current | Requested | AWS Default | Request ID | Case ID | Status | Priority |
|-------|---------|-----------|-------------|------------|---------|--------|----------|
| **Standard RPM** | 2.0 | 200.0 | 200.0 | d19ebf7f... | 176188964300045 | ✅ CASE_OPENED | 🔴 CRITICAL |
| **Standard TPM** | 200K | 1M | 200K | 3973de35... | 176188958200595 | ✅ CASE_OPENED | 🟡 HELPFUL |
| **1M Context RPM** | 2.0 | 200.0 | 5.0 | cf735cd2... | 176188731300197 | ✅ CASE_OPENED | 🟢 OPTIONAL |
| **1M Context TPM** | 1M | 2M | 1M | e033a87c... | 176188958500527 | ✅ CASE_OPENED | 🟢 OPTIONAL |

**Priority Explanation**:
- 🔴 **CRITICAL**: Fixes the 429 rate limit errors you're experiencing
- 🟡 **HELPFUL**: Prevents token-based throttling at higher request rates
- 🟢 **OPTIONAL**: 1M context variant rarely used by Claude Code, but provides future capacity

**Decision**: All 4 cases left open for approval. No downside to having extra capacity since AWS billing is usage-based, not capacity-based.

**Expected Timeline**: 5-15 minutes (automatic approval) or 1-3 business days (manual review)

**Target After Approval**:
- Standard model: 200 RPM / 1M TPM (100x current capacity)
- 1M Context model: 200 RPM / 2M TPM (100x current capacity)
- This exceeds Claude Code Pro subscription baseline (5 RPM) by 40x

## Temporary Workaround: Using opencode-developer Agent

**Status**: ✅ Available Now - No AWS Quota Limitations

While waiting for AWS Bedrock quota approval, you can use the **opencode-developer agent** for development tasks. This agent uses the **Anthropic Claude API** directly (not AWS Bedrock), completely bypassing the 2 RPM AWS rate limit.

### Key Advantages

| Feature | Standard Claude (AWS Bedrock) | opencode-developer Agent |
|---------|------------------------------|--------------------------|
| **API Provider** | AWS Bedrock | Anthropic Claude API (Direct) |
| **Rate Limit** | 2 RPM (restricted) | ~50 RPM (Anthropic standard) |
| **Affected by AWS Quota** | ✅ Yes | ❌ No |
| **Best For** | Quick questions, single-step tasks | Multi-step implementations, coding, testing |
| **Context Awareness** | Standard conversation context | Enhanced with codebase awareness |
| **Autonomous Execution** | No | Yes (can execute multiple steps) |

### When to Use opencode-developer

**Ideal Use Cases**:
- 🔧 **Multi-step implementations** - Complex features requiring multiple file edits
- 🧪 **Development & testing** - Running tests, debugging, and verification workflows
- 📝 **Code generation** - Writing new features, refactoring existing code
- 🔄 **Iterative tasks** - Tasks requiring multiple rounds of execution and validation
- 🚀 **Rapid prototyping** - Building and testing new functionality quickly

**When to Use Standard Claude**:
- 💬 Quick questions about code or architecture
- 📖 Documentation reading and explanation requests
- 🤔 Conceptual discussions and planning
- 🔍 Simple code searches and reviews

### How to Use opencode-developer

**Syntax**: Use `@agent-opencode-developer` at the start of your message to invoke the agent.

**Example Usage Patterns**:

```plaintext
@agent-opencode-developer implement the readiness score calculation service
according to docs/redesign/MASTER_PLAN.md Phase 2. Include unit tests.

@agent-opencode-developer debug the 429 error in the practice module API
and implement exponential backoff retry logic.

@agent-opencode-developer create database migration for the new gamification
tables in DATABASE_SCHEMA.md, then run tests to verify schema.

@agent-opencode-developer refactor the AI service layer to support multiple
providers (OpenAI, Anthropic, Qwen) with fallback logic.
```

**Agent Capabilities**:
- ✅ Read and analyze multiple files across the codebase
- ✅ Execute shell commands (npm, git, database migrations)
- ✅ Edit multiple files in sequence
- ✅ Run tests and validate changes
- ✅ Iterate based on test results and errors
- ✅ Commit changes with proper git messages
- ✅ Create pull requests with testing documentation

### Important Notes

**Limitations**:
- ⚠️ **Not a permanent solution** - Use while waiting for AWS quota approval
- ⚠️ **Different API** - Uses Anthropic API pricing (separate from AWS costs)
- ⚠️ **Manual supervision** - Review agent actions before approving destructive operations

**Best Practices**:
1. **Be specific** - Provide clear instructions and reference documentation
2. **Use for batches** - Combine related tasks to minimize API calls
3. **Review changes** - Always review code changes before committing
4. **Monitor costs** - Track Anthropic API usage separately from AWS

**Cost Comparison**:
- AWS Bedrock: ~$0.003-0.015 per 1K tokens (usage-based)
- Anthropic API: ~$0.003-0.015 per 1K tokens (similar pricing)
- **Net impact**: Negligible cost difference, significantly better performance

### Example Workflow

**Before (Standard Claude with AWS Limits)**:
```plaintext
You: "Help me implement the badge system"
Claude: [Provides code example]
You: "Now write the tests"
Claude: [429 Error - Rate limit exceeded]
⏳ Wait 30+ seconds...
You: "Write tests for badge system"
Claude: [Provides test example]
⏳ Total time: 5+ minutes with waiting
```

**After (Using opencode-developer)**:
```plaintext
You: "@agent-opencode-developer implement the badge system from
DATABASE_SCHEMA.md including service layer, API routes, and tests"
Agent: [Reads schema] → [Creates service] → [Creates routes] → [Writes tests]
       → [Runs tests] → [Reports results]
✅ Total time: 2-3 minutes, no waiting
```

### Transition Plan

**Current Phase**: Using opencode-developer for development work
- ✅ No rate limit constraints
- ✅ Full development velocity maintained
- ⏳ AWS quota approval pending (5-15 min or 1-3 business days)

**After AWS Approval**: Return to standard Claude + selective agent use
- ✅ AWS Bedrock quotas restored (200 RPM)
- ✅ Standard Claude for conversations
- ✅ opencode-developer for complex multi-step tasks

**Long-term**: Hybrid approach based on task complexity
- Use standard Claude for most interactions
- Reserve opencode-developer for intensive development sessions
- Monitor AWS quota usage to stay within limits

## Current Quotas (as of 2025-10-31 05:00 UTC - Before Increase)

### Claude Sonnet 4.5 V1 Limits

| Quota | Current Value | Quota Code | Adjustable |
|-------|---------------|------------|------------|
| **Cross-region requests per minute** | **2.0** | L-4A6BFAB1 | ✅ Yes |
| Cross-region tokens per minute | 200,000 | L-F4DDD3EB | ✅ Yes |
| Global requests per minute | 2.0 | L-DB84CE56 | ❌ No |
| Tokens per day | 5.4M | L-381AD9EE | ❌ No |

### Claude Sonnet 4.5 V1 1M Context Length Limits

| Quota | Current Value | Quota Code | Adjustable |
|-------|---------------|------------|------------|
| **Cross-region requests per minute** | **2.0** | L-A052927A | ✅ Yes |
| Cross-region tokens per minute | 1,000,000 | L-8EA73537 | ✅ Yes |
| Global requests per minute | 1.0 | L-C0D53EFB | ❌ No |
| Tokens per day | 27M | L-E107194C | ❌ No |

## Immediate Solution: Request Quota Increases

### Step 1: Via AWS CLI (Recommended)

```bash
# Increase Cross-region requests per minute from 2 to 20
aws service-quotas request-service-quota-increase \
  --service-code bedrock \
  --quota-code L-4A6BFAB1 \
  --desired-value 20 \
  --region us-east-1

# Increase Cross-region tokens per minute from 200K to 1M
aws service-quotas request-service-quota-increase \
  --service-code bedrock \
  --quota-code L-F4DDD3EB \
  --desired-value 1000000 \
  --region us-east-1

# For 1M Context model - increase requests per minute
aws service-quotas request-service-quota-increase \
  --service-code bedrock \
  --quota-code L-A052927A \
  --desired-value 20 \
  --region us-east-1

# For 1M Context model - increase tokens per minute
aws service-quotas request-service-quota-increase \
  --service-code bedrock \
  --quota-code L-8EA73537 \
  --desired-value 2000000 \
  --region us-east-1
```

### Step 2: Via AWS Console

1. Go to: https://us-east-1.console.aws.amazon.com/servicequotas/home/services/bedrock/quotas
2. Search for: "Anthropic Claude Sonnet 4.5"
3. Click on each quota (L-4A6BFAB1, L-F4DDD3EB, etc.)
4. Click "Request quota increase"
5. Enter new value (20 for RPM, 1000000 for TPM)
6. Provide justification: "Development environment for AI-assisted coding with Claude Code. Current limit of 2 RPM is insufficient for interactive development sessions."

### Expected Timeline

- **Automatic approval**: 5-15 minutes (for small increases)
- **Manual review**: 1-3 business days (for larger increases)
- **Check status**: `aws service-quotas get-requested-service-quota-change --request-id <id> --region us-east-1`

## Immediate Workaround: Reduce Request Frequency

While waiting for quota increases, implement these strategies:

### 1. Disable or Reduce Statusline Updates

The statusline script makes frequent calls. Temporarily disable it:

```bash
# Backup current settings
cp ~/.claude/settings.json ~/.claude/settings.json.backup

# Remove statusline temporarily
cat > ~/.claude/settings.json << 'EOF'
{
  "alwaysThinkingEnabled": true
}
EOF
```

**Restore later:**
```bash
mv ~/.claude/settings.json.backup ~/.claude/settings.json
```

### 2. Add Request Throttling

Modify your usage pattern:
- Wait 30+ seconds between messages to Claude Code
- Avoid rapid-fire requests
- Batch multiple questions into single messages

### 3. Use a Different Region (if available)

Check quotas in other regions:
```bash
# Check ap-southeast-1 (Singapore)
aws service-quotas list-service-quotas \
  --service-code bedrock \
  --region ap-southeast-1 | grep "Sonnet 4.5"

# Check eu-west-1 (Ireland)
aws service-quotas list-service-quotas \
  --service-code bedrock \
  --region eu-west-1 | grep "Sonnet 4.5"
```

### 4. Implement Exponential Backoff

Add retry logic in your client:
```python
import time
import random

def call_bedrock_with_backoff(max_retries=5):
    for attempt in range(max_retries):
        try:
            return call_bedrock()
        except RateLimitError as e:
            if attempt == max_retries - 1:
                raise
            wait_time = (2 ** attempt) + random.uniform(0, 1)
            time.sleep(wait_time)
```

## Long-term Solution: Enhanced Rate Limiting

Once quotas are increased, implement these best practices:

### 1. Caching Layer

Cache responses to avoid repeated API calls:
```bash
# In statusline script, cache transcript parsing
CACHE_FILE="/tmp/statusline-cache-$SESSION_ID.json"
CACHE_TTL=60  # seconds

if [ -f "$CACHE_FILE" ]; then
    AGE=$(($(date +%s) - $(stat -c %Y "$CACHE_FILE")))
    if [ $AGE -lt $CACHE_TTL ]; then
        cat "$CACHE_FILE"
        exit 0
    fi
fi

# ... do expensive processing ...
echo "$RESULT" | tee "$CACHE_FILE"
```

### 2. Request Queueing

Implement a queue for non-urgent requests:
- Priority 1: User messages (immediate)
- Priority 2: Statusline updates (every 30s)
- Priority 3: Background tasks (batched)

### 3. Monitoring

Track your usage to avoid hitting limits:
```bash
# Create monitoring script
cat > ~/monitor-bedrock-usage.sh << 'EOF'
#!/bin/bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/Bedrock \
  --metric-name Invocations \
  --dimensions Name=ModelId,Value=anthropic.claude-sonnet-4-5-v1:0 \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region us-east-1
EOF

chmod +x ~/monitor-bedrock-usage.sh
```

## Verification Commands

### Check Quota Increase Status

```bash
# List all pending requests
aws service-quotas list-requested-service-quota-change-history \
  --service-code bedrock \
  --status PENDING \
  --region us-east-1

# Check specific request
aws service-quotas get-requested-service-quota-change \
  --request-id <REQUEST_ID> \
  --region us-east-1
```

### Test Current Limits

```bash
# Make rapid test requests to see when you hit the limit
for i in {1..5}; do
  echo "Request $i at $(date +%H:%M:%S)"
  aws bedrock-runtime invoke-model \
    --model-id anthropic.claude-sonnet-4-5-v1:0 \
    --body '{"anthropic_version":"bedrock-2023-05-31","max_tokens":10,"messages":[{"role":"user","content":"Hi"}]}' \
    --region us-east-1 \
    /tmp/response-$i.json 2>&1 | grep -i "throttling\|429\|rate"
  sleep 1
done
```

## Cost Considerations

With increased quotas:
- **Current**: 2 RPM = max 2,880 requests/day
- **Proposed**: 20 RPM = max 28,800 requests/day

**Cost impact** (at ~$0.003-0.015 per 1K tokens):
- Light usage (100 requests/day): ~$10-20/day
- Heavy usage (1000 requests/day): ~$50-100/day

Monitor costs with:
```bash
aws ce get-cost-and-usage \
  --time-period Start=2025-10-01,End=2025-10-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --filter file://bedrock-filter.json
```

## Troubleshooting

### Still Getting 429 Errors After Quota Increase?

1. **Wait for propagation**: Quota changes take 5-15 minutes to apply
2. **Check the right region**: Ensure you increased quotas in the region you're using
3. **Verify the change**: Run `aws service-quotas get-service-quota --service-code bedrock --quota-code L-4A6BFAB1 --region us-east-1`
4. **Check global limits**: Some quotas are non-adjustable global limits

### Request Denied?

If AWS denies your quota increase request:
1. Start smaller (increase from 2 to 5 RPM instead of 20)
2. Provide more detailed justification
3. Contact AWS Support directly
4. Consider AWS Business Support plan for faster approvals

## Support Contacts

- **AWS Support**: https://console.aws.amazon.com/support/home
- **Service Quotas Console**: https://console.aws.amazon.com/servicequotas/
- **AWS Bedrock Documentation**: https://docs.aws.amazon.com/bedrock/

---

## Quick Status Check Commands

```bash
# Check if quotas have been updated
aws service-quotas get-service-quota \
  --service-code bedrock \
  --quota-code L-4A6BFAB1 \
  --region us-east-1 | grep "Value"

# Check all pending requests
aws service-quotas list-requested-service-quota-change-history \
  --service-code bedrock \
  --status CASE_OPENED \
  --region us-east-1

# Monitor specific request status
aws service-quotas get-requested-service-quota-change \
  --request-id d19ebf7fb2fc439ba2ec5e4190b0cd22lxRpBjXj \
  --region us-east-1 | grep -E "Status|DesiredValue"
```

---

## Key Discovery: Account Restriction

**Critical Finding**: Your AWS account RPM quotas were set to **2.0 RPM** (99% below AWS defaults):
- AWS Default for Standard Model: **200 RPM**
- Your Account: **2 RPM** (restricted)
- AWS Default for 1M Context: **5 RPM**
- Your Account: **2 RPM** (restricted)

This restriction is NOT normal for AWS Bedrock accounts and may indicate:
- New account limitation
- Regional restrictions
- Cost control measures
- Account-level policy

**Resolution**: Requested restoration to AWS default quotas (200 RPM) which far exceeds Claude Code Pro subscription requirements (5+ RPM).

---

**Status**: ✅ All quota increase requests submitted (4/4) - Awaiting AWS approval
**Created**: 2025-10-31
**Last Updated**: 2025-10-31 05:50 UTC
**Next Action**: Monitor request status - quotas should be approved within 5-15 minutes or 1-3 business days
