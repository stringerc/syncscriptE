import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";
import { PlaidAdapter } from "./providers/plaid-adapter.ts";
import type { FinancialProviderAdapter } from "./providers/financial-provider.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const app = new Hono();

const userRateLimits = new Map<string, { count: number; resetAt: number }>();
const FINANCIAL_RATE_LIMIT_WINDOW_MS = 60_000;
const FINANCIAL_RATE_LIMIT_MAX = 40;

const adapters: Record<string, FinancialProviderAdapter> = {
  plaid: new PlaidAdapter(),
};

const DEFAULT_COVERAGE_TARGETS = [
  "Chase",
  "Bank of America",
  "Wells Fargo",
  "Citi",
  "Capital One",
  "PNC",
  "US Bank",
  "American Express",
  "Charles Schwab",
];

type CoverageStatus = "available_now" | "blocked_oauth" | "mixed_migration" | "not_found";
type CoverageRecommendation = "connect_now" | "try_non_oauth_path" | "enable_oauth_in_plaid" | "institution_not_available";
type FinancialPolicyAction = "connect_exchange" | "sync" | "disconnect" | "institution_check";
type FinancialRiskClass = "low" | "medium" | "high" | "critical";
type FinancialRecommendationState = "advisory" | "requires_approval" | "approved" | "executed" | "rolled_back";
type FinancialGovernanceRole = "owner" | "advisor" | "observer";

interface ExplainableFinancialRecommendation {
  recommendationId: string;
  title: string;
  riskClass: FinancialRiskClass;
  state: FinancialRecommendationState;
  inputsUsed: string[];
  policyApplied: string[];
  confidence: number;
  rollbackPath: string;
  generatedAt: string;
}

interface PolicyDecisionRecord {
  decisionId: string;
  userId: string;
  workspaceId?: string;
  requestedByRole?: FinancialGovernanceRole;
  action: FinancialPolicyAction;
  riskClass: FinancialRiskClass;
  requiresApproval: boolean;
  policyApplied: string[];
  approved: boolean;
  approvalToken?: string;
  createdAt: string;
  decidedAt?: string;
  reason?: string;
}

interface FinancialProofPacketRecord {
  artifactId: string;
  userId: string;
  workspaceId: string;
  generatedAt: string;
  recommendation: Record<string, unknown>;
  commandIds?: Record<string, unknown>;
  eventIds?: Record<string, unknown>;
  approval?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  storedAt: string;
  updatedAt: string;
}

function hasInternalScanAccess(c: any): boolean {
  const expectedKey = Deno.env.get("FINANCIALS_INTERNAL_SCAN_KEY");
  if (!expectedKey) {
    return false;
  }
  const incoming = c.req.header("X-Internal-Scan-Key");
  return incoming === expectedKey;
}

interface FinancialConnectionRecord {
  provider: string;
  status: "connected" | "syncing" | "error" | "disconnected";
  connectedAt?: string;
  lastSyncAt?: string;
  lastError?: string;
  accountsSynced?: number;
  transactionsSynced?: number;
  tokenVaultEnabled: boolean;
}

function financialKey(type: string, userId: string) {
  return `financial:${type}:${userId}`;
}

function idempotencyKey(userId: string, key: string) {
  return `financial:idempotency:${userId}:${key}`;
}

function policyDecisionKey(userId: string, decisionId: string) {
  return `financial:policy-decision:${userId}:${decisionId}`;
}

function policyApprovalTokenKey(userId: string, token: string) {
  return `financial:policy-approval-token:${userId}:${token}`;
}

function controlLedgerHeadKey(userId: string) {
  return `financial:control-ledger:${userId}:head`;
}

function controlLedgerEntryKey(userId: string, index: number) {
  return `financial:control-ledger:${userId}:entry:${String(index).padStart(8, "0")}`;
}

function incidentKey(userId: string, incidentId: string) {
  return `financial:incident:${userId}:${incidentId}`;
}

function disconnectRecoveryKey(userId: string, rollbackId: string) {
  return `financial:disconnect-recovery:${userId}:${rollbackId}`;
}

function proofPacketKey(userId: string, workspaceId: string, artifactId: string) {
  return `financial:proof-packet:${userId}:${workspaceId}:${artifactId}`;
}

function normalizeGovernanceRole(input: unknown): FinancialGovernanceRole | null {
  const value = String(input || "").trim().toLowerCase();
  if (value === "owner" || value === "advisor" || value === "observer") return value;
  return null;
}

function roleAllowsApproval(role: FinancialGovernanceRole): boolean {
  return role === "owner" || role === "advisor";
}

async function resolveFinancialGovernanceRole(
  user: any,
  workspaceId?: string,
): Promise<FinancialGovernanceRole> {
  const normalizedWorkspaceId = String(workspaceId || "").trim();
  if (normalizedWorkspaceId) {
    const membershipKey = `financial:governance-role:${normalizedWorkspaceId}:${user.id}`;
    const membership = await kv.get(membershipKey) as { role?: string } | null;
    const membershipRole = normalizeGovernanceRole(membership?.role);
    if (membershipRole) return membershipRole;
  }

  const appRoles = user?.app_metadata?.financialGovernanceRoles || user?.app_metadata?.financial_governance_roles;
  if (appRoles && typeof appRoles === "object") {
    if (normalizedWorkspaceId) {
      const scoped = normalizeGovernanceRole((appRoles as Record<string, unknown>)[normalizedWorkspaceId]);
      if (scoped) return scoped;
    }
    const fallback = normalizeGovernanceRole((appRoles as Record<string, unknown>).default);
    if (fallback) return fallback;
  }

  const userRole =
    normalizeGovernanceRole(user?.user_metadata?.financialGovernanceRole)
    || normalizeGovernanceRole(user?.user_metadata?.financial_governance_role)
    || normalizeGovernanceRole(user?.app_metadata?.financialGovernanceRole)
    || normalizeGovernanceRole(user?.app_metadata?.financial_governance_role);

  return userRole || "owner";
}

