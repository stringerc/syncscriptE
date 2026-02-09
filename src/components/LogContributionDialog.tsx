import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { DollarSign, TrendingUp, Calendar, Plus } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { motion } from 'motion/react';

interface Transaction {
  id: string;
  amount: number;
  note: string;
  date: string;
  createdAt: string;
}

interface LogContributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalTitle: string;
  currentAmount: number;
  targetAmount: number;
  onAddContribution: (amount: number, note: string, date: string) => void;
}

export function LogContributionDialog({ 
  open, 
  onOpenChange, 
  goalTitle,
  currentAmount,
  targetAmount,
  onAddContribution
}: LogContributionDialogProps) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const quickAmounts = [10, 25, 50, 100, 500, 1000];

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    onAddContribution(numAmount, note.trim(), date);
    
    const newTotal = currentAmount + numAmount;
    const percentOfGoal = ((newTotal / targetAmount) * 100).toFixed(1);
    
    toast.success('Contribution logged!', { 
      description: `$${numAmount.toFixed(2)} added • You're now ${percentOfGoal}% of your goal` 
    });

    // Reset form
    setAmount('');
    setNote('');
    setDate(new Date().toISOString().split('T')[0]);
    onOpenChange(false);
  };

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
  };

  const newTotal = currentAmount + (parseFloat(amount) || 0);
  const currentPercent = (currentAmount / targetAmount) * 100;
  const newPercent = (newTotal / targetAmount) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1e2128] border-gray-700 text-white max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            Log Contribution
          </DialogTitle>
          <p className="text-sm text-gray-400 mt-1">{goalTitle}</p>
        </DialogHeader>

        <div className="space-y-6 mt-4 overflow-y-auto pr-2">
          {/* Current Progress Overview */}
          <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Current Progress</span>
              <span className="text-sm text-green-400">{currentPercent.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl text-white">${currentAmount.toLocaleString()}</span>
              <span className="text-sm text-gray-400">of ${targetAmount.toLocaleString()}</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                initial={{ width: `${currentPercent}%` }}
                animate={{ width: `${currentPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <Label htmlFor="amount" className="text-sm text-gray-300 mb-2 block">
              Contribution Amount
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-[#252830] border-gray-700 text-white pl-10 placeholder:text-gray-600"
              />
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div>
            <Label className="text-sm text-gray-400 mb-2 block">Quick Amounts</Label>
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(quickAmount)}
                  className={`border-gray-700 hover:bg-green-500/10 hover:border-green-500 hover:text-green-400 ${
                    amount === quickAmount.toString() ? 'border-green-500 bg-green-500/10 text-green-400' : 'text-gray-400'
                  }`}
                >
                  ${quickAmount}
                </Button>
              ))}
            </div>
          </div>

          {/* Date Input */}
          <div>
            <Label htmlFor="date" className="text-sm text-gray-300 mb-2 block">
              Date
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-[#252830] border-gray-700 text-white pl-10"
              />
            </div>
          </div>

          {/* Note Input */}
          <div>
            <Label htmlFor="note" className="text-sm text-gray-300 mb-2 block">
              Note (optional)
            </Label>
            <Textarea
              id="note"
              placeholder="e.g., Paycheck savings, Birthday gift, Bonus..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="bg-[#252830] border-gray-700 text-white placeholder:text-gray-600 resize-none"
            />
          </div>

          {/* Preview New Total */}
          {amount && parseFloat(amount) > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400 font-medium">Preview</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">New Total</p>
                  <p className="text-xl text-white">${newTotal.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Progress</p>
                  <p className="text-xl text-green-400">{newPercent.toFixed(1)}%</p>
                </div>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden mt-3">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                  initial={{ width: `${currentPercent}%` }}
                  animate={{ width: `${Math.min(newPercent, 100)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700 shrink-0">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="border-gray-700 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!amount || parseFloat(amount) <= 0}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Contribution
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}