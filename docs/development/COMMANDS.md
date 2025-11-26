# Development Commands Reference

This document provides a comprehensive reference for all development, testing, and database commands used in the P3 Interview Academy project.

---

## Essential Development Commands

```bash
# Start development server (React frontend + Express backend)
npm run dev

# Build for production (runs type checking and tests first)
npm run build

# Start production server
npm run start

# Run TypeScript type checking
npm run check
```

---

## Testing Commands

### Running Tests

```bash
# Run all tests in watch mode (321 tests: client + server)
npm test

# Run all tests once (client + server)
npm run test:run

# Run tests with coverage report
npm run test:coverage

# Launch Vitest UI for interactive testing
npm run test:ui

# Run client tests only (118 tests, jsdom environment)
npm run test:client

# Run server tests only (203 tests, node environment)
npm run test:server

# Run server API tests with verbose output
npm run test:api

# Run specific component tests for validation
npm run test:prepare

# Run integration tests only
npm run test:integration
```

### Test Architecture

**Vitest Workspace**: Configured in `vitest.workspace.ts` with two projects

- **Client Project**: React component tests (jsdom)
  - 118 tests, 58 passing (49%)
- **Server Project**: API route tests (node)
  - 203 tests, 174 passing (86%)
- **Total**: 321 tests, 232 passing (72%)

### Key Test Coverage

**Client Component Tests**:
- `LanguageSelector.test.tsx`
- `JobDescriptionUpload.test.tsx`
- `SignupForm.test.tsx`

**Client Integration Tests**:
- `prepare-session.integration.test.tsx`
- `perform-dashboard.integration.test.tsx`

**Server API Tests** (10 files):
- `prepare-ai.routes.test.ts` (15 tests)
- `practice.routes.test.ts` (12 tests)
- `prepare.routes.test.ts` (17 tests)
- `perform.routes.test.ts` (22 tests)
- `gamification.routes.test.ts` (28 tests)
- `support.routes.test.ts` (24 tests)
- `referrals.routes.test.ts` (20 tests)
- `practice-enhancements.test.ts` (18 tests)
- `model-answer-service.test.ts` (8 tests)
- `migrations/redesign-schema.test.ts` (25 tests)

---

## E2E Testing Commands

**⚠️ Important**: Playwright E2E tests are **NOT feasible in Replit** due to environment constraints:
- ❌ No X11 display server (Playwright requires GUI environment)
- ❌ Browser binaries (300-500MB) lost on container restart
- ❌ Resource constraints (500MB+ RAM per browser instance)
- ❌ MCP Playwright server has same limitations

**Research Documentation**: See [docs/testing/BROWSER_AUTOMATION_RESEARCH.md](../testing/BROWSER_AUTOMATION_RESEARCH.md)

### Recommended Architecture

- **Replit**: Component tests (jsdom) + Integration tests (fixtures) - ✅ Fast, reliable
- **GitHub Actions**: E2E tests (Playwright) - ✅ Full browser automation
- **Cost**: $0/month (GitHub Actions free for public repos)

### GitHub Actions E2E Workflow

```bash
# E2E tests run automatically in GitHub Actions
# .github/workflows/e2e-tests.yml

# Manual trigger from GitHub UI:
# Actions → E2E Tests → Run workflow
```

### Local E2E Testing

**Requires Playwright installation outside Replit**

```bash
# One-time setup (on local machine, not Replit)
npm install -D @playwright/test
npx playwright install chromium

# Run E2E tests
npm run test:e2e              # Run all E2E tests
npm run test:e2e:ui           # Interactive UI mode
npm run test:e2e:debug        # Debug mode with DevTools

# Run specific E2E test
npx playwright test e2e/auth-flow.spec.ts

# View test report
npx playwright show-report
```

### E2E Test Examples

```typescript
// e2e/auth-flow.spec.ts
test('user can sign up and login', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Sign Up');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard/);
});

// e2e/practice-module.spec.ts
test('complete practice session', async ({ page }) => {
  await page.goto('/practice');
  await page.click('text=Start Practice');
  await page.fill('textarea', 'My STAR response...');
  await page.click('text=Submit');
  await expect(page.getByText('Evaluation')).toBeVisible();
});
```

**For Complete Testing Guide**: See [docs/testing/TESTING_GUIDE.md](../testing/TESTING_GUIDE.md)

---

## Payment Testing Commands (Stripe CLI)

```bash
# Forward webhooks to local server
stripe listen --forward-to localhost:5000/api/webhooks/stripe

# Simulate successful payment
stripe trigger payment_intent.succeeded

# Simulate checkout completion
stripe trigger checkout.session.completed

# Monitor Stripe API activity in real-time
stripe logs tail
```

**See also**: [TOOLS.md](TOOLS.md#stripe-cli) for full Stripe CLI documentation

---

## Database Commands

```bash
# Push database schema changes using Drizzle Kit
npm run db:push
```

### Database Schema

- **Location**: `shared/schema.ts`
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL

### Schema Management

- **Boot-time schema guard**: `ensureCriticalSchema()` in `server/services/schema-auditor.ts`
- Runs every server start to create AI Prepare tables and rename legacy columns
- After 2025-10-04 deploy: Cast `user_id` / `created_by` columns from varchar to uuid

---

**Last Updated**: 2025-11-26
**Maintainer**: Development Team
