# Telegram Command System - Test Plan

**Status**: Ready for Manual Testing
**Date**: 2025-11-03
**Tester**: Founder / DevOps Team

---

## Test Environment

- **Bot**: @JevinCC_Bot
- **Webhook Server**: Running on port 8080
- **Server Status**: ✅ Healthy (http://localhost:8080/healthz)
- **Notifications**: ✅ Enabled
- **Implementation**: Phase 3 Complete

---

## Pre-Test Checklist

- [x] Webhook server running
- [x] Notifications enabled (`notifyctl status` = ON)
- [x] server.py updated with command routing
- [x] All 5 commands implemented
- [x] Rate limiting configured
- [x] Audit logging enabled
- [x] Deployment scripts created
- [ ] BotFather commands menu registered (manual step)

---

## Test Cases

### 1. `/status` Command

**Purpose**: Show system health
**Rate Limit**: 10 per minute (readonly)

**Test Steps**:
1. Open Telegram and send `/status` to @JevinCC_Bot
2. Verify response within 2-3 seconds

**Expected Output**:
```
📊 System Status

✅ Webhook Server: Running
✅ Notifications: Enabled
📬 Pending Requests: X
📥 Recent Responses: X

Last check: 2025-11-03 HH:MM:SS UTC
```

**Success Criteria**:
- [ ] Response received within 3 seconds
- [ ] All status indicators shown
- [ ] Timestamp accurate
- [ ] Markdown formatting correct

---

### 2. `/monitor` Command

**Purpose**: View detailed system metrics
**Rate Limit**: 10 per minute (readonly)

**Test Steps**:
1. Send `/monitor` to @JevinCC_Bot
2. Verify monitor.sh output displayed

**Expected Output**:
```
📊 Monitor Output

=== Telegram Bot System Status ===

📱 Notification Status: Enabled
🌐 Webhook Server: Online
...
(monitor.sh output formatted for Telegram)
```

**Success Criteria**:
- [ ] Response received within 5 seconds
- [ ] Monitor script output shown
- [ ] ANSI color codes stripped
- [ ] Output truncated if > 3000 chars
- [ ] No script errors

---

### 3. `/help` Command

**Purpose**: Show command help
**Rate Limit**: 10 per minute (readonly)

**Test Steps**:
1. Send `/help` (general help)
2. Send `/help status` (specific command help)
3. Send `/help deploy` (specific command help)
4. Send `/help unknown` (invalid command)

**Expected Output for `/help`**:
```
🤖 P3 Interview Academy DevOps Bot

Available Commands:

📊 Monitoring
• /status - Show system health and status
• /monitor - View detailed system metrics
...
```

**Expected Output for `/help status`**:
```
📊 /status - System Status

Description:
Shows current system health...
```

**Expected Output for `/help unknown`**:
```
❌ No help available for `/unknown`

Try `/help` for all commands.
```

**Success Criteria**:
- [ ] General help shows all commands
- [ ] Specific help shows command details
- [ ] Invalid commands return error message
- [ ] Markdown formatting correct

---

### 4. `/test` Command

**Purpose**: Run test suite
**Rate Limit**: 1 per 5 minutes (intensive)

**Test Steps**:
1. Send `/test` to @JevinCC_Bot
2. Wait for initial "Running tests..." message
3. Wait 2-5 minutes for test completion
4. Verify final results message

**Expected Output**:
```
🧪 Running test suite...

This may take several minutes.

---

🧪 Test Suite

✅ All tests passed

`Tests: 232 passed, 89 skipped, 321 total`

Duration: 123456ms
```

**Success Criteria**:
- [ ] Initial progress message sent immediately
- [ ] Tests run in project root directory
- [ ] Test summary displayed
- [ ] Duration shown in milliseconds
- [ ] Audit log entry created

**Note**: May timeout after 5 minutes if tests hang

---

### 5. `/deploy` Command

**Purpose**: Deploy to AWS environments
**Rate Limit**: 1 per 5 minutes (intensive)

#### Test 5a: Deploy to Staging

**Test Steps**:
1. Send `/deploy staging` to @JevinCC_Bot
2. Verify deployment starts
3. Monitor progress messages
4. Wait 2-5 minutes for completion
5. Verify final status message

**Expected Output**:
```
🚀 Starting deployment to staging...

This will trigger the deployment workflow.

---

(progress updates)

---

🚀 Deployment to staging

✅ Deployment successful

Duration: 234567ms
```

**Success Criteria**:
- [ ] Initial message sent immediately
- [ ] Deployment script executes
- [ ] Progress updates sent
- [ ] Final status message sent
- [ ] AWS environment updated
- [ ] Audit log entry created

#### Test 5b: Deploy to Production

**Test Steps**:
1. Send `/deploy production` to @JevinCC_Bot
2. Verify approval request received
3. Approve deployment via inline button or `approve <token>`
4. Monitor deployment progress
5. Wait 5-10 minutes for completion
6. Verify final status and smoke tests

**Expected Output**:
```
🚨 Production Deployment Approval Required

Environment: p3-interview-academy-prod-v2
Region: ap-southeast-1

Approve this production deployment?

[Deploy] [Cancel]

---

(after approval)

✅ Approval Received

Starting production deployment...

---

🧪 Running Tests

---

🏗️ Building Application

---

🚀 Deploying to PRODUCTION

Version: production-20251103-123456

⚠️ Monitor closely!

---

✅ PRODUCTION Deployment SUCCESS

Health: Green
Version: production-20251103-123456

🎉 Production is live!
```

**Success Criteria**:
- [ ] Approval request sent
- [ ] Deployment waits for approval (15 min timeout)
- [ ] Tests run before deployment
- [ ] Build completes successfully
- [ ] AWS deployment executes
- [ ] Health checks pass
- [ ] Smoke tests run
- [ ] Final status notification sent
- [ ] Audit log entry created

#### Test 5c: Invalid Arguments

**Test Steps**:
1. Send `/deploy` (no arguments)
2. Send `/deploy invalid` (invalid environment)

**Expected Output for `/deploy`**:
```
❌ Usage: `/deploy <environment>`

Environments: staging, production
```

**Expected Output for `/deploy invalid`**:
```
❌ Invalid environment: `invalid`

Valid: staging, production
```

**Success Criteria**:
- [ ] Error messages clear and helpful
- [ ] Usage instructions provided
- [ ] No deployment attempted

---

## Rate Limiting Tests

### Test 6: Readonly Commands Rate Limit

**Test Steps**:
1. Send `/status` 11 times rapidly (within 1 minute)
2. Verify 11th request is rate limited

**Expected Output**:
```
⏱️ Rate limit exceeded. Try again in XX seconds.

Rate limits protect the system from overload.
```

**Success Criteria**:
- [ ] First 10 requests succeed
- [ ] 11th request returns rate limit error
- [ ] Retry-after time is accurate
- [ ] Rate limit resets after 1 minute

---

### Test 7: Intensive Commands Rate Limit

**Test Steps**:
1. Send `/test` command
2. Immediately send `/test` again (within 5 minutes)

**Expected Output**:
```
⏱️ Rate limit exceeded. Try again in XXX seconds.

Rate limits protect the system from overload.
```

**Success Criteria**:
- [ ] First request succeeds
- [ ] Second request rate limited
- [ ] Retry-after time shows remaining seconds (up to 300)
- [ ] Rate limit resets after 5 minutes

---

### Test 8: General Commands Rate Limit

**Test Steps**:
1. Send an unknown command 6 times rapidly

**Expected Output**:
```
⏱️ Rate limit exceeded. Try again in XX seconds.

Rate limits protect the system from overload.
```

**Success Criteria**:
- [ ] First 5 requests return "unknown command" error
- [ ] 6th request rate limited
- [ ] Rate limit applies even to error responses

---

## Error Handling Tests

### Test 9: Command Not Found

**Test Steps**:
1. Send `/unknown` command

**Expected Output**:
```
❌ Unknown command: `/unknown`

Try /help to see available commands.
```

**Success Criteria**:
- [ ] Error message clear
- [ ] Suggests using /help
- [ ] Audit log entry created

---

### Test 10: Timeout Handling

**Test Steps**:
1. Modify `/test` timeout to 5 seconds (for testing)
2. Run `/test` and wait for timeout

**Expected Output**:
```
⏰ Test suite timed out after 5 minutes
```

**Success Criteria**:
- [ ] Timeout message sent
- [ ] Command terminates gracefully
- [ ] Audit log shows timeout error

---

## Audit Logging Tests

### Test 11: Verify Audit Logs

**Test Steps**:
1. Run all commands above
2. Check audit log: `cat /tmp/telegram/command-audit.log`

**Expected Output**:
```json
{
  "timestamp": "2025-11-03T12:34:56",
  "command": "status",
  "user_id": 449555452,
  "chat_id": 449555452,
  "args": [],
  "success": true,
  "error": null,
  "duration_ms": 123
}
```

**Success Criteria**:
- [ ] All commands logged
- [ ] Timestamps accurate (UTC)
- [ ] Success/failure recorded correctly
- [ ] Error messages captured
- [ ] Duration in milliseconds
- [ ] JSON format valid

---

## Security Tests

### Test 12: Unauthorized Access

**Test Steps**:
1. Send command from different Telegram account (if available)

**Expected Output**:
- No response (webhook rejects unauthorized chat ID)

**Success Criteria**:
- [ ] Only authorized chat ID can execute commands
- [ ] Unauthorized attempts logged to server logs
- [ ] No error message sent to unauthorized user

---

## BotFather Commands Menu

### Test 13: Autocomplete Menu

**Setup Steps**:
1. Open @BotFather in Telegram
2. Send `/mybots`
3. Select @JevinCC_Bot
4. Select "Edit Bot" → "Edit Commands"
5. Send the following commands list:

```
status - Show system health and status
monitor - View detailed system metrics
test - Run test suite
deploy - Deploy to AWS environment
help - Show command help
```

**Test Steps**:
1. Open @JevinCC_Bot
2. Type `/` and verify autocomplete menu appears
3. Verify all 5 commands shown with descriptions

**Success Criteria**:
- [ ] All commands appear in autocomplete
- [ ] Descriptions match documentation
- [ ] Commands are in logical order

---

## Integration Tests

### Test 14: End-to-End Workflow

**Test Steps**:
1. `/status` - Verify system healthy
2. `/test` - Run tests and verify passing
3. `/deploy staging` - Deploy to staging
4. `/status` - Verify deployment successful
5. `/monitor` - Check for any issues
6. `/deploy production` - Deploy to production with approval

**Success Criteria**:
- [ ] All commands execute successfully
- [ ] Workflow completes end-to-end
- [ ] No errors or failures
- [ ] Audit log shows complete workflow

---

## Performance Tests

### Test 15: Response Time

**Test Steps**:
1. Send `/status` 10 times
2. Measure response times

**Success Criteria**:
- [ ] Average response time < 3 seconds
- [ ] 95th percentile < 5 seconds
- [ ] No timeouts

---

## Test Results Summary

| Test Case | Status | Notes |
|-----------|--------|-------|
| 1. /status | ⬜ | |
| 2. /monitor | ⬜ | |
| 3. /help | ⬜ | |
| 4. /test | ⬜ | |
| 5a. /deploy staging | ⬜ | |
| 5b. /deploy production | ⬜ | |
| 5c. Invalid args | ⬜ | |
| 6. Readonly rate limit | ⬜ | |
| 7. Intensive rate limit | ⬜ | |
| 8. General rate limit | ⬜ | |
| 9. Command not found | ⬜ | |
| 10. Timeout handling | ⬜ | |
| 11. Audit logging | ⬜ | |
| 12. Unauthorized access | ⬜ | |
| 13. BotFather menu | ⬜ | |
| 14. End-to-end workflow | ⬜ | |
| 15. Performance | ⬜ | |

---

## Known Issues

- None currently identified

---

## Next Steps

1. Complete manual testing using this test plan
2. Update test results in this document
3. File issues for any failures
4. Update CLAUDE.md with final status

---

**Last Updated**: 2025-11-03
**Version**: 1.0.0
**Tester**: [Name]
**Test Date**: [Date]
