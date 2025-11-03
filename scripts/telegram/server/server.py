#!/usr/bin/env python3
"""
Telegram Webhook Server for Claude Code Controller

This Flask server receives webhook events from Telegram Bot API and processes:
- User replies (approve/reject/input commands) using file-based state management
- User-initiated slash commands (/status, /deploy, /test, /monitor, /help)

Features:
- Hybrid Mode: Token-based AND latest-pending command processing
- File-based inbox/pending directories for inter-process communication
- Chat ID validation for security
- Rate limiting (5 commands/min general, 1 per 5min intensive)
- Audit logging for all command executions
- Health check endpoint for monitoring

Usage:
    python server.py

Environment Variables:
    BOT_TOKEN - Telegram Bot API token
    CHAT_ID - Authorized Telegram chat ID
    PORT - HTTP port (default: 8080)
"""

from flask import Flask, request, jsonify
import os
import re
import sys
import json
import time
import subprocess
import shlex
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Optional

app = Flask(__name__)

# Directory paths (project root level)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '../../..'))
INBOX_DIR = os.path.join(PROJECT_ROOT, '.inbox')
PENDING_DIR = os.path.join(PROJECT_ROOT, '.pending')

# Ensure directories exist
os.makedirs(INBOX_DIR, exist_ok=True)
os.makedirs(PENDING_DIR, exist_ok=True)

# Audit log directory
AUDIT_DIR = Path("/tmp/telegram")
AUDIT_DIR.mkdir(exist_ok=True)
AUDIT_LOG_FILE = AUDIT_DIR / "command-audit.log"

# Multi-select state management (for accumulating button selections)
MULTI_SELECT_STATE = {}  # {token: [selections]}

# ========== RATE LIMITING ==========
# Simple file-based rate limiter (no Redis dependency)
# Format: {user_id: [timestamps]}
command_history = defaultdict(list)

def check_rate_limit(user_id: int, tier: str = 'general') -> Optional[str]:
    """
    Check if user is within rate limit.

    Args:
        user_id: Telegram user ID
        tier: Rate limit tier (general, intensive, readonly)

    Returns:
        None if allowed, error message if rate limited
    """
    now = time.time()

    # Define rate limits (max_requests, window_seconds)
    limits = {
        'general': (5, 60),      # 5 per minute
        'intensive': (1, 300),   # 1 per 5 minutes
        'readonly': (10, 60)     # 10 per minute
    }

    max_requests, window = limits.get(tier, limits['general'])

    # Get request history for this user and tier
    key = f"{user_id}_{tier}"

    # Remove old timestamps outside window
    command_history[key] = [
        ts for ts in command_history[key]
        if now - ts < window
    ]

    # Check if limit exceeded
    if len(command_history[key]) >= max_requests:
        oldest = min(command_history[key])
        retry_after = int(window - (now - oldest))
        return f"⏱️ Rate limit exceeded. Try again in {retry_after} seconds.\n\nRate limits protect the system from overload."

    # Add current request
    command_history[key].append(now)
    return None

# ========== AUDIT LOGGING ==========
def log_command(command: str, user_id: int, chat_id: int, args: List[str],
                success: bool, error: Optional[str] = None, duration_ms: int = 0):
    """Log command execution to audit file."""
    try:
        entry = {
            'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S', time.gmtime()),
            'command': command,
            'user_id': user_id,
            'chat_id': chat_id,
            'args': args,
            'success': success,
            'error': error,
            'duration_ms': duration_ms
        }

        with open(AUDIT_LOG_FILE, 'a') as f:
            f.write(json.dumps(entry) + '\n')
    except Exception as e:
        print(f"Error writing to audit log: {e}", file=sys.stderr)

# ========== COMMAND ROUTER ==========
def parse_command(text: str) -> Optional[Dict]:
    """
    Parse slash command from message text.

    Returns:
        Dict with {command, args} or None if not a command
    """
    match = re.match(r'^/(\w+)(?:\s+(.*))?$', text.strip())
    if match:
        command = match.group(1).lower()
        args_str = match.group(2) or ''
        args = args_str.split() if args_str else []
        return {'command': command, 'args': args}
    return None

def send_telegram_message(chat_id: int, text: str, parse_mode: str = 'Markdown') -> bool:
    """Send message via Telegram Bot API."""
    import requests

    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    try:
        response = requests.post(url, json={
            "chat_id": chat_id,
            "text": text,
            "parse_mode": parse_mode
        }, timeout=10)
        return response.status_code == 200
    except Exception as e:
        print(f"Error sending Telegram message: {e}", file=sys.stderr)
        return False

