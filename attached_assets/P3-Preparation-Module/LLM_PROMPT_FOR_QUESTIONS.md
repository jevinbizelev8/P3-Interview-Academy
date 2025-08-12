# LLM Prompt for Generating 750 Professional Interview Questions

## Your Task
Generate exactly 750 professional, industry-specific interview questions (15 per industry) for a technical interview platform. Each question must demonstrate deep subject-matter expertise and use real industry terminology.

## Output Format
Use the SQL template provided in `EXTERNAL_LLM_SQL_TEMPLATE.sql` and replace the placeholder text with professionally crafted questions.

## Industries (50 total, 15 questions each)
aerospace-defense, automotive, biotechnology, chemical-petrochemical, construction-engineering, cybersecurity, data-science-analytics, education-training, energy-utilities, environmental-sustainability, fashion-textile, finance-banking, food-beverage, gaming-entertainment, government-public-sector, healthcare-medical, hospitality-tourism, insurance, legal-services, logistics-supply-chain, manufacturing, marketing-digital, mechanical-engineering, media-journalism, mining-metals, non-profit, oil-gas, pharmaceuticals, real-estate, renewable-energy, research-development, retail-ecommerce, robotics-automation, software-technology, sports-fitness, telecommunications, transportation, veterinary-medicine, agriculture, architecture, consulting, creative-arts, human-resources, industrial-design, information-security, international-trade, linguistics, marine-maritime, quality-assurance, waste-management

## Question Requirements

### ✅ MUST INCLUDE:
- **Specific Technical Terminology**: Use real industry tools, frameworks, standards
- **Professional Methodologies**: Reference actual practices used by experts
- **Industry Standards**: Include certifications, regulations, compliance frameworks
- **Measurable Expertise**: Focus on quantifiable, technical competencies
- **Active Professional Language**: "Explain your methodology for...", "Walk me through your approach to...", "Describe your process for..."

### ❌ MUST AVOID:
- Generic questions that could apply to any industry
- Soft skills or behavioral questions  
- "How do you approach..." without specific technical context
- Template-based or placeholder-style questions
- Risk assessment, problem-solving, or collaboration generics

## Example Quality Standards

### EXCELLENT Examples:
```
✅ Cybersecurity: "Explain your methodology for implementing zero-trust security architecture in enterprise environments."
✅ Healthcare: "Walk me through your process for conducting clinical trial biostatistical analysis using SAS or R."
✅ Aerospace: "Describe your approach to structural finite element analysis for aircraft wing design."
✅ Finance: "Explain your methodology for conducting Monte Carlo simulations in derivative pricing models."
```

### POOR Examples (Don't Generate These):
```
❌ "How do you approach technical problem-solving in your field?"
❌ "Describe your experience with risk assessment and mitigation."
❌ "What is your process for handling challenging projects?"
❌ "How do you stay current with industry trends?"
```

## Difficulty Distribution Per Industry
- **5 Easy Questions**: Foundational knowledge, entry-level expertise
- **7 Medium Questions**: Applied expertise, mid-level professional practice  
- **3 Hard Questions**: Advanced/specialized expertise, senior-level mastery

## Tags Format
Each question needs exactly 4 industry-specific tags in JSON array format:
```
'["Specific Tool/Technology", "Industry Framework", "Professional Practice", "Specialized Method"]'
```

## Industry-Specific Examples

### Biotechnology (Sample):
```sql
(gen_random_uuid(), 'subject-matter-expertise', 'biotechnology', 'Explain your methodology for conducting quantitative PCR (qPCR) assay development and validation.', '["qPCR", "Assay Development", "Molecular Diagnostics", "Validation Protocols"]'::jsonb, 'medium', '...'),
(gen_random_uuid(), 'subject-matter-expertise', 'biotechnology', 'Walk me through your approach to protein purification using FPLC chromatography systems.', '["Protein Purification", "FPLC", "Chromatography", "Biochemical Analysis"]'::jsonb, 'hard', '...'),
```

### Cybersecurity (Sample):
```sql
(gen_random_uuid(), 'subject-matter-expertise', 'cybersecurity', 'Describe your process for implementing Security Orchestration, Automation and Response (SOAR) platforms.', '["SOAR", "Security Automation", "Incident Response", "Threat Intelligence"]'::jsonb, 'hard', '...'),
```

## Verification
After generation, the final SQL should contain exactly:
- 750 total questions
- 50 industries with 15 questions each
- Professional, industry-specific content only
- Consistent SQL formatting using the provided template

Generate the complete SQL file with all 750 questions following these standards.