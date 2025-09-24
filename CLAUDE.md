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

### Database Commands
- `npm run db:push` - Push database schema changes using Drizzle Kit
- Database schema is defined in `shared/schema.ts`
- Uses PostgreSQL with Drizzle ORM

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
- **Fallbacks**: OpenAI GPT-4o, Google Vertex AI, AWS Bedrock (Anthropic Claude)
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
- Latest uploaded bundle: `p3-interview-academy/p3-interview-academy-eb-v5.zip`
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
- Environment: `p3-interview-academy-prod-v2` (EB) — Status: Ready, Health: Red (last deploy failed on instance)
- URL: `http://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com`
- OpenAI: `OPENAI_API_KEY` set in EB env vars
- Observed: Root serving EB default page; `/api/health` returns 200 via nginx (HTML). Instance command failure during deploy per EB events.
- Immediate actions: review EB logs, verify start command/`dist` artifacts in bundle, ensure `PORT` env aligns (Node listens on `process.env.PORT`), redeploy corrected bundle.

## Deployment Progress (2025-09-24)
- Resolved production 502s by rebuilding the bundle so the runtime no longer imports Vite (`server/index.ts`, `server/setup-vite.ts`, `server/vite.ts`).
- Published Elastic Beanstalk application version `p3-interview-academy-vitefix-20250924d` with refreshed environment variables (database URL, session secret, placeholder AI keys).
- Verified environment health: `p3-interview-academy-prod-v2` now reports Ready/Green and `/api/health/simple` returns 200.

## Outstanding Follow-Ups
- Replace placeholder `SEALION_API_KEY` / `OPENAI_API_KEY` values with live credentials or adjust AI integrations.
- Provision HTTPS for the public endpoint (ACM certificate + load balancer listener) to remove browser security warnings.
