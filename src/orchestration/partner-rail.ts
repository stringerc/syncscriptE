import type {
  PartnerRailAdapterContract,
  PartnerRailConnectorContract,
  PartnerRailExecutionRequest,
  PartnerRailExecutionResult,
  PartnerRailHealth,
  PartnerRailType,
} from '../contracts/domains/partner-rail-contract';

function nowIso(): string {
  return new Date().toISOString();
}

function createSimulatedAdapter(
  connectorId: string,
  railType: PartnerRailType,
  latencyMs: number,
): PartnerRailAdapterContract {
  return {
    connectorId,
    railType,
    enabled: true,
    isAvailable: () => true,
    execute: async (request: PartnerRailExecutionRequest): Promise<PartnerRailExecutionResult> => ({
      requestId: request.requestId,
      connectorId,
      railType,
      success: true,
      latencyMs,
      fallbackUsed: false,
      responseSummary: `${connectorId} ${request.action} simulated`,
      timestamp: nowIso(),
    }),
  };
}

const PARTNER_RAIL_CONNECTORS: PartnerRailConnectorContract[] = [
  {
    entityKind: 'integration_account',
    entityId: 'rail_plaid_custody',
    workspaceId: 'global',
    version: 1,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    connectorId: 'plaid-custody',
    partnerName: 'Plaid',
    railType: 'custody',
    authType: 'oauth2',
    capabilities: ['account-linking', 'tokenized-access', 'institution-coverage'],
    health: 'healthy',
    endpointBase: 'https://plaid.com',
    notes: 'Primary retail custody/linking rail.',
  },
  {
    entityKind: 'integration_account',
    entityId: 'rail_alpaca_brokerage',
    workspaceId: 'global',
    version: 1,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    connectorId: 'alpaca-brokerage',
    partnerName: 'Alpaca',
    railType: 'brokerage',
    authType: 'api_key',
    capabilities: ['paper-trading', 'order-routing', 'portfolio-state'],
    health: 'unknown',
    endpointBase: 'https://alpaca.markets',
    notes: 'Brokerage-ready adapter slot (paper first).',
  },
  {
    entityKind: 'integration_account',
    entityId: 'rail_open-execution',
    workspaceId: 'global',
    version: 1,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    connectorId: 'open-execution-sandbox',
    partnerName: 'Open Execution Sandbox',
    railType: 'execution',
    authType: 'm2m',
    capabilities: ['execution-simulation', 'post-trade-audit', 'fallback-routing'],
    health: 'healthy',
    endpointBase: 'https://execution.sandbox.syncscript.app',
    notes: 'Provider-agnostic execution fallback layer.',
  },
];

const PARTNER_RAIL_ADAPTERS: PartnerRailAdapterContract[] = [
  createSimulatedAdapter('plaid-custody', 'custody', 180),
  createSimulatedAdapter('alpaca-brokerage', 'brokerage', 230),
  createSimulatedAdapter('open-execution-sandbox', 'execution', 160),
];

export function listPartnerRailConnectors(): PartnerRailConnectorContract[] {
  return PARTNER_RAIL_CONNECTORS.map((connector) => ({ ...connector }));
}

export function listPartnerRailAdapters(): PartnerRailAdapterContract[] {
  return PARTNER_RAIL_ADAPTERS.map((adapter) => ({ ...adapter }));
}

export function resolvePartnerRailAdapter(
  railType: PartnerRailType,
  preferredConnectorId?: string,
): PartnerRailAdapterContract | null {
  const candidates = PARTNER_RAIL_ADAPTERS.filter((adapter) => adapter.enabled && adapter.railType === railType && adapter.isAvailable());
  if (!candidates.length) return null;
  if (preferredConnectorId) {
    const preferred = candidates.find((adapter) => adapter.connectorId === preferredConnectorId);
    if (preferred) return preferred;
  }
  return candidates[0];
}

export function getPartnerRailHealthSummary(): {
  total: number;
  healthy: number;
  degraded: number;
  down: number;
  unknown: number;
} {
  const toCount: Record<PartnerRailHealth, number> = {
    healthy: 0,
    degraded: 0,
    down: 0,
    unknown: 0,
  };
  for (const connector of PARTNER_RAIL_CONNECTORS) toCount[connector.health] += 1;
  return {
    total: PARTNER_RAIL_CONNECTORS.length,
    healthy: toCount.healthy,
    degraded: toCount.degraded,
    down: toCount.down,
    unknown: toCount.unknown,
  };
}
