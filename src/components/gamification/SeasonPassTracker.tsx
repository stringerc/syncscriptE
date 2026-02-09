import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Star, Trophy, Lock, CheckCircle2, Sparkles, Crown, Gem,
  Calendar, TrendingUp, Gift, Award, Flame, Zap, Heart,
  ChevronRight, ChevronLeft
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { SeasonTier, Reward } from '../../types/gamification';
import { useGamification } from '../../contexts/GamificationContext';

interface SeasonPassTrackerProps {
  className?: string;
}

export function SeasonPassTracker({ className }: SeasonPassTrackerProps) {
  const { profile, claimSeasonReward, purchasePremiumPass } = useGamification();
  const [viewStartTier, setViewStartTier] = useState(Math.max(0, profile.seasonLevel - 2));
  
  const tiersPerView = 5;
  const totalTiers = 100;
  
  // Mock season data (would come from API)
  const currentSeason = {
    id: 'season_1',
    seasonNumber: 1,
    name: 'Growth & Renewal',
    theme: 'Spring',
    description: 'Embrace new beginnings and unlock your potential',
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-03-31'),
    status: 'active' as const,
  };
  
  const daysRemaining = Math.ceil((currentSeason.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const tierXP = 200; // XP required per tier
  const currentTierProgress = profile.seasonXp % tierXP;
  
  // Generate season tiers
  const seasonTiers: SeasonTier[] = Array.from({ length: totalTiers }, (_, i) => ({
    level: i + 1,
    xpRequired: tierXP,
    freeReward: i % 2 === 0 ? {
      type: i % 10 === 0 ? 'cosmetic' : 'xp',
      name: i % 10 === 0 ? `Season ${i + 1} Badge` : `${50 + i * 5} XP`,
      description: i % 10 === 0 ? 'Exclusive seasonal badge' : 'Bonus experience points',
      icon: i % 10 === 0 ? '🏅' : '⭐',
      rarity: i % 10 === 0 ? 'rare' : 'common',
      amount: i % 10 === 0 ? undefined : 50 + i * 5,
    } : null,
    premiumReward: {
      type: 
        i === 99 ? 'pet' :
        i % 25 === 24 ? 'cosmetic' :
        i % 10 === 9 ? 'perk' :
        i % 5 === 4 ? 'item' :
        'xp',
      name: 
        i === 99 ? 'Legendary Season Pet' :
        i % 25 === 24 ? `Epic ${currentSeason.theme} Frame` :
        i % 10 === 9 ? 'Premium Perk' :
        i % 5 === 4 ? 'XP Boost' :
        `${100 + i * 10} XP`,
      description: 
        i === 99 ? 'Exclusive legendary companion' :
        i % 25 === 24 ? 'Animated profile frame' :
        i % 10 === 9 ? 'Special ability or bonus' :
        i % 5 === 4 ? 'Double XP for 1 hour' :
        'Premium bonus XP',
      icon: 
        i === 99 ? '🐉' :
        i % 25 === 24 ? '🖼️' :
        i % 10 === 9 ? '✨' :
        i % 5 === 4 ? '⚡' :
        '💫',
      rarity: 
        i === 99 ? 'legendary' :
        i % 25 === 24 ? 'epic' :
        i % 10 === 9 ? 'epic' :
        i % 5 === 4 ? 'rare' :
        'uncommon',
      amount: i === 99 || i % 25 === 24 || i % 10 === 9 || i % 5 === 4 ? undefined : 100 + i * 10,
    },
    unlocked: profile.seasonLevel >= i + 1,
    claimed: false, // Would track individually
  }));
  
  const visibleTiers = seasonTiers.slice(viewStartTier, viewStartTier + tiersPerView);
  
  const handlePrevious = () => {
    setViewStartTier(Math.max(0, viewStartTier - tiersPerView));
  };
  
  const handleNext = () => {
    setViewStartTier(Math.min(totalTiers - tiersPerView, viewStartTier + tiersPerView));
  };
  
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#9CA3AF';
      case 'uncommon': return '#10B981';
      case 'rare': return '#3B82F6';
      case 'epic': return '#A855F7';
      case 'legendary': return '#F59E0B';
      default: return '#6B7280';
    }
  };
  
  const getRewardIcon = (reward: Reward) => {
    switch (reward.type) {
      case 'xp': return Star;
      case 'cosmetic': return Sparkles;
      case 'pet': return Heart;
      case 'perk': return Crown;
      case 'item': return Gift;
      default: return Award;
    }
  };
  
  return (
    <div className={className}>
      {/* Season Header */}
      <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-6 h-6 text-green-400" />
              <h2 className="text-white text-2xl font-bold">Season {currentSeason.seasonNumber}: {currentSeason.name}</h2>
            </div>
            <p className="text-gray-400 mb-3">{currentSeason.description}</p>
            
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-green-400 border-green-400">
                {currentSeason.theme} Theme
              </Badge>
              <div className="flex items-center gap-1 text-gray-400 text-sm">
                <Calendar className="w-4 h-4" />
                {daysRemaining} days remaining
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="bg-[#1e2128] border border-gray-700 rounded-lg px-4 py-3 mb-2">
              <div className="text-gray-500 text-xs mb-1">Season Level</div>
              <div className="text-white text-3xl font-bold">{profile.seasonLevel}</div>
            </div>
            {!profile.hasPremiumPass && (
              <Button 
                className="bg-gradient-to-r from-purple-600 to-pink-600 w-full"
                onClick={purchasePremiumPass}
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Premium
              </Button>
            )}
          </div>
        </div>
        
        {/* Current Tier Progress */}
        <div className="bg-[#1e2128]/50 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400">Progress to Tier {profile.seasonLevel + 1}</span>
            <span className="text-white font-semibold">
              {currentTierProgress} / {tierXP} Season XP
            </span>
          </div>
          <Progress 
            value={(currentTierProgress / tierXP) * 100} 
            className="h-3"
            indicatorClassName="bg-gradient-to-r from-green-500 to-emerald-500"
          />
        </div>
      </div>
      
      {/* Tier Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-bold">Battle Pass Rewards</h3>
          <p className="text-gray-400 text-sm">
            Viewing Tiers {viewStartTier + 1} - {Math.min(viewStartTier + tiersPerView, totalTiers)}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={viewStartTier === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={viewStartTier + tiersPerView >= totalTiers}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Season Pass Tiers */}
      <div className="bg-[#1e2128] border border-gray-800 rounded-xl overflow-hidden">
        {/* Track Labels */}
        <div className="grid grid-cols-[80px_1fr] border-b border-gray-800">
          <div className="bg-[#252830] border-r border-gray-800 p-3">
            <div className="text-gray-400 text-xs font-semibold">TIER</div>
          </div>
          <div className="grid grid-cols-2">
            <div className="bg-[#252830] border-r border-gray-800 p-3">
              <div className="text-gray-400 text-xs font-semibold">FREE TRACK</div>
            </div>
            <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 p-3">
              <div className="flex items-center gap-2">
                <div className="text-purple-400 text-xs font-semibold">PREMIUM TRACK</div>
                {profile.hasPremiumPass && (
                  <Badge variant="outline" className="text-purple-400 border-purple-400 text-[10px] py-0">
                    ACTIVE
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Tier Rows */}
        {visibleTiers.map((tier, index) => {
          const isCurrentTier = tier.level === profile.seasonLevel + 1;
          const isUnlocked = tier.unlocked;
          
          return (
            <motion.div
              key={tier.level}
              className={`grid grid-cols-[80px_1fr] border-b border-gray-800 ${
                isCurrentTier ? 'bg-blue-500/5' : ''
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {/* Tier Number */}
              <div className={`border-r border-gray-800 p-4 flex items-center justify-center ${
                isCurrentTier ? 'bg-blue-500/10' : 'bg-[#252830]'
              }`}>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    isCurrentTier ? 'text-blue-400' : 'text-white'
                  }`}>
                    {tier.level}
                  </div>
                  {isCurrentTier && (
                    <div className="text-blue-400 text-[10px] mt-1">NEXT</div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2">
                {/* Free Reward */}
                <div className="border-r border-gray-800 p-4">
                  {tier.freeReward ? (
                    <div className={`flex items-center gap-3 ${
                      !isUnlocked ? 'opacity-50' : ''
                    }`}>
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                        style={{ 
                          backgroundColor: `${getRarityColor(tier.freeReward.rarity)}20`,
                          border: `2px solid ${getRarityColor(tier.freeReward.rarity)}40`
                        }}
                      >
                        {tier.freeReward.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-semibold truncate">
                          {tier.freeReward.name}
                        </div>
                        <div className="text-gray-400 text-xs truncate">
                          {tier.freeReward.description}
                        </div>
                      </div>
                      {isUnlocked ? (
                        tier.claimed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => claimSeasonReward(tier.level, false)}
                          >
                            Claim
                          </Button>
                        )
                      ) : (
                        <Lock className="w-5 h-5 text-gray-600 flex-shrink-0" />
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-600 text-sm italic text-center py-2">
                      No reward
                    </div>
                  )}
                </div>
                
                {/* Premium Reward */}
                <div className={`p-4 ${!profile.hasPremiumPass ? 'opacity-40' : ''}`}>
                  {tier.premiumReward && (
                    <div className={`flex items-center gap-3 ${
                      !isUnlocked || !profile.hasPremiumPass ? 'opacity-50' : ''
                    }`}>
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl relative"
                        style={{ 
                          backgroundColor: `${getRarityColor(tier.premiumReward.rarity)}20`,
                          border: `2px solid ${getRarityColor(tier.premiumReward.rarity)}`
                        }}
                      >
                        {tier.premiumReward.icon}
                        {tier.premiumReward.rarity === 'legendary' && (
                          <motion.div
                            className="absolute inset-0 rounded-lg"
                            animate={{
                              boxShadow: [
                                `0 0 10px ${getRarityColor(tier.premiumReward.rarity)}`,
                                `0 0 20px ${getRarityColor(tier.premiumReward.rarity)}`,
                                `0 0 10px ${getRarityColor(tier.premiumReward.rarity)}`,
                              ],
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-semibold truncate">
                          {tier.premiumReward.name}
                        </div>
                        <div className="text-gray-400 text-xs truncate">
                          {tier.premiumReward.description}
                        </div>
                        {tier.level === 100 && (
                          <Badge 
                            variant="outline" 
                            className="text-orange-400 border-orange-400 text-[10px] mt-1"
                          >
                            ULTIMATE REWARD
                          </Badge>
                        )}
                      </div>
                      {!profile.hasPremiumPass ? (
                        <Crown className="w-5 h-5 text-purple-400 flex-shrink-0" />
                      ) : isUnlocked ? (
                        tier.claimed ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                        ) : (
                          <Button 
                            size="sm"
                            className="bg-gradient-to-r from-purple-600 to-pink-600"
                            onClick={() => claimSeasonReward(tier.level, true)}
                          >
                            Claim
                          </Button>
                        )
                      ) : (
                        <Lock className="w-5 h-5 text-gray-600 flex-shrink-0" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Premium Upsell (if not purchased) */}
      {!profile.hasPremiumPass && (
        <motion.div
          className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-xl p-6 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white text-xl font-bold mb-2">Unlock Premium Season Pass</h3>
              <p className="text-gray-400 mb-4">
                Get instant access to all premium rewards, including exclusive cosmetics, pets, perks, and the legendary tier 100 reward!
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="bg-[#1e2128]/50 border border-gray-700 rounded-lg p-3">
                  <div className="text-purple-400 font-semibold mb-1">100 Premium Rewards</div>
                  <div className="text-gray-400 text-sm">Exclusive items at every tier</div>
                </div>
                <div className="bg-[#1e2128]/50 border border-gray-700 rounded-lg p-3">
                  <div className="text-purple-400 font-semibold mb-1">Legendary Pet</div>
                  <div className="text-gray-400 text-sm">Unlock at tier 100</div>
                </div>
                <div className="bg-[#1e2128]/50 border border-gray-700 rounded-lg p-3">
                  <div className="text-purple-400 font-semibold mb-1">Instant Unlock</div>
                  <div className="text-gray-400 text-sm">Claim all past rewards</div>
                </div>
              </div>
              
              <Button 
                className="bg-gradient-to-r from-purple-600 to-pink-600"
                onClick={purchasePremiumPass}
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Premium
              </Button>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Season Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-[#1e2128] border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <div className="text-gray-400 text-sm">Free Rewards Claimed</div>
          </div>
          <div className="text-white text-2xl font-bold">
            {seasonTiers.filter(t => t.freeReward && t.unlocked && t.claimed).length}
          </div>
        </div>
        
        <div className="bg-[#1e2128] border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-5 h-5 text-purple-400" />
            <div className="text-gray-400 text-sm">Premium Rewards</div>
          </div>
          <div className="text-white text-2xl font-bold">
            {profile.hasPremiumPass 
              ? seasonTiers.filter(t => t.premiumReward && t.unlocked && t.claimed).length 
              : '0'}
          </div>
        </div>
        
        <div className="bg-[#1e2128] border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <div className="text-gray-400 text-sm">Season XP Earned</div>
          </div>
          <div className="text-white text-2xl font-bold">
            {profile.seasonXp.toLocaleString()}
          </div>
        </div>
        
        <div className="bg-[#1e2128] border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <div className="text-gray-400 text-sm">Completion</div>
          </div>
          <div className="text-white text-2xl font-bold">
            {profile.seasonLevel}%
          </div>
        </div>
      </div>
    </div>
  );
}
