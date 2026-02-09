// ============================================================================
// GAMIFICATION DATA CONSTANTS
// All static data for quests, achievements, classes, pets, leagues, etc.
// ============================================================================

import {
  Target, Zap, Users, Brain, Clock, Heart, Mountain, Flame,
  Trophy, Star, Award, CheckCircle2, Coffee, Rocket, Gem,
  Shield, Swords, Crown, Medal, Sparkles, TrendingUp, Calendar
} from 'lucide-react';
import {
  Quest,
  Achievement,
  ClassDefinition,
  PetSpecies,
  SeasonPass,
  GameEvent,
  MasteryTree,
  LeagueTier,
  PlayerClass,
  ItemRarity,
  PetElement,
} from '../types/gamification';

// ============================================================================
// QUEST POOLS
// ============================================================================

export const DAILY_QUESTS_POOL: Omit<Quest, 'status' | 'progress' | 'acceptedAt' | 'completedAt'>[] = [
  {
    id: 'daily_tasks_5',
    type: 'daily',
    title: 'Daily Hustle',
    description: 'Complete 5 tasks today',
    objectives: [
      {
        id: 'obj_1',
        description: 'Complete 5 tasks',
        type: 'task_completion',
        target: 5,
        current: 0,
        completed: false,
      },
    ],
    rewards: [
      { type: 'xp', amount: 50 },
      { type: 'seasonXp', amount: 25 },
    ],
    difficulty: 'easy',
    requiredLevel: 1,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  },
  {
    id: 'daily_energy_maintain',
    type: 'daily',
    title: 'Energized All Day',
    description: 'Maintain 80%+ energy for 8 hours',
    objectives: [
      {
        id: 'obj_1',
        description: 'Maintain high energy',
        type: 'energy_maintenance',
        target: 8,
        current: 0,
        completed: false,
      },
    ],
    rewards: [
      { type: 'xp', amount: 40 },
      { type: 'seasonXp', amount: 20 },
    ],
    difficulty: 'medium',
    requiredLevel: 1,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  },
  {
    id: 'daily_focus_session',
    type: 'daily',
    title: 'Deep Dive',
    description: 'Complete a 2-hour focus session',
    objectives: [
      {
        id: 'obj_1',
        description: 'Focus for 2 hours',
        type: 'focus_session',
        target: 2,
        current: 0,
        completed: false,
      },
    ],
    rewards: [
      { type: 'xp', amount: 60 },
      { type: 'seasonXp', amount: 30 },
    ],
    difficulty: 'medium',
    requiredLevel: 1,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  },
  {
    id: 'daily_team_collab',
    type: 'daily',
    title: 'Team Spirit',
    description: 'Send a message to a teammate',
    objectives: [
      {
        id: 'obj_1',
        description: 'Message a teammate',
        type: 'social_interaction',
        target: 1,
        current: 0,
        completed: false,
      },
    ],
    rewards: [
      { type: 'xp', amount: 30 },
      { type: 'seasonXp', amount: 15 },
    ],
    difficulty: 'easy',
    requiredLevel: 1,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  },
  {
    id: 'daily_review_wins',
    type: 'daily',
    title: 'Reflect & Grow',
    description: 'Review yesterday\'s accomplishments',
    objectives: [
      {
        id: 'obj_1',
        description: 'Review wins',
        type: 'custom',
        target: 1,
        current: 0,
        completed: false,
      },
    ],
    rewards: [
      { type: 'xp', amount: 20 },
      { type: 'seasonXp', amount: 10 },
    ],
    difficulty: 'easy',
    requiredLevel: 1,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  },
];

