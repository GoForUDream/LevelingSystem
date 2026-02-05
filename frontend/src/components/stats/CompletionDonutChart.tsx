import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { chartColors, tooltipStyle } from './ChartTheme';

interface CompletionBreakdown {
  completed: number;
  overdue: number;
  cancelled: number;
  in_progress: number;
  todo: number;
}

interface CompletionDonutChartProps {
  data: CompletionBreakdown;
}

export default function CompletionDonutChart({ data }: CompletionDonutChartProps) {
  const chartData = [
    { name: 'Completed', value: data.completed, color: chartColors.success },
    { name: 'Overdue', value: data.overdue, color: chartColors.danger },
    { name: 'Cancelled', value: data.cancelled, color: chartColors.muted },
    { name: 'In Progress', value: data.in_progress, color: chartColors.primary },
    { name: 'To Do', value: data.todo, color: chartColors.secondary },
  ].filter((d) => d.value > 0);

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="led-border p-4 border border-sl-purple/30 bg-linear-to-b from-sl-gray-light/30 to-sl-gray/20" style={{ '--led-color': '#7B2CBF' } as React.CSSProperties}>
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
    <div className="led-border p-4 border border-sl-purple/30 bg-linear-to-b from-sl-gray-light/30 to-sl-gray/20" style={{ '--led-color': '#7B2CBF' } as React.CSSProperties}>
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
              formatter={(value: number, name: string) => [
                `${value} (${((value / total) * 100).toFixed(1)}%)`,
                name,
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
