# Gemini Research Notification Examples

## Basic Usage

### Example 1: Research Task
```bash
./scripts/telegram/integrations/gemini-notify-p3.sh \
  "Research Stripe webhook security best practices" \
  "claude --agent gemini 'research Stripe webhook security'"
```

**Telegram Notifications**:
1. 🔍 "Gemini Research Started - Research Stripe webhook..." (immediate)
2. ✅ "Gemini Research Complete - Duration: 2m 22s" (after completion)

### Example 2: Documentation Analysis
```bash
./scripts/telegram/integrations/gemini-notify-p3.sh \
  "Analyze AWS deployment options" \
  "claude --agent gemini 'analyze AWS Elastic Beanstalk vs ECS'"
```

**Use Case**: Compare deployment strategies before making infrastructure decisions

### Example 3: Code Pattern Research
```bash
./scripts/telegram/integrations/gemini-notify-p3.sh \
  "Find React testing patterns" \
  "claude --agent gemini 'find React component testing examples with vitest'"
```

**Use Case**: Research best practices before implementing new features

### Example 4: Troubleshooting Research
```bash
./scripts/telegram/integrations/gemini-notify-p3.sh \
  "Research TypeError solutions in Node.js" \
  "claude --agent gemini 'research TypeError: Cannot read property of undefined Node.js solutions'"
```

**Use Case**: Find solutions to specific errors encountered

## Integration with P3 Workflows

### Database Research Before Migration
```bash
#!/bin/bash
# Research database migration strategies before applying

./scripts/telegram/integrations/gemini-notify-p3.sh \
  "Research PostgreSQL migration best practices" \
  "claude --agent gemini 'research zero-downtime PostgreSQL migrations with Drizzle ORM'"

# Review research output, then run migration with approval
./scripts/telegram/integrations/db-migrate-p3.sh --production
```

### API Design Research
```bash
# Research API design patterns before implementing new endpoints
./scripts/telegram/integrations/gemini-notify-p3.sh \
  "Research REST API pagination patterns" \
  "claude --agent gemini 'research cursor-based pagination in REST APIs with PostgreSQL examples'"

# Then implement with informed decisions
npm run dev
```

### Security Research
```bash
# Research security best practices before deploying
./scripts/telegram/integrations/gemini-notify-p3.sh \
  "Research AWS security hardening" \
  "claude --agent gemini 'research AWS Elastic Beanstalk security hardening checklist'"
```

### Performance Optimization Research
```bash
# Research performance patterns before refactoring
./scripts/telegram/integrations/gemini-notify-p3.sh \
  "Research React performance optimization" \
  "claude --agent gemini 'research React rendering optimization techniques with TanStack Query'"
```

## Advanced Usage

### Multi-Step Research Workflow
```bash
#!/bin/bash
# scripts/research-workflow.sh

# Step 1: Research the topic
./scripts/telegram/integrations/gemini-notify-p3.sh \
  "Research microservices patterns" \
  "claude --agent gemini 'research microservices patterns for interview platforms'"

# Step 2: Analyze current codebase (manual or automated)
echo "Review current architecture..."

# Step 3: Create implementation plan
./scripts/telegram/integrations/gemini-notify-p3.sh \
  "Create implementation plan" \
  "claude --agent gemini 'create implementation plan for microservices migration'"
```

### Research with Custom Commands
```bash
# Research with web scraping
./scripts/telegram/integrations/gemini-notify-p3.sh \
  "Scrape AWS pricing documentation" \
  "python scripts/scrape-aws-pricing.py"

# Research with local file analysis
./scripts/telegram/integrations/gemini-notify-p3.sh \
  "Analyze codebase dependencies" \
  "npm audit --json > /tmp/audit.json && cat /tmp/audit.json"
```

## Silent Mode

When notifications are disabled:
```bash
$ ./scripts/notifyctl off
Notifications disabled

$ ./scripts/telegram/integrations/gemini-notify-p3.sh "test" "echo 'running'"

⚠️  Notifications disabled - running command without notifications
running
```

Command executes normally, but no Telegram notifications sent.

## Output Format

### Success Notification
```
✅ Gemini Research Complete

Task: Research Stripe webhook security best practices
Duration: 2m 22s
Status: SUCCESS

Summary:
[First 500 characters of output]

Full output saved to console logs
```

### Failure Notification
```
❌ Gemini Research Failed

Task: Research AWS deployment
Duration: 45s
Status: FAILED (Exit Code: 1)

Error:
[First 500 characters of error]

Check console logs for details
```

## Tips and Best Practices

✅ **DO:**
- Use descriptive task names - they appear in notifications
- Keep commands simple - complex commands may need escaping
- Test locally first - try without wrapper before wrapping
- Use for long-running tasks (>1 minute)
- Review console logs for full output
- Chain multiple research tasks with `&&`

❌ **DON'T:**
- Wrap short tasks (<30 seconds) - notification overhead not worth it
- Use interactive commands - wrapper can't handle user input
- Expect real-time progress - notifications are start/end only
- Assume notifications always work - check `.notify.enabled` exists

## Troubleshooting

### No Notifications Sent
```bash
# Check if notifications enabled
ls .notify.enabled

# If missing, enable
./scripts/notifyctl on
```

### Command Fails Silently
```bash
# Test command directly first
claude --agent gemini 'your research query'

# Then wrap it
./scripts/telegram/integrations/gemini-notify-p3.sh "test" "your command"
```

### Output Truncated in Telegram
**Expected behavior** - Telegram notifications show first 500 characters only.
**Solution**: Check console logs for full output.

### Duration Wrong
**Possible cause**: System clock issues or command hanging.
**Solution**: Kill command with Ctrl+C and check logs.

## Integration Examples by Role

### For Developers
```bash
# Before implementing a feature
./scripts/telegram/integrations/gemini-notify-p3.sh \
  "Research feature implementation" \
  "claude --agent gemini 'research [feature] implementation patterns'"

# During debugging
./scripts/telegram/integrations/gemini-notify-p3.sh \
  "Research error solution" \
  "claude --agent gemini 'research [error message] solutions'"
```

### For DevOps
```bash
# Before deployment
./scripts/telegram/integrations/gemini-notify-p3.sh \
  "Research deployment strategy" \
  "claude --agent gemini 'research blue-green deployment for AWS EB'"

# For monitoring
./scripts/telegram/integrations/gemini-notify-p3.sh \
  "Research monitoring tools" \
  "claude --agent gemini 'research CloudWatch vs Datadog for Node.js apps'"
```

### For QA/Testing
```bash
# Before writing tests
./scripts/telegram/integrations/gemini-notify-p3.sh \
  "Research testing strategies" \
  "claude --agent gemini 'research integration testing strategies for Express APIs'"

# For test automation
./scripts/telegram/integrations/gemini-notify-p3.sh \
  "Research E2E testing" \
  "claude --agent gemini 'research Playwright vs Cypress for React apps'"
```

## Performance Notes

- **Overhead**: ~1-2 seconds for notifications (negligible for long tasks)
- **Network**: Requires internet for Telegram API (tasks run regardless)
- **Storage**: Temporary files cleaned up automatically
- **Memory**: Minimal - output buffered to temp file

## See Also

- [Telegram Controller Usage](../../telegram/USAGE.md) - Core notification setup
- [Testing Guide](TESTING_GEMINI.md) - How to test this wrapper
- [Database Migration Wrapper](EXAMPLES_DB.md) - Similar wrapper for DB tasks
