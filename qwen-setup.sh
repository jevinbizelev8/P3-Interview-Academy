#!/bin/bash
# Quick setup script for Qwen Code CLI
# Usage: source ./qwen-setup.sh

echo "🚀 Setting up Qwen Code CLI..."

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
fi

# Check if QWEN_API_KEY is available
if [ -z "$QWEN_API_KEY" ]; then
  echo "⚠️  QWEN_API_KEY not found!"
  echo "Please add it to Replit Secrets or .env file"
  return 1
fi

# Map to OpenAI-compatible format
export OPENAI_API_KEY="$QWEN_API_KEY"
export OPENAI_BASE_URL="https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
export OPENAI_MODEL="qwen3-coder-plus"

echo "✅ Qwen Code CLI configured!"
echo "   Base URL: $OPENAI_BASE_URL"
echo "   Model: $OPENAI_MODEL"
echo "   API Key: ${OPENAI_API_KEY:0:10}...****"
echo ""
echo "Ready to use! Try: qwen --version"
echo "Or start interactive: qwen"
