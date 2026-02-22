import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StripeCheckout } from '@/components/billing/StripeCheckout';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { useRevenueAnalytics } from '@/hooks/useRevenueAnalytics';

interface TaskLimitUpgraderProps {
  userId: string;
  currentPlan: 'lite' | 'pro' | 'enterprise';
}

interface MetricsSnapshot {
  tasksCompleted: number;
  dailyTaskLimit: number;
  usagePercent: number;
}

export function TaskLimitUpgrader({ userId, currentPlan }: TaskLimitUpgraderProps) {
  const { tasks } = useTasks();
  const { user } = useAuth();
  const { trackRevenueEvent } = useRevenueAnalytics();
  
  const [metrics, setMetrics] = useState<MetricsSnapshot>({
    tasksCompleted: 0,
    dailyTaskLimit: 5,
    usagePercent: 0
  });

  const [isOpen, setIsOpen] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [hasTracked, setHasTracked] = useState(false);

  // Calculate current usage from today's completed tasks
  useEffect(() => {
    if (!tasks.length) return;

    const today = new Date().toDateString();
    const todaysTasks = tasks.filter(
      task => task.completedAt && new Date(task.completedAt).toDateString() === today
    );

    const dailyLimit = currentPlan === 'lite' ? 5 : currentPlan === 'pro' ? 25 : Infinity;
    const usagePct = (todaysTasks.length / dailyLimit) * 100;

    setMetrics({
      tasksCompleted: todaysTasks.length,
      dailyTaskLimit: dailyLimit,
      usagePercent: Math.min(100, Math.round(usagePct))
    });

    // Show upgrade prompt at 80% usage
    if (usagePct >= 80 && currentPlan !== 'enterprise') {
      if (!hasTracked && currentPlan === 'lite') {
        trackRevenueEvent('task_limit_upgrade_prompt_shown', { 
          userId, 
          currentPlan, 
          usageCount: todaysTasks.length 
        });
        setHasTracked(true);
      }
      setIsOpen(true);
    }
  }, [tasks, currentPlan, userId, hasTracked, trackRevenueEvent]);

  const handleUpgrade = () => {
    trackRevenueEvent('task_limit_upgrade_clicked', { 
      userId, 
      currentPlan, 
      metrics 
    });
    setShowCheckout(true);
  };

  const upgradeValueProps = {
    lite: {
      title: "Unlock Unlimited Tasks",
      subtitle: "You're crushing it with {completed}/{limit} tasks today!",
      cta: "Get Pro Unlimited",
      price: "$19/month",
      benefits: [
        "Unlimited daily tasks",
        "Advanced AI insights",
        "Priority task scheduling",
        "Team collaboration"
      ]
    },
    pro: {
      title: "Enterprise Power",
      subtitle: "At {completed}/25 tasks today - time to scale!",
      cta: "Get Enterprise",
      price: "$149/month",
      benefits: [
        "Unlimited everything",
        "Advanced integrations",
        "Custom workflows",
        "Priority support"
      ]
    }
  };

  const current = upgradeValueProps[currentPlan === 'lite' ? 'lite' : 'pro'];

  if (!isOpen || currentPlan === 'enterprise') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed bottom-4 right-4 z-50 max-w-sm"
    >
      <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-red-50 shadow-xl">
        <div className="p-4">
          <div className="mb-3">
            <h3 className="text-lg font-bold text-orange-900">
              {current.title}
            </h3>
            <p className="text-sm text-orange-700">
              {current.subtitle
                .replace('{completed}', metrics.tasksCompleted.toString())
                .replace('{limit}', metrics.dailyTaskLimit.toString())}
            </p>
          </div>

          <div className="mb-3 text-xs space-y-1">
            {current.benefits.map((benefit) => (
              <div key={benefit} className="flex items-center text-orange-600">
                <span className="mr-2">✅</span>
                {benefit}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
              onClick={() => {
                trackRevenueEvent('task_limit_upgrade_dismissed', { userId, currentPlan });
                setIsOpen(false);
              }}
            >
              Not now
            </Button>
            <Button
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleUpgrade}
            >
              {current.cta} → {current.price}
            </Button>
          </div>
        </div>
      </Card>

      {showCheckout && (
        <StripeCheckout
          type="upgrade"
          userId={userId}
          plan={currentPlan === 'lite' ? 'pro' : 'enterprise'}
          onClose={() => setShowCheckout(false)}
          onSuccess={() => {
            setIsOpen(false);
            setShowCheckout(false);
          }}
        />
      )}
    </motion.div>
  );
}