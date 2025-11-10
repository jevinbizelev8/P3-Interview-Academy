# Telegram Bot Commands - Quick Reference Card

**Purpose**: Fast lookup for common patterns during implementation

---

## Command Template

```python
# commands/your_command.py
from .base import BaseCommand
from typing import List, Optional

class YourCommand(BaseCommand):
    @property
    def name(self) -> str:
        return "commandname"

    @property
    def description(self) -> str:
        return "Short description for BotFather"

    @property
    def aliases(self) -> List[str]:
        return ["alias1", "alias2"]

    @property
    def rate_limit(self) -> int:
        return 5  # per minute

    def validate_args(self, args: List[str]) -> Optional[str]:
        """Return error message if invalid, None if valid"""
        if not args:
            return "❌ Usage: /commandname <arg>"
        return None

    async def execute(self, chat_id: int, user_id: int,
                     args: List[str], message_id: int) -> str:
        """Execute command logic"""
        # Your code here
        await self.bot.send_message(chat_id, "✅ Done!")
        return "OK"
```

---

## Common Patterns

### 1. Send Message

```python
# Simple message
await self.bot.send_message(chat_id, "Hello!")

# With Markdown
await self.bot.send_message(
    chat_id,
    "*Bold* _italic_ `code` [link](url)",
    parse_mode='Markdown'
)

# With code block
await self.bot.send_message(
    chat_id,
    f"```python\nprint('Hello')\n```",
    parse_mode='Markdown'
)
```

### 2. Edit Message (Progress Updates)

```python
# Send initial message
msg = await self.bot.send_message(chat_id, "⏳ Starting...")

# Edit to show progress
await self.bot.edit_message_text(
    "🔄 50% complete...",
    chat_id,
    msg.message_id
)

# Final update
await self.bot.edit_message_text(
    "✅ Complete!",
    chat_id,
    msg.message_id
)
```

### 3. Background Long-Running Task

```python
async def execute(self, chat_id, user_id, args, message_id):
    # Send immediate response
    msg = await self.bot.send_message(chat_id, "⏳ Starting...")

    # Run in background
    asyncio.create_task(
        self._run_task(chat_id, msg.message_id, args)
    )

    return "OK"

async def _run_task(self, chat_id, message_id, args):
    """Background task with progress updates"""
    try:
        await self._update("⏳ Step 1...", chat_id, message_id)
        await self._do_step_1()

        await self._update("⏳ Step 2...", chat_id, message_id)
        await self._do_step_2()

        await self._update("✅ Complete!", chat_id, message_id)

    except Exception as e:
        await self._update(f"❌ Error: {e}", chat_id, message_id)

async def _update(self, text, chat_id, message_id):
    await self.bot.edit_message_text(text, chat_id, message_id)
    await asyncio.sleep(0.5)  # Avoid rate limits
```

### 4. Run Subprocess

```python
import subprocess

# Simple execution
result = subprocess.run(
    ['npm', 'run', 'build'],
    capture_output=True,
    text=True,
    timeout=300,
    check=True  # Raises on non-zero exit
)

# With error handling
try:
    result = subprocess.run(
        ['npm', 'test'],
        capture_output=True,
        text=True,
        timeout=300,
        check=True
    )
    output = result.stdout
except subprocess.CalledProcessError as e:
    error = e.stderr
    exit_code = e.returncode
except subprocess.TimeoutExpired:
    error = "Command timed out"
```

### 5. Async Subprocess (Streaming)

```python
import asyncio

async def run_with_output(cmd: List[str], chat_id, message_id):
    """Run subprocess and stream output to user"""
    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.STDOUT
    )

    output_lines = []
    while True:
        line = await process.stdout.readline()
        if not line:
            break

        output_lines.append(line.decode().rstrip())

        # Update every 10 lines
        if len(output_lines) % 10 == 0:
            await self.bot.edit_message_text(
                f"Running...\n```\n{chr(10).join(output_lines[-20:])}\n```",
                chat_id,
                message_id,
                parse_mode='Markdown'
            )

    await process.wait()
    return process.returncode
```

### 6. Inline Keyboard (Confirmation)

```python
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton

# Create keyboard
keyboard = InlineKeyboardMarkup()
keyboard.row(
    InlineKeyboardButton("✅ Confirm", callback_data="confirm_action"),
    InlineKeyboardButton("❌ Cancel", callback_data="cancel_action")
)

# Send with keyboard
await self.bot.send_message(
    chat_id,
    "⚠️ Are you sure?",
    reply_markup=keyboard
)

# Handle callback (in server.py)
@bot.callback_query_handler(func=lambda call: True)
async def handle_callback(call):
    if call.data == "confirm_action":
        await execute_action()
        await bot.answer_callback_query(call.id, "✅ Confirmed")
    elif call.data == "cancel_action":
        await bot.answer_callback_query(call.id, "❌ Cancelled")
```

