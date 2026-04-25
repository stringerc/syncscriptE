/**
 * Document attachment utilities for the App AI tab.
 *
 * Goals (matched against ChatGPT / Claude / Notion AI behavior 2026):
 *   - Drop or paste a doc; it becomes context for the next chat turn.
 *   - Two intents: "reference" (Nexus reads, doesn't change) and "modify"
 *     (loads into DocumentCanvas; subsequent edits go through update_document).
 *   - Hard size limits so one runaway file can't blow Nexus's token budget.
 *
 * Pure functions only — keeps this importable from React components, hooks,
 * and contract tests without any DOM dependency. The hook layer wraps the
 * `fileToAttachment` call.
 */

export type AttachmentMode = 'reference' | 'modify';

export interface AppAiAttachment {
  /** Stable id used for chip key + remove. */
  id: string;
  /** Original filename (sanitized). */
  name: string;
  /** Best-effort MIME (browser-provided or inferred from extension). */
  mimeType: string;
  /** Original byte size. */
  size: number;
  /** Always UTF-8 text. Binary types are rejected before reaching here. */
  content: string;
  /** Reference = passed as context. Modify = also opened in canvas. */
  mode: AttachmentMode;
  /** True when content was clipped to MAX_ATTACHMENT_BYTES. */
  truncated: boolean;
}

/** Per-attachment hard cap (bytes of TEXT). 96 KB ≈ 24k Groq tokens — leaves room for the rest of the prompt. */
export const MAX_ATTACHMENT_BYTES = 96 * 1024;

/** Total cap across all attachments in one turn. Mirrors Claude.ai's "you've hit the message size limit" guard. */
export const MAX_TOTAL_ATTACHMENT_BYTES = 256 * 1024;

/** How many concurrent attachments we let users stage. */
export const MAX_ATTACHMENTS_PER_TURN = 6;

/** Single source of truth for which file types we parse client-side today. */
const TEXT_EXTENSIONS = new Set([
  'txt', 'md', 'markdown', 'mdx',
  'json', 'jsonc', 'json5',
  'csv', 'tsv',
  'html', 'htm', 'xml', 'svg',
  'yml', 'yaml', 'toml', 'ini', 'cfg', 'env', 'properties',
  'log', 'sql',
  'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs',
  'py', 'rb', 'go', 'rs', 'java', 'kt', 'swift', 'cs',
  'c', 'h', 'cpp', 'hpp', 'cc', 'm', 'mm',
  'sh', 'bash', 'zsh', 'fish', 'ps1',
  'tex', 'rst', 'adoc', 'org',
]);

/** Types we explicitly know we can't extract today; show a friendly message instead of a generic error. */
const NEEDS_SERVER_EXTRACTION = new Set(['pdf', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'rtf', 'odt']);

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'bmp', 'tiff', 'heic', 'heif']);

/** Files we consider "huge" before even reading — guards against multi-MB drops. */
export const MAX_FILE_BYTES_BEFORE_READ = 4 * 1024 * 1024;

export function fileExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot < 0 || dot === name.length - 1) return '';
  return name.slice(dot + 1).toLowerCase();
}

export function inferMimeFromName(name: string): string {
  const ext = fileExtension(name);
  if (!ext) return 'text/plain';
  if (TEXT_EXTENSIONS.has(ext)) {
    if (ext === 'md' || ext === 'markdown' || ext === 'mdx') return 'text/markdown';
    if (ext === 'json' || ext === 'jsonc' || ext === 'json5') return 'application/json';
    if (ext === 'csv') return 'text/csv';
    if (ext === 'tsv') return 'text/tab-separated-values';
    if (ext === 'html' || ext === 'htm') return 'text/html';
    if (ext === 'xml' || ext === 'svg') return 'application/xml';
    if (ext === 'yml' || ext === 'yaml') return 'application/yaml';
    return 'text/plain';
  }
  if (NEEDS_SERVER_EXTRACTION.has(ext)) return `application/${ext}`;
  if (IMAGE_EXTENSIONS.has(ext)) return `image/${ext === 'jpg' ? 'jpeg' : ext}`;
  return 'application/octet-stream';
}

export type AttachmentParseError =
  | { kind: 'too_large_pre_read'; sizeBytes: number }
  | { kind: 'binary_unsupported'; ext: string; mime: string }
  | { kind: 'image_unsupported'; ext: string }
  | { kind: 'needs_server_extraction'; ext: string }
  | { kind: 'empty_file' }
  | { kind: 'read_failed'; message: string };

export interface ParseResult {
  ok: true;
  attachment: AppAiAttachment;
  warnings: string[];
}

