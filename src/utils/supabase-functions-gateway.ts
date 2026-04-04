/**
 * Supabase Edge Functions HTTP API expects `Authorization` + `apikey` on fetch (browser or server).
 * The anon key is public (same as supabase-js); pass the user's access token in `Authorization`
 * after spreading these headers when the route requires a signed-in user.
 */
import { publicAnonKey } from './supabase/info';

export function supabaseFunctionsGatewayHeaders(
  extra: Record<string, string> = {},
): Record<string, string> {
  return {
    Authorization: `Bearer ${publicAnonKey}`,
    apikey: publicAnonKey,
    ...extra,
  };
}
