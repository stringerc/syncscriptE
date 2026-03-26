import manifestJson from './manifest.json';
import plansFileJson from './knowledge/public-plans.json';
import factsFileJson from './knowledge/product-facts.json';
import boundariesJson from './policies/signed-in-boundaries.json';
import toolRegistryJson from './tools/registry.json';

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

/** Brain JSON is statically imported so Vercel's bundled handler always has data (fs + __dirname breaks after bundle). */
export function loadNexusBrain(): NexusBrainBundle {
  if (cache) return cache;

  const manifest = manifestJson as NexusManifest;
  const plansFile = plansFileJson as PublicPlansFile;
  const factsFile = factsFileJson as ProductFactsFile;
  const boundaries = boundariesJson as SignedInBoundariesFile;
  const toolRegistry = toolRegistryJson as ToolRegistryFile;

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
