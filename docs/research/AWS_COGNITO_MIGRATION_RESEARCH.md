# AWS Cognito Migration Research
## From Passport.js Session-Based Auth to AWS Cognito

**Date**: 2025-12-09
**Context**: Migration recommendation from AWS team after 404 login issues
**Current Stack**: Node.js 20, Express.js, React 18, Passport.js, PostgreSQL RDS, AWS Elastic Beanstalk

---

## Executive Summary

AWS Cognito is a fully managed authentication service that can replace your current Passport.js implementation. However, **migration is a significant architectural change** that requires careful consideration.

**Key Recommendation**: Before migrating to Cognito, **first investigate and fix the 404 login issue** with your current Passport.js setup. The 404 error is likely a routing/session configuration issue, not an authentication architecture problem.

**Migration Complexity**: Medium-High (2-4 weeks for full implementation and testing)
**Cost Impact**: Likely cost-neutral or slight increase
**Risk Level**: Medium (requires user migration, testing, and rollback planning)

---

## 1. AWS Cognito Overview

### What is AWS Cognito?

AWS Cognito is a managed authentication, authorization, and user management service with two main components:

1. **User Pools**: User directory for authentication (sign-up, sign-in, account recovery)
2. **Identity Pools**: AWS credential provider for accessing AWS services (S3, DynamoDB, etc.)

For your use case (web application authentication), you'll primarily use **User Pools**.

### Key Features

#### Authentication Features
- **Username/Password Authentication**: Email, phone, or username-based
- **Social Identity Providers**: Google, Facebook, Apple, Amazon (replaces your planned Google OAuth)
- **SAML/OIDC**: Enterprise identity federation
- **Multi-Factor Authentication (MFA)**: SMS, TOTP, email-based
- **Passwordless Authentication**: Magic links, FIDO2/WebAuthn

#### Security Features
- **Adaptive Authentication**: Risk-based authentication with anomaly detection
- **Account Takeover Protection**: Compromised credential detection
- **Custom Authentication Flows**: Lambda triggers for custom logic
- **Token-Based Security**: JWT tokens (access, ID, refresh tokens)
- **Secure Password Policies**: Configurable complexity requirements

#### User Management
- **User Attributes**: Standard and custom attributes
- **User Groups**: Role-based access control
- **User Migration**: Triggers for seamless migration from existing systems
- **Email/SMS Verification**: Built-in verification workflows
- **Account Recovery**: Password reset, account confirmation

#### Integration Features
- **Hosted UI**: Pre-built authentication pages (customizable)
- **JavaScript SDK**: `amazon-cognito-identity-js` for SPAs
- **API Gateway Integration**: Native integration for API authentication
- **Lambda Triggers**: Pre/post authentication, pre/post token generation, user migration

---

## 2. Authentication Flow for SPA + API Architecture

### Current Architecture (Passport.js)
```
┌─────────────┐         ┌─────────────┐         ┌──────────────┐
│   React     │  HTTP   │  Express.js │ Session │  PostgreSQL  │
│     SPA     │ ◄─────► │     API     │ ◄─────► │     (RDS)    │
└─────────────┘         └─────────────┘         └──────────────┘
      │                        │
      └── Session Cookie ──────┘
      (server-side session)
```

### Proposed Architecture (AWS Cognito)
```
┌─────────────┐         ┌─────────────┐         ┌──────────────┐
│   React     │  HTTP   │  Express.js │         │  PostgreSQL  │
│     SPA     │ ◄─────► │     API     │ ◄─────► │     (RDS)    │
└─────────────┘         └─────────────┘         └──────────────┘
      │                        │
      │  JWT Tokens            │
      │  (access, ID,          │
      │   refresh)             │
      │                        │
      └───────────────┬────────┘
                      │
                      ▼
              ┌──────────────┐
              │ AWS Cognito  │
              │  User Pool   │
              └──────────────┘
```

### Token-Based Authentication Flow

#### 1. User Sign-In (SPA)
```javascript
// React: User signs in
import { CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';

const authenticationDetails = new AuthenticationDetails({
  Username: email,
  Password: password,
});

const cognitoUser = new CognitoUser({
  Username: email,
  Pool: userPool,
});

cognitoUser.authenticateUser(authenticationDetails, {
  onSuccess: (result) => {
    const accessToken = result.getAccessToken().getJwtToken();
    const idToken = result.getIdToken().getJwtToken();
    const refreshToken = result.getRefreshToken().getToken();

    // Store tokens (localStorage, sessionStorage, or memory)
    // Send ID token to API for verification
  },
  onFailure: (err) => {
    console.error('Authentication failed:', err);
  },
});
```

#### 2. API Request with Token
```javascript
// React: Make authenticated API request
const response = await fetch('/api/protected-endpoint', {
  headers: {
    'Authorization': `Bearer ${idToken}`, // or accessToken
  },
});
```

#### 3. Token Verification (Express API)
```javascript
// Express: Verify JWT token
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, getKey, {
    issuer: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`,
    algorithms: ['RS256']
  }, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = decoded; // Attach user info to request
    next();
  });
};

// Use middleware
app.get('/api/protected', verifyToken, (req, res) => {
  res.json({ user: req.user });
});
```

### Token Types and Usage

| Token Type | Purpose | Storage | Expiry | Usage |
|------------|---------|---------|--------|-------|
| **ID Token** | User identity information (name, email, etc.) | Short-lived memory/storage | 1 hour (default) | Send to API for user identification |
| **Access Token** | API authorization | Short-lived memory/storage | 1 hour (default) | API access control |
| **Refresh Token** | Obtain new access/ID tokens | Secure storage (httpOnly cookie preferred) | 30 days (default, configurable) | Token refresh without re-login |

### Session Management Comparison

#### Passport.js (Current)
- **Server-side sessions**: Session data stored in PostgreSQL
- **Stateful**: Server maintains session state
- **Cookie-based**: Session ID in httpOnly cookie
- **Scalability**: Requires session store (Redis/PostgreSQL) for multi-server
- **Memory**: Server memory used for active sessions

#### AWS Cognito (Proposed)
- **Client-side tokens**: JWT tokens stored in browser
- **Stateless**: Server only verifies token signature
- **Token-based**: JWT in Authorization header
- **Scalability**: Horizontally scalable (no session store needed)
- **Memory**: No server memory for sessions

---

## 3. Migration Path: Passport.js to AWS Cognito

### Migration Strategies

#### Option A: "Big Bang" Migration (NOT RECOMMENDED)
- Immediate switch from Passport.js to Cognito
- All users forced to reset passwords
- High risk, significant user friction

#### Option B: Gradual Migration with User Migration Trigger (RECOMMENDED)
- Use Cognito's "User Migration" Lambda trigger
- Migrate users on first login (zero-downtime)
- Transparent to users
- **Best approach for your use case**

#### Option C: Bulk CSV Import + Password Reset
- Export users to CSV
- Import to Cognito
- Force password reset for all users
- Moderate risk, some user friction

### Recommended Approach: User Migration Trigger

#### How It Works
```
User Login Attempt → Cognito checks if user exists
                     ↓ NO
                Triggers Lambda Function
                     ↓
        Lambda calls your current auth API
                     ↓
           Validates password with Passport.js
                     ↓
        Returns user data to Cognito
                     ↓
        Cognito creates user + authenticates
                     ↓
              User logged in successfully
