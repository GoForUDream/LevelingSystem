import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  Target,
  Plus,
  Flag,
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
import GoalMilestones from "@/components/goals/GoalMilestones";
import { GOAL_THEME } from "@/constants/goalTheme";
import { useGoalsController } from "@/hooks/useGoalsController";
import { getGoalDeadline } from "@/lib/goalDate";
import type { GoalSummary } from "@/types/goal";

export default function GoalsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const goalsController = useGoalsController();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<GoalSummary | null>(null);

  const openCreate = () => {
    setEditGoal(null);
    setIsModalOpen(true);
  };

  const openEdit = (goal: GoalSummary) => {
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
        data-goal-scroll
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

        {goalsController.isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-sl-gray-light border-t-sl-blue rounded-full animate-spin" />
          </div>
        ) : (
          <>
          {goalsController.goals.map((goal) => {
            const style = GOAL_THEME[goal.rank];
            const daysLeft = getGoalDeadline(goal.end_date);
            const completedTasks = goal.completed_task_count;
            const totalTasks = goal.total_task_count;
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
                            onClick={() => void goalsController.toggleGoal(goal.id)}
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
                            onClick={() => void goalsController.deleteGoal(goal.id)}
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
                        background: style.progressGradient,
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

                <GoalMilestones
                  goalId={goal.id}
                  token={goalsController.token}
                  totalCount={totalTasks}
                  completedCount={completedTasks}
                  accentColor={style.color}
                  progressColor={style.progress}
                />
              </div>
            );
          })}
          {goalsController.hasMore && (
            <div className="shrink-0 w-96 h-full flex items-center justify-center border-r border-sl-gray-light/50">
              <AddButton
                onClick={() => void goalsController.loadMore()}
                disabled={goalsController.isLoadingMore}
                className="w-auto! px-8"
              >
                {goalsController.isLoadingMore ? t("common.loading") : t("common.loadMore")}
              </AddButton>
            </div>
          )}
          </>
        )}
      </div>

      <CreateGoalModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditGoal(null);
        }}
        onGoalSaved={goalsController.fetchGoals}
        editGoal={editGoal}
      />
    </div>
  );
}