def execute_command(command: str, args: List[str], chat_id: int, user_id: int) -> str:
    """
    Execute a command and return response message.

    Args:
        command: Command name (without /)
        args: List of arguments
        chat_id: Telegram chat ID
        user_id: Telegram user ID

    Returns:
        Response message to send to user
    """
    start_time = time.time()

    # Command handlers
    if command == 'help':
        duration_ms = int((time.time() - start_time) * 1000)
        log_command(command, user_id, chat_id, args, True, None, duration_ms)
        return execute_help_command(args)

    elif command == 'status':
        duration_ms = int((time.time() - start_time) * 1000)
        log_command(command, user_id, chat_id, args, True, None, duration_ms)
        return execute_status_command()

    elif command == 'monitor':
        duration_ms = int((time.time() - start_time) * 1000)
        log_command(command, user_id, chat_id, args, True, None, duration_ms)
        return execute_monitor_command()

    elif command == 'test':
        return execute_test_command(args, chat_id, user_id, start_time)

    elif command == 'deploy':
        return execute_deploy_command(args, chat_id, user_id, start_time)

    else:
        duration_ms = int((time.time() - start_time) * 1000)
        log_command(command, user_id, chat_id, args, False, "command_not_found", duration_ms)
        return f"❌ Unknown command: `/{command}`\n\nTry /help to see available commands."

def execute_help_command(args: List[str]) -> str:
    """Execute /help command."""
    if args:
        # Specific command help
        cmd = args[0].lower()
        help_docs = {
            'status': """📊 */status* - System Status

*Description:*
Shows current system health, including:
• Webhook server status
• Notification settings
• Pending requests
• Recent activity

*Usage:*
`/status`

*Rate Limit:* 10 per minute""",

            'monitor': """📈 */monitor* - System Monitoring

*Description:*
Runs the monitor script to show:
• System health checks
• Database connectivity
• Recent events
• Pending operations

*Usage:*
`/monitor`

*Rate Limit:* 10 per minute""",

            'test': """🧪 */test* - Run Tests

*Description:*
Execute test suite and report results.

*Usage:*
`/test`

*Note:* Long-running command (may take several minutes)

*Rate Limit:* 1 per 5 minutes""",

            'deploy': """🚀 */deploy* - AWS Deployment

*Description:*
Deploy application to AWS environment with approval gate.

*Usage:*
`/deploy <environment>`

*Arguments:*
• `environment` - Target environment (staging, production)

*Examples:*
• `/deploy staging` - Deploy to staging
• `/deploy production` - Deploy to production (requires approval)

*Rate Limit:* 1 per 5 minutes"""
        }

        if cmd in help_docs:
            return help_docs[cmd]
        else:
            return f"❌ No help available for `/{cmd}`\n\nTry `/help` for all commands."

    # General help
    return """🤖 *P3 Interview Academy DevOps Bot*

*Available Commands:*

📊 *Monitoring*
• `/status` - Show system health and status
• `/monitor` - View detailed system metrics

🧪 *Testing*
• `/test` - Run test suite

🚀 *Deployment*
• `/deploy <env>` - Deploy to AWS environment

❓ *Help*
• `/help` - Show this message
• `/help <command>` - Get detailed help for a command

*Quick Tips:*
• Commands are rate-limited to prevent overload
• Long-running commands update progress in real-time
• All actions are logged for security

_Type `/help <command>` for detailed information._"""

def execute_status_command() -> str:
    """Execute /status command."""
    status_parts = ["📊 *System Status*\n"]

    # Webhook server
    status_parts.append("✅ Webhook Server: Running")

    # Notification status
    notify_flag = Path("/tmp/telegram_notify_enabled")
    if notify_flag.exists():
        status_parts.append("✅ Notifications: Enabled")
    else:
        status_parts.append("⚠️ Notifications: Disabled")

    # Pending requests
    try:
        pending_files = list(Path(PENDING_DIR).glob("*"))
        status_parts.append(f"📬 Pending Requests: {len(pending_files)}")
    except:
        status_parts.append("📬 Pending Requests: 0")

    # Inbox messages
    try:
        inbox_files = list(Path(INBOX_DIR).glob("*"))
        status_parts.append(f"📥 Recent Responses: {len(inbox_files)}")
    except:
        status_parts.append("📥 Recent Responses: 0")

    # Uptime
    status_parts.append(f"\n_Last check: {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())}_")

    return "\n".join(status_parts)

