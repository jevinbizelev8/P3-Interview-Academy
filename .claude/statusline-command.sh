#!/bin/bash

# AWS Bedrock Sonnet 4.5 Cost Tracking StatusLine
# Displays: Session tokens/cost | Today | Week | Duration | Time | Dir | Git

# ==================== CONFIGURATION ====================
BEDROCK_INPUT_COST_PER_1K=0.003   # $0.003 per 1K input tokens
BEDROCK_OUTPUT_COST_PER_1K=0.015  # $0.015 per 1K output tokens
STATE_FILE="/home/runner/workspace/.claude/data/usage-stats.json"

# ==================== READ INPUT ====================
INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"')
TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // ""')
CWD=$(echo "$INPUT" | jq -r '.workspace.current_dir // .cwd // ""')

# ==================== INITIALIZE STATE ====================
mkdir -p "$(dirname "$STATE_FILE")"
if [ ! -f "$STATE_FILE" ]; then
  echo '{"sessions":{},"daily":{},"weekly":{}}' > "$STATE_FILE"
fi

# ==================== TOKEN COUNTING ====================
INPUT_TOKENS=0
OUTPUT_TOKENS=0

if [ -n "$TRANSCRIPT_PATH" ] && [ -f "$TRANSCRIPT_PATH" ]; then
  # Parse transcript for token usage
  # Look for assistant responses and sum their token usage
  INPUT_TOKENS=$(jq '[.interactions[]?.input_tokens // 0] | add // 0' "$TRANSCRIPT_PATH" 2>/dev/null || echo 0)
  OUTPUT_TOKENS=$(jq '[.interactions[]?.output_tokens // 0] | add // 0' "$TRANSCRIPT_PATH" 2>/dev/null || echo 0)

  # If interactions don't exist, try alternative parsing
  if [ "$OUTPUT_TOKENS" -eq 0 ]; then
    # Count messages as rough estimate (if no token data available)
    # This is a fallback - actual token data is preferred
    OUTPUT_TOKENS=$(jq '[.messages[]? | select(.role == "assistant") | .content | length] | add // 0' "$TRANSCRIPT_PATH" 2>/dev/null | awk '{print int($1/4)}' || echo 0)
    INPUT_TOKENS=$(jq '[.messages[]? | select(.role == "user") | .content | length] | add // 0' "$TRANSCRIPT_PATH" 2>/dev/null | awk '{print int($1/4)}' || echo 0)
  fi
fi

# ==================== COST CALCULATION ====================
SESSION_COST=$(awk "BEGIN {printf \"%.4f\", ($INPUT_TOKENS * $BEDROCK_INPUT_COST_PER_1K / 1000) + ($OUTPUT_TOKENS * $BEDROCK_OUTPUT_COST_PER_1K / 1000)}")

# ==================== TIME CALCULATIONS ====================
TODAY=$(date +%Y-%m-%d)
WEEK=$(date +%Y-W%V)
CURRENT_TIME=$(date +%H:%M)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S")

# ==================== UPDATE STATE ====================
STATE=$(cat "$STATE_FILE")

# Get or create session data
SESSION_START=$(echo "$STATE" | jq -r ".sessions[\"$SESSION_ID\"].start_time // \"$TIMESTAMP\"")
SESSION_DATA=$(echo "$STATE" | jq --arg sid "$SESSION_ID" \
  --argjson input "$INPUT_TOKENS" \
  --argjson output "$OUTPUT_TOKENS" \
  --arg cost "$SESSION_COST" \
  --arg start "$SESSION_START" \
  --arg update "$TIMESTAMP" \
  '.sessions[$sid] = {
    "input_tokens": $input,
    "output_tokens": $output,
    "cost": ($cost | tonumber),
    "start_time": $start,
    "last_update": $update
  }')

