# Testing Multiple-Choice Questions

Guide for testing Telegram inline keyboard button functionality.

## Prerequisites

1. **Webhook server running**:
   ```bash
   # Check if running
   systemctl status telegram-webhook

   # Or check logs
   journalctl -u telegram-webhook -f
   ```

2. **Tunnel active** (ngrok/Cloudflare):
   ```bash
   # Verify webhook URL registered
   curl "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo"
   ```

3. **Environment configured**:
   ```bash
   # Verify BOT_TOKEN and CHAT_ID
   cd /home/runner/workspace/scripts/telegram
   cat .env | grep -E "BOT_TOKEN|CHAT_ID"
   ```

## Test 1: Basic Single-Select Question

**Objective**: Send a simple question with 2 options, verify button tap works.

### Steps

1. **Send test question**:
   ```bash
   cd /home/runner/workspace

   ./scripts/telegram/integrations/claude-ask-question.sh \
     "Which library should we use?" \
     '[{"label":"React","description":"UI framework by Meta"},{"label":"Vue","description":"Progressive JavaScript framework"}]' \
     false &

   PID=$!
   ```

2. **Check Telegram**:
   - You should see message with question text
   - Two inline buttons: [React] [Vue]
   - Fallback text: "Or type a number (1-2) or option label"

3. **Tap a button** (e.g., "React")

4. **Verify response**:
   ```bash
   # Wait for background process to complete
   wait $PID

   # Should output: 0 (for React) or 1 (for Vue)
   ```

5. **Check server logs**:
   ```bash
   journalctl -u telegram-webhook -n 20

   # Should show:
   # "Processed single-select for token Q...: 0"
   ```

### Expected Results

- ✅ Telegram message with 2 buttons
- ✅ Button tap removes loading state (Telegram acknowledgment)
- ✅ Script returns selected index (0 or 1)
- ✅ Pending file removed from `.pending/`
- ✅ Inbox file created and read from `.inbox/`

## Test 2: Multi-Select Question

**Objective**: Test selecting multiple options with "Done" button.

### Steps

1. **Send multi-select question**:
   ```bash
   cd /home/runner/workspace

   ./scripts/telegram/integrations/claude-ask-question.sh \
     "Which features do you want to enable?" \
     '[{"label":"Dark Mode","description":"Theme switching"},{"label":"Notifications","description":"Email alerts"},{"label":"Analytics","description":"User tracking"}]' \
     true &

   PID=$!
   ```

2. **Check Telegram**:
   - Message with 3 option buttons + 1 "Done" button
   - Text: "Multi-select: Tap multiple options, then tap Done"

3. **Tap multiple buttons** (e.g., "Dark Mode", "Analytics")
   - After each tap, you should see popup: "✅ Added: <label> (tap Done when ready)"

4. **Tap "Done" button**

5. **Verify response**:
   ```bash
   wait $PID

   # Should output: 0,2 (for Dark Mode and Analytics)
   ```

6. **Check server logs**:
   ```bash
   journalctl -u telegram-webhook -n 30

   # Should show:
   # "Multi-select state for Q...: ['0', '2']"
   # "Processed multi-select done for token Q...: ['0', '2']"
   ```

### Expected Results

- ✅ Telegram message with 3 buttons + Done button
- ✅ Each button tap shows "Added: <label>" popup
- ✅ "Done" button shows "Selected: <label1>, <label2>" popup
- ✅ Script returns comma-separated indices (e.g., "0,2")
- ✅ Server state cleared after "Done"

## Test 3: Text Fallback (Single-Select)

**Objective**: Verify typing number works if buttons fail.

### Steps

1. **Send question** (same as Test 1)

2. **Instead of tapping button, type**: `1` (or `React`)

3. **Verify response**: Should return `0` (0-based index)

### Expected Results

- ✅ Script returns correct index (0 for option 1)
- ✅ Works even if buttons don't render

**Note**: Text fallback requires additional webhook server logic (not yet implemented in base version). This test verifies the concept.

## Test 4: Timeout Behavior

**Objective**: Verify script returns first option after timeout.

### Steps

1. **Send question with short timeout**:
   ```bash
   # Edit claude-ask-question.sh temporarily:
   # Change: await_reply.sh "$TOKEN" 600
   # To:     await_reply.sh "$TOKEN" 5  # 5 second timeout

   ./scripts/telegram/integrations/claude-ask-question.sh \
     "Which library?" \
     '[{"label":"React","description":"UI"},{"label":"Vue","description":"Framework"}]' \
     false
   ```

2. **Wait 5 seconds without responding**

3. **Verify response**:
   - Script should output: `0` (first option)
   - stderr should show: "⏰ Timeout - returning first option (default)"

### Expected Results

- ✅ Script doesn't hang forever
- ✅ Returns safe default (index 0)
- ✅ Logs timeout warning

## Test 5: Notifications Disabled

**Objective**: Verify auto-select when `.notify.enabled` missing.

### Steps

1. **Disable notifications**:
   ```bash
   cd /home/runner/workspace
   rm -f .notify.enabled
   ```

2. **Send question**:
   ```bash
   ./scripts/telegram/integrations/claude-ask-question.sh \
     "Which library?" \
     '[{"label":"React","description":"UI"}]' \
     false
   ```

3. **Verify response**:
   - Immediate return (no waiting)
   - Output: `0`
   - stderr: "⚠️ Notifications disabled - returning first option"

4. **Check Telegram**: No message sent

5. **Re-enable notifications**:
   ```bash
   touch .notify.enabled
   ```

### Expected Results

- ✅ No Telegram message sent
- ✅ Instant return with first option
- ✅ No webhook hit

## Test 6: Callback Acknowledgment

