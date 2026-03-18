import { analytics } from './analytics';

type PerfMetricName = 'route_interaction_ms' | 'inp_candidate_ms';

interface PerfSample {
  t: number;
  v: number;
}

interface PerfBaselineStore {
  route_interaction_ms: PerfSample[];
  inp_candidate_ms: PerfSample[];
}

const PERF_BASELINE_KEY = 'syncscript_perf_baseline_v1';
const MAX_SAMPLES_PER_METRIC = 200;
const PERF_SNAPSHOT_SENT_KEY = 'syncscript_perf_snapshot_sent_v1';
const PERF_EVENT_LAST_SENT_KEY = 'syncscript_perf_last_sent_ts_v1';
const PERF_EVENT_MIN_INTERVAL_MS = 15000;
const PERF_BUDGETS = {
  route_interaction_p75_ms: 500,
  inp_candidate_p75_ms: 200,
} as const;

function readBaselineStore(): PerfBaselineStore {
  if (typeof window === 'undefined') {
    return { route_interaction_ms: [], inp_candidate_ms: [] };
  }
  try {
    const raw = localStorage.getItem(PERF_BASELINE_KEY);
    if (!raw) return { route_interaction_ms: [], inp_candidate_ms: [] };
    const parsed = JSON.parse(raw);
    return {
      route_interaction_ms: Array.isArray(parsed?.route_interaction_ms) ? parsed.route_interaction_ms : [],
      inp_candidate_ms: Array.isArray(parsed?.inp_candidate_ms) ? parsed.inp_candidate_ms : [],
    };
  } catch {
    return { route_interaction_ms: [], inp_candidate_ms: [] };
  }
}

function writeBaselineStore(store: PerfBaselineStore): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PERF_BASELINE_KEY, JSON.stringify(store));
  } catch {
    // Best effort only.
  }
}

function appendBaselineSample(metric: PerfMetricName, value: number): void {
  const normalized = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  const store = readBaselineStore();
  const next = [...store[metric], { t: Date.now(), v: normalized }];
  store[metric] = next.slice(-MAX_SAMPLES_PER_METRIC);
  writeBaselineStore(store);
}

function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * sorted.length)));
  return sorted[idx];
}

export function getPerfBaselineSummary() {
  const store = readBaselineStore();
  const routeValues = store.route_interaction_ms.map((s) => s.v);
  const inpValues = store.inp_candidate_ms.map((s) => s.v);

  return {
    routeInteraction: {
      samples: routeValues.length,
      p50: percentile(routeValues, 50),
      p75: percentile(routeValues, 75),
      p95: percentile(routeValues, 95),
      max: routeValues.length ? Math.max(...routeValues) : 0,
    },
    inpCandidate: {
      samples: inpValues.length,
      p50: percentile(inpValues, 50),
      p75: percentile(inpValues, 75),
      p95: percentile(inpValues, 95),
      max: inpValues.length ? Math.max(...inpValues) : 0,
    },
  };
}

export function getPerfBudgetStatus() {
  const summary = getPerfBaselineSummary();
  const routeP75 = summary.routeInteraction.p75;
  const inpP75 = summary.inpCandidate.p75;
  const routeWithinBudget = routeP75 <= PERF_BUDGETS.route_interaction_p75_ms;
  const inpWithinBudget = inpP75 <= PERF_BUDGETS.inp_candidate_p75_ms;

  return {
    budgets: PERF_BUDGETS,
    summary,
    routeInteraction: {
      p75: routeP75,
      budgetMs: PERF_BUDGETS.route_interaction_p75_ms,
      withinBudget: routeWithinBudget,
    },
    inpCandidate: {
      p75: inpP75,
      budgetMs: PERF_BUDGETS.inp_candidate_p75_ms,
      withinBudget: inpWithinBudget,
    },
    overallWithinBudget: routeWithinBudget && inpWithinBudget,
  };
}

