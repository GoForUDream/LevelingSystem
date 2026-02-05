import { CheckCircle, Zap, Target, Flame } from 'lucide-react';

interface SummaryCardsProps {
  totalTasksCompleted: number;
  totalExpEarned: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
}

export default function SummaryCards({
  totalTasksCompleted,
  totalExpEarned,
  completionRate,
  currentStreak,
  longestStreak,
}: SummaryCardsProps) {
  const cards = [
    {
      label: 'Tasks Completed',
      value: totalTasksCompleted.toLocaleString(),
      icon: CheckCircle,
      color: 'text-sl-blue',
      borderColor: 'border-sl-blue/30',
      ledColor: '#00A3FF',
    },
    {
      label: 'Total EXP',
      value: totalExpEarned.toLocaleString(),
      icon: Zap,
      color: 'text-sl-purple',
      borderColor: 'border-sl-purple/30',
      ledColor: '#7B2CBF',
    },
    {
      label: 'Completion Rate',
      value: `${completionRate}%`,
      icon: Target,
      color: 'text-green-400',
      borderColor: 'border-green-400/30',
      ledColor: '#4ADE80',
    },
    {
      label: 'Current Streak',
      value: currentStreak.toString(),
      subValue: longestStreak > currentStreak ? `Best: ${longestStreak}` : 'Personal Best!',
      icon: Flame,
      color: currentStreak >= longestStreak && longestStreak > 0 ? 'text-sl-red' : 'text-orange-400',
      borderColor: currentStreak >= longestStreak && longestStreak > 0 ? 'border-sl-red/30' : 'border-orange-400/30',
      ledColor: currentStreak >= longestStreak && longestStreak > 0 ? '#E63946' : '#FF6B00',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`led-border p-4 border ${card.borderColor} bg-linear-to-b from-sl-gray-light/30 to-sl-gray/20`}
          style={{ '--led-color': card.ledColor } as React.CSSProperties}
        >
          <div className="flex items-center gap-2 mb-2">
            <card.icon size={16} className={card.color} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-sl-silver-muted">
              {card.label}
            </span>
          </div>
          <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
          {card.subValue && (
            <div className="text-xs text-sl-silver-muted mt-1">{card.subValue}</div>
          )}
        </div>
      ))}
    </div>
  );
}
