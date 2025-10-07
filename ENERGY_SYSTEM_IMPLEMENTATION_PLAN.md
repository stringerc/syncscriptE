# 🔥 Energy Analysis & Emblem System - Complete Implementation Plan

**Document Version:** 1.0  
**Created:** October 6, 2025  
**Status:** Planning Phase

---

## 📋 **Table of Contents**

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Database Schema](#database-schema)
4. [Backend Architecture](#backend-architecture)
5. [API Endpoints](#api-endpoints)
6. [Frontend Components](#frontend-components)
7. [Page Designs](#page-designs)
8. [Integration Points](#integration-points)
9. [Emblem System Details](#emblem-system-details)
10. [AI Integration](#ai-integration)
11. [Visual Design System](#visual-design-system)
12. [Implementation Timeline](#implementation-timeline)
13. [Testing Strategy](#testing-strategy)
14. [Success Metrics](#success-metrics)

---

## 📊 **Executive Summary**

The Energy Analysis & Emblem System is a comprehensive gamification feature that:

- **Tracks user energy levels** throughout the day (LOW, MEDIUM, HIGH, PEAK)
- **Suggests optimal tasks** based on current energy state
- **Rewards users with collectible emblems** for achieving energy-related milestones
- **Provides AI-powered insights** about productivity patterns
- **Integrates with existing task/achievement systems** for seamless UX

**Key Benefits:**
- 📈 Increased user engagement through gamification
- 🎯 Better task-energy matching → Higher productivity
- 🏆 Collectible emblems → Long-term retention
- 🤖 AI insights → Personalized optimization
- ⚡ Energy awareness → Improved work-life balance

---

## 🏗️ **System Overview**

### **Core Components:**

```
Energy System
├── Energy Tracking
│   ├── Manual energy input (user sets their level)
│   ├── Auto-detection (based on task completion patterns)
│   └── AI prediction (ML model based on history)
│
├── Energy Analysis
│   ├── Historical tracking (7/30/90 day views)
│   ├── Pattern recognition (peak hours, low hours)
│   ├── AI-generated insights
│   └── Energy-task correlation analysis
│
├── Emblem System
│   ├── Emblem collection (unlock via achievements)
│   ├── Rarity tiers (Common, Rare, Epic, Legendary)
│   ├── Equip system (one active emblem)
│   ├── Bonus effects (points multipliers, energy boosts)
│   └── Progress tracking (toward next emblem)
│
└── Task Integration
    ├── Suggested energy level per task
    ├── Energy at completion tracking
    ├── Energy-based task filtering
    └── Emblem bonuses applied to task rewards
```

---

## 🗄️ **Database Schema**

### **1. EnergyLevel Table**

```prisma
model EnergyLevel {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  level             EnergyLevelEnum  // LOW, MEDIUM, HIGH, PEAK
  timestamp         DateTime  @default(now())
  
  // Metadata
  source            EnergySourceEnum  // MANUAL, AUTO_DETECTED, AI_PREDICTED
  confidence        Float?    // 0.0 - 1.0 (for AI predictions)
  contextData       Json?     // Additional context (location, time of day, etc.)
  
  // Associations
  taskCompletedId   String?   // If triggered by task completion
  taskCompleted     Task?     @relation(fields: [taskCompletedId], references: [id])
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@index([userId, timestamp])
  @@index([userId, level])
}

enum EnergyLevelEnum {
  LOW      // Tired, low focus (best for simple tasks)
  MEDIUM   // Normal state (standard tasks)
  HIGH     // Energized, focused (complex tasks)
  PEAK     // Optimal state (hardest tasks, creative work)
}

enum EnergySourceEnum {
  MANUAL         // User manually set their energy
  AUTO_DETECTED  // System detected based on behavior
  AI_PREDICTED   // AI model predicted based on patterns
}
```

### **2. EnergyEmblem Table**

```prisma
model EnergyEmblem {
  id                  String   @id @default(cuid())
  
  // Basic Info
  name                String   @unique
  description         String
  loreText            String?  // Optional flavor text
  
  // Visual
  iconEmoji           String   // Emoji representation (🔥, 🌊, ⛰️)
  iconUrl             String?  // Optional custom icon URL
  rarity              EmblemRarityEnum
  colorPrimary        String   // Hex color for primary
  colorSecondary      String   // Hex color for gradient
  
  // Unlock Requirements
  unlockRequirements  Json     // Detailed requirements (see below)
  
  // Effects & Bonuses
  bonusEffects        Json     // Active effects when equipped
  
  // Metadata
  category            String   // "Productivity", "Consistency", "Mastery", etc.
  tier                Int      // Progression tier (1-10)
  isSystem            Boolean  @default(true)  // System emblem vs custom
  isEnabled           Boolean  @default(true)  // Can be disabled
  
  // Stats
  totalUnlocks        Int      @default(0)
  
  // Relations
  userEmblems         UserEmblem[]
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  @@index([rarity])
  @@index([category])
}

enum EmblemRarityEnum {
  COMMON    // Gray - Easy to unlock
  RARE      // Blue - Moderate difficulty
  EPIC      // Purple - Challenging
  LEGENDARY // Gold - Very difficult
}
```

**Unlock Requirements JSON Structure:**
```json
{
  "type": "AND",  // Can be AND, OR
  "conditions": [
    {
      "metric": "tasksCompletedAtEnergy",
      "energyLevel": "PEAK",
      "value": 100,
      "operator": ">=",
      "description": "Complete 100 tasks at PEAK energy"
    },
    {
      "metric": "energyStreak",
      "energyLevel": "HIGH",
      "value": 7,
      "operator": ">=",
      "description": "Maintain HIGH energy for 7 consecutive days"
    },
    {
      "metric": "totalPoints",
      "value": 5000,
      "operator": ">=",
      "description": "Earn 5000 total points"
    }
  ]
}
```

**Bonus Effects JSON Structure:**
```json
{
  "pointsMultiplier": 1.25,           // 25% more points
  "energyBoost": 10,                  // +10% energy meter
  "autoEnergyDetection": true,        // Enable auto-detection
  "taskCompletionBonus": 50,          // Extra points per task
  "streakProtection": 1,              // Forgive 1 missed day
  "customEffect": "phoenixRevive"     // Special effects
}
```

### **3. UserEmblem Table**

```prisma
model UserEmblem {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  emblemId    String
  emblem      EnergyEmblem @relation(fields: [emblemId], references: [id], onDelete: Cascade)
  
  // Status
  isEquipped  Boolean  @default(false)
  
  // Usage Stats
  equippedAt  DateTime?
  timesEquipped Int    @default(0)
  totalBonusPointsEarned Float @default(0)
  
  // Unlock Info
  unlockedAt  DateTime @default(now())
  unlockSource String?  // Achievement, purchase, gift, etc.
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([userId, emblemId])
  @@index([userId, isEquipped])
}
```

### **4. Update Existing Tables**

**Task Table Updates:**
```prisma
model Task {
  // ... existing fields ...
  
  // NEW: Energy integration
  suggestedEnergyLevel    EnergyLevelEnum?  // AI-suggested optimal energy
  completedAtEnergyLevel  EnergyLevelEnum?  // Energy when task was completed
  energyPoints            Int               @default(0)  // Bonus points from energy
  
  // Relations
  energyLevels            EnergyLevel[]     // Energy records associated with this task
}
```

**User Table Updates:**
```prisma
model User {
  // ... existing fields ...
  
  // NEW: Energy & emblem relations
  energyLevels      EnergyLevel[]
  userEmblems       UserEmblem[]
  currentEmblemId   String?
  currentEmblem     UserEmblem? @relation(fields: [currentEmblemId], references: [id])
}
```

**Achievement Table Updates:**
```prisma
model Achievement {
  // ... existing fields ...
  
  // NEW: Emblem rewards
  rewardEmblemId    String?
  rewardEmblem      EnergyEmblem? @relation(fields: [rewardEmblemId], references: [id])
}
```

---

## 🔧 **Backend Architecture**

### **Service Layer**

#### **1. EnergyTrackingService**
```typescript
// services/energyTrackingService.ts

class EnergyTrackingService {
  // Record energy level
  async recordEnergy(userId: string, level: EnergyLevelEnum, source: EnergySourceEnum): Promise<EnergyLevel>
  
  // Get current energy
  async getCurrentEnergy(userId: string): Promise<EnergyLevel | null>
  
  // Get energy history
  async getEnergyHistory(userId: string, days: number): Promise<EnergyLevel[]>
  
  // Auto-detect energy based on behavior
  async autoDetectEnergy(userId: string): Promise<EnergyLevelEnum>
  
  // Get energy statistics
  async getEnergyStats(userId: string, timeRange: 'week' | 'month' | 'all'): Promise<EnergyStats>
  
  // Get peak/low hours
  async getEnergyPatterns(userId: string): Promise<{
    peakHours: number[]      // Hours of day when usually HIGH/PEAK
    lowHours: number[]       // Hours when usually LOW
    averageByDayOfWeek: Record<string, number>
  }>
}

interface EnergyStats {
  averageLevel: number           // 0-3 scale
  peakPercentage: number         // % time at PEAK
  highPercentage: number         // % time at HIGH
  mediumPercentage: number       // % time at MEDIUM
  lowPercentage: number          // % time at LOW
  totalRecords: number
  streakDays: number             // Days with at least one HIGH/PEAK
  mostCommonLevel: EnergyLevelEnum
}
```

#### **2. EmblemService**
```typescript
// services/emblemService.ts

class EmblemService {
  // Get all available emblems
  async getAvailableEmblems(userId?: string): Promise<EnergyEmblem[]>
  
  // Get user's emblem inventory
  async getUserEmblems(userId: string): Promise<UserEmblem[]>
  
  // Check unlock requirements
  async checkUnlockRequirements(userId: string, emblemId: string): Promise<{
    canUnlock: boolean
    progress: UnlockProgress
    missingRequirements: string[]
  }>
  
  // Unlock emblem
  async unlockEmblem(userId: string, emblemId: string, source: string): Promise<UserEmblem>
  
  // Equip emblem
  async equipEmblem(userId: string, emblemId: string): Promise<void>
  
  // Unequip emblem
  async unequipEmblem(userId: string): Promise<void>
  
  // Calculate active bonuses
  async getActiveEmblemBonuses(userId: string): Promise<EmblemBonuses>
  
  // Check all users' emblem unlocks (run after task completion)
  async checkPendingUnlocks(userId: string): Promise<EnergyEmblem[]>
}

interface UnlockProgress {
  emblemId: string
  requirements: RequirementProgress[]
  overallProgress: number  // 0-100
}

interface RequirementProgress {
  description: string
  current: number
  required: number
  progress: number  // 0-100
  isMet: boolean
}

interface EmblemBonuses {
  pointsMultiplier: number
  energyBoost: number
  autoEnergyDetection: boolean
  taskCompletionBonus: number
  streakProtection: number
  specialEffects: string[]
}
```

#### **3. EnergyAIService**
```typescript
// services/energyAIService.ts

class EnergyAIService {
  // Predict energy level based on patterns
  async predictEnergy(userId: string, timestamp: Date): Promise<{
    predictedLevel: EnergyLevelEnum
    confidence: number
    reasoning: string
  }>
  
  // Generate energy insights
  async generateInsights(userId: string): Promise<EnergyInsight[]>
  
  // Suggest tasks for current energy
  async suggestTasksForEnergy(userId: string, energyLevel: EnergyLevelEnum): Promise<Task[]>
  
  // Optimize schedule based on energy patterns
  async optimizeSchedule(userId: string, tasks: Task[]): Promise<{
    optimizedTasks: Task[]
    reasoning: string
    expectedProductivityGain: number
  }>
}

interface EnergyInsight {
  id: string
  type: 'pattern' | 'recommendation' | 'achievement' | 'warning'
  title: string
  description: string
  actionable: boolean
  actionText?: string
  actionUrl?: string
  priority: 'low' | 'medium' | 'high'
  icon: string
}
```

---

## 🌐 **API Endpoints**

### **Energy Management**

```typescript
// GET /api/energy/current
Response: {
  data: {
    level: "HIGH",
    timestamp: "2025-10-06T10:30:00Z",
    source: "MANUAL",
    confidence: 1.0
  }
}

// POST /api/energy/update
Request: {
  level: "PEAK",
  source: "MANUAL"
}
Response: {
  data: {
    energyLevel: EnergyLevel,
    newUnlockedEmblems: EnergyEmblem[]  // Any emblems unlocked by this update
  }
}

// GET /api/energy/history?days=7
Response: {
  data: {
    history: EnergyLevel[],
    stats: EnergyStats,
    patterns: EnergyPatterns
  }
}

// GET /api/energy/insights
Response: {
  data: {
    insights: EnergyInsight[],
    suggestedTasks: Task[],
    optimalSchedule: OptimizedSchedule
  }
}

// POST /api/energy/auto-detect
Response: {
  data: {
    detectedLevel: "HIGH",
    confidence: 0.85,
    reasoning: "Completed 3 complex tasks in the last hour"
  }
}
```

### **Emblem Management**

```typescript
// GET /api/emblems/available
Response: {
  data: {
    emblems: EnergyEmblem[],
    categories: string[],
    rarities: string[]
  }
}

// GET /api/emblems/inventory
Response: {
  data: {
    userEmblems: UserEmblem[],
    equippedEmblem: UserEmblem | null,
    totalUnlocked: number,
    totalAvailable: number,
    activeBonuses: EmblemBonuses
  }
}

// GET /api/emblems/:emblemId/progress
Response: {
  data: {
    emblem: EnergyEmblem,
    isUnlocked: boolean,
    progress: UnlockProgress,
    estimatedUnlockDate: Date | null
  }
}

// POST /api/emblems/:emblemId/unlock
Response: {
  data: {
    userEmblem: UserEmblem,
    message: "Congratulations! You unlocked Phoenix Flame!",
    newAchievements: Achievement[]  // Any achievements triggered
  }
}

// POST /api/emblems/:emblemId/equip
Response: {
  data: {
    equippedEmblem: UserEmblem,
    activeBonuses: EmblemBonuses,
    previousEmblem: UserEmblem | null
  }
}

// DELETE /api/emblems/unequip
Response: {
  data: {
    message: "Emblem unequipped",
    previousBonuses: EmblemBonuses
  }
}

// GET /api/emblems/check-unlocks
Response: {
  data: {
    newlyUnlocked: EnergyEmblem[],
    nearlyUnlocked: {
      emblem: EnergyEmblem,
      progress: number
    }[]
  }
}
```

### **Energy-Task Integration**

```typescript
// GET /api/tasks/by-energy?level=HIGH
Response: {
  data: {
    recommendedTasks: Task[],
    reasoning: "These tasks match your current HIGH energy level"
  }
}

// POST /api/tasks/:taskId/complete
Request: {
  completedAtEnergyLevel: "PEAK"
}
Response: {
  data: {
    task: Task,
    energyBonus: 50,        // Bonus points for energy match
    newEnergyLevel: EnergyLevel,
    newUnlockedEmblems: EnergyEmblem[]
  }
}
```

---

## 🎨 **Frontend Components**

### **Energy Components**

#### **1. EnergyMeter.tsx**
```typescript
// components/energy/EnergyMeter.tsx

interface EnergyMeterProps {
  currentLevel: EnergyLevelEnum
  onLevelChange?: (level: EnergyLevelEnum) => void
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  showLabel?: boolean
}

// Visual: Circular progress meter with gradient colors
// LOW: Red ring
// MEDIUM: Yellow ring
// HIGH: Green ring
// PEAK: Purple/gold animated ring

<EnergyMeter 
  currentLevel="HIGH"
  onLevelChange={updateEnergy}
  size="lg"
  interactive={true}
  showLabel={true}
/>
```

#### **2. EnergySelector.tsx**
```typescript
// components/energy/EnergySelector.tsx

interface EnergySelectorProps {
  currentLevel: EnergyLevelEnum
  onSelect: (level: EnergyLevelEnum) => void
  variant?: 'buttons' | 'dropdown' | 'slider'
}

// Variants:
// - buttons: Four buttons (LOW, MEDIUM, HIGH, PEAK)
// - dropdown: Select dropdown
// - slider: Visual slider with emoji indicators

<EnergySelector 
  currentLevel="MEDIUM"
  onSelect={handleEnergyChange}
  variant="buttons"
/>
```

#### **3. EnergyHistoryChart.tsx**
```typescript
// components/energy/EnergyHistoryChart.tsx

interface EnergyHistoryChartProps {
  history: EnergyLevel[]
  timeRange: '7d' | '30d' | '90d'
  onTimeRangeChange?: (range: string) => void
}

// Visual: Line chart with color-coded energy levels
// X-axis: Time
// Y-axis: Energy level (0-3 scale)
// Color zones: Red (LOW), Yellow (MEDIUM), Green (HIGH), Purple (PEAK)

<EnergyHistoryChart 
  history={energyHistory}
  timeRange="7d"
/>
```

#### **4. EnergyInsightsCard.tsx**
```typescript
// components/energy/EnergyInsightsCard.tsx

interface EnergyInsightsCardProps {
  insights: EnergyInsight[]
  loading?: boolean
}

// Visual: Card with AI-generated insights
// - Icon-based insight categories
// - Actionable recommendations
// - Click to view details or take action

<EnergyInsightsCard 
  insights={aiInsights}
/>
```

#### **5. TaskEnergyBadge.tsx**
```typescript
// components/energy/TaskEnergyBadge.tsx

interface TaskEnergyBadgeProps {
  suggestedLevel: EnergyLevelEnum
  completedLevel?: EnergyLevelEnum
  size?: 'sm' | 'md'
  showIcon?: boolean
}

// Visual: Small badge showing energy recommendation
// Shows suggested vs actual (if completed)
// Green checkmark if matched, yellow if mismatched

<TaskEnergyBadge 
  suggestedLevel="HIGH"
  completedLevel="PEAK"
  size="sm"
  showIcon={true}
/>
```

### **Emblem Components**

#### **6. EmblemCard.tsx**
```typescript
// components/emblems/EmblemCard.tsx

interface EmblemCardProps {
  emblem: EnergyEmblem
  userEmblem?: UserEmblem
  isUnlocked: boolean
  progress?: UnlockProgress
  onEquip?: () => void
  onViewDetails?: () => void
  size?: 'sm' | 'md' | 'lg'
}

// Visual:
// - Large icon/emoji at top
// - Name with rarity badge
// - Description/lore text
// - Progress bar (if locked)
// - Bonus effects list (if unlocked)
// - [Equip] or [Locked] button
// - Glow effect for equipped emblem

<EmblemCard 
  emblem={phoenixFlame}
  isUnlocked={true}
  onEquip={handleEquip}
  size="md"
/>
```

#### **7. EmblemInventory.tsx**
```typescript
// components/emblems/EmblemInventory.tsx

interface EmblemInventoryProps {
  userEmblems: UserEmblem[]
  onEquip: (emblemId: string) => void
  viewMode?: 'grid' | 'list'
}

// Visual: Grid of unlocked emblems
// - Filter by rarity
// - Sort by unlock date, rarity, usage
// - Highlight equipped emblem
// - Click to equip/view details

<EmblemInventory 
  userEmblems={inventory}
  onEquip={equipEmblem}
  viewMode="grid"
/>
```

#### **8. EmblemGallery.tsx**
```typescript
// components/emblems/EmblemGallery.tsx

interface EmblemGalleryProps {
  emblems: EnergyEmblem[]
  userEmblems: UserEmblem[]
  onEmblemClick: (emblemId: string) => void
  filters?: {
    rarity?: EmblemRarityEnum[]
    category?: string[]
    unlocked?: boolean
  }
}

// Visual: Gallery of all emblems (locked + unlocked)
// - Rarity filters
// - Category tabs
// - Show unlock progress on locked emblems
// - Shimmer animation on hover

<EmblemGallery 
  emblems={allEmblems}
  userEmblems={myEmblems}
  onEmblemClick={viewEmblem}
/>
```

#### **9. EquippedEmblemBadge.tsx**
```typescript
// components/emblems/EquippedEmblemBadge.tsx

interface EquippedEmblemBadgeProps {
  emblem: UserEmblem & { emblem: EnergyEmblem }
  showBonuses?: boolean
  size?: 'xs' | 'sm' | 'md'
  onClick?: () => void
}

// Visual: Small badge showing equipped emblem
// - Emblem icon
// - Rarity glow
// - Bonus indicators (optional)
// - Click to change emblem

<EquippedEmblemBadge 
  emblem={equippedEmblem}
  showBonuses={true}
  size="sm"
  onClick={openEmblemGallery}
/>
```

#### **10. EmblemUnlockAnimation.tsx**
```typescript
// components/emblems/EmblemUnlockAnimation.tsx

interface EmblemUnlockAnimationProps {
  emblem: EnergyEmblem
  onComplete: () => void
  show: boolean
}

// Visual: Full-screen celebration animation
// - Emblem zooms in from center
// - Particle effects
// - Rarity-colored glow
// - Achievement sound (optional)
// - "Emblem Unlocked!" text
// - Bonus effects revealed
// - [Continue] button

<EmblemUnlockAnimation 
  emblem={newEmblem}
  onComplete={handleContinue}
  show={showUnlockAnim}
/>
```

---

## 📱 **Page Designs**

### **Page 1: Energy Analysis Dashboard**
**Route:** `/energy-analysis`

```
┌─────────────────────────────────────────────────────────┐
│ 🔥 Energy Analysis                                       │
│ Track and optimize your energy levels                   │
│ ⚡ Current: HIGH • 🏆 7-day streak • ⭐ +25% bonus      │
└─────────────────────────────────────────────────────────┘

┌──────────┬──────────┬──────────┬──────────┐
│ Avg      │ Peak %   │ Equipped │ Load     │
│ Energy   │          │ Emblem   │ Time     │
│          │          │          │          │
│ 2.4/3.0  │ 35%     │ Phoenix  │ 0ms      │
└──────────┴──────────┴──────────┴──────────┘

┌─────────────────────────────────────────────────┐
│ Current Energy Meter                             │
│                                                  │
│     ┌──────────────┐                            │
│     │              │                            │
│     │    PEAK ⚡   │  ← Interactive circular    │
│     │              │     meter with gradient    │
│     └──────────────┘                            │
│                                                  │
│  [LOW] [MEDIUM] [HIGH] [PEAK]  ← Quick select   │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Energy History (7 Days)                          │
│                                                  │
│  3.0 ┤         ╭──╮                             │
│      │    ╭────╯  ╰───╮                         │
│  2.0 ┤────╯          ╰────╮                     │
│      │                    ╰───                  │
│  1.0 ┤                                          │
│      └────────────────────────────              │
│       Mon  Tue  Wed  Thu  Fri  Sat  Sun        │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 🤖 AI Energy Insights                            │
│                                                  │
│ ⭐ Peak Hours: 9am-11am, 2pm-4pm                │
│    Schedule complex tasks during these times    │
│                                                  │
│ ⚠️  Low Hours: 12pm-1pm, 5pm-6pm                │
│    Best for breaks and simple admin tasks       │
│                                                  │
│ 🎯 Recommendation: Schedule "Project Review"     │
│    tomorrow at 10am (your peak time)            │
│                                                  │
│ 🔥 Streak: 7 days! Keep logging energy to       │
│    unlock "Consistency Champion" emblem          │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Suggested Tasks for HIGH Energy                  │
│                                                  │
│ 🔥 [HIGH] Review Q4 Budget Proposal              │
│ 🔥 [HIGH] Refactor Authentication System         │
│ 🔥 [HIGH] Write Product Specification            │
│                                                  │
│ [View All Tasks by Energy →]                     │
└─────────────────────────────────────────────────┘
```

### **Page 2: Emblem Gallery**
**Route:** `/emblems`

```
┌─────────────────────────────────────────────────────────┐
│ 🏆 Energy Emblems                                        │
│ Collect emblems and boost your productivity             │
│ 🎯 12/24 Unlocked • 💎 Phoenix Flame equipped          │
└─────────────────────────────────────────────────────────┘

┌──────────┬──────────┬──────────┬──────────┐
│ Total    │ Unlocked │ Equipped │ Bonus    │
│ Emblems  │ Emblems  │ Emblem   │ Points   │
│          │          │          │          │
│ 24       │ 12       │ Phoenix  │ +25%     │
└──────────┴──────────┴──────────┴──────────┘

┌─────────────────────────────────────────────────┐
│ Filters: [All] [Common] [Rare] [Epic] [Legendary] │
│ Categories: [All] [Productivity] [Consistency] [Mastery] │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Your Emblems                                     │
│                                                  │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│  │   🔥    │  │   🌊    │  │   ⛰️    │         │
│  │ Phoenix │  │  Ocean  │  │Mountain │         │
│  │  Flame  │  │  Wave   │  │  Peak   │         │
│  │         │  │         │  │         │         │
│  │LEGENDARY│  │  EPIC   │  │  RARE   │         │
│  │         │  │         │  │         │         │
│  │ +25%pts │  │ Energy  │  │ +15%    │         │
│  │ at PEAK │  │ Shield  │  │ Speed   │         │
│  │         │  │         │  │         │         │
│  │[EQUIPPED│  │ [EQUIP] │  │ [EQUIP] │         │
│  └─────────┘  └─────────┘  └─────────┘         │
│                                                  │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│  │   🌅    │  │   🦉    │  │   ⚡    │         │
│  │ Sunrise │  │  Night  │  │ Energy  │         │
│  │ Keeper  │  │   Owl   │  │ Master  │         │
│  │         │  │         │  │         │         │
│  │  EPIC   │  │  RARE   │  │LEGENDARY│         │
│  │         │  │         │  │         │         │
│  │ ░░░░░░░ │  │ ░░░░░░░ │  │ ░░░░░░░ │         │
│  │  35%    │  │  60%    │  │  10%    │         │
│  │         │  │         │  │         │         │
│  │ [LOCKED]│  │ [LOCKED]│  │ [LOCKED]│         │
│  └─────────┘  └─────────┘  └─────────┘         │
└─────────────────────────────────────────────────┘
```

---

## 🔗 **Integration Points**

### **1. Header Integration**

```typescript
// Add to HeaderClean.tsx (right side, near user name)

<div className="flex items-center gap-2">
  {/* Energy Meter - Small version */}
  <EnergyMeter 
    currentLevel={currentEnergy}
    onLevelChange={updateEnergy}
    size="sm"
    interactive={true}
  />
  
  {/* Equipped Emblem Badge */}
  {equippedEmblem && (
    <EquippedEmblemBadge 
      emblem={equippedEmblem}
      size="xs"
      onClick={() => navigate('/emblems')}
    />
  )}
  
  {/* User Name */}
  <span>{user.name}</span>
</div>
```

### **2. Dashboard Integration**

```typescript
// Add to DashboardPage

<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Main content */}
  <div className="lg:col-span-2">
    {/* Existing dashboard widgets */}
  </div>
  
  {/* Sidebar */}
  <div className="space-y-6">
    {/* Energy Widget */}
    <Card>
      <CardHeader>
        <CardTitle>Your Energy</CardTitle>
      </CardHeader>
      <CardContent>
        <EnergyMeter 
          currentLevel={energy}
          onLevelChange={setEnergy}
          interactive={true}
        />
        <Button onClick={() => navigate('/energy-analysis')}>
          View Analysis →
        </Button>
      </CardContent>
    </Card>
    
    {/* Equipped Emblem */}
    {equippedEmblem && (
      <Card>
        <CardHeader>
          <CardTitle>Active Emblem</CardTitle>
        </CardHeader>
        <CardContent>
          <EmblemCard 
            emblem={equippedEmblem.emblem}
            userEmblem={equippedEmblem}
            isUnlocked={true}
            size="sm"
          />
        </CardContent>
      </Card>
    )}
  </div>
</div>
```

### **3. Task List Integration**

```typescript
// Add to TasksPage - each task card

<div className="task-card">
  <div className="task-header">
    <h3>{task.title}</h3>
    
    {/* Energy Badge */}
    <TaskEnergyBadge 
      suggestedLevel={task.suggestedEnergyLevel}
      completedLevel={task.completedAtEnergyLevel}
    />
  </div>
  
  {/* Show energy match bonus */}
  {task.suggestedEnergyLevel === currentEnergy && (
    <Badge className="bg-green-500">
      ⚡ Energy Match! +{emblemBonuses.taskCompletionBonus} bonus points
    </Badge>
  )}
</div>
```

### **4. Task Completion Integration**

```typescript
// When task is marked complete

const handleCompleteTask = async (taskId: string) => {
  // 1. Complete task with current energy level
  const result = await api.post(`/tasks/${taskId}/complete`, {
    completedAtEnergyLevel: currentEnergy
  });
  
  // 2. Show energy bonus if applicable
  if (result.data.energyBonus > 0) {
    toast({
      title: "Energy Bonus!",
      description: `+${result.data.energyBonus} points for completing at ${currentEnergy} energy`,
      variant: "success"
    });
  }
  
  // 3. Check for new emblem unlocks
  if (result.data.newUnlockedEmblems.length > 0) {
    result.data.newUnlockedEmblems.forEach(emblem => {
      // Show unlock animation
      setUnlockingEmblem(emblem);
      setShowUnlockAnimation(true);
    });
  }
  
  // 4. Update energy level (auto-detect)
  await api.post('/energy/auto-detect');
};
```

### **5. Achievement Integration**

```typescript
// Link emblems to achievements

const energyAchievements = [
  {
    id: "energy_master",
    name: "Energy Master",
    description: "Unlock all energy emblems",
    requirement: "Unlock 24 energy emblems",
    points: 1000,
    rewardEmblemId: "energy_master_emblem"
  },
  {
    id: "peak_performer",
    name: "Peak Performer",
    description: "Complete 50 tasks at PEAK energy",
    requirement: "Complete 50 tasks while at PEAK energy",
    points: 500,
    rewardEmblemId: "peak_performer_emblem"
  },
  {
    id: "consistency_king",
    name: "Consistency King",
    description: "Log energy for 30 consecutive days",
    requirement: "Log energy level for 30 days in a row",
    points: 300,
    rewardEmblemId: "sunrise_keeper"
  }
];
```

---

## 🎖️ **Emblem System Details**

### **Complete Emblem Catalog (24 Emblems)**

#### **Productivity Category (8 Emblems)**

**1. Phoenix Flame 🔥 (LEGENDARY)**
- **Unlock:** Complete 100 tasks at PEAK energy
- **Bonus:** +25% points when at PEAK energy
- **Lore:** "Rise from the ashes of exhaustion with unstoppable focus"

**2. Ocean Wave 🌊 (EPIC)**
- **Unlock:** Complete 50 tasks at any energy level
- **Bonus:** Energy never drops below MEDIUM for 24h after equipping
- **Lore:** "Ride the waves of productivity with consistent energy"

**3. Mountain Peak ⛰️ (RARE)**
- **Unlock:** Maintain HIGH+ energy for 7 consecutive days
- **Bonus:** +15% task completion speed
- **Lore:** "Reach new heights with sustained high performance"

**4. Lightning Bolt ⚡ (RARE)**
- **Unlock:** Complete 25 tasks in PEAK energy within 24 hours
- **Bonus:** Double points for tasks completed within 1 hour of creation
- **Lore:** "Strike with lightning speed and precision"

**5. Solar Flare ☀️ (EPIC)**
- **Unlock:** Complete 100 HIGH energy tasks
- **Bonus:** +20% points for morning tasks (6am-12pm)
- **Lore:** "Harness the power of the morning sun"

**6. Starlight ✨ (COMMON)**
- **Unlock:** Complete 10 tasks at any energy
- **Bonus:** +5% points on all tasks
- **Lore:** "Every journey begins with a single star"

**7. Thunder Storm 🌩️ (EPIC)**
- **Unlock:** Complete 5 URGENT tasks at PEAK energy
- **Bonus:** +30% points on URGENT priority tasks
- **Lore:** "Command the storm with focused intensity"

**8. Rainbow Bridge 🌈 (RARE)**
- **Unlock:** Complete tasks at all 4 energy levels in one day
- **Bonus:** +10% points regardless of energy level
- **Lore:** "Master all energy states with balance and grace"

#### **Consistency Category (8 Emblems)**

**9. Sunrise Keeper 🌅 (EPIC)**
- **Unlock:** Log energy for 30 consecutive days
- **Bonus:** Auto-detect optimal energy times
- **Lore:** "Greet each dawn with unwavering dedication"

**10. Night Owl 🦉 (RARE)**
- **Unlock:** Complete 25 tasks between 8pm-2am
- **Bonus:** +10% points for late-night completions (8pm+)
- **Lore:** "The night is dark and full of productivity"

**11. Eternal Flame 🕯️ (LEGENDARY)**
- **Unlock:** Maintain 60-day energy logging streak
- **Bonus:** Streak protection (forgive 2 missed days)
- **Lore:** "Your dedication burns eternal, never faltering"

**12. Tide Turner 🌊 (RARE)**
- **Unlock:** Recover from LOW to PEAK within 4 hours 5 times
- **Bonus:** +20% energy recovery speed
- **Lore:** "Turn the tide when energy ebbs low"

**13. Compass Rose 🧭 (COMMON)**
- **Unlock:** Log energy for 7 consecutive days
- **Bonus:** +5% points for consistent logging
- **Lore:** "Find your direction through consistent tracking"

**14. Hourglass ⏳ (RARE)**
- **Unlock:** Track energy at least 3 times per day for 14 days
- **Bonus:** Time-based insights unlocked
- **Lore:** "Master time by understanding your rhythms"

**15. Calendar Mark 📅 (COMMON)**
- **Unlock:** Log energy on 30 different days (non-consecutive)
- **Bonus:** +3% points for each day logged this month
- **Lore:** "Mark each day with intentional awareness"

**16. Crystal Clock 🔮 (EPIC)**
- **Unlock:** Predict your energy correctly 20 times
- **Bonus:** AI predictions become more accurate
- **Lore:** "See through time with uncanny precision"

#### **Mastery Category (8 Emblems)**

**17. Energy Master ⚡👑 (LEGENDARY)**
- **Unlock:** Unlock all other 23 energy emblems
- **Bonus:** 2x all emblem bonuses
- **Lore:** "True mastery comes to those who persevere"

**18. Zen Garden 🎋 (EPIC)**
- **Unlock:** Maintain MEDIUM energy for 80% of tracked time (30 days)
- **Bonus:** Energy fluctuations reduced by 50%
- **Lore:** "Balance is the highest form of wisdom"

**19. Dragon's Breath 🐉 (LEGENDARY)**
- **Unlock:** Complete 500 tasks with matching energy levels
- **Bonus:** +50% points when task energy matches current energy
- **Lore:** "Channel the dragon's infinite power"

**20. Wizard's Staff 🧙 (EPIC)**
- **Unlock:** Use AI energy predictions 100 times
- **Bonus:** AI auto-sets energy level with 90% accuracy
- **Lore:** "Magic is just sufficiently advanced analysis"

**21. Crown of Focus 👑 (RARE)**
- **Unlock:** Complete 10 PEAK energy days (avg 2.5+)
- **Bonus:** PEAK energy lasts 2x longer
- **Lore:** "Rule your domain with laser-sharp focus"

**22. Heart of Gold 💛 (RARE)**
- **Unlock:** Help 3 friends unlock their first emblem
- **Bonus:** +5% points for collaborative tasks
- **Lore:** "True wealth is shared success"

**23. Infinity Symbol ♾️ (LEGENDARY)**
- **Unlock:** Earn 50,000 total points from energy bonuses
- **Bonus:** Energy bonuses never expire
- **Lore:** "Your potential knows no bounds"

**24. Genesis Spark 💫 (COMMON)**
- **Unlock:** Create your first energy log
- **Bonus:** +2% points (starter emblem)
- **Lore:** "Every master was once a beginner"

---

## 🤖 **AI Integration**

### **Energy Prediction Model**

```typescript
// AI/ML model for energy prediction

interface EnergyPredictionModel {
  // Input features
  inputs: {
    timeOfDay: number          // 0-23
    dayOfWeek: number          // 0-6
    hoursSinceLastSleep: number
    recentTaskCompletions: number
    currentStreak: number
    historicalEnergyAtThisTime: EnergyLevelEnum[]
    weatherCondition: string   // Optional
    calendarDensity: number    // How busy schedule is
  }
  
  // Output
  output: {
    predictedLevel: EnergyLevelEnum
    confidence: number  // 0.0-1.0
    reasoning: string[]
  }
}

// Training data: User's historical energy logs + task completions
// Algorithm: Random Forest or Gradient Boosting
// Retraining: Weekly based on new data
```

### **AI Insights Generation**

```typescript
const generateEnergyInsights = async (userId: string): Promise<EnergyInsight[]> => {
  const history = await getEnergyHistory(userId, 30);
  const patterns = await analyzePatterns(history);
  
  return [
    {
      type: 'pattern',
      title: 'Peak Performance Window Detected',
      description: `You consistently hit PEAK energy between ${patterns.peakStart}-${patterns.peakEnd}`,
      actionable: true,
      actionText: 'Schedule complex tasks during this window',
      priority: 'high',
      icon: '🎯'
    },
    {
      type: 'recommendation',
      title: 'Energy Optimization Opportunity',
      description: 'Move your 3 HIGH-energy tasks from evening to morning for 30% better performance',
      actionable: true,
      actionText: 'Auto-reschedule tasks',
      actionUrl: '/tasks?action=optimize-energy',
      priority: 'medium',
      icon: '💡'
    },
    {
      type: 'achievement',
      title: 'Streak Achievement Progress',
      description: '3 more days of HIGH energy to unlock "Mountain Peak" emblem!',
      actionable: true,
      actionText: 'View emblem details',
      actionUrl: '/emblems/mountain-peak',
      priority: 'medium',
      icon: '🏆'
    },
    {
      type: 'warning',
      title: 'Energy Decline Detected',
      description: 'Your average energy dropped 15% this week. Consider more breaks.',
      actionable: true,
      actionText: 'Schedule recovery time',
      priority: 'high',
      icon: '⚠️'
    }
  ];
};
```

---

## 🎨 **Visual Design System**

### **Energy Level Colors**

```css
/* Energy Level Gradients */
.energy-low {
  background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
  shadow: 0 4px 20px rgba(239, 68, 68, 0.3);
}

.energy-medium {
  background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  shadow: 0 4px 20px rgba(245, 158, 11, 0.3);
}

.energy-high {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  shadow: 0 4px 20px rgba(16, 185, 129, 0.3);
}

.energy-peak {
  background: linear-gradient(135deg, #8B5CF6 0%, #F59E0B 100%);
  shadow: 0 4px 20px rgba(139, 92, 246, 0.5);
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; transform: scale(1.02); }
}
```

### **Emblem Rarity Colors**

```css
/* Emblem Rarity Styles */
.emblem-common {
  border: 2px solid #9CA3AF;
  background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);
}

.emblem-rare {
  border: 2px solid #3B82F6;
  background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%);
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
}

.emblem-epic {
  border: 2px solid #8B5CF6;
  background: linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%);
  box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
}

.emblem-legendary {
  border: 3px solid;
  border-image: linear-gradient(135deg, #F59E0B 0%, #EF4444 100%) 1;
  background: linear-gradient(135deg, #FEF3C7 0%, #FED7AA 100%);
  box-shadow: 0 6px 30px rgba(245, 158, 11, 0.5);
  animation: legendary-glow 3s ease-in-out infinite;
}

@keyframes legendary-glow {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.2); }
}
```

### **Emblem Unlock Animation**

```css
/* Full-screen unlock animation */
@keyframes emblem-unlock {
  0% {
    opacity: 0;
    transform: scale(0.3) rotate(-180deg);
  }
  50% {
    opacity: 1;
    transform: scale(1.2) rotate(0deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
  }
}

.emblem-unlock-overlay {
  animation: emblem-unlock 1.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

---

## 📅 **Implementation Timeline (4 Weeks)**

### **Week 1: Foundation (Backend + Database)**

**Days 1-2: Database Setup**
- [ ] Create Prisma migrations for new tables
- [ ] Add enum types (EnergyLevelEnum, EmblemRarityEnum, etc.)
- [ ] Update existing tables (Task, User, Achievement)
- [ ] Seed database with 24 system emblems
- [ ] Create emblem unlock requirements JSON
- [ ] Run migrations and verify schema

**Days 3-4: Energy Tracking Service**
- [ ] Implement `EnergyTrackingService`
- [ ] Create energy recording logic
- [ ] Build auto-detection algorithm
- [ ] Add energy history queries
- [ ] Implement energy statistics calculations
- [ ] Write unit tests for energy service

**Days 5-7: Emblem Service**
- [ ] Implement `EmblemService`
- [ ] Create unlock requirement checker
- [ ] Build emblem inventory management
- [ ] Implement equip/unequip logic
- [ ] Calculate active bonuses
- [ ] Write unit tests for emblem service

### **Week 2: API Layer + Integration**

**Days 8-10: Energy API Endpoints**
- [ ] `GET /energy/current`
- [ ] `POST /energy/update`
- [ ] `GET /energy/history`
- [ ] `GET /energy/insights`
- [ ] `POST /energy/auto-detect`
- [ ] Add authentication middleware
- [ ] Add request validation
- [ ] Write API integration tests

**Days 11-12: Emblem API Endpoints**
- [ ] `GET /emblems/available`
- [ ] `GET /emblems/inventory`
- [ ] `GET /emblems/:id/progress`
- [ ] `POST /emblems/:id/unlock`
- [ ] `POST /emblems/:id/equip`
- [ ] `DELETE /emblems/unequip`
- [ ] `GET /emblems/check-unlocks`
- [ ] Write API tests

**Days 13-14: Task Integration (Backend)**
- [ ] Update task completion endpoint
- [ ] Add energy level recording on completion
- [ ] Calculate energy match bonuses
- [ ] Trigger emblem unlock checks
- [ ] Update task filtering by energy
- [ ] Write integration tests

### **Week 3: Frontend Components**

**Days 15-16: Energy Components**
- [ ] Create `EnergyMeter.tsx` (circular progress meter)
- [ ] Create `EnergySelector.tsx` (buttons/dropdown)
- [ ] Create `EnergyHistoryChart.tsx` (line chart)
- [ ] Create `EnergyInsightsCard.tsx` (AI insights)
- [ ] Create `TaskEnergyBadge.tsx` (task energy indicator)
- [ ] Style with energy color gradients
- [ ] Add animations and interactions

**Days 17-18: Emblem Components**
- [ ] Create `EmblemCard.tsx` (emblem display card)
- [ ] Create `EmblemInventory.tsx` (grid of user emblems)
- [ ] Create `EmblemGallery.tsx` (all emblems browser)
- [ ] Create `EquippedEmblemBadge.tsx` (header badge)
- [ ] Create `EmblemUnlockAnimation.tsx` (celebration)
- [ ] Create `EmblemProgressBar.tsx` (unlock progress)
- [ ] Implement rarity-based styling

**Days 19-21: Pages & Integration**
- [ ] Create `EnergyAnalysisPage.tsx`
- [ ] Create `EmblemGalleryPage.tsx`
- [ ] Integrate energy meter into header
- [ ] Add energy widget to dashboard
- [ ] Update task cards with energy badges
- [ ] Add energy filter to task list
- [ ] Create emblem showcase on profile page

### **Week 4: Polish, Testing & Launch**

**Days 22-24: Polish & UX**
- [ ] Fine-tune animations
- [ ] Add loading states
- [ ] Implement error handling
- [ ] Add tooltips and help text
- [ ] Create onboarding flow for energy feature
- [ ] Add tutorial for emblem system
- [ ] Polish mobile responsiveness

**Days 25-26: Testing**
- [ ] Unit tests for all services
- [ ] Integration tests for APIs
- [ ] E2E tests for energy tracking flow
- [ ] E2E tests for emblem unlock flow
- [ ] Performance testing
- [ ] Accessibility audit
- [ ] Cross-browser testing

**Days 27-28: Launch Preparation**
- [ ] Create feature flag (`energy_system_enabled`)
- [ ] Write documentation
- [ ] Create admin tools for emblem management
- [ ] Set up monitoring/analytics
- [ ] Beta test with select users
- [ ] Gradual rollout (10% → 50% → 100%)

---

## 🧪 **Testing Strategy**

### **Unit Tests**

```typescript
// Test energy tracking
describe('EnergyTrackingService', () => {
  test('records energy level correctly', async () => {
    const result = await energyService.recordEnergy(userId, 'PEAK', 'MANUAL');
    expect(result.level).toBe('PEAK');
    expect(result.source).toBe('MANUAL');
  });
  
  test('auto-detects energy from behavior', async () => {
    // Complete 3 complex tasks in 1 hour
    await completeTask(task1, 'PEAK');
    await completeTask(task2, 'PEAK');
    await completeTask(task3, 'PEAK');
    
    const detected = await energyService.autoDetectEnergy(userId);
    expect(detected).toBe('PEAK');
  });
});

// Test emblem unlocks
describe('EmblemService', () => {
  test('unlocks emblem when requirements met', async () => {
    // Complete 100 tasks at PEAK
    await completeTasksAtPeak(100);
    
    const unlocks = await emblemService.checkPendingUnlocks(userId);
    expect(unlocks).toContainEqual(
      expect.objectContaining({ name: 'Phoenix Flame' })
    );
  });
  
  test('calculates bonuses correctly', async () => {
    await emblemService.equipEmblem(userId, 'phoenix-flame');
    const bonuses = await emblemService.getActiveEmblemBonuses(userId);
    expect(bonuses.pointsMultiplier).toBe(1.25);
  });
});
```

### **E2E Tests**

```typescript
// tests/e2e/energy-flow.spec.ts

test('complete energy tracking flow', async ({ page }) => {
  // 1. Navigate to dashboard
  await page.goto('/dashboard');
  
  // 2. Click energy meter
  await page.click('[data-testid="energy-meter"]');
  
  // 3. Select PEAK energy
  await page.click('[data-testid="energy-level-peak"]');
  
  // 4. Verify energy updated
  await expect(page.locator('[data-testid="current-energy"]')).toHaveText('PEAK');
  
  // 5. Complete a task
  await page.goto('/tasks');
  await page.click('[data-testid="complete-task-1"]');
  
  // 6. Verify energy bonus shown
  await expect(page.locator('[data-testid="energy-bonus-toast"]')).toBeVisible();
});

test('emblem unlock and equip flow', async ({ page }) => {
  // 1. Complete 100 tasks at PEAK (using API setup)
  await setupUser({ peakTasksCompleted: 100 });
  
  // 2. Navigate to emblems
  await page.goto('/emblems');
  
  // 3. Verify Phoenix Flame is unlockable
  await expect(page.locator('[data-testid="emblem-phoenix-flame"]')).toHaveClass(/unlocked/);
  
  // 4. Click unlock button
  await page.click('[data-testid="unlock-phoenix-flame"]');
  
  // 5. See unlock animation
  await expect(page.locator('[data-testid="unlock-animation"]')).toBeVisible();
  
  // 6. Equip emblem
  await page.click('[data-testid="equip-phoenix-flame"]');
  
  // 7. Verify equipped in header
  await expect(page.locator('[data-testid="equipped-emblem-badge"]')).toBeVisible();
});
```

---

## 📊 **Success Metrics**

### **Engagement Metrics**

- **Energy Logging Rate:** % of active users logging energy daily (Target: 60%)
- **Energy Insights Usage:** % of users viewing insights weekly (Target: 40%)
- **Task-Energy Match Rate:** % of tasks completed at suggested energy (Target: 55%)
- **Average Energy Logs per User:** Daily average (Target: 2.5)

### **Emblem Metrics**

- **Emblem Unlock Rate:** Average emblems per user (Target: 4 in first month)
- **Emblem Equip Rate:** % of unlocked emblems that get equipped (Target: 70%)
- **Emblem Collection Completion:** % of users who unlock all emblems (Target: 5%)
- **Time to First Emblem:** Average days to unlock first emblem (Target: < 7 days)

### **Business Metrics**

- **User Retention:** Increase in 30-day retention (Target: +15%)
- **Session Duration:** Increase in average session time (Target: +20%)
- **Task Completion Rate:** Increase in tasks completed (Target: +25%)
- **Premium Conversion:** Increase in free→paid conversion (Target: +10%)

### **Product Metrics**

- **Feature Adoption:** % of users who try energy tracking (Target: 75%)
- **Daily Active Users:** Increase in DAU (Target: +30%)
- **Task Quality:** Decrease in task rescheduling (Target: -20%)
- **User Satisfaction:** NPS score for energy feature (Target: 8+/10)

---

## 🚀 **Rollout Strategy**

### **Phase 1: Internal Beta (Week 1-2)**
- Enable for admin + 5 power users
- Gather feedback
- Fix critical bugs
- Iterate on UX

### **Phase 2: Limited Beta (Week 3)**
- Enable for 10% of users
- Monitor metrics
- A/B test variations
- Collect user feedback

### **Phase 3: Gradual Rollout (Week 4)**
- 25% → 50% → 75% → 100%
- Monitor performance
- Watch for errors
- Prepare rollback if needed

### **Phase 4: Full Launch (Month 2)**
- 100% rollout
- Marketing announcement
- Create tutorial content
- Monitor success metrics

---

## 🎯 **Feature Flags**

```typescript
flags: {
  energy_system_enabled: boolean          // Master flag
  energy_auto_detect: boolean             // Auto-detection feature
  energy_ai_insights: boolean             // AI insights
  emblem_system_enabled: boolean          // Emblem collection
  emblem_unlock_animations: boolean       // Celebration animations
  energy_task_suggestions: boolean        // Task filtering by energy
}
```

---

## 🔐 **Security & Privacy**

- **Energy data is private** - Only user can see their own energy levels
- **Emblem inventory is private** - But can share equipped emblem publicly
- **No PII in energy logs** - Only timestamps and levels
- **Admin access** - Admins can view aggregate stats, not individual data
- **Data export** - Users can export their energy data (GDPR compliance)
- **Data deletion** - Energy data deleted when user deletes account

---

## 💡 **Future Enhancements (Post-Launch)**

### **Phase 2 Features:**
- **Energy Challenges:** "Maintain PEAK energy for 3 days straight"
- **Team Energy:** See team average energy (with consent)
- **Energy Coaching:** Personalized AI coaching
- **Custom Emblems:** Users create custom emblems
- **Emblem Trading:** Trade emblems with friends (marketplace)
- **Energy Predictions:** AI predicts energy 24h ahead
- **Energy Reminders:** "Time to log your energy!"
- **Energy Correlations:** Link energy to sleep, weather, calendar density

### **Premium Features:**
- **Advanced AI Insights:** Deep dive analytics
- **Custom Energy Levels:** Define your own levels
- **Unlimited Emblems:** Equip multiple emblems
- **Emblem Crafting:** Combine emblems for new powers
- **Energy API:** Export energy data to other apps

---

## 📝 **Open Questions & Decisions Needed**

### **Design Decisions:**
1. Should emblems have levels/upgrades, or just unlock once?
2. Can users have multiple equipped emblems, or just one?
3. Should there be emblem trading/gifting between friends?
4. Should emblems expire or last forever?

### **Technical Decisions:**
1. Real-time energy tracking or batch processing?
2. Client-side or server-side energy calculations?
3. How to handle timezone differences in energy patterns?
4. Should we cache emblem unlock checks?

### **Product Decisions:**
1. Free vs premium emblem unlocks?
2. Daily energy log reminders (push notifications)?
3. Leaderboard for most emblems unlocked?
4. Social sharing of emblem unlocks?

---

## 📚 **Resources & References**

- **Design Inspiration:** Duolingo badges, Fitbit achievements, Pokémon collection
- **Energy Science:** Circadian rhythms, ultradian cycles, flow state research
- **Gamification:** "Actionable Gamification" by Yu-kai Chou
- **UI Libraries:** Recharts (charts), Framer Motion (animations)

---

## ✅ **Definition of Done**

**Feature is complete when:**
- [ ] All 24 emblems are in database and unlockable
- [ ] Energy tracking works reliably (manual + auto-detect)
- [ ] Energy Analysis page shows accurate charts and insights
- [ ] Emblem Gallery displays all emblems with proper filtering
- [ ] Users can equip emblems and see bonuses applied
- [ ] Task completion triggers emblem checks
- [ ] Unlock animations play smoothly
- [ ] All tests pass (unit + integration + E2E)
- [ ] Performance benchmarks met (< 100ms API responses)
- [ ] Accessibility score 95+ (Lighthouse)
- [ ] Mobile experience is polished
- [ ] Documentation is complete
- [ ] Feature flags work correctly
- [ ] Monitoring/analytics in place

---

## 🎊 **Launch Checklist**

**Pre-Launch:**
- [ ] All code reviewed and merged
- [ ] Database migrations tested on staging
- [ ] API endpoints documented
- [ ] Frontend tested on all browsers
- [ ] Performance tested under load
- [ ] Security audit passed
- [ ] User acceptance testing complete
- [ ] Rollback plan documented

**Launch Day:**
- [ ] Enable feature flag for 10%
- [ ] Monitor error rates
- [ ] Watch performance metrics
- [ ] Check user feedback
- [ ] Gradual increase to 100%
- [ ] Announce to users
- [ ] Celebrate! 🎉

---

**END OF DOCUMENT**

*This plan is a living document and will be updated as development progresses.*

