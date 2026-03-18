import { cn } from '../ui/utils';

type TaskPriority = 'high' | 'medium' | 'low' | 'urgent' | 'critical' | string;

function getPriorityAccent(priority: TaskPriority): string {
  const value = String(priority || '').toLowerCase();
  if (value === 'high' || value === 'urgent' || value === 'critical') return 'border-l-red-500';
  if (value === 'medium') return 'border-l-yellow-500';
  if (value === 'low') return 'border-l-green-500';
  return 'border-l-cyan-500';
}

interface TaskCardSurfaceOptions {
  priority?: TaskPriority;
  selected?: boolean;
  interactive?: boolean;
  className?: string;
}

export function getTaskCardSurfaceClasses({
  priority = 'medium',
  selected = false,
  interactive = true,
  className,
}: TaskCardSurfaceOptions): string {
  return cn(
    'bg-[#1e2128] border rounded-xl border-l-[3px] transition-all',
    selected ? 'border-gray-600 ring-1 ring-violet-400/60 shadow-[0_10px_24px_rgba(0,0,0,0.35)]' : 'border-gray-700',
    getPriorityAccent(priority),
    interactive ? 'hover:border-gray-600 hover:shadow-md hover:shadow-teal-500/10' : '',
    className,
  );
}
