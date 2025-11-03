# Telegram Claude Code Controller - Phase 2 Test Plan

## Overview

This test plan covers comprehensive testing of all 6 Telegram integrations and core infrastructure. Testing requires bot credentials and webhook setup, which must be completed during Phase E (production deployment).

**Status**: Documentation complete, ready for Phase E testing
**Last Updated**: 2025-11-01

---

## Prerequisites

### Required Configuration
1. **Telegram Bot Token** (from @BotFather)
   - Set in `TELEGRAM_BOT_TOKEN` environment variable
   - Store in `.bashrc` or secure credential store

2. **Telegram Chat ID** (from @userinfobot)
   - Set in `TELEGRAM_CHAT_ID` environment variable
   - Can also be stored in `~/.telegram_chat_id` file

3. **Webhook URL** (Replit environment)
   - Must be HTTPS (Telegram requirement)
   - Format: `https://<repl-name>.<username>.repl.co`
   - Set in `TELEGRAM_WEBHOOK_URL` environment variable

### System Initialization
```bash
# Initialize Telegram system
./scripts/telegram/core/init.sh

# Verify configuration
./scripts/telegram/core/notifyctl status

# Expected output:
# Notifications: ENABLED
# TELEGRAM_BOT_TOKEN: set
# TELEGRAM_CHAT_ID: set
# TELEGRAM_WEBHOOK_URL: set
```

---

## Test Suite

### Test 1: Webhook Server

**Purpose**: Verify webhook server receives and processes Telegram messages

**Prerequisites**:
- Bot token and chat ID configured
- Webhook URL set

**Test Steps**:
```bash
# 1. Start webhook server
python scripts/telegram/server/server.py

# Expected output:
# Telegram Webhook Server starting...
# * Running on http://0.0.0.0:8080
# Webhook URL: https://<repl-name>.<username>.repl.co

# 2. Register webhook with Telegram
./scripts/telegram/tools/webhook_register.sh

# Expected output:
# Registering webhook...
# Response: {"ok":true,"result":true,"description":"Webhook was set"}

# 3. Send test message via Telegram app
# - Open Telegram app
# - Find your bot
# - Send message: "test"

# 4. Verify server receives message
# Expected server output:
# Received message: test
# From: <your_username> (chat_id: <your_chat_id>)

# 5. Send reply from server
curl -X POST http://localhost:8080/test/send \
  -H "Content-Type: application/json" \
  -d '{"text": "Server reply test"}'

# 6. Verify reply in Telegram app
# Expected: Message "Server reply test" appears in chat
```

**Expected Results**:
- ✅ Server starts without errors
- ✅ Webhook registration succeeds
- ✅ Server receives and logs Telegram messages
- ✅ Server can send replies to Telegram
- ✅ Messages appear in Telegram app

**Common Issues**:
- **Error**: "Webhook already registered" → Run `webhook_register.sh` again (idempotent)
- **Error**: "Bot token invalid" → Check `TELEGRAM_BOT_TOKEN` value
- **Error**: "Chat ID not found" → Verify `TELEGRAM_CHAT_ID` is correct number
- **No messages received**: Check firewall, verify webhook URL is HTTPS

**How to Verify**:
```bash
# Check webhook info
./scripts/telegram/tools/webhook_info.sh

# Expected output:
# {
#   "ok": true,
#   "result": {
#     "url": "https://<repl-name>.<username>.repl.co",
#     "has_custom_certificate": false,
#     "pending_update_count": 0,
#     "max_connections": 40
#   }
# }
```

---

### Test 2: AWS Deployment Approval

**Purpose**: Test GitHub Actions approval gate integration

**Prerequisites**:
- Webhook server running
- Notifications enabled
- GitHub Actions workflow with approval gate

**Test Steps**:
```bash
# 1. Enable notifications
./scripts/telegram/core/notifyctl on

# 2. Trigger approval workflow
# (In GitHub Actions or simulate locally)
APPROVAL_TOKEN=$(cat /proc/sys/kernel/random/uuid | cut -d- -f1)
echo $APPROVAL_TOKEN > /tmp/.pending/deploy-prod-$APPROVAL_TOKEN

# 3. Send approval request
./scripts/telegram/core/notify.sh \
  "🚀 AWS Production Deployment" \
  "Approve with: approve $APPROVAL_TOKEN"

# 4. Check Telegram app
# Expected: Message with approval token

# 5. Send approval via Telegram
# Type in Telegram: approve <token>

# 6. Verify approval file created
ls /tmp/.inbox/

# Expected: File with token in inbox folder
```

