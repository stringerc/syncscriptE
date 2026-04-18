/**
 * Landing Nexus TTS prosody — duplicated from `NexusVoiceCallContext` logic (do not import context here).
 * Keeps Voice Resonance / `useVoiceStream` aligned with marketing guest voice without touching protected files.
 */

export const NEXUS_LANDING_KOKORO_VOICE_ID = 'cortana';

type SentenceKind = 'exclamation' | 'question' | 'statement';

export interface NexusProsodySegment {
  text: string;
  kind: SentenceKind;
  voice: string;
  speed: number;
}

const PROSODY_MAP: Record<SentenceKind, { voice: string; speed: number }> = {
  exclamation: { voice: NEXUS_LANDING_KOKORO_VOICE_ID, speed: 0.99 },
  question: { voice: NEXUS_LANDING_KOKORO_VOICE_ID, speed: 1.0 },
  statement: { voice: NEXUS_LANDING_KOKORO_VOICE_ID, speed: 0.98 },
};

/** Same order as `NexusVoiceCallContext.ttsVoiceCandidates`. */
export function nexusKokoroVoiceCandidates(primary: string): string[] {
  const rest = ['natural', 'nexus', 'professional'].filter((v) => v !== primary);
  return [primary, ...rest];
}

/** Markdown / UI → spoken English (matches landing). */
export function sanitizeForNexusTTS(raw: string): string {
  let s = raw;
  s = s.replace(/\*\*\*(.+?)\*\*\*/g, '$1');
  s = s.replace(/\*\*(.+?)\*\*/g, '$1');
  s = s.replace(/\*(.+?)\*/g, '$1');
  s = s.replace(/__(.+?)__/g, '$1');
  s = s.replace(/(?<!\w)_([^_]+?)_(?!\w)/g, '$1');
  s = s.replace(/~~(.+?)~~/g, '$1');
  s = s.replace(/`([^`]+?)`/g, '$1');
  s = s.replace(/\[([^\]]+?)\]\([^)]+?\)/g, '$1');
  s = s.replace(/^#{1,6}\s+/gm, '');
  s = s.replace(/^[*•\-]\s+/gm, '');
  s = s.replace(/^\d+[.)]\s+/gm, '');
  s = s.replace(/^>\s+/gm, '');
  s = s.replace(/(\d+)\s*[-–—]\s*(\d+)/g, '$1 to $2');
  s = s.replace(/(\d+)-(minute|hour|day|week|month|year|step|star|point|page|item|person|seat)/gi, '$1 $2');
  s = s.replace(/\$(\d+(?:,\d{3})*(?:\.\d+)?)\s*\/(\w+)/g, '$1 dollars per $2');
  s = s.replace(/\$(\d+(?:,\d{3})*(?:\.\d+)?)/g, '$1 dollars');
  s = s.replace(/\/month/gi, ' per month');
  s = s.replace(/\/year/gi, ' per year');
  s = s.replace(/\/user/gi, ' per user');
  s = s.replace(/\/day/gi, ' per day');
  s = s.replace(/\/hour/gi, ' per hour');
  s = s.replace(/\/week/gi, ' per week');
  s = s.replace(/(\d+)\s*%/g, '$1 percent');
  s = s.replace(/\s*&\s*/g, ' and ');
  s = s.replace(/\s*\+\s*/g, ' and ');
  s = s.replace(/#(\d+)/g, 'number $1');
  s = s.replace(/\be\.g\.\s*/gi, 'for example, ');
  s = s.replace(/\bi\.e\.\s*/gi, 'that is, ');
  s = s.replace(/\betc\.\s*/gi, 'and so on. ');
  s = s.replace(/\bvs\.?\s/gi, 'versus ');
  s = s.replace(/\bw\/o\b/gi, 'without');
  s = s.replace(/(?<!\w)w\/(?!\w)/gi, 'with');
  s = s.replace(/\bhr\b(?!e)/gi, 'hour');
  s = s.replace(/\bhrs\b/gi, 'hours');
  s = s.replace(/\bmin\b(?![\w])/gi, 'minute');
  s = s.replace(/\bmins\b/gi, 'minutes');
  s = s.replace(/\binfo\b/gi, 'information');
  s = s.replace(/\basap\b/gi, 'as soon as possible');
  s = s.replace(/\b24\/7\b/g, 'twenty-four seven');
  s = s.replace(/([A-Z]{2,})\/([A-Z]{2,})/g, '$1 or $2');
  s = s.replace(/\s*[—–]\s*/g, ', ');
  s = s.replace(/\s*--\s*/g, ', ');
  s = s.replace(/\.{2,}/g, '.');
  s = s.replace(/…/g, '.');
  s = s.replace(/;/g, '.');
  s = s.replace(/\(([^)]{1,80})\)/g, ', $1,');
  s = s.replace(/,\s*,/g, ',');
  s = s.replace(/,([.!?])/g, '$1');
  s = s.replace(/([.!?])\s*\./g, '$1');
  s = s.replace(/!\./g, '!');
  s = s.replace(/\?\./g, '?');
  s = s.replace(/\.\s*\./g, '.');
  s = s.replace(/\s+([.,!?])/g, '$1');
  s = s.replace(/([.,!?])\1+/g, '$1');
  s = s.replace(/\bSyncScript's\b/gi, 'SyncScript');
  s = s.replace(/\bSyncScripts\b/gi, 'SyncScript');
  s = s.replace(/\bSync Script\b/gi, 'SyncScript');
  s = s.replace(/\bSyncScript\b/gi, 'SyncScript');
  s = s.replace(/\s{2,}/g, ' ');
  s = s.trim();
  return s;
}

function classifySentence(text: string): SentenceKind {
  const t = text.trim();
  if (t.endsWith('!')) return 'exclamation';
  if (t.endsWith('?')) return 'question';
  return 'statement';
}

function splitToSentences(text: string): string[] {
  const parts = text.match(/[^.!?]*[.!?]+[\s]*/g);
  if (!parts) return text.trim() ? [text.trim()] : [];
  const consumed = parts.join('');
  const remainder = text.slice(consumed.length).trim();
  const out = parts.map((s) => s.trim()).filter(Boolean);
  if (remainder) out.push(remainder);
  return out;
}

/** Merge short sentences so Kokoro does not receive comically tiny clips (matches landing). */
export function buildNexusSpeechChunks(text: string): string[] {
  const sentences = splitToSentences(text);
  if (sentences.length <= 1) return sentences;

  const chunks: string[] = [];
  let buffer = '';

  const flush = () => {
    if (!buffer.trim()) return;
    chunks.push(buffer.trim());
    buffer = '';
  };

  for (let i = 0; i < sentences.length; i++) {
    const current = sentences[i].trim();
    const candidate = buffer ? `${buffer.replace(/[.!?]+$/, ',')} ${current}` : current;

    const wordCount = candidate.split(/\s+/).filter(Boolean).length;
    const tooLong = wordCount > 22 || candidate.length > 140;

    if (tooLong) {
      flush();
      buffer = current;
      continue;
    }

    buffer = candidate;
  }

  flush();
  return chunks.length ? chunks : sentences;
}

export function sentenceToNexusProsodySegment(sentence: string): NexusProsodySegment {
  const base = sanitizeForNexusTTS(sentence);
  const sanitized = /[.!?]$/.test(base) ? base : `${base}.`;
  const kind = classifySentence(sanitized);
  const { voice, speed } = PROSODY_MAP[kind];
  return { text: sanitized, kind, voice, speed };
}

/** Full reply → per-chunk segments with landing prosody. */
export function buildNexusProsodySegmentsForSpeech(fullText: string): NexusProsodySegment[] {
  const cleaned = sanitizeForNexusTTS(fullText);
  if (!cleaned.trim()) return [];
  return buildNexusSpeechChunks(cleaned).map((chunk) => sentenceToNexusProsodySegment(chunk));
}
