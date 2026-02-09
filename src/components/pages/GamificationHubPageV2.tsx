import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Star, Award, Target, Zap, Users, TrendingUp,
  Gift, Crown, Medal, Flame, Calendar, Sparkles, Heart,
  Scroll, Shield, Mountain, Gem, CircleDot, Gamepad2,
  PartyPopper, CheckCircle2
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DashboardLayout } from '../layout/DashboardLayout';
import { AIInsightsContent } from '../AIInsightsSectionOriginal';
import {
  StreakHistory,
  XPProgression,
  LeaderboardSnapshot,
  AchievementCompletion,
  DailyEngagement
} from '../GamificationVisualizations';
import { AnimatedAvatar } from '../AnimatedAvatar';
import { useGamification as useGamificationPrefs } from '../../utils/gamification-preferences';
import { useGamification } from '../../contexts/GamificationContext';
import { CURRENT_USER } from '../../utils/user-constants';

// Import new components
import { QuestBoard } from '../gamification/QuestBoard';
import { LeagueStandings } from '../gamification/LeagueStandings';
import { ClassSelection } from '../gamification/ClassSelection';
import { SeasonPassTracker } from '../gamification/SeasonPassTracker';
import { PetCollection } from '../gamification/PetCollection';
import { MasteryTrees } from '../gamification/MasteryTrees';
import { PrestigeSystem } from '../gamification/PrestigeSystem';
import { TitleBadgeGallery } from '../gamification/TitleBadgeGallery';
import { GuildDashboard } from '../gamification/GuildDashboard';
import { FriendSystem } from '../gamification/FriendSystem';
import { GiftTradingSystem } from '../gamification/GiftTradingSystem';
import { EventCalendar } from '../gamification/EventCalendar';

