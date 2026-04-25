/**
 * Drag/drop + file-picker hook for the App AI tab.
 *
 * Exposes:
 *   - attachments[]            — staged attachments for the next chat send
 *   - dragMode                 — null | 'reference' | 'modify' (drives overlay state)
 *   - rootDragHandlers         — spread on the page root <div> to receive drops
 *   - onAttachClick            — opens the hidden file picker with chosen mode
 *   - removeAttachment(id)
 *   - clearAttachments()
 *   - hiddenInput              — stable JSX <input> element to render (zero-size)
 *
 * Handles the cross-browser "dragLeave fires when entering child" gotcha by
 * counting enter/leave events on the root.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type ReactNode,
} from 'react';
import {
  fileToAttachment,
  totalAttachmentBytes,
  type AppAiAttachment,
  type AttachmentMode,
  type AttachmentParseError,
  MAX_ATTACHMENTS_PER_TURN,
  MAX_TOTAL_ATTACHMENT_BYTES,
} from '@/utils/document-attachment';

export interface UseAppAiAttachmentsOptions {
  enabled?: boolean;
  onError: (message: string) => void;
  onWarn?: (message: string) => void;
  onModifyOpen?: (attachment: AppAiAttachment) => void;
}

export interface UseAppAiAttachmentsReturn {
  attachments: AppAiAttachment[];
  dragMode: AttachmentMode | null;
  rootDragHandlers: {
    onDragEnter: (e: ReactDragEvent<HTMLElement>) => void;
    onDragOver: (e: ReactDragEvent<HTMLElement>) => void;
    onDragLeave: (e: ReactDragEvent<HTMLElement>) => void;
    onDrop: (e: ReactDragEvent<HTMLElement>) => void;
  };
  setDragMode: (m: AttachmentMode | null) => void;
  onAttachClick: (mode: AttachmentMode) => void;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
  hiddenInput: ReactNode;
}

function describeError(err: AttachmentParseError, name: string): string {
  switch (err.kind) {
    case 'too_large_pre_read':
      return `${name} is ${(err.sizeBytes / 1024 / 1024).toFixed(1)} MB — too large to attach.`;
    case 'binary_unsupported':
      return `${name} (.${err.ext}) isn't a text format Nexus can read here.`;
    case 'image_unsupported':
      return `${name} is an image — image attachments are coming soon.`;
    case 'needs_server_extraction':
      return `${name} (.${err.ext}) needs server extraction — paste its text or save as .md / .txt for now.`;
    case 'empty_file':
      return `${name} is empty — nothing to attach.`;
    case 'read_failed':
      return `Couldn't read ${name}: ${err.message}`;
    default:
      return `Couldn't attach ${name}.`;
  }
}

const ATTACHMENT_ID_GEN = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2));

export function useAppAiAttachments(opts: UseAppAiAttachmentsOptions): UseAppAiAttachmentsReturn {
  const { enabled = true, onError, onWarn, onModifyOpen } = opts;
  const [attachments, setAttachments] = useState<AppAiAttachment[]>([]);
  const [dragMode, setDragMode] = useState<AttachmentMode | null>(null);
  const dragDepthRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingPickerModeRef = useRef<AttachmentMode>('reference');

  const stableOnError = useRef(onError);
  const stableOnWarn = useRef(onWarn);
  const stableOnModifyOpen = useRef(onModifyOpen);
  useEffect(() => { stableOnError.current = onError; }, [onError]);
  useEffect(() => { stableOnWarn.current = onWarn; }, [onWarn]);
  useEffect(() => { stableOnModifyOpen.current = onModifyOpen; }, [onModifyOpen]);

  const ingest = useCallback(
    async (files: FileList | File[], mode: AttachmentMode) => {
      const list = Array.from(files);
      if (list.length === 0) return;

      let pool = attachments.slice();
      let warnedCount = false;

      for (const file of list) {
        if (pool.length >= MAX_ATTACHMENTS_PER_TURN) {
          if (!warnedCount) {
            stableOnError.current(`You can attach up to ${MAX_ATTACHMENTS_PER_TURN} files per turn.`);
            warnedCount = true;
          }
          break;
        }
        const result = await fileToAttachment(file, mode, ATTACHMENT_ID_GEN);
        if (!result.ok) {
          stableOnError.current(describeError(result.error, file.name));
          continue;
        }
        const next = [...pool, result.attachment];
        if (totalAttachmentBytes(next) > MAX_TOTAL_ATTACHMENT_BYTES) {
          stableOnError.current(
            `Adding ${file.name} would exceed the ${Math.round(MAX_TOTAL_ATTACHMENT_BYTES / 1024)} KB total attachment cap.`,
          );
          continue;
        }
        pool = next;
        for (const w of result.warnings) stableOnWarn.current?.(w);
        if (mode === 'modify') stableOnModifyOpen.current?.(result.attachment);
      }

      setAttachments(pool);
    },
    [attachments],
  );

  const onDragEnter = useCallback(
    (e: ReactDragEvent<HTMLElement>) => {
      if (!enabled) return;
      if (!Array.from(e.dataTransfer?.types ?? []).includes('Files')) return;
      e.preventDefault();
      dragDepthRef.current += 1;
      if (dragDepthRef.current === 1) {
        // Default new drags to reference mode; the overlay's two halves let the user
        // commit to a mode based on which side they release over.
        setDragMode((prev) => prev ?? 'reference');
      }
    },
    [enabled],
  );

  const onDragOver = useCallback(
    (e: ReactDragEvent<HTMLElement>) => {
      if (!enabled) return;
      if (!Array.from(e.dataTransfer?.types ?? []).includes('Files')) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    },
    [enabled],
  );

  const onDragLeave = useCallback(
    (e: ReactDragEvent<HTMLElement>) => {
      if (!enabled) return;
      e.preventDefault();
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) {
        setDragMode(null);
      }
    },
    [enabled],
  );

  const onDrop = useCallback(
    (e: ReactDragEvent<HTMLElement>) => {
      if (!enabled) return;
      e.preventDefault();
      dragDepthRef.current = 0;
      const finalMode = dragMode ?? 'reference';
      setDragMode(null);
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) void ingest(files, finalMode);
    },
    [enabled, dragMode, ingest],
  );

  const rootDragHandlers = useMemo(
    () => ({ onDragEnter, onDragOver, onDragLeave, onDrop }),
    [onDragEnter, onDragOver, onDragLeave, onDrop],
  );

  const onAttachClick = useCallback((mode: AttachmentMode) => {
    pendingPickerModeRef.current = mode;
    fileInputRef.current?.click();
  }, []);

  const handlePickerChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      await ingest(files, pendingPickerModeRef.current);
      e.target.value = ''; // allow re-picking the same file
    },
    [ingest],
  );

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const clearAttachments = useCallback(() => {
    setAttachments([]);
  }, []);

  const hiddenInput = useMemo(
    () => (
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={handlePickerChange}
        // Accept everything; the parser rejects what it can't read with a friendly toast.
      />
    ),
    [handlePickerChange],
  );

  return {
    attachments,
    dragMode,
    rootDragHandlers,
    setDragMode,
    onAttachClick,
    removeAttachment,
    clearAttachments,
    hiddenInput,
  };
}
