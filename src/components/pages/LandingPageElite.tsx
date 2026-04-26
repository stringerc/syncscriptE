import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { ArrowRight, Clock3, ShieldCheck, CalendarClock, CheckCircle2, Mic } from 'lucide-react';
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
      className="min-h-screen bg-[#0a0f14] text-[#e6edf4]"
      style={{ fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif' }}
    >
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0f14]/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} aria-label="Go to home page" className="text-sm tracking-wide font-semibold">
            SyncScript
          </button>
          <span className="text-xs text-[#9fb2c8] uppercase tracking-[0.16em]">Open beta</span>
        </div>
      </header>

      <main id="main-content">
        <section className="mx-auto max-w-6xl px-4 pt-16 pb-14 md:pt-24 md:pb-20">
          <div className="grid gap-10 md:grid-cols-[1.1fr_.9fr] md:items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-[#5eead4]/40 bg-[#5eead4]/10 px-3 py-1 text-xs font-semibold text-[#7ff4e0]">
                Real-time energy scheduling
              </p>
              <h1 className="mt-5 text-4xl md:text-6xl font-semibold leading-[1.05] tracking-tight">
                Plan Work When You&apos;re Sharp
              </h1>
              <p className="mt-5 max-w-2xl text-lg text-[#b9c7d8]">
                Most planners treat every hour the same. You know that 3:00 PM crash. SyncScript sorts your day by your
                real energy so your hardest work happens when your brain is ready.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full sm:w-auto rounded-xl bg-[#5eead4] px-5 py-3 text-sm font-semibold text-[#072019] hover:bg-[#2dd4bf] transition-colors inline-flex items-center justify-center gap-2"
                >
                  Start with my energy <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-6 flex flex-wrap gap-5 text-sm text-[#a7b6c9]">
                <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-[#5eead4]" />Setup in minutes</span>
                <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#5eead4]" />OAuth access only</span>
                <span className="inline-flex items-center gap-2"><Mic className="h-4 w-4 text-[#5eead4]" />Voice available when needed</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#111924] p-5 md:p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-[#9fb2c8]">Before → After</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                  <p className="text-sm font-semibold text-red-200">Before</p>
                  <ul className="mt-3 space-y-2 text-sm text-red-100/90">
                    <li className="rounded-lg bg-black/25 px-3 py-2">Deep work at 4:30 PM</li>
                    <li className="rounded-lg bg-black/25 px-3 py-2">Admin tasks in peak hours</li>
                    <li className="rounded-lg bg-black/25 px-3 py-2">No plan when energy drops</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-[#5eead4]/40 bg-[#5eead4]/10 p-4">
                  <p className="text-sm font-semibold text-[#9af7e8]">After</p>
                  <ul className="mt-3 space-y-2 text-sm text-[#d6fff8]">
                    <li className="rounded-lg bg-black/25 px-3 py-2">Deep work at peak focus</li>
                    <li className="rounded-lg bg-black/25 px-3 py-2">Light tasks in low energy windows</li>
                    <li className="rounded-lg bg-black/25 px-3 py-2">Daily schedule auto-adjusted</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="border-y border-white/10 bg-[#0d141d]"
          style={{ contentVisibility: 'auto', containIntrinsicSize: '900px' }}
        >
          <div className="mx-auto max-w-6xl px-4 py-12">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-[#111924] p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-[#9fb2c8]">Open beta</p>
                <p className="mt-2 text-3xl font-semibold text-[#e8f1fb]">Live now</p>
                <p className="mt-2 text-sm text-[#b8c6d7]">No fake logos. Transparent product in active use.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#111924] p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-[#9fb2c8]">First value</p>
                <p className="mt-2 text-3xl font-semibold text-[#e8f1fb]">&lt; 5 min</p>
                <p className="mt-2 text-sm text-[#b8c6d7]">Import tasks, set energy, get a ranked plan.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#111924] p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-[#9fb2c8]">Trust posture</p>
                <p className="mt-2 text-3xl font-semibold text-[#e8f1fb]">Safe-by-default</p>
                <p className="mt-2 text-sm text-[#b8c6d7]">OAuth connectors. Clear controls. Exportable proof trails.</p>
              </div>
            </div>
          </div>
        </section>

        <section
          className="mx-auto max-w-6xl px-4 py-14 md:py-20"
          style={{ contentVisibility: 'auto', containIntrinsicSize: '1100px' }}
        >
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Why this sticks when others fail</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <article className="rounded-2xl border border-white/10 bg-[#111924] p-6">
              <h3 className="text-xl font-semibold">When your focus drops</h3>
              <p className="mt-2 text-sm text-[#b9c7d8]">You want a plan that changes with you, so you do not force deep work at the wrong time.</p>
              <p className="mt-4 text-sm text-[#7ff4e0]">SyncScript re-ranks by current energy and explains the tradeoff.</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-[#111924] p-6">
              <h3 className="text-xl font-semibold">When your calendar gets crowded</h3>
              <p className="mt-2 text-sm text-[#b9c7d8]">You want priorities protected, so urgent noise does not erase meaningful work.</p>
              <p className="mt-4 text-sm text-[#7ff4e0]">The plan targets high-value blocks first, then adjusts as events shift.</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-[#111924] p-6">
              <h3 className="text-xl font-semibold">When tools are already in place</h3>
              <p className="mt-2 text-sm text-[#b9c7d8]">You want better scheduling without replacing your stack.</p>
              <p className="mt-4 text-sm text-[#7ff4e0]">SyncScript layers on top of your current workflow and connectors.</p>
            </article>
          </div>
        </section>

        <section
          className="mx-auto max-w-6xl px-4 py-14 md:py-20"
          style={{ contentVisibility: 'auto', containIntrinsicSize: '1300px' }}
        >
          <div className="rounded-2xl border border-white/10 bg-[#111924] p-6 md:p-8">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Try the energy-matching demo</h2>
            <p className="mt-2 text-[#b9c7d8]">Pick your energy now. Enter three tasks. See the order change instantly.</p>

            <div className="mt-6 grid gap-8 md:grid-cols-[.9fr_1.1fr]">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[#9fb2c8]">Step 1: energy now</p>
                <div className="mt-3 flex gap-2">
                  {([
                    ['high', 'High'],
                    ['medium', 'Medium'],
                    ['low', 'Low'],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setEnergy(value)}
                      className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                        energy === value
                          ? 'bg-[#5eead4] text-[#072019]'
                          : 'border border-white/20 text-[#d0dcec] hover:border-white/40'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <p className="mt-6 text-xs uppercase tracking-[0.16em] text-[#9fb2c8]">Step 2: your tasks</p>
                <div className="mt-3 space-y-2">
                  <label htmlFor="demo-task-1" className="sr-only">Task one</label>
                  <input id="demo-task-1" value={task1} onChange={(e) => setTask1(e.target.value)} className="w-full rounded-lg border border-white/20 bg-[#0d141d] px-3 py-2 text-sm outline-none focus:border-[#5eead4]" />
                  <label htmlFor="demo-task-2" className="sr-only">Task two</label>
                  <input id="demo-task-2" value={task2} onChange={(e) => setTask2(e.target.value)} className="w-full rounded-lg border border-white/20 bg-[#0d141d] px-3 py-2 text-sm outline-none focus:border-[#5eead4]" />
                  <label htmlFor="demo-task-3" className="sr-only">Task three</label>
                  <input id="demo-task-3" value={task3} onChange={(e) => setTask3(e.target.value)} className="w-full rounded-lg border border-white/20 bg-[#0d141d] px-3 py-2 text-sm outline-none focus:border-[#5eead4]" />
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[#9fb2c8]">Step 3: smart order</p>
                <div className="mt-3 space-y-2">
                  {ordered.map((task, idx) => (
                    <div
                      key={`${task.id}-${task.label}-${energy}`}
                      className="rounded-lg border border-white/15 bg-[#0d141d] px-3 py-3 text-sm flex items-center justify-between"
                    >
                      <span className="text-[#d9e5f4]">{idx + 1}. {task.label}</span>
                      <span className="text-xs uppercase tracking-wider text-[#8da3bb]">{task.effort}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm text-[#7ff4e0]">{ENERGY_RULES[energy].reason}</p>
              </div>
            </div>
          </div>
        </section>

        <NexusCapabilityBlurb variant="elite" />

        <section
          className="mx-auto max-w-6xl px-4 py-14 md:py-20"
          style={{ contentVisibility: 'auto', containIntrinsicSize: '1000px' }}
        >
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Before you ask</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <article className="rounded-2xl border border-white/10 bg-[#111924] p-6">
              <h3 className="text-lg font-semibold">“I’ve tried this before.”</h3>
              <p className="mt-2 text-sm text-[#b9c7d8]">Most tools ask you to adapt to them. This one adapts to your energy and schedule drift every day.</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-[#111924] p-6">
              <h3 className="text-lg font-semibold">“I don’t trust AI with my data.”</h3>
              <p className="mt-2 text-sm text-[#b9c7d8]">OAuth-only connectors, transparent controls, and exportable audit trails. Your data stays yours.</p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-[#111924] p-6">
              <h3 className="text-lg font-semibold">“I already use other tools.”</h3>
              <p className="mt-2 text-sm text-[#b9c7d8]">Keep your stack. SyncScript sits above your tasks and calendar to prioritize better timing.</p>
            </article>
          </div>
        </section>

        <section
          className="mx-auto max-w-4xl px-4 pb-20"
          style={{ contentVisibility: 'auto', containIntrinsicSize: '500px' }}
        >
          <div className="rounded-2xl border border-[#5eead4]/35 bg-[#5eead4]/10 p-8 text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-[#8df6e7]">Open beta</p>
            <h2 className="mt-3 text-3xl md:text-4xl font-semibold">Your next day can run better.</h2>
            <p className="mt-3 text-[#c4d5e8]">Start free. No credit card. One clear step to first value.</p>
            <button
              onClick={() => navigate('/signup')}
              className="mt-6 rounded-xl bg-[#5eead4] px-6 py-3 text-sm font-semibold text-[#072019] hover:bg-[#2dd4bf] transition-colors inline-flex items-center gap-2"
            >
              Plan my day in 90 seconds <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-10">
        <div className="mx-auto max-w-6xl px-4 grid gap-6 md:grid-cols-2">
          <div>
            <p className="font-semibold">SyncScript</p>
            <p className="mt-2 text-sm text-[#b9c7d8]">
              Plain English: we only request the access needed to schedule and sync your work. You can disconnect any integration at any time.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-[#b9c7d8] md:items-end">
            <Link to="/privacy" className="hover:text-white transition-colors inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#5eead4]" />Privacy policy</Link>
            <Link to="/security" className="hover:text-white transition-colors inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#5eead4]" />Security</Link>
            <a href="mailto:support@syncscript.app" className="hover:text-white transition-colors inline-flex items-center gap-2"><CalendarClock className="h-4 w-4 text-[#5eead4]" />support@syncscript.app</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
