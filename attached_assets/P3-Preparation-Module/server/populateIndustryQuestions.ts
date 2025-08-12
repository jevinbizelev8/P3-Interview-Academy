import { generateIndustryQuestions, INDUSTRIES_TO_GENERATE } from './generateIndustryQuestions.js';
import { db } from './db.js';
import { questions, type InsertQuestion } from '@shared/schema.js';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

async function populateAllIndustryQuestions() {
  console.log('Starting bulk generation of industry-specific questions...');
  console.log(`Target: Generate questions for ${INDUSTRIES_TO_GENERATE.length} industries`);
  
  let totalGenerated = 0;
  let totalErrors = 0;

  for (const industry of INDUSTRIES_TO_GENERATE) {
    console.log(`\n🔄 Generating ${industry.needCount} questions for ${industry.name}...`);
    
    try {
      const generatedQuestions = await generateIndustryQuestions({
        industry: industry.id,
        industryDescription: industry.description,
        count: industry.needCount
      });

      // Convert to database format and insert
      const questionsToInsert: InsertQuestion[] = generatedQuestions.map((q: any) => ({
        id: uuidv4(),
        type: q.type,
        industry: q.industry,
        question: q.question,
        tags: q.tags,
        difficulty: q.difficulty,
        starGuidance: q.starGuidance
      }));

      // Insert questions in batch
      await db.insert(questions).values(questionsToInsert);
      
      console.log(`✅ Successfully added ${questionsToInsert.length} questions for ${industry.name}`);
      totalGenerated += questionsToInsert.length;
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Error generating questions for ${industry.name}:`, error);
      totalErrors++;
    }
  }

  console.log(`\n📊 Generation Summary:`);
  console.log(`- Total questions generated: ${totalGenerated}`);
  console.log(`- Industries with errors: ${totalErrors}`);
  console.log(`- Success rate: ${((INDUSTRIES_TO_GENERATE.length - totalErrors) / INDUSTRIES_TO_GENERATE.length * 100).toFixed(1)}%`);
  
  // Final database check
  const finalCount = await db.select().from(questions).where(eq(questions.type, 'subject-matter-expertise'));
  console.log(`- Total subject-matter-expertise questions in database: ${finalCount.length}`);
  
  return {
    generated: totalGenerated,
    errors: totalErrors,
    totalInDb: finalCount.length
  };
}

export { populateAllIndustryQuestions };

// If running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  populateAllIndustryQuestions()
    .then(result => {
      console.log('\n🎉 Bulk generation completed!', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Bulk generation failed:', error);
      process.exit(1);
    });
}