# AWS Bedrock Pricing Tiers - Quick Summary

**Date**: 2025-11-04
**Research Subject**: Usage-based pricing tiers for AWS Bedrock Claude Sonnet 4.5

---

## THE SHORT ANSWER

**AWS Bedrock does NOT have usage-based pricing tiers that increase costs as volume grows.**

You will NOT automatically move to a "higher tier" or pay more per token as your usage increases.

---

## THREE PRICING MODES (Your Choice)

1. **On-Demand** (You are here)
   - Pay-as-you-go, no commitments
   - Fixed per-token rates: $0.003 input, $0.015 output
   - Rates DO NOT change with volume
   - Cache reads: 90% discount ($0.0003)

2. **Batch** (Optional)
   - Lower costs for large, non-time-sensitive workloads
   - You must explicitly use Batch API
   - Not suitable for interactive development tools

3. **Provisioned Throughput** (Optional)
   - Reserved capacity with discounts
   - Requires commitment and upfront costs
   - Only cost-effective for >10M tokens/day sustained

---

## YOUR SITUATION

**Current Usage**:
- 30-100K TPM (tokens per minute)
- 1-2 requests per hour
- 300K-500K tokens per request

**Assessment**: LOW-VOLUME usage by AWS standards

**Recommendation**: Stay on On-Demand mode - you're already optimized

---

## QUOTA LIMITS ≠ PRICING TIERS

**Important Distinction**:

| Quotas (TPM/RPM) | Pricing Tiers |
|------------------|---------------|
| Control throughput capacity | AWS Bedrock has NONE |
| Can be increased (free) | No automatic tier changes |
| Limit how fast you can use API | Fixed per-token rates |
| Don't affect per-token pricing | No volume penalties |

**Quota Request Guidance**:
- Request based on THROUGHPUT needs, not pricing concerns
- Recommended: 150K TPM (peak usage + 50% buffer)
- Higher quotas do NOT increase costs
- You only pay for tokens actually used

---

## COST OPTIMIZATION

**Already Doing Right**:
1. Using On-Demand (best for your pattern)
2. Benefiting from cache reads (90% discount)
3. Tracking costs with statusline tool

**No Action Needed**:
- You're already in the most cost-effective mode
- No risk of moving to "higher tier"
- Quota increases won't affect pricing

**When to Reconsider**:
- Only if usage grows to >10M tokens/day sustained
- Then explore Provisioned Throughput for volume discounts

---

## DIRECT ANSWERS TO YOUR QUESTIONS

**Q: Are there pricing tiers based on volume?**
A: NO - On-Demand pricing is flat regardless of volume

**Q: What thresholds trigger higher pricing?**
A: NONE - No automatic price increases exist

**Q: How do I stay in the cheaper tier?**
A: You're already there - On-Demand mode is the baseline, and it's optimal for your usage

**Q: Do TPM/RPM quotas affect pricing?**
A: NO - Quotas only control throughput capacity, not per-token costs

**Q: Should I request low quotas to save money?**
A: NO - Request quotas based on your peak throughput needs. You only pay for tokens you actually use, regardless of quota limits.

---

## BOTTOM LINE

Your concern about "staying in a lower tier" doesn't apply to AWS Bedrock. There are no usage-based tiers that increase costs. Request whatever quotas you need for throughput capacity - it won't affect your pricing.

**Recommended Action**: Request 150K TPM quota if you need it, continue using On-Demand mode, and keep tracking costs with your statusline tool.

For detailed analysis, see: [AWS_BEDROCK_PRICING_TIERS_RESEARCH.md](AWS_BEDROCK_PRICING_TIERS_RESEARCH.md)
