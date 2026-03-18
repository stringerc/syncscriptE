export interface ContractCommandResult<TData = Record<string, unknown>> {
  ok: boolean;
  commandId: string;
  errors: string[];
  warnings: string[];
  data?: TData;
}

export interface ContractCommandContext {
  workspaceId: string;
  actorType: 'human' | 'agent' | 'system';
  actorId: string;
  routeContext?: string;
}

export function commandSuccess<TData>(commandId: string, data?: TData): ContractCommandResult<TData> {
  return { ok: true, commandId, errors: [], warnings: [], data };
}

export function commandFailure(commandId: string, errors: string[]): ContractCommandResult {
  return { ok: false, commandId, errors, warnings: [] };
}
