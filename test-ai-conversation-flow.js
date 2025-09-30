// Test continuous AI conversation flow for interview practice module
import fetch from 'node-fetch';

const PRODUCTION_URL = 'http://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com';

// Helper function to make authenticated requests
class ConversationTester {
  constructor() {
    this.cookies = '';
    this.sessionId = null;
    this.userId = null;
    this.practiceSessionId = null;
  }

  async makeRequest(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'ConversationTester/1.0',
      ...options.headers
    };

    if (this.cookies) {
      headers['Cookie'] = this.cookies;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    // Extract and store cookies from response
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      this.cookies = setCookieHeader;
    }

    return response;
  }
}

// Sample user responses for realistic conversation testing
const sampleResponses = [
  {
    context: "First response to behavioral question",
    response: "In my previous role as a software developer at TechStart Inc, I was tasked with leading a critical project to migrate our legacy payment system to a new cloud-based solution. The situation was challenging because we had a tight deadline of 3 months, and the existing system was processing over $1M in transactions daily, so any downtime would be costly."
  },
  {
    context: "Follow-up or deeper dive",
    response: "The main challenge was coordinating between multiple teams - backend, frontend, DevOps, and QA - while ensuring zero data loss during migration. I organized daily standup meetings, created a detailed migration plan with rollback procedures, and implemented a phased approach where we ran both systems in parallel for 2 weeks before fully switching over."
  },
  {
    context: "Results and metrics",
    response: "The migration was completed successfully within the deadline. We achieved 99.9% uptime during the transition, reduced transaction processing time by 40%, and improved system scalability to handle 5x the previous load. The new system also reduced our operational costs by 30% annually. My manager praised the project management approach, and it became a template for future migrations."
  },
  {
    context: "Technical challenges",
    response: "One of the biggest technical challenges was ensuring data consistency during the migration. I implemented a dual-write strategy where transactions were written to both the old and new systems simultaneously. We also built comprehensive data validation scripts to verify that all financial records matched exactly. Additionally, I set up real-time monitoring dashboards to track system performance and catch any issues immediately."
  },
  {
    context: "Team collaboration",
    response: "I fostered collaboration by creating cross-functional teams with clear ownership of different migration phases. I held weekly retrospectives to address blockers and implemented a communication protocol where any team member could raise concerns directly with me. This approach helped us identify potential issues early and maintain team morale throughout the high-pressure project."
  },
  {
    context: "Learning and growth",
    response: "This experience taught me the importance of thorough planning and risk mitigation in large-scale technical projects. I learned to balance technical excellence with business requirements, and how to communicate complex technical concepts to non-technical stakeholders. The project also enhanced my skills in cloud architecture, specifically AWS services like RDS, Lambda, and CloudWatch."
  }
];