**Expected Results**:
- ✅ Approval request sent to Telegram
- ✅ Token displayed in message
- ✅ Reply processed by webhook server
- ✅ Approval file created in inbox
- ✅ Workflow can detect approval

**Common Issues**:
- **Pending folder missing**: Create with `mkdir -p /tmp/.pending /tmp/.inbox`
- **Token mismatch**: Ensure exact token copied (case-sensitive)
- **File permissions**: Check inbox folder writable by webhook server

**How to Verify**:
```bash
# Monitor pending approvals
ls -la /tmp/.pending/

# Monitor received approvals
ls -la /tmp/.inbox/

# Watch webhook server logs
tail -f /tmp/telegram_webhook.log
```

---

### Test 3: Database Migration Approval

**Purpose**: Test database migration safety workflow

**Prerequisites**:
- Webhook server running
- Notifications enabled
- Test database available

**Test Steps**:
```bash
# 1. Test dry-run mode (no approval)
./scripts/telegram/integrations/db-migrate-p3.sh --staging --dry-run

# Expected output:
# 🔍 DRY RUN: Would execute...
# (Shows SQL but doesn't run)

# 2. Test approval mode - staging
./scripts/telegram/integrations/db-migrate-p3.sh --staging

# Expected: Telegram message with approval token

# 3. Send approval via Telegram
# Type: approve <token>

# 4. Verify migration executes
# Expected output:
# ✅ Approval received
# Executing migration...
# Migration complete

# 5. Test production mode
./scripts/telegram/integrations/db-migrate-p3.sh --production

# Expected: Different token, requires separate approval

# 6. Test rejection
# Type in Telegram: reject <token>

# Expected output:
# ❌ Migration rejected
# (Migration does not execute)
```

**Expected Results**:
- ✅ Dry-run shows SQL without executing
- ✅ Staging mode sends approval request
- ✅ Approval executes migration
- ✅ Production mode requires separate approval
- ✅ Rejection prevents execution

**Common Issues**:
- **SQL error**: Check database credentials in script
- **Timeout**: Increase wait time in await_reply.sh
- **No approval**: Verify token matches exactly

**How to Verify**:
```bash
# Check database changes
psql $DATABASE_URL -c "\dt"

# Check migration log
cat /tmp/db-migration-*.log

# Check approval history
ls -la /tmp/.inbox/ | grep "db-migrate"
```

---

### Test 4: Gemini Research Notifications

**Purpose**: Test research task start/complete notifications

**Prerequisites**:
- Webhook server running
- Notifications enabled

**Test Steps**:
```bash
# 1. Test start notification
./scripts/telegram/integrations/gemini-notify-p3.sh \
  start \
  "Test Research Task" \
  "Investigating testing best practices"

# Expected in Telegram:
# 🔬 Gemini Research Started
# Task: Test Research Task
# Details: Investigating testing best practices

# 2. Test complete notification
./scripts/telegram/integrations/gemini-notify-p3.sh \
  complete \
  "Test Research Task" \
  "Found 5 best practices" \
  "/tmp/research-results.md"

# Expected in Telegram:
# ✅ Research Complete
# Task: Test Research Task
# Summary: Found 5 best practices
# Report: /tmp/research-results.md

# 3. Test silent mode
./scripts/telegram/core/notifyctl off
./scripts/telegram/integrations/gemini-notify-p3.sh \
  start \
  "Silent Task" \
  "Should not send notification"

# Expected: No Telegram message
```

**Expected Results**:
- ✅ Start notification sent immediately
- ✅ Complete notification includes results
- ✅ File path displayed correctly
- ✅ Silent mode prevents notifications

**Common Issues**:
- **Message not received**: Check notifications enabled (`notifyctl status`)
- **Formatting broken**: Escape special characters in task description
- **File path wrong**: Use absolute paths

**How to Verify**:
```bash
# Check notification history
./scripts/telegram/tools/monitor.sh | grep "Gemini"

# Check silent mode
./scripts/telegram/core/notifyctl status
# Expected: Notifications: DISABLED
```

---

### Test 5: Stripe Testing Notifications

**Purpose**: Test payment event notifications

**Prerequisites**:
- Webhook server running
- Notifications enabled
- Stripe CLI installed (optional for full test)

