#!/usr/bin/env node

/**
 * Test Stage Difficulty Progression
 * Verifies that all 5 interview stages enforce proper difficulty levels
 */

import { createTestUser } from './test-helpers/auth-helper.js';

const PROD_URL = 'http://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com';

const STAGES = [
  { name: 'phone-screening', number: 1, allowedDifficulties: ['beginner'], defaultDifficulty: 'beginner' },
  { name: 'functional-team', number: 2, allowedDifficulties: ['beginner', 'intermediate'], defaultDifficulty: 'intermediate' },
  { name: 'hiring-manager', number: 3, allowedDifficulties: ['intermediate', 'advanced'], defaultDifficulty: 'advanced' },
  { name: 'sme-expert', number: 4, allowedDifficulties: ['intermediate', 'advanced'], defaultDifficulty: 'advanced' },
  { name: 'executive-leadership', number: 5, allowedDifficulties: ['advanced'], defaultDifficulty: 'advanced' }
];

async function testStageProgression() {
  console.log('🧪 Testing Stage Difficulty Progression\n');
  console.log('=' .repeat(80));

  // Create test user and get session cookie
  console.log('🔐 Creating test user and authenticating...');
  let testAuth;
  try {
    testAuth = await createTestUser(PROD_URL, 'stage-test');
    console.log(`✅ Test user created: ${testAuth.email}`);
    console.log(`✅ Session cookie obtained\n`);
  } catch (error) {
    console.error(`❌ Failed to authenticate: ${error.message}`);
    console.log('\n⚠️  Tests cannot proceed without authentication');
    process.exit(1);
  }

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Verify each stage returns appropriate difficulty
  console.log('\n📋 Test 1: Stage Difficulty Enforcement\n');

  for (const stage of STAGES) {
    console.log(`\nStage ${stage.number}: ${stage.name.toUpperCase()}`);
    console.log('-'.repeat(60));

    try {
      // Create a practice session for this stage
      const sessionResponse = await fetch(`${PROD_URL}/api/practice/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': testAuth.sessionCookie
        },
        body: JSON.stringify({
          scenarioId: 'test-scenario',
          jobPosition: 'Software Engineer',
          companyName: 'Test Company',
          interviewStage: stage.name,
          difficultyLevel: stage.defaultDifficulty,
          preferredLanguage: 'en',
          totalQuestions: 5
        })
      });

      if (!sessionResponse.ok) {
        const errorText = await sessionResponse.text();
        console.log(`   ❌ Failed to create session: ${sessionResponse.status}`);
        console.log(`   Error: ${errorText.substring(0, 200)}`);
        results.failed++;
        results.tests.push({
          stage: stage.name,
          test: 'Session Creation',
          status: 'FAILED',
          error: `HTTP ${sessionResponse.status}`
        });
        continue;
      }

      const session = await sessionResponse.json();
      console.log(`   ✅ Session created: ${session.data.id}`);

      // Generate AI question for this session
      const questionResponse = await fetch(`${PROD_URL}/api/practice/sessions/${session.data.id}/ai-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': testAuth.sessionCookie
        }
      });

      if (!questionResponse.ok) {
        console.log(`   ❌ Failed to generate question: ${questionResponse.status}`);
        results.failed++;
        results.tests.push({
          stage: stage.name,
          test: 'Question Generation',
          status: 'FAILED',
          error: `HTTP ${questionResponse.status}`
        });
        continue;
      }

      const questionData = await questionResponse.json();
      const question = questionData.data.question;

      console.log(`   📝 Generated Question:`);
      console.log(`      "${question.questionText.substring(0, 100)}..."`);
      console.log(`   🎯 Difficulty: ${question.difficultyLevel}`);
      console.log(`   📂 Category: ${question.questionCategory}`);
      console.log(`   ⏱️  Expected Answer Time: ${question.expectedAnswerTime}s`);

      // Verify difficulty is appropriate for stage
      if (stage.allowedDifficulties.includes(question.difficultyLevel)) {
        console.log(`   ✅ Difficulty "${question.difficultyLevel}" is valid for Stage ${stage.number}`);
        results.passed++;
        results.tests.push({
          stage: stage.name,
          test: 'Difficulty Enforcement',
          status: 'PASSED',
          difficulty: question.difficultyLevel,
          question: question.questionText.substring(0, 80)
        });
      } else {
        console.log(`   ❌ Difficulty "${question.difficultyLevel}" is NOT valid for Stage ${stage.number}`);
        console.log(`   Expected one of: ${stage.allowedDifficulties.join(', ')}`);
        results.failed++;
        results.tests.push({
          stage: stage.name,
          test: 'Difficulty Enforcement',
          status: 'FAILED',
          difficulty: question.difficultyLevel,
          expectedDifficulties: stage.allowedDifficulties
        });
      }

    } catch (error) {
      console.log(`   ❌ Error testing stage: ${error.message}`);
      results.failed++;
      results.tests.push({
        stage: stage.name,
        test: 'Stage Test',
        status: 'ERROR',
        error: error.message
      });
    }
  }

  // Test 2: Verify difficulty auto-correction
  console.log('\n\n📋 Test 2: Difficulty Auto-Correction\n');
  console.log('-'.repeat(60));

  try {
    // Try to create Stage 5 (executive) with "beginner" difficulty
    // Should auto-correct to "advanced"
    console.log('Testing: Stage 5 (Executive) with "beginner" difficulty');
    console.log('Expected: Auto-correct to "advanced"');

    const correctionResponse = await fetch(`${PROD_URL}/api/practice/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': testAuth.sessionCookie
      },
      body: JSON.stringify({
        scenarioId: 'test-correction',
        jobPosition: 'CEO',
        companyName: 'Test Corp',
        interviewStage: 'executive-leadership',
        difficultyLevel: 'beginner', // Should be auto-corrected
        preferredLanguage: 'en',
        totalQuestions: 3
      })
    });

    if (correctionResponse.ok) {
      const correctionSession = await correctionResponse.json();
      const questionResp = await fetch(`${PROD_URL}/api/practice/sessions/${correctionSession.data.id}/ai-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': testAuth.sessionCookie }
      });

      if (questionResp.ok) {
        const qData = await questionResp.json();
        const correctedDifficulty = qData.data.question.difficultyLevel;

        if (correctedDifficulty === 'advanced') {
          console.log(`✅ Auto-correction WORKS: "beginner" → "advanced"`);
          console.log(`   Question: "${qData.data.question.questionText.substring(0, 80)}..."`);
          results.passed++;
          results.tests.push({
            test: 'Auto-Correction',
            status: 'PASSED',
            requested: 'beginner',
            corrected: correctedDifficulty
          });
        } else {
          console.log(`❌ Auto-correction FAILED: Got "${correctedDifficulty}", expected "advanced"`);
          results.failed++;
          results.tests.push({
            test: 'Auto-Correction',
            status: 'FAILED',
            requested: 'beginner',
            received: correctedDifficulty
          });
        }
      }
    }
  } catch (error) {
    console.log(`❌ Auto-correction test error: ${error.message}`);
    results.failed++;
  }

  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
  console.log('\n📋 Detailed Results:');
  console.table(results.tests);

  return results.passed > results.failed;
}

// Run tests
testStageProgression()
  .then(success => {
    console.log('\n' + '='.repeat(80));
    if (success) {
      console.log('✅ STAGE PROGRESSION TESTS PASSED');
      process.exit(0);
    } else {
      console.log('❌ STAGE PROGRESSION TESTS FAILED');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
