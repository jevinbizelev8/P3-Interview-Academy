import { db } from './db.js';
import { questions } from '@shared/schema.js';
import { eq, and } from 'drizzle-orm';

// Complete all industries to exactly 15 questions using SQL
async function bulkCompleteIndustries() {
  console.log('🔧 Bulk completing all industries to exactly 15 questions...');

  // Professional questions by industry
  const professionalQuestions = {
    'cybersecurity': [
      'Walk me through your methodology for conducting penetration testing and vulnerability assessment.',
      'Describe your approach to implementing zero-trust security architecture.',
      'Explain your process for digital forensics and incident response analysis.',
      'How do you conduct threat modeling and risk assessment for enterprise applications?',
      'Walk me through your methodology for implementing Security Information and Event Management (SIEM).',
      'Describe your approach to conducting security awareness training and culture development.',
      'Explain your process for implementing cloud security and DevSecOps practices.',
      'How do you approach compliance auditing for frameworks like SOC 2 and ISO 27001?'
    ],
    'data-science-analytics': [
      'Walk me through your methodology for A/B testing and statistical significance evaluation.',
      'Describe your approach to handling missing data and outlier detection in large datasets.',
      'Explain your process for feature engineering and selection for machine learning models.',
      'How do you implement real-time data pipelines and streaming analytics?',
      'Walk me through your approach to deep learning model architecture and hyperparameter tuning.'
    ],
    'finance-banking': [
      'Describe your methodology for implementing algorithmic trading strategies and backtesting.',
      'Walk me through your approach to credit risk modeling and stress testing.',
      'Explain your process for regulatory capital calculation and Basel III compliance.',
      'How do you implement anti-money laundering (AML) monitoring and suspicious activity detection?',
      'Describe your approach to derivatives pricing and risk management.',
      'Walk me through your methodology for portfolio optimization and asset allocation.',
      'Explain your process for implementing blockchain technology for financial services.',
      'How do you conduct quantitative research and systematic investment strategies?'
    ],
    'food-beverage': [
      'Walk me through your methodology for HACCP implementation and food safety management.',
      'Describe your approach to supply chain traceability and quality assurance systems.',
      'Explain your process for nutritional analysis and product formulation.',
      'How do you implement sustainable packaging and environmental compliance?',
      'Walk me through your approach to sensory analysis and consumer testing.',
      'Describe your process for implementing automation in food processing and packaging.',
      'Explain your methodology for regulatory compliance and FDA approval processes.',
      'How do you approach food preservation technology and shelf-life extension?'
    ],
    'healthcare': [
      'Walk me through your methodology for clinical trial design and regulatory submission.',
      'Describe your approach to implementing electronic health records and interoperability.',
      'Explain your process for medical device development and FDA validation.',
      'How do you implement telemedicine systems and remote patient monitoring?',
      'Walk me through your approach to healthcare data analytics and population health management.',
      'Describe your process for implementing clinical decision support systems.',
      'Explain your methodology for infection control and hospital safety protocols.',
      'How do you approach pharmaceutical supply chain and medication management?'
    ],
    'manufacturing': [
      'Walk me through your methodology for implementing predictive maintenance and IoT sensors.',
      'Describe your approach to quality control using statistical process control (SPC).',
      'Explain your process for implementing automated guided vehicles (AGV) and robotics.',
      'How do you conduct failure mode and effects analysis (FMEA) for manufacturing processes?',
      'Walk me through your approach to supply chain optimization and vendor management.',
      'Describe your process for implementing ISO 9001 quality management systems.',
      'Explain your methodology for production planning and scheduling optimization.',
      'How do you approach sustainable manufacturing and circular economy principles?'
    ],
    'mechanical-engineering': [
      'Walk me through your methodology for computational fluid dynamics (CFD) analysis.',
      'Describe your approach to designing mechanical systems for extreme environments.',
      'Explain your process for implementing condition monitoring and vibration analysis.',
      'How do you conduct stress analysis using finite element methods for complex geometries?',
      'Walk me through your approach to thermal management system design for electronics.',
      'Describe your process for implementing additive manufacturing and 3D printing.',
      'Explain your methodology for mechanical system optimization and performance enhancement.',
      'How do you approach failure analysis and root cause investigation for mechanical failures?'
    ]
  };

  // Execute SQL for each incomplete industry
  for (const [industry, questionsArray] of Object.entries(professionalQuestions)) {
    try {
      console.log(`📝 Processing ${industry}...`);
      
      // First, get current count
      const currentQuestions = await db
        .select()
        .from(questions)
        .where(and(
          eq(questions.type, 'subject-matter-expertise'),
          eq(questions.industry, industry)
        ));
      
      const needed = 15 - currentQuestions.length;
      
      if (needed > 0) {
        console.log(`  Adding ${needed} professional questions...`);
        
        // Prepare SQL insert statements
        const insertStatements = [];
        for (let i = 0; i < needed && i < questionsArray.length; i++) {
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
          console.log(`  ✅ Added ${insertStatements.length} questions to ${industry}`);
        }
      } else {
        console.log(`  ✓ ${industry} already has 15 questions`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${industry}:`, error);
    }
  }
  
  console.log('\n🎉 Bulk completion finished!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  bulkCompleteIndustries()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('💥 Bulk completion failed:', error);
      process.exit(1);
    });
}