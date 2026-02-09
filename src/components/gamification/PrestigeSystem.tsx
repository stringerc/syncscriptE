import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Crown, Star, Sparkles, TrendingUp, Award, Trophy,
  Flame, Zap, Shield, Rocket, CheckCircle2, X, AlertTriangle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { useGamification } from '../../contexts/GamificationContext';

interface PrestigeSystemProps {
  className?: string;
}

export function PrestigeSystem({ className }: PrestigeSystemProps) {
  const { profile, canPrestige, performPrestige } = useGamification();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const totalMasteryLevel = Object.values(profile.masteryLevels).reduce((sum, level) => sum + level, 0);
  const prestigeReady = canPrestige();
  const requiredLevel = 300;
  const progressPercent = (totalMasteryLevel / requiredLevel) * 100;
  
  // Calculate prestige bonuses
  const currentBonus = profile.prestigeLevel * 5; // 5% per prestige
  const nextBonus = (profile.prestigeLevel + 1) * 5;
  const bonusIncrease = nextBonus - currentBonus;
  
  // Prestige rewards
  const prestigeRewards = [
    {
      level: 1,
      name: 'Prestige I',
      xpBoost: 5,
      title: 'The Reborn',
      cosmetic: 'Bronze Prestige Frame',
      unlocked: profile.prestigeLevel >= 1,
    },
    {
      level: 2,
      name: 'Prestige II',
      xpBoost: 10,
      title: 'The Ascended',
      cosmetic: 'Silver Prestige Frame',
      unlocked: profile.prestigeLevel >= 2,
    },
    {
      level: 3,
      name: 'Prestige III',
      xpBoost: 15,
      title: 'The Enlightened',
      cosmetic: 'Gold Prestige Frame',
      unlocked: profile.prestigeLevel >= 3,
    },
    {
      level: 5,
      name: 'Prestige V',
      xpBoost: 25,
      title: 'The Transcendent',
      cosmetic: 'Diamond Prestige Frame',
      unlocked: profile.prestigeLevel >= 5,
    },
    {
      level: 10,
      name: 'Prestige X',
      xpBoost: 50,
      title: 'The Legendary',
      cosmetic: 'Legendary Prestige Frame',
      unlocked: profile.prestigeLevel >= 10,
    },
  ];
  
  const handlePrestige = () => {
    performPrestige();
    setShowConfirmDialog(false);
  };
  
  return (
    <div className={className}>
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center"
          animate={{
            boxShadow: [
              '0 0 20px rgba(234, 88, 12, 0.3)',
              '0 0 40px rgba(234, 88, 12, 0.6)',
              '0 0 20px rgba(234, 88, 12, 0.3)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Crown className="w-12 h-12 text-white" />
        </motion.div>
        <h2 className="text-white text-3xl font-bold mb-2">Prestige System</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Reset your mastery levels to gain permanent XP bonuses and exclusive rewards. Only the most dedicated will reach the highest prestige levels.
        </p>
      </div>
      
      {/* Current Status */}
      <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Current Prestige */}
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-2">Current Prestige</div>
            <div className="text-white text-5xl font-bold mb-1">{profile.prestigeLevel}</div>
            <Badge 
              variant="outline" 
              className={
                profile.prestigeLevel >= 10 ? 'text-purple-400 border-purple-400' :
                profile.prestigeLevel >= 5 ? 'text-orange-400 border-orange-400' :
                profile.prestigeLevel >= 3 ? 'text-yellow-400 border-yellow-400' :
                profile.prestigeLevel >= 1 ? 'text-blue-400 border-blue-400' :
                'text-gray-400 border-gray-400'
              }
            >
              {profile.prestigeLevel === 0 ? 'No Prestige' : `Prestige ${profile.prestigeLevel}`}
            </Badge>
          </div>
          
          {/* Current Bonus */}
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-2">XP Bonus</div>
            <div className="text-green-400 text-5xl font-bold mb-1">+{currentBonus}%</div>
            <div className="text-gray-500 text-sm">Permanent bonus applied to all XP</div>
          </div>
          
          {/* Total Prestige Count */}
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-2">Total Prestiges</div>
            <div className="text-white text-5xl font-bold mb-1">{profile.stats.prestigesPerformed}</div>
            <div className="text-gray-500 text-sm">Lifetime prestige count</div>
          </div>
        </div>
      </div>
      
      {/* Progress to Next Prestige */}
      <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6 mb-6">
        <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Progress to Next Prestige
        </h3>
        
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400">Total Mastery Level</span>
            <span className="text-white font-semibold">
              {totalMasteryLevel} / {requiredLevel}
            </span>
          </div>
          <Progress 
            value={Math.min(progressPercent, 100)} 
            className="h-4"
            indicatorClassName={
              prestigeReady 
                ? 'bg-gradient-to-r from-orange-500 to-red-500' 
                : 'bg-gradient-to-r from-blue-500 to-purple-500'
            }
          />
        </div>
        
        {prestigeReady ? (
          <motion.div
            className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4"
            animate={{
              borderColor: ['rgba(249, 115, 22, 0.3)', 'rgba(249, 115, 22, 0.6)', 'rgba(249, 115, 22, 0.3)'],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Sparkles className="w-6 h-6 text-orange-400 mt-1" />
                <div>
                  <div className="text-orange-400 font-semibold mb-1">Prestige Available!</div>
                  <div className="text-gray-300 text-sm mb-3">
                    You've reached the required mastery level. Prestige now to gain:
                  </div>
                  <ul className="space-y-1 text-gray-300 text-sm">
                    <li>• +{bonusIncrease}% permanent XP boost (total: +{nextBonus}%)</li>
                    <li>• Exclusive prestige title</li>
                    <li>• Cosmetic profile frame</li>
                    <li>• Badge of honor</li>
                  </ul>
                </div>
              </div>
              <Button
                className="bg-gradient-to-r from-orange-600 to-red-600"
                onClick={() => setShowConfirmDialog(true)}
              >
                <Crown className="w-4 h-4 mr-2" />
                Prestige Now
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-blue-400 mt-1" />
              <div>
                <div className="text-blue-400 font-semibold mb-1">Keep Grinding!</div>
                <div className="text-gray-300 text-sm">
                  Reach total mastery level {requiredLevel} to unlock prestige. You need {requiredLevel - totalMasteryLevel} more levels.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Prestige Tiers */}
      <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
        <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          Prestige Tiers
        </h3>
        
        <div className="space-y-4">
          {prestigeRewards.map((tier, index) => {
            const isUnlocked = tier.unlocked;
            const isCurrent = profile.prestigeLevel === tier.level - 1 && prestigeReady;
            
            return (
              <motion.div
                key={tier.level}
                className={`border-2 rounded-lg p-4 ${
                  isCurrent 
                    ? 'bg-orange-500/10 border-orange-500/50' 
                    : isUnlocked 
                    ? 'bg-[#252830] border-green-500/30' 
                    : 'bg-gray-800/20 border-gray-800 opacity-60'
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div 
                      className={`w-16 h-16 rounded-lg flex items-center justify-center text-2xl ${
                        isUnlocked 
                          ? 'bg-gradient-to-br from-orange-600 to-red-600' 
                          : 'bg-gray-700'
                      }`}
                    >
                      {isUnlocked ? '👑' : '🔒'}
                    </div>
                    <div className="flex-1">
                      <h4 className={`text-xl font-bold mb-1 ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
                        {tier.name}
                      </h4>
                      <p className={`text-sm mb-3 ${isUnlocked ? 'text-gray-400' : 'text-gray-600'}`}>
                        Permanent +{tier.xpBoost}% XP bonus
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="flex items-center gap-2">
                          <Star className={`w-4 h-4 ${isUnlocked ? 'text-yellow-400' : 'text-gray-600'}`} />
                          <span className={`text-sm ${isUnlocked ? 'text-gray-300' : 'text-gray-600'}`}>
                            +{tier.xpBoost}% XP
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className={`w-4 h-4 ${isUnlocked ? 'text-purple-400' : 'text-gray-600'}`} />
                          <span className={`text-sm ${isUnlocked ? 'text-gray-300' : 'text-gray-600'}`}>
                            {tier.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Sparkles className={`w-4 h-4 ${isUnlocked ? 'text-blue-400' : 'text-gray-600'}`} />
                          <span className={`text-sm ${isUnlocked ? 'text-gray-300' : 'text-gray-600'}`}>
                            {tier.cosmetic}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {isUnlocked ? (
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Unlocked
                    </Badge>
                  ) : isCurrent ? (
                    <Badge variant="outline" className="text-orange-400 border-orange-400">
                      <Flame className="w-3 h-3 mr-1" />
                      Available
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-500 border-gray-600">
                      Locked
                    </Badge>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-[#1e2128] border-gray-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <Crown className="w-8 h-8 text-orange-400" />
              Confirm Prestige
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you absolutely sure? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* Warning */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-red-400 font-semibold mb-1">Warning: Permanent Reset</div>
                  <div className="text-gray-300 text-sm space-y-1">
                    <div>• All mastery levels will be reset to 0</div>
                    <div>• All mastery XP will be cleared</div>
                    <div>• Unlocked perks will be locked again</div>
                    <div>• You'll need to re-earn all mastery levels</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Benefits */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-6 h-6 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-green-400 font-semibold mb-1">You Will Gain</div>
                  <div className="text-gray-300 text-sm space-y-1">
                    <div>• +{bonusIncrease}% permanent XP boost (total: +{nextBonus}%)</div>
                    <div>• Prestige {profile.prestigeLevel + 1} title and badge</div>
                    <div>• Exclusive cosmetic frame</div>
                    <div>• Prestige counter increases</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowConfirmDialog(false)}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-orange-600 to-red-600"
                onClick={handlePrestige}
              >
                <Crown className="w-4 h-4 mr-2" />
                Confirm Prestige
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
