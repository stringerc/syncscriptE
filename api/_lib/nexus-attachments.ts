/**
 * Server-side validation + serialization of user-supplied attachments to
 * `/api/ai/nexus-user`. Intentionally NOT shared with the client utility —
 * the server is the trust boundary, so we re-cap sizes and re-format the
 * system message here even if the client already did.
 *
 * Format must stay byte-identical to `src/utils/document-attachment.ts`'s
 * `formatAttachmentSystemMessage`; the contract test enforces parity.
 */

const MAX_ATTACHMENT_BYTES_SERVER = 96 * 1024;
const MAX_TOTAL_ATTACHMENT_BYTES_SERVER = 256 * 1024;
const MAX_ATTACHMENTS_SERVER = 6;

export type ServerAttachmentMode = 'reference' | 'modify';

export interface ValidatedAttachment {
  name: string;
  mimeType: string;
  content: string;
  mode: ServerAttachmentMode;
  truncated: boolean;
}

function clip(value: unknown, maxBytes: number): { text: string; truncated: boolean } {
  const text = typeof value === 'string' ? value : '';
  const bytes = Buffer.byteLength(text, 'utf8');
  if (bytes <= maxBytes) return { text, truncated: false };
  // Cut by char ratio; final byte size will be ≤ maxBytes after one pass.
  const ratio = maxBytes / bytes;
  const targetChars = Math.max(1, Math.floor(text.length * ratio));
  return { text: text.slice(0, targetChars), truncated: true };
}

function asMode(v: unknown): ServerAttachmentMode {
  return v === 'modify' ? 'modify' : 'reference';
}

function asString(v: unknown, max = 512): string {
  if (typeof v !== 'string') return '';
  return v.replace(/[\u0000-\u001F\u007F]/g, '').slice(0, max);
}

/**
 * Returns at most `MAX_ATTACHMENTS_SERVER` validated attachments whose total
 * byte sum is `<= MAX_TOTAL_ATTACHMENT_BYTES_SERVER`. Anything past those caps
 * is silently dropped (not an error — the user already had this enforced
 * client-side; if a malicious caller sends 50 docs we just take the first
 * couple and proceed).
 */
export function sanitizeAttachments(raw: unknown): ValidatedAttachment[] {
  if (!Array.isArray(raw)) return [];
  const out: ValidatedAttachment[] = [];
  let totalBytes = 0;

  for (const item of raw) {
    if (out.length >= MAX_ATTACHMENTS_SERVER) break;
    if (!item || typeof item !== 'object') continue;
    const obj = item as Record<string, unknown>;

    const name = asString(obj.name, 200) || 'attachment';
    const mimeType = asString(obj.mimeType, 80) || 'text/plain';
    const mode = asMode(obj.mode);
    const { text, truncated: srvTrunc } = clip(obj.content, MAX_ATTACHMENT_BYTES_SERVER);
    if (!text) continue;

    const itemBytes = Buffer.byteLength(text, 'utf8');
    if (totalBytes + itemBytes > MAX_TOTAL_ATTACHMENT_BYTES_SERVER) break;
    totalBytes += itemBytes;

    const clientTrunc = obj.truncated === true;
    out.push({ name, mimeType, content: text, mode, truncated: srvTrunc || clientTrunc });
  }

  return out;
}

/**
 * MUST stay aligned with `formatAttachmentSystemMessage` in
 * `src/utils/document-attachment.ts`.
 */
export function buildAttachmentsSystemMessage(attachments: ValidatedAttachment[]): string {
  if (attachments.length === 0) return '';
  const blocks = attachments.map((a, i) => {
    const tag = a.mode === 'modify' ? 'MODIFY-TARGET' : 'REFERENCE';
    const trunc = a.truncated ? ' (truncated)' : '';
    return `--- ATTACHMENT ${i + 1} [${tag}] name="${a.name}" mime="${a.mimeType}"${trunc} ---\n${a.content}\n--- END ATTACHMENT ${i + 1} ---`;
  });
  return [
    'ATTACHED DOCUMENTS — the user has shared the following files for this turn.',
    'Treat REFERENCE files as read-only context to inform your reply.',
    'When a MODIFY-TARGET is present and the user asks you to revise it, call update_document with the full replacement Markdown.',
    '',
    ...blocks,
  ].join('\n');
}

/**
 * Returns total byte size of the attachment system message — used in
 * `emitNexusTrace` so observability can spot pathologically large turns.
 */
export function attachmentBytesUsed(attachments: ValidatedAttachment[]): number {
  return attachments.reduce((sum, a) => sum + Buffer.byteLength(a.content, 'utf8'), 0);
}
