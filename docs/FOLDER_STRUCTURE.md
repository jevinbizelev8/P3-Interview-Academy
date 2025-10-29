# Project Folder Structure

**Last Updated**: October 9, 2025
**Purpose**: Documentation of organized folder structure for easy navigation

---

## 📁 Root Directory

Essential files kept in root for quick access:
- `README.md` - Project overview and setup instructions
- `CLAUDE.md` - AI assistant instructions and project context
- `package.json` - Node.js dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite build configuration
- `.env.example` - Environment variable template

---

## 📂 MD_Documentations/

Comprehensive project documentation organized by category.

### Deployment/
**Purpose**: Deployment guides, migration scripts, and production documentation

**Files**:
- `DATABASE_SEPARATION.md` - Database isolation strategy (staging vs production)
- `DEPLOYMENT.md` - Comprehensive deployment procedures
- `PRODUCTION_DEPLOYMENT_PLAN.md` - Production deployment planning
- `PR6_DEPLOYMENT_SUCCESS.md` - PR #6 Model Answer Integration deployment report
- `apply-production-migrations-via-eb.md` - Database migration via Elastic Beanstalk

**Use Cases**:
- Planning production deployments
- Running database migrations
- Post-deployment verification
- Reviewing deployment history

### Testing/
**Purpose**: Test reports, staging validation, and QA documentation

**Files**:
- `AUTOMATED_TEST_REPORT.md` - Staging automated test results
- `FRONTEND_TEST_RESULTS.md` - Frontend component test reports
- `PRODUCTION_DEPLOYMENT_CHECKLIST.md` - Pre/post deployment validation
- `STAGING_APPROVAL_CHECKLIST.md` - Staging environment sign-off
- `STAGING_TEST_GUIDE.md` - Comprehensive staging test procedures
- `STAGING_TEST_SUMMARY.md` - Staging test progress and results
- `STAGING_TO_PRODUCTION_GUIDE.md` - Migration from staging to prod
- `TESTING_PROGRESS.md` - Session continuity and test tracking
- `TEST_REPORT.md` - Production test results for stage-specific features
- `staging-verification-report.txt` - Staging environment verification

**Use Cases**:
- Running staging tests
- Validating production deployments
- Tracking test progress
- Reviewing test results

### PRDs/
**Purpose**: Product Requirements Documents and feature specifications

**Files**:
- `PRD_PREPARE_MODULE_MODEL_ANSWERS.md` - Model Answer Integration PRD

**Use Cases**:
- Understanding feature requirements
- Planning new features
- Tracking implementation progress

### Progress/
**Purpose**: Session resumption and development continuity

**Files**:
- `RESUME_INSTRUCTIONS.md` - How to resume development sessions

**Use Cases**:
- Resuming work after breaks
- Onboarding new developers
- Context recovery

### Platform/
**Purpose**: Platform-specific guides and integrations

**Files**:
- `AGENTS.md` - AI agent configuration and usage
- `replit.md` - Replit deployment and development guide

**Use Cases**:
- Platform-specific setup
- Development environment configuration

---

## 🛠️ deployment-scripts/

Scripts for deployment, migration, and infrastructure management.

### Root Level
- `run-production-migrations.js` - Production database migration tool
- `debug-staging-environment.sh` - Staging environment debugging
- `fix-production-ssl.sh` - SSL certificate configuration
- `run-schema-deployment.sh` - Schema deployment automation
- `full-deployment.sh` - Complete deployment orchestration
- `setup-environment-variables.sh` - Environment variable configuration
- Various other deployment utilities

### util/
**Purpose**: Utility scripts for maintenance and testing

**Common Scripts**:
- Database schema verification
- Production/staging connection tests
- AWS infrastructure scripts
- Migration helpers

**Use Cases**:
- Ad-hoc database operations
- Debugging production issues
- Testing deployments

---

## 🧪 testing-scripts/

Automated test suites and validation scripts.

**Key Scripts**:
- `test-production-smoke.js` - Production smoke tests (19 tests)
- `test-verified-user.js` - End-to-end feature validation
- `test-staging-automated.js` - Comprehensive staging test suite
- `test-9-criteria-evaluation.js` - 9-criteria scoring validation
- `test-adaptive-followups.js` - Adaptive question testing
- `test-stage-progression.js` - Stage difficulty progression tests
- `test-question-variety.js` - Question variety validation
- Various diagnostic scripts

**Test Helpers**:
- `test-helpers/auth-helper.js` - Authentication utilities

**Use Cases**:
- Pre-deployment validation
- Post-deployment smoke testing
- Feature-specific validation
- Regression testing

---

