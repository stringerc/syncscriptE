import type { ContractEntityIdentity } from '../core/entity-contract';

export interface ResonanceSnapshotContract extends ContractEntityIdentity {
  entityKind: 'resonance_snapshot';
  score: number;
  algorithmVersion: string;
  calculatedAt: string;
  taskInputCount: number;
  eventInputCount: number;
  energyInputCount: number;
  provenance: {
    sourceEventIds: string[];
    sourceTaskIds: string[];
  };
}

export interface ResonanceOptimizationDecisionContract {
  decisionId: string;
  snapshotId: string;
  recommendedChanges: Array<{
    entityKind: 'task' | 'event';
    entityId: string;
    changeType: 'reschedule' | 'reprioritize' | 'reassign';
    rationale: string;
  }>;
  confidence: number;
  advisoryOnly: boolean;
}
