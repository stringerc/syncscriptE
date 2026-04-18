import { useState, useEffect, useCallback } from 'react';
import { CreditCard, ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { supabase } from '../../utils/supabase/client';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9`;

interface ConnectStatus {
  connected: boolean;
  accountId?: string;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  email?: string;
}

export function StripeConnectSettings() {
  const { user } = useAuth();
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboarding, setOnboarding] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${API_BASE}/stripe/connect/status?userId=${encodeURIComponent(user.id)}`, {
        headers: { apikey: publicAnonKey },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        setStatus({
          connected: !!data.accountId && data.chargesEnabled,
          accountId: data.accountId,
          chargesEnabled: data.chargesEnabled,
          payoutsEnabled: data.payoutsEnabled,
          email: data.email,
        });
      } else {
        setStatus({ connected: false });
      }
    } catch {
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const handleOnboard = useCallback(async () => {
    if (!user?.id || !user?.email) return;
    setOnboarding(true);
    try {
      const res = await fetch(`${API_BASE}/stripe/connect/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: publicAnonKey },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          returnUrl: `${window.location.origin}/settings?tab=billing`,
          refreshUrl: `${window.location.origin}/settings?tab=billing`,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setOnboarding(false);
    }
  }, [user?.id, user?.email]);

  const handleDashboard = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_BASE}/stripe/connect/dashboard-link?userId=${encodeURIComponent(user.id)}`, {
        headers: { apikey: publicAnonKey },
      });
      const data = await res.json();
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch {}
  }, [user?.id]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-purple-400" />
          Payment Processing
        </h3>
        <p className="text-sm text-gray-400 mt-1">
          Connect your Stripe account so invoice payments go directly to you.
        </p>
      </div>

      <div className="bg-[#1e2128] rounded-xl border border-gray-800 p-5">
        {loading ? (
          <div className="flex items-center gap-3 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Checking connection status...</span>
          </div>
        ) : status?.connected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">Stripe Connected</div>
                <div className="text-xs text-gray-400">
                  {status.email || 'Account active'}
                  {status.chargesEnabled && status.payoutsEnabled && ' — charges and payouts enabled'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDashboard}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Stripe Dashboard
              </button>
              <button
                onClick={fetchStatus}
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white border border-gray-700 hover:bg-gray-800 transition-colors"
              >
                Refresh Status
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-700/50 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">Not Connected</div>
                <div className="text-xs text-gray-400">
                  Invoice payments currently go to the SyncScript platform account.
                  Connect your Stripe to receive payments directly.
                </div>
              </div>
            </div>
            <button
              onClick={handleOnboard}
              disabled={onboarding}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:from-purple-500 hover:to-cyan-500 transition-colors disabled:opacity-50"
            >
              {onboarding ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
              ) : (
                <><CreditCard className="w-4 h-4" /> Connect Stripe Account</>
              )}
            </button>
            <p className="text-xs text-gray-500">
              You will be redirected to Stripe to complete the setup. This typically takes 2-3 minutes.
            </p>
          </div>
        )}
      </div>

      <div className="bg-[#1a1b23] rounded-xl border border-gray-800/50 p-4">
        <div className="text-xs text-gray-500 space-y-1">
          <p>When connected, invoice "Pay Now" payments go directly to your Stripe account.</p>
          <p>SyncScript does not store or process payment card data. All payments are handled by Stripe.</p>
        </div>
      </div>
    </div>
  );
}
