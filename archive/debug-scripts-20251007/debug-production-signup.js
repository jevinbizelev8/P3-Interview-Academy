/**
 * Debug production signup with detailed logging
 */

const PROD_URL = 'http://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com';

const timestamp = Date.now();
const testData = {
  email: `debug-test-${timestamp}@bizelev8.ai`,
  password: 'DebugTest123',
  firstName: 'Debug',
  lastName: 'Test'
};

console.log('🔍 Debugging Production Signup');
console.log('==============================\n');
console.log('Test Data:', JSON.stringify(testData, null, 2));
console.log('');

async function debugSignup() {
  try {
    console.log('📡 Sending signup request...\n');

    const response = await fetch(`${PROD_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('Response Status:', response.status);
    console.log('Response Headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    console.log('');

    const responseText = await response.text();
    console.log('Response Body (raw):', responseText);
    console.log('');

    try {
      const responseData = JSON.parse(responseText);
      console.log('Response Body (JSON):', JSON.stringify(responseData, null, 2));
    } catch (e) {
      console.log('Could not parse response as JSON');
    }

    if (!response.ok) {
      console.log('');
      console.log('❌ Signup failed with status', response.status);
      console.log('');
      console.log('Possible causes:');
      console.log('1. Email service (SMTP) connection issue');
      console.log('2. Database write error');
      console.log('3. Validation error in request data');
      console.log('4. Server-side exception in signup handler');
      console.log('');
      console.log('Check server logs for detailed error information.');
    } else {
      console.log('');
      console.log('✅ Signup succeeded!');
    }

  } catch (error) {
    console.error('❌ Request failed:', error.message);
    throw error;
  }
}

debugSignup().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
