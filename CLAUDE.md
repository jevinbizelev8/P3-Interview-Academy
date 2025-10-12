# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

### Operational Updates
- Permanent release notes: `CHANGELOG.md`
- Monthly ops notes: `deployment-scripts/ops-log/` (e.g., `deployment-scripts/ops-log/2025-10.md`)
- Current deployment snapshot: `DEPLOYMENT-STATUS-REPORT.md`

## 🚀 Current Status (2025-10-04)

**✅ ALL SYSTEMS OPERATIONAL**: Email verification system implemented, database separation complete

### Quick Status Check
- **Production**: `p3-interview-academy-prod-v2` - ✅ Healthy (HTTP 200)
- **Staging**: `p3-interview-academy-staging` - ✅ Bundle `p3-interview-academy-eb-20251004-185052`, health green; DB UUID casts pending
- **CI/CD Pipeline**: ✅ Fully operational (GitHub Actions)
- **Database**: ✅ PostgreSQL RDS with 7-day backups, staging/prod separated
- **Testing**: ✅ All tests passing (TypeScript + Vitest + Component)
- **🌐 Bizelev8.ai Integration**: ✅ SSL/CORS configured, ready for DNS setup
- **📧 Email System**: ✅ Gmail SMTP configured, verification & password reset ready for testing
- **🧱 Schema Alignment**: ⚠️ Cast legacy varchar `user_id` / `created_by` columns to UUID in staging/prod before the next deploy

### Recent Deployment Success (2025-10-02) - ✅ RESOLVED
- **Issue**: Practice module "End Session Early" fix (commit `bf0d627`) deployment verification
- **Resolution**: Both modules successfully deployed and tested in production
- **Deployment Timeline**:
  - ✅ Workflow #23: Completed (2m 12s)
  - ✅ Workflow #24: Completed (1m 30s, tests skipped)
  - ✅ EB Environment: Successfully restarted and serving new code
- **Verified Features**:
  - ✅ **Prepare module**: Backend persistence working correctly via `/api/prepare-ai/sessions/:id/status`
  - ✅ **Practice module**: Early session termination now returns HTTP 200 with minimal report (previously returned 400 error)
- **Production Test Results** (2025-10-02 04:17 UTC):
  - Practice "End Session Early" with 0 responses: ✅ Returns minimal report with actionable feedback
  - Prepare session early completion: ✅ Status update persisted successfully
  - Overall system health: ✅ All endpoints responding correctly
- **Test Script**: `node test-end-session-fix.js` validates both fixes automatically

### Developer Workflow
1. **Feature Development** → Create branch, make changes
2. **Pull Request** → Automatic staging deployment + testing
3. **Review & Test** → Staging URL provided in PR comments
4. **Merge to Main** → Automatic production deployment
5. **Monitor** → Health checks and deployment verification

## Development Tools

### Chrome DevTools MCP Integration
- **Chrome MCP**: Installed globally for browser automation and testing
- **Location**: `C:\Users\User\.claude\chrome-mcp-tools\`
- **Quick Start**: Double-click `launch-chrome-debug.bat` then restart Claude Code
- **Capabilities**:
  - Navigate to URLs and interact with web pages
  - Take screenshots and inspect DOM elements
  - Execute JavaScript in browser context
  - Monitor network requests and debug web applications
  - Test staging/production deployments in real browser
- **Documentation**: See `C:\Users\User\.claude\chrome-mcp-tools\README.md`
- **Usage**: Available in all Claude Code projects after Chrome is launched with debugging

## Development Commands

### Essential Development Commands
- `npm run dev` - Start development server (React frontend + Express backend)
- `npm run build` - Build the application for production (runs `npm run check` + `npm run test:run` first via the `prebuild` hook)
- `npm run start` - Start production server
- `npm run check` - Run TypeScript type checking

### Testing Commands
- `npm test` - Run all tests in watch mode
- `npm run test:run` - Run all tests once
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ui` - Launch Vitest UI for interactive testing
- `npm run test:prepare` - Run specific component tests for validation
- `npm run test:integration` - Run integration tests only
- `npm run test:api` - Run API tests only
- Component coverage: `client/src/__tests__/components/LanguageSelector.test.tsx`, `JobDescriptionUpload.test.tsx`, and `SignupForm.test.tsx` keep key onboarding flows stable. Update these when you touch their respective UI.
- AI prep/practice coverage: `client/src/__tests__/integration/prepare-session.integration.test.tsx` validates the Prepare UI handshake, `client/src/__tests__/integration/perform-dashboard.integration.test.tsx` checks analytics surface practice/prepare data, and `server/__tests__/prepare-ai.routes.test.ts` + `server/__tests__/practice.routes.test.ts` ensure REST endpoints stay aligned with shared schemas.