export type ParseOutcome = ParseResult | { ok: false; error: AttachmentParseError };

interface FileLike {
  name: string;
  size: number;
  type: string;
  text: () => Promise<string>;
}

/**
 * Convert a browser `File` into an `AppAiAttachment` with hard size guards.
 * Caller decides `mode` based on which drop target / button was used.
 */
export async function fileToAttachment(
  file: FileLike,
  mode: AttachmentMode,
  idGen: () => string = () => Math.random().toString(36).slice(2),
): Promise<ParseOutcome> {
  const safeName = file.name.replace(/[\u0000-\u001F\u007F]/g, '').slice(0, 200) || 'untitled';
  const ext = fileExtension(safeName);
  const mime = file.type || inferMimeFromName(safeName);

  if (file.size > MAX_FILE_BYTES_BEFORE_READ) {
    return { ok: false, error: { kind: 'too_large_pre_read', sizeBytes: file.size } };
  }

  if (file.size === 0) {
    return { ok: false, error: { kind: 'empty_file' } };
  }

  if (IMAGE_EXTENSIONS.has(ext) || mime.startsWith('image/')) {
    return { ok: false, error: { kind: 'image_unsupported', ext } };
  }

  if (NEEDS_SERVER_EXTRACTION.has(ext)) {
    return { ok: false, error: { kind: 'needs_server_extraction', ext } };
  }

  const isText =
    mime.startsWith('text/') ||
    mime === 'application/json' ||
    mime === 'application/xml' ||
    mime === 'application/yaml' ||
    mime === 'application/javascript' ||
    mime === 'application/typescript' ||
    TEXT_EXTENSIONS.has(ext);

  if (!isText) {
    return { ok: false, error: { kind: 'binary_unsupported', ext, mime } };
  }

  let raw: string;
  try {
    raw = await file.text();
  } catch (e) {
    return { ok: false, error: { kind: 'read_failed', message: e instanceof Error ? e.message : String(e) } };
  }

  if (!raw.trim()) {
    return { ok: false, error: { kind: 'empty_file' } };
  }

  const warnings: string[] = [];
  let content = raw;
  let truncated = false;

  const bytes = new TextEncoder().encode(raw).byteLength;
  if (bytes > MAX_ATTACHMENT_BYTES) {
    // Slice by chars after trimming to bytes; one over-shoot iteration is fine for UTF-8.
    const ratio = MAX_ATTACHMENT_BYTES / bytes;
    const targetChars = Math.max(1, Math.floor(raw.length * ratio));
    content = raw.slice(0, targetChars);
    truncated = true;
    warnings.push(
      `Trimmed ${safeName} to ~${Math.round(MAX_ATTACHMENT_BYTES / 1024)} KB so it fits in Nexus's context window.`,
    );
  }

  return {
    ok: true,
    attachment: {
      id: idGen(),
      name: safeName,
      mimeType: mime,
      size: file.size,
      content,
      mode,
      truncated,
    },
    warnings,
  };
}

/**
 * Compute total bytes across attachments. Used to enforce MAX_TOTAL_ATTACHMENT_BYTES.
 */
export function totalAttachmentBytes(attachments: AppAiAttachment[]): number {
  return attachments.reduce((sum, a) => sum + new TextEncoder().encode(a.content).byteLength, 0);
}

/**
 * Wire format sent to /api/ai/nexus-user. Server is authoritative — it ignores
 * unknown fields and re-validates `content` length defensively.
 */
export interface AttachmentForServer {
  name: string;
  mimeType: string;
  content: string;
  mode: AttachmentMode;
  truncated?: boolean;
}

export function attachmentsForServer(attachments: AppAiAttachment[]): AttachmentForServer[] {
  return attachments.map((a) => ({
    name: a.name,
    mimeType: a.mimeType,
    content: a.content,
    mode: a.mode,
    truncated: a.truncated || undefined,
  }));
}

/**
 * Format attachments as a single system-message block. Server uses the same
 * shape so client and contract tests stay aligned. Format is deliberately
 * boring: clear delimiters, names visible, mode tagged so the model knows
 * which docs are read-only references vs target-of-edit.
 */
export function formatAttachmentSystemMessage(attachments: AttachmentForServer[]): string {
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
 * Build a short, human-readable summary line for chip tooltips and a11y announcements.
 */
export function describeAttachment(a: AppAiAttachment): string {
  const kb = Math.max(1, Math.round(a.size / 1024));
  const mode = a.mode === 'modify' ? 'will be edited' : 'reference';
  const trunc = a.truncated ? ' (trimmed)' : '';
  return `${a.name} · ${kb} KB${trunc} · ${mode}`;
}
