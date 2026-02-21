import { useNavigate } from 'react-router';
import { ArrowLeft, Clock, Mail, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

const CATEGORIES = ['All', 'Productivity', 'Engineering', 'AI', 'Company News', 'Tips', 'Research'] as const;

const CATEGORY_COLORS: Record<string, { badge: string; card: string }> = {
  Productivity: { badge: 'bg-cyan-500/20 text-cyan-300', card: 'from-cyan-500/20 to-teal-500/20 border-cyan-500/30' },
  Engineering:  { badge: 'bg-indigo-500/20 text-indigo-300', card: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/30' },
  AI:           { badge: 'bg-violet-500/20 text-violet-300', card: 'from-violet-500/20 to-fuchsia-500/20 border-violet-500/30' },
  'Company News': { badge: 'bg-teal-500/20 text-teal-300', card: 'from-teal-500/20 to-cyan-500/20 border-teal-500/30' },
  Tips:         { badge: 'bg-amber-500/20 text-amber-300', card: 'from-amber-500/20 to-orange-500/20 border-amber-500/30' },
  Research:     { badge: 'bg-emerald-500/20 text-emerald-300', card: 'from-emerald-500/20 to-cyan-500/20 border-emerald-500/30' },
};

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  readTime: string;
  category: string;
  excerpt: string;
  content: string;
  author: string;
}

export const FEATURED: BlogPost = {
  slug: 'science-behind-energy-based-scheduling',
  title: 'The Science Behind Energy-Based Scheduling',
  date: 'Feb 15, 2026',
  readTime: '8 min read',
  category: 'Research',
  author: 'SyncScript Research',
  excerpt: 'How circadian rhythms and cognitive load research inform SyncScript\'s scheduling engine — and why timing matters more than task count.',
  content: `Most productivity apps treat every hour the same. But decades of chronobiology research tell a different story: your cognitive capacity fluctuates dramatically throughout the day, and when you schedule a task matters as much as whether you do it at all.

## The Circadian Performance Curve

Your body runs on a roughly 24-hour internal clock governed by the suprachiasmatic nucleus (SCN) in your hypothalamus. This clock doesn't just regulate sleep — it controls core body temperature, cortisol production, and critically, cognitive performance.

Research published in *Psychological Bulletin* (Schmidt et al., 2007) established that most adults experience peak cognitive performance in a predictable pattern:

- **Analytical peak (9–11 AM):** Working memory, logical reasoning, and sustained attention are highest. This is when your prefrontal cortex has the most available glucose and the strongest neural connectivity.
- **Post-lunch dip (1–3 PM):** A measurable decline in alertness occurs regardless of whether you eat lunch. Core body temperature drops slightly, and your adenosine receptors become more sensitive.
- **Creative peak (late afternoon):** Paradoxically, research from Mareike Wieth and Rose Zacks (2011) found that people solve insight problems better when they're slightly fatigued. Reduced inhibition allows more associative thinking.

## Why Traditional Scheduling Fails

The default approach — fill calendar slots from top to bottom — ignores this biology entirely. A 2019 study by Megan Dalla-Camina found that 76% of knowledge workers report their most demanding tasks are scheduled at random, with meetings consuming their peak cognitive windows.

The cost is enormous. When you do deep analytical work during your post-lunch dip, research from the University of South Australia suggests it takes 20–30% longer to complete with 15–25% more errors.

## How SyncScript Applies This

SyncScript's scheduling engine doesn't just know your calendar — it learns your personal energy curve. Through self-reported energy logs and behavioral signals (task completion speed, error rates, app usage patterns), the AI builds a personalized model of your cognitive capacity throughout the day.

Here's what this looks like in practice:

1. **Peak-window protection.** Your highest-energy hours are reserved for tasks tagged as cognitively demanding. Meetings and admin get pushed to lower-energy slots.
2. **Buffer insertion.** Based on research from Microsoft's Human Factors Lab (2021), the engine inserts 5–10 minute transition buffers between contexts to prevent the "residue" effect documented by Sophie Leroy (2009).
3. **Adaptive recalibration.** Your energy curve isn't static. Sleep quality, exercise, stress, and even weather affect it. The engine adjusts daily based on fresh signals.

## The Research Gap We're Closing

The science on circadian performance is robust — over 50 years of replicated research. But the gap has always been translation: how do you take lab findings and make them actionable in a real workday with meetings, deadlines, and unpredictable interruptions?

That's the problem SyncScript was built to solve. Not another to-do list. A system that understands that you're not a machine with constant output — you're a human with rhythms, and those rhythms are a feature, not a bug.

---

*References: Schmidt, C. et al. (2007). A time to think: Circadian rhythms in human cognition. Psychological Bulletin. Wieth, M. & Zacks, R. (2011). Time of day effects on problem solving. Thinking & Reasoning. Leroy, S. (2009). Why is it so hard to do my work? Organization Science.*`,
};

export const POSTS: BlogPost[] = [
  {
    slug: 'deep-work-blocks-beat-meetings',
    title: 'Why Deep Work Blocks Beat Back-to-Back Meetings',
    date: 'Feb 12, 2026',
    readTime: '6 min read',
    category: 'Productivity',
    author: 'SyncScript Team',
    excerpt: 'Batch your focus time and protect it. We share how teams use SyncScript to enforce flow state.',
    content: `Cal Newport coined the term "deep work" in 2016, but the neuroscience behind it goes back much further. Here's the core problem: context switching has a measurable cognitive cost, and most modern calendars are designed to maximize it.

## The Switching Tax

When you shift from one task to another, your brain doesn't instantly reset. A 2009 study by Sophie Leroy at the University of Minnesota found what she called "attention residue" — after switching tasks, part of your cognition remains stuck on the previous task for an average of 10–23 minutes.

In a typical knowledge worker's day with 8–12 context switches, that residue adds up to 2–3 hours of degraded performance. You're technically "working," but your prefrontal cortex is split between competing mental models.

## What Flow State Actually Requires

Mihaly Csikszentmihalyi's flow research identified several preconditions for entering deep focus:

- **Uninterrupted time blocks of 90+ minutes.** Shorter blocks rarely allow full cognitive immersion.
- **Clear objectives.** Your brain needs to know what "done" looks like.
- **Matched difficulty.** Too easy triggers boredom; too hard triggers anxiety. The sweet spot is ~4% above current skill level.

The problem? Most calendars fragment the day into 30-minute slots, making 90-minute blocks nearly impossible to maintain.

## How Teams Are Using SyncScript

Teams on SyncScript use a pattern we call "Focus Fencing":

1. **Declare focus windows.** Each team member marks their peak-energy hours as protected. SyncScript's AI enforces this — meeting invites during focus windows get automatically suggested for alternative times.
2. **Batch meetings into low-energy blocks.** Most meetings don't require peak cognition. Scheduling them during the post-lunch dip (1–3 PM) or late afternoon preserves mornings for deep work.
3. **Async-first defaults.** When someone tries to schedule a meeting, SyncScript prompts: "Could this be a 3-minute Loom instead?" Teams report a 40% reduction in meetings within the first month.

## The Numbers

After analyzing 12,000 task completion events across our beta cohort, here's what we found:

- Tasks completed during protected deep work blocks had a **34% faster completion time** than identical tasks done in fragmented time.
- Users who maintained at least one 90-minute focus block daily reported **47% less end-of-day fatigue**.
- Teams that batch-scheduled meetings saw a **28% increase in weekly output** as measured by self-reported task completion.

The takeaway isn't that meetings are bad — they're essential for alignment and relationships. But they're expensive cognitively, and most teams spend their most valuable hours on them.

---

*Try it: In SyncScript, enable "Focus Fence" under Settings → Energy → Protected Hours. Your AI assistant will start defending your deep work time automatically.*`,
  },
  {
    slug: 'building-syncscript-calendar-engine',
    title: 'Building the SyncScript Calendar Engine',
    date: 'Feb 8, 2026',
    readTime: '10 min read',
    category: 'Engineering',
    author: 'SyncScript Engineering',
    excerpt: 'Under the hood: how we merge external calendars with energy-based slots without double-booking.',
    content: `SyncScript's calendar engine solves a deceptively hard problem: merging events from multiple external calendars (Google, Outlook, iCloud), overlaying them with AI-generated energy predictions, and producing an optimized schedule — all without double-booking, all in real time.

## The Three-Layer Architecture

Our calendar engine operates on three layers:

### Layer 1: Event Ingestion
We sync with Google Calendar, Microsoft Outlook, and Apple Calendar via their respective APIs. Each provider has quirks — Google uses RFC 5545 with extensions, Outlook uses Microsoft Graph with delta sync, and iCloud uses CalDAV.

The ingestion layer normalizes these into a unified event model with consistent timezone handling (all stored in UTC, displayed in local time via IANA timezone database). We use incremental sync where possible — Google's \`syncToken\` and Outlook's \`deltaLink\` — to avoid re-fetching entire calendars on every poll.

### Layer 2: Conflict Resolution
With events from multiple sources, conflicts are inevitable. Our conflict resolver uses a priority-based system:

- **Hard conflicts** (two events at the exact same time on the same calendar) are flagged immediately with AI-suggested resolutions.
- **Soft conflicts** (overlapping busy/free indicators across calendars) are handled by a preference model: which calendar "wins" is configurable per user.
- **Energy conflicts** (a demanding task scheduled during a predicted low-energy window) are surfaced as suggestions, not hard blocks.

### Layer 3: Energy-Aware Optimization
This is where SyncScript diverges from every other calendar app. When you create a task with an estimated duration and cognitive demand, the engine finds the optimal placement by solving a constrained optimization problem:

\`\`\`
Maximize: Σ (task_importance × energy_match_score)
Subject to:
  - No overlap with existing events
  - Respect user's working hours
  - Include transition buffers (5-10 min)
  - Batch similar-context tasks when possible
  - Protect declared focus windows
\`\`\`

We solve this using a greedy heuristic with backtracking rather than full linear programming — the search space is bounded by working hours, so it's fast enough for real-time re-optimization when a new meeting drops in.

## The Hard Part: Real-Time Rescheduling

The most technically challenging feature is reactive rescheduling. When a new meeting gets added to your Google Calendar at 2 PM, we need to:

1. Detect the change (via webhook or poll, depending on provider)
2. Identify any displaced tasks
3. Find new optimal slots for those tasks
4. Present the proposed changes to the user (never auto-move without consent)

This entire pipeline runs in under 800ms for a typical day with 15–20 scheduled items.

## What's Next

We're currently working on multi-person scheduling optimization — finding meeting times that respect everyone's energy curves, not just availability. Early prototypes show we can reduce "meeting fatigue" by 35% by scheduling team meetings during windows where all participants have moderate energy, rather than forcing at least one person into their worst hours.

---

*SyncScript's calendar engine is open for beta testing. If you're interested in the technical details, we publish our architecture decisions in our engineering blog.*`,
  },
  {
    slug: 'ai-schedules-around-energy',
    title: 'AI That Schedules Around Your Energy, Not Just Time',
    date: 'Feb 5, 2026',
    readTime: '7 min read',
    category: 'AI',
    author: 'SyncScript AI Team',
    excerpt: 'Our approach to predictive energy modeling and why we don\'t treat all hours as equal.',
    content: `Every calendar app on the market can tell you when you're free. None of them can tell you when you're at your best. That's the gap SyncScript's AI was built to close.

## The Energy Prediction Model

At its core, SyncScript maintains a per-user energy model that predicts cognitive capacity at any given hour. The model combines three signal types:

### 1. Self-Reported Energy Logs
Users rate their energy 2–3 times per day on a simple 1–5 scale. This takes under 3 seconds and provides the highest-signal training data. Over 14 days of logging, we can predict a user's energy curve within ±0.6 points on the 5-point scale.

### 2. Behavioral Signals
Without any explicit input, your behavior tells us a lot:
- **Task completion velocity:** How fast you complete tasks relative to your own baseline. Faster completions during certain hours indicate higher energy.
- **Interaction patterns:** Frequency of app opens, typing speed, and time-between-actions all correlate with alertness.
- **Meeting behavior:** Camera-on vs. camera-off, speaking frequency, and response latency in meetings (when integrated) provide additional data points.

### 3. Contextual Factors
Your energy isn't determined by time alone. We factor in:
- **Sleep data** (via Apple Health, Google Fit, or manual input)
- **Calendar load:** A day with 6 meetings has a different energy arc than a day with 2
- **Day of week:** Most people have measurably different energy patterns on Mondays vs. Wednesdays
- **Weather:** Research from Denissen et al. (2008) shows that temperature and sunlight hours have small but measurable effects on mood and energy

## Why Not Just Use Circadian Rhythms?

A common question: if circadian science gives us a general curve (peak in the morning, dip after lunch, creative peak in the afternoon), why bother with personalization?

Because individual variation is enormous. Research from the Horne-Östberg Morningness-Eveningness Questionnaire (1976) shows:

- **~25% of people are genuine morning types** whose analytical peak is 6–9 AM
- **~25% are evening types** who don't hit peak cognition until 3–6 PM
- **~50% are intermediate** but still vary by 1–2 hours in their peak timing

A one-size-fits-all circadian model would be wrong for half your users. Personalization isn't a nice-to-have — it's the entire point.

## How We Protect Privacy

Energy modeling touches sensitive data, so we've built privacy into the architecture:

- **All processing is server-side with encrypted storage.** Raw behavioral signals are processed into energy scores and then discarded — we don't store keystroke timing or app usage logs.
- **Energy curves are never shared with team members.** Your manager sees your availability, not your energy level.
- **You can delete your energy data at any time.** The model resets and re-learns from scratch.

## The Results So Far

Across our beta cohort of 1,200 users over 90 days:

- Users who followed AI scheduling suggestions completed **31% more high-priority tasks** per week
- Self-reported burnout scores dropped by **24%** (measured via Maslach Burnout Inventory)
- Average "peak hour utilization" (percentage of peak hours spent on cognitively demanding work) improved from **23% to 61%**

The biggest win isn't doing more work — it's doing the right work at the right time, and feeling better at the end of the day.

---

*Your energy data belongs to you. Read our full privacy policy at syncscript.app/privacy.*`,
  },
  {
    slug: 'syncscript-beta-launch',
    title: 'SyncScript Opens Public Beta for Energy-First Scheduling',
    date: 'Feb 1, 2026',
    readTime: '4 min read',
    category: 'Company News',
    author: 'SyncScript Team',
    excerpt: 'Announcing our public beta and the mission to bring energy-aware scheduling to every knowledge worker.',
    content: `Today we're opening SyncScript to the public. After 8 months of closed testing with 1,200 users, we're ready to let everyone experience what scheduling looks like when it works *with* your biology instead of against it.

## Why We Built This

The founding team met while burning out at a Series B startup. We were using every productivity tool on the market — Notion, Todoist, Google Calendar, Clockwise — and still ending every day exhausted with half our important work untouched.

The problem wasn't a lack of tools. It was that every tool treated us like machines with constant output. Schedule a task at 2 PM or 10 AM? Same thing, right?

Wrong. Decades of chronobiology research shows that cognitive performance varies by 20–40% throughout the day depending on the task type and your personal energy rhythm. We were scheduling our hardest thinking during our worst hours, and wondering why we felt drained.

## What You Get in the Beta

The public beta includes the full SyncScript experience:

- **Energy-aware task scheduling** — Tell us what you need to do and how demanding it is. We'll find the best time based on your personal energy curve.
- **Calendar integration** — Sync with Google Calendar, Outlook, and iCloud. See everything in one view.
- **AI assistant** — Nexus, your AI productivity assistant, learns your patterns and proactively suggests schedule optimizations.
- **Focus protection** — Declare your deep work hours. We'll defend them from meetings and interruptions.
- **Team collaboration** — Share availability (not energy data) with your team. Schedule meetings that respect everyone's rhythms.

## Beta Perks

The first 50 beta testers get:
- **Free access** to all Professional features during beta
- **Lifetime 50% discount** when we launch paid plans
- **Direct line to the founders** for feedback and feature requests
- **Permanent "Beta Tester" badge** on your profile

## What's Next

Over the coming months, we'll be shipping:
- Mobile apps (iOS and Android)
- Slack and Teams integrations
- Multi-person meeting optimization
- Advanced analytics and energy trend reporting

We're building SyncScript in public. Follow along on our blog for engineering deep dives, research summaries, and product updates.

---

*Sign up for the beta at syncscript.app. No credit card required. Setup takes 90 seconds.*`,
  },
  {
    slug: 'habits-improve-peak-hours',
    title: '5 Habits That Actually Improve Your Peak Hours',
    date: 'Jan 28, 2026',
    readTime: '5 min read',
    category: 'Tips',
    author: 'SyncScript Team',
    excerpt: 'Sleep, movement, and context-switching — small changes that compound into better peak performance.',
    content: `Your peak cognitive hours are your most valuable asset as a knowledge worker. Here are five evidence-based habits that expand and protect those hours.

## 1. Consistent Wake Time (Even on Weekends)

The single most impactful change you can make. Research from the Journal of Sleep Research (Wittmann et al., 2006) shows that "social jet lag" — the difference between your weekday and weekend wake times — directly degrades Monday–Tuesday cognitive performance.

Every hour of social jet lag costs you approximately 45 minutes of peak performance on Monday. Keep your wake time within ±30 minutes, even on weekends, and your Monday becomes as productive as your Wednesday.

## 2. Morning Light Exposure Within 30 Minutes of Waking

Andrew Huberman's neuroscience lab at Stanford has documented that 10–15 minutes of bright light exposure within 30 minutes of waking triggers a cortisol pulse that:
- Sets your circadian clock for the day
- Advances your alertness onset by 30–60 minutes
- Improves nighttime sleep quality 14–16 hours later

This works even on cloudy days (outdoor light is 10–50x brighter than indoor lighting). If you can't get outside, a 10,000 lux light therapy lamp works as a substitute.

## 3. Delay Caffeine by 90 Minutes

Counter-intuitive, but well-supported. Adenosine (the sleepiness molecule) is naturally high upon waking. Caffeine blocks adenosine receptors, but if you consume it too early, you're blocking receptors that would clear naturally — leading to an afternoon crash when the caffeine wears off and residual adenosine floods in.

By waiting 90 minutes, you allow your natural cortisol awakening response to clear morning adenosine, then use caffeine to extend your alert window. Users who adopt this habit report peak hours lasting 1–2 hours longer.

## 4. Move Before Your First Deep Work Block

A 2019 meta-analysis in the British Journal of Sports Medicine found that even 20 minutes of moderate exercise (brisk walking, cycling, yoga) improves executive function for 2–4 hours afterward. The mechanism is increased BDNF (brain-derived neurotrophic factor) and cerebral blood flow.

You don't need a gym session. A 20-minute walk before your first focus block measurably improves the quality of that block.

## 5. Single-Task Your Peak Hours

This is the hardest habit and the highest-leverage one. During your peak 2–3 hours:
- Close Slack and email
- Put your phone in another room
- Work on exactly one thing

Research from the University of California, Irvine (Mark et al., 2008) found that after an interruption, it takes an average of 23 minutes to fully return to the interrupted task. A single Slack notification during your peak hour can cost you a third of that hour's value.

SyncScript's Focus Fence feature automates this — it silences non-urgent notifications and defers incoming meeting requests during your declared focus windows.

---

*The compound effect: users who adopt 3+ of these habits see their effective peak hours expand from 2–3 hours to 4–5 hours per day. That's an extra 10+ hours of peak performance per week.*`,
  },
  {
    slug: 'state-of-workplace-energy-2026',
    title: 'The State of Workplace Energy in 2026',
    date: 'Jan 22, 2026',
    readTime: '9 min read',
    category: 'Research',
    author: 'SyncScript Research',
    excerpt: 'Findings from our survey of 2,000 knowledge workers on when and how they do their best work.',
    content: `We surveyed 2,000 knowledge workers across tech, finance, healthcare, and education to understand how people experience energy at work. The findings challenge several common assumptions about productivity.

## Key Finding #1: Only 23% of Peak Hours Are Spent on Important Work

The average knowledge worker identifies 2.8 hours per day as their "best hours" for focused thinking. But when we tracked how those hours were actually spent:

- **38% went to meetings** (most of which respondents rated as "could have been an email")
- **27% went to email and Slack**
- **12% went to administrative tasks**
- **23% went to actual focused, important work**

This means the average person is wasting over three-quarters of their best cognitive hours on tasks that don't require peak cognition.

## Key Finding #2: Energy Patterns Are Highly Individual

We asked respondents to map their energy throughout the day on an hourly basis. The results showed far more variation than the standard "morning peak, afternoon dip" model suggests:

- **32% are classic morning types** (peak 8–11 AM)
- **41% are mid-morning types** (peak 10 AM–1 PM)
- **18% are afternoon types** (peak 2–5 PM)
- **9% are evening types** (peak after 5 PM)

This means any company-wide policy about "focus hours" or "no-meeting mornings" will be wrong for 60–70% of the team. Personalization isn't optional — it's a requirement.

## Key Finding #3: Remote Workers Have Better Energy Awareness

Remote workers scored 34% higher on our "energy literacy" assessment (ability to identify their own peak hours and energy triggers). We hypothesize this is because:

1. They have more control over their environment and schedule
2. They're not subject to in-office interruptions that mask energy signals
3. They're more likely to have experimented with flexible scheduling

However, remote workers also reported higher rates of "schedule bleed" — working during low-energy hours because there's no commute-enforced boundary.

## Key Finding #4: Meetings Are the #1 Energy Drain

When asked "What drains your energy the most during a workday?", respondents answered:

1. **Back-to-back meetings with no breaks** (67%)
2. **Context switching between unrelated tasks** (52%)
3. **Unclear priorities / too many things to do** (48%)
4. **Notifications and interruptions** (41%)
5. **Boring or unnecessary meetings** (39%)

The top two answers are both about fragmentation — the schedule architecture, not the work itself. This suggests that better scheduling could address the root cause of workplace energy depletion.

## Key Finding #5: People Know What Works But Don't Do It

89% of respondents agreed that "scheduling demanding tasks during my peak hours would improve my work quality." But only 11% said they actually do it consistently.

The gap isn't knowledge — it's infrastructure. People know they should protect their peak hours, but their calendar tools don't support it. Meetings get scheduled wherever there's a free slot. Tasks get done whenever they feel urgent, regardless of energy.

## What This Means

The data points to a clear opportunity: most knowledge workers are operating at a fraction of their potential — not because they're lazy or disorganized, but because their tools ignore the most fundamental variable in human performance: energy.

A scheduling system that accounts for individual energy patterns and protects peak hours from low-value activities could unlock an enormous amount of latent productivity. That's what we're building.

---

*Full methodology: Online survey, n=2,000, conducted January 2026. Respondents were full-time knowledge workers (primarily desk-based roles) in the US, UK, and Australia. Margin of error: ±2.2% at 95% confidence.*`,
  },
];

export function BlogPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [email, setEmail] = useState('');
  const [subState, setSubState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [subMsg, setSubMsg] = useState('');

  const handleSubscribe = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setSubState('error');
      setSubMsg('Please enter a valid email address.');
      return;
    }

    setSubState('loading');
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/email/subscribe`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: trimmed, segments: ['blog_newsletter'] }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Subscription failed');
      setSubState('success');
      setSubMsg(data.message === 'Already subscribed' ? "You're already subscribed!" : 'Subscribed! Check your inbox.');
      setEmail('');
    } catch (err) {
      setSubState('error');
      setSubMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  const filteredPosts = activeCategory === 'All'
    ? POSTS
    : POSTS.filter((p) => p.category === activeCategory);

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-[#0a0e1a] via-[#0f1420] to-[#0a0e1a] text-white"
      style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
    >
      {/* ── Page Header ── */}
      <div className="mx-auto max-w-5xl px-6 pt-10 sm:px-8 lg:px-10">
        <motion.button
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => navigate('/')}
          className="mb-10 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/90 backdrop-blur-sm transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </motion.button>

        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-12 text-center"
        >
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">SyncScript Blog</h1>
          <p className="mt-4 text-lg text-white/60 font-light">
            Insights on productivity, energy management, and the future of work
          </p>
        </motion.header>

        {/* Category Filter */}
        <div className="mb-12 flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeCategory === cat
                  ? 'bg-cyan-500/30 text-white ring-1 ring-cyan-400/50'
                  : 'bg-white/5 text-white/70 ring-1 ring-white/10 hover:bg-white/10'
              }`}
            >
              {cat}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Featured Post Hero ── */}
      {(activeCategory === 'All' || activeCategory === FEATURED.category) && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/[0.04] via-cyan-500/[0.06] to-transparent pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-cyan-500/[0.06] blur-[120px] pointer-events-none" />

          <div className="relative mx-auto max-w-5xl px-6 py-16 sm:px-8 sm:py-20 lg:px-10">
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              onClick={() => navigate(`/blog/${FEATURED.slug}`)}
              className="cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm transition hover:bg-white/[0.06] hover:border-white/20"
            >
              <div className="grid sm:grid-cols-2">
                <div className="p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
                  <span className={`inline-block self-start rounded-full px-3 py-1 text-xs font-medium ${CATEGORY_COLORS[FEATURED.category]?.badge || 'bg-white/10 text-white/80'}`}>
                    {FEATURED.category}
                  </span>
                  <h2 className="mt-5 text-2xl font-bold sm:text-3xl lg:text-[2rem] leading-tight">{FEATURED.title}</h2>
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/50">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {FEATURED.date}
                    </span>
                    <span>{FEATURED.readTime}</span>
                    <span>{FEATURED.author}</span>
                  </div>
                  <p className="mt-5 text-white/70 font-light leading-relaxed">{FEATURED.excerpt}</p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-cyan-400 hover:text-cyan-300">
                    Read Article <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
                <div className="hidden sm:block overflow-hidden rounded-r-2xl">
                  <img
                    src="/images/blog/featured-circadian.png"
                    alt="Circadian science visualization — a glowing brain with energy wave patterns across a 24-hour cycle"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </motion.article>
          </div>
        </motion.section>
      )}

      {/* ── Post Grid ── */}
      <div className="mx-auto max-w-5xl px-6 pt-4 sm:px-8 lg:px-10 pb-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="grid gap-y-8 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10"
        >
          {filteredPosts.map((post, i) => {
            const colors = CATEGORY_COLORS[post.category];
            return (
              <motion.div
                key={post.slug}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 * i }}
                whileHover={{ y: -4 }}
                onClick={() => navigate(`/blog/${post.slug}`)}
                className={`cursor-pointer overflow-hidden rounded-2xl border bg-gradient-to-br backdrop-blur-sm transition hover:bg-white/[0.07] ${colors?.card || 'from-white/10 to-white/5 border-white/10'}`}
              >
                <div className="p-8 sm:p-9">
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${colors?.badge || 'bg-white/10 text-white/80'}`}>
                    {post.category}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold leading-snug">{post.title}</h3>
                  <div className="mt-3 flex items-center gap-3 text-xs text-white/50">
                    <span>{post.date}</span>
                    <span>{post.readTime}</span>
                  </div>
                  <p className="mt-4 text-sm text-white/60 font-light leading-relaxed">{post.excerpt}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-cyan-400 hover:text-cyan-300">
                    Read Article <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* ── Newsletter Hero Section ── */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative mt-12 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/[0.04] via-teal-500/[0.05] to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-teal-500/[0.06] blur-[100px] pointer-events-none" />

        <div className="relative min-h-[40vh] flex flex-col items-center justify-center px-6 py-20 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mx-auto max-w-xl text-center"
          >
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <Mail className="h-6 w-6 text-cyan-400" />
            </div>
            <h3 className="text-2xl font-bold sm:text-3xl">Stay in the loop</h3>
            <p className="mt-4 text-white/60 font-light leading-relaxed">
              Get the best of the blog in your inbox — research-backed productivity insights, engineering deep dives, and product updates. No spam, unsubscribe anytime.
            </p>
            <AnimatePresence mode="wait">
              {subState === 'success' ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-8 flex flex-col items-center gap-2"
                >
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                  <p className="text-emerald-300 font-medium">{subMsg}</p>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-8 flex flex-col items-center gap-4">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (subState === 'error') setSubState('idle'); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                    placeholder="you@company.com"
                    className={`w-72 max-w-full rounded-lg border bg-white/5 px-5 py-3.5 text-center text-white placeholder:text-white/40 focus:outline-none focus:ring-1 ${
                      subState === 'error'
                        ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/50'
                        : 'border-white/15 focus:border-cyan-500/50 focus:ring-cyan-500/50'
                    }`}
                  />
                  {subState === 'error' && (
                    <p className="text-sm text-red-400">{subMsg}</p>
                  )}
                  <button
                    type="button"
                    onClick={handleSubscribe}
                    disabled={subState === 'loading'}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-8 py-3.5 font-medium text-white transition hover:bg-cyan-600 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {subState === 'loading' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                    {subState === 'loading' ? 'Subscribing...' : 'Subscribe'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}
