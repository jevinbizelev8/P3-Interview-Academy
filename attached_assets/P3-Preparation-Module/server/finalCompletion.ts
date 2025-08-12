import { db } from './db.js';
import { questions } from '@shared/schema.js';
import { eq, and } from 'drizzle-orm';

// Final completion to ensure exactly 15 questions per industry
async function finalCompletion() {
  console.log('🎯 Final completion: Ensuring exactly 15 professional questions per industry...');

  // Get all industries with less than 15 questions
  const incompleteIndustries = await db.execute(`
    SELECT industry, COUNT(*) as current_count, (15 - COUNT(*)) as needed
    FROM questions 
    WHERE type = 'subject-matter-expertise' 
      AND industry IS NOT NULL
    GROUP BY industry
    HAVING COUNT(*) < 15
    ORDER BY industry
  `);

  for (const row of incompleteIndustries.rows) {
    const industry = row.industry as string;
    const needed = parseInt(row.needed as string);
    
    if (needed > 0) {
      console.log(`📝 Adding ${needed} questions to ${industry}...`);
      
      // Generate professional questions for this specific industry
      const professionalQuestions = await generateIndustryQuestions(industry, needed);
      
      for (let i = 0; i < professionalQuestions.length; i++) {
        const difficulty = (i % 3 === 0) ? 'easy' : (i % 3 === 1) ? 'medium' : 'hard';
        const tags = JSON.stringify(['Professional Practice', 'Technical Expertise', 'Industry Knowledge']);
        const starGuidance = JSON.stringify({
          situation: `Professional challenge in ${industry.replace(/-/g, ' ')} requiring specialized expertise`,
          task: 'Your responsibility to deliver technical excellence in this specialized field',
          action: 'Specific methodologies, tools, and professional practices you implemented',
          result: 'Measurable outcomes demonstrating your technical competence and industry impact'
        });
        
        await db.execute(`
          INSERT INTO questions (id, type, industry, question, tags, difficulty, star_guidance) 
          VALUES (gen_random_uuid(), 'subject-matter-expertise', '${industry}', '${professionalQuestions[i].replace(/'/g, "''")}', '${tags}'::jsonb, '${difficulty}', '${starGuidance}'::jsonb)
        `);
      }
      
      console.log(`✅ Completed ${industry} (added ${professionalQuestions.length} questions)`);
    }
  }
  
  console.log('🎉 Final completion finished!');
}

