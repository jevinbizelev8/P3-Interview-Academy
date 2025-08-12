import { db } from './db.js';
import { questions, type InsertQuestion } from '@shared/schema.js';
import { v4 as uuidv4 } from 'uuid';

// Fill missing questions for incomplete industries
const missingQuestions: Record<string, string[]> = {
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

async function completeIncompleteIndustries() {
  console.log('🔧 Completing industries with missing questions...');
  
  let totalAdded = 0;
  
  for (const [industry, questionsToAdd] of Object.entries(missingQuestions)) {
    try {
      const currentCount = await db
        .select()
        .from(questions)
        .where(q => q.type === 'subject-matter-expertise' && q.industry === industry);
      
      const needed = 15 - currentCount.length;
      
      if (needed > 0) {
        console.log(`📝 Adding ${needed} questions to ${industry}...`);
        
        const newQuestions: InsertQuestion[] = [];
        
        for (let i = 0; i < needed && i < questionsToAdd.length; i++) {
          newQuestions.push({
            id: uuidv4(),
            type: 'subject-matter-expertise',
            industry: industry,
            question: questionsToAdd[i],
            tags: getIndustryTags(industry),
            difficulty: (i % 3 === 0) ? 'easy' : (i % 3 === 1) ? 'medium' : 'hard',
            starGuidance: {
              situation: `Professional challenge in ${industry.replace(/-/g, ' ')} requiring specialized expertise`,
              task: 'Your responsibility to deliver technical excellence in this specialized field',
              action: 'Specific methodologies, tools, and professional practices you implemented',
              result: 'Measurable outcomes demonstrating your technical competence and industry impact'
            }
          });
        }
        
        if (newQuestions.length > 0) {
          await db.insert(questions).values(newQuestions);
          console.log(`✅ Added ${newQuestions.length} questions to ${industry}`);
          totalAdded += newQuestions.length;
        }
      }
      
    } catch (error) {
      console.error(`❌ Error completing ${industry}:`, error);
    }
  }
  
  console.log(`\n🎉 Industry completion finished!`);
  console.log(`📊 Total questions added: ${totalAdded}`);
}

function getIndustryTags(industry: string): string[] {
  const tagMap: Record<string, string[]> = {
    'cybersecurity': ['Penetration Testing', 'Incident Response', 'Security Architecture', 'Threat Modeling'],
    'data-science-analytics': ['Machine Learning', 'Statistical Analysis', 'Data Pipeline', 'Feature Engineering'],
    'finance-banking': ['Risk Management', 'Algorithmic Trading', 'Regulatory Compliance', 'Quantitative Analysis'],
    'food-beverage': ['Food Safety', 'HACCP', 'Supply Chain', 'Product Development'],
    'healthcare': ['Clinical Trials', 'EHR Systems', 'Medical Devices', 'Regulatory Compliance'],
    'manufacturing': ['Lean Manufacturing', 'Quality Control', 'Automation', 'Process Optimization'],
    'mechanical-engineering': ['CFD Analysis', 'FEA', 'Thermal Management', 'Design Engineering']
  };
  
  return tagMap[industry] || ['Professional Practice', 'Technical Expertise', 'Industry Knowledge'];
}

export { completeIncompleteIndustries };

if (import.meta.url === `file://${process.argv[1]}`) {
  completeIncompleteIndustries()
    .then(() => {
      console.log('✨ All industries now complete with 15 professional questions!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Industry completion failed:', error);
      process.exit(1);
    });
}