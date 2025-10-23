# Integration Documentation

This document contains detailed integration guides for external services and features including Bizelev8.ai iframe embedding, email verification, and Google OAuth authentication.

**Last Updated**: 2025-10-23

---

## 🌐 Bizelev8.ai Integration

**Status**: ✅ Configuration Complete | ⏳ DNS Setup Pending

### Integration Overview

P3 Interview Academy is configured to be embedded as an iframe within the bizelev8.ai website under a "P3 Interview (beta)" page. This integration provides seamless access to the interview platform while maintaining the bizelev8.ai branding and user experience.

### Technical Implementation ✅

#### SSL & Custom Domain Configuration

- **SSL Certificate Setup**: `.ebextensions/04-ssl.config` configured for `p3app.bizelev8.ai`
- **HTTPS Enforcement**: Automatic HTTP to HTTPS redirects
- **Load Balancer**: HTTPS listener on port 443 with SSL termination
- **Certificate Management**: AWS Certificate Manager (ACM) integration ready

#### CORS & Security Headers

**Cross-Origin Resource Sharing**: Configured to allow embedding from bizelev8.ai domains
- `https://www.bizelev8.ai`
- `https://bizelev8.ai`
- `https://p3app.bizelev8.ai`

**Security Headers** (configured in `server/index.ts`):
```javascript
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://www.bizelev8.ai https://bizelev8.ai");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // X-Frame-Options removed to allow iframe embedding
  next();
});
```

**Credentials**: Cross-origin cookies and authentication supported via CORS configuration

#### WebSocket CORS Support

**Socket.IO Configuration**: Updated `WS_ALLOWED_ORIGINS` to include bizelev8.ai domains

Environment variable:
```bash
WS_ALLOWED_ORIGINS=https://www.bizelev8.ai,https://bizelev8.ai,https://p3app.bizelev8.ai
```

**Real-time Features Supported**:
- Voice recording and playback
- AI responses streaming
- Live feedback and notifications
- Session state synchronization

### DNS Configuration

**Required CNAME Record** (add to bizelev8.ai DNS settings):
```
Type: CNAME
Name: p3app
Value: p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com
TTL: 300
```

**Verification**:
```bash
# After DNS propagation (5-30 minutes)
dig p3app.bizelev8.ai

# Should return CNAME record pointing to AWS EB
```

### SSL Certificate Setup Process

1. **Request Certificate** in AWS Certificate Manager:
   ```bash
   aws acm request-certificate \
     --domain-name p3app.bizelev8.ai \
     --validation-method DNS \
     --region ap-southeast-1
   ```

2. **Domain Validation**:
   - Use DNS validation method (recommended)
   - ACM will provide DNS records to add
   - Add validation CNAME to bizelev8.ai DNS

3. **Update Configuration**:
   - Copy certificate ARN from ACM
   - Update `.ebextensions/04-ssl.config`:
     ```yaml
     SSLCertificateArns:
       - arn:aws:acm:ap-southeast-1:ACCOUNT:certificate/CERT-ID
     ```

4. **Deploy** via GitHub Actions (automatic on merge to main)

### Wix Integration Code

**HTML Embed Code** (for Wix Custom Element):
```html
<div style="width: 100%; height: 800px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
  <iframe
    src="https://p3app.bizelev8.ai"
    width="100%"
    height="100%"
    frameborder="0"
    allow="microphone; camera; clipboard-write; fullscreen"
    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads"
    loading="lazy"
    title="P3 Interview Academy - AI Interview Practice Platform">
    <p>Your browser does not support iframes. Please visit <a href="https://p3app.bizelev8.ai">P3 Interview Academy</a> directly.</p>
  </iframe>
</div>
```

**Responsive Design** (mobile-optimized):
```html
<style>
  .p3-iframe-container {
    position: relative;
    width: 100%;
    padding-bottom: 56.25%; /* 16:9 aspect ratio */
    height: 0;
    overflow: hidden;
  }
  .p3-iframe-container iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
  }
  @media (max-width: 768px) {
    .p3-iframe-container {
      padding-bottom: 100%; /* Square on mobile */
    }
  }
</style>

<div class="p3-iframe-container">
  <iframe
    src="https://p3app.bizelev8.ai"
    allow="microphone; camera; clipboard-write; fullscreen"
    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads"
    loading="lazy"
    title="P3 Interview Academy">
  </iframe>
</div>
```

### Integration Features