```

#### Implementation Steps

**Step 1: Create User Migration Lambda Function**

```javascript
// lambda/cognitoUserMigration.js
const axios = require('axios');

exports.handler = async (event) => {
  console.log('User Migration Event:', JSON.stringify(event, null, 2));

  if (event.triggerSource === 'UserMigration_Authentication') {
    // User attempting to sign in
    const { userName, password } = event.request;

    try {
      // Call your existing Passport.js authentication endpoint
      const response = await axios.post('https://your-api.com/api/auth/validate-legacy-user', {
        username: userName,
        password: password,
      }, {
        headers: {
          'X-Migration-Secret': process.env.MIGRATION_SECRET, // Secure the endpoint
        },
      });

      if (response.data.success) {
        const user = response.data.user;

        // Return user attributes to Cognito
        event.response.userAttributes = {
          email: user.email,
          email_verified: 'true',
          name: user.name || '',
          // Add other custom attributes
        };

        event.response.finalUserStatus = 'CONFIRMED';
        event.response.messageAction = 'SUPPRESS'; // Don't send verification email

        return event;
      }
    } catch (error) {
      console.error('Migration error:', error);
      throw new Error('Authentication failed');
    }
  }

  if (event.triggerSource === 'UserMigration_ForgotPassword') {
    // User requesting password reset for non-existent Cognito user
    const { userName } = event.request;

    try {
      // Check if user exists in legacy system
      const response = await axios.post('https://your-api.com/api/auth/check-legacy-user', {
        username: userName,
      }, {
        headers: {
          'X-Migration-Secret': process.env.MIGRATION_SECRET,
        },
      });

      if (response.data.exists) {
        const user = response.data.user;

        event.response.userAttributes = {
          email: user.email,
          email_verified: 'true',
          name: user.name || '',
        };

        event.response.finalUserStatus = 'RESET_REQUIRED';
        event.response.messageAction = 'SUPPRESS';

        return event;
      }
    } catch (error) {
      console.error('Password reset migration error:', error);
      throw new Error('User not found');
    }
  }

  throw new Error('User not found');
};
```

**Step 2: Add Legacy User Validation Endpoint to Express API**

```javascript
// server/routes/auth.ts (new endpoint)
import { Router } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Secure this endpoint - only callable by Lambda
const validateMigrationSecret = (req, res, next) => {
  const secret = req.headers['x-migration-secret'];
  if (secret !== process.env.MIGRATION_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

// Validate legacy user for Cognito migration
router.post('/validate-legacy-user', validateMigrationSecret, async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find user by email or username
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, username))
      .limit(1);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Verify password (adjust based on your hashing method)
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid password' });
    }

    // Return user data for Cognito
    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        // Add other attributes needed
      },
    });
  } catch (error) {
    console.error('Legacy user validation error:', error);
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
});

// Check if legacy user exists (for password reset)
router.post('/check-legacy-user', validateMigrationSecret, async (req, res) => {
  const { username } = req.body;

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, username))
      .limit(1);

    if (!user) {
      return res.status(404).json({ exists: false });
    }

    return res.json({
      exists: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Legacy user check error:', error);
    return res.status(500).json({ exists: false, error: 'Internal error' });
  }
});

export default router;
```

**Step 3: Configure Cognito User Pool with Migration Trigger**

```bash
# AWS CLI: Attach Lambda trigger to User Pool
aws cognito-idp update-user-pool \
  --user-pool-id <USER_POOL_ID> \
  --lambda-config UserMigration=arn:aws:lambda:ap-southeast-1:ACCOUNT_ID:function:cognitoUserMigration
```

Or via AWS Console:
1. Cognito → User Pools → Your Pool → Triggers
2. User Migration → Select Lambda function
3. Save changes

**Step 4: Implement Parallel Authentication in React**

```javascript
// client/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';

const userPool = new CognitoUserPool({
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
});

interface AuthContextType {
  user: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const cognitoUser = userPool.getCurrentUser();

    if (cognitoUser) {
      cognitoUser.getSession((err: any, session: any) => {
        if (err) {
          console.error('Session error:', err);
          setLoading(false);
          return;
        }

        if (session.isValid()) {
          setUser({
            username: cognitoUser.getUsername(),
            attributes: session.getIdToken().payload,
          });
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    return new Promise((resolve, reject) => {
      const authenticationDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      });

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          const idToken = result.getIdToken().payload;
          setUser({
            username: email,
            attributes: idToken,
          });
          resolve();
        },
        onFailure: (err) => {
          console.error('Authentication failed:', err);
          reject(err);
        },
        newPasswordRequired: (userAttributes) => {
          // Handle new password requirement if needed
          console.log('New password required:', userAttributes);
          reject(new Error('New password required'));
        },
      });
    });
  };

  const signOut = async () => {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

**Step 5: Update API to Accept Both Session and JWT Auth**

```javascript
// server/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const client = jwksClient({
  jwksUri: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`,
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
});

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

