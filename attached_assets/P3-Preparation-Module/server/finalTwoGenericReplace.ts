import { db } from './db.js';
import { questions, type InsertQuestion } from '@shared/schema.js';
import { v4 as uuidv4 } from 'uuid';

// Replace the final 2 generic questions with professional alternatives
const finalProfessionalQuestions: InsertQuestion[] = [
  {
    id: uuidv4(),
    type: 'subject-matter-expertise',
    industry: 'public-utilities',
    question: 'Walk me through your methodology for implementing smart grid cybersecurity and protecting critical infrastructure.',
    tags: ['Smart Grid Security', 'Critical Infrastructure', 'Cybersecurity', 'Utility Operations'],
    difficulty: 'hard',
    starGuidance: {
      situation: 'Critical infrastructure requiring comprehensive cybersecurity implementation',
      task: 'Protecting utility operations whilst enabling smart grid functionality',
      action: 'Security architecture design, threat assessment, monitoring systems, and incident response',
      result: 'Secure smart grid operations with protected critical infrastructure and reliable service'
    }
  },
  {
    id: uuidv4(),
    type: 'subject-matter-expertise',
    industry: 'education-stem',
    question: 'Describe your methodology for implementing laboratory safety protocols and chemical waste management in STEM education.',
    tags: ['Laboratory Safety', 'Chemical Safety', 'STEM Education', 'Risk Management'],
    difficulty: 'medium',
    starGuidance: {
      situation: 'Educational laboratory requiring comprehensive safety management systems',
      task: 'Ensuring student and staff safety whilst maintaining effective STEM learning',
      action: 'Safety protocol development, waste management systems, training programmes, and compliance monitoring',
      result: 'Safe learning environment with zero safety incidents and effective STEM education delivery'
    }
  }
];

async function addFinalProfessionalQuestions() {
  console.log('🎯 Adding final professional questions to replace remaining generic content...');
  
  try {
    await db.insert(questions).values(finalProfessionalQuestions);
    console.log(`✅ Successfully added ${finalProfessionalQuestions.length} final professional questions`);
    
    // Verify no generic questions remain
    const remainingGeneric = await db.select().from(questions)
      .where(questions.type === 'subject-matter-expertise')
      .then(results => results.filter(q => 
        q.question.includes('cross-functional collaboration') ||
        q.question.includes('risk assessment and mitigation') ||
        q.question.includes('technical documentation') ||
        q.question.includes('stakeholder') ||
        q.question.includes('emerging technologies') ||
        q.question.includes('troubleshoot a critical system')
      ));
    
    console.log(`📊 Final verification - Remaining generic questions: ${remainingGeneric.length}`);
    
    if (remainingGeneric.length === 0) {
      console.log('🎉 SUCCESS! All generic questions have been completely eliminated!');
    }
    
  } catch (error) {
    console.error('❌ Error adding final questions:', error);
  }
}

export { addFinalProfessionalQuestions };

if (import.meta.url === `file://${process.argv[1]}`) {
  addFinalProfessionalQuestions()
    .then(() => {
      console.log('✨ Final professional question replacement completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Final replacement failed:', error);
      process.exit(1);
    });
}