#!/home/runner/workspace/.venv/bin/python3
"""
Send multiple-choice question to Telegram with inline keyboard buttons.

Usage:
    ./send_question.py <token> <question> <options_json> [multi_select]

Example:
    ./send_question.py "ABC123" \
        "Which auth method?" \
        '[{"label":"JWT","description":"Stateless tokens"},{"label":"Session","description":"Server-side state"}]' \
        false

Args:
    token: Unique identifier for this question (used for response tracking)
    question: The question text to display
    options_json: JSON array of options with "label" and "description" fields
    multi_select: "true" or "false" (optional, default: false)

Environment Variables:
    BOT_TOKEN: Telegram Bot API token
    CHAT_ID: Target Telegram chat ID
"""

import sys
import json
import os
import requests


def send_question(token, question, options, multi_select=False):
    """
    Send a multiple-choice question to Telegram with inline keyboard buttons.

    Args:
        token (str): Unique token for response tracking
        question (str): Question text to display
        options (list): List of dicts with "label" and "description" keys
        multi_select (bool): Whether to allow multiple selections

    Returns:
        None (exits with code 0 on success, 1 on failure)
    """
    bot_token = os.environ.get("BOT_TOKEN")
    chat_id = os.environ.get("CHAT_ID")

    if not bot_token:
        print("Error: BOT_TOKEN not set in environment", file=sys.stderr)
        sys.exit(1)

    if not chat_id:
        print("Error: CHAT_ID not set in environment", file=sys.stderr)
        sys.exit(1)

    # Build message text with Markdown formatting
    message = f"❓ **{question}**\n\n"
    for i, opt in enumerate(options):
        message += f"{i+1}. **{opt['label']}**\n"
        message += f"   {opt['description']}\n\n"

    if multi_select:
        message += "ℹ️ *Multi-select: Tap multiple options, then tap Done*\n\n"

    # Add text fallback instructions
    message += "_Or type a number (1-{}) or option label_".format(len(options))

    # Build inline keyboard buttons
    keyboard = []
    for i, opt in enumerate(options):
        keyboard.append([{
            "text": opt["label"],
            "callback_data": f"{token}::{i}"
        }])

    # Add "Done" button for multi-select
    if multi_select:
        keyboard.append([{
            "text": "✅ Done",
            "callback_data": f"{token}::done"
        }])

    # Send message to Telegram
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    response = requests.post(url, json={
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "Markdown",
        "reply_markup": {"inline_keyboard": keyboard}
    }, timeout=10)

    if response.ok:
        print(f"✅ Question sent to Telegram (token: {token})")
        print(f"   Options: {', '.join(opt['label'] for opt in options)}")
        print(f"   Multi-select: {multi_select}")
    else:
        print(f"❌ Failed to send question to Telegram", file=sys.stderr)
        print(f"   Status: {response.status_code}", file=sys.stderr)
        print(f"   Response: {response.text}", file=sys.stderr)
        sys.exit(1)


def main():
    """Parse command-line arguments and send question."""
    if len(sys.argv) < 4:
        print("Usage: send_question.py <token> <question> <options_json> [multi_select]", file=sys.stderr)
        print("\nExample:", file=sys.stderr)
        print('  send_question.py "ABC123" "Which library?" \'[{"label":"React","description":"UI library"}]\' false', file=sys.stderr)
        sys.exit(2)

    token = sys.argv[1]
    question = sys.argv[2]

    # Parse options JSON
    try:
        options = json.loads(sys.argv[3])
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in options argument: {e}", file=sys.stderr)
        sys.exit(2)

    # Validate options format
    if not isinstance(options, list) or not options:
        print("Error: options_json must be a non-empty array", file=sys.stderr)
        sys.exit(2)

    for i, opt in enumerate(options):
        if not isinstance(opt, dict):
            print(f"Error: Option {i} must be an object", file=sys.stderr)
            sys.exit(2)
        if "label" not in opt or "description" not in opt:
            print(f"Error: Option {i} missing 'label' or 'description' field", file=sys.stderr)
            sys.exit(2)

    # Parse multi_select flag (optional, defaults to false)
    multi_select = False
    if len(sys.argv) > 4:
        multi_select = sys.argv[4].lower() in ("true", "1", "yes")

    # Send the question
    send_question(token, question, options, multi_select)


if __name__ == "__main__":
    main()
