import type { ContractEntityIdentity } from '../core/entity-contract';

export type PartnerRailType = 'custody' | 'brokerage' | 'execution';
export type PartnerRailAuthType = 'oauth2' | 'api_key' | 'm2m';
export type PartnerRailHealth = 'healthy' | 'degraded' | 'down' | 'unknown';

export interface PartnerRailConnectorContract extends ContractEntityIdentity {
  entityKind: 'integration_account';
  connectorId: string;
  partnerName: string;
  railType: PartnerRailType;
  authType: PartnerRailAuthType;
  capabilities: string[];
  health: PartnerRailHealth;
  endpointBase?: string;
  notes?: string;
}

export interface PartnerRailExecutionRequest {
  requestId: string;
  workspaceId: string;
  railType: PartnerRailType;
  connectorId: string;
  action: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface PartnerRailExecutionResult {
  requestId: string;
  connectorId: string;
  railType: PartnerRailType;
  success: boolean;
  latencyMs: number;
  fallbackUsed: boolean;
  responseSummary: string;
  timestamp: string;
}

export interface PartnerRailAdapterContract {
  connectorId: string;
  railType: PartnerRailType;
  enabled: boolean;
  isAvailable: () => boolean;
  execute: (request: PartnerRailExecutionRequest) => Promise<PartnerRailExecutionResult>;
}
