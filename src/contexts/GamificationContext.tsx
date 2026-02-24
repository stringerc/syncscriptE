import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { toast } from 'sonner@2.0.3';
import {
  UserGamificationProfile,
  Quest,
  League,
  SeasonPass,
  Pet,
  Guild,
  GameEvent,
  Achievement,
  MasteryTree,
  Friend,
  XPGain,
  LeagueTier,
  PlayerClass,
  MasteryCategory,
  QuestType,
  CelebrationState,
} from '../types/gamification';
import { CURRENT_USER } from '../utils/user-constants';

// ============================================================================
// CONTEXT TYPE DEFINITION
// ============================================================================

interface GamificationContextType {
  // State
  profile: UserGamificationProfile;
  activeQuests: Quest[];
  currentLeague: League | null;
  seasonPass: SeasonPass | null;
  activePet: Pet | null;
  ownedPets: Pet[];
  guild: Guild | null;
  activeEvents: GameEvent[];
  achievements: Achievement[];
  masteryTrees: MasteryTree[];
  friends: Friend[];
  celebrations: CelebrationState[];
  
  // Core Actions
  earnXP: (amount: number, source: string) => XPGain;
  earnSeasonXP: (amount: number, source: string) => void;
  earnMasteryXP: (category: MasteryCategory, amount: number, source: string) => void;
  
  // Quest Actions
  acceptQuest: (questId: string) => void;
  abandonQuest: (questId: string) => void;
  completeQuest: (questId: string) => void;
  updateQuestProgress: (questId: string, objectiveId: string, progress: number) => void;
  
  // Achievement Actions
  unlockAchievement: (achievementId: string) => void;
  checkAchievementProgress: (achievementId: string, progress: number) => void;
  
  // League Actions
  getLeagueStandings: () => void;
  promoteToLeague: (newTier: LeagueTier) => void;
  demoteFromLeague: (newTier: LeagueTier) => void;
  
  // Season Actions
  claimSeasonReward: (tier: number, isPremium: boolean) => void;
  purchasePremiumPass: () => void;
  
  // Pet Actions
  hatchPetEgg: (eggId: string) => void;
  feedPet: (petId: string) => void;
  evolvePet: (petId: string, evolutionPath: string) => void;
  setActivePet: (petId: string | null) => void;
  
  // Class Actions
  selectClass: (classType: PlayerClass) => void;
  unlockSkill: (skillId: string) => void;
  useSkill: (skillId: string) => void;
  
  // Guild Actions
  joinGuild: (guildId: string) => void;
  leaveGuild: () => void;
  contributeToGuild: (amount: number) => void;
  
  // Social Actions
  addFriend: (userId: string) => void;
  removeFriend: (userId: string) => void;
  sendKudos: (userId: string) => void;
  sendGift: (userId: string, itemType: string, amount: number) => void;
  
  // Mastery Actions
  unlockMasteryPerk: (category: MasteryCategory, perkId: string) => void;
  performPrestige: () => void;
  
  // Celebration Actions
  triggerCelebration: (type: CelebrationState['type'], data: any) => void;
  dismissCelebration: (index: number) => void;
  