**Test Steps**:
```bash
# 1. Test payment success
./scripts/telegram/integrations/stripe-test-notify.sh \
  success \
  "100 credits" \
  "cus_test123"

# Expected in Telegram:
# 💰 Payment Success
# Amount: 100 credits
# Customer: cus_test123

# 2. Test payment failure
./scripts/telegram/integrations/stripe-test-notify.sh \
  failure \
  "500 credits" \
  "cus_test456" \
  "Card declined"

# Expected in Telegram:
# ❌ Payment Failed
# Amount: 500 credits
# Customer: cus_test456
# Reason: Card declined

# 3. Test with Stripe CLI (if available)
stripe listen --forward-to localhost:5000/api/webhooks/stripe
stripe trigger checkout.session.completed

# Expected: Real webhook event triggers notification
```

**Expected Results**:
- ✅ Success notifications show payment details
- ✅ Failure notifications show error reason
- ✅ Stripe CLI events trigger notifications
- ✅ Customer IDs displayed correctly

**Common Issues**:
- **Stripe CLI not found**: Install from stripe.com/docs/stripe-cli
- **Webhook not forwarding**: Check webhook URL in Stripe CLI output
- **Event not matched**: Verify event type in script

**How to Verify**:
```bash
# Check notification log
cat /tmp/stripe-notifications.log

# Check Stripe CLI events
stripe logs tail
```

---

### Test 6: Claude Code Operations

**Purpose**: Test all 4 Claude Code operation types

**Prerequisites**:
- Webhook server running
- Notifications enabled

**Test Steps**:
```bash
# 1. Test START action
./scripts/telegram/integrations/claude-session-notify.sh \
  start \
  "Testing notification system"

# Expected in Telegram:
# ⚙️ Claude Code Started
# Task: Testing notification system

# 2. Test COMPLETE action
./scripts/telegram/integrations/claude-session-notify.sh \
  complete \
  "All tests passing" \
  "/tmp/test-results.log"

# Expected in Telegram:
# ✅ Task Complete
# Summary: All tests passing
# Log: /tmp/test-results.log

# 3. Test APPROVE action
if ./scripts/telegram/integrations/claude-session-notify.sh \
  approve \
  "Delete 50 test files?"; then
  echo "Approved"
else
  echo "Rejected"
fi

# Expected in Telegram:
# ⚠️ Approval Required
# Question: Delete 50 test files?
# Reply: approve <token> OR reject <token>

# 4. Send approval via Telegram
# Type: approve <token>

# Expected script output:
# Approved

# 5. Test ALERT action
./scripts/telegram/integrations/claude-session-notify.sh \
  alert \
  "Test suite completed" \
  "179/203 tests passing (88%)"

# Expected in Telegram:
# 📢 Alert
# Message: Test suite completed
# Details: 179/203 tests passing (88%)
```

**Expected Results**:
- ✅ START shows task description
- ✅ COMPLETE includes results and log path
- ✅ APPROVE blocks until reply received
- ✅ ALERT displays formatted message
- ✅ All message types have correct emojis

**Common Issues**:
- **Approval timeout**: Increase timeout in await_reply.sh (default 5min)
- **Script hangs**: Check webhook server running
- **Wrong action**: Verify first argument (start/complete/approve/alert)

**How to Verify**:
```bash
# Check all notification types
./scripts/telegram/tools/monitor.sh | grep "Claude"

# Check approval flow
ls -la /tmp/.pending/ /tmp/.inbox/

# Test approval timeout
timeout 10s ./scripts/telegram/integrations/claude-session-notify.sh approve "Test timeout"
# Expected: Times out after 10 seconds
```

---

### Test 7: Multiple-Choice Questions

**Purpose**: Test inline keyboard buttons

**Prerequisites**:
- Webhook server running
- Python script dependencies installed

**Test Steps**:
```bash
# 1. Test single-choice question
python scripts/telegram/server/send_question.py \
  "Which environment?" \
  "staging,production"

# Expected in Telegram:
# Question: Which environment?
# [Staging] [Production]

# 2. Click button in Telegram
# Expected: Callback data received by webhook server

# 3. Test multi-option question
python scripts/telegram/server/send_question.py \
  "Select test types:" \
  "unit,integration,e2e,smoke"

# Expected in Telegram:
# Question: Select test types:
# [Unit] [Integration]
# [E2e]  [Smoke]

# 4. Test with script integration
./scripts/telegram/integrations/claude-ask-question.sh \
  "Approve deployment?" \
  "yes,no"

# Expected in Telegram:
# ❓ Question
# Approve deployment?
# [Yes] [No]

# 5. Verify callback handling
# (Check webhook server logs for callback_query events)
```

**Expected Results**:
- ✅ Buttons displayed correctly
- ✅ Button clicks trigger callback
- ✅ Callback data includes user choice
- ✅ Multi-option questions show all buttons
- ✅ Integration script formats question

