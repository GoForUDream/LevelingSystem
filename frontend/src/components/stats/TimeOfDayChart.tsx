import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { chartColors, tooltipStyle, axisStyle, gridStyle } from './ChartTheme';

interface TimeOfDayDistribution {
  hour: number;
  count: number;
}

interface TimeOfDayChartProps {
  data: TimeOfDayDistribution[];
  mostProductiveHour: number | null;
}

export default function TimeOfDayChart({ data, mostProductiveHour }: TimeOfDayChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: formatHour(d.hour),
  }));

  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <div className="led-border p-4 border border-orange-400/30 bg-linear-to-b from-sl-gray-light/30 to-sl-gray/20" style={{ '--led-color': '#FF6B00' } as React.CSSProperties}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-orange-400">
          Time of Day
        </h3>
        {mostProductiveHour !== null && (
          <span className="text-xs text-sl-silver-muted">
            Peak: <span className="text-orange-400 font-bold">{formatHour(mostProductiveHour)}</span>
          </span>
        )}
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid {...gridStyle} vertical={false} />
            <XAxis
              dataKey="label"
              {...axisStyle}
              fontSize={9}
              interval={2}
              angle={-45}
              textAnchor="end"
              height={40}
            />
            <YAxis {...axisStyle} fontSize={10} allowDecimals={false} />
            <Tooltip
              {...tooltipStyle}
              formatter={(value: number) => [value, 'Tasks']}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Bar dataKey="count" radius={[2, 2, 0, 0]} maxBarSize={20}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.hour === mostProductiveHour && maxCount > 0
                      ? chartColors.warning
                      : getHourColor(entry.hour)
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

function getHourColor(hour: number): string {
  // Dawn/morning: 5-11 (soft blue/cyan)
  if (hour >= 5 && hour < 12) return '#00A3FF';
  // Afternoon: 12-17 (yellow/green)
  if (hour >= 12 && hour < 18) return '#4ADE80';
  // Evening: 18-22 (purple)
  if (hour >= 18 && hour < 23) return '#7B2CBF';
  // Night: 23-4 (dark blue)
  return '#3B82F6';
}