- **Session Persistence**: Authentication maintained across page loads via cookies
- **Voice Support**: Microphone and camera permissions properly configured
- **Full Functionality**: All P3 Interview features (Prepare, Practice, Perform) available
- **Security**: Sandboxed iframe with appropriate permissions
- **Performance**: Lazy loading and optimized for embedded use
- **Mobile-Responsive**: Adapts to different screen sizes

### Monitoring & Analytics

**Health Checks**: Continue to work normally
- `/api/health/simple` - Basic health check
- `/api/health` - Enhanced health with database check

**User Analytics**: Session tracking maintains user context in embedded mode

**Performance Metrics**: Monitor response times for embedded usage patterns

**Error Tracking**: Enhanced logging for cross-origin issues (see `server/index.ts`)

### Troubleshooting

**Issue**: Iframe not loading
- Check DNS propagation: `dig p3app.bizelev8.ai`
- Verify SSL certificate is active in ACM
- Check browser console for CORS errors

**Issue**: Features not working in iframe
- Verify `allow` attribute includes necessary permissions
- Check `sandbox` attribute isn't too restrictive
- Confirm `WS_ALLOWED_ORIGINS` includes parent domain

**Issue**: Authentication not persisting
- Verify cookies are being sent cross-origin
- Check `FORCE_HTTPS=true` in production
- Confirm `SameSite=None; Secure` cookie attributes

### Future Enhancements

- **Single Sign-On**: Integration with bizelev8.ai user accounts
- **Custom Branding**: Option to customize colors/themes for embedded view
- **Analytics Integration**: Cross-domain analytics tracking with Google Analytics
- **Progressive Web App**: Potential standalone app installation from iframe
- **Postmessage API**: Parent-child communication for tighter integration

---

## 📧 Email Verification & Authentication System

**Branch**: `email-fix` | **Status**: ✅ Implementation Complete | ⏳ Staging Testing Pending

### System Overview

Comprehensive email verification system with SMTP integration, password reset functionality, and user onboarding workflow.

### Email Verification System

#### Signup Flow

1. **User Signs Up**:
   - `POST /api/auth/signup` with email and password
   - Backend creates user with `emailVerified: false`
   - Generates 24-hour verification token
   - Sends verification email via Gmail SMTP

2. **User Receives Email**:
   - Branded P³ HTML template
   - Verification link: `https://p3app.bizelev8.ai/verify-email?token=xxx`
   - 24-hour expiration clearly stated

3. **User Clicks Link**:
   - `GET /api/auth/verify-email?token=xxx`
   - Backend validates token and expiration
   - Sets `emailVerified: true`
   - Auto-logs in user (creates session)
   - Redirects to dashboard

4. **Welcome Email**:
   - Sent after successful verification
   - Includes getting started guide
   - Links to key features

#### Backend Endpoints

**Signup** (`POST /api/auth/signup`):
```typescript
// Request
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "fullName": "John Doe"
}

// Response (201)
{
  "message": "Account created. Please check your email to verify your account.",
  "email": "user@example.com"
}
```

**Verify Email** (`GET /api/auth/verify-email`):
```typescript
// Query params: ?token=abc123

// Success Response (200)
{
  "message": "Email verified successfully",
  "user": { id, email, fullName }
}
// Auto-creates session cookie
```

**Resend Verification** (`POST /api/auth/resend-verification`):
```typescript
// Request
{
  "email": "user@example.com"
}

// Response (200)
{
  "message": "Verification email sent. Please check your inbox."
}
```

#### Frontend Pages

**SignupForm** (`client/src/components/SignupForm.tsx`):
- Shows "Check Your Email" confirmation after signup
- Provides resend verification link
- Clear messaging about 24-hour expiration

**Email Verification Page** (`client/src/pages/verify-email.tsx`):
- Automatically validates token on mount
- Shows loading state during verification
- Success: Redirects to dashboard
- Error: Shows helpful message with resend option
- Token expired: Prompts to resend verification email

**LoginForm** (`client/src/components/LoginForm.tsx`):
- Blocks unverified users from logging in
- Displays: "Please verify your email address first"
- Provides resend verification link

#### Database Schema

**Users Table Fields** (already deployed to production):
```sql
email_verification_token VARCHAR(255)
email_verification_expires TIMESTAMP
email_verified BOOLEAN DEFAULT false
```

### Password Reset System

#### Reset Flow

1. **User Requests Reset**:
   - Clicks "Forgot Password?" on login page
   - `POST /api/auth/forgot-password` with email
   - Backend generates 1-hour reset token
   - Sends password reset email

