import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle, 
  Target,
  Plus,
  RefreshCw
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';

interface BudgetOverviewProps {
  onCreateBudget?: () => void;
}

export function BudgetOverview({ onCreateBudget }: BudgetOverviewProps) {
  const queryClient = useQueryClient();
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);

  // Fetch budgets
  const { data: budgetsData, isLoading: budgetsLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const response = await api.get('/budgeting/budgets');
      return response.data.data.budgets;
    }
  });

  // Fetch active budget status
  const activeBudget = budgetsData?.find((b: any) => b.isActive);
  
  const { data: budgetStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['budget-status', activeBudget?.id],
    queryFn: async () => {
      if (!activeBudget) return null;
      const response = await api.get(`/budgeting/budgets/${activeBudget.id}`);
      return response.data.data;
    },
    enabled: !!activeBudget
  });

  // Sync transactions
  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/budgeting/transactions/sync', {});
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget-status'] });
    }
  });

  if (budgetsLoading || statusLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!budgetsData || budgetsData.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4 py-12">
            <DollarSign className="w-16 h-16 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No Budget Yet</h3>
              <p className="text-muted-foreground mt-1">
                Create your first budget to start tracking your spending
              </p>
            </div>
            <Button onClick={onCreateBudget}>
              <Plus className="w-4 h-4 mr-2" />
              Create Budget
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const status = budgetStatus || {};
  const percentageUsed = status.percentageUsed || 0;
  const isOverBudget = percentageUsed > 100;
  const isWarning = percentageUsed >= 75 && percentageUsed < 100;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Income</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(status.totalIncome || 0)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              This period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Budget</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(status.totalBudgeted || 0)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Target className="w-3 h-3 mr-1" />
              Planned spending
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Spent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isOverBudget ? 'text-red-600' : 'text-blue-600'}`}>
              {formatCurrency(status.totalSpent || 0)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <DollarSign className="w-3 h-3 mr-1" />
              {percentageUsed.toFixed(0)}% of budget
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Remaining</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(status.remainingBudget || 0)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {status.daysRemaining !== undefined && (
                <>{status.daysRemaining} days left</>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Budget Progress</CardTitle>
              <CardDescription>
                {activeBudget?.name} - {activeBudget?.period}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              Sync
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {formatCurrency(status.totalSpent || 0)} / {formatCurrency(status.totalBudgeted || 0)}
              </span>
              <Badge variant={isOverBudget ? 'destructive' : isWarning ? 'secondary' : 'default'}>
                {percentageUsed.toFixed(0)}%
              </Badge>
            </div>
            <Progress 
              value={Math.min(percentageUsed, 100)} 
              className={`h-3 ${isOverBudget ? 'bg-red-100' : isWarning ? 'bg-yellow-100' : 'bg-green-100'}`}
            />
          </div>

          {/* Projection Alert */}
          {status.projectedEndOfPeriod && (
            <div className={`p-3 rounded-lg ${
              status.projectedEndOfPeriod > status.totalBudgeted 
                ? 'bg-red-50 border border-red-200' 
                : 'bg-green-50 border border-green-200'
            }`}>
              <div className="flex items-start gap-2">
                {status.projectedEndOfPeriod > status.totalBudgeted ? (
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                ) : (
                  <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    status.projectedEndOfPeriod > status.totalBudgeted ? 'text-red-900' : 'text-green-900'
                  }`}>
                    {status.projectedEndOfPeriod > status.totalBudgeted ? 'Over Budget Projection' : 'On Track'}
                  </p>
                  <p className={`text-xs mt-1 ${
                    status.projectedEndOfPeriod > status.totalBudgeted ? 'text-red-700' : 'text-green-700'
                  }`}>
                    At your current pace, you'll spend {formatCurrency(status.projectedEndOfPeriod)} by end of period
                    {status.projectedEndOfPeriod > status.totalBudgeted && 
                      ` (${formatCurrency(status.projectedEndOfPeriod - status.totalBudgeted)} over budget)`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>Spending by category this period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {status.categories?.map((category: any) => {
              const isOver = category.percentageUsed >= 100;
              const isWarning = category.percentageUsed >= 75 && category.percentageUsed < 100;
              
              return (
                <div key={category.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{category.name}</span>
                      <Badge 
                        variant={isOver ? 'destructive' : isWarning ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {category.percentageUsed.toFixed(0)}%
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(category.spent)} / {formatCurrency(category.budgeted)}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(category.percentageUsed, 100)}
                    className={`h-2 ${isOver ? '[&>div]:bg-red-500' : isWarning ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'}`}
                  />
                  {category.remaining < 0 && (
                    <p className="text-xs text-red-600">
                      Over by {formatCurrency(Math.abs(category.remaining))}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

