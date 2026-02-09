import { Calendar, Clock, AlertCircle } from 'lucide-react';

interface DateStatusBadgeProps {
  dueDate: string;
  formatDueDate: (date: string) => string;
  getDateStatus: (date: string) => 'overdue' | 'due-soon' | 'upcoming' | 'future';
}

export function DateStatusBadge({ dueDate, formatDueDate, getDateStatus }: DateStatusBadgeProps) {
  const status = getDateStatus(dueDate);
  const formattedDate = formatDueDate(dueDate);
  
  // Determine badge styles based on status
  const badgeStyles = {
    overdue: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      icon: AlertCircle,
      pulse: true
    },
    'due-soon': {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      icon: Clock,
      pulse: true
    },
    upcoming: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      icon: Calendar,
      pulse: false
    },
    future: {
      bg: 'bg-gray-800/50',
      border: 'border-gray-700/50',
      text: 'text-gray-300',
      icon: Calendar,
      pulse: false
    }
  };
  
  const style = badgeStyles[status];
  const Icon = style.icon;
  
  return (
    <div className={`relative flex items-center gap-1.5 px-2 py-1 ${style.bg} border ${style.border} rounded text-sm ${style.text}`}>
      {style.pulse && (
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${style.bg} opacity-75`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${
            status === 'overdue' ? 'bg-red-500' : 'bg-yellow-500'
          }`}></span>
        </span>
      )}
      <Icon className={`w-3.5 h-3.5 ${style.text} shrink-0`} />
      <span className="font-medium whitespace-nowrap">{formattedDate}</span>
    </div>
  );
}