2. **User Receives Email**:
   - Branded P³ HTML template
   - Reset link: `https://p3app.bizelev8.ai/reset-password?token=xxx`
   - 1-hour expiration clearly stated
   - Security notice about password reset

3. **User Sets New Password**:
   - `POST /api/auth/reset-password` with token and new password
   - Backend validates token, expiration, and password strength
   - Updates password (bcrypt hashed)
   - Invalidates reset token
   - Auto-logs in user
   - Sends confirmation email

#### Backend Endpoints

**Forgot Password** (`POST /api/auth/forgot-password`):
```typescript
// Request
{
  "email": "user@example.com"
}

// Response (200)
{
  "message": "If an account exists with this email, a password reset link has been sent."
}
// Intentionally vague for security
```

**Reset Password** (`POST /api/auth/reset-password`):
```typescript
// Request
{
  "token": "abc123",
  "password": "NewSecurePass123"
}

// Response (200)
{
  "message": "Password reset successfully",
  "user": { id, email, fullName }
}
// Auto-creates session cookie
```

#### Frontend Pages

**ResetPasswordForm** (`client/src/components/ResetPasswordForm.tsx`):
- Email input field
- Clear messaging about reset email
- Link back to login page

**Reset Password Page** (`client/src/pages/reset-password.tsx`):
- Validates token on mount
- Password input with strength requirements
- Confirm password field
- Success: Redirects to dashboard
- Error: Shows helpful message (expired, invalid, etc.)

#### Password Requirements

- Minimum 8 characters
- At least 1 number
- Enforced on both frontend (validation) and backend (verification)

#### Database Schema

**Users Table Fields** (already deployed):
```sql
password_reset_token VARCHAR(255)
password_reset_expires TIMESTAMP
```

### Email Service Configuration

#### Gmail SMTP Setup

**Service**: `server/services/email-service.ts`

**Environment Variables** (required):
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=support@bizelev8.ai
SMTP_PASS=<Gmail App Password>
EMAIL_FROM=support@bizelev8.ai
EMAIL_FROM_NAME=P3 Interview Academy
APP_URL_DEV=http://localhost:5000
APP_URL_PROD=https://p3app.bizelev8.ai
```

**Gmail App Password Setup**:
1. Enable 2FA on support@bizelev8.ai Google account
2. Go to Google Account → Security → 2-Step Verification → App passwords
3. Generate app password for "Mail" on "Other (Custom name)"
4. Copy 16-character password to `SMTP_PASS` environment variable

#### Email Templates

**Location**: `server/services/email-service.ts`

**Available Templates**:
1. **Verification Email**: Branded gradient design with P³ logo
2. **Welcome Email**: Sent after successful verification
3. **Password Reset Email**: Security-focused design with warning
4. **Password Changed Confirmation**: Notifies user of successful reset

**Template Customization**:
```typescript
// Modify templates in email-service.ts
const verificationEmailTemplate = (verificationUrl: string, email: string) => `
  <!DOCTYPE html>
  <html>
  <!-- Custom HTML with inline CSS -->
  </html>
`;
```

### Database Separation

**Critical Infrastructure Improvement**: Staging and production databases are now separate

#### Configuration

**Production Database**:
- Name: `postgres`
- Connection: RDS instance endpoint
- Data: 58 users, 21 practice sessions (as of Oct 4)
- Backups: 7-day automated retention

**Staging Database**:
- Name: `p3_staging`
- Connection: Same RDS instance, different database
- Data: Clean environment for testing
- Backups: 7-day automated retention

**Environment Variables**:
```bash
# Production
DATABASE_URL=postgresql://user:pass@host:5432/postgres

