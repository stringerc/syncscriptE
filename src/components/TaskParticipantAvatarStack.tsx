import { cn } from '@/lib/utils';

export type ParticipantFace = {
  id?: string;
  name: string;
  image: string;
  fallback: string;
  /** Creator / accountable party — subtle ring (Teams/Slack-style accountability cue) */
  role?: 'owner' | 'contributor';
};

const ACCENT_BORDER: Record<'teal' | 'blue' | 'orange' | 'purple' | 'slate', string> = {
  teal: 'border-teal-500/35',
  blue: 'border-blue-500/35',
  orange: 'border-orange-500/35',
  purple: 'border-purple-500/35',
  slate: 'border-gray-600/60',
};

/**
 * Overlapping face stack (matches Weather & Route intelligence cards).
 * Renders nothing when people is empty.
 */
export function TaskParticipantAvatarStack({
  people,
  accent = 'teal',
  maxVisible = 4,
  className,
  label,
}: {
  people: ParticipantFace[];
  accent?: keyof typeof ACCENT_BORDER;
  maxVisible?: number;
  className?: string;
  /** e.g. "3 on this task" — shown after avatars */
  label?: string;
}) {
  if (!people.length) return null;

  const visible = people.slice(0, maxVisible);
  const overflow = people.length - visible.length;

  return (
    <div className={cn('mt-2 flex flex-wrap items-center gap-2', className)}>
      <div className="flex items-center">
        {visible.map((p, i) => (
          <div
            key={p.id || `${p.name}-${i}`}
            className={cn(
              '-ml-1 h-7 w-7 overflow-hidden rounded-full border-2 bg-gray-800 first:ml-0 sm:h-6 sm:w-6',
              ACCENT_BORDER[accent],
              p.role === 'owner' && 'ring-2 ring-amber-400/65',
            )}
            style={{ zIndex: visible.length - i }}
            title={p.role === 'owner' ? `${p.name} (owner)` : p.name}
          >
            <img src={p.image} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
        {overflow > 0 && (
          <div
            className={cn(
              '-ml-1 flex h-7 w-7 items-center justify-center rounded-full border-2 bg-gray-700 text-[10px] font-medium text-gray-200 sm:h-6 sm:w-6',
              ACCENT_BORDER[accent],
            )}
          >
            +{overflow}
          </div>
        )}
      </div>
      <span className="text-[10px] text-gray-400">
        {label ?? `${people.length} ${people.length === 1 ? 'person' : 'people'}`}
      </span>
      {visible.some((p) => p.role === 'owner') && (
        <span className="text-[9px] text-amber-400/80">· Owner ring</span>
      )}
    </div>
  );
}
