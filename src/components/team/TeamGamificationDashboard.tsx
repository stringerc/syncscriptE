/**
 * TeamGamificationDashboard Component (Phase 6E)
 * 
 * Comprehensive gamification dashboard showing achievements, challenges,
 * leaderboards, and team rewards.
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Target,
  Users,
  Zap,
  TrendingUp,
  Award,
  Star,
  Flame,
  Gift,
  Crown,
  Medal,
  Sparkles,
  CheckCircle2,
  Clock,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';
import { Team } from '../../types/team';
import {
  TeamAchievement,
  TeamChallenge,
  TeamLeaderboardEntry,
  TeamStats,
  TEAM_ACHIEVEMENTS,
  CHALLENGE_TEMPLATES,
  calculateTeamLevel,
  getTierColor,
  getRarityColor,
  getDifficultyColor,
} from '../../utils/team-gamification';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { Separator } from '../ui/separator';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { cn } from '../ui/utils';

interface TeamGamificationDashboardProps {
  team: Team;
  className?: string;
}

export function TeamGamificationDashboard({ team, className }: TeamGamificationDashboardProps) {
  // Mock team stats (would come from backend)
  const teamStats: TeamStats = useMemo(() => {
    const xp = team.energyStats.totalEnergyEarned;
    const levelInfo = calculateTeamLevel(xp);
    
    return {
      totalPoints: team.energyStats.totalEnergyEarned + 2500,
      level: levelInfo.level,
      experiencePoints: xp,
      nextLevelXP: levelInfo.nextLevelXP,
      achievementsUnlocked: 8,
      totalAchievements: TEAM_ACHIEVEMENTS.length,
      achievementPoints: 2500,
      challengesActive: 2,
      challengesCompleted: 12,
      challengeSuccessRate: 75,
      streaks: {
        daily: {
          type: 'daily',
          current: 12,
          longest: 18,
          lastUpdate: new Date(),
          active: true,
        },
        weekly: {
          type: 'weekly',
          current: 4,
          longest: 6,
          lastUpdate: new Date(),
          active: true,
        },
        event: {
          type: 'event',
          current: 8,
          longest: 15,
          lastUpdate: new Date(),
          active: true,
        },
        resonance: {
          type: 'resonance',
          current: 5,
          longest: 10,
          lastUpdate: new Date(),
          active: true,
        },
      },
      globalRank: 3,
      categoryRanks: {
        energy: 2,
        collaboration: 5,
        resonance: 1,
        consistency: 4,
      },
      badgesEarned: 15,
      trophiesEarned: 5,
      activeBadges: [],
    };
  }, [team]);

  // Mock achievements with progress
  const achievements: TeamAchievement[] = useMemo(() => {
    return TEAM_ACHIEVEMENTS.map((template, idx) => {
      const isUnlocked = idx < 8; // Mock: first 8 unlocked
      const progress = isUnlocked ? 100 : Math.random() * 80;
      
      return {
        ...template,
        requirement: {
          type: 'energy',
          target: 1000,
          current: isUnlocked ? 1000 : Math.floor(progress * 10),
        },
        unlocked: isUnlocked,
        unlockedAt: isUnlocked ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : undefined,
        unlockedBy: isUnlocked ? ['user-1', 'user-2'] : undefined,
        progress,
      };
    });
  }, []);

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const inProgressAchievements = achievements.filter(a => !a.unlocked && a.progress > 0);

  // Mock active challenges
  const challenges: TeamChallenge[] = useMemo(() => {
    return CHALLENGE_TEMPLATES.slice(0, 2).map((template, idx) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 2);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 5);
      
      return {
        ...template,
        id: `challenge-${idx}`,
        current: Math.floor(template.goal * (0.4 + Math.random() * 0.3)),
        startDate,
        endDate,
        status: 'active' as const,
        participatingMembers: team.members.slice(0, 5).map(m => m.userId),
      };
    });
  }, [team]);

  const levelInfo = calculateTeamLevel(teamStats.experiencePoints);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with Level */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                Team Level {teamStats.level}
              </h2>
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                {teamStats.totalPoints.toLocaleString()} Total Points
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 max-w-xs">
              <Progress value={levelInfo.progress} className="h-2" />
            </div>
            <span className="text-xs text-gray-400">
              {Math.floor(levelInfo.progress)}% to Level {teamStats.level + 1}
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-gray-400 mb-1">Global Rank</div>
          <div className="text-3xl font-bold text-white flex items-center gap-2">
            #{teamStats.globalRank}
            <TrendingUp className="w-6 h-6 text-green-400" />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickStatCard
          icon={Trophy}
          label="Achievements"
          value={`${teamStats.achievementsUnlocked}/${teamStats.totalAchievements}`}
          color="text-amber-400"
        />
        <QuickStatCard
          icon={Target}
          label="Challenges"
          value={`${teamStats.challengesActive} Active`}
          color="text-blue-400"
          subtitle={`${teamStats.challengesCompleted} completed`}
        />
        <QuickStatCard
          icon={Flame}
          label="Streak"
          value={`${teamStats.streaks.daily.current} Days`}
          color="text-red-400"
          subtitle={`Longest: ${teamStats.streaks.daily.longest}`}
        />
        <QuickStatCard
          icon={Medal}
          label="Badges"
          value={teamStats.badgesEarned.toString()}
          color="text-purple-400"
          subtitle={`${teamStats.trophiesEarned} trophies`}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="achievements" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-[#1e2128] border border-gray-800">
          <TabsTrigger value="achievements">
            Achievements
            {inProgressAchievements.length > 0 && (
              <Badge className="ml-2 bg-blue-500 text-white text-xs">{inProgressAchievements.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="challenges">
            Challenges
            {teamStats.challengesActive > 0 && (
              <Badge className="ml-2 bg-amber-500 text-white text-xs">{teamStats.challengesActive}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
        </TabsList>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4 mt-6">
          <AchievementsList achievements={achievements} />
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="space-y-4 mt-6">
          <ChallengesList challenges={challenges} team={team} />
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-4 mt-6">
          <LeaderboardView currentTeam={team} />
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-4 mt-6">
          <RewardsView teamStats={teamStats} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Quick Stat Card
function QuickStatCard({
  icon: Icon,
  label,
  value,
  color,
  subtitle,
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
  subtitle?: string;
}) {
  return (
    <Card className="bg-[#1e2128] border-gray-800 p-4">
      <div className="flex items-center justify-between mb-2">
        <Icon className={cn('w-5 h-5', color)} />
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </Card>
  );
}

// Achievements List
function AchievementsList({ achievements }: { achievements: TeamAchievement[] }) {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'in-progress'>('all');

  const filteredAchievements = useMemo(() => {
    switch (filter) {
      case 'unlocked':
        return achievements.filter(a => a.unlocked);
      case 'in-progress':
        return achievements.filter(a => !a.unlocked && a.progress > 0);
      default:
        return achievements;
    }
  }, [achievements, filter]);

  return (
    <div className="space-y-4">
      {/* Filter Buttons */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({achievements.length})
        </Button>
        <Button
          variant={filter === 'unlocked' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('unlocked')}
        >
          Unlocked ({achievements.filter(a => a.unlocked).length})
        </Button>
        <Button
          variant={filter === 'in-progress' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('in-progress')}
        >
          In Progress ({achievements.filter(a => !a.unlocked && a.progress > 0).length})
        </Button>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAchievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>

      {filteredAchievements.length === 0 && (
        <Card className="bg-[#1e2128] border-gray-800 p-8 text-center">
          <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No achievements found</p>
        </Card>
      )}
    </div>
  );
}

function AchievementCard({ achievement }: { achievement: TeamAchievement }) {
  const tierColor = getTierColor(achievement.tier);
  const rarityColor = getRarityColor(achievement.rarity);

  return (
    <Card
      className={cn(
        'bg-[#1e2128] border-gray-800 p-4 transition-all',
        achievement.unlocked && 'ring-2 ring-offset-2 ring-offset-[#13161d]',
        !achievement.unlocked && 'opacity-60'
      )}
      style={achievement.unlocked ? { ringColor: tierColor } : {}}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ backgroundColor: `${tierColor}20` }}
        >
          {achievement.unlocked ? achievement.icon : '🔒'}
        </div>

        <div className="flex-1">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold text-white">{achievement.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  className="text-xs"
                  style={{
                    backgroundColor: `${tierColor}20`,
                    color: tierColor,
                    borderColor: `${tierColor}40`,
                  }}
                >
                  {achievement.tier}
                </Badge>
                <Badge
                  className="text-xs"
                  style={{
                    backgroundColor: `${rarityColor}20`,
                    color: rarityColor,
                    borderColor: `${rarityColor}40`,
                  }}
                >
                  {achievement.rarity}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold" style={{ color: tierColor }}>
                {achievement.points}
              </div>
              <div className="text-xs text-gray-500">points</div>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-400 mb-3">{achievement.description}</p>

          {/* Progress */}
          {!achievement.unlocked && (
            <div>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>Progress</span>
                <span>{achievement.progress.toFixed(0)}%</span>
              </div>
              <Progress value={achievement.progress} className="h-2" />
            </div>
          )}

          {/* Unlocked Info */}
          {achievement.unlocked && achievement.unlockedAt && (
            <div className="flex items-center gap-2 text-xs text-green-400">
              <CheckCircle2 className="w-3 h-3" />
              <span>Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}</span>
            </div>
          )}

          {/* Rewards */}
          {achievement.unlocked && achievement.rewards.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-800">
              <p className="text-xs text-gray-400 mb-2">Rewards:</p>
              <div className="space-y-1">
                {achievement.rewards.map((reward, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                    <Gift className="w-3 h-3 text-green-400" />
                    <span>{reward.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// Challenges List
function ChallengesList({ challenges, team }: { challenges: TeamChallenge[]; team: Team }) {
  if (challenges.length === 0) {
    return (
      <Card className="bg-[#1e2128] border-gray-800 p-8 text-center">
        <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No Active Challenges</h3>
        <p className="text-gray-400 mb-4">New challenges will appear here</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {challenges.map((challenge) => (
        <ChallengeCard key={challenge.id} challenge={challenge} team={team} />
      ))}
    </div>
  );
}

function ChallengeCard({ challenge, team }: { challenge: TeamChallenge; team: Team }) {
  const progress = (challenge.current / challenge.goal) * 100;
  const difficultyColor = getDifficultyColor(challenge.difficulty);
  const timeRemaining = Math.ceil((challenge.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const participationRate = (challenge.participatingMembers.length / team.memberCount) * 100;

  return (
    <Card className="bg-[#1e2128] border-gray-800 p-6">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
          {challenge.icon}
        </div>

        <div className="flex-1">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">{challenge.name}</h3>
              <div className="flex items-center gap-2">
                <Badge
                  className="text-xs"
                  style={{
                    backgroundColor: `${difficultyColor}20`,
                    color: difficultyColor,
                    borderColor: `${difficultyColor}40`,
                  }}
                >
                  {challenge.difficulty}
                </Badge>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                  {challenge.points} points
                </Badge>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                <span>{timeRemaining} days left</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-400 mb-4">{challenge.description}</p>

          {/* Progress */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-400">Challenge Progress</span>
                <span className="text-white font-semibold">
                  {challenge.current.toLocaleString()} / {challenge.goal.toLocaleString()}
                </span>
              </div>
              <Progress value={progress} className="h-3" />
              <p className="text-xs text-gray-500 mt-1">{progress.toFixed(0)}% complete</p>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-400">Team Participation</span>
                <span className="text-white font-semibold">
                  {challenge.participatingMembers.length} / {team.memberCount} members
                </span>
              </div>
              <Progress value={participationRate} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">
                {challenge.requiredParticipation}% required
              </p>
            </div>
          </div>

          {/* Rewards */}
          <div className="mt-4 pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-400 mb-2">Rewards:</p>
            <div className="flex flex-wrap gap-2">
              {challenge.rewards.map((reward, idx) => (
                <Badge key={idx} variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                  <Gift className="w-3 h-3 mr-1" />
                  {reward.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Leaderboard View
function LeaderboardView({ currentTeam }: { currentTeam: Team }) {
  // Mock leaderboard data
  const leaderboard: TeamLeaderboardEntry[] = [
    {
      rank: 1,
      teamId: 'team-x',
      teamName: 'Innovation Squad',
      teamColor: '#3b82f6',
      totalPoints: 45800,
      weeklyPoints: 3200,
      monthlyPoints: 12500,
      memberCount: 12,
      averageResonance: 87,
      totalEnergy: 38500,
      achievementsUnlocked: 15,
      challengesCompleted: 28,
      rankChange: 2,
      trend: 'rising',
      badges: [],
    },
    {
      rank: 2,
      teamId: 'team-y',
      teamName: 'Harmony Makers',
      teamColor: '#8b5cf6',
      totalPoints: 42300,
      weeklyPoints: 2800,
      monthlyPoints: 11200,
      memberCount: 10,
      averageResonance: 92,
      totalEnergy: 35000,
      achievementsUnlocked: 14,
      challengesCompleted: 25,
      rankChange: -1,
      trend: 'falling',
      badges: [],
    },
    {
      rank: 3,
      teamId: currentTeam.id,
      teamName: currentTeam.name,
      teamColor: currentTeam.color,
      totalPoints: 38900,
      weeklyPoints: 3500,
      monthlyPoints: 13800,
      memberCount: currentTeam.memberCount,
      averageResonance: 85,
      totalEnergy: currentTeam.energyStats.totalEnergyEarned,
      achievementsUnlocked: 12,
      challengesCompleted: 22,
      rankChange: 1,
      trend: 'rising',
      badges: [],
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="bg-[#1e2128] border-gray-800 p-4">
        <h3 className="font-semibold text-white mb-4">Global Rankings</h3>
        <div className="space-y-2">
          {leaderboard.map((entry) => (
            <LeaderboardEntry
              key={entry.teamId}
              entry={entry}
              isCurrentTeam={entry.teamId === currentTeam.id}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

function LeaderboardEntry({
  entry,
  isCurrentTeam,
}: {
  entry: TeamLeaderboardEntry;
  isCurrentTeam: boolean;
}) {
  const getTrendIcon = () => {
    if (entry.rankChange > 0) return <ArrowUp className="w-4 h-4 text-green-400" />;
    if (entry.rankChange < 0) return <ArrowDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getRankColor = () => {
    if (entry.rank === 1) return 'text-amber-400';
    if (entry.rank === 2) return 'text-gray-400';
    if (entry.rank === 3) return 'text-orange-600';
    return 'text-gray-500';
  };

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-lg transition-colors',
        isCurrentTeam ? 'bg-blue-500/20 border-2 border-blue-500/50' : 'bg-gray-900/50'
      )}
    >
      {/* Rank */}
      <div className={cn('w-12 text-center', getRankColor())}>
        {entry.rank <= 3 ? (
          <Trophy className="w-8 h-8 mx-auto" />
        ) : (
          <div className="text-2xl font-bold">#{entry.rank}</div>
        )}
      </div>

      {/* Team Info */}
      <div className="flex items-center gap-3 flex-1">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${entry.teamColor}20` }}
        >
          <Users className="w-5 h-5" style={{ color: entry.teamColor }} />
        </div>
        <div>
          <div className="font-semibold text-white flex items-center gap-2">
            {entry.teamName}
            {isCurrentTeam && (
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">You</Badge>
            )}
          </div>
          <div className="text-xs text-gray-500">{entry.memberCount} members</div>
        </div>
      </div>

      {/* Stats */}
      <div className="hidden md:flex items-center gap-6 text-sm">
        <div className="text-center">
          <div className="text-white font-semibold">{entry.totalPoints.toLocaleString()}</div>
          <div className="text-xs text-gray-500">Points</div>
        </div>
        <div className="text-center">
          <div className="text-white font-semibold">{entry.averageResonance}</div>
          <div className="text-xs text-gray-500">Resonance</div>
        </div>
        <div className="text-center">
          <div className="text-white font-semibold">{entry.achievementsUnlocked}</div>
          <div className="text-xs text-gray-500">Achievements</div>
        </div>
      </div>

      {/* Trend */}
      <div className="flex items-center gap-1">
        {getTrendIcon()}
        {entry.rankChange !== 0 && (
          <span className="text-xs text-gray-400">{Math.abs(entry.rankChange)}</span>
        )}
      </div>
    </div>
  );
}

// Rewards View
function RewardsView({ teamStats }: { teamStats: TeamStats }) {
  return (
    <div className="space-y-4">
      {/* Streaks */}
      <Card className="bg-[#1e2128] border-gray-800 p-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Flame className="w-5 h-5 text-red-400" />
          Team Streaks
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StreakCard
            label="Daily Activity"
            current={teamStats.streaks.daily.current}
            longest={teamStats.streaks.daily.longest}
            active={teamStats.streaks.daily.active}
          />
          <StreakCard
            label="Weekly Goals"
            current={teamStats.streaks.weekly.current}
            longest={teamStats.streaks.weekly.longest}
            active={teamStats.streaks.weekly.active}
          />
          <StreakCard
            label="Event Completion"
            current={teamStats.streaks.event.current}
            longest={teamStats.streaks.event.longest}
            active={teamStats.streaks.event.active}
          />
          <StreakCard
            label="Resonance Harmony"
            current={teamStats.streaks.resonance.current}
            longest={teamStats.streaks.resonance.longest}
            active={teamStats.streaks.resonance.active}
          />
        </div>
      </Card>

      {/* Category Rankings */}
      <Card className="bg-[#1e2128] border-gray-800 p-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Medal className="w-5 h-5 text-purple-400" />
          Category Rankings
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <CategoryRankCard label="Energy" rank={teamStats.categoryRanks.energy} />
          <CategoryRankCard label="Collaboration" rank={teamStats.categoryRanks.collaboration} />
          <CategoryRankCard label="Resonance" rank={teamStats.categoryRanks.resonance} />
          <CategoryRankCard label="Consistency" rank={teamStats.categoryRanks.consistency} />
        </div>
      </Card>

      {/* Collection Summary */}
      <Card className="bg-[#1e2128] border-gray-800 p-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          Your Collection
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-900/50 rounded-lg">
            <div className="text-3xl font-bold text-white mb-1">{teamStats.badgesEarned}</div>
            <div className="text-xs text-gray-400">Badges Earned</div>
          </div>
          <div className="text-center p-4 bg-gray-900/50 rounded-lg">
            <div className="text-3xl font-bold text-white mb-1">{teamStats.trophiesEarned}</div>
            <div className="text-xs text-gray-400">Trophies Won</div>
          </div>
          <div className="text-center p-4 bg-gray-900/50 rounded-lg">
            <div className="text-3xl font-bold text-white mb-1">{teamStats.achievementsUnlocked}</div>
            <div className="text-xs text-gray-400">Achievements</div>
          </div>
          <div className="text-center p-4 bg-gray-900/50 rounded-lg">
            <div className="text-3xl font-bold text-white mb-1">{teamStats.challengesCompleted}</div>
            <div className="text-xs text-gray-400">Challenges Done</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function StreakCard({
  label,
  current,
  longest,
  active,
}: {
  label: string;
  current: number;
  longest: number;
  active: boolean;
}) {
  return (
    <div className="p-4 bg-gray-900/50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <Flame className={cn('w-5 h-5', active ? 'text-red-400' : 'text-gray-600')} />
        {active && <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Active</Badge>}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{current}</div>
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-xs text-gray-500">Best: {longest}</div>
    </div>
  );
}

function CategoryRankCard({ label, rank }: { label: string; rank: number }) {
  const getRankColor = () => {
    if (rank === 1) return 'text-amber-400';
    if (rank <= 3) return 'text-blue-400';
    if (rank <= 10) return 'text-green-400';
    return 'text-gray-400';
  };

  return (
    <div className="p-4 bg-gray-900/50 rounded-lg text-center">
      <div className={cn('text-3xl font-bold mb-1', getRankColor())}>#{rank}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}
