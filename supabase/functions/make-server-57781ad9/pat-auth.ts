/**
 * Shared JWT + Cursor PAT (sspat_) resolution for Edge routes.
 * PAT rows live in public.user_api_tokens; scopes gate MCP / automation surfaces.
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js";

export type AuthCtx = {
  userId: string;
  email?: string | null;
  /** Present when authenticated via PAT */
  patScopes?: string[] | null;
};

export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function hasScope(ctx: AuthCtx, need: string): boolean {
  if (!ctx.patScopes || ctx.patScopes.length === 0) return true;
  return ctx.patScopes.includes(need);
}

export async function requireJwtOrPat(
  c: { req: { header: (n: string) => string | undefined } },
  supabase: SupabaseClient,
): Promise<AuthCtx | null> {
  const accessToken = c.req.header("Authorization")?.split(" ")?.[1];
  if (!accessToken) return null;
  if (accessToken.startsWith("eyJ")) {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (error || !user?.id) return null;
    return { userId: user.id, email: user.email };
  }
  if (accessToken.startsWith("sspat_")) {
    const hash = await sha256Hex(accessToken);
    const { data, error } = await supabase
      .from("user_api_tokens")
      .select("user_id, scopes, id")
      .eq("token_hash", hash)
      .maybeSingle();
    if (error || !data?.user_id) return null;
    await supabase.from("user_api_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);
    return { userId: String(data.user_id), patScopes: Array.isArray(data.scopes) ? data.scopes as string[] : [] };
  }
  return null;
}

/** JWT only — PAT cannot mint PATs or read friend feed with PAT-only semantics */
export async function requireJwtOnly(
  c: { req: { header: (n: string) => string | undefined } },
  supabase: SupabaseClient,
): Promise<AuthCtx | null> {
  const accessToken = c.req.header("Authorization")?.split(" ")?.[1];
  if (!accessToken || !accessToken.startsWith("eyJ")) return null;
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user?.id) return null;
  return { userId: user.id, email: user.email };
}
