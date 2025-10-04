#!/usr/bin/env node

/**
 * Backfill Energy Reset Dates Script
 * 
 * Sets lastEnergyResetLocalDate for all existing users to today
 * to avoid mass snapshotted resets tonight
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function backfillEnergyResetDates() {
  console.log('🔄 Starting energy reset dates backfill...');
  
  try {
    // Get all users without lastEnergyResetLocalDate set
    const usersWithoutResetDate = await prisma.user.findMany({
      where: {
        lastEnergyResetLocalDate: null
      },
      select: {
        id: true,
        name: true,
        email: true,
        timezone: true
      }
    });
    
    console.log(`📊 Found ${usersWithoutResetDate.length} users without reset date`);
    
    if (usersWithoutResetDate.length === 0) {
      console.log('✅ All users already have reset dates set');
      return;
    }
    
    // Set lastEnergyResetLocalDate to today for all users
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    const result = await prisma.user.updateMany({
      where: {
        lastEnergyResetLocalDate: null
      },
      data: {
        lastEnergyResetLocalDate: today
      }
    });
    
    console.log(`✅ Updated ${result.count} users with reset date: ${today.toISOString()}`);
    
    // Verify the update
    const remainingUsers = await prisma.user.count({
      where: {
        lastEnergyResetLocalDate: null
      }
    });
    
    if (remainingUsers === 0) {
      console.log('🎉 All users now have energy reset dates set');
    } else {
      console.log(`⚠️  ${remainingUsers} users still missing reset dates`);
    }
    
  } catch (error) {
    console.error('❌ Error during backfill:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  try {
    await backfillEnergyResetDates();
    console.log('✅ Backfill completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('💥 Backfill failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
