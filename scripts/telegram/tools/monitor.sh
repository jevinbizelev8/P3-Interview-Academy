#!/bin/bash
# Monitor Telegram notification system status
#
# Usage:
#   ./monitor.sh [--no-color]
#
# Displays:
#   - Notification toggle status
#   - Webhook registration status
#   - Pending approvals count
#   - Recent messages
#   - State directory health
#
# Dependencies:
#   - TELEGRAM_BOT_TOKEN environment variable
#   - jq for JSON parsing
#   - curl for API queries

set -euo pipefail

# Change to workspace root
cd "$(dirname "$0")/../../.." || exit 1

# Color codes (can be disabled with --no-color)
USE_COLOR=true
[[ "${1:-}" == "--no-color" ]] && USE_COLOR=false

if [[ "$USE_COLOR" == "true" ]]; then
  GREEN='\033[0;32m'
  RED='\033[0;31m'
  YELLOW='\033[1;33m'
  BLUE='\033[0;34m'
  RESET='\033[0m'
else
  GREEN=''
  RED=''
  YELLOW=''
  BLUE=''
  RESET=''
fi

# Helper functions
print_header() {
  echo -e "\n${BLUE}$1${RESET}"
  echo "════════════════════════════════════════════"
}

print_status() {
  local status=$1
  local message=$2
  if [[ "$status" == "ok" ]]; then
    echo -e "${GREEN}✅${RESET} $message"
  elif [[ "$status" == "warn" ]]; then
    echo -e "${YELLOW}⚠️${RESET}  $message"
  else
    echo -e "${RED}❌${RESET} $message"
  fi
}

# Main monitoring output
echo -e "${BLUE}📊 Telegram System Status${RESET}"
echo "════════════════════════════════════════════"

# 1. Notification toggle status
print_header "Notification Status"
if [[ -f ".notify.enabled" ]]; then
  print_status "ok" "ENABLED"
else
  print_status "error" "DISABLED"
fi

# 2. Webhook registration status
print_header "Webhook Status"
if [[ -z "${TELEGRAM_BOT_TOKEN:-}" ]]; then
  print_status "warn" "TELEGRAM_BOT_TOKEN not set (cannot query webhook)"
else
  if command -v jq &>/dev/null; then
    webhook_response=$(curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo" 2>/dev/null || echo '{"result":{"url":""}}')
    webhook_url=$(echo "$webhook_response" | jq -r '.result.url // ""')

    if [[ -n "$webhook_url" && "$webhook_url" != "null" ]]; then
      print_status "ok" "Registered"
      echo "  URL: $webhook_url"

      # Check for errors
      last_error=$(echo "$webhook_response" | jq -r '.result.last_error_message // ""')
      if [[ -n "$last_error" && "$last_error" != "null" ]]; then
        print_status "warn" "Last error: $last_error"
      fi

      # Pending updates
      pending=$(echo "$webhook_response" | jq -r '.result.pending_update_count // 0')
      if [[ "$pending" -gt 0 ]]; then
        print_status "warn" "Pending updates: $pending"
      fi
    else
      print_status "error" "NOT registered"
    fi
  else
    print_status "warn" "jq not installed (cannot check webhook)"
  fi
fi

# 3. Pending approvals
print_header "Pending Approvals"
if [[ -d ".pending" ]]; then
  pending_count=$(find .pending -type f 2>/dev/null | wc -l)
  if [[ "$pending_count" -eq 0 ]]; then
    print_status "ok" "No pending approvals"
  else
    print_status "warn" "$pending_count request(s) waiting"

    # List pending files (show up to 5)
    echo "  Recent pending:"
    find .pending -type f -printf "  - %f (modified: %TY-%Tm-%Td %TH:%TM)\n" 2>/dev/null | head -5
  fi
else
  print_status "warn" ".pending/ directory does not exist"
fi

# 4. Recent messages
print_header "Recent Activity"

# Check inbox
if [[ -d ".inbox" ]]; then
  inbox_count=$(find .inbox -type f 2>/dev/null | wc -l)
  if [[ "$inbox_count" -eq 0 ]]; then
    echo "  .inbox/: No messages"
  else
    echo "  .inbox/: $inbox_count message(s)"
    find .inbox -type f -printf "  [%TY-%Tm-%Td %TH:%TM] %f\n" 2>/dev/null | sort -r | head -5
  fi
else
  echo "  .inbox/: directory does not exist"
fi

echo ""

# Check telegram messages
if [[ -d ".telegram_messages" ]]; then
  msg_count=$(find .telegram_messages -type f 2>/dev/null | wc -l)
  if [[ "$msg_count" -eq 0 ]]; then
    echo "  .telegram_messages/: No messages"
  else
    echo "  .telegram_messages/: $msg_count message(s)"
    find .telegram_messages -type f -printf "  [%TY-%Tm-%Td %TH:%TM] %f\n" 2>/dev/null | sort -r | head -5
  fi
else
  echo "  .telegram_messages/: directory does not exist"
fi

# 5. State directories health check
print_header "State Directories"

check_dir() {
  local dir=$1
  if [[ -d "$dir" ]]; then
    local count=$(find "$dir" -type f 2>/dev/null | wc -l)
    print_status "ok" "$dir → $count file(s)"
  else
    print_status "warn" "$dir → does not exist"
  fi
}

check_dir ".pending"
check_dir ".inbox"
check_dir ".telegram_messages"

# 6. Overall health
print_header "Health Check"

health_ok=true

# Check critical components
if [[ ! -d ".pending" || ! -d ".inbox" || ! -d ".telegram_messages" ]]; then
  health_ok=false
fi

if [[ -z "${TELEGRAM_BOT_TOKEN:-}" ]]; then
  health_ok=false
fi

if [[ "$health_ok" == "true" ]]; then
  print_status "ok" "All systems operational"
else
  print_status "warn" "Some components missing or misconfigured"
  echo ""
  echo "  Run setup to initialize:"
  echo "  ./scripts/telegram/core/notifyctl setup"
fi

echo ""