# Staging
DATABASE_URL=postgresql://user:pass@host:5432/p3_staging
```

#### Benefits

- ✅ Safe testing without production data risk
- ✅ Email verification testing won't spam real users
- ✅ Performance isolation between environments
- ✅ GDPR/privacy compliance maintained
- ✅ Only $1/month additional cost for backups

#### Setup Scripts

**Documentation**: See `DATABASE_SEPARATION.md` for complete details

**Verification Scripts**:
- `create-staging-db.js` - Creates `p3_staging` database
- `deploy-staging-schema.js` - Deploys schema to staging
- `verify-database-separation.js` - Confirms isolation

### Testing Checklist (Staging Environment)

#### Email Verification Tests
- [ ] Sign up new user → receives verification email
- [ ] Click verification link → email verified, auto-logged in
- [ ] Verification token expires after 24 hours
- [ ] Resend verification email works
- [ ] Unverified user blocked from login
- [ ] Login after verification succeeds

#### Password Reset Tests
- [ ] Request password reset → receives reset email
- [ ] Click reset link → can set new password
- [ ] Reset token expires after 1 hour
- [ ] Password strength requirements enforced (8+ chars, 1+ number)
- [ ] After reset → auto-logged in
- [ ] Confirmation email sent after password change

#### Email Delivery Tests
- [ ] Emails arrive in inbox (not spam)
- [ ] Email templates render correctly
- [ ] Links in emails work correctly
- [ ] Unsubscribe/footer links (if applicable)

### Files Modified (Email Fix Branch)

**Backend**:
- `server/auth-simple.ts` - Email verification and password reset endpoints
- `server/storage.ts` - Token-based user lookup methods
- `server/services/email-service.ts` - Gmail SMTP integration (new file)

**Frontend**:
- `client/src/components/SignupForm.tsx` - Verification sent confirmation
- `client/src/components/LoginForm.tsx` - Unverified user handling
- `client/src/components/ResetPasswordForm.tsx` - Password reset request
- `client/src/pages/verify-email.tsx` - Email verification page (new file)
- `client/src/pages/reset-password.tsx` - Password reset page (new file)
- `client/src/App.tsx` - New routes for /verify-email and /reset-password

**Configuration**:
- `.env.example` - Email configuration template

**Database**:
- `shared/schema.ts` - Email verification fields (already deployed)

### Deployment to Production

**Pre-Deployment**:
1. Test all email flows thoroughly in staging
2. Verify Gmail SMTP credentials work
3. Test email delivery (inbox vs spam)
4. Confirm all links in emails work correctly

**Deployment**:
1. Update production environment variables (Gmail SMTP)
2. Merge `email-fix` branch to `main`
3. GitHub Actions auto-deploys to production
4. Monitor deployment health checks

**Post-Deployment**:
1. Test signup flow in production
2. Verify email delivery in production
3. Monitor for email delivery issues
4. Document any issues in ops-log

---

## 🔐 Google OAuth Integration

**Status**: ✅ Backend Implemented | ⏳ Google Cloud Setup Pending | ⏳ Testing Pending

### OAuth Flow Overview

1. **User Clicks "Sign in with Google"**
2. **Redirected to Google** OAuth consent screen
3. **User Authorizes** P3 Interview Academy
4. **Google Redirects Back** with authorization code
5. **Backend Exchanges Code** for user profile
6. **Account Created/Linked** and user logged in

### Google Cloud Setup

#### 1. Create Google Cloud Project

```bash
# Visit https://console.cloud.google.com
# Create new project: "P3 Interview Academy"
```

**Project Configuration**:
- Project Name: P3 Interview Academy
- Project ID: p3-interview-academy (or auto-generated)
- Organization: bizelev8.ai

#### 2. Enable APIs

```bash
# Enable Google+ API (for user profile access)
gcloud services enable plus.googleapis.com --project=p3-interview-academy
```

Or via console: APIs & Services → Enable APIs and Services → Google+ API

#### 3. Configure OAuth Consent Screen

**User Type**: External (for public access)

**App Information**:
- App name: `P3 Interview Academy`
- User support email: `support@bizelev8.ai`
- Developer contact email: `support@bizelev8.ai`
- App logo: Upload P³ logo (512x512 PNG)

**Scopes**:
- `email` - Required for email address
- `profile` - Required for name and profile picture
- `openid` - Required for OpenID Connect

**Test Users** (during development):
- Add test email addresses for initial testing

**Publishing Status**: Start with "Testing", publish when ready

#### 4. Create OAuth 2.0 Credentials

**Application Type**: Web application

**Name**: P3 Interview Academy Web Client

**Authorized JavaScript Origins**:
- `http://localhost:5000` (development)
- `https://p3app.bizelev8.ai` (production)

**Authorized Redirect URIs**:
- `http://localhost:5000/api/auth/google/callback` (development)
- `https://p3app.bizelev8.ai/api/auth/google/callback` (production)

**Save Credentials**:
- Download JSON file
- Extract Client ID and Client Secret
- Store in environment variables (never commit to git)

### Backend Configuration

#### Environment Variables

```bash
# Google OAuth Credentials
GOOGLE_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
GOOGLE_SUCCESS_REDIRECT=/dashboard
GOOGLE_FAILURE_REDIRECT=/?authError=google

# Feature Flag
VITE_ENABLE_GOOGLE_OAUTH=true
```

#### Backend Endpoints

**Implemented in** `server/services/google-oauth.ts` and `server/auth-simple.ts`

