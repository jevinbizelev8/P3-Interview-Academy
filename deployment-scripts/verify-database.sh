#!/bin/bash

# P³ Interview Academy - Database Verification Wrapper Script
# Simple wrapper to run the Node.js database verification script

set -e

echo "P³ Interview Academy - Database Verification"
echo "============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "ERROR: package.json not found. Run this script from the project root directory."
    exit 1
fi

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not found. Please install Node.js first."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable not set"
    echo ""
    echo "Set it with:"
    echo "  export DATABASE_URL='postgresql://username:password@host:port/database'"
    echo ""
    echo "Or create a .env file with:"
    echo "  DATABASE_URL=postgresql://username:password@host:port/database"
    exit 1
fi

echo "Running database verification..."
echo ""

# Run the Node.js verification script
node deployment-scripts/verify-database.js

exit_code=$?

if [ $exit_code -eq 0 ]; then
    echo ""
    echo "✅ Database verification completed successfully!"
else
    echo ""
    echo "❌ Database verification failed!"
    echo "Please fix the issues above before proceeding with deployment."
fi

exit $exit_code