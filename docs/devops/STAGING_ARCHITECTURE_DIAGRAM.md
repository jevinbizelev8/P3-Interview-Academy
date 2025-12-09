# P3 Interview Academy - Technical Architecture Diagram

**Version**: 1.0
**Date**: 2025-12-09
**Purpose**: DevOps Handoff Documentation

---

## High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USERS / CLIENTS                                 │
│                     (Web Browsers, Embedded iframes)                         │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 │ HTTPS
                                 │
┌────────────────────────────────▼────────────────────────────────────────────┐
│                         AWS ELASTIC BEANSTALK                                │
│                        (ap-southeast-1 Region)                               │
│                                                                              │
│  ┌──────────────────────────┐      ┌──────────────────────────┐            │
│  │   STAGING ENVIRONMENT    │      │  PRODUCTION ENVIRONMENT  │            │
│  │  p3-interview-academy-   │      │  p3-interview-academy-   │            │
│  │       staging            │      │      prod-v2             │            │
│  │                          │      │                          │            │
│  │  AL2023 + Node.js 20     │      │  AL2023 + Node.js 20     │            │
│  │  Single EC2 Instance     │      │  Single EC2 Instance     │            │
│  │                          │      │                          │            │
│  │  ┌────────────────────┐  │      │  ┌────────────────────┐  │            │
│  │  │   NGINX Reverse    │  │      │  │   NGINX Reverse    │  │            │
│  │  │      Proxy         │  │      │  │      Proxy         │  │            │
│  │  │   (Port 80/443)    │  │      │  │   (Port 80/443)    │  │            │
│  │  └─────────┬──────────┘  │      │  └─────────┬──────────┘  │            │
│  │            │              │      │            │              │            │
│  │  ┌─────────▼──────────┐  │      │  ┌─────────▼──────────┐  │            │
│  │  │  Express.js Server │  │      │  │  Express.js Server │  │            │
│  │  │    (Node.js 20)    │  │      │  │    (Node.js 20)    │  │            │
│  │  │   Port 5000        │  │      │  │   Port 5000        │  │            │
│  │  │                    │  │      │  │                    │  │            │
│  │  │  ┌──────────────┐  │  │      │  │  ┌──────────────┐  │  │            │
│  │  │  │ REST API     │  │  │      │  │  │ REST API     │  │  │            │
│  │  │  │ /api/*       │  │  │      │  │  │ /api/*       │  │  │            │
│  │  │  └──────────────┘  │  │      │  │  └──────────────┘  │  │            │
│  │  │                    │  │      │  │                    │  │            │
│  │  │  ┌──────────────┐  │  │      │  │  ┌──────────────┐  │  │            │
│  │  │  │ WebSocket    │  │  │      │  │  │ WebSocket    │  │  │            │
│  │  │  │ (Socket.IO)  │  │  │      │  │  │ (Socket.IO)  │  │  │            │
│  │  │  └──────────────┘  │  │      │  │  └──────────────┘  │  │            │
│  │  │                    │  │      │  │                    │  │            │
│  │  │  ┌──────────────┐  │  │      │  │  ┌──────────────┐  │  │            │
│  │  │  │ Static Files │  │  │      │  │  │ Static Files │  │  │            │
│  │  │  │ /dist/public │  │  │      │  │  │ /dist/public │  │  │            │
│  │  │  └──────────────┘  │  │      │  │  └──────────────┘  │  │            │
│  │  └────────────────────┘  │      │  └────────────────────┘  │            │
│  └──────────┬───────────────┘      └──────────┬───────────────┘            │
└─────────────┼────────────────────────────────┼─────────────────────────────┘
              │                                 │
              │                                 │
              └─────────────┬───────────────────┘
                            │
                            │ PostgreSQL Protocol (SSL)
                            │
┌───────────────────────────▼─────────────────────────────────────────────────┐
│                      AWS RDS POSTGRESQL                                      │
│                       (ap-southeast-1)                                       │
│                                                                              │
│  Instance: p3interviewacademy.cnecks4s8kqj.ap-southeast-1.rds.amazonaws.com│
│  Port: 5432                                                                  │
│  SSL: Required (sslmode=require)                                             │
│                                                                              │
│  ┌────────────────────────┐      ┌────────────────────────┐                │
│  │  Database: p3_staging  │      │  Database: postgres    │                │
│  │  User: app_user_staging│      │  User: app_user_prod   │                │
│  │  (Staging Only)        │      │  (Production Only)     │                │
│  └────────────────────────┘      └────────────────────────┘                │
│                                                                              │
│  Backups: 7-day retention (automated snapshots)                             │
│  Multi-AZ: No (single instance)                                             │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## CI/CD Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            GITHUB REPOSITORY                                 │
│                  github.com/jevinbizelev8/P3-Interview-Academy              │
│                                                                              │
│  Branches:                                                                   │
│  ├── main (production-ready)                                                │
│  ├── feature/backend-credits-management (active development)                │
│  └── [other feature branches]                                               │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 │ Git Push / PR Events
                                 │
┌────────────────────────────────▼────────────────────────────────────────────┐
│                          GITHUB ACTIONS                                      │
│                    (.github/workflows/*.yml)                                 │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                 PR-BASED STAGING DEPLOYMENT                         │    │
│  │           (.github/workflows/deploy-eb-staging.yml)                 │    │
│  │                                                                     │    │
│  │  Trigger: Pull Request → main branch                               │    │
│  │                                                                     │    │
│  │  Step 1: Run Tests                                                 │    │
│  │    ├─ TypeScript type checking (npm run check)                     │    │
│  │    ├─ Client tests (118 tests, Vitest + jsdom)                     │    │
│  │    └─ Server tests (203 tests, Vitest + node)                      │    │
│  │                                                                     │    │
│  │  Step 2: Build Application                                         │    │
│  │    ├─ Frontend: Vite → dist/public/                                │    │
│  │    └─ Backend: TypeScript → dist/                                  │    │
│  │                                                                     │    │
│  │  Step 3: Deploy to Staging                                         │    │
│  │    ├─ AWS OIDC authentication (no long-lived credentials)          │    │
│  │    ├─ Create EB application version                                │    │
│  │    ├─ Deploy to p3-interview-academy-staging                       │    │
│  │    └─ Wait for environment health: Green                           │    │
│  │                                                                     │    │
│  │  Step 4: Post PR Comment                                           │    │
│  │    └─ Comment with staging URL and deployment status               │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │             MAIN BRANCH PRODUCTION DEPLOYMENT                       │    │
│  │            (.github/workflows/deploy-main.yml)                      │    │
│  │                                                                     │    │
│  │  Trigger: Push to main branch (PR merge)                           │    │
│  │                                                                     │    │
│  │  Step 1: Run Tests (same as PR workflow)                           │    │
│  │                                                                     │    │
│  │  Step 2: Build Application (same as PR workflow)                   │    │
│  │                                                                     │    │
│  │  Step 3: Deploy to Staging                                         │    │
│  │    └─ (Same EB deployment process)                                 │    │
│  │                                                                     │    │
│  │  Step 4: Run Smoke Tests                                           │    │
│  │    ├─ Health endpoints (/api/health/simple, /api/health)           │    │
│  │    ├─ Database connectivity                                        │    │
│  │    ├─ Authentication endpoints                                     │    │
│  │    ├─ Prepare module APIs                                          │    │
│  │    └─ Practice module APIs                                         │    │
│  │                                                                     │    │
│  │  Step 5: Manual Approval Gate                                      │    │
│  │    └─ GitHub Environments: Wait for admin approval                 │    │
│  │                                                                     │    │
│  │  Step 6: Deploy to Production                                      │    │
│  │    ├─ Same build artifact from Step 2 (ensures parity)             │    │
│  │    ├─ Deploy to p3-interview-academy-prod-v2                       │    │
│  │    └─ Wait for environment health: Green                           │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  Authentication: AWS OIDC (role: github-actions-deployer)                   │
│  Permissions: ElasticBeanstalk, S3, CloudWatch (least privilege)            │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Application Stack Details

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (CLIENT LAYER)                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Framework:         React 18 + TypeScript                                    │
│  Build Tool:        Vite 5.x                                                 │
│  Routing:           Wouter (lightweight client-side routing)                 │
│  Styling:           Tailwind CSS + Shadcn/ui components                      │
│  State Management:  TanStack Query (React Query) for server state            │
│  Forms:             React Hook Form + Zod validation                         │
│  Real-time:         Socket.IO client for WebSocket connections               │
│                                                                              │
│  Build Output: dist/public/ (served as static files by Express)              │
│                                                                              │
│  Key Pages:                                                                  │
│  ├─ /              → Home/Landing page                                       │
│  ├─ /auth          → Authentication (login/register)                         │
│  ├─ /prepare       → AI question generation                                  │
│  ├─ /practice      → Real-time interview simulations                         │
│  ├─ /perform       → Analytics and performance tracking                      │
│  └─ /subscription  → Credit purchase (Stripe integration)                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                       BACKEND (SERVER LAYER)                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Runtime:           Node.js 20 LTS                                           │
│  Framework:         Express.js 4.x + TypeScript                              │
│  Real-time:         Socket.IO for WebSocket communication                    │
│  Authentication:    Passport.js (local strategy, session-based)              │
│  Sessions:          express-session + PostgreSQL session store               │
│  Database ORM:      Drizzle ORM                                              │
│                                                                              │
│  Entry Point:       dist/index.js (compiled from server/index.ts)            │
│  Port:              5000 (proxied by nginx)                                  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      API ENDPOINTS                                  │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │                                                                     │    │
│  │  Authentication & User Management:                                  │    │
│  │  ├─ POST   /api/auth/register           Register new user          │    │
│  │  ├─ POST   /api/auth/login              Login with credentials     │    │
│  │  ├─ POST   /api/auth/logout             Logout and clear session   │    │
│  │  ├─ GET    /api/auth/me                 Get current user profile   │    │
│  │  └─ PATCH  /api/auth/profile            Update user profile        │    │
│  │                                                                     │    │
│  │  Prepare Module (Question Generation):                             │    │
│  │  ├─ POST   /api/prepare/start           Start preparation session  │    │
│  │  ├─ POST   /api/prepare/generate        Generate AI questions      │    │
│  │  └─ GET    /api/prepare/sessions        List user sessions         │    │
│  │                                                                     │    │
│  │  Practice Module (Interview Simulation):                           │    │
│  │  ├─ POST   /api/practice/sessions       Create practice session    │    │
│  │  ├─ GET    /api/practice/sessions/:id   Get session details        │    │
│  │  ├─ POST   /api/practice/sessions/:id/ai-question                  │    │
│  │  │                                       Request AI question        │    │
│  │  ├─ POST   /api/practice/sessions/:id/user-response                │    │
│  │  │                                       Submit user response       │    │
│  │  └─ POST   /api/practice/sessions/:id/complete                     │    │
│  │                                          End session early          │    │
│  │                                                                     │    │
│  │  Perform Module (Analytics):                                       │    │
│  │  ├─ GET    /api/perform/analytics       Get performance data       │    │
│  │  └─ GET    /api/perform/history         Session history            │    │
│  │                                                                     │    │
│  │  Subscription & Credits (Stripe):                                  │    │
│  │  ├─ POST   /api/stripe/create-checkout-session                     │    │
│  │  │                                       Create payment session     │    │
│  │  ├─ POST   /api/webhooks/stripe         Handle Stripe webhooks     │    │
│  │  └─ GET    /api/credits/balance         Get user credit balance    │    │
│  │                                                                     │    │
│  │  Admin & Management:                                               │    │
│  │  ├─ POST   /api/admin/credits/adjust    Adjust user credits        │    │
│  │  ├─ GET    /api/admin/audit-logs        View audit logs            │    │
│  │  └─ GET    /api/admin/users             List/manage users          │    │
│  │                                                                     │    │
│  │  Health & Diagnostics:                                             │    │
│  │  ├─ GET    /api/health/simple           Basic health check         │    │
│  │  ├─ GET    /api/health                  Enhanced health check      │    │
│  │  └─ GET    /api/diagnostics             Detailed diagnostics       │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    BUSINESS SERVICES                                │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │                                                                     │    │
│  │  server/services/                                                   │    │
│  │  ├─ openai-service.ts          Primary AI provider (GPT-4)         │    │
│  │  ├─ question-generation.ts     Question generation logic           │    │
│  │  ├─ response-evaluation.ts     STAR method evaluation              │    │
│  │  ├─ credit-service.ts          Credit management & transactions    │    │
│  │  ├─ stripe-service.ts          Payment processing                  │    │
│  │  └─ email-service.ts           Email notifications (SMTP)          │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER (POSTGRESQL)                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ORM: Drizzle ORM                                                            │
│  Migration Tool: Drizzle Kit                                                 │
│  Schema Location: shared/schema.ts                                           │
│                                                                              │
│  Core Tables (30+ tables):                                                   │
│  ├─ users                   User accounts and profiles                       │
│  ├─ sessions                Express session storage                          │
│  ├─ interview_sessions      Interview simulation sessions                    │
│  ├─ interview_messages      Chat messages (Q&A)                              │
│  ├─ preparation_sessions    Preparation module sessions                      │
│  ├─ practice_sessions       Practice module sessions                         │
│  ├─ subscriptions           User subscription plans                          │
│  ├─ credit_transactions     Credit purchase/usage history                    │
│  ├─ audit_logs              Security and admin actions                       │
│  └─ [27 more tables...]                                                      │
│                                                                              │
│  Key Features:                                                               │
│  ├─ Multi-language support (7 Southeast Asian languages)                    │
│  ├─ UUID primary keys for users                                             │
│  ├─ Timestamp tracking (created_at, updated_at)                             │
│  ├─ Soft deletes where applicable                                           │
│  └─ Foreign key constraints for data integrity                              │
│                                                                              │
│  Recent Schema Changes:                                                      │
│  └─ Added external_transaction_id to credit_transactions                    │
│     (Stripe webhook idempotency - prevents double-crediting)                │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## External Integrations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────┐                       │
│  │              OPENAI GPT-4 (Primary AI)           │                       │
│  │  Endpoint: api.openai.com                        │                       │
│  │  Purpose: Question generation, response eval     │                       │
│  │  Models: GPT-4, GPT-3.5-turbo                    │                       │
│  │  API Key: OPENAI_API_KEY                         │                       │
│  └──────────────────────────────────────────────────┘                       │
│                                                                              │
│  ┌──────────────────────────────────────────────────┐                       │
│  │          STRIPE (Payment Processing)             │                       │
│  │  Endpoint: api.stripe.com                        │                       │
│  │  Purpose: Credit purchases, subscriptions        │                       │
│  │  Mode: Test (staging) / Live (production)        │                       │
│  │  Webhook: /api/webhooks/stripe                   │                       │
│  │  Events: checkout.session.completed              │                       │
│  └──────────────────────────────────────────────────┘                       │
│                                                                              │
│  ┌──────────────────────────────────────────────────┐                       │
│  │          SMTP EMAIL (Gmail)                      │                       │
│  │  Server: smtp.gmail.com:587                      │                       │
│  │  From: support@bizelev8.ai                       │                       │
│  │  Purpose: Email verification, password reset     │                       │
│  └──────────────────────────────────────────────────┘                       │
│                                                                              │
│  ┌──────────────────────────────────────────────────┐                       │
│  │      GITHUB (Version Control & CI/CD)            │                       │
│  │  Repo: jevinbizelev8/P3-Interview-Academy        │                       │
│  │  Workflows: GitHub Actions                       │                       │
│  │  OIDC: AWS authentication (no static keys)       │                       │
│  └──────────────────────────────────────────────────┘                       │
│                                                                              │
│  ┌──────────────────────────────────────────────────┐                       │
│  │    AWS SERVICES (Infrastructure)                 │                       │
│  │  ├─ Elastic Beanstalk (application hosting)      │                       │
│  │  ├─ RDS PostgreSQL (database)                    │                       │
│  │  ├─ S3 (deployment bundles)                      │                       │
│  │  ├─ CloudWatch (logs and metrics)                │                       │
│  │  ├─ Certificate Manager (SSL/TLS)                │                       │
│  │  └─ IAM (access control)                         │                       │
│  └──────────────────────────────────────────────────┘                       │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SECURITY LAYERS                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Network Security:                                                           │
│  ├─ AWS Security Groups (firewall rules)                                    │
│  │  ├─ EB instances → RDS (PostgreSQL port 5432 only)                       │
│  │  ├─ Internet → EB (HTTP/HTTPS only)                                      │
│  │  └─ Admin IP allowlist for RDS (emergency access)                        │
│  │                                                                           │
│  ├─ SSL/TLS Enforcement                                                      │
│  │  ├─ Database: sslmode=require (encrypted connections)                    │
│  │  └─ Web: HTTPS enforced via nginx configuration                          │
│  │                                                                           │
│  └─ CORS Configuration                                                       │
│     ├─ Allowed origins: bizelev8.ai domains                                 │
│     └─ WebSocket: WS_ALLOWED_ORIGINS environment variable                   │
│                                                                              │
│  Application Security:                                                       │
│  ├─ Authentication: Passport.js local strategy                              │
│  ├─ Session Management: encrypted express-session                           │
│  ├─ Password Hashing: bcrypt (12 rounds)                                    │
│  ├─ Input Validation: Zod schemas on all endpoints                          │
│  ├─ SQL Injection Prevention: Parameterized queries (Drizzle ORM)           │
│  └─ XSS Prevention: React automatic escaping                                │
│                                                                              │
│  Data Security:                                                              │
│  ├─ Database Separation: staging (p3_staging) vs prod (postgres)            │
│  ├─ Per-Environment Users: app_user_staging, app_user_prod                  │
│  ├─ Least Privilege Grants: SELECT, INSERT, UPDATE, DELETE only             │
│  ├─ Automated Backups: 7-day retention with point-in-time recovery          │
│  └─ Audit Logging: All credit adjustments and admin actions logged          │
│                                                                              │
│  Secrets Management:                                                         │
│  ├─ No credentials in source code (enforced by GitGuardian)                 │
│  ├─ Environment variables in AWS EB configuration                           │
│  ├─ AWS CLI profiles for developer access (no hardcoded keys)               │
│  └─ GitHub Secrets for CI/CD workflows                                      │
│                                                                              │
│  Payment Security (Stripe):                                                  │
│  ├─ Webhook signature verification (STRIPE_WEBHOOK_SECRET)                  │
│  ├─ Idempotency protection (external_transaction_id column)                 │
│  ├─ Payment status validation (paid status required)                        │
│  └─ Test mode for staging, live mode for production                         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Monitoring & Observability

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MONITORING ARCHITECTURE                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  AWS CloudWatch:                                                             │
│  ├─ Application Logs                                                         │
│  │  └─ Log Group: /aws/elasticbeanstalk/p3-interview-academy-*/             │
│  │                                                                           │
│  ├─ EB Environment Metrics                                                   │
│  │  ├─ EnvironmentHealth                                                     │
│  │  ├─ InstanceHealth                                                        │
│  │  ├─ RequestCount                                                          │
│  │  ├─ HTTP 2xx, 4xx, 5xx counts                                            │
│  │  └─ ApplicationLatency                                                    │
│  │                                                                           │
│  └─ RDS Metrics                                                              │
│     ├─ DatabaseConnections                                                   │
│     ├─ CPUUtilization                                                        │
│     ├─ FreeStorageSpace                                                      │
│     └─ ReadLatency / WriteLatency                                            │
│                                                                              │
│  Application Health Checks:                                                  │
│  ├─ Load Balancer Health Check                                              │
│  │  └─ GET /api/health/simple (every 30 seconds)                            │
│  │                                                                           │
│  ├─ Enhanced Health Monitoring                                              │
│  │  └─ GET /api/health (includes database connectivity)                     │
│  │                                                                           │
│  └─ Detailed Diagnostics (authenticated)                                    │
│     └─ GET /api/diagnostics (system stats, env info)                        │
│                                                                              │
│  Deployment Verification:                                                    │
│  └─ Smoke Tests (deployment-scripts/smoke-tests.ts)                         │
│     ├─ Health endpoint checks                                               │
│     ├─ Database connectivity                                                │
│     ├─ Authentication flow                                                  │
│     └─ Core API functionality                                               │
│                                                                              │
│  Audit Logging:                                                              │
│  └─ audit_logs table                                                         │
│     ├─ Admin actions (credit adjustments)                                   │
│     ├─ Security events (login attempts)                                     │
│     ├─ Payment transactions                                                 │
│     └─ System configuration changes                                         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Deployment Artifact Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       BUILD & DEPLOYMENT FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

  Source Code Repository (GitHub)
         │
         │ npm run build
         ▼
  ┌─────────────────────────┐
  │   Build Artifacts       │
  │                         │
  │  dist/                  │
  │  ├─ index.js           │  Backend (Express server)
  │  ├─ *.js (compiled)    │
  │  └─ public/            │  Frontend (React SPA)
  │     ├─ index.html      │
  │     ├─ assets/*.js     │
  │     └─ assets/*.css    │
  │                         │
  │  package.json          │
  │  package-lock.json     │
  │  .ebextensions/        │  EB configuration
  │  Procfile              │  Process management
  └─────────────────────────┘
         │
         │ zip artifact
         ▼
  ┌─────────────────────────┐
  │  Deployment Bundle      │
  │  (application-*.zip)    │
  └─────────────────────────┘
         │
         │ upload to S3
         ▼
  ┌─────────────────────────┐
  │  AWS S3 Bucket          │
  │  (deployment artifacts) │
  └─────────────────────────┘
         │
         │ create-application-version
         ▼
  ┌─────────────────────────┐
  │  EB Application Version │
  │  staging-YYYYMMDD-*     │
  └─────────────────────────┘
         │
         │ update-environment
         ▼
  ┌─────────────────────────────────────┐
  │  Elastic Beanstalk Deployment       │
  │                                     │
  │  1. Download artifact from S3       │
  │  2. Extract to /var/app/current/    │
  │  3. Run npm install --production    │
  │  4. Apply .ebextensions config      │
  │  5. Start process (npm run start)   │
  │  6. Health check verification       │
  │  7. Traffic cutover (rolling)       │
  └─────────────────────────────────────┘
         │
         │ health check
         ▼
  ┌─────────────────────────┐
  │  Environment: Green     │
  │  Status: Ready          │
  └─────────────────────────┘
```

---

## Network Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                        │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 │ HTTPS (443) / HTTP (80)
                                 │
                        ┌────────▼─────────┐
                        │  AWS ELB / ALB   │
                        │  (Load Balancer) │
                        └────────┬─────────┘
                                 │
                   ┌─────────────┴─────────────┐
                   │                           │
         ┌─────────▼────────┐        ┌────────▼─────────┐
         │   Staging EB     │        │  Production EB   │
         │   Environment    │        │   Environment    │
         │                  │        │                  │
         │  EC2 Instance    │        │  EC2 Instance    │
         │  (Single)        │        │  (Single)        │
         │                  │        │                  │
         │  Security Group: │        │  Security Group: │
         │  - 80 (HTTP)     │        │  - 80 (HTTP)     │
         │  - 443 (HTTPS)   │        │  - 443 (HTTPS)   │
         └─────────┬────────┘        └────────┬─────────┘
                   │                           │
                   │ PostgreSQL:5432 (SSL)     │
                   │                           │
                   └─────────────┬─────────────┘
                                 │
                        ┌────────▼─────────┐
                        │   AWS RDS        │
                        │   PostgreSQL     │
                        │                  │
                        │  Security Group: │
                        │  - 5432 (from EB)│
                        │  - Admin IP      │
                        └──────────────────┘

External Service Connections:
├─ api.openai.com:443 (HTTPS)
├─ api.stripe.com:443 (HTTPS)
└─ smtp.gmail.com:587 (STARTTLS)
```

---

## File Structure Reference

```
P3-Interview-Academy/
│
├── .github/
│   └── workflows/
│       ├── deploy-eb-staging.yml       # PR-based staging deployment
│       └── deploy-main.yml             # Main branch production deployment
│
├── .ebextensions/
│   ├── 01-nodejs.config                # Node.js platform, health checks
│   ├── 02-environment-validation.config # Pre-deployment validation
│   ├── 03-logging.config               # Enhanced logging
│   └── 04-ssl.config                   # SSL/HTTPS configuration
│
├── client/                             # React frontend
│   ├── src/
│   │   ├── components/                 # Reusable UI components
│   │   ├── pages/                      # Route pages
│   │   ├── hooks/                      # Custom React hooks
│   │   └── services/                   # API client services
│   └── vite.config.ts
│
├── server/                             # Express backend
│   ├── index.ts                        # Entry point
│   ├── routes.ts                       # Main route definitions
│   ├── services/                       # Business logic
│   │   ├── openai-service.ts
│   │   ├── credit-service.ts
│   │   ├── stripe-service.ts
│   │   └── email-service.ts
│   └── middleware/                     # Express middleware
│
├── shared/                             # Shared types and schema
│   ├── schema.ts                       # Drizzle database schema
│   └── types.ts                        # TypeScript type definitions
│
├── deployment-scripts/                 # Deployment automation
│   ├── full-deployment.sh
│   ├── smoke-tests.ts
│   ├── setup-environment-variables.sh
│   └── util/                           # Utility scripts
│
├── docs/                               # Documentation
│   ├── development/
│   │   ├── TOOLS.md
│   │   └── COMMANDS.md
│   ├── ops-log/
│   │   └── 2025-*.md
│   └── statusline/
│       └── *.md
│
├── dist/                               # Build output (generated)
│   ├── index.js                        # Compiled backend
│   └── public/                         # Compiled frontend
│
├── CLAUDE.md                           # Project overview
├── DEPLOYMENT.md                       # Deployment guide
├── SECURITY.md                         # Security documentation
├── INTEGRATION.md                      # Integration guides
├── package.json
├── tsconfig.json
├── vite.config.ts
├── drizzle.config.ts
└── .env                                # Environment variables (not committed)
```

---

## Environment Variables Reference

See `.env.example` for complete list. Key variables organized by category:

**AWS Infrastructure**:
```bash
AWS_REGION=ap-southeast-1
```

**Database**:
```bash
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require
```

**Authentication**:
```bash
SESSION_SECRET=<32+ char random string>
FORCE_HTTPS=true                        # Production only
BYPASS_AUTH=false                       # Development only
```

**AI Services**:
```bash
OPENAI_API_KEY=sk-...
```

**Payment (Stripe)**:
```bash
STRIPE_MODE=test                        # test or live
STRIPE_TEST_SECRET_KEY=sk_test_...
STRIPE_TEST_PUBLISHABLE_KEY=pk_test_...
STRIPE_TEST_WEBHOOK_SECRET=whsec_...
```

**Email (SMTP)**:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=support@bizelev8.ai
EMAIL_FROM=support@bizelev8.ai
```

**CORS & WebSocket**:
```bash
WS_ALLOWED_ORIGINS=https://bizelev8.ai,https://www.bizelev8.ai
```

---

**Document Version**: 1.0
**Last Updated**: 2025-12-09
**Maintained By**: AI Engineering Team
