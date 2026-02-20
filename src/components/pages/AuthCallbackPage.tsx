import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase/client';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

/**
 * OAuth Callback Page
 *
 * Handles two auth flows:
 * 1. Supabase native OAuth (tokens in URL hash — handled by onAuthStateChange)
 * 2. Custom edge-function OAuth (code+state in URL query → verifyOtp)
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    handleCallback();
  }, []);

  // Once auth resolves (from either flow), redirect
  useEffect(() => {
    if (error) return;
    if (user && !loading) {
      const destination = user.onboardingCompleted ? '/dashboard' : '/onboarding';
      navigate(destination, { replace: true });
    }
  }, [user, loading, error, navigate]);

  async function handleCallback() {
    try {
      // Check if this is a Supabase native OAuth callback (tokens in hash)
      // onAuthStateChange in AuthContext will handle this automatically
      if (window.location.hash && window.location.hash.includes('access_token')) {
        // Supabase native flow — just wait for onAuthStateChange
        setProcessing(false);
        return;
      }

      // Otherwise, handle custom edge-function OAuth (code+state in query)
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const errorParam = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');

      if (errorParam) {
        setError(errorDescription || errorParam);
        setProcessing(false);
        setTimeout(() => navigate('/login', { replace: true }), 3000);
        return;
      }

      if (!code || !state) {
        // No code/state and no hash tokens — wait briefly for onAuthStateChange
        setTimeout(() => {
          if (!user) {
            setError('Invalid callback — missing parameters');
            setProcessing(false);
            setTimeout(() => navigate('/login', { replace: true }), 3000);
          }
        }, 3000);
        return;
      }

      // Verify state matches what we stored
      const storedState = sessionStorage.getItem('oauth_state');
      const provider = sessionStorage.getItem('oauth_provider');

      if (state !== storedState) {
        console.error('[OAuth Callback] State mismatch');
        setError('Security verification failed. Please try again.');
        setProcessing(false);
        setTimeout(() => navigate('/login', { replace: true }), 3000);
        return;
      }

      console.log(`[OAuth Callback] Processing ${provider} callback`);

      // Exchange code via edge function
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/auth/google/callback`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ code, state })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[OAuth Callback] Server error:', errorText);
        setError('Authentication failed. Please try again.');
        setProcessing(false);
        setTimeout(() => navigate('/login', { replace: true }), 3000);
        return;
      }

      const data = await response.json();
      console.log('[OAuth Callback] Server response:', data.email, 'hasTokenHash:', !!data.tokenHash);

      // Clean up session storage
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_provider');

      // Establish Supabase session using the token_hash (no redirect needed)
      if (data.tokenHash) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: data.tokenHash,
          type: 'magiclink',
        });

        if (verifyError) {
          console.error('[OAuth Callback] OTP verification failed:', verifyError);
          // Fall back to magic link redirect
          if (data.redirectUrl) {
            window.location.href = data.redirectUrl;
            return;
          }
          setError('Session creation failed. Please try again.');
          setProcessing(false);
          setTimeout(() => navigate('/login', { replace: true }), 3000);
          return;
        }

        console.log('[OAuth Callback] Session established via verifyOtp');
        // onAuthStateChange in AuthContext will pick up the new session
        setProcessing(false);
        return;
      }

      // Fallback: use magic link redirect if no tokenHash
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }

      // Last resort: just navigate to onboarding
      navigate('/onboarding', { replace: true });

    } catch (err) {
      console.error('[OAuth Callback] Error:', err);
      setError('An unexpected error occurred. Please try again.');
      setProcessing(false);
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-red-500/10 border border-red-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Authentication Failed</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <p className="text-sm text-slate-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">
          {processing ? 'Completing sign in...' : 'Redirecting...'}
        </h2>
        <p className="text-slate-400">Please wait while we set up your account</p>
      </div>
    </div>
  );
}
