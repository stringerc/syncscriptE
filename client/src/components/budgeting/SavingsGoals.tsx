import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Target, Plus, TrendingUp, Calendar, DollarSign, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function SavingsGoals() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: '',
    description: '',
    targetAmount: 0,
    currentAmount: 0,
    targetDate: '',
    monthlyContribution: 0,
    icon: '🎯'
  });

  // Fetch savings goals
  const { data: goalsData, isLoading } = useQuery({
    queryKey: ['savings-goals'],
    queryFn: async () => {
      const response = await api.get('/budgeting/savings-goals');
      return response.data.data.goals;
    }
  });

  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/budgeting/savings-goals', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings-goals'] });
      setIsCreateDialogOpen(false);
      setNewGoal({
        name: '',
        description: '',
        targetAmount: 0,
        currentAmount: 0,
        targetDate: '',
        monthlyContribution: 0,
        icon: '🎯'
      });
      toast({
        title: 'Goal Created!',
        description: 'Your savings goal has been created successfully'
      });
    }
  });

  // Contribute to goal mutation
  const contributeMutation = useMutation({
    mutationFn: async ({ goalId, amount }: any) => {
      const response = await api.post(`/budgeting/savings-goals/${goalId}/contribute`, {
        amount
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['savings-goals'] });
      if (data.message === 'Goal achieved!') {
        toast({
          title: '🎉 Goal Achieved!',
          description: 'Congratulations on reaching your savings goal!'
        });
      } else {
        toast({
          title: 'Contribution Added',
          description: 'Your contribution has been recorded'
        });
      }
    }
  });

  const goals = goalsData || [];
  const activeGoals = goals.filter((g: any) => !g.isCompleted);
  const completedGoals = goals.filter((g: any) => g.isCompleted);

  const handleCreateGoal = () => {
    createGoalMutation.mutate(newGoal);
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getMonthsRemaining = (targetDate: string) => {
    const target = new Date(targetDate);
    const now = new Date();
    const months = (target.getFullYear() - now.getFullYear()) * 12 + 
                   (target.getMonth() - now.getMonth());
    return Math.max(0, months);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Savings Goals</h2>
          <p className="text-muted-foreground">Track your progress toward financial goals</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Savings Goal</DialogTitle>
              <DialogDescription>Set a target amount and track your progress</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Goal Name</Label>
                <Input
                  placeholder="e.g., Emergency Fund, Hawaii Vacation"
                  value={newGoal.name}
                  onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Description (optional)</Label>
                <Input
                  placeholder="What is this goal for?"
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Target Amount</Label>
                  <Input
                    type="number"
                    placeholder="5000"
                    value={newGoal.targetAmount || ''}
                    onChange={(e) => setNewGoal({ ...newGoal, targetAmount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Current Amount</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newGoal.currentAmount || ''}
                    onChange={(e) => setNewGoal({ ...newGoal, currentAmount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Target Date (optional)</Label>
                  <Input
                    type="date"
                    value={newGoal.targetDate}
                    onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Monthly Contribution</Label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={newGoal.monthlyContribution || ''}
                    onChange={(e) => setNewGoal({ ...newGoal, monthlyContribution: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <Button
                onClick={handleCreateGoal}
                disabled={!newGoal.name || newGoal.targetAmount <= 0 || createGoalMutation.isPending}
                className="w-full"
              >
                {createGoalMutation.isPending ? 'Creating...' : 'Create Goal'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Active Goals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGoals.map((goal: any) => {
              const progress = getProgressPercentage(goal.currentAmount, goal.targetAmount);
              const remaining = goal.targetAmount - goal.currentAmount;
              const monthsRemaining = goal.targetDate ? getMonthsRemaining(goal.targetDate) : null;
              
              return (
                <Card key={goal.id} className="relative overflow-hidden">
                  <div className="absolute top-0 right-0 text-6xl opacity-10 p-4">
                    {goal.icon || '🎯'}
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{goal.name}</CardTitle>
                        {goal.description && (
                          <CardDescription className="text-xs mt-1">
                            {goal.description}
                          </CardDescription>
                        )}
                      </div>
                      {goal.priority && (
                        <Badge variant={goal.priority === 'HIGH' ? 'destructive' : 'secondary'} className="text-xs">
                          {goal.priority}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {formatCurrency(goal.currentAmount)}
                        </span>
                        <span className="text-muted-foreground">
                          {formatCurrency(goal.targetAmount)}
                        </span>
                      </div>
                      <Progress 
                        value={progress}
                        className="h-3 bg-gray-200 [&>div]:bg-gradient-to-r [&>div]:from-green-500 [&>div]:to-emerald-600"
                      />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{progress.toFixed(0)}% complete</span>
                        <span>{formatCurrency(remaining)} remaining</span>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {goal.monthlyContribution > 0 && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <TrendingUp className="w-3 h-3" />
                          <span>{formatCurrency(goal.monthlyContribution)}/mo</span>
                        </div>
                      )}
                      {monthsRemaining !== null && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{monthsRemaining} months left</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Contribute */}
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Amount"
                        className="h-8 text-sm"
                        id={`contribute-${goal.id}`}
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          const input = document.getElementById(`contribute-${goal.id}`) as HTMLInputElement;
                          const amount = parseFloat(input.value);
                          if (amount > 0) {
                            contributeMutation.mutate({ goalId: goal.id, amount });
                            input.value = '';
                          }
                        }}
                        disabled={contributeMutation.isPending}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-green-600 flex items-center gap-2">
            <Check className="w-5 h-5" />
            Completed Goals ({completedGoals.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {completedGoals.map((goal: any) => (
              <Card key={goal.id} className="bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <div className="text-3xl">{goal.icon || '🎯'}</div>
                    <div className="font-semibold">{goal.name}</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(goal.targetAmount)}
                    </div>
                    <Badge variant="default" className="bg-green-600">
                      <Check className="w-3 h-3 mr-1" />
                      Achieved
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {goals.length === 0 && !isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 space-y-4">
              <Target className="w-16 h-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">No Savings Goals Yet</h3>
                <p className="text-muted-foreground mt-1">
                  Create your first savings goal to start tracking progress
                </p>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Goal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

