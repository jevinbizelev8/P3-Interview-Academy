// Production Smoke Test Suite
// Quick validation of critical functionality after deployment
// Expected Duration: ~2 minutes

const PRODUCTION_URL = 'http://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com';

// Use verified test account (email verification required for session creation)
// To use a new user (requires email verification): Set USE_VERIFIED_ACCOUNT=false
const USE_VERIFIED_ACCOUNT = process.env.USE_VERIFIED_ACCOUNT !== 'false';

// Test credentials
const TEST_USER = USE_VERIFIED_ACCOUNT ? {
  email: process.env.TEST_USER_EMAIL || 'jevin@bizelev8.ai',
  password: process.env.TEST_USER_PASSWORD || 'Interview@2025',
  isVerified: true
} : {
  email: `prod-test-${Date.now()}@smoke.test`,
  password: 'ProductionTest123!',
  firstName: 'Smoke',
  lastName: 'Test',
  isVerified: false
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

  // Properly parse set-cookie header (may contain multiple cookies)
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    // Handle multiple cookies separated by commas
    const cookies = setCookie.split(',').map(c => c.split(';')[0].trim());
    // Prioritize session cookie, fallback to first cookie
    const sessionCookie = cookies.find(c => c.startsWith('connect.sid='));
    authCookies = sessionCookie || cookies[0];
  }

  return response;
}