### Database Commands
- `npm run db:push` - Push database schema changes using Drizzle Kit
- After 2025-10-04 deploy, cast any `user_id` / `created_by` columns stored as `varchar` to `uuid` (staging first, then prod) so `ensureCriticalSchema` can create FK constraints without errors.
- Database schema is defined in `shared/schema.ts`
- Uses PostgreSQL with Drizzle ORM
- Boot-time schema guard: `ensureCriticalSchema()` in `server/services/schema-auditor.ts` runs every server start to create the AI Prepare tables and rename legacy `interview_sessions` columns. Restart the API after restoring a snapshot or run `node -e "import('./dist/services/schema-auditor.js').then(m => m.ensureCriticalSchema())"` to apply it manually.

## Architecture Overview

### Project Structure
This is a full-stack TypeScript application with a React frontend and Express.js backend:

- **`client/`** - React frontend with Vite build system
- **`server/`** - Express.js backend with TypeScript
- **`shared/`** - Shared types, schemas, and utilities between client/server
- **`attached_assets/`** - Static assets and AI-generated images

### Key Architectural Patterns

#### Full-Stack TypeScript
- Strict TypeScript configuration across frontend and backend
- Shared types in `shared/types.ts` and database schema in `shared/schema.ts`
- Path aliases: `@/*` for client, `@shared/*` for shared code

#### AI Services Architecture
The application integrates multiple AI services with a fallback pattern:
- **Primary**: SeaLion AI (optimized for Southeast Asian markets)
- **Fallbacks**: SeaLion AI, AWS Bedrock (Anthropic Claude)
- All AI services are abstracted through service classes in `server/services/`

#### Database Design
- PostgreSQL with Drizzle ORM
- Schema supports multi-language content (7 Southeast Asian languages)
- Key tables: users, interview_sessions, interview_messages, preparation_sessions
- Session management for both authentication and interview state

### Frontend Architecture

#### React Application Structure
- **Vite** for fast development and building
- **Tailwind CSS + Shadcn/ui** for styling and components
- **TanStack Query** for server state management and caching
- **Wouter** for lightweight client-side routing
- **React Hook Form + Zod** for form validation

#### Component Organization
- `client/src/components/` - Reusable UI components
- `client/src/pages/` - Route-specific page components
- `client/src/hooks/` - Custom React hooks
- `client/src/services/` - API client services

### Backend Architecture

#### Express.js Server Structure
- **Main entry**: `server/index.ts`
- **Route definitions**: `server/routes.ts` (main routes) + modular routers
- **Services layer**: `server/services/` for business logic
- **Middleware**: `server/middleware/` for auth, logging, etc.

#### Key Services
- **AI Service** (`ai-service.ts`) - Orchestrates multiple AI providers
- **SeaLion Service** (`sealion.ts`) - Southeast Asia optimized AI
- **Question Bank Service** - Manages interview questions
- **Response Evaluation Service** - STAR method evaluation
- **Language Service** - Multi-language support (7 languages)

#### Authentication System
- Simple password-based authentication (`auth-simple.ts`)
- Session management with PostgreSQL storage
- Admin role support
- Development bypass mode available (`BYPASS_AUTH=true`)

## Multi-Language Support

The application supports 7 Southeast Asian languages:
- English (en)
- Bahasa Malaysia (ms)
- Bahasa Indonesia (id)
- Thai (th)
- Vietnamese (vi)
- Filipino (fil)
- Chinese Singapore (zh-sg)

Language constants are defined in `shared/schema.ts` as `SUPPORTED_LANGUAGES`.

## Environment Configuration

**🔒 SECURITY NOTE**: Never commit credentials to version control. Use environment variables or AWS CLI profiles.

Key environment variables (see `.env.example`):
- **AWS Credentials**: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (use AWS CLI profiles when possible)
- **AI Services**: `SEALION_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`
- **Database**: `DATABASE_URL` (PostgreSQL)
- **Google Cloud**: `GOOGLE_API_KEY`, `GCP_PROJECT_ID`, `GCP_REGION`
- **Auth**: `SESSION_SECRET`, `BYPASS_AUTH` (dev only)
- **CORS/Integration**: `WS_ALLOWED_ORIGINS` (for WebSocket cross-origin support)
- **SSL/Security**: `FORCE_HTTPS` (enforces secure cookies in production)

## Interview Platform Features

### Three Core Modules
1. **Prepare** - AI question generation and study plans
2. **Practice** - Real-time AI interview simulations
3. **Perform** - Analytics and performance tracking

### STAR Method Integration
The platform evaluates responses using the STAR framework:
- **Situation** - Context and background
- **Task** - Specific responsibilities
- **Action** - Steps taken
- **Result** - Outcomes achieved

Evaluation logic is in `server/services/response-evaluation-service.ts`.

### Practice Module Notes
- `client/src/pages/practice/interview-practice.tsx` auto-requests the first AI prompt once `getPracticeSession` resolves and the mutation queue is idle. If you seed practice sessions manually, reset `current_question_number` to 1 (or null) so the bootstrap question still fires.
- Voice playback now reads `data.question.questionText` from `/api/practice/sessions/:id/ai-question`; API changes should continue populating that field alongside the existing `content` fallback.

## Development Notes

