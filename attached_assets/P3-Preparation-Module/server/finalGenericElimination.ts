import { db } from './db.js';
import { questions, type InsertQuestion } from '@shared/schema.js';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Professional replacement questions for industries that still have generic content
const professionalReplacements: Record<string, string[]> = {
  'aviation-airline-operations': [
    'Explain your approach to aircraft maintenance planning and airworthiness directive compliance.',
    'Walk me through your methodology for flight operations planning and crew resource management.',
    'Describe your process for implementing safety management systems (SMS) in airline operations.',
    'How do you conduct route analysis and aircraft performance optimization for fuel efficiency?',
    'Explain your methodology for ground handling operations and turnaround time optimization.'
  ],
  
  'energy-oil-gas-renewables': [
    'Explain your methodology for conducting reservoir simulation and enhanced oil recovery optimization.',
    'Walk me through your process for wind turbine site assessment and wind farm layout optimization.',
    'Describe your approach to implementing pipeline integrity management and leak detection systems.',
    'How do you conduct power system analysis and grid integration for renewable energy projects?',
    'Explain your process for conducting environmental impact assessment for energy projects.'
  ],
  
  'film-television-production': [
    'Explain your process for implementing multi-camera production workflows and live switching systems.',
    'Walk me through your methodology for audio post-production and sound design for film.',
    'Describe your approach to colour correction and digital intermediate (DI) processes.',
    'How do you implement workflow management for high-resolution content delivery and streaming?',
    'Explain your methodology for conducting location scouting and production logistics coordination.'
  ],
  
  'logistics-supply-chain': [
    'Explain your approach to implementing warehouse management systems and inventory optimization.',
    'Walk me through your methodology for transportation route optimization and carrier selection.',
    'Describe your process for implementing just-in-time (JIT) delivery and lean supply chain practices.',
    'How do you conduct demand forecasting and capacity planning for distribution networks?',
    'Explain your methodology for implementing RFID tracking and supply chain visibility systems.'
  ],
  
  'real-estate': [
    'Walk me through your approach to conducting commercial real estate investment analysis and due diligence.',
    'Describe your methodology for implementing property valuation models and market analysis.',
    'Explain your process for conducting zoning analysis and development feasibility studies.',
    'How do you approach lease negotiation and commercial property management optimization?',
    'Walk me through your methodology for implementing PropTech solutions and digital marketing platforms.'
  ],
  
  'government-public-administration': [
    'Explain your approach to implementing digital government services and citizen engagement platforms.',
    'Walk me through your methodology for conducting regulatory impact assessment and policy analysis.',
    'Describe your process for implementing public procurement systems and contract management.',
    'How do you conduct performance measurement and program evaluation for public services?',
    'Explain your methodology for implementing transparency initiatives and open data platforms.'
  ],
  
  'public-utilities': [
    'Explain your approach to implementing smart grid technology and advanced metering infrastructure.',
    'Walk me through your methodology for water distribution system design and leak detection.',
    'Describe your process for conducting load forecasting and electricity demand management.',
    'How do you implement renewable energy integration and grid stability management?',
    'Explain your methodology for conducting utility asset management and infrastructure planning.'
  ],
  
  'sports-fitness': [
    'Explain your approach to implementing performance analysis using biomechanical assessment tools.',
    'Walk me through your methodology for designing sport-specific training programs and periodization.',
    'Describe your process for conducting VO2 max testing and cardiovascular fitness assessment.',
    'How do you implement injury prevention protocols and movement screening assessments?',
    'Explain your methodology for conducting nutritional analysis and sports supplementation planning.'
  ],
  
  'human-resources-hr-tech': [
    'Explain your approach to implementing applicant tracking systems and talent acquisition automation.',
    'Walk me through your methodology for conducting workforce analytics and people data analysis.',
    'Describe your process for implementing performance management systems and 360-degree feedback.',
    'How do you conduct compensation analysis and job evaluation using market benchmarking?',
    'Explain your methodology for implementing learning management systems and skills assessment.'
  ],
  
  'veterinary-medicine': [
    'Walk me through your approach to conducting diagnostic ultrasound and radiographic interpretation.',
    'Describe your methodology for implementing anesthetic protocols and surgical monitoring.',
    'Explain your process for conducting laboratory diagnostics and histopathological analysis.',
    'How do you approach emergency medicine and critical care management in veterinary practice?',
    'Walk me through your methodology for implementing electronic health records and practice management.'
  ]
};

