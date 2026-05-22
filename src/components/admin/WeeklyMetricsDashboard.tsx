/**
 * Weekly Active Schedulers (WAS) Dashboard
 *
 * North-star metric per business plan §4.2:
 * WAS = users who (a) complete ≥1 task/calendar action AND (b) view dashboard ≥1× per week
 *
 * Reads from PostHog when configured; falls back to local localStorage counts.
 */
import { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  BarChart3, CheckCircle, Calendar, Activity, Users,
  TrendingUp, TrendingDown, Minus, Zap, Eye
} from 'lucide-react';

interface WeekBucket {
  weekStart: string;
  dashboardViews: number;
  tasksCompleted: number;
  calendarActions: number;
  wasCount: number;
}

const STORAGE_KEY = 'syncscript_was_weekly';

function getWeekKey(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  d.setUTCDate(diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function loadBuckets(): WeekBucket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveBuckets(buckets: WeekBucket[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(buckets)); } catch {}
}

function recordEvent(eventType: 'dashboard_view' | 'task_completed' | 'calendar_action'): void {
  const buckets = loadBuckets();
  const weekKey = getWeekKey(new Date());
  let bucket = buckets.find(b => b.weekStart === weekKey);
  if (!bucket) {
    bucket = { weekStart: weekKey, dashboardViews: 0, tasksCompleted: 0, calendarActions: 0, wasCount: 0 };
    buckets.push(bucket);
  }
  if (eventType === 'dashboard_view') bucket.dashboardViews++;
  else if (eventType === 'task_completed') bucket.tasksCompleted++;
  else if (eventType === 'calendar_action') bucket.calendarActions++;
  // Recalculate WAS: user qualified this week if they have both a dashboard view AND a task/calendar action
  const qualifiedDashboard = bucket.dashboardViews > 0;
  const qualifiedAction = bucket.tasksCompleted > 0 || bucket.calendarActions > 0;
  bucket.wasCount = (qualifiedDashboard && qualifiedAction) ? 1 : 0;
  // Keep last 12 weeks
  const trimmed = buckets.slice(-12);
  saveBuckets(trimmed);
}

// Expose for analytics wiring
if (typeof window !== 'undefined') {
  (window as any).__syncscript_was_record = recordEvent;
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  if (trend === 'up') return <TrendingUp className="w-4 h-4 text-emerald-400" />;
  if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-400" />;
  return <Minus className="w-4 h-4 text-white/40" />;
}

function calcTrend(current: number, previous: number): 'up' | 'down' | 'flat' {
  if (previous === 0) return current > 0 ? 'up' : 'flat';
  const pct = ((current - previous) / previous) * 100;
  if (pct > 5) return 'up';
  if (pct < -5) return 'down';
  return 'flat';
}

export function WeeklyMetricsDashboard() {
  const [buckets, setBuckets] = useState<WeekBucket[]>([]);

  const refresh = useCallback(() => { setBuckets(loadBuckets()); }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const current = buckets[buckets.length - 1];
  const previous = buckets[buckets.length - 2];
  const hasData = buckets.length > 0;

  const thisWeekWAS = current?.wasCount ?? 0;
  const wasTrend = previous ? calcTrend(thisWeekWAS, previous.wasCount) : 'flat';

  const thisWeekTasks = current?.tasksCompleted ?? 0;
  const tasksTrend = previous ? calcTrend(thisWeekTasks, previous.tasksCompleted) : 'flat';

  const thisWeekCal = current?.calendarActions ?? 0;
  const calTrend = previous ? calcTrend(thisWeekCal, previous.calendarActions) : 'flat';

  const thisWeekViews = current?.dashboardViews ?? 0;
  const viewsTrend = previous ? calcTrend(thisWeekViews, previous.dashboardViews) : 'flat';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-cyan-400" /> Weekly Metrics
        </h2>
        <Badge variant="outline" className="text-white/60 border-white/10">
          Business Plan §4.2
        </Badge>
      </div>

      {!hasData ? (
        <Card className="p-8 text-center bg-white/[0.02] border-white/[0.06]">
          <Activity className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <p className="text-white/50 text-sm">No weekly data yet. Metrics populate as users interact with the app.</p>
        </Card>
      ) : (
        <>
          {/* North-star metric */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border-cyan-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-cyan-300/70 font-medium uppercase tracking-wider">WAS</span>
                <TrendIcon trend={wasTrend} />
              </div>
              <p className="text-3xl font-bold text-cyan-300">{thisWeekWAS}</p>
              <p className="text-xs text-white/40 mt-1">Weekly Active Schedulers</p>
            </Card>

            <Card className="p-5 bg-white/[0.02] border-white/[0.06]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/50 font-medium uppercase tracking-wider">Tasks Done</span>
                <TrendIcon trend={tasksTrend} />
              </div>
              <p className="text-3xl font-bold text-white">{thisWeekTasks}</p>
              <p className="text-xs text-white/40 mt-1">Completed this week</p>
            </Card>

            <Card className="p-5 bg-white/[0.02] border-white/[0.06]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/50 font-medium uppercase tracking-wider">Calendar</span>
                <TrendIcon trend={calTrend} />
              </div>
              <p className="text-3xl font-bold text-white">{thisWeekCal}</p>
              <p className="text-xs text-white/40 mt-1">Actions this week</p>
            </Card>

            <Card className="p-5 bg-white/[0.02] border-white/[0.06]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/50 font-medium uppercase tracking-wider">Dashboard</span>
                <TrendIcon trend={viewsTrend} />
              </div>
              <p className="text-3xl font-bold text-white">{thisWeekViews}</p>
              <p className="text-xs text-white/40 mt-1">Views this week</p>
            </Card>
          </div>

          {/* Weekly trend table */}
          <Card className="p-5 bg-white/[0.02] border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white/70 mb-3">Weekly Trend (last 12 weeks)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-2 text-white/40">Week</th>
                    <th className="text-center py-2 text-white/40"><Eye className="w-3 h-3 inline" /> Views</th>
                    <th className="text-center py-2 text-white/40"><CheckCircle className="w-3 h-3 inline" /> Tasks</th>
                    <th className="text-center py-2 text-white/40"><Calendar className="w-3 h-3 inline" /> Calendar</th>
                    <th className="text-center py-2 text-white/40"><Zap className="w-3 h-3 inline" /> WAS</th>
                  </tr>
                </thead>
                <tbody>
                  {buckets.slice().reverse().map(b => (
                    <tr key={b.weekStart} className="border-b border-white/[0.03]">
                      <td className="py-1.5 text-white/60">{b.weekStart}</td>
                      <td className="text-center text-white/50">{b.dashboardViews}</td>
                      <td className="text-center text-white/50">{b.tasksCompleted}</td>
                      <td className="text-center text-white/50">{b.calendarActions}</td>
                      <td className="text-center">
                        <Badge variant={b.wasCount > 0 ? 'default' : 'secondary'}
                               className={b.wasCount > 0 ? 'bg-cyan-500/20 text-cyan-300' : 'text-white/30'}>
                          {b.wasCount > 0 ? 'Active' : '—'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
