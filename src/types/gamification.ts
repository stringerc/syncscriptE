// ============================================================================
// GAMIFICATION TYPE DEFINITIONS
// Complete type system for the advanced gamification platform
// ============================================================================

// ============================================================================
// CORE USER PROFILE
// ============================================================================

export interface UserGamificationProfile {
  userId: string;
  
  // Core Progression
  level: number;
  xp: number;
  nextLevelXp: number;
  totalXpEarned: number;
  
  // League System
  currentLeague: LeagueTier;
  leagueRank: number;
  leagueXp: number; // This week's XP
  leagueId: string;
  
  // Season Pass
  seasonLevel: number;
  seasonXp: number;
  hasPremiumPass: boolean;
  
  // Class System
  class: PlayerClass | null;
  classLevel: number;
  skillPoints: number;
  unlockedSkills: string[];
  
  // Pet System
  activePetId: string | null;
  ownedPetIds: string[];
  
  // Guild System
  guildId: string | null;
  guildRank: GuildRank;
  
  // Mastery System
  masteryLevels: {
    task: number;
    energy: number;
    team: number;
    focus: number;
    social: number;
    script: number;
  };
  
  masteryXp: {
    task: number;
    energy: number;
    team: number;
    focus: number;
    social: number;
    script: number;
  };
  
  // Prestige System
  prestigeLevel: number;
  totalPrestiges: number;
  
  // Social System
  friendIds: string[];
  friendshipLevels: { [friendId: string]: number };
  kudosGiven: number;
  kudosReceived: number;
  
  // Titles & Badges
  equippedTitle: string | null;
  unlockedTitles: string[];
  unlockedBadges: string[];
  
  // Achievements
  unlockedAchievements: string[];
  achievementProgress: { [achievementId: string]: number };
  
  // Inventory
  inventory: UserInventory;
  
  // Stats
  stats: UserStats;
  
  // Preferences
  preferences: GamificationPreferences;
}

export interface UserInventory {
  xpBoosts: number;
  streakFreezes: number;
  energyPotions: number;
  petEggs: PetEgg[];
  petFood: number;
  guildTokens: number;
  seasonTokens: number;
  evolutionStones: number;
  tradeTickets: number;
}

export interface UserStats {
  tasksCompleted: number;
  focusHours: number;
  teamCollaborations: number;
  questsCompleted: number;
  achievementsUnlocked: number;
  petsCollected: number;
  guildsJoined: number;
  friendsAdded: number;
  leaguePromotions: number;
  leagueDemotions: number;
  seasonPassesCompleted: number;
  prestigesPerformed: number;
  longestStreak: number;
  currentStreak: number;
  totalDaysActive: number;
}

export interface GamificationPreferences {
  showXpNumbers: boolean;
  showPetAnimations: boolean;
  enableNotifications: boolean;
  leaderboardVisibility: 'public' | 'friends' | 'private';
  allowFriendRequests: boolean;
  allowGuildInvites: boolean;
  showClassBonuses: boolean;
  enableCelebrations: boolean;
}

// ============================================================================
// LEAGUE SYSTEM
// ============================================================================

export type LeagueTier = 'bronze' | 'silver' | 'gold' | 'sapphire' | 'ruby' | 'emerald' | 'diamond' | 'obsidian';

export interface League {
  id: string;
  tier: LeagueTier;
  weekStart: Date;
  weekEnd: Date;
  participants: LeagueParticipant[];
  status: 'active' | 'completed' | 'pending';
}

export interface LeagueParticipant {
  userId: string;
  userName: string;
  userAvatar: string;
  rank: number;
  xpEarned: number;
  trend: 'up' | 'down' | 'same';
  isCurrentUser?: boolean;
}

export interface LeagueReward {
  tier: LeagueTier;
  rank: number;
  xp: number;
  badges: string[];
  items: InventoryItem[];
  title?: string;
}

// ============================================================================
// QUEST SYSTEM
// ============================================================================

export type QuestType = 'daily' | 'weekly' | 'epic' | 'party' | 'boss';
export type QuestDifficulty = 'easy' | 'medium' | 'hard' | 'legendary';
export type QuestStatus = 'available' | 'active' | 'completed' | 'failed' | 'expired';

export interface Quest {
  id: string;
  type: QuestType;
  title: string;
  description: string;
  story?: string; // For epic quests
  objectives: QuestObjective[];
  rewards: QuestReward[];
  difficulty: QuestDifficulty;
  requiredLevel: number;
  requiredClass?: PlayerClass;
  expiresAt?: Date;
  status: QuestStatus;
  partySize?: number; // For party quests
  partyMembers?: string[]; // User IDs in party
  progress: number; // 0-100
  acceptedAt?: Date;
  completedAt?: Date;
  chapter?: number; // For epic quests
  totalChapters?: number; // For epic quests
}

