# Telegram Bot Command Implementation: Research & Best Practices

**Date**: 2025-11-03
**Status**: Complete
**Purpose**: Architecture and implementation patterns for user-initiated slash commands in Telegram webhook bot

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Command Routing Architecture](#command-routing-architecture)
3. [Security & Rate Limiting](#security--rate-limiting)
4. [Async Command Execution](#async-command-execution)
5. [Error Handling](#error-handling)
6. [UX Best Practices](#ux-best-practices)
7. [Code Examples](#code-examples)
8. [Implementation Roadmap](#implementation-roadmap)

---

## Executive Summary

### Current State
- Flask webhook server on port 8080
- File-based state management (.inbox/, .pending/)
- Chat ID validation for security
- Processes approve/reject/input replies

### Target State
- Add user-initiated slash commands: `/status`, `/deploy`, `/test`, `/monitor`, `/help`
- Maintain existing reply handling
- Implement proper rate limiting and security
- Support long-running commands with progress updates

### Key Recommendations

1. **Architecture**: Command router pattern with decorator-based routing
2. **Security**: Token bucket rate limiting (5 commands/minute per user)
3. **Async**: Background thread execution with message editing for progress
4. **Error Handling**: Structured exceptions with user-friendly messages
5. **UX**: BotFather menu setup with rich help text

---

## Command Routing Architecture

### 1. Recommended Pattern: Decorator-Based Command Router

**Why This Pattern?**
- Clean separation of concerns
- Easy to add new commands
- Maintains backward compatibility with existing reply handling
- Supports middleware for cross-cutting concerns (auth, logging, rate limiting)

**Architecture Diagram:**
```
Webhook Request
    ↓
Flask Route Handler
    ↓
Update Parser (command vs reply)
    ↓         ↓
Command Router    Reply Handler (existing)
    ↓
[Middleware Stack]
 - Authentication
 - Rate Limiting
 - Audit Logging
    ↓
Command Handler
    ↓
Response
```

### 2. Implementation Structure

```
server.py (Flask webhook)
commands/
  __init__.py (command registry)
  base.py (base command class)
  status.py
  deploy.py
  test.py
  monitor.py
  help.py
middleware/
  auth.py
  rate_limit.py
  audit_log.py
utils/
  parser.py (argument parsing)
  response.py (response formatting)
```

### 3. Differentiation: Commands vs Replies

```python
def parse_update(update_data):
    """Determine if update is a command or reply"""
    message = update_data.get('message', {})
    text = message.get('text', '')

    # Check if it's a command
    if text.startswith('/'):
        command_parts = text.split()
        command_name = command_parts[0][1:]  # Remove leading /
        command_args = command_parts[1:]
        return {
            'type': 'command',
            'name': command_name,
            'args': command_args,
            'chat_id': message['chat']['id'],
            'message_id': message['message_id'],
            'user_id': message['from']['id']
        }

    # Check if it's a reply to bot question
    reply_to = message.get('reply_to_message', {})
    if reply_to:
        return {
            'type': 'reply',
            'text': text,
            'reply_to_message_id': reply_to['message_id'],
            'chat_id': message['chat']['id'],
            'user_id': message['from']['id']
        }

    # Neither command nor reply
    return {
        'type': 'unknown',
        'text': text,
        'chat_id': message['chat']['id']
    }
```

### 4. Command Registry Pattern

**Base Command Class:**
```python
# commands/base.py
from abc import ABC, abstractmethod
from typing import List, Optional

class BaseCommand(ABC):
    """Base class for all bot commands"""

    def __init__(self, bot, config):
        self.bot = bot
        self.config = config

    @property
    @abstractmethod
    def name(self) -> str:
        """Command name without leading slash"""
        pass

    @property
    @abstractmethod
    def description(self) -> str:
        """Short description for BotFather menu"""
        pass

    @property
    def aliases(self) -> List[str]:
        """Alternative command names"""
        return []

    @property
    def requires_auth(self) -> bool:
        """Whether command requires authentication"""
        return True

    @property
    def rate_limit(self) -> Optional[int]:
        """Max calls per minute (None = no limit)"""
        return 5

    @abstractmethod
    async def execute(self, chat_id: int, user_id: int, args: List[str],
                     message_id: int) -> str:
        """Execute the command and return response"""
        pass

    def validate_args(self, args: List[str]) -> Optional[str]:
        """Validate arguments, return error message if invalid"""
        return None
```

**Command Registry:**
```python
# commands/__init__.py
from typing import Dict, Optional
from .base import BaseCommand
from .status import StatusCommand
from .deploy import DeployCommand
from .test import TestCommand
from .monitor import MonitorCommand
from .help import HelpCommand

class CommandRegistry:
    """Central registry for all bot commands"""

    def __init__(self, bot, config):
        self.bot = bot
        self.config = config
        self._commands: Dict[str, BaseCommand] = {}
        self._register_commands()

    def _register_commands(self):
        """Register all available commands"""
        commands = [
            StatusCommand(self.bot, self.config),
            DeployCommand(self.bot, self.config),
            TestCommand(self.bot, self.config),
            MonitorCommand(self.bot, self.config),
            HelpCommand(self.bot, self.config)
        ]

        for cmd in commands:
            self._commands[cmd.name] = cmd
            for alias in cmd.aliases:
                self._commands[alias] = cmd

    def get_command(self, name: str) -> Optional[BaseCommand]:
        """Get command by name or alias"""
        return self._commands.get(name)

    def get_all_commands(self) -> List[BaseCommand]:
        """Get all unique commands (excluding aliases)"""
        seen = set()
        commands = []
        for cmd in self._commands.values():
            if cmd.name not in seen:
                seen.add(cmd.name)
                commands.append(cmd)
        return commands
```

### 5. Example Command Implementation

```python
# commands/status.py
from .base import BaseCommand
from typing import List
import asyncio

class StatusCommand(BaseCommand):
    """Get system status and health information"""

    @property
    def name(self) -> str:
        return "status"

    @property
    def description(self) -> str:
        return "Show system status and health"

    @property
    def aliases(self) -> List[str]:
        return ["health", "info"]

    async def execute(self, chat_id: int, user_id: int, args: List[str],
                     message_id: int) -> str:
        """Execute status command"""
        # Send initial "checking..." message
        status_msg = await self.bot.send_message(
            chat_id,
            "🔍 Checking system status..."
        )

        # Gather status information
        status_info = await self._gather_status()

        # Update message with results
        await self.bot.edit_message_text(
            status_info,
            chat_id,
            status_msg['message_id'],
            parse_mode='Markdown'
        )

        return "OK"

    async def _gather_status(self) -> str:
        """Gather system status information"""
        # Example status checks
        status_parts = [
            "📊 *System Status*\n",
            f"✅ Webhook Server: Running",
            f"✅ Database: Connected",
            f"✅ Pending Requests: 3",
            f"✅ Last Update: 2 minutes ago",
            f"\n_Use /monitor for detailed metrics_"
        ]
        return "\n".join(status_parts)
```

---

## Security & Rate Limiting

### 1. Threat Model

**Threats to Mitigate:**
- Command spam/flooding
- Unauthorized access to sensitive commands
- Command injection attacks
- Resource exhaustion (subprocess bombs)
- Audit trail tampering

### 2. Rate Limiting Strategy

**Industry Standard: Token Bucket Algorithm**

**Recommended Limits:**
- **General commands**: 5 per minute per user
- **Resource-intensive commands** (deploy, test): 1 per 5 minutes per user
- **Read-only commands** (status, help): 10 per minute per user
- **Global limit**: 100 commands per minute (all users)

**Why Token Bucket?**
- Allows bursts while enforcing average rate
- Better UX than strict fixed windows
- Standard in production systems (AWS, GitHub, Stripe)

### 3. Rate Limiting Implementation

**Using PyrateLimiter with Redis:**

```python
# middleware/rate_limit.py
from pyrate_limiter import Limiter, Duration, Rate, RedisBucket
from redis import Redis
from functools import wraps
from typing import Callable

class RateLimitError(Exception):
    """Raised when rate limit is exceeded"""
    def __init__(self, retry_after: int):
        self.retry_after = retry_after
        super().__init__(f"Rate limit exceeded. Try again in {retry_after}s")

class RateLimiter:
    """Token bucket rate limiter using Redis"""

    def __init__(self, redis_url: str):
        self.redis = Redis.from_url(redis_url)

        # Define rate limits by tier
        self.limiters = {
            'general': self._create_limiter('general', [
                Rate(5, Duration.MINUTE)
            ]),
            'intensive': self._create_limiter('intensive', [
                Rate(1, Duration.MINUTE * 5),
                Rate(10, Duration.HOUR)
            ]),
            'readonly': self._create_limiter('readonly', [
                Rate(10, Duration.MINUTE)
            ]),
            'global': self._create_limiter('global', [
                Rate(100, Duration.MINUTE)
            ])
        }

    def _create_limiter(self, name: str, rates: List[Rate]) -> Limiter:
        """Create a limiter with Redis backend"""
        bucket = RedisBucket.init(rates, self.redis, f"telegram_bot_{name}")
        return Limiter(bucket)

    def check_limit(self, user_id: int, tier: str = 'general') -> None:
        """
        Check if user is within rate limit

        Raises:
            RateLimitError: If rate limit exceeded
        """
        limiter = self.limiters[tier]
        item_name = f"user_{user_id}"

        # Try to acquire token
        item = limiter.try_acquire(item_name)

        if not item:
            # Get retry-after time
            delay = limiter.get_wait_time(item_name)
            raise RateLimitError(retry_after=int(delay))

        # Also check global limit
        global_limiter = self.limiters['global']
        global_item = global_limiter.try_acquire('all_users')

        if not global_item:
            delay = global_limiter.get_wait_time('all_users')
            raise RateLimitError(retry_after=int(delay))

    def decorator(self, tier: str = 'general'):
        """Decorator for rate limiting commands"""
        def decorator_wrapper(func: Callable):
            @wraps(func)
            async def wrapper(self_cmd, chat_id: int, user_id: int,
                            args: List[str], message_id: int):
                try:
                    # Check rate limit
                    self.check_limit(user_id, tier)
                    # Execute command
                    return await func(self_cmd, chat_id, user_id, args, message_id)
                except RateLimitError as e:
                    # Send rate limit message
                    return f"⏱️ Rate limit exceeded. Try again in {e.retry_after} seconds."
            return wrapper
        return decorator_wrapper

# Usage in command:
# @rate_limiter.decorator('intensive')
# async def execute(self, chat_id, user_id, args, message_id):
#     ...
```

**File-Based Fallback (No Redis):**

```python
# middleware/rate_limit_simple.py
import json
import time
from pathlib import Path
from typing import Dict

class SimpleRateLimiter:
    """File-based rate limiter (fallback when Redis unavailable)"""

    def __init__(self, state_dir: Path):
        self.state_file = state_dir / "rate_limits.json"
        self.limits = {
            'general': (5, 60),      # 5 per minute
            'intensive': (1, 300),   # 1 per 5 minutes
            'readonly': (10, 60)     # 10 per minute
        }

    def _load_state(self) -> Dict:
        """Load rate limit state from file"""
        if self.state_file.exists():
            with open(self.state_file, 'r') as f:
                return json.load(f)
        return {}

    def _save_state(self, state: Dict):
        """Save rate limit state to file"""
        with open(self.state_file, 'w') as f:
            json.dump(state, f)

    def check_limit(self, user_id: int, tier: str = 'general') -> None:
        """Check if user is within rate limit"""
        max_requests, window = self.limits[tier]
        now = time.time()

        state = self._load_state()
        key = f"{user_id}_{tier}"

        # Get request history
        if key not in state:
            state[key] = []

        # Remove old requests outside window
        state[key] = [
            ts for ts in state[key]
            if now - ts < window
        ]

        # Check if limit exceeded
        if len(state[key]) >= max_requests:
            oldest = min(state[key])
            retry_after = int(window - (now - oldest))
            raise RateLimitError(retry_after=retry_after)

        # Add current request
        state[key].append(now)
        self._save_state(state)
```

### 4. Authentication & Authorization

```python
# middleware/auth.py
from typing import Set, Optional
import os

class AuthMiddleware:
    """Authentication and authorization middleware"""

    def __init__(self):
        # Load authorized chat IDs from environment
        self.authorized_chats: Set[int] = self._load_authorized_chats()

        # Load admin user IDs
        self.admin_users: Set[int] = self._load_admin_users()

    def _load_authorized_chats(self) -> Set[int]:
        """Load authorized chat IDs from environment"""
        chat_ids = os.getenv('TELEGRAM_AUTHORIZED_CHATS', '')
        if chat_ids:
            return set(int(cid) for cid in chat_ids.split(','))
        return set()

    def _load_admin_users(self) -> Set[int]:
        """Load admin user IDs from environment"""
        user_ids = os.getenv('TELEGRAM_ADMIN_USERS', '')
        if user_ids:
            return set(int(uid) for uid in user_ids.split(','))
        return set()

    def is_authorized(self, chat_id: int) -> bool:
        """Check if chat is authorized"""
        return chat_id in self.authorized_chats

    def is_admin(self, user_id: int) -> bool:
        """Check if user is admin"""
        return user_id in self.admin_users

    def require_auth(self, chat_id: int) -> Optional[str]:
        """
        Check authorization, return error message if not authorized

        Returns:
            None if authorized, error message otherwise
        """
        if not self.is_authorized(chat_id):
            return "🚫 Unauthorized. This bot is restricted to specific chats."
        return None

    def require_admin(self, user_id: int) -> Optional[str]:
        """
        Check admin status, return error message if not admin

        Returns:
            None if admin, error message otherwise
        """
        if not self.is_admin(user_id):
            return "🚫 This command requires admin privileges."
        return None
```

### 5. Input Validation & Command Injection Prevention

```python
# utils/validation.py
import re
import shlex
from typing import List, Optional

class ValidationError(Exception):
    """Raised when input validation fails"""
    pass

class InputValidator:
    """Validate and sanitize user inputs"""

    # Whitelist of allowed characters in arguments
    SAFE_PATTERN = re.compile(r'^[a-zA-Z0-9_\-./]+$')

    # Maximum argument length
    MAX_ARG_LENGTH = 100

    # Maximum number of arguments
    MAX_ARGS = 10

    @classmethod
    def validate_args(cls, args: List[str]) -> List[str]:
        """
        Validate command arguments

        Raises:
            ValidationError: If validation fails
        """
        if len(args) > cls.MAX_ARGS:
            raise ValidationError(
                f"Too many arguments (max {cls.MAX_ARGS})"
            )

        validated = []
        for arg in args:
            if len(arg) > cls.MAX_ARG_LENGTH:
                raise ValidationError(
                    f"Argument too long (max {cls.MAX_ARG_LENGTH} chars)"
                )

            # For now, allow all args but log suspicious ones
            # In production, consider stricter whitelisting
            validated.append(arg)

        return validated

    @classmethod
    def sanitize_for_shell(cls, arg: str) -> str:
        """
        Sanitize argument for safe shell execution

        Uses shlex.quote to prevent command injection
        """
        return shlex.quote(arg)

    @classmethod
    def is_safe_path(cls, path: str) -> bool:
        """Check if path is safe (no directory traversal)"""
        # Normalize path
        normalized = os.path.normpath(path)

        # Check for directory traversal
        if '..' in normalized:
            return False

        # Check for absolute paths (might want to restrict)
        if os.path.isabs(normalized):
            return False

        return True
```

### 6. Audit Logging

**JSON Format for Structured Logging:**

```python
# middleware/audit_log.py
import json
import logging
from datetime import datetime
from typing import Any, Dict, Optional
from pathlib import Path

class AuditLogger:
    """Structured audit logging for bot commands"""

    def __init__(self, log_file: Path):
        self.log_file = log_file
        self.logger = self._setup_logger()

    def _setup_logger(self) -> logging.Logger:
        """Setup JSON-formatted logger"""
        logger = logging.getLogger('telegram_audit')
        logger.setLevel(logging.INFO)

        # File handler with JSON formatter
        handler = logging.FileHandler(self.log_file)
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)

        return logger

    def log_command(self,
                   command: str,
                   user_id: int,
                   chat_id: int,
                   args: List[str],
                   success: bool,
                   error: Optional[str] = None,
                   metadata: Optional[Dict] = None):
        """Log command execution"""
        entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'event_type': 'command_execution',
            'command': command,
            'user_id': user_id,
            'chat_id': chat_id,
            'args': args,
            'success': success,
            'error': error,
            'metadata': metadata or {}
        }

        self.logger.info(json.dumps(entry))

    def log_rate_limit(self, user_id: int, command: str, tier: str):
        """Log rate limit violation"""
        entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'event_type': 'rate_limit_exceeded',
            'user_id': user_id,
            'command': command,
            'tier': tier
        }

        self.logger.warning(json.dumps(entry))

    def log_auth_failure(self, user_id: int, chat_id: int, reason: str):
        """Log authentication/authorization failure"""
        entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'event_type': 'auth_failure',
            'user_id': user_id,
            'chat_id': chat_id,
            'reason': reason
        }

        self.logger.warning(json.dumps(entry))

class JSONFormatter(logging.Formatter):
    """Formatter for structured JSON logs"""

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON"""
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage()
        }

        # Add exception info if present
        if record.exc_info:
            log_entry['exception'] = self.formatException(record.exc_info)

        return json.dumps(log_entry)
```

**Example Audit Log Entries:**

```json
{
  "timestamp": "2025-11-03T10:30:45.123Z",
  "event_type": "command_execution",
  "command": "deploy",
  "user_id": 123456789,
  "chat_id": 123456789,
  "args": ["staging"],
  "success": true,
  "error": null,
  "metadata": {
    "duration_ms": 3450,
    "deployment_id": "deploy-abc123"
  }
}

{
  "timestamp": "2025-11-03T10:31:00.456Z",
  "event_type": "rate_limit_exceeded",
  "user_id": 123456789,
  "command": "deploy",
  "tier": "intensive"
}

{
  "timestamp": "2025-11-03T10:32:15.789Z",
  "event_type": "auth_failure",
  "user_id": 987654321,
  "chat_id": 987654321,
  "reason": "unauthorized_chat"
}
```

---

## Async Command Execution

### 1. Patterns for Long-Running Commands

**Problem**: Telegram webhook requests have a timeout (typically 60s). Long-running commands need to:
- Respond to webhook quickly (< 5s)
- Execute in background
- Stream progress updates
- Handle timeouts gracefully

**Solution**: Background thread + message editing pattern

### 2. Background Execution with Progress Updates

```python
# commands/deploy.py
from .base import BaseCommand
from typing import List
import asyncio
import subprocess
from concurrent.futures import ThreadPoolExecutor

class DeployCommand(BaseCommand):
    """Deploy application to AWS"""

    def __init__(self, bot, config):
        super().__init__(bot, config)
        self.executor = ThreadPoolExecutor(max_workers=3)

    @property
    def name(self) -> str:
        return "deploy"

    @property
    def description(self) -> str:
        return "Deploy to AWS environment"

    @property
    def rate_limit(self) -> int:
        return 1  # 1 per 5 minutes (handled by 'intensive' tier)

    def validate_args(self, args: List[str]) -> Optional[str]:
        """Validate deployment arguments"""
        if not args:
            return "❌ Usage: /deploy <environment>\nEnvironments: staging, production"

        env = args[0]
        if env not in ['staging', 'production']:
            return f"❌ Invalid environment: {env}\nValid: staging, production"

        return None

    async def execute(self, chat_id: int, user_id: int, args: List[str],
                     message_id: int) -> str:
        """Execute deployment in background"""
        env = args[0]

        # Send initial message
        status_msg = await self.bot.send_message(
            chat_id,
            f"🚀 Starting deployment to *{env}*...",
            parse_mode='Markdown'
        )

        # Run deployment in background thread
        loop = asyncio.get_event_loop()
        loop.create_task(
            self._run_deployment(chat_id, status_msg['message_id'], env)
        )

        return "OK"

    async def _run_deployment(self, chat_id: int, message_id: int, env: str):
        """Run deployment and update status"""
        try:
            # Update: Running tests
            await self._update_status(
                chat_id, message_id,
                f"🚀 Deployment to *{env}*\n\n"
                f"⏳ Running tests..."
            )

            # Run in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                self.executor,
                self._run_subprocess,
                ['npm', 'run', 'test:run']
            )

            # Update: Building
            await self._update_status(
                chat_id, message_id,
                f"🚀 Deployment to *{env}*\n\n"
                f"✅ Tests passed\n"
                f"⏳ Building application..."
            )

            await loop.run_in_executor(
                self.executor,
                self._run_subprocess,
                ['npm', 'run', 'build']
            )

            # Update: Deploying
            await self._update_status(
                chat_id, message_id,
                f"🚀 Deployment to *{env}*\n\n"
                f"✅ Tests passed\n"
                f"✅ Build complete\n"
                f"⏳ Deploying to AWS..."
            )

            result = await loop.run_in_executor(
                self.executor,
                self._run_subprocess,
                ['./scripts/deploy.sh', env]
            )

            # Update: Success
            await self._update_status(
                chat_id, message_id,
                f"🚀 Deployment to *{env}*\n\n"
                f"✅ Tests passed\n"
                f"✅ Build complete\n"
                f"✅ Deployed successfully\n\n"
                f"🔗 URL: https://{env}.example.com"
            )

        except subprocess.CalledProcessError as e:
            # Update: Failed
            await self._update_status(
                chat_id, message_id,
                f"🚀 Deployment to *{env}*\n\n"
                f"❌ Deployment failed\n\n"
                f"Error: `{e.stderr[:200]}`\n\n"
                f"Check logs for details."
            )
        except Exception as e:
            await self._update_status(
                chat_id, message_id,
                f"🚀 Deployment to *{env}*\n\n"
                f"❌ Unexpected error: {str(e)}"
            )

    async def _update_status(self, chat_id: int, message_id: int, text: str):
        """Update status message"""
        try:
            await self.bot.edit_message_text(
                text,
                chat_id,
                message_id,
                parse_mode='Markdown'
            )
            # Small delay to avoid hitting rate limits
            await asyncio.sleep(0.5)
        except Exception as e:
            # Log but don't fail on edit errors
            print(f"Error updating message: {e}")

    def _run_subprocess(self, cmd: List[str]) -> str:
        """Run subprocess and capture output"""
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True,
            timeout=600  # 10 minute timeout
        )
        return result.stdout
```

### 3. Streaming Output Pattern

For commands that produce lots of output (like test results), stream to user:

```python
# utils/subprocess_stream.py
import asyncio
import subprocess
from typing import Callable, AsyncIterator

async def stream_subprocess_output(
    cmd: List[str],
    on_output: Callable[[str], None],
    timeout: int = 600
) -> int:
    """
    Stream subprocess output line by line

    Args:
        cmd: Command to execute
        on_output: Callback for each line of output
        timeout: Timeout in seconds

    Returns:
        Exit code
    """
    # Create subprocess
    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.STDOUT
    )

    # Stream output
    try:
        async for line in _read_stream(process.stdout):
            on_output(line)

        # Wait for completion
        return_code = await asyncio.wait_for(
            process.wait(),
            timeout=timeout
        )

        return return_code

    except asyncio.TimeoutError:
        # Kill process on timeout
        process.kill()
        await process.wait()
        raise TimeoutError(f"Command timed out after {timeout}s")

async def _read_stream(stream) -> AsyncIterator[str]:
    """Async generator to read stream line by line"""
    while True:
        line = await stream.readline()
        if not line:
            break
        yield line.decode().rstrip()

# Usage in command:
async def _run_tests_with_output(self, chat_id: int, message_id: int):
    """Run tests and stream output"""
    output_lines = []

    def on_output(line: str):
        output_lines.append(line)
        # Update message every 10 lines
        if len(output_lines) % 10 == 0:
            asyncio.create_task(
                self._update_status(
                    chat_id,
                    message_id,
                    f"🧪 Running tests...\n\n```\n" +
                    "\n".join(output_lines[-20:]) +  # Last 20 lines
                    "\n```"
                )
            )

    return_code = await stream_subprocess_output(
        ['npm', 'run', 'test:run'],
        on_output,
        timeout=300
    )

    return return_code == 0
```

### 4. Timeout Handling

```python
# utils/timeouts.py
import asyncio
from typing import Awaitable, TypeVar, Optional

T = TypeVar('T')

async def with_timeout(
    coro: Awaitable[T],
    timeout_seconds: int,
    timeout_message: str = "Operation timed out"
) -> T:
    """
    Run coroutine with timeout

    Raises:
        TimeoutError: If timeout exceeded
    """
    try:
        return await asyncio.wait_for(coro, timeout=timeout_seconds)
    except asyncio.TimeoutError:
        raise TimeoutError(timeout_message)

# Usage:
result = await with_timeout(
    long_running_operation(),
    timeout_seconds=300,
    timeout_message="Deployment timed out after 5 minutes"
)
```

### 5. Progress Indicators

**Text-based progress bars:**

```python
# utils/progress.py
def progress_bar(current: int, total: int, width: int = 20) -> str:
    """Generate text progress bar"""
    percent = current / total
    filled = int(width * percent)
    bar = '█' * filled + '░' * (width - filled)
    return f"[{bar}] {percent:.0%}"

# Usage:
await self._update_status(
    chat_id, message_id,
    f"🔄 Processing files...\n\n"
    f"{progress_bar(50, 100)}\n"
    f"50/100 files completed"
)
```

**Emoji-based status:**

```python
EMOJI_STATUS = {
    'pending': '⏳',
    'running': '🔄',
    'success': '✅',
    'failed': '❌',
    'warning': '⚠️'
}

# Example multi-stage progress:
stages = [
    {'name': 'Tests', 'status': 'success'},
    {'name': 'Build', 'status': 'running'},
    {'name': 'Deploy', 'status': 'pending'}
]

status_text = "🚀 Deployment Progress\n\n" + "\n".join(
    f"{EMOJI_STATUS[s['status']]} {s['name']}"
    for s in stages
)
```

---

## Error Handling

### 1. Error Classification

**Error Types:**
- **User Errors**: Invalid input, missing arguments, unauthorized access
- **System Errors**: API failures, subprocess crashes, network issues
- **Rate Limit Errors**: Too many requests
- **Timeout Errors**: Long-running operations exceeded timeout

### 2. User-Friendly Error Messages

**Principles:**
- Be specific about what went wrong
- Suggest how to fix it
- Use emoji for visual clarity
- Keep messages concise
- Provide help command reference when appropriate

```python
# utils/errors.py
from typing import Optional

class BotError(Exception):
    """Base class for bot errors"""

    def __init__(self, message: str, user_message: Optional[str] = None):
        self.message = message  # Technical message for logs
        self.user_message = user_message or message  # User-friendly message
        super().__init__(message)

class CommandNotFoundError(BotError):
    """Command does not exist"""

    def __init__(self, command: str):
        super().__init__(
            f"Command not found: {command}",
            f"❌ Unknown command: `/{command}`\n\n"
            f"Try /help to see available commands."
        )

class InvalidArgumentError(BotError):
    """Invalid command arguments"""

    def __init__(self, message: str, usage: str):
        super().__init__(
            f"Invalid arguments: {message}",
            f"❌ {message}\n\n"
            f"📖 Usage: {usage}"
        )

class UnauthorizedError(BotError):
    """User not authorized"""

    def __init__(self, reason: str = "This bot is restricted"):
        super().__init__(
            f"Unauthorized: {reason}",
            f"🚫 {reason}\n\n"
            f"Contact your administrator for access."
        )

class RateLimitError(BotError):
    """Rate limit exceeded"""

    def __init__(self, retry_after: int):
        super().__init__(
            f"Rate limit exceeded, retry after {retry_after}s",
            f"⏱️ Slow down! You can try again in {retry_after} seconds.\n\n"
            f"Rate limits protect the system from overload."
        )

class CommandTimeoutError(BotError):
    """Command execution timed out"""

    def __init__(self, command: str, timeout: int):
        super().__init__(
            f"Command {command} timed out after {timeout}s",
            f"⏰ Command timed out after {timeout} seconds.\n\n"
            f"The operation may still be running. Check /status for updates."
        )

class SubprocessError(BotError):
    """Subprocess execution failed"""

    def __init__(self, cmd: str, exit_code: int, stderr: str):
        short_stderr = stderr[:200] + ('...' if len(stderr) > 200 else '')
        super().__init__(
            f"Subprocess failed: {cmd} (exit {exit_code})",
            f"❌ Command failed\n\n"
            f"```\n{short_stderr}\n```\n\n"
            f"Check logs for full error details."
        )
```

### 3. Error Handler Middleware

```python
# middleware/error_handler.py
from utils.errors import BotError, CommandNotFoundError
import traceback

class ErrorHandler:
    """Central error handling for bot commands"""

    def __init__(self, bot, audit_logger):
        self.bot = bot
        self.audit_logger = audit_logger

    async def handle_error(self, error: Exception, chat_id: int,
                          user_id: int, command: str = None) -> str:
        """
        Handle error and return user-friendly message

        Returns:
            User-friendly error message
        """
        # Log to audit trail
        self.audit_logger.log_command(
            command=command or 'unknown',
            user_id=user_id,
            chat_id=chat_id,
            args=[],
            success=False,
            error=str(error)
        )

        # Handle known error types
        if isinstance(error, BotError):
            return error.user_message

        # Handle unknown errors
        error_id = self._generate_error_id()

        # Log full traceback
        logging.error(
            f"Unhandled error [{error_id}]: {error}\n"
            f"{traceback.format_exc()}"
        )

        # Send generic message to user
        return (
            f"❌ Something went wrong.\n\n"
            f"Error ID: `{error_id}`\n\n"
            f"Please try again or contact support with this error ID."
        )

    def _generate_error_id(self) -> str:
        """Generate unique error ID for tracking"""
        import uuid
        return str(uuid.uuid4())[:8]
```

### 4. Validation Error Messages

```python
# Example validation with helpful errors
class TestCommand(BaseCommand):
    """Run test suite"""

    def validate_args(self, args: List[str]) -> Optional[str]:
        """Validate test command arguments"""
        if not args:
            return (
                "❌ Missing test target\n\n"
                "📖 Usage: `/test <target>`\n\n"
                "Available targets:\n"
                "• `all` - Run all tests\n"
                "• `client` - Client tests only\n"
                "• `server` - Server tests only\n"
                "• `integration` - Integration tests\n\n"
                "Example: `/test client`"
            )

        target = args[0]
        valid_targets = ['all', 'client', 'server', 'integration']

        if target not in valid_targets:
            return (
                f"❌ Invalid test target: `{target}`\n\n"
                f"Valid targets: {', '.join(valid_targets)}\n\n"
                f"Example: `/test client`"
            )

        return None
```

### 5. Graceful Degradation

```python
# Handle partial failures gracefully
async def _gather_system_info(self):
    """Gather system info with graceful degradation"""
    info = {}

    # Try each check independently
    try:
        info['database'] = await self._check_database()
    except Exception as e:
        info['database'] = f"❌ Error: {e}"

    try:
        info['disk'] = await self._check_disk_space()
    except Exception as e:
        info['disk'] = f"❌ Error: {e}"

    try:
        info['memory'] = await self._check_memory()
    except Exception as e:
        info['memory'] = f"❌ Error: {e}"

    return info
```

---

## UX Best Practices

### 1. BotFather Configuration

**Setting Up Command Menu:**

```bash
# Send to @BotFather
/setcommands

# Then paste this format:
status - Show system status and health
deploy - Deploy to AWS environment
test - Run test suite
monitor - View real-time metrics
help - Show command help and examples
```

**Key Points:**
- Commands WITHOUT leading slash
- Description separated by ` - ` (space-dash-space)
- Keep descriptions under 50 characters
- Order commands by frequency of use
- Start with most common commands

**BotFather Additional Configuration:**

```bash
# Set description (shown in chat list)
/setdescription
P3 Interview Academy DevOps Bot - Deploy, test, and monitor your application with slash commands.

# Set about text (shown in bot profile)
/setabouttext
🤖 P3 Interview Academy DevOps Bot

Automate deployments, run tests, and monitor your infrastructure directly from Telegram.

Commands:
• /status - System health
• /deploy - AWS deployment
• /test - Run tests
• /monitor - Metrics
• /help - Full documentation

Secure, rate-limited, audit-logged.

# Set profile photo
/setuserpic
[Upload image: 512x512px, bot icon or logo]
```

### 2. Help Command Design

**Comprehensive Help:**

```python
# commands/help.py
class HelpCommand(BaseCommand):
    """Show help and command documentation"""

    @property
    def name(self) -> str:
        return "help"

    @property
    def description(self) -> str:
        return "Show command help and examples"

    @property
    def requires_auth(self) -> bool:
        return False  # Help available to all

    @property
    def rate_limit(self) -> int:
        return 10  # Allow frequent help requests

    async def execute(self, chat_id: int, user_id: int, args: List[str],
                     message_id: int) -> str:
        """Show help documentation"""

        # Specific command help
        if args:
            command_name = args[0]
            return await self._show_command_help(command_name)

        # General help
        return self._show_general_help()

    def _show_general_help(self) -> str:
        """Generate general help message"""
        return """
🤖 *P3 Interview Academy DevOps Bot*

*Available Commands:*

📊 *Monitoring*
• `/status` - Show system health and status
• `/monitor` - View real-time metrics and logs

🚀 *Deployment*
• `/deploy <env>` - Deploy to AWS environment
  Example: `/deploy staging`

🧪 *Testing*
• `/test <target>` - Run test suite
  Example: `/test client`

❓ *Help*
• `/help` - Show this message
• `/help <command>` - Get detailed help for a command
  Example: `/help deploy`

*Quick Tips:*
• Commands are rate-limited to prevent overload
• Long-running commands update progress in real-time
• All actions are logged for security

_Type `/help <command>` for detailed information._
        """

    async def _show_command_help(self, command_name: str) -> str:
        """Show help for specific command"""

        help_docs = {
            'status': """
📊 */status* - System Status

*Description:*
Shows current system health, including:
• Webhook server status
• Database connectivity
• Pending requests
• Last update time

*Usage:*
`/status`

*Examples:*
• `/status` - Check system health

*Rate Limit:* 10 per minute
*Auth Required:* Yes
            """,

            'deploy': """
🚀 */deploy* - AWS Deployment

*Description:*
Deploy application to AWS Elastic Beanstalk environment.

The deployment process:
1. ✅ Runs test suite
2. 📦 Builds application
3. ☁️ Deploys to AWS
4. ✅ Runs smoke tests

*Usage:*
`/deploy <environment>`

*Arguments:*
• `environment` - Target environment (staging, production)

*Examples:*
• `/deploy staging` - Deploy to staging
• `/deploy production` - Deploy to production

*Rate Limit:* 1 per 5 minutes
*Auth Required:* Yes (Admin only for production)

*Note:* Production deployments require admin privileges.
            """,

            'test': """
🧪 */test* - Run Tests

*Description:*
Execute test suite and report results.

*Usage:*
`/test <target>`

*Arguments:*
• `target` - Test target to run

*Available Targets:*
• `all` - Run all tests (client + server)
• `client` - Client tests only (React components)
• `server` - Server tests only (API routes)
• `integration` - Integration tests

*Examples:*
• `/test all` - Run complete test suite
• `/test client` - Test frontend only
• `/test server` - Test backend only

*Rate Limit:* 3 per minute
*Auth Required:* Yes

*Note:* Test results stream in real-time.
            """,

            'monitor': """
📈 */monitor* - System Monitoring

*Description:*
View real-time system metrics and recent logs.

Shows:
• CPU and memory usage
• Active requests
• Error rates
• Recent log entries

*Usage:*
`/monitor [duration]`

*Arguments:*
• `duration` - Optional, time window (5m, 1h, 24h)
  Default: 5m

*Examples:*
• `/monitor` - Last 5 minutes
• `/monitor 1h` - Last hour
• `/monitor 24h` - Last 24 hours

*Rate Limit:* 10 per minute
*Auth Required:* Yes
            """
        }

        if command_name not in help_docs:
            return f"❌ No help available for `/{command_name}`\n\nTry `/help` for all commands."

        return help_docs[command_name]
```

### 3. Response Formatting

**Markdown Best Practices:**

```python
# utils/formatting.py

def format_success(message: str) -> str:
    """Format success message"""
    return f"✅ {message}"

def format_error(message: str) -> str:
    """Format error message"""
    return f"❌ {message}"

def format_warning(message: str) -> str:
    """Format warning message"""
    return f"⚠️ {message}"

def format_info(message: str) -> str:
    """Format info message"""
    return f"ℹ️ {message}"

def format_code_block(code: str, language: str = '') -> str:
    """Format code block with syntax highlighting"""
    return f"```{language}\n{code}\n```"

def format_inline_code(text: str) -> str:
    """Format inline code"""
    return f"`{text}`"

def format_bold(text: str) -> str:
    """Format bold text"""
    return f"*{text}*"

def format_list(items: List[str], ordered: bool = False) -> str:
    """Format list"""
    if ordered:
        return "\n".join(f"{i+1}. {item}" for i, item in enumerate(items))
    else:
        return "\n".join(f"• {item}" for item in items)

# Usage example:
message = f"""
{format_success('Deployment completed!')}

{format_bold('Summary:')}
{format_list([
    'Tests: 320 passed',
    'Build: 4.2s',
    'Deploy: 45s'
])}

{format_bold('URL:')} {format_inline_code('https://staging.example.com')}

{format_info('Run /status to verify health checks')}
"""
```

**Emoji Guide:**

```python
# Recommended emojis for consistency
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

    # Resources
    'database': '🗄️',
    'server': '🖥️',
    'network': '🌐',
    'file': '📄',
    'folder': '📁',

    # Security
    'lock': '🔒',
    'unlock': '🔓',
    'key': '🔑',
    'shield': '🛡️',

    # Time
    'clock': '🕐',
    'timer': '⏱️',
    'alarm': '⏰',

    # Misc
    'rocket': '🚀',
    'fire': '🔥',
    'star': '⭐',
    'check': '✓',
    'cross': '✗'
}
```

### 4. Interactive Features

**Inline Keyboards for Confirmations:**

```python
# For dangerous operations, use inline keyboards
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton

async def _request_confirmation(self, chat_id: int, action: str) -> int:
    """Request user confirmation for dangerous action"""
    keyboard = InlineKeyboardMarkup()
    keyboard.row(
        InlineKeyboardButton("✅ Confirm", callback_data=f"confirm_{action}"),
        InlineKeyboardButton("❌ Cancel", callback_data=f"cancel_{action}")
    )

    message = await self.bot.send_message(
        chat_id,
        f"⚠️ *Confirm Production Deployment*\n\n"
        f"This will deploy to production.\n"
        f"Are you sure?",
        reply_markup=keyboard,
        parse_mode='Markdown'
    )

    return message['message_id']

# Handle callback
@bot.callback_query_handler(func=lambda call: True)
async def handle_callback(call):
    if call.data.startswith('confirm_'):
        action = call.data[8:]  # Remove 'confirm_'
        await execute_action(action, call.message.chat.id)
        await bot.answer_callback_query(call.id, "✅ Confirmed")
    elif call.data.startswith('cancel_'):
        await bot.answer_callback_query(call.id, "❌ Cancelled")
        await bot.edit_message_text(
            "❌ Action cancelled",
            call.message.chat.id,
            call.message.message_id
        )
```

**Progressive Disclosure:**

```python
# Start with summary, offer details
async def execute(self, chat_id, user_id, args, message_id):
    """Show status with option for details"""

    summary = await self._get_status_summary()

    keyboard = InlineKeyboardMarkup()
    keyboard.row(
        InlineKeyboardButton("📊 Detailed Metrics",
                           callback_data="status_detailed"),
        InlineKeyboardButton("📝 Recent Logs",
                           callback_data="status_logs")
    )

    await self.bot.send_message(
        chat_id,
        summary,
        reply_markup=keyboard,
        parse_mode='Markdown'
    )
```

---

## Code Examples

### Complete Flask Webhook Integration

```python
# server.py - Main Flask webhook server
import os
import json
import asyncio
from pathlib import Path
from flask import Flask, request, abort
from telebot.async_telebot import AsyncTeleBot
from commands import CommandRegistry
from middleware.auth import AuthMiddleware
from middleware.rate_limit import RateLimiter
from middleware.audit_log import AuditLogger
from middleware.error_handler import ErrorHandler
from utils.parser import parse_update

# Configuration
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
WEBHOOK_URL = os.getenv('TELEGRAM_WEBHOOK_URL')
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')
STATE_DIR = Path('/tmp/telegram-bot')
STATE_DIR.mkdir(exist_ok=True)

# Initialize Flask
app = Flask(__name__)

# Initialize Telegram bot
bot = AsyncTeleBot(TELEGRAM_BOT_TOKEN)

# Initialize middleware
auth = AuthMiddleware()
rate_limiter = RateLimiter(REDIS_URL)
audit_logger = AuditLogger(STATE_DIR / 'audit.log')
error_handler = ErrorHandler(bot, audit_logger)

# Initialize command registry
commands = CommandRegistry(bot, {
    'state_dir': STATE_DIR,
    'auth': auth,
    'rate_limiter': rate_limiter,
    'audit_logger': audit_logger
})

@app.route('/', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return 'OK', 200

@app.route('/webhook', methods=['POST'])
def webhook():
    """Handle Telegram webhook updates"""
    if request.headers.get('content-type') != 'application/json':
        abort(403)

    # Parse update
    update_json = request.get_data().decode('utf-8')
    update_data = json.loads(update_json)

    # Process asynchronously
    asyncio.create_task(process_update(update_data))

    return 'OK', 200

async def process_update(update_data: dict):
    """Process incoming update (command or reply)"""
    try:
        # Parse update
        parsed = parse_update(update_data)

        if parsed['type'] == 'command':
            await handle_command(parsed)
        elif parsed['type'] == 'reply':
            await handle_reply(parsed)
        else:
            # Unknown message type, ignore
            pass

    except Exception as e:
        # Log error but don't crash
        print(f"Error processing update: {e}")

async def handle_command(parsed: dict):
    """Handle command execution"""
    command_name = parsed['name']
    args = parsed['args']
    chat_id = parsed['chat_id']
    user_id = parsed['user_id']
    message_id = parsed['message_id']

    try:
        # Check authentication
        auth_error = auth.require_auth(chat_id)
        if auth_error:
            await bot.send_message(chat_id, auth_error)
            audit_logger.log_auth_failure(user_id, chat_id, "unauthorized_chat")
            return

        # Get command
        command = commands.get_command(command_name)
        if not command:
            await bot.send_message(
                chat_id,
                f"❌ Unknown command: `/{command_name}`\n\n"
                f"Try /help for available commands.",
                parse_mode='Markdown'
            )
            return

        # Check admin requirement
        if command.requires_admin and not auth.is_admin(user_id):
            auth_error = auth.require_admin(user_id)
            await bot.send_message(chat_id, auth_error)
            audit_logger.log_auth_failure(user_id, chat_id, "not_admin")
            return

        # Check rate limit
        tier = 'intensive' if command.rate_limit == 1 else 'general'
        try:
            rate_limiter.check_limit(user_id, tier)
        except RateLimitError as e:
            await bot.send_message(chat_id, e.user_message)
            audit_logger.log_rate_limit(user_id, command_name, tier)
            return

        # Validate arguments
        validation_error = command.validate_args(args)
        if validation_error:
            await bot.send_message(chat_id, validation_error, parse_mode='Markdown')
            return

        # Execute command
        result = await command.execute(chat_id, user_id, args, message_id)

        # Log success
        audit_logger.log_command(
            command=command_name,
            user_id=user_id,
            chat_id=chat_id,
            args=args,
            success=True
        )

    except Exception as e:
        # Handle error
        error_msg = await error_handler.handle_error(e, chat_id, user_id, command_name)
        await bot.send_message(chat_id, error_msg, parse_mode='Markdown')

async def handle_reply(parsed: dict):
    """Handle reply to bot question (existing functionality)"""
    # Your existing reply handling code
    from existing_reply_handler import process_reply
    await process_reply(parsed)

# Setup webhook
def setup_webhook():
    """Configure Telegram webhook"""
    import requests
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/setWebhook"
    data = {'url': WEBHOOK_URL + '/webhook'}
    response = requests.post(url, data=data)
    print(f"Webhook setup: {response.json()}")

if __name__ == '__main__':
    # Setup webhook on startup
    setup_webhook()

    # Run Flask server
    app.run(host='0.0.0.0', port=8080)
```

### Example Commands Implementation

```python
# commands/status.py
from .base import BaseCommand
from typing import List
import subprocess

class StatusCommand(BaseCommand):

    @property
    def name(self) -> str:
        return "status"

    @property
    def description(self) -> str:
        return "Show system status and health"

    @property
    def aliases(self) -> List[str]:
        return ["health"]

    async def execute(self, chat_id, user_id, args, message_id):
        # Send checking message
        msg = await self.bot.send_message(chat_id, "🔍 Checking status...")

        # Gather status
        status = []
        status.append("📊 *System Status*\n")

        # Check webhook
        status.append("✅ Webhook: Running")

        # Check database
        try:
            result = subprocess.run(
                ['psql', os.getenv('DATABASE_URL'), '-c', 'SELECT 1'],
                capture_output=True,
                timeout=5
            )
            db_status = "✅ Database: Connected" if result.returncode == 0 else "❌ Database: Error"
        except Exception:
            db_status = "❌ Database: Timeout"
        status.append(db_status)

        # Check pending requests
        inbox_files = list(self.config['state_dir'].glob('.inbox/*.json'))
        status.append(f"📬 Pending Requests: {len(inbox_files)}")

        # Update message
        await self.bot.edit_message_text(
            "\n".join(status),
            chat_id,
            msg.message_id,
            parse_mode='Markdown'
        )

        return "OK"
```

```python
# commands/test.py
from .base import BaseCommand
from typing import List
from utils.subprocess_stream import stream_subprocess_output

class TestCommand(BaseCommand):

    @property
    def name(self) -> str:
        return "test"

    @property
    def description(self) -> str:
        return "Run test suite"

    def validate_args(self, args: List[str]) -> Optional[str]:
        if not args:
            return (
                "❌ Missing test target\n\n"
                "Usage: `/test <target>`\n"
                "Targets: all, client, server, integration"
            )

        if args[0] not in ['all', 'client', 'server', 'integration']:
            return f"❌ Invalid target: {args[0]}\nValid: all, client, server, integration"

        return None

    async def execute(self, chat_id, user_id, args, message_id):
        target = args[0]

        # Map target to npm script
        scripts = {
            'all': 'test:run',
            'client': 'test:client',
            'server': 'test:server',
            'integration': 'test:integration'
        }

        # Send initial message
        msg = await self.bot.send_message(
            chat_id,
            f"🧪 Running {target} tests..."
        )

        # Run tests in background
        asyncio.create_task(
            self._run_tests(chat_id, msg.message_id, scripts[target], target)
        )

        return "OK"

    async def _run_tests(self, chat_id, message_id, script, target):
        output_lines = []

        def on_output(line):
            output_lines.append(line)

        try:
            return_code = await stream_subprocess_output(
                ['npm', 'run', script],
                on_output,
                timeout=300
            )

            # Parse test results
            summary = self._parse_test_output(output_lines)

            if return_code == 0:
                await self.bot.edit_message_text(
                    f"🧪 *{target.title()} Tests*\n\n"
                    f"✅ All tests passed\n\n"
                    f"{summary}",
                    chat_id,
                    message_id,
                    parse_mode='Markdown'
                )
            else:
                await self.bot.edit_message_text(
                    f"🧪 *{target.title()} Tests*\n\n"
                    f"❌ Some tests failed\n\n"
                    f"{summary}\n\n"
                    f"Check logs for details.",
                    chat_id,
                    message_id,
                    parse_mode='Markdown'
                )

        except TimeoutError:
            await self.bot.edit_message_text(
                f"🧪 *{target.title()} Tests*\n\n"
                f"⏰ Timed out after 5 minutes",
                chat_id,
                message_id,
                parse_mode='Markdown'
            )

    def _parse_test_output(self, lines: List[str]) -> str:
        """Extract test summary from output"""
        # Simple parser - adjust for your test runner
        for line in reversed(lines):
            if 'tests passed' in line.lower() or 'test suites' in line.lower():
                return line
        return "No summary available"
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)

**Goals:**
- Basic command routing
- Security middleware
- Error handling

**Tasks:**
1. Create project structure (commands/, middleware/, utils/)
2. Implement base command class
3. Implement command registry
4. Add update parser (command vs reply differentiation)
5. Integrate with existing Flask webhook
6. Add authentication middleware
7. Add basic error handling
8. Implement audit logging

**Deliverables:**
- Working command router
- /help and /status commands
- Audit log file

### Phase 2: Rate Limiting (Week 1-2)

**Goals:**
- Prevent abuse
- Production-grade security

**Tasks:**
1. Set up Redis (or file-based fallback)
2. Implement rate limiter with PyrateLimiter
3. Configure rate limit tiers
4. Add rate limit middleware to command execution
5. Test rate limiting with load testing

**Deliverables:**
- Rate limiting active on all commands
- Rate limit error messages
- Audit logging of rate limit violations

### Phase 3: Async Commands (Week 2)

**Goals:**
- Long-running commands
- Progress updates

**Tasks:**
1. Implement background execution pattern
2. Add message editing for progress updates
3. Implement /deploy command with progress
4. Implement /test command with streaming output
5. Add timeout handling
6. Test with actual deployments

**Deliverables:**
- /deploy command with real-time progress
- /test command with streamed results
- Proper timeout handling

### Phase 4: Advanced Commands (Week 3)

**Goals:**
- Complete command set
- Production readiness

**Tasks:**
1. Implement /monitor command (metrics)
2. Add inline keyboard confirmations for dangerous ops
3. Enhance /help with detailed documentation
4. Add command aliases
5. Implement admin-only commands
6. Add BotFather configuration

**Deliverables:**
- Complete command set
- BotFather menu configured
- Admin authorization working

### Phase 5: Testing & Documentation (Week 3-4)

**Goals:**
- Production-ready
- Documented

**Tasks:**
1. Write unit tests for commands
2. Write integration tests for webhook
3. Load test rate limiting
4. Security audit (command injection, auth bypass)
5. Write operator documentation
6. Create runbook for incidents

**Deliverables:**
- Test coverage >80%
- Security audit passed
- Complete documentation

### Phase 6: Deployment (Week 4)

**Goals:**
- Live in production

**Tasks:**
1. Deploy to production environment
2. Configure webhook URL
3. Set up monitoring/alerting
4. Train team on usage
5. Monitor for issues

**Deliverables:**
- Bot live in production
- Team trained
- Monitoring active

---

## Appendix A: Security Checklist

### Pre-Deployment Security Review

- [ ] **Authentication**
  - [ ] Chat ID validation enabled
  - [ ] Admin user list configured
  - [ ] Unauthorized access returns error

- [ ] **Rate Limiting**
  - [ ] Rate limits configured per tier
  - [ ] Redis or file-based limiter working
  - [ ] Global rate limit prevents system overload
  - [ ] Rate limit errors logged

- [ ] **Input Validation**
  - [ ] Command arguments validated
  - [ ] Shell arguments escaped (shlex.quote)
  - [ ] Path traversal prevented
  - [ ] Maximum argument length enforced

- [ ] **Audit Logging**
  - [ ] All commands logged
  - [ ] Auth failures logged
  - [ ] Rate limit violations logged
  - [ ] Logs in JSON format
  - [ ] Log file rotation configured

- [ ] **Command Execution**
  - [ ] Subprocess timeouts configured
  - [ ] Output length limited
  - [ ] Environment variables sanitized
  - [ ] Working directory restricted

- [ ] **Error Handling**
  - [ ] Sensitive info not leaked in errors
  - [ ] Stack traces not sent to users
  - [ ] Error IDs for tracking
  - [ ] All errors caught and logged

- [ ] **Network Security**
  - [ ] Webhook uses HTTPS
  - [ ] SSL certificate valid
  - [ ] Webhook URL secret (not guessable)
  - [ ] No sensitive data in URLs

---

## Appendix B: Troubleshooting Guide

### Common Issues

**1. Commands Not Working**

Symptoms:
- Bot doesn't respond to /command
- "Unknown command" error

Diagnosis:
```bash
# Check if webhook is receiving updates
tail -f /var/log/telegram-bot/webhook.log

# Check if command is registered
python -c "from commands import CommandRegistry; print(CommandRegistry.get_all_commands())"

# Check authentication
grep "auth_failure" /tmp/telegram-bot/audit.log
```

**2. Rate Limiting Too Aggressive**

Symptoms:
- Users getting rate limited frequently
- "Try again in N seconds" messages

Solution:
```python
# Adjust rate limits in rate_limit.py
self.limits = {
    'general': (10, 60),  # Increase from 5 to 10
    'intensive': (2, 300), # Increase from 1 to 2
}
```

**3. Commands Timing Out**

Symptoms:
- "Command timed out" errors
- Long-running commands failing

Solution:
```python
# Increase timeout in command
async def execute(...):
    result = await with_timeout(
        long_operation(),
        timeout_seconds=600,  # Increase from 300 to 600
    )
```

**4. Memory/Process Leaks**

Symptoms:
- Server memory increasing
- Many zombie processes

Diagnosis:
```bash
# Check for zombie processes
ps aux | grep defunct

# Check memory usage
ps aux | grep python | awk '{print $6}'

# Check thread count
pstree -p `pidof python`
```

Solution:
```python
# Ensure ThreadPoolExecutor has max_workers limit
self.executor = ThreadPoolExecutor(max_workers=3)

# Clean up in command
async def cleanup(self):
    self.executor.shutdown(wait=True)
```

---

## Appendix C: BotFather Setup Script

```bash
#!/bin/bash
# setup-botfather.sh - Configure bot via BotFather

BOT_USERNAME="@your_bot"
COMMANDS_FILE="botfather-commands.txt"

# Generate commands file
cat > $COMMANDS_FILE <<EOF
status - Show system status and health
deploy - Deploy to AWS environment
test - Run test suite
monitor - View real-time metrics
help - Show command help and examples
EOF

echo "📋 Commands file created: $COMMANDS_FILE"
echo ""
echo "🤖 BotFather Setup Instructions:"
echo ""
echo "1. Open Telegram and message @BotFather"
echo "2. Send: /setcommands"
echo "3. Select: $BOT_USERNAME"
echo "4. Paste the following:"
echo ""
cat $COMMANDS_FILE
echo ""
echo "5. Send: /setdescription"
echo "6. Select: $BOT_USERNAME"
echo "7. Paste:"
echo ""
cat <<EOF
P3 Interview Academy DevOps Bot - Deploy, test, and monitor your application with slash commands.
EOF
echo ""
echo "✅ Done! Your bot menu is now configured."
```

---

## Conclusion

This research document provides a comprehensive foundation for implementing user-initiated slash commands in your Telegram webhook bot. The recommended architecture balances:

- **Security**: Multi-layered (auth, rate limiting, input validation)
- **UX**: User-friendly errors, rich formatting, progressive disclosure
- **Performance**: Async execution, background processing, streaming output
- **Maintainability**: Modular design, clear abstractions, comprehensive logging

**Next Steps:**
1. Review architecture with team
2. Begin Phase 1 implementation (foundation)
3. Set up development environment (Redis, testing bot)
4. Implement /status and /help commands as proof-of-concept
5. Iterate based on feedback

**Key Success Metrics:**
- Command execution time < 5s for simple commands
- Rate limit violations < 1% of requests
- Zero security incidents
- 90%+ uptime
- Positive user feedback on UX

Good luck with the implementation!
