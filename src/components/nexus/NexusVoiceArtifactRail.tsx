/**
 * Visual confirmations during Nexus voice — glass cards for tool outcomes (wow lane).
 */

import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  FileText,
  ListTodo,
  CalendarClock,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NexusVoiceMapEmbed } from './NexusVoiceMapEmbed';

export type VoiceToolChip = {
  id: string;
  kind: 'task' | 'document' | 'calendar' | 'place' | 'generic';
  title: string;
  subtitle?: string;
};

function chipIcon(kind: VoiceToolChip['kind']) {
  switch (kind) {
    case 'document':
      return FileText;
    case 'task':
      return ListTodo;
    case 'calendar':
      return CalendarClock;
    case 'place':
      return MapPin;
    default:
      return Sparkles;
  }
}

export function toolTraceToVoiceChips(
  trace: Array<Record<string, unknown>> | undefined,
  assistantSnippet?: string,
): VoiceToolChip[] {
  if (!Array.isArray(trace) || trace.length === 0) return [];
  const chips: VoiceToolChip[] = [];
  let i = 0;
  for (const t of trace) {
    if (!t || t.ok !== true) continue;
    const tool = String(t.tool || '');
    const detail = (t.detail && typeof t.detail === 'object' ? t.detail : {}) as Record<string, unknown>;
    const id = `vt-${i++}-${tool}`;
    if (tool === 'create_task' || tool === 'add_note') {
      chips.push({
        id,
        kind: 'task',
        title: tool === 'add_note' ? 'Note saved' : 'Task created',
        subtitle: String(detail.title || 'Synced to your list'),
      });
    } else if (tool === 'create_document') {
      chips.push({
        id,
        kind: 'document',
        title: 'Document ready',
        subtitle: String(detail.title || 'Open canvas to edit'),
      });
    } else if (tool === 'update_document') {
      chips.push({
        id,
        kind: 'document',
        title: 'Document updated',
        subtitle: String(detail.title || 'Canvas refreshed'),
      });
    } else if (tool === 'propose_calendar_hold') {
      chips.push({
        id,
        kind: 'calendar',
        title: 'Time proposed',
        subtitle: String(detail.title || 'Confirm in app to add'),
      });
    } else if (tool === 'send_invoice' || tool === 'send_document_for_signature') {
      chips.push({
        id,
        kind: 'generic',
        title: tool === 'send_invoice' ? 'Invoice sent' : 'Signing request sent',
      });
    }
  }

  const mapUrl =
    assistantSnippet &&
    (assistantSnippet.match(/https:\/\/maps\.google\.com\/[^\s)]+/i)?.[0] ||
      assistantSnippet.match(/https:\/\/goo\.gl\/maps\/[^\s)]+/i)?.[0]);
  if (mapUrl && !chips.some((c) => c.kind === 'place')) {
    chips.push({
      id: 'vt-place-link',
      kind: 'place',
      title: 'Map link shared',
      subtitle: 'Tap to open in Maps',
    });
  }

  return chips.slice(-5);
}

interface NexusVoiceArtifactRailProps {
  chips: VoiceToolChip[];
  immersive: boolean;
  onOpenDocument?: () => void;
  /** Opens the live task sheet when Nexus creates a task. */
  onOpenTaskPanel?: () => void;
  mapUrlHint?: string | null;
  /** When the maps URL encodes coordinates, show an inline OSM preview. */
  mapEmbedCoords?: { lat: number; lng: number } | null;
  className?: string;
}

export function NexusVoiceArtifactRail({
  chips,
  immersive,
  onOpenDocument,
  onOpenTaskPanel,
  mapUrlHint,
  mapEmbedCoords,
  className,
}: NexusVoiceArtifactRailProps) {
  const hasDoc = chips.some((c) => c.kind === 'document');
  const hasTask = chips.some((c) => c.kind === 'task');
  const firstTaskChipId = chips.find((c) => c.kind === 'task')?.id;

  return (
    <div
      className={cn(
        'pointer-events-none flex flex-col items-end gap-2',
        immersive ? 'absolute right-3 top-[4.5rem] z-20 max-w-[min(92vw,340px)]' : 'relative w-full max-w-sm ml-auto',
        className,
      )}
    >
      <AnimatePresence mode="popLayout">
        {chips.map((c, idx) => {
          const Icon = chipIcon(c.kind);
          return (
            <motion.div
              key={c.id}
              layout
              initial={{ opacity: 0, x: 24, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28, delay: idx * 0.05 }}
              className="pointer-events-auto w-full"
            >
              <div
                className={cn(
                  'rounded-2xl border px-3.5 py-2.5 shadow-2xl backdrop-blur-xl',
                  'border-white/12 bg-gradient-to-br from-white/[0.09] to-white/[0.02]',
                  'shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]',
                )}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/35 to-cyan-500/25 ring-1 ring-white/10">
                    <Icon className="h-4 w-4 text-cyan-100" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400/90" aria-hidden />
                      <span className="text-[13px] font-semibold tracking-tight text-white">{c.title}</span>
                    </div>
                    {c.subtitle && (
                      <p className="mt-0.5 text-[11px] leading-snug text-white/55 line-clamp-2">{c.subtitle}</p>
                    )}
                    {c.kind === 'document' && onOpenDocument && (
                      <button
                        type="button"
                        onClick={onOpenDocument}
                        className="mt-2 w-full rounded-lg bg-white/10 py-1.5 text-[11px] font-medium text-white/90 ring-1 ring-white/15 transition hover:bg-white/15"
                      >
                        Open live canvas
                      </button>
                    )}
                    {c.kind === 'task' && onOpenTaskPanel && c.id === firstTaskChipId && (
                      <button
                        type="button"
                        onClick={onOpenTaskPanel}
                        className="mt-2 w-full rounded-lg bg-emerald-500/15 py-1.5 text-[11px] font-medium text-emerald-100 ring-1 ring-emerald-400/25 transition hover:bg-emerald-500/25"
                      >
                        Refine task live
                      </button>
                    )}
                    {c.kind === 'place' && mapUrlHint && (
                      <div className="mt-2 space-y-2">
                        {mapEmbedCoords && (
                          <NexusVoiceMapEmbed lat={mapEmbedCoords.lat} lng={mapEmbedCoords.lng} openMapsUrl={mapUrlHint} />
                        )}
                        <a
                          href={mapUrlHint}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full rounded-lg bg-cyan-500/15 py-1.5 text-center text-[11px] font-medium text-cyan-100 ring-1 ring-cyan-400/25 transition hover:bg-cyan-500/25"
                        >
                          {mapEmbedCoords ? 'Open in Google Maps' : 'Open in Maps'}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      {hasDoc && !onOpenDocument && (
        <p className="pointer-events-none text-[10px] text-white/35">Canvas available after response.</p>
      )}
      {hasTask && !onOpenTaskPanel && (
        <p className="pointer-events-none text-[10px] text-white/35">Task actions appear after Nexus confirms.</p>
      )}
    </div>
  );
}
