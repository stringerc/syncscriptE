import { Sparkles, Target, TrendingUp, Zap } from 'lucide-react';

/**
 * EnergyEarningGuide Component
 * 
 * Displays a comprehensive guide on how users can earn energy points
 * by completing various tasks, milestones, steps, and goals.
 * 
 * Energy Earning Structure:
 * - Steps: +5 energy (small actions within milestones)
 * - Tasks: +10/20/30 energy (based on priority)
 * - Milestones: +50 energy (major achievement markers)
 * - Goals: +50/100/200 energy (based on size)
 */
export function EnergyEarningGuide() {
  const earningMethods = [
    { 
      label: 'Complete a Step', 
      energy: 5, 
      icon: Target, 
      description: 'Small actions within milestones',
      color: 'text-teal-400'
    },
    { 
      label: 'Complete a Low Priority Task', 
      energy: 10, 
      icon: Target, 
      description: 'Quick wins and simple tasks',
      color: 'text-blue-400'
    },
    { 
      label: 'Complete a Medium Priority Task', 
      energy: 20, 
      icon: Target, 
      description: 'Standard work items',
      color: 'text-blue-400'
    },
    { 
      label: 'Complete a High Priority Task', 
      energy: 30, 
      icon: Target, 
      description: 'Important deliverables',
      color: 'text-blue-400'
    },
    { 
      label: 'Complete a Milestone', 
      energy: 50, 
      icon: TrendingUp, 
      description: 'Major achievement markers',
      color: 'text-purple-400'
    },
    { 
      label: 'Complete a Small Goal', 
      energy: 50, 
      icon: TrendingUp, 
      description: 'Habits and quick wins',
      color: 'text-green-400'
    },
    { 
      label: 'Complete a Medium Goal', 
      energy: 100, 
      icon: TrendingUp, 
      description: 'Standard goals',
      color: 'text-green-400'
    },
    { 
      label: 'Complete a Large Goal', 
      energy: 200, 
      icon: TrendingUp, 
      description: 'Major achievements',
      color: 'text-green-400'
    },
  ];

  return (
    <div className="bg-[#1e2128] border border-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-amber-400" />
        <h2 className="text-lg font-semibold text-white">How to Earn Energy</h2>
      </div>

      <div className="space-y-2">
        {earningMethods.map((item, i) => (
          <div 
            key={i} 
            className="flex items-start justify-between p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors group"
          >
            <div className="flex items-start gap-3 flex-1">
              <item.icon className={`w-4 h-4 ${item.color} mt-0.5 shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-300 font-medium group-hover:text-white transition-colors">
                  {item.label}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {item.description}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded shrink-0">
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="text-xs text-amber-400 font-medium">+{item.energy}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
          <div className="text-xs text-blue-300">
            <span className="font-semibold">Pro Tip:</span> Energy resets daily and builds up through the ROYGBIV color progression. After reaching Violet (700 energy), you earn permanent Aura points!
          </div>
        </div>
      </div>
    </div>
  );
}
