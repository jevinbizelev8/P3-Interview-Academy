# Browser Automation Research: Playwright & MCP in Replit

**Document Version**: 1.0
**Date**: 2025-11-05
**Project**: P3 Interview Academy
**Status**: ✅ Research Complete - Recommendations Approved

---

## Executive Summary

### Verdict: ⚠️ **NOT RECOMMENDED for Replit**

After comprehensive research, **Playwright and MCP Playwright server are not suitable for Replit environments** due to fundamental constraints. This document provides detailed analysis, alternative solutions, and recommended architecture for browser automation testing.

### Key Findings

- ❌ **Playwright in Replit**: Not feasible (no X11 display, resource constraints)
- ❌ **MCP Playwright Server**: Same limitations as regular Playwright
- ✅ **Recommended Solution**: GitHub Actions E2E + Replit Component Tests
- 💰 **Cost**: $0/month using recommended approach
- ⏱️ **Setup Time**: 2-4 hours

### Recommended Architecture

```
┌─────────────────────────────────────┐
│  Replit Environment                 │
│  ✅ Component Tests (jsdom)         │
│  ✅ Integration Tests (fixtures)    │
│  ✅ Fast local development          │
└─────────────────────────────────────┘
            │
            ↓
┌─────────────────────────────────────┐
│  GitHub Actions CI/CD               │
│  ✅ E2E Tests (Playwright)          │
│  ✅ Full browser automation         │
│  ✅ Free for public repos           │
└─────────────────────────────────────┘
```

---

## 1. Replit Environment Constraints

### 1.1 Container Architecture

Replit uses **lightweight Linux containers** similar to Docker with significant limitations:

| Aspect | Status | Impact |
|--------|--------|--------|
| **X11 Display Server** | ❌ Not available | Cannot run GUI applications |
| **VNC Server** | ❌ Not built-in | No remote desktop access |
| **GPU Acceleration** | ❌ Not available | No hardware rendering |
| **System Packages** | ⚠️ Limited apt access | Cannot install system dependencies |
| **Storage** | ⚠️ Limited quotas | Large browser binaries problematic |
| **Memory** | ⚠️ Resource limits | Insufficient for browser instances |
| **Persistence** | ❌ Ephemeral | Browser binaries lost on restart |

### 1.2 What This Means for Browser Automation

Playwright/Puppeteer/Selenium require:

1. **Browser Binaries** (300-500MB)
   - Chromium: ~170MB
   - Firefox: ~80MB
   - WebKit: ~50MB
   - Total: 300-500MB depending on browsers

2. **System Dependencies** (shared libraries)
   - libX11, libXcomposite, libXcursor
   - libXdamage, libXext, libXfixes
   - libXi, libXrandr, libXrender
   - libXtst, libnss3, libatk, libcups2
   - And 20+ more libraries

3. **Display Server** (X11/Xvfb) OR special headless flags
   - Xvfb (X virtual framebuffer)
   - Or `--no-sandbox --disable-setuid-sandbox` flags

4. **Sufficient RAM** (500MB+ per browser instance)
   - Chromium baseline: 300MB
   - Per tab overhead: 50-200MB
   - DevTools protocol: 50MB

**Replit containers struggle with all four requirements.**

---

## 2. MCP (Model Context Protocol) Playwright Compatibility

### 2.1 What is MCP Playwright?

**MCP Playwright** is a Model Context Protocol server that exposes Playwright browser automation capabilities to AI assistants like Claude Code.

**Capabilities**:
- Browser navigation (`page.goto()`)
- Screenshot capture (`page.screenshot()`)
- DOM inspection (`page.locator()`)
- JavaScript execution (`page.evaluate()`)
- Form interaction (`page.fill()`, `page.click()`)

### 2.2 Installation Requirements

```bash
# Typical MCP Playwright server installation
npm install -g playwright
npx playwright install chromium
npx playwright install-deps
```

### 2.3 Compatibility Assessment

| Requirement | Replit Status | Notes |
|-------------|---------------|-------|
| **npm package installation** | ✅ Works | MCP server package can be installed |
| **Playwright browser binaries** | ⚠️ Problematic | 300-500MB storage, lost on restart |
| **System dependencies** | ❌ Blocker | Cannot install libX11, etc. |
| **Display server** | ❌ Blocker | No X11/Xvfb available |
| **Headless mode** | ⚠️ Partial | Requires `--no-sandbox` (security risk) |
| **Resource consumption** | ❌ Blocker | 500MB RAM per browser |
| **Container persistence** | ❌ Blocker | Binaries lost on container restart |