**Common Issues**:
- **Buttons not showing**: Check Telegram API version supports inline keyboards
- **Callback not received**: Verify webhook server handles callback_query events
- **Too many buttons**: Telegram limits inline keyboard size (check layout)

**How to Verify**:
```bash
# Check webhook server logs for callbacks
tail -f /tmp/telegram_webhook.log | grep callback_query

# Test button response parsing
# (Webhook server should log button data)
```

---

### Test 8: Silent Mode

**Purpose**: Verify all integrations respect silent mode

**Prerequisites**:
- Webhook server running
- All integrations tested individually

**Test Steps**:
```bash
# 1. Verify notifications enabled
./scripts/telegram/core/notifyctl status
# Expected: Notifications: ENABLED

# 2. Disable notifications
./scripts/telegram/core/notifyctl off

# 3. Test each integration (should NOT send)
./scripts/telegram/core/notify.sh "Test" "Should not send"
./scripts/telegram/integrations/gemini-notify-p3.sh start "Test" "Silent"
./scripts/telegram/integrations/stripe-test-notify.sh success "100" "test"
./scripts/telegram/integrations/claude-session-notify.sh start "Test"

# Expected: No Telegram messages received

# 4. Verify silent mode status
./scripts/telegram/core/notifyctl status
# Expected: Notifications: DISABLED

# 5. Re-enable notifications
./scripts/telegram/core/notifyctl on

# 6. Test notification works again
./scripts/telegram/core/notify.sh "Test" "Should send now"

# Expected: Message received in Telegram
```

**Expected Results**:
- ✅ Status command shows correct state
- ✅ All integrations check silent mode
- ✅ No messages sent when disabled
- ✅ Messages resume after re-enabling
- ✅ State persists across sessions

**Common Issues**:
- **State not persisting**: Check `/tmp/.notifications_disabled` file
- **Integration ignores flag**: Verify script sources notifyctl
- **Status command fails**: Check notifyctl is executable

**How to Verify**:
```bash
# Check silent mode file
ls -la /tmp/.notifications_disabled

# Test state persistence
./scripts/telegram/core/notifyctl off
./scripts/telegram/core/notifyctl status
# Expected: DISABLED

# Test integration check
grep -n "NOTIFICATIONS_DISABLED" scripts/telegram/core/notify.sh
# Should find check at line 10-14
```

---

### Test 9: Cleanup System

**Purpose**: Test automated file cleanup

**Prerequisites**:
- Pending and inbox folders exist
- Test files created

**Test Steps**:
```bash
# 1. Create test files
mkdir -p /tmp/.pending /tmp/.inbox
echo "test" > /tmp/.pending/test-old-1
echo "test" > /tmp/.inbox/test-old-2
touch -d "8 days ago" /tmp/.pending/test-old-1
touch -d "8 days ago" /tmp/.inbox/test-old-2

# 2. Create recent files
echo "test" > /tmp/.pending/test-new
echo "test" > /tmp/.inbox/test-new

# 3. Run cleanup
./scripts/telegram/tools/cleanup.sh

# Expected output:
# Cleaning up old Telegram files...
# Removed: /tmp/.pending/test-old-1 (8 days old)
# Removed: /tmp/.inbox/test-old-2 (8 days old)
# Kept 2 recent files (< 7 days old)

# 4. Verify old files deleted
ls /tmp/.pending/test-old-1
# Expected: File not found

# 5. Verify new files kept
ls /tmp/.pending/test-new
# Expected: File exists

# 6. Test dry-run mode
touch -d "10 days ago" /tmp/.pending/test-old-3
./scripts/telegram/tools/cleanup.sh --dry-run

# Expected output:
# DRY RUN: Would remove /tmp/.pending/test-old-3
# (File not actually deleted)
```

**Expected Results**:
- ✅ Files older than 7 days deleted
- ✅ Recent files preserved
- ✅ Dry-run shows what would be deleted
- ✅ Cleanup runs without errors
- ✅ Log shows file ages

**Common Issues**:
- **Permission denied**: Check folder permissions
- **Wrong age calculation**: Verify `find -mtime +7` works
- **All files deleted**: Check date logic (should be >7, not >=7)

**How to Verify**:
```bash
# List files by age
find /tmp/.pending /tmp/.inbox -type f -mtime +7 -ls

# Check cleanup schedule
crontab -l | grep cleanup.sh

# Test cleanup in cron (optional)
# Add to crontab: 0 2 * * * /path/to/cleanup.sh
```

---

## Integration Testing Matrix