### Testing Strategy
- **Vitest** for unit and integration testing
- **@testing-library/react** for component testing
- **MSW** for API mocking in tests
- Test files use `.test.ts` or `.test.tsx` extensions

### Build and Deployment
- Frontend builds to `dist/public/`
- Backend builds to `dist/` with esbuild
- Optimized for Replit deployment
- Docker support available

### Voice Features
- Browser-based Speech-to-Text and Text-to-Speech APIs
- No server-side voice processing costs
- Multi-language voice support matching the 7 supported languages

## Deployment Infrastructure

### Deployment Scripts (`deployment-scripts/`)
The project includes comprehensive deployment automation:
    - **Utility Scripts**: see `deployment-scripts/util` for ad-hoc maintenance, schema fixes, and debugging helpers

- **`full-deployment.sh`** - Complete deployment orchestration (recommended)
- **`setup-environment-variables.sh`** - Interactive AWS environment variable configuration
- **`verify-database.sh`** - Database connectivity and schema verification
- **`create-deployment-bundle.sh`** - Production bundle creation with proper artifacts
- **`deploy-to-eb.sh`** - AWS Elastic Beanstalk deployment automation
- **`check-environment-status.sh`** - Environment health and configuration checking

### AWS Configuration (`.ebextensions/`)
Elastic Beanstalk configuration files for proper deployment:

- **`01-nodejs.config`** - Node.js platform settings, health checks, static file serving
- **`02-environment-validation.config`** - Pre-deployment validation hooks
- **`03-logging.config`** - Enhanced logging and monitoring setup
- **`04-ssl.config`** - SSL certificate and HTTPS configuration for custom domains

### Health Check System
Three-tier health checking system:

- **`/api/health/simple`** - Basic health check for load balancers
- **`/api/health`** - Enhanced health with database connectivity and system status
- **`/api/diagnostics`** - Detailed system diagnostics (requires authentication)

### Deployment Process
1. **Environment Setup**: Configure critical variables (DATABASE_URL, SESSION_SECRET, etc.)
2. **Database Verification**: Test connectivity and schema
3. **Build Verification**: Ensure artifacts are created correctly
4. **Bundle Creation**: Package production-ready deployment
5. **AWS Deployment**: Deploy to Elastic Beanstalk with monitoring

### Troubleshooting Resources
- **`DEPLOYMENT.md`** - Comprehensive production deployment guide
- **`verify-database.js`** - Detailed database testing utility
- Environment validation scripts with actionable error messages
- Automated rollback procedures and emergency commands

### Production Requirements
- PostgreSQL database with `DATABASE_URL`
- Session encryption with `SESSION_SECRET`
- WebSocket CORS configuration with `WS_ALLOWED_ORIGINS`
- Optional AI service API keys for full functionality

## AWS Deployment Notes

### Current Environment
- Platform: AWS Elastic Beanstalk (AL2023 Node.js 20)
- Application: `p3-interview-academy`
- Environment: `p3-interview-academy-prod-v2`
- URL: `http://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com`

### Runtime
- Build: `npm run build` → backend to `dist/`, frontend to `dist/public/`
- Start: `npm run start` → `node dist/index.js`
- Health endpoint: `GET /api/health`

### Environment Variables (Production)
- Required
  - `NODE_ENV=production`
  - `PORT` (default 5000; EB reverse-proxy forwards 80→5000)
  - `DATABASE_URL` (PostgreSQL / RDS)
  - `WS_ALLOWED_ORIGINS` (comma-separated or `*` for all)
  - `OPENAI_API_KEY` (OpenAI SDK)
  - Optional provider keys: `SEALION_API_KEY`, `ANTHROPIC_API_KEY`, Google/Bedrock vars
- Set so far in EB
  - `NODE_ENV=production`
  - `OPENAI_API_KEY` (configured via EB env vars)

### WebSocket/CORS
- Socket.IO CORS origin is parameterized via `WS_ALLOWED_ORIGINS` in `server/services/prepare-websocket-service.ts`.
- Main application CORS configured in `server/index.ts` to allow bizelev8.ai iframe embedding
- Current production settings: `https://www.bizelev8.ai,https://bizelev8.ai,https://p3app.bizelev8.ai`
- Use `*` for initial beta across unknown origins, then restrict to your domain(s).

### Deployment Artifacts
- S3 bucket (EB-managed): `elasticbeanstalk-ap-southeast-1-<account-id>`
- Latest uploaded bundle: `p3-interview-academy/p3-interview-academy-fixes-20250925a.zip`
- EB Application Version: created per deployment from the S3 bundle

### Operational Commands (AWS CLI)
- Set env var:
  - `aws elasticbeanstalk update-environment --environment-name p3-interview-academy-prod-v2 --option-settings Namespace=aws:elasticbeanstalk:application:environment,OptionName=OPENAI_API_KEY,Value=***`
- Check environment status:
  - `aws elasticbeanstalk describe-environments --environment-names p3-interview-academy-prod-v2`