// Dual authentication middleware (supports both session and JWT)
export const authenticateRequest = async (req: Request, res: Response, next: NextFunction) => {
  // Check for Passport.js session first (legacy)
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  // Check for Cognito JWT token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No authentication provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(
        token,
        getKey,
        {
          issuer: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`,
          algorithms: ['RS256'],
        },
        (err, decoded) => {
          if (err) reject(err);
          else resolve(decoded);
        }
      );
    });

    // Attach Cognito user to request (mimic Passport structure)
    req.user = {
      id: (decoded as any).sub, // Cognito user ID
      email: (decoded as any).email,
      name: (decoded as any).name,
      // Map other attributes as needed
    };

    next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

### Migration Timeline

| Phase | Duration | Activities | Rollback Risk |
|-------|----------|------------|---------------|
| **Phase 1: Setup** | 1-2 days | Create Cognito User Pool, configure Lambda, test locally | Low |
| **Phase 2: Integration** | 3-5 days | Implement React auth context, update API middleware | Low |
| **Phase 3: Testing** | 3-5 days | Test migration trigger, parallel auth, edge cases | Medium |
| **Phase 4: Staging Deploy** | 1 day | Deploy to staging, monitor logs, test user flows | Medium |
| **Phase 5: Production Rollout** | 1-2 weeks | Gradual rollout with monitoring, user support | High |
| **Phase 6: Cleanup** | 1 week | Remove Passport.js, session storage, legacy code | Low |

**Total Estimated Time**: 2-4 weeks (depending on testing thoroughness)

---

## 4. Elastic Beanstalk Integration Considerations

### Environment Variables

Add to your EB environment (`.ebextensions/` or AWS Console):

```yaml
# .ebextensions/05-cognito.config
option_settings:
  - namespace: aws:elasticbeanstalk:application:environment
    option_name: COGNITO_USER_POOL_ID
    value: ap-southeast-1_XXXXXXXXX
  - namespace: aws:elasticbeanstalk:application:environment
    option_name: COGNITO_CLIENT_ID
    value: your_client_id_here
  - namespace: aws:elasticbeanstalk:application:environment
    option_name: AWS_REGION
    value: ap-southeast-1
  - namespace: aws:elasticbeanstalk:application:environment
    option_name: MIGRATION_SECRET
    value: your_secure_random_string_here
```

### IAM Permissions

Your EB instance profile needs permissions to invoke the migration Lambda:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:InvokeFunction"
      ],
      "Resource": "arn:aws:lambda:ap-southeast-1:ACCOUNT_ID:function:cognitoUserMigration"
    }
  ]
}
```

### VPC Considerations

- Cognito is a regional service (publicly accessible)
- No VPC configuration needed for basic authentication
- If using Lambda migration trigger, ensure Lambda can access your API:
  - Option A: Lambda in same VPC as EB (requires NAT Gateway for Cognito access)
  - Option B: Lambda outside VPC (simpler, recommended)

### Health Check Compatibility

Cognito doesn't affect your existing health check endpoints:
- `/api/health/simple` - Works as-is
- `/api/health` - May need to bypass authentication

```javascript
// server/routes.ts
app.get('/api/health', (req, res) => {
  // No authentication required for health checks
  res.json({ status: 'healthy' });
});

app.get('/api/protected', authenticateRequest, (req, res) => {
  // Authentication required
  res.json({ user: req.user });
});
```

---

## 5. Cognito vs Passport.js: Comprehensive Comparison

### Architecture Comparison

| Aspect | Passport.js (Current) | AWS Cognito (Proposed) |
|--------|----------------------|------------------------|
| **Authentication Type** | Server-side sessions | Token-based (JWT) |
| **State Management** | Stateful (session store) | Stateless (JWT verification) |
| **Storage Required** | PostgreSQL session table | None (tokens in browser) |
| **Scalability** | Vertical (session store bottleneck) | Horizontal (stateless) |
| **Infrastructure** | Self-managed | Fully managed by AWS |
| **Maintenance** | Code updates, security patches | AWS handles updates |
| **Session Duration** | Configurable (currently session-based) | 1 hour (tokens), 30 days (refresh) |

### Feature Comparison

| Feature | Passport.js | AWS Cognito | Winner |
|---------|-------------|-------------|---------|
| **Username/Password Auth** | ✅ Yes | ✅ Yes | Tie |
| **Social Login (Google, etc.)** | ✅ Manual setup | ✅ Built-in | Cognito |
| **MFA** | ❌ Manual implementation | ✅ Built-in (SMS, TOTP) | Cognito |
| **Email Verification** | ✅ Custom (you implemented) | ✅ Built-in | Tie |
| **Password Reset** | ✅ Custom (you implemented) | ✅ Built-in | Tie |
| **Account Lockout** | ❌ Manual implementation | ✅ Built-in | Cognito |
| **Adaptive Security** | ❌ No | ✅ Risk-based auth | Cognito |
| **Custom Auth Flows** | ✅ Full control | ✅ Lambda triggers | Tie |
| **User Management UI** | ❌ Build your own | ✅ AWS Console | Cognito |
| **Audit Logging** | ❌ Manual | ✅ CloudWatch Logs | Cognito |

### Development Experience

| Aspect | Passport.js | AWS Cognito | Winner |
|--------|-------------|-------------|---------|
| **Learning Curve** | Low (familiar Node.js) | Medium (AWS concepts) | Passport.js |
| **Initial Setup Time** | 1-2 days | 2-3 days | Passport.js |
| **Code Complexity** | Low (straightforward) | Medium (SDK integration) | Passport.js |
| **Testing** | Easy (local) | Harder (AWS dependencies) | Passport.js |
| **Debugging** | Easy (local logs) | Medium (CloudWatch logs) | Passport.js |
| **Documentation** | Excellent (community) | Good (AWS docs) | Tie |

### Operational Comparison

| Aspect | Passport.js | AWS Cognito | Winner |
|--------|-------------|-------------|---------|
| **Deployment Complexity** | Low | Medium | Passport.js |
| **Monitoring** | Manual (CloudWatch) | Built-in (CloudWatch) | Cognito |
| **Backup/Recovery** | PostgreSQL backups | AWS managed | Cognito |
| **Multi-Region** | Manual replication | Built-in | Cognito |
| **Disaster Recovery** | Manual | AWS managed | Cognito |
| **Vendor Lock-in** | Low | High (AWS-specific) | Passport.js |

### Security Comparison

| Aspect | Passport.js | AWS Cognito | Winner |
|--------|-------------|-------------|---------|
| **Security Updates** | Manual (npm updates) | AWS managed | Cognito |
| **Compliance (GDPR, etc.)** | Your responsibility | AWS shared responsibility | Cognito |
| **Token Management** | Session hijacking risk | JWT expiration + refresh | Cognito |
| **Brute Force Protection** | Manual implementation | Built-in rate limiting | Cognito |
| **Compromised Credentials** | Manual detection | AWS detection service | Cognito |

### Cost Comparison

| Aspect | Passport.js | AWS Cognito | Winner |
|--------|-------------|-------------|---------|
| **Infrastructure** | EB + RDS (existing) | EB + RDS + Cognito | Passport.js |
| **Monthly Active Users** | Included in RDS | $0 (free tier) / $0.0055 per MAU | Cognito (free tier) |
| **MFA (SMS)** | AWS SNS cost | AWS SNS cost + Cognito MFA | Tie |
| **Development Time** | $0 (existing) | 2-4 weeks engineer time | Passport.js |
| **Maintenance** | Ongoing engineer time | Minimal | Cognito |

**Verdict**: Passport.js is currently cheaper, but Cognito becomes more cost-effective at scale.

### When to Choose Passport.js

✅ **Choose Passport.js if:**
- You need full control over authentication logic
- You want to minimize vendor lock-in
- Your authentication requirements are simple
- You have limited budget for migration
- You prioritize development speed and simplicity
- Your team is already familiar with Passport.js
- You want to avoid AWS-specific dependencies

### When to Choose AWS Cognito

✅ **Choose AWS Cognito if:**
- You want a fully managed authentication solution
- You need built-in MFA, adaptive security, or social login
- You're scaling to many concurrent users
- You want to reduce operational burden
- You're already heavily invested in AWS ecosystem
- You need enterprise features (SAML, advanced security)
- You want built-in compliance (HIPAA, SOC2, etc.)

### Hybrid Approach (Recommended for P3)

Given your context, consider this approach:
1. **Fix the 404 issue first** with Passport.js (likely routing bug)
2. **Keep Passport.js** for now (it's working fine besides the bug)
3. **Implement Cognito later** when you need:
   - Social login (Google OAuth is already planned)
   - MFA for enterprise customers
   - Advanced security features
4. **Use gradual migration** with Lambda trigger when ready

---

## 6. User Migration Strategies: Deep Dive

### Strategy 1: User Migration Lambda (Recommended)

**Pros:**
- ✅ Zero downtime
- ✅ Transparent to users (no password reset)
- ✅ Gradual migration (users migrate on login)
- ✅ Preserves existing passwords
- ✅ Rollback-friendly (keep Passport.js as fallback)

**Cons:**
- ❌ Complex setup (Lambda + API endpoint)
- ❌ Requires both systems running in parallel
- ❌ Inactive users never migrate (need cleanup strategy)
- ❌ Depends on legacy system availability

**When to Use:**
- Large active user base
- Cannot afford user friction (password resets)
- Need zero-downtime migration
- **Your scenario: 👉 BEST FIT**

**Implementation Checklist:**
- [ ] Create Lambda function with migration logic
- [ ] Add legacy user validation endpoint to API
- [ ] Secure endpoint with migration secret
- [ ] Configure Cognito User Pool with Lambda trigger
- [ ] Test migration with sample users
- [ ] Monitor migration success rate
- [ ] Plan cleanup for inactive users (6-12 months)

### Strategy 2: CSV Bulk Import

**Pros:**
- ✅ Migrate all users at once
- ✅ Simpler than Lambda trigger
- ✅ No parallel systems needed

**Cons:**
- ❌ All users must reset passwords
- ❌ High user friction
- ❌ Cannot import existing password hashes (bcrypt not supported)
- ❌ Potential user churn

**When to Use:**
- Small user base (<1000 users)
- Can tolerate password reset friction
- Want to avoid Lambda complexity

**Implementation:**
```bash
# Export users from PostgreSQL
psql $DATABASE_URL -c "COPY (SELECT email, name FROM users) TO '/tmp/users.csv' CSV HEADER;"

# Import to Cognito
aws cognito-idp admin-create-user --user-pool-id <POOL_ID> --username user@example.com \
  --user-attributes Name=email,Value=user@example.com Name=name,Value="John Doe" \
  --desired-delivery-mediums EMAIL
```

**CSV Format:**
```csv
email,name,email_verified
user@example.com,John Doe,true
```

### Strategy 3: Hybrid (Migration Lambda + Bulk Import)

**Approach:**
1. Bulk import active users (last login <30 days) via CSV
2. Use Lambda trigger for inactive users
3. Force password reset for imported users

**Pros:**
- ✅ Faster migration for active users
- ✅ Fallback for inactive users
- ✅ Reduces Lambda invocations

**Cons:**
- ❌ Complex coordination
- ❌ Still requires password resets

### Password Hash Migration: Technical Details

#### Current Hashing (Passport.js + bcrypt)
```javascript
// When user registers
const hashedPassword = await bcrypt.hash(password, 10);

// When user logs in
const isValid = await bcrypt.compare(inputPassword, storedHash);
```

#### Challenge: Cognito Hash Incompatibility

AWS Cognito **does not support bcrypt password import**. Supported formats:
- None (must use migration trigger or force reset)

**Workaround:**
Use the Lambda migration trigger to validate passwords against your existing bcrypt hashes:

```javascript
// Lambda function validates password
const bcrypt = require('bcryptjs'); // Works in Lambda

exports.handler = async (event) => {
  const { userName, password } = event.request;

  // Fetch stored hash from your database
  const storedHash = await fetchPasswordHashFromDB(userName);

  // Validate with bcrypt
  const isValid = await bcrypt.compare(password, storedHash);

  if (isValid) {
    // Cognito will create new user with Cognito's own hash
    return {
      ...event,
      response: {
        userAttributes: { /* user data */ },
        finalUserStatus: 'CONFIRMED',
      },
    };
  }

  throw new Error('Invalid credentials');
};
```

**Result:** User's password is re-hashed by Cognito on first login. Subsequent logins use Cognito's hash.

---

## 7. Code Examples: Full Implementation

### Project Structure

```
server/
├── middleware/
│   ├── auth.ts                    # Dual auth middleware (session + JWT)
│   └── cognitoAuth.ts             # Cognito-specific auth
├── routes/
│   ├── auth.ts                    # Auth routes
│   └── legacyMigration.ts         # Migration endpoints
├── services/
│   └── cognito.ts                 # Cognito service wrapper
└── config/
    └── cognito.ts                 # Cognito configuration

client/
├── contexts/
│   └── AuthContext.tsx            # Auth context with Cognito
├── hooks/
│   └── useAuth.ts                 # Auth hook
└── components/
    └── LoginForm.tsx              # Login form

lambda/
└── cognitoUserMigration.js        # User migration Lambda
```

### Server Configuration

```typescript
// server/config/cognito.ts
export const cognitoConfig = {
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  clientId: process.env.COGNITO_CLIENT_ID!,
  region: process.env.AWS_REGION || 'ap-southeast-1',
  jwksUri: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`,
};

if (!cognitoConfig.userPoolId || !cognitoConfig.clientId) {
  console.warn('⚠️  Cognito configuration missing - JWT authentication disabled');
}
```

### Cognito Service Wrapper

```typescript
// server/services/cognito.ts
import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  AdminDeleteUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { cognitoConfig } from '../config/cognito';

const client = new CognitoIdentityProviderClient({
  region: cognitoConfig.region,
});

export class CognitoService {
  /**
   * Get user details from Cognito
   */
  static async getUser(username: string) {
    const command = new AdminGetUserCommand({
      UserPoolId: cognitoConfig.userPoolId,
      Username: username,
    });

    try {
      const response = await client.send(command);
      return {
        username: response.Username,
        attributes: response.UserAttributes?.reduce((acc, attr) => {
          acc[attr.Name!] = attr.Value!;
          return acc;
        }, {} as Record<string, string>),
        enabled: response.Enabled,
        status: response.UserStatus,
      };
    } catch (error) {
      console.error('Error fetching Cognito user:', error);
      throw error;
    }
  }

  /**
   * Update user attributes
   */
  static async updateUserAttributes(username: string, attributes: Record<string, string>) {
    const command = new AdminUpdateUserAttributesCommand({
      UserPoolId: cognitoConfig.userPoolId,
      Username: username,
      UserAttributes: Object.entries(attributes).map(([Name, Value]) => ({
        Name,
        Value,
      })),
    });

    try {
      await client.send(command);
    } catch (error) {
      console.error('Error updating user attributes:', error);
      throw error;
    }
  }

  /**
   * Delete user from Cognito
   */
  static async deleteUser(username: string) {
    const command = new AdminDeleteUserCommand({
      UserPoolId: cognitoConfig.userPoolId,
      Username: username,
    });

    try {
      await client.send(command);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Sync user data from PostgreSQL to Cognito
   */
  static async syncUserFromDatabase(user: any) {
    try {
      await this.updateUserAttributes(user.email, {
        name: user.name || '',
        'custom:credits': user.credits?.toString() || '0',
        // Add other custom attributes as needed
      });
    } catch (error) {
      console.error('Error syncing user to Cognito:', error);
    }
  }
}
```

### React Login Form with Cognito

```typescript
// client/src/components/LoginForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '../hooks/useToast';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      toast({
        title: 'Success',
        description: 'Logged in successfully',
      });
    } catch (error: any) {
      console.error('Login error:', error);

      // Handle specific Cognito errors
      if (error.code === 'UserNotConfirmedException') {
        toast({
          title: 'Email Not Verified',
          description: 'Please verify your email before logging in',
          variant: 'destructive',
        });
      } else if (error.code === 'NotAuthorizedException') {
        toast({
          title: 'Invalid Credentials',
          description: 'Incorrect email or password',
          variant: 'destructive',
        });
      } else if (error.code === 'UserNotFoundException') {
        // This might be a legacy user - migration trigger will handle
        toast({
          title: 'Login Failed',
          description: 'Invalid email or password',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: error.message || 'An error occurred',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  );
};
```

### API Request Interceptor (Automatic Token Attachment)

```typescript
// client/src/lib/api.ts
import { CognitoUserPool } from 'amazon-cognito-identity-js';

const userPool = new CognitoUserPool({
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID!,
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID!,
});

/**
 * Get current Cognito ID token
 */
const getCurrentIdToken = (): Promise<string | null> => {
  return new Promise((resolve) => {
    const cognitoUser = userPool.getCurrentUser();

    if (!cognitoUser) {
      resolve(null);
      return;
    }

    cognitoUser.getSession((err: any, session: any) => {
      if (err || !session.isValid()) {
        resolve(null);
        return;
      }

      resolve(session.getIdToken().getJwtToken());
    });
  });
};

/**
 * Fetch wrapper that automatically adds auth token
 */
export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const token = await getCurrentIdToken();

  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
};

// Example usage in API calls
export const getUserProfile = async () => {
  const response = await authenticatedFetch('/api/user/profile');
  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }
  return response.json();
};
```

---

## 8. Common Pitfalls and Gotchas

### Pitfall #1: Token Expiration Handling

**Problem:** Access tokens expire after 1 hour by default. Users get logged out.

**Solution:** Implement automatic token refresh using refresh tokens.

```typescript
// client/src/contexts/AuthContext.tsx (updated)
import { CognitoUserPool, CognitoUser, CognitoRefreshToken } from 'amazon-cognito-identity-js';

const refreshSession = async () => {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();

    if (!cognitoUser) {
      reject(new Error('No user found'));
      return;
    }

    cognitoUser.getSession((err: any, session: any) => {
      if (err) {
        reject(err);
        return;
      }

      const refreshToken = session.getRefreshToken();

      cognitoUser.refreshSession(refreshToken, (refreshErr, newSession) => {
        if (refreshErr) {
          reject(refreshErr);
          return;
        }

        resolve(newSession);
      });
    });
  });
};

