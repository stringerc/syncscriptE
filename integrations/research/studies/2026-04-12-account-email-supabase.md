# Account email verification (Supabase Auth)

**App behavior (2026-04-12):** Settings → Account uses `supabase.auth.updateUser({ email })` for changes and `supabase.auth.resend({ type: 'signup' })` for unverified accounts. Profile API **ignores** client-supplied `email` on PUT; JWT email is source of truth.

## Supabase Dashboard (required for production)

1. **Authentication → Providers → Email**  
   - Enable **Confirm email** if new signups must verify before full access (project policy).

2. **Authentication → Email**  
   - **Secure email change** — when on, changing email sends confirmation links (recommended).

3. **Authentication → URL configuration**  
   - Add site URL: `https://www.syncscript.app`  
   - Redirect URLs: include `https://www.syncscript.app/settings` and `https://www.syncscript.app/settings?tab=account` (wildcard `https://www.syncscript.app/**` is typical).

4. **Templates**  
   - Customize “Confirm signup” / “Change email” copy if desired; links must resolve to your app.

## Verify in staging

- Create user with unconfirmed email → **Resend verification** in Settings.  
- Change email → both inboxes receive links when secure change is on.
