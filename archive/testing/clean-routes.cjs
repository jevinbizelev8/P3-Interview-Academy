#!/usr/bin/env node

/**
 * Clean Routes Script
 * Removes duplicate voice routes from server/routes.ts
 */

const fs = require('fs');
const path = require('path');

function cleanRoutes() {
  console.log('🧹 Cleaning duplicate voice routes...');
  
  const routesPath = '/home/runner/workspace/server/routes.ts';
  let content = fs.readFileSync(routesPath, 'utf8');
  
  // Find the voice router registration
  const voiceRouterMatch = content.match(/app\.use\('\/api\/voice', voiceServicesRouter\);/);
  if (!voiceRouterMatch) {
    console.log('❌ Voice router registration not found');
    return;
  }
  
  const voiceRouterIndex = voiceRouterMatch.index;
  const voiceRouterLine = content.substring(voiceRouterIndex, content.indexOf('\n', voiceRouterIndex) + 1);
  
  // Find the next section after voice routes
  const nextSectionMatch = content.match(/\n\s*\/\/ ================================\s*\n\s*\/\/ TEST ENDPOINTS FOR SEALION INTEGRATION/);
  if (!nextSectionMatch) {
    console.log('❌ Next section not found');
    return;
  }
  
  const nextSectionIndex = nextSectionMatch.index;
  
  // Extract the part before voice router and after next section
  const beforeVoice = content.substring(0, voiceRouterIndex);
  const afterNextSection = content.substring(nextSectionIndex);
  
  // Create clean content
  const cleanContent = beforeVoice + 
    '  // Voice services routes\n' +
    '  app.use(\'/api/voice\', voiceServicesRouter);\n\n' +
    afterNextSection;
  
  // Write the clean content
  fs.writeFileSync(routesPath, cleanContent);
  console.log('✅ Duplicate voice routes removed');
  console.log('✅ Clean routes file created');
}

cleanRoutes();
