// Diagnostic script to test 9-criteria evaluation response
const STAGING_URL = 'http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com';

async function test9CriteriaResponse() {
  console.log('🔍 Testing 9-Criteria Evaluation Response\n');

  try {
    // 1. Create test user
    const signupRes = await fetch(`${STAGING_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test-9criteria-${Date.now()}@test.com`,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User'
      })
    });

    const setCookie = signupRes.headers.get('set-cookie');
    const authCookies = setCookie ? setCookie.split(';')[0] : '';

    if (!signupRes.ok) {
      console.error('❌ Signup failed:', await signupRes.text());
      return;
    }

    console.log('✅ User created and authenticated\n');

    // 2. Create a session
    const sessionRes = await fetch(`${STAGING_URL}/api/prepare-ai/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookies
      },
      body: JSON.stringify({
        jobPosition: 'Software Engineer',
        companyName: 'Google',
        interviewStage: 'phone-screening',
        experienceLevel: 'intermediate',
        preferredLanguage: 'en',
        voiceEnabled: false
      })
    });

    if (!sessionRes.ok) {
      console.error('❌ Session creation failed:', await sessionRes.text());
      return;
    }

    const sessionData = await sessionRes.json();
    const session = sessionData.data || sessionData;
    console.log(`✅ Session created: ${session.id}\n`);

    // 3. Generate a question
    const questionRes = await fetch(`${STAGING_URL}/api/prepare-ai/sessions/${session.id}/question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookies
      }
    });

    if (!questionRes.ok) {
      console.error('❌ Question generation failed:', await questionRes.text());
      return;
    }

    const questionData = await questionRes.json();
    const question = questionData.data || questionData;
    console.log(`✅ Question generated: ${question.id}\n`);
    console.log(`Question: ${question.questionText}\n`);

    // 4. Submit a response and get evaluation
    const responsePayload = {
      questionId: question.id,
      responseText: `In my role as a Software Engineer at Google, I led a critical project to improve system performance. The challenge was reducing latency by 50% without impacting reliability. I designed and implemented a caching strategy with Redis, conducted load testing, and gradually rolled out the changes. As a result, we achieved a 60% latency reduction and improved user satisfaction scores by 25%.`,
      responseLanguage: 'en'
    };

    const evalRes = await fetch(`${STAGING_URL}/api/prepare-ai/sessions/${session.id}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookies
      },
      body: JSON.stringify(responsePayload)
    });

    if (!evalRes.ok) {
      console.error('❌ Evaluation failed:', await evalRes.text());
      return;
    }

    const evalData = await evalRes.json();
    const evaluation = evalData.data || evalData;

    console.log('📊 EVALUATION RESPONSE STRUCTURE:\n');
    console.log('Response keys:', Object.keys(evaluation).join(', '), '\n');

    // Check 9-criteria scores
    console.log('🎯 9-CRITERIA SCORES:');
    console.log(`  relevanceScore: ${evaluation.relevanceScore} (type: ${typeof evaluation.relevanceScore})`);
    console.log(`  starStructureScore: ${evaluation.starStructureScore} (type: ${typeof evaluation.starStructureScore})`);
    console.log(`  specificEvidenceScore: ${evaluation.specificEvidenceScore} (type: ${typeof evaluation.specificEvidenceScore})`);
    console.log(`  roleAlignmentScore: ${evaluation.roleAlignmentScore} (type: ${typeof evaluation.roleAlignmentScore})`);
    console.log(`  outcomeOrientedScore: ${evaluation.outcomeOrientedScore} (type: ${typeof evaluation.outcomeOrientedScore})`);
    console.log(`  communicationScore: ${evaluation.communicationScore} (type: ${typeof evaluation.communicationScore})`);
    console.log(`  problemSolvingScore: ${evaluation.problemSolvingScore} (type: ${typeof evaluation.problemSolvingScore})`);
    console.log(`  culturalFitScore: ${evaluation.culturalFitScore} (type: ${typeof evaluation.culturalFitScore})`);
    console.log(`  learningAgilityScore: ${evaluation.learningAgilityScore} (type: ${typeof evaluation.learningAgilityScore})`);
    console.log(`\n  weightedOverallScore: ${evaluation.weightedOverallScore} (type: ${typeof evaluation.weightedOverallScore})`);
    console.log(`  overallRating: ${evaluation.overallRating} (type: ${typeof evaluation.overallRating})`);

    console.log('\n📋 OTHER FIELDS:');
    console.log(`  detailedFeedback: ${evaluation.detailedFeedback ? 'Present' : 'Missing'}`);
    console.log(`  modelAnswer: ${evaluation.modelAnswer ? `Present (${evaluation.modelAnswer.substring(0, 50)}...)` : 'Missing'}`);
    console.log(`  starScores: ${evaluation.starScores ? 'Present' : 'Missing'}`);

    console.log('\n✅ DIAGNOSTIC COMPLETE\n');

    // Dump full response for debugging
    console.log('Full evaluation response:');
    console.log(JSON.stringify(evaluation, null, 2));

  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
  }
}

test9CriteriaResponse();
