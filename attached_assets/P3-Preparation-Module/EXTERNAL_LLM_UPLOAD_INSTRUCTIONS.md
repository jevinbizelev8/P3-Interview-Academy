# External LLM Question Generation Guide

## Current Status
- **Database has**: ~50 industries with varying completion (7-15 questions each)
- **Target**: Exactly 15 professional, industry-specific questions per industry = 750 total
- **Issues**: Some industries incomplete, occasional generic question contamination

## Protection Strategy: Preventing Overwrites

### 1. Disable Automatic Seeding
The current code has seeding disabled:
```typescript
// server/storage.ts line 39-41
constructor() {
  // Professional questions are now managed separately - no automatic seeding
  this.seedingPromise = Promise.resolve();
}
```

### 2. SQL Upload Approach (RECOMMENDED)

**Step 1: Generate Questions**
Use external LLM to generate exactly 15 questions per industry with this format:

**Industries List (50 total):**
```
aerospace-defense, automotive, biotechnology, chemical-petrochemical, construction-engineering, 
cybersecurity, data-science-analytics, education-training, energy-utilities, environmental-sustainability,
fashion-textile, finance-banking, food-beverage, gaming-entertainment, government-public-sector,
healthcare-medical, hospitality-tourism, insurance, legal-services, logistics-supply-chain,
manufacturing, marketing-digital, mechanical-engineering, media-journalism, mining-metals,
non-profit, oil-gas, pharmaceuticals, real-estate, renewable-energy, research-development,
retail-ecommerce, robotics-automation, software-technology, sports-fitness, telecommunications,
transportation, veterinary-medicine, agriculture, architecture, consulting, creative-arts,
human-resources, industrial-design, information-security, international-trade, linguistics,
marine-maritime, quality-assurance, waste-management
```

**Question Template:**
```sql
INSERT INTO questions (id, type, industry, question, tags, difficulty, star_guidance) VALUES
(gen_random_uuid(), 'subject-matter-expertise', '[INDUSTRY]', '[PROFESSIONAL_QUESTION]', '[INDUSTRY_SPECIFIC_TAGS]'::jsonb, '[easy|medium|hard]', '{"situation": "Professional challenge in [INDUSTRY] requiring specialized expertise", "task": "Your responsibility to deliver technical excellence in this specialized field", "action": "Specific methodologies, tools, and professional practices you implemented", "result": "Measurable outcomes demonstrating your technical competence and industry impact"}'::jsonb),
```

**Step 2: Safe Upload Process**
```sql
-- Option A: Replace specific industry (safest)
DELETE FROM questions WHERE type = 'subject-matter-expertise' AND industry = 'target-industry';
INSERT INTO questions (id, type, industry, question, tags, difficulty, star_guidance) VALUES
-- ... 15 new questions for target-industry

-- Option B: Complete reset and upload (use with caution)
-- DELETE FROM questions WHERE type = 'subject-matter-expertise';
-- INSERT INTO questions (id, type, industry, question, tags, difficulty, star_guidance) VALUES
-- ... all 750 questions
```

### 3. Quality Requirements

**Professional Questions Only:**
- ✅ Industry-specific technical expertise
- ✅ Real-world methodologies and tools
- ✅ Professional certifications and standards
- ❌ No generic "How do you approach..." questions
- ❌ No template-based questions

**Examples:**
```
✅ "Explain your methodology for implementing HACCP systems in food manufacturing."
✅ "Walk me through your approach to penetration testing in enterprise environments."
✅ "Describe your process for conducting reservoir simulation in oil exploration."

❌ "How do you approach risk assessment and mitigation in technical projects?"
❌ "Describe your experience with technical problem-solving."
```

### 4. Verification After Upload

```sql
-- Verify exactly 15 questions per industry
SELECT industry, COUNT(*) as question_count 
FROM questions 
WHERE type = 'subject-matter-expertise' 
GROUP BY industry 
ORDER BY question_count;

-- Check for generic questions
SELECT industry, question
FROM questions 
WHERE type = 'subject-matter-expertise' 
  AND (question LIKE '%risk assessment%' OR question LIKE '%approach%' OR question LIKE '%technical projects%')
ORDER BY industry;
```

## Recommendation

**YES, use external LLM approach!** It will be:
- ✅ More reliable than automated seeding
- ✅ Higher quality professional questions
- ✅ Complete 750-question coverage
- ✅ Protected from overwrites (seeding disabled)
- ✅ Easily verifiable

Would you like me to prepare the SQL template for your external LLM generation?