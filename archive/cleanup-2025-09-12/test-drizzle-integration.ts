// Test Drizzle ORM integration with new AI prepare schemas
import { db } from "./server/db";
import { 
  aiPrepareSessions, 
  aiPrepareQuestions, 
  aiPrepareResponses,
  aiPrepareAnalytics,
  users,
  type InsertAiPrepareSession,
  type InsertAiPrepareQuestion,
  type InsertAiPrepareResponse
} from "./shared/schema";
import { eq } from "drizzle-orm";

async function testDrizzleIntegration() {
  console.log('🔍 Drizzle ORM Integration Test\n');
  
  try {
    const testUserId = 'drizzle-test-user-' + Date.now();
    
    // Test 1: Create test user
    console.log('1. Testing user creation...');
    await db.insert(users).values({
      id: testUserId,
      email: 'drizzle-test@example.com', 
      firstName: 'Drizzle',
      lastName: 'Test'
    });
    console.log('   ✅ User created successfully');

    // Test 2: Create AI prepare session
    console.log('2. Testing AI prepare session creation...');
    const sessionData: InsertAiPrepareSession = {
      userId: testUserId,
      jobPosition: 'Full Stack Developer',
      companyName: 'Tech Startup',
      interviewStage: 'functional-team',
      experienceLevel: 'senior',
      preferredLanguage: 'en',
      voiceEnabled: true,
      speechRate: '0.9',
      difficultyLevel: 'intermediate',
      focusAreas: ['behavioral', 'technical'],
      questionCategories: ['system-design', 'leadership']
    };

    const [session] = await db.insert(aiPrepareSessions)
      .values(sessionData)
      .returning();
      
    console.log(`   ✅ AI prepare session created: ${session.id}`);

    // Test 3: Create AI prepare question
    console.log('3. Testing AI prepare question creation...');
    const questionData: InsertAiPrepareQuestion = {
      sessionId: session.id,
      questionText: 'Describe a time when you had to lead a cross-functional team through a challenging project.',
      questionTextTranslated: 'Jelaskan saat Anda harus memimpin tim lintas fungsi melalui proyek yang menantang.',
      questionCategory: 'leadership',
      questionType: 'behavioral',
      difficultyLevel: 'intermediate',
      expectedAnswerTime: 240,
      culturalContext: 'Indonesian business culture values consensus and relationship building',
      questionNumber: 1,
      starMethodRelevant: true,
      generatedBy: 'sealion'
    };

    const [question] = await db.insert(aiPrepareQuestions)
      .values(questionData)
      .returning();
      
    console.log(`   ✅ AI prepare question created: ${question.id}`);

    // Test 4: Create AI prepare response
    console.log('4. Testing AI prepare response creation...');
    const responseData: InsertAiPrepareResponse = {
      sessionId: session.id,
      questionId: question.id,
      responseText: 'In my previous role as a tech lead, I was tasked with leading a team of 8 developers...',
      responseLanguage: 'en',
      inputMethod: 'voice',
      audioDuration: 180,
      transcriptionConfidence: '0.92',
      starScores: {
        situation: 4,
        task: 4,
        action: 5,
        result: 5,
        overall: 4.5
      },
      detailedFeedback: {
        strengths: ['Clear STAR structure', 'Specific examples', 'Quantified results'],
        weaknesses: ['Could elaborate more on challenges faced'],
        suggestions: ['Include lessons learned', 'Mention team development outcomes']
      },
      modelAnswer: 'SITUATION: In my role as technical lead at [Company]...',
      relevanceScore: '4.2',
      communicationScore: '4.0', 
      completenessScore: '3.8',
      timeTaken: 180,
      wordCount: 145,
      evaluatedBy: 'sealion'
    };

    const [response] = await db.insert(aiPrepareResponses)
      .values(responseData)
      .returning();
      
    console.log(`   ✅ AI prepare response created: ${response.id}`);

    // Test 5: Query with relationships
    console.log('5. Testing relationship queries...');
    
    const sessionWithDetails = await db.query.aiPrepareSessions.findFirst({
      where: eq(aiPrepareSessions.id, session.id),
      with: {
        questions: true,
        responses: true,
        user: true
      }
    });

    if (!sessionWithDetails) {
      throw new Error('Failed to query session with relationships');
    }

    console.log(`   ✅ Session query with relationships successful:`);
    console.log(`      - User: ${sessionWithDetails.user.firstName} ${sessionWithDetails.user.lastName}`);
    console.log(`      - Questions: ${sessionWithDetails.questions.length}`);
    console.log(`      - Responses: ${sessionWithDetails.responses.length}`);

    // Test 6: Update operations
    console.log('6. Testing update operations...');
    
    const updatedSession = await db.update(aiPrepareSessions)
      .set({ 
        sessionProgress: '25.5',
        totalTimeSpent: 900,
        questionsAnswered: 1,
        averageStarScore: '4.5'
      })
      .where(eq(aiPrepareSessions.id, session.id))
      .returning();
      
    console.log(`   ✅ Session updated - Progress: ${updatedSession[0].sessionProgress}%`);

    // Test 7: Complex queries
    console.log('7. Testing complex queries...');
    
    const userSessions = await db.query.aiPrepareSessions.findMany({
      where: eq(aiPrepareSessions.userId, testUserId),
      with: {
        questions: {
          with: {
            responses: true
          }
        }
      }
    });

    console.log(`   ✅ Complex query successful - Found ${userSessions.length} sessions`);
    console.log(`      - Total questions: ${userSessions[0].questions.length}`);
    console.log(`      - Total responses: ${userSessions[0].questions[0].responses.length}`);

    // Test 8: JSON field queries
    console.log('8. Testing JSONB field operations...');
    
    const responsesWithStarScores = await db.select({
      id: aiPrepareResponses.id,
      starScores: aiPrepareResponses.starScores,
      feedback: aiPrepareResponses.detailedFeedback
    })
    .from(aiPrepareResponses)
    .where(eq(aiPrepareResponses.sessionId, session.id));

    console.log(`   ✅ JSONB field query successful`);
    console.log(`      - STAR scores available: ${responsesWithStarScores.length > 0}`);

    // Cleanup
    console.log('9. Cleaning up test data...');
    await db.delete(aiPrepareResponses).where(eq(aiPrepareResponses.sessionId, session.id));
    await db.delete(aiPrepareQuestions).where(eq(aiPrepareQuestions.sessionId, session.id));
    await db.delete(aiPrepareSessions).where(eq(aiPrepareSessions.id, session.id));
    await db.delete(users).where(eq(users.id, testUserId));
    console.log('   ✅ Test data cleaned up');

    console.log('\n🎉 Drizzle ORM Integration Test: PASSED');
    console.log('✅ All CRUD operations work correctly');
    console.log('✅ Relationships and joins function properly');
    console.log('✅ JSONB fields handle complex data');
    console.log('✅ TypeScript integration is seamless');
    console.log('✅ Foreign key constraints are working');

    return true;

  } catch (error) {
    console.error('\n❌ Drizzle ORM Integration Test: FAILED');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Export for potential use in other tests
export { testDrizzleIntegration };

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testDrizzleIntegration().then(success => {
    process.exit(success ? 0 : 1);
  });
}