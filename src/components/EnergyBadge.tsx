import { Zap } from 'lucide-react';

interface EnergyBadgeProps {
  amount: number;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * EnergyBadge Component
 * 
 * Displays energy rewards for completing milestones, steps, tasks, and goals.
 * Shows a lightning bolt icon with the energy amount.
 * 
 * Usage:
 * - <EnergyBadge amount={5} /> for steps
 * - <EnergyBadge amount={50} /> for milestones
 * - <EnergyBadge amount={10-30} /> for tasks
 * - <EnergyBadge amount={50-200} /> for goals
 */
export function EnergyBadge({ amount, size = 'sm', className = '' }: EnergyBadgeProps) {
  const sizeClasses = size === 'sm' 
    ? 'px-1.5 py-0.5 text-xs' 
    : 'px-2 py-1 text-sm';
  
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <div 
      className={`flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 rounded ${sizeClasses} ${className}`}
      title={`Energy reward: +${amount} points`}
    >
      <Zap className={`${iconSize} text-amber-400`} />
      <span className="text-amber-400 font-medium">+{amount}</span>
    </div>
  );
}