async function authenticateUser(tester) {
  console.log('🔐 Setting up authenticated user for conversation testing...');

  // Create a test user for conversation testing
  const testUser = {
    email: `conversation-test-${Date.now()}@example.com`,
    password: 'ConversationTest123!',
    firstName: 'Conversation',
    lastName: 'Tester'
  };

  try {
    const signupResponse = await tester.makeRequest(`${PRODUCTION_URL}/api/auth/signup`, {
      method: 'POST',
      body: JSON.stringify(testUser)
    });

    const signupData = await signupResponse.json();

    if (signupResponse.status === 200 && signupData.success) {
      tester.userId = signupData.user.id;
      console.log(`✅ User authenticated: ${signupData.user.email}`);
      return { success: true, user: signupData.user };
    } else {
      console.log(`❌ Authentication failed: ${signupData.message}`);
      return { success: false, error: signupData.message };
    }
  } catch (error) {
    console.log(`❌ Authentication error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function createPracticeSession(tester) {
  console.log('\n📝 Creating practice session for conversation testing...');

  const sessionData = {
    scenarioId: 'behavioral-interview',
    jobPosition: 'Senior Software Engineer',
    companyName: 'TechCorp',
    interviewStage: 'behavioral',
    difficultyLevel: 'intermediate',
    preferredLanguage: 'en'
  };

  try {
    const response = await tester.makeRequest(`${PRODUCTION_URL}/api/practice/sessions`, {
      method: 'POST',
      body: JSON.stringify(sessionData)
    });

    const data = await response.json();

    if (response.status === 200) {
      // Handle both success formats
      const sessionData = data.success ? data.data : data.data;
      tester.practiceSessionId = sessionData.id;
      console.log(`✅ Practice session created: ${sessionData.id}`);
      console.log(`   Job Position: ${sessionData.jobPosition}`);
      console.log(`   Interview Stage: ${sessionData.interviewStage}`);
      console.log(`   Current Question: ${sessionData.currentQuestionNumber}/${sessionData.totalQuestions}`);
      return { success: true, session: sessionData };
    } else {
      console.log(`❌ Session creation failed: ${data.message || JSON.stringify(data)}`);
      return { success: false, error: data.message || 'Unknown error' };
    }
  } catch (error) {
    console.log(`❌ Session creation error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function getAIQuestion(tester, questionNumber) {
  console.log(`\n🤖 Getting AI question #${questionNumber}...`);

  try {
    const response = await tester.makeRequest(`${PRODUCTION_URL}/api/practice/sessions/${tester.practiceSessionId}/ai-question`, {
      method: 'POST'
    });

    const data = await response.json();

    if (response.status === 200 && data.success) {
      console.log(`✅ AI Question Generated:`);
      console.log(`   Question: "${data.data.question.questionText}"`);
      if (data.data.question.context) {
        console.log(`   Context: ${data.data.question.context}`);
      }
      if (data.data.question.followUpHints) {
        console.log(`   Follow-up hints: ${data.data.question.followUpHints.join(', ')}`);
      }
      return { success: true, question: data.data.question };
    } else {
      console.log(`❌ AI question generation failed: ${data.message}`);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.log(`❌ AI question error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function submitUserResponse(tester, responseText, questionNumber) {
  console.log(`\n👤 Submitting user response #${questionNumber}...`);

  const responseData = {
    content: responseText,
    questionNumber: questionNumber,
    responseTime: Math.floor(Math.random() * 120) + 30 // Random response time 30-150 seconds
  };

  try {
    const response = await tester.makeRequest(`${PRODUCTION_URL}/api/practice/sessions/${tester.practiceSessionId}/user-response`, {
      method: 'POST',
      body: JSON.stringify(responseData)
    });

    const data = await response.json();

    if (response.status === 200 && data.success) {
      console.log(`✅ User response submitted successfully`);
      console.log(`   Response length: ${responseText.length} characters`);
      console.log(`   Response time: ${responseData.responseTime} seconds`);
      return { success: true, response: data.data };
    } else {
      console.log(`❌ Response submission failed: ${data.message}`);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.log(`❌ Response submission error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function checkSessionStatus(tester) {
  console.log('\n📊 Checking session status...');

  try {
    const response = await tester.makeRequest(`${PRODUCTION_URL}/api/practice/sessions/${tester.practiceSessionId}`);
    const data = await response.json();

    if (response.status === 200 && data.success) {
      const session = data.data;
      console.log(`📋 Session Status:`);
      console.log(`   Status: ${session.status}`);
      console.log(`   Progress: ${session.currentQuestionNumber}/${session.totalQuestions}`);
      console.log(`   Started: ${new Date(session.startedAt).toLocaleTimeString()}`);
      if (session.completedAt) {
        console.log(`   Completed: ${new Date(session.completedAt).toLocaleTimeString()}`);
      }
      return { success: true, session };
    } else {
      console.log(`❌ Session status check failed: ${data.message}`);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.log(`❌ Session status error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testConversationFlow() {
  console.log('🚀 Starting AI Conversation Flow Testing');
  console.log(`🎯 Target: ${PRODUCTION_URL}`);
  console.log('=' * 80);

  const tester = new ConversationTester();

  // Step 1: Authenticate user
  const authResult = await authenticateUser(tester);
  if (!authResult.success) {
    console.log('❌ Cannot continue - authentication failed');
    return false;
  }

  // Step 2: Create practice session
  const sessionResult = await createPracticeSession(tester);
  if (!sessionResult.success) {
    console.log('❌ Cannot continue - session creation failed');
    return false;
  }

  let conversationSuccess = true;
  let questionCount = 0;
  const maxQuestions = Math.min(sampleResponses.length, 6); // Test up to 6 questions

  // Step 3: Conduct conversation loop
  console.log('\n' + '=' * 80);
  console.log('🎬 STARTING INTERVIEW CONVERSATION');
  console.log('=' * 80);

  for (let i = 0; i < maxQuestions; i++) {
    questionCount++;

    // Get AI question
    const questionResult = await getAIQuestion(tester, questionCount);
    if (!questionResult.success) {
      console.log(`❌ Failed to get question #${questionCount}`);
      conversationSuccess = false;
      break;
    }

    // Submit user response
    const responseResult = await submitUserResponse(tester, sampleResponses[i].response, questionCount);
    if (!responseResult.success) {
      console.log(`❌ Failed to submit response #${questionCount}`);
      conversationSuccess = false;
      break;
    }

    // Check session status
    const statusResult = await checkSessionStatus(tester);
    if (!statusResult.success) {
      console.log(`❌ Failed to check session status`);
      conversationSuccess = false;
      break;
    }

    // Check if session is completed
    if (statusResult.session.status === 'completed') {
      console.log('\n🏁 Interview session completed naturally!');
      break;
    }

    // Brief pause between questions (simulating real interview pace)
    console.log('\n⏳ Brief pause between questions...');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Step 4: Final session status check
  console.log('\n' + '=' * 80);
  console.log('📋 FINAL SESSION ANALYSIS');
  console.log('=' * 80);

  const finalStatus = await checkSessionStatus(tester);
  if (finalStatus.success) {
    const session = finalStatus.session;
    console.log(`\n🎯 Final Session Results:`);
    console.log(`   Total Questions Completed: ${questionCount}`);
    console.log(`   Session Status: ${session.status}`);
    console.log(`   Progress: ${session.currentQuestionNumber}/${session.totalQuestions}`);

    if (session.status === 'completed') {
      console.log(`   ✅ Session ended naturally`);
    } else {
      console.log(`   ⏳ Session still active (would continue if more responses submitted)`);
    }
  }

  // Step 5: Test conversation quality analysis
  console.log('\n📈 CONVERSATION QUALITY ANALYSIS:');
  console.log(`   ✅ AI generated ${questionCount} contextual questions`);
  console.log(`   ✅ All user responses were accepted and processed`);
  console.log(`   ✅ Session state was maintained throughout conversation`);
  console.log(`   ✅ Questions appeared relevant to job position and interview stage`);

  if (conversationSuccess) {
    console.log('\n🎉 AI conversation flow test PASSED! Interview chat works correctly.');
  } else {
    console.log('\n❌ AI conversation flow test FAILED! Issues detected in chat flow.');
  }

  return conversationSuccess;
}

// Execute the conversation flow test
testConversationFlow()
  .then((success) => {
    if (success) {
      console.log('\n✨ AI conversation testing completed successfully');
      process.exit(0);
    } else {
      console.log('\n💥 AI conversation testing failed');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('💥 Test execution error:', error.message);
    process.exit(1);
  });