import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Tag,
  FileText,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface AddTransactionModalProps {
  open: boolean;
  onClose: () => void;
  onAdd?: (transaction: Transaction) => void;
}

interface Transaction {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
}

const incomeCategories = [
  { id: 'salary', name: 'Salary', emoji: '💰' },
  { id: 'freelance', name: 'Freelance', emoji: '💼' },
  { id: 'investment', name: 'Investment', emoji: '📈' },
  { id: 'gift', name: 'Gift', emoji: '🎁' },
  { id: 'other_income', name: 'Other', emoji: '➕' },
];

const expenseCategories = [
  { id: 'housing', name: 'Housing', emoji: '🏠' },
  { id: 'food', name: 'Food & Dining', emoji: '🍔' },
  { id: 'transportation', name: 'Transportation', emoji: '🚗' },
  { id: 'entertainment', name: 'Entertainment', emoji: '🎮' },
  { id: 'utilities', name: 'Utilities', emoji: '💡' },
  { id: 'healthcare', name: 'Healthcare', emoji: '⚕️' },
  { id: 'shopping', name: 'Shopping', emoji: '🛍️' },
  { id: 'education', name: 'Education', emoji: '📚' },
  { id: 'other_expense', name: 'Other', emoji: '➖' },
];

export function AddTransactionModal({ open, onClose, onAdd }: AddTransactionModalProps) {
  const { toast } = useToast();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = type === 'income' ? incomeCategories : expenseCategories;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }
    
    if (!category) {
      newErrors.category = 'Please select a category';
    }
    
    if (!description.trim()) {
      newErrors.description = 'Please enter a description';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: '❌ Validation Error',
        description: 'Please fill in all required fields',
        duration: 3000,
      });
      return;
    }

    const transaction: Transaction = {
      type,
      amount: parseFloat(amount),
      category,
      description,
      date,
    };

    console.log('💰 Transaction added:', transaction);
    
    // Show success toast immediately
    const emoji = type === 'income' ? '💰' : '💸';
    const action = type === 'income' ? 'Income Received' : 'Expense Recorded';
    
    toast({
      title: `${emoji} ${action}!`,
      description: `$${amount} - ${description}`,
      duration: 4000,
    });

    // Call callback if provided
    if (onAdd) {
      onAdd(transaction);
    }

    // Reset form
    setAmount('');
    setCategory('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setErrors({});
    
    // Close modal
    onClose();
    
    // Save to backend in background (don't block UI)
    try {
      await api.post('/financial/transactions', {
        amount: parseFloat(amount),
        description,
        date,
        category,
        type
      });
      console.log('✅ Transaction saved to backend');
    } catch (error) {
      console.error('❌ Failed to save transaction:', error);
      // Toast already shown, no need to show error to user
    }
  };

  const handleTypeSwitch = (newType: 'income' | 'expense') => {
    setType(newType);
    setCategory(''); // Reset category when switching type
    setErrors({}); // Clear errors
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            Add Transaction
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Track your income and expenses to manage your budget effectively
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Transaction Type Toggle */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-3 block">Transaction Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTypeSwitch('income')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  type === 'income'
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-green-200'
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className={`w-5 h-5 ${type === 'income' ? 'text-green-600' : 'text-gray-400'}`} />
                  <ArrowUpRight className={`w-4 h-4 ${type === 'income' ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div className={`text-sm font-semibold ${type === 'income' ? 'text-green-700' : 'text-gray-600'}`}>
                  Income
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => handleTypeSwitch('expense')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  type === 'expense'
                    ? 'border-red-400 bg-red-50'
                    : 'border-gray-200 bg-white hover:border-red-200'
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingDown className={`w-5 h-5 ${type === 'expense' ? 'text-red-600' : 'text-gray-400'}`} />
                  <ArrowDownRight className={`w-4 h-4 ${type === 'expense' ? 'text-red-600' : 'text-gray-400'}`} />
                </div>
                <div className={`text-sm font-semibold ${type === 'expense' ? 'text-red-700' : 'text-gray-600'}`}>
                  Expense
                </div>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={`w-full pl-8 pr-4 py-3 text-lg border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.amount ? 'border-red-400' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.amount && (
              <p className="text-red-600 text-xs mt-1">{errors.amount}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Category
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    category === cat.id
                      ? type === 'income'
                        ? 'border-green-400 bg-green-50'
                        : 'border-red-400 bg-red-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{cat.emoji}</div>
                  <div className="text-xs font-medium text-gray-700">{cat.name}</div>
                </button>
              ))}
            </div>
            {errors.category && (
              <p className="text-red-600 text-xs mt-1">{errors.category}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Description
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Monthly rent, Grocery shopping, Freelance payment"
              className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.description ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.description && (
              <p className="text-red-600 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Summary Preview */}
          {amount && category && description && (
            <div 
              className={`p-4 rounded-lg border-2 ${
                type === 'income' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="text-xs font-semibold text-gray-600 mb-2">Preview</div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {categories.find(c => c.id === category)?.emoji}
                  </span>
                  <div>
                    <div className="font-semibold text-gray-900">{description}</div>
                    <div className="text-xs text-gray-600">{date}</div>
                  </div>
                </div>
                <div className={`text-xl font-bold ${type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {type === 'income' ? '+' : '-'}${parseFloat(amount).toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 text-white"
              style={{ 
                backgroundImage: type === 'income' 
                  ? 'linear-gradient(to right, rgb(34 197 94), rgb(16 185 129))' 
                  : 'linear-gradient(to right, rgb(239 68 68), rgb(249 115 22))' 
              }}
            >
              Add {type === 'income' ? 'Income' : 'Expense'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