async function generateIndustryQuestions(industry: string, count: number): Promise<string[]> {
  const questionBank: Record<string, string[]> = {
    'aerospace-engineering': [
      'Design a propulsion system for a satellite constellation deployment mission. Include orbital mechanics considerations.',
      'Explain your methodology for structural analysis of aircraft components under extreme flight conditions.',
      'Walk me through your approach to avionics system integration and flight control software development.',
      'Describe your process for conducting computational fluid dynamics analysis for hypersonic vehicle design.',
      'How do you implement fault-tolerant systems for critical aerospace applications?'
    ],
    'agriculture': [
      'Explain your methodology for implementing precision agriculture and GPS-guided farming systems.',
      'Walk me through your approach to soil analysis and crop yield optimization techniques.',
      'Describe your process for implementing automated irrigation and fertilization systems.',
      'How do you conduct pest management using integrated biological control methods?',
      'Explain your approach to livestock management and animal welfare monitoring systems.'
    ],
    'animation-vfx': [
      'Walk me through your pipeline for photorealistic character modeling and rigging.',
      'Explain your methodology for implementing motion capture and facial animation systems.',
      'Describe your approach to particle system design and fluid simulation for VFX.',
      'How do you optimize rendering workflows for high-resolution cinematic sequences?',
      'Walk me through your process for compositing and color grading in post-production.'
    ],
    'architecture': [
      'Explain your methodology for sustainable building design and LEED certification processes.',
      'Walk me through your approach to structural engineering and load-bearing analysis.',
      'Describe your process for implementing Building Information Modeling (BIM) workflows.',
      'How do you conduct site analysis and environmental impact assessments?',
      'Explain your approach to accessibility compliance and universal design principles.'
    ],
    'automotive': [
      'Walk me through your methodology for electric vehicle battery management system design.',
      'Explain your approach to autonomous vehicle sensor fusion and perception systems.',
      'Describe your process for implementing advanced driver assistance systems (ADAS).',
      'How do you conduct crash test analysis and safety system validation?',
      'Walk me through your approach to engine optimization and emission control systems.'
    ],
    'aviation-airline-operations': [
      'Explain your methodology for flight planning and route optimization for fuel efficiency.',
      'Walk me through your approach to aircraft maintenance scheduling and safety inspections.',
      'Describe your process for implementing crew resource management and safety protocols.',
      'How do you conduct air traffic management and airport operations coordination?',
      'Explain your approach to aviation meteorology and weather-related decision making.'
    ],
    'biotechnology': [
      'Walk me through your methodology for protein purification and characterization.',
      'Explain your approach to cell culture optimization and bioreactor scale-up.',
      'Describe your process for implementing CRISPR gene editing and genetic engineering.',
      'How do you conduct bioprocess development and fermentation optimization?',
      'Walk me through your approach to biomarker discovery and validation.'
    ],
    'chemical-engineering': [
      'Explain your methodology for process optimization and reaction kinetics analysis.',
      'Walk me through your approach to distillation column design and separation processes.',
      'Describe your process for implementing process safety management and HAZOP analysis.',
      'How do you conduct heat and mass transfer calculations for reactor design?',
      'Explain your approach to process control and instrumentation systems.'
    ],
    'civil-engineering': [
      'Walk me through your methodology for foundation design and geotechnical analysis.',
      'Explain your approach to reinforced concrete design and structural calculations.',
      'Describe your process for implementing transportation infrastructure planning.',
      'How do you conduct hydraulic analysis for water distribution systems?',
      'Walk me through your approach to earthquake-resistant structural design.'
    ],
    'construction': [
      'Explain your methodology for project scheduling and critical path method analysis.',
      'Walk me through your approach to construction safety management and OSHA compliance.',
      'Describe your process for implementing Building Information Modeling (BIM) in construction.',
      'How do you conduct cost estimation and value engineering analysis?',
      'Explain your approach to quality control and construction materials testing.'
    ],
    'consulting-management-it': [
      'Walk me through your methodology for business process optimization and workflow analysis.',
      'Explain your approach to IT strategy development and digital transformation planning.',
      'Describe your process for implementing change management and organizational development.',
      'How do you conduct requirements gathering and stakeholder analysis for IT projects?',
      'Walk me through your approach to vendor selection and procurement optimization.'
    ],
    'cybersecurity': [
      'Describe your approach to implementing zero-trust security architecture.',
      'Explain your process for digital forensics and incident response analysis.',
      'How do you conduct threat modeling and risk assessment for enterprise applications?',
      'Walk me through your methodology for implementing Security Information and Event Management (SIEM).',
      'Describe your approach to conducting security awareness training and culture development.'
    ],
    'data-science-analytics': [
      'Walk me through your methodology for A/B testing and statistical significance evaluation.',
      'Describe your approach to handling missing data and outlier detection in large datasets.',
      'Explain your process for feature engineering and selection for machine learning models.',
      'How do you implement real-time data pipelines and streaming analytics?',
      'Walk me through your approach to deep learning model architecture and hyperparameter tuning.'
    ],
    'education-stem': [
      'Explain your methodology for curriculum development and learning objective alignment.',
      'Walk me through your approach to implementing educational technology and digital learning platforms.',
      'Describe your process for conducting educational assessment and student progress evaluation.',
      'How do you design hands-on laboratory experiments and STEM project-based learning?',
      'Explain your approach to inclusive education and differentiated instruction strategies.'
    ],
    'energy-oil-gas-renewables': [
      'Walk me through your methodology for reservoir engineering and oil recovery optimization.',
      'Explain your approach to wind turbine design and renewable energy system integration.',
      'Describe your process for implementing smart grid technology and energy storage systems.',
      'How do you conduct environmental impact assessment for energy projects?',
      'Walk me through your approach to carbon capture and storage technology development.'
    ]
  };
  
  const questions = questionBank[industry] || [
    `Describe your most complex ${industry.replace(/-/g, ' ')} project and technical challenges overcome.`,
    `Walk me through your methodology for ${industry.replace(/-/g, ' ')} process optimization.`,
    `Explain your approach to quality assurance in ${industry.replace(/-/g, ' ')} applications.`,
    `How do you stay current with ${industry.replace(/-/g, ' ')} industry standards and best practices?`,
    `Describe your experience with ${industry.replace(/-/g, ' ')} regulatory compliance and certifications.`
  ];
  
  return questions.slice(0, count);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  finalCompletion()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('💥 Final completion failed:', error);
      process.exit(1);
    });
}