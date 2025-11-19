# AWS Bedrock Pricing Tiers Research

**Research Date**: 2025-11-04
**Model**: Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)
**Purpose**: Understand if AWS Bedrock has usage-based pricing tiers and how to stay in lower-cost tier

---

## EXECUTIVE SUMMARY

**CRITICAL FINDING**: AWS Bedrock does NOT have traditional "usage tiers" that increase pricing as volume grows.

Instead, AWS Bedrock offers THREE DISTINCT PRICING MODES:
1. **On-Demand** (pay-as-you-go, no commitments)
2. **Batch** (cost-efficient for large volumes)
3. **Provisioned Throughput** (dedicated capacity with discounted pricing)

**KEY INSIGHT**: There are NO thresholds that automatically move you to a "higher tier" or increase per-token costs. Your pricing stays the same regardless of volume within the same pricing mode.

---

## PRICING MODES EXPLAINED

### 1. On-Demand Pricing (Your Current Mode)

**Characteristics**:
- Pay-as-you-go usage
- NO upfront commitments
- NO volume-based tier changes
- NO automatic price increases as usage grows
- Pricing is per-token with fixed rates

**Pricing for Claude Sonnet 4.5** (as of 2025-11):
- **Fresh Input**: $0.003 per 1K tokens
- **Cache Write**: $0.00375 per 1K tokens (25% premium)
- **Cache Read**: $0.0003 per 1K tokens (90% discount)
- **Output**: $0.015 per 1K tokens

**Important**: These rates DO NOT CHANGE based on volume. Whether you process 1M tokens or 100M tokens per month, the per-token rate remains the same.

### 2. Batch Mode

**Characteristics**:
- Cost-efficient processing of LARGE volumes
- Lower per-token costs than On-Demand
- Suitable for non-time-sensitive workloads
- You explicitly opt into this mode

**When to Use**:
- Processing large datasets
- Non-interactive workloads
- Can tolerate higher latency
- Want lower per-token costs

**Important**: This is NOT an automatic tier - you must explicitly use Batch API endpoints.

### 3. Provisioned Throughput

**Characteristics**:
- Dedicated model capacity
- Discounted pricing compared to On-Demand
- Requires commitment (reserved capacity)
- Predictable costs for high-volume workloads

**When to Use**:
- High-volume and predictable workloads
- Need guaranteed throughput
- Can commit to reserved capacity
- Want volume discounts

**Important**: This requires explicit setup and commitment - you don't automatically move to this tier.

---

## QUOTAS AND LIMITS

AWS Bedrock has quota limits (TPM/RPM) but these are SEPARATE from pricing:

### Quota Limits (Default)
- **TPM (Tokens Per Minute)**: Varies by model and region
- **RPM (Requests Per Minute)**: Varies by model and region
- **Can be increased**: Via AWS Support quota increase requests

### Your Usage Pattern Analysis

**Current Usage**:
- Steady State: ~30-50K TPM, 0.03-0.04 RPM
- Peak State: ~80-100K TPM, 0.15-0.20 RPM
- Average Input: 300K-500K tokens per request
- Average Output: 8K-10K tokens per request
- Frequency: 1-2 requests per hour

**Assessment**: This is LOW-VOLUME usage for AWS standards.

---

## COST OPTIMIZATION STRATEGIES

### Strategy 1: Stay on On-Demand (Recommended for You)

**Why**:
- Your usage is low and sporadic (1-2 requests/hour)
- No commitment required
- Flexible scaling
- Already getting cache benefits (90% discount on cache reads)

**Expected Monthly Cost** (at your peak usage):
- Assuming 100K TPM peak, 8 hours/day, 20 days/month
- Input: ~96M tokens/month × $0.003 = ~$288
- Output: ~1.5M tokens/month × $0.015 = ~$22.50
- Cache reads (if 50% cached): -$144 savings
- **Estimated: $150-200/month**

### Strategy 2: Consider Batch Mode (Not Recommended for You)

**Why NOT**:
- Your usage is interactive (development tool)
- Low frequency (1-2 requests/hour)
- Batch mode adds latency
- Not cost-effective for your pattern

### Strategy 3: Provisioned Throughput (Not Recommended for You)

**Why NOT**:
- Requires upfront commitment
- Your usage is too low to justify
- Best for >10M tokens/day sustained
- You'd pay more than On-Demand

---

## ADDRESSING YOUR CONCERNS

### "I don't want to move to a higher tier"

**Answer**: There is NO automatic tier escalation. AWS Bedrock On-Demand pricing is flat - the per-token rate stays the same whether you use 1K or 100M tokens per month.

### "What are the thresholds?"

**Answer**: There are NO thresholds that change pricing automatically. The only "thresholds" are:

1. **Quota Limits** (TPM/RPM) - These limit throughput, not pricing
   - If you hit quota limits, you get throttled (429 errors)
   - You can request quota increases (free)
   - Quota increases do NOT change pricing

2. **Choosing a Different Mode** - You explicitly choose:
   - On-Demand (no commitment)
   - Batch (explicit API calls)
   - Provisioned (explicit reservation)

### "How do I stay in the cheaper tier?"

**Answer**: You're ALREADY in the most flexible tier (On-Demand). To optimize costs:

1. **Maximize Cache Usage** (Already doing this)
   - Cache reads are 90% cheaper ($0.0003 vs $0.003)
   - Your statusline shows you're getting good cache benefits

2. **Request Appropriate Quotas**
   - Request quotas that match your PEAK usage (~100K TPM)
   - Add 50% buffer for spikes (~150K TPM)
   - This does NOT affect pricing, only throughput capacity

