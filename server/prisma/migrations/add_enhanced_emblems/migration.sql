-- Enhanced Emblem System
-- This migration adds a comprehensive emblem tracking system

-- Create Emblem master table (definitions)
CREATE TABLE IF NOT EXISTS "emblems" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "emoji" TEXT NOT NULL,
  "rarity" TEXT NOT NULL DEFAULT 'common', -- common, rare, epic, legendary
  "category" TEXT, -- productivity, wellness, social, mastery
  "bonusType" TEXT, -- points_multiplier, energy_boost, time_bonus
  "bonusValue" INTEGER NOT NULL DEFAULT 0, -- percentage or flat value
  "unlockCriteria" TEXT NOT NULL, -- JSON with unlock conditions
  "order" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create User-Emblem relationship table
CREATE TABLE IF NOT EXISTS "user_emblems" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "emblemId" TEXT NOT NULL,
  "isUnlocked" BOOLEAN NOT NULL DEFAULT false,
  "unlockedAt" DATETIME,
  "isEquipped" BOOLEAN NOT NULL DEFAULT false,
  "equippedAt" DATETIME,
  "progress" INTEGER NOT NULL DEFAULT 0, -- 0-100
  "metadata" TEXT, -- JSON for additional data
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_emblems_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "user_emblems_emblemId_fkey" FOREIGN KEY ("emblemId") REFERENCES "emblems"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Energy Log table for tracking
CREATE TABLE IF NOT EXISTS "energy_logs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "energyLevel" TEXT NOT NULL, -- LOW, MEDIUM, HIGH, PEAK
  "energyValue" INTEGER NOT NULL, -- 1-10 scale
  "loggedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "source" TEXT NOT NULL DEFAULT 'manual', -- manual, auto_detected, predicted
  "mood" TEXT, -- optional mood emoji
  "notes" TEXT, -- optional user notes
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "energy_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Daily Challenge table
CREATE TABLE IF NOT EXISTS "daily_challenges" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "challengeType" TEXT NOT NULL, -- peak_performance, streak_keeper, task_master
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "targetValue" INTEGER NOT NULL,
  "currentValue" INTEGER NOT NULL DEFAULT 0,
  "rewardEmblemId" TEXT,
  "rewardPoints" INTEGER NOT NULL DEFAULT 100,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  "isCompleted" BOOLEAN NOT NULL DEFAULT false,
  "completedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "daily_challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "daily_challenges_rewardEmblemId_fkey" FOREIGN KEY ("rewardEmblemId") REFERENCES "emblems"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "user_emblems_userId_idx" ON "user_emblems"("userId");
CREATE INDEX IF NOT EXISTS "user_emblems_emblemId_idx" ON "user_emblems"("emblemId");
CREATE INDEX IF NOT EXISTS "user_emblems_isUnlocked_idx" ON "user_emblems"("isUnlocked");
CREATE INDEX IF NOT EXISTS "user_emblems_isEquipped_idx" ON "user_emblems"("isEquipped");
CREATE INDEX IF NOT EXISTS "energy_logs_userId_idx" ON "energy_logs"("userId");
CREATE INDEX IF NOT EXISTS "energy_logs_loggedAt_idx" ON "energy_logs"("loggedAt");
CREATE INDEX IF NOT EXISTS "daily_challenges_userId_idx" ON "daily_challenges"("userId");
CREATE INDEX IF NOT EXISTS "daily_challenges_startDate_idx" ON "daily_challenges"("startDate");

-- Add unique constraint for user-emblem pairs
CREATE UNIQUE INDEX IF NOT EXISTS "user_emblems_userId_emblemId_key" ON "user_emblems"("userId", "emblemId");

