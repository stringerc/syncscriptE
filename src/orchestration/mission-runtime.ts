import type {
  BudgetCaps,
  Mission,
  MissionNode,
  MissionStatus,
  RiskClass,
  StopCondition,
  SuccessCheck,
} from './types';

export interface MissionCompileInput {
  userId: string;
  workspaceId: string;
  title: string;
  objective: string;
  command: string;
}

export interface MissionAdvanceInput {
  mission: Mission;
  nodeId: string;
  nextStatus: MissionNode['status'];
  output?: MissionNode['output'];
}

function nowIso(): string {
  return new Date().toISOString();
}

function inferRiskFromText(text: string): RiskClass {
  const normalized = text.toLowerCase();
  if (
    normalized.includes('deploy') ||
    normalized.includes('production') ||
    normalized.includes('payment') ||
    normalized.includes('delete')
  ) {
    return 'high';
  }
  if (
    normalized.includes('write') ||
    normalized.includes('commit') ||
    normalized.includes('mutate') ||
    normalized.includes('install')
  ) {
    return 'medium';
  }
  return 'low';
}

function shouldAttachOptimizationNode(command: string): boolean {
  const normalized = command.toLowerCase();
  return (
    normalized.includes('optimiz') ||
    normalized.includes('schedule') ||
    normalized.includes('assignment') ||
    normalized.includes('planner')
  );
}

function defaultBudget(): BudgetCaps {
  return {
    maxRuntimeMinutes: 240,
    maxActions: 80,
    maxSpendUsd: 25,
  };
}

function defaultSuccessChecks(title: string): SuccessCheck[] {
  return [
    {
      id: `chk_${crypto.randomUUID().slice(0, 8)}`,
      label: `${title} produces verifiable artifacts`,
      required: true,
      method: 'artifact',
    },
    {
      id: `chk_${crypto.randomUUID().slice(0, 8)}`,
      label: `${title} passes baseline test checks`,
      required: true,
      method: 'test',
    },
  ];
}

function defaultStopConditions(): StopCondition[] {
  return [
    { id: `stop_${crypto.randomUUID().slice(0, 8)}`, label: 'Budget exhausted', trigger: 'budget' },
    { id: `stop_${crypto.randomUUID().slice(0, 8)}`, label: 'Manual emergency stop', trigger: 'manual_kill' },
    { id: `stop_${crypto.randomUUID().slice(0, 8)}`, label: 'Security policy violation', trigger: 'security_policy' },
  ];
}

export function compileMissionFromCommand(input: MissionCompileInput): Mission {
  const createdAt = nowIso();
  const commandRisk = inferRiskFromText(input.command);
  const coreNodes: MissionNode[] = [
    {
      id: `node_${crypto.randomUUID().slice(0, 10)}`,
      title: 'Mission planning and decomposition',
      kind: 'plan',
      status: 'pending',
      riskClass: 'low',
      executionRail: 'safe_auto',
      dependsOn: [],
      approvalRequired: false,
    },
    {
      id: `node_${crypto.randomUUID().slice(0, 10)}`,
      title: 'Execution run on trusted executor',
      kind: 'code',
      status: 'pending',
      riskClass: commandRisk === 'high' ? 'medium' : commandRisk,
      executionRail: commandRisk === 'low' ? 'safe_auto' : 'guarded',
      dependsOn: [],
      approvalRequired: commandRisk !== 'low',
    },
    {
      id: `node_${crypto.randomUUID().slice(0, 10)}`,
      title: 'Artifact and proof bundle',
      kind: 'review',
      status: 'pending',
      riskClass: 'low',
      executionRail: 'safe_auto',
      dependsOn: [],
      approvalRequired: false,
    },
  ];
  if (shouldAttachOptimizationNode(input.command)) {
    coreNodes.splice(1, 0, {
      id: `node_${crypto.randomUUID().slice(0, 10)}`,
      title: 'Optimization rail execution (classical default + optional shadow)',
      kind: 'optimize',
      status: 'pending',
      riskClass: commandRisk === 'high' ? 'medium' : 'low',
      executionRail: commandRisk === 'high' ? 'guarded' : 'safe_auto',
      dependsOn: [],
      approvalRequired: commandRisk === 'high',
      output: {
        solverType: 'classical-local',
        solverVersion: 'baseline-v1',
      },
    });
  }
  for (let index = 1; index < coreNodes.length; index += 1) {
    coreNodes[index].dependsOn = [coreNodes[index - 1].id];
  }

  return {
    id: `mission_${crypto.randomUUID()}`,
    userId: input.userId,
    workspaceId: input.workspaceId,
    title: input.title,
    objective: input.objective,
    status: 'queued',
    createdAt,
    updatedAt: createdAt,
    budget: defaultBudget(),
    successChecks: defaultSuccessChecks(input.title),
    stopConditions: defaultStopConditions(),
    nodes: coreNodes,
    metadata: {
      source: 'mission-runtime',
      command: input.command,
    },
  };
}

export function recomputeMissionStatus(mission: Mission): MissionStatus {
  if (mission.nodes.some((node) => node.status === 'failed')) return 'failed';
  if (mission.nodes.every((node) => node.status === 'completed')) return 'completed';
  if (mission.nodes.some((node) => node.status === 'running')) return 'running';
  if (mission.nodes.some((node) => node.status === 'blocked')) return 'waiting_approval';
  if (mission.status === 'paused') return 'paused';
  return 'queued';
}

export function advanceMissionNode(input: MissionAdvanceInput): Mission {
  const updatedNodes = input.mission.nodes.map((node) => {
    if (node.id !== input.nodeId) return node;
    const replayFailed =
      node.kind === 'optimize' &&
      input.nextStatus === 'completed' &&
      typeof input.output?.replayPassed === 'boolean' &&
      input.output.replayPassed === false;
    const nextStatus = replayFailed ? 'blocked' : input.nextStatus;
    const startedAt = node.startedAt || nowIso();
    const completedAt = nextStatus === 'completed' || nextStatus === 'failed' ? nowIso() : undefined;
    return {
      ...node,
      status: nextStatus,
      startedAt,
      completedAt,
      output: input.output ? { ...(node.output || {}), ...input.output } : node.output,
    };
  });
  const nextMission: Mission = {
    ...input.mission,
    nodes: updatedNodes,
    updatedAt: nowIso(),
  };
  nextMission.status = recomputeMissionStatus(nextMission);
  return nextMission;
}