  // Utility
  getXPMultiplier: () => number;
  canPrestige: () => boolean;
  refreshDailyQuests: () => void;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const GamificationContext = createContext<GamificationContextType | null>(null);

// ============================================================================
// DEFAULT DATA & CONSTANTS
// ============================================================================

const DEFAULT_PROFILE: UserGamificationProfile = {
  userId: CURRENT_USER.email,
  
  // Core Progression
  level: CURRENT_USER.level ?? 1,
  xp: CURRENT_USER.xp ?? 0,
  nextLevelXp: CURRENT_USER.nextLevelXP ?? 100,
  totalXpEarned: 125000,
  
  // League
  currentLeague: 'gold',
  leagueRank: 12,
  leagueXp: 1450,
  leagueId: 'gold-league-week-42',
  
  // Season
  seasonLevel: 47,
  seasonXp: 8900,
  hasPremiumPass: false,
  
  // Class
  class: null,
  classLevel: 0,
  skillPoints: 0,
  unlockedSkills: [],
  
  // Pet
  activePetId: null,
  ownedPetIds: [],
  
  // Guild
  guildId: null,
  guildRank: 'member',
  
  // Mastery
  masteryLevels: {
    task: 12,
    energy: 8,
    team: 15,
    focus: 10,
    social: 6,
    script: 4,
  },
  
  masteryXp: {
    task: 2400,
    energy: 1500,
    team: 3200,
    focus: 1900,
    social: 850,
    script: 450,
  },
  
  // Prestige
  prestigeLevel: 0,
  totalPrestiges: 0,
  
  // Social
  friendIds: [],
  friendshipLevels: {},
  kudosGiven: 234,
  kudosReceived: 189,
  
  // Titles & Badges
  equippedTitle: null,
  unlockedTitles: ['Week Warrior', 'Team Player', 'Resonance Guru'],
  unlockedBadges: ['7_day_streak', 'team_helper', 'energy_master_bronze'],
  
  // Achievements
  unlockedAchievements: ['week_warrior', 'team_player', 'resonance_guru'],
  achievementProgress: {
    'energy_master': 73,
    'goal_crusher': 87,
    'early_bird': 45,
    'focus_legend': 30,
    'mentor': 60,
  },
  
  // Inventory
  inventory: {
    xpBoosts: 3,
    streakFreezes: 2,
    energyPotions: 5,
    petEggs: [],
    petFood: 15,
    guildTokens: 450,
    seasonTokens: 1200,
    evolutionStones: 2,
    tradeTickets: 8,
  },
  
  // Stats
  stats: {
    tasksCompleted: 1247,
    focusHours: 486,
    teamCollaborations: 89,
    questsCompleted: 156,
    achievementsUnlocked: 23,
    petsCollected: 0,
    guildsJoined: 0,
    friendsAdded: 0,
    leaguePromotions: 4,
    leagueDemotions: 1,
    seasonPassesCompleted: 1,
    prestigesPerformed: 0,
    longestStreak: CURRENT_USER.longestStreak ?? 0,
    currentStreak: CURRENT_USER.currentStreak ?? 0,
    totalDaysActive: 156,
  },
  
  // Preferences
  preferences: {
    showXpNumbers: true,
    showPetAnimations: true,
    enableNotifications: true,
    leaderboardVisibility: 'public',
    allowFriendRequests: true,
    allowGuildInvites: true,
    showClassBonuses: true,
    enableCelebrations: true,
  },
};

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export function GamificationProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserGamificationProfile>(DEFAULT_PROFILE);
  const [activeQuests, setActiveQuests] = useState<Quest[]>([]);
  const [currentLeague, setCurrentLeague] = useState<League | null>(null);
  const [seasonPass, setSeasonPass] = useState<SeasonPass | null>(null);
  const [activePet, setActivePetState] = useState<Pet | null>(null);
  const [ownedPets, setOwnedPets] = useState<Pet[]>([]);
  const [guild, setGuild] = useState<Guild | null>(null);
  const [activeEvents, setActiveEvents] = useState<GameEvent[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [masteryTrees, setMasteryTrees] = useState<MasteryTree[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [celebrations, setCelebrations] = useState<CelebrationState[]>([]);
  
  // ============================================================================
  // XP & LEVELING
  // ============================================================================
  
  const getXPMultiplier = useCallback((): number => {
    let multiplier = 1.0;
    
    // Class bonuses
    if (profile.class === 'sprinter') multiplier += 0.15;
    if (profile.class === 'marathon') multiplier += 0.10;
    
    // Pet bonuses
    if (activePet) {
      const xpBonus = activePet.bonuses.find(b => b.type === 'xp_boost');
      if (xpBonus) multiplier += xpBonus.value / 100;
    }
    
    // Guild bonuses
    if (guild) {
      const guildXpPerk = guild.unlockedPerks.find(p => p.effect.type === 'xp_boost');
      if (guildXpPerk) multiplier += guildXpPerk.effect.value / 100;
    }
    
    // Prestige bonuses
    multiplier += profile.prestigeLevel * 0.05;
    
    // Event bonuses
    activeEvents.forEach(event => {
      const xpBonus = event.bonuses.find(b => b.type === 'xp_multiplier' && b.active);
      if (xpBonus) multiplier += (xpBonus.value - 1);
    });
    
    return multiplier;
  }, [profile.class, profile.prestigeLevel, activePet, guild, activeEvents]);
  
  const earnXP = useCallback((amount: number, source: string): XPGain => {
    const multiplier = getXPMultiplier();
    const finalAmount = Math.round(amount * multiplier);
    
    const xpGain: XPGain = {
      amount,
      source,
      multipliers: {
        base: 1.0,
        class: profile.class ? 0.1 : 0,
        pet: activePet ? 0.05 : 0,
        prestige: profile.prestigeLevel * 0.05,
        total: multiplier,
      },
      finalAmount,
    };
    
    setProfile(prev => {
      const newXP = prev.xp + finalAmount;
      const newLevel = newXP >= prev.nextLevelXp ? prev.level + 1 : prev.level;
      const leveledUp = newLevel > prev.level;
      
      if (leveledUp) {
        triggerCelebration('level_up', { level: newLevel, xpGained: finalAmount });
        toast.success(`Level Up! You're now level ${newLevel}!`, {
          description: `You earned ${finalAmount} XP from ${source}`,
          duration: 5000,
        });
      }
      
      return {
        ...prev,
        xp: leveledUp ? newXP - prev.nextLevelXp : newXP,
        level: newLevel,
        nextLevelXp: leveledUp ? Math.round(prev.nextLevelXp * 1.15) : prev.nextLevelXp,
        totalXpEarned: prev.totalXpEarned + finalAmount,
      };
    });
    
    return xpGain;
  }, [getXPMultiplier, profile.class, profile.prestigeLevel, activePet]);
  
  const earnSeasonXP = useCallback((amount: number, source: string) => {
    setProfile(prev => {
      const newSeasonXP = prev.seasonXp + amount;
      const tierXP = 200; // XP per tier
      const newSeasonLevel = Math.floor(newSeasonXP / tierXP);
      const leveledUp = newSeasonLevel > prev.seasonLevel;
      
      if (leveledUp) {
        toast.success(`Season Pass Level Up! Now at tier ${newSeasonLevel}`, {
          description: `Unlock your rewards!`,
          duration: 4000,
        });
      }
      
      return {
        ...prev,
        seasonXp: newSeasonXP,
        seasonLevel: newSeasonLevel,
      };
    });
  }, []);
  
  const earnMasteryXP = useCallback((category: MasteryCategory, amount: number, source: string) => {
    setProfile(prev => {
      const currentXP = prev.masteryXp[category];
      const currentLevel = prev.masteryLevels[category];
      const nextLevelXP = currentLevel * 500; // Scaling requirement
      const newXP = currentXP + amount;
      const newLevel = newXP >= nextLevelXP ? currentLevel + 1 : currentLevel;
      const leveledUp = newLevel > currentLevel;
      
      if (leveledUp) {
        toast.success(`${category.charAt(0).toUpperCase() + category.slice(1)} Mastery Level Up!`, {
          description: `Now at level ${newLevel}. New perks available!`,
          duration: 4000,
        });
      }
      
      return {
        ...prev,
        masteryXp: {
          ...prev.masteryXp,
          [category]: leveledUp ? newXP - nextLevelXP : newXP,
        },
        masteryLevels: {
          ...prev.masteryLevels,
          [category]: newLevel,
        },
      };
    });
  }, []);
  
  // ============================================================================
  // QUEST SYSTEM
  // ============================================================================
  
  const acceptQuest = useCallback((questId: string) => {
    // TODO: Load quest from available pool
    toast.success('Quest Accepted!', {
      description: 'Track your progress in the Quests tab',
      duration: 3000,
    });
  }, []);
  
  const abandonQuest = useCallback((questId: string) => {
    setActiveQuests(prev => prev.filter(q => q.id !== questId));
    toast.info('Quest Abandoned', {
      duration: 2000,
    });
  }, []);
  
  const completeQuest = useCallback((questId: string) => {
    const quest = activeQuests.find(q => q.id === questId);
    if (!quest) return;
    
    // Award rewards
    quest.rewards.forEach(reward => {
      if (reward.type === 'xp') {
        earnXP(reward.amount || 0, `Quest: ${quest.title}`);
      } else if (reward.type === 'seasonXp') {
        earnSeasonXP(reward.amount || 0, `Quest: ${quest.title}`);
      }
    });
    
    // Update quest status
    setActiveQuests(prev => prev.filter(q => q.id !== questId));
    
    // Update stats
    setProfile(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        questsCompleted: prev.stats.questsCompleted + 1,
      },
    }));
    
    triggerCelebration('quest_complete', quest);
    
    toast.success('Quest Complete!', {
      description: quest.title,
      duration: 4000,
    });
  }, [activeQuests, earnXP, earnSeasonXP]);
  
  const updateQuestProgress = useCallback((questId: string, objectiveId: string, progress: number) => {
    setActiveQuests(prev => prev.map(quest => {
      if (quest.id !== questId) return quest;
      
      const updatedObjectives = quest.objectives.map(obj => {
        if (obj.id !== objectiveId) return obj;
        return {
          ...obj,
          current: Math.min(progress, obj.target),
          completed: progress >= obj.target,
        };
      });
      
      const allComplete = updatedObjectives.every(obj => obj.completed);
      const overallProgress = updatedObjectives.reduce((sum, obj) => sum + (obj.current / obj.target), 0) / updatedObjectives.length * 100;
      
      if (allComplete && quest.status === 'active') {
        // Auto-complete quest when all objectives done
        setTimeout(() => completeQuest(questId), 500);
      }
      
      return {
        ...quest,
        objectives: updatedObjectives,
        progress: overallProgress,
      };
    }));
  }, [completeQuest]);
  
  const refreshDailyQuests = useCallback(() => {
    // TODO: Fetch new daily quests from API
    toast.info('Daily Quests Refreshed!', {
      description: 'New challenges await',
      duration: 3000,
    });
  }, []);
  
  // ============================================================================
  // ACHIEVEMENT SYSTEM
  // ============================================================================
  
  const unlockAchievement = useCallback((achievementId: string) => {
    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement || achievement.unlocked) return;
    
    setAchievements(prev => prev.map(a => 
      a.id === achievementId ? { ...a, unlocked: true, unlockedAt: new Date() } : a
    ));
    
    setProfile(prev => ({
      ...prev,
      unlockedAchievements: [...prev.unlockedAchievements, achievementId],
      stats: {
        ...prev.stats,
        achievementsUnlocked: prev.stats.achievementsUnlocked + 1,
      },
    }));
    
    // Award rewards
    achievement.rewards.forEach(reward => {
      if (reward.type === 'xp') {
        earnXP(reward.amount || 0, `Achievement: ${achievement.title}`);
      } else if (reward.type === 'title') {
        setProfile(prev => ({
          ...prev,
          unlockedTitles: [...prev.unlockedTitles, reward.name],
        }));
      }
    });
    
    triggerCelebration('achievement', achievement);
    
    toast.success(`Achievement Unlocked: ${achievement.title}!`, {
      description: achievement.description,
      duration: 5000,
    });
  }, [achievements, earnXP]);
  
  const checkAchievementProgress = useCallback((achievementId: string, progress: number) => {
    setProfile(prev => ({
      ...prev,
      achievementProgress: {
        ...prev.achievementProgress,
        [achievementId]: progress,
      },
    }));
    
    // Check if achievement should unlock
    const achievement = achievements.find(a => a.id === achievementId);
    if (achievement && !achievement.unlocked && progress >= achievement.criteria.target) {
      unlockAchievement(achievementId);
    }
  }, [achievements, unlockAchievement]);
  
  // ============================================================================
  // LEAGUE SYSTEM
  // ============================================================================
  
  const getLeagueStandings = useCallback(() => {
    // TODO: Fetch from API
  }, []);
  
  const promoteToLeague = useCallback((newTier: LeagueTier) => {
    setProfile(prev => ({
      ...prev,
      currentLeague: newTier,
      stats: {
        ...prev.stats,
        leaguePromotions: prev.stats.leaguePromotions + 1,
      },
    }));
    
    triggerCelebration('league_promotion', { tier: newTier });
    
    toast.success(`Promoted to ${newTier.charAt(0).toUpperCase() + newTier.slice(1)} League!`, {
      description: 'Congratulations on your achievement!',
      duration: 5000,
    });
  }, []);
  
  const demoteFromLeague = useCallback((newTier: LeagueTier) => {
    setProfile(prev => ({
      ...prev,
      currentLeague: newTier,
      stats: {
        ...prev.stats,
        leagueDemotions: prev.stats.leagueDemotions + 1,
      },
    }));
    
    toast.info(`Moved to ${newTier.charAt(0).toUpperCase() + newTier.slice(1)} League`, {
      description: 'Keep pushing to climb back up!',
      duration: 4000,
    });
  }, []);
  
  // ============================================================================
  // SEASON PASS
  // ============================================================================
  
  const claimSeasonReward = useCallback((tier: number, isPremium: boolean) => {
    toast.success('Reward Claimed!', {
      description: `Season tier ${tier} reward added to inventory`,
      duration: 3000,
    });
  }, []);
  
  const purchasePremiumPass = useCallback(() => {
    setProfile(prev => ({
      ...prev,
      hasPremiumPass: true,
    }));
    
    toast.success('Premium Season Pass Activated!', {
      description: 'Unlock all premium rewards!',
      duration: 4000,
    });
  }, []);
  
  // ============================================================================
  // PET SYSTEM
  // ============================================================================
  
  const hatchPetEgg = useCallback((eggId: string) => {
    // TODO: Create new pet from egg
    triggerCelebration('pet_hatch', { eggId });
    
    toast.success('Pet Hatched!', {
      description: 'A new companion joins your journey!',
      duration: 4000,
    });
  }, []);
  
  const feedPet = useCallback((petId: string) => {
    setOwnedPets(prev => prev.map(pet => {
      if (pet.id !== petId) return pet;
      return {
        ...pet,
        hunger: Math.min(100, pet.hunger + 20),
        happiness: Math.min(100, pet.happiness + 5),
        lastFed: new Date(),
      };
    }));
    
    toast.success('Pet Fed!', {
      duration: 2000,
    });
  }, []);
  
  const evolvePet = useCallback((petId: string, evolutionPath: string) => {
    triggerCelebration('pet_evolve', { petId, evolutionPath });
    
    toast.success('Pet Evolved!', {
      description: 'Your companion has grown stronger!',
      duration: 4000,
    });
  }, []);
  
  const setActivePet = useCallback((petId: string | null) => {
    setProfile(prev => ({
      ...prev,
      activePetId: petId,
    }));
    
    const pet = ownedPets.find(p => p.id === petId);
    setActivePetState(pet || null);
    
    if (pet) {
      toast.success(`${pet.nickname} is now active!`, {
        duration: 2000,
      });
    }
  }, [ownedPets]);
  
  // ============================================================================
  // CLASS SYSTEM
  // ============================================================================
  
  const selectClass = useCallback((classType: PlayerClass) => {
    setProfile(prev => ({
      ...prev,
      class: classType,
      classLevel: 1,
    }));
    
    toast.success(`Class Selected: ${classType.charAt(0).toUpperCase() + classType.slice(1)}!`, {
      description: 'Your journey begins!',
      duration: 4000,
    });
  }, []);
  
  const unlockSkill = useCallback((skillId: string) => {
    setProfile(prev => ({
      ...prev,
      unlockedSkills: [...prev.unlockedSkills, skillId],
    }));
    
    toast.success('New Skill Unlocked!', {
      duration: 3000,
    });
  }, []);
  
  const useSkill = useCallback((skillId: string) => {
    toast.info('Skill Activated!', {
      duration: 2000,
    });
  }, []);
  
  // ============================================================================
  // GUILD SYSTEM
  // ============================================================================
  
  const joinGuild = useCallback((guildId: string) => {
    setProfile(prev => ({
      ...prev,
      guildId,
      guildRank: 'recruit',
      stats: {
        ...prev.stats,
        guildsJoined: prev.stats.guildsJoined + 1,
      },
    }));
    
    toast.success('Joined Guild!', {
      description: 'Welcome to your new guild!',
      duration: 3000,
    });
  }, []);
  
  const leaveGuild = useCallback(() => {
    setProfile(prev => ({
      ...prev,
      guildId: null,
      guildRank: 'member',
    }));
    setGuild(null);
    
    toast.info('Left Guild', {
      duration: 2000,
    });
  }, []);
  
  const contributeToGuild = useCallback((amount: number) => {
    toast.success(`Contributed ${amount} to guild!`, {
      duration: 2000,
    });
  }, []);
  
  // ============================================================================
  // SOCIAL SYSTEM
  // ============================================================================
  
  const addFriend = useCallback((userId: string) => {
    setProfile(prev => ({
      ...prev,
      friendIds: [...prev.friendIds, userId],
      stats: {
        ...prev.stats,
        friendsAdded: prev.stats.friendsAdded + 1,
      },
    }));
    
    toast.success('Friend Added!', {
      duration: 2000,
    });
  }, []);
  
  const removeFriend = useCallback((userId: string) => {
    setProfile(prev => ({
      ...prev,
      friendIds: prev.friendIds.filter(id => id !== userId),
    }));
    
    toast.info('Friend Removed', {
      duration: 2000,
    });
  }, []);
  
  const sendKudos = useCallback((userId: string) => {
    setProfile(prev => ({
      ...prev,
      kudosGiven: prev.kudosGiven + 1,
    }));
    
    toast.success('Kudos Sent!', {
      duration: 2000,
    });
  }, []);
  
  const sendGift = useCallback((userId: string, itemType: string, amount: number) => {
    toast.success('Gift Sent!', {
      description: `Your friend will receive ${amount}x ${itemType}`,
      duration: 3000,
    });
  }, []);
  
  // ============================================================================
  // MASTERY SYSTEM
  // ============================================================================
  
  const unlockMasteryPerk = useCallback((category: MasteryCategory, perkId: string) => {
    toast.success('Mastery Perk Unlocked!', {
      duration: 3000,
    });
  }, []);
  
  const canPrestige = useCallback((): boolean => {
    const totalMasteryLevel = Object.values(profile.masteryLevels).reduce((sum, level) => sum + level, 0);
    return totalMasteryLevel >= 300;
  }, [profile.masteryLevels]);
  
  const performPrestige = useCallback(() => {
    if (!canPrestige()) {
      toast.error('Cannot prestige yet', {
        description: 'Reach total mastery level 300 first',
        duration: 3000,
      });
      return;
    }
    
    setProfile(prev => ({
      ...prev,
      prestigeLevel: prev.prestigeLevel + 1,
      totalPrestiges: prev.totalPrestiges + 1,
      masteryLevels: {
        task: 0,
        energy: 0,
        team: 0,
        focus: 0,
        social: 0,
        script: 0,
      },
      masteryXp: {
        task: 0,
        energy: 0,
        team: 0,
        focus: 0,
        social: 0,
        script: 0,
      },
      stats: {
        ...prev.stats,
        prestigesPerformed: prev.stats.prestigesPerformed + 1,
      },
    }));
    
    toast.success('Prestige Complete!', {
      description: `Now at Prestige ${profile.prestigeLevel + 1}. +5% permanent XP boost!`,
      duration: 5000,
    });
  }, [canPrestige, profile.prestigeLevel]);
  
  // ============================================================================
  // CELEBRATIONS
  // ============================================================================
  
  const triggerCelebration = useCallback((type: CelebrationState['type'], data: any) => {
    if (!profile.preferences.enableCelebrations) return;
    
    setCelebrations(prev => [...prev, { type, data, active: true }]);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setCelebrations(prev => prev.slice(1));
    }, 5000);
  }, [profile.preferences.enableCelebrations]);
  
  const dismissCelebration = useCallback((index: number) => {
    setCelebrations(prev => prev.filter((_, i) => i !== index));
  }, []);
  
  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================
  
  const value: GamificationContextType = {
    // State
    profile,
    activeQuests,
    currentLeague,
    seasonPass,
    activePet,
    ownedPets,
    guild,
    activeEvents,
    achievements,
    masteryTrees,
    friends,
    celebrations,
    
    // Core Actions
    earnXP,
    earnSeasonXP,
    earnMasteryXP,
    
    // Quest Actions
    acceptQuest,
    abandonQuest,
    completeQuest,
    updateQuestProgress,
    
    // Achievement Actions
    unlockAchievement,
    checkAchievementProgress,
    
    // League Actions
    getLeagueStandings,
    promoteToLeague,
    demoteFromLeague,
    
    // Season Actions
    claimSeasonReward,
    purchasePremiumPass,
    
    // Pet Actions
    hatchPetEgg,
    feedPet,
    evolvePet,
    setActivePet,
    
    // Class Actions
    selectClass,
    unlockSkill,
    useSkill,
    
    // Guild Actions
    joinGuild,
    leaveGuild,
    contributeToGuild,
    
    // Social Actions
    addFriend,
    removeFriend,
    sendKudos,
    sendGift,
    
    // Mastery Actions
    unlockMasteryPerk,
    performPrestige,
    
    // Celebration Actions
    triggerCelebration,
    dismissCelebration,
    
    // Utility
    getXPMultiplier,
    canPrestige,
    refreshDailyQuests,
  };
  
  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useGamification() {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within GamificationProvider');
  }
  return context;
}
