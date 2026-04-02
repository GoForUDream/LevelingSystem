import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { API_URL } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PrimaryButton, SecondaryButton } from "@/components/ui/buttons";
import { TaskPresetCombobox } from "@/components/TaskPresetCombobox";
import { RANK_THEME, RANK_THEME_BY_LETTER } from "@/constants/rankTheme";
import { TaskImportance } from "@/types/task";
import type { Task } from "@/components/TaskCard";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onTaskSaved: () => void;
  editTask?: Task | null;
}

const rankLevels = (Object.values(TaskImportance) as TaskImportance[]).map((value) => ({
  value,
  ...RANK_THEME[value],
}));

interface GoalOption {
  id: number;
  title: string;
  rank: string;
}

export default function TaskModal({
  isOpen,
  onClose,
  selectedDate,
  onTaskSaved,
  editTask,
}: TaskModalProps) {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [importance, setImportance] = useState("MEDIUM");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState("DAILY");
  const [weeklyDays, setWeeklyDays] = useState<number[]>([]);
  const [monthlyDays, setMonthlyDays] = useState<number[]>([]);
  const [customInterval, setCustomInterval] = useState(2);
  const [goalId, setGoalId] = useState<number | null>(null);
  const [goals, setGoals] = useState<GoalOption[]>([]);

  const isEditMode = !!editTask;

  // Fetch goals list when modal opens
  useEffect(() => {
    if (isOpen && token) {
      fetch(`${API_URL}/api/goals`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setGoals(data))
        .catch(() => setGoals([]));
    }
  }, [isOpen, token]);

  // Populate form when editing
  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description || "");
      setImportance(editTask.importance);
      setIsRecurring(editTask.is_recurring ?? false);
      setRecurrenceType(editTask.recurrence_type || "DAILY");
      setGoalId(editTask.goal_id ?? null);
      const days: number[] = editTask.recurrence_days ? JSON.parse(editTask.recurrence_days) : [];
      if (editTask.recurrence_type === "WEEKLY") {
        setWeeklyDays(days);
        setMonthlyDays([]);
      } else if (editTask.recurrence_type === "MONTHLY") {
        setMonthlyDays(days);
        setWeeklyDays([]);
      } else {
        setWeeklyDays([]);
        setMonthlyDays([]);
      }
      setCustomInterval(editTask.recurrence_interval ?? 2);
    } else {
      setTitle("");
      setDescription("");
      setImportance("MEDIUM");
      setIsRecurring(false);
      setRecurrenceType("DAILY");
      setWeeklyDays([]);
      setMonthlyDays([]);
      setCustomInterval(2);
      setGoalId(null);
    }
  }, [editTask, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error(t('tasks.titleRequired'));
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode) {
        // Update existing task
        const response = await fetch(`${API_URL}/api/tasks/${editTask.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || null,
            importance,
            goal_id: goalId,
            is_recurring: isRecurring,
            ...(isRecurring
              ? {
                  recurrence_type: recurrenceType,
                  recurrence_days:
                    recurrenceType === "WEEKLY"
                      ? weeklyDays
                      : recurrenceType === "MONTHLY"
                        ? monthlyDays
                        : null,
                  recurrence_interval:
                    recurrenceType === "CUSTOM" ? customInterval : null,
                }
              : {
                  recurrence_type: null,
                  recurrence_days: null,
                  recurrence_interval: null,
                }),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update task");
        }

        onTaskSaved();
        onClose();
        toast.success(t('tasks.questUpdated'));
      } else {
        // Create new task
        const dueDate = new Date(selectedDate);
        dueDate.setHours(23, 59, 59, 999);

        const payload: Record<string, unknown> = {
            title: title.trim(),
            description: description.trim() || null,
            importance,
            due_date: dueDate.toISOString(),
            goal_id: goalId,
        };

        if (isRecurring) {
            payload.is_recurring = true;
            payload.recurrence_type = recurrenceType;
            if (recurrenceType === "WEEKLY") {
                payload.recurrence_days = weeklyDays;
            } else if (recurrenceType === "MONTHLY") {
                payload.recurrence_days = monthlyDays;
            }
            if (recurrenceType === "CUSTOM") {
                payload.recurrence_interval = customInterval;
            }
        }

        const response = await fetch(`${API_URL}/api/tasks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error("Failed to create task");
        }

        // Reset form and close
        setTitle("");
        setDescription("");
        setImportance("MEDIUM");
        onTaskSaved();
        onClose();

        const selectedExp = rankLevels.find(
          (l) => l.value === importance
        )?.exp;
        toast.success(t('tasks.questAccepted'), {
          description: t('tasks.questAcceptedDesc', { exp: selectedExp }),
        });
      }
    } catch {
      toast.error(isEditMode ? t('tasks.updateFailed') : t('tasks.createFailed'), {
        description: t('common.tryAgain'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const selectedRank = rankLevels.find(
    (i) => i.value === importance
  );

  const displayDate = editTask?.due_date ? new Date(editTask.due_date) : selectedDate;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-sl-black border border-sl-blue/30 sm:max-w-md shadow-[0_0_30px_rgba(0,163,255,0.2)]">
        <DialogHeader>
          <DialogTitle className="text-sl-blue text-glow-blue font-bold uppercase tracking-wider">
            {isEditMode ? t('tasks.editQuest') : t('tasks.newQuest')}
          </DialogTitle>
          <DialogDescription className="text-sl-silver-muted text-xs tracking-wide">
            {displayDate.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-sl-silver-muted mb-2">
              {t('tasks.questName')}
            </label>
            {isEditMode ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full bg-sl-gray border border-sl-gray-muted px-4 py-3 text-sl-silver placeholder-sl-silver-dark focus:outline-none focus:border-sl-blue focus:shadow-[0_0_10px_rgba(0,163,255,0.3)] transition-all"
                autoFocus
              />
            ) : (
              <TaskPresetCombobox
                value={title}
                onPresetSelect={(t, imp) => {
                  setTitle(t);
                  setImportance(imp);
                }}
                onTitleChange={setTitle}
              />
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-sl-silver-muted mb-2">
              {t('tasks.details')}{" "}
              <span className="text-sl-silver-dark font-normal">({t('common.optional')})</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('tasks.detailsPlaceholder')}
              rows={3}
              className="w-full bg-sl-gray border border-sl-gray-muted px-4 py-3 text-sl-silver placeholder-sl-silver-dark focus:outline-none focus:border-sl-blue focus:shadow-[0_0_10px_rgba(0,163,255,0.3)] transition-all resize-none"
            />
          </div>

          {/* Importance */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-sl-silver-muted mb-2">
              {t('tasks.rank')}
            </label>
            <div className="grid grid-cols-5 gap-1">
              {rankLevels.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setImportance(level.value)}
                  className={`py-2 px-1 text-[10px] font-bold uppercase tracking-wider transition-all border ${
                    importance === level.value
                      ? `${level.bgSolid} text-white border-transparent shadow-[0_0_10px_rgba(0,163,255,0.3)]`
                      : "bg-sl-gray text-sl-silver-muted border-sl-gray-muted hover:border-sl-silver-muted"
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>

            {/* Rank Description */}
            {selectedRank && (
              <div className={`mt-3 p-3 bg-sl-gray border-l-2 ${selectedRank.borderSolid}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-sl-silver">
                    {selectedRank.subtitle}
                  </span>
                  <span className="text-xs font-bold text-sl-blue text-glow-blue">
                    +{selectedRank.exp} EXP
                  </span>
                </div>
                <p className="text-xs text-sl-silver-muted mb-2">
                  {selectedRank.description}
                </p>
                <p className="text-[10px] text-sl-silver-dark">
                  e.g. {selectedRank.examples}
                </p>
              </div>
            )}
          </div>

          {/* Recurrence */}
          {(
            <div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="accent-sl-blue w-4 h-4"
                />
                <span className="text-[10px] font-bold uppercase tracking-wider text-sl-silver-muted">
                  {t('tasks.repeatQuest')}
                </span>
              </label>

              {isRecurring && (
                <div className="mt-3 p-3 bg-sl-gray border border-sl-gray-muted space-y-3">
                  {/* Frequency picker */}
                  <div className="grid grid-cols-4 gap-1">
                    {([
                      { value: "DAILY", label: t('tasks.recurrence.daily') },
                      { value: "WEEKLY", label: t('tasks.recurrence.weekly') },
                      { value: "MONTHLY", label: t('tasks.recurrence.monthly') },
                      { value: "CUSTOM", label: t('tasks.recurrence.custom') },
                    ] as const).map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRecurrenceType(value)}
                        className={`py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all border ${
                          recurrenceType === value
                            ? "bg-sl-blue text-white border-transparent"
                            : "bg-sl-gray text-sl-silver-muted border-sl-gray-muted hover:border-sl-silver-muted"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* WEEKLY: day-of-week toggles */}
                  {recurrenceType === "WEEKLY" && (
                    <div>
                      <span className="text-[10px] text-sl-silver-muted block mb-1.5">{t('tasks.recurrence.repeatOn')}</span>
                      <div className="flex gap-1">
                        {[t('tasks.days.mon'), t('tasks.days.tue'), t('tasks.days.wed'), t('tasks.days.thu'), t('tasks.days.fri'), t('tasks.days.sat'), t('tasks.days.sun')].map((label, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() =>
                              setWeeklyDays((prev) =>
                                prev.includes(idx)
                                  ? prev.filter((d) => d !== idx)
                                  : [...prev, idx].sort()
                              )
                            }
                            className={`flex-1 h-8 text-[10px] font-bold transition-all border ${
                              weeklyDays.includes(idx)
                                ? "bg-sl-blue text-white border-transparent"
                                : "bg-sl-gray-light text-sl-silver-muted border-sl-gray-muted hover:border-sl-silver-muted"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* MONTHLY: calendar day grid */}
                  {recurrenceType === "MONTHLY" && (
                    <div>
                      <span className="text-[10px] text-sl-silver-muted block mb-1.5">{t('tasks.recurrence.repeatOnDays')}</span>
                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() =>
                              setMonthlyDays((prev) =>
                                prev.includes(d)
                                  ? prev.filter((x) => x !== d)
                                  : [...prev, d].sort((a, b) => a - b)
                              )
                            }
                            className={`h-8 text-[10px] font-bold transition-all border ${
                              monthlyDays.includes(d)
                                ? "bg-sl-blue text-white border-transparent"
                                : "bg-sl-gray-light text-sl-silver-muted border-sl-gray-muted hover:border-sl-silver-muted"
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setMonthlyDays((prev) =>
                            prev.includes(-1)
                              ? prev.filter((x) => x !== -1)
                              : [...prev, -1].sort((a, b) => a - b)
                          )
                        }
                        className={`mt-2 w-full h-8 text-[10px] font-bold tracking-wider transition-all border ${
                          monthlyDays.includes(-1)
                            ? "bg-sl-blue text-white border-transparent"
                            : "bg-sl-gray-light text-sl-silver-muted border-sl-gray-muted hover:border-sl-silver-muted"
                        }`}
                      >
                        {t('tasks.recurrence.lastDayOfMonth')}
                      </button>
                    </div>
                  )}

                  {/* CUSTOM: interval input */}
                  {recurrenceType === "CUSTOM" && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-sl-silver-muted">{t('tasks.recurrence.every')}</span>
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={customInterval}
                        onChange={(e) => setCustomInterval(Number(e.target.value))}
                        className="w-16 bg-sl-gray-light border border-sl-gray-muted text-sl-silver text-xs px-2 py-1 focus:outline-none focus:border-sl-blue"
                      />
                      <span className="text-[10px] text-sl-silver-muted">{t('tasks.recurrence.days')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Link to Goal */}
          {goals.length > 0 && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-sl-silver-muted mb-2">
                {t('tasks.linkToGoal')}{" "}
                <span className="text-sl-silver-dark font-normal">({t('common.optional')})</span>
              </label>
              <select
                value={goalId ?? ""}
                onChange={(e) =>
                  setGoalId(e.target.value ? Number(e.target.value) : null)
                }
                className="w-full bg-sl-gray border border-sl-gray-muted px-4 py-3 text-sl-silver focus:outline-none focus:border-sl-blue focus:shadow-[0_0_10px_rgba(0,163,255,0.3)] transition-all appearance-none"
              >
                <option value="">{t('tasks.noGoal')}</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    [{g.rank}] {g.title}
                  </option>
                ))}
              </select>
              {goalId && (
                <div className="mt-2 flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${RANK_THEME_BY_LETTER[goals.find((g) => g.id === goalId)?.rank ?? "C"].textColor}`}>
                    {t('tasks.rankLabel', { rank: goals.find((g) => g.id === goalId)?.rank })}
                  </span>
                  <span className="text-[10px] text-sl-silver-muted">
                    {goals.find((g) => g.id === goalId)?.title}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <SecondaryButton
              type="button"
              onClick={onClose}
              className="flex-1"
            >
              {t('common.cancel')}
            </SecondaryButton>
            <PrimaryButton
              type="submit"
              isLoading={isSubmitting}
              className="flex-1"
            >
              {isEditMode ? t('tasks.saveChanges') : t('tasks.acceptQuest')}
            </PrimaryButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
