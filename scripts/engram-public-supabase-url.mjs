/**
 * Public Supabase project URL + anon key when env vars are unset (see src/utils/supabase/info.tsx).
 * Safe to commit — same fallbacks as the client bundle; anon key is public by design.
 */
export const PUBLIC_SUPABASE_PROJECT_URL = "https://kwhnrlzibgfedtxpkbgb.supabase.co";

/** @type {string} */
export const PUBLIC_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3aG5ybHppYmdmZWR0eHBrYmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzk3OTMsImV4cCI6MjA3NjY1NTc5M30.vvV5Ksaq70soeLzwDr7AuXiUFPhwcRV4m78PD4qtFu8";
