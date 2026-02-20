export const projectId = (import.meta.env.VITE_SUPABASE_URL || '')
  .replace('https://', '')
  .replace('.supabase.co', '')
  || 'kwhnrlzibgfedtxpkbgb';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  || `https://${projectId}.supabase.co`;

export const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3aG5ybHppYmdmZWR0eHBrYmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzk3OTMsImV4cCI6MjA3NjY1NTc5M30.vvV5Ksaq70soeLzwDr7AuXiUFPhwcRV4m78PD4qtFu8';
