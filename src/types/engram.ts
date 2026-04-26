/**
 * Types for Engram agent registry responses (subset used by SyncScript).
 * Full schema: Engram OpenAPI `/openapi.json`.
 */

export interface EngramAgentRegistryRow {
  id: string;
  agent_id: string;
  supported_protocols: string[];
  capabilities: string[];
  semantic_tags: string[];
  endpoint_url: string;
  documentation_url: string | null;
  is_active: boolean;
  avg_latency: number;
  success_rate: number;
  last_seen: string | null;
  last_scraped: string | null;
}

/** Error `code` values returned as JSON from the Edge bridge (not exhaustive). */
export type EngramBridgeErrorCode =
  | "UNAUTHORIZED"
  | "SIGN_IN_REQUIRED"
  | "ENGRAM_UNCONFIGURED"
  | "ENGRAM_TOKEN_REQUIRED"
  | "ENGRAM_UPSTREAM"
  | "PAYLOAD_TOO_LARGE"
  | "INVALID_JSON"
  | "EMPTY_BODY";

export interface EngramBridgeHealth {
  success: boolean;
  engramStatus: "connected" | "degraded" | "disconnected" | "unconfigured";
  /** HTTP status from the first successful upstream probe, or last attempt. */
  httpStatus?: number;
  /** Which path succeeded (`/`, `/health`, or `/healthz`) when connected. */
  probePath?: string;
  message?: string;
  error?: string;
}

/** Request body for `POST /api/v1/translate` (matches Engram `TranslateRequest`). */
export interface EngramTranslateRequest {
  source_agent: string;
  target_agent: string;
  payload: Record<string, unknown>;
}
