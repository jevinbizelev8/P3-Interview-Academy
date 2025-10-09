// Diagnose CSV Loading in Staging
// Tests: How many CSV questions are actually loaded by stage

const STAGING_URL = 'http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com';

async function diagn ose() {
  console.log('🔍 CSV LOADING DIAGNOSTIC\n');
  console.log(`Staging URL: ${STAGING_URL}\n`);

  // Test: Generate multiple questions per stage and count CSV vs AI
  const stages = [
    { name: 'phone-screening', expectedRange: [1, 25] },
    { name: 'functional-team', expectedRange: [26, 50] },
    { name: 'hiring-manager', expectedRange: [51, 75] },
    { name: 'sme-expert', expectedRange: [76, 100] },
    { name: 'executive-leadership', expectedRange: [101, 125] }
  ];

  const results = {};

  for (const stage of stages) {
    console.log(`\n📊 Testing ${stage.name}...`);

    const csvCount = { total: 0, csv: 0, ai: 0, csvNumbers: [] };

    // Try 20 times to get a good sample
    for (let i = 0; i < 20; i++) {
      try {
        // Create a test session (no auth needed for this diagnostic)
        const sessionRes = await fetch(`${STAGING_URL}/api/prepare-ai/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobPosition: `Test ${stage.name}`,
            companyName: 'Test Company',
            interviewStage: stage.name,
            experienceLevel: 'intermediate',
            preferredLanguage: 'en',
            voiceEnabled: false
          })
        });

        if (!sessionRes.ok) {
          console.log(`   ❌ Session creation failed for ${stage.name}`);
          break;
        }

        const sessionData = await sessionRes.json();
        const session = sessionData.data || sessionData;

        // Generate a question
        const questionRes = await fetch(`${STAGING_URL}/api/prepare-ai/sessions/${session.id}/question`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (questionRes.ok) {
          const questionData = await questionRes.json();
          const question = questionData.data || questionData;

          csvCount.total++;
          if (question.csvQuestionNumber) {
            csvCount.csv++;
            csvCount.csvNumbers.push(question.csvQuestionNumber);
          } else {
            csvCount.ai++;
          }
        }

      } catch (error) {
        console.log(`   ⚠️  Request ${i+1} failed:`, error.message);
      }
    }

    results[stage.name] = csvCount;

    const csvPercentage = csvCount.total > 0 ? (csvCount.csv / csvCount.total * 100).toFixed(1) : 0;
    console.log(`   Total: ${csvCount.total}, CSV: ${csvCount.csv} (${csvPercentage}%), AI: ${csvCount.ai}`);

    if (csvCount.csvNumbers.length > 0) {
      const uniqueNumbers = [...new Set(csvCount.csvNumbers)].sort((a, b) => a - b);
      console.log(`   CSV Q# seen: ${uniqueNumbers.join(', ')}`);

      const inRange = uniqueNumbers.filter(q => q >= stage.expectedRange[0] && q <= stage.expectedRange[1]);
      const outRange = uniqueNumbers.filter(q => q < stage.expectedRange[0] || q > stage.expectedRange[1]);

      if (inRange.length > 0) {
        console.log(`   ✅ In range (${stage.expectedRange[0]}-${stage.expectedRange[1]}): ${inRange.length} unique questions`);
      }
      if (outRange.length > 0) {
        console.log(`   ⚠️  Out of range: ${outRange.join(', ')}`);
      }
    } else {
      console.log(`   ❌ NO CSV QUESTIONS LOADED for ${stage.name}`);
    }
  }

  console.log('\n\n============================================================');
  console.log('📊 SUMMARY');
  console.log('============================================================\n');

  for (const [stageName, counts] of Object.entries(results)) {
    const percentage = counts.total > 0 ? (counts.csv / counts.total * 100).toFixed(1) : 0;
    const status = counts.csv > 0 ? '✅' : '❌';
    console.log(`${status} ${stageName.padEnd(25)} ${counts.csv}/${counts.total} CSV (${percentage}%)`);
  }

  console.log('\n');
}

diagnose().catch(error => {
  console.error('❌ Diagnostic failed:', error);
  process.exit(1);
});
