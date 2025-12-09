# DevOps Engineer - Role Assessment Package

**Company**: P3 Interview Academy
**Position**: DevOps Engineer
**Project Type**: Full-Stack TypeScript SaaS Application
**Document Version**: 1.0 (Candidate Interview Package)
**Date**: December 2025

---

## 🔒 Confidentiality Notice

This document contains technical information about our production infrastructure. Please treat this information as confidential and do not share with third parties. Specific environment details (hostnames, credentials, etc.) have been redacted and will be provided upon hiring.

---

## Executive Summary

P3 Interview Academy is a production-ready, full-stack TypeScript application deployed on AWS Elastic Beanstalk with automated CI/CD via GitHub Actions. We're seeking a DevOps engineer to help maintain and optimize our infrastructure.

**Current Infrastructure Highlights**:
- Production-ready application serving real users
- Fully automated CI/CD pipeline (GitHub Actions + AWS OIDC)
- 540+ tests with 85% pass rate
- PostgreSQL RDS with environment separation
- Strong security posture (no hardcoded credentials, SSL/TLS everywhere)
- 100% deployment success rate (last 5 deployments)

---

## Table of Contents

1. [Infrastructure Overview](#infrastructure-overview)
2. [Technology Stack](#technology-stack)
3. [CI/CD Pipeline](#cicd-pipeline)
4. [Database Architecture](#database-architecture)
5. [Security Posture](#security-posture)
6. [Monitoring & Observability](#monitoring--observability)
7. [Current Challenges](#current-challenges)
8. [Role Expectations](#role-expectations)
9. [Technical Assessment Questions](#technical-assessment-questions)

---

## Infrastructure Overview

### AWS Services Architecture

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
│  │  └────────────────────┘  │      │  └────────────────────┘  │            │
│  └──────────┬───────────────┘      └──────────┬───────────────┘            │
└─────────────┼────────────────────────────────┼─────────────────────────────┘
              │                                 │
              │ PostgreSQL Protocol (SSL)       │
              │                                 │
              └─────────────┬───────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────────────────┐
│                      AWS RDS POSTGRESQL                                      │
│                       (ap-southeast-1)                                       │
│                                                                              │
│  Instance: <RDS_HOSTNAME>.rds.amazonaws.com                                 │
│  Port: 5432                                                                  │
│  SSL: Required (sslmode=require)                                             │
│                                                                              │
│  ┌────────────────────────┐      ┌────────────────────────┐                │
│  │  Database: staging     │      │  Database: production  │                │
│  │  (Staging Only)        │      │  (Production Only)     │                │
│  └────────────────────────┘      └────────────────────────┘                │
│                                                                              │
│  Backups: 7-day retention (automated snapshots)                             │
│  Multi-AZ: No (single instance - optimization opportunity)                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Current Environment Status

| Environment | Status | Platform | Region |
|-------------|--------|----------|--------|
| **Staging** | ✅ Healthy | Amazon Linux 2023 + Node.js 20 | ap-southeast-1 |
| **Production** | ✅ Operational | Amazon Linux 2023 + Node.js 20 | ap-southeast-1 |

**Recent Performance**:
- Average response time: 484ms
- Health check uptime: 100%
- Last 5 deployments: 100% success rate
- Recent incident: 1-minute health degradation (auto-recovered)

### Network Architecture

**Security Groups Configuration**:
- Internet → ALB: HTTP (80), HTTPS (443)
- ALB → EB Instances: HTTP (80)
- EB Instances → RDS: PostgreSQL (5432)
- Admin IP → RDS: PostgreSQL (5432) - emergency access only

**Load Balancing**:
- Application Load Balancer (ALB)
- Health checks every 30 seconds (`/api/health/simple`)
- Rolling deployments with zero downtime target

---

## Technology Stack

### Application Architecture

**Frontend**:
- React 18 + TypeScript
- Vite 5.x (build tool)
- Tailwind CSS + Shadcn/ui components
- TanStack Query (React Query) for server state
- Wouter (lightweight routing)
- Socket.IO client for real-time features

**Backend**:
- Node.js 20 LTS
- Express.js 4.x + TypeScript
- Socket.IO for WebSocket communication
- Passport.js (session-based authentication)
- Drizzle ORM (PostgreSQL)
- Express-session with PostgreSQL store

**Build & Deployment**:
- Backend: TypeScript → `dist/` directory
- Frontend: Vite → `dist/public/` directory
- Entry point: `node dist/index.js`
- Port: 5000 (proxied by nginx)

### Database

**PostgreSQL RDS**:
- Engine: PostgreSQL (latest stable)
- Instance class: (to be optimized based on load)
- Storage: SSD with automated backups
- Separate databases: `staging` and `production`
- Per-environment users with least privilege
- SSL/TLS required for all connections

**Schema**:
- 30+ core tables
- UUID primary keys for users
- Multi-language support (7 Southeast Asian languages)
- Audit logging for all sensitive operations
- Session storage in PostgreSQL

### External Integrations

1. **OpenAI GPT-4** - AI question generation and evaluation
2. **Stripe** - Payment processing (test mode for staging, live for production)
3. **Gmail SMTP** - Email verification and notifications
4. **GitHub** - Version control and CI/CD

---

## CI/CD Pipeline

### Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          GITHUB REPOSITORY                                   │
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
│  │                                                                     │    │
│  │  Trigger: Pull Request → main branch                               │    │
│  │                                                                     │    │
│  │  Step 1: Run Tests (TypeScript + Vitest)                           │    │
│  │  Step 2: Build Application (Vite + tsc)                            │    │
│  │  Step 3: Deploy to Staging (AWS CLI + OIDC)                        │    │
│  │  Step 4: Post PR Comment with Staging URL                          │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │             MAIN BRANCH PRODUCTION DEPLOYMENT                       │    │
│  │                                                                     │    │
│  │  Trigger: Push to main branch (PR merge)                           │    │
│  │                                                                     │    │
│  │  Step 1: Run Tests                                                 │    │
│  │  Step 2: Build Application                                         │    │
│  │  Step 3: Deploy to Staging                                         │    │
│  │  Step 4: Run Smoke Tests                                           │    │
│  │  Step 5: 🔒 Manual Approval Gate                                   │    │
│  │  Step 6: Deploy to Production (same artifact)                      │    │
│  │  Step 7: Verify Production Health                                  │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  Authentication: AWS OIDC (no long-lived credentials)                       │
│  Permissions: ElasticBeanstalk, S3, CloudWatch (least privilege)            │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Key Features

✅ **Single Build Artifact**: Same build deployed to staging and production (ensures parity)
✅ **AWS OIDC**: No static credentials in GitHub (temporary tokens only)
✅ **Automated Testing**: 540+ tests run before deployment
✅ **Smoke Tests**: Comprehensive validation after staging deployment
✅ **Manual Gate**: Production deployments require approval
✅ **Automated Rollback**: Health check failures trigger rollback
✅ **PR Integration**: Staging URLs posted to pull requests

### Deployment Scripts

Available automation scripts (`deployment-scripts/`):

| Script | Purpose | Status |
|--------|---------|--------|
| `full-deployment.sh` | Complete deployment orchestration | Production-ready |
| `smoke-tests.ts` | Automated staging validation | Active |
| `deploy-to-eb.sh` | EB deployment automation | Production-ready |
| `setup-environment-variables.sh` | AWS env config | Interactive tool |
| `check-environment-status.sh` | Health verification | Monitoring |
| `backup-rds.sh` | Database backup automation | Available |
| `verify-database.sh` | DB connectivity checks | Diagnostic |

---

## Database Architecture

### Schema Overview

**30+ Core Tables** including:
- Users and authentication
- Interview sessions and messages
- Preparation and practice sessions
- Subscriptions and credit transactions
- Audit logs and system tables

**Key Features**:
- UUID primary keys for users
- Multi-language support (7 languages)
- Timestamp tracking (created_at, updated_at)
- Foreign key constraints for data integrity
- Soft deletes where applicable

### Database Security

**Environment Separation**:
- Staging database: `staging` (separate from production)
- Production database: `production` (isolated)
- Per-environment users with least privilege grants
- No cross-environment access

**Connection Security**:
- SSL/TLS required (`sslmode=require`)
- Parameterized queries only (Drizzle ORM)
- Security group restrictions
- Admin access IP whitelisted

**Backup Strategy**:
- Automated daily snapshots
- 7-day retention period
- Point-in-time recovery available
- **Optimization Opportunity**: Backup verification and disaster recovery testing

---

## Security Posture

### Current Security Status: ✅ STRONG

**Achievements**:
1. ✅ No hardcoded credentials in codebase
2. ✅ AWS CLI profiles enforced (no static IAM keys)
3. ✅ Database SSL/TLS encryption required
4. ✅ Per-environment database users
5. ✅ Session encryption with secure secrets
6. ✅ Stripe webhook signature verification
7. ✅ Payment idempotency protection
8. ✅ Comprehensive audit logging

### Security Layers

**Network Security**:
- AWS Security Groups (firewall rules)
- SSL/TLS enforcement (database + web)
- CORS configuration for allowed domains
- WebSocket origin validation

**Application Security**:
- Passport.js authentication
- Encrypted session management
- bcrypt password hashing (12 rounds)
- Zod input validation on all endpoints
- SQL injection prevention (parameterized queries)
- XSS prevention (React auto-escaping)

**Data Security**:
- Database environment separation
- Least privilege database grants
- Automated backups (7-day retention)
- Audit logging (all admin actions)

**Payment Security** (Stripe):
- Webhook signature verification
- Idempotency protection (prevents double-charges)
- Payment status validation
- Separate test/live mode per environment

---

## Monitoring & Observability

### Health Check System

**Three-Tier Architecture**:

1. **Basic Health** (`/api/health/simple`)
   - Load balancer health check
   - Response time: <100ms
   - Check interval: 30 seconds
   - Purpose: Quick liveness check

2. **Enhanced Health** (`/api/health`)
   - Includes database connectivity
   - Response includes system status
   - Purpose: Detailed health verification

3. **Diagnostics** (`/api/diagnostics`)
   - Requires authentication
   - Full system metrics and environment info
   - Purpose: Troubleshooting and debugging

### CloudWatch Integration

**Available Metrics**:
- Environment health status
- Instance health
- Request count (2xx, 4xx, 5xx)
- Application latency
- Database connections
- CPU utilization
- Memory utilization

**Log Groups**:
- Application logs (EB environments)
- Database slow query logs
- Security audit logs

**Current Gaps** (Opportunities):
- ⚠️ No centralized alerting configured
- ⚠️ No custom CloudWatch dashboards
- ⚠️ Log retention could be optimized
- ⚠️ No automated anomaly detection

### Smoke Tests

Automated validation suite runs after each deployment:
- ✅ Health endpoints verification
- ✅ Database connectivity check
- ✅ Authentication flow validation
- ✅ Core API functionality tests
- ✅ Credit system validation

---

## Testing Infrastructure

### Test Coverage

| Category | Tests | Pass Rate | Framework |
|----------|-------|-----------|-----------|
| **Client Tests** | 118 | 49% | Vitest + jsdom |
| **Server Tests** | 203 | 86% | Vitest + node |
| **Integration Tests** | 45 | 67% | Custom |
| **Performance Tests** | 20 | 100% | Custom |
| **Security Tests** | 32 | 78% | Custom |
| **Total** | 540+ | **85%** | Multiple |

**Test Execution**:
- All tests run in CI/CD before deployment
- Test failures block deployment
- Test results posted to pull requests
- Coverage reports generated

**Current Gaps**:
- E2E tests only run in GitHub Actions (require display)
- Client test pass rate needs improvement (49%)
- Some flaky tests in integration suite

---

## Current Challenges

### High Priority

**1. Database Migration Pending**
- Critical security column needs production deployment
- Migration: `external_transaction_id` for Stripe idempotency
- Status: ✅ Tested in staging, ⏳ Awaiting production deployment
- Impact: Prevents duplicate payment processing

**2. Monitoring Gaps**
- No centralized alerting (SNS/email/Slack)
- No custom CloudWatch dashboards
- Manual monitoring required
- Opportunity: Build comprehensive monitoring solution

**3. Infrastructure Optimization**
- Single-instance deployments (no auto-scaling)
- RDS not Multi-AZ (availability risk)
- No CDN for static assets
- Opportunity: Performance and reliability improvements

### Medium Priority

**4. Backup Verification**
- Automated backups exist
- No regular restore testing
- Disaster recovery procedures need documentation
- Opportunity: DR planning and testing

**5. Cost Optimization**
- Current costs not fully analyzed
- Potential for resource right-sizing
- S3 lifecycle policies not configured
- Opportunity: Infrastructure cost reduction

**6. Security Enhancements**
- GitGuardian flagging test data (false positives)
- No WAF configured
- No DDoS protection beyond AWS defaults
- Opportunity: Enhanced security posture

### Low Priority

**7. Custom Domain Setup**
- DNS configuration pending (p3app.bizelev8.ai)
- SSL certificate setup needed
- Load balancer configuration update required
- Opportunity: Professional branding

**8. Development Workflow**
- Manual environment variable management
- Local development setup could be streamlined
- Docker not used for local development
- Opportunity: Developer experience improvements

---

## Role Expectations

### Primary Responsibilities

**Infrastructure Management** (40%):
- Maintain and optimize AWS infrastructure
- Monitor production and staging environments
- Respond to infrastructure incidents
- Plan and execute infrastructure improvements

**CI/CD Pipeline** (20%):
- Maintain GitHub Actions workflows
- Optimize deployment processes
- Improve deployment visibility
- Enhance automated testing integration

**Monitoring & Alerting** (20%):
- Build comprehensive monitoring solution
- Configure CloudWatch alarms
- Set up incident notification system
- Create operational dashboards

**Database Operations** (10%):
- Execute database migrations
- Optimize database performance
- Manage backups and disaster recovery
- Monitor database health

**Security & Compliance** (10%):
- Maintain security best practices
- Conduct regular security audits
- Manage access controls
- Document security procedures

### Expected Improvements (First 90 Days)

**Month 1: Assessment & Quick Wins**
- Complete infrastructure assessment
- Set up basic monitoring and alerting
- Execute pending database migration
- Document current state

**Month 2: Foundation Building**
- Implement comprehensive monitoring
- Create CloudWatch dashboards
- Set up automated alerting
- Improve backup verification

**Month 3: Optimization**
- Plan Multi-AZ RDS migration
- Evaluate auto-scaling opportunities
- Optimize costs
- Implement disaster recovery procedures

---

## Technical Assessment Questions

To help us understand your experience and approach, please consider these scenarios:

### Scenario 1: Database Migration
We need to add a new column to a high-traffic table in production. The table has millions of rows. How would you approach this migration to minimize downtime and risk?

**Consider**:
- Migration strategy
- Rollback plan
- Performance impact
- Verification steps

### Scenario 2: Incident Response
You receive an alert that the staging environment health check is failing. Production is still healthy. Walk us through your troubleshooting process.

**Consider**:
- Immediate actions
- Diagnostic tools
- Communication plan
- Root cause analysis

### Scenario 3: Cost Optimization
Our AWS bill has increased 30% month-over-month. How would you investigate and address this?

**Consider**:
- Investigation approach
- Cost analysis tools
- Optimization strategies
- Trade-offs to consider

### Scenario 4: Monitoring Design
Design a monitoring and alerting strategy for this infrastructure. What metrics would you track, and what alerts would you configure?

**Consider**:
- Critical metrics
- Alert thresholds
- Notification channels
- On-call procedures

### Scenario 5: Disaster Recovery
The production database becomes corrupted. We have automated backups from 2 hours ago. Walk us through the recovery process.

**Consider**:
- Recovery steps
- Data loss implications
- Communication plan
- Prevention measures

---

## Required Skills & Experience

### Must Have

- ✅ 3+ years AWS infrastructure management experience
- ✅ Strong experience with Elastic Beanstalk or similar PaaS
- ✅ PostgreSQL administration and optimization
- ✅ CI/CD pipeline design and maintenance (GitHub Actions preferred)
- ✅ Infrastructure as Code experience (Terraform/CloudFormation)
- ✅ Monitoring and alerting setup (CloudWatch, Datadog, etc.)
- ✅ Strong Linux/Unix system administration skills
- ✅ Security best practices and compliance

### Nice to Have

- 🎯 Node.js/TypeScript application deployment experience
- 🎯 Multi-region deployment experience
- 🎯 Kubernetes/container orchestration
- 🎯 Cost optimization and FinOps experience
- 🎯 Python scripting for automation
- 🎯 Experience with SaaS/B2B platforms
- 🎯 On-call experience with incident management

---

## Work Environment

**Team Structure**:
- Collaborate with development team
- Report to technical leadership
- Work with founders on infrastructure strategy

**Tools & Access**:
- AWS Console and CLI
- GitHub (repository, actions, environments)
- Monitoring tools (CloudWatch, to be expanded)
- Documentation tools (Markdown, diagrams)

**Work Style**:
- Remote-friendly
- Flexible hours with on-call rotation
- Documentation-focused culture
- Proactive problem-solving encouraged

---

## Next Steps

If you're interested in this role, please prepare:

1. **Technical Background**: Review this document and prepare questions
2. **Scenario Responses**: Think through the technical scenarios
3. **Infrastructure Approach**: Be ready to discuss your methodology
4. **Questions for Us**: What would you like to know about the role?

**Interview Process**:
1. Technical discussion (1 hour) - Review infrastructure and scenarios
2. Live troubleshooting exercise (45 minutes) - Real-world problem solving
3. Team fit discussion (30 minutes) - Meet the development team
4. Final discussion (30 minutes) - Expectations, compensation, timeline

---

## Appendices

### A. Technology Reference

**Core Technologies**:
- AWS: Elastic Beanstalk, RDS, S3, CloudWatch, IAM
- Languages: TypeScript, Node.js 20
- Frameworks: Express.js, React 18
- Database: PostgreSQL with Drizzle ORM
- Testing: Vitest, Playwright
- CI/CD: GitHub Actions

### B. Key Metrics

**Current Infrastructure**:
- Environments: 2 (staging, production)
- EC2 Instances: 2 (1 per environment)
- RDS Instance: 1 (shared, separate databases)
- Deployment Frequency: Multiple per week
- Mean Time to Deploy: ~5 minutes
- Test Execution Time: ~3 minutes
- Smoke Test Duration: ~2 minutes

**Performance Baselines**:
- Health Check Response: <100ms
- Application Response: ~484ms average
- Database Queries: <50ms (simple), <200ms (complex)
- Deployment Success Rate: 100% (last 5 deployments)

### C. Documentation Structure

Upon joining, you'll have access to:
- `DEPLOYMENT.md` - Comprehensive deployment guide
- `SECURITY.md` - Security best practices and incident history
- `CLAUDE.md` - Project overview and current status
- `docs/ops-log/` - Monthly operational history
- `deployment-scripts/` - All automation scripts
- `.ebextensions/` - EB platform configuration

---

## Contact

**For Questions About This Role**:
Please reach out to the hiring manager with any questions about the position, infrastructure, or interview process.

We're excited to discuss how you can help us build world-class infrastructure for P3 Interview Academy!

---

**Document Version**: 1.0
**Last Updated**: December 2025
**Prepared For**: DevOps Engineer Candidates

---

**End of Document**

This document provides an overview of our infrastructure for assessment purposes. Upon hiring, you'll receive full access to all systems, documentation, and credentials necessary for the role.
