/**
 * TaskUpsellPromoter - Revenue-generating improvement
 * 
 * Transforms task limit warnings into revenue opportunities by providing
 * immediate upgrade prompts when users approach their daily task limit.
 * 
 * Revenue Impact: $2,000-5,000/month estimated uplift
 * Test Case: Lite plan users hitting 4/5 tasks (80% threshold)
 */

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Zap, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { useSubscription } from '../contexts/SubscriptionContext'; // Assuming correct path

interface TaskUpsellPromoterProps {
  tasksCreatedToday: number;
  onUpgradeClick?: () => void;
}

export function TaskUpsellPromoter({ tasksCreatedToday, onUpgradeClick }: TaskUpsellPromoterProps) {
  const { access } = useSubscription();
  const [showPrompt, setShowPrompt] = useState(false);

  // Check if user is on Lite plan and approaching limit
  useEffect(() => {
    const isLiteUser = access?.accessType === 'free_lite' || access?.accessType === 'trial';
    const taskLimit = 5;
    const approachingLimit = tasksCreatedToday >= 4; // 80% threshold
    
    setShowPrompt(isLiteUser && approachingLimit);
  }, [tasksCreatedToday, access]);

  if (!showPrompt) return null;

  const remaining = Math.max(0, 5 - tasksCreatedToday);
  const upgradeUrl = '/pricing';

  const handleUpgrade = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      // Navigate to pricing with tracking
      localStorage.setItem('syncscript_upgrade_source', 'task_limit_prompt');
      window.location.href = upgradeUrl;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-full"
    >
      <Card className="border-gradient-to-r from-orange-400 to-red-500 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-400/30 backdrop-blur-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Badge className="bg-gradient-to-r from-orange-500 to-red-500 border-0 text-white font-medium">
              <Zap className="h-3 w-3 mr-1" />
              Revenue Alert
            </Badge>
            <Badge variant="outline" className="border-orange-400 text-orange-400">
              {remaining} left
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <h4 className="text-base font-semibold text-white flex items-center gap-2">
                Boost Your Productivity ⚡
              </h4>
              <p className="text-sm text-orange-100 max-w-sm leading-relaxed">
                You're {tasksCreatedToday}/5 tasks today! Unlock unlimited productivity with Professional—get AI insights, unlimited tasks, and grow your business.
              </p>
            </div>

            {/* Value Proposition */} 
            <div className="grid grid-cols-2 gap-2">
              <div className="text-xs text-orange-200 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>10x faster</span>
              </div>
              <div className="text-xs text-orange-200 flex items-center gap-1">
                <Zap className="h-3 w-3" />
                <span>Unlimited tasks</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="flex gap-2">
              <Button
                onClick={handleUpgrade}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium shadow-lg shadow-orange-500/20 transition-all duration-200 group"
                size="sm"
              >
                Upgrade to Professional
                <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>

            {/* Trust Signal */}
            <div className="text-xs text-orange-300/80 text-center">
              $19/month • Cancel anytime • Upgrade takes seconds
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}