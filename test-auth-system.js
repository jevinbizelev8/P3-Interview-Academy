// Comprehensive authentication system testing for AWS production environment
import fetch from 'node-fetch';

const PRODUCTION_URL = 'http://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com';

// Test data with unique timestamps to avoid conflicts
const generateTestUser = () => {
  const timestamp = Date.now();
  return {
    email: `test-${timestamp}@example.com`,
    password: 'SecureTestPassword123!',
    firstName: 'Test',
    lastName: 'User'
  };
};

// Helper function to make requests with cookie handling
class AuthTester {
  constructor() {
    this.cookies = '';
    this.sessionId = null;
  }

  async makeRequest(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'AuthTester/1.0',
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
      // Extract session ID for logging
      const sessionMatch = setCookieHeader.match(/connect\.sid=([^;]+)/);
      if (sessionMatch) {
        this.sessionId = sessionMatch[1];
      }
    }

    return response;
  }
}

// Test functions
async function testValidRegistration() {
  console.log('\n🧪 Testing valid user registration...');
  const tester = new AuthTester();
  const testUser = generateTestUser();

  try {
    const response = await tester.makeRequest(`${PRODUCTION_URL}/api/auth/signup`, {
      method: 'POST',
      body: JSON.stringify(testUser)
    });

    const data = await response.json();

    console.log(`📊 Registration Response:`, {
      status: response.status,
      success: data.success,
      hasUser: !!data.user,
      sessionId: tester.sessionId?.substring(0, 10) + '...',
      cookies: tester.cookies ? 'Set' : 'Not set'
    });

    if (response.status === 200 && data.success) {
      console.log('✅ Valid registration: PASSED');
      console.log(`   User created: ${data.user.email} (ID: ${data.user.id})`);
      return { success: true, user: data.user, tester };
    } else {
      console.log('❌ Valid registration: FAILED');
      console.log(`   Error: ${data.message || 'Unknown error'}`);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.log('❌ Valid registration: ERROR');
    console.log(`   Exception: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testDuplicateEmailRegistration(existingEmail) {
  console.log('\n🧪 Testing duplicate email registration...');
  const tester = new AuthTester();

  try {
    const duplicateUser = {
      email: existingEmail,
      password: 'AnotherPassword123!',
      firstName: 'Duplicate',
      lastName: 'User'
    };

    const response = await tester.makeRequest(`${PRODUCTION_URL}/api/auth/signup`, {
      method: 'POST',
      body: JSON.stringify(duplicateUser)
    });

    const data = await response.json();

    console.log(`📊 Duplicate Registration Response:`, {
      status: response.status,
      message: data.message
    });

    if (response.status === 400 && data.message?.includes('already registered')) {
      console.log('✅ Duplicate email registration: PASSED (correctly rejected)');
      return { success: true };
    } else {
      console.log('❌ Duplicate email registration: FAILED (should have been rejected)');
      return { success: false, error: 'Duplicate email was not rejected' };
    }
  } catch (error) {
    console.log('❌ Duplicate email registration: ERROR');
    console.log(`   Exception: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testMissingFieldsRegistration() {
  console.log('\n🧪 Testing registration with missing required fields...');
  const tester = new AuthTester();

  const testCases = [
    { name: 'Missing email', data: { password: 'Test123!', firstName: 'Test' } },
    { name: 'Missing password', data: { email: 'test@example.com', firstName: 'Test' } },
    { name: 'Missing firstName', data: { email: 'test@example.com', password: 'Test123!' } }
  ];

  let allPassed = true;

  for (const testCase of testCases) {
    try {
      const response = await tester.makeRequest(`${PRODUCTION_URL}/api/auth/signup`, {
        method: 'POST',
        body: JSON.stringify(testCase.data)
      });

      const data = await response.json();

      console.log(`📊 ${testCase.name}:`, {
        status: response.status,
        message: data.message
      });

      if (response.status === 400 && data.message?.includes('required')) {
        console.log(`   ✅ ${testCase.name}: PASSED (correctly rejected)`);
      } else {
        console.log(`   ❌ ${testCase.name}: FAILED (should have been rejected)`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`   ❌ ${testCase.name}: ERROR - ${error.message}`);
      allPassed = false;
    }
  }

  return { success: allPassed };
}

async function testValidLogin(email, password) {
  console.log('\n🧪 Testing valid user login...');
  const tester = new AuthTester();

  try {
    const response = await tester.makeRequest(`${PRODUCTION_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    console.log(`📊 Login Response:`, {
      status: response.status,
      success: data.success,
      hasUser: !!data.user,
      sessionId: tester.sessionId?.substring(0, 10) + '...',
      cookies: tester.cookies ? 'Set' : 'Not set'
    });

    if (response.status === 200 && data.success) {
      console.log('✅ Valid login: PASSED');
      console.log(`   Logged in: ${data.user.email} (ID: ${data.user.id})`);
      return { success: true, user: data.user, tester };
    } else {
      console.log('❌ Valid login: FAILED');
      console.log(`   Error: ${data.message || 'Unknown error'}`);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.log('❌ Valid login: ERROR');
    console.log(`   Exception: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testInvalidLogin() {
  console.log('\n🧪 Testing invalid login credentials...');
  const tester = new AuthTester();

  const testCases = [
    { name: 'Wrong password', email: 'test@example.com', password: 'WrongPassword123!' },
    { name: 'Non-existent email', email: 'nonexistent@example.com', password: 'Test123!' },
    { name: 'Missing email', email: '', password: 'Test123!' },
    { name: 'Missing password', email: 'test@example.com', password: '' }
  ];

  let allPassed = true;

  for (const testCase of testCases) {
    try {
      const response = await tester.makeRequest(`${PRODUCTION_URL}/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email: testCase.email, password: testCase.password })
      });

      const data = await response.json();

      console.log(`📊 ${testCase.name}:`, {
        status: response.status,
        message: data.message
      });

      if (response.status === 400 || response.status === 401) {
        console.log(`   ✅ ${testCase.name}: PASSED (correctly rejected)`);
      } else {
        console.log(`   ❌ ${testCase.name}: FAILED (should have been rejected)`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`   ❌ ${testCase.name}: ERROR - ${error.message}`);
      allPassed = false;
    }
  }

  return { success: allPassed };
}

async function testSessionPersistence(tester) {
  console.log('\n🧪 Testing session persistence and authentication state...');

  try {
    // Test accessing protected endpoint with valid session
    const response = await tester.makeRequest(`${PRODUCTION_URL}/api/auth/user`);
    const data = await response.json();

    console.log(`📊 Auth Check Response:`, {
      status: response.status,
      hasUser: !!data.id,
      email: data.email,
      sessionUsed: tester.sessionId?.substring(0, 10) + '...'
    });

    if (response.status === 200 && data.id) {
      console.log('✅ Session persistence: PASSED');
      console.log(`   Authenticated user: ${data.email} (ID: ${data.id})`);

      // Test accessing without session cookies
      const unauthTester = new AuthTester();
      const unauthResponse = await unauthTester.makeRequest(`${PRODUCTION_URL}/api/auth/user`);

      console.log(`📊 Unauthorized Access Test:`, {
        status: unauthResponse.status
      });

      if (unauthResponse.status === 401) {
        console.log('✅ Unauthorized access: PASSED (correctly rejected)');
        return { success: true, user: data };
      } else {
        console.log('❌ Unauthorized access: FAILED (should have been rejected)');
        return { success: false, error: 'Unauthorized access was not rejected' };
      }
    } else {
      console.log('❌ Session persistence: FAILED');
      console.log(`   Error: ${data.message || 'Session not recognized'}`);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.log('❌ Session persistence: ERROR');
    console.log(`   Exception: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testLogout(tester) {
  console.log('\n🧪 Testing user logout...');

  try {
    const response = await tester.makeRequest(`${PRODUCTION_URL}/api/auth/logout`, {
      method: 'POST'
    });

    const data = await response.json();

    console.log(`📊 Logout Response:`, {
      status: response.status,
      success: data.success
    });

    if (response.status === 200 && data.success) {
      console.log('✅ Logout: PASSED');

      // Test that session is destroyed
      const authCheckResponse = await tester.makeRequest(`${PRODUCTION_URL}/api/auth/user`);

      console.log(`📊 Post-logout Auth Check:`, {
        status: authCheckResponse.status
      });

      if (authCheckResponse.status === 401) {
        console.log('✅ Post-logout session destruction: PASSED');
        return { success: true };
      } else {
        console.log('❌ Post-logout session destruction: FAILED (session still active)');
        return { success: false, error: 'Session was not destroyed after logout' };
      }
    } else {
      console.log('❌ Logout: FAILED');
      console.log(`   Error: ${data.message || 'Unknown error'}`);
      return { success: false, error: data.message };
    }
  } catch (error) {
    console.log('❌ Logout: ERROR');
    console.log(`   Exception: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main test execution
async function runAuthenticationTests() {
  console.log('🚀 Starting AWS Production Authentication System Tests');
  console.log(`🎯 Target: ${PRODUCTION_URL}`);
  console.log('=' * 60);

  const results = {
    registration: null,
    duplicateEmail: null,
    missingFields: null,
    login: null,
    invalidLogin: null,
    sessionPersistence: null,
    logout: null
  };

  // Test 1: Valid registration
  const registrationResult = await testValidRegistration();
  results.registration = registrationResult;

  if (!registrationResult.success) {
    console.log('\n❌ Cannot continue with tests - registration failed');
    return results;
  }

  // Test 2: Duplicate email registration
  results.duplicateEmail = await testDuplicateEmailRegistration(registrationResult.user.email);

  // Test 3: Missing fields registration
  results.missingFields = await testMissingFieldsRegistration();

  // Test 4: Valid login
  const loginResult = await testValidLogin(registrationResult.user.email, 'SecureTestPassword123!');
  results.login = loginResult;

  if (!loginResult.success) {
    console.log('\n❌ Cannot continue with session tests - login failed');
    return results;
  }

  // Test 5: Invalid login attempts
  results.invalidLogin = await testInvalidLogin();

  // Test 6: Session persistence
  const sessionResult = await testSessionPersistence(loginResult.tester);
  results.sessionPersistence = sessionResult;

  // Test 7: Logout
  results.logout = await testLogout(loginResult.tester);

  // Summary
  console.log('\n' + '=' * 60);
  console.log('📋 TEST SUMMARY');
  console.log('=' * 60);

  const testNames = [
    'Valid Registration',
    'Duplicate Email Rejection',
    'Missing Fields Validation',
    'Valid Login',
    'Invalid Login Rejection',
    'Session Persistence',
    'Logout Functionality'
  ];

  const testResults = Object.values(results);
  let passedCount = 0;

  testNames.forEach((name, index) => {
    const result = testResults[index];
    if (result?.success) {
      console.log(`✅ ${name}: PASSED`);
      passedCount++;
    } else {
      console.log(`❌ ${name}: FAILED${result?.error ? ` (${result.error})` : ''}`);
    }
  });

  console.log(`\n🎯 Overall Result: ${passedCount}/${testNames.length} tests passed`);

  if (passedCount === testNames.length) {
    console.log('🎉 All authentication tests PASSED! Production system is working correctly.');
  } else {
    console.log('⚠️  Some tests FAILED. Review the issues above.');
  }

  return results;
}

// Execute tests
runAuthenticationTests()
  .then(() => {
    console.log('\n✨ Authentication testing completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test execution failed:', error.message);
    process.exit(1);
  });