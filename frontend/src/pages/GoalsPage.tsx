import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { API_URL } from "@/lib/utils";
import {
  ChevronLeft,
  Target,
  Plus,
  Flag,
  TrendingUp,
  Pencil,
  Trash2,
  CheckCircle,
  Circle,
} from "lucide-react";
import { AddButton } from "@/components/ui/buttons";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import CreateGoalModal from "@/components/CreateGoalModal";
import { badgeIdToName } from "@/constants/achievements";

interface GoalTask {
  id: number;
  title: string;
  status: string;
  importance: string;
  exp_value: number;
}

interface Goal {
  id: number;
  title: string;
  description: string | null;
  rank: "S" | "A" | "B" | "C" | "D";
  start_date: string;
  end_date: string;
  is_done: boolean;
  created_at: string;
  updated_at: string;
  tasks: GoalTask[];
}

const priorityStyles: Record<
  Goal["rank"],
  { color: string; border: string; bg: string; glow: string }
> = {
  S: {
    color: "text-sl-red",
    border: "border-sl-red/30",
    bg: "bg-sl-red/5",
    glow: "shadow-[0_0_20px_rgba(230,57,70,0.15)]",
  },
  A: {
    color: "text-[#FF6B00]",
    border: "border-[#FF6B00]/30",
    bg: "bg-[#FF6B00]/5",
    glow: "shadow-[0_0_20px_rgba(255,107,0,0.15)]",
  },
  B: {
    color: "text-sl-purple",
    border: "border-sl-purple/30",
    bg: "bg-sl-purple/5",
    glow: "shadow-[0_0_20px_rgba(123,44,191,0.15)]",
  },
  C: {
    color: "text-sl-blue",
    border: "border-sl-blue/30",
    bg: "bg-sl-blue/5",
    glow: "shadow-[0_0_20px_rgba(0,163,255,0.15)]",
  },
  D: {
    color: "text-sl-silver-muted",
    border: "border-sl-gray-muted",
    bg: "bg-sl-gray/30",
    glow: "",
  },
};

