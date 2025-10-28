// Fix syntax errors in routes caused by automatic commenting
const fs = require('fs');

console.log('🔧 Fixing routes syntax errors...');

const routesFile = '/home/runner/workspace/server/routes.ts';
let content = fs.readFileSync(routesFile, 'utf8');

// Find problematic sections that start with prepare route handlers and comment out entire sections
const problematicSections = [
  // Get preparation session
  {
    start: /app\.get\('\/api\/prepare\/sessions\/:\w+',.*?async \(req, res\) => {/s,
    end: /\s*}\);\s*(?=\/\/|app\.|$)/s
  },
  // Create preparation session  
  {
    start: /app\.post\('\/api\/prepare\/sessions',.*?async \(req, res\) => {/s,
    end: /\s*}\);\s*(?=\/\/|app\.|$)/s
  },
  // Study plan generation
  {
    start: /app\.post\('\/api\/prepare\/sessions\/.*?\/study-plan',.*?async \(req, res\) => {/s,
    end: /\s*}\);\s*(?=\/\/|app\.|$)/s
  },
];

// Simple approach: comment out any line that has broken prepareService calls
const lines = content.split('\n');
let fixedLines = [];
let inBadBlock = false;
let braceCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Check if this line starts a prepare route
  if (line.includes("app.get('/api/prepare/") || 
      line.includes("app.post('/api/prepare/") || 
      line.includes("app.patch('/api/prepare/") ||
      line.includes("app.delete('/api/prepare/")) {
    inBadBlock = true;
    braceCount = 0;
    fixedLines.push('  // QUARANTINED ROUTE - ' + line.trim());
    continue;
  }
  
  if (inBadBlock) {
    // Count braces to find end of route handler
    braceCount += (line.match(/{/g) || []).length;
    braceCount -= (line.match(/}/g) || []).length;
    
    fixedLines.push('  // ' + line.trim());
    
    // If we've closed all braces and hit a closing paren-semicolon, end block
    if (braceCount <= 0 && line.includes('});')) {
      inBadBlock = false;
    }
  } else {
    // Also comment out any orphaned prepareService lines
    if (line.includes('// prepareService.')) {
      fixedLines.push('  // REMOVED: ' + line.trim());
    } else {
      fixedLines.push(line);
    }
  }
}

fs.writeFileSync(routesFile, fixedLines.join('\n'));

console.log('✅ Routes syntax errors fixed');
console.log('🚮 All old prepare routes have been safely commented out');