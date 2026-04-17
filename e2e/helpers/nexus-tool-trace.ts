/** Parsed `/api/ai/nexus-user` JSON tool trace. */
export type ToolTraceEntry = { tool?: string; ok?: boolean; error?: string; detail?: unknown };

export function parseToolTrace(body: unknown): ToolTraceEntry[] {
  if (!body || typeof body !== 'object') return [];
  const t = (body as { toolTrace?: unknown }).toolTrace;
  return Array.isArray(t) ? (t as ToolTraceEntry[]) : [];
}

export function hasToolOk(trace: ToolTraceEntry[], tool: string): boolean {
  return trace.some((t) => t?.tool === tool && t?.ok === true);
}

export function hasToolCalled(trace: ToolTraceEntry[], tool: string): boolean {
  return trace.some((t) => t?.tool === tool);
}
