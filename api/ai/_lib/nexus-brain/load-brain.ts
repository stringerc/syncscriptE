import { readFileSync } from 'fs';
import { join } from 'path';

export type PublicPlan = {
  name: string;
  price: number;
  priceAnnual?: number;
};

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

let cache: NexusBrainBundle | null = null;

function readBrainJson<T>(...segments: string[]): T {
  const base = join(__dirname, ...segments);
  return JSON.parse(readFileSync(base, 'utf8')) as T;
}

/** Load versioned Nexus brain from JSON on disk (cached per lambda cold start). */
export function loadNexusBrain(): NexusBrainBundle {
  if (cache) return cache;

  const manifest = readBrainJson<NexusManifest>('manifest.json');
  const plansFile = readBrainJson<PublicPlansFile>('knowledge', 'public-plans.json');
  const factsFile = readBrainJson<ProductFactsFile>('knowledge', 'product-facts.json');
  const boundaries = readBrainJson<SignedInBoundariesFile>('policies', 'signed-in-boundaries.json');
  const toolRegistry = readBrainJson<ToolRegistryFile>('tools', 'registry.json');

  const productFactsText = factsFile.facts.map((f) => `- (${f.id}) ${f.text}`).join('\n');

  cache = {
    manifest,
    publicPlans: plansFile.plans,
    trialDays: plansFile.trialDays,
    productFactsText,
    signedInPolicyId: boundaries.id,
    signedInAppendix: boundaries.appendix,
    toolRegistry,
  };

  return cache;
}

export function getBrainVersion(): string {
  return loadNexusBrain().manifest.version;
}

/** For tests / Mission Control: public metadata only. */
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
