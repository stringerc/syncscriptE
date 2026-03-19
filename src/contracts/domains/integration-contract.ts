import type { ContractEntityIdentity } from '../core/entity-contract';

export type IntegrationConnectionHealth = 'healthy' | 'expiring' | 'error' | 'disconnected';
export type IntegrationAuthType = 'oauth2' | 'api_key' | 'none';

export interface IntegrationAccountContract extends ContractEntityIdentity {
  entityKind: 'integration_account';
  connectorId: string;
  connectorName: string;
  provider: 'native' | 'universal' | 'community' | string;
  authType: IntegrationAuthType;
  scopes: string[];
  health: IntegrationConnectionHealth;
  accountLabel: string;
  connectedAt: string;
  expiresAt?: string;
}

export interface IntegrationBindingContract extends ContractEntityIdentity {
  entityKind: 'integration_binding';
  connectorId: string;
  accountId?: string;
  boundEntityKind: 'task' | 'goal' | 'event' | 'milestone' | 'step';
  boundEntityId: string;
  mode: 'simple' | 'advanced';
  status: 'connected' | 'pending' | 'error';
}
