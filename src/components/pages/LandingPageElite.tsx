import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import {
  ArrowRight,
  Clock3,
  ShieldCheck,
  CalendarClock,
  CheckCircle2,
  Mic,
  Sparkles,
} from 'lucide-react';
import { NexusCapabilityBlurb } from '../nexus/NexusCapabilityBlurb';

type EnergyBand = 'high' | 'medium' | 'low';

interface DemoTask {
  id: string;
  label: string;
  effort: 'deep' | 'medium' | 'light';
}

const DEFAULT_TASKS: DemoTask[] = [
  { id: 't1', label: 'Write client proposal', effort: 'deep' },
  { id: 't2', label: 'Reply to email inbox', effort: 'light' },
  { id: 't3', label: 'Plan next sprint', effort: 'medium' },
];

const ENERGY_RULES: Record<EnergyBand, { order: DemoTask['effort'][]; reason: string }> = {
  high: {
    order: ['deep', 'medium', 'light'],
    reason: 'You are sharp now, so deep work goes first while your focus is strongest.',
  },
  medium: {
    order: ['medium', 'deep', 'light'],
    reason: 'You have stable focus, so medium-complex planning first, then deep execution.',
  },
  low: {
    order: ['light', 'medium', 'deep'],
    reason: 'Energy is low, so quick wins first. Deep work is moved later to protect quality.',
  },
};

function reorderByEnergy(tasks: DemoTask[], energy: EnergyBand): DemoTask[] {
  const rank = ENERGY_RULES[energy].order;
  return [...tasks].sort((a, b) => rank.indexOf(a.effort) - rank.indexOf(b.effort));
}

const mono = '"IBM Plex Mono", ui-monospace, monospace';

