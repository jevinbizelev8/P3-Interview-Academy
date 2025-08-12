import { db } from './db.js';
import { questions, type InsertQuestion } from '@shared/schema.js';
import { and, eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Generate 13 additional industry-specific questions for each industry to reach 15 total
async function generateCompleteIndustryQuestionSet() {
  console.log('🚀 Generating complete 15-question sets for all industries...');
  
  // Get list of all industries that need completion
  const industriesToComplete = [
    'agriculture', 'healthcare', 'pharmaceuticals', 'mechanical-engineering', 
    'cybersecurity', 'manufacturing', 'automotive', 'biotechnology', 
    'chemical-engineering', 'construction', 'consulting-management-it',
    'education-stem', 'energy-oil-gas-renewables', 'environmental-science',
    'fashion-apparel', 'film-television-production', 'finance-banking',
    'game-development', 'geology-mining', 'government-public-administration',
    'graphic-design-ux-ui', 'hospitality-tourism', 'human-resources-hr-tech',
    'insurance', 'investment-banking', 'journalism-publishing-digital',
    'legal-services-ip', 'logistics-supply-chain', 'machine-vision',
    'marketing-digital', 'media-entertainment', 'nanotechnology',
    'public-utilities', 'quantum-computing', 'real-estate',
    'retail-banking', 'retail-ecommerce', 'robotics',
    'sports-fitness', 'telecommunications', 'veterinary-medicine',
    'aviation-airline-operations', 'animation-vfx'
  ];

  for (const industry of industriesToComplete) {
    const additionalQuestions = generateAdditional13Questions(industry);
    
    try {
      await db.insert(questions).values(additionalQuestions);
      console.log(`✅ Added 13 additional questions for ${industry} (total: 15)`);
    } catch (error) {
      console.error(`❌ Error adding questions for ${industry}:`, error);
    }
  }

  // Verify completion
  const verifyQuery = await db.select().from(questions)
    .where(eq(questions.type, 'subject-matter-expertise'));
  
  console.log(`🎉 Complete! Total subject-matter-expertise questions: ${verifyQuery.length}`);
}

function generateAdditional13Questions(industry: string): InsertQuestion[] {
  const questions = [];
  const industryName = industry.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  // Generate 13 additional technical questions specific to each industry
  const questionTemplates = getIndustryQuestionTemplates(industry);
  
  for (let i = 0; i < 13; i++) {
    questions.push({
      id: uuidv4(),
      type: 'subject-matter-expertise' as const,
      industry: industry,
      question: questionTemplates[i],
      tags: getIndustryTags(industry),
      difficulty: (i % 3 === 0) ? 'easy' : (i % 3 === 1) ? 'medium' : 'hard',
      starGuidance: {
        situation: `A technical challenge in ${industryName} requiring specialized expertise and problem-solving skills`,
        task: `Your responsibility for delivering technical solutions and achieving measurable outcomes in this industry context`,
        action: `Specific methodologies, tools, and industry best practices you employed to address the technical requirements`,
        result: `Quantifiable outcomes and improvements achieved through your technical expertise and solution implementation`
      }
    });
  }
  
  return questions;
}

function getIndustryQuestionTemplates(industry: string): string[] {
  const templates: Record<string, string[]> = {
    'agriculture': [
      'Describe your experience with soil analysis and nutrient management planning for sustainable crop production.',
      'Walk me through your approach to implementing irrigation systems with water conservation and efficiency optimisation.',
      'Explain how you conduct crop yield analysis and implement data-driven farming decisions.',
      'Describe your methodology for livestock health management and disease prevention programmes.',
      'How do you approach sustainable farming practices and environmental impact reduction?',
      'Walk me through your process for implementing agricultural automation and robotic systems.',
      'Explain your experience with greenhouse management and controlled environment agriculture.',
      'Describe your approach to post-harvest handling and food safety compliance in agricultural operations.',
      'How do you implement traceability systems for agricultural products from farm to market?',
      'Walk me through your methodology for conducting agricultural risk assessment and crop insurance evaluation.',
      'Explain your approach to implementing renewable energy systems in agricultural operations.',
      'Describe your experience with agricultural biotechnology and genetic improvement programmes.',
      'How do you approach farm financial management and economic sustainability analysis?'
    ],
    
    'automotive': [
      'Explain your methodology for conducting vehicle crash testing and safety analysis.',
      'Describe your approach to implementing electric vehicle charging infrastructure and power management.',
      'Walk me through your process for conducting engine performance optimisation and emissions control.',
      'How do you approach autonomous vehicle sensor integration and calibration?',
      'Explain your experience with automotive supply chain management and quality control.',
      'Describe your methodology for implementing vehicle connectivity and telematics systems.',
      'Walk me through your approach to conducting durability testing and reliability analysis.',
      'How do you implement lean manufacturing principles in automotive production?',
      'Explain your process for conducting material selection and lightweight design optimisation.',
      'Describe your approach to implementing predictive maintenance for automotive manufacturing equipment.',
      'Walk me through your methodology for conducting vehicle aerodynamics testing and optimisation.',
      'How do you approach battery technology development and thermal management systems?',
      'Explain your experience with automotive electronics integration and EMC compliance.'
    ],
    
    'cybersecurity': [
      'Describe your methodology for implementing zero-trust architecture in enterprise environments.',
      'Walk me through your approach to conducting digital forensics and incident investigation.',
      'Explain how you implement identity and access management systems with multi-factor authentication.',
      'Describe your process for conducting security awareness training and phishing simulation programmes.',
      'How do you approach cloud security implementation and compliance monitoring?',
      'Walk me through your methodology for implementing endpoint detection and response systems.',
      'Explain your approach to conducting security risk assessments and vulnerability management.',
      'Describe your experience with implementing data loss prevention and encryption systems.',
      'How do you approach network segmentation and micro-segmentation implementation?',
      'Walk me through your process for conducting security audits and compliance assessments.',
      'Explain your methodology for implementing security information and event management systems.',
      'Describe your approach to conducting business continuity planning and disaster recovery.',
      'How do you implement threat intelligence and security monitoring capabilities?'
    ],
    
    'healthcare': [
      'Describe your methodology for implementing electronic health records and ensuring data privacy.',
      'Walk me through your approach to conducting quality improvement initiatives in healthcare delivery.',
      'Explain how you implement infection control protocols and healthcare-associated infection prevention.',
      'Describe your process for conducting healthcare technology assessment and implementation.',
      'How do you approach patient safety incident analysis and root cause investigation?',
      'Walk me through your methodology for implementing telemedicine and remote patient monitoring.',
      'Explain your approach to conducting healthcare data analytics and population health management.',
      'Describe your experience with implementing medical device integration and interoperability.',
      'How do you approach healthcare workflow optimisation and process improvement?',
      'Walk me through your process for conducting healthcare cost analysis and value-based care.',
      'Explain your methodology for implementing healthcare quality metrics and performance monitoring.',
      'Describe your approach to conducting healthcare staff training and competency assessment.',
      'How do you implement healthcare emergency preparedness and crisis management?'
    ],
    
    'manufacturing': [
      'Describe your methodology for implementing predictive maintenance programmes for manufacturing equipment.',
      'Walk me through your approach to conducting process capability studies and quality improvement.',
      'Explain how you implement automated quality inspection systems and defect detection.',
      'Describe your process for conducting energy efficiency analysis and sustainability improvement.',
      'How do you approach production scheduling optimisation and workflow management?',
      'Walk me through your methodology for implementing supply chain integration and vendor management.',
      'Explain your approach to conducting cost analysis and manufacturing efficiency improvement.',
      'Describe your experience with implementing advanced manufacturing technologies and Industry 4.0.',
      'How do you approach workplace safety management and accident prevention programmes?',
      'Walk me through your process for conducting equipment validation and process qualification.',
      'Explain your methodology for implementing continuous improvement and kaizen programmes.',
      'Describe your approach to conducting manufacturing data analysis and performance monitoring.',
      'How do you implement inventory management systems and just-in-time production?'
    ]
  };
  
  // For industries not specifically defined, generate generic technical questions
  if (!templates[industry]) {
    const industryName = industry.replace(/-/g, ' ');
    return [
      `Describe your methodology for implementing advanced technical solutions in ${industryName}.`,
      `Walk me through your approach to conducting technical analysis and performance optimisation in ${industryName}.`,
      `Explain how you implement quality control systems and compliance monitoring in ${industryName}.`,
      `Describe your process for conducting risk assessment and mitigation strategies in ${industryName}.`,
      `How do you approach technology integration and system implementation in ${industryName}?`,
      `Walk me through your methodology for conducting technical troubleshooting and problem resolution in ${industryName}.`,
      `Explain your approach to conducting performance monitoring and continuous improvement in ${industryName}.`,
      `Describe your experience with implementing automation and efficiency optimisation in ${industryName}.`,
      `How do you approach project management and stakeholder coordination in ${industryName}?`,
      `Walk me through your process for conducting technical documentation and knowledge transfer in ${industryName}.`,
      `Explain your methodology for implementing safety protocols and regulatory compliance in ${industryName}.`,
      `Describe your approach to conducting data analysis and decision-making support in ${industryName}.`,
      `How do you implement innovation and emerging technology adoption in ${industryName}?`
    ];
  }
  
  return templates[industry];
}

function getIndustryTags(industry: string): string[] {
  const baseTags = ['Technical Expertise', 'Industry Knowledge', 'Problem Solving'];
  const industrySpecificTags: Record<string, string[]> = {
    'agriculture': ['Sustainable Agriculture', 'Crop Management', 'Agricultural Technology', 'Food Production'],
    'automotive': ['Automotive Engineering', 'Vehicle Systems', 'Manufacturing', 'Safety Testing'],
    'biotechnology': ['Bioprocessing', 'Quality Control', 'Regulatory Compliance', 'Cell Culture'],
    'chemical-engineering': ['Process Design', 'Safety Management', 'Chemical Processing', 'Process Optimization'],
    'construction': ['Project Management', 'Building Systems', 'Construction Technology', 'Safety Management'],
    'cybersecurity': ['Information Security', 'Risk Assessment', 'Compliance', 'Threat Detection'],
    'healthcare': ['Patient Safety', 'Clinical Systems', 'Healthcare Technology', 'Quality Improvement'],
    'manufacturing': ['Process Optimization', 'Quality Systems', 'Operational Excellence', 'Lean Manufacturing'],
    'pharmaceuticals': ['Drug Development', 'GMP Compliance', 'Regulatory Affairs', 'Quality Assurance']
  };
  
  return industrySpecificTags[industry] || baseTags;
}

export { generateCompleteIndustryQuestionSet };

if (import.meta.url === `file://${process.argv[1]}`) {
  generateCompleteIndustryQuestionSet()
    .then(() => {
      console.log('🎯 Complete industry question set generation finished successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Generation failed:', error);
      process.exit(1);
    });
}