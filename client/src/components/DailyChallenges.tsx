import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, Target, Zap, Trophy, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import EnergyEmblem from './EnergyEmblem';

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  domain: string;
  type: 'core' | 'stretch';
  target: string;
  epReward: number;
  isCompleted: boolean;
  completedAt?: string;
  date: string;
  metadata?: string;
}

interface EnergyStatus {
  currentEnergy: number;
  energyLevel: number;
  todayEP: number;
  dailyEPCap: number;
  remainingEP: number;
  activeEmblem: string;
  lastConversion?: string;
}

const DailyChallenges: React.FC = () => {
  const [completedChallenges, setCompletedChallenges] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Fetch daily challenges
  const { data: challenges, isLoading: challengesLoading } = useQuery<DailyChallenge[]>({
    queryKey: ['daily-challenges'],
    queryFn: async () => {
      const response = await api.get('/energy-engine/challenges');
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch energy status
  const { data: energyStatus } = useQuery<EnergyStatus>({
    queryKey: ['energy-status'],
    queryFn: async () => {
      const response = await api.get('/energy-engine/status');
      return response.data.data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  // Complete challenge mutation
  const completeChallengeMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      const response = await api.post(`/energy-engine/challenges/${challengeId}/complete`);
      return response.data;
    },
    onSuccess: (data, challengeId) => {
      setCompletedChallenges(prev => new Set([...prev, challengeId]));
      toast({
        title: "Challenge Completed! 🎉",
        description: `You earned ${data.data.epAwarded} EP!`,
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['daily-challenges'] });
      queryClient.invalidateQueries({ queryKey: ['energy-status'] });
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to complete challenge",
        variant: "destructive"
      });
    }
  });

  // Domain configurations
  const domainConfig = {
    body: { name: 'Body', color: 'bg-red-100 text-red-800', icon: '💪' },
    mind: { name: 'Mind', color: 'bg-blue-100 text-blue-800', icon: '🧠' },
    social: { name: 'Social', color: 'bg-green-100 text-green-800', icon: '👥' },
    order: { name: 'Order', color: 'bg-purple-100 text-purple-800', icon: '📋' },
    finance: { name: 'Finance', color: 'bg-yellow-100 text-yellow-800', icon: '💰' },
    outdoors: { name: 'Outdoors', color: 'bg-emerald-100 text-emerald-800', icon: '🌳' },
    rest: { name: 'Rest', color: 'bg-indigo-100 text-indigo-800', icon: '😴' }
  };

  const handleCompleteChallenge = (challengeId: string) => {
    completeChallengeMutation.mutate(challengeId);
  };

  if (challengesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Daily Challenges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const coreChallenges = challenges?.filter(c => c.type === 'core') || [];
  const stretchChallenges = challenges?.filter(c => c.type === 'stretch') || [];
  const completedCount = challenges?.filter(c => c.isCompleted).length || 0;
  const totalCount = challenges?.length || 0;

  return (
    <div className="space-y-6">
      {/* Energy Status Header */}
      {energyStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <EnergyEmblem
                  energyLevel={energyStatus.currentEnergy}
                  emblemType={energyStatus.activeEmblem as any}
                  size="md"
                />
                <div>
                  <h3 className="text-lg font-semibold">Energy Status</h3>
                  <p className="text-sm text-gray-600">
                    {energyStatus.currentEnergy}/100 Energy • {energyStatus.todayEP}/{energyStatus.dailyEPCap} EP today
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-yellow-600">
                  {energyStatus.todayEP}
                </div>
                <div className="text-xs text-gray-500">EP Today</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Daily Progress</span>
                <span>{energyStatus.todayEP}/{energyStatus.dailyEPCap}</span>
              </div>
              <Progress 
                value={(energyStatus.todayEP / energyStatus.dailyEPCap) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Challenges Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Daily Challenges
            <Badge variant="secondary" className="ml-auto">
              {completedCount}/{totalCount} completed
            </Badge>
          </CardTitle>
          <CardDescription>
            Complete challenges to earn Energy Points and boost your energy level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Core Challenges */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Star className="h-4 w-4" />
                Core Challenges (3)
              </h4>
              <div className="space-y-3">
                <AnimatePresence>
                  {coreChallenges.map((challenge) => (
                    <motion.div
                      key={challenge.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChallengeCard
                        challenge={challenge}
                        domainConfig={domainConfig}
                        onComplete={handleCompleteChallenge}
                        isCompleting={completeChallengeMutation.isPending}
                        isCompleted={challenge.isCompleted || completedChallenges.has(challenge.id)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Stretch Challenge */}
            {stretchChallenges.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Stretch Challenge (1)
                </h4>
                <div className="space-y-3">
                  <AnimatePresence>
                    {stretchChallenges.map((challenge) => (
                      <motion.div
                        key={challenge.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChallengeCard
                          challenge={challenge}
                          domainConfig={domainConfig}
                          onComplete={handleCompleteChallenge}
                          isCompleting={completeChallengeMutation.isPending}
                          isCompleted={challenge.isCompleted || completedChallenges.has(challenge.id)}
                          isStretch={true}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface ChallengeCardProps {
  challenge: DailyChallenge;
  domainConfig: any;
  onComplete: (challengeId: string) => void;
  isCompleting: boolean;
  isCompleted: boolean;
  isStretch?: boolean;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  domainConfig,
  onComplete,
  isCompleting,
  isCompleted,
  isStretch = false
}) => {
  const domain = domainConfig[challenge.domain] || { name: challenge.domain, color: 'bg-gray-100 text-gray-800', icon: '📋' };

  return (
    <Card className={`transition-all duration-200 ${isCompleted ? 'opacity-75' : 'hover:shadow-md'} ${isStretch ? 'border-2 border-yellow-200' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={domain.color}>
                {domain.icon} {domain.name}
              </Badge>
              {isStretch && (
                <Badge variant="outline" className="border-yellow-300 text-yellow-700">
                  Stretch
                </Badge>
              )}
              <div className="flex items-center gap-1 text-yellow-600">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-medium">{challenge.epReward} EP</span>
              </div>
            </div>
            
            <h4 className="font-medium text-black mb-1">{challenge.title}</h4>
            <p className="text-sm text-gray-600 mb-2">{challenge.description}</p>
            
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Target className="h-3 w-3" />
              <span>{challenge.target}</span>
            </div>
          </div>
          
          <div className="ml-4">
            {isCompleted ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Completed</span>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => onComplete(challenge.id)}
                disabled={isCompleting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isCompleting ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : (
                  'Complete'
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyChallenges;
