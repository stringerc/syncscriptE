import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useAuth } from '../../contexts/AuthContext';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { useAIInsightsRouting } from '../../contexts/AIInsightsRoutingContext';
import { normalizeRouteContext, type AIRouteContext } from '../../utils/ai-route';

export function HandoffPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const { requestOpen } = useAIInsightsRouting();
  const [status, setStatus] = useState<'resolving' | 'failed'>('resolving');

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setStatus('failed');
        return;
      }
      try {
        const auth = accessToken || publicAnonKey;
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/openclaw/continuity/handoff-resolve`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });
        if (!response.ok) throw new Error('Could not resolve handoff token');
        const json = await response.json();
        const route = normalizeRouteContext((json?.routeContext || null) as AIRouteContext | null);
        if (route) requestOpen(route);
        const target = String(json?.path || '/agents');
        navigate(target, { replace: true });
        toast.success('Context resumed on this device');
      } catch {
        setStatus('failed');
      }
    };
    void run();
  }, [accessToken, navigate, requestOpen, token]);

  return (
    <div className="min-h-screen bg-[#0b1020] text-white flex items-center justify-center px-4">
      {status === 'resolving' ? (
        <div className="flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-200" />
          <p className="text-sm text-cyan-100">Resuming your SyncScript context...</p>
        </div>
      ) : (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Could not resume this handoff token. Generate a fresh link and try again.
        </div>
      )}
    </div>
  );
}