## 🗄️ server/migrations/

SQL migration scripts for database schema updates.

**Files**:
- `migration-add-csv-columns.sql` - CSV question tracking columns
- `manual-schema-deploy.sql` - Manual schema deployment
- `add-csv-question-tracking.sql` - CSV metadata columns

**Use Cases**:
- Database schema updates
- Column additions
- Index creation
- Data migrations

---

## 📁 Other Key Directories

### client/
**Purpose**: React frontend application
- `src/` - Source code
- `public/` - Static assets
- Component tests in `src/__tests__/`

### server/
**Purpose**: Express.js backend application
- `routes/` - API endpoints
- `services/` - Business logic
- `middleware/` - Request processing
- `__tests__/` - Backend tests

### shared/
**Purpose**: Shared code between client and server
- `schema.ts` - Database schema definitions
- `types.ts` - TypeScript type definitions

### .github/workflows/
**Purpose**: CI/CD automation
- `deploy-eb-production.yml` - Production deployment
- `deploy-eb-staging.yml` - Staging deployment

---

## 🗂️ Folder Organization Principles

### What Stays in Root
- **Essential Configuration**: Files needed by build tools, package managers
- **Critical Documentation**: README, CLAUDE.md for immediate access
- **Build Artifacts**: dist/, node_modules/ (gitignored)

### What Goes in MD_Documentations/
- **All .md files** except README and CLAUDE
- **Organized by purpose**: Deployment, Testing, PRDs, Progress, Platform
- **Historical reports**: Test results, deployment summaries

### What Goes in deployment-scripts/
- **Executable scripts**: .sh, .js for deployment/migration
- **Infrastructure tools**: AWS, database, environment setup
- **Utilities subfolder**: One-off scripts, debugging tools

### What Goes in testing-scripts/
- **Test suites**: Automated testing scripts
- **Validation scripts**: Feature-specific tests
- **Test helpers**: Shared testing utilities

### What Goes in server/migrations/
- **SQL files only**: Database schema changes
- **Migration scripts**: Incremental updates
- **Named by purpose**: Clear description of what each migration does

---

## 🔍 Quick Reference

### Need to Deploy?
→ Check `MD_Documentations/Deployment/`

### Need to Test?
→ Run scripts from `testing-scripts/`

### Need to Migrate Database?
→ Use scripts from `deployment-scripts/` or SQL from `server/migrations/`

### Need Documentation?
→ Browse `MD_Documentations/` by category

### Need to Debug?
→ Check `deployment-scripts/util/` for diagnostic tools

---

## 📝 Maintenance Guidelines

### When Adding New Files

1. **Documentation (.md)**: Add to appropriate `MD_Documentations/` subfolder
2. **Deployment Scripts (.sh, .js)**: Add to `deployment-scripts/` or `deployment-scripts/util/`
3. **Test Scripts**: Add to `testing-scripts/`
4. **Migrations (.sql)**: Add to `server/migrations/`

### Folder Naming Conventions

- Use **PascalCase** for documentation folders: `Deployment/`, `Testing/`
- Use **kebab-case** for script folders: `deployment-scripts/`, `testing-scripts/`
- Use **lowercase** for code folders: `server/`, `client/`, `shared/`

### File Naming Conventions

- Documentation: `UPPERCASE_WITH_UNDERSCORES.md` or `PascalCase.md`
- Scripts: `kebab-case.js` or `kebab-case.sh`
- Tests: `test-feature-name.js`
- Migrations: `descriptive-name.sql` or `YYYYMMDD-migration-name.sql`

---

## 🧹 Cleanup History

### October 9, 2025 - Repository Organization
**Moved 18 files** from root to organized folders:

**To MD_Documentations/Deployment/**:
- apply-production-migrations-via-eb.md
- DATABASE_SEPARATION.md
- DEPLOYMENT.md
- PR6_DEPLOYMENT_SUCCESS.md
- PRODUCTION_DEPLOYMENT_PLAN.md

**To MD_Documentations/Platform/**:
- AGENTS.md
- replit.md

**To deployment-scripts/**:
- debug-staging-environment.sh
- fix-production-ssl.sh
- run-production-migrations.js
- run-schema-deployment.sh

**To testing-scripts/**:
- test-verified-user.js

**To server/migrations/**:
- manual-schema-deploy.sql
- migration-add-csv-columns.sql

**Removed**:
- cookies.txt (temporary test file)
- test_cookies.txt (temporary test file)
- test-results.json (duplicate)

**Result**: Clean root directory with only essential configuration files

---

**📌 Remember**: Keep the root directory clean - move documentation and scripts to appropriate folders!
