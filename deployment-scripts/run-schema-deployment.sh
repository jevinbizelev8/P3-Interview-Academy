#!/bin/bash
# Schema deployment script for AWS EB

echo "=== Database Schema Deployment Script ==="
echo "Environment: $NODE_ENV"
echo "Database URL: ${DATABASE_URL:0:30}..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Run schema deployment
echo "Deploying database schema..."
npm run db:push

echo "Schema deployment completed!"

# Test database connection
echo "Testing database connection..."
node -e "
const { executeQuery } = require('./dist/db.js');
executeQuery('SELECT version() as db_version')
  .then(result => console.log('Database connected:', result[0].db_version))
  .catch(err => console.error('Database connection failed:', err.message));
"