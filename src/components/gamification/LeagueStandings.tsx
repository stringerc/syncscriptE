import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Trophy, TrendingUp, TrendingDown, Minus, Crown, Medal,
  Flame, Star, Zap, ChevronRight, Calendar, Award, Shield,
  ArrowUp, ArrowDown
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { LeagueTier, LeagueParticipant } from '../../types/gamification';
import { useGamification } from '../../contexts/GamificationContext';
import { LEAGUE_TIER_INFO } from '../../data/gamification-data';
import { CURRENT_USER } from '../../utils/user-constants';

interface LeagueStandingsProps {
  className?: string;
}

export function LeagueStandings({ className }: LeagueStandingsProps) {
  const { profile, currentLeague } = useGamification();
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  
  // Mock league participants (in production, would come from API)
  const mockParticipants: LeagueParticipant[] = [
    {
      userId: 'user1',
      userName: 'Sarah Chen',
      userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      rank: 1,
      xpEarned: 2450,
      trend: 'up',
    },
    {
      userId: 'user2',
      userName: 'Marcus Johnson',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      rank: 2,
      xpEarned: 2180,
      trend: 'up',
    },
    {
      userId: CURRENT_USER.email,
      userName: CURRENT_USER.name,
      userAvatar: CURRENT_USER.avatar,
      rank: profile.leagueRank,
      xpEarned: profile.leagueXp,
      trend: 'same',
      isCurrentUser: true,
    },
    {
      userId: 'user4',
      userName: 'Elena Rodriguez',
      userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      rank: 13,
      xpEarned: 1340,
      trend: 'down',
    },
    {
      userId: 'user5',
      userName: 'David Kim',
      userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      rank: 14,
      xpEarned: 1290,
      trend: 'up',
    },
    // More participants...
    ...Array.from({ length: 25 }, (_, i) => ({
      userId: `user${i + 6}`,
      userName: `Player ${i + 6}`,
      userAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 6}`,
      rank: i + 15,
      xpEarned: Math.max(100, 1200 - (i * 50)),
      trend: (Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'same') as 'up' | 'down' | 'same',
    })),
  ].sort((a, b) => b.xpEarned - a.xpEarned).map((p, i) => ({ ...p, rank: i + 1 }));
  
  const currentTier = profile.currentLeague;
  const tierInfo = LEAGUE_TIER_INFO[currentTier];
  
  // Calculate safe/danger zones
  const promotionZone = 10; // Top 10 get promoted
  const demotionZone = 30; // Bottom entries (26-30) get demoted
  const safeZone = 25; // Ranks 11-25 are safe
  
  const isInPromotionZone = profile.leagueRank <= promotionZone;
  const isInDangerZone = profile.leagueRank > safeZone;
  
  // Days until league ends
  const daysUntilEnd = 3; // Mock - would calculate from league end date
  
  const getTrendIcon = (trend: 'up' | 'down' | 'same') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-400" />;
      case 'same': return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };
  
  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-400" />;
    return <span className="text-gray-400 font-bold">#{rank}</span>;
  };
  
  return (
    <div className={className}>
      {/* League Header */}
      <div className="bg-gradient-to-r from-[#252830] to-[#1e2128] border border-gray-800 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div 
              className="w-20 h-20 rounded-lg flex items-center justify-center text-4xl"
              style={{ backgroundColor: `${tierInfo.color}20`, border: `2px solid ${tierInfo.color}` }}
            >
              {tierInfo.icon}
            </div>
            <div>
              <h2 className="text-white text-2xl font-bold mb-1">{tierInfo.name}</h2>
              <p className="text-gray-400 mb-3">
                Weekly tournament • {mockParticipants.length} competitors
              </p>
              
              {/* Current Rank Display */}
              <div className="flex items-center gap-4">
                <div className="bg-[#1e2128] border border-gray-700 rounded-lg px-4 py-2">
                  <div className="text-gray-500 text-xs mb-1">Your Rank</div>
                  <div className="text-white text-2xl font-bold">#{profile.leagueRank}</div>
                </div>
                <div className="bg-[#1e2128] border border-gray-700 rounded-lg px-4 py-2">
                  <div className="text-gray-500 text-xs mb-1">XP This Week</div>
                  <div className="text-white text-2xl font-bold flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-400" />
                    {profile.leagueXp.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <Badge 
              variant="outline" 
              className={
                isInPromotionZone 
                  ? 'text-green-400 border-green-400' 
                  : isInDangerZone 
                  ? 'text-red-400 border-red-400' 
                  : 'text-blue-400 border-blue-400'
              }
            >
              {isInPromotionZone && (
                <>
                  <ArrowUp className="w-3 h-3 mr-1" />
                  Promotion Zone
                </>
              )}
              {isInDangerZone && (
                <>
                  <ArrowDown className="w-3 h-3 mr-1" />
                  Danger Zone
                </>
              )}
              {!isInPromotionZone && !isInDangerZone && (
                <>
                  <Shield className="w-3 h-3 mr-1" />
                  Safe Zone
                </>
              )}
            </Badge>
            <div className="text-gray-400 text-sm mt-2 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Ends in {daysUntilEnd} days
            </div>
          </div>
        </div>
        
        {/* Status Bar */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400">
              {isInPromotionZone 
                ? `${promotionZone - profile.leagueRank + 1} spot${promotionZone - profile.leagueRank + 1 === 1 ? '' : 's'} away from guaranteed promotion` 
                : isInDangerZone
                ? `${profile.leagueRank - safeZone} spot${profile.leagueRank - safeZone === 1 ? '' : 's'} from safety`
                : 'Maintain your position to avoid demotion'}
            </span>
            <span className="text-white font-semibold">
              {mockParticipants[promotionZone - 1]?.xpEarned.toLocaleString()} XP (Rank {promotionZone})
            </span>
          </div>
          <Progress 
            value={isInPromotionZone ? 100 : (profile.leagueXp / mockParticipants[promotionZone - 1]?.xpEarned) * 100} 
            className="h-2"
            indicatorClassName={
              isInPromotionZone 
                ? 'bg-green-500' 
                : isInDangerZone 
                ? 'bg-red-500' 
                : 'bg-blue-500'
            }
          />
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="current">Current Week</TabsTrigger>
          <TabsTrigger value="history">League History</TabsTrigger>
        </TabsList>
        
        {/* Current Week Standings */}
        <TabsContent value="current">
          <div className="bg-[#1e2128] border border-gray-800 rounded-xl overflow-hidden">
            {/* Zone Headers */}
            <div className="bg-green-500/10 border-b border-green-500/30 px-4 py-2 flex items-center gap-2">
              <ArrowUp className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-semibold text-sm">
                Promotion Zone (Top {promotionZone})
              </span>
            </div>
            
            {/* Standings List */}
            <div className="divide-y divide-gray-800">
              {mockParticipants.map((participant, index) => {
                // Show zone separator
                const showSafeZoneSeparator = index === promotionZone;
                const showDangerZoneSeparator = index === safeZone;
                
                return (
                  <div key={participant.userId}>
                    {showSafeZoneSeparator && (
                      <div className="bg-blue-500/10 border-y border-blue-500/30 px-4 py-2 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-400 font-semibold text-sm">
                          Safe Zone (Ranks {promotionZone + 1}-{safeZone})
                        </span>
                      </div>
                    )}
                    {showDangerZoneSeparator && (
                      <div className="bg-red-500/10 border-y border-red-500/30 px-4 py-2 flex items-center gap-2">
                        <ArrowDown className="w-4 h-4 text-red-400" />
                        <span className="text-red-400 font-semibold text-sm">
                          Danger Zone (Ranks {safeZone + 1}+)
                        </span>
                      </div>
                    )}
                    
                    <motion.div
                      className={`px-4 py-3 flex items-center gap-4 transition-colors ${
                        participant.isCurrentUser 
                          ? 'bg-blue-500/10 border-y border-blue-500/30' 
                          : 'hover:bg-[#252830]'
                      }`}
                      whileHover={{ x: 4 }}
                    >
                      {/* Rank */}
                      <div className="w-12 flex items-center justify-center">
                        {getRankBadge(participant.rank)}
                      </div>
                      
                      {/* User Info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="w-10 h-10 border-2 border-gray-700">
                          <AvatarImage src={participant.userAvatar} />
                          <AvatarFallback>
                            {participant.userName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className={`font-semibold truncate ${
                            participant.isCurrentUser ? 'text-blue-400' : 'text-white'
                          }`}>
                            {participant.userName}
                            {participant.isCurrentUser && (
                              <Badge variant="outline" className="ml-2 text-blue-400 border-blue-400">
                                You
                              </Badge>
                            )}
                          </div>
                          <div className="text-gray-400 text-xs">
                            {participant.xpEarned.toLocaleString()} XP
                          </div>
                        </div>
                      </div>
                      
                      {/* Trend */}
                      <div className="w-8 flex items-center justify-center">
                        {getTrendIcon(participant.trend)}
                      </div>
                      
                      {/* XP Bar (for top 10) */}
                      {participant.rank <= 10 && (
                        <div className="w-24 hidden lg:block">
                          <Progress 
                            value={(participant.xpEarned / mockParticipants[0].xpEarned) * 100} 
                            className="h-1.5"
                            indicatorClassName="bg-gradient-to-r from-yellow-500 to-orange-500"
                          />
                        </div>
                      )}
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Promotion/Demotion Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-green-400" />
                <h3 className="text-white font-semibold">Promotion Rewards</h3>
              </div>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Advance to {LEAGUE_TIER_INFO[getNextTier(currentTier)]?.name}</li>
                <li>• Exclusive badge</li>
                <li>• 500 bonus XP</li>
                <li>• Crown icon on profile (1st place)</li>
              </ul>
            </div>
            
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-red-400" />
                <h3 className="text-white font-semibold">Stay Safe!</h3>
              </div>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Bottom 5 players are demoted</li>
                <li>• Streak protection prevents one demotion</li>
                <li>• Keep earning XP to stay safe</li>
                <li>• Bronze league has no demotion</li>
              </ul>
            </div>
          </div>
        </TabsContent>
        
        {/* League History */}
        <TabsContent value="history">
          <div className="space-y-4">
            {/* Mock history - would come from API */}
            {[
              { week: 'Week 41', tier: 'gold', rank: 8, result: 'promoted', xp: 2340 },
              { week: 'Week 40', tier: 'silver', rank: 3, result: 'promoted', xp: 2890 },
              { week: 'Week 39', tier: 'silver', rank: 15, result: 'stayed', xp: 1560 },
              { week: 'Week 38', tier: 'silver', rank: 12, result: 'stayed', xp: 1720 },
            ].map((entry, i) => (
              <motion.div
                key={i}
                className="bg-[#1e2128] border border-gray-800 rounded-lg p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                      style={{ 
                        backgroundColor: `${LEAGUE_TIER_INFO[entry.tier as LeagueTier].color}20`,
                        border: `2px solid ${LEAGUE_TIER_INFO[entry.tier as LeagueTier].color}`
                      }}
                    >
                      {LEAGUE_TIER_INFO[entry.tier as LeagueTier].icon}
                    </div>
                    <div>
                      <div className="text-white font-semibold">{entry.week}</div>
                      <div className="text-gray-400 text-sm">
                        {LEAGUE_TIER_INFO[entry.tier as LeagueTier].name} • Rank #{entry.rank}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge 
                      variant="outline"
                      className={
                        entry.result === 'promoted' 
                          ? 'text-green-400 border-green-400' 
                          : entry.result === 'demoted'
                          ? 'text-red-400 border-red-400'
                          : 'text-blue-400 border-blue-400'
                      }
                    >
                      {entry.result === 'promoted' && <ArrowUp className="w-3 h-3 mr-1" />}
                      {entry.result === 'demoted' && <ArrowDown className="w-3 h-3 mr-1" />}
                      {entry.result.charAt(0).toUpperCase() + entry.result.slice(1)}
                    </Badge>
                    <div className="text-gray-400 text-sm mt-1">
                      {entry.xp.toLocaleString()} XP
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper to get next league tier
function getNextTier(current: LeagueTier): LeagueTier {
  const tiers: LeagueTier[] = ['bronze', 'silver', 'gold', 'sapphire', 'ruby', 'emerald', 'diamond', 'obsidian'];
  const currentIndex = tiers.indexOf(current);
  return tiers[Math.min(currentIndex + 1, tiers.length - 1)];
}