export function LandingPageElite() {
  const navigate = useNavigate();
  const [energy, setEnergy] = useState<EnergyBand>('medium');
  const [task1, setTask1] = useState(DEFAULT_TASKS[0].label);
  const [task2, setTask2] = useState(DEFAULT_TASKS[1].label);
  const [task3, setTask3] = useState(DEFAULT_TASKS[2].label);

  const tasks = useMemo<DemoTask[]>(
    () => [
      { ...DEFAULT_TASKS[0], label: task1.trim() || DEFAULT_TASKS[0].label },
      { ...DEFAULT_TASKS[1], label: task2.trim() || DEFAULT_TASKS[1].label },
      { ...DEFAULT_TASKS[2], label: task3.trim() || DEFAULT_TASKS[2].label },
    ],
    [task1, task2, task3],
  );

  const ordered = useMemo(() => reorderByEnergy(tasks, energy), [tasks, energy]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.dispatchEvent(new Event('syncscript-landing-ready'));
    }
  }, []);

  return (
    <div
      data-landing-ready="true"
      className="landing-elite-root relative min-h-screen overflow-x-hidden bg-[#060a0e] text-[#e8f0f7]"
      style={{ fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif' }}
    >
      {/* Atmosphere — CSS only, respects reduced motion */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 motion-reduce:opacity-90"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(45,212,191,0.14),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(99,102,241,0.08),transparent_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_80%,rgba(20,184,166,0.06),transparent_40%)]" />
        <div
          className="absolute inset-0 opacity-[0.4] motion-safe:animate-[landing-grid-drift_28s_ease-in-out_infinite] motion-reduce:animate-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at center, rgba(255,255,255,0.045) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            maskImage: 'radial-gradient(ellipse 80% 70% at 50% 30%, black 20%, transparent 75%)',
          }}
        />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#060a0e]/80 backdrop-blur-md backdrop-saturate-150">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-label="Go to home page"
            className="group flex items-center gap-2 rounded-lg text-sm font-semibold tracking-wide text-white outline-none ring-teal-400/0 transition-[color,box-shadow] hover:text-[#a7f3e0] focus-visible:ring-2 focus-visible:ring-teal-400/60"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-teal-400/25 bg-gradient-to-br from-teal-400/20 to-indigo-500/10 text-xs font-bold text-[#7ff4e0] shadow-[0_0_24px_-8px_rgba(45,212,191,0.5)] transition-transform group-hover:scale-[1.02]">
              S
            </span>
            SyncScript
          </button>
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8da3bb]"
            style={{ fontFamily: mono }}
          >
            Open beta
          </span>
        </div>
      </header>

      <main id="main-content">
        <section className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 md:px-6 md:pb-24 md:pt-20">
          <div className="grid gap-12 md:grid-cols-[1.12fr_0.88fr] md:items-start md:gap-14">
            <div className="relative">
              <div className="absolute -left-4 top-0 hidden h-32 w-px bg-gradient-to-b from-teal-400/50 to-transparent md:block" aria-hidden />
              <p
                className="inline-flex items-center gap-2 rounded-full border border-teal-400/25 bg-teal-500/[0.08] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9af7e8]"
                style={{ fontFamily: mono }}
              >
                <Sparkles className="h-3.5 w-3.5 text-[#5eead4]" aria-hidden />
                Energy-aware scheduling
              </p>
              <h1 className="mt-6 max-w-[14ch] text-fluid-5xl font-semibold leading-[1.04] tracking-[-0.03em] text-white md:max-w-none">
                Plan Work When You&apos;re Sharp
              </h1>
              <p className="mt-6 max-w-xl text-fluid-lg leading-relaxed text-[#a8bacd]">
                Your planner treats every hour the same. You feel the 3:00 PM dip. SyncScript ranks your day by how
                sharp you feel, so your hardest work lands when your brain is ready—not when a slot was empty.
              </p>
              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => navigate('/signup')}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5eead4] to-[#2dd4bf] px-6 py-3.5 text-sm font-semibold text-[#041a14] shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset,0_12px_40px_-12px_rgba(45,212,191,0.55)] transition-[transform,box-shadow,filter] hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060a0e] motion-safe:hover:-translate-y-0.5 sm:w-auto"
                >
                  Start with your energy
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                </button>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#94a8bc]">
                <li className="inline-flex items-center gap-2">
                  <Clock3 className="h-4 w-4 shrink-0 text-[#5eead4]" aria-hidden />
                  You are set up in minutes
                </li>
                <li className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-[#5eead4]" aria-hidden />
                  OAuth access only
                </li>
                <li className="inline-flex items-center gap-2">
                  <Mic className="h-4 w-4 shrink-0 text-[#5eead4]" aria-hidden />
                  Voice when you want it
                </li>
              </ul>
            </div>

            <div className="relative">
              <div
                className="absolute -inset-px rounded-2xl bg-gradient-to-br from-teal-400/20 via-transparent to-indigo-500/15 opacity-70 blur-sm motion-reduce:opacity-40"
                aria-hidden
              />
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0a1018]/90 p-5 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.85)] backdrop-blur-sm md:p-7">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8da3bb]" style={{ fontFamily: mono }}>
                  Before → after
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-red-400/20 bg-gradient-to-b from-red-950/40 to-[#0d141d] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-red-200/90">Before</p>
                    <ul className="mt-3 space-y-2 text-sm text-red-100/85">
                      <li className="rounded-lg border border-red-500/10 bg-black/30 px-3 py-2">Deep work at 4:30 PM</li>
                      <li className="rounded-lg border border-red-500/10 bg-black/30 px-3 py-2">Admin in your peak hours</li>
                      <li className="rounded-lg border border-red-500/10 bg-black/30 px-3 py-2">No plan when you dip</li>
                    </ul>
                  </div>
                  <div className="rounded-xl border border-teal-400/25 bg-gradient-to-b from-teal-950/35 to-[#0d141d] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#9af7e8]">After</p>
                    <ul className="mt-3 space-y-2 text-sm text-[#d6fff8]/95">
                      <li className="rounded-lg border border-teal-400/15 bg-black/25 px-3 py-2">Deep work at your peak</li>
                      <li className="rounded-lg border border-teal-400/15 bg-black/25 px-3 py-2">Light tasks when you fade</li>
                      <li className="rounded-lg border border-teal-400/15 bg-black/25 px-3 py-2">Your day re-ranked for you</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="border-y border-white/[0.06] bg-[#070c12]/80"
          style={{ contentVisibility: 'auto', containIntrinsicSize: '900px' }}
        >
          <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-16">
            <div className="grid gap-5 md:grid-cols-3">
              {[
                {
                  k: 'Open beta',
                  v: 'Live now',
                  d: 'No fake logos. You see a real product in active use.',
                },
                {
                  k: 'First value',
                  v: '< 5 min',
                  d: 'You import tasks, set energy, and get a ranked plan.',
                },
                {
                  k: 'Trust posture',
                  v: 'Safe-by-default',
                  d: 'OAuth connectors, clear controls, exportable trails.',
                },
              ].map((card) => (
                <article
                  key={card.k}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a1018]/60 p-6 transition-colors hover:border-teal-400/20"
                >
                  <div
                    className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-teal-400/5 blur-2xl transition-opacity group-hover:opacity-100"
                    aria-hidden
                  />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7a8fa3]" style={{ fontFamily: mono }}>
                    {card.k}
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{card.v}</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#9eb0c4]">{card.d}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24"
          style={{ contentVisibility: 'auto', containIntrinsicSize: '1100px' }}
        >
          <h2 className="max-w-[20ch] text-fluid-3xl font-semibold tracking-tight text-white md:max-w-none">
            Why this sticks when other tools fade
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                t: 'When your focus drops',
                b: 'You want a plan that moves with you, not one that shames you for being human.',
                c: 'Your queue re-ranks by current energy, with a plain reason you can trust.',
              },
              {
                t: 'When your calendar fills',
                b: 'You want your priorities protected so noise does not erase meaningful work.',
                c: 'High-value blocks stay first; the rest reshapes as your events shift.',
              },
              {
                t: 'When your stack is set',
                b: 'You do not want another rip-and-replace tool.',
                c: 'SyncScript layers on what you already use—tasks and calendar stay yours.',
              },
            ].map((a) => (
              <article
                key={a.t}
                className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#0f1620] to-[#0a1018] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
              >
                <h3 className="text-xl font-semibold text-white">{a.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#a8bacd]">{a.b}</p>
                <p className="mt-4 border-t border-white/[0.06] pt-4 text-sm leading-relaxed text-[#7ff4e0]">{a.c}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24"
          style={{ contentVisibility: 'auto', containIntrinsicSize: '1300px' }}
        >
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-[#080d13] p-6 shadow-[0_32px_120px_-48px_rgba(45,212,191,0.12)] md:p-10">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(45,212,191,0.08),transparent_60%)]"
              aria-hidden
            />
            <div className="relative">
              <h2 className="text-fluid-3xl font-semibold tracking-tight text-white">Try the energy-matching demo</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#9eb0c4] md:text-base">
                Pick your energy. Type three tasks. Watch the order change instantly—no signup.
              </p>

              <div className="mt-8 grid gap-10 md:grid-cols-[0.95fr_1.05fr] md:gap-12">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7a8fa3]" style={{ fontFamily: mono }}>
                    Step 1 — your energy now
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(['high', 'medium', 'low'] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setEnergy(value)}
                        className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d13] ${
                          energy === value
                            ? 'bg-gradient-to-r from-[#5eead4] to-[#2dd4bf] text-[#041a14] shadow-[0_8px_24px_-8px_rgba(45,212,191,0.45)]'
                            : 'border border-white/15 text-[#d0dce8] hover:border-teal-400/35 hover:bg-white/[0.03]'
                        }`}
                      >
                        {value === 'high' ? 'High' : value === 'medium' ? 'Medium' : 'Low'}
                      </button>
                    ))}
                  </div>

                  <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7a8fa3]" style={{ fontFamily: mono }}>
                    Step 2 — your tasks
                  </p>
                  <div className="mt-3 space-y-2">
                    <label htmlFor="demo-task-1" className="sr-only">
                      Task one
                    </label>
                    <input
                      id="demo-task-1"
                      value={task1}
                      onChange={(e) => setTask1(e.target.value)}
                      className="w-full rounded-lg border border-white/15 bg-[#0d141d] px-3 py-2.5 text-sm text-white outline-none transition-[border-color,box-shadow] placeholder:text-[#5c6b7d] focus:border-teal-400/50 focus:ring-2 focus:ring-teal-400/25"
                    />
                    <label htmlFor="demo-task-2" className="sr-only">
                      Task two
                    </label>
                    <input
                      id="demo-task-2"
                      value={task2}
                      onChange={(e) => setTask2(e.target.value)}
                      className="w-full rounded-lg border border-white/15 bg-[#0d141d] px-3 py-2.5 text-sm text-white outline-none transition-[border-color,box-shadow] placeholder:text-[#5c6b7d] focus:border-teal-400/50 focus:ring-2 focus:ring-teal-400/25"
                    />
                    <label htmlFor="demo-task-3" className="sr-only">
                      Task three
                    </label>
                    <input
                      id="demo-task-3"
                      value={task3}
                      onChange={(e) => setTask3(e.target.value)}
                      className="w-full rounded-lg border border-white/15 bg-[#0d141d] px-3 py-2.5 text-sm text-white outline-none transition-[border-color,box-shadow] placeholder:text-[#5c6b7d] focus:border-teal-400/50 focus:ring-2 focus:ring-teal-400/25"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7a8fa3]" style={{ fontFamily: mono }}>
                    Step 3 — smart order
                  </p>
                  <div className="mt-3 space-y-2">
                    {ordered.map((task, idx) => (
                      <div
                        key={`${task.id}-${task.label}-${energy}`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.1] bg-[#0d141d]/90 px-4 py-3 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                      >
                        <span className="min-w-0 text-[#e8f0f7]">
                          <span className="mr-2 font-medium text-[#5eead4]">{idx + 1}.</span>
                          {task.label}
                        </span>
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-[#7a8fa3]" style={{ fontFamily: mono }}>
                          {task.effort}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-5 text-sm leading-relaxed text-[#7ff4e0]">{ENERGY_RULES[energy].reason}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <NexusCapabilityBlurb variant="elite" />

        <section
          className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24"
          style={{ contentVisibility: 'auto', containIntrinsicSize: '1000px' }}
        >
          <h2 className="text-fluid-3xl font-semibold tracking-tight text-white">Before you ask</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                t: '“I’ve tried this before.”',
                p: 'Most tools ask you to bend to them. SyncScript bends to your energy and daily drift.',
              },
              {
                t: '“I don’t trust AI with my data.”',
                p: 'You get OAuth-only connectors, clear controls, and exportable audit trails. Your data stays yours.',
              },
              {
                t: '“I already use other tools.”',
                p: 'Keep your stack. SyncScript sits above your tasks and calendar to improve timing—not replace you.',
              },
            ].map((x) => (
              <article
                key={x.t}
                className="rounded-2xl border border-white/[0.08] bg-[#0a1018]/80 p-6 backdrop-blur-sm"
              >
                <h3 className="text-lg font-semibold text-white">{x.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#a8bacd]">{x.p}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Single primary CTA is in hero; closing uses secondary link only (conversion rule). */}
        <section
          className="mx-auto max-w-4xl px-4 pb-24 md:px-6"
          style={{ contentVisibility: 'auto', containIntrinsicSize: '500px' }}
        >
          <div className="relative overflow-hidden rounded-2xl border border-teal-400/20 bg-gradient-to-br from-teal-950/30 via-[#0a1018] to-indigo-950/20 p-8 text-center md:p-10">
            <div
              className="pointer-events-none absolute inset-0 opacity-40 motion-safe:animate-[landing-shimmer_14s_ease-in-out_infinite] motion-reduce:animate-none"
              style={{
                background:
                  'linear-gradient(115deg, transparent 40%, rgba(94,234,212,0.06) 50%, transparent 60%)',
                backgroundSize: '200% 100%',
              }}
              aria-hidden
            />
            <div className="relative">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#7ff4e0]" style={{ fontFamily: mono }}>
                Open beta
              </p>
              <h2 className="mt-4 text-fluid-3xl font-semibold tracking-tight text-white">Your next day can run better</h2>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[#b3c5d8] md:text-base">
                Start free. No credit card. When you are ready, create your account and carry this same logic into your
                real tasks.
              </p>
              <p className="mt-8">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-400/35 bg-transparent px-6 py-3 text-sm font-semibold text-[#a7f3e0] transition-[background-color,color,box-shadow] hover:border-teal-400/50 hover:bg-teal-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1018]"
                >
                  Create your free account
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.08] py-12">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-2 md:px-6">
          <div>
            <p className="font-semibold text-white">SyncScript</p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[#9eb0c4]">
              You approve only the access needed to schedule and sync your work. You can disconnect any integration at
              any time.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-[#9eb0c4] md:items-end">
            <Link
              to="/privacy"
              className="inline-flex items-center gap-2 rounded-md py-1 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#5eead4]" aria-hidden />
              Privacy policy
            </Link>
            <Link
              to="/security"
              className="inline-flex items-center gap-2 rounded-md py-1 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50"
            >
              <ShieldCheck className="h-4 w-4 shrink-0 text-[#5eead4]" aria-hidden />
              Security
            </Link>
            <a
              href="mailto:support@syncscript.app"
              className="inline-flex items-center gap-2 rounded-md py-1 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50"
            >
              <CalendarClock className="h-4 w-4 shrink-0 text-[#5eead4]" aria-hidden />
              support@syncscript.app
            </a>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes landing-grid-drift {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-12px, 8px); }
        }
        @keyframes landing-shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}
