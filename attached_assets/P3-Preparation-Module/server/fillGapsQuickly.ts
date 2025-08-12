import { db } from './db.js';
import { questions } from '@shared/schema.js';
import { eq, and } from 'drizzle-orm';

// Quickly fill the gaps for industries with less than 15 questions
async function fillGapsQuickly() {
  console.log('🔧 Filling remaining gaps to reach exactly 15 questions per industry...');

  const missingQuestions = {
    cybersecurity: [
      'How do you approach compliance auditing for frameworks like SOC 2 and ISO 27001?'
    ],
    'data-science-analytics': [
      'Walk me through your methodology for A/B testing and statistical significance evaluation.',
      'Describe your approach to handling missing data and outlier detection in large datasets.',
      'Explain your process for feature engineering and selection for machine learning models.',
      'How do you implement real-time data pipelines and streaming analytics?',
      'Walk me through your approach to deep learning model architecture and hyperparameter tuning.',
      'Describe your methodology for implementing natural language processing and text analytics.',
      'Explain your process for conducting predictive modeling and time series forecasting.',
      'How do you approach data visualization and business intelligence dashboard development?'
    ],
    'finance-banking': [
      'How do you conduct quantitative research and systematic investment strategies?'
    ],
    healthcare: [
      'How do you approach pharmaceutical supply chain and medication management?'
    ],
    manufacturing: [
      'How do you approach sustainable manufacturing and circular economy principles?'
    ],
    'mechanical-engineering': [
      'How do you approach failure analysis and root cause investigation for mechanical failures?'
    ]
  };

  for (const [industry, questionsArray] of Object.entries(missingQuestions)) {
    try {
      console.log(`📝 Processing ${industry}...`);
      
      const currentCount = await db
        .select()
        .from(questions)
        .where(and(
          eq(questions.type, 'subject-matter-expertise'),
          eq(questions.industry, industry)
        ));

      const needed = 15 - currentCount.length;
      
      if (needed > 0 && questionsArray.length >= needed) {
        const insertStatements = [];
        
        for (let i = 0; i < needed; i++) {
          const difficulty = (i % 3 === 0) ? 'easy' : (i % 3 === 1) ? 'medium' : 'hard';
          const tags = JSON.stringify(['Professional Practice', 'Technical Expertise', 'Industry Knowledge']);
          const starGuidance = JSON.stringify({
            situation: `Professional challenge in ${industry.replace(/-/g, ' ')} requiring specialized expertise`,
            task: 'Your responsibility to deliver technical excellence in this specialized field',
            action: 'Specific methodologies, tools, and professional practices you implemented',
            result: 'Measurable outcomes demonstrating your technical competence and industry impact'
          });
          
          insertStatements.push(`(gen_random_uuid(), 'subject-matter-expertise', '${industry}', '${questionsArray[i].replace(/'/g, "''")}', '${tags}'::jsonb, '${difficulty}', '${starGuidance}'::jsonb)`);
        }
        
        if (insertStatements.length > 0) {
          const insertSQL = `INSERT INTO questions (id, type, industry, question, tags, difficulty, star_guidance) VALUES ${insertStatements.join(', ')}`;
          await db.execute(insertSQL);
          console.log(`✅ Added ${insertStatements.length} questions to ${industry}`);
        }
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${industry}:`, error);
    }
  }
  
  console.log('🎉 Gap filling complete!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fillGapsQuickly()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('💥 Gap filling failed:', error);
      process.exit(1);
    });
}