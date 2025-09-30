// Temporary script to add schema deployment endpoint
// This will be added to the production server temporarily

const express = require('express');
const { execSync } = require('child_process');

// Add this to the existing routes in production
function addSchemaDeploymentEndpoint(app) {
  app.post('/api/admin/deploy-schema', async (req, res) => {
    try {
      console.log('Starting schema deployment...');
      console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

      // Run schema deployment
      const output = execSync('npm run db:push', {
        stdio: 'pipe',
        encoding: 'utf8',
        env: { ...process.env }
      });

      console.log('Schema deployment output:', output);

      res.json({
        success: true,
        message: 'Schema deployment completed successfully',
        output: output
      });
    } catch (error) {
      console.error('Schema deployment failed:', error);
      res.status(500).json({
        success: false,
        message: 'Schema deployment failed',
        error: error.message,
        output: error.stdout || error.stderr
      });
    }
  });
}

module.exports = { addSchemaDeploymentEndpoint };