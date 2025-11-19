#!/bin/bash
# Claude Code Multiple-Choice Question Handler
#
# Usage: ./claude-ask-question.sh <question> <options_json> [multi_select]
#
# Returns: Selected option index (0-based) or comma-separated indices for multi-select
#
# Examples:
#   Single-select:
#     ./claude-ask-question.sh "Which library?" '[{"label":"React","description":"UI framework"}]' false
#     # Returns: 0
#
#   Multi-select:
#     ./claude-ask-question.sh "Which features?" '[{"label":"Auth","description":"User auth"}]' true
#     # Returns: 0,2 (if options 0 and 2 selected)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

QUESTION="${1:?Missing question argument}"
OPTIONS_JSON="${2:?Missing options JSON argument}"
MULTI_SELECT="${3:-false}"

# Check if notifications enabled
if [[ ! -f "$PROJECT_ROOT/.notify.enabled" ]]; then
  echo "⚠️  Notifications disabled - returning first option (auto-select)" >&2
  echo "0"
  exit 0
fi

# Generate unique token
TOKEN="Q$(date +%s)_$$"

# Create pending request with multiselect flag if needed
mkdir -p "$PROJECT_ROOT/.pending"
if [[ "$MULTI_SELECT" == "true" ]]; then
  echo "multiselect" > "$PROJECT_ROOT/.pending/$TOKEN"
else
  echo "$TOKEN" > "$PROJECT_ROOT/.pending/$TOKEN"
fi

# Send question with inline buttons
/home/runner/workspace/.venv/bin/python "$PROJECT_ROOT/scripts/telegram/send_question.py" \
  "$TOKEN" \
  "$QUESTION" \
  "$OPTIONS_JSON" \
  "$MULTI_SELECT"

echo "📱 Question sent to Telegram" >&2
echo "⏳ Waiting for response..." >&2

# Wait for response (10 minute timeout)
if "$PROJECT_ROOT/scripts/telegram/core/await_reply.sh" "$TOKEN" 600; then
  SELECTION=$(cat "$PROJECT_ROOT/.inbox/$TOKEN")
  rm -f "$PROJECT_ROOT/.inbox/$TOKEN"
  echo "$SELECTION"
  exit 0
else
  echo "⏰ Timeout - returning first option (default)" >&2
  echo "0"
  exit 0
fi
