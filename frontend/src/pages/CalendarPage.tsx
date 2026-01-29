import { useState, useRef, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import TaskModal from "@/components/CreateTaskModal";
import { TaskCard, CompletedTaskCard, type Task } from "@/components/TaskCard";
import { AddButton, DisabledButton } from "@/components/ui/buttons";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const API_URL = "http://localhost:8000";

export default function CalendarPage() {
  const { token, refreshUser } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [completingTaskId, setCompletingTaskId] = useState<number | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);

  const toggleExpandedDay = (dateKey: string) => {
    setExpandedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dateKey)) {
        newSet.delete(dateKey);
      } else {
        newSet.add(dateKey);
      }
      return newSet;
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date();

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date: Date) => {
    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const todayOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    return dateOnly < todayOnly;
  };

  const importanceOrder: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
    TRIVIAL: 4,
  };

  const getTasksForDay = (date: Date) => {
    const dayTasks = tasks.filter((task) => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      return taskDate.toDateString() === date.toDateString();
    });

    // Sort: active tasks by importance (higher first), then completed tasks
    return dayTasks.sort((a, b) => {
      // Completed tasks go to the bottom
      if (a.status === "COMPLETED" && b.status !== "COMPLETED") return 1;
      if (a.status !== "COMPLETED" && b.status === "COMPLETED") return -1;

      // Sort by importance (lower number = higher importance)
      return importanceOrder[a.importance] - importanceOrder[b.importance];
    });
  };

  const fetchTasks = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/tasks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  }, [token]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const completeTask = async (taskId: number, expValue: number) => {
    if (!token) return;

    setCompletingTaskId(taskId);
    try {
      const response = await fetch(`${API_URL}/api/tasks/${taskId}/complete`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchTasks();
        await refreshUser();
        toast.success("Task completed!", {
          description: `+${expValue} EXP earned`,
        });
      } else {
        const error = await response.json();
        toast.error("Failed to complete task", {
          description: error.detail || "Please try again.",
        });
      }
    } catch {
      toast.error("Failed to complete task", {
        description: "Please try again.",
      });
    } finally {
      setCompletingTaskId(null);
    }
  };

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleAddTask = (date: Date) => {
    setEditTask(null);
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditTask(null);
  };

  useEffect(() => {
    if (todayRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const todayElement = todayRef.current;
      const scrollPosition =
        todayElement.offsetLeft -
        container.offsetWidth / 2 +
        todayElement.offsetWidth / 2;
      container.scrollTo({ left: scrollPosition, behavior: "smooth" });
    }
  }, [currentDate]);

  return (
    <div className="h-screen w-screen bg-sl-black flex flex-col overflow-hidden">
      <Header
        currentDate={currentDate}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
        onToday={goToToday}
      />

      {/* Calendar */}
      <div
        ref={scrollRef}
        className="flex-1 flex overflow-x-auto overflow-y-hidden scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {days.map((day) => {
          const dayTasks = getTasksForDay(day);
          const completedCount = dayTasks.filter(
            (t) => t.status === "COMPLETED",
          ).length;

          return (
            <div
              key={day.toISOString()}
              ref={isToday(day) ? todayRef : null}
              className={`shrink-0 w-96 h-full flex flex-col transition-all duration-300 relative overflow-hidden ${
                isToday(day)
                  ? "bg-linear-to-b from-sl-gray to-sl-black border-l border-r border-sl-blue/30"
                  : isPast(day)
                    ? "bg-[#0a0a0a] border-r border-[#1a1a1a]"
                    : "bg-sl-black border-r border-sl-gray-light/50 hover:bg-sl-gray/30"
              }`}
            >
              {/* Diagonal stripes for past days */}
              {isPast(day) && (
                <div
                  className="absolute inset-0 opacity-30 pointer-events-none"
                  style={{
                    backgroundImage: `repeating-linear-gradient(
                      -45deg,
                      transparent,
                      transparent 8px,
                      #1a1a1a 8px,
                      #1a1a1a 9px
                    )`,
                  }}
                />
              )}
              {/* Day Header */}
              <div
                className={`relative z-10 shrink-0 h-24 px-5 py-4 border-b ${
                  isToday(day)
                    ? "border-sl-blue/30 bg-sl-blue/5"
                    : isPast(day)
                      ? "border-[#1a1a1a]"
                      : "border-sl-gray-light/50"
                }`}
              >
                <div
                  className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-2 ${
                    isToday(day)
                      ? "text-sl-blue text-glow-blue"
                      : isPast(day)
                        ? "text-[#2a2a2a]"
                        : "text-sl-silver-muted"
                  }`}
                >
                  {dayNames[day.getDay()]}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-4xl font-bold tracking-tight ${
                        isToday(day)
                          ? "text-sl-blue text-glow-blue-intense"
                          : isPast(day)
                            ? "text-[#2a2a2a]"
                            : "text-sl-silver"
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    {/* {isToday(day) && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sl-black bg-sl-blue px-2 py-1 animate-pulse-glow">
                        Today
                      </span>
                    )} */}
                  </div>
                  {dayTasks.length > 0 && (
                    <div className="text-right">
                      <div
                        className={`text-xs ${isPast(day) ? "text-[#2a2a2a]" : "text-sl-silver-muted"}`}
                      >
                        {completedCount}/{dayTasks.length}
                      </div>
                      <div
                        className={`w-12 h-1 mt-1 overflow-hidden ${isPast(day) ? "bg-[#151515]" : "bg-sl-gray-muted"}`}
                      >
                        <div
                          className={`h-full transition-all duration-500 ${isPast(day) ? "bg-[#333]" : "bg-sl-blue"}`}
                          style={{
                            width: `${(completedCount / dayTasks.length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tasks Area */}
              <div className="relative z-10 flex-1 p-4 overflow-y-auto">
                {/* Add Task Button - Always on top */}
                {isPast(day) ? (
                  <DisabledButton className="mb-3">+ New Quest</DisabledButton>
                ) : (
                  <AddButton
                    onClick={() => handleAddTask(day)}
                    className="mb-3"
                  >
                    + New Quest
                  </AddButton>
                )}

                {(() => {
                  const activeTasks = dayTasks.filter(
                    (t) => t.status !== "COMPLETED",
                  );
                  const completedTasks = dayTasks.filter(
                    (t) => t.status === "COMPLETED",
                  );
                  const dateKey = day.toISOString();
                  const isExpanded = expandedDays.has(dateKey);
                  const shouldCollapse = completedTasks.length >= 5;

                  return (
                    <>
                      {/* Active Tasks */}
                      <div className="space-y-2">
                        {activeTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onComplete={completeTask}
                            onEdit={handleEditTask}
                            isCompleting={completingTaskId === task.id}
                          />
                        ))}
                      </div>

                      {/* Completed Tasks */}
                      {completedTasks.length > 0 && (
                        <div className={activeTasks.length > 0 ? "mt-3" : ""}>
                          {shouldCollapse ? (
                            <>
                              <button
                                onClick={() => toggleExpandedDay(dateKey)}
                                className="w-full py-2 px-3 mb-2 flex items-center justify-between bg-[#0a0a0a] border border-[#1a1a1a] text-[#444] hover:text-[#666] hover:border-[#333] transition-colors cursor-pointer"
                              >
                                <span className="text-xs font-bold uppercase tracking-wider">
                                  Completed ({completedTasks.length})
                                </span>
                                <svg
                                  className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              </button>
                              {isExpanded && (
                                <div className="space-y-2">
                                  {completedTasks.map((task) => (
                                    <CompletedTaskCard
                                      key={task.id}
                                      task={task}
                                    />
                                  ))}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="space-y-2">
                              {completedTasks.map((task) => (
                                <CompletedTaskCard key={task.id} task={task} />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Modal (Create/Edit) */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        selectedDate={selectedDate}
        onTaskSaved={fetchTasks}
        editTask={editTask}
      />
    </div>
  );
}
