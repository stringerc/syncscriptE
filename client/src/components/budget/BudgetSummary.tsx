import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, List, Calculator, TrendingUp, TrendingDown, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface BudgetSummaryProps {
  taskId: string;
}

export function BudgetSummary({ taskId }: BudgetSummaryProps) {
  const [showLineItems, setShowLineItems] = useState(false);
  
  const { data: budgetData, isLoading } = useQuery({
    queryKey: ['task-budget', taskId],
    queryFn: async () => {
      console.log('🔍 BudgetSummary: Fetching budget data for task:', taskId);
      const response = await api.get(`/budget/tasks/${taskId}`);
      console.log('🔍 BudgetSummary: Budget data received:', response.data.data);
      return response.data.data;
    },
    enabled: !!taskId,
    refetchOnWindowFocus: true, // Ensure it refetches when window gains focus
    staleTime: 0, // Always consider data stale to ensure fresh data
  });

  if (isLoading) {
    return (
      <div className="mt-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
          <div className="h-16 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const budgetTotals = budgetData?.totals;
  const budgetDetails = budgetData?.budget;

  // Don't show if no budget data exists at all
  // Show the summary if we have budget data, even if it's 0
  if (!budgetData || !budgetTotals) {
    return null;
  }

  // Calculate actual cost from line items when in 'lines' mode
  let displayActualCents = budgetTotals.actualCents;
  let displayEstimatedCents = budgetTotals.estimatedCents;
  
  if (budgetDetails?.mode === 'lines' && budgetDetails?.lineItems && budgetDetails.lineItems.length > 0) {
    // Calculate line items total (this becomes the actual cost)
    const lineItemsTotal = budgetDetails.lineItems.reduce((sum, item) => {
      return sum + (item.qty * item.unitPriceCents);
    }, 0);
    displayActualCents = lineItemsTotal;
    
    // If there's a manually set estimated total, use that; otherwise use line items total
    if (budgetDetails.estimatedCents && budgetDetails.estimatedCents > 0) {
      displayEstimatedCents = budgetDetails.estimatedCents;
    } else {
      displayEstimatedCents = lineItemsTotal;
    }
  }

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(0)}`;
  };

  const getStatusIcon = () => {
    if (displayActualCents !== undefined) {
      if (displayActualCents > displayEstimatedCents) {
        return <TrendingUp className="h-4 w-4 text-orange-600" />;
      } else if (displayActualCents < displayEstimatedCents) {
        return <TrendingDown className="h-4 w-4 text-green-600" />;
      } else {
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      }
    }
    return <DollarSign className="h-4 w-4 text-gray-600" />;
  };

  const getStatusColor = () => {
    if (displayActualCents !== undefined) {
      if (displayActualCents > displayEstimatedCents) {
        return 'bg-orange-50 border-orange-200';
      } else if (displayActualCents < displayEstimatedCents) {
        return 'bg-green-50 border-green-200';
      } else {
        return 'bg-blue-50 border-blue-200';
      }
    }
    return 'bg-gray-50 border-gray-200';
  };

  return (
    <div className="mt-4">
      <Card className={getStatusColor()}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            {budgetDetails?.mode === 'lines' ? (
              <>
                <List className="h-4 w-4" />
                Line Items Budget
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4" />
                Quick Total Budget
              </>
            )}
            <Badge variant="secondary" className="ml-auto">
              {budgetDetails?.mode === 'lines' ? 'Line Items' : 'Quick Total'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Estimated:</span>
              <span className="font-semibold">{formatCurrency(displayEstimatedCents)}</span>
            </div>
            
            {displayActualCents !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Actual:</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon()}
                  <span className="font-semibold">{formatCurrency(displayActualCents)}</span>
                </div>
              </div>
            )}
            
            {displayActualCents !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Variance:</span>
                <span className={`font-semibold ${
                  (displayActualCents - displayEstimatedCents) > 0 ? 'text-orange-600' : 
                  (displayActualCents - displayEstimatedCents) < 0 ? 'text-green-600' : 
                  'text-blue-600'
                }`}>
                  {(displayActualCents - displayEstimatedCents) > 0 ? '+' : ''}{formatCurrency(displayActualCents - displayEstimatedCents)}
                </span>
              </div>
            )}
            
            {budgetDetails?.mode === 'lines' && budgetTotals.lineItemsCount > 0 && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Line Items:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{budgetTotals.lineItemsCount} items</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowLineItems(!showLineItems)}
                      className="h-6 w-6 p-0"
                    >
                      {showLineItems ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
                {showLineItems && (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {budgetDetails?.lineItems?.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between text-xs bg-white/50 rounded px-2 py-1">
                        <div className="flex-1 min-w-0">
                          <span className="font-medium truncate">{item.name}</span>
                          {item.qty > 1 && (
                            <span className="text-muted-foreground ml-1">×{item.qty}</span>
                          )}
                        </div>
                        <span className="font-medium ml-2">
                          ${((item.unitPriceCents * item.qty) / 100).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