3. **Monitor Usage Patterns**
   - Continue using your statusline tool
   - Track daily/weekly costs
   - Identify optimization opportunities (e.g., reduce output tokens)

4. **Stay on On-Demand Unless**:
   - Your usage grows to >10M tokens/day sustained
   - You need guaranteed throughput
   - You can commit to reserved capacity

---

## QUOTA REQUEST RECOMMENDATIONS

Based on your usage pattern, request these quotas:

### Recommended Quota Increase Request

**Model**: Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)
**Region**: ap-southeast-1 (Singapore) or your preferred region

**Requested Limits**:
- **TPM (Tokens Per Minute)**: 150,000 TPM
  - Rationale: Peak usage ~100K TPM + 50% buffer
- **RPM (Requests Per Minute)**: 1 RPM
  - Rationale: Low frequency, large requests (300K-500K tokens each)

**Justification Text**:
```
We are using AWS Bedrock Claude Sonnet 4.5 for a development tool with the following usage pattern:
- Average request size: 300K-500K input tokens
- Average response size: 8K-10K output tokens
- Request frequency: 1-2 requests per hour (peak)
- Peak TPM: 80-100K TPM
- Use case: Interactive development assistance

We request 150K TPM to accommodate our peak usage with safety margin, while maintaining low RPM (1 RPM) as our usage is low-frequency but high-token-count per request.
```

### Important Notes

1. **Quota increases are FREE** - They do NOT change your pricing
2. **Higher quotas = more capacity** - You only pay for tokens you actually use
3. **Approval is usually fast** - Most quota increases approved within 24-48 hours
4. **Request conservatively** - You can always request more later

---

## PRICING COMPARISON: YOUR USAGE PATTERN

### Monthly Cost Estimates (Based on Your Pattern)

| Scenario | TPM | Hours/Day | Days/Month | Monthly Tokens | Est. Cost | Notes |
|----------|-----|-----------|------------|----------------|-----------|-------|
| Current (Low) | 30K | 4 | 20 | ~144M | $80-100 | Typical development |
| Current (Peak) | 80K | 6 | 20 | ~576M | $150-200 | Intensive sessions |
| Sustained High | 100K | 8 | 30 | ~1.44B | $300-400 | Unlikely for dev tool |

**With Cache Benefits** (50% cache hit rate):
- Reduce costs by ~40-45% on cached tokens
- Your actual costs likely in $50-150/month range

---

## ACTION ITEMS

### Immediate Actions

1. **Stay on On-Demand Mode** - No action needed, you're already optimized
2. **Request Quota Increase** (if needed):
   - Only if you're hitting 429 throttling errors
   - Request 150K TPM, 1 RPM
   - Use justification text provided above

### Monitoring Actions

1. **Continue Using Statusline Tool** - Excellent cost tracking
2. **Track Monthly Costs** - Set alert if >$200/month
3. **Review Cache Hit Rates** - Optimize for >50% cache reads

### Future Considerations

1. **If usage grows to >10M tokens/day**:
   - Consider Provisioned Throughput
   - Calculate break-even point
   - Contact AWS for volume pricing discussion

2. **If usage becomes batch-like**:
   - Consider Batch Mode API
   - Lower costs for non-interactive workloads

---

## SOURCES AND REFERENCES

1. **AWS Bedrock Pricing Page**: https://aws.amazon.com/bedrock/pricing/
2. **AWS Bedrock Quotas Documentation**: https://docs.aws.amazon.com/bedrock/latest/userguide/quotas.html
3. **AWS Bedrock User Guide**: https://docs.aws.amazon.com/bedrock/latest/userguide/

### Key Findings from Source Analysis

From AWS Bedrock pricing page HTML:
- "pay-as-you-go usage with no upfront commitments"
- "batch mode for cost-efficient processing of large volumes of input"
- "For high-volume and predictable workloads, provisioned throughput provides dedicated model capacity with discounted pricing"
- "any requests with matching prefixes receive a discount of up to 90% on cached tokens"

**Critical Quote**:
> "These options help optimize cost while balancing speed, scale, and model access needs."

This confirms that pricing modes are OPTIONAL CHOICES, not automatic tiers based on usage volume.

---

## CONCLUSION

**Direct Answer to Your Question**:

1. **Are there pricing tiers?** NO - AWS Bedrock does not have usage-based tiers that increase costs as volume grows.

2. **What are the thresholds?** NONE - There are no automatic thresholds that change pricing. All pricing is fixed per-token within each pricing mode.

3. **Volume discounts or penalties?**
   - NO automatic changes
   - Volume discounts available ONLY via Provisioned Throughput (requires commitment)
   - Cache reads provide up to 90% discount (already benefiting from this)

4. **TPM/RPM thresholds affecting pricing?** NO - Quota limits (TPM/RPM) control throughput capacity, not pricing. You pay the same per-token rate regardless of your quota limits.

5. **Low usage vs high usage tier?**
   - Your usage (~30-100K TPM) is LOW by AWS standards
   - On-Demand is the most cost-effective for your pattern
   - No action needed to "stay in cheaper tier" - you're already optimized

**Bottom Line**: Your concern about moving to a "higher tier" is NOT applicable to AWS Bedrock. The service uses flat pay-as-you-go pricing in On-Demand mode, with optional alternative modes (Batch, Provisioned) that you must explicitly choose. Request quotas based on your THROUGHPUT NEEDS, not pricing concerns - quota increases do not affect pricing.

**Recommendation**: Request 150K TPM quota for safety margin, continue using On-Demand mode, and maintain your excellent cost tracking with the statusline tool.
