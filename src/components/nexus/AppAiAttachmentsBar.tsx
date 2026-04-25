/**
 * Compact chip rail above the composer showing staged attachments.
 *
 * Visible only when `attachments.length > 0`. Each chip:
 *   - Renders the file name (truncated), size, and a tag for "modify" mode.
 *   - Has a keyboard-accessible remove button (×).
 *   - Tooltip shows full filename + size + truncation note.
 */
import { Files, Pencil, X, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { describeAttachment, type AppAiAttachment } from '@/utils/document-attachment';

interface Props {
  attachments: AppAiAttachment[];
  onRemove: (id: string) => void;
  onAttachClick: () => void;
}

export function AppAiAttachmentsBar({ attachments, onRemove, onAttachClick }: Props) {
  if (attachments.length === 0) {
    return (
      <div className="flex items-center justify-end px-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onAttachClick}
          className="h-6 gap-1 px-2 text-[10px] text-gray-500 hover:bg-gray-800/60 hover:text-gray-300"
          aria-label="Attach a document"
          data-testid="appai-attachments-attach-button"
        >
          <Paperclip className="h-3 w-3" aria-hidden />
          Attach document
        </Button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 rounded-md border border-gray-800/80 bg-[#11131a]/80 px-2 py-1.5"
      role="region"
      aria-label="Attached documents for the next message"
      data-testid="appai-attachments-bar"
    >
      <span className="text-[10px] uppercase tracking-wide text-gray-500">Attached</span>
      {attachments.map((a) => {
        const Icon = a.mode === 'modify' ? Pencil : Files;
        const tone =
          a.mode === 'modify'
            ? 'border-violet-400/30 bg-violet-500/12 text-violet-100'
            : 'border-cyan-400/30 bg-cyan-500/12 text-cyan-100';
        return (
          <div
            key={a.id}
            className={cn(
              'group flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium',
              tone,
            )}
            title={describeAttachment(a)}
          >
            <Icon className="h-3 w-3 shrink-0" aria-hidden />
            <span className="max-w-[14rem] truncate">{a.name}</span>
            {a.truncated && (
              <span className="rounded bg-amber-400/20 px-1 text-[9px] text-amber-200" title="Trimmed to fit">
                trimmed
              </span>
            )}
            <button
              type="button"
              onClick={() => onRemove(a.id)}
              aria-label={`Remove ${a.name}`}
              className="ml-1 flex h-4 w-4 shrink-0 items-center justify-center rounded hover:bg-white/10"
            >
              <X className="h-3 w-3" aria-hidden />
            </button>
          </div>
        );
      })}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onAttachClick}
        className="ml-auto h-6 gap-1 px-2 text-[10px] text-gray-500 hover:text-gray-300"
        aria-label="Attach another document"
      >
        <Paperclip className="h-3 w-3" aria-hidden />
        Add
      </Button>
    </div>
  );
}