| Integration | Silent Mode | Approval | Callback | Error Handling | Tested |
|-------------|-------------|----------|----------|----------------|--------|
| Webhook Server | N/A | N/A | ✅ | ✅ | ⏳ |
| AWS Deployment | ✅ | ✅ | N/A | ✅ | ⏳ |
| DB Migration | ✅ | ✅ | N/A | ✅ | ⏳ |
| Gemini Research | ✅ | N/A | N/A | ✅ | ⏳ |
| Stripe Testing | ✅ | N/A | N/A | ✅ | ⏳ |
| Claude Code Ops | ✅ | ✅ | N/A | ✅ | ⏳ |
| Multiple-Choice | ✅ | N/A | ✅ | ✅ | ⏳ |

---

## Performance Benchmarks

### Expected Response Times

| Operation | Expected Time | Maximum Time |
|-----------|---------------|--------------|
| Send notification | < 1 second | 3 seconds |
| Approval workflow | < 5 minutes | 10 minutes |
| Webhook processing | < 100ms | 500ms |
| Button callback | < 200ms | 1 second |
| Cleanup script | < 5 seconds | 30 seconds |

### Load Testing (Optional)

```bash
# Test 100 consecutive notifications
for i in {1..100}; do
  ./scripts/telegram/core/notify.sh "Test $i" "Load test"
  sleep 0.5
done

# Expected: All messages delivered within 2 minutes
```

---

## Security Testing

### Test Unauthorized Access

```bash
# 1. Test without bot token
unset TELEGRAM_BOT_TOKEN
./scripts/telegram/core/notify.sh "Test" "Should fail"

# Expected: Error message about missing token

# 2. Test with invalid token
export TELEGRAM_BOT_TOKEN="invalid"
./scripts/telegram/core/notify.sh "Test" "Should fail"

# Expected: Telegram API error

# 3. Test webhook signature (requires running server)
curl -X POST http://localhost:8080/ \
  -H "Content-Type: application/json" \
  -d '{"message": {"text": "fake"}}'

# Expected: Server processes (no signature verification yet)
# NOTE: Add signature verification in production
```

### Test Approval Token Security

```bash
# 1. Test token guessing
./scripts/telegram/integrations/claude-session-notify.sh approve "Test" &
PID=$!

# Try wrong token in Telegram: approve wrong-token
# Expected: No approval granted

# Send correct token
# Expected: Approval granted

# 2. Test token expiry
# (Currently no expiry - consider adding timeout)
```

---

## Troubleshooting Guide

### Common Error Messages

**"Bot token not set"**
- Set `TELEGRAM_BOT_TOKEN` environment variable
- Check token is valid (starts with numbers)

**"Chat ID not set"**
- Set `TELEGRAM_CHAT_ID` environment variable
- Verify ID is numeric (no letters)

**"Webhook registration failed"**
- Check webhook URL is HTTPS
- Verify URL is publicly accessible
- Check bot token is correct

**"Message not delivered"**
- Check webhook server running
- Verify notifications enabled (`notifyctl status`)
- Check Telegram API rate limits

**"Approval timeout"**
- Increase timeout in await_reply.sh
- Check webhook server processing approvals
- Verify token in message matches pending file

**"File not found"**
- Run init.sh to create directories
- Check folder permissions
- Verify file paths in scripts

---

## Post-Testing Checklist

After completing all tests:

- [ ] All 9 test cases passed
- [ ] Webhook server handles all message types
- [ ] Approval workflows complete end-to-end
- [ ] Silent mode prevents notifications
- [ ] Cleanup removes old files
- [ ] Performance meets benchmarks
- [ ] Security checks completed
- [ ] Documentation updated with results
- [ ] Production credentials configured
- [ ] Monitoring system verified

---

## Phase E Deployment Readiness

**Prerequisites for Production**:
1. All 9 tests passed in development
2. Bot credentials secured (not in git)
3. Webhook server tested for 24+ hours
4. Approval workflows verified
5. Monitoring system operational
6. Cleanup script scheduled (cron)
7. Documentation complete
8. Team trained on usage

**Go/No-Go Criteria**:
- ✅ Core notifications working
- ✅ Approval workflows tested
- ✅ Silent mode functional
- ✅ Error handling verified
- ✅ Performance acceptable
- ✅ Security reviewed

---

## Support & Maintenance

**Daily Checks**:
- Webhook server status
- Notification delivery
- Approval queue

**Weekly Checks**:
- Cleanup script execution
- Error log review
- Performance metrics

**Monthly Checks**:
- Credential rotation (if applicable)
- Integration updates
- Documentation review

---

**Last Updated**: 2025-11-01
**Test Plan Version**: 1.0
**Status**: Ready for Phase E testing
