# DevOps Quick Start Guide
**P3 Interview Academy** - Essential Information for New DevOps Engineer

---

## 🎯 Your Mission

Help us achieve smooth, reliable, automated deployments with proper monitoring and observability.

---

## 📊 Current State (At a Glance)

**Infrastructure**:
- AWS Elastic Beanstalk (Node.js 20) in `ap-southeast-1`
- PostgreSQL RDS (separate databases for staging/production)
- GitHub Actions CI/CD (automated staging, manual production approval)

**Production URL**: `http://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com`
**Staging URL**: `http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com`

**Tech Stack**:
- Frontend: React + TypeScript + Vite
- Backend: Express.js + TypeScript
- Database: PostgreSQL 16 + Drizzle ORM
- AI: OpenAI GPT-4
- Payments: Stripe

---

## 🔴 Top 3 Pain Points (Your Priorities)

### 1. **No Monitoring/Alerting** (CRITICAL)
- **Issue**: No APM, no error tracking, no alerts
- **Impact**: Issues discovered by users, not systems
- **Need**: Datadog/CloudWatch dashboards + alerting

### 2. **Manual Approval Slows Deployments** (HIGH)
- **Issue**: Production deployments require manual GitHub approval
- **Impact**: Features wait hours/days in staging
- **Need**: Automated promotion after smoke tests pass

### 3. **No Zero-Downtime Deployments** (HIGH)
- **Issue**: Rolling deployments cause 30-60s downtime
- **Impact**: Users experience disconnects during deploys
- **Need**: Blue-green deployment strategy

---

## 📁 Essential Documents (Read These First)

1. **DEPLOYMENT.md** - How deployments currently work
2. **DEVOPS_ONBOARDING.md** - Full onboarding guide (you're reading the summary)
3. **CLAUDE.md** - Project overview, architecture, tech stack
4. **.github/workflows/** - Current CI/CD pipelines

---

## 🔑 Access Needed

**AWS**:
- IAM user with EB, RDS, CloudWatch, S3 permissions
- MFA required
- No root account access

**GitHub**:
- Repo: `github.com/jevinbizelev8/P3-Interview-Academy`
- Write permission (to modify workflows)

**Database** (via secure access only):
- Read-only to production RDS
- Full access to staging RDS

---

## 🚀 Week 1 Goals

**Day 1-2**: Get access, clone repo, review docs
**Day 3**: Explore staging environment, CloudWatch logs
**Day 4**: Trigger test deployment, understand current process
**Day 5**: Propose monitoring/alerting setup plan

---

## 🛠️ Quick Commands Reference

```bash
# Check environment health
aws elasticbeanstalk describe-environments

# Check staging health
curl http://p3-interview-academy-staging.../api/health

# Run smoke tests
npx tsx deployment-scripts/smoke-tests.ts staging

# Tail production logs
aws elasticbeanstalk tail-logs --environment-name p3-interview-academy-prod-v2

# Rollback (emergency)
aws elasticbeanstalk update-environment \
  --environment-name p3-interview-academy-prod-v2 \
  --version-label <PREVIOUS_VERSION>
```

---

## 💡 Recommended First Improvements (In Order)

### Phase 1 (Week 1-2): Observability
1. Set up CloudWatch dashboards + alarms
2. Configure error rate alerts (>5%)
3. Configure latency alerts (p95 > 500ms)
4. Set up Sentry for error tracking
5. PagerDuty for on-call notifications

### Phase 2 (Week 3-4): CI/CD Optimization
1. Remove manual approval gate (trust automated tests)
2. Implement automated rollback on health check failure
3. Parallelize test execution (59s → <30s)
4. Add deployment notifications (Slack)

### Phase 3 (Month 2): Zero-Downtime
1. Implement blue-green deployment
2. Configure connection draining
3. Health check grace periods

---

## 📞 Questions to Ask in First Meeting

1. What's acceptable downtime during deployments?
2. What's the monthly budget for monitoring tools?
3. Is there an on-call expectation?
4. Which pain point is most critical?
5. Any preference: Datadog vs AWS native monitoring?

---

## 🎓 Current Project Status

**Testing Phase**: Currently achieving 95%+ test coverage before production deployment
- Test suite: 465 tests (83.4% passing)
- 6 of 15 test agents completed
- **Critical findings**: 2 Stripe payment bugs discovered and documented

**Next Milestone**: Deploy Phase 2 redesign to production (blocked on testing completion)

---

## 🔥 Emergency Contacts

[To be provided in first meeting]

---

**Your Impact**: You'll be responsible for making deployments fast, safe, and automated. The team has built a solid foundation - your job is to add operational excellence on top.

**Welcome aboard!** 🎉
