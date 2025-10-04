#!/usr/bin/env node

/**
 * Pre-flight Verification Script
 * 
 * This script verifies that all PF requirements are met:
 * PF1: Outbox delivery
 * PF2: Energy daily reset  
 * PF3: Idempotency
 * PF4: Module boundaries
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Starting Pre-flight Verification...\n');

let allPassed = true;

function check(description, testFn) {
  try {
    const result = testFn();
    if (result) {
      console.log(`✅ ${description}`);
      return true;
    } else {
      console.log(`❌ ${description}`);
      allPassed = false;
      return false;
    }
  } catch (error) {
    console.log(`❌ ${description} - Error: ${error.message}`);
    allPassed = false;
    return false;
  }
}

// PF1: Outbox delivery
console.log('📦 PF1: Outbox delivery verification...');
check('Outbox model has unique eventId constraint', () => {
  const schema = fs.readFileSync('server/prisma/schema.prisma', 'utf8');
  return schema.includes('eventId       String   @unique');
});

check('EventDelivery has unique (eventId, target) constraint', () => {
  const schema = fs.readFileSync('server/prisma/schema.prisma', 'utf8');
  return schema.includes('@@unique([eventId, target])');
});

check('EventDispatcher worker exists', () => {
  return fs.existsSync('server/src/workers/eventDispatcher.ts');
});

check('EventService has publishEvent function', () => {
  const eventService = fs.readFileSync('server/src/services/eventService.ts', 'utf8');
  return eventService.includes('export async function publishEvent');
});

// PF2: Energy daily reset
console.log('\n⚡ PF2: Energy daily reset verification...');
check('UserEnergyDailySnapshot has unique (userId, snapshotDate) constraint', () => {
  const schema = fs.readFileSync('server/prisma/schema.prisma', 'utf8');
  return schema.includes('@@unique([userId, snapshotDate])');
});

check('User model has lastEnergyResetLocalDate field', () => {
  const schema = fs.readFileSync('server/prisma/schema.prisma', 'utf8');
  return schema.includes('lastEnergyResetLocalDate DateTime?');
});

check('DailyEnergyResetService exists', () => {
  return fs.existsSync('server/src/services/dailyEnergyResetService.ts');
});

check('DailyEnergyResetCron job exists', () => {
  return fs.existsSync('server/src/jobs/dailyEnergyResetCron.ts');
});

check('UserEnergyProfile has epToday field', () => {
  const schema = fs.readFileSync('server/prisma/schema.prisma', 'utf8');
  return schema.includes('epToday           Int      @default(0)');
});

// PF3: Idempotency
console.log('\n🔄 PF3: Idempotency verification...');
check('IdempotencyKey model exists', () => {
  const schema = fs.readFileSync('server/prisma/schema.prisma', 'utf8');
  return schema.includes('model IdempotencyKey');
});

check('IdempotencyService exists', () => {
  return fs.existsSync('server/src/services/idempotencyService.ts');
});

check('Calendar write endpoints have idempotency middleware', () => {
  const calendarRoutes = fs.readFileSync('server/src/routes/calendar.ts', 'utf8');
  return calendarRoutes.includes('idempotencyMiddleware(\'calendar-write\')');
});

check('Scripts apply endpoint has idempotency middleware', () => {
  const scriptsRoutes = fs.readFileSync('server/src/routes/scripts.ts', 'utf8');
  return scriptsRoutes.includes('idempotencyMiddleware(\'script-apply\')');
});

check('Export create endpoint has idempotency middleware', () => {
  const exportRoutes = fs.readFileSync('server/src/routes/export.ts', 'utf8');
  return exportRoutes.includes('idempotencyMiddleware(\'export-generate\')');
});

// PF4: Module boundaries
console.log('\n🏗️ PF4: Module boundaries verification...');
check('ESLint boundaries configuration exists', () => {
  return fs.existsSync('server/.eslintrc.boundaries.js');
});

check('Domain packages exist', () => {
  const packages = [
    'packages/shared-kernel/src/index.ts',
    'packages/planning-core/src/index.ts',
    'packages/scripts/src/index.ts',
    'packages/budgeting/src/index.ts',
    'packages/gamification/src/index.ts',
    'packages/collab/src/index.ts',
    'packages/exports/src/index.ts'
  ];
  
  return packages.every(pkg => fs.existsSync(pkg));
});

check('TypeScript project references configured', () => {
  return fs.existsSync('tsconfig.packages.json');
});

check('Energy-Gamification adapter exists', () => {
  return fs.existsSync('server/src/adapters/energyGamificationAdapter.ts');
});

check('CI boundaries workflow exists', () => {
  return fs.existsSync('.github/workflows/boundaries.yml');
});

// Build verification
console.log('\n🔨 Build verification...');
check('Server builds successfully', () => {
  try {
    execSync('cd server && npm run build', { stdio: 'pipe' });
    return true;
  } catch (error) {
    console.log('Build error:', error.message);
    return false;
  }
});

check('Client builds successfully', () => {
  try {
    execSync('cd client && npm run build', { stdio: 'pipe' });
    return true;
  } catch (error) {
    console.log('Build error:', error.message);
    return false;
  }
});

// Summary
console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('🎉 All PF requirements verified successfully!');
  console.log('✅ Ready to proceed to Stage 2');
  process.exit(0);
} else {
  console.log('❌ Some PF requirements failed verification');
  console.log('🔧 Fix the issues above before proceeding');
  process.exit(1);
}