async function eliminateAllGenericQuestions() {
  console.log('🔍 Eliminating all remaining generic questions...');
  
  let totalReplaced = 0;
  
  for (const [industry, replacementTexts] of Object.entries(professionalReplacements)) {
    try {
      console.log(`📝 Processing ${industry}...`);
      
      // Check current count
      const currentQuestions = await db.select().from(questions)
        .where(eq(questions.industry, industry));
      
      const currentCount = currentQuestions.length;
      const needed = Math.max(0, 15 - currentCount);
      
      if (needed > 0) {
        const questionsToAdd: InsertQuestion[] = [];
        
        for (let i = 0; i < Math.min(needed, replacementTexts.length); i++) {
          questionsToAdd.push({
            id: uuidv4(),
            type: 'subject-matter-expertise',
            industry: industry,
            question: replacementTexts[i],
            tags: getIndustrySpecificTags(industry),
            difficulty: (i % 3 === 0) ? 'easy' : (i % 3 === 1) ? 'medium' : 'hard',
            starGuidance: {
              situation: `Professional technical challenge requiring specialized ${industry.replace(/-/g, ' ')} expertise`,
              task: 'Your responsibility for delivering high-quality technical solutions in this specialized domain',
              action: 'Specific industry methodologies, tools, and professional practices you employed',
              result: 'Measurable outcomes demonstrating your technical competence and professional impact in this field'
            }
          });
        }
        
        if (questionsToAdd.length > 0) {
          await db.insert(questions).values(questionsToAdd);
          console.log(`✅ Added ${questionsToAdd.length} professional questions to ${industry}`);
          totalReplaced += questionsToAdd.length;
        }
      } else {
        console.log(`✓ ${industry} already has ${currentCount} questions`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${industry}:`, error);
    }
  }
  
  console.log(`🎯 Generic elimination complete! Added ${totalReplaced} professional questions`);
  
  // Final verification
  const remainingGeneric = await db.select().from(questions)
    .where(eq(questions.type, 'subject-matter-expertise'))
    .then(results => results.filter(q => 
      q.question.includes('cross-functional collaboration') ||
      q.question.includes('risk assessment and mitigation in technical projects') ||
      q.question.includes('technical documentation and knowledge transfer') ||
      q.question.includes('stakeholder coordination') ||
      q.question.includes('emerging technologies and best practices')
    ));
  
  console.log(`📊 Remaining generic questions: ${remainingGeneric.length}`);
  
  if (remainingGeneric.length > 0) {
    console.log('⚠️ Still found generic questions:');
    remainingGeneric.forEach(q => console.log(`  - ${q.industry}: ${q.question.substring(0, 80)}...`));
  } else {
    console.log('🎉 All generic questions successfully eliminated!');
  }
}

function getIndustrySpecificTags(industry: string): string[] {
  const tagMapping: Record<string, string[]> = {
    'aviation-airline-operations': ['Flight Operations', 'Aircraft Maintenance', 'Safety Management', 'Airline Operations'],
    'energy-oil-gas-renewables': ['Energy Systems', 'Reservoir Engineering', 'Renewable Energy', 'Pipeline Systems'],
    'film-television-production': ['Film Production', 'Post-Production', 'Broadcasting', 'Content Creation'],
    'logistics-supply-chain': ['Supply Chain Management', 'Warehouse Operations', 'Transportation', 'Inventory Management'],
    'real-estate': ['Property Development', 'Real Estate Investment', 'Property Management', 'Market Analysis'],
    'government-public-administration': ['Public Policy', 'Digital Government', 'Public Service', 'Regulatory Affairs'],
    'public-utilities': ['Utility Operations', 'Grid Management', 'Infrastructure', 'Energy Distribution'],
    'sports-fitness': ['Sports Science', 'Performance Analysis', 'Exercise Physiology', 'Athletic Training'],
    'human-resources-hr-tech': ['HR Technology', 'Talent Management', 'Workforce Analytics', 'People Operations'],
    'veterinary-medicine': ['Veterinary Diagnostics', 'Animal Health', 'Veterinary Surgery', 'Practice Management']
  };
  
  return tagMapping[industry] || ['Professional Practice', 'Technical Expertise', 'Industry Knowledge', 'Specialized Skills'];
}

export { eliminateAllGenericQuestions };

if (import.meta.url === `file://${process.argv[1]}`) {
  eliminateAllGenericQuestions()
    .then(() => {
      console.log('✨ Generic question elimination completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Elimination process failed:', error);
      process.exit(1);
    });
}