function getDaysRemaining(deadline: string | null): { key: string; diff?: number } | null {
  if (!deadline) return null;
  const now = new Date();
  const target = new Date(deadline);
  const diff = Math.ceil(
    (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diff < 0) return { key: "overdue" };
  if (diff === 0) return { key: "dueToday" };
  return { key: "daysRemaining", diff };
}

export default function GoalsPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { t } = useTranslation();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);

  const fetchGoals = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/goals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setGoals(data);
    } catch {
      toast.error(t('goals.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [token, t]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleToggleDone = async (goalId: number) => {
    const goal = goals.find((g) => g.id === goalId);
    if (goal && !goal.is_done) {
      const undoneTasks = goal.tasks.filter((t) => t.status !== "COMPLETED");
      if (undoneTasks.length > 0) {
        toast.error(t('goals.completeTasksFirst'), {
          description: undoneTasks.length === 1
            ? t('goals.tasksIncomplete_one', { count: undoneTasks.length })
            : t('goals.tasksIncomplete_other', { count: undoneTasks.length }),
        });
        return;
      }
    }
    try {
      const res = await fetch(`${API_URL}/api/goals/${goalId}/toggle`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      fetchGoals();
      if (data.new_badges && data.new_badges.length > 0) {
        for (const badgeId of data.new_badges) {
          const name = badgeIdToName[badgeId] || badgeId;
          toast.success(t('goals.badgeUnlocked', { name }));
        }
      }
    } catch {
      toast.error(t('goals.toggleFailed'));
    }
  };

  const handleDelete = async (goalId: number) => {
    try {
      const res = await fetch(`${API_URL}/api/goals/${goalId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      fetchGoals();
      toast.success(t('goals.deleted'));
    } catch {
      toast.error(t('goals.deleteFailed'));
    }
  };

  const openCreate = () => {
    setEditGoal(null);
    setIsModalOpen(true);
  };

  const openEdit = (goal: Goal) => {
    setEditGoal(goal);
    setIsModalOpen(true);
  };

  return (
    <div className="h-screen w-screen bg-sl-black flex flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 px-8 py-4 border-b border-sl-blue/20 bg-linear-to-r from-sl-black via-sl-gray/50 to-sl-black">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1 text-sl-silver-muted hover:text-sl-blue transition-all cursor-pointer"
          >
            <ChevronLeft size={16} className="relative -top-px" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {t('common.back')}
            </span>
          </button>

          <div className="flex items-center gap-3">
            <Target size={20} className="text-sl-blue" />
            <h1 className="text-lg font-bold uppercase tracking-[0.15em] text-sl-blue text-glow-blue">
              {t('goals.title')}
            </h1>
          </div>

          <div className="w-20" />
        </div>
      </header>

      {/* Goal Cards - Horizontal Scroll */}
      <div
        className="flex-1 flex overflow-x-auto overflow-y-hidden scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* Add Goal Card */}
        <div className="shrink-0 w-96 h-full flex flex-col border-r border-sl-gray-light/50">
          <div className="flex-1 flex items-center justify-center p-8">
            <AddButton
              onClick={openCreate}
              className="w-auto! px-8 py-6 border-sl-blue/20 flex items-center gap-3"
            >
              <Plus size={18} />
              {t('goals.newGoal')}
            </AddButton>
          </div>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-sl-gray-light border-t-sl-blue rounded-full animate-spin" />
          </div>
        ) : (
          goals.map((goal) => {
            const style = priorityStyles[goal.rank];
            const daysLeft = getDaysRemaining(goal.end_date);
            const completedTasks = goal.tasks.filter(
              (t) => t.status === "COMPLETED",
            ).length;
            const totalTasks = goal.tasks.length;
            const progress =
              totalTasks > 0
                ? Math.round((completedTasks / totalTasks) * 100)
                : 0;

            return (
              <div
                key={goal.id}
                className={`shrink-0 w-96 h-full flex flex-col border-r border-sl-gray-light/50 bg-sl-black hover:bg-sl-gray/30 transition-all duration-300 ${style.glow} ${goal.is_done ? "opacity-60" : ""}`}
              >
                {/* Goal Header */}
                <div
                  className={`shrink-0 px-5 py-4 border-b ${style.border} ${style.bg}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border ${style.border} ${style.color}`}
                    >
                      {t('tasks.rankLabel', { rank: goal.rank })}
                    </span>
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleToggleDone(goal.id)}
                            className="p-1 text-sl-silver-muted hover:text-sl-blue transition-all cursor-pointer"
                          >
                            {goal.is_done ? (
                              <CheckCircle size={16} />
                            ) : (
                              <Circle size={16} />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {goal.is_done ? t('goals.markIncomplete') : t('goals.markComplete')}
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => openEdit(goal)}
                            className="p-1 text-sl-silver-muted hover:text-sl-silver transition-all cursor-pointer"
                          >
                            <Pencil size={14} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleDelete(goal.id)}
                            className="p-1 text-sl-silver-muted hover:text-sl-red transition-all cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  <h2
                    className={`text-lg font-bold text-sl-silver tracking-wide ${goal.is_done ? "line-through" : ""}`}
                  >
                    {goal.title}
                  </h2>
                  {daysLeft && (
                    <div
                      className={`flex items-center gap-1.5 mt-2 text-[11px] ${
                        daysLeft.key === "overdue"
                          ? "text-sl-red"
                          : "text-sl-silver-muted"
                      }`}
                    >
                      <Flag size={11} />
                      {daysLeft.key === "overdue"
                        ? t('goals.overdue')
                        : daysLeft.key === "dueToday"
                        ? t('goals.dueToday')
                        : t('goals.daysRemaining', { days: daysLeft.diff })}
                    </div>
                  )}
                </div>

                {/* Progress Section */}
                <div className="shrink-0 px-5 py-4 border-b border-sl-gray-light/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sl-silver-muted">
                      {t('goals.progress')}
                    </span>
                    <span className={`text-sm font-bold ${style.color}`}>
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-sl-gray-muted/50 overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        background:
                          goal.rank === "S"
                            ? "linear-gradient(to right, #E63946, #FF6B6B)"
                            : goal.rank === "A"
                              ? "linear-gradient(to right, #FF6B00, #FFA040)"
                              : goal.rank === "B"
                                ? "linear-gradient(to right, #7B2CBF, #A855F7)"
                                : "linear-gradient(to right, #00A3FF, #60CFFF)",
                      }}
                    />
                  </div>
                </div>

                {/* Description */}
                {goal.description && (
                  <div className="shrink-0 px-5 py-4 border-b border-sl-gray-light/50">
                    <p className="text-xs text-sl-silver-muted leading-relaxed">
                      {goal.description}
                    </p>
                  </div>
                )}

                {/* Milestones (linked tasks) */}
                <div className="flex-1 px-5 py-4 overflow-y-auto">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={12} className="text-sl-silver-muted" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sl-silver-muted">
                      {t('goals.milestones')} ({completedTasks}/{totalTasks})
                    </span>
                  </div>
                  {totalTasks === 0 ? (
                    <p className="text-xs text-sl-silver-dark italic">
                      {t('goals.noTasks')}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {(() => {
                        // Group tasks by title to collapse recurring duplicates
                        const grouped = new Map<
                          string,
                          { total: number; completed: number }
                        >();
                        const unique: GoalTask[] = [];
                        for (const task of goal.tasks) {
                          const existing = grouped.get(task.title);
                          if (existing) {
                            existing.total++;
                            if (task.status === "COMPLETED")
                              existing.completed++;
                          } else {
                            grouped.set(task.title, {
                              total: 1,
                              completed: task.status === "COMPLETED" ? 1 : 0,
                            });
                            unique.push(task);
                          }
                        }
                        return unique.map((task) => {
                          const group = grouped.get(task.title)!;
                          const isGroup = group.total > 1;
                          const allDone = group.completed === group.total;
                          const noneDone = group.completed === 0;
                          return (
                            <div
                              key={task.title}
                              className={`flex items-start gap-3 p-3 border transition-all ${
                                allDone
                                  ? "border-[#1a1a1a] bg-[#0a0a0a]"
                                  : `${style.border} bg-sl-gray/20`
                              }`}
                            >
                              <div
                                className={`shrink-0 w-4 h-4 mt-0.5 border flex items-center justify-center ${
                                  allDone
                                    ? "border-[#333] bg-[#1a1a1a]"
                                    : `${style.border}`
                                }`}
                              >
                                {allDone && (
                                  <svg
                                    className="w-2.5 h-2.5 text-[#444]"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={3}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span
                                  className={`text-xs font-medium ${
                                    allDone
                                      ? "text-[#333] line-through"
                                      : "text-sl-silver"
                                  }`}
                                >
                                  {task.title}
                                </span>
                                {isGroup && (
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span
                                      className={`text-[10px] font-bold ${allDone ? "text-[#333]" : noneDone ? "text-sl-silver-muted" : style.color}`}
                                    >
                                      {group.completed}/{group.total}
                                    </span>
                                    <div className="flex-1 h-1 bg-sl-gray-muted/50 overflow-hidden max-w-20">
                                      <div
                                        className="h-full transition-all duration-300"
                                        style={{
                                          width: `${(group.completed / group.total) * 100}%`,
                                          background: allDone
                                            ? "#333"
                                            : goal.rank === "S"
                                              ? "#E63946"
                                              : goal.rank === "A"
                                                ? "#FF6B00"
                                                : goal.rank === "B"
                                                  ? "#7B2CBF"
                                                  : "#00A3FF",
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <CreateGoalModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditGoal(null);
        }}
        onGoalSaved={fetchGoals}
        editGoal={editGoal}
      />
    </div>
  );
}
