/**
 * Public changelog — `/changelog`. No-auth, marketing-grade.
 *
 * Sourced from `public/changelog.json` so the dataset is editable without a
 * code change (a small npm script can be added later to auto-generate this
 * from git tags or merged PR titles). For now, hand-curated entries — the
 * ones customers care about, not "bumped lockfile" noise.
 *
 * Linkable per-release: every entry has a stable id; URL fragment
 * `/changelog#2026-04-26` jumps directly to that release.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Sparkles, Wrench, Zap, Shield, Bug, BookOpen } from 'lucide-react';

interface ChangelogEntry {
  id: string;
  date: string; // ISO YYYY-MM-DD
  version?: string;
  title: string;
  highlights: string[];
  tags?: ('feature' | 'fix' | 'perf' | 'security' | 'docs' | 'tooling')[];
}

interface ChangelogPayload {
  entries: ChangelogEntry[];
  updated_at?: string;
}

const TAG_ICONS = {
  feature: Sparkles,
  fix: Bug,
  perf: Zap,
  security: Shield,
  docs: BookOpen,
  tooling: Wrench,
} as const;

const TAG_COLORS = {
  feature: 'border-cyan-400/40 bg-cyan-500/10 text-cyan-200',
  fix:     'border-emerald-400/40 bg-emerald-500/10 text-emerald-200',
  perf:    'border-violet-400/40 bg-violet-500/10 text-violet-200',
  security:'border-rose-400/40 bg-rose-500/10 text-rose-200',
  docs:    'border-slate-400/40 bg-slate-500/10 text-slate-200',
  tooling: 'border-amber-400/40 bg-amber-500/10 text-amber-200',
} as const;

export function ChangelogPage() {
  const [data, setData] = useState<ChangelogPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/changelog.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j: ChangelogPayload) => { if (!cancelled) setData(j); })
      .catch((e: Error) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, []);

  // Once the data lands, scroll to a hash-targeted entry.
  useEffect(() => {
    if (!data) return;
    const hash = window.location.hash.replace(/^#/, '');
    if (hash) {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  }, [data]);

  const sorted = useMemo(
    () => (data?.entries ?? []).slice().sort((a, b) => b.date.localeCompare(a.date)),
    [data],
  );

  return (
    <div data-marketing-root className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <header className="mb-10">
          <h1 className="text-4xl font-semibold tracking-tight">Changelog</h1>
          <p className="mt-2 text-slate-300">
            What we shipped, when, and why. Subscribe to{' '}
            <a
              href="/changelog.json"
              className="text-cyan-400 hover:underline"
              rel="noopener noreferrer"
            >
              the JSON feed
            </a>{' '}
            for tooling.
          </p>
        </header>

        {error && (
          <div className="mb-8 rounded-lg border border-rose-400/40 bg-rose-500/10 p-4 text-rose-200 text-sm">
            Couldn't load the changelog: <span className="font-mono">{error}</span>. Refresh the page or contact{' '}
            <a className="font-mono text-cyan-300 hover:underline" href="mailto:support@syncscript.app">support@syncscript.app</a>.
          </div>
        )}

        {!data && !error && (
          <div className="text-sm text-slate-500">Loading…</div>
        )}

        <ol className="space-y-10">
          {sorted.map((entry) => (
            <li key={entry.id} id={entry.id} className="scroll-mt-24">
              <article className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                <header className="mb-3 flex flex-wrap items-baseline gap-3">
                  <h2 className="text-xl font-semibold tracking-tight">
                    <a className="hover:text-cyan-300" href={`#${entry.id}`}>{entry.title}</a>
                  </h2>
                  <time className="text-sm text-slate-400" dateTime={entry.date}>
                    {new Date(entry.date + 'T00:00:00Z').toLocaleDateString(undefined, {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </time>
                  {entry.version && (
                    <span className="rounded border border-slate-700 px-1.5 py-0.5 font-mono text-xs text-slate-300">
                      {entry.version}
                    </span>
                  )}
                </header>

                {entry.tags && entry.tags.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {entry.tags.map((t) => {
                      const Icon = TAG_ICONS[t];
                      const cls = TAG_COLORS[t];
                      return (
                        <span
                          key={t}
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] uppercase tracking-wide ${cls}`}
                        >
                          <Icon className="h-3 w-3" />
                          {t}
                        </span>
                      );
                    })}
                  </div>
                )}

                <ul className="list-disc space-y-1.5 pl-5 text-slate-300">
                  {entry.highlights.map((h, i) => <li key={i}>{h}</li>)}
                </ul>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
