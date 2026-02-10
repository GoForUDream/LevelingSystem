import { memo, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { PeriodComparison } from '@/types/stats';

interface ComparisonCardProps {
  comparison: PeriodComparison;
}

function ComparisonCard({ comparison }: ComparisonCardProps) {
  const { metrics, ledColor, borderColor, titleColor } = useMemo(() => {
    const metricsData = [
      {
        label: 'Tasks Completed',
        ...comparison.tasks_completed,
        format: (v: number) => v.toLocaleString(),
      },
      {
        label: 'EXP Earned',
        ...comparison.exp_earned,
        format: (v: number) => v.toLocaleString(),
      },
      {
        label: 'Completion Rate',
        ...comparison.completion_rate,
        format: (v: number) => `${v.toFixed(1)}%`,
      },
      {
        label: 'Avg Daily Tasks',
        ...comparison.average_daily_tasks,
        format: (v: number) => v.toFixed(1),
      },
    ];

    const isMonthly = comparison.period_label === 'Monthly';

    return {
      metrics: metricsData,
      ledColor: isMonthly ? '#00A3FF' : '#7B2CBF',
      borderColor: isMonthly ? 'border-sl-blue/30' : 'border-sl-purple/30',
      titleColor: isMonthly ? 'text-sl-blue' : 'text-sl-purple',
    };
  }, [comparison]);

  return (
    <div
      className={`led-border p-4 border ${borderColor} bg-linear-to-b from-sl-gray-light/30 to-sl-gray/20`}
      style={{ '--led-color': ledColor } as React.CSSProperties}
    >
      <h3 className={`text-sm font-bold uppercase tracking-wider ${titleColor} mb-4`}>
        {comparison.period_label} Comparison
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-sl-silver-muted">
              {metric.label}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-sl-silver">
                {metric.format(metric.current)}
              </span>
              <TrendBadge trend={metric.trend} changePercent={metric.change_percent} />
            </div>
            <div className="text-xs text-sl-silver-dark">vs {metric.format(metric.previous)} prev</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const TrendBadge = memo(function TrendBadge({
  trend,
  changePercent,
}: {
  trend: 'up' | 'down' | 'neutral';
  changePercent: number;
}) {
  const config = {
    up: {
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
      borderColor: 'border-green-400/30',
    },
    down: {
      icon: TrendingDown,
      color: 'text-sl-red',
      bgColor: 'bg-sl-red/10',
      borderColor: 'border-sl-red/30',
    },
    neutral: {
      icon: Minus,
      color: 'text-sl-silver-muted',
      bgColor: 'bg-sl-gray-muted/10',
      borderColor: 'border-sl-gray-muted/30',
    },
  };

  const { icon: Icon, color, bgColor, borderColor } = config[trend];

  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold ${color} ${bgColor} border ${borderColor}`}
    >
      <Icon size={10} />
      {Math.abs(changePercent).toFixed(0)}%
    </span>
  );
});

export default memo(ComparisonCard);
