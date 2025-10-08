// Test script for staging model answer integration
// Tests: CSV loading, question generation, model answers

const STAGING_URL = 'http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com';

async function testModelAnswerIntegration() {
  console.log('🧪 Testing Model Answer Integration on Staging\n');

  // Test 1: Health check
  console.log('1️⃣ Testing health endpoint...');
  const healthRes = await fetch(`${STAGING_URL}/api/health`);
  const health = await healthRes.json();
  console.log(`   ✅ Health: ${health.status}`);
  console.log(`   ✅ Database: ${health.checks.database.status} (${health.checks.database.responseTime}ms)`);
  console.log(`   ✅ Uptime: ${Math.floor(health.uptime)}s\n`);

  // Test 2: Create Prepare AI session
  console.log('2️⃣ Creating Prepare AI session...');
  const sessionPayload = {
    jobPosition: 'Senior Software Engineer',
    companyName: 'Google',
    interviewStage: 'hiring-manager', // Q51-Q75
    preferredLanguage: 'en',
    voiceEnabled: false
  };

  const sessionRes = await fetch(`${STAGING_URL}/api/prepare-ai/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sessionPayload)
  });

  if (!sessionRes.ok) {
    console.error(`   ❌ Session creation failed: ${sessionRes.status}`);
    const error = await sessionRes.text();
    console.error(`   Error: ${error}`);
    return;
  }

  const session = await sessionRes.json();
  console.log(`   ✅ Session created: ${session.id}`);
  console.log(`   ✅ Stage: ${session.interviewStage}`);
  console.log(`   ✅ Position: ${session.jobPosition}\n`);

  // Test 3: Generate 5 questions and track CSV vs AI
  console.log('3️⃣ Generating 5 questions to test CSV usage...');
  let csvCount = 0;
  let aiCount = 0;
  const questions = [];

  for (let i = 0; i < 5; i++) {
    const questionRes = await fetch(`${STAGING_URL}/api/prepare-ai/sessions/${session.id}/question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!questionRes.ok) {
      console.error(`   ❌ Question ${i+1} generation failed: ${questionRes.status}`);
      continue;
    }

    const question = await questionRes.json();
    questions.push(question);

    const isFromCSV = question.csvQuestionNumber !== null && question.csvQuestionNumber !== undefined;
    if (isFromCSV) {
      csvCount++;
      console.log(`   ✅ Q${i+1}: FROM CSV (Q#${question.csvQuestionNumber}, Stage: ${question.csvQuestionStage})`);
    } else {
      aiCount++;
      console.log(`   ℹ️  Q${i+1}: AI Generated`);
    }
    console.log(`      Question: "${question.questionText.substring(0, 80)}..."`);
  }

  console.log(`\n   📊 Results: ${csvCount} from CSV (${csvCount/5*100}%), ${aiCount} AI-generated (${aiCount/5*100}%)`);

  if (csvCount >= 4) {
    console.log(`   ✅ PASS: 80%+ questions from CSV bank (target: 80%, actual: ${csvCount/5*100}%)\n`);
  } else {
    console.log(`   ⚠️  WARNING: Less than 80% from CSV bank (target: 80%, actual: ${csvCount/5*100}%)\n`);
  }

  // Test 4: Submit response and check model answer
  if (questions.length > 0) {
    console.log('4️⃣ Testing response evaluation and model answer...');
    const testQuestion = questions[0];

    const responsePayload = {
      questionId: testQuestion.id,
      responseText: `In my previous role as a Senior Software Engineer at Amazon, I was responsible for leading the migration of our legacy monolith to microservices. The main challenge was ensuring zero downtime during the transition while maintaining data consistency. I designed a phased migration strategy using the strangler fig pattern, starting with non-critical services. I implemented comprehensive monitoring and rollback procedures. As a result, we successfully migrated 15 services over 6 months with 99.99% uptime and reduced deployment time from 2 hours to 15 minutes.`,
      responseLanguage: 'en'
    };

    const evalRes = await fetch(`${STAGING_URL}/api/prepare-ai/sessions/${session.id}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(responsePayload)
    });

    if (!evalRes.ok) {
      console.error(`   ❌ Evaluation failed: ${evalRes.status}`);
      const error = await evalRes.text();
      console.error(`   Error: ${error}`);
      return;
    }

    const evaluation = await evalRes.json();
    console.log(`   ✅ Evaluation completed`);
    console.log(`   ✅ STAR Score: ${evaluation.starScores.overall}/5`);
    console.log(`   ✅ Weighted Overall: ${evaluation.weightedOverallScore}/5 (${evaluation.overallRating})`);

    // Check feedback conciseness
    const strengthsLines = evaluation.detailedFeedback.strengths.length;
    const weaknessesLines = evaluation.detailedFeedback.weaknesses.length;
    const suggestionsLines = evaluation.detailedFeedback.suggestions.length;

    console.log(`\n   📝 Feedback Analysis:`);
    console.log(`      Strengths: ${strengthsLines} bullet points`);
    console.log(`      Weaknesses: ${weaknessesLines} bullet points`);
    console.log(`      Suggestions: ${suggestionsLines} bullet points`);

    const totalBullets = strengthsLines + weaknessesLines + suggestionsLines;
    if (totalBullets <= 15) {
      console.log(`   ✅ PASS: Feedback is concise (${totalBullets} total bullets, target: ≤15)\n`);
    } else {
      console.log(`   ⚠️  WARNING: Feedback may be too lengthy (${totalBullets} bullets, target: ≤15)\n`);
    }

    // Check model answer
    if (evaluation.modelAnswer && evaluation.modelAnswer.length > 0) {
      console.log(`   📚 Model Answer:`);
      const modelAnswerPreview = evaluation.modelAnswer.substring(0, 150);
      console.log(`      "${modelAnswerPreview}..."`);

      if (testQuestion.csvQuestionNumber) {
        console.log(`   ✅ PASS: Model answer provided for CSV question Q#${testQuestion.csvQuestionNumber}\n`);
      } else {
        console.log(`   ℹ️  Model answer generated for AI question\n`);
      }
    } else {
      console.log(`   ⚠️  WARNING: No model answer provided\n`);
    }

    // Display 9-criteria scores
    console.log(`   🎯 9-Criteria Evaluation Scores:`);
    console.log(`      1. Relevance: ${evaluation.relevanceScore}/5`);
    console.log(`      2. STAR Structure: ${evaluation.starStructureScore}/5`);
    console.log(`      3. Specific Evidence: ${evaluation.specificEvidenceScore}/5`);
    console.log(`      4. Role Alignment: ${evaluation.roleAlignmentScore}/5`);
    console.log(`      5. Outcome Oriented: ${evaluation.outcomeOrientedScore}/5`);
    console.log(`      6. Communication: ${evaluation.communicationScore}/5`);
    console.log(`      7. Problem Solving: ${evaluation.problemSolvingScore}/5`);
    console.log(`      8. Cultural Fit: ${evaluation.culturalFitScore}/5`);
    console.log(`      9. Learning Agility: ${evaluation.learningAgilityScore}/5\n`);
  }

  console.log('✅ Model Answer Integration Test Complete!\n');
}

// Run tests
testModelAnswerIntegration().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
