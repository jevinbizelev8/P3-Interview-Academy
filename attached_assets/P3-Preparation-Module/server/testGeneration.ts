import { generateIndustryQuestions } from './generateIndustryQuestions.js';
import { db } from './db.js';
import { questions, type InsertQuestion } from '@shared/schema.js';
import { v4 as uuidv4 } from 'uuid';

async function testGeneration() {
  console.log('Testing question generation for cybersecurity...');
  
  try {
    const generatedQuestions = await generateIndustryQuestions({
      industry: 'cybersecurity',
      industryDescription: 'Network security protocols, penetration testing, risk assessment, OWASP',
      count: 3
    });

    console.log('Generated questions:', JSON.stringify(generatedQuestions, null, 2));
    
    // Test database insertion
    const questionsToInsert: InsertQuestion[] = generatedQuestions.map((q: any) => ({
      id: uuidv4(),
      type: q.type,
      industry: q.industry,
      question: q.question,
      tags: q.tags,
      difficulty: q.difficulty,
      starGuidance: q.starGuidance
    }));

    await db.insert(questions).values(questionsToInsert);
    console.log(`✅ Successfully inserted ${questionsToInsert.length} test questions`);
    
  } catch (error) {
    console.error('❌ Test generation failed:', error);
  }
}

testGeneration();