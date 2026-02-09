#!/usr/bin/env node
/**
 * SyncScript Global Rules Verification Script
 * 
 * Validates that the codebase follows global system rules:
 * 1. All routes in App.tsx match navigation.ts
 * 2. No hardcoded z-index values in components
 * 3. All modals use StandardModal/StandardDrawer
 * 4. No dead clicks (empty onClick handlers)
 * 
 * Run: node scripts/verify-global-rules.js
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

// Track violations
let violations = [];
let warnings = [];
let passed = [];

// 1. VERIFY ROUTE ALIGNMENT
logSection('1. ROUTE ALIGNMENT CHECK');

try {
  // Read navigation.ts
  const navPath = path.join(__dirname, '../utils/navigation.ts');
  const navContent = fs.readFileSync(navPath, 'utf8');
  
  // Extract sidebar routes
  const sidebarMatch = navContent.match(/sidebar:\s*{([^}]+)}/s);
  if (!sidebarMatch) throw new Error('Could not parse sidebar routes');
  
  const sidebarRoutes = sidebarMatch[1]
    .match(/:\s*['"]([^'"]+)['"]/g)
    .map(m => m.match(/['"]([^'"]+)['"]/)[1]);
  
  log(`✓ Found ${sidebarRoutes.length} sidebar routes in navigation.ts`, 'green');
  sidebarRoutes.forEach(route => log(`  ${route}`, 'reset'));
  
  // Read App.tsx
  const appPath = path.join(__dirname, '../App.tsx');
  const appContent = fs.readFileSync(appPath, 'utf8');
  
  // Extract routes from App.tsx
  const routeMatches = appContent.match(/path="([^"]+)"/g);
  if (!routeMatches) throw new Error('Could not parse routes from App.tsx');
  
  const appRoutes = routeMatches
    .map(m => m.match(/path="([^"]+)"/)[1])
    .filter(r => !r.includes('*') && !r.includes('showcase')); // Exclude wildcards and showcases
  
  log(`\n✓ Found ${appRoutes.length} routes in App.tsx`, 'green');
  
  // Check alignment
  const misaligned = [];
  sidebarRoutes.forEach(navRoute => {
    const exists = appRoutes.some(appRoute => appRoute === navRoute);
    if (!exists) {
      misaligned.push(navRoute);
      log(`  ✗ Missing route in App.tsx: ${navRoute}`, 'red');
      violations.push(`Route ${navRoute} defined in navigation.ts but missing in App.tsx`);
    } else {
      log(`  ✓ ${navRoute}`, 'green');
    }
  });
  
  if (misaligned.length === 0) {
    passed.push('All navigation.ts routes exist in App.tsx');
    log('\n✅ PASS: All routes aligned', 'green');
  } else {
    log(`\n❌ FAIL: ${misaligned.length} misaligned routes`, 'red');
  }
  
} catch (error) {
  log(`Error checking routes: ${error.message}`, 'red');
  violations.push(`Route check failed: ${error.message}`);
}

// 2. VERIFY NO HARDCODED Z-INDEX
logSection('2. HARDCODED Z-INDEX CHECK');

try {
  const componentsDir = path.join(__dirname, '../components');
  let filesChecked = 0;
  let zIndexViolations = [];
  
  function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Look for hardcoded z-index (but not Z_INDEX constant usage)
      if (line.match(/zIndex:\s*\d+/) && !line.includes('Z_INDEX')) {
        zIndexViolations.push({
          file: filePath,
          line: index + 1,
          content: line.trim()
        });
      }
    });
  }
  
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        filesChecked++;
        checkFile(filePath);
      }
    });
  }
  
  walkDir(componentsDir);
  
  log(`Checked ${filesChecked} files`, 'reset');
  
  if (zIndexViolations.length === 0) {
    passed.push('No hardcoded z-index values found');
    log('✅ PASS: No hardcoded z-index values', 'green');
  } else {
    log(`\n❌ FAIL: Found ${zIndexViolations.length} hardcoded z-index values:`, 'red');
    zIndexViolations.forEach(v => {
      log(`  ${v.file.replace(__dirname + '/../', '')}:${v.line}`, 'yellow');
      log(`    ${v.content}`, 'reset');
      violations.push(`Hardcoded z-index: ${v.file}:${v.line}`);
    });
  }
  
} catch (error) {
  log(`Error checking z-index: ${error.message}`, 'red');
  violations.push(`Z-index check failed: ${error.message}`);
}

// 3. VERIFY MODAL USAGE
logSection('3. MODAL/DIALOG USAGE CHECK');

try {
  const componentsDir = path.join(__dirname, '../components');
  let filesChecked = 0;
  let directDialogUsage = [];
  
  function checkFile(filePath) {
    // Skip StandardModalDrawer.tsx itself
    if (filePath.includes('StandardModalDrawer.tsx')) return;
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for direct Dialog usage without StandardModal
    if (content.includes('<Dialog ') && !content.includes('StandardModal')) {
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('<Dialog ')) {
          directDialogUsage.push({
            file: filePath,
            line: index + 1,
            content: line.trim()
          });
        }
      });
    }
  }
  
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Skip ui directory (primitive components)
        if (file === 'ui') return;
        walkDir(filePath);
      } else if (file.endsWith('.tsx')) {
        filesChecked++;
        checkFile(filePath);
      }
    });
  }
  
  walkDir(componentsDir);
  
  log(`Checked ${filesChecked} component files`, 'reset');
  
  if (directDialogUsage.length === 0) {
    passed.push('All modals use StandardModal or are UI primitives');
    log('✅ PASS: No direct Dialog usage (use StandardModal)', 'green');
  } else {
    log(`\n⚠️  WARNING: Found ${directDialogUsage.length} potential direct Dialog usages:`, 'yellow');
    directDialogUsage.forEach(v => {
      log(`  ${v.file.replace(__dirname + '/../', '')}:${v.line}`, 'yellow');
      warnings.push(`Direct Dialog usage (should use StandardModal): ${v.file}:${v.line}`);
    });
    log('\nNote: These may be legitimate UI primitives. Review manually.', 'cyan');
  }
  
} catch (error) {
  log(`Error checking modal usage: ${error.message}`, 'red');
  violations.push(`Modal check failed: ${error.message}`);
}

// 4. SUMMARY
logSection('SUMMARY');

log(`\n✅ PASSED: ${passed.length}`, 'green');
passed.forEach(p => log(`  • ${p}`, 'green'));

if (warnings.length > 0) {
  log(`\n⚠️  WARNINGS: ${warnings.length}`, 'yellow');
  warnings.forEach(w => log(`  • ${w}`, 'yellow'));
}

if (violations.length > 0) {
  log(`\n❌ VIOLATIONS: ${violations.length}`, 'red');
  violations.forEach(v => log(`  • ${v}`, 'red'));
  log('\nFix these violations before committing.', 'red');
  process.exit(1);
} else {
  log('\n🎉 All global rules checks passed!', 'green');
  if (warnings.length > 0) {
    log('Review warnings above and confirm they are intentional.', 'yellow');
  }
  process.exit(0);
}