export interface QuestObjective {
  id: string;
  description: string;
  type: 'task_completion' | 'energy_maintenance' | 'focus_session' | 'team_collaboration' | 'social_interaction' | 'script_usage' | 'custom';
  target: number;
  current: number;
  completed: boolean;
  icon?: string;
}

export interface QuestReward {
  type: 'xp' | 'seasonXp' | 'item' | 'pet' | 'title' | 'badge' | 'currency';
  amount?: number;
  itemId?: string;
  itemName?: string;
  rarity?: ItemRarity;
}

// ============================================================================
// SEASON PASS SYSTEM
// ============================================================================

export interface SeasonPass {
  id: string;
  seasonNumber: number;
  name: string;
  theme: string;
  description: string;
  startDate: Date;
  endDate: Date;
  tiers: SeasonTier[];
  challenges: SeasonalChallenge[];
  status: 'upcoming' | 'active' | 'ended';
}

export interface SeasonTier {
  level: number;
  xpRequired: number;
  freeReward: Reward | null;
  premiumReward: Reward | null;
  unlocked: boolean;
  claimed: boolean;
}

export interface SeasonalChallenge {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'seasonal';
  progress: number;
  target: number;
  reward: number; // Season XP
  completed: boolean;
}

export interface Reward {
  type: 'xp' | 'item' | 'pet' | 'cosmetic' | 'currency' | 'perk';
  name: string;
  description: string;
  icon: string;
  rarity: ItemRarity;
  amount?: number;
}

// ============================================================================
// CLASS SYSTEM
// ============================================================================

export type PlayerClass = 'sprinter' | 'marathon' | 'captain' | 'solo';

export interface ClassDefinition {
  id: PlayerClass;
  name: string;
  description: string;
  playstyle: string;
  icon: string;
  color: string;
  bonuses: ClassBonus[];
  skills: ClassSkill[];
  bestFor: string;
}

export interface ClassBonus {
  type: 'xp_boost' | 'energy_regen' | 'task_bonus' | 'team_bonus' | 'focus_bonus';
  description: string;
  value: number;
  condition?: string;
}

export interface ClassSkill {
  id: string;
  name: string;
  description: string;
  icon: string;
  cooldown: number; // Hours
  charges: number; // Uses per day
  requiredLevel: number;
  effect: SkillEffect;
  unlocked: boolean;
}

export interface SkillEffect {
  type: 'xp_multiplier' | 'energy_boost' | 'team_buff' | 'instant_xp';
  value: number;
  duration?: number; // Minutes
}

export interface SkillTreeNode {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiredLevel: number;
  requiredNodes: string[]; // Prerequisites
  unlocked: boolean;
  perk: NodePerk;
}

export interface NodePerk {
  type: 'passive' | 'active';
  effect: string;
  value: number;
}

// ============================================================================
// PET SYSTEM
// ============================================================================

export type PetStage = 'baby' | 'teen' | 'adult' | 'elder';
export type PetElement = 'fire' | 'air' | 'earth' | 'water' | 'light' | 'shadow';

export interface Pet {
  id: string;
  speciesId: string;
  speciesName: string;
  nickname: string;
  element: PetElement;
  level: number;
  xp: number;
  nextLevelXp: number;
  stage: PetStage;
  evolutionPath: string | null;
  isShiny: boolean;
  shinyColor?: string;
  bonuses: PetBonus[];
  happiness: number; // 0-100
  hunger: number; // 0-100
  lastFed?: Date;
  hatchedAt: Date;
  evolvedAt?: Date;
  traits: PetTrait[];
}

export interface PetBonus {
  type: 'xp_boost' | 'energy_regen' | 'streak_protection' | 'task_bonus' | 'focus_bonus' | 'social_bonus';
  value: number;
  description: string;
}

export interface PetTrait {
  id: string;
  name: string;
  description: string;
  rarity: ItemRarity;
}

export interface PetEgg {
  id: string;
  speciesId: string;
  element: PetElement;
  rarity: ItemRarity;
  hatchProgress: number; // 0-100 (hatches at 100)
  acquiredAt: Date;
}

export interface PetSpecies {
  id: string;
  name: string;
  element: PetElement;
  description: string;
  rarity: ItemRarity;
  evolutions: PetEvolution[];
  baseStats: PetStats;
  discoverable: boolean; // Some pets are secret
}

export interface PetEvolution {
  fromStage: PetStage;
  toStage: PetStage;
  requirements: EvolutionRequirement[];
  paths: EvolutionPath[];
}

export interface EvolutionPath {
  id: string;
  name: string;
  description: string;
  resultSpeciesId: string;
  icon: string;
}

