import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, Flame, Target, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly';
  progress: number;
  target: number;
  reward: {
    points: number;
    emblem?: {
      name: string;
      emoji: string;
      rarity: 'common' | 'rare' | 'epic' | 'legendary';
    };
  };
  difficulty: 'easy' | 'medium' | 'hard';
  expiresAt: Date;
  completed: boolean;
  icon?: string;
}

interface DailyChallengeCardProps {
  challenge: Challenge;
  onClaim?: (challengeId: string) => void;
}

export function DailyChallengeCard({ challenge, onClaim }: DailyChallengeCardProps) {
  const progressPercent = (challenge.progress / challenge.target) * 100;
  const timeRemaining = getTimeRemaining(challenge.expiresAt);
  
  const difficultyColors = {
    easy: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    hard: 'bg-red-100 text-red-800 border-red-200',
  };

  const rarityColors = {
    common: 'from-gray-400 to-gray-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-orange-400 via-orange-500 to-red-500',
  };

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        !challenge.completed && "hover:shadow-lg hover:scale-[1.02]"
      )}
      style={challenge.completed ? {
        backgroundImage: 'linear-gradient(to bottom right, rgb(134 239 172), rgb(167 243 208))',
      } : undefined}
    >
      {/* Completion overlay */}
      {challenge.completed && (
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 pointer-events-none" />
      )}

      <CardHeader className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">{challenge.icon || '🎯'}</span>
              <Badge className={difficultyColors[challenge.difficulty]}>
                {challenge.difficulty}
              </Badge>
              {challenge.completed && (
                <Badge className="bg-green-500 text-white">
                  <Check className="w-3 h-3 mr-1" />
                  Completed
                </Badge>
              )}
            </div>
            <CardTitle className="text-xl mb-1">{challenge.title}</CardTitle>
            <CardDescription className="text-sm">
              {challenge.description}
            </CardDescription>
          </div>
          
          {/* Time remaining */}
          {!challenge.completed && (
            <div className="flex flex-col items-end gap-1 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span className="font-medium">{timeRemaining}</span>
              </div>
              <span className="text-xs text-gray-500">{challenge.type}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-semibold">
              {challenge.progress} / {challenge.target}
            </span>
          </div>
          <div className="relative">
            <Progress value={progressPercent} className="h-3" />
            {/* Animated gradient overlay */}
            {!challenge.completed && progressPercent > 0 && (
              <div 
                className="absolute inset-0 h-3 rounded-full overflow-hidden"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse" />
              </div>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {progressPercent.toFixed(0)}% complete
          </div>
        </div>

        {/* Rewards */}
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg p-4 border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-amber-600" />
            <span className="font-semibold text-amber-900">Rewards</span>
          </div>
          
          <div className="space-y-2">
            {/* Points reward */}
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm">
                <span className="font-bold text-orange-600">{challenge.reward.points}</span> points
              </span>
            </div>

            {/* Emblem reward */}
            {challenge.reward.emblem && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">{challenge.reward.emblem.emoji}</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{challenge.reward.emblem.name}</div>
                  <Badge 
                    className={cn(
                      "text-xs bg-gradient-to-r text-white",
                      rarityColors[challenge.reward.emblem.rarity]
                    )}
                  >
                    {challenge.reward.emblem.rarity}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Claim button - MAXIMUM VISIBILITY */}
        {challenge.completed && onClaim && (
          <button
            onClick={() => onClaim(challenge.id)}
            className="w-full py-4 rounded-xl transition-all duration-200 relative"
            style={{ 
              backgroundImage: 'linear-gradient(to right, rgb(249 115 22), rgb(236 72 153))',
              border: '6px solid white',
              boxShadow: '0 0 0 3px rgb(15 23 42), 0 10px 30px rgba(249, 115, 22, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4)',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1.125rem',
              zIndex: 10
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundImage = 'linear-gradient(to right, rgb(234 88 12), rgb(219 39 119))';
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgb(15 23 42), 0 15px 40px rgba(249, 115, 22, 0.8), 0 8px 20px rgba(0, 0, 0, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundImage = 'linear-gradient(to right, rgb(249 115 22), rgb(236 72 153))';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgb(15 23 42), 0 10px 30px rgba(249, 115, 22, 0.6), 0 4px 12px rgba(0, 0, 0, 0.4)';
            }}
          >
            🎉 Claim Rewards
          </button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Calculate time remaining in human-readable format
 */
function getTimeRemaining(expiresAt: Date): string {
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  
  if (diff <= 0) return 'Expired';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  
  return `${minutes}m`;
}

