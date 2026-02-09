import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Loader2, Check, X, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export function OAuthCallbackPage() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authorization...');
  const navigate = useNavigate();

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      // Parse URL parameters
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      const error = params.get('error');
      const errorDescription = params.get('error_description');

      // Check for OAuth errors
      if (error) {
        throw new Error(errorDescription || error);
      }

      if (!code || !state) {
        throw new Error('Missing authorization code or state parameter');
      }

      // Determine provider from state
      const provider = state.split(':')[0];
      
      // Verify state matches what we stored
      const storedState = sessionStorage.getItem(`oauth-state-${provider}`);
      if (state !== storedState) {
        throw new Error('Invalid state parameter - possible CSRF attack');
      }

      setMessage(`Connecting to ${provider}...`);

      // Exchange code for tokens
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/integrations/${provider}/callback`,
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
        const error = await response.json();
        throw new Error(error.message || 'Failed to complete authorization');
      }

      const result = await response.json();
      
      setStatus('success');
      setMessage('Successfully connected!');

      // Clean up stored state
      sessionStorage.removeItem(`oauth-state-${provider}`);

      // Notify parent window if opened in popup
      if (window.opener) {
        window.opener.postMessage({
          type: 'oauth-callback',
          provider,
          success: true,
          data: result
        }, window.location.origin);
        
        // Close popup after 1 second
        setTimeout(() => window.close(), 1000);
      } else {
        // If not in popup, redirect to integrations page
        setTimeout(() => navigate('/integrations'), 2000);
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Authorization failed');

      // Notify parent window of error
      if (window.opener) {
        const params = new URLSearchParams(window.location.search);
        const state = params.get('state');
        const provider = state?.split(':')[0];
        
        window.opener.postMessage({
          type: 'oauth-callback',
          provider,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }, window.location.origin);
        
        // Close popup after 3 seconds
        setTimeout(() => window.close(), 3000);
      } else {
        // If not in popup, redirect to integrations page after delay
        setTimeout(() => navigate('/integrations'), 3000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
        {status === 'processing' && (
          <>
            <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Processing Authorization</h2>
            <p className="text-gray-400">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-emerald-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Success!</h2>
            <p className="text-gray-400">{message}</p>
            {window.opener && (
              <p className="text-sm text-gray-500 mt-4">This window will close automatically...</p>
            )}
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-6 h-6 text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Authorization Failed</h2>
            <p className="text-gray-400 mb-4">{message}</p>
            {!window.opener && (
              <button
                onClick={() => navigate('/integrations')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Return to Integrations
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}