// Call this before API requests or set up automatic refresh
useEffect(() => {
  const interval = setInterval(async () => {
    try {
      await refreshSession();
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Redirect to login
    }
  }, 50 * 60 * 1000); // Refresh every 50 minutes (before 1-hour expiry)

  return () => clearInterval(interval);
}, []);
```

### Pitfall #2: CORS Issues with Cognito APIs

**Problem:** Browser blocks Cognito API calls due to CORS.

**Solution:** Cognito APIs are CORS-enabled by default, but ensure you're using the correct SDK methods:

```typescript
// ❌ WRONG: Direct API calls may have CORS issues
fetch('https://cognito-idp.ap-southeast-1.amazonaws.com/', {
  method: 'POST',
  body: JSON.stringify({ /* ... */ }),
});

// ✅ CORRECT: Use amazon-cognito-identity-js SDK
import { CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';
```

### Pitfall #3: User Not Found vs Invalid Password

**Problem:** During migration, you want to distinguish "user doesn't exist" from "wrong password".

**Solution:** Lambda migration trigger handles this automatically:
- User not found in legacy DB → Cognito returns "UserNotFoundException"
- Wrong password → Cognito returns "NotAuthorizedException"

```javascript
// Lambda: Return clear errors
if (!legacyUser) {
  throw new Error('User not found'); // Cognito converts to UserNotFoundException
}

if (!bcrypt.compareSync(password, legacyUser.passwordHash)) {
  throw new Error('Invalid password'); // Cognito converts to NotAuthorizedException
}
```

### Pitfall #4: Session vs Token Storage

**Problem:** Where to store Cognito tokens? localStorage? sessionStorage? Cookies?

**Comparison:**

| Storage | Security | Persistence | XSS Risk | CSRF Risk |
|---------|----------|-------------|----------|-----------|
| **localStorage** | Low | Across tabs/sessions | High | Low |
| **sessionStorage** | Low | Single tab only | High | Low |
| **httpOnly Cookie** | High | Configurable | Low | High |
| **Memory (state)** | High | Single session | Low | N/A |

**Recommendation:**
- **Development**: Memory (state) or sessionStorage (easier debugging)
- **Production**: httpOnly cookies (most secure)

**Implementation:**
```typescript
// Server: Set refresh token in httpOnly cookie
app.post('/api/auth/token', (req, res) => {
  const { refreshToken } = req.body;

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  res.json({ success: true });
});

// Client: Store access/ID tokens in memory (React state)
const [tokens, setTokens] = useState({ accessToken: '', idToken: '' });
```

### Pitfall #5: Cognito User Pool vs Identity Pool Confusion

**Problem:** Developers confuse User Pools (authentication) with Identity Pools (AWS resource access).

**Clarification:**
- **User Pool**: User directory for authentication (login, signup, MFA) → **You need this**
- **Identity Pool**: AWS credentials for accessing S3, DynamoDB, etc. → **You probably don't need this**

**Your Use Case:** User Pool only (for API authentication)

### Pitfall #6: Lambda Cold Starts During Migration

**Problem:** Lambda migration function has cold starts (1-3 seconds), delaying login.

**Solution:**
- Use **Provisioned Concurrency** (costs $5-10/month per instance)
- Optimize Lambda package size (use Lambda Layers for node_modules)
- Cache bcrypt comparisons if possible

```javascript
// Lambda optimization: Reuse database connection
let cachedDbConnection = null;

exports.handler = async (event) => {
  if (!cachedDbConnection) {
    cachedDbConnection = await connectToDatabase(); // Connection pooling
  }

  // Use cached connection for subsequent invocations
  const user = await cachedDbConnection.query(/* ... */);
};
```

### Pitfall #7: Testing Cognito Locally

**Problem:** Can't test Cognito integration without AWS credentials.

**Solution:**
- Use **Cognito Local** (docker container for local testing)
- Or create a separate "dev" User Pool in AWS for testing

```bash
# Run Cognito Local
docker run -p 9229:9229 jagregory/cognito-local

# Configure app to use local endpoint
export COGNITO_ENDPOINT=http://localhost:9229
```

### Pitfall #8: User Attributes Synchronization

**Problem:** User data in PostgreSQL gets out of sync with Cognito attributes.

**Solution:** Use Cognito as the source of truth for authentication, PostgreSQL for app data.

```typescript
// After login, sync Cognito data to PostgreSQL
app.post('/api/auth/cognito-login', verifyToken, async (req, res) => {
  const cognitoUser = req.user; // From JWT

  // Update or create user in PostgreSQL
  await db.insert(users).values({
    id: cognitoUser.sub,
    email: cognitoUser.email,
    name: cognitoUser.name,
  }).onConflictDoUpdate({
    target: users.id,
    set: {
      email: cognitoUser.email,
      name: cognitoUser.name,
      last_login: new Date(),
    },
  });

  res.json({ success: true });
});
```

### Pitfall #9: Social Login Integration (Google OAuth)

**Problem:** You planned to implement Google OAuth - Cognito provides this but changes the integration approach.

**With Cognito:**
- Configure Google as identity provider in Cognito
- Users can sign in with Google seamlessly
- No need to implement Google OAuth manually

**Configuration:**
```yaml
# Cognito User Pool → Identity Providers → Google
Google Client ID: your_google_client_id
Google Client Secret: your_google_client_secret
Authorized Scopes: profile email openid
Attribute Mapping:
  - email → email
  - name → name
  - picture → picture
```

**React Code:**
```typescript
// Sign in with Google
import { CognitoUserPool } from 'amazon-cognito-identity-js';

const signInWithGoogle = () => {
  const cognitoDomain = 'your-user-pool.auth.ap-southeast-1.amazoncognito.com';
  const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
  const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback');

  window.location.href = `https://${cognitoDomain}/oauth2/authorize?identity_provider=Google&redirect_uri=${redirectUri}&response_type=CODE&client_id=${clientId}&scope=email+openid+profile`;
};
```

### Pitfall #10: Cost Overruns (SMS MFA)

**Problem:** SMS MFA uses AWS SNS, which can get expensive (e.g., $0.10 per SMS in Singapore).

**Solution:**
- Use **TOTP (authenticator apps)** instead of SMS (free)
- Or implement **email-based MFA** as a custom flow

```typescript
// Configure MFA settings in Cognito User Pool
MFA Configuration: Optional
Enabled MFA methods: TOTP (Time-based One-Time Password)
```

---

## 9. Session Management: Deep Dive

### Current Approach (Passport.js)

```
User Login → Passport creates session → Session stored in PostgreSQL
           → Session ID in cookie → Client sends cookie with each request
           → Server validates session ID → Retrieves user from session store
```

**Characteristics:**
- Server maintains session state
- Session data stored in database (PostgreSQL `sessions` table)
- Cookie contains only session ID (opaque token)
- Server memory overhead for active sessions
- Requires sticky sessions or session store for multi-server deployments

### Cognito Approach (Token-Based)

```
User Login → Cognito returns JWT tokens → Client stores tokens
          → Client sends token with each request → Server verifies JWT signature
          → Server extracts user info from token (no database lookup)
```

**Characteristics:**
- Stateless (no server-side session)
- Token contains user data (JWT payload)
- Client responsible for token storage
- No server memory overhead
- Horizontally scalable (no session store needed)

### Token Lifecycle

```
Login → Access Token (1 hour) + ID Token (1 hour) + Refresh Token (30 days)
                │                        │                     │
                │                        │                     │
        API Authorization         User Identification    Token Renewal
         (access control)         (name, email, etc.)   (get new tokens)
                │                        │                     │
                ▼                        ▼                     ▼
        Expires in 1 hour          Expires in 1 hour    Expires in 30 days
                │                        │                     │
                └────────────────────────┴─────────────────────┘
                                         │
                                         ▼
                            Use Refresh Token to get new
                            Access + ID tokens (before expiry)
```

### Session Duration Comparison

| Aspect | Passport.js | AWS Cognito | Winner |
|--------|-------------|-------------|--------|
| **Default Duration** | 24 hours (configurable) | 1 hour (access/ID), 30 days (refresh) | Passport.js (simpler) |
| **Extension** | Sliding session (auto-extends) | Manual refresh required | Passport.js |
| **Inactivity Timeout** | Configurable | Fixed (1 hour) | Passport.js |
| **"Remember Me"** | Easy (extend cookie) | Use refresh token | Tie |
| **Force Logout** | Easy (delete session) | Requires token revocation API | Passport.js |

### Security Implications

| Threat | Passport.js | Cognito | Mitigation |
|--------|-------------|---------|------------|
| **Session Hijacking** | Cookie theft → full access | Token theft → limited access (1 hour) | Cognito (shorter window) |
| **CSRF** | Vulnerable (cookie-based) | Not vulnerable (token in header) | Cognito |
| **XSS** | Session cookie exposed | Tokens in localStorage exposed | Tie (both vulnerable) |
| **Token/Session Leakage** | Revoke session (easy) | Revoke tokens (requires API call) | Passport.js |
| **Replay Attacks** | Session ID can be reused | JWT can be reused (until expiry) | Tie |

**Best Practice:** Use httpOnly cookies for refresh tokens, memory/state for access/ID tokens.

---

## 10. Cost Analysis

### Current Costs (Passport.js)

| Component | Monthly Cost | Notes |
|-----------|--------------|-------|
| **Elastic Beanstalk** | ~$20-50 | t3.small instance |
| **RDS PostgreSQL** | ~$30-60 | db.t3.micro with sessions table |
| **Data Transfer** | ~$5-10 | Minimal |
| **Development Time** | $0 | Already implemented |
| **Total** | **~$55-120/month** | |

### Projected Costs (AWS Cognito)

| Component | Monthly Cost | Notes |
|-----------|--------------|-------|
| **Elastic Beanstalk** | ~$20-50 | Same instance |
| **RDS PostgreSQL** | ~$25-50 | Smaller (no sessions table) |
| **AWS Cognito (User Pool)** | **$0-275** | See breakdown below |
| **Lambda (Migration)** | ~$1-5 | Only during migration period |
| **Data Transfer** | ~$5-10 | Same |
| **Development Time** | **$5,000-10,000** | 2-4 weeks engineer time |
| **Total** | **~$51-390/month** | After migration |

### AWS Cognito Pricing Breakdown

#### User Pool Pricing

| Monthly Active Users (MAU) | Price per MAU | Monthly Cost |
|----------------------------|---------------|--------------|
| **0 - 50,000** | **Free** | **$0** |
| 50,001 - 100,000 | $0.0055 | $275 (for 50k MAUs above free tier) |
| 100,001 - 1,000,000 | $0.0046 | $4,140 (incremental) |
| 1,000,000+ | $0.00325 | Volume discounts |

**Definition of MAU:** Users who perform an identity operation within a calendar month (login, token refresh, sign-up, password change).

**Free Tier (Permanent):**
- First 50,000 MAUs: Free forever
- No credit card required for free tier
- Includes all features (MFA, custom attributes, Lambda triggers)

#### Additional Costs

| Feature | Cost | Notes |
|---------|------|-------|
| **SMS MFA** | $0.00645/SMS (Singapore) | AWS SNS pricing |
| **Email (Amazon SES)** | $0.10/1,000 emails | Verification, password reset |
| **Advanced Security** | +$0.05 per MAU | Adaptive auth, compromised credentials |
| **SAML Federation** | Free | No additional cost |
| **Custom Domains** | $0.90/month | SSL certificate (ACM) |

### Cost Comparison by User Scale

| Active Users | Passport.js | Cognito (Basic) | Cognito (with MFA) | Winner |
|--------------|-------------|-----------------|-------------------|--------|
| **1,000** | $60/month | $60/month (free tier) | $65/month | Tie |
| **10,000** | $75/month | $60/month (free tier) | $90/month | Cognito |
| **50,000** | $120/month | $60/month (free tier) | $380/month | Cognito |
| **100,000** | $200/month | $335/month | $655/month | Passport.js |
| **500,000** | $500/month | $2,195/month | $26,695/month | Passport.js |

**Observations:**
- **Small scale (< 50k MAUs)**: Cognito is cost-neutral or cheaper (free tier)
- **Medium scale (50k-100k)**: Cognito slightly more expensive
- **Large scale (> 100k)**: Passport.js significantly cheaper
- **MFA (SMS)**: Adds substantial cost at scale

### Your Use Case (P3 Interview Academy)

**Current Assumptions:**
- Active users: < 10,000/month (estimate)
- Feature needs: Email verification (done), Google OAuth (planned)
- MFA: Not required yet

**Cost Projection:**
- **Year 1**: $0/month (free tier) + $5,000-10,000 migration cost
- **Year 2-3**: $0-60/month (if staying under 50k MAUs)
- **Break-even point**: ~12-18 months (accounting for migration costs)

**Recommendation:**
- **If < 50k active users expected**: Cognito is cost-neutral long-term
- **If > 50k active users expected**: Passport.js is more cost-effective
- **Key decision factor**: Operational burden vs direct costs

---

## 11. Decision Framework

### Should You Migrate to Cognito?

Use this framework to decide:

```
┌──────────────────────────────────────────────────┐
│  Do you have > 50,000 active users/month?        │
└────────────┬─────────────────────────────────────┘
             │
        YES  │  NO
             │
   ┌─────────▼────────┐
   │  Stay with       │
   │  Passport.js     │
   │  (lower costs)   │
   └──────────────────┘
             │
             │
        ┌────▼─────────────────────────────────────┐
        │  Do you need built-in MFA, adaptive      │
        │  security, or social login soon?         │
        └────┬─────────────────────────────────────┘
             │
        YES  │  NO
             │
   ┌─────────▼─────────┐      ┌─────────────────────┐
   │  Migrate to        │      │  Fix 404 issue      │
   │  Cognito           │      │  with Passport.js   │
   │  (features needed) │      │  (simpler path)     │
   └────────────────────┘      └─────────────────────┘
```

### When to Migrate Now

✅ **Migrate to Cognito now if:**
- AWS team strongly recommends it for your architecture
- You need social login (Google, Facebook) soon
- You want managed MFA and security features
- You're experiencing session scalability issues
- You want to reduce operational burden
- You're already planning a major auth refactor
- Development time is available (2-4 weeks)

### When to Stay with Passport.js

✅ **Stay with Passport.js if:**
- You have limited development resources
- Your current auth is working well (except 404 bug)
- You expect > 100k active users (cost savings)
- You want full control over authentication logic
- You're avoiding vendor lock-in
- You have custom authentication requirements
- **The 404 issue is a simple routing bug (likely!)**

### Hybrid Approach (Recommended)

✅ **Best of both worlds:**
1. **Phase 1 (Now)**: Fix 404 issue with Passport.js
2. **Phase 2 (1-2 months)**: Implement Google OAuth with Passport.js
3. **Phase 3 (6-12 months)**: Evaluate Cognito when you need:
   - MFA for enterprise customers
   - Advanced security features
   - Scaling beyond 50k MAUs

**Rationale:**
- Immediate problem solved (404 bug)
- Deferred migration costs
- Time to evaluate actual need for Cognito
- Gradual migration path preserved

---

## 12. Recommendation for P3 Interview Academy

### Context Summary

- **Current Issue**: 404 error after login (routing bug, not auth architecture)
- **Current Auth**: Passport.js with PostgreSQL sessions (working well)
- **AWS Recommendation**: Migrate to Cognito
- **Scale**: < 10,000 active users/month (estimate)
- **Future Plans**: Google OAuth integration

### My Recommendation: **Do NOT Migrate to Cognito Yet**

#### Reasoning

1. **Root Cause Misdiagnosis**
   - The 404 error is likely a **routing issue** in your React SPA or nginx configuration
   - Related to the recent deployment to Elastic Beanstalk
   - **Not** an authentication architecture problem
   - Migrating to Cognito won't fix this issue

2. **Cost-Benefit Analysis**
   - Migration cost: 2-4 weeks engineer time ($5,000-10,000 value)
   - Benefit: Marginal (your current auth is working)
   - Better ROI: Spend time on feature development (Redesign Project)

3. **Current System is Adequate**
   - Passport.js is battle-tested and working
   - You already implemented email verification
   - PostgreSQL sessions are suitable for your scale
   - No security or scalability issues reported

4. **Risk vs Reward**
   - Migration risk: User friction, bugs, extended testing
   - Reward: Minimal at current scale (< 50k MAUs)

5. **Opportunity Cost**
   - Your Redesign Project (Base44 MVP) is paused
   - Phase 2 UAT bugs were just fixed
   - Focus should be on core product features

### Recommended Action Plan

#### Immediate (This Week)
1. **Debug the 404 Issue**
   - Investigate routing in React app (`client/src/App.tsx`)
   - Check nginx configuration (`.ebextensions/01-nodejs.config`)
   - Review browser network logs for failed redirects
   - Test locally vs staging vs production

2. **Likely Causes**
   - Nginx not configured for SPA fallback (`try_files $uri /index.html`)
   - React Router route mismatch after login redirect
   - Session cookie not being set correctly (secure/sameSite flags)
   - CORS issue blocking authentication response

#### Short-term (1-2 Months)
3. **Implement Google OAuth with Passport.js**
   - Use `passport-google-oauth20` strategy (already planned)
   - No need for Cognito yet
   - See your existing guide: [INTEGRATION.md#google-oauth](INTEGRATION.md)

4. **Monitor Authentication Metrics**
   - Login success/failure rates
   - Session duration and timeout patterns
   - User complaints or support tickets

#### Long-term (6-12 Months)
5. **Re-evaluate Cognito When:**
   - Active users > 25,000/month (approaching free tier limit)
   - Need MFA for enterprise customers
   - Experiencing session scalability issues
   - Want advanced security features (adaptive auth)

6. **Keep Migration Path Open**
   - Document current auth architecture
   - Use standard practices (bcrypt, JWT-compatible patterns)
   - Design APIs with token-based auth in mind

### If You Still Want to Migrate to Cognito

If business requirements dictate Cognito migration despite my recommendation, use this approach:

1. **Fix 404 issue first** (regardless of migration decision)
2. **Use gradual migration** with Lambda User Migration Trigger
3. **Run in parallel** (Passport.js + Cognito) for 2-4 weeks
4. **Test thoroughly** in staging with real user scenarios
5. **Monitor closely** during production rollout
6. **Have rollback plan** ready (keep Passport.js as fallback)

---

## 13. Debugging the 404 Issue (More Likely Solution)

Based on your context, here are the most likely causes of the 404 error after login:

### Issue #1: Nginx SPA Fallback Missing

**Problem:** Nginx serving 404 for client-side routes.

**Fix:**
```nginx
# .ebextensions/01-nodejs.config
files:
  "/etc/nginx/conf.d/client_max_body_size.conf":
    mode: "000644"
    owner: root
    group: root
    content: |
      client_max_body_size 20M;

  "/etc/nginx/conf.d/spa_fallback.conf":
    mode: "000644"
    owner: root
    group: root
    content: |
      location / {
        try_files $uri $uri/ /index.html;
      }
```

### Issue #2: React Router Redirect Mismatch

**Problem:** Login redirects to a route that doesn't exist.

**Check:**
```typescript
// client/src/hooks/useAuth.ts (or similar)
// After successful login, check redirect path
const handleLoginSuccess = () => {
  const redirectPath = new URLSearchParams(window.location.search).get('redirect');
  navigate(redirectPath || '/dashboard'); // Ensure this route exists
};
```

**Verify routes exist:**
```typescript
// client/src/App.tsx
<Route path="/dashboard" element={<Dashboard />} />
<Route path="/home" element={<Home />} /> // Bug #1 fix - ensure this exists
```

### Issue #3: Session Cookie Not Being Set

**Problem:** Session cookie not persisted after login.

**Check:**
```typescript
// server/index.ts
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Requires HTTPS in prod
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax', // Important for cross-origin
  },
  store: new PgStore({ /* ... */ }),
}));
```

**Verify in production:**
- Check if `secure: true` is set (requires HTTPS)
- Verify EB is serving over HTTPS
- Check browser DevTools → Application → Cookies

### Issue #4: CORS Blocking Authentication

**Problem:** Cross-origin request blocked.

**Check:**
```typescript
// server/index.ts
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true, // Required for cookies
}));
```

**Verify:**
- `credentials: true` is set
- `origin` matches your frontend URL
- Browser console shows no CORS errors

### Debugging Steps

1. **Enable Verbose Logging**
```typescript
// server/middleware/auth.ts
export const requireAuth = (req, res, next) => {
  console.log('Auth check:', {
    authenticated: req.isAuthenticated(),
    session: req.session,
    user: req.user,
    cookies: req.cookies,
  });

  if (!req.isAuthenticated()) {
    console.error('Authentication failed - redirecting to login');
    return res.status(401).json({ error: 'Not authenticated' });
  }

  next();
};
```

2. **Check Browser Network Tab**
- Look for failed requests (404s)
- Check response headers for redirects
- Verify cookies are being sent

3. **Test Locally**
```bash
# Run locally with production-like settings
NODE_ENV=production npm run dev
```

4. **Compare Staging vs Production**
- Test login flow in staging (works fine per your docs)
- Compare environment variables
- Check for configuration differences

---

## 14. Summary and Next Steps

### Key Takeaways

1. **AWS Cognito** is a powerful managed authentication service with JWT tokens, built-in MFA, and social login
2. **Migration is non-trivial** (2-4 weeks) and requires careful planning
3. **Your 404 issue** is likely a routing/configuration bug, not an auth architecture problem
4. **Cognito makes sense** for large scale (> 50k MAUs) or when you need advanced features
5. **Passport.js is adequate** for your current scale and requirements

### Recommended Next Steps

#### Option A: Fix 404 Issue First (Recommended)
1. Debug nginx configuration and React routing
2. Test session cookies in production
3. Monitor auth metrics
4. Proceed with existing roadmap (Redesign Project)

#### Option B: Migrate to Cognito
1. Create User Pool in AWS Cognito
2. Implement User Migration Lambda trigger
3. Update React app with Cognito SDK
4. Test in staging for 2-4 weeks
5. Gradual production rollout

### When to Revisit Cognito

**Trigger for re-evaluation:**
- Active users approaching 25,000/month
- Need for MFA (regulatory or customer requirement)
- Session scalability issues
- Advanced security features required
- Significant social login adoption expected

### Resources for Further Reading

- **AWS Cognito Documentation**: https://docs.aws.amazon.com/cognito/
- **User Migration Guide**: https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-import-users.html
- **JWT Best Practices**: https://tools.ietf.org/html/rfc8725
- **Passport.js vs Cognito**: https://blog.logrocket.com/choosing-auth-strategy/

---

## Conclusion

AWS Cognito is a robust authentication solution, but **it's not the right solution for every problem**. Your 404 error after login is almost certainly a routing or configuration issue, not an authentication architecture problem.

**My strong recommendation**: Fix the 404 issue with your current Passport.js setup, and re-evaluate Cognito in 6-12 months when you have clearer scaling and feature requirements.

If you decide to proceed with Cognito migration despite this recommendation, use the gradual migration approach with Lambda User Migration Trigger to minimize user friction.

**Need help debugging the 404 issue?** Let me know, and I can help investigate the routing configuration and session handling in your current setup.