- Tail recent events:
  - `aws elasticbeanstalk describe-events --environment-name p3-interview-academy-prod-v2 --max-items 20`
- Create app version from S3 bundle:
  - `aws elasticbeanstalk create-application-version --application-name p3-interview-academy --version-label <label> --source-bundle S3Bucket=elasticbeanstalk-ap-southeast-1-<account-id>,S3Key=p3-interview-academy/<zip>`
- Deploy version to environment:
  - `aws elasticbeanstalk update-environment --environment-name p3-interview-academy-prod-v2 --version-label <label>`

### Known Status
- App is deploying on EB and responding on `/api/health`.
- Default EB landing page may appear temporarily during rollout; verify static serving and start command if it persists.

### Recommended Next Steps
- Confirm all production env vars (especially `DATABASE_URL`, `WS_ALLOWED_ORIGINS`, provider keys).
- Point a custom domain via Route 53 and enable HTTPS (ACM certificate).
- Consider CI/CD (GitHub Actions) to build → upload to S3 → create app version → deploy.

### Current Deployment Status
- Environment: `p3-interview-academy-prod-v2` - Status: Ready, Health: Green (version `p3-interview-academy-fixes-20250925a`)
- URL: `http://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com`
- Latest bundle: `p3-interview-academy/p3-interview-academy-fixes-20250925a.zip`
- Observed: root HTML and `/api/health` endpoints return 200; `/api/auth/signup` passes end-to-end; `/api/auth/user` responds 401 until a session cookie is present.
- Note: external RDS access is blocked by `pg_hba.conf`; local signup tests and schema scripts require the tester IP to be allowlisted.

### Update: 2025-09-25
- Added `test-registration-flow.ts` (`npm run test:registration`) to exercise signup/login/logout; requires the dev server on port 5000 and RDS access.
- Refined `fix-database-schema.js` to normalize snake_case columns; rerun once RDS firewall rules allow the workstation.
- Built and deployed bundle `p3-interview-academy-fixes-20250925a` via Elastic Beanstalk; smoke tests confirm health endpoints and signup succeed.

### Update: 2025-09-29 - Complete CI/CD Pipeline Implementation
- **🎉 DEPLOYMENT COMPLETE**: Full-stack CI/CD pipeline successfully implemented and operational
- **🚀 Production Environment**: `p3-interview-academy-prod-v2` - Healthy and stable
  - **Status**: HTTP 200, 29ms response time, all health checks passing
  - **Database**: PostgreSQL RDS connection verified (28ms response time)
  - **Features**: Automated production deployments on main branch merges
- **🧪 Staging Environment**: `p3-interview-academy-staging` - Enhanced workflow implemented
  - **URL**: `http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com`
  - **Trigger**: Automatic PR-based deployments with full testing pipeline
  - **Workflow**: Tests → Build → Bundle → Deploy + Auto-Config → Health Checks → PR Comments
  - **Status**: ✅ **RESOLVED** - Deployment issues identified and comprehensively fixed
- **🔧 Infrastructure Improvements**:
  - Fixed AL2023 platform configuration (removed deprecated NodeCommand/NodeVersion)
  - Auto-configuration of environment variables during deployments
  - Enhanced error handling with timeout management and retry logic
  - Cross-platform npm scripts with Windows/Linux compatibility
- **📋 Pipeline Features**:
  - Automated testing (TypeScript + Vitest + Component tests)
  - Bundle creation and S3 upload
  - Rolling deployments with health verification
  - PR integration with staging URLs and status updates

### Update: 2025-09-29 - Practice Module Integration Complete ✅
- **✅ PRACTICE MODULE TESTING COMPLETE**: Full end-to-end workflow validated in production
- **🔧 Database Schema Fixes**: Successfully resolved all missing tables and column alignment issues
  - **Fixed**: Missing database tables (`practice_sessions`, `practice_messages`, `practice_reports`)
  - **Fixed**: Schema alignment with Drizzle definitions (added missing `timestamp`, `created_at`, `updated_at` columns)
  - **Fixed**: RDS security group configuration to allow AWS deployment access
  - **Tools Used**: AWS SDK for infrastructure updates, direct SQL deployment scripts
- **🧪 End-to-End Workflow Validation**:
  - **✅ AI Question Generation**: Confirmed OpenAI integration working in production
  - **✅ User Response Submission**: Validated message storage and session tracking
  - **✅ Session Progression**: Verified `currentQuestionNumber` updates correctly
  - **✅ Perform Dashboard Integration**: Confirmed session data flows to performance analytics
- **📊 Production Test Results**:
  - Practice session creation: ✅ Working (unique UUIDs, proper user association)
  - AI question generation: ✅ Working (contextual questions based on job position/stage)
  - User response capture: ✅ Working (messages stored with timestamps and metadata)
  - Session tracking: ✅ Working (progress tracking, message history, status updates)
  - Perform module data flow: ✅ Working (sessions appear in analytics with proper metrics)
