import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Repeat, 
  Play,
  Pause,
  Edit,
  Trash2,
  Plus,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface RecurringTransaction {
  id: string;
  name: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDate: string;
  isActive: boolean;
  emoji: string;
}

const mockRecurring: RecurringTransaction[] = [
  {
    id: '1',
    name: 'Monthly Salary',
    type: 'income',
    amount: 3500,
    category: 'Salary',
    frequency: 'monthly',
    nextDate: 'Nov 1',
    isActive: true,
    emoji: '💰'
  },
  {
    id: '2',
    name: 'Rent Payment',
    type: 'expense',
    amount: 1200,
    category: 'Housing',
    frequency: 'monthly',
    nextDate: 'Oct 15',
    isActive: true,
    emoji: '🏠'
  },
  {
    id: '3',
    name: 'Netflix Subscription',
    type: 'expense',
    amount: 15.99,
    category: 'Entertainment',
    frequency: 'monthly',
    nextDate: 'Oct 20',
    isActive: true,
    emoji: '🎬'
  },
  {
    id: '4',
    name: 'Gym Membership',
    type: 'expense',
    amount: 49.99,
    category: 'Healthcare',
    frequency: 'monthly',
    nextDate: 'Oct 25',
    isActive: true,
    emoji: '💪'
  },
  {
    id: '5',
    name: 'Electricity Bill',
    type: 'expense',
    amount: 85,
    category: 'Utilities',
    frequency: 'monthly',
    nextDate: 'Nov 5',
    isActive: true,
    emoji: '💡'
  },
];

export function RecurringTransactions() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState(mockRecurring);
  
  const activeCount = transactions.filter(t => t.isActive).length;
  const monthlyIncome = transactions.filter(t => t.type === 'income' && t.isActive).reduce((sum, t) => sum + t.amount, 0);
  const monthlyExpenses = transactions.filter(t => t.type === 'expense' && t.isActive).reduce((sum, t) => sum + t.amount, 0);

  const handleToggle = (id: string) => {
    setTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, isActive: !t.isActive } : t
    ));
    const transaction = transactions.find(t => t.id === id);
    toast({
      title: transaction?.isActive ? '⏸️ Paused' : '▶️ Activated',
      description: `${transaction?.name} ${transaction?.isActive ? 'paused' : 'activated'}`,
      duration: 3000,
    });
  };

  const handleEdit = (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    console.log('✏️ Edit recurring:', transaction?.name);
    toast({
      title: '✏️ Edit Transaction',
      description: `Editing ${transaction?.name}`,
      duration: 2000,
    });
  };

  const handleDelete = (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    setTransactions(prev => prev.filter(t => t.id !== id));
    toast({
      title: '🗑️ Deleted',
      description: `${transaction?.name} removed from recurring transactions`,
      duration: 3000,
    });
  };

  const getFrequencyBadge = (frequency: string) => {
    const colors = {
      daily: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-600',
      weekly: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600',
      monthly: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600',
      yearly: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-600',
    };
    return colors[frequency as keyof typeof colors] || colors.monthly;
  };

  return (
    <Card className="border-none shadow-xl">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Repeat className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Recurring Transactions
            </CardTitle>
            <CardDescription className="text-gray-700 dark:text-gray-300 font-medium mt-1">
              Automatic income and expenses
            </CardDescription>
          </div>
          <Button 
            size="sm"
            className="text-white"
            style={{ backgroundImage: 'linear-gradient(to right, rgb(147 51 234), rgb(236 72 153))' }}
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Recurring
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              <div className="text-xs text-green-600 dark:text-green-400 font-medium">Monthly Income</div>
            </div>
            <div className="text-xl font-bold text-green-700 dark:text-green-300">
              ${monthlyIncome.toLocaleString()}
            </div>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
              <div className="text-xs text-red-600 dark:text-red-400 font-medium">Monthly Expenses</div>
            </div>
            <div className="text-xl font-bold text-red-700 dark:text-red-300">
              ${monthlyExpenses.toLocaleString()}
            </div>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex items-center gap-2 mb-1">
              <Repeat className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Active</div>
            </div>
            <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
              {activeCount} / {transactions.length}
            </div>
          </div>
        </div>

        {/* Recurring List */}
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <div 
              key={transaction.id}
              className={`p-4 bg-white dark:bg-slate-800 rounded-lg border-2 transition-all ${
                transaction.isActive 
                  ? 'border-gray-200 dark:border-gray-700 hover:shadow-md' 
                  : 'border-gray-300 dark:border-gray-600 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Emoji */}
                <div className="text-3xl">{transaction.emoji}</div>
                
                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {transaction.name}
                    </h4>
                    <Badge 
                      variant="outline"
                      className={getFrequencyBadge(transaction.frequency)}
                    >
                      {transaction.frequency}
                    </Badge>
                    {!transaction.isActive && (
                      <Badge variant="outline" className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600">
                        Paused
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                    <span className={`font-bold ${
                      transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Next: {transaction.nextDate}
                    </span>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggle(transaction.id)}
                    title={transaction.isActive ? 'Pause' : 'Resume'}
                  >
                    {transaction.isActive ? (
                      <Pause className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    ) : (
                      <Play className="w-4 h-4 text-green-600 dark:text-green-400" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(transaction.id)}
                    title="Edit"
                  >
                    <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(transaction.id)}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