**Initiate OAuth** (`GET /api/auth/google`):
- Redirects to Google OAuth consent screen
- Includes state parameter for CSRF protection
- Requests email and profile scopes

**OAuth Callback** (`GET /api/auth/google/callback`):
- Receives authorization code from Google
- Exchanges code for access token
- Fetches user profile (email, name, picture)
- Creates new user or links to existing account
- Creates session and redirects to dashboard

**Provider Discovery** (`GET /api/auth/providers`):
```typescript
// Response
{
  "google": true,  // Based on VITE_ENABLE_GOOGLE_OAUTH
  "email": true    // Always true
}
```

### Frontend Integration

**LoginForm** (`client/src/components/LoginForm.tsx`):

**Google Sign-In Button**:
```tsx
{providers.google && (
  <Button
    type="button"
    variant="outline"
    onClick={() => window.location.href = '/api/auth/google'}
    className="w-full"
  >
    <svg><!-- Google Icon --></svg>
    Sign in with Google
  </Button>
)}
```

**Provider Detection**:
```typescript
const { data: providers } = useQuery({
  queryKey: ['/api/auth/providers'],
  queryFn: async () => {
    const res = await fetch('/api/auth/providers');
    return res.json();
  }
});
```

### Account Linking

**Scenario**: User signs up with email, later signs in with Google using same email

**Behavior**:
1. Google OAuth returns email address
2. Backend checks if email already exists
3. If exists and `emailVerified: true` → Link Google account
4. If exists and `emailVerified: false` → Error (ask to verify email first)
5. If not exists → Create new account with Google

**Database Fields**:
```sql
google_id VARCHAR(255)
google_email VARCHAR(255)
google_name VARCHAR(255)
google_picture TEXT
```

### Testing Checklist

#### Development Testing
- [ ] Set up Google Cloud Project
- [ ] Create OAuth 2.0 credentials
- [ ] Configure environment variables locally
- [ ] Test "Sign in with Google" button appears
- [ ] Test OAuth flow (consent → callback → login)
- [ ] Test new account creation via Google
- [ ] Test account linking (existing email)
- [ ] Test error handling (user denies consent)

#### Staging Testing
- [ ] Configure staging Google OAuth credentials
- [ ] Update staging environment variables
- [ ] Run `deployment-scripts/google-oauth-staging-checklist.md`
- [ ] Test OAuth flow in staging environment
- [ ] Verify database records created correctly
- [ ] Test account linking in staging
- [ ] Capture screenshots for documentation

#### Production Deployment
- [ ] Create production OAuth 2.0 credentials
- [ ] Update production environment variables
- [ ] Publish OAuth consent screen (if required)
- [ ] Test OAuth flow in production
- [ ] Monitor for OAuth errors in logs
- [ ] Document troubleshooting steps

### Troubleshooting

**Error**: "redirect_uri_mismatch"
- Verify authorized redirect URIs in Google Cloud Console
- Check `GOOGLE_CALLBACK_URL` matches exactly (including protocol and port)
- Ensure no trailing slashes

**Error**: "access_denied"
- User denied consent (normal behavior)
- Redirect to login with error message
- No action needed

**Error**: "invalid_client"
- Client ID or Client Secret incorrect
- Verify environment variables
- Check Google Cloud Console credentials

**Issue**: Google button not appearing
- Check `VITE_ENABLE_GOOGLE_OAUTH=true` in environment
- Verify `/api/auth/providers` returns `google: true`
- Check frontend provider detection logic

### Security Considerations

- **State Parameter**: CSRF protection included in OAuth flow
- **Token Exchange**: Uses server-side flow (never expose client secret)
- **Session Security**: Same session management as email/password auth
- **Account Linking**: Only links verified email accounts
- **Scope Limitation**: Request minimal scopes (email, profile, openid only)

### Future Enhancements

- **Single Sign-On**: Integrate with bizelev8.ai user accounts
- **Social Profile**: Display Google profile picture in user dashboard
- **OAuth Providers**: Add Microsoft, LinkedIn, GitHub
- **Account Management**: Allow users to link/unlink OAuth providers
- **Refresh Tokens**: Implement token refresh for long-lived sessions

---

## 📚 Additional Resources

- **Security Documentation**: See [SECURITY.md](SECURITY.md)
- **Deployment Guide**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Database Separation**: See `DATABASE_SEPARATION.md`
- **Google OAuth Staging Checklist**: See `deployment-scripts/google-oauth-staging-checklist.md`
- **Main Documentation**: See [CLAUDE.md](CLAUDE.md)
