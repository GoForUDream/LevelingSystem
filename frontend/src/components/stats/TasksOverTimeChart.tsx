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

interface DailyTaskStats {
  date: string;
  completed: number;
  overdue: number;
  cancelled: number;
  exp_earned: number;
}

interface TasksOverTimeChartProps {
  data: DailyTaskStats[];
}

export default function TasksOverTimeChart({ data }: TasksOverTimeChartProps) {
  // Format dates for display (show abbreviated date)
  const chartData = data.map((d) => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  }));

  // Show fewer labels if there's too much data
  const tickInterval = Math.ceil(chartData.length / 10);

  return (
    <div className="led-border p-4 border border-sl-blue/30 bg-linear-to-b from-sl-gray-light/30 to-sl-gray/20" style={{ '--led-color': '#00A3FF' } as React.CSSProperties}>
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
              formatter={(value: number, name: string) => [
                value,
                name.charAt(0).toUpperCase() + name.slice(1),
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
