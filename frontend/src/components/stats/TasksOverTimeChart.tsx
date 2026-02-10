import { memo, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { chartColors, tooltipStyle, axisStyle, gridStyle } from './ChartTheme';
import type { DailyTaskStats } from '@/types/stats';

interface TasksOverTimeChartProps {
  data: DailyTaskStats[];
}

function TasksOverTimeChart({ data }: TasksOverTimeChartProps) {
  const { chartData, tickInterval } = useMemo(() => {
    const formatted = data.map((d) => ({
      ...d,
      displayDate: new Date(d.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    }));

    return {
      chartData: formatted,
      tickInterval: Math.ceil(formatted.length / 10),
    };
  }, [data]);

  return (
    <div
      className="led-border p-4 border border-sl-blue/30 bg-linear-to-b from-sl-gray-light/30 to-sl-gray/20"
      style={{ '--led-color': '#00A3FF' } as React.CSSProperties}
    >
      <h3 className="text-sm font-bold uppercase tracking-wider text-sl-blue mb-4">
        Tasks Over Time
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid {...gridStyle} vertical={false} />
            <XAxis
              dataKey="displayDate"
              {...axisStyle}
              fontSize={10}
              interval={tickInterval - 1}
              angle={-45}
              textAnchor="end"
              height={50}
            />
            <YAxis {...axisStyle} fontSize={10} allowDecimals={false} />
            <Tooltip
              {...tooltipStyle}
              formatter={(value, name) => [
                value as number,
                (name as string).charAt(0).toUpperCase() + (name as string).slice(1),
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
              formatter={(value) => (
                <span className="text-sl-silver-muted uppercase tracking-wider">
                  {value}
                </span>
              )}
            />
            <Bar
              dataKey="completed"
              fill={chartColors.success}
              radius={[2, 2, 0, 0]}
              maxBarSize={30}
            />
            <Bar
              dataKey="overdue"
              fill={chartColors.danger}
              radius={[2, 2, 0, 0]}
              maxBarSize={30}
            />
            <Bar
              dataKey="cancelled"
              fill={chartColors.muted}
              radius={[2, 2, 0, 0]}
              maxBarSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default memo(TasksOverTimeChart);
