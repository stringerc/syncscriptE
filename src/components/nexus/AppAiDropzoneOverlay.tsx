/**
 * Full-page split overlay shown while the user drags a file over the AI tab.
 *
 * Two drop targets — left half "Reference" (read-only context), right half
 * "Modify" (load into DocumentCanvas + Nexus revises in place). The overlay
 * itself never receives the actual drop event — it's pointer-events:none.
 * The page root receives `onDrop`; this component just animates the visual
 * affordance and the mode hint follows the user's pointer.
 *
 * Why split here vs in the hook: keeping presentation isolated lets the hook
 * be pure logic (testable) and lets us iterate the overlay design (animation,
 * gradients) without touching state.
 */
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Pencil, Files } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AttachmentMode } from '@/utils/document-attachment';

interface Props {
  /** Null when no drag in progress. Otherwise reflects which half the pointer is over. */
  mode: AttachmentMode | null;
  /** Called when the cursor enters one of the two halves (page-level handler updates state). */
  onModeHover: (m: AttachmentMode) => void;
}

export function AppAiDropzoneOverlay({ mode, onModeHover }: Props) {
  const visible = mode !== null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="appai-dropzone-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="pointer-events-none absolute inset-0 z-[60] flex"
          aria-hidden
          data-testid="appai-dropzone-overlay"
        >
          {/* LEFT — Reference */}
          <DropHalf
            label="Use as reference"
            sub="Nexus reads the document for this conversation."
            Icon={Files}
            active={mode === 'reference'}
            tone="cyan"
            onHover={() => onModeHover('reference')}
          />
          {/* RIGHT — Modify */}
          <DropHalf
            label="Edit with Nexus"
            sub="Loads into the canvas. Nexus rewrites it in place."
            Icon={Pencil}
            active={mode === 'modify'}
            tone="violet"
            onHover={() => onModeHover('modify')}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface DropHalfProps {
  label: string;
  sub: string;
  Icon: typeof FileText;
  active: boolean;
  tone: 'cyan' | 'violet';
  onHover: () => void;
}

function DropHalf({ label, sub, Icon, active, tone, onHover }: DropHalfProps) {
  const palette =
    tone === 'cyan'
      ? {
          bg: 'from-cyan-500/22 to-cyan-700/8',
          border: 'border-cyan-400/55',
          text: 'text-cyan-50',
          accent: 'bg-cyan-500/30',
          ring: 'ring-cyan-400/50',
        }
      : {
          bg: 'from-violet-500/22 to-fuchsia-700/8',
          border: 'border-violet-400/55',
          text: 'text-violet-50',
          accent: 'bg-violet-500/30',
          ring: 'ring-violet-400/50',
        };

  return (
    <div
      // Pointer events ON for hover; the parent overlay is pointer-events-none, but
      // each half re-enables on hover via this nested div so we can detect mode swap.
      // The actual `drop` is handled by the page root, not this element.
      onDragEnter={onHover}
      onDragOver={onHover}
      className={cn(
        'pointer-events-auto relative flex flex-1 flex-col items-center justify-center gap-3 border-2 border-dashed bg-gradient-to-br p-6 transition-all',
        palette.border,
        palette.bg,
        active && `ring-4 ${palette.ring}`,
      )}
    >
      <motion.div
        animate={{ scale: active ? 1.08 : 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 20 }}
        className={cn('flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg', palette.accent)}
      >
        <Icon className={cn('h-8 w-8', palette.text)} />
      </motion.div>
      <div className="max-w-xs text-center">
        <div className={cn('text-lg font-semibold', palette.text)}>{label}</div>
        <div className="mt-1 text-xs text-white/70">{sub}</div>
      </div>
      {active && (
        <div className={cn('mt-1 rounded-full px-3 py-1 text-[11px] font-medium', palette.accent, palette.text)}>
          Drop here
        </div>
      )}
    </div>
  );
}
