import { Bot, Target, Shield, TrendingUp, Zap, Sparkles } from 'lucide-react';

export function LandingWhatsNewSection() {
  return (
    <section className="py-20 sm:py-28 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-4xl sm:text-5xl font-semibold mb-4 tracking-[-0.02em]">What&apos;s New in SyncScript</h2>
          <p className="text-lg sm:text-xl text-white/60 font-light max-w-3xl mx-auto">
            Faster navigation, deeper orchestration, and auditable decision controls.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[
            {
              title: 'Agent OS',
              desc: 'Route-aware assistant workflows, mission execution, and controlled multi-surface behavior.',
              icon: <Bot className="w-6 h-6 text-cyan-400" />,
              border: 'border-cyan-500/30',
            },
            {
              title: 'Projects Operating System',
              desc: 'Workstream canvas + executive view linked across Goals, Tasks, Calendar, and team assignments.',
              icon: <Target className="w-6 h-6 text-emerald-400" />,
              border: 'border-emerald-500/30',
            },
            {
              title: 'Mission Cockpit + Proof Packets',
              desc: 'Mission audit trails with optimization deltas, explainability evidence, and exportable proof artifacts.',
              icon: <Shield className="w-6 h-6 text-indigo-400" />,
              border: 'border-indigo-500/30',
            },
            {
              title: 'Financial Governance Controls',
              desc: 'Policy enforcement, governance roles, immutable control-ledger entries, and shared proof packet history.',
              icon: <TrendingUp className="w-6 h-6 text-orange-400" />,
              border: 'border-orange-500/30',
            },
            {
              title: 'Top-Tier Speed + Discoverability',
              desc: 'Route-split dashboard, global command palette (Cmd/Ctrl+K), and enforced bundle + journey latency budgets.',
              icon: <Zap className="w-6 h-6 text-teal-400" />,
              border: 'border-teal-500/30',
            },
            {
              title: 'Quantum-Ready Optimization Rail',
              desc: 'Pilot quantum-origin adapter with shadow comparison, replay validation, and advisory-first fallback safety.',
              icon: <Sparkles className="w-6 h-6 text-purple-400" />,
              border: 'border-purple-500/30',
            },
          ].map((item) => (
            <div
              key={item.title}
              className={`bg-white/[0.03] backdrop-blur-sm border ${item.border} rounded-2xl p-6 sm:p-8 hover:bg-white/[0.06] transition-all`}
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                {item.icon}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">{item.title}</h3>
              <p className="text-sm sm:text-base text-white/70 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
