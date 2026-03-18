export type ResponseCardKind = 'plan' | 'options' | 'risk' | 'impact' | 'nextStep';

export interface ResponseContractCard {
  kind: ResponseCardKind;
  title: string;
  body: string;
}

export function sanitizeAssistantContent(raw: string): string {
  return String(raw || '')
    .replace(/^Route this request in SyncScript context:[^\n]*\n?/gim, '')
    .replace(/^Agent routing decision:[^\n]*\n?/gim, '')
    .trim();
}

function pickLinesByPattern(lines: string[], pattern: RegExp, fallbackCount = 0): string[] {
  const matches = lines.filter((line) => pattern.test(line));
  if (matches.length > 0) return matches;
  return fallbackCount > 0 ? lines.slice(0, fallbackCount) : [];
}

export function buildResponseContractCards(text: string): ResponseContractCard[] {
  const cleaned = sanitizeAssistantContent(text);
  const lines = cleaned
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const planLines = pickLinesByPattern(lines, /\b(plan|approach|strategy)\b/i, 1);
  const optionLines = pickLinesByPattern(lines, /^\d+[\).\s]|^- /i).slice(0, 3);
  const riskLines = pickLinesByPattern(lines, /\b(risk|blocker|warning|constraint)\b/i, 2);
  const impactLines = pickLinesByPattern(lines, /\b(impact|outcome|result|benefit)\b/i, 2);
  const nextLines = pickLinesByPattern(lines, /\b(next|do this|start with|first step|action)\b/i, 1);

  const cards: ResponseContractCard[] = [];
  if (planLines.length) {
    cards.push({ kind: 'plan', title: 'Plan', body: planLines.slice(0, 2).join(' ') });
  }
  if (optionLines.length) {
    cards.push({ kind: 'options', title: 'Options', body: optionLines.slice(0, 3).join('\n') });
  }
  if (riskLines.length) {
    cards.push({ kind: 'risk', title: 'Risk', body: riskLines.slice(0, 2).join(' ') });
  }
  if (impactLines.length) {
    cards.push({ kind: 'impact', title: 'Impact', body: impactLines.slice(0, 2).join(' ') });
  }
  if (nextLines.length) {
    cards.push({ kind: 'nextStep', title: 'Next step', body: nextLines[0] });
  }

  return cards.slice(0, 5);
}