- **🔨 Infrastructure Scripts Created**:
  - `aws-sdk-rds-security.js`: RDS security group automation
  - `comprehensive-schema-fix.js`: Complete schema alignment tool
  - `simple-schema-deploy.js`: Direct database table deployment
  - Production testing endpoints for schema validation

### Staging Deployment Troubleshooting (2025-09-29)
**Issue**: GitHub Actions staging deployments failing with "Max attempts exceeded"

**Root Causes Identified:**
1. Missing environment variables (`DATABASE_URL`, `SESSION_SECRET`, `WS_ALLOWED_ORIGINS`)
2. Application returning 502 errors due to startup failures
3. Rolling deployment stuck waiting for unhealthy application
4. AWS CLI waiter timing out after 15+ minutes

**Solution Implemented:**
- ✅ Auto-configure environment variables during deployment via `--option-settings`
- ✅ Enhanced timeout handling with graceful fallbacks
- ✅ Health check retry logic (3 attempts, 30-second intervals)
- ✅ Better error reporting and deployment status information
- ✅ Workflow continues even if health checks are temporarily slow

**Future Deployments**: Should complete successfully with proper environment configuration

### 🎯 Current Operational Status

**Production Environment**:
- Environment: `p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com`
- Status: ✅ Healthy and stable
- Latest Version: Auto-updated via CI/CD pipeline
- Health: HTTP 200 responses, database connected, all services operational
- **Practice Module**: ✅ Fully functional end-to-end workflow validated

**Staging Environment**:
- Environment: `p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com`
- Status: ✅ Infrastructure ready, workflow enhanced
- Configuration: Auto-configured environment variables on deployment
- Deployment: PR-based with comprehensive testing and verification

**GitHub Actions Workflows**:
- Production Deployment: ✅ Operational (triggers on main branch pushes)
- Staging Deployment: ✅ Enhanced and operational (triggers on PR creation/updates)
- Testing Pipeline: ✅ All tests passing consistently
- Bundle Creation: ✅ Automated S3 upload and version management

**Database Status**:
- PostgreSQL RDS: ✅ Healthy (28ms response time)
- Schema Alignment: ✅ Complete (all Drizzle tables and columns aligned)
- Practice Module Tables: ✅ Deployed (`practice_sessions`, `practice_messages`, `practice_reports`)
- Security Groups: ✅ Configured for AWS deployment access

**Feature Status**:
- **Practice Module**: ✅ Production ready (AI generation, session tracking, analytics integration)
- **Perform Dashboard**: ✅ Receiving practice session data correctly
- **AI Integration**: ✅ OpenAI API working in production environment

**Next Steps for Development Teams**:
1. ✅ **COMPLETED**: Practice module testing and validation
2. ✅ **COMPLETED**: Bizelev8.ai integration configuration
3. **IN PROGRESS**: Authentication system testing (user sign-up and login flows)
4. Create feature branches and PRs to automatically test staging deployments
5. Monitor deployment health through GitHub Actions and AWS EB console

## 🌐 Bizelev8.ai Integration (2025-09-30)

**✅ INTEGRATION READY**: P3 Interview Academy configured for secure iframe embedding into bizelev8.ai

### Integration Overview
P3 Interview Academy is now configured to be embedded as an iframe within the bizelev8.ai website under a "P3 Interview (beta)" page. This integration provides seamless access to the interview platform while maintaining the bizelev8.ai branding and user experience.

### Technical Implementation ✅

#### SSL & Custom Domain Configuration
- **SSL Certificate Setup**: `.ebextensions/04-ssl.config` configured for `p3app.bizelev8.ai`
- **HTTPS Enforcement**: Automatic HTTP to HTTPS redirects
- **Load Balancer**: HTTPS listener on port 443 with SSL termination
- **Certificate Management**: AWS Certificate Manager (ACM) integration ready

#### CORS & Security Headers
- **Cross-Origin Resource Sharing**: Configured to allow embedding from bizelev8.ai domains
  - `https://www.bizelev8.ai`
  - `https://bizelev8.ai`
  - `https://p3app.bizelev8.ai`
- **Content Security Policy**: `frame-ancestors 'self' https://www.bizelev8.ai https://bizelev8.ai`
- **X-Frame-Options**: Removed to allow iframe embedding
- **Credentials**: Cross-origin cookies and authentication supported

#### WebSocket CORS Support
- **Socket.IO Configuration**: Updated `WS_ALLOWED_ORIGINS` to include bizelev8.ai domains
- **Real-time Features**: Voice recording, AI responses, and live feedback supported in embedded mode

### Deployment Status
- **Configuration**: ✅ Complete (SSL, CORS, security headers)
- **Code Deployment**: ✅ Pushed to main branch (auto-deployed via CI/CD)
- **DNS Setup**: ⏳ Pending CNAME record configuration
- **SSL Certificate**: ⏳ Pending domain verification after DNS setup

### DNS Configuration Required
Add this CNAME record to bizelev8.ai DNS settings:
```
Type: CNAME
Name: p3app
Value: p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com
TTL: 300
```

