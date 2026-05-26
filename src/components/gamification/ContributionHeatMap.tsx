import { useMemo } from 'react';

interface DayActivity {
  date: string;
  count: number;
}

interface ContributionHeatMapProps {
  activities: DayActivity[];
  totalPoints?: number;
  currentStreak?: number;
  longestStreak?: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

function getColor(count: number): string {
  if (count === 0) return 'bg-white/5';
  if (count === 1) return 'bg-emerald-900/60';
  if (count <= 3) return 'bg-emerald-700/70';
  if (count <= 6) return 'bg-emerald-500/80';
  return 'bg-emerald-400';
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function ContributionHeatMap({
  activities,
  totalPoints = 0,
  currentStreak = 0,
  longestStreak = 0,
}: ContributionHeatMapProps) {
  const activityMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of activities) {
      map.set(a.date, a.count);
    }
    return map;
  }, [activities]);

  // Build 52 weeks of cells (364 days), ending today
  const weeks = useMemo(() => {
    const today = new Date();
    const cells: Array<{ date: string; count: number; month: number }[]> = [];
    let currentWeek: Array<{ date: string; count: number; month: number }> = [];

    // Go back 364 days
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 363);
    // Align to the previous Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const d = new Date(startDate);
    while (d <= today) {
      const dateStr = formatDate(d);
      const count = activityMap.get(dateStr) || 0;
      currentWeek.push({ date: dateStr, count, month: d.getMonth() });

      if (d.getDay() === 6) {
        cells.push(currentWeek);
        currentWeek = [];
      }
      d.setDate(d.getDate() + 1);
    }
    if (currentWeek.length > 0) cells.push(currentWeek);

    return cells;
  }, [activityMap]);

  const level = Math.floor(totalPoints / 100) + 1;

  return (
    <div className="space-y-3">
      {/* Stats bar */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold text-lg">{totalPoints.toLocaleString()}</span>
          <span className="text-white/50">points</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/90 font-semibold">Level {level}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-semibold">{currentStreak}</span>
          <span className="text-white/50">day streak</span>
        </div>
        {longestStreak > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-white/30">Best: {longestStreak}d</span>
          </div>
        )}
      </div>

      {/* Heat map grid */}
      <div className="overflow-x-auto">
        <div className="flex gap-[3px] pb-1" style={{ minWidth: '680px' }}>
          {/* Day labels */}
          <div className="flex flex-col gap-[3px] text-[10px] text-white/30 pr-1">
            {DAYS.map((label, i) => (
              <div key={i} className="h-[13px] leading-[13px]">{label}</div>
            ))}
          </div>

          {/* Weeks */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day, di) => (
                <div
                  key={di}
                  className={`h-[13px] w-[13px] rounded-[2px] ${getColor(day.count)} transition-colors`}
                  title={`${day.date}: ${day.count} activit${day.count === 1 ? 'y' : 'ies'}`}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Month labels */}
        <div className="flex text-[10px] text-white/30 mt-1" style={{ minWidth: '680px', marginLeft: '22px' }}>
          {weeks.map((week, i) => {
            const firstDay = week[0];
            if (!firstDay) return null;
            // Show month label if this is the first week of a new month
            const prevWeek = i > 0 ? weeks[i - 1] : null;
            const isNewMonth = !prevWeek || prevWeek[0]?.month !== firstDay.month;
            return (
              <div key={i} className="w-[13px] mr-[3px]">
                {isNewMonth ? MONTHS[firstDay.month] : ''}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-[10px] text-white/40">
        <span>Less</span>
        {[0, 1, 3, 6, 8].map((n) => (
          <div key={n} className={`h-[13px] w-[13px] rounded-[2px] ${getColor(n)}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
