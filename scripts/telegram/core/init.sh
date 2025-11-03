#!/usr/bin/env bash
set -euo pipefail

# Script: init.sh
# Purpose: Initialize Telegram bot notification system
# Usage: init.sh

# Get project root (2 levels up from scripts/telegram/core/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"
LOGS_DIR="$SCRIPT_DIR/../.logs"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success() {
  echo -e "${GREEN}✓${NC} $1"
}

error() {
  echo -e "${RED}✗${NC} $1" >&2
}

warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

info() {
  echo "  $1"
}

# Check for required commands
echo "Checking requirements..."
MISSING_COMMANDS=()

for cmd in curl python3 jq; do
  if ! command -v "$cmd" &>/dev/null; then
    MISSING_COMMANDS+=("$cmd")
  fi
done

if [[ ${#MISSING_COMMANDS[@]} -gt 0 ]]; then
  error "Missing required commands: ${MISSING_COMMANDS[*]}"
  info "Install with: apt-get install curl python3 jq"
  exit 1
fi
success "All required commands available"

# Create necessary directories
echo "Creating directories..."
mkdir -p "$PROJECT_ROOT/.inbox" "$PROJECT_ROOT/.pending" "$LOGS_DIR"
success "Directories created"

# Set permissions
echo "Setting permissions..."
chmod 700 "$PROJECT_ROOT/.inbox" "$PROJECT_ROOT/.pending"
chmod 755 "$LOGS_DIR"
success "Permissions set"

# Make scripts executable
echo "Setting script permissions..."
chmod +x "$SCRIPT_DIR/notifyctl"
chmod +x "$SCRIPT_DIR/notify.sh"
chmod +x "$SCRIPT_DIR/await_reply.sh"
success "Scripts are executable"

# Validate environment file
echo "Validating environment..."
if [[ ! -f "$ENV_FILE" ]]; then
  error "Environment file not found: $ENV_FILE"
  info "Create $ENV_FILE with:"
  info "  BOT_TOKEN=your_telegram_bot_token"
  info "  CHAT_ID=your_telegram_chat_id"
  exit 1
fi
success "Environment file exists"

# Load and validate environment variables
set -a
source "$ENV_FILE"
set +a

if [[ -z "${BOT_TOKEN:-}" ]]; then
  error "BOT_TOKEN not set in $ENV_FILE"
  exit 1
fi

if [[ -z "${CHAT_ID:-}" ]]; then
  error "CHAT_ID not set in $ENV_FILE"
  exit 1
fi
success "Required environment variables set"

# Test Telegram API connectivity
echo "Testing Telegram API..."
API_URL="https://api.telegram.org/bot${BOT_TOKEN}/getMe"

if ! RESPONSE=$(curl -s -f "$API_URL" 2>&1); then
  error "Failed to connect to Telegram API"
  info "Response: $RESPONSE"
  exit 1
fi

if ! echo "$RESPONSE" | grep -q '"ok":true'; then
  error "Invalid Telegram bot token"
  info "Response: $RESPONSE"
  exit 1
fi

BOT_USERNAME=$(echo "$RESPONSE" | grep -o '"username":"[^"]*"' | cut -d'"' -f4)
success "Telegram API connected (bot: @$BOT_USERNAME)"

# Send test message
echo "Sending test message..."
TEST_MESSAGE="✅ Telegram bot initialized successfully!

Bot: @$BOT_USERNAME
Chat ID: $CHAT_ID
System ready for notifications."

"$SCRIPT_DIR/notifyctl" on &>/dev/null
if "$SCRIPT_DIR/notify.sh" "$TEST_MESSAGE"; then
  success "Test message sent"
else
  error "Failed to send test message"
  exit 1
fi

# Install Python dependencies (if requirements.txt exists)
REQUIREMENTS_FILE="$PROJECT_ROOT/server/requirements.txt"
if [[ -f "$REQUIREMENTS_FILE" ]]; then
  echo "Installing Python dependencies..."
  if python3 -m pip install -q -r "$REQUIREMENTS_FILE"; then
    success "Python dependencies installed"
  else
    warning "Failed to install Python dependencies (non-critical)"
  fi
fi

# Final summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
success "Setup complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
info "Available commands:"
info "  ./scripts/telegram/core/notifyctl {on|off|status}"
info "  ./scripts/telegram/core/notify.sh \"message\""
info "  ./scripts/telegram/core/await_reply.sh \"question\" [timeout]"
echo ""
info "Directories created:"
info "  .inbox/    - Incoming replies from Telegram"
info "  .pending/  - Pending approval tokens"
info "  scripts/telegram/.logs/ - System logs"
echo ""
success "Check your Telegram for the test message!"
