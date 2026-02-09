import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Badge } from './ui/badge';
import { GoalHealthStatus } from '../utils/goal-ai-analytics';

interface GoalHealthBadgeProps {
  health: GoalHealthStatus;
  score: number;
  compact?: boolean;
}

export function GoalHealthBadge({ health, score, compact = false }: GoalHealthBadgeProps) {
  const config = {
    healthy: {
      icon: CheckCircle2,
      label: 'Healthy',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
    },
    'needs-attention': {
      icon: AlertCircle,
      label: 'Needs Attention',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
    },
    critical: {
      icon: AlertTriangle,
      label: 'Critical',
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
    },
  };

  const { icon: Icon, label, color, bgColor, borderColor } = config[health];

  if (compact) {
    return (
      <div 
        className={`inline-flex items-center gap-1 px-2 py-1 rounded ${bgColor} border ${borderColor}`}
        title={`Health Score: ${score}/100`}
      >
        <Icon className={`w-3 h-3 ${color}`} />
        <span className={`text-xs ${color}`}>{label}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 p-3 rounded-lg ${bgColor} border ${borderColor}`}>
      <Icon className={`w-5 h-5 ${color}`} />
      <div className="flex-1">
        <div className={`text-sm ${color}`}>{label}</div>
        <div className="text-xs text-gray-400">Health Score: {score}/100</div>
      </div>
    </div>
  );
}
