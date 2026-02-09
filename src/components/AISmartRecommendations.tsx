import { 
  AlertCircle, AlertTriangle, TrendingUp, TrendingDown, Target, 
  Crown, CheckSquare, MessageSquare, Brain, Sparkles, ChevronRight 
} from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { SmartRecommendation } from '../utils/goal-ai-analytics';

interface AISmartRecommendationsProps {
  recommendations: SmartRecommendation[];
  onQuickAction?: (action: string, params: any) => void;
}

const iconMap: Record<string, any> = {
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Target,
  Crown,
  CheckSquare,
  MessageSquare,
};

const severityConfig = {
  critical: {
    bg: 'bg-red-500/5',
    border: 'border-red-500/20',
    iconColor: 'text-red-400',
    badgeBg: 'bg-red-500/10',
    badgeText: 'text-red-400',
    badgeBorder: 'border-red-500/30',
  },
  warning: {
    bg: 'bg-yellow-500/5',
    border: 'border-yellow-500/20',
    iconColor: 'text-yellow-400',
    badgeBg: 'bg-yellow-500/10',
    badgeText: 'text-yellow-400',
    badgeBorder: 'border-yellow-500/30',
  },
  info: {
    bg: 'bg-blue-500/5',
    border: 'border-blue-500/20',
    iconColor: 'text-blue-400',
    badgeBg: 'bg-blue-500/10',
    badgeText: 'text-blue-400',
    badgeBorder: 'border-blue-500/30',
  },
};

const typeLabels = {
  alert: 'Alert',
  pattern: 'Pattern',
  suggestion: 'Suggestion',
};

export function AISmartRecommendations({ recommendations, onQuickAction }: AISmartRecommendationsProps) {
  if (recommendations.length === 0) {
    return (
      <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-cyan-400" />
          <h3 className="text-white">AI Recommendations</h3>
        </div>
        <div className="text-center py-8">
          <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-400">All goals looking good!</p>
          <p className="text-xs text-gray-500 mt-1">Recommendations will appear here when actions are needed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-cyan-400" />
        <h3 className="text-white">AI Recommendations</h3>
        <Badge variant="outline" className="ml-auto bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-xs">
          {recommendations.length} insight{recommendations.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec, idx) => {
          const Icon = iconMap[rec.icon] || AlertCircle;
          const config = severityConfig[rec.severity];

          return (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`${config.bg} border ${config.border} rounded-lg p-3`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`w-4 h-4 ${config.iconColor} shrink-0 mt-0.5`} />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    <h4 className="text-sm text-white flex-1">{rec.title}</h4>
                    <Badge 
                      variant="outline" 
                      className={`${config.badgeBg} ${config.badgeText} border ${config.badgeBorder} text-xs shrink-0`}
                    >
                      {typeLabels[rec.type]}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-gray-400 leading-relaxed mb-2">
                    {rec.description}
                  </p>

                  {rec.actionable && rec.quickAction && onQuickAction && (
                    <Button
                      variant="outline"
                      size="sm"
                      className={`${config.badgeBg} ${config.badgeText} border-${rec.severity === 'critical' ? 'red' : rec.severity === 'warning' ? 'yellow' : 'blue'}-500/30 text-xs h-7 mt-1`}
                      onClick={() => onQuickAction(rec.quickAction!.action, rec.quickAction!.params)}
                    >
                      {rec.quickAction.label}
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
