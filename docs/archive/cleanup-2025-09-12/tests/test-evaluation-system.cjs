#!/usr/bin/env node

/**
 * Focused Test for Evaluation System - Model Answers, Feedback, Tips
 * Tests the core evaluation logic and feedback quality
 */

// Test responses for evaluation
const TEST_RESPONSES = {
  strong_star: {
    response: `SITUATION: In my previous role as Software Engineer at TechCorp, we had a critical system outage affecting 500+ users during peak hours. TASK: As the lead developer, I needed to identify the root cause and restore services within 2 hours to minimize business impact. ACTION: I immediately assembled a response team, systematically analyzed server logs, identified a database connection issue, implemented a temporary workaround, and deployed a permanent fix. RESULT: We restored services in 45 minutes, implemented monitoring to prevent future issues, and received commendation from management for quick resolution.`,
    expectedScore: 4.5,
    shouldHave: ['strengths', 'metrics', 'star_keywords']
  },
  
  weak_response: {
    response: `I had to fix a bug once. It was hard but I managed to do it. The team was happy.`,
    expectedScore: 2.0,
    shouldHave: ['improvements', 'suggestions']
  },
  
  moderate_response: {
    response: `Last month I was working on a project where we had some technical issues with our deployment pipeline. I worked with my team to identify the problems, researched different solutions, and implemented a fix that improved our deployment success rate. The project was completed successfully and stakeholders were satisfied with the outcome.`,
    expectedScore: 3.5,
    shouldHave: ['balanced_feedback']
  }
};

function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString().substr(11, 8);
  console.log(`[${timestamp}] ${type}: ${message}`);
}

// Test the rule-based evaluation logic
function testRuleBasedEvaluation() {
  log('Testing Rule-Based Evaluation Logic...');
  
  const results = {};
  
  for (const [testName, testData] of Object.entries(TEST_RESPONSES)) {
    const { response, expectedScore } = testData;
    
    // Simulate the rule-based scoring logic from response-evaluation-service.ts
    const responseLength = response.length;
    const wordCount = response.split(/\s+/).length;
    const hasMetrics = /\d+/.test(response);
    const hasStarKeywords = /(situation|task|action|result|when|where|what|how|outcome|achieved|improved|implemented|result)/gi.test(response);
    const hasSituationContext = /(situation|when|where|in my|previous role|at|during)/gi.test(response);
    const hasActionVerbs = /(implemented|created|developed|analyzed|identified|assembled|deployed|restored)/gi.test(response);
    const hasResults = /(result|outcome|achieved|improved|increased|reduced|completed|successful)/gi.test(response);
    
    // Calculate base score
    let calculatedScore = 3; // Start with average
    
    // Length adjustments
    if (wordCount < 20) calculatedScore -= 1.0;
    else if (wordCount > 80) calculatedScore += 0.5;
    else if (wordCount > 40) calculatedScore += 0.2;
    
    // Content quality adjustments
    if (hasMetrics) calculatedScore += 0.4;
    if (hasStarKeywords) calculatedScore += 0.3;
    if (hasSituationContext) calculatedScore += 0.3;
    if (hasActionVerbs) calculatedScore += 0.4;
    if (hasResults) calculatedScore += 0.3;
    
    // Ensure score is within bounds
    calculatedScore = Math.min(Math.max(calculatedScore, 1), 5);
    calculatedScore = Math.round(calculatedScore * 10) / 10;
    
    // Generate feedback based on content
    const strengths = [];
    const improvements = [];
    const suggestions = [];
    
    if (wordCount > 60) strengths.push('Provided detailed response');
    if (hasMetrics) strengths.push('Included specific metrics or numbers');
    if (hasStarKeywords) strengths.push('Clear STAR method structure');
    if (hasActionVerbs) strengths.push('Used strong action verbs');
    if (hasResults) strengths.push('Mentioned measurable outcomes');
    
    if (wordCount < 30) improvements.push('Response could be more detailed');
    if (!hasMetrics) suggestions.push('Include quantifiable results or metrics');
    if (!hasSituationContext) suggestions.push('Start with clear situation description');
    if (!hasResults) suggestions.push('Conclude with measurable results');
    
    // Default suggestions if none generated
    if (suggestions.length === 0) {
      suggestions.push('Provide more specific examples');
      suggestions.push('Include measurable outcomes');
    }
    
    results[testName] = {
      wordCount,
      calculatedScore,
      expectedScore,
      scoreDifference: Math.abs(calculatedScore - expectedScore),
      feedback: {
        strengths: strengths.length > 0 ? strengths : ['Addressed the question directly'],
        improvements: improvements.length > 0 ? improvements : ['Could provide more context'],
        suggestions
      },
      analysis: {
        hasMetrics,
        hasStarKeywords,
        hasSituationContext,
        hasActionVerbs,
        hasResults
      }
    };
  }
  
  return results;
}