### SSL Certificate Setup Process
1. **Request Certificate**: AWS Certificate Manager for `p3app.bizelev8.ai`
2. **Domain Validation**: DNS validation method
3. **Certificate ARN**: Update `.ebextensions/04-ssl.config` with certificate ARN
4. **Deploy Updated Config**: Automatic via GitHub Actions

### Wix Integration Code
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

### Integration Features
- **Responsive Design**: Mobile-optimized iframe sizing
- **Session Persistence**: Authentication maintained across page loads
- **Voice Support**: Microphone and camera permissions configured
- **Full Functionality**: All P3 Interview features available in embedded mode
- **Security**: Sandboxed iframe with appropriate permissions
- **Performance**: Lazy loading and optimized for embedded use

### Monitoring & Analytics
- **Health Checks**: Standard monitoring continues to work
- **User Analytics**: Session tracking maintains user context
- **Performance**: Response times monitored for embedded usage
- **Error Tracking**: Enhanced logging for cross-origin issues

### Future Enhancements
- **Single Sign-On**: Potential integration with bizelev8.ai user accounts
- **Custom Branding**: Option to customize colors/themes for embedded view
- **Analytics Integration**: Cross-domain analytics tracking
- **Progressive Web App**: Potential standalone app installation from iframe

## Deployment Progress (2025-09-24)

### Initial Issues Resolved
- Resolved production 502s by rebuilding the bundle so the runtime no longer imports Vite (`server/index.ts`, `server/setup-vite.ts`, `server/vite.ts`).
- Published Elastic Beanstalk application version `p3-interview-academy-vitefix-20250924d` with refreshed environment variables (database URL, session secret, placeholder AI keys).

### Major Fixes Completed (Latest Update)
- **Database Schema**: Successfully created all missing database tables (`sessions`, `users`, `interview_sessions`, `interview_messages`) using manual SQL deployment
- **TypeScript Errors**: Fixed all 22 TypeScript compilation errors in `server/routes.ts` with proper type definitions and error handling
- **Production Deployment**: Deployed version `p3-interview-academy-fixes-20250924` with comprehensive fixes
- **Authentication Setup**: Configured live OpenAI API key (`sk-proj-LiIt7owCsU9D6L0yzxNFFIg2z...`) in production environment

### Current Production Status
- **Environment**: `p3-interview-academy-prod-v2` - Status: Ready, Health: Red (database timeout issues)
- **URL**: `http://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com`
- **Working Endpoints**:
  - ✅ Root page: 200 OK in 62ms (React app serving)
  - ✅ `/api/health/simple`: 200 OK in 13ms (basic health check)
- **Database Issues**: Enhanced health (`/api/health`) and auth endpoints (`/api/auth/*`) timeout after 15+ seconds

## Outstanding Tasks

### Bizelev8.ai Integration
- **DNS Configuration**: Add CNAME record for `p3app.bizelev8.ai` pointing to AWS Elastic Beanstalk
- **SSL Certificate**: Request and configure AWS Certificate Manager certificate for custom domain
- **Wix Page Setup**: Create "P3 Interview (beta)" page with iframe embed code

### Development & Testing
- **Authentication Flow Testing**: Complete user sign-up and login flow validation
- **Schema Verification**: Confirm all database schema updates are properly deployed
- **Cross-Origin Testing**: Validate iframe functionality once DNS/SSL is configured

## Immediate Next Steps (Bizelev8.ai)
1. **Configure DNS**: Add the provided CNAME record to bizelev8.ai DNS settings
2. **SSL Setup**: Request certificate in AWS Certificate Manager for `p3app.bizelev8.ai`
3. **Domain Validation**: Complete DNS validation for SSL certificate
4. **Update Certificate ARN**: Add certificate ARN to `.ebextensions/04-ssl.config`
5. **Test Integration**: Verify iframe embedding works with HTTPS domain

## 🔐 Security Best Practices

