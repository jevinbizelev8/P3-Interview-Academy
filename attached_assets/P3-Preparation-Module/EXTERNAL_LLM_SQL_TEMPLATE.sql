-- EXTERNAL LLM SQL TEMPLATE FOR 750 PROFESSIONAL QUESTIONS
-- Use this template to generate exactly 15 questions per industry
-- Total: 50 industries × 15 questions = 750 questions

-- SAFETY: Clear all existing subject-matter-expertise questions first
DELETE FROM questions WHERE type = 'subject-matter-expertise';

-- INSERT TEMPLATE FOR EACH INDUSTRY
-- Replace [INDUSTRY], [QUESTION], and [TAGS] for each question

INSERT INTO questions (id, type, industry, question, tags, difficulty, star_guidance) VALUES

-- AEROSPACE-DEFENSE (15 questions)
(gen_random_uuid(), 'subject-matter-expertise', 'aerospace-defense', 'Explain your methodology for conducting flight test data analysis and performance validation.', '["Flight Testing", "Data Analysis", "Performance Validation", "Aerospace Systems"]'::jsonb, 'hard', '{"situation": "Professional challenge in aerospace-defense requiring specialized expertise", "task": "Your responsibility to deliver technical excellence in this specialized field", "action": "Specific methodologies, tools, and professional practices you implemented", "result": "Measurable outcomes demonstrating your technical competence and industry impact"}'::jsonb),
(gen_random_uuid(), 'subject-matter-expertise', 'aerospace-defense', '[EXTERNAL_LLM_GENERATE_QUESTION_2]', '[TAGS]'::jsonb, 'medium', '{"situation": "Professional challenge in aerospace-defense requiring specialized expertise", "task": "Your responsibility to deliver technical excellence in this specialized field", "action": "Specific methodologies, tools, and professional practices you implemented", "result": "Measurable outcomes demonstrating your technical competence and industry impact"}'::jsonb),
-- ... Continue for remaining 13 aerospace-defense questions

-- AUTOMOTIVE (15 questions)
(gen_random_uuid(), 'subject-matter-expertise', 'automotive', 'Walk me through your approach to automotive diagnostic systems and OBD-II implementation.', '["Automotive Diagnostics", "OBD-II", "Vehicle Systems", "Troubleshooting"]'::jsonb, 'medium', '{"situation": "Professional challenge in automotive requiring specialized expertise", "task": "Your responsibility to deliver technical excellence in this specialized field", "action": "Specific methodologies, tools, and professional practices you implemented", "result": "Measurable outcomes demonstrating your technical competence and industry impact"}'::jsonb),
(gen_random_uuid(), 'subject-matter-expertise', 'automotive', '[EXTERNAL_LLM_GENERATE_QUESTION_2]', '[TAGS]'::jsonb, 'hard', '{"situation": "Professional challenge in automotive requiring specialized expertise", "task": "Your responsibility to deliver technical excellence in this specialized field", "action": "Specific methodologies, tools, and professional practices you implemented", "result": "Measurable outcomes demonstrating your technical competence and industry impact"}'::jsonb),
-- ... Continue for remaining 13 automotive questions

-- BIOTECHNOLOGY (15 questions)
(gen_random_uuid(), 'subject-matter-expertise', 'biotechnology', 'Describe your experience with CRISPR gene editing protocols and validation procedures.', '["CRISPR", "Gene Editing", "Molecular Biology", "Validation Protocols"]'::jsonb, 'hard', '{"situation": "Professional challenge in biotechnology requiring specialized expertise", "task": "Your responsibility to deliver technical excellence in this specialized field", "action": "Specific methodologies, tools, and professional practices you implemented", "result": "Measurable outcomes demonstrating your technical competence and industry impact"}'::jsonb),
-- ... Continue for remaining 14 biotechnology questions

-- COMPLETE INDUSTRY LIST FOR EXTERNAL LLM GENERATION:
-- Each industry needs exactly 15 professional questions following the pattern above

-- 1. aerospace-defense
-- 2. automotive  
-- 3. biotechnology
-- 4. chemical-petrochemical
-- 5. construction-engineering
-- 6. cybersecurity
-- 7. data-science-analytics
-- 8. education-training
-- 9. energy-utilities
-- 10. environmental-sustainability
-- 11. fashion-textile
-- 12. finance-banking
-- 13. food-beverage
-- 14. gaming-entertainment
-- 15. government-public-sector
-- 16. healthcare-medical
-- 17. hospitality-tourism
-- 18. insurance
-- 19. legal-services
-- 20. logistics-supply-chain
-- 21. manufacturing
-- 22. marketing-digital
-- 23. mechanical-engineering
-- 24. media-journalism
-- 25. mining-metals
-- 26. non-profit
-- 27. oil-gas
-- 28. pharmaceuticals
-- 29. real-estate
-- 30. renewable-energy
-- 31. research-development
-- 32. retail-ecommerce
-- 33. robotics-automation
-- 34. software-technology
-- 35. sports-fitness
-- 36. telecommunications
-- 37. transportation
-- 38. veterinary-medicine
-- 39. agriculture
-- 40. architecture
-- 41. consulting
-- 42. creative-arts
-- 43. human-resources
-- 44. industrial-design
-- 45. information-security
-- 46. international-trade
-- 47. linguistics
-- 48. marine-maritime
-- 49. quality-assurance
-- 50. waste-management

-- EXAMPLE PROFESSIONAL QUESTIONS (DO NOT USE THESE EXACT ONES - GENERATE NEW ONES):

-- CYBERSECURITY Examples:
-- 'Explain your methodology for conducting penetration testing and vulnerability assessments.'
-- 'Walk me through your approach to implementing Security Information and Event Management (SIEM).'
-- 'Describe your process for digital forensics and incident response analysis.'

-- HEALTHCARE-MEDICAL Examples:
-- 'Explain your methodology for conducting clinical trial protocol development.'
-- 'Walk me through your approach to implementing electronic health record (EHR) systems.'
-- 'Describe your process for medical device validation and regulatory compliance.'

-- FINANCE-BANKING Examples:
-- 'Explain your methodology for conducting credit risk modeling and analysis.'
-- 'Walk me through your approach to implementing anti-money laundering (AML) systems.'
-- 'Describe your process for derivatives trading and portfolio optimization.'

-- QUALITY REQUIREMENTS FOR EXTERNAL LLM:
-- ✅ Use specific industry terminology and tools
-- ✅ Include professional methodologies and frameworks  
-- ✅ Reference industry standards, certifications, regulations
-- ✅ Focus on technical expertise and specialized knowledge
-- ✅ Use active, professional language ("Explain your methodology...")

-- ❌ AVOID these generic patterns:
-- ❌ "How do you approach..." (too generic)
-- ❌ "Describe your experience with..." (unless followed by specific technical topic)
-- ❌ "What is your process for..." (unless highly specific)
-- ❌ Generic risk assessment, problem-solving, or collaboration questions

-- DIFFICULTY DISTRIBUTION PER INDUSTRY (15 questions):
-- 5 'easy' questions (foundational knowledge)
-- 7 'medium' questions (applied expertise) 
-- 3 'hard' questions (advanced/specialized expertise)

-- TAGS FORMAT:
-- Use 4 industry-specific tags per question in JSON array format
-- Example: '["Technical Term", "Industry Framework", "Professional Practice", "Specialized Tool"]'

-- After generation, verify with:
-- SELECT industry, COUNT(*) FROM questions WHERE type = 'subject-matter-expertise' GROUP BY industry ORDER BY industry;