async function requireFinancialGovernanceRole(
  c: any,
  user: any,
  allowedRoles: FinancialGovernanceRole[],
  context: string,
  workspaceId?: string,
): Promise<{ ok: true; role: FinancialGovernanceRole } | { ok: false; response: Response }> {
  const role = await resolveFinancialGovernanceRole(user, workspaceId);
  if (!allowedRoles.includes(role)) {
    await reportFinancialIncident(
      user.id,
      "warning",
      "policy_role_denied",
      `Role ${role} denied for ${context}`,
      {
        role,
        context,
        workspaceId: workspaceId || null,
        allowedRoles,
      },
    );
    return {
      ok: false,
      response: c.json({
        error: "Forbidden",
        reason: "insufficient_financial_role",
        role,
        required: allowedRoles,
      }, 403),
    };
  }
  return { ok: true, role };
}

async function getAuthenticatedUser(c: any) {
  const accessToken = c.req.header("Authorization")?.split(" ")[1];
  if (!accessToken) {
    return null;
  }
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) {
    return null;
  }
  return user;
}

function enforceRateLimit(userId: string) {
  const now = Date.now();
  const existing = userRateLimits.get(userId);
  if (!existing || now > existing.resetAt) {
    userRateLimits.set(userId, { count: 1, resetAt: now + FINANCIAL_RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (existing.count >= FINANCIAL_RATE_LIMIT_MAX) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { allowed: true };
}

function normalizeForHash(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((entry) => normalizeForHash(entry));
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    const normalized: Record<string, unknown> = {};
    for (const key of keys) normalized[key] = normalizeForHash(record[key]);
    return normalized;
  }
  return value;
}

async function sha256Hex(payload: unknown): Promise<string> {
  const normalized = normalizeForHash(payload);
  const message = new TextEncoder().encode(JSON.stringify(normalized));
  const digest = await crypto.subtle.digest("SHA-256", message);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function appendImmutableControlEntry(
  userId: string,
  eventType: string,
  payload: Record<string, unknown>,
) {
  const now = new Date().toISOString();
  const head = (await kv.get(controlLedgerHeadKey(userId))) as { index: number; hash: string } | null;
  const nextIndex = Number(head?.index || 0) + 1;
  const prevHash = String(head?.hash || "GENESIS");
  const envelope = {
    index: nextIndex,
    prevHash,
    eventType,
    payload,
    timestamp: now,
  };
  const hash = await sha256Hex(envelope);
  await kv.set(controlLedgerEntryKey(userId, nextIndex), { ...envelope, hash });
  await kv.set(controlLedgerHeadKey(userId), { index: nextIndex, hash, updatedAt: now });
  return { index: nextIndex, hash };
}

async function reportFinancialIncident(
  userId: string,
  severity: "warning" | "critical",
  code: string,
  message: string,
  context: Record<string, unknown> = {},
) {
  const incidentId = `inc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const incident = {
    incidentId,
    userId,
    severity,
    code,
    message,
    context,
    createdAt: new Date().toISOString(),
    status: "open",
  };
  await kv.set(incidentKey(userId, incidentId), incident);
  await appendImmutableControlEntry(userId, "financial_incident", {
    severity,
    code,
    incidentId,
    context,
  });
  return incident;
}

function evaluateFinancialPolicy(action: FinancialPolicyAction): {
  riskClass: FinancialRiskClass;
  requiresApproval: boolean;
  policyApplied: string[];
} {
  switch (action) {
    case "disconnect":
      return {
        riskClass: "high",
        requiresApproval: true,
        policyApplied: [
          "policy.financial.high_risk.disconnect.requires_approval",
          "policy.financial.high_risk.disconnect.reversible_staging",
        ],
      };
    case "sync":
      return {
        riskClass: "medium",
        requiresApproval: false,
        policyApplied: ["policy.financial.medium_risk.sync.idempotent", "policy.financial.compliance.immutable_audit"],
      };
    case "connect_exchange":
      return {
        riskClass: "medium",
        requiresApproval: false,
        policyApplied: ["policy.financial.medium_risk.connect.token_vault", "policy.financial.compliance.immutable_audit"],
      };
    default:
      return {
        riskClass: "low",
        requiresApproval: false,
        policyApplied: ["policy.financial.low_risk.read_only_or_advisory"],
      };
  }
}

function assertFinancialRecommendationContract(rec: ExplainableFinancialRecommendation): string[] {
  const errors: string[] = [];
  if (!Array.isArray(rec.inputsUsed) || rec.inputsUsed.length === 0) errors.push("Recommendation missing inputsUsed");
  if (!Array.isArray(rec.policyApplied) || rec.policyApplied.length === 0) errors.push("Recommendation missing policyApplied");
  if (!Number.isFinite(rec.confidence)) errors.push("Recommendation confidence invalid");
  if (!String(rec.rollbackPath || "").trim()) errors.push("Recommendation missing rollbackPath");
  return errors;
}

function enforceFinancialRecommendationContract(rec: ExplainableFinancialRecommendation): ExplainableFinancialRecommendation {
  const errors = assertFinancialRecommendationContract(rec);
  if (errors.length > 0) {
    throw new Error(`Financial recommendation contract violation: ${errors.join(", ")}`);
  }
  return rec;
}

function getVaultKey() {
  return Deno.env.get("FINANCIAL_TOKEN_ENCRYPTION_KEY") || "";
}

async function importVaultKey(rawKey: string) {
  const encoder = new TextEncoder();
  const keyMaterial = encoder.encode(rawKey.padEnd(32, "0").slice(0, 32));
  return await crypto.subtle.importKey("raw", keyMaterial, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function encryptSecret(secret: string): Promise<string> {
  const keyValue = getVaultKey();
  if (!keyValue) {
    throw new Error("FINANCIAL_TOKEN_ENCRYPTION_KEY is not configured");
  }
  const key = await importVaultKey(keyValue);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(secret);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const bytes = new Uint8Array(encrypted);
  const ivBase64 = btoa(String.fromCharCode(...iv));
  const cipherBase64 = btoa(String.fromCharCode(...bytes));
  return `${ivBase64}.${cipherBase64}`;
}

async function decryptSecret(payload: string): Promise<string> {
  const keyValue = getVaultKey();
  if (!keyValue) {
    throw new Error("FINANCIAL_TOKEN_ENCRYPTION_KEY is not configured");
  }
  const [ivBase64, cipherBase64] = payload.split(".");
  if (!ivBase64 || !cipherBase64) {
    throw new Error("Invalid encrypted payload");
  }
  const iv = Uint8Array.from(atob(ivBase64), (c) => c.charCodeAt(0));
  const cipherBytes = Uint8Array.from(atob(cipherBase64), (c) => c.charCodeAt(0));
  const key = await importVaultKey(keyValue);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipherBytes);
  return new TextDecoder().decode(decrypted);
}

function getActiveAdapter(record?: FinancialConnectionRecord | null): FinancialProviderAdapter | null {
  if (!record?.provider) return null;
  return adapters[record.provider] || null;
}

function normalizeTransactionType(type: string): "income" | "expense" | "transfer" {
  if (type === "income" || type === "expense" || type === "transfer") return type;
  return "transfer";
}

function classifyCoverage(
  oauthMatches: any[],
  nonOauthMatches: any[],
): {
  status: CoverageStatus;
  nonOauthOnly: any[];
  mixed: any[];
} {
  const oauthById = new Set(oauthMatches.map((item: any) => item.institutionId));
  const nonOauthOnly = nonOauthMatches.filter((item: any) => !oauthById.has(item.institutionId));
  const mixed = nonOauthMatches.filter((item: any) => oauthById.has(item.institutionId));

  let status: CoverageStatus;
  if (oauthMatches.length === 0 && nonOauthMatches.length === 0) {
    status = "not_found";
  } else if (oauthMatches.length > 0 && nonOauthOnly.length === 0) {
    status = "blocked_oauth";
  } else if (oauthMatches.length > 0 && nonOauthOnly.length > 0) {
    status = "mixed_migration";
  } else {
    status = "available_now";
  }

  return { status, nonOauthOnly, mixed };
}

function buildCoverageRecommendation(status: CoverageStatus): {
  recommendation: CoverageRecommendation;
  message: string;
  nextActions: string[];
} {
  if (status === "available_now") {
    return {
      recommendation: "connect_now",
      message: "This institution should be connectable now in your current Plaid access mode.",
      nextActions: [
        "Use Connect bank account in Financials.",
        "Complete Plaid Link and run first sync.",
      ],
    };
  }

  if (status === "mixed_migration") {
    return {
      recommendation: "try_non_oauth_path",
      message: "This institution has mixed OAuth and non-OAuth surfaces; try available non-OAuth variants first.",
      nextActions: [
        "Try a non-OAuth institution variant in Plaid Link if shown.",
        "If the main path fails, enable OAuth institution access in Plaid Dashboard.",
      ],
    };
  }

  if (status === "blocked_oauth") {
    return {
      recommendation: "enable_oauth_in_plaid",
      message: "This institution appears OAuth-gated and likely requires OAuth enablement in your Plaid account.",
      nextActions: [
        "Open Plaid Dashboard > US OAuth Institutions.",
        "Request/enable this institution and retry connect after approval.",
      ],
    };
  }

  return {
    recommendation: "institution_not_available",
    message: "Institution not found for this query and product scope.",
    nextActions: [
      "Retry with a more specific institution name.",
      "Try a nearby institution alias or brand variant.",
    ],
  };
}

async function createPolicyDecisionRecord(
  userId: string,
  action: FinancialPolicyAction,
  workspaceId?: string,
  requestedByRole?: FinancialGovernanceRole,
  reason?: string,
): Promise<PolicyDecisionRecord> {
  const evaluated = evaluateFinancialPolicy(action);
  const now = new Date().toISOString();
  const decisionId = `fin-policy-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const record: PolicyDecisionRecord = {
    decisionId,
    userId,
    workspaceId: workspaceId || undefined,
    requestedByRole,
    action,
    riskClass: evaluated.riskClass,
    requiresApproval: evaluated.requiresApproval,
    policyApplied: evaluated.policyApplied,
    approved: !evaluated.requiresApproval,
    createdAt: now,
    decidedAt: !evaluated.requiresApproval ? now : undefined,
    reason,
  };
  await kv.set(policyDecisionKey(userId, decisionId), record);
  await appendImmutableControlEntry(userId, "financial_policy_decision_created", {
    decisionId,
    action,
    riskClass: record.riskClass,
    requiresApproval: record.requiresApproval,
    approved: record.approved,
  });
  return record;
}

async function assertPolicyApproval(
  userId: string,
  action: FinancialPolicyAction,
  approvalToken?: string | null,
): Promise<{ allowed: boolean; decision?: PolicyDecisionRecord; reason?: string }> {
  const evaluated = evaluateFinancialPolicy(action);
  if (!evaluated.requiresApproval) {
    return { allowed: true };
  }
  const token = String(approvalToken || "").trim();
  if (!token) {
    return { allowed: false, reason: "approval_token_required" };
  }
  const approval = (await kv.get(policyApprovalTokenKey(userId, token))) as PolicyDecisionRecord | null;
  if (!approval || !approval.approved || approval.action !== action) {
    return { allowed: false, reason: "invalid_or_expired_approval_token" };
  }
  return { allowed: true, decision: approval };
}

app.use("*", async (c, next) => {
  if (c.req.path.endsWith("/internal/providers/plaid/capability-scan") && hasInternalScanAccess(c)) {
    await next();
    return;
  }

  const user = await getAuthenticatedUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const limit = enforceRateLimit(user.id);
  if (!limit.allowed) {
    return c.json(
      { error: "Too many financial requests", retry_after: limit.retryAfterSeconds },
      429,
    );
  }

  c.set("user", user);
  await next();
});

app.post("/policy/evaluate", async (c) => {
  const user = c.get("user");
  const body = await c.req.json().catch(() => ({}));
  const action = String(body.action || "").trim() as FinancialPolicyAction;
  const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId.trim() : undefined;
  if (!["connect_exchange", "sync", "disconnect", "institution_check"].includes(action)) {
    return c.json({ error: "action is required" }, 400);
  }
  const roleGuard = await requireFinancialGovernanceRole(c, user, ["owner", "advisor", "observer"], "policy.evaluate", workspaceId);
  if (!roleGuard.ok) return roleGuard.response;
  const reason = typeof body.reason === "string" ? body.reason.trim() : undefined;
  const record = await createPolicyDecisionRecord(user.id, action, workspaceId, roleGuard.role, reason);
  return c.json({
    decisionId: record.decisionId,
    workspaceId: record.workspaceId || null,
    requestedByRole: record.requestedByRole || null,
    action: record.action,
    riskClass: record.riskClass,
    requiresApproval: record.requiresApproval,
    policyApplied: record.policyApplied,
    approved: record.approved,
    createdAt: record.createdAt,
  });
});

app.post("/policy/approve", async (c) => {
  const user = c.get("user");
  const body = await c.req.json().catch(() => ({}));
  const workspaceId = typeof body.workspaceId === "string" ? body.workspaceId.trim() : undefined;
  const roleGuard = await requireFinancialGovernanceRole(c, user, ["owner", "advisor"], "policy.approve", workspaceId);
  if (!roleGuard.ok) return roleGuard.response;
  const decisionId = String(body.decisionId || "").trim();
  if (!decisionId) return c.json({ error: "decisionId is required" }, 400);
  const decision = (await kv.get(policyDecisionKey(user.id, decisionId))) as PolicyDecisionRecord | null;
  if (!decision) return c.json({ error: "Decision not found" }, 404);
  if (decision.workspaceId && workspaceId && decision.workspaceId !== workspaceId) {
    return c.json({ error: "Decision workspace mismatch" }, 403);
  }
  if (!roleAllowsApproval(roleGuard.role)) {
    return c.json({ error: "Forbidden", reason: "approval_role_restricted" }, 403);
  }
  const now = new Date().toISOString();
  const approvalToken = `fin-approve-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const approvedRecord: PolicyDecisionRecord = {
    ...decision,
    approved: true,
    approvalToken,
    decidedAt: now,
    reason: typeof body.reason === "string" ? body.reason : decision.reason,
  };
  await kv.set(policyDecisionKey(user.id, decisionId), approvedRecord);
  await kv.set(policyApprovalTokenKey(user.id, approvalToken), approvedRecord);
  await appendImmutableControlEntry(user.id, "financial_policy_decision_approved", {
    decisionId,
    action: decision.action,
    approvalToken,
  });
  return c.json({
    decisionId,
    action: decision.action,
    approved: true,
    approvalToken,
    decidedAt: now,
  });
});

app.get("/incidents", async (c) => {
  const user = c.get("user");
  const raw = await kv.getByPrefix(`financial:incident:${user.id}:`);
  const incidents = Array.isArray(raw) ? raw : [];
  incidents.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  return c.json({
    total: incidents.length,
    open: incidents.filter((incident: any) => incident.status !== "resolved").length,
    incidents: incidents.slice(0, 100),
  });
});

app.post("/proof-packets", async (c) => {
  const user = c.get("user");
  const body = await c.req.json().catch(() => ({}));
  const workspaceId = typeof body.workspaceId === "string" && body.workspaceId.trim()
    ? body.workspaceId.trim()
    : "workspace-main";
  const roleGuard = await requireFinancialGovernanceRole(c, user, ["owner", "advisor"], "proof-packets.write", workspaceId);
  if (!roleGuard.ok) return roleGuard.response;

  const artifactId = String(body.artifactId || "").trim();
  const generatedAt = String(body.generatedAt || "").trim();
  const recommendation = body.recommendation;
  if (!artifactId || !generatedAt || !recommendation || typeof recommendation !== "object") {
    return c.json({ error: "artifactId, generatedAt, and recommendation are required" }, 400);
  }

  const now = new Date().toISOString();
  const existing = await kv.get(proofPacketKey(user.id, workspaceId, artifactId)) as FinancialProofPacketRecord | null;
  const record: FinancialProofPacketRecord = {
    artifactId,
    userId: user.id,
    workspaceId,
    generatedAt,
    recommendation: recommendation as Record<string, unknown>,
    commandIds: body.commandIds && typeof body.commandIds === "object" ? body.commandIds as Record<string, unknown> : undefined,
    eventIds: body.eventIds && typeof body.eventIds === "object" ? body.eventIds as Record<string, unknown> : undefined,
    approval: body.approval && typeof body.approval === "object" ? body.approval as Record<string, unknown> : undefined,
    metadata: body.metadata && typeof body.metadata === "object" ? body.metadata as Record<string, unknown> : undefined,
    storedAt: existing?.storedAt || now,
    updatedAt: now,
  };
  await kv.set(proofPacketKey(user.id, workspaceId, artifactId), record);
  await appendImmutableControlEntry(user.id, "financial_proof_packet_upserted", {
    artifactId,
    workspaceId,
    requestedByRole: roleGuard.role,
  });
  return c.json({ success: true, artifactId, workspaceId, storedAt: record.storedAt, updatedAt: record.updatedAt });
});

app.get("/proof-packets", async (c) => {
  const user = c.get("user");
  const workspaceId = String(c.req.query("workspaceId") || "workspace-main").trim() || "workspace-main";
  const roleGuard = await requireFinancialGovernanceRole(c, user, ["owner", "advisor", "observer"], "proof-packets.read", workspaceId);
  if (!roleGuard.ok) return roleGuard.response;
  const raw = await kv.getByPrefix(`financial:proof-packet:${user.id}:${workspaceId}:`);
  const records = (Array.isArray(raw) ? raw : []) as FinancialProofPacketRecord[];
  records.sort((a, b) => new Date(b.generatedAt || b.updatedAt || 0).getTime() - new Date(a.generatedAt || a.updatedAt || 0).getTime());
  return c.json({
    total: records.length,
    workspaceId,
    role: roleGuard.role,
    packets: records.slice(0, 100),
  });
});

app.post("/policy/rollback-disconnect", async (c) => {
  const user = c.get("user");
  const body = await c.req.json().catch(() => ({}));
  const rollbackId = String(body.rollbackId || "").trim();
  if (!rollbackId) return c.json({ error: "rollbackId is required" }, 400);
  const staged = await kv.get(disconnectRecoveryKey(user.id, rollbackId)) as any;
  if (!staged) return c.json({ error: "Rollback snapshot not found" }, 404);
  await kv.set(financialKey("connection", user.id), staged.connection || {
    provider: null,
    status: "disconnected",
    tokenVaultEnabled: Boolean(getVaultKey()),
  });
  if (staged.token) await kv.set(financialKey("token", `${user.id}:${staged.provider}`), staged.token);
  if (staged.accounts) await kv.set(financialKey("accounts", user.id), staged.accounts);
  if (staged.transactions) await kv.set(financialKey("transactions", user.id), staged.transactions);
  await appendImmutableControlEntry(user.id, "financial_disconnect_rollback_executed", {
    rollbackId,
    provider: staged.provider || null,
  });
  return c.json({
    success: true,
    rollbackId,
    restoredAt: new Date().toISOString(),
  });
});

app.get("/status", async (c) => {
  const user = c.get("user");
  const connection = await kv.get(financialKey("connection", user.id)) as FinancialConnectionRecord | null;
  const accounts = (await kv.get(financialKey("accounts", user.id)) as any[]) || [];
  const transactions = (await kv.get(financialKey("transactions", user.id)) as any[]) || [];

  return c.json({
    connected: connection?.status === "connected",
    connection: connection || {
      provider: null,
      status: "disconnected",
      tokenVaultEnabled: Boolean(getVaultKey()),
    },
    accountCount: accounts.length,
    transactionCount: transactions.length,
    isReadyForLink: Object.values(adapters).some((adapter) => adapter.isConfigured()),
  });
});

app.get("/snapshot", async (c) => {
  const user = c.get("user");
  const connection = await kv.get(financialKey("connection", user.id)) as FinancialConnectionRecord | null;
  const accounts = (await kv.get(financialKey("accounts", user.id)) as any[]) || [];
  const transactions = (await kv.get(financialKey("transactions", user.id)) as any[]) || [];
  const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const monthlyTransactions = transactions.filter((tx) => new Date(tx.occurredAt).getTime() >= monthAgo);

  const inflow = monthlyTransactions
    .filter((tx) => normalizeTransactionType(tx.type) === "income")
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const outflow = monthlyTransactions
    .filter((tx) => normalizeTransactionType(tx.type) === "expense")
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const netMonthlyCashflow = inflow - outflow;
  const totalCash = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
  const burn = Math.max(0, outflow - inflow);
  const runwayMonths = burn > 0 ? totalCash / burn : 0;

  return c.json({
    connected: connection?.status === "connected",
    connection: connection || {
      provider: null,
      status: "disconnected",
      tokenVaultEnabled: Boolean(getVaultKey()),
    },
    accounts,
    transactions,
    snapshot: {
      totalCash,
      monthlyInflow: inflow,
      monthlyOutflow: outflow,
      netMonthlyCashflow,
      runwayMonths,
      anomalyCount: 0,
    },
  });
});

app.post("/connect/create-link-token", async (c) => {
  const user = c.get("user");
  const { provider = "plaid" } = await c.req.json().catch(() => ({ provider: "plaid" }));
  const adapter = adapters[provider];

  if (!adapter) {
    return c.json({ error: "Unsupported provider" }, 400);
  }
  if (!adapter.isConfigured()) {
    return c.json({ error: `${adapter.displayName} is not configured` }, 400);
  }

  const link = await adapter.createLinkToken(user.id);
  return c.json({
    provider: adapter.id,
    displayName: adapter.displayName,
    ...link,
  });
});

app.post("/connect/exchange-public-token", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const provider = body.provider || "plaid";
  const publicToken = body.publicToken as string | undefined;
  const approvalToken = c.req.header("X-Financial-Approval-Token");

  if (!publicToken) {
    return c.json({ error: "publicToken is required" }, 400);
  }

  const policyGate = await assertPolicyApproval(user.id, "connect_exchange", approvalToken);
  if (!policyGate.allowed) {
    await reportFinancialIncident(
      user.id,
      "warning",
      "policy_denied_connect_exchange",
      "Connect token exchange was denied by policy guardrail",
      { reason: policyGate.reason || "unknown" },
    );
    return c.json({ error: "Policy approval required", reason: policyGate.reason }, 403);
  }

  const adapter = adapters[provider];
  if (!adapter) {
    return c.json({ error: "Unsupported provider" }, 400);
  }
  if (!adapter.isConfigured()) {
    return c.json({ error: `${adapter.displayName} is not configured` }, 400);
  }

  const exchanged = await adapter.exchangePublicToken(publicToken);
  const encrypted = await encryptSecret(exchanged.accessToken);
  await kv.set(financialKey("token", `${user.id}:${provider}`), {
    encrypted,
    updatedAt: new Date().toISOString(),
  });

  const record: FinancialConnectionRecord = {
    provider,
    status: "connected",
    connectedAt: new Date().toISOString(),
    lastSyncAt: undefined,
    lastError: undefined,
    accountsSynced: 0,
    transactionsSynced: 0,
    tokenVaultEnabled: Boolean(getVaultKey()),
  };
  await kv.set(financialKey("connection", user.id), record);
  await kv.set(`financial:audit:${user.id}:${Date.now()}:connected`, {
    event: "financial_connected",
    userId: user.id,
    provider,
    timestamp: new Date().toISOString(),
  });
  await appendImmutableControlEntry(user.id, "financial_connect_exchange_completed", {
    provider,
    institutionName: exchanged.institutionName || null,
    policyDecisionId: policyGate.decision?.decisionId || null,
  });

  return c.json({
    success: true,
    provider,
    institutionName: exchanged.institutionName || null,
  });
});

app.post("/sync", async (c) => {
  const user = c.get("user");
  const body = await c.req.json().catch(() => ({}));
  const providedIdempotencyKey = c.req.header("X-Idempotency-Key") || body.idempotencyKey;
  const approvalToken = c.req.header("X-Financial-Approval-Token");

  const policyGate = await assertPolicyApproval(user.id, "sync", approvalToken);
  if (!policyGate.allowed) {
    await reportFinancialIncident(
      user.id,
      "warning",
      "policy_denied_sync",
      "Financial sync denied by policy guardrail",
      { reason: policyGate.reason || "unknown" },
    );
    return c.json({ error: "Policy approval required", reason: policyGate.reason }, 403);
  }

  if (providedIdempotencyKey) {
    const existing = await kv.get(idempotencyKey(user.id, providedIdempotencyKey));
    if (existing) {
      return c.json({ success: true, deduped: true, ...(existing as Record<string, unknown>) });
    }
  }

  const connection = await kv.get(financialKey("connection", user.id)) as FinancialConnectionRecord | null;
  const adapter = getActiveAdapter(connection);

  if (!connection || !adapter) {
    return c.json({ error: "No financial provider connected" }, 400);
  }

  const tokenRecord = await kv.get(financialKey("token", `${user.id}:${connection.provider}`));
  const encryptedToken = tokenRecord?.encrypted as string | undefined;
  if (!encryptedToken) {
    return c.json({ error: "Missing encrypted financial token" }, 400);
  }

  const accessToken = await decryptSecret(encryptedToken);
  const synced = await adapter.sync(accessToken);

  const existingAccounts = (await kv.get(financialKey("accounts", user.id)) as any[]) || [];
  const existingTransactions = (await kv.get(financialKey("transactions", user.id)) as any[]) || [];

  const nextAccounts = synced.accounts.map((account) => ({
    id: `${adapter.id}:${account.providerAccountId}`,
    accountId: account.providerAccountId,
    name: account.name,
    type: account.type,
    currency: account.currency,
    balance: account.balance,
    institution: account.institution,
    mask: account.mask,
    provider: adapter.id,
  }));

  const accountMap = new Map<string, any>();
  [...existingAccounts, ...nextAccounts].forEach((account) => {
    accountMap.set(account.id, account);
  });

  const nextTransactions = synced.transactions.map((tx) => ({
    id: `${adapter.id}:${tx.providerTransactionId}`,
    transactionId: tx.providerTransactionId,
    accountId: `${adapter.id}:${tx.providerAccountId}`,
    type: tx.type,
    amount: tx.amount,
    category: tx.category,
    merchant: tx.merchant,
    description: tx.description,
    occurredAt: tx.occurredAt,
    pending: tx.pending || false,
    provider: adapter.id,
  }));

  const transactionMap = new Map<string, any>();
  [...existingTransactions, ...nextTransactions].forEach((transaction) => {
    transactionMap.set(transaction.id, transaction);
  });

  const mergedAccounts = Array.from(accountMap.values());
  const mergedTransactions = Array.from(transactionMap.values())
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, 1500);

  await kv.set(financialKey("accounts", user.id), mergedAccounts);
  await kv.set(financialKey("transactions", user.id), mergedTransactions);

  const updatedConnection: FinancialConnectionRecord = {
    ...(connection || {
      provider: adapter.id,
      status: "connected",
      connectedAt: new Date().toISOString(),
      tokenVaultEnabled: Boolean(getVaultKey()),
    }),
    status: "connected",
    lastSyncAt: new Date().toISOString(),
    lastError: undefined,
    accountsSynced: mergedAccounts.length,
    transactionsSynced: mergedTransactions.length,
    tokenVaultEnabled: Boolean(getVaultKey()),
  };
  await kv.set(financialKey("connection", user.id), updatedConnection);

  const payload = {
    success: true,
    syncedAccounts: mergedAccounts.length,
    syncedTransactions: mergedTransactions.length,
    provider: adapter.id,
    lastSyncAt: updatedConnection.lastSyncAt,
  };

  if (providedIdempotencyKey) {
    await kv.set(idempotencyKey(user.id, providedIdempotencyKey), payload);
  }

  await kv.set(`financial:audit:${user.id}:${Date.now()}:sync`, {
    event: "financial_sync",
    userId: user.id,
    provider: adapter.id,
    accounts: mergedAccounts.length,
    transactions: mergedTransactions.length,
    timestamp: new Date().toISOString(),
  });
  await appendImmutableControlEntry(user.id, "financial_sync_completed", {
    provider: adapter.id,
    syncedAccounts: mergedAccounts.length,
    syncedTransactions: mergedTransactions.length,
    idempotencyKey: providedIdempotencyKey || null,
  });

  return c.json(payload);
});

app.post("/disconnect", async (c) => {
  const user = c.get("user");
  const approvalToken = c.req.header("X-Financial-Approval-Token");
  const policyGate = await assertPolicyApproval(user.id, "disconnect", approvalToken);
  if (!policyGate.allowed) {
    await reportFinancialIncident(
      user.id,
      "critical",
      "policy_denied_disconnect",
      "Disconnect denied: high-risk financial action requires explicit approval token",
      { reason: policyGate.reason || "unknown" },
    );
    return c.json({
      error: "Policy approval required for disconnect",
      reason: policyGate.reason,
      action: "disconnect",
    }, 403);
  }

  const connection = await kv.get(financialKey("connection", user.id)) as FinancialConnectionRecord | null;
  if (!connection) {
    return c.json({ success: true, alreadyDisconnected: true });
  }

  const rollbackId = `rollback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const [token, accounts, transactions] = await Promise.all([
    kv.get(financialKey("token", `${user.id}:${connection.provider}`)),
    kv.get(financialKey("accounts", user.id)),
    kv.get(financialKey("transactions", user.id)),
  ]);
  await kv.set(disconnectRecoveryKey(user.id, rollbackId), {
    rollbackId,
    provider: connection.provider,
    token,
    accounts,
    transactions,
    connection,
    stagedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  });

  await kv.del(financialKey("token", `${user.id}:${connection.provider}`));
  await kv.del(financialKey("accounts", user.id));
  await kv.del(financialKey("transactions", user.id));
  await kv.set(financialKey("connection", user.id), {
    provider: null,
    status: "disconnected",
    tokenVaultEnabled: Boolean(getVaultKey()),
  });
  await kv.set(`financial:audit:${user.id}:${Date.now()}:disconnected`, {
    event: "financial_disconnected",
    userId: user.id,
    provider: connection.provider,
    timestamp: new Date().toISOString(),
  });
  await appendImmutableControlEntry(user.id, "financial_disconnect_completed", {
    provider: connection.provider,
    rollbackId,
    policyDecisionId: policyGate.decision?.decisionId || null,
  });

  return c.json({ success: true, rollbackId });
});

app.post("/providers/plaid/institution-check", async (c) => {
  const user = c.get("user");
  const body = await c.req.json().catch(() => ({}));
  const plaidAdapter = adapters.plaid as PlaidAdapter;

  if (!plaidAdapter || !plaidAdapter.isConfigured()) {
    return c.json({ error: "Plaid is not configured" }, 400);
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query) {
    return c.json({ error: "query is required" }, 400);
  }

  const countryCodes = Array.isArray(body.countryCodes) && body.countryCodes.length > 0
    ? body.countryCodes.filter((value: unknown) => typeof value === "string").map((value: string) => value.toUpperCase())
    : ["US"];
  const product = typeof body.product === "string" && body.product.trim() ? body.product.trim() : "transactions";

  const [oauthMatches, nonOauthMatches] = await Promise.all([
    plaidAdapter.searchInstitutions({
      query,
      countryCodes,
      product,
      oauthOnly: true,
      limit: 8,
    }),
    plaidAdapter.searchInstitutions({
      query,
      countryCodes,
      product,
      oauthOnly: false,
      limit: 8,
    }),
  ]);

  const coverage = classifyCoverage(oauthMatches, nonOauthMatches);
  const advisor = buildCoverageRecommendation(coverage.status);
  const explainableRecommendation = enforceFinancialRecommendationContract({
    recommendationId: `fin-cover-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: `Plaid institution coverage check for ${query}`,
    riskClass:
      coverage.status === "blocked_oauth"
        ? "high"
        : coverage.status === "mixed_migration"
          ? "medium"
          : "low",
    state: "advisory",
    inputsUsed: [
      `query:${query}`,
      `product:${product}`,
      `countryCodes:${countryCodes.join(",")}`,
      `oauthMatches:${oauthMatches.length}`,
      `nonOauthMatches:${nonOauthMatches.length}`,
      `coverageStatus:${coverage.status}`,
    ],
    policyApplied: ["policy.financial.coverage.advisory.explainable"],
    confidence:
      coverage.status === "not_found"
        ? 65
        : coverage.status === "mixed_migration"
          ? 78
          : 90,
    rollbackPath: `rollback://financial-institution-check/${encodeURIComponent(query)}?advisory=true`,
    generatedAt: new Date().toISOString(),
  });
  await appendImmutableControlEntry(user.id, "financial_institution_check_advisory", {
    query,
    status: coverage.status,
    recommendationId: explainableRecommendation.recommendationId,
  });
  return c.json({
    query,
    status: coverage.status,
    recommendation: advisor.recommendation,
    explainableRecommendation,
    message: advisor.message,
    nextActions: advisor.nextActions,
    oauthMatches,
    nonOauthOnly: coverage.nonOauthOnly,
    mixed: coverage.mixed,
    guidance: {
      available_now: "Connection is available now under the current Plaid access mode.",
      blocked_oauth: "This institution appears to require OAuth support and is likely blocked until full OAuth production approval.",
      mixed_migration: "Institution appears in both OAuth and non-OAuth surfaces; availability can vary by account path and migration state.",
      not_found: "Institution was not found for this country/product combination.",
    },
  });
});

app.post("/internal/providers/plaid/capability-scan", async (c) => {
  if (!hasInternalScanAccess(c)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const body = await c.req.json().catch(() => ({}));
  const plaidAdapter = adapters.plaid as PlaidAdapter;

  if (!plaidAdapter || !plaidAdapter.isConfigured()) {
    return c.json({ error: "Plaid is not configured" }, 400);
  }

  const targets = Array.isArray(body.targets) && body.targets.length > 0
    ? body.targets.filter((value: unknown) => typeof value === "string" && value.trim().length > 0)
    : DEFAULT_COVERAGE_TARGETS;

  const countryCodes = Array.isArray(body.countryCodes) && body.countryCodes.length > 0
    ? body.countryCodes.filter((value: unknown) => typeof value === "string").map((value: string) => value.toUpperCase())
    : ["US"];
  const product = typeof body.product === "string" && body.product.trim() ? body.product.trim() : "transactions";

  const perInstitution = await Promise.all(
    targets.map(async (target: string) => {
      const [oauthMatches, nonOauthMatches] = await Promise.all([
        plaidAdapter.searchInstitutions({
          query: target,
          countryCodes,
          product,
          oauthOnly: true,
          limit: 5,
        }),
        plaidAdapter.searchInstitutions({
          query: target,
          countryCodes,
          product,
          oauthOnly: false,
          limit: 5,
        }),
      ]);

      const coverage = classifyCoverage(oauthMatches, nonOauthMatches);

      return {
        target,
        status: coverage.status,
        oauthMatches,
        nonOauthOnly: coverage.nonOauthOnly,
        mixed: coverage.mixed,
      };
    }),
  );

  const blocked = perInstitution.filter((item) => item.status === "blocked_oauth");
  const availableNow = perInstitution.filter((item) => item.status === "available_now");
  const mixedMigration = perInstitution.filter((item) => item.status === "mixed_migration");
  const notFound = perInstitution.filter((item) => item.status === "not_found");

  return c.json({
    provider: "plaid",
    scanContext: {
      countryCodes,
      product,
      targetsCount: targets.length,
      scannedAt: new Date().toISOString(),
    },
    summary: {
      blockedOauthCount: blocked.length,
      availableNowCount: availableNow.length,
      mixedMigrationCount: mixedMigration.length,
      notFoundCount: notFound.length,
    },
    blocked,
    availableNow,
    mixedMigration,
    notFound,
    guidance: {
      limitedProduction: "OAuth-required institutions are typically blocked or constrained under limited production access.",
      fullOAuth: "Full OAuth access unlocks OAuth-required institutions and generally improves uptime/re-auth reliability.",
    },
  });
});

export default app;
