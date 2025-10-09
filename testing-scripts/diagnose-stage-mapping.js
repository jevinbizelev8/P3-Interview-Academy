// Diagnostic script to investigate CSV stage mapping issue
// Tests why hiring-manager and executive-leadership get 0% CSV questions

const STAGING_URL = 'http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com';

async function testStageMapping() {
  console.log('🔍 DIAGNOSING CSV STAGE MAPPING ISSUE\n');
  console.log(`Staging URL: ${STAGING_URL}\n`);

  // Test credentials
  const TEST_USER = {
    email: `test-diagnostic-${Date.now()}@test.com`,
    password: 'TestPassword123!',
    firstName: 'Diagnostic',
    lastName: 'Test'
  };

  let authCookies = '';

  try {
    // Step 1: Authenticate
    console.log('📋 Step 1: Authentication');
    const signupRes = await fetch(`${STAGING_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER)
    });

    const setCookie = signupRes.headers.get('set-cookie');
    if (setCookie) {
      authCookies = setCookie.split(';')[0];
    }

    if (!signupRes.ok) {
      throw new Error(`Authentication failed: ${signupRes.status}`);
    }
    console.log('   ✅ Authenticated\n');

    // Step 2: Test each stage
    const stages = [
      { name: 'phone-screening', expectedRange: [1, 25] },
      { name: 'hiring-manager', expectedRange: [51, 75] },
      { name: 'executive-leadership', expectedRange: [101, 125] }
    ];

    for (const stage of stages) {
      console.log(`📊 Testing Stage: ${stage.name}`);
      console.log(`   Expected Q# range: ${stage.expectedRange[0]}-${stage.expectedRange[1]}`);

      // Create session
      const sessionRes = await fetch(`${STAGING_URL}/api/prepare-ai/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookies
        },
        body: JSON.stringify({
          jobPosition: 'Test Engineer',
          companyName: 'Test Company',
          interviewStage: stage.name,
          experienceLevel: 'intermediate',
          preferredLanguage: 'en',
          voiceEnabled: false
        })
      });

      if (!sessionRes.ok) {
        console.log(`   ❌ Session creation failed: ${sessionRes.status}`);
        continue;
      }

      const sessionData = await sessionRes.json();
      const session = sessionData.data || sessionData;
      console.log(`   ✅ Session created: ${session.id}`);

      // Generate 10 questions to get better sample
      const csvQuestions = [];
      const aiQuestions = [];

      for (let i = 0; i < 10; i++) {
        const questionRes = await fetch(`${STAGING_URL}/api/prepare-ai/sessions/${session.id}/question`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': authCookies
          }
        });

        if (!questionRes.ok) {
          console.log(`   ❌ Question ${i+1} generation failed: ${questionRes.status}`);
          continue;
        }

        const questionData = await questionRes.json();
        const question = questionData.data || questionData;

        const isFromCSV = question.csvQuestionNumber !== null && question.csvQuestionNumber !== undefined;

        if (isFromCSV) {
          csvQuestions.push({
            number: i + 1,
            csvQNumber: question.csvQuestionNumber,
            stage: question.csvQuestionStage,
            text: question.questionText.substring(0, 60) + '...'
          });
        } else {
          aiQuestions.push({
            number: i + 1,
            text: question.questionText.substring(0, 60) + '...'
          });
        }
      }

      // Report results
      const csvPercentage = (csvQuestions.length / 10) * 100;
      console.log(`   📈 CSV Questions: ${csvQuestions.length}/10 (${csvPercentage}%)`);

      if (csvQuestions.length > 0) {
        console.log(`   📋 CSV Questions Found:`);
        csvQuestions.forEach(q => {
          const inRange = q.csvQNumber >= stage.expectedRange[0] && q.csvQNumber <= stage.expectedRange[1];
          const rangeStatus = inRange ? '✅' : '⚠️ OUT OF RANGE';
          console.log(`      Q${q.number}: CSV Q#${q.csvQNumber} (stage: ${q.stage}) ${rangeStatus}`);
        });
      } else {
        console.log(`   ⚠️ NO CSV QUESTIONS FOUND - All 10 were AI-generated`);
      }

      console.log(`   🤖 AI Questions: ${aiQuestions.length}/10 (${100 - csvPercentage}%)`);
      console.log();
    }

    console.log('✅ DIAGNOSTIC COMPLETE\n');

    // Summary
    console.log('🎯 ANALYSIS:');
    console.log('If phone-screening has CSV questions but hiring-manager/executive do not,');
    console.log('the issue is likely:');
    console.log('1. CSV parsing failed for sections 3 and 5 (hiring-manager/executive)');
    console.log('2. Stage names in CSV dont match expected names');
    console.log('3. Question lookup is failing for those specific stages');
    console.log('4. CSV data was only partially loaded\n');

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error.stack);
  }
}

// Run diagnostic
testStageMapping()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
