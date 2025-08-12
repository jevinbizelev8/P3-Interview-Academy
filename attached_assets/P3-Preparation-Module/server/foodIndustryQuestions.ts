import { db } from './db.js';
import { questions, type InsertQuestion } from '@shared/schema.js';
import { and, eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const professionalFoodIndustryQuestions: InsertQuestion[] = [
  {
    id: uuidv4(),
    type: 'subject-matter-expertise',
    industry: 'food-beverage',
    question: 'Walk me through your approach to implementing a comprehensive HACCP (Hazard Analysis Critical Control Points) system for a new food production line.',
    tags: ['HACCP', 'Food Safety', 'Quality Control', 'Risk Assessment'],
    difficulty: 'hard',
    starGuidance: {
      situation: 'A new food production facility requiring HACCP implementation from scratch',
      task: 'Your responsibility for designing and implementing food safety protocols',
      action: 'Hazard analysis methodology, critical control points identification, monitoring procedures, and staff training implemented',
      result: 'Successful HACCP certification and measurable food safety improvements'
    }
  },
  {
    id: uuidv4(),
    type: 'subject-matter-expertise',
    industry: 'food-beverage',
    question: 'Explain how you would optimise thermal processing parameters for a new canned food product to achieve commercial sterility whilst maintaining nutritional quality.',
    tags: ['Thermal Processing', 'Food Science', 'Sterilisation', 'Nutrition Retention'],
    difficulty: 'hard',
    starGuidance: {
      situation: 'Development of a new canned food product requiring thermal processing optimisation',
      task: 'Balancing food safety requirements with quality and nutritional preservation',
      action: 'Thermal death time calculations, process validation studies, and quality testing protocols',
      result: 'Commercially sterile product with optimal nutrition retention and shelf stability'
    }
  },
  {
    id: uuidv4(),
    type: 'subject-matter-expertise',
    industry: 'food-beverage',
    question: 'Describe your methodology for conducting sensory evaluation and consumer testing for a new beverage formulation.',
    tags: ['Sensory Analysis', 'Consumer Testing', 'Product Development', 'Quality Assurance'],
    difficulty: 'medium',
    starGuidance: {
      situation: 'New beverage product requiring consumer acceptance validation before market launch',
      task: 'Designing and executing comprehensive sensory evaluation protocols',
      action: 'Panel selection, testing protocols, statistical analysis, and consumer feedback integration',
      result: 'Data-driven product optimisation and successful market acceptance'
    }
  },
  {
    id: uuidv4(),
    type: 'subject-matter-expertise',
    industry: 'food-beverage',
    question: 'How would you approach troubleshooting and resolving microbial contamination issues in a dairy processing facility?',
    tags: ['Microbiology', 'Contamination Control', 'Dairy Processing', 'Root Cause Analysis'],
    difficulty: 'hard',
    starGuidance: {
      situation: 'Recurring microbial contamination affecting product quality and safety in dairy operations',
      task: 'Identifying contamination sources and implementing effective control measures',
      action: 'Microbiological testing, environmental monitoring, equipment sanitisation protocols, and process modifications',
      result: 'Elimination of contamination sources and restored product quality standards'
    }
  },
  {
    id: uuidv4(),
    type: 'subject-matter-expertise',
    industry: 'food-beverage',
    question: 'Walk me through your process for designing and validating a modified atmosphere packaging (MAP) system for fresh produce.',
    tags: ['Packaging Technology', 'Modified Atmosphere', 'Fresh Produce', 'Shelf Life Extension'],
    difficulty: 'medium',
    starGuidance: {
      situation: 'Fresh produce requiring extended shelf life through advanced packaging technology',
      task: 'Designing optimal gas atmosphere conditions and packaging specifications',
      action: 'Gas composition analysis, respiration rate studies, packaging material selection, and shelf life validation',
      result: 'Significantly extended product shelf life and reduced food waste'
    }
  },
  {
    id: uuidv4(),
    type: 'subject-matter-expertise',
    industry: 'food-beverage',
    question: 'Explain your approach to scaling up a laboratory food formulation to commercial production whilst maintaining product consistency.',
    tags: ['Scale-Up', 'Process Engineering', 'Quality Consistency', 'Manufacturing'],
    difficulty: 'hard',
    starGuidance: {
      situation: 'Successful laboratory food product requiring scale-up to commercial production volumes',
      task: 'Maintaining product quality and consistency across different production scales',
      action: 'Process parameter scaling, equipment specification, pilot trials, and quality validation protocols',
      result: 'Successful commercial production with consistent product quality and specifications'
    }
  },
  {
    id: uuidv4(),
    type: 'subject-matter-expertise',
    industry: 'food-beverage',
    question: 'How do you conduct water activity (aw) analysis and its application in preventing microbial growth in intermediate moisture foods?',
    tags: ['Water Activity', 'Food Preservation', 'Microbial Control', 'Analytical Chemistry'],
    difficulty: 'medium',
    starGuidance: {
      situation: 'Development of shelf-stable intermediate moisture food products',
      task: 'Controlling water activity to prevent spoilage whilst maintaining product quality',
      action: 'Water activity measurement protocols, formulation adjustments, and microbial growth studies',
      result: 'Shelf-stable products with extended shelf life and maintained sensory properties'
    }
  },
  {
    id: uuidv4(),
    type: 'subject-matter-expertise',
    industry: 'food-beverage',
    question: 'Describe your methodology for implementing traceability systems to comply with food safety regulations and enable rapid product recalls.',
    tags: ['Traceability', 'Food Safety Regulations', 'Recall Management', 'Supply Chain'],
    difficulty: 'medium',
    starGuidance: {
      situation: 'Food manufacturing facility requiring comprehensive traceability system implementation',
      task: 'Ensuring full supply chain visibility and regulatory compliance',
      action: 'System design, supplier integration, data management protocols, and recall procedures',
      result: 'Complete product traceability and efficient recall capability when needed'
    }
  },
  {
    id: uuidv4(),
    type: 'subject-matter-expertise',
    industry: 'food-beverage',
    question: 'Walk through your approach to designing and implementing clean-in-place (CIP) systems for food processing equipment.',
    tags: ['CIP Systems', 'Sanitation', 'Equipment Design', 'Process Engineering'],
    difficulty: 'hard',
    starGuidance: {
      situation: 'Food processing facility requiring efficient automated cleaning systems',
      task: 'Designing CIP systems that ensure complete sanitation whilst minimising downtime',
      action: 'System design, chemical selection, validation protocols, and cleaning cycle optimisation',
      result: 'Effective automated cleaning with verified sanitation and improved operational efficiency'
    }
  },
  {
    id: uuidv4(),
    type: 'subject-matter-expertise',
    industry: 'food-beverage',
    question: 'Explain how you would conduct accelerated shelf life studies and predict product stability under various storage conditions.',
    tags: ['Shelf Life Studies', 'Product Stability', 'Accelerated Testing', 'Quality Degradation'],
    difficulty: 'medium',
    starGuidance: {
      situation: 'New food product requiring shelf life determination for market launch',
      task: 'Predicting product stability and determining optimal storage conditions',
      action: 'Accelerated testing protocols, kinetic modelling, statistical analysis, and storage studies',
      result: 'Accurate shelf life predictions and optimised storage recommendations'
    }
  },
  {
    id: uuidv4(),
    type: 'subject-matter-expertise',
    industry: 'food-beverage',
    question: 'How do you approach nutritional analysis and labelling compliance for new food products in multiple international markets?',
    tags: ['Nutritional Analysis', 'Regulatory Compliance', 'Food Labelling', 'International Standards'],
    difficulty: 'medium',
    starGuidance: {
      situation: 'New food product requiring nutritional analysis and international market compliance',
      task: 'Ensuring accurate nutritional information and regulatory compliance across markets',
      action: 'Analytical testing, regulatory research, labelling design, and compliance verification',
      result: 'Compliant product labelling enabling successful international market entry'
    }
  },
  {
    id: uuidv4(),
    type: 'subject-matter-expertise',
    industry: 'food-beverage',
    question: 'Describe your methodology for implementing statistical process control (SPC) in food manufacturing to monitor critical quality parameters.',
    tags: ['Statistical Process Control', 'Quality Management', 'Manufacturing', 'Data Analysis'],
    difficulty: 'medium',
    starGuidance: {
      situation: 'Food manufacturing operation requiring improved quality consistency and process control',
      task: 'Implementing data-driven quality monitoring and control systems',
      action: 'Control chart development, process capability studies, operator training, and corrective action protocols',
      result: 'Improved process consistency and reduced quality variations'
    }
  },
  {
    id: uuidv4(),
    type: 'subject-matter-expertise',
    industry: 'food-beverage',
    question: 'Walk me through your process for conducting risk assessments for allergen management in a multi-product food facility.',
    tags: ['Allergen Management', 'Risk Assessment', 'Cross-Contamination', 'Food Safety'],
    difficulty: 'hard',
    starGuidance: {
      situation: 'Multi-product facility with various allergen-containing ingredients requiring comprehensive management',
      task: 'Preventing allergen cross-contamination and ensuring consumer safety',
      action: 'Risk assessment methodology, segregation protocols, cleaning validation, and labelling procedures',
      result: 'Effective allergen control with zero cross-contamination incidents'
    }
  },
  {
    id: uuidv4(),
    type: 'subject-matter-expertise',
    industry: 'food-beverage',
    question: 'How would you optimise fermentation processes for a new probiotic beverage to ensure viable culture counts throughout shelf life?',
    tags: ['Fermentation', 'Probiotics', 'Microbiology', 'Process Optimisation'],
    difficulty: 'hard',
    starGuidance: {
      situation: 'Development of probiotic beverage requiring maintained culture viability during storage',
      task: 'Optimising fermentation and preservation to ensure therapeutic culture levels',
      action: 'Culture selection, fermentation parameter optimisation, protective formulation, and viability studies',
      result: 'Stable probiotic product with guaranteed culture counts throughout shelf life'
    }
  },
  {
    id: uuidv4(),
    type: 'subject-matter-expertise',
    industry: 'food-beverage',
    question: 'Explain your approach to implementing lean manufacturing principles in food production to reduce waste and improve efficiency.',
    tags: ['Lean Manufacturing', 'Waste Reduction', 'Process Improvement', 'Operational Excellence'],
    difficulty: 'easy',
    starGuidance: {
      situation: 'Food production facility with opportunities for waste reduction and efficiency improvement',
      task: 'Implementing lean principles whilst maintaining food safety and quality standards',
      action: 'Value stream mapping, waste identification, process redesign, and continuous improvement culture',
      result: 'Reduced waste, improved efficiency, and maintained product quality standards'
    }
  }
];

async function replaceFoodIndustryQuestions() {
  console.log('🍽️ Replacing generic food industry questions with professional ones...');
  
  try {
    // Insert the professional food industry questions
    await db.insert(questions).values(professionalFoodIndustryQuestions);
    console.log(`✅ Successfully added ${professionalFoodIndustryQuestions.length} professional food industry questions`);
    
    // Verify the replacement
    const verifyQuestions = await db.select().from(questions)
      .where(and(eq(questions.type, 'subject-matter-expertise'), eq(questions.industry, 'food-beverage')));
    console.log(`📊 Database now contains ${verifyQuestions.length} food industry questions`);
    
    // Show a sample of the new questions
    console.log('\n🔍 Sample professional questions:');
    verifyQuestions.slice(0, 3).forEach((q, i) => {
      console.log(`${i + 1}. ${q.question.slice(0, 80)}...`);
    });
    
  } catch (error) {
    console.error('❌ Error replacing food industry questions:', error);
  }
}

export { replaceFoodIndustryQuestions };

if (import.meta.url === `file://${process.argv[1]}`) {
  replaceFoodIndustryQuestions()
    .then(() => {
      console.log('🎉 Food industry questions replacement completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Replacement failed:', error);
      process.exit(1);
    });
}