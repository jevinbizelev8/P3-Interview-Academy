# Multiple-Choice Questions via Telegram

Enable Claude Code to ask multiple-choice questions via Telegram with clickable inline keyboard buttons.

## Overview

This integration extends the Telegram controller to support Claude Code's `AskUserQuestion` tool, providing:

- **Inline keyboard buttons** - Tap to select options (primary UX)
- **Text fallback** - Type number or label if buttons fail (backup)
- **Multi-select support** - Select multiple options with "Done" button
- **Graceful degradation** - Auto-selects first option on timeout/disable

## How It Works

### Single-Select Questions

1. **Claude Code asks**: "Which authentication method?"
2. **Telegram shows**: Inline buttons for each option (JWT, OAuth, Session)
3. **User taps**: Option button (e.g., "JWT")
4. **Server receives**: Callback query with token and selection index
5. **Script returns**: Selected option index (0-based)

**Example Message**:
```
❓ Which authentication method?

1. JWT
   Stateless tokens with client-side storage

2. OAuth 2.0
   Third-party authentication via providers

3. Session Cookies
   Server-side session management

Or type a number (1-3) or option label
```

**Inline Buttons**: [JWT] [OAuth 2.0] [Session Cookies]

### Multi-Select Questions

1. **Claude Code asks**: "Which features to enable?"
2. **Telegram shows**: Inline buttons + "Done" button
3. **User taps**: Multiple options (buttons highlight on tap)
4. **User taps**: "Done" button to finalize
5. **Server receives**: Accumulated selections
6. **Script returns**: Comma-separated indices (e.g., "0,2,4")

**Example Message**:
```
❓ Which features do you want to enable?

1. Dark Mode
   Theme switching support

2. Email Notifications
   Receive alerts via email

3. Analytics
   Track user behavior

ℹ️ Multi-select: Tap multiple options, then tap Done

Or type numbers separated by commas (1,2,3)
```

**Inline Buttons**: [Dark Mode] [Email Notifications] [Analytics] [✅ Done]

## Usage

### From Bash Scripts

```bash
#!/bin/bash
# Ask a single-select question
ANSWER=$(./scripts/telegram/integrations/claude-ask-question.sh \
  "Which library should we use?" \
  '[{"label":"React","description":"UI framework"},{"label":"Vue","description":"Progressive framework"}]' \
  false)

echo "User selected option: $ANSWER"  # Output: 0 or 1

# Ask a multi-select question
ANSWERS=$(./scripts/telegram/integrations/claude-ask-question.sh \
  "Which features to enable?" \
  '[{"label":"Auth","description":"User authentication"},{"label":"DB","description":"Database access"}]' \
  true)

echo "User selected options: $ANSWERS"  # Output: 0,1 or 0 or 1
```

### From Claude Code AskUserQuestion Tool

The tool automatically formats options into the required JSON structure:

```javascript
// Claude Code internally calls:
const response = await askUserQuestion({
  question: "Which auth method?",
  options: [
    { label: "JWT", description: "Stateless tokens" },
    { label: "Session", description: "Server-side state" }
  ],
  multiSelect: false
});
```

This gets translated to:
```bash
./claude-ask-question.sh \
  "Which auth method?" \
  '[{"label":"JWT","description":"Stateless tokens"},{"label":"Session","description":"Server-side state"}]' \
  false
```

## Text Fallback

If inline buttons don't work (client limitations, webhook issues), users can reply with:

### Single-Select
- **Number**: `1` or `2` or `3` (option number)
- **Label**: `JWT` or `OAuth` (exact label match)

### Multi-Select
- **Numbers**: `1,2,3` (comma-separated)
- **Labels**: `JWT,OAuth` (comma-separated)

**Detection**: Server automatically detects text replies matching option indices or labels.

## Timeout Behavior

**Default**: 10 minutes (600 seconds)

**On Timeout**:
- Returns first option (index 0)
- Logs warning to stderr
- Graceful degradation (no script failure)

**Rationale**: Better to proceed with safe default than halt execution.

## Notifications Disabled

If `.notify.enabled` file missing:
- Auto-selects first option (index 0)
- No Telegram message sent
- Immediate return (no waiting)