export const WEEKLY_QUESTS_POOL: Omit<Quest, 'status' | 'progress' | 'acceptedAt' | 'completedAt'>[] = [
  {
    id: 'weekly_tasks_30',
    type: 'weekly',
    title: 'Productivity Sprint',
    description: 'Complete 30 tasks this week',
    objectives: [
      {
        id: 'obj_1',
        description: 'Complete 30 tasks',
        type: 'task_completion',
        target: 30,
        current: 0,
        completed: false,
      },
    ],
    rewards: [
      { type: 'xp', amount: 200 },
      { type: 'seasonXp', amount: 100 },
      { type: 'item', itemId: 'xp_boost', itemName: 'XP Boost', amount: 1 },
    ],
    difficulty: 'medium',
    requiredLevel: 5,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'weekly_streak_maintain',
    type: 'weekly',
    title: 'Consistency King',
    description: 'Maintain your streak for 7 days',
    objectives: [
      {
        id: 'obj_1',
        description: 'Don\'t break your streak',
        type: 'custom',
        target: 7,
        current: 0,
        completed: false,
      },
    ],
    rewards: [
      { type: 'xp', amount: 300 },
      { type: 'seasonXp', amount: 150 },
      { type: 'item', itemId: 'streak_freeze', itemName: 'Streak Freeze', amount: 1 },
    ],
    difficulty: 'medium',
    requiredLevel: 1,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'weekly_team_contribution',
    type: 'weekly',
    title: 'Team Champion',
    description: 'Contribute to 3 team goals',
    objectives: [
      {
        id: 'obj_1',
        description: 'Help with team goals',
        type: 'team_collaboration',
        target: 3,
        current: 0,
        completed: false,
      },
    ],
    rewards: [
      { type: 'xp', amount: 250 },
      { type: 'seasonXp', amount: 125 },
    ],
    difficulty: 'hard',
    requiredLevel: 10,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
];

export const EPIC_QUESTS: Omit<Quest, 'status' | 'progress' | 'acceptedAt' | 'completedAt'>[] = [
  {
    id: 'epic_productivity_awakening_ch1',
    type: 'epic',
    title: 'The Productivity Awakening - Chapter 1',
    description: 'Build Your Foundation',
    story: 'Every journey begins with a single step. Master the basics to unlock your true potential.',
    chapter: 1,
    totalChapters: 4,
    objectives: [
      {
        id: 'obj_1',
        description: 'Complete your profile',
        type: 'custom',
        target: 1,
        current: 0,
        completed: false,
      },
      {
        id: 'obj_2',
        description: 'Complete the tutorial',
        type: 'custom',
        target: 1,
        current: 0,
        completed: false,
      },
      {
        id: 'obj_3',
        description: 'Complete 10 tasks',
        type: 'task_completion',
        target: 10,
        current: 0,
        completed: false,
      },
    ],
    rewards: [
      { type: 'xp', amount: 500 },
      { type: 'seasonXp', amount: 250 },
      { type: 'title', itemId: 'the_initiated', itemName: 'The Initiated' },
    ],
    difficulty: 'easy',
    requiredLevel: 1,
  },
  {
    id: 'epic_productivity_awakening_ch2',
    type: 'epic',
    title: 'The Productivity Awakening - Chapter 2',
    description: 'Master Your Energy',
    story: 'Energy is the foundation of productivity. Learn to harness and optimize yours.',
    chapter: 2,
    totalChapters: 4,
    objectives: [
      {
        id: 'obj_1',
        description: 'Track energy for 7 days',
        type: 'energy_maintenance',
        target: 7,
        current: 0,
        completed: false,
      },
      {
        id: 'obj_2',
        description: 'Optimize your schedule',
        type: 'custom',
        target: 1,
        current: 0,
        completed: false,
      },
      {
        id: 'obj_3',
        description: 'Complete 5 focus sessions',
        type: 'focus_session',
        target: 5,
        current: 0,
        completed: false,
      },
    ],
    rewards: [
      { type: 'xp', amount: 750 },
      { type: 'seasonXp', amount: 375 },
      { type: 'pet', itemId: 'ember_egg', itemName: 'Ember Egg' },
    ],
    difficulty: 'medium',
    requiredLevel: 5,
  },
];

// ============================================================================
// ACHIEVEMENT DEFINITIONS
// ============================================================================

export const ACHIEVEMENTS: Achievement[] = [
  // Productivity Category
  {
    id: 'week_warrior',
    title: 'Week Warrior',
    description: 'Complete tasks for 7 consecutive days',
    category: 'productivity',
    rarity: 'common',
    icon: '🔥',
    criteria: {
      type: 'streak',
      target: 7,
      metric: 'daily_completion',
    },
    rewards: [
      { type: 'xp', amount: 100, name: '100 XP' },
      { type: 'badge', name: '7 Day Streak Badge', itemId: '7_day_streak' },
    ],
    hidden: false,
    unlocked: true,
    progress: 100,
    tier: 'gold',
  },
  {
    id: 'task_master_100',
    title: 'Task Master',
    description: 'Complete 100 tasks',
    category: 'productivity',
    rarity: 'rare',
    icon: '✅',
    criteria: {
      type: 'count',
      target: 100,
      metric: 'tasks_completed',
    },
    rewards: [
      { type: 'xp', amount: 500, name: '500 XP' },
      { type: 'title', name: 'Task Master', itemId: 'task_master' },
    ],
    hidden: false,
    unlocked: false,
    progress: 87,
    tier: 'gold',
  },
  
  // Energy Category
  {
    id: 'energy_master',
    title: 'Energy Master',
    description: 'Maintain 80%+ energy for 30 days',
    category: 'energy',
    rarity: 'epic',
    icon: '⚡',
    criteria: {
      type: 'streak',
      target: 30,
      metric: 'high_energy_days',
    },
    rewards: [
      { type: 'xp', amount: 1000, name: '1000 XP' },
      { type: 'title', name: 'Energy Guru', itemId: 'energy_guru' },
      { type: 'badge', name: 'Energy Master Badge', itemId: 'energy_master_gold' },
    ],
    hidden: false,
    unlocked: false,
    progress: 73,
    tier: 'gold',
  },
  
  // Team Category
  {
    id: 'team_player',
    title: 'Team Player',
    description: 'Help 10 team members achieve goals',
    category: 'team',
    rarity: 'rare',
    icon: '👥',
    criteria: {
      type: 'count',
      target: 10,
      metric: 'team_assists',
    },
    rewards: [
      { type: 'xp', amount: 300, name: '300 XP' },
      { type: 'title', name: 'The Helpful', itemId: 'the_helpful' },
    ],
    hidden: false,
    unlocked: true,
    progress: 100,
    tier: 'silver',
  },
  
  // Focus Category
  {
    id: 'focus_legend',
    title: 'Focus Legend',
    description: 'Maintain focus for 8+ hours daily (30 days)',
    category: 'focus',
    rarity: 'legendary',
    icon: '🧠',
    criteria: {
      type: 'streak',
      target: 30,
      metric: 'deep_focus_days',
    },
    rewards: [
      { type: 'xp', amount: 2000, name: '2000 XP' },
      { type: 'title', name: 'The Focused', itemId: 'the_focused' },
      { type: 'item', name: 'Legendary Focus Crystal', itemId: 'focus_crystal_legendary' },
    ],
    hidden: false,
    unlocked: false,
    progress: 30,
    tier: 'gold',
  },
  
  // Social Category
  {
    id: 'social_butterfly',
    title: 'Social Butterfly',
    description: 'Connect with 50 team members',
    category: 'social',
    rarity: 'uncommon',
    icon: '🦋',
    criteria: {
      type: 'count',
      target: 50,
      metric: 'connections_made',
    },
    rewards: [
      { type: 'xp', amount: 250, name: '250 XP' },
      { type: 'title', name: 'The Connector', itemId: 'the_connector' },
    ],
    hidden: false,
    unlocked: false,
    progress: 24,
    tier: 'bronze',
  },
  
  // Hidden Achievements
  {
    id: 'secret_night_owl',
    title: 'Night Owl',
    description: 'Complete tasks at 3 AM',
    category: 'hidden',
    rarity: 'rare',
    icon: '🦉',
    criteria: {
      type: 'special',
      target: 1,
      metric: 'late_night_completion',
    },
    rewards: [
      { type: 'xp', amount: 100, name: '100 XP' },
      { type: 'title', name: 'Night Owl', itemId: 'night_owl' },
    ],
    hidden: true,
    unlocked: false,
    progress: 0,
    tier: 'bronze',
  },
  
  // Collection Achievement
  {
    id: 'pet_collector',
    title: 'Pet Collector',
    description: 'Collect all 6 elemental pets',
    category: 'collection',
    rarity: 'legendary',
    icon: '🐾',
    criteria: {
      type: 'collection',
      target: 6,
      metric: 'unique_pets_owned',
    },
    rewards: [
      { type: 'xp', amount: 5000, name: '5000 XP' },
      { type: 'title', name: 'Pet Master', itemId: 'pet_master' },
      { type: 'pet', name: 'Legendary Rainbow Pet', itemId: 'rainbow_pet_egg' },
    ],
    hidden: false,
    unlocked: false,
    progress: 0,
    tier: 'platinum',
  },
  
  // Resonance Achievement
  {
    id: 'resonance_guru',
    title: 'Resonance Guru',
    description: 'Achieve your highest personal resonance score',
    category: 'productivity',
    rarity: 'legendary',
    icon: '🏔️',
    criteria: {
      type: 'threshold',
      target: 95,
      metric: 'peak_resonance_score',
    },
    rewards: [
      { type: 'xp', amount: 1500, name: '1500 XP' },
      { type: 'title', name: 'Resonance Master', itemId: 'resonance_master' },
      { type: 'badge', name: 'Peak Performance Badge', itemId: 'peak_performance' },
    ],
    hidden: false,
    unlocked: true,
    progress: 100,
    tier: 'gold',
  },
];

// ============================================================================
// CLASS DEFINITIONS
// ============================================================================

export const CLASS_DEFINITIONS: ClassDefinition[] = [
  {
    id: 'sprinter',
    name: 'Sprinter',
    description: 'Master of quick wins and rapid execution',
    playstyle: 'Short bursts, high intensity, many small tasks',
    icon: '🏃',
    color: '#3B82F6', // Blue
    bonuses: [
      {
        type: 'xp_boost',
        description: '+20% XP for tasks completed in <15 minutes',
        value: 20,
        condition: 'task_duration < 15min',
      },
      {
        type: 'task_bonus',
        description: '+15% XP for completing 10+ tasks in one day',
        value: 15,
        condition: 'daily_tasks >= 10',
      },
    ],
    skills: [
      {
        id: 'hyperfocus',
        name: 'Hyperfocus',
        description: '2x XP for 1 hour',
        icon: '⚡',
        cooldown: 24,
        charges: 1,
        requiredLevel: 5,
        effect: {
          type: 'xp_multiplier',
          value: 2,
          duration: 60,
        },
        unlocked: false,
      },
      {
        id: 'rapid_fire',
        name: 'Rapid Fire',
        description: 'Complete 3 tasks in a row for 3x XP on the third',
        icon: '🔥',
        cooldown: 12,
        charges: 3,
        requiredLevel: 10,
        effect: {
          type: 'xp_multiplier',
          value: 3,
          duration: 0,
        },
        unlocked: false,
      },
    ],
    bestFor: 'People who prefer Pomodoro technique, many small tasks, quick wins',
  },
  {
    id: 'marathon',
    name: 'Marathon Runner',
    description: 'Champion of sustained effort and deep work',
    playstyle: 'Long-term focus, big projects, consistency',
    icon: '🏔️',
    color: '#10B981', // Green
    bonuses: [
      {
        type: 'xp_boost',
        description: '+25% XP for focus sessions longer than 2 hours',
        value: 25,
        condition: 'focus_duration > 2h',
      },
      {
        type: 'xp_boost',
        description: '+20% XP for maintaining 7+ day streaks',
        value: 20,
        condition: 'streak >= 7',
      },
    ],
    skills: [
      {
        id: 'endurance_mode',
        name: 'Endurance Mode',
        description: 'No energy loss for 4 hours',
        icon: '🛡️',
        cooldown: 24,
        charges: 1,
        requiredLevel: 5,
        effect: {
          type: 'energy_boost',
          value: 100,
          duration: 240,
        },
        unlocked: false,
      },
      {
        id: 'second_wind',
        name: 'Second Wind',
        description: 'Restore 50% energy instantly',
        icon: '💨',
        cooldown: 12,
        charges: 2,
        requiredLevel: 10,
        effect: {
          type: 'energy_boost',
          value: 50,
          duration: 0,
        },
        unlocked: false,
      },
    ],
    bestFor: 'People doing deep work, long projects, research, sustained effort',
  },
  {
    id: 'captain',
    name: 'Team Captain',
    description: 'Leader who thrives on collaboration',
    playstyle: 'Teamwork, helping others, social features',
    icon: '👥',
    color: '#8B5CF6', // Purple
    bonuses: [
      {
        type: 'team_bonus',
        description: '+30% XP for collaborative tasks',
        value: 30,
        condition: 'task_type === collaborative',
      },
      {
        type: 'team_bonus',
        description: '+25% XP for helping teammates',
        value: 25,
        condition: 'action === team_assist',
      },
    ],
    skills: [
      {
        id: 'rally_cry',
        name: 'Rally Cry',
        description: 'Team members get +15% XP for 1 hour',
        icon: '📣',
        cooldown: 24,
        charges: 1,
        requiredLevel: 5,
        effect: {
          type: 'team_buff',
          value: 15,
          duration: 60,
        },
        unlocked: false,
      },
      {
        id: 'inspire',
        name: 'Inspire',
        description: 'Grant a teammate 500 instant XP',
        icon: '✨',
        cooldown: 48,
        charges: 1,
        requiredLevel: 15,
        effect: {
          type: 'instant_xp',
          value: 500,
          duration: 0,
        },
        unlocked: false,
      },
    ],
    bestFor: 'Managers, team leads, collaborative workers, mentors',
  },
  {
    id: 'solo',
    name: 'Solo Master',
    description: 'Independent achiever who works best alone',
    playstyle: 'Self-directed, personal optimization, individual focus',
    icon: '🎯',
    color: '#F59E0B', // Orange
    bonuses: [
      {
        type: 'xp_boost',
        description: '+20% XP for solo tasks',
        value: 20,
        condition: 'task_type === solo',
      },
      {
        type: 'energy_regen',
        description: '+15% energy regeneration rate',
        value: 15,
      },
    ],
    skills: [
      {
        id: 'lone_wolf',
        name: 'Lone Wolf',
        description: '3x XP for next completed task',
        icon: '🐺',
        cooldown: 8,
        charges: 3,
        requiredLevel: 5,
        effect: {
          type: 'xp_multiplier',
          value: 3,
          duration: 0,
        },
        unlocked: false,
      },
      {
        id: 'flow_state',
        name: 'Flow State',
        description: 'Enter deep focus with 2x productivity for 2 hours',
        icon: '🌊',
        cooldown: 24,
        charges: 1,
        requiredLevel: 10,
        effect: {
          type: 'xp_multiplier',
          value: 2,
          duration: 120,
        },
        unlocked: false,
      },
    ],
    bestFor: 'Individual contributors, remote workers, self-starters',
  },
];

// ============================================================================
// PET SPECIES
// ============================================================================

export const PET_SPECIES: PetSpecies[] = [
  {
    id: 'ember',
    name: 'Ember',
    element: 'fire',
    description: 'A fiery companion that fuels your energy',
    rarity: 'uncommon',
    evolutions: [
      {
        fromStage: 'baby',
        toStage: 'teen',
        requirements: [
          { type: 'level', value: 5, description: 'Reach level 5' },
        ],
        paths: [
          {
            id: 'ember_teen',
            name: 'Flame Sprite',
            description: 'A playful fire spirit',
            resultSpeciesId: 'ember_teen',
            icon: '🔥',
          },
        ],
      },
      {
        fromStage: 'teen',
        toStage: 'adult',
        requirements: [
          { type: 'level', value: 15, description: 'Reach level 15' },
          { type: 'friendship', value: 50, description: 'Friendship level 50+' },
        ],
        paths: [
          {
            id: 'phoenix',
            name: 'Phoenix',
            description: 'Majestic bird of rebirth',
            resultSpeciesId: 'phoenix',
            icon: '🦅',
          },
          {
            id: 'inferno',
            name: 'Inferno Beast',
            description: 'Powerful fire creature',
            resultSpeciesId: 'inferno',
            icon: '🐉',
          },
        ],
      },
    ],
    baseStats: {
      energyBoost: 10,
      xpBoost: 5,
      focusBoost: 0,
      teamBoost: 0,
    },
    discoverable: true,
  },
  {
    id: 'zephyr',
    name: 'Zephyr',
    element: 'air',
    description: 'Swift companion that boosts your speed',
    rarity: 'uncommon',
    evolutions: [],
    baseStats: {
      energyBoost: 0,
      xpBoost: 10,
      focusBoost: 5,
      teamBoost: 0,
    },
    discoverable: true,
  },
  {
    id: 'terra',
    name: 'Terra',
    element: 'earth',
    description: 'Steadfast companion providing stability',
    rarity: 'common',
    evolutions: [],
    baseStats: {
      energyBoost: 5,
      xpBoost: 0,
      focusBoost: 10,
      teamBoost: 5,
    },
    discoverable: true,
  },
  {
    id: 'aqua',
    name: 'Aqua',
    element: 'water',
    description: 'Flowing companion that adapts to any situation',
    rarity: 'uncommon',
    evolutions: [],
    baseStats: {
      energyBoost: 7,
      xpBoost: 3,
      focusBoost: 5,
      teamBoost: 5,
    },
    discoverable: true,
  },
  {
    id: 'lux',
    name: 'Lux',
    element: 'light',
    description: 'Radiant companion bringing clarity',
    rarity: 'rare',
    evolutions: [],
    baseStats: {
      energyBoost: 5,
      xpBoost: 5,
      focusBoost: 10,
      teamBoost: 0,
    },
    discoverable: true,
  },
  {
    id: 'umbra',
    name: 'Umbra',
    element: 'shadow',
    description: 'Mysterious companion for deep focus',
    rarity: 'rare',
    evolutions: [],
    baseStats: {
      energyBoost: 0,
      xpBoost: 5,
      focusBoost: 15,
      teamBoost: 0,
    },
    discoverable: true,
  },
];

// ============================================================================
// LEAGUE TIER INFO
// ============================================================================

export const LEAGUE_TIER_INFO: Record<LeagueTier, { name: string; color: string; icon: string; minRank: number }> = {
  bronze: { name: 'Bronze League', color: '#CD7F32', icon: '🥉', minRank: 0 },
  silver: { name: 'Silver League', color: '#C0C0C0', icon: '🥈', minRank: 1000 },
  gold: { name: 'Gold League', color: '#FFD700', icon: '🥇', minRank: 2000 },
  sapphire: { name: 'Sapphire League', color: '#0F52BA', icon: '💎', minRank: 3000 },
  ruby: { name: 'Ruby League', color: '#E0115F', icon: '💍', minRank: 4000 },
  emerald: { name: 'Emerald League', color: '#50C878', icon: '🟢', minRank: 5000 },
  diamond: { name: 'Diamond League', color: '#B9F2FF', icon: '💠', minRank: 6000 },
  obsidian: { name: 'Obsidian League', color: '#3C3744', icon: '⚫', minRank: 7000 },
};

// ============================================================================
// MASTERY TREES
// ============================================================================

export const MASTERY_TREE_INFO = {
  task: {
    name: 'Task Mastery',
    color: '#3B82F6',
    icon: '✅',
    description: 'Master the art of task completion',
  },
  energy: {
    name: 'Energy Mastery',
    color: '#FBBF24',
    icon: '⚡',
    description: 'Optimize your energy management',
  },
  team: {
    name: 'Team Mastery',
    color: '#8B5CF6',
    icon: '👥',
    description: 'Excel at collaboration',
  },
  focus: {
    name: 'Focus Mastery',
    color: '#10B981',
    icon: '🧠',
    description: 'Achieve deep concentration',
  },
  social: {
    name: 'Social Mastery',
    color: '#EC4899',
    icon: '💬',
    description: 'Build meaningful connections',
  },
  script: {
    name: 'Script Mastery',
    color: '#14B8A6',
    icon: '📜',
    description: 'Create powerful automations',
  },
};

// ============================================================================
// RARITY COLORS
// ============================================================================

export const RARITY_COLORS: Record<ItemRarity, string> = {
  common: '#9CA3AF',
  uncommon: '#10B981',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B',
  mythic: '#EF4444',
};