**Objective**: Verify button tap removes loading state.

### Steps

1. **Send question** (any single-select)

2. **Tap button and watch carefully**:
   - Button should show loading spinner briefly
   - Loading spinner should disappear within ~1 second
   - Small popup should appear: "✅ Selection received"

3. **Check server logs**:
   ```bash
   journalctl -u telegram-webhook -n 10 | grep "acknowledge"
   ```

### Expected Results

- ✅ Loading state removed (answerCallbackQuery called)
- ✅ User sees feedback popup
- ✅ No "loading" state stuck on button

## Test 7: Invalid Callback Format

**Objective**: Verify server handles malformed callback data.

### Steps

1. **Send test callback** (simulate malformed data):
   ```bash
   # Use Telegram Bot API directly
   curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/sendMessage" \
     -H "Content-Type: application/json" \
     -d '{
       "chat_id": "'$CHAT_ID'",
       "text": "Test invalid callback",
       "reply_markup": {
         "inline_keyboard": [[{
           "text": "Bad Format",
           "callback_data": "NO_DOUBLE_COLON"
         }]]
       }
     }'
   ```

2. **Tap "Bad Format" button**

3. **Check server logs**:
   ```bash
   journalctl -u telegram-webhook -n 5

   # Should show:
   # "Invalid callback data format: NO_DOUBLE_COLON"
   ```

### Expected Results

- ✅ Server logs error
- ✅ User sees "❌ Invalid selection format" popup
- ✅ Server doesn't crash

## Test 8: Concurrent Questions

**Objective**: Verify multiple questions don't interfere.

### Steps

1. **Send two questions rapidly**:
   ```bash
   cd /home/runner/workspace

   ./scripts/telegram/integrations/claude-ask-question.sh \
     "Question 1?" \
     '[{"label":"A","description":"Option A"}]' \
     false &

   sleep 1

   ./scripts/telegram/integrations/claude-ask-question.sh \
     "Question 2?" \
     '[{"label":"B","description":"Option B"}]' \
     false &

   wait
   ```

2. **Check Telegram**: Two separate messages with buttons

3. **Tap buttons for each question**

4. **Verify**: Each script returns correct selection

### Expected Results

- ✅ Two independent pending tokens
- ✅ Each response routed to correct token
- ✅ No cross-contamination

## Test 9: Multi-Select Toggle (Deselect)

**Objective**: Verify tapping same button twice removes selection.

### Steps

1. **Send multi-select question** (Test 2)

2. **Tap "Dark Mode"** (should add)
   - Popup: "✅ Added: Dark Mode"

3. **Tap "Dark Mode" again** (should remove)
   - Popup: "❌ Removed: Dark Mode"

4. **Tap "Done"**

5. **Verify response**: Empty or other selections only

### Expected Results

- ✅ Toggle behavior works
- ✅ Server state updated correctly
- ✅ Final selection excludes toggled-off options

## Test 10: End-to-End with Claude Code

**Objective**: Verify integration with Claude Code AskUserQuestion tool.

### Steps

1. **Trigger Claude Code to ask a question** (via your workflow)

2. **Observe Telegram**: Message with inline buttons

3. **Respond via button tap**

4. **Verify**: Claude Code receives correct selection

### Expected Results

- ✅ Seamless integration
- ✅ Claude Code proceeds with user's choice
- ✅ No manual intervention required

## Troubleshooting

### Buttons Not Appearing

**Check**:
- Webhook server running: `systemctl status telegram-webhook`
- BOT_TOKEN valid: `curl "https://api.telegram.org/bot$BOT_TOKEN/getMe"`
- Message sent: Check server logs for "Question sent to Telegram"

**Fix**:
- Restart webhook server
- Re-register webhook URL
- Check firewall rules

### Callback Not Processed

**Check**:
- Webhook receiving callbacks: `journalctl -u telegram-webhook -f` (tap button, watch logs)
- CHAT_ID matches: Compare with callback query `from.id`

**Fix**:
- Verify CHAT_ID in `.env` matches your Telegram user ID
- Check webhook URL reachable from Telegram servers

### Script Hangs Forever

**Check**:
- Timeout set: `await_reply.sh "$TOKEN" 600` (should have timeout arg)
- Pending file exists: `ls .pending/`

**Fix**:
- Add timeout argument to `await_reply.sh` call
- Manually remove stuck pending files

### Multi-Select State Lost

**Check**:
- Webhook server restarted?: In-memory state lost on restart
- Pending file format: Should contain "multiselect" keyword

**Fix**:
- Persist multi-select state to disk (enhancement)
- Use Redis for state (production-ready solution)

## Performance Testing

### Latency Measurement

```bash
# Measure round-trip time
time ./scripts/telegram/integrations/claude-ask-question.sh \
  "Test?" \
  '[{"label":"A","description":"Test"}]' \
  false

# Expected: 1-3 seconds (network + user tap)
```

### Load Testing

```bash
# Send 10 questions concurrently
for i in {1..10}; do
  ./scripts/telegram/integrations/claude-ask-question.sh \
    "Question $i?" \
    '[{"label":"Opt","description":"Test"}]' \
    false &
done

wait
```

## Automated Testing

**Future**: Create automated test suite using Telegram Bot API test server.

```bash
# Pseudocode
# 1. Set up test bot with mock webhook
# 2. Send questions programmatically
# 3. Simulate button taps via API calls
# 4. Assert responses match expected
```

## See Also

- [README_QUESTIONS.md](README_QUESTIONS.md) - Feature documentation
- [../core/TESTING_CORE.md](../core/TESTING_CORE.md) - Core system testing
- [../server/README_SERVER.md](../server/README_SERVER.md) - Webhook server docs