export interface EvolutionRequirement {
  type: 'level' | 'item' | 'friendship' | 'time_of_day' | 'special';
  value: number | string;
  description: string;
}

export interface PetStats {
  energyBoost: number;
  xpBoost: number;
  focusBoost: number;
  teamBoost: number;
}

// ============================================================================
// GUILD SYSTEM
// ============================================================================

export type GuildRank = 'master' | 'officer' | 'member' | 'recruit';

export interface Guild {
  id: string;
  name: string;
  tag: string; // 3-5 char tag like [PROD]
  description: string;
  icon: string;
  banner: string;
  level: number;
  xp: number;
  nextLevelXp: number;
  memberIds: string[];
  masterId: string;
  officerIds: string[];
  createdAt: Date;
  
  // Guild Resources
  bankBalance: number;
  guildHallLevel: number;
  
  // Guild Perks
  unlockedPerks: GuildPerk[];
  activePerks: string[];
  
  // Guild Stats
  stats: GuildStats;
  
  // Guild Settings
  settings: GuildSettings;
}

export interface GuildPerk {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
  requiredGuildLevel: number;
  unlocked: boolean;
  effect: PerkEffect;
}

export interface PerkEffect {
  type: 'xp_boost' | 'energy_boost' | 'quest_bonus' | 'league_protection' | 'season_boost';
  value: number;
  duration?: number; // Days, if temporary
}

export interface GuildStats {
  totalTasksCompleted: number;
  totalQuestsCompleted: number;
  totalXpEarned: number;
  gvgWins: number;
  gvgLosses: number;
  raidBossesDefeated: number;
  memberCount: number;
  totalMembersAllTime: number;
}

export interface GuildSettings {
  isPublic: boolean;
  autoAccept: boolean;
  minimumLevel: number;
  requireApplication: boolean;
  welcomeMessage: string;
  rules: string;
}

export interface GuildMember {
  userId: string;
  userName: string;
  userAvatar: string;
  rank: GuildRank;
  level: number;
  contributionPoints: number;
  joinedAt: Date;
  lastActive: Date;
  totalXpContributed: number;
}

export interface GuildEvent {
  id: string;
  type: 'raid' | 'gvg' | 'challenge' | 'social';
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  participants: string[]; // User IDs
  progress: number;
  target: number;
  rewards: GuildReward[];
  status: 'upcoming' | 'active' | 'completed' | 'failed';
}

export interface GuildReward {
  type: 'guild_xp' | 'guild_currency' | 'guild_perk' | 'individual_reward';
  amount?: number;
  itemId?: string;
  description: string;
}

// ============================================================================
// ACHIEVEMENT SYSTEM (Enhanced)
// ============================================================================

export type AchievementCategory = 'productivity' | 'energy' | 'team' | 'focus' | 'social' | 'script' | 'collection' | 'seasonal' | 'hidden';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  rarity: ItemRarity;
  icon: string;
  criteria: AchievementCriteria;
  rewards: AchievementReward[];
  hidden: boolean; // Secret achievements
  unlocked: boolean;
  progress: number;
  unlockedAt?: Date;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface AchievementCriteria {
  type: 'count' | 'streak' | 'threshold' | 'collection' | 'special';
  target: number;
  metric: string; // What to track
  additionalConditions?: any;
}

export interface AchievementReward {
  type: 'xp' | 'title' | 'badge' | 'item' | 'pet' | 'currency';
  amount?: number;
  itemId?: string;
  name: string;
  description?: string;
}

// ============================================================================
// MASTERY SYSTEM
// ============================================================================

export type MasteryCategory = 'task' | 'energy' | 'team' | 'focus' | 'social' | 'script';

export interface MasteryTree {
  category: MasteryCategory;
  level: number;
  xp: number;
  nextLevelXp: number;
  totalXpEarned: number;
  unlockedPerks: string[];
  availablePerks: MasteryPerk[];
  color: string;
  icon: string;
  description: string;
}

export interface MasteryPerk {
  id: string;
  name: string;
  description: string;
  category: MasteryCategory;
  requiredLevel: number;
  unlocked: boolean;
  effect: PerkEffect;
  icon: string;
}

export interface PrestigeOptions {
  currentTotalLevel: number;
  requiredLevel: number;
  canPrestige: boolean;
  prestigeBonus: number; // % XP boost
  previousPrestiges: number;
  rewards: PrestigeReward[];
}

export interface PrestigeReward {
  type: 'permanent_xp_boost' | 'exclusive_title' | 'cosmetic' | 'unlock';
  value: number | string;
  description: string;
}

// ============================================================================
// EVENT SYSTEM
// ============================================================================

export type EventType = 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'one_time' | 'boss_battle';