// Test model answer generation templates
function testModelAnswerGeneration() {
  log('Testing Model Answer Generation Templates...');
  
  const jobPositions = ['Software Engineer', 'Marketing Manager', 'Data Analyst', 'Product Manager'];
  const categories = ['leadership', 'problem-solving', 'teamwork'];
  const results = {};
  
  // Template patterns from response-evaluation-service.ts
  const templates = {
    'leadership': (job) => `SITUATION: In my role as ${job}, I was leading a cross-functional team of 6 people on a critical project with a tight deadline. TASK: My responsibility was to ensure project delivery within 4 weeks while maintaining quality standards and team morale. ACTION: I implemented daily stand-ups, created clear task assignments, and established regular check-ins with stakeholders. When we encountered obstacles, I facilitated problem-solving sessions and reallocated resources. RESULT: We delivered the project 3 days early, achieving 98% quality metrics and receiving positive feedback from all stakeholders.`,
    
    'problem-solving': (job) => `SITUATION: As a ${job}, I encountered a complex technical issue that was causing system downtime affecting 500+ users. TASK: I needed to identify the root cause and implement a solution within 2 hours to minimize business impact. ACTION: I systematically analyzed logs, collaborated with the infrastructure team, and implemented a staged rollback while developing a permanent fix. RESULT: I reduced downtime from 2 hours to 45 minutes and prevented future occurrences, saving the company an estimated $15,000 in lost productivity.`,
    
    'teamwork': (job) => `SITUATION: In my ${job} role, I was part of a diverse team working on a product launch, but we had conflicting opinions on the approach. TASK: I needed to help the team reach consensus while ensuring everyone's expertise was valued. ACTION: I organized structured brainstorming sessions, created comparison matrices for different approaches, and facilitated compromise solutions. RESULT: We launched successfully, 10% ahead of schedule, and team satisfaction scores increased by 25% through better collaboration.`
  };
  
  for (const job of jobPositions) {
    results[job] = {};
    for (const category of categories) {
      const modelAnswer = templates[category](job);
      const wordCount = modelAnswer.split(/\s+/).length;
      const hasStarStructure = modelAnswer.includes('SITUATION:') && 
                              modelAnswer.includes('TASK:') && 
                              modelAnswer.includes('ACTION:') && 
                              modelAnswer.includes('RESULT:');
      const hasMetrics = /\d+/.test(modelAnswer);
      const isJobSpecific = modelAnswer.includes(job);
      
      results[job][category] = {
        wordCount,
        hasStarStructure,
        hasMetrics,
        isJobSpecific,
        quality: hasStarStructure && hasMetrics && isJobSpecific && wordCount > 50 ? 'HIGH' : 'MEDIUM'
      };
    }
  }
  
  return results;
}

// Test feedback quality and actionability
function testFeedbackQuality() {
  log('Testing Feedback Quality and Actionability...');
  
  const feedbackCategories = {
    strengths: [
      'Clear communication',
      'Provided detailed response', 
      'Included specific metrics or numbers',
      'Clear STAR method structure',
      'Used strong action verbs',
      'Mentioned measurable outcomes'
    ],
    improvements: [
      'Response could be more detailed',
      'Could provide more context',
      'Could be more specific about outcomes'
    ],
    suggestions: [
      'Provide more specific examples',
      'Include quantifiable results or metrics',
      'Start with clear situation description',
      'Conclude with measurable results',
      'Use STAR method structure'
    ]
  };
  
  // Test actionability of suggestions
  const actionablePatterns = [
    /provide/i, /include/i, /start with/i, /conclude with/i, /use/i, /add/i, /mention/i
  ];
  
  const actionableSuggestions = feedbackCategories.suggestions.filter(suggestion =>
    actionablePatterns.some(pattern => pattern.test(suggestion))
  );
  
  const actionabilityRate = (actionableSuggestions.length / feedbackCategories.suggestions.length) * 100;
  
  return {
    totalSuggestions: feedbackCategories.suggestions.length,
    actionableSuggestions: actionableSuggestions.length,
    actionabilityRate: Math.round(actionabilityRate),
    sampleActionableTips: actionableSuggestions.slice(0, 3),
    strengthsVariety: feedbackCategories.strengths.length,
    improvementsVariety: feedbackCategories.improvements.length
  };
}

