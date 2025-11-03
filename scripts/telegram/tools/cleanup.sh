#!/bin/bash
# Cleanup old Telegram state files
#
# Usage:
#   ./cleanup.sh [--dry-run]
#
# Removes:
#   - Message files older than 24 hours from .telegram_messages/
#   - Reply files older than 1 hour from .inbox/
#   - Does NOT touch .pending/ (active approvals)
#
# Options:
#   --dry-run    Show what would be deleted without actually deleting
#
# Logs:
#   All actions logged to /tmp/telegram_cleanup.log
#
# Cron Integration:
#   Run hourly: 0 * * * * /path/to/cleanup.sh

set -euo pipefail

# Change to workspace root
cd "$(dirname "$0")/../../.." || exit 1

# Parse arguments
DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "🔍 DRY RUN MODE - No files will be deleted"
  echo ""
fi

# Log file
LOG="/tmp/telegram_cleanup.log"

# Helper function to log and print
log_action() {
  local message="$1"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $message" | tee -a "$LOG"
}

# Start cleanup
log_action "═══════════════════════════════════════"
log_action "Cleanup started (dry-run: $DRY_RUN)"

# Counter variables
telegram_messages_removed=0
inbox_removed=0

# 1. Remove old messages from .telegram_messages/ (>24 hours)
if [[ -d ".telegram_messages" ]]; then
  log_action "Checking .telegram_messages/ for files older than 24 hours..."

  while IFS= read -r -d '' file; do
    if [[ "$DRY_RUN" == "true" ]]; then
      log_action "  [DRY RUN] Would remove: $file"
    else
      log_action "  Removing: $file"
      rm -f "$file"
    fi
    ((telegram_messages_removed++))
  done < <(find .telegram_messages -type f -mtime +1 -print0 2>/dev/null)

  if [[ "$telegram_messages_removed" -eq 0 ]]; then
    log_action "  No old messages found in .telegram_messages/"
  else
    log_action "  Total from .telegram_messages/: $telegram_messages_removed file(s)"
  fi
else
  log_action "  .telegram_messages/ directory not found (skipping)"
fi

# 2. Remove old replies from .inbox/ (>1 hour)
if [[ -d ".inbox" ]]; then
  log_action "Checking .inbox/ for files older than 1 hour..."

  while IFS= read -r -d '' file; do
    if [[ "$DRY_RUN" == "true" ]]; then
      log_action "  [DRY RUN] Would remove: $file"
    else
      log_action "  Removing: $file"
      rm -f "$file"
    fi
    ((inbox_removed++))
  done < <(find .inbox -type f -mmin +60 -print0 2>/dev/null)

  if [[ "$inbox_removed" -eq 0 ]]; then
    log_action "  No old replies found in .inbox/"
  else
    log_action "  Total from .inbox/: $inbox_removed file(s)"
  fi
else
  log_action "  .inbox/ directory not found (skipping)"
fi

# 3. Keep all files in .pending/ (active approvals)
if [[ -d ".pending" ]]; then
  pending_count=$(find .pending -type f 2>/dev/null | wc -l)
  log_action "Keeping all $pending_count file(s) in .pending/ (active approvals)"
else
  log_action "  .pending/ directory not found (skipping)"
fi

# Summary
log_action "─────────────────────────────────────────"
log_action "Cleanup complete"
log_action "  .telegram_messages/: $telegram_messages_removed file(s)"
log_action "  .inbox/: $inbox_removed file(s)"
log_action "═══════════════════════════════════════"

# Print summary to stdout
echo ""
echo "📊 Cleanup Summary"
echo "════════════════════════════════════════════"
echo "  .telegram_messages/: $telegram_messages_removed file(s) removed"
echo "  .inbox/: $inbox_removed file(s) removed"
echo "  .pending/: kept (active approvals)"
echo ""
if [[ "$DRY_RUN" == "true" ]]; then
  echo "  ℹ️  This was a dry run - no files were actually deleted"
  echo "  Run without --dry-run to perform cleanup"
fi
echo ""
echo "  Log file: $LOG"
echo ""

exit 0
