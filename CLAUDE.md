# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Development Commands
- `npm run dev` - Start development server (React frontend + Express backend)
- `npm run build` - Build the application for production
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

### Database Commands
- `npm run db:push` - Push database schema changes using Drizzle Kit
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

Key environment variables (see `.env.example`):
- **AI Services**: `SEALION_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`
- **Database**: `DATABASE_URL` (PostgreSQL)
- **Google Cloud**: `GOOGLE_API_KEY`, `GCP_PROJECT_ID`, `GCP_REGION`
- **Auth**: `SESSION_SECRET`, `BYPASS_AUTH` (dev only)

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

## Outstanding Issues
- **Local Database Access**: RDS rejects connections from unmanaged IPs (no pg_hba.conf entry), blocking local auth tests and schema normalization.
- **Schema Verification**: `fix-database-schema.js` must be rerun once direct DB access is restored to confirm live columns match Drizzle definitions.

## Immediate Next Steps
- Allowlist the current workstation (or tunnel into the VPC) so local tests can hit the RDS instance.
- Rerun `npm run test:registration` and `node fix-database-schema.js` after connectivity is restored.
- Continue monitoring EB logs and health while validating the `p3-interview-academy-fixes-20250925a` rollout.

## Future Enhancements
- Replace placeholder `SEALION_API_KEY` with live credentials once database issues resolved
- Provision HTTPS for the public endpoint (ACM certificate + load balancer listener)
- Implement database connection retry logic and proper error handling