### 7. Rate Limiting Check

```python
from middleware.rate_limit import RateLimitError

async def execute(self, chat_id, user_id, args, message_id):
    # Rate limit is automatically checked by middleware
    # But you can also check manually:

    try:
        rate_limiter.check_limit(user_id, 'intensive')
    except RateLimitError as e:
        await self.bot.send_message(
            chat_id,
            f"⏱️ Rate limited. Try again in {e.retry_after}s"
        )
        return "RATE_LIMITED"

    # Continue with command...
```

### 8. Admin-Only Command

```python
@property
def requires_admin(self) -> bool:
    return True  # Only admins can use this

async def execute(self, chat_id, user_id, args, message_id):
    # Admin check is automatic, but you can check manually:
    if not self.config['auth'].is_admin(user_id):
        await self.bot.send_message(
            chat_id,
            "🚫 Admin only"
        )
        return "UNAUTHORIZED"

    # Continue with admin action...
```

### 9. Thread Pool Execution

```python
from concurrent.futures import ThreadPoolExecutor
import asyncio

class YourCommand(BaseCommand):
    def __init__(self, bot, config):
        super().__init__(bot, config)
        self.executor = ThreadPoolExecutor(max_workers=3)

    async def execute(self, chat_id, user_id, args, message_id):
        # Run blocking code in thread pool
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            self.executor,
            self._blocking_function,
            args[0]
        )

        await self.bot.send_message(chat_id, f"Result: {result}")
        return "OK"

    def _blocking_function(self, arg):
        """Blocking operation (runs in thread)"""
        import time
        time.sleep(5)  # Blocking sleep
        return f"Processed {arg}"
```

---

## Emoji Reference

```python
EMOJI = {
    # Status
    'success': '✅',
    'error': '❌',
    'warning': '⚠️',
    'info': 'ℹ️',
    'pending': '⏳',
    'running': '🔄',

    # Actions
    'deploy': '🚀',
    'test': '🧪',
    'build': '📦',
    'monitor': '📊',
    'help': '❓',
    'search': '🔍',

    # Resources
    'database': '🗄️',
    'server': '🖥️',
    'network': '🌐',
    'file': '📄',
    'folder': '📁',

    # Security
    'lock': '🔒',
    'key': '🔑',
    'shield': '🛡️',

    # Time
    'clock': '🕐',
    'timer': '⏱️',
    'alarm': '⏰',
}
```

---

## Markdown Formatting

```python
# Bold
f"*{text}*"

# Italic
f"_{text}_"

# Code inline
f"`{code}`"

# Code block
f"```\n{code}\n```"

# Code block with syntax
f"```python\n{code}\n```"

# Link
f"[{text}]({url})"

# Combine
message = f"""
*Title*

Some text with `code` and *bold*.

```python
def hello():
    print("world")
```

[Link](https://example.com)
"""
```

---

## Error Messages

```python
# Command not found
f"❌ Unknown command: `/{command}`\n\nTry /help for available commands."

# Invalid arguments
f"❌ {error}\n\n📖 Usage: {usage}\n\nExample: {example}"

# Rate limited
f"⏱️ Slow down! Try again in {seconds} seconds."

# Timeout
f"⏰ Command timed out after {timeout}s\n\nOperation may still be running."

# Unauthorized
f"🚫 Unauthorized. This bot is restricted."

# Admin required
f"🚫 Admin privileges required for this command."

# System error
f"❌ Something went wrong.\n\nError ID: `{error_id}`\n\nContact support."
```

---

## Validation Patterns

```python
def validate_args(self, args: List[str]) -> Optional[str]:
    # Check presence
    if not args:
        return "❌ Missing required argument\n\nUsage: /cmd <arg>"

    # Check count
    if len(args) < 2:
        return "❌ Not enough arguments\n\nUsage: /cmd <arg1> <arg2>"

    # Check value
    if args[0] not in ['option1', 'option2']:
        return f"❌ Invalid option: {args[0]}\n\nValid: option1, option2"

    # Check format (regex)
    import re
    if not re.match(r'^[a-zA-Z0-9_-]+$', args[0]):
        return "❌ Invalid format. Use alphanumeric, dash, underscore only."

    # Check numeric
    try:
        value = int(args[0])
        if value < 1 or value > 100:
            return "❌ Value must be between 1 and 100"
    except ValueError:
        return "❌ Argument must be a number"

    # All valid
    return None
```

