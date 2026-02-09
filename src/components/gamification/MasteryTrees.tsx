import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Target, Zap, Users, Brain, MessageCircle, ScrollText,
  Star, Lock, CheckCircle2, TrendingUp, Award, Crown,
  Sparkles, Flame, Shield, Rocket, Heart, Coffee
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { MasteryCategory, MasteryPerk } from '../../types/gamification';
import { useGamification } from '../../contexts/GamificationContext';
import { MASTERY_TREE_INFO } from '../../data/gamification-data';

interface MasteryTreesProps {
  className?: string;
}

export function MasteryTrees({ className }: MasteryTreesProps) {
  const { profile, unlockMasteryPerk, canPrestige, performPrestige } = useGamification();
  const [selectedCategory, setSelectedCategory] = useState<MasteryCategory>('task');
  const [selectedPerk, setSelectedPerk] = useState<MasteryPerk | null>(null);
  const [showPerkDialog, setShowPerkDialog] = useState(false);
  
  // Mock mastery perks (would come from data file)
  const getMasteryPerks = (category: MasteryCategory): MasteryPerk[] => {
    const basePerks: Record<MasteryCategory, MasteryPerk[]> = {
      task: [
        {
          id: 'task_efficiency_1',
          name: 'Task Efficiency I',
          description: '+5% XP from all tasks',
          category: 'task',
          requiredLevel: 1,
          unlocked: profile.masteryLevels.task >= 1,
          effect: { type: 'xp_boost', value: 5 },
          icon: '⚡',
        },
        {
          id: 'task_efficiency_2',
          name: 'Task Efficiency II',
          description: '+10% XP from all tasks',
          category: 'task',
          requiredLevel: 5,
          unlocked: profile.masteryLevels.task >= 5,
          effect: { type: 'xp_boost', value: 10 },
          icon: '⚡⚡',
        },
        {
          id: 'speed_demon',
          name: 'Speed Demon',
          description: 'Complete tasks 20% faster',
          category: 'task',
          requiredLevel: 10,
          unlocked: profile.masteryLevels.task >= 10,
          effect: { type: 'task_bonus', value: 20 },
          icon: '🏃',
        },
        {
          id: 'task_master',
          name: 'Task Master',
          description: '+25% XP from all tasks',
          category: 'task',
          requiredLevel: 20,
          unlocked: profile.masteryLevels.task >= 20,
          effect: { type: 'xp_boost', value: 25 },
          icon: '👑',
        },
      ],
      energy: [
        {
          id: 'energy_conservation',
          name: 'Energy Conservation',
          description: 'Energy depletes 10% slower',
          category: 'energy',
          requiredLevel: 1,
          unlocked: profile.masteryLevels.energy >= 1,
          effect: { type: 'energy_regen', value: 10 },
          icon: '🔋',
        },
        {
          id: 'quick_recovery',
          name: 'Quick Recovery',
          description: 'Energy regens 15% faster',
          category: 'energy',
          requiredLevel: 5,
          unlocked: profile.masteryLevels.energy >= 5,
          effect: { type: 'energy_regen', value: 15 },
          icon: '💚',
        },
        {
          id: 'energy_reservoir',
          name: 'Energy Reservoir',
          description: '+20% max energy capacity',
          category: 'energy',
          requiredLevel: 10,
          unlocked: profile.masteryLevels.energy >= 10,
          effect: { type: 'energy_boost', value: 20 },
          icon: '⚡',
        },
      ],
      team: [
        {
          id: 'team_player',
          name: 'Team Player',
          description: '+10% XP from team activities',
          category: 'team',
          requiredLevel: 1,
          unlocked: profile.masteryLevels.team >= 1,
          effect: { type: 'team_bonus', value: 10 },
          icon: '👥',
        },
        {
          id: 'natural_leader',
          name: 'Natural Leader',
          description: 'Team members get +5% XP when working with you',
          category: 'team',
          requiredLevel: 10,
          unlocked: profile.masteryLevels.team >= 10,
          effect: { type: 'team_bonus', value: 5 },
          icon: '👑',
        },
        {
          id: 'mentor',
          name: 'Mentor',
          description: 'Helping teammates grants double XP',
          category: 'team',
          requiredLevel: 15,
          unlocked: profile.masteryLevels.team >= 15,
          effect: { type: 'xp_boost', value: 100 },
          icon: '🎓',
        },
      ],
      focus: [
        {
          id: 'deep_focus',
          name: 'Deep Focus',
          description: '+15% XP during focus sessions',
          category: 'focus',
          requiredLevel: 1,
          unlocked: profile.masteryLevels.focus >= 1,
          effect: { type: 'focus_bonus', value: 15 },
          icon: '🧠',
        },
        {
          id: 'zone_state',
          name: 'The Zone',
          description: 'Focus sessions last 25% longer',
          category: 'focus',
          requiredLevel: 10,
          unlocked: profile.masteryLevels.focus >= 10,
          effect: { type: 'focus_bonus', value: 25 },
          icon: '🌊',
        },
      ],
      social: [
        {
          id: 'social_butterfly',
          name: 'Social Butterfly',
          description: '+10% XP from social interactions',
          category: 'social',
          requiredLevel: 1,
          unlocked: profile.masteryLevels.social >= 1,
          effect: { type: 'social_bonus', value: 10 },
          icon: '🦋',
        },
        {
          id: 'networker',
          name: 'Networker',
          description: 'Friend bonuses are 20% stronger',
          category: 'social',
          requiredLevel: 5,
          unlocked: profile.masteryLevels.social >= 5,
          effect: { type: 'social_bonus', value: 20 },
          icon: '🤝',
        },
      ],
      script: [
        {
          id: 'automation_novice',
          name: 'Automation Novice',
          description: '+10% XP from script usage',
          category: 'script',
          requiredLevel: 1,
          unlocked: profile.masteryLevels.script >= 1,
          effect: { type: 'xp_boost', value: 10 },
          icon: '🤖',
        },
        {
          id: 'script_master',
          name: 'Script Master',
          description: 'Scripts execute 30% faster',
          category: 'script',
          requiredLevel: 10,
          unlocked: profile.masteryLevels.script >= 10,
          effect: { type: 'xp_boost', value: 30 },
          icon: '⚙️',
        },
      ],
    };
    
    return basePerks[category];
  };
  
  const categoryIcon = {
    task: Target,
    energy: Zap,
    team: Users,
    focus: Brain,
    social: MessageCircle,
    script: ScrollText,
  };
  
  const currentLevel = profile.masteryLevels[selectedCategory];
  const currentXP = profile.masteryXp[selectedCategory];
  const nextLevelXP = currentLevel * 500;
  const perks = getMasteryPerks(selectedCategory);
  
  // Calculate total mastery level for prestige
  const totalMasteryLevel = Object.values(profile.masteryLevels).reduce((sum, level) => sum + level, 0);
  const prestigeReady = canPrestige();
  
  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-white text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-400" />
            Mastery Trees
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Specialize in different areas to unlock powerful permanent bonuses
          </p>
        </div>
        <div className="text-right">
          <div className="text-gray-400 text-sm">Total Mastery Level</div>
          <div className="text-white text-3xl font-bold">{totalMasteryLevel}</div>
        </div>
      </div>
      
      {/* Prestige Banner (if eligible) */}
      {prestigeReady && (
        <motion.div
          className="bg-gradient-to-r from-orange-900/30 to-red-900/30 border border-orange-500/50 rounded-xl p-6 mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.01 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg flex items-center justify-center">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-white text-xl font-bold mb-1">Prestige Available!</h3>
                <p className="text-gray-400">
                  Reset all mastery levels for permanent +5% XP boost and exclusive rewards
                </p>
              </div>
            </div>
            <Button
              className="bg-gradient-to-r from-orange-600 to-red-600"
              onClick={performPrestige}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Enter Prestige
            </Button>
          </div>
        </motion.div>
      )}
      
      {/* Mastery Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as MasteryCategory)}>
        <TabsList className="grid w-full grid-cols-6 mb-6">
          {(Object.keys(MASTERY_TREE_INFO) as MasteryCategory[]).map((category) => {
            const Icon = categoryIcon[category];
            return (
              <TabsTrigger key={category} value={category} className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span className="hidden lg:inline">{MASTERY_TREE_INFO[category].name.split(' ')[0]}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
        
        {(Object.keys(MASTERY_TREE_INFO) as MasteryCategory[]).map((category) => {
          const Icon = categoryIcon[category];
          const categoryLevel = profile.masteryLevels[category];
          const categoryXP = profile.masteryXp[category];
          const categoryNextXP = categoryLevel * 500;
          const categoryPerks = getMasteryPerks(category);
          
          return (
            <TabsContent key={category} value={category} className="space-y-6">
              {/* Category Header */}
              <div 
                className="bg-gradient-to-r from-[#252830] to-[#1e2128] border-2 rounded-xl p-6"
                style={{ borderColor: MASTERY_TREE_INFO[category].color }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-20 h-20 rounded-lg flex items-center justify-center text-4xl"
                      style={{ backgroundColor: `${MASTERY_TREE_INFO[category].color}20` }}
                    >
                      {MASTERY_TREE_INFO[category].icon}
                    </div>
                    <div>
                      <h3 className="text-white text-2xl font-bold mb-1">
                        {MASTERY_TREE_INFO[category].name}
                      </h3>
                      <p className="text-gray-400 mb-4">{MASTERY_TREE_INFO[category].description}</p>
                      
                      <div className="flex items-center gap-4">
                        <div className="bg-[#1e2128] border border-gray-700 rounded-lg px-4 py-2">
                          <div className="text-gray-500 text-xs mb-1">Mastery Level</div>
                          <div className="text-white text-xl font-bold">{categoryLevel}</div>
                        </div>
                        <div className="bg-[#1e2128] border border-gray-700 rounded-lg px-4 py-2">
                          <div className="text-gray-500 text-xs mb-1">Perks Unlocked</div>
                          <div className="text-white text-xl font-bold">
                            {categoryPerks.filter(p => p.unlocked).length} / {categoryPerks.length}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Badge 
                    variant="outline"
                    style={{ color: MASTERY_TREE_INFO[category].color, borderColor: MASTERY_TREE_INFO[category].color }}
                  >
                    Active
                  </Badge>
                </div>
                
                {/* Level Progress */}
                <div className="mt-6">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-400">Progress to Level {categoryLevel + 1}</span>
                    <span className="text-white">{categoryXP} / {categoryNextXP} XP</span>
                  </div>
                  <Progress 
                    value={(categoryXP / categoryNextXP) * 100} 
                    className="h-3"
                    indicatorClassName="bg-gradient-to-r from-blue-500 to-purple-500"
                  />
                </div>
              </div>
              
              {/* Perk Tree */}
              <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
                <h4 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  Mastery Perks
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categoryPerks.map((perk, index) => {
                    const isUnlocked = perk.unlocked;
                    
                    return (
                      <motion.div
                        key={perk.id}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          isUnlocked 
                            ? 'bg-[#252830] border-gray-700 hover:border-blue-500/50' 
                            : 'bg-gray-800/20 border-gray-800 opacity-60'
                        }`}
                        onClick={() => {
                          setSelectedPerk(perk);
                          setShowPerkDialog(true);
                        }}
                        whileHover={isUnlocked ? { scale: 1.02 } : {}}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        {/* Perk Header */}
                        <div className="flex items-start gap-3 mb-3">
                          <div 
                            className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
                              isUnlocked 
                                ? 'bg-gradient-to-br from-purple-600 to-pink-600' 
                                : 'bg-gray-700'
                            }`}
                          >
                            {perk.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className={`font-semibold ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
                                {perk.name}
                              </h5>
                              {isUnlocked ? (
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                              ) : (
                                <Lock className="w-4 h-4 text-gray-500" />
                              )}
                            </div>
                            <p className={`text-sm ${isUnlocked ? 'text-gray-400' : 'text-gray-600'}`}>
                              {perk.description}
                            </p>
                          </div>
                        </div>
                        
                        {/* Requirement */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                          <Badge 
                            variant="outline" 
                            className={
                              isUnlocked 
                                ? 'text-green-400 border-green-400' 
                                : 'text-gray-500 border-gray-600'
                            }
                          >
                            Level {perk.requiredLevel}
                          </Badge>
                          {isUnlocked && (
                            <span 
                              className="text-sm font-semibold"
                              style={{ color: MASTERY_TREE_INFO[category].color }}
                            >
                              Active
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
              
              {/* XP Sources */}
              <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
                <h4 className="text-white text-xl font-bold mb-4">How to Earn {MASTERY_TREE_INFO[category].name} XP</h4>
                <div className="space-y-2 text-gray-300">
                  {category === 'task' && (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span>Complete any task (+10-50 XP based on difficulty)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span>Complete daily task goals (+100 XP)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span>Achieve task-related milestones (+200 XP)</span>
                      </div>
                    </>
                  )}
                  {category === 'energy' && (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span>Maintain high energy for 8+ hours (+50 XP)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span>Optimize your schedule (+100 XP)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span>Complete energy-related quests (+150 XP)</span>
                      </div>
                    </>
                  )}
                  {category === 'team' && (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span>Collaborate on team tasks (+25 XP each)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span>Help teammates achieve goals (+50 XP)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span>Lead team meetings (+75 XP)</span>
                      </div>
                    </>
                  )}
                  {category === 'focus' && (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span>Complete focus sessions (+20 XP per hour)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span>Maintain deep work streaks (+100 XP)</span>
                      </div>
                    </>
                  )}
                  {category === 'social' && (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span>Add friends (+10 XP each)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span>Send kudos (+5 XP each)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span>Complete social challenges (+150 XP)</span>
                      </div>
                    </>
                  )}
                  {category === 'script' && (
                    <>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span>Use automation scripts (+15 XP per use)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span>Create new scripts (+200 XP)</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
      
      {/* Perk Details Dialog */}
      <Dialog open={showPerkDialog} onOpenChange={setShowPerkDialog}>
        <DialogContent className="bg-[#1e2128] border-gray-700 text-white">
          {selectedPerk && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-2xl">
                  <span className="text-4xl">{selectedPerk.icon}</span>
                  {selectedPerk.name}
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  {selectedPerk.description}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <div className="bg-[#252830] border border-gray-700 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-gray-500 text-xs mb-1">Effect Type</div>
                      <div className="text-white capitalize">{selectedPerk.effect.type.replace('_', ' ')}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs mb-1">Bonus Value</div>
                      <div className="text-white">+{selectedPerk.effect.value}%</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs mb-1">Required Level</div>
                      <div className="text-white">{selectedPerk.requiredLevel}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs mb-1">Status</div>
                      <Badge variant="outline" className={
                        selectedPerk.unlocked 
                          ? 'text-green-400 border-green-400' 
                          : 'text-gray-500 border-gray-500'
                      }>
                        {selectedPerk.unlocked ? 'Unlocked' : 'Locked'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {selectedPerk.unlocked && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                      <div>
                        <div className="text-green-400 font-semibold mb-1">Perk Active!</div>
                        <div className="text-gray-300 text-sm">
                          This permanent bonus is currently applied to all relevant actions.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
