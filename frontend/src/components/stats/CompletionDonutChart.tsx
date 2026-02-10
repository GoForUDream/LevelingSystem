import { memo, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { chartColors, tooltipStyle } from './ChartTheme';
import type { CompletionBreakdown } from '@/types/stats';

interface CompletionDonutChartProps {
  data: CompletionBreakdown;
}

function CompletionDonutChart({ data }: CompletionDonutChartProps) {
  const { chartData, total } = useMemo(() => {
    const items = [
      { name: 'Completed', value: data.completed, color: chartColors.success },
      { name: 'Overdue', value: data.overdue, color: chartColors.danger },
      { name: 'Cancelled', value: data.cancelled, color: chartColors.muted },
      { name: 'In Progress', value: data.in_progress, color: chartColors.primary },
      { name: 'To Do', value: data.todo, color: chartColors.secondary },
    ].filter((d) => d.value > 0);

    return {
      chartData: items,
      total: items.reduce((sum, d) => sum + d.value, 0),
    };
  }, [data]);

  if (total === 0) {
    return (
      <div
        className="led-border p-4 border border-sl-purple/30 bg-linear-to-b from-sl-gray-light/30 to-sl-gray/20"
        style={{ '--led-color': '#7B2CBF' } as React.CSSProperties}
      >
        <h3 className="text-sm font-bold uppercase tracking-wider text-sl-purple mb-4">
          Task Breakdown
        </h3>
        <div className="h-64 flex items-center justify-center text-sl-silver-muted">
          No tasks in this period
        </div>
      </div>
    );
  }

  return (
    <div
      className="led-border p-4 border border-sl-purple/30 bg-linear-to-b from-sl-gray-light/30 to-sl-gray/20"
      style={{ '--led-color': '#7B2CBF' } as React.CSSProperties}
    >
      <h3 className="text-sm font-bold uppercase tracking-wider text-sl-purple mb-4">
        Task Breakdown
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              {...tooltipStyle}
              formatter={(value, name) => [
                `${value} (${(((value as number) / total) * 100).toFixed(1)}%)`,
                name as string,
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: '10px' }}
              formatter={(value) => (
                <span className="text-sl-silver-muted">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default memo(CompletionDonutChart);
