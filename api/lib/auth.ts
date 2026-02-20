import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || `https://${process.env.SUPABASE_PROJECT_ID || 'kwhnrlzibgfedtxpkbgb'}.supabase.co`;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

/**
 * Validates the Authorization header contains a valid Supabase JWT or the anon key.
 * Returns the user if authenticated, or sends a 401 response.
 */
export async function validateAuth(req: VercelRequest, res: VercelResponse): Promise<boolean> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Missing or invalid Authorization header' });
    return false;
  }

  const token = authHeader.replace('Bearer ', '');

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    res.status(503).json({ success: false, error: 'Authentication service unavailable' });
    return false;
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      // Allow anon key through for guest mode, but validate it matches
      if (token === SUPABASE_ANON_KEY) {
        return true;
      }
      res.status(401).json({ success: false, error: 'Invalid or expired token' });
      return false;
    }

    return true;
  } catch {
    res.status(401).json({ success: false, error: 'Authentication failed' });
    return false;
  }
}