export interface GameEvent {
  id: string;
  name: string;
  description: string;
  type: EventType;
  startDate: Date;
  endDate: Date;
  active: boolean;
  icon: string;
  banner: string;
  theme: string;
  
  // Event Mechanics
  bonuses: EventBonus[];
  challenges: EventChallenge[];
  leaderboard?: EventLeaderboard;
  
  // Boss Battle specific
  bossHealth?: number;
  bossMaxHealth?: number;
  bossName?: string;
  bossDescription?: string;
  
  // Participation
  participantCount?: number;
  userParticipating?: boolean;
}

export interface EventBonus {
  type: 'xp_multiplier' | 'season_xp_boost' | 'item_drop_rate' | 'special_quest_access' | 'energy_boost';
  value: number;
  description: string;
  active: boolean;
}

export interface EventChallenge {
  id: string;
  name: string;
  description: string;
  type: 'individual' | 'community';
  progress: number;
  target: number;
  reward: Reward;
  completed: boolean;
}

export interface EventLeaderboard {
  entries: EventLeaderboardEntry[];
  userRank?: number;
  prizes: EventPrize[];
}

export interface EventLeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar: string;
  score: number;
  isCurrentUser?: boolean;
}

export interface EventPrize {
  rankStart: number;
  rankEnd: number;
  rewards: Reward[];
}

// ============================================================================
// SOCIAL SYSTEM
// ============================================================================

export type FriendshipLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface Friend {
  userId: string;
  userName: string;
  userAvatar: string;
  level: number;
  friendshipLevel: FriendshipLevel;
  friendshipXp: number;
  nextLevelXp: number;
  status: 'online' | 'offline' | 'away';
  lastActive: Date;
  addedAt: Date;
  stats: {
    kudosReceived: number;
    giftsReceived: number;
    challengesCompleted: number;
  };
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string;
  toUserId: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

export interface FriendChallenge {
  id: string;
  fromUserId: string;
  toUserId: string;
  challengeType: 'task_race' | 'xp_competition' | 'energy_battle' | 'focus_duel';
  name: string;
  description: string;
  target: number;
  duration: number; // Hours
  startDate: Date;
  endDate: Date;
  fromUserProgress: number;
  toUserProgress: number;
  status: 'pending' | 'active' | 'completed';
  winner?: string;
  rewards: Reward[];
}

export interface Gift {
  id: string;
  fromUserId: string;
  toUserId: string;
  itemType: 'xp_boost' | 'streak_freeze' | 'energy_potion' | 'pet_food' | 'currency';
  amount: number;
  message?: string;
  sentAt: Date;
  claimed: boolean;
}

// ============================================================================
// INVENTORY & ITEMS
// ============================================================================

export interface InventoryItem {
  id: string;
  type: 'consumable' | 'cosmetic' | 'currency' | 'pet_item' | 'quest_item';
  name: string;
  description: string;
  icon: string;
  rarity: ItemRarity;
  quantity: number;
  tradeable: boolean;
  usable: boolean;
  effect?: ItemEffect;
}

export interface ItemEffect {
  type: 'xp_boost' | 'energy_restore' | 'streak_protect' | 'pet_evolve' | 'unlock';
  value: number | string;
  duration?: number; // Minutes
}

// ============================================================================
// LEADERBOARD TYPES
// ============================================================================

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar: string;
  level: number;
  xp: number;
  league: LeagueTier;
  guild?: string;
  class?: PlayerClass;
  title?: string;
  change: 'up' | 'down' | 'same';
  isCurrentUser?: boolean;
}

export type LeaderboardType = 'global' | 'friends' | 'guild' | 'class' | 'league';

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface GamificationNotification {
  id: string;
  type: 'achievement' | 'quest' | 'league' | 'friend' | 'guild' | 'event' | 'level_up' | 'pet';
  title: string;
  message: string;
  icon?: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

// ============================================================================
// ANALYTICS EVENTS
// ============================================================================

export interface GamificationAnalyticsEvent {
  event: string;
  userId: string;
  timestamp: Date;
  properties: {
    [key: string]: any;
  };
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface CelebrationState {
  type: 'level_up' | 'achievement' | 'quest_complete' | 'league_promotion' | 'pet_hatch' | 'pet_evolve';
  data: any;
  active: boolean;
}

export interface TooltipData {
  title: string;
  description: string;
  value?: number;
  bonus?: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface XPGain {
  amount: number;
  source: string;
  multipliers: {
    base: number;
    class?: number;
    pet?: number;
    guild?: number;
    event?: number;
    prestige?: number;
    total: number;
  };
  finalAmount: number;
}

export interface ProgressIndicator {
  current: number;
  target: number;
  percentage: number;
  label: string;
}