### AWS Credentials Management
- **❌ NEVER commit credentials to git repositories** - This is a critical security vulnerability
- **✅ Use AWS CLI profiles**: Configure with `aws configure --profile bizelev8`
- **✅ Use environment variables**: Set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` externally
- **✅ Enable MFA** on your AWS account for additional security
- **✅ Regularly rotate access keys** (every 90 days recommended)
- **✅ Use least privilege principle** - only grant necessary permissions
- **✅ Monitor AWS CloudTrail** for unauthorized activity

### Security Incident Response (2025-09-30) ✅ RESOLVED
On September 30, 2025, AWS detected exposed credentials in the public GitHub repository:
- **Affected Key**: `AKIAWCHYHHICYOWB626U` (deleted and replaced)
- **Files Cleaned**: `aws-rds-security-update.js`, `check-deployment-status.js`, `deploy-with-schema.js`, `aws-sdk-deploy.js`, `aws-schema-deploy.js`
- **Actions Taken**:
  - ✅ Immediate credential removal from all repository files
  - ✅ Secure configuration implemented (environment variables only)
  - ✅ Compromised key deleted from AWS IAM
  - ✅ New access key generated (`AKIAWCHYHHIC7FAFLACQ`)
  - ✅ AWS CLI configured with new credentials
  - ✅ Elastic Beanstalk access verified
- **Status**: ✅ **INCIDENT RESOLVED** - Repository secured, credentials rotated successfully
- **Verification**: Production (Green/Ok) and Staging (Ready) environments accessible with new credentials

### Development Security Guidelines
- **Code Review**: Always review code for sensitive data before committing
- **Secret Scanning**: Use tools like GitGuardian or GitHub secret scanning
- **Environment Separation**: Keep production credentials separate from development
- **Backup Strategy**: Secure backup of credentials outside of version control
- **Team Training**: Ensure all developers understand security best practices

## Troubleshooting Common Deployment Issues

### Issue: GitHub Actions Completes But Code Not Active (2025-10-01)
**Symptom**: Workflow shows "success" but production still runs old code
**Diagnosis Steps**:
1. Check server uptime: `curl http://[EB-URL]/api/health | jq .uptime`
2. Compare uptime before/after deployment (should reset to <60 seconds)
3. Test specific functionality: `node test-end-session-fix.js`

**Solutions** (try in order):
1. **Wait longer**: EB environment updates can take 10-15 minutes after workflow completes
2. **Manual workflow trigger**: Use GitHub Actions workflow_dispatch with `skip_tests: true`
   ```bash
   curl -X POST -H "Authorization: Bearer $GITHUB_TOKEN" \
     https://api.github.com/repos/jevinbizelev8/P3-Interview-Academy/actions/workflows/deploy-eb-production.yml/dispatches \
     -d '{"ref":"main","inputs":{"skip_tests":"true"}}'
   ```
3. **Force EB restart**: Directly restart the EB environment (requires AWS credentials)
4. **Empty commit push**: `git commit --allow-empty -m "Trigger deployment" && git push`

**Prevention**:
- Monitor EB environment health in AWS console during deployments
- Check GitHub Actions logs for any warnings about EB update failures
- Verify `.github/workflows/deploy-eb-production.yml` waits for `environment-updated` event

### Testing Deployment Success
Use the automated test script to verify both Practice and Prepare module fixes:
```bash
node test-end-session-fix.js
```

**Expected Results**:
- ✅ Prepare Module: HTTP 200, session completion persisted
- ✅ Practice Module: HTTP 200, minimal report created for 0 responses
- ❌ If Practice returns 400 "No responses to evaluate": deployment not active yet

## 📧 Email Verification & Authentication System (2025-10-04)

**Branch**: `email-fix`
**Status**: ✅ Implementation complete, ready for staging testing

### Implemented Features

#### Email Verification System
- **Signup Flow**: Users receive verification email with 24-hour token expiration
- **Email Service**: Gmail SMTP integration with beautiful HTML templates
  - Verification emails with branded P³ design
  - Welcome emails after successful verification
  - Password reset emails with 1-hour token expiration
- **Backend Endpoints**:
  - `POST /api/auth/signup` - Creates user, sends verification email
  - `GET /api/auth/verify-email?token=xxx` - Verifies email and auto-logs in user
  - `POST /api/auth/resend-verification` - Resends verification email
- **Frontend Pages**:
  - Updated SignupForm with "Check Your Email" confirmation
  - New `/verify-email` page with token validation
  - Updated LoginForm blocks unverified users with helpful message
- **Database Fields**: Email verification and password reset tokens with expiration timestamps

#### Password Reset System
- **Reset Flow**: Request reset → Email with 1-hour token → Set new password
- **Backend Endpoints**:
  - `POST /api/auth/forgot-password` - Generates token, sends reset email
  - `POST /api/auth/reset-password` - Validates token, updates password
- **Frontend Pages**:
  - Updated ResetPasswordForm requests reset email
  - New `/reset-password` page with token validation and password strength requirements
- **Security**: Password requirements (8+ chars, 1+ number), token expiration, secure token generation

#### Email Configuration
- **SMTP Provider**: Gmail (support@bizelev8.ai)
- **Environment Variables**: Configured in `.env` (see `.env.example` for reference)
- **Email Templates**: HTML templates with gradient styling and P³ branding

### Database Separation (2025-10-04)

**Critical Infrastructure Improvement**: Staging and production now use separate databases

#### Configuration
- **Production**: `postgres` database on RDS (58 users, 21 practice sessions)
- **Staging**: `p3_staging` database on RDS (clean environment for testing)
- **Same RDS Instance**: Cost-effective solution using one RDS with two databases
- **Automated Backups**: Enabled 7-day retention (critical fix from 0 days)

#### Benefits
- ✅ Safe testing without production data risk
- ✅ Email verification testing won't spam real users
- ✅ Performance isolation between environments
- ✅ GDPR/privacy compliance maintained
- ✅ Only $1/month additional cost for backups