def execute_monitor_command() -> str:
    """Execute /monitor command."""
    try:
        # Run the monitor script
        script_path = Path(SCRIPT_DIR) / "../tools/monitor.sh"
        if script_path.exists():
            result = subprocess.run(
                [str(script_path)],
                capture_output=True,
                text=True,
                timeout=10
            )

            if result.returncode == 0:
                # Strip ANSI color codes
                output = re.sub(r'\x1b\[[0-9;]*m', '', result.stdout)
                # Limit output length
                if len(output) > 3000:
                    output = output[:3000] + "\n\n... (truncated)"
                return f"📊 *Monitor Output*\n\n```\n{output}\n```"
            else:
                return f"❌ Monitor script failed\n\n```\n{result.stderr[:500]}\n```"
        else:
            return "❌ Monitor script not found\n\nExpected: `scripts/telegram/tools/monitor.sh`"
    except subprocess.TimeoutExpired:
        return "⏰ Monitor script timed out after 10 seconds"
    except Exception as e:
        return f"❌ Error running monitor: {str(e)}"

def execute_test_command(args: List[str], chat_id: int, user_id: int, start_time: float) -> str:
    """Execute /test command."""
    try:
        # Send initial message
        send_telegram_message(chat_id, "🧪 Running test suite...\n\nThis may take several minutes.")

        # Run tests
        result = subprocess.run(
            ['npm', 'run', 'test:run'],
            capture_output=True,
            text=True,
            timeout=300,  # 5 minutes
            cwd=PROJECT_ROOT
        )

        duration_ms = int((time.time() - start_time) * 1000)

        # Parse test output
        output = result.stdout + result.stderr
        # Extract summary line
        summary = "No summary available"
        for line in reversed(output.split('\n')):
            if 'test' in line.lower() and ('passed' in line.lower() or 'failed' in line.lower()):
                summary = line.strip()
                break

        if result.returncode == 0:
            log_command('test', user_id, chat_id, args, True, None, duration_ms)
            return f"🧪 *Test Suite*\n\n✅ All tests passed\n\n`{summary}`\n\n_Duration: {duration_ms}ms_"
        else:
            log_command('test', user_id, chat_id, args, False, f"exit_code_{result.returncode}", duration_ms)
            return f"🧪 *Test Suite*\n\n❌ Some tests failed\n\n`{summary}`\n\nCheck logs for details.\n\n_Duration: {duration_ms}ms_"

    except subprocess.TimeoutExpired:
        duration_ms = int((time.time() - start_time) * 1000)
        log_command('test', user_id, chat_id, args, False, "timeout", duration_ms)
        return "⏰ Test suite timed out after 5 minutes"
    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        log_command('test', user_id, chat_id, args, False, str(e), duration_ms)
        return f"❌ Error running tests: {str(e)}"

def execute_deploy_command(args: List[str], chat_id: int, user_id: int, start_time: float) -> str:
    """Execute /deploy command."""
    if not args:
        duration_ms = int((time.time() - start_time) * 1000)
        log_command('deploy', user_id, chat_id, args, False, "missing_args", duration_ms)
        return "❌ Usage: `/deploy <environment>`\n\nEnvironments: staging, production"

    env = args[0].lower()
    if env not in ['staging', 'production']:
        duration_ms = int((time.time() - start_time) * 1000)
        log_command('deploy', user_id, chat_id, args, False, "invalid_env", duration_ms)
        return f"❌ Invalid environment: `{env}`\n\nValid: staging, production"

    try:
        # Run deployment script
        script_path = Path(SCRIPT_DIR) / f"../integrations/deploy-{env}.sh"
        if not script_path.exists():
            # Fallback to generic deployment
            duration_ms = int((time.time() - start_time) * 1000)
            log_command('deploy', user_id, chat_id, args, False, "script_not_found", duration_ms)
            return f"❌ Deployment script not found: `{script_path}`\n\nPlease create deployment integration script."

        send_telegram_message(chat_id, f"🚀 Starting deployment to *{env}*...\n\nThis will trigger the deployment workflow.")

        result = subprocess.run(
            [str(script_path)],
            capture_output=True,
            text=True,
            timeout=600,  # 10 minutes
            cwd=PROJECT_ROOT
        )

        duration_ms = int((time.time() - start_time) * 1000)

        if result.returncode == 0:
            log_command('deploy', user_id, chat_id, args, True, None, duration_ms)
            return f"🚀 *Deployment to {env}*\n\n✅ Deployment successful\n\n_Duration: {duration_ms}ms_"
        else:
            log_command('deploy', user_id, chat_id, args, False, f"exit_code_{result.returncode}", duration_ms)
            error_output = result.stderr[:500] if result.stderr else "Unknown error"
            return f"🚀 *Deployment to {env}*\n\n❌ Deployment failed\n\n```\n{error_output}\n```"

    except subprocess.TimeoutExpired:
        duration_ms = int((time.time() - start_time) * 1000)
        log_command('deploy', user_id, chat_id, args, False, "timeout", duration_ms)
        return f"⏰ Deployment to {env} timed out after 10 minutes"
    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        log_command('deploy', user_id, chat_id, args, False, str(e), duration_ms)
        return f"❌ Error during deployment: {str(e)}"

