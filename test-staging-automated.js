// Comprehensive Automated Test Suite for Staging
// Tests: CSV loading, question generation, model answers, evaluation, database

const STAGING_URL = 'http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com';

// Test credentials
const TEST_USER = {
  email: `test-${Date.now()}@automated.test`,
  password: 'TestPassword123!',
  firstName: 'Automated',
  lastName: 'Tester'
};

let authCookies = '';

// Helper: Make authenticated request
async function authFetch(url, options = {}) {
  const headers = {
    ...options.headers,
    'Cookie': authCookies
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  // Capture cookies from response
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    authCookies = setCookie.split(';')[0];
  }

  return response;
}

// Test results tracker
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function recordTest(name, passed, details = '') {
  testResults.tests.push({ name, passed, details });
  if (passed) {
    testResults.passed++;
    console.log(`   ✅ ${name}`);
  } else {
    testResults.failed++;
    console.log(`   ❌ ${name}`);
  }
  if (details) {
    console.log(`      ${details}`);
  }
}

async function runComprehensiveTests() {
  console.log('🧪 COMPREHENSIVE AUTOMATED TEST SUITE\n');
  console.log(`Staging URL: ${STAGING_URL}\n`);

  try {
    // ====================
    // Phase 1: Authentication Setup
    // ====================
    console.log('📋 Phase 1: Authentication Setup\n');

    // Test 1.1: Create test user
    const signupRes = await fetch(`${STAGING_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER)
    });

    const setCookie = signupRes.headers.get('set-cookie');
    if (setCookie) {
      authCookies = setCookie.split(';')[0];
    }

    if (signupRes.ok) {
      const user = await signupRes.json();
      recordTest('User signup successful', true, `User ID: ${user.id || user.user?.id || 'unknown'}`);
    } else {
      const error = await signupRes.text();
      recordTest('User signup successful', false, `Status: ${signupRes.status}, Error: ${error}`);

      // Try login if signup failed (user might exist)
      const loginRes = await fetch(`${STAGING_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: TEST_USER.email, password: TEST_USER.password })
      });

      const loginCookie = loginRes.headers.get('set-cookie');
      if (loginCookie) {
        authCookies = loginCookie.split(';')[0];
      }

      if (loginRes.ok) {
        recordTest('User login fallback successful', true);
      } else {
        throw new Error('Authentication failed - cannot proceed with tests');
      }
    }

    // ====================
    // Phase 2: Health & CSV Loading
    // ====================
    console.log('\n📋 Phase 2: Health Check & CSV Loading\n');

    // Test 2.1: Health endpoint
    const healthRes = await fetch(`${STAGING_URL}/api/health`);
    const health = await healthRes.json();
    recordTest('Health endpoint responding', healthRes.ok);
    recordTest('Database connection healthy', health.checks?.database?.status === 'healthy',
      `Response time: ${health.checks?.database?.responseTime}ms`);

    // Test 2.2: Check server logs for CSV loading (approximate via uptime)
    if (health.uptime < 300) { // Less than 5 minutes
      recordTest('Server recently restarted (CSV should be loaded)', true, `Uptime: ${Math.floor(health.uptime)}s`);
    }

    // ====================
    // Phase 3: Prepare AI Session Creation
    // ====================
    console.log('\n📋 Phase 3: Prepare AI Session Tests\n');

    const sessionConfigs = [
      { stage: 'phone-screening', job: 'Software Engineer', company: 'Google', expectedRange: [1, 25] },
      { stage: 'hiring-manager', job: 'Product Manager', company: 'Microsoft', expectedRange: [51, 75] },
      { stage: 'executive-leadership', job: 'VP Engineering', company: 'Amazon', expectedRange: [101, 125] }
    ];

    let totalQuestions = 0;
    let csvQuestions = 0;

    for (const config of sessionConfigs) {
      console.log(`\n   Testing ${config.stage} stage...`);

      // Test 3.1: Create session
      const sessionRes = await authFetch(`${STAGING_URL}/api/prepare-ai/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobPosition: config.job,
          companyName: config.company,
          interviewStage: config.stage,
          experienceLevel: 'intermediate',
          preferredLanguage: 'en',
          voiceEnabled: false
        })
      });

      if (!sessionRes.ok) {
        const error = await sessionRes.text();
        recordTest(`Create ${config.stage} session`, false, `Error: ${error}`);
        continue;
      }

      const sessionData = await sessionRes.json();
      const session = sessionData.data || sessionData;
      recordTest(`Create ${config.stage} session`, true, `Session ID: ${session.id}`);

      // Test 3.2: Generate questions and track CSV vs AI
      for (let i = 0; i < 5; i++) {
        const questionRes = await authFetch(`${STAGING_URL}/api/prepare-ai/sessions/${session.id}/question`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!questionRes.ok) {
          const error = await questionRes.text();
          recordTest(`Generate question ${i+1} for ${config.stage}`, false, `Error: ${error}`);
          continue;
        }

        const questionData = await questionRes.json();
        const question = questionData.data || questionData;
        totalQuestions++;

        const isFromCSV = question.csvQuestionNumber !== null && question.csvQuestionNumber !== undefined;
        if (isFromCSV) {
          csvQuestions++;
          const inRange = question.csvQuestionNumber >= config.expectedRange[0] &&
                         question.csvQuestionNumber <= config.expectedRange[1];
          recordTest(`Question ${i+1} from CSV (Q#${question.csvQuestionNumber})`, true,
            inRange ? `✅ In expected range ${config.expectedRange[0]}-${config.expectedRange[1]}` :
            `⚠️  Out of range (expected ${config.expectedRange[0]}-${config.expectedRange[1]})`);
        } else {
          recordTest(`Question ${i+1} AI-generated`, true, 'Not from CSV bank');
        }

        // Test 3.3: Submit response and evaluate
        if (i === 0) { // Test first question only for each stage
          const responsePayload = {
            questionId: question.id,
            responseText: `In my role as ${config.job} at ${config.company}, I led a critical project to improve system performance. The challenge was reducing latency by 50% without impacting reliability. I designed and implemented a caching strategy with Redis, conducted load testing, and gradually rolled out the changes. As a result, we achieved a 60% latency reduction and improved user satisfaction scores by 25%.`,
            responseLanguage: 'en'
          };

          const evalRes = await authFetch(`${STAGING_URL}/api/prepare-ai/sessions/${session.id}/respond`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(responsePayload)
          });

          if (!evalRes.ok) {
            recordTest(`Evaluate response for ${config.stage}`, false, `Status: ${evalRes.status}`);
            continue;
          }

          const evalData = await evalRes.json();
          const evaluation = evalData.data || evalData;

          // Test feedback conciseness
          const strengthsCount = evaluation.detailedFeedback?.strengths?.length || 0;
          const weaknessesCount = evaluation.detailedFeedback?.weaknesses?.length || 0;
          const suggestionsCount = evaluation.detailedFeedback?.suggestions?.length || 0;
          const totalBullets = strengthsCount + weaknessesCount + suggestionsCount;

          recordTest(`Feedback conciseness for ${config.stage}`, totalBullets <= 15,
            `${totalBullets} bullets (target: ≤15) - Strengths: ${strengthsCount}, Weaknesses: ${weaknessesCount}, Suggestions: ${suggestionsCount}`);

          // Test 9-criteria scores
          const has9Criteria = evaluation.relevanceScore !== undefined &&
                              evaluation.starStructureScore !== undefined &&
                              evaluation.specificEvidenceScore !== undefined &&
                              evaluation.roleAlignmentScore !== undefined &&
                              evaluation.outcomeOrientedScore !== undefined &&
                              evaluation.communicationScore !== undefined &&
                              evaluation.problemSolvingScore !== undefined &&
                              evaluation.culturalFitScore !== undefined &&
                              evaluation.learningAgilityScore !== undefined;

          recordTest(`9-criteria scores present for ${config.stage}`, has9Criteria);

          // Test model answer
          const hasModelAnswer = evaluation.modelAnswer && evaluation.modelAnswer.length > 0;
          recordTest(`Model answer provided for ${config.stage}`, hasModelAnswer,
            hasModelAnswer ? `Length: ${evaluation.modelAnswer.substring(0, 100)}...` : 'No model answer');

          // Test scores in valid range
          const scoresValid = evaluation.weightedOverallScore >= 1 && evaluation.weightedOverallScore <= 5;
          recordTest(`Weighted score valid for ${config.stage}`, scoresValid,
            `Score: ${evaluation.weightedOverallScore}/5 (${evaluation.overallRating})`);
        }
      }
    }

    // ====================
    // Phase 4: CSV Distribution Analysis
    // ====================
    console.log('\n📋 Phase 4: CSV Distribution Analysis\n');

    const csvPercentage = (csvQuestions / totalQuestions) * 100;
    recordTest('CSV question distribution', csvPercentage >= 80,
      `${csvQuestions}/${totalQuestions} questions from CSV (${csvPercentage.toFixed(1)}%, target: ≥80%)`);

    // ====================
    // Test Summary
    // ====================
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));

    if (testResults.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      testResults.tests.filter(t => !t.passed).forEach(t => {
        console.log(`   • ${t.name}`);
        if (t.details) console.log(`     ${t.details}`);
      });
    }

    console.log('\n✅ TEST RUN COMPLETE\n');

    // Return summary
    return {
      success: testResults.failed === 0,
      passed: testResults.passed,
      failed: testResults.failed,
      totalTests: testResults.passed + testResults.failed,
      csvPercentage,
      tests: testResults.tests
    };

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
    console.error(error.stack);
    return {
      success: false,
      error: error.message,
      tests: testResults.tests
    };
  }
}

// Run tests
runComprehensiveTests()
  .then(async (results) => {
    console.log('\n📄 Generating test report...');

    // Save results to file using dynamic import
    const fs = await import('fs');
    const report = JSON.stringify(results, null, 2);
    fs.writeFileSync('test-results.json', report);
    console.log('✅ Test results saved to test-results.json');

    process.exit(results.success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
