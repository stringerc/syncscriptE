/**
 * Wrapper that renders the voice engine in either fullscreen mode (default)
 * or a compact top-left dock (while an agent run is active in the background).
 *
 * When docked:
 *   - 220×156 rounded card pinned top-left at z-[100020]
 *   - Shows "Nexus is working…" banner overlay above orb
 *   - Tap (or "Expand" button) restores fullscreen
 *
 * Why a wrapper, not a flag inside VoiceConversationEngine:
 *   VoiceConversationEngine is a 1700-line, frequently-edited component. We
 *   keep its internals untouched and just swap the outer shell + size.
 */
import { motion, AnimatePresence } from 'motion/react';
import { Maximize2, Bot, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface Props {
  docked: boolean;
  /** Status text shown in the docked banner. */
  agentStatus: string;
  onExpand: () => void;
  children: ReactNode;
}

export function VoiceDockedFrame({ docked, agentStatus, onExpand, children }: Props) {
  return (
    <motion.div
      data-voice-docked={docked ? 'true' : 'false'}
      data-testid={docked ? 'voice-docked-frame' : 'voice-fullscreen-frame'}
      animate={{
        // Use spring for the size + position transition so the user perceives
        // it as the same orb moving rather than a hard cut.
        width: docked ? 240 : '100%',
        height: docked ? 168 : '100dvh',
        top: docked ? 8 : 0,
        left: docked ? 8 : 0,
        right: docked ? 'auto' : 0,
        borderRadius: docked ? 16 : 0,
      }}
      transition={{ type: 'spring', stiffness: 240, damping: 28 }}
      className={cn(
        'fixed z-[100020] overflow-hidden shadow-2xl',
        docked
          ? 'border border-violet-400/40 bg-[#0c0d12]/95 backdrop-blur-md cursor-pointer'
          : 'inset-0 bg-[#030206]',
      )}
      onClick={docked ? onExpand : undefined}
      role={docked ? 'button' : undefined}
      aria-label={docked ? 'Expand voice — agent is working in the background' : undefined}
      tabIndex={docked ? 0 : -1}
      onKeyDown={(e) => {
        if (docked && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onExpand();
        }
      }}
    >
      {children}

      <AnimatePresence>
        {docked && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-1.5 bg-gradient-to-b from-black/70 to-transparent px-2 py-1.5"
          >
            <div className="flex items-center gap-1 text-[10px] font-medium text-violet-100">
              <Loader2 className="w-3 h-3 animate-spin" aria-hidden />
              <Bot className="w-3 h-3" aria-hidden />
              <span className="truncate max-w-[140px]">{agentStatus}</span>
            </div>
            <Maximize2 className="w-3 h-3 text-violet-200/70" aria-hidden />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
