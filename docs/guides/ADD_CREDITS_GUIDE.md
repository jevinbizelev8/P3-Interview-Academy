# Add Credits to User Account Guide

This guide explains how to add credits to any user account (staging or production) for UAT testing or admin adjustments.

## Quick Solution for Founder Account

### Option 1: Using Admin API (Recommended - Requires Admin Access)

The platform has a built-in admin API endpoint for adding credits:

```bash
POST /api/admin/users/:userId/credits/add
```

**Steps:**

1. **Get the user ID for founder@bizelev8.ai**

   ```bash
   # On staging
   curl -X GET "http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/admin/users?search=founder@bizelev8.ai" \
     -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
   ```

2. **Add credits to the account**

   ```bash
   curl -X POST "http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/admin/users/USER_ID/credits/add" \
     -H "Content-Type: application/json" \
     -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
     -d '{
       "amount": 10000,
       "reason": "UAT testing credits"
     }'
   ```

**Requirements:**
- Must be logged in as an admin user
- Need to obtain session cookie from browser after logging in

---

### Option 2: AWS Systems Manager (Requires AWS CLI Access)

If you have AWS CLI access, you can use AWS SSM to execute commands on the EC2 instance:

**Steps:**

1. **Get the EC2 instance ID:**
```bash
aws elasticbeanstalk describe-environment-resources \
  --environment-name p3-interview-academy-staging \
  --region ap-southeast-1 \
  --query 'EnvironmentResources.Instances[0].Id' \
  --output text
```

2. **Create and execute a Node.js script via SSM:**
```bash
# This will connect to the database and add credits
aws ssm send-command \
  --instance-ids "YOUR_INSTANCE_ID" \
  --document-name "AWS-RunShellScript" \
  --region ap-southeast-1 \
  --parameters 'commands=[
    "cd /var/app/current",
    "# Create temporary script",
    "# Connect to database using environment DATABASE_URL",
    "# Add credits and log transaction",
    "# Clean up script"
  ]'
```

**Note:** The actual implementation should read `DATABASE_URL` from environment variables configured in Elastic Beanstalk, never hardcode credentials.

---

### Option 3: Browser Console Method (Easiest for Non-Technical Users)

1. **Login to staging as an admin:**
   - Go to: http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com
   - Login with admin credentials

2. **Get the founder's user ID:**
   - Open browser console (F12)
   - Run this code:

   ```javascript
   fetch('/api/admin/users?search=founder@bizelev8.ai')
     .then(r => r.json())
     .then(data => {
       const user = data.data.users[0];
       console.log('User ID:', user.id);
       console.log('Current Balance:', user.creditBalance);
       return user.id;
     });
   ```

3. **Add credits (replace USER_ID with the actual ID from step 2):**

   ```javascript
   fetch('/api/admin/users/USER_ID/credits/add', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       amount: 10000,
       reason: 'UAT testing credits'
     })
   })
   .then(r => r.json())
   .then(data => {
     console.log('✓ Credits added!');
     console.log('New Balance:', data.data.newBalance);
   });
   ```

---

## Alternative: Create Admin Account for Testing

If the founder@bizelev8.ai account doesn't exist or doesn't have admin privileges:

1. **Create the account:**
   - Sign up at the staging URL
   - Use email: founder@bizelev8.ai

2. **Promote to admin role (requires database access):**

   ```sql
   -- Run this on the staging database
   UPDATE users
   SET role = 'admin',
       plan_type = 'ADVANCED',
       credit_balance = 10000,
       top_up_credits = 10000
   WHERE email = 'founder@bizelev8.ai';

   -- Add transaction record
   INSERT INTO credit_transactions
   (user_id, transaction_type, credits_amount, balance_after, description, created_at)
   SELECT
     id,
     'admin-adjustment',
     10000,
     10000,
     'Initial UAT testing credits',
     NOW()
   FROM users
   WHERE email = 'founder@bizelev8.ai';
   ```

---

## Staging Database Connection (For Reference)

**Database:** `p3_staging` on AWS RDS
**Host:** `p3interviewacademy.cnecks4s8kqj.ap-southeast-1.rds.amazonaws.com`
**Port:** `5432`
**User:** `app_user`
**Password:** *Stored in AWS Elastic Beanstalk environment variables*

**Connection string format:**
```
postgresql://app_user:PASSWORD@p3interviewacademy.cnecks4s8kqj.ap-southeast-1.rds.amazonaws.com:5432/p3_staging
```

**How to get credentials:**
```bash
# Get DATABASE_URL from Elastic Beanstalk configuration
aws elasticbeanstalk describe-configuration-settings \
  --application-name p3-interview-academy \
  --environment-name p3-interview-academy-staging \
  --region ap-southeast-1 \
  --query 'ConfigurationSettings[0].OptionSettings[?Namespace==`aws:elasticbeanstalk:application:environment` && OptionName==`DATABASE_URL`].Value' \
  --output text
```

⚠️ **Security Notes:**
- Database is only accessible from AWS Elastic Beanstalk EC2 instances and whitelisted admin IPs
- NOT accessible from Replit or public internet
- Credentials stored securely in AWS Elastic Beanstalk environment configuration
- Never commit credentials to git repository

---

## Verification

After adding credits, verify with:

```javascript
// Browser console
fetch('/api/admin/users?search=founder@bizelev8.ai')
  .then(r => r.json())
  .then(data => {
    const user = data.data.users[0];
    console.log('Email:', user.email);
    console.log('Credit Balance:', user.creditBalance);
    console.log('Top-Up Credits:', user.topUpCredits);
  });
```

Or check the database directly:

```sql
SELECT email, credit_balance, top_up_credits, monthly_credit_allocation
FROM users
WHERE email = 'founder@bizelev8.ai';
```

---

## Troubleshooting

### "User not found"
- Ensure the founder@bizelev8.ai account exists in staging
- Check spelling of email address
- Verify you're searching the correct environment (staging vs production)

### "Unauthorized" or "Forbidden"
- Ensure you're logged in as an admin
- Check the founder account has `role = 'admin'` in the database
- Clear browser cookies and login again

### "Connection timeout" (Database Script)
- Database is not accessible from this IP
- Must run from EC2 instance or whitelisted IP
- Use the Browser Console method instead

---

## Summary for Founder UAT

**Quickest method (no technical knowledge required):**

1. Login to staging as admin: http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com
2. Open browser console (F12)
3. Copy and paste the code from **Option 3** above
4. Done! You'll have 10,000 credits for testing

**Time required:** ~2 minutes

---

## Admin Panel (Future Enhancement)

In the future, this functionality should be available through a web-based admin dashboard at `/admin/users` where admins can:
- Search for users
- View credit balances
- Add/remove credits with one click
- View transaction history

For now, use the methods above.
