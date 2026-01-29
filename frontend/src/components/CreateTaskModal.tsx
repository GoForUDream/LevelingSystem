import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PrimaryButton, SecondaryButton } from "@/components/ui/buttons";
import type { Task } from "@/components/TaskCard";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onTaskSaved: () => void;
  editTask?: Task | null;
}

const importanceLevels = [
  {
    value: "TRIVIAL",
    label: "Trivial",
    exp: 10,
    color: "importance-trivial",
    subtitle: "Quick wins, minimal effort",
    description:
      "Tasks that take less than 5 minutes and require almost no mental energy.",
    examples: "Drink water, make bed, reply to a simple message",
  },
  {
    value: "LOW",
    label: "Low",
    exp: 25,
    color: "importance-low",
    subtitle: "Simple daily habits",
    description:
      "Routine tasks that are easy but still require some intention.",
    examples: "Check emails, 10-min walk, tidy your desk",
  },
  {
    value: "MEDIUM",
    label: "Medium",
    exp: 50,
    color: "importance-medium",
    subtitle: "Standard meaningful tasks",
    description:
      "Tasks that require focus, time, or effort. Core actions that move your goals forward.",
    examples: "Work assignment, 30-min exercise, study for an hour",
  },
  {
    value: "HIGH",
    label: "High",
    exp: 100,
    color: "importance-high",
    subtitle: "Important and challenging",
    description:
      "Tasks that demand significant effort, skill, or courage. Often involve deadlines or stepping outside comfort zone.",
    examples: "Major project, difficult conversation, job application",
  },
  {
    value: "CRITICAL",
    label: "Critical",
    exp: 200,
    color: "importance-critical",
    subtitle: "Life-changing milestones",
    description:
      "Major achievements with lasting impact. These are the boss fights you've been building toward.",
    examples: "Pass important exam, launch project, complete certification",
  },
];

const API_URL = "http://localhost:8000";

export default function TaskModal({
  isOpen,
  onClose,
  selectedDate,
  onTaskSaved,
  editTask,
}: TaskModalProps) {
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [importance, setImportance] = useState("MEDIUM");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState("DAILY");
  const [weeklyDays, setWeeklyDays] = useState<number[]>([]);
  const [monthlyDays, setMonthlyDays] = useState<number[]>([]);
  const [customInterval, setCustomInterval] = useState(2);

  const isEditMode = !!editTask;

  // Populate form when editing
  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description || "");
      setImportance(editTask.importance);
      setIsRecurring(editTask.is_recurring ?? false);
      setRecurrenceType(editTask.recurrence_type || "DAILY");
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
    }
  }, [editTask, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
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
        toast.success("Quest updated!");
      } else {
        // Create new task
        const dueDate = new Date(selectedDate);
        dueDate.setHours(23, 59, 59, 999);

        const payload: Record<string, unknown> = {
            title: title.trim(),
            description: description.trim() || null,
            importance,
            due_date: dueDate.toISOString(),
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

        const selectedExp = importanceLevels.find(
          (l) => l.value === importance
        )?.exp;
        toast.success("Quest accepted!", {
          description: `Complete it to earn ${selectedExp} EXP`,
        });
      }
    } catch {
      toast.error(isEditMode ? "Failed to update quest" : "Failed to create quest", {
        description: "Please try again.",
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

  const selectedImportance = importanceLevels.find(
    (i) => i.value === importance
  );

  const displayDate = editTask?.due_date ? new Date(editTask.due_date) : selectedDate;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-sl-black border border-sl-blue/30 sm:max-w-md shadow-[0_0_30px_rgba(0,163,255,0.2)]">
        <DialogHeader>
          <DialogTitle className="text-sl-blue text-glow-blue font-bold uppercase tracking-wider">
            {isEditMode ? "Edit Quest" : "New Quest"}
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
              Quest Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full bg-sl-gray border border-sl-gray-muted px-4 py-3 text-sl-silver placeholder-sl-silver-dark focus:outline-none focus:border-sl-blue focus:shadow-[0_0_10px_rgba(0,163,255,0.3)] transition-all"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-sl-silver-muted mb-2">
              Details{" "}
              <span className="text-sl-silver-dark font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
              className="w-full bg-sl-gray border border-sl-gray-muted px-4 py-3 text-sl-silver placeholder-sl-silver-dark focus:outline-none focus:border-sl-blue focus:shadow-[0_0_10px_rgba(0,163,255,0.3)] transition-all resize-none"
            />
          </div>

          {/* Importance */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-sl-silver-muted mb-2">
              Difficulty
            </label>
            <div className="grid grid-cols-5 gap-1">
              {importanceLevels.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setImportance(level.value)}
                  className={`py-2 px-1 text-[10px] font-bold uppercase tracking-wider transition-all border ${
                    importance === level.value
                      ? `${level.color} text-white border-transparent shadow-[0_0_10px_rgba(0,163,255,0.3)]`
                      : "bg-sl-gray text-sl-silver-muted border-sl-gray-muted hover:border-sl-silver-muted"
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>

            {/* Importance Description */}
            {selectedImportance && (
              <div className="mt-3 p-3 bg-sl-gray border-l-2 border-sl-blue">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-sl-silver">
                    {selectedImportance.subtitle}
                  </span>
                  <span className="text-xs font-bold text-sl-blue text-glow-blue">
                    +{selectedImportance.exp} EXP
                  </span>
                </div>
                <p className="text-xs text-sl-silver-muted mb-2">
                  {selectedImportance.description}
                </p>
                <p className="text-[10px] text-sl-silver-dark">
                  e.g. {selectedImportance.examples}
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
                  Repeat this quest
                </span>
              </label>

              {isRecurring && (
                <div className="mt-3 p-3 bg-sl-gray border border-sl-gray-muted space-y-3">
                  {/* Frequency picker */}
                  <div className="grid grid-cols-4 gap-1">
                    {(["DAILY", "WEEKLY", "MONTHLY", "CUSTOM"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setRecurrenceType(type)}
                        className={`py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all border ${
                          recurrenceType === type
                            ? "bg-sl-blue text-white border-transparent"
                            : "bg-sl-gray text-sl-silver-muted border-sl-gray-muted hover:border-sl-silver-muted"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  {/* WEEKLY: day-of-week toggles */}
                  {recurrenceType === "WEEKLY" && (
                    <div>
                      <span className="text-[10px] text-sl-silver-muted block mb-1.5">Repeat on</span>
                      <div className="flex gap-1">
                        {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((label, idx) => (
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
                      <span className="text-[10px] text-sl-silver-muted block mb-1.5">Repeat on days</span>
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
                        Last day of month
                      </button>
                    </div>
                  )}

                  {/* CUSTOM: interval input */}
                  {recurrenceType === "CUSTOM" && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-sl-silver-muted">Every</span>
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={customInterval}
                        onChange={(e) => setCustomInterval(Number(e.target.value))}
                        className="w-16 bg-sl-gray-light border border-sl-gray-muted text-sl-silver text-xs px-2 py-1 focus:outline-none focus:border-sl-blue"
                      />
                      <span className="text-[10px] text-sl-silver-muted">days</span>
                    </div>
                  )}
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
              Cancel
            </SecondaryButton>
            <PrimaryButton
              type="submit"
              isLoading={isSubmitting}
              className="flex-1"
            >
              {isEditMode ? "Save Changes" : "Accept Quest"}
            </PrimaryButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
