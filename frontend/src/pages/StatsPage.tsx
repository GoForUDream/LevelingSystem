import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, BarChart3, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SummaryCards,
  TasksOverTimeChart,
  CompletionDonutChart,
  ExpProgressChart,
  TimeOfDayChart,
  ActivityHeatmap,
  ComparisonCard,
} from '@/components/stats';

const API_URL = 'http://localhost:8000';

type Period = '7d' | '30d' | '90d' | 'all';

interface DailyTaskStats {
  date: string;
  completed: number;
  overdue: number;
  cancelled: number;
  exp_earned: number;
}

interface CompletionBreakdown {
  completed: number;
  overdue: number;
  cancelled: number;
  in_progress: number;
  todo: number;
}

interface TimeOfDayDistribution {
  hour: number;
  count: number;
}

interface HeatmapDay {
  date: string;
  count: number;
  intensity: number;
}

interface ComparisonMetric {
  current: number;
  previous: number;
  change_percent: number;
  trend: 'up' | 'down' | 'neutral';
}

interface PeriodComparison {
  period_label: string;
  tasks_completed: ComparisonMetric;
  exp_earned: ComparisonMetric;
  completion_rate: ComparisonMetric;
  average_daily_tasks: ComparisonMetric;
}

interface StatsData {
  account_created_at: string;
  account_age_days: number;
  daily_tasks: DailyTaskStats[];
  completion_breakdown: CompletionBreakdown;
  activity_heatmap: HeatmapDay[];
  time_of_day: TimeOfDayDistribution[];
  total_tasks_completed: number;
  total_exp_earned: number;
  completion_rate: number;
  average_tasks_per_day: number;
  most_productive_hour: number | null;
  current_streak: number;
  longest_streak: number;
  monthly_comparison: PeriodComparison | null;
  yearly_comparison: PeriodComparison | null;
}

const periodLabels: Record<Period, string> = {
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  '90d': 'Last 90 Days',
  'all': 'All Time',
};

// Pre-computed particle positions for stable rendering
const statsParticles = [
  { left: 8, top: 15, duration: 12, delay: 0.5 },
  { left: 22, top: 38, duration: 16, delay: 2.1 },
  { left: 35, top: 62, duration: 10, delay: 3.8 },
  { left: 48, top: 22, duration: 14, delay: 1.2 },
  { left: 62, top: 78, duration: 18, delay: 4.5 },
  { left: 75, top: 45, duration: 11, delay: 0.8 },
  { left: 88, top: 12, duration: 15, delay: 2.9 },
  { left: 15, top: 85, duration: 13, delay: 3.2 },
  { left: 28, top: 55, duration: 17, delay: 1.6 },
  { left: 42, top: 8, duration: 9, delay: 4.1 },
  { left: 55, top: 92, duration: 14, delay: 0.3 },
  { left: 68, top: 32, duration: 12, delay: 2.5 },
  { left: 82, top: 68, duration: 16, delay: 3.9 },
  { left: 95, top: 48, duration: 10, delay: 1.8 },
  { left: 5, top: 72, duration: 15, delay: 4.7 },
  { left: 18, top: 28, duration: 11, delay: 0.9 },
  { left: 32, top: 95, duration: 13, delay: 2.3 },
  { left: 45, top: 42, duration: 17, delay: 3.5 },
  { left: 58, top: 18, duration: 9, delay: 1.1 },
  { left: 72, top: 58, duration: 14, delay: 4.2 },
];

