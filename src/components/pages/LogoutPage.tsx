import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function LogoutPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await signOut();
      } finally {
        if (active) navigate('/login', { replace: true });
      }
    })();
    return () => {
      active = false;
    };
  }, [navigate, signOut]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1420] to-[#0a0e1a] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto mb-3" />
        <p className="text-slate-300">Signing you out...</p>
      </div>
    </div>
  );
}
