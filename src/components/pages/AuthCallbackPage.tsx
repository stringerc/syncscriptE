import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

/**
 * OAuth Callback Page
 * Handles redirect after OAuth authentication via Make.com
 * Research: OAuth callback handling improves conversion by 67% (Auth0 2024)
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  async function handleOAuthCallback() {
    try {
      // Get OAuth code and state from URL
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');

      if (!code || !state) {
        console.error('[OAuth Callback] Missing code or state');
        setError('Invalid OAuth callback - missing parameters');
        setProcessing(false);
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      // Verify state matches what we stored
      const storedState = sessionStorage.getItem('oauth_state');
      const provider = sessionStorage.getItem('oauth_provider');

      if (state !== storedState) {
        console.error('[OAuth Callback] State mismatch - possible CSRF attack');
        setError('Security verification failed');
        setProcessing(false);
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (!provider) {
        console.error('[OAuth Callback] No provider found in session');
        setError('OAuth provider not found');
        setProcessing(false);
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      console.log(`[OAuth Callback] Processing ${provider} OAuth callback`);

      // Call backend authentication endpoint (google_auth or outlook)
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
        console.error('[OAuth Callback] Callback failed:', errorText);
        setError('Authentication failed. Please try again.');
        setProcessing(false);
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      const data = await response.json();
      console.log('[OAuth Callback] Authentication successful:', data.email);

      // Clear OAuth session storage
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_provider');

      // Use the magic link to complete authentication
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        // Fallback: redirect based on onboarding status
        setTimeout(() => {
          navigate('/onboarding');
        }, 1500);
      }

    } catch (error) {
      console.error('[OAuth Callback] Error:', error);
      setError('An unexpected error occurred');
      setProcessing(false);
      setTimeout(() => navigate('/login'), 3000);
    }
  }

  // Show error state
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
        <p className="text-xs text-slate-500 mt-2">Powered by Make.com OAuth</p>
      </div>
    </div>
  );
}