export default function StatsPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [period, setPeriod] = useState<Period>('30d');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    setError(null);

    fetch(`${API_URL}/api/stats?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch stats');
        return res.json();
      })
      .then((data: StatsData) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [token, period]);

  return (
    <div className="min-h-screen bg-sl-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 163, 255, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 163, 255, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />

        {/* Ambient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sl-blue/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-sl-purple/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-sl-blue/5 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Floating particles */}
        {statsParticles.map((p, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-sl-blue/40 rounded-full"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              animation: `floatParticle ${p.duration}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}

        {/* Scan line effect */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 163, 255, 0.1) 2px, rgba(0, 163, 255, 0.1) 4px)',
          }}
        />

        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, rgba(13, 13, 13, 0.4) 70%, rgba(13, 13, 13, 0.8) 100%)',
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 shrink-0 px-8 py-4 border-b border-sl-blue/20 bg-linear-to-r from-sl-black via-sl-gray/50 to-sl-black backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-sl-silver-muted hover:text-sl-blue transition-all cursor-pointer"
          >
            <ChevronLeft size={16} className="relative -top-px" />
            <span className="text-xs font-bold uppercase tracking-wider">Back</span>
          </button>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3">
              <BarChart3 size={20} className="text-sl-blue" />
              <h1 className="text-lg font-bold uppercase tracking-[0.2em] text-sl-blue text-glow-blue-intense">
                Hunter Analytics
              </h1>
              <BarChart3 size={20} className="text-sl-blue" />
            </div>
            <div className="text-[9px] uppercase tracking-[0.3em] text-sl-silver-muted mt-0.5">
              System Data Interface
            </div>
          </div>

          {/* Period Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-sl-silver border border-sl-blue/30 px-3 py-1.5 hover:bg-sl-blue/10 transition-colors cursor-pointer">
                {periodLabels[period]}
                <ChevronDown size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-sl-gray border border-sl-blue/30 shadow-[0_0_20px_rgba(0,163,255,0.2)]"
            >
              {(Object.keys(periodLabels) as Period[]).map((p) => (
                <DropdownMenuItem
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`text-xs font-bold uppercase tracking-wider cursor-pointer ${
                    p === period
                      ? 'text-sl-blue bg-sl-blue/10'
                      : 'text-sl-silver hover:text-sl-blue hover:bg-sl-blue/5'
                  }`}
                >
                  {periodLabels[p]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 px-6 py-8 max-w-7xl mx-auto">
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-sl-red">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-sm text-sl-blue hover:underline"
            >
              Retry
            </button>
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <SummaryCards
              totalTasksCompleted={stats.total_tasks_completed}
              totalExpEarned={stats.total_exp_earned}
              completionRate={stats.completion_rate}
              currentStreak={stats.current_streak}
              longestStreak={stats.longest_streak}
            />

            {/* Charts Grid - Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TasksOverTimeChart data={stats.daily_tasks} />
              <CompletionDonutChart data={stats.completion_breakdown} />
            </div>

            {/* Charts Grid - Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ExpProgressChart data={stats.daily_tasks} />
              <TimeOfDayChart
                data={stats.time_of_day}
                mostProductiveHour={stats.most_productive_hour}
              />
            </div>

            {/* Activity Heatmap */}
            <ActivityHeatmap data={stats.activity_heatmap} />

            {/* Comparisons */}
            {(stats.monthly_comparison || stats.yearly_comparison) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {stats.monthly_comparison && (
                  <ComparisonCard comparison={stats.monthly_comparison} />
                )}
                {stats.yearly_comparison && (
                  <ComparisonCard comparison={stats.yearly_comparison} />
                )}
              </div>
            )}

            {/* Account Info Footer */}
            <div className="text-center pt-4 border-t border-sl-gray-muted/30">
              <p className="text-xs text-sl-silver-muted">
                Hunter since{' '}
                <span className="text-sl-silver">
                  {new Date(stats.account_created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                {' '}({stats.account_age_days} days)
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 bg-sl-gray-light/20 border border-sl-gray-muted/30"
          />
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 bg-sl-gray-light/20 border border-sl-gray-muted/30" />
        <div className="h-80 bg-sl-gray-light/20 border border-sl-gray-muted/30" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 bg-sl-gray-light/20 border border-sl-gray-muted/30" />
        <div className="h-80 bg-sl-gray-light/20 border border-sl-gray-muted/30" />
      </div>

      {/* Heatmap Skeleton */}
      <div className="h-40 bg-sl-gray-light/20 border border-sl-gray-muted/30" />
    </div>
  );
}