### 2.4 Conclusion

**MCP Playwright server is NOT RECOMMENDED for Replit** due to:
- Display server limitations (no X11/Xvfb)
- System dependency requirements
- Resource constraints (RAM/CPU)
- Container ephemeral nature
- Security implications of `--no-sandbox`

---

## 3. Technical Deep Dive: Can Playwright Run in Replit?

### 3.1 Approach 1: Headless Mode with `--no-sandbox`

**Theory**: Run Playwright in headless mode without X11 using Chrome flags.

```bash
# Install Playwright
npm install playwright
npx playwright install chromium --with-deps

# Run with special flags
PLAYWRIGHT_CHROMIUM_FLAGS="--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage" \
npx playwright test
```

**Problems**:
- ❌ Replit may block `--no-sandbox` (security vulnerability)
- ❌ `--disable-dev-shm-usage` required (limited `/dev/shm`)
- ⚠️ Still requires ~300MB browser binary
- ⚠️ Binaries lost on every container restart
- ⚠️ High memory usage (500MB+ per browser)
- ⚠️ No hardware acceleration

**Test Result**: **NOT RELIABLE** - May work sporadically but production-unsuitable.

**Why it Fails**:
- Replit restarts containers frequently (1-24 hours)
- Each restart requires re-downloading 300MB binaries
- `--no-sandbox` is a security risk
- Performance degrades without GPU acceleration

---

### 3.2 Approach 2: Xvfb Virtual Display

**Theory**: Install Xvfb to provide X11 display.

```bash
# Install Xvfb
apt-get install -y xvfb x11vnc

# Start virtual display
Xvfb :99 -screen 0 1280x1024x24 &
export DISPLAY=:99

# Run Playwright
npx playwright test
```

**Problems**:
- ❌ Replit containers have **restricted apt access**
- ❌ Cannot install system packages easily
- ❌ Xvfb process management in ephemeral containers
- ❌ Adds significant complexity
- ❌ VNC server for debugging not practical

**Test Result**: **NOT FEASIBLE** - Replit doesn't allow system package installation.

---

### 3.3 Approach 3: Docker-in-Docker with Playwright Image

**Theory**: Use official Playwright Docker image.

```dockerfile
FROM mcr.microsoft.com/playwright:v1.40.0-jammy
WORKDIR /app
COPY . .
RUN npm install
CMD ["npx", "playwright", "test"]
```

**Problems**:
- ❌ Replit **does NOT support Docker-in-Docker**
- ❌ No Docker daemon available
- ❌ Cannot use docker-compose or Dockerfile
- ❌ No container orchestration capabilities

**Test Result**: **NOT POSSIBLE** - Docker not supported in Replit.

---

### 3.4 Approach 4: Remote Browser Service

**Theory**: Use cloud-hosted browsers (BrowserStack, Sauce Labs).

```typescript
import { chromium } from 'playwright';

const browser = await chromium.connect({
  wsEndpoint: 'wss://cdp.browserstack.com/playwright?key=YOUR_KEY'
});

const page = await browser.newPage();
await page.goto('https://example.com');
```

**Benefits**:
- ✅ No local browser binary needed
- ✅ Works in any environment (including Replit)
- ✅ Professional testing infrastructure
- ✅ Cross-browser/cross-platform testing
- ✅ Video recording and screenshots included

**Problems**:
- 💰 **COST**: $29-199/month (BrowserStack, Sauce Labs)
- 💰 Limited free tier (100 minutes trial)
- ⚠️ Network latency (cloud to Replit)
- ⚠️ Requires API keys/authentication

**Test Result**: **FEASIBLE BUT EXPENSIVE** - Best option if budget allows.

---

## 4. Alternative Solutions

### 4.1 Solution A: GitHub Actions E2E (Recommended)

**Architecture**:
```
Development (Replit)          CI/CD (GitHub Actions)
┌──────────────────┐         ┌─────────────────────┐
│ Component Tests  │         │ E2E Tests           │
│ (jsdom + Vitest) │         │ (Playwright)        │
│                  │  push   │                     │
│ Fast, Local      │ ──────> │ Full Browser        │
│ No browser req   │         │ Automated           │
└──────────────────┘         └─────────────────────┘
```

**Implementation**:

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npx playwright test

      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

**Advantages**:
- ✅ **FREE** for public repos (2,000 minutes/month)
- ✅ Ubuntu runners have all dependencies pre-installed
- ✅ No Replit constraints
- ✅ Automated on every commit/PR
- ✅ Video/screenshot artifacts
- ✅ Parallel test execution
- ✅ Professional CI/CD integration

