import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function seedEmblems() {
  console.log('🌱 Starting emblem seed...');

  // Read emblem data
  const emblemsPath = path.join(__dirname, '../prisma/seeds/emblems-seed.json');
  const emblemsData = JSON.parse(fs.readFileSync(emblemsPath, 'utf-8'));

  console.log(`📦 Found ${emblemsData.length} emblems to seed`);

  // Seed emblems
  for (const emblem of emblemsData) {
    const existing = await prisma.$queryRaw`
      SELECT * FROM emblems WHERE id = ${emblem.id}
    ` as any[];

    if (existing.length === 0) {
      await prisma.$executeRaw`
        INSERT INTO emblems (
          id, name, description, emoji, rarity, category, 
          bonusType, bonusValue, unlockCriteria, "order", 
          isActive, createdAt, updatedAt
        ) VALUES (
          ${emblem.id},
          ${emblem.name},
          ${emblem.description},
          ${emblem.emoji},
          ${emblem.rarity},
          ${emblem.category},
          ${emblem.bonusType},
          ${emblem.bonusValue},
          ${emblem.unlockCriteria},
          ${emblem.order},
          true,
          datetime('now'),
          datetime('now')
        )
      `;
      console.log(`✅ Seeded: ${emblem.emoji} ${emblem.name} (${emblem.rarity})`);
    } else {
      console.log(`⏭️  Skipped: ${emblem.name} (already exists)`);
    }
  }

  console.log('');
  console.log('📊 Emblem Summary:');
  const counts = await prisma.$queryRaw`
    SELECT rarity, COUNT(*) as count 
    FROM emblems 
    GROUP BY rarity
    ORDER BY 
      CASE rarity
        WHEN 'common' THEN 1
        WHEN 'rare' THEN 2
        WHEN 'epic' THEN 3
        WHEN 'legendary' THEN 4
      END
  ` as any[];

  counts.forEach((row: any) => {
    const emoji = row.rarity === 'common' ? '⚪' : 
                  row.rarity === 'rare' ? '🔵' : 
                  row.rarity === 'epic' ? '🟣' : '🟡';
    console.log(`  ${emoji} ${row.rarity.toUpperCase()}: ${row.count} emblems`);
  });

  console.log('');
  console.log('✨ Emblem seed complete!');
}

seedEmblems()
  .catch((error) => {
    console.error('❌ Error seeding emblems:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

