import React, { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, List } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface BudgetChipProps {
  taskId?: string;
  estimatedCents?: number;
  actualCents?: number;
  mode?: 'total' | 'lines';
  isOverBudget?: boolean;
  className?: string;
  onClick?: () => void;
  editMode?: boolean; // Show $0 in edit mode even when budget is 0
  showLineItemsButton?: boolean; // Show button to view line items
  onViewLineItems?: () => void; // Callback when line items button is clicked
}

function BudgetChip({ 
  taskId,
  estimatedCents = 0, 
  actualCents, 
  mode = 'total',
  isOverBudget = false,
  className = '',
  onClick,
  editMode = false,
  showLineItemsButton = false,
  onViewLineItems
}: BudgetChipProps) {
  // Fetch budget data if taskId is provided
  const { data: budgetData } = useQuery({
    queryKey: ['task-budget', taskId],
    queryFn: async () => {
      if (!taskId) return null;
      console.log('🔍 BudgetChip: Fetching budget data for task:', taskId);
      const response = await api.get(`/budget/tasks/${taskId}`);
      console.log('🔍 BudgetChip: Budget data received:', response.data.data);
      console.log('🔍 BudgetChip: Budget totals:', response.data.data?.totals);
      console.log('🔍 BudgetChip: Budget details:', response.data.data?.budget);
      return response.data.data;
    },
    enabled: !!taskId,
    refetchOnWindowFocus: true, // Ensure it refetches when window gains focus
    staleTime: 0, // Always consider data stale to ensure fresh data
  });

  // Extract budget values from the API response structure
  const budgetTotals = budgetData?.totals;
  const budgetDetails = budgetData?.budget;
  
  // Use fetched data if available, otherwise use props
  const finalEstimatedCents = budgetTotals?.estimatedCents ?? budgetDetails?.estimatedCents ?? estimatedCents;
  // Only use actualCents if it's not 0 (0 means no actual cost yet)
  const finalActualCents = (budgetTotals?.actualCents ?? budgetDetails?.actualCents ?? actualCents) || undefined;
  const finalMode = budgetDetails?.mode ?? mode;
  const finalIsOverBudget = budgetTotals?.isOverBudget ?? isOverBudget;
  
  console.log('🔍 BudgetChip: Final values:', {
    finalEstimatedCents,
    finalActualCents,
    finalMode,
    budgetTotals,
    budgetDetails
  });
  
  // For line items mode, calculate the line items total (excluding tax/shipping)
  // For quick total mode, use the estimatedCents directly
  let displayEstimatedCents = finalEstimatedCents;
  let displayActualCents = finalActualCents;
  
  if (finalMode === 'lines' && budgetDetails?.lineItems && budgetDetails.lineItems.length > 0) {
    // Calculate line items total only (without tax/shipping for display)
    const lineItemsTotal = budgetDetails.lineItems.reduce((sum, item) => {
      return sum + (item.qty * item.unitPriceCents);
    }, 0);
    
    // Auto-calculate actual cost from line items (only if there are actual line items)
    if (lineItemsTotal > 0) {
      displayActualCents = lineItemsTotal;
    }
    
    // If there's a manually set estimated total, use that; otherwise use line items total
    if (budgetDetails.estimatedCents && budgetDetails.estimatedCents > 0) {
      displayEstimatedCents = budgetDetails.estimatedCents;
    } else {
      displayEstimatedCents = lineItemsTotal;
    }
  }



  // Don't render if budget is 0 or undefined, unless in edit mode or budget exists
  // Show the chip if we have budget data (even if it's 0) or if we're in edit mode
  // Also show if we have line items with a total > 0
  const hasBudgetData = budgetData !== null && budgetData !== undefined;
  const hasLineItemsWithTotal = finalMode === 'lines' && budgetDetails?.lineItems && budgetDetails.lineItems.length > 0 && displayEstimatedCents > 0;
  
  if (!editMode && !hasBudgetData && displayEstimatedCents === 0 && (displayActualCents === undefined || displayActualCents === 0) && !hasLineItemsWithTotal) {
    return null;
  }
  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(0)}`;
  };

  const getStatusIcon = () => {
    if (finalIsOverBudget) {
      return <AlertTriangle className="h-3 w-3" />;
    }
    
    // Don't show DollarSign icon for $0 budget - the text already has a $
    if (displayEstimatedCents === 0 && (displayActualCents === undefined || displayActualCents === 0)) {
      return null;
    }
    
    if (displayActualCents !== undefined) {
      if (displayActualCents > displayEstimatedCents) {
        return <TrendingUp className="h-3 w-3" />;
      } else if (displayActualCents < displayEstimatedCents) {
        return <TrendingDown className="h-3 w-3" />;
      } else {
        return <CheckCircle className="h-3 w-3" />;
      }
    }
    
    // Don't show DollarSign icon - the text already includes a $ symbol
    return null;
  };

  const getStatusColor = () => {
    if (finalIsOverBudget) {
      return 'bg-red-100 text-red-800 hover:bg-red-200';
    }
    
    if (displayActualCents !== undefined) {
      if (displayActualCents > displayEstimatedCents) {
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      } else if (displayActualCents < displayEstimatedCents) {
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      } else {
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      }
    }
    
    return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  };

  const getDisplayText = () => {
    if (displayActualCents !== undefined) {
      return formatCurrency(displayActualCents);
    }
    // Show estimated amount with ≈ symbol
    return `≈${formatCurrency(displayEstimatedCents)}`;
  };

  const getTooltipText = () => {
    if (displayActualCents !== undefined) {
      const variance = displayActualCents - displayEstimatedCents;
      const varianceText = variance > 0 ? `+${formatCurrency(variance)}` : formatCurrency(variance);
      const budgetType = finalMode === 'lines' ? 'Line Items Total' : 'Quick Total';
      return `${budgetType}: ${formatCurrency(displayEstimatedCents)} | Actual: ${formatCurrency(displayActualCents)} | Variance: ${varianceText}`;
    }
    const budgetType = finalMode === 'lines' ? 'Line Items Total' : 'Quick Total';
    return `${budgetType} (Estimated): ${formatCurrency(displayEstimatedCents)}`;
  };

  // If showLineItemsButton is true and we have line items, show both badge and button
  if (showLineItemsButton && finalMode === 'lines' && budgetDetails?.lineItems && budgetDetails.lineItems.length > 0) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Badge 
          variant="secondary" 
          className={`flex items-center gap-1 px-2 py-1 text-xs font-medium cursor-pointer transition-colors ${getStatusColor()}`}
          onClick={onClick}
          title={getTooltipText()}
        >
          {getStatusIcon()}
          <span>{getDisplayText()}</span>
        </Badge>
        <Button
          size="sm"
          variant="outline"
          className="h-6 px-2 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onViewLineItems?.();
          }}
          title="View line items"
        >
          <List className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <Badge 
      variant="secondary" 
      className={`flex items-center gap-1 px-2 py-1 text-xs font-medium cursor-pointer transition-colors ${getStatusColor()} ${className}`}
      onClick={onClick}
      title={getTooltipText()}
    >
      {getStatusIcon()}
      <span>{getDisplayText()}</span>
    </Badge>
  );
}

export default BudgetChip;