export function GamificationHubPageV2() {
  const { enabled: gamificationEnabled } = useGamificationPrefs();
  const { 
    profile,
    activeQuests,
    currentLeague,
    seasonPass,
    activePet,
    achievements,
    celebrations,
    dismissCelebration
  } = useGamification();
  
  const [activeTab, setActiveTab] = useState<
    'overview' | 'quests' | 'leagues' | 'class' | 'season' | 'pets' | 
    'achievements' | 'mastery' | 'prestige' | 'titles' | 'guilds' | 'friends' | 
    'gifts' | 'events' | 'leaderboard' | 'rewards'
  >('overview');
  
  // AI Insights with gamification visualizations
  const aiInsightsContent: AIInsightsContent = {
    title: 'Gamification Stats',
    mode: 'custom',
    customContent: (
      <div className="space-y-6">
        {/* 1. Current Streak & History */}
        <div>
          <h3 className="text-sm text-gray-300 mb-3 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            Streak & History
          </h3>
          <StreakHistory
            currentStreak={profile.stats.currentStreak}
            longestStreak={profile.stats.longestStreak}
            dailyHistory={[
              { week: 1, days: [true, true, true, true, true, true, false] },
              { week: 2, days: [false, true, true, true, true, true, true] },
              { week: 3, days: [true, true, true, true, true, false, false] },
              { week: 4, days: [true, true, true, true, true, true, true] },
              { week: 5, days: [true, true, true, true, true, true, false] },
              { week: 6, days: [true, true, true, true, true, true, true] },
              { week: 7, days: [true, true, true, true, true, true, true] },
              { week: 8, days: [true, true, true, true, true, true, true] },
            ]}
          />
        </div>

        {/* 2. XP Progression */}
        <div>
          <h3 className="text-sm text-gray-300 mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-purple-400" />
            XP Progression
          </h3>
          <XPProgression
            weeklyData={[
              { week: 'W1', xp: 850 },
              { week: 'W2', xp: 920 },
              { week: 'W3', xp: 1150, isDoubleXP: true },
              { week: 'W4', xp: 980 },
              { week: 'W5', xp: 1050 },
              { week: 'W6', xp: 1280, isDoubleXP: true },
              { week: 'W7', xp: 1100 },
              { week: 'W8', xp: 1220 },
            ]}
            currentXP={profile.xp}
            nextLevelXP={profile.nextLevelXp}
            currentLevel={profile.level}
          />
        </div>

        {/* 3. Achievement Progress */}
        <div>
          <h3 className="text-sm text-gray-300 mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-400" />
            Achievement Progress
          </h3>
          <AchievementCompletion
            categories={[
              { name: 'Productivity', unlocked: 8, total: 10, icon: Target, color: 'text-blue-400' },
              { name: 'Energy', unlocked: 5, total: 8, icon: Zap, color: 'text-yellow-400' },
              { name: 'Focus', unlocked: 6, total: 9, icon: Mountain, color: 'text-purple-400' },
              { name: 'Team', unlocked: 4, total: 6, icon: Users, color: 'text-green-400' },
              { name: 'Streak', unlocked: 7, total: 8, icon: Flame, color: 'text-orange-400' },
            ]}
          />
        </div>

        {/* 4. Daily Engagement */}
        <div>
          <h3 className="text-sm text-gray-300 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            Daily Engagement
          </h3>
          <DailyEngagement
            dailyData={Array.from({ length: 30 }, (_, i) => ({
              day: `${i + 1}`,
              tasksCompleted: Math.floor(Math.random() * 6) + 3,
              goalMet: Math.random() > 0.3,
              dailyGoal: 6,
            }))}
          />
        </div>
      </div>
    ),
  };
  
  // Show message if gamification is disabled
  if (!gamificationEnabled) {
    return (
      <DashboardLayout aiInsightsContent={aiInsightsContent}>
        <div className="flex-1 overflow-auto hide-scrollbar p-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gamepad2 className="w-10 h-10 text-gray-600" />
              </div>
              <h2 className="text-white text-2xl font-bold mb-2">Gamification Disabled</h2>
              <p className="text-gray-400 mb-6">
                Enable gamification in your profile menu to track points, earn badges, and compete on leaderboards.
              </p>
              <Button 
                className="bg-gradient-to-r from-purple-600 to-pink-600"
                onClick={() => window.location.reload()}
              >
                <Gamepad2 className="w-4 h-4 mr-2" />
                Refresh to Enable
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout aiInsightsContent={aiInsightsContent}>
      <div className="flex-1 overflow-auto hide-scrollbar p-6 space-y-6">
        {/* Celebration Animations */}
        <AnimatePresence>
          {celebrations.map((celebration, index) => (
            <motion.div
              key={index}
              className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => dismissCelebration(index)}
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1.5, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: 'spring', duration: 0.6 }}
              >
                <PartyPopper className="w-24 h-24 text-yellow-400" />
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white mb-2">Gamification Hub</h1>
            <p className="text-gray-400">Level up your productivity through play and competition</p>
          </div>
        </div>
        
        {/* Enhanced Score Dashboard */}
        <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Level & XP */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <AnimatedAvatar
                    src={CURRENT_USER.avatar}
                    fallback={CURRENT_USER.name.split(' ').map(n => n[0]).join('')}
                    progress={85}
                    animationType="glow"
                    size={80}
                    className="w-20 h-20"
                  />
                  <motion.div
                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center border-2 border-[#1e2128] shadow-lg"
                    animate={{
                      scale: [1, 1.1, 1],
                      boxShadow: [
                        '0 4px 6px -1px rgba(234, 179, 8, 0.1)',
                        '0 4px 12px rgba(234, 179, 8, 0.4)',
                        '0 4px 6px -1px rgba(234, 179, 8, 0.1)',
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <span className="text-xs font-bold text-gray-900">{profile.level}</span>
                  </motion.div>
                </div>
                <div className="flex-1">
                  <h3 className="text-white text-xl font-bold mb-1">Level {profile.level}</h3>
                  {profile.class && (
                    <p className="text-gray-400 text-sm mb-2 capitalize">{profile.class}</p>
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">XP Progress</span>
                      <span className="text-white">{profile.xp} / {profile.nextLevelXp}</span>
                    </div>
                    <Progress 
                      value={(profile.xp / profile.nextLevelXp) * 100} 
                      className="h-2"
                      indicatorClassName="bg-gradient-to-r from-purple-500 to-pink-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* League Rank */}
            <div className="bg-[#252830] border border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-gray-400 text-sm">League Rank</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">#{profile.leagueRank}</div>
              <div className="text-xs text-blue-400 capitalize">{profile.currentLeague} League</div>
            </div>
            
            {/* Active Quests */}
            <div className="bg-[#252830] border border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Scroll className="w-5 h-5 text-blue-400" />
                <span className="text-gray-400 text-sm">Active Quests</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{activeQuests.length}</div>
              <div className="text-xs text-green-400">Keep grinding!</div>
            </div>
            
            {/* Season Pass */}
            <div className="bg-[#252830] border border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span className="text-gray-400 text-sm">Season Tier</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{profile.seasonLevel}</div>
              <div className="text-xs text-purple-400">
                {profile.hasPremiumPass ? 'Premium' : 'Free Track'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-16 overflow-x-auto gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="quests">Quests</TabsTrigger>
            <TabsTrigger value="leagues">Leagues</TabsTrigger>
            <TabsTrigger value="class">Class</TabsTrigger>
            <TabsTrigger value="season">Season</TabsTrigger>
            <TabsTrigger value="pets">Pets</TabsTrigger>
            <TabsTrigger value="achievements">Achieve</TabsTrigger>
            <TabsTrigger value="mastery">Mastery</TabsTrigger>
            <TabsTrigger value="prestige">Prestige</TabsTrigger>
            <TabsTrigger value="titles">Titles</TabsTrigger>
            <TabsTrigger value="guilds">Guilds</TabsTrigger>
            <TabsTrigger value="friends">Friends</TabsTrigger>
            <TabsTrigger value="gifts">Gifts</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="leaderboard">Board</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
          </TabsList>
          
          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quick Stats */}
              <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
                <h3 className="text-white text-xl font-bold mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Total XP Earned</span>
                    <span className="text-white font-bold">{profile.totalXpEarned.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Tasks Completed</span>
                    <span className="text-white font-bold">{profile.stats.tasksCompleted.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Achievements Unlocked</span>
                    <span className="text-white font-bold">{profile.stats.achievementsUnlocked}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Current Streak</span>
                    <span className="text-white font-bold flex items-center gap-1">
                      <Flame className="w-4 h-4 text-orange-400" />
                      {profile.stats.currentStreak} days
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Recent Achievements */}
              <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
                <h3 className="text-white text-xl font-bold mb-4">Recent Achievements</h3>
                <div className="space-y-3">
                  {achievements.filter(a => a.unlocked).slice(0, 3).map((achievement) => (
                    <div key={achievement.id} className="flex items-center gap-3 bg-[#252830] border border-gray-700 rounded-lg p-3">
                      <div className="text-3xl">{achievement.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold truncate">{achievement.title}</div>
                        <div className="text-gray-400 text-xs truncate">{achievement.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div
                className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border border-blue-500/30 rounded-xl p-6 cursor-pointer"
                whileHover={{ scale: 1.02, y: -4 }}
                onClick={() => setActiveTab('quests')}
              >
                <Scroll className="w-8 h-8 text-blue-400 mb-3" />
                <h3 className="text-white font-bold text-lg mb-1">Quests</h3>
                <p className="text-gray-400 text-sm mb-3">Complete missions to earn rewards</p>
                <Badge variant="outline" className="text-blue-400 border-blue-400">
                  {activeQuests.length} Active
                </Badge>
              </motion.div>
              
              <motion.div
                className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-xl p-6 cursor-pointer"
                whileHover={{ scale: 1.02, y: -4 }}
                onClick={() => setActiveTab('season')}
              >
                <Sparkles className="w-8 h-8 text-purple-400 mb-3" />
                <h3 className="text-white font-bold text-lg mb-1">Season Pass</h3>
                <p className="text-gray-400 text-sm mb-3">Unlock exclusive seasonal rewards</p>
                <Badge variant="outline" className="text-purple-400 border-purple-400">
                  Tier {profile.seasonLevel}
                </Badge>
              </motion.div>
              
              <motion.div
                className="bg-gradient-to-br from-pink-900/30 to-red-900/30 border border-pink-500/30 rounded-xl p-6 cursor-pointer"
                whileHover={{ scale: 1.02, y: -4 }}
                onClick={() => setActiveTab('pets')}
              >
                <Heart className="w-8 h-8 text-pink-400 mb-3" />
                <h3 className="text-white font-bold text-lg mb-1">Pets</h3>
                <p className="text-gray-400 text-sm mb-3">Collect companions that help you</p>
                <Badge variant="outline" className="text-pink-400 border-pink-400">
                  {profile.ownedPetIds.length} Pets
                </Badge>
              </motion.div>
            </div>
          </TabsContent>
          
          {/* QUESTS TAB */}
          <TabsContent value="quests" className="mt-6">
            <QuestBoard />
          </TabsContent>
          
          {/* LEAGUES TAB */}
          <TabsContent value="leagues" className="mt-6">
            <LeagueStandings />
          </TabsContent>
          
          {/* CLASS TAB */}
          <TabsContent value="class" className="mt-6">
            <ClassSelection />
          </TabsContent>
          
          {/* SEASON PASS TAB */}
          <TabsContent value="season" className="mt-6">
            <SeasonPassTracker />
          </TabsContent>
          
          {/* PETS TAB */}
          <TabsContent value="pets" className="mt-6">
            <PetCollection />
          </TabsContent>
          
          {/* ACHIEVEMENTS TAB */}
          <TabsContent value="achievements" className="mt-6">
            <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
              <h2 className="text-white text-2xl font-bold mb-6">Achievements</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`border rounded-lg p-4 ${
                      achievement.unlocked
                        ? 'bg-[#252830] border-gray-700'
                        : 'bg-gray-800/20 border-gray-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="text-4xl">{achievement.icon}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold mb-1 ${achievement.unlocked ? 'text-white' : 'text-gray-500'}`}>
                          {achievement.title}
                        </h3>
                        <p className={`text-sm ${achievement.unlocked ? 'text-gray-400' : 'text-gray-600'}`}>
                          {achievement.description}
                        </p>
                      </div>
                    </div>
                    {achievement.unlocked ? (
                      <Badge variant="outline" className="text-green-400 border-green-400">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Unlocked
                      </Badge>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Progress</span>
                          <span>{achievement.progress}%</span>
                        </div>
                        <Progress value={achievement.progress} className="h-1.5" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          {/* MASTERY TAB */}
          <TabsContent value="mastery" className="mt-6">
            <MasteryTrees />
          </TabsContent>
          
          {/* PRESTIGE TAB */}
          <TabsContent value="prestige" className="mt-6">
            <PrestigeSystem />
          </TabsContent>
          
          {/* TITLES TAB */}
          <TabsContent value="titles" className="mt-6">
            <TitleBadgeGallery />
          </TabsContent>
          
          {/* GUILDS TAB */}
          <TabsContent value="guilds" className="mt-6">
            <GuildDashboard />
          </TabsContent>
          
          {/* FRIENDS TAB */}
          <TabsContent value="friends" className="mt-6">
            <FriendSystem />
          </TabsContent>
          
          {/* GIFTS TAB */}
          <TabsContent value="gifts" className="mt-6">
            <GiftTradingSystem />
          </TabsContent>
          
          {/* EVENTS TAB */}
          <TabsContent value="events" className="mt-6">
            <EventCalendar />
          </TabsContent>
          
          {/* LEADERBOARD TAB */}
          <TabsContent value="leaderboard" className="mt-6">
            <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
              <h2 className="text-white text-2xl font-bold mb-6">Global Leaderboard</h2>
              <div className="text-center py-12">
                <Trophy className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                <h3 className="text-white text-xl font-bold mb-2">Coming Soon</h3>
                <p className="text-gray-400">
                  Global leaderboards with friend comparisons and class rankings
                </p>
              </div>
            </div>
          </TabsContent>
          
          {/* REWARDS TAB */}
          <TabsContent value="rewards" className="mt-6">
            <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
              <h2 className="text-white text-2xl font-bold mb-6">Rewards Shop</h2>
              <div className="text-center py-12">
                <Gift className="w-20 h-20 text-gray-600 mx-auto mb-4" />
                <h3 className="text-white text-xl font-bold mb-2">Coming Soon</h3>
                <p className="text-gray-400">
                  Spend your points on exclusive cosmetics, boosts, and perks
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}