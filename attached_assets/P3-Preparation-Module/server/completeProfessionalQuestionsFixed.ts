import { db } from './db.js';
import { questions, type InsertQuestion } from '@shared/schema.js';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Function to generate professional questions for each industry
async function addProfessionalQuestionsToIncomplete() {
  console.log('🔧 Adding professional questions to complete all industries...');

  // Industries that need professional questions (each should have exactly 15)
  const industryQuestions = {
    'architecture': [
      'Walk me through your process for conducting structural load analysis and seismic design for a high-rise building in an earthquake zone.',
      'Describe your methodology for implementing sustainable design principles and achieving LEED certification for commercial buildings.',
      'Explain your approach to space planning and building code compliance for mixed-use developments.',
      'How do you conduct building performance analysis and energy efficiency optimization?',
      'Walk me through your process for historic preservation and adaptive reuse projects.'
    ],
    'animation-vfx': [
      'Explain your process for creating photorealistic fluid simulations and particle effects for major film productions.',
      'Walk me through your approach to rigging and animating complex character deformations for realistic facial expressions.',
      'Describe your methodology for motion capture data processing and character animation integration.',
      'How do you implement real-time rendering optimization for interactive media?',
      'Explain your approach to compositing and color grading for cinematic visual effects.'
    ],
    'automotive': [
      'Describe your approach to implementing functional safety (ISO 26262) requirements in automotive ECU development.',
      'Explain your process for conducting vehicle emissions testing and regulatory compliance.',
      'Walk me through your methodology for crash test analysis and vehicle safety optimization.',
      'How do you implement electric vehicle charging systems and battery management?',
      'Describe your approach to autonomous vehicle sensor integration and calibration.'
    ],
    'biotechnology': [
      'Describe your approach to optimising mammalian cell culture processes for monoclonal antibody production.',
      'Walk me through your methodology for gene expression analysis using RNA sequencing.',
      'Explain your process for protein purification and characterisation using chromatographic techniques.',
      'How do you implement quality control systems in biopharmaceutical manufacturing?',
      'Describe your approach to conducting bioassay development and validation.'
    ]
  };

  for (const [industry, questionTexts] of Object.entries(industryQuestions)) {
    try {
      // Get current count for this industry
      const currentQuestions = await db.select().from(questions)
        .where(and(eq(questions.type, 'subject-matter-expertise'), eq(questions.industry, industry)));
      
      const needed = 15 - currentQuestions.length;
      console.log(`📊 ${industry}: has ${currentQuestions.length}, needs ${needed} more`);
      
      if (needed > 0) {
        const questionsToAdd: InsertQuestion[] = [];
        
        // Add up to the needed number of questions
        for (let i = 0; i < Math.min(needed, questionTexts.length); i++) {
          questionsToAdd.push({
            id: uuidv4(),
            type: 'subject-matter-expertise',
            industry: industry,
            question: questionTexts[i],
            tags: getTechnicalTags(industry),
            difficulty: (i % 3 === 0) ? 'easy' : (i % 3 === 1) ? 'medium' : 'hard',
            starGuidance: {
              situation: `A technical challenge in ${industry.replace(/-/g, ' ')} requiring specialized expertise`,
              task: 'Your responsibility for delivering technical solutions in this professional context',
              action: 'Specific methodologies and industry best practices you employed',
              result: 'Measurable outcomes demonstrating your technical competence'
            }
          });
        }
        
        if (questionsToAdd.length > 0) {
          await db.insert(questions).values(questionsToAdd);
          console.log(`✅ Added ${questionsToAdd.length} professional questions to ${industry}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing ${industry}:`, error);
    }
  }

  // Now get a sample from each industry for QC
  console.log('\n📋 QUALITY CONTROL SAMPLE - One question per industry:');
  console.log('=' * 80);
  
  const allIndustries = await db.select().from(questions)
    .where(eq(questions.type, 'subject-matter-expertise'));
  
  const industriesSample = new Map<string, string>();
  
  allIndustries.forEach(q => {
    if (q.industry && !industriesSample.has(q.industry)) {
      industriesSample.set(q.industry, q.question);
    }
  });
  
  // Sort and display samples
  const sortedSamples = Array.from(industriesSample.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  
  sortedSamples.forEach(([industry, question], index) => {
    const industryName = industry.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    console.log(`${(index + 1).toString().padStart(2)}. ${industryName}:`);
    console.log(`    ${question.substring(0, 100)}${question.length > 100 ? '...' : ''}`);
    console.log('');
  });
  
  console.log(`🎯 Total industries with samples: ${sortedSamples.length}`);
}

function getTechnicalTags(industry: string): string[] {
  const tagMapping: Record<string, string[]> = {
    'architecture': ['Structural Engineering', 'Building Design', 'Construction Technology', 'Building Codes'],
    'animation-vfx': ['Visual Effects', 'Animation', 'CGI', 'Film Production'],
    'automotive': ['Automotive Engineering', 'Vehicle Systems', 'Safety Testing', 'Manufacturing'],
    'biotechnology': ['Bioprocessing', 'Molecular Biology', 'Quality Control', 'Regulatory Compliance'],
    'chemical-engineering': ['Process Design', 'Chemical Processing', 'Safety Management', 'Process Optimization'],
    'construction': ['Construction Management', 'Building Systems', 'Project Management', 'Safety Management'],
    'cybersecurity': ['Information Security', 'Risk Assessment', 'Threat Detection', 'Compliance'],
    'healthcare': ['Clinical Systems', 'Patient Safety', 'Healthcare Technology', 'Quality Improvement'],
    'manufacturing': ['Process Optimization', 'Quality Systems', 'Lean Manufacturing', 'Operational Excellence'],
    'pharmaceuticals': ['Drug Development', 'GMP Compliance', 'Regulatory Affairs', 'Quality Assurance']
  };
  
  return tagMapping[industry] || ['Technical Expertise', 'Industry Knowledge', 'Problem Solving'];
}

export { addProfessionalQuestionsToIncomplete };

if (import.meta.url === `file://${process.argv[1]}`) {
  addProfessionalQuestionsToIncomplete()
    .then(() => {
      console.log('🎉 Professional question completion finished!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Process failed:', error);
      process.exit(1);
    });
}