**Use Case**: Automated testing, CI/CD pipelines.

## Technical Details

### Token Format
- **Single-select**: `Q<timestamp>_<pid>` (e.g., `Q1730444800_12345`)
- **Multi-select**: Same, but pending file contains "multiselect" flag

### Callback Data Format
- **Selection**: `TOKEN::INDEX` (e.g., `Q1730444800::0`)
- **Multi-select done**: `TOKEN::done`

### State Management
- **Pending**: `.pending/<token>` (created before sending)
- **Inbox**: `.inbox/<token>` (created on response)
- **Multi-select state**: In-memory server dict (accumulates selections)

### Webhook Flow

**Single-Select**:
```
1. Script creates .pending/<token>
2. send_question.py sends message with buttons
3. User taps button
4. Telegram sends callback_query to webhook
5. Server writes selection to .inbox/<token>
6. Server removes .pending/<token>
7. Server acknowledges callback (removes loading)
8. await_reply.sh detects .inbox/<token>
9. Script reads selection and returns
```

**Multi-Select**:
```
1-2. Same as single-select
3. User taps button (accumulates in server state)
4. Server acknowledges callback with "Added: <label>"
5. User taps more buttons (repeat step 3-4)
6. User taps "Done" button
7. Server writes accumulated selections to .inbox/<token>
8. Server removes .pending/<token> and clears state
9. await_reply.sh detects .inbox/<token>
10. Script reads selections and returns
```

## Security

- **Chat ID validation**: Only authorized chat can respond
- **Token uniqueness**: Timestamp + PID prevents collisions
- **Callback acknowledgment**: Required by Telegram API to prevent re-sends

## Error Handling

- **Invalid callback format**: Acknowledged with error message
- **No selections in multi-select**: Warning shown, awaits more selections
- **Webhook timeout**: Gracefully returns first option
- **Script timeout**: Returns first option after 10 minutes

## Integration with Claude Code

When Claude Code uses `AskUserQuestion` tool:

1. **Tool invocation** → Calls `claude-ask-question.sh`
2. **Script sends** → Telegram message with inline buttons
3. **User responds** → Taps button or types text
4. **Script returns** → Selected option index(es)
5. **Claude Code receives** → Processes user's choice

**Seamless integration**: No manual intervention required.

## Advantages Over Text Input

1. **Better UX**: Tap button vs typing text
2. **Fewer errors**: No typos, invalid inputs
3. **Visual clarity**: All options visible at once
4. **Mobile-friendly**: Large tap targets
5. **Accessibility**: Text fallback ensures compatibility

## Limitations

- **Telegram-only**: Requires Telegram Bot API setup
- **Webhook dependency**: Requires ngrok/Cloudflare tunnel
- **Network latency**: Slight delay for webhook round-trip
- **Button limit**: Max 100 buttons (Telegram API limit)

## Best Practices

1. **Keep options concise**: Short labels, brief descriptions
2. **Limit choices**: 2-5 options ideal (avoid overwhelming user)
3. **Use multi-select sparingly**: Only when truly needed
4. **Provide defaults**: First option should be sensible default
5. **Test text fallback**: Ensure numbers/labels work if buttons fail

## Troubleshooting

**Buttons not appearing?**
- Check webhook server logs: `journalctl -u telegram-webhook -f`
- Verify BOT_TOKEN and CHAT_ID in `.env`
- Test with `curl` to `/telegram/webhook` endpoint

**Timeout too short?**
- Edit `claude-ask-question.sh`: Change `600` to larger value
- Note: 10 minutes should be ample for most questions

**Multi-select not working?**
- Check pending file contains "multiselect" flag
- Verify server state dict persists between callbacks
- Test "Done" button callback data format

**Text fallback not working?**
- Implement number/label parsing in webhook server
- Add pattern matching for comma-separated values
- Update message handler to detect option indices

## See Also

- [TESTING_QUESTIONS.md](TESTING_QUESTIONS.md) - Testing guide
- [../core/README_CORE.md](../core/README_CORE.md) - Core system overview
- [../server/README_SERVER.md](../server/README_SERVER.md) - Webhook server docs
