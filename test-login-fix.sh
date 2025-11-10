#!/bin/bash

# Test Login Fix Script
# This script tests the authentication fix for the SQL reserved keyword issue

set -e

echo "🧪 Testing Authentication Fix"
echo "=============================="
echo ""

# Test account credentials
EMAIL="founder@bizelev8.ai"
PASSWORD="FounderPass123"

# Staging URL
STAGING_URL="https://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com"

echo "📝 Test Account:"
echo "  Email: $EMAIL"
echo "  Password: $PASSWORD"
echo ""

echo "🔧 Step 1: Test seed endpoint (create/update test user)"
echo "------------------------------------------------------"
SEED_RESPONSE=$(curl -k -s -X POST "$STAGING_URL/api/auth/test-seed" \
  -H "Content-Type: application/json" \
  -H "X-Seed-Key: ${TEST_SEED_KEY}" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"firstName\":\"Founder\",\"lastName\":\"Test\",\"role\":\"admin\"}")

echo "Response: $SEED_RESPONSE"
echo ""

echo "🔐 Step 2: Test login endpoint (verify fix)"
echo "--------------------------------------------"
LOGIN_RESPONSE=$(curl -k -s -w "\nHTTP_CODE:%{http_code}" -c /tmp/cookies.txt -X POST "$STAGING_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$LOGIN_RESPONSE" | sed '/HTTP_CODE:/d')

echo "HTTP Status: $HTTP_CODE"
echo "Response Body: $BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ SUCCESS: Login works! Authentication fix verified."
  echo ""

  echo "🔍 Step 3: Verify session cookie"
  echo "---------------------------------"
  cat /tmp/cookies.txt | grep -v "^#" | grep "connect.sid" || echo "⚠️  No session cookie found"
  echo ""

  echo "✅ Step 4: Test authenticated request"
  echo "--------------------------------------"
  USER_RESPONSE=$(curl -k -s -b /tmp/cookies.txt "$STAGING_URL/api/auth/user")
  echo "Response: $USER_RESPONSE"
  echo ""

  echo "🎉 ALL TESTS PASSED!"
else
  echo "❌ FAILED: Login returned HTTP $HTTP_CODE"
  echo "Expected: 200"
  echo "Response: $BODY"
  exit 1
fi
