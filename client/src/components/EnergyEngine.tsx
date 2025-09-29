import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Battery, 
  Zap, 
  Heart, 
  Sparkles, 
  Waves, 
  TrendingUp, 
  Target, 
  Clock, 
  Award,
  Flame,
  Star,
  CheckCircle,
  Plus,
  Minus
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import EnergyEmblem from './EnergyEmblem';

interface EnergyStatus {
  currentEnergy: number;
  energyLevel: number;
  todayEP: number;
  dailyEPCap: number;
  remainingEP: number;
  activeEmblem: 'bolt' | 'heart' | 'comet' | 'wave';
  lastConversion?: string;
}

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  domain: string;
  difficulty: 'core' | 'stretch';
  epReward: number;
  isCompleted: boolean;
  completedAt?: string;
}

interface EnergyConversion {
  id: string;
  epAmount: number;
  energyGained: number;
  conversionRate: number;
  date: string;
}

const EnergyEngine: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch energy status
  const { data: energyStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['energy-status'],
    queryFn: async () => {
      const response = await api.get('/energy-engine/status');
      return response.data.data as EnergyStatus;
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  // Fetch daily challenges
  const { data: dailyChallenges, isLoading: challengesLoading } = useQuery({
    queryKey: ['energy-challenges'],
    queryFn: async () => {
      const response = await api.get('/energy-engine/challenges');
      return response.data.data as DailyChallenge[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Complete challenge mutation
  const completeChallengeMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      const response = await api.post(`/energy-engine/challenges/${challengeId}/complete`);
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Challenge Completed!",
        description: `You earned ${data.data.epEarned} Energy Points!`,
      });
      queryClient.invalidateQueries({ queryKey: ['energy-status'] });
      queryClient.invalidateQueries({ queryKey: ['energy-challenges'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to complete challenge",
        variant: "destructive",
      });
    },
  });

  // Convert EP to Energy mutation
  const convertEPMutation = useMutation({
    mutationFn: async (epAmount: number) => {
      const response = await api.post('/energy-engine/convert', { epAmount });
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Energy Converted!",
        description: `Converted ${data.data.epAmount} EP to ${data.data.energyGained} Energy!`,
      });
      queryClient.invalidateQueries({ queryKey: ['energy-status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Conversion Failed",
        description: error.response?.data?.error || "Failed to convert EP",
        variant: "destructive",
      });
    },
  });

  const getEnergyColor = (energy: number) => {
    if (energy >= 80) return 'text-green-600';
    if (energy >= 60) return 'text-blue-600';
    if (energy >= 40) return 'text-yellow-600';
    if (energy >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  const getEnergyLabel = (energy: number) => {
    if (energy >= 80) return 'Surge';
    if (energy >= 60) return 'High';
    if (energy >= 40) return 'Optimal';
    if (energy >= 20) return 'Low';
    return 'Critical';
  };

  const getDomainIcon = (domain: string) => {
    switch (domain.toLowerCase()) {
      case 'body': return <Heart className="w-4 h-4" />;
      case 'mind': return <Target className="w-4 h-4" />;
      case 'social': return <Star className="w-4 h-4" />;
      case 'order': return <CheckCircle className="w-4 h-4" />;
      case 'finance': return <TrendingUp className="w-4 h-4" />;
      case 'outdoors': return <Sparkles className="w-4 h-4" />;
      case 'rest': return <Clock className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const getDomainColor = (domain: string) => {
    switch (domain.toLowerCase()) {
      case 'body': return 'bg-red-100 text-red-800';
      case 'mind': return 'bg-blue-100 text-blue-800';
      case 'social': return 'bg-purple-100 text-purple-800';
      case 'order': return 'bg-green-100 text-green-800';
      case 'finance': return 'bg-yellow-100 text-yellow-800';
      case 'outdoors': return 'bg-emerald-100 text-emerald-800';
      case 'rest': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (statusLoading || challengesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Energy Engine...</p>
        </div>
      </div>
    );
  }

  if (!energyStatus) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Failed to load energy data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="challenges">Daily Challenges</TabsTrigger>
          <TabsTrigger value="emblem">Energy Emblem</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Energy Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Battery className="h-5 w-5" />
                Current Energy Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Energy Level */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <EnergyEmblem
                    energyLevel={energyStatus.currentEnergy}
                    emblemType={energyStatus.activeEmblem}
                    size="lg"
                    showAnimation={true}
                  />
                </div>
                <div className="space-y-2">
                  <h3 className={`text-3xl font-bold ${getEnergyColor(energyStatus.currentEnergy)}`}>
                    {energyStatus.currentEnergy}/100
                  </h3>
                  <Badge variant="outline" className={getEnergyColor(energyStatus.currentEnergy)}>
                    {getEnergyLabel(energyStatus.currentEnergy)}
                  </Badge>
                </div>
                <Progress 
                  value={energyStatus.currentEnergy} 
                  className="mt-4 h-3"
                />
              </div>

              {/* EP Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {energyStatus.todayEP}
                  </div>
                  <div className="text-sm text-blue-600">Today's EP</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {energyStatus.todayEP}/{energyStatus.dailyEPCap}
                  </div>
                  <div className="text-sm text-green-600">Daily EP</div>
                </div>
              </div>

              {/* Convert EP Button */}
              {energyStatus.todayEP >= 10 && (
                <div className="text-center">
                  <Button
                    onClick={() => convertEPMutation.mutate(10)}
                    disabled={convertEPMutation.isPending}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    {convertEPMutation.isPending ? 'Converting...' : 'Convert 10 EP to Energy'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-600" />
                  <div>
                    <div className="text-lg font-semibold capitalize">{energyStatus.activeEmblem}</div>
                    <div className="text-sm text-gray-600">Active Emblem</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-lg font-semibold">{energyStatus.remainingEP}</div>
                    <div className="text-sm text-gray-600">EP Remaining</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="text-lg font-semibold">
                      {dailyChallenges?.filter(c => c.isCompleted).length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Challenges Today</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Daily Challenges Tab */}
        <TabsContent value="challenges" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Today's Challenges
              </CardTitle>
              <CardDescription>
                Complete challenges to earn Energy Points and boost your energy level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dailyChallenges?.map((challenge) => (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg border ${
                      challenge.isCompleted 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            variant="outline" 
                            className={getDomainColor(challenge.domain)}
                          >
                            {getDomainIcon(challenge.domain)}
                            <span className="ml-1 capitalize">{challenge.domain}</span>
                          </Badge>
                          <Badge 
                            variant={challenge.difficulty === 'stretch' ? 'default' : 'secondary'}
                          >
                            {challenge.difficulty}
                          </Badge>
                          <Badge variant="outline" className="text-blue-600">
                            +{challenge.epReward} EP
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-lg mb-1 text-black">{challenge.title}</h4>
                        <p className="text-gray-600 text-sm">{challenge.description}</p>
                        {challenge.isCompleted && challenge.completedAt && (
                          <p className="text-green-600 text-xs mt-2">
                            Completed at {new Date(challenge.completedAt).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                      <div className="ml-4">
                        {challenge.isCompleted ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="w-6 h-6" />
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => completeChallengeMutation.mutate(challenge.id)}
                            disabled={completeChallengeMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Energy Emblem Tab */}
        <TabsContent value="emblem" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Energy Emblem
              </CardTitle>
              <CardDescription>
                Your current emblem reflects your energy level and unlocks new effects
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Emblem */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <EnergyEmblem
                    energyLevel={energyStatus.currentEnergy}
                    emblemType={energyStatus.activeEmblem}
                    size="lg"
                    showAnimation={true}
                  />
                </div>
                <h3 className="text-xl font-semibold capitalize mb-2">
                  {energyStatus.activeEmblem} Emblem
                </h3>
                <p className="text-gray-600 mb-4">
                  {getEnergyLabel(energyStatus.currentEnergy)} Energy
                </p>
              </div>

              {/* Emblem Types */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(['bolt', 'heart', 'comet', 'wave'] as const).map((type) => (
                  <div
                    key={type}
                    className={`p-4 rounded-lg border text-center ${
                      type === energyStatus.activeEmblem
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <EnergyEmblem
                      energyLevel={energyStatus.currentEnergy}
                      emblemType={type}
                      size="md"
                      showAnimation={false}
                    />
                    <div className="mt-2 text-sm font-medium capitalize">{type}</div>
                    {type === energyStatus.activeEmblem && (
                      <Badge variant="default" className="mt-1">Active</Badge>
                    )}
                  </div>
                ))}
              </div>

              {/* EP Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Daily EP Progress</span>
                  <span>{energyStatus.todayEP} / {energyStatus.dailyEPCap} EP</span>
                </div>
                <Progress 
                  value={(energyStatus.todayEP / energyStatus.dailyEPCap) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-gray-600">
                  {energyStatus.remainingEP} EP remaining today
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Energy History
              </CardTitle>
              <CardDescription>
                Track your energy levels and EP earnings over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <p className="text-gray-600">Energy history coming soon!</p>
                <p className="text-sm text-gray-500">Track your progress over time</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnergyEngine;