export function trackRouteInteractionTiming(routePath: string, durationMs: number): void {
  const normalized = Number.isFinite(durationMs) ? Math.max(0, durationMs) : 0;
  appendBaselineSample('route_interaction_ms', normalized);
  analytics.trackEvent({
    category: 'Performance',
    action: 'route_interaction_timing',
    label: routePath,
    value: Math.round(normalized),
    route_path: routePath,
  });
}

export function startPerformanceTelemetry(): void {
  if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') return;
  if ((window as any).__syncscriptPerfTelemetryStarted) return;
  (window as any).__syncscriptPerfTelemetryStarted = true;
  (window as any).__syncscriptPerfTelemetry = {
    getSummary: getPerfBaselineSummary,
    getBudgetStatus: getPerfBudgetStatus,
    budgets: PERF_BUDGETS,
  };

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as any[];
      for (const entry of entries) {
        const duration = Number(entry?.duration || 0);
        if (!Number.isFinite(duration) || duration <= 0) continue;

        appendBaselineSample('inp_candidate_ms', duration);
        const lastSent = Number(sessionStorage.getItem(PERF_EVENT_LAST_SENT_KEY) || 0);
        const now = Date.now();
        if (now - lastSent < PERF_EVENT_MIN_INTERVAL_MS) {
          continue;
        }
        sessionStorage.setItem(PERF_EVENT_LAST_SENT_KEY, String(now));
        analytics.trackEvent({
          category: 'Performance',
          action: 'inp_candidate',
          label: String(entry?.name || 'interaction'),
          value: Math.round(duration),
          interaction_target: String(entry?.name || ''),
        });
      }
    });

    observer.observe({ type: 'event', durationThreshold: 40 } as any);
  } catch {
    // Browser does not support event timing observer.
  }

  const reportSnapshotIfNeeded = () => {
    if (typeof document === 'undefined') return;
    if (document.visibilityState !== 'hidden') return;
    if (sessionStorage.getItem(PERF_SNAPSHOT_SENT_KEY) === '1') return;

    const budgetStatus = getPerfBudgetStatus();
    const summary = budgetStatus.summary;
    analytics.trackEvent({
      category: 'Performance',
      action: 'perf_baseline_snapshot',
      label: window.location.pathname,
      route_samples: summary.routeInteraction.samples,
      route_p75_ms: summary.routeInteraction.p75,
      route_p95_ms: summary.routeInteraction.p95,
      inp_samples: summary.inpCandidate.samples,
      inp_p75_ms: summary.inpCandidate.p75,
      inp_p95_ms: summary.inpCandidate.p95,
      route_p75_budget_ms: budgetStatus.routeInteraction.budgetMs,
      route_p75_within_budget: budgetStatus.routeInteraction.withinBudget,
      inp_p75_budget_ms: budgetStatus.inpCandidate.budgetMs,
      inp_p75_within_budget: budgetStatus.inpCandidate.withinBudget,
      perf_overall_within_budget: budgetStatus.overallWithinBudget,
    });
    analytics.trackEvent({
      category: 'Performance',
      action: 'perf_budget_status',
      label: window.location.pathname,
      route_p75_ms: budgetStatus.routeInteraction.p75,
      route_p75_budget_ms: budgetStatus.routeInteraction.budgetMs,
      route_p75_within_budget: budgetStatus.routeInteraction.withinBudget,
      inp_p75_ms: budgetStatus.inpCandidate.p75,
      inp_p75_budget_ms: budgetStatus.inpCandidate.budgetMs,
      inp_p75_within_budget: budgetStatus.inpCandidate.withinBudget,
      perf_overall_within_budget: budgetStatus.overallWithinBudget,
      route_samples: summary.routeInteraction.samples,
      inp_samples: summary.inpCandidate.samples,
    });
    sessionStorage.setItem(PERF_SNAPSHOT_SENT_KEY, '1');
  };

  document.addEventListener('visibilitychange', reportSnapshotIfNeeded);
  window.addEventListener('pagehide', reportSnapshotIfNeeded);
}
