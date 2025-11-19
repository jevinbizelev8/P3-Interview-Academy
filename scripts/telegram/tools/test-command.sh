#!/bin/bash
# Test Telegram commands by simulating incoming webhook messages

PORT="${PORT:-8080}"
CHAT_ID="${CHAT_ID:-449555452}"

COMMAND="$1"

if [ -z "$COMMAND" ]; then
    echo "Usage: $0 <command>"
    echo "Example: $0 /status"
    exit 1
fi

echo "Testing command: $COMMAND"
echo "Sending to webhook server on port $PORT..."

curl -X POST "http://localhost:$PORT/telegram/webhook" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": {
      \"message_id\": 1,
      \"from\": {
        \"id\": $CHAT_ID,
        \"first_name\": \"Test\"
      },
      \"chat\": {
        \"id\": $CHAT_ID,
        \"type\": \"private\"
      },
      \"date\": $(date +%s),
      \"text\": \"$COMMAND\"
    }
  }"

echo ""
echo ""
echo "Check your Telegram for the response!"
