import type { ContractEntityIdentity } from '../core/entity-contract';

export interface MissionRunContract extends ContractEntityIdentity {
  entityKind: 'mission_run';
  runId: string;
  objective: string;
  status: 'queued' | 'running' | 'waiting_approval' | 'completed' | 'failed';
  createdBy: string;
  startedAt?: string;
  completedAt?: string;
}

export interface ProofPacketContract {
  proofId: string;
  runId: string;
  generatedAt: string;
  solverType?: string;
  solverVersion?: string;
  runtimeMs?: number;
  confidence?: number;
  reproducibilityToken?: string;
  summary: string;
}

export interface ReplayVerdictContract {
  verdictId: string;
  proofId: string;
  passed: boolean;
  checkedAt: string;
  mismatchDetails?: string;
}
