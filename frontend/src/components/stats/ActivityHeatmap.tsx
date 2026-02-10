import { memo, useMemo } from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { HeatmapDay } from '@/types/stats';

interface ActivityHeatmapProps {
  data: HeatmapDay[];
}

function getIntensityColor(intensity: number): string {
  const colors: Record<number, string> = {
    1: 'rgba(74, 222, 128, 0.25)',
    2: 'rgba(74, 222, 128, 0.5)',
    3: 'rgba(74, 222, 128, 0.75)',
    4: 'rgba(74, 222, 128, 1)',
  };
  return colors[intensity] || 'transparent';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const { weeks, monthLabels } = useMemo(() => {
    const weeksArr: HeatmapDay[][] = [];
    let currentWeek: HeatmapDay[] = [];

    if (data.length > 0) {
      const firstDate = new Date(data[0].date);
      const dayOfWeek = firstDate.getDay();

      // Add empty days to align to Sunday
      for (let i = 0; i < dayOfWeek; i++) {
        currentWeek.push({ date: '', count: 0, intensity: -1 });
      }

      for (const day of data) {
        currentWeek.push(day);
        if (currentWeek.length === 7) {
          weeksArr.push(currentWeek);
          currentWeek = [];
        }
      }

      // Push remaining days
      if (currentWeek.length > 0) {
        weeksArr.push(currentWeek);
      }
    }

    // Calculate month labels
    const months: { label: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    weeksArr.forEach((week, weekIndex) => {
      for (const day of week) {
        if (day.date) {
          const date = new Date(day.date);
          const month = date.getMonth();
          if (month !== lastMonth) {
            months.push({
              label: date.toLocaleDateString('en-US', { month: 'short' }),
              weekIndex,
            });
            lastMonth = month;
          }
          break;
        }
      }
    });

    return { weeks: weeksArr, monthLabels: months };
  }, [data]);

  return (
    <div
      className="led-border p-4 border border-green-400/30 bg-linear-to-b from-sl-gray-light/30 to-sl-gray/20"
      style={{ '--led-color': '#4ADE80' } as React.CSSProperties}
    >
      <h3 className="text-sm font-bold uppercase tracking-wider text-green-400 mb-4">
        Activity
      </h3>

      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1 min-w-max">
          {/* Month labels */}
          <div className="flex items-center pl-6 gap-0.5 mb-1">
            {monthLabels.map((m, i) => (
              <div
                key={i}
                className="text-[9px] text-sl-silver-muted"
                style={{
                  marginLeft:
                    i === 0
                      ? `${m.weekIndex * 12}px`
                      : `${(m.weekIndex - (monthLabels[i - 1]?.weekIndex ?? 0) - 1) * 12}px`,
                }}
              >
                {m.label}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 justify-center pr-1">
              {DAY_LABELS.map((label, i) => (
                <div
                  key={i}
                  className="text-[9px] text-sl-silver-muted h-2.5 flex items-center justify-end"
                  style={{ visibility: i % 2 === 1 ? 'visible' : 'hidden' }}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Weeks */}
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-0.5">
                {week.map((day, dayIndex) => (
                  <Tooltip key={`${weekIndex}-${dayIndex}`}>
                    <TooltipTrigger asChild>
                      <div
                        className={`w-2.5 h-2.5 ${
                          day.intensity === -1
                            ? 'bg-transparent'
                            : day.intensity === 0
                              ? 'bg-sl-gray-muted/30'
                              : ''
                        }`}
                        style={{
                          backgroundColor:
                            day.intensity > 0 ? getIntensityColor(day.intensity) : undefined,
                        }}
                      />
                    </TooltipTrigger>
                    {day.date && (
                      <TooltipContent
                        side="top"
                        className="bg-sl-gray! border-sl-gray-muted! text-sl-silver! p-2"
                      >
                        <p className="text-xs font-medium">
                          {day.count} task{day.count !== 1 ? 's' : ''}
                        </p>
                        <p className="text-[10px] text-sl-silver-muted">{formatDate(day.date)}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-sl-gray-muted/30">
            <span className="text-[9px] text-sl-silver-muted">Less</span>
            <div className="flex gap-0.5">
              {[0, 1, 2, 3, 4].map((intensity) => (
                <div
                  key={intensity}
                  className={`w-2.5 h-2.5 ${intensity === 0 ? 'bg-sl-gray-muted/30' : ''}`}
                  style={{
                    backgroundColor: intensity > 0 ? getIntensityColor(intensity) : undefined,
                  }}
                />
              ))}
            </div>
            <span className="text-[9px] text-sl-silver-muted">More</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(ActivityHeatmap);