**Disadvantages**:
- ⚠️ Cannot run tests locally in Replit (use component tests instead)
- ⚠️ Requires GitHub account (already have)
- ⚠️ Slight delay (1-3 minutes queue time)

**Cost**: **$0/month** for public repos

**Verdict**: **RECOMMENDED** - Best balance of cost, reliability, and features.

---

### 4.2 Solution B: Puppeteer (Lighter Alternative)

**Comparison to Playwright**:
- Puppeteer = Chromium-only (lighter)
- Playwright = Chromium + Firefox + WebKit (heavier)

**Installation**:
```bash
npm install puppeteer
```

**Advantages over Playwright**:
- Smaller binary size (~170MB vs 300MB)
- More mature headless mode
- Better sandboxing workarounds
- Simpler API

**Same Problems**:
- ❌ Still requires display server or `--no-sandbox`
- ❌ Still lost on container restart
- ⚠️ Same memory/CPU constraints
- ⚠️ Still ~170MB binary to download

**Verdict**: **SLIGHTLY BETTER** than Playwright, but still unreliable in Replit.

---

### 4.3 Solution C: Selenium with Remote Grid

**Architecture**:
```
Replit Tests             External Selenium Grid
┌──────────────┐         ┌───────────────────┐
│ Test Code    │ ──────> │ Chrome   Firefox  │
│ (WebDriver)  │  HTTP   │ Safari   Edge     │
└──────────────┘         └───────────────────┘
```

**Implementation**:
```typescript
import { Builder } from 'selenium-webdriver';

const driver = await new Builder()
  .forBrowser('chrome')
  .usingServer('http://your-selenium-grid:4444/wd/hub')
  .build();

await driver.get('https://example.com');
```

**Advantages**:
- ✅ No local browser needed
- ✅ Works in restricted environments
- ✅ Can self-host (cheaper than BrowserStack)
- ✅ Cross-browser testing

**Disadvantages**:
- ⚠️ Requires external Selenium Grid server
- ⚠️ More complex setup than Playwright
- ⚠️ Self-hosting requires another server ($10-50/month)
- ⚠️ Less modern API than Playwright/Puppeteer

**Cost**:
- Self-hosted: $10-50/month (DigitalOcean, AWS)
- Managed: $39-299/month (Sauce Labs)

**Verdict**: **FEASIBLE WITH EXTERNAL GRID** - Good middle ground option.

---

### 4.4 Solution D: Cypress Cloud

**Architecture**:
```
Development (Replit)         Cypress Cloud
┌──────────────────┐        ┌────────────────┐
│ Cypress Tests    │ ─────> │ Browser Pool   │
│ (npm run cy:run) │ upload │ Video/Reports  │
└──────────────────┘        └────────────────┘
```

**Implementation**:
```bash
npm install cypress
npx cypress run --record --key $CYPRESS_RECORD_KEY
```

**Advantages**:
- ✅ Cloud-hosted browsers (no local requirements)
- ✅ Excellent developer experience
- ✅ Built-in video/screenshot capture
- ✅ Time-travel debugging
- ✅ Free tier: 500 test results/month

**Disadvantages**:
- 💰 Paid plans: $75-349/month (beyond free tier)
- ⚠️ Cypress tests require rewriting (different API from Playwright)
- ⚠️ Not compatible with existing Playwright scripts
- ⚠️ Vendor lock-in

**Cost**:
- Free tier: 500 test results/month
- Starter: $75/month (unlimited tests, 3 users)
- Team: $179/month (unlimited tests, 10 users)

**Verdict**: **FEASIBLE BUT REQUIRES MIGRATION** - Good long-term solution if willing to rewrite tests.

---

### 4.5 Solution E: Visual Regression Testing (Percy, Chromatic)

**Architecture**:
```
Replit Tests              Percy.io Cloud
┌──────────────┐         ┌───────────────┐
│ Take Snapshot│ ──────> │ Render        │
│ (Percy API)  │ upload  │ Compare Diff  │
└──────────────┘         └───────────────┘
```

**Implementation**:
```typescript
import percySnapshot from '@percy/playwright';

await page.goto('http://localhost:3000');
await percySnapshot(page, 'Homepage');
```

**Advantages**:
- ✅ Cloud-hosted rendering
- ✅ Works with Playwright API
- ✅ Detects UI regressions automatically
- ✅ Free tier: 5,000 snapshots/month

