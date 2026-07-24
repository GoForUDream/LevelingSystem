import { memo, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { chartColors, tooltipStyle, axisStyle, gridStyle } from './ChartTheme';
import type { TimelinePoint } from '@/types/stats';

interface ExpProgressChartProps {
  data: TimelinePoint[];
  granularity: 'day' | 'month';
}

function ExpProgressChart({ data, granularity }: ExpProgressChartProps) {
  const { chartData, tickInterval } = useMemo(() => {
    const formatted = data.reduce<
      Array<{
        date: string;
        displayDate: string;
        cumulativeExp: number;
      }>
    >((acc, d, i) => {
      const prevCumulative = i > 0 ? acc[i - 1].cumulativeExp : 0;
      acc.push({
        date: d.date,
        displayDate: new Date(`${d.date}T00:00:00`).toLocaleDateString('en-US', {
          month: 'short',
          ...(granularity === 'day' ? { day: 'numeric' as const } : {}),
        }),
        cumulativeExp: prevCumulative + d.net_exp,
      });
      return acc;
    }, []);

    return {
      chartData: formatted,
      tickInterval: Math.ceil(formatted.length / 10),
    };
  }, [data, granularity]);

  return (
    <div
      className="led-border p-4 border border-sl-purple/30 bg-linear-to-b from-sl-gray-light/30 to-sl-gray/20"
      style={{ '--led-color': '#7B2CBF' } as React.CSSProperties}
    >
      <h3 className="text-sm font-bold uppercase tracking-wider text-sl-purple mb-4">
        Net EXP Progress
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="expGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColors.secondary} stopOpacity={0.4} />
                <stop offset="95%" stopColor={chartColors.secondary} stopOpacity={0} />
              </linearGradient>
            </defs>
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
            <YAxis
              {...axisStyle}
              fontSize={10}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip
              {...tooltipStyle}
              formatter={(value) => [Number(value).toLocaleString(), 'Net EXP']}
              labelFormatter={(label) => `Period: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="cumulativeExp"
              stroke={chartColors.secondary}
              strokeWidth={2}
              fill="url(#expGradient)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default memo(ExpProgressChart);
