import { useNavigate } from 'react-router';

export function EnterpriseToolsPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-[#0f1115] px-6 py-10 text-white">
      <section className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-[#171a21] p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Enterprise tools</p>
        <h1 className="mt-3 text-3xl font-semibold">Enterprise workspace is being refreshed</h1>
        <p className="mt-4 text-sm text-slate-300">
          We are finishing a stability pass before re-enabling this surface in production.
          Core dashboard, tasks, calendar, and landing experiences remain available.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:bg-cyan-400 transition-colors"
          >
            Go to dashboard
          </button>
          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold hover:border-white/35 transition-colors"
          >
            Open tasks
          </button>
        </div>
      </section>
    </main>
  );
}