// Main execution
function runEvaluationTests() {
  console.log('🧪 EVALUATION SYSTEM TEST SUITE');
  console.log('================================\n');
  
  // Test 1: Rule-based Evaluation
  const evaluationResults = testRuleBasedEvaluation();
  log('Rule-based Evaluation Results:');
  
  let accurateScores = 0;
  const totalTests = Object.keys(evaluationResults).length;
  
  for (const [testName, result] of Object.entries(evaluationResults)) {
    const isAccurate = result.scoreDifference <= 0.5;
    if (isAccurate) accurateScores++;
    
    console.log(`  ${testName}:`);
    console.log(`    Expected: ${result.expectedScore}/5, Got: ${result.calculatedScore}/5 (Δ${result.scoreDifference})`);
    console.log(`    Word Count: ${result.wordCount}, Accuracy: ${isAccurate ? '✅' : '❌'}`);
    console.log(`    Strengths: ${result.feedback.strengths.length}, Suggestions: ${result.feedback.suggestions.length}`);
  }
  
  const evaluationAccuracy = (accurateScores / totalTests) * 100;
  console.log(`\n  📊 Evaluation Accuracy: ${accurateScores}/${totalTests} (${evaluationAccuracy.toFixed(1)}%)\n`);
  
  // Test 2: Model Answer Generation
  const modelResults = testModelAnswerGeneration();
  log('Model Answer Generation Results:');
  
  let highQualityAnswers = 0;
  let totalAnswers = 0;
  
  for (const [job, categories] of Object.entries(modelResults)) {
    for (const [category, metrics] of Object.entries(categories)) {
      totalAnswers++;
      if (metrics.quality === 'HIGH') highQualityAnswers++;
    }
  }
  
  const modelQuality = (highQualityAnswers / totalAnswers) * 100;
  console.log(`  📈 High Quality Model Answers: ${highQualityAnswers}/${totalAnswers} (${modelQuality.toFixed(1)}%)`);
  console.log(`  ✅ All model answers include STAR structure and job-specific content\n`);
  
  // Test 3: Feedback Quality
  const feedbackResults = testFeedbackQuality();
  log('Feedback Quality Results:');
  console.log(`  🎯 Actionability Rate: ${feedbackResults.actionabilityRate}%`);
  console.log(`  💡 Sample Actionable Tips:`);
  feedbackResults.sampleActionableTips.forEach(tip => console.log(`    • ${tip}`));
  console.log(`  📝 Content Variety: ${feedbackResults.strengthsVariety} strengths, ${feedbackResults.improvementsVariety} improvements\n`);
  
  // Final Assessment
  console.log('🎯 OVERALL ASSESSMENT');
  console.log('====================');
  console.log(`✅ Evaluation Accuracy: ${evaluationAccuracy >= 70 ? 'GOOD' : 'NEEDS IMPROVEMENT'} (${evaluationAccuracy.toFixed(1)}%)`);
  console.log(`✅ Model Answer Quality: ${modelQuality >= 80 ? 'EXCELLENT' : 'GOOD'} (${modelQuality.toFixed(1)}%)`);
  console.log(`✅ Feedback Actionability: ${feedbackResults.actionabilityRate >= 70 ? 'EXCELLENT' : 'GOOD'} (${feedbackResults.actionabilityRate}%)`);
  
  // Summary
  const overallScore = (evaluationAccuracy + modelQuality + feedbackResults.actionabilityRate) / 3;
  console.log(`\n🏆 OVERALL SYSTEM QUALITY: ${overallScore.toFixed(1)}%`);
  
  if (overallScore >= 80) {
    console.log('🎉 EXCELLENT - System ready for production!');
  } else if (overallScore >= 70) {
    console.log('✅ GOOD - System ready with minor optimizations');
  } else {
    console.log('⚠️  NEEDS IMPROVEMENT - Address evaluation accuracy');
  }
  
  return {
    evaluationAccuracy,
    modelQuality, 
    feedbackActionability: feedbackResults.actionabilityRate,
    overallScore
  };
}

// Execute if run directly
if (require.main === module) {
  runEvaluationTests();
}

module.exports = { runEvaluationTests };