async function runSmokeTests() {
  console.log('🔥 PRODUCTION SMOKE TEST SUITE\n');
  console.log(`Production URL: ${PRODUCTION_URL}\n`);

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  function recordTest(name, passed, details = '') {
    results.tests.push({ name, passed, details });
    if (passed) {
      results.passed++;
      console.log(`   ✅ ${name}`);
    } else {
      results.failed++;
      console.log(`   ❌ ${name}`);
    }
    if (details) {
      console.log(`      ${details}`);
    }
  }

  try {
    // Test 1: Health Check
    console.log('📋 Test 1: System Health\n');
    const healthRes = await fetch(`${PRODUCTION_URL}/api/health`);
    const health = await healthRes.json();

    recordTest('Health endpoint responding', healthRes.ok);
    recordTest('Database connection healthy',
      health.checks?.database?.status === 'healthy',
      `Response time: ${health.checks?.database?.responseTime}ms`);
    recordTest('Server is running',
      health.uptime > 0,
      `Uptime: ${Math.floor(health.uptime)}s`);

    // Test 2: Authentication
    console.log('\n📋 Test 2: Authentication\n');

    if (TEST_USER.isVerified) {
      // Use login endpoint for verified accounts
      console.log('   Using verified account login...');
      const loginRes = await fetch(`${PRODUCTION_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: TEST_USER.email,
          password: TEST_USER.password
        })
      });

      const setCookie = loginRes.headers.get('set-cookie');
      if (setCookie) {
        const cookies = setCookie.split(',').map(c => c.split(';')[0].trim());
        const sessionCookie = cookies.find(c => c.startsWith('connect.sid='));
        authCookies = sessionCookie || cookies[0];
      }

      recordTest('User login successful',
        loginRes.ok,
        `Status: ${loginRes.status}, Email: ${TEST_USER.email}`);
    } else {
      // Use signup endpoint for new accounts
      console.log('   Creating new test account (requires email verification)...');
      const signupRes = await fetch(`${PRODUCTION_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(TEST_USER)
      });

      recordTest('User signup successful',
        signupRes.ok,
        `Status: ${signupRes.status} - NOTE: Email verification required for session creation`);

      if (!signupRes.ok) {
        console.log('   ⚠️  Cannot proceed with tests - signup failed');
        console.log('   💡 Use USE_VERIFIED_ACCOUNT=true or set TEST_USER_EMAIL/PASSWORD env vars');
        process.exit(1);
      }
    }

    // Test 3: Session Creation (One per stage)
    console.log('\n📋 Test 3: Session Creation\n');

    const stages = [
      { name: 'phone-screening', job: 'Software Engineer' },
      { name: 'hiring-manager', job: 'Product Manager' },
      { name: 'executive-leadership', job: 'VP Engineering' }
    ];

    const sessionIds = [];

    for (const stage of stages) {
      const sessionRes = await authFetch(`${PRODUCTION_URL}/api/prepare-ai/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobPosition: stage.job,
          companyName: 'Test Company',
          interviewStage: stage.name,
          experienceLevel: 'intermediate',
          preferredLanguage: 'en',
          voiceEnabled: false
        })
      });

      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        const session = sessionData.data || sessionData;
        sessionIds.push({ stage: stage.name, id: session.id });
        recordTest(`Create ${stage.name} session`, true, `ID: ${session.id}`);
      } else {
        recordTest(`Create ${stage.name} session`, false, `Status: ${sessionRes.status}`);
      }
    }

    // Test 4: Question Generation & Model Answers
    console.log('\n📋 Test 4: Question Generation & Model Answers\n');

    for (const { stage, id } of sessionIds) {
      // Generate question
      const questionRes = await authFetch(`${PRODUCTION_URL}/api/prepare-ai/sessions/${id}/question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!questionRes.ok) {
        recordTest(`Generate question for ${stage}`, false, `Status: ${questionRes.status}`);
        continue;
      }

      const questionData = await questionRes.json();
      const question = questionData.data || questionData;

      const isFromCSV = question.csvQuestionNumber !== null && question.csvQuestionNumber !== undefined;
      recordTest(`Question generated for ${stage}`, true,
        isFromCSV ? `CSV Q#${question.csvQuestionNumber}` : 'AI-generated');

      // Submit response
      const responsePayload = {
        questionId: question.id,
        responseText: `In my role as ${stage} candidate, I led a project to improve system performance. I designed a solution, implemented it with my team, and achieved a 40% improvement in efficiency with measurable business impact.`,
        responseLanguage: 'en'
      };

      const evalRes = await authFetch(`${PRODUCTION_URL}/api/prepare-ai/sessions/${id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(responsePayload)
      });

      if (!evalRes.ok) {
        recordTest(`Evaluate response for ${stage}`, false, `Status: ${evalRes.status}`);
        continue;
      }

      const evalData = await evalRes.json();
      const evaluation = evalData.data || evalData;

      // Check model answer
      const hasModelAnswer = evaluation.modelAnswer && evaluation.modelAnswer.length > 0;
      recordTest(`Model answer for ${stage}`, hasModelAnswer,
        hasModelAnswer ? `Length: ${evaluation.modelAnswer.length} chars` : 'Missing');

      // Check 9-criteria scores
      const has9Criteria = evaluation.relevanceScore !== undefined &&
                          evaluation.starStructureScore !== undefined &&
                          evaluation.weightedOverallScore !== undefined;
      recordTest(`9-criteria scores for ${stage}`, has9Criteria,
        has9Criteria ? `Weighted: ${evaluation.weightedOverallScore}/5` : 'Missing');

      // Check feedback conciseness
      const strengthsCount = evaluation.detailedFeedback?.strengths?.length || 0;
      const weaknessesCount = evaluation.detailedFeedback?.weaknesses?.length || 0;
      const suggestionsCount = evaluation.detailedFeedback?.suggestions?.length || 0;
      const totalBullets = strengthsCount + weaknessesCount + suggestionsCount;

      recordTest(`Feedback conciseness for ${stage}`, totalBullets <= 15,
        `${totalBullets} bullets (target: ≤15)`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SMOKE TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));

    if (results.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      results.tests.filter(t => !t.passed).forEach(t => {
        console.log(`   • ${t.name}`);
        if (t.details) console.log(`     ${t.details}`);
      });
    }

    console.log('\n✅ SMOKE TEST COMPLETE\n');

    // Exit with appropriate code
    process.exit(results.failed === 0 ? 0 : 1);

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run smoke tests
runSmokeTests();