---

## Progress Bar

```python
def progress_bar(current: int, total: int, width: int = 20) -> str:
    """Generate ASCII progress bar"""
    percent = current / total
    filled = int(width * percent)
    bar = '█' * filled + '░' * (width - filled)
    return f"[{bar}] {percent:.0%}"

# Usage
await self.bot.send_message(
    chat_id,
    f"Processing...\n{progress_bar(50, 100)}\n50/100 files"
)
```

---

## Multi-Stage Status

```python
stages = [
    {'name': 'Tests', 'status': 'success'},
    {'name': 'Build', 'status': 'running'},
    {'name': 'Deploy', 'status': 'pending'}
]

status_emoji = {
    'pending': '⏳',
    'running': '🔄',
    'success': '✅',
    'failed': '❌'
}

message = "🚀 *Deployment*\n\n" + "\n".join(
    f"{status_emoji[s['status']]} {s['name']}"
    for s in stages
)
```

---

## Audit Logging

```python
# Log command execution
audit_logger.log_command(
    command="deploy",
    user_id=user_id,
    chat_id=chat_id,
    args=args,
    success=True,
    metadata={'duration_ms': 3450, 'environment': 'staging'}
)

# Log rate limit
audit_logger.log_rate_limit(user_id, "deploy", "intensive")

# Log auth failure
audit_logger.log_auth_failure(user_id, chat_id, "not_admin")
```

---

## Testing

```python
# Test command execution
import pytest

@pytest.mark.asyncio
async def test_status_command():
    bot = MockBot()
    config = {'state_dir': Path('/tmp')}
    cmd = StatusCommand(bot, config)

    result = await cmd.execute(
        chat_id=123,
        user_id=456,
        args=[],
        message_id=789
    )

    assert result == "OK"
    assert bot.last_message.startswith("✅")

# Test validation
def test_validate_args():
    cmd = DeployCommand(bot, config)

    # Valid
    assert cmd.validate_args(['staging']) is None

    # Invalid
    error = cmd.validate_args([])
    assert error is not None
    assert "Usage" in error
```

---

## Common Issues

### 1. Message Too Long

```python
# Telegram messages limited to 4096 characters
MAX_LENGTH = 4096

if len(message) > MAX_LENGTH:
    # Split into multiple messages
    for i in range(0, len(message), MAX_LENGTH):
        chunk = message[i:i+MAX_LENGTH]
        await self.bot.send_message(chat_id, chunk)
```

### 2. Rate Limit (Telegram API)

```python
# Telegram limits to ~30 messages/second
import asyncio

await self.bot.send_message(chat_id, "Message 1")
await asyncio.sleep(0.1)  # Small delay
await self.bot.send_message(chat_id, "Message 2")
```

### 3. Edit Message Not Found

```python
try:
    await self.bot.edit_message_text(text, chat_id, message_id)
except Exception as e:
    # Message may have been deleted, send new one
    await self.bot.send_message(chat_id, text)
```

---

## Environment Variables

```bash
# Required
export TELEGRAM_BOT_TOKEN="your_bot_token"
export TELEGRAM_WEBHOOK_URL="https://your-domain.com"

# Security
export TELEGRAM_AUTHORIZED_CHATS="123456789,987654321"
export TELEGRAM_ADMIN_USERS="123456789"

# Optional
export REDIS_URL="redis://localhost:6379"
export DATABASE_URL="postgresql://..."
export LOG_LEVEL="INFO"
```

---

## BotFather Commands

```
# Set commands menu
/setcommands

# Paste this:
status - Show system status and health
deploy - Deploy to AWS environment
test - Run test suite
monitor - View real-time metrics
help - Show command help and examples

# Set description
/setdescription

# Paste:
DevOps automation bot for P3 Interview Academy

# Set about
/setabouttext

# Paste:
Deploy, test, and monitor your application via Telegram commands.
```

---

## Quick Debugging

```bash
# Check webhook is set
curl https://api.telegram.org/bot$TOKEN/getWebhookInfo

# Test webhook locally (ngrok)
ngrok http 8080
# Set webhook to ngrok URL

# View audit logs
tail -f /tmp/telegram-bot/audit.log | jq .

# Monitor Redis rate limits
redis-cli
> KEYS telegram_bot_*
> GET telegram_bot_general:user_123456789
```

---

**For complete implementation details, see:**
- [Full documentation](./telegram-bot-command-implementation.md)
- [Executive summary](./telegram-bot-command-summary.md)
