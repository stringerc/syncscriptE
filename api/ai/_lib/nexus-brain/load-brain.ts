/**
 * Nexus brain bundle — inlined so Vercel serverless never depends on JSON file paths
 * (bundled __dirname / require('.json') often breaks; static JSON imports can too).
 *
 * When you edit knowledge/*.json or manifest.json, mirror changes here (or add a sync script).
 */

import type { PublicPlan } from './load-brain.types';

export type { PublicPlan } from './load-brain.types';

export type NexusManifest = {
  brainId: string;
  version: string;
  schema: number;
  description?: string;
};

export type PublicPlansFile = {
  trialDays: number;
  plans: PublicPlan[];
  currencyNote?: string;
};

export type ProductFactsFile = {
  facts: { id: string; text: string }[];
};

export type SignedInBoundariesFile = {
  id: string;
  appendix: string;
};

export type ToolRegistryFile = {
  schema: number;
  tools: {
    id: string;
    title: string;
    description?: string;
    riskClass: string;
    inputSchema: Record<string, unknown>;
  }[];
};

export type NexusBrainBundle = {
  manifest: NexusManifest;
  publicPlans: PublicPlan[];
  trialDays: number;
  productFactsText: string;
  signedInPolicyId: string;
  signedInAppendix: string;
  toolRegistry: ToolRegistryFile;
};

const EMBEDDED_MANIFEST: NexusManifest = {
  brainId: 'syncscript-nexus',
  version: '2025-03-25.1',
  schema: 1,
  description:
    'Versioned shared knowledge and policy pointers for Nexus guest + user surfaces. Mission Control can sync this directory as the source of truth.',
};

const EMBEDDED_PLANS: PublicPlansFile = {
  trialDays: 14,
  currencyNote: 'USD amounts as spoken on voice: spell out naturally in prompts.',
  plans: [
    { name: 'Free', price: 0 },
    { name: 'Starter', price: 19, priceAnnual: 15 },
    { name: 'Professional', price: 49, priceAnnual: 39 },
    { name: 'Enterprise', price: 99, priceAnnual: 79 },
  ],
};

const EMBEDDED_FACTS: ProductFactsFile = {
  facts: [
    {
      id: 'syncscript-elevator',
      text: 'SyncScript is AI-powered productivity that works with your natural energy rhythms and schedules harder work during peak hours.',
    },
    {
      id: 'key-features',
      text: 'Key features include energy-aware scheduling, voice-first Nexus assistant, tasks, calendar intelligence, team collaboration, gamification, Google Calendar and Slack integrations.',
    },
    {
      id: 'support-contact',
      text: 'For issues or bugs, direct users to support at syncscript dot app.',
    },
  ],
};

const EMBEDDED_BOUNDARIES: SignedInBoundariesFile = {
  id: 'signed-in-boundaries-v1',
  appendix:
    'SHARED NEXUS POLICY (brain-signed-in-boundaries-v1): Never claim access to user data that is not explicitly present in PRIVATE CONTEXT. Never invent specific calendar events, tasks, or account state. Never ask for passwords, full payment card numbers, or government ID. If context is missing, ask one concise clarifying question or give general guidance. Prefer actionable steps over speculation.',
};

const EMBEDDED_TOOL_REGISTRY: ToolRegistryFile = {
  schema: 1,
  tools: [
    {
      id: 'calendar.read_range',
      title: 'Read calendar in range',
      description:
        'Future: server-executed read of user calendar with OAuth scope. Nexus proposes; backend validates and executes.',
      riskClass: 'low',
      inputSchema: {
        type: 'object',
        properties: {
          startIso: { type: 'string' },
          endIso: { type: 'string' },
        },
        required: ['startIso', 'endIso'],
      },
    },
    {
      id: 'tasks.create',
      title: 'Create task',
      description:
        'Future: create task with title, due, project id. Requires user confirmation for high-risk workspaces.',
      riskClass: 'medium',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          dueIso: { type: 'string' },
        },
        required: ['title'],
      },
    },
    {
      id: 'nexus.get_public_pricing',
      title: 'Canonical public pricing',
      description:
        'Deterministic path: pricing strings are served from nexus-brain knowledge without LLM for matched intents (guest surface).',
      riskClass: 'low',
      inputSchema: { type: 'object', properties: {} },
    },
  ],
};

let cache: NexusBrainBundle | null = null;

export function loadNexusBrain(): NexusBrainBundle {
  if (cache) return cache;

  const productFactsText = EMBEDDED_FACTS.facts.map((f) => `- (${f.id}) ${f.text}`).join('\n');

  cache = {
    manifest: EMBEDDED_MANIFEST,
    publicPlans: EMBEDDED_PLANS.plans,
    trialDays: EMBEDDED_PLANS.trialDays,
    productFactsText,
    signedInPolicyId: EMBEDDED_BOUNDARIES.id,
    signedInAppendix: EMBEDDED_BOUNDARIES.appendix,
    toolRegistry: EMBEDDED_TOOL_REGISTRY,
  };

  return cache;
}

export function getBrainVersion(): string {
  return loadNexusBrain().manifest.version;
}

export function getBrainPublicMetadata() {
  const b = loadNexusBrain();
  return {
    brainId: b.manifest.brainId,
    version: b.manifest.version,
    schema: b.manifest.schema,
    trialDays: b.trialDays,
    planNames: b.publicPlans.map((p) => p.name),
    toolIds: b.toolRegistry.tools.map((t) => t.id),
    policyIds: [b.signedInPolicyId],
  };
}
