import { db } from './db.js';
import { questions, type InsertQuestion } from '@shared/schema.js';
import { and, eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Define industry-specific technical questions for all industries that currently have generic questions
const industrySpecificQuestions: Record<string, InsertQuestion[]> = {
  'agriculture': [
    {
      id: uuidv4(),
      type: 'subject-matter-expertise',
      industry: 'agriculture',
      question: 'Walk me through your approach to implementing precision agriculture techniques using GPS and variable rate technology for crop management.',
      tags: ['Precision Agriculture', 'GPS Technology', 'Variable Rate Application', 'Crop Management'],
      difficulty: 'hard',
      starGuidance: {
        situation: 'Farm requiring optimised crop input application and yield improvement',
        task: 'Implementing precision agriculture technology to improve efficiency and yields',
        action: 'GPS mapping, soil testing, variable rate seeding and fertilising systems implemented',
        result: 'Improved crop yields, reduced input costs, and enhanced environmental sustainability'
      }
    },
    {
      id: uuidv4(),
      type: 'subject-matter-expertise',
      industry: 'agriculture',
      question: 'Explain your methodology for developing an integrated pest management (IPM) programme for a specific crop system.',
      tags: ['Integrated Pest Management', 'Crop Protection', 'Sustainable Agriculture', 'Pest Control'],
      difficulty: 'medium',
      starGuidance: {
        situation: 'Crop facing pest pressure requiring sustainable management approach',
        task: 'Developing comprehensive IPM strategy balancing effectiveness and sustainability',
        action: 'Pest monitoring, beneficial insect conservation, targeted treatments, and cultural practices',
        result: 'Effective pest control with reduced chemical inputs and preserved beneficial species'
      }
    }
  ],

  'healthcare': [
    {
      id: uuidv4(),
      type: 'subject-matter-expertise',
      industry: 'healthcare',
      question: 'Describe your approach to implementing a clinical decision support system to improve patient safety and reduce medication errors.',
      tags: ['Clinical Decision Support', 'Patient Safety', 'Medication Management', 'Healthcare IT'],
      difficulty: 'hard',
      starGuidance: {
        situation: 'Healthcare facility experiencing medication errors requiring systematic intervention',
        task: 'Implementing technology-supported clinical decision making to improve patient outcomes',
        action: 'System design, clinical workflow integration, staff training, and error tracking implementation',
        result: 'Significant reduction in medication errors and improved patient safety metrics'
      }
    },
    {
      id: uuidv4(),
      type: 'subject-matter-expertise',
      industry: 'healthcare',
      question: 'Walk me through your methodology for conducting clinical research studies whilst ensuring patient safety and regulatory compliance.',
      tags: ['Clinical Research', 'Patient Safety', 'Regulatory Compliance', 'Data Management'],
      difficulty: 'hard',
      starGuidance: {
        situation: 'Clinical trial requiring rigorous safety monitoring and regulatory adherence',
        task: 'Conducting high-quality research whilst protecting participant welfare',
        action: 'Protocol development, IRB approval, safety monitoring, data collection, and analysis procedures',
        result: 'Successful study completion with robust data and maintained participant safety'
      }
    }
  ],

  'pharmaceuticals': [
    {
      id: uuidv4(),
      type: 'subject-matter-expertise',
      industry: 'pharmaceuticals',
      question: 'Explain your approach to developing and validating analytical methods for drug substance characterisation and stability testing.',
      tags: ['Analytical Method Development', 'Drug Characterisation', 'Stability Testing', 'Validation'],
      difficulty: 'hard',
      starGuidance: {
        situation: 'New drug substance requiring comprehensive analytical characterisation for regulatory submission',
        task: 'Developing robust analytical methods meeting regulatory requirements and quality standards',
        action: 'Method development, validation studies, stability protocols, and regulatory documentation',
        result: 'Validated analytical methods supporting successful drug development and regulatory approval'
      }
    },
    {
      id: uuidv4(),
      type: 'subject-matter-expertise',
      industry: 'pharmaceuticals',
      question: 'Walk me through your process for implementing Good Manufacturing Practice (GMP) compliance in pharmaceutical manufacturing.',
      tags: ['GMP Compliance', 'Manufacturing', 'Quality Assurance', 'Regulatory Affairs'],
      difficulty: 'hard',
      starGuidance: {
        situation: 'Pharmaceutical manufacturing facility requiring GMP implementation or improvement',
        task: 'Ensuring full regulatory compliance whilst maintaining production efficiency',
        action: 'Gap analysis, procedure development, staff training, system implementation, and audit preparation',
        result: 'Successful GMP compliance with regulatory approval and maintained product quality'
      }
    }
  ],

  'mechanical-engineering': [
    {
      id: uuidv4(),
      type: 'subject-matter-expertise',
      industry: 'mechanical-engineering',
      question: 'Describe your approach to conducting finite element analysis (FEA) for structural optimization of a critical mechanical component.',
      tags: ['Finite Element Analysis', 'Structural Optimization', 'Mechanical Design', 'CAE'],
      difficulty: 'hard',
      starGuidance: {
        situation: 'Critical mechanical component requiring weight reduction whilst maintaining structural integrity',
        task: 'Using advanced simulation techniques to optimise design performance',
        action: 'FEA modelling, load case analysis, material selection, iterative design optimisation',
        result: 'Optimised component with improved performance-to-weight ratio and validated safety margins'
      }
    },
    {
      id: uuidv4(),
      type: 'subject-matter-expertise',
      industry: 'mechanical-engineering',
      question: 'Explain your methodology for designing and implementing predictive maintenance programmes for rotating machinery.',
      tags: ['Predictive Maintenance', 'Vibration Analysis', 'Rotating Machinery', 'Condition Monitoring'],
      difficulty: 'medium',
      starGuidance: {
        situation: 'Industrial facility with critical rotating equipment requiring reliability improvement',
        task: 'Implementing condition monitoring to prevent unexpected failures',
        action: 'Vibration monitoring setup, trend analysis, failure mode identification, maintenance scheduling',
        result: 'Reduced unplanned downtime and optimised maintenance costs through predictive strategies'
      }
    }
  ],

  'cybersecurity': [
    {
      id: uuidv4(),
      type: 'subject-matter-expertise',
      industry: 'cybersecurity',
      question: 'Walk me through your approach to conducting a comprehensive penetration test and vulnerability assessment for a financial services organisation.',
      tags: ['Penetration Testing', 'Vulnerability Assessment', 'Financial Services', 'Risk Assessment'],
      difficulty: 'hard',
      starGuidance: {
        situation: 'Financial services client requiring thorough security assessment to meet compliance requirements',
        task: 'Identifying security vulnerabilities whilst minimising operational disruption',
        action: 'Reconnaissance, vulnerability scanning, exploitation testing, privilege escalation attempts, and reporting',
        result: 'Comprehensive security assessment with prioritised remediation plan and improved security posture'
      }
    },
    {
      id: uuidv4(),
      type: 'subject-matter-expertise',
      industry: 'cybersecurity',
      question: 'Describe your methodology for implementing a Security Operations Centre (SOC) with threat detection and incident response capabilities.',
      tags: ['Security Operations Centre', 'Threat Detection', 'Incident Response', 'SIEM'],
      difficulty: 'hard',
      starGuidance: {
        situation: 'Organisation requiring 24/7 security monitoring and rapid incident response capability',
        task: 'Establishing comprehensive security monitoring and response infrastructure',
        action: 'SIEM deployment, playbook development, analyst training, threat intelligence integration',
        result: 'Operational SOC with reduced detection time and improved incident response effectiveness'
      }
    }
  ],

  'manufacturing': [
    {
      id: uuidv4(),
      type: 'subject-matter-expertise',
      industry: 'manufacturing',
      question: 'Explain your approach to implementing lean manufacturing principles and achieving operational excellence in a production environment.',
      tags: ['Lean Manufacturing', 'Operational Excellence', 'Process Improvement', 'Waste Elimination'],
      difficulty: 'medium',
      starGuidance: {
        situation: 'Manufacturing facility with opportunities for efficiency improvement and waste reduction',
        task: 'Implementing lean principles to improve productivity whilst maintaining quality',
        action: 'Value stream mapping, waste identification, 5S implementation, continuous improvement culture development',
        result: 'Improved operational efficiency, reduced waste, and enhanced product quality'
      }
    },
    {
      id: uuidv4(),
      type: 'subject-matter-expertise',
      industry: 'manufacturing',
      question: 'Walk me through your process for implementing Statistical Process Control (SPC) to improve quality and reduce variation in manufacturing.',
      tags: ['Statistical Process Control', 'Quality Control', 'Process Variation', 'Manufacturing Quality'],
      difficulty: 'medium',
      starGuidance: {
        situation: 'Manufacturing process experiencing quality variations requiring systematic control',
        task: 'Implementing data-driven quality control to achieve consistent product specifications',
        action: 'Control chart implementation, process capability studies, operator training, corrective action protocols',
        result: 'Reduced process variation and improved product quality with statistical validation'
      }
    }
  ]
};

// Add more industries systematically
const additionalIndustries = [
  'automotive', 'biotechnology', 'chemical-engineering', 'construction', 
  'consulting-management-it', 'education-stem', 'energy-oil-gas-renewables',
  'environmental-science', 'fashion-apparel', 'film-television-production',
  'finance-banking', 'game-development', 'geology-mining', 'government-public-administration',
  'graphic-design-ux-ui', 'hospitality-tourism', 'human-resources-hr-tech',
  'insurance', 'investment-banking', 'journalism-publishing-digital',
  'legal-services-ip', 'logistics-supply-chain', 'machine-vision',
  'marketing-digital', 'media-entertainment', 'nanotechnology',
  'public-utilities', 'quantum-computing', 'real-estate',
  'retail-banking', 'retail-ecommerce', 'robotics',
  'sports-fitness', 'telecommunications', 'veterinary-medicine',
  'aviation-airline-operations', 'animation-vfx'
];

// Generate 2 industry-specific questions for each remaining industry
for (const industry of additionalIndustries) {
  industrySpecificQuestions[industry] = [
    {
      id: uuidv4(),
      type: 'subject-matter-expertise',
      industry: industry,
      question: getIndustrySpecificQuestion1(industry),
      tags: getIndustryTags(industry),
      difficulty: 'hard',
      starGuidance: getSTARGuidance(industry, 1)
    },
    {
      id: uuidv4(),
      type: 'subject-matter-expertise',
      industry: industry,
      question: getIndustrySpecificQuestion2(industry),
      tags: getIndustryTags(industry),
      difficulty: 'medium',
      starGuidance: getSTARGuidance(industry, 2)
    }
  ];
}

function getIndustrySpecificQuestion1(industry: string): string {
  const questions: Record<string, string> = {
    'automotive': 'Describe your approach to implementing functional safety (ISO 26262) requirements in automotive electronic control unit (ECU) development.',
    'biotechnology': 'Walk me through your methodology for scaling up cell culture processes from laboratory to commercial biomanufacturing.',
    'chemical-engineering': 'Explain your approach to designing and optimising a distillation column for separating a multi-component chemical mixture.',
    'construction': 'Describe your methodology for implementing Building Information Modelling (BIM) for complex construction project coordination.',
    'consulting-management-it': 'Walk me through your approach to conducting digital transformation strategy development for a traditional manufacturing company.',
    'education-stem': 'Explain your methodology for designing and implementing competency-based learning programmes in STEM education.',
    'energy-oil-gas-renewables': 'Describe your approach to optimising wind turbine placement and grid integration for a large-scale renewable energy project.',
    'environmental-science': 'Walk me through your process for conducting environmental impact assessments and developing mitigation strategies for industrial projects.',
    'fashion-apparel': 'Explain your methodology for implementing sustainable supply chain practices and material traceability in fashion manufacturing.',
    'film-television-production': 'Describe your approach to managing complex post-production workflows and color grading for high-resolution content delivery.',
    'finance-banking': 'Walk me through your process for implementing algorithmic trading systems with risk management and regulatory compliance.',
    'game-development': 'Explain your methodology for optimising game engine performance and implementing efficient rendering techniques for mobile platforms.',
    'geology-mining': 'Describe your approach to conducting geological modelling and resource estimation using geostatistical methods.',
    'government-public-administration': 'Walk me through your process for implementing digital government services whilst ensuring data privacy and accessibility.',
    'graphic-design-ux-ui': 'Explain your methodology for conducting user experience research and implementing accessibility standards in digital product design.',
    'hospitality-tourism': 'Describe your approach to implementing revenue management systems and dynamic pricing strategies for hospitality operations.',
    'human-resources-hr-tech': 'Walk me through your process for implementing AI-powered recruitment systems whilst ensuring fairness and compliance.',
    'insurance': 'Explain your methodology for developing actuarial models and implementing predictive analytics for insurance risk assessment.',
    'investment-banking': 'Describe your approach to conducting due diligence and valuation analysis for mergers and acquisitions transactions.',
    'journalism-publishing-digital': 'Walk me through your process for implementing fact-checking systems and content verification in digital journalism.',
    'legal-services-ip': 'Explain your methodology for conducting intellectual property portfolio analysis and implementing patent protection strategies.',
    'logistics-supply-chain': 'Describe your approach to implementing supply chain visibility and implementing predictive analytics for demand forecasting.',
    'machine-vision': 'Walk me through your process for developing deep learning algorithms for real-time quality inspection in manufacturing.',
    'marketing-digital': 'Explain your methodology for implementing multi-channel attribution modelling and marketing automation optimisation.',
    'media-entertainment': 'Describe your approach to implementing content delivery networks and streaming optimisation for global audiences.',
    'nanotechnology': 'Walk me through your process for characterising nanomaterial properties and implementing safety protocols for nanomanufacturing.',
    'public-utilities': 'Explain your methodology for implementing smart grid technologies and optimising energy distribution networks.',
    'quantum-computing': 'Describe your approach to implementing quantum error correction and developing fault-tolerant quantum computing systems.',
    'real-estate': 'Walk me through your process for implementing property valuation algorithms and market analysis using big data analytics.',
    'retail-banking': 'Explain your methodology for implementing open banking APIs and developing secure fintech integration platforms.',
    'retail-ecommerce': 'Describe your approach to implementing personalised recommendation engines and optimising conversion rate through A/B testing.',
    'robotics': 'Walk me through your process for implementing simultaneous localisation and mapping (SLAM) for autonomous robot navigation.',
    'sports-fitness': 'Explain your methodology for implementing biomechanical analysis and developing performance optimisation programmes for athletes.',
    'telecommunications': 'Describe your approach to implementing 5G network optimisation and managing network slicing for different service requirements.',
    'veterinary-medicine': 'Walk me through your process for implementing diagnostic imaging interpretation and developing treatment protocols for exotic animals.',
    'aviation-airline-operations': 'Explain your methodology for implementing predictive maintenance programmes for aircraft systems and optimising flight operations.',
    'animation-vfx': 'Describe your approach to implementing motion capture data processing and developing realistic character animation for film production.'
  };
  
  return questions[industry] || 'Describe a complex technical project specific to your industry expertise.';
}

function getIndustrySpecificQuestion2(industry: string): string {
  const questions: Record<string, string> = {
    'automotive': 'Explain your process for conducting vehicle emissions testing and implementing compliance with environmental regulations.',
    'biotechnology': 'Describe your methodology for implementing quality control systems in biopharmaceutical production and ensuring product consistency.',
    'chemical-engineering': 'Walk me through your approach to conducting process hazard analysis and implementing safety management systems.',
    'construction': 'Explain your methodology for implementing sustainable building practices and achieving green building certifications.',
    'consulting-management-it': 'Describe your approach to conducting organisational change management during technology implementations.',
    'education-stem': 'Walk me through your process for implementing educational technology and measuring learning outcomes in STEM programmes.',
    'energy-oil-gas-renewables': 'Explain your methodology for conducting reservoir simulation and implementing enhanced oil recovery techniques.',
    'environmental-science': 'Describe your approach to implementing water quality monitoring systems and developing contamination remediation strategies.',
    'fashion-apparel': 'Walk me through your process for implementing quality control systems and managing production timelines in garment manufacturing.',
    'film-television-production': 'Explain your methodology for implementing audio post-production workflows and achieving broadcast quality standards.',
    'finance-banking': 'Describe your approach to implementing anti-money laundering systems and ensuring regulatory compliance.',
    'game-development': 'Walk me through your process for implementing multiplayer networking architecture and managing server scalability.',
    'geology-mining': 'Explain your methodology for conducting environmental monitoring and implementing sustainable mining practices.',
    'government-public-administration': 'Describe your approach to implementing public policy analysis and measuring programme effectiveness.',
    'graphic-design-ux-ui': 'Walk me through your process for implementing brand identity systems and ensuring consistency across multiple platforms.',
    'hospitality-tourism': 'Explain your methodology for implementing customer relationship management systems and enhancing guest experience.',
    'human-resources-hr-tech': 'Describe your approach to implementing performance management systems and conducting workforce analytics.',
    'insurance': 'Walk me through your process for implementing claims processing automation and fraud detection systems.',
    'investment-banking': 'Explain your methodology for conducting market risk analysis and implementing trading risk management systems.',
    'journalism-publishing-digital': 'Describe your approach to implementing content management systems and optimising digital publishing workflows.',
    'legal-services-ip': 'Walk me through your process for conducting trademark searches and implementing intellectual property enforcement strategies.',
    'logistics-supply-chain': 'Explain your methodology for implementing warehouse automation and optimising inventory management systems.',
    'machine-vision': 'Describe your approach to implementing calibration procedures and ensuring measurement accuracy in vision systems.',
    'marketing-digital': 'Walk me through your process for implementing search engine optimisation and managing paid advertising campaigns.',
    'media-entertainment': 'Explain your methodology for implementing audience measurement systems and analysing content performance metrics.',
    'nanotechnology': 'Describe your approach to implementing quality control systems and ensuring reproducibility in nanomaterial synthesis.',
    'public-utilities': 'Walk me through your process for implementing asset management systems and conducting infrastructure reliability assessments.',
    'quantum-computing': 'Explain your methodology for implementing quantum algorithm development and optimising quantum circuit design.',
    'real-estate': 'Describe your approach to implementing property management systems and conducting market trend analysis.',
    'retail-banking': 'Walk me through your process for implementing credit risk assessment models and ensuring regulatory compliance.',
    'retail-ecommerce': 'Explain your methodology for implementing inventory management systems and optimising supply chain efficiency.',
    'robotics': 'Describe your approach to implementing safety systems for human-robot collaboration and ensuring operational reliability.',
    'sports-fitness': 'Walk me through your process for implementing injury prevention programmes and conducting sports performance analysis.',
    'telecommunications': 'Explain your methodology for implementing network security systems and managing cybersecurity threats.',
    'veterinary-medicine': 'Describe your approach to implementing laboratory diagnostics and developing species-specific treatment protocols.',
    'aviation-airline-operations': 'Walk me through your process for implementing crew scheduling optimisation and ensuring aviation safety compliance.',
    'animation-vfx': 'Explain your methodology for implementing rendering pipeline optimisation and managing large-scale visual effects production.'
  };
  
  return questions[industry] || 'Explain a technical methodology specific to your industry expertise.';
}

function getIndustryTags(industry: string): string[] {
  const baseTags = ['Technical Expertise', 'Industry Knowledge', 'Problem Solving'];
  const industrySpecificTags: Record<string, string[]> = {
    'automotive': ['Automotive Engineering', 'Safety Systems', 'Manufacturing'],
    'biotechnology': ['Bioprocessing', 'Quality Control', 'Regulatory Compliance'],
    'chemical-engineering': ['Process Design', 'Safety Management', 'Chemical Processing'],
    'construction': ['Project Management', 'Building Systems', 'Construction Technology'],
    'cybersecurity': ['Information Security', 'Risk Assessment', 'Compliance'],
    'healthcare': ['Patient Safety', 'Clinical Systems', 'Healthcare Technology'],
    'manufacturing': ['Process Optimization', 'Quality Systems', 'Operational Excellence'],
    'pharmaceuticals': ['Drug Development', 'GMP Compliance', 'Regulatory Affairs']
  };
  
  return industrySpecificTags[industry] || baseTags;
}

function getSTARGuidance(industry: string, questionNumber: number): any {
  return {
    situation: `A technical challenge or project specific to ${industry.replace('-', ' ')} requiring your expertise`,
    task: 'Your responsibility for technical delivery and problem resolution in this industry context',
    action: 'Specific technical approaches, methodologies, and industry best practices you employed',
    result: 'Measurable outcomes and impact demonstrating your technical competence'
  };
}

async function replaceGenericQuestionsWithIndustrySpecific() {
  console.log('🔧 Starting comprehensive industry-specific question replacement...');
  
  let totalReplaced = 0;
  
  for (const [industry, newQuestions] of Object.entries(industrySpecificQuestions)) {
    try {
      console.log(`📝 Processing ${industry}...`);
      
      // Delete existing generic questions for this industry
      const deleteResult = await db.delete(questions)
        .where(and(
          eq(questions.type, 'subject-matter-expertise'),
          eq(questions.industry, industry)
        ));
      
      // Insert new industry-specific questions (taking first 2 to not exceed 15 per industry)
      const questionsToInsert = newQuestions.slice(0, 2);
      await db.insert(questions).values(questionsToInsert);
      
      console.log(`✅ Replaced questions for ${industry} (${questionsToInsert.length} industry-specific questions)`);
      totalReplaced += questionsToInsert.length;
      
    } catch (error) {
      console.error(`❌ Error processing ${industry}:`, error);
    }
  }
  
  console.log(`🎉 Completed! Replaced ${totalReplaced} generic questions with industry-specific content`);
  
  // Verify the results
  const verifyQuery = await db.select().from(questions)
    .where(eq(questions.type, 'subject-matter-expertise'));
  
  console.log(`📊 Total subject-matter-expertise questions in database: ${verifyQuery.length}`);
}

export { replaceGenericQuestionsWithIndustrySpecific };

if (import.meta.url === `file://${process.argv[1]}`) {
  replaceGenericQuestionsWithIndustrySpecific()
    .then(() => {
      console.log('🎯 Industry-specific question replacement completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Replacement failed:', error);
      process.exit(1);
    });
}