# Calculate session duration
if [ "$SESSION_START" != "null" ] && [ -n "$SESSION_START" ]; then
  START_EPOCH=$(date -d "$SESSION_START" +%s 2>/dev/null || echo 0)
  CURRENT_EPOCH=$(date +%s)
  DURATION_SECONDS=$((CURRENT_EPOCH - START_EPOCH))
  DURATION_MINUTES=$((DURATION_SECONDS / 60))
  if [ $DURATION_MINUTES -lt 60 ]; then
    DURATION="${DURATION_MINUTES}m"
  else
    DURATION_HOURS=$((DURATION_MINUTES / 60))
    DURATION_MINS=$((DURATION_MINUTES % 60))
    DURATION="${DURATION_HOURS}h${DURATION_MINS}m"
  fi
else
  DURATION="0m"
fi

# Update daily total
DAILY_COST=$(echo "$SESSION_DATA" | jq --arg today "$TODAY" \
  '[.sessions[] | select(.last_update | startswith($today)) | .cost] | add // 0')
SESSION_DATA=$(echo "$SESSION_DATA" | jq --arg today "$TODAY" \
  --arg cost "$DAILY_COST" \
  '.daily[$today] = {
    "cost": ($cost | tonumber),
    "date": $today
  }')

# Update weekly total
WEEKLY_COST=$(echo "$SESSION_DATA" | jq --arg week "$WEEK" \
  --arg today "$TODAY" \
  '[.sessions[] | select(.last_update | startswith($today[:4])) | select(.last_update | .[5:7] | tonumber >= (($today | .[5:7] | tonumber) - 7)) | .cost] | add // 0')
SESSION_DATA=$(echo "$SESSION_DATA" | jq --arg week "$WEEK" \
  --arg cost "$WEEKLY_COST" \
  '.weekly[$week] = {
    "cost": ($cost | tonumber),
    "week": $week
  }')

# Save updated state
echo "$SESSION_DATA" > "$STATE_FILE"

# Get final daily and weekly costs
TODAY_COST=$(echo "$SESSION_DATA" | jq -r ".daily[\"$TODAY\"].cost // 0")
WEEK_COST=$(echo "$SESSION_DATA" | jq -r ".weekly[\"$WEEK\"].cost // 0")

# ==================== FORMAT TOKENS ====================
format_tokens() {
  local tokens=$1
  if [ $tokens -ge 1000000 ]; then
    awk "BEGIN {printf \"%.1fM\", $tokens/1000000}"
  elif [ $tokens -ge 1000 ]; then
    awk "BEGIN {printf \"%.1fK\", $tokens/1000}"
  else
    echo "$tokens"
  fi
}

INPUT_DISPLAY=$(format_tokens $INPUT_TOKENS)
OUTPUT_DISPLAY=$(format_tokens $OUTPUT_TOKENS)

# ==================== GIT BRANCH ====================
GIT_BRANCH=""
if [ -n "$CWD" ] && [ -d "$CWD/.git" ]; then
  GIT_BRANCH=$(cd "$CWD" && git branch --show-current 2>/dev/null)
  if [ -n "$GIT_BRANCH" ]; then
    GIT_BRANCH=" [$GIT_BRANCH]"
  fi
fi

# ==================== DIRECTORY DISPLAY ====================
if [ -n "$CWD" ]; then
  # Show relative to home if possible
  DIR_DISPLAY=$(echo "$CWD" | sed "s|^$HOME|~|")
else
  DIR_DISPLAY="~"
fi

# ==================== OUTPUT ====================
printf "Session: %s↑/%s↓ \$%.2f │ Today: \$%.2f │ Week: \$%.2f │ %s │ %s │ %s%s" \
  "$INPUT_DISPLAY" \
  "$OUTPUT_DISPLAY" \
  "$SESSION_COST" \
  "$TODAY_COST" \
  "$WEEK_COST" \
  "$DURATION" \
  "$CURRENT_TIME" \
  "$DIR_DISPLAY" \
  "$GIT_BRANCH"
