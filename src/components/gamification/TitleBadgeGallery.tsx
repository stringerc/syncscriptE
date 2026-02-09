import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Award, Crown, Star, Trophy, Medal, Shield, Flame, Zap,
  Heart, Users, Target, Brain, Sparkles, Lock, CheckCircle2
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { useGamification } from '../../contexts/GamificationContext';
import { ItemRarity } from '../../types/gamification';
import { RARITY_COLORS } from '../../data/gamification-data';

interface TitleBadgeGalleryProps {
  className?: string;
}

interface Title {
  id: string;
  name: string;
  description: string;
  rarity: ItemRarity;
  source: string;
  unlocked: boolean;
  equipped: boolean;
  icon: string;
}

interface BadgeItem {
  id: string;
  name: string;
  description: string;
  rarity: ItemRarity;
  category: string;
  unlocked: boolean;
  icon: string;
  unlockedAt?: Date;
}

export function TitleBadgeGallery({ className }: TitleBadgeGalleryProps) {
  const { profile } = useGamification();
  const [activeTab, setActiveTab] = useState<'titles' | 'badges'>('titles');
  const [selectedItem, setSelectedItem] = useState<Title | BadgeItem | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  
  // Mock titles (would come from data file)
  const titles: Title[] = [
    {
      id: 'the_initiated',
      name: 'The Initiated',
      description: 'Complete your first epic quest',
      rarity: 'common',
      source: 'Epic Quest: Chapter 1',
      unlocked: false,
      equipped: false,
      icon: '🎯',
    },
    {
      id: 'week_warrior',
      name: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      rarity: 'uncommon',
      source: 'Achievement: Week Warrior',
      unlocked: true,
      equipped: false,
      icon: '🔥',
    },
    {
      id: 'team_player',
      name: 'Team Player',
      description: 'Help 10 teammates',
      rarity: 'uncommon',
      source: 'Achievement: Team Player',
      unlocked: true,
      equipped: false,
      icon: '👥',
    },
    {
      id: 'resonance_guru',
      name: 'Resonance Guru',
      description: 'Achieve peak resonance',
      rarity: 'rare',
      source: 'Achievement: Resonance Master',
      unlocked: true,
      equipped: true,
      icon: '🏔️',
    },
    {
      id: 'energy_master',
      name: 'Energy Master',
      description: 'Master energy management',
      rarity: 'epic',
      source: 'Achievement: Energy Guru',
      unlocked: false,
      equipped: false,
      icon: '⚡',
    },
    {
      id: 'the_legendary',
      name: 'The Legendary',
      description: 'Reach Prestige 10',
      rarity: 'legendary',
      source: 'Prestige X',
      unlocked: false,
      equipped: false,
      icon: '👑',
    },
    {
      id: 'task_master',
      name: 'Task Master',
      description: 'Complete 1000 tasks',
      rarity: 'epic',
      source: 'Task Milestone',
      unlocked: false,
      equipped: false,
      icon: '✅',
    },
    {
      id: 'focus_legend',
      name: 'Focus Legend',
      description: 'Master deep work',
      rarity: 'legendary',
      source: 'Achievement: Focus Master',
      unlocked: false,
      equipped: false,
      icon: '🧠',
    },
    {
      id: 'guild_master',
      name: 'Guild Master',
      description: 'Lead a guild to victory',
      rarity: 'epic',
      source: 'Guild Achievement',
      unlocked: false,
      equipped: false,
      icon: '🏰',
    },
    {
      id: 'champion',
      name: 'Champion',
      description: 'Win 10 league tournaments',
      rarity: 'legendary',
      source: 'League Victories',
      unlocked: false,
      equipped: false,
      icon: '🏆',
    },
  ];
  
  // Mock badges (would come from data file)
  const badges: BadgeItem[] = [
    {
      id: '7_day_streak',
      name: '7 Day Streak',
      description: 'Completed tasks for 7 consecutive days',
      rarity: 'uncommon',
      category: 'Streaks',
      unlocked: true,
      icon: '🔥',
      unlockedAt: new Date('2025-12-15'),
    },
    {
      id: 'team_helper',
      name: 'Team Helper',
      description: 'Assisted 5 teammates',
      rarity: 'common',
      category: 'Social',
      unlocked: true,
      icon: '🤝',
      unlockedAt: new Date('2025-11-20'),
    },
    {
      id: 'energy_master_bronze',
      name: 'Energy Master - Bronze',
      description: 'Maintained high energy for 7 days',
      rarity: 'uncommon',
      category: 'Energy',
      unlocked: true,
      icon: '⚡',
      unlockedAt: new Date('2025-10-10'),
    },
    {
      id: 'early_bird',
      name: 'Early Bird',
      description: 'Completed 10 tasks before 9 AM',
      rarity: 'rare',
      category: 'Productivity',
      unlocked: false,
      icon: '🌅',
    },
    {
      id: 'night_owl',
      name: 'Night Owl',
      description: 'Completed tasks at 3 AM',
      rarity: 'rare',
      category: 'Hidden',
      unlocked: false,
      icon: '🦉',
    },
    {
      id: 'gold_league',
      name: 'Gold League',
      description: 'Reached Gold League',
      rarity: 'rare',
      category: 'Leagues',
      unlocked: true,
      icon: '🥇',
      unlockedAt: new Date('2025-12-01'),
    },
    {
      id: 'pet_collector',
      name: 'Pet Collector',
      description: 'Collected 6 unique pets',
      rarity: 'epic',
      category: 'Collection',
      unlocked: false,
      icon: '🐾',
    },
    {
      id: 'season_1_complete',
      name: 'Season 1 Complete',
      description: 'Reached tier 100 in Season 1',
      rarity: 'legendary',
      category: 'Seasonal',
      unlocked: false,
      icon: '🎖️',
    },
    {
      id: 'perfect_week',
      name: 'Perfect Week',
      description: 'Achieved all goals for 7 days straight',
      rarity: 'epic',
      category: 'Productivity',
      unlocked: false,
      icon: '💎',
    },
    {
      id: 'founder',
      name: 'Founder',
      description: 'Early adopter of SyncScript',
      rarity: 'legendary',
      category: 'Special',
      unlocked: true,
      icon: '🌟',
      unlockedAt: new Date('2025-01-01'),
    },
  ];
  
  const unlockedTitles = titles.filter(t => t.unlocked);
  const unlockedBadges = badges.filter(b => b.unlocked);
  
  const handleEquipTitle = (titleId: string) => {
    // Would call context action to equip title
    console.log('Equip title:', titleId);
  };
  
  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-white text-2xl font-bold flex items-center gap-2">
            <Award className="w-6 h-6 text-purple-400" />
            Titles & Badges
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Show off your accomplishments with exclusive titles and badges
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-gray-500 text-xs">Titles</div>
            <div className="text-white font-bold">{unlockedTitles.length} / {titles.length}</div>
          </div>
          <div className="text-right">
            <div className="text-gray-500 text-xs">Badges</div>
            <div className="text-white font-bold">{unlockedBadges.length} / {badges.length}</div>
          </div>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="titles">
            Titles ({unlockedTitles.length}/{titles.length})
          </TabsTrigger>
          <TabsTrigger value="badges">
            Badges ({unlockedBadges.length}/{badges.length})
          </TabsTrigger>
        </TabsList>
        
        {/* TITLES TAB */}
        <TabsContent value="titles">
          {/* Equipped Title */}
          {profile.equippedTitle && (
            <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-3xl">
                    {titles.find(t => t.equipped)?.icon || '👑'}
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm mb-1">Currently Equipped</div>
                    <h3 className="text-white text-2xl font-bold">
                      {titles.find(t => t.equipped)?.name || profile.equippedTitle}
                    </h3>
                  </div>
                </div>
                <Button variant="outline" onClick={() => handleEquipTitle('')}>
                  Unequip
                </Button>
              </div>
            </div>
          )}
          
          {/* Titles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {titles.map((title, index) => {
              const rarityColor = RARITY_COLORS[title.rarity];
              
              return (
                <motion.div
                  key={title.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    title.unlocked 
                      ? title.equipped
                        ? 'bg-purple-500/10 border-purple-500'
                        : 'bg-[#252830] border-gray-700 hover:border-gray-600'
                      : 'bg-gray-800/20 border-gray-800 opacity-60'
                  }`}
                  onClick={() => {
                    setSelectedItem(title);
                    setShowDetailsDialog(true);
                  }}
                  whileHover={title.unlocked ? { scale: 1.02, y: -4 } : {}}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {/* Title Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div 
                        className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
                          title.unlocked ? 'bg-gradient-to-br from-purple-600 to-pink-600' : 'bg-gray-700'
                        }`}
                      >
                        {title.unlocked ? title.icon : '🔒'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-semibold mb-1 truncate ${title.unlocked ? 'text-white' : 'text-gray-500'}`}>
                          {title.unlocked ? title.name : '???'}
                        </h4>
                        <Badge 
                          variant="outline"
                          style={{ 
                            color: rarityColor, 
                            borderColor: `${rarityColor}50`,
                            fontSize: '10px'
                          }}
                        >
                          {title.rarity}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <p className={`text-sm mb-3 ${title.unlocked ? 'text-gray-400' : 'text-gray-600'}`}>
                    {title.unlocked ? title.description : 'Locked - Complete requirements to unlock'}
                  </p>
                  
                  {/* Source */}
                  <div className="text-xs text-gray-500 mb-3">
                    {title.unlocked ? `From: ${title.source}` : 'Source: Hidden'}
                  </div>
                  
                  {/* Action */}
                  {title.unlocked && (
                    <Button
                      size="sm"
                      className="w-full"
                      variant={title.equipped ? 'outline' : 'default'}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEquipTitle(title.id);
                      }}
                    >
                      {title.equipped ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Equipped
                        </>
                      ) : (
                        'Equip Title'
                      )}
                    </Button>
                  )}
                  {!title.unlocked && (
                    <div className="flex items-center justify-center gap-1 text-gray-600 text-sm">
                      <Lock className="w-3 h-3" />
                      <span>Locked</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </TabsContent>
        
        {/* BADGES TAB */}
        <TabsContent value="badges">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {badges.map((badge, index) => {
              const rarityColor = RARITY_COLORS[badge.rarity];
              
              return (
                <motion.div
                  key={badge.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    badge.unlocked 
                      ? 'bg-[#252830] border-gray-700 hover:border-gray-600' 
                      : 'bg-gray-800/20 border-gray-800 opacity-60'
                  }`}
                  onClick={() => {
                    setSelectedItem(badge);
                    setShowDetailsDialog(true);
                  }}
                  whileHover={badge.unlocked ? { scale: 1.05, y: -4 } : {}}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                >
                  {/* Badge Icon */}
                  <div className="text-center mb-3">
                    <div 
                      className={`w-16 h-16 rounded-lg mx-auto flex items-center justify-center text-3xl ${
                        badge.unlocked 
                          ? 'bg-gradient-to-br from-purple-600 to-pink-600' 
                          : 'bg-gray-700'
                      }`}
                    >
                      {badge.unlocked ? badge.icon : '🔒'}
                    </div>
                  </div>
                  
                  {/* Badge Name */}
                  <h4 className={`text-center font-semibold text-xs mb-2 ${
                    badge.unlocked ? 'text-white' : 'text-gray-500'
                  }`}>
                    {badge.unlocked ? badge.name : '???'}
                  </h4>
                  
                  {/* Rarity */}
                  <div className="flex justify-center">
                    <Badge 
                      variant="outline"
                      style={{ 
                        color: rarityColor, 
                        borderColor: `${rarityColor}50`,
                        fontSize: '9px'
                      }}
                    >
                      {badge.rarity}
                    </Badge>
                  </div>
                  
                  {/* Unlock Date */}
                  {badge.unlocked && badge.unlockedAt && (
                    <div className="text-center text-[10px] text-gray-600 mt-2">
                      {badge.unlockedAt.toLocaleDateString()}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
          
          {/* Badge Categories */}
          <div className="mt-8">
            <h3 className="text-white font-bold mb-4">Badge Categories</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Productivity', 'Social', 'Energy', 'Streaks', 'Leagues', 'Collection', 'Seasonal', 'Hidden'].map((category) => {
                const categoryBadges = badges.filter(b => b.category === category);
                const unlockedCount = categoryBadges.filter(b => b.unlocked).length;
                
                return (
                  <div key={category} className="bg-[#1e2128] border border-gray-800 rounded-lg p-3">
                    <div className="text-gray-400 text-sm mb-1">{category}</div>
                    <div className="text-white font-bold">
                      {unlockedCount} / {categoryBadges.length}
                    </div>
                    <div className="mt-2">
                      <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-full"
                          style={{ width: `${(unlockedCount / categoryBadges.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="bg-[#1e2128] border-gray-700 text-white">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-2xl">
                  <span className="text-4xl">
                    {'icon' in selectedItem ? selectedItem.icon : '🏆'}
                  </span>
                  {('name' in selectedItem && selectedItem.unlocked) ? selectedItem.name : '???'}
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  {('description' in selectedItem && selectedItem.unlocked) 
                    ? selectedItem.description 
                    : 'Unlock this item to reveal its details'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#252830] border border-gray-700 rounded-lg p-3">
                    <div className="text-gray-500 text-xs mb-1">Rarity</div>
                    <Badge 
                      variant="outline"
                      style={{ 
                        color: RARITY_COLORS[selectedItem.rarity], 
                        borderColor: `${RARITY_COLORS[selectedItem.rarity]}50`
                      }}
                    >
                      {selectedItem.rarity}
                    </Badge>
                  </div>
                  
                  {'category' in selectedItem && (
                    <div className="bg-[#252830] border border-gray-700 rounded-lg p-3">
                      <div className="text-gray-500 text-xs mb-1">Category</div>
                      <div className="text-white">{selectedItem.category}</div>
                    </div>
                  )}
                  
                  {'source' in selectedItem && selectedItem.unlocked && (
                    <div className="bg-[#252830] border border-gray-700 rounded-lg p-3 col-span-2">
                      <div className="text-gray-500 text-xs mb-1">Source</div>
                      <div className="text-white">{selectedItem.source}</div>
                    </div>
                  )}
                  
                  {'unlockedAt' in selectedItem && selectedItem.unlockedAt && (
                    <div className="bg-[#252830] border border-gray-700 rounded-lg p-3 col-span-2">
                      <div className="text-gray-500 text-xs mb-1">Unlocked</div>
                      <div className="text-white">{selectedItem.unlockedAt.toLocaleString()}</div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
