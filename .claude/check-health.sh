#!/bin/bash
# Claude Code Statusline - Health Check Script

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Claude Code Statusline - Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check active script
if [ -f /home/runner/.claude/statusline-command.sh ]; then
  ACTIVE_SIZE=$(stat -c%s /home/runner/.claude/statusline-command.sh)
  echo "✅ Active Script: /home/runner/.claude/statusline-command.sh ($ACTIVE_SIZE bytes)"
else
  echo "❌ Active Script: MISSING (run: ~/workspace/.claude/restore-config.sh)"
fi

# Check backup script
if [ -f /home/runner/workspace/.claude/statusline-command.sh ]; then
  BACKUP_SIZE=$(stat -c%s /home/runner/workspace/.claude/statusline-command.sh)
  echo "✅ Backup Script: ~/workspace/.claude/statusline-command.sh ($BACKUP_SIZE bytes)"
else
  echo "❌ Backup Script: MISSING"
fi

# Check version sync
if [ -f /home/runner/.claude/statusline-command.sh ] && [ -f /home/runner/workspace/.claude/statusline-command.sh ]; then
  ACTIVE_MD5=$(md5sum /home/runner/.claude/statusline-command.sh | cut -d' ' -f1)
  BACKUP_MD5=$(md5sum /home/runner/workspace/.claude/statusline-command.sh | cut -d' ' -f1)
  if [ "$ACTIVE_MD5" = "$BACKUP_MD5" ]; then
    echo "✅ Version Sync: IN SYNC (MD5: ${ACTIVE_MD5:0:8}...)"
  else
    echo "⚠️  Version Sync: OUT OF SYNC"
    echo "   Run: cp ~/.claude/statusline-command.sh ~/workspace/.claude/"
  fi
fi

# Check settings
if [ -f /home/runner/.claude/settings.json ]; then
  echo "✅ Settings: /home/runner/.claude/settings.json"
else
  echo "❌ Settings: MISSING"
fi

# Check data directory
if [ -L /home/runner/.claude/data ]; then
  echo "✅ Data Link: Symlink → ~/workspace/.claude/data"
elif [ -d /home/runner/workspace/.claude/data ]; then
  echo "⚠️  Data: ~/workspace/.claude/data exists but not linked"
else
  echo "❌ Data: MISSING"
fi

# Check state file
if [ -f /home/runner/workspace/.claude/data/usage-stats.json ]; then
  TODAY=$(date +%Y-%m-%d)
  TODAY_COST=$(jq -r ".daily[\"$TODAY\"].cost // 0" ~/workspace/.claude/data/usage-stats.json)
  WEEK=$(date +%Y-W%V)
  WEEK_COST=$(jq -r ".weekly[\"$WEEK\"].cost // 0" ~/workspace/.claude/data/usage-stats.json)
  echo "✅ Usage Data: Today \$$TODAY_COST | Week \$$WEEK_COST"
else
  echo "❌ Usage Data: MISSING"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test statusline
if [ -f /home/runner/.claude/statusline-command.sh ]; then
  echo "Testing statusline output:"
  echo '{"session_id":"test","workspace":{"current_dir":"'$(pwd)'"}}' | /home/runner/.claude/statusline-command.sh
fi
