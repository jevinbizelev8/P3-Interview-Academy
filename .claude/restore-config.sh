#!/bin/bash
# Claude Code Statusline - Restoration Script for Replit
# Run this after container restarts to restore statusline configuration

set -e

echo "🔧 Restoring Claude Code statusline configuration..."
echo ""

# Create directories
mkdir -p /home/runner/.claude/data

# Copy configuration
cp /home/runner/workspace/.claude/statusline-command.sh /home/runner/.claude/statusline-command.sh
chmod +x /home/runner/.claude/statusline-command.sh

# Copy settings if needed
if [ ! -f /home/runner/.claude/settings.json ]; then
  cp /home/runner/workspace/.claude/settings.json /home/runner/.claude/settings.json 2>/dev/null || \
    echo '{"alwaysThinkingEnabled":true,"statusLine":{"type":"command","command":"/home/runner/.claude/statusline-command.sh"}}' > /home/runner/.claude/settings.json
fi

# Link data directory
if [ ! -L /home/runner/.claude/data ]; then
  rm -rf /home/runner/.claude/data 2>/dev/null || true
  ln -s /home/runner/workspace/.claude/data /home/runner/.claude/data
fi

echo "✅ Statusline configuration restored!"
echo ""
echo "To verify, run:"
echo "  ~/workspace/.claude/check-health.sh"
