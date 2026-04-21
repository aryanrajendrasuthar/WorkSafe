import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface CheckinDay {
  date: string;
  overallStatus: 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE';
}

interface CheckinHeatmapProps {
  data: CheckinDay[];
  weeks?: number;
}

const STATUS_COLORS: Record<string, string> = {
  NONE: 'bg-green-400',
  MILD: 'bg-yellow-300',
  MODERATE: 'bg-orange-400',
  SEVERE: 'bg-red-500',
  empty: 'bg-gray-100',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['', 'M', '', 'W', '', 'F', ''];

export function CheckinHeatmap({ data, weeks = 18 }: CheckinHeatmapProps) {
  const { grid, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build a map of date → status
    const statusMap: Record<string, string> = {};
    for (const d of data) {
      statusMap[d.date.split('T')[0]] = d.overallStatus;
    }

    // Total days = weeks * 7, ending today
    const totalDays = weeks * 7;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - totalDays + 1);

    // Align to Sunday
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const cells: { date: Date; status: string | null }[] = [];
    for (let i = 0; i < weeks * 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const key = d.toISOString().split('T')[0];
      const isFuture = d > today;
      cells.push({ date: d, status: isFuture ? null : statusMap[key] ?? null });
    }

    // Group into columns (weeks)
    const cols: typeof cells[] = [];
    for (let w = 0; w < weeks; w++) {
      cols.push(cells.slice(w * 7, w * 7 + 7));
    }

    // Month labels
    const labels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    cols.forEach((col, ci) => {
      const m = col[0].date.getMonth();
      if (m !== lastMonth) {
        labels.push({ label: MONTHS[m], col: ci });
        lastMonth = m;
      }
    });

    return { grid: cols, monthLabels: labels };
  }, [data, weeks]);

  return (
    <div className="space-y-1 overflow-x-auto">
      {/* Month labels */}
      <div className="flex gap-[3px] pl-5">
        {grid.map((_, ci) => {
          const label = monthLabels.find((l) => l.col === ci);
          return (
            <div key={ci} className="w-3 text-[9px] text-gray-400 shrink-0">
              {label?.label ?? ''}
            </div>
          );
        })}
      </div>

      {/* Grid */}
      <div className="flex gap-[2px]">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] mr-1">
          {DAYS.map((d, i) => (
            <div key={i} className="w-3 h-3 text-[9px] text-gray-400 flex items-center justify-center">
              {d}
            </div>
          ))}
        </div>

        {/* Cells */}
        {grid.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((cell, di) => (
              <div
                key={di}
                title={cell.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + (cell.status ? ` — ${cell.status}` : '')}
                className={cn(
                  'w-3 h-3 rounded-[2px] transition-opacity',
                  cell.status === null ? 'bg-gray-50 opacity-40' : (STATUS_COLORS[cell.status] ?? STATUS_COLORS.empty),
                )}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-[10px] text-gray-400 pt-1">
        <span>Less</span>
        {['empty', 'NONE', 'MILD', 'MODERATE', 'SEVERE'].map((s) => (
          <div key={s} className={cn('w-3 h-3 rounded-[2px]', STATUS_COLORS[s])} />
        ))}
        <span>More pain</span>
      </div>
    </div>
  );
}
