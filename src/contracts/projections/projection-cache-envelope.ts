export interface ProjectionCacheEnvelope<TPayload> {
  projectionVersion: number;
  sourceEventCursor: string;
  generatedAt: string;
  payload: TPayload;
}

export function nextProjectionCursor(prefix = 'projection'): string {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

export function readProjectionEnvelope<TPayload>(
  raw: string | null,
  isPayload: (value: unknown) => value is TPayload,
  legacyCursorPrefix = 'legacy',
): ProjectionCacheEnvelope<TPayload> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as any;
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.projectionVersion === 'number' &&
      typeof parsed.sourceEventCursor === 'string' &&
      typeof parsed.generatedAt === 'string' &&
      isPayload(parsed.payload)
    ) {
      return parsed as ProjectionCacheEnvelope<TPayload>;
    }
    if (isPayload(parsed)) {
      return {
        projectionVersion: 1,
        sourceEventCursor: nextProjectionCursor(legacyCursorPrefix),
        generatedAt: new Date().toISOString(),
        payload: parsed,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function writeProjectionEnvelope<TPayload>(
  payload: TPayload,
  options?: {
    projectionVersion?: number;
    sourceEventCursor?: string;
  },
): ProjectionCacheEnvelope<TPayload> {
  return {
    projectionVersion: options?.projectionVersion ?? 1,
    sourceEventCursor: options?.sourceEventCursor || nextProjectionCursor('projection'),
    generatedAt: new Date().toISOString(),
    payload,
  };
}
