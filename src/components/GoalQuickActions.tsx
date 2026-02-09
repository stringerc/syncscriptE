import { 
  CheckSquare, Target, AlertTriangle, Calendar, MessageSquare, 
  TrendingUp, Crown, Zap 
} from 'lucide-react';
import { Button } from './ui/button';
import { motion } from 'motion/react';

interface QuickAction {
  label: string;
  action: string;
  icon: string;
  variant: 'default' | 'success' | 'warning' | 'danger';
  priority: number;
}

interface GoalQuickActionsProps {
  actions: QuickAction[];
  onAction: (action: string) => void;
}

const iconMap: Record<string, any> = {
  CheckSquare,
  Target,
  AlertTriangle,
  Calendar,
  MessageSquare,
  TrendingUp,
  Crown,
  Zap,
};

const variantStyles = {
  default: 'bg-gray-700/50 hover:bg-gray-700 border-gray-600 text-gray-300',
  success: 'bg-green-500/10 hover:bg-green-500/20 border-green-500/30 text-green-400',
  warning: 'bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
  danger: 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-400',
};

export function GoalQuickActions({ actions, onAction }: GoalQuickActionsProps) {
  if (actions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 flex-wrap"
    >
      {actions.map((action, idx) => {
        const Icon = iconMap[action.icon] || Zap;
        const styles = variantStyles[action.variant];

        return (
          <Button
            key={idx}
            variant="outline"
            size="sm"
            className={`${styles} text-xs h-7 px-2`}
            onClick={() => onAction(action.action)}
          >
            <Icon className="w-3 h-3 mr-1" />
            {action.label}
          </Button>
        );
      })}
    </motion.div>
  );
}