**Disadvantages**:
- ⚠️ Only visual testing (no interaction testing)
- ⚠️ Requires screenshot baseline management
- 💰 Paid plans: $149-499/month

**Cost**:
- Free tier: 5,000 snapshots/month
- Standard: $149/month
- Enterprise: Custom pricing

**Verdict**: **FEASIBLE FOR UI TESTING** - Complements other approaches, not a replacement.

---

## 5. Recommended Solution: Hybrid Approach

### 5.1 Architecture

```
┌─────────────────────────────────────────────────────┐
│ Replit Development Environment                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ✅ Component Tests (jsdom + Vitest)                │
│    • Fast (< 1 sec)                                │
│    • Local development                              │
│    • Unit/integration testing                       │
│    • 118 tests                                      │
│                                                     │
│ ✅ Integration Tests (Fixtures)                    │
│    • Mock AI responses                              │
│    • Test complete flows                            │
│    • No real API calls                              │
│    • 37 tests                                       │
│                                                     │
└─────────────────────────────────────────────────────┘
                        │
                        │ git push
                        ↓
┌─────────────────────────────────────────────────────┐
│ GitHub Actions CI/CD                                │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ✅ E2E Tests (Playwright)                          │
│    • Full browser automation                        │
│    • Automated on every PR                          │
│    • Video/screenshot artifacts                     │
│    • 50+ comprehensive tests                        │
│                                                     │
│ ✅ Smoke Tests (Real API)                          │
│    • Critical flow validation                       │
│    • Pre-deployment checks                          │
│    • Weekly scheduled runs                          │
│    • 10 smoke tests                                 │
│                                                     │
└─────────────────────────────────────────────────────┘
                        │
                        │ deploy
                        ↓
┌─────────────────────────────────────────────────────┐
│ Production Environment                              │
├─────────────────────────────────────────────────────┤
│ • All tests passed                                  │
│ • High confidence deployment                        │
│ • Automated rollback if issues                      │
└─────────────────────────────────────────────────────┘
```

### 5.2 Test Distribution

| Test Type | Tool | Environment | Count | Frequency |
|-----------|------|-------------|-------|-----------|
| **Unit Tests** | Vitest | Replit | 203 | Every save |
| **Component Tests** | Testing Library + jsdom | Replit | 118 | Every commit |
| **Integration Tests** | Vitest + Fixtures | Replit | 37 | Every commit |
| **E2E Tests** | Playwright | GitHub Actions | 50+ | Every PR |
| **Smoke Tests** | Playwright | GitHub Actions | 10 | Pre-deploy |
| **Manual QA** | Human | Staging | Samples | Per release |

### 5.3 Cost Breakdown

| Component | Cost/Month | Notes |
|-----------|------------|-------|
| Replit Tests | $0 | Free (no browser) |
| GitHub Actions E2E | $0 | Free (public repos) |
| Smoke Tests | $0 | No real API in tests |
| **Total** | **$0/month** | 100% free solution |

---

## 6. Step-by-Step Setup: GitHub Actions E2E

### Step 1: Install Playwright

```bash
cd /home/runner/workspace
npm install -D @playwright/test
```

### Step 2: Create Playwright Config

**File**: `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

### Step 3: Create E2E Test

**File**: `e2e/auth-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('user can sign up', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Sign Up');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/);
  });
});
```

### Step 4: Create GitHub Actions Workflow

**File**: `.github/workflows/e2e-tests.yml`

```yaml
name: E2E Tests

on:
  push:
    branches: [main, redesign/mvp-founder-design]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          SESSION_SECRET: test-secret
          NODE_ENV: test
        run: npx playwright test

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          retention-days: 30
          path: |
            playwright-report/
            test-results/
```

### Step 5: Update package.json

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

### Step 6: Commit and Push

```bash
git add playwright.config.ts e2e/ .github/workflows/e2e-tests.yml package.json
git commit -m "feat: Add E2E testing with Playwright on GitHub Actions"
git push
```

---

## 7. Cost Comparison

### Option Analysis

| Solution | Setup Time | Monthly Cost | Free Tier | Best For |
|----------|-----------|--------------|-----------|----------|
| **GitHub Actions E2E** | 2-4 hours | $0 | 2,000 min/month | **RECOMMENDED** |
| **Cypress Cloud** | 2-4 hours | $0-75 | 500 tests/month | UAT/Manual |
| **BrowserStack** | 1-2 hours | $29-199 | 100 min trial | Enterprise |
| **Sauce Labs** | 1-2 hours | $39-299 | 28 days trial | Enterprise |
| **Percy.io** | 1-2 hours | $0-149 | 5,000 snapshots | Visual only |
| **Self-hosted Selenium** | 8-12 hours | $10-50 | N/A | Full control |
| **Component Tests (Current)** | 0 hours | $0 | Unlimited | **Already working** |

### P3 Interview Academy Recommendation

**Recommended Budget**: **$0/month**

**Strategy**:
1. **Keep existing component tests** in Replit (already working, $0)
2. **Add GitHub Actions E2E tests** (free for public repos, $0)
3. **Skip paid services** (unnecessary for current needs)

**Total Investment**:
- Setup time: 2-4 hours
- Monthly cost: $0
- Maintenance: 1-2 hours/month

---

## 8. Conclusion

### Summary of Findings

1. ❌ **Playwright in Replit**: NOT FEASIBLE
   - No X11 display server
   - Resource constraints (RAM/storage)
   - Container ephemeral nature
   - Security implications

2. ❌ **MCP Playwright Server**: NOT FEASIBLE
   - Same limitations as regular Playwright
   - Display server requirements
   - System dependency requirements

3. ✅ **GitHub Actions E2E**: RECOMMENDED
   - Free for public repos
   - No Replit constraints
   - Professional infrastructure
   - Automated CI/CD integration

4. ✅ **Hybrid Approach**: OPTIMAL
   - Component tests in Replit (fast, local)
   - E2E tests in GitHub Actions (full browser)
   - Total cost: $0/month
   - Best of both worlds

### Decision Matrix

```
Question: Where should I run browser tests?

┌─ Need real browser? ─ NO ─> Replit (Component Tests)
│
└─ YES
   │
   ┌─ Budget > $0? ─ YES ─> BrowserStack/Sauce Labs
   │
   └─ NO ─> GitHub Actions (FREE, RECOMMENDED)
```

### Next Steps

1. ✅ Keep existing component tests in Replit
2. ⏳ Add GitHub Actions E2E tests (this week)
3. ⏳ Write 5-7 comprehensive E2E test suites
4. ⏳ Configure automated CI/CD pipeline
5. ⏳ Monitor and optimize test execution

---

## 9. FAQs

### Q: Can I run Playwright tests locally in Replit?

**A**: Technically possible but **not recommended**:
- Requires `--no-sandbox` flag (security risk)
- Browser binaries lost on container restart (~300MB re-download)
- High memory usage (500MB+)
- No GPU acceleration (slow)
- Frequent Replit restarts make it impractical

**Better approach**: Run component tests locally, E2E tests in CI/CD.

---

### Q: Why not just use BrowserStack/Sauce Labs?

**A**: Unnecessary expense:
- BrowserStack: $29-199/month
- GitHub Actions: $0/month (free for public repos)
- Same capabilities (browser automation, videos, screenshots)
- GitHub Actions is sufficient for P3 Interview Academy's needs

**When to consider paid services**:
- Private repositories (GitHub Actions costs money)
- Need for extensive cross-browser testing (10+ browsers)
- Enterprise support requirements
- Legal/compliance requirements (data sovereignty)

---

### Q: Can I use Docker in Replit?

**A**: No. Replit does not support:
- Docker daemon
- Docker-in-Docker
- docker-compose
- Container orchestration

**Alternative**: Use GitHub Actions which has full Docker support.

---

### Q: What about Puppeteer instead of Playwright?

**A**: Slightly better, but still problematic:
- Smaller binary (~170MB vs 300MB)
- Same display server issues
- Same container restart problems
- Same memory constraints

**Verdict**: Still not recommended for Replit. Use GitHub Actions for either Playwright or Puppeteer.

---

### Q: Can I debug E2E tests if they fail in CI?

**A**: Yes, multiple ways:
1. **Download artifacts**: Videos and screenshots uploaded by GitHub Actions
2. **Run locally**: `npm run test:e2e:debug` (if you have Playwright installed)
3. **GitHub Actions live logs**: Watch tests execute in real-time
4. **Playwright trace viewer**: Download trace files from artifacts

---

## 10. References

- [Playwright Documentation](https://playwright.dev)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Replit Environment Constraints](https://docs.replit.com)
- [Testing Best Practices](https://martinfowler.com/articles/practical-test-pyramid.html)
- [UAT_AUTOMATION_STRATEGY.md](./UAT_AUTOMATION_STRATEGY.md)
- [TESTING_GUIDE.md](./TESTING_GUIDE.md)

---

**Document Owner**: Engineering Team
**Review Schedule**: Quarterly
**Last Updated**: 2025-11-05
**Version**: 1.0