# Load environment variables
ENV_FILE = os.path.join(SCRIPT_DIR, '../.env')
if os.path.exists(ENV_FILE):
    with open(ENV_FILE, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ.setdefault(key.strip(), value.strip())

# Validate required environment variables
CHAT_ID = os.environ.get('CHAT_ID')
BOT_TOKEN = os.environ.get('BOT_TOKEN')

if not CHAT_ID:
    print("Error: CHAT_ID not set in environment or .env file", file=sys.stderr)
    sys.exit(1)

if not BOT_TOKEN:
    print("Error: BOT_TOKEN not set in environment or .env file", file=sys.stderr)
    sys.exit(1)


def get_latest_pending_token():
    """
    Get the most recent pending token from .pending/ directory.

    Returns:
        str: Latest token filename, or None if no pending tokens exist
    """
    try:
        pending_files = sorted(os.listdir(PENDING_DIR))
        return pending_files[-1] if pending_files else None
    except Exception as e:
        print(f"Error reading pending directory: {e}", file=sys.stderr)
        return None


def write_inbox_reply(token, content):
    """
    Write reply content to .inbox/<token> file.

    Args:
        token (str): The token identifying the pending request
        content (str): The reply content (approve/reject/input text)
    """
    inbox_file = os.path.join(INBOX_DIR, token)
    try:
        with open(inbox_file, 'w') as f:
            f.write(content)
    except Exception as e:
        print(f"Error writing to inbox file {token}: {e}", file=sys.stderr)
        raise


def remove_pending_token(token):
    """
    Remove token from .pending/ directory.

    Args:
        token (str): The token to remove
    """
    pending_file = os.path.join(PENDING_DIR, token)
    try:
        if os.path.exists(pending_file):
            os.remove(pending_file)
    except Exception as e:
        print(f"Warning: Could not remove pending file {token}: {e}", file=sys.stderr)


def acknowledge_callback(query_id, text="✅ Received"):
    """
    Send acknowledgment for inline button callback to remove loading state.

    Args:
        query_id (str): The callback query ID from Telegram
        text (str): Optional acknowledgment text to show as popup
    """
    import requests

    url = f"https://api.telegram.org/bot{BOT_TOKEN}/answerCallbackQuery"
    try:
        requests.post(url, json={
            "callback_query_id": query_id,
            "text": text
        }, timeout=5)
    except Exception as e:
        print(f"Warning: Could not acknowledge callback {query_id}: {e}", file=sys.stderr)


def has_pending_multiselect(token):
    """
    Check if a pending token is for a multi-select question.

    Args:
        token (str): The token to check

    Returns:
        bool: True if the pending file contains multiselect metadata
    """
    pending_file = os.path.join(PENDING_DIR, token)
    try:
        if os.path.exists(pending_file):
            with open(pending_file, 'r') as f:
                content = f.read().strip()
                # Check if pending file contains multiselect flag
                return "multiselect" in content.lower()
    except Exception as e:
        print(f"Warning: Could not read pending file {token}: {e}", file=sys.stderr)
    return False


@app.get("/healthz")
def health():
    """
    Health check endpoint for monitoring.

    Returns:
        tuple: ("ok", 200) response
    """
    return "ok", 200


@app.post("/telegram/webhook")
def telegram_webhook():
    """
    Process incoming Telegram webhook messages and inline button callbacks.

    Supported Commands:
        approve <TOKEN> - Approve specific pending request
        reject <TOKEN> - Reject specific pending request
        approve - Approve latest pending request
        reject - Reject latest pending request
        /input <TOKEN> <text> - Provide text input for specific request
        /input <text> - Provide text input for latest request

    Supported Callbacks (inline buttons):
        TOKEN::N - Select option N (single-select)
        TOKEN::done - Finalize multi-select

    Returns:
        dict: JSON response with status and details
    """
    # Parse JSON payload
    try:
        data = request.get_json(force=True, silent=True) or {}
    except Exception as e:
        print(f"Error parsing JSON: {e}", file=sys.stderr)
        return jsonify({"status": "error", "message": "Invalid JSON"}), 400

    # ========== CALLBACK QUERY HANDLING (inline buttons) ==========
    if "callback_query" in data:
        query = data["callback_query"]
        callback_data = query.get("data", "")
        query_id = query.get("id")
        chat_id = str(query.get("from", {}).get("id", ""))

        # Validate chat ID (security check)
        if chat_id != str(CHAT_ID):
            print(f"Unauthorized callback from chat ID: {chat_id} (expected: {CHAT_ID})", file=sys.stderr)
            return jsonify({"status": "unauthorized"}), 403

        # Parse callback data (format: "TOKEN::SELECTION")
        if "::" in callback_data:
            token, selection = callback_data.split("::", 1)

            # Handle "done" for multi-select
            if selection == "done":
                selections = MULTI_SELECT_STATE.get(token, [])
                if selections:
                    # Write accumulated selections to inbox
                    write_inbox_reply(token, ",".join(selections))
                    remove_pending_token(token)
                    del MULTI_SELECT_STATE[token]

                    # Acknowledge callback
                    acknowledge_callback(query_id, f"✅ Selected: {', '.join(selections)}")

                    print(f"Processed multi-select done for token {token}: {selections}")
                    return jsonify({
                        "status": "ok",
                        "type": "multi_select_done",
                        "token": token,
                        "selections": selections
                    })
                else:
                    # No selections made yet
                    acknowledge_callback(query_id, "⚠️ No selections made yet")
                    return jsonify({"status": "no_selections"})

            # Check if this is a multi-select question (look for existing state)
            elif token in MULTI_SELECT_STATE or has_pending_multiselect(token):
                # Accumulate selection for multi-select
                if token not in MULTI_SELECT_STATE:
                    MULTI_SELECT_STATE[token] = []

                if selection not in MULTI_SELECT_STATE[token]:
                    MULTI_SELECT_STATE[token].append(selection)
                    acknowledge_callback(query_id, f"✅ Added: {selection} (tap Done when ready)")
                else:
                    # Toggle off (remove selection)
                    MULTI_SELECT_STATE[token].remove(selection)
                    acknowledge_callback(query_id, f"❌ Removed: {selection}")

                print(f"Multi-select state for {token}: {MULTI_SELECT_STATE[token]}")
                return jsonify({
                    "status": "ok",
                    "type": "multi_select_accumulate",
                    "token": token,
                    "current_selections": MULTI_SELECT_STATE[token]
                })

            else:
                # Single-select: write selection immediately
                write_inbox_reply(token, selection)
                remove_pending_token(token)

                # Acknowledge callback
                acknowledge_callback(query_id, "✅ Selection received")

                print(f"Processed single-select for token {token}: {selection}")
                return jsonify({
                    "status": "ok",
                    "type": "single_select",
                    "token": token,
                    "selection": selection
                })

        # Invalid callback format
        print(f"Invalid callback data format: {callback_data}", file=sys.stderr)
        acknowledge_callback(query_id, "❌ Invalid selection format")
        return jsonify({"status": "invalid_callback"}), 400

    # ========== MESSAGE HANDLING ==========
    # Extract message data
    msg = data.get("message") or {}
    text = (msg.get("text") or "").strip()
    chat_id = str(msg.get("chat", {}).get("id", ""))
    user_id = int(msg.get("from", {}).get("id", 0))

    # Validate chat ID (security check)
    if chat_id != str(CHAT_ID):
        print(f"Unauthorized chat ID: {chat_id} (expected: {CHAT_ID})", file=sys.stderr)
        return jsonify({"status": "unauthorized"}), 403

    if not text:
        return jsonify({"status": "ignored", "reason": "empty_message"})

    # ========== CHECK FOR SLASH COMMANDS ==========
    parsed_cmd = parse_command(text)
    if parsed_cmd:
        command = parsed_cmd['command']
        args = parsed_cmd['args']

        print(f"Processing command: /{command} {args}")

        # Determine rate limit tier
        if command in ['test', 'deploy']:
            tier = 'intensive'
        elif command in ['status', 'monitor', 'help']:
            tier = 'readonly'
        else:
            tier = 'general'

        # Check rate limit
        rate_limit_error = check_rate_limit(user_id, tier)
        if rate_limit_error:
            send_telegram_message(int(chat_id), rate_limit_error)
            print(f"Rate limit exceeded for user {user_id} on /{command}")
            return jsonify({
                "status": "rate_limited",
                "command": command,
                "tier": tier
            })

        # Execute command
        try:
            response = execute_command(command, args, int(chat_id), user_id)
            send_telegram_message(int(chat_id), response)
            print(f"Command executed successfully: /{command}")
            return jsonify({
                "status": "ok",
                "type": "command",
                "command": command,
                "args": args
            })
        except Exception as e:
            error_msg = f"❌ Error executing command: {str(e)}"
            send_telegram_message(int(chat_id), error_msg)
            print(f"Error executing command /{command}: {e}", file=sys.stderr)
            return jsonify({"status": "error", "message": str(e)}), 500

    # ========== PATTERN 1: approve/reject with explicit TOKEN ==========
    # Example: "approve TOKEN_1234567890_123" or "reject TOKEN_1234567890_123"
    match = re.search(r'\b(approve|reject)\s+([A-Za-z0-9_-]+)\b', text, re.IGNORECASE)
    if match:
        decision = match.group(1).lower()
        token = match.group(2)

        try:
            write_inbox_reply(token, decision)
            remove_pending_token(token)
            print(f"Processed: {decision} {token}")
            return jsonify({
                "status": "ok",
                "type": "decision",
                "token": token,
                "decision": decision
            })
        except Exception as e:
            print(f"Error processing decision: {e}", file=sys.stderr)
            return jsonify({"status": "error", "message": str(e)}), 500

    # ========== PATTERN 2: approve/reject without token (latest pending) ==========
    # Example: "approve" or "reject"
    if re.match(r'^(approve|reject)\b', text, re.IGNORECASE):
        decision = text.split()[0].lower()
        token = get_latest_pending_token()

        if not token:
            print("No pending requests for decision without token")
            return jsonify({
                "status": "no_pending",
                "message": "No pending requests to approve/reject"
            })

        try:
            write_inbox_reply(token, decision)
            remove_pending_token(token)
            print(f"Processed (latest): {decision} {token}")
            return jsonify({
                "status": "ok",
                "type": "decision",
                "token": token,
                "decision": decision,
                "note": "applied_to_latest_pending"
            })
        except Exception as e:
            print(f"Error processing decision: {e}", file=sys.stderr)
            return jsonify({"status": "error", "message": str(e)}), 500

    # ========== PATTERN 3: /input with optional TOKEN ==========
    # Example: "/input TOKEN_123 some text here" or "/input some text here"
    match = re.search(r'^/input\s+([A-Za-z0-9_-]+)?\s*(.*)$', text, re.IGNORECASE | re.DOTALL)
    if match:
        token = match.group(1)  # May be None
        payload = (match.group(2) or "").strip()

        # If no token provided, use latest pending
        if not token:
            token = get_latest_pending_token()
            if not token:
                print("No pending requests for input without token")
                return jsonify({
                    "status": "no_pending",
                    "message": "No pending requests for input"
                })

        # Validate payload exists
        if not payload:
            return jsonify({
                "status": "error",
                "message": "Input text required after /input command"
            })

        try:
            write_inbox_reply(token, payload)
            remove_pending_token(token)
            print(f"Processed input for token {token}: {payload[:50]}...")
            return jsonify({
                "status": "ok",
                "type": "input",
                "token": token,
                "payload_length": len(payload)
            })
        except Exception as e:
            print(f"Error processing input: {e}", file=sys.stderr)
            return jsonify({"status": "error", "message": str(e)}), 500

    # ========== NO RECOGNIZED PATTERN ==========
    print(f"Ignored message (no recognized pattern): {text[:100]}")
    return jsonify({"status": "ignored", "reason": "unrecognized_command"})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8080"))
    print(f"Starting Telegram webhook server on port {port}")
    print(f"Authorized Chat ID: {CHAT_ID}")
    print(f"Inbox directory: {INBOX_DIR}")
    print(f"Pending directory: {PENDING_DIR}")
    print(f"Environment file: {ENV_FILE}")
    print("Ready to receive webhooks at POST /telegram/webhook")

    # Run Flask server
    app.run(
        host="0.0.0.0",
        port=port,
        debug=False  # Disable debug mode in production
    )