#### Documentation
- **Setup Guide**: See `DATABASE_SEPARATION.md` for complete details
- **Verification Scripts**:
  - `create-staging-db.js` - Creates p3_staging database
  - `deploy-staging-schema.js` - Deploys schema to staging
  - `verify-database-separation.js` - Confirms isolation

### Remaining Tasks (Email Fix Branch)

#### Testing (Staging Environment)
- [ ] Test user signup flow with email verification
- [ ] Verify email verification emails are sent correctly
- [ ] Test email verification link (24-hour expiration)
- [ ] Test resend verification email functionality
- [ ] Test login blocked for unverified users
- [ ] Test forgot password flow
- [ ] Test password reset with 1-hour token
- [ ] Verify password strength requirements enforced

#### Google OAuth Implementation (Future)
- [ ] Set up Google Cloud Project and OAuth consent screen
- [ ] Create OAuth 2.0 credentials for P3 Interview Academy
- [x] Implement backend OAuth endpoints:
  - `GET /api/auth/google` - Initiates Google OAuth flow
  - `GET /api/auth/google/callback` - Handles OAuth callback
- [x] Update frontend with "Sign in with Google" button
- [ ] Test Google OAuth signup flow
- [ ] Test Google OAuth login flow
- [ ] Configure staging Google env vars and run checklist
- [ ] Capture staging results + screenshots for PR
- [x] Handle OAuth account linking (existing email with Google)

#### Production Deployment
- [ ] Test all email flows thoroughly in staging
- [ ] Update production environment variables (Gmail SMTP)
- [ ] Merge `email-fix` branch to `main`
- [ ] Monitor production for email delivery issues
- [ ] Verify email verification works in production
- [ ] Document email troubleshooting for support team

### Email Service Configuration

**Gmail SMTP Settings** (configured in `.env`):
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=support@bizelev8.ai
SMTP_PASS=<Gmail App Password>
EMAIL_FROM=support@bizelev8.ai
EMAIL_FROM_NAME=P3 Interview Academy
APP_URL_DEV=http://localhost:5000
APP_URL_PROD=https://p3app.bizelev8.ai
```

### Google OAuth Setup Guide

When ready to implement Google OAuth:

1. **Create Google Cloud Project**:
   - Go to https://console.cloud.google.com
   - Create new project "P3 Interview Academy"
   - Enable Google+ API

2. **Configure OAuth Consent Screen**:
   - App name: "P3 Interview Academy"
   - User support email: support@bizelev8.ai
   - Developer contact: your-email@bizelev8.ai
   - Scopes: email, profile, openid

3. **Create OAuth 2.0 Credentials**:
   - Application type: Web application
   - Authorized redirect URIs:
     - `http://localhost:5000/api/auth/google/callback` (development)
     - `https://p3app.bizelev8.ai/api/auth/google/callback` (production)
   - Save Client ID and Client Secret to `.env`

4. **Environment Variables**:
   ```
   GOOGLE_CLIENT_ID=<your-client-id>
   GOOGLE_CLIENT_SECRET=<your-client-secret>
   GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
   GOOGLE_SUCCESS_REDIRECT=/dashboard
   GOOGLE_FAILURE_REDIRECT=/?authError=google
   VITE_ENABLE_GOOGLE_OAUTH=true
   ```

5. **Provider Discovery**:
   - Frontend toggles Google sign-in based on `GET /api/auth/providers` and the `VITE_ENABLE_GOOGLE_OAUTH` flag.

### Files Modified (Email Fix Branch)

**Backend**:
- `server/auth-simple.ts` - Email verification and password reset endpoints
- `server/storage.ts` - Token-based user lookup methods
- `server/services/email-service.ts` - Gmail SMTP integration (new file)
- `server/services/google-oauth.ts` - Google OAuth helper service (new file)
- `deployment-scripts/google-oauth-staging-checklist.md` - Staging rollout checklist

**Frontend**:
- `client/src/components/LoginForm.tsx` - Adds Google sign-in button and provider detection
- `client/src/components/SignupForm.tsx` - Verification sent confirmation
- `client/src/components/LoginForm.tsx` - Unverified user handling
- `client/src/components/ResetPasswordForm.tsx` - Expiration message update
- `client/src/pages/verify-email.tsx` - Email verification page (new file)
- `client/src/pages/reset-password.tsx` - Password reset page (new file)
- `client/src/App.tsx` - New routes for verification and reset

**Configuration**:
- `.env.example` - Email configuration template
- `shared/schema.ts` - Email verification fields (already deployed to production)

**Database**:
- Schema updates already applied to production database
- All email verification and password reset fields available

## Future Enhancements
- **Google OAuth**: Complete social login implementation (planned)
- **Single Sign-On**: Integrate with bizelev8.ai user authentication system
- **Custom Theming**: Brand customization for embedded iframe experience
- **SeaLion API**: Add live Southeast Asia AI credentials for enhanced regional support
- **Progressive Web App**: Standalone app installation from embedded iframe
- **Analytics Integration**: Cross-domain user behavior tracking
- **Performance Optimization**: Further optimization for embedded usage patterns
