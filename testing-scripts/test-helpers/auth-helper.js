/**
 * Authentication Helper for Production Testing
 * Creates test users and manages session cookies
 */

async function createTestUser(baseUrl, emailPrefix = 'test') {
  const timestamp = Date.now();
  const email = `${emailPrefix}-${timestamp}@example.com`;
  const password = 'TestPassword123!';

  const signupResponse = await fetch(`${baseUrl}/api/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email,
      password: password,
      firstName: 'Test',
      lastName: 'User',
      preferredLanguage: 'en'
    })
  });

  if (!signupResponse.ok) {
    const errorText = await signupResponse.text();
    throw new Error(`Failed to create test user: ${signupResponse.status} - ${errorText}`);
  }

  // Extract session cookie
  const setCookieHeader = signupResponse.headers.get('set-cookie');
  let sessionCookie = null;

  if (setCookieHeader) {
    // Parse the session cookie
    const match = setCookieHeader.match(/connect\.sid=([^;]+)/);
    if (match) {
      sessionCookie = `connect.sid=${match[1]}`;
    }
  }

  const userData = await signupResponse.json();

  return {
    email,
    password,
    sessionCookie,
    userId: userData.user?.id,
    user: userData.user
  };
}

async function loginTestUser(baseUrl, email, password) {
  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email,
      password: password
    })
  });

  if (!loginResponse.ok) {
    const errorText = await loginResponse.text();
    throw new Error(`Failed to login: ${loginResponse.status} - ${errorText}`);
  }

  // Extract session cookie
  const setCookieHeader = loginResponse.headers.get('set-cookie');
  let sessionCookie = null;

  if (setCookieHeader) {
    const match = setCookieHeader.match(/connect\.sid=([^;]+)/);
    if (match) {
      sessionCookie = `connect.sid=${match[1]}`;
    }
  }

  const userData = await loginResponse.json();

  return {
    sessionCookie,
    userId: userData.user?.id,
    user: userData.user
  };
}

export { createTestUser, loginTestUser };
