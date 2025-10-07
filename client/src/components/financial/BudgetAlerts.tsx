import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, TrendingUp, DollarSign, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';

interface BudgetAlert {
  id: string;
  type: 'warning' | 'critical' | 'success' | 'info';
  category: string;
  message: string;
  percentage: number;
  amount: number;
  limit: number;
  suggestion?: string;
}

const mockAlerts: BudgetAlert[] = [
  {
    id: '1',
    type: 'critical',
    category: 'Housing',
    message: 'Exceeded monthly budget',
    percentage: 105,
    amount: 1260,
    limit: 1200,
    suggestion: 'Review rent and utilities to reduce costs next month'
  },
  {
    id: '2',
    type: 'warning',
    category: 'Food',
    message: 'Approaching budget limit',
    percentage: 92,
    amount: 368,
    limit: 400,
    suggestion: 'You have $32 remaining for this category this month'
  },
  {
    id: '3',
    type: 'success',
    category: 'Transportation',
    message: 'Well under budget',
    percentage: 45,
    amount: 112,
    limit: 250,
    suggestion: 'Great job! You have $138 remaining'
  },
  {
    id: '4',
    type: 'info',
    category: 'Entertainment',
    message: 'On track',
    percentage: 68,
    amount: 102,
    limit: 150,
    suggestion: '$48 remaining - perfect balance'
  },
];

export function BudgetAlerts() {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'info':
        return <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      default:
        return <DollarSign className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-700',
          badge: 'bg-red-600 dark:bg-red-700',
          text: 'text-red-900 dark:text-red-100'
        };
      case 'warning':
        return {
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          border: 'border-orange-200 dark:border-orange-700',
          badge: 'bg-orange-600 dark:bg-orange-700',
          text: 'text-orange-900 dark:text-orange-100'
        };
      case 'success':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-700',
          badge: 'bg-green-600 dark:bg-green-700',
          text: 'text-green-900 dark:text-green-100'
        };
      case 'info':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-700',
          badge: 'bg-blue-600 dark:bg-blue-700',
          text: 'text-blue-900 dark:text-blue-100'
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-800',
          border: 'border-gray-200 dark:border-gray-700',
          badge: 'bg-gray-600',
          text: 'text-gray-900 dark:text-gray-100'
        };
    }
  };

  const criticalCount = mockAlerts.filter(a => a.type === 'critical').length;
  const warningCount = mockAlerts.filter(a => a.type === 'warning').length;

  return (
    <Card className="border-none shadow-xl">
      <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              Budget Alerts
            </CardTitle>
            <CardDescription className="text-gray-700 dark:text-gray-300 font-medium mt-1">
              Monitor your spending and stay on track
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <Badge className="bg-red-600 text-white">
                {criticalCount} Critical
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge className="bg-orange-600 text-white">
                {warningCount} Warning
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {mockAlerts.map((alert) => {
          const colors = getAlertColor(alert.type);
          return (
            <div 
              key={alert.id}
              className={`p-4 rounded-lg border-2 ${colors.bg} ${colors.border} transition-all hover:shadow-md`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getAlertIcon(alert.type)}
                </div>
                
                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h4 className={`font-semibold ${colors.text} text-sm mb-1`}>
                        {alert.category}: {alert.message}
                      </h4>
                      <p className="text-xs text-gray-700 dark:text-gray-300">
                        ${alert.amount.toLocaleString()} of ${alert.limit.toLocaleString()} used
                      </p>
                    </div>
                    <Badge className={`${colors.badge} text-white font-bold text-xs`}>
                      {alert.percentage}%
                    </Badge>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min(alert.percentage, 100)}%`,
                          backgroundImage: alert.type === 'critical' 
                            ? 'linear-gradient(to right, rgb(220 38 38), rgb(239 68 68))'
                            : alert.type === 'warning'
                            ? 'linear-gradient(to right, rgb(234 88 12), rgb(249 115 22))'
                            : alert.type === 'success'
                            ? 'linear-gradient(to right, rgb(22 163 74), rgb(34 197 94))'
                            : 'linear-gradient(to right, rgb(37 99 235), rgb(59 130 246))'
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Suggestion */}
                  {alert.suggestion && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                      💡 {alert.suggestion}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Summary */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {mockAlerts.length} categories monitored
            </span>
            <Button 
              size="sm"
              variant="outline"
              className="text-xs"
            >
              <Calendar className="w-3 h-3 mr-1" />
              View Budget History
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

