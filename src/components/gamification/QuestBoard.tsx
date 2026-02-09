import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Target, Clock, Users, Zap, Star, CheckCircle2, X, Flame,
  Trophy, Award, Scroll, Swords, Crown, Sparkles, ChevronRight,
  Calendar, TrendingUp, Heart, Lock, Unlock
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Quest, QuestDifficulty, QuestType } from '../../types/gamification';
import { useGamification } from '../../contexts/GamificationContext';
import { DAILY_QUESTS_POOL, WEEKLY_QUESTS_POOL, EPIC_QUESTS } from '../../data/gamification-data';

interface QuestBoardProps {
  className?: string;
}

export function QuestBoard({ className }: QuestBoardProps) {
  const {
    activeQuests,
    acceptQuest,
    abandonQuest,
    completeQuest,
    updateQuestProgress,
    profile,
  } = useGamification();
  
  const [activeTab, setActiveTab] = useState<'active' | 'available' | 'epic' | 'party'>('active');
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [showQuestDetails, setShowQuestDetails] = useState(false);
  
  // Mock available quests (in production, these would come from API)
  const availableDailyQuests: Quest[] = DAILY_QUESTS_POOL.map(q => ({
    ...q,
    status: 'available' as const,
    progress: 0,
  })).filter(q => q.requiredLevel <= profile.level);
  
  const availableWeeklyQuests: Quest[] = WEEKLY_QUESTS_POOL.map(q => ({
    ...q,
    status: 'available' as const,
    progress: 0,
  })).filter(q => q.requiredLevel <= profile.level);
  
  const availableEpicQuests: Quest[] = EPIC_QUESTS.map(q => ({
    ...q,
    status: 'available' as const,
    progress: 0,
  })).filter(q => q.requiredLevel <= profile.level);
  
  const getDifficultyColor = (difficulty: QuestDifficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 border-green-400';
      case 'medium': return 'text-yellow-400 border-yellow-400';
      case 'hard': return 'text-orange-400 border-orange-400';
      case 'legendary': return 'text-purple-400 border-purple-400';
    }
  };
  
  const getQuestTypeIcon = (type: QuestType) => {
    switch (type) {
      case 'daily': return Calendar;
      case 'weekly': return TrendingUp;
      case 'epic': return Crown;
      case 'party': return Users;
      case 'boss': return Swords;
    }
  };
  
  const handleQuestClick = (quest: Quest) => {
    setSelectedQuest(quest);
    setShowQuestDetails(true);
  };
  
  const handleAcceptQuest = (quest: Quest) => {
    acceptQuest(quest.id);
    setShowQuestDetails(false);
  };
  
  const handleAbandonQuest = (questId: string) => {
    abandonQuest(questId);
    setShowQuestDetails(false);
  };
  
  const renderQuestCard = (quest: Quest, isActive: boolean = false) => {
    const TypeIcon = getQuestTypeIcon(quest.type);
    const completedObjectives = quest.objectives.filter(obj => obj.completed).length;
    const totalObjectives = quest.objectives.length;
    
    return (
      <motion.div
        key={quest.id}
        className={`bg-[#252830] border rounded-lg p-4 cursor-pointer transition-all hover:border-blue-500/50 ${
          isActive ? 'border-blue-500/30' : 'border-gray-700'
        }`}
        onClick={() => handleQuestClick(quest)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        layout
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1">
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${
              quest.type === 'daily' ? 'from-blue-600 to-cyan-600' :
              quest.type === 'weekly' ? 'from-purple-600 to-pink-600' :
              quest.type === 'epic' ? 'from-orange-600 to-red-600' :
              'from-green-600 to-emerald-600'
            } flex items-center justify-center flex-shrink-0`}>
              <TypeIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold mb-1">{quest.title}</h3>
              <p className="text-gray-400 text-sm line-clamp-2">{quest.description}</p>
            </div>
          </div>
          <Badge variant="outline" className={getDifficultyColor(quest.difficulty)}>
            {quest.difficulty}
          </Badge>
        </div>
        
        {/* Progress (for active quests) */}
        {isActive && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>Progress</span>
              <span>{completedObjectives}/{totalObjectives} objectives</span>
            </div>
            <Progress value={quest.progress} className="h-2" />
          </div>
        )}
        
        {/* Objectives Preview */}
        <div className="space-y-1 mb-3">
          {quest.objectives.slice(0, 2).map((obj, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              {obj.completed ? (
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-gray-600 flex-shrink-0" />
              )}
              <span className={obj.completed ? 'text-gray-500 line-through' : 'text-gray-300'}>
                {obj.description}
              </span>
            </div>
          ))}
          {quest.objectives.length > 2 && (
            <div className="text-xs text-gray-500 pl-6">
              +{quest.objectives.length - 2} more objectives
            </div>
          )}
        </div>
        
        {/* Rewards */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-700">
          <div className="flex items-center gap-3">
            {quest.rewards.map((reward, i) => (
              <div key={i} className="flex items-center gap-1 text-sm">
                {reward.type === 'xp' && (
                  <>
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400">{reward.amount}</span>
                  </>
                )}
                {reward.type === 'seasonXp' && (
                  <>
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-400">{reward.amount}</span>
                  </>
                )}
                {reward.type === 'item' && (
                  <span className="text-blue-400 text-xs">{reward.itemName}</span>
                )}
              </div>
            ))}
          </div>
          
          {quest.expiresAt && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{Math.ceil((quest.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60))}h left</span>
            </div>
          )}
        </div>
      </motion.div>
    );
  };
  
  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-white text-2xl font-bold flex items-center gap-2">
            <Scroll className="w-6 h-6 text-blue-400" />
            Quest Board
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Accept quests to earn XP, items, and unlock achievements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-blue-400 border-blue-400">
            {activeQuests.length} Active
          </Badge>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4 mb-6">
          <TabsTrigger value="active">
            Active ({activeQuests.length})
          </TabsTrigger>
          <TabsTrigger value="available">
            Available
          </TabsTrigger>
          <TabsTrigger value="epic">
            Epic Quests
          </TabsTrigger>
          <TabsTrigger value="party">
            Party Quests
          </TabsTrigger>
        </TabsList>
        
        {/* Active Quests Tab */}
        <TabsContent value="active">
          {activeQuests.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Scroll className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-white text-xl font-bold mb-2">No Active Quests</h3>
              <p className="text-gray-400 mb-4">
                Browse available quests and start your adventure!
              </p>
              <Button onClick={() => setActiveTab('available')}>
                Browse Quests
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeQuests.map(quest => renderQuestCard(quest, true))}
            </div>
          )}
        </TabsContent>
        
        {/* Available Quests Tab */}
        <TabsContent value="available">
          <div className="space-y-6">
            {/* Daily Quests */}
            <div>
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                Daily Quests
                <Badge variant="outline" className="text-blue-400 border-blue-400">
                  Resets in {24 - new Date().getHours()}h
                </Badge>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableDailyQuests.map(quest => renderQuestCard(quest))}
              </div>
            </div>
            
            {/* Weekly Quests */}
            <div>
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                Weekly Quests
                <Badge variant="outline" className="text-purple-400 border-purple-400">
                  Resets Monday
                </Badge>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableWeeklyQuests.map(quest => renderQuestCard(quest))}
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* Epic Quests Tab */}
        <TabsContent value="epic">
          <div className="space-y-4">
            {availableEpicQuests.map(quest => (
              <motion.div
                key={quest.id}
                className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border border-orange-500/30 rounded-lg p-6"
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-white text-xl font-bold mb-1">{quest.title}</h3>
                        <p className="text-gray-400">{quest.description}</p>
                      </div>
                      <Badge variant="outline" className="text-orange-400 border-orange-400">
                        Chapter {quest.chapter}/{quest.totalChapters}
                      </Badge>
                    </div>
                    
                    {quest.story && (
                      <div className="bg-black/30 border border-gray-700 rounded-lg p-3 mb-3">
                        <p className="text-gray-300 text-sm italic">"{quest.story}"</p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4">
                      <Button 
                        className="bg-gradient-to-r from-orange-600 to-red-600"
                        onClick={() => handleQuestClick(quest)}
                      >
                        View Details
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                      <div className="flex items-center gap-3">
                        {quest.rewards.slice(0, 3).map((reward, i) => (
                          <div key={i} className="flex items-center gap-1 text-sm">
                            {reward.type === 'xp' && (
                              <>
                                <Star className="w-4 h-4 text-yellow-400" />
                                <span className="text-yellow-400">{reward.amount}</span>
                              </>
                            )}
                            {reward.type === 'title' && (
                              <span className="text-purple-400 text-xs">{reward.itemName}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>
        
        {/* Party Quests Tab */}
        <TabsContent value="party">
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-white text-xl font-bold mb-2">Party Quests Coming Soon</h3>
            <p className="text-gray-400 mb-4">
              Team up with friends to tackle cooperative challenges!
            </p>
            <Badge variant="outline" className="text-purple-400 border-purple-400">
              Feature in Development
            </Badge>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Quest Details Dialog */}
      <Dialog open={showQuestDetails} onOpenChange={setShowQuestDetails}>
        <DialogContent className="bg-[#1e2128] border-gray-700 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedQuest && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-2xl">
                  {(() => {
                    const TypeIcon = getQuestTypeIcon(selectedQuest.type);
                    return <TypeIcon className="w-6 h-6 text-blue-400" />;
                  })()}
                  {selectedQuest.title}
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  {selectedQuest.description}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 mt-4">
                {/* Quest Info */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#252830] border border-gray-700 rounded-lg p-3">
                    <div className="text-gray-500 text-xs mb-1">Difficulty</div>
                    <Badge variant="outline" className={getDifficultyColor(selectedQuest.difficulty)}>
                      {selectedQuest.difficulty}
                    </Badge>
                  </div>
                  <div className="bg-[#252830] border border-gray-700 rounded-lg p-3">
                    <div className="text-gray-500 text-xs mb-1">Type</div>
                    <div className="text-white capitalize">{selectedQuest.type}</div>
                  </div>
                  <div className="bg-[#252830] border border-gray-700 rounded-lg p-3">
                    <div className="text-gray-500 text-xs mb-1">Required Level</div>
                    <div className="text-white">{selectedQuest.requiredLevel}</div>
                  </div>
                </div>
                
                {/* Story (for epic quests) */}
                {selectedQuest.story && (
                  <div className="bg-black/40 border border-gray-700 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <Scroll className="w-4 h-4 text-orange-400" />
                      Story
                    </h4>
                    <p className="text-gray-300 italic">"{selectedQuest.story}"</p>
                  </div>
                )}
                
                {/* Objectives */}
                <div>
                  <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-400" />
                    Objectives
                  </h4>
                  <div className="space-y-2">
                    {selectedQuest.objectives.map((obj, i) => (
                      <div key={i} className="bg-[#252830] border border-gray-700 rounded-lg p-3">
                        <div className="flex items-start gap-3">
                          {obj.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <div className={obj.completed ? 'text-gray-500 line-through' : 'text-white'}>
                              {obj.description}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Progress: {obj.current} / {obj.target}
                            </div>
                            {!obj.completed && (
                              <Progress value={(obj.current / obj.target) * 100} className="h-1 mt-2" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Rewards */}
                <div>
                  <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    Rewards
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedQuest.rewards.map((reward, i) => (
                      <div key={i} className="bg-[#252830] border border-gray-700 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          {reward.type === 'xp' && (
                            <>
                              <Star className="w-5 h-5 text-yellow-400" />
                              <span className="text-white font-semibold">{reward.amount} XP</span>
                            </>
                          )}
                          {reward.type === 'seasonXp' && (
                            <>
                              <Sparkles className="w-5 h-5 text-purple-400" />
                              <span className="text-white font-semibold">{reward.amount} Season XP</span>
                            </>
                          )}
                          {reward.type === 'item' && (
                            <>
                              <Award className="w-5 h-5 text-blue-400" />
                              <span className="text-white font-semibold">{reward.itemName}</span>
                            </>
                          )}
                          {reward.type === 'title' && (
                            <>
                              <Crown className="w-5 h-5 text-purple-400" />
                              <span className="text-white font-semibold">{reward.itemName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-700">
                  {selectedQuest.status === 'available' ? (
                    <>
                      {profile.level >= selectedQuest.requiredLevel ? (
                        <Button 
                          className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600"
                          onClick={() => handleAcceptQuest(selectedQuest)}
                        >
                          Accept Quest
                        </Button>
                      ) : (
                        <Button className="flex-1" disabled>
                          <Lock className="w-4 h-4 mr-2" />
                          Requires Level {selectedQuest.requiredLevel}
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleAbandonQuest(selectedQuest.id)}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Abandon Quest
                      </Button>
                      {selectedQuest.progress === 100 && (
                        <Button 
                          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
                          onClick={() => {
                            completeQuest(selectedQuest.id);
                            setShowQuestDetails(false);
                          }}
                        >
                          <Trophy className="w-4 h-4 mr-2" />
                          Claim Rewards
                        </Button>
                      )}
                    </>
                  )}
                  <Button variant="ghost" onClick={() => setShowQuestDetails(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
