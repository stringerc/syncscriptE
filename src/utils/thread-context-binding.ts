export const THREAD_CONTEXT_BINDING_VERSION = 'EX-031-v1';

export type ThreadContextType = 'general' | 'project' | 'goal' | 'task' | 'workstream';

export interface ThreadContextBindingInput {
  threadId: string;
  contextType: ThreadContextType;
  projectId?: string;
  goalId?: string;
  taskId?: string;
  workstreamId?: string;
}

export interface ThreadContextBindingDecision {
  allowed: boolean;
  reasonCode:
    | 'allowed'
    | 'deny_missing_thread_id'
    | 'deny_missing_context_id'
    | 'deny_multiple_context_ids'
    | 'deny_context_type_mismatch'
    | 'deny_default';
  message: string;
}

export interface ThreadContextBindingContract {
  version: string;
  threadId: string;
  contextType: ThreadContextType;
  contextId: string | null;
  bindingKey: string;
  decision: ThreadContextBindingDecision;
}

const DENY_BY_DEFAULT: ThreadContextBindingDecision = {
  allowed: false,
  reasonCode: 'deny_default',
  message: 'Thread context binding blocked by policy (deny-by-default).',
};

const CONTEXT_KEYS: Array<keyof Pick<ThreadContextBindingInput, 'projectId' | 'goalId' | 'taskId' | 'workstreamId'>> = [
  'projectId',
  'goalId',
  'taskId',
  'workstreamId',
];

function toContextId(input: ThreadContextBindingInput) {
  const provided = CONTEXT_KEYS.filter((key) => Boolean(input[key]));
  if (provided.length > 1) {
    return {
      contextId: null,
      decision: {
        allowed: false,
        reasonCode: 'deny_multiple_context_ids' as const,
        message: 'Thread context binding requires exactly one concrete context id.',
      },
    };
  }

  const contextId = provided.length === 1 ? String(input[provided[0]]) : null;
  return { contextId, decision: null };
}

export function evaluateThreadContextBinding(input: ThreadContextBindingInput): ThreadContextBindingDecision {
  if (!String(input.threadId || '').trim()) {
    return {
      allowed: false,
      reasonCode: 'deny_missing_thread_id',
      message: 'Thread context binding blocked: missing threadId.',
    };
  }

  if (input.contextType === 'general') {
    const hasSpecificId = Boolean(input.projectId || input.goalId || input.taskId || input.workstreamId);
    if (hasSpecificId) {
      return {
        allowed: false,
        reasonCode: 'deny_context_type_mismatch',
        message: 'General thread context cannot include scoped entity ids.',
      };
    }
    return {
      allowed: true,
      reasonCode: 'allowed',
      message: 'General thread context binding allowed.',
    };
  }

  const { contextId, decision } = toContextId(input);
  if (decision) return decision;
  if (!contextId) {
    return {
      allowed: false,
      reasonCode: 'deny_missing_context_id',
      message: 'Thread context binding blocked: missing scoped context id.',
    };
  }

  const expectedByType: Record<Exclude<ThreadContextType, 'general'>, string> = {
    project: String(input.projectId || ''),
    goal: String(input.goalId || ''),
    task: String(input.taskId || ''),
    workstream: String(input.workstreamId || ''),
  };
  if (!expectedByType[input.contextType]) {
    return {
      allowed: false,
      reasonCode: 'deny_context_type_mismatch',
      message: `Context type "${input.contextType}" must include its matching id field.`,
    };
  }

  return {
    allowed: true,
    reasonCode: 'allowed',
    message: 'Thread context binding allowed.',
  };
}

export function buildThreadContextBindingContract(input: ThreadContextBindingInput): ThreadContextBindingContract {
  const decision = evaluateThreadContextBinding(input);
  const { contextId } = toContextId(input);

  if (!decision.allowed) {
    return {
      version: THREAD_CONTEXT_BINDING_VERSION,
      threadId: String(input.threadId || ''),
      contextType: input.contextType,
      contextId: null,
      bindingKey: `${input.contextType}:invalid`,
      decision,
    };
  }

  const normalizedContextId = input.contextType === 'general' ? null : contextId;
  return {
    version: THREAD_CONTEXT_BINDING_VERSION,
    threadId: String(input.threadId || ''),
    contextType: input.contextType,
    contextId: normalizedContextId,
    bindingKey: `${input.contextType}:${normalizedContextId || 'global'}`,
    decision,
  };
}

export function getThreadContextBindingOrDefault(input: ThreadContextBindingInput): ThreadContextBindingContract {
  const contract = buildThreadContextBindingContract(input);
  if (contract.decision.allowed) return contract;
  return {
    ...contract,
    decision: DENY_BY_DEFAULT,
    bindingKey: 'general:invalid',
  };
}
