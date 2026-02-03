import { useState, useRef, useEffect, useCallback, useMemo, useLayoutEffect } from "react";
import Header from "@/components/Header";
import TaskModal from "@/components/CreateTaskModal";
import { TaskCard, CompletedTaskCard, CancelledTaskCard, type Task } from "@/components/TaskCard";
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

interface MonthKey {
  year: number;
  month: number;
}

function monthKeyStr(mk: MonthKey): string {
  return `${mk.year}-${mk.month}`;
}

function getDaysForMonth(mk: MonthKey): Date[] {
  const daysInMonth = new Date(mk.year, mk.month + 1, 0).getDate();
  const days: Date[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(mk.year, mk.month, day));
  }
  return days;
}

function addMonths(mk: MonthKey, offset: number): MonthKey {
  const d = new Date(mk.year, mk.month + offset, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

const MAX_LOADED_MONTHS = 12;

export default function CalendarPage() {
  const { token, refreshUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [completingTaskId, setCompletingTaskId] = useState<number | null>(null);
  const [cancellingTaskId, setCancellingTaskId] = useState<number | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);
  const hasScrolledToToday = useRef(false);
  const monthMarkerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const prependAdjustRef = useRef<{ scrollLeft: number; scrollWidth: number } | null>(null);

  const todayDate = useMemo(() => new Date(), []);
  const initialMonth: MonthKey = { year: todayDate.getFullYear(), month: todayDate.getMonth() };

  const [loadedMonths, setLoadedMonths] = useState<MonthKey[]>([
    addMonths(initialMonth, -1),
    initialMonth,
    addMonths(initialMonth, 1),
  ]);

  const [visibleMonth, setVisibleMonth] = useState<MonthKey>(initialMonth);

  const allDays = useMemo(() => {
    return loadedMonths.flatMap(getDaysForMonth);
  }, [loadedMonths]);

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

  const today = useMemo(() => new Date(), []);

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date: Date) => {
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return dateOnly < todayOnly;
  };

  const isFuture = (date: Date) => {
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return dateOnly > todayOnly;
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

    return dayTasks.sort((a, b) => {
      if (a.status === "COMPLETED" && b.status !== "COMPLETED") return 1;
      if (a.status !== "COMPLETED" && b.status === "COMPLETED") return -1;
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

  const cancelTask = async (taskId: number, expValue: number) => {
    if (!token) return;

    setCancellingTaskId(taskId);
    try {
      const response = await fetch(`${API_URL}/api/tasks/${taskId}/cancel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const penalty = Math.floor(expValue / 5);
        await fetchTasks();
        await refreshUser();
        toast.error("Task cancelled", {
          description: `-${penalty} EXP penalty`,
        });
      } else {
        const error = await response.json();
        toast.error("Failed to cancel task", {
          description: error.detail || "Please try again.",
        });
      }
    } catch {
      toast.error("Failed to cancel task", {
        description: "Please try again.",
      });
    } finally {
      setCancellingTaskId(null);
    }
  };

  // Scroll-edge detection to load more months + visible month tracking
  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const rightEdge = scrollWidth - scrollLeft - clientWidth;

    if (rightEdge < 600) {
      setLoadedMonths((prev) => {
        if (prev.length >= MAX_LOADED_MONTHS) return prev;
        const lastMonth = prev[prev.length - 1];
        const nextMo = addMonths(lastMonth, 1);
        return [...prev, nextMo];
      });
    }

    if (scrollLeft < 600) {
      setLoadedMonths((prev) => {
        if (prev.length >= MAX_LOADED_MONTHS) return prev;
        const firstMonth = prev[0];
        const prevMo = addMonths(firstMonth, -1);
        // Store scroll position before prepend
        prependAdjustRef.current = {
          scrollLeft: container.scrollLeft,
          scrollWidth: container.scrollWidth,
        };
        return [prevMo, ...prev];
      });
    }

    // Determine which month is visible at the center of the viewport
    const centerX = scrollLeft + clientWidth / 2;
    let closestKey: string | null = null;
    let closestDist = Infinity;
    monthMarkerRefs.current.forEach((el, key) => {
      // Find the month marker whose first day is closest to (but not past) center,
      // i.e. the rightmost marker that starts at or before the viewport center
      if (el.offsetLeft <= centerX) {
        const dist = centerX - el.offsetLeft;
        if (dist < closestDist) {
          closestDist = dist;
          closestKey = key;
        }
      }
    });
    if (closestKey) {
      const [year, month] = (closestKey as string).split("-").map(Number);
      setVisibleMonth((prev) => {
        if (prev.year === year && prev.month === month) return prev;
        return { year, month };
      });
    }
  }, []);

  // Compensate scroll position after prepending months
  useLayoutEffect(() => {
    if (prependAdjustRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const { scrollLeft, scrollWidth } = prependAdjustRef.current;
      const widthDiff = container.scrollWidth - scrollWidth;
      container.scrollLeft = scrollLeft + widthDiff;
      prependAdjustRef.current = null;
    }
  }, [loadedMonths]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);


  // Scroll to a specific month
  const scrollToMonth = useCallback((target: MonthKey, behavior: ScrollBehavior = "smooth") => {
    const key = monthKeyStr(target);
    const el = monthMarkerRefs.current.get(key);
    if (el && scrollRef.current) {
      const container = scrollRef.current;
      const scrollPosition = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left: scrollPosition, behavior });
    }
  }, []);

  const prevMonth = useCallback(() => {
    const target = addMonths(visibleMonth, -1);
    setLoadedMonths((prev) => {
      const exists = prev.some((m) => m.year === target.year && m.month === target.month);
      if (exists) return prev;
      if (prev.length >= MAX_LOADED_MONTHS) return prev;
      prependAdjustRef.current = scrollRef.current
        ? { scrollLeft: scrollRef.current.scrollLeft, scrollWidth: scrollRef.current.scrollWidth }
        : null;
      return [target, ...prev];
    });
    // Use requestAnimationFrame to wait for render before scrolling
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToMonth(target);
      });
    });
  }, [visibleMonth, scrollToMonth]);

  const nextMonth = useCallback(() => {
    const target = addMonths(visibleMonth, 1);
    setLoadedMonths((prev) => {
      const exists = prev.some((m) => m.year === target.year && m.month === target.month);
      if (exists) return prev;
      if (prev.length >= MAX_LOADED_MONTHS) return prev;
      return [...prev, target];
    });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToMonth(target);
      });
    });
  }, [visibleMonth, scrollToMonth]);

  const goToToday = useCallback(() => {
    const todayMonth: MonthKey = { year: today.getFullYear(), month: today.getMonth() };
    // Reset to 3-month window around today
    setLoadedMonths([
      addMonths(todayMonth, -1),
      todayMonth,
      addMonths(todayMonth, 1),
    ]);
    // Scroll to today element after render
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (todayRef.current && scrollRef.current) {
          const container = scrollRef.current;
          const todayElement = todayRef.current;
          const scrollPosition =
            todayElement.offsetLeft - container.offsetWidth / 2 + todayElement.offsetWidth / 2;
          container.scrollTo({ left: scrollPosition, behavior: "smooth" });
        }
      });
    });
  }, [today]);

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

  // Initial scroll to today on mount
  useEffect(() => {
    if (hasScrolledToToday.current) return;
    if (todayRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const todayElement = todayRef.current;
      const scrollPosition =
        todayElement.offsetLeft - container.offsetWidth / 2 + todayElement.offsetWidth / 2;
      container.scrollTo({ left: scrollPosition, behavior: "instant" });
      hasScrolledToToday.current = true;
    }
  }, [allDays]);

  // Helper: is this the first day of a month?
  const isFirstOfMonth = (date: Date) => date.getDate() === 1;

  // Helper: is this the very first day in allDays?
  const isVeryFirstDay = (index: number) => index === 0;

  // Register month marker ref
  const setMonthMarkerRef = useCallback((key: string, el: HTMLDivElement | null) => {
    if (el) {
      monthMarkerRefs.current.set(key, el);
    } else {
      monthMarkerRefs.current.delete(key);
    }
  }, []);

  return (
    <div className="h-screen w-screen bg-sl-black flex flex-col overflow-hidden">
      <Header
        currentDate={new Date(visibleMonth.year, visibleMonth.month, 1)}
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
        {allDays.map((day, index) => {
          const dayTasks = getTasksForDay(day);
          const completedCount = dayTasks.filter(
            (t) => t.status === "COMPLETED",
          ).length;
          const firstOfMonth = isFirstOfMonth(day);
          const monthKey = `${day.getFullYear()}-${day.getMonth()}`;

          return (
            <div key={day.toISOString()} className="flex">
              {/* Month separator */}
              {firstOfMonth && !isVeryFirstDay(index) && (
                <div className="shrink-0 w-1 bg-sl-blue/20" />
              )}

              <div
                ref={(el) => {
                  if (isToday(day)) {
                    todayRef.current = el;
                  }
                  if (firstOfMonth) {
                    setMonthMarkerRef(monthKey, el);
                  }
                }}
                data-month-key={firstOfMonth ? monthKey : undefined}
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
                      (t) => t.status !== "COMPLETED" && t.status !== "CANCELLED",
                    );
                    const completedTasks = dayTasks.filter(
                      (t) => t.status === "COMPLETED",
                    );
                    const cancelledTasks = dayTasks.filter(
                      (t) => t.status === "CANCELLED",
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
                              onCancel={cancelTask}
                              onEdit={handleEditTask}
                              isCompleting={completingTaskId === task.id}
                              isCancelling={cancellingTaskId === task.id}
                              isFuture={isFuture(day)}
                            />
                          ))}
                        </div>

                        {/* Cancelled Tasks */}
                        {cancelledTasks.length > 0 && (
                          <div className={activeTasks.length > 0 ? "mt-3" : ""}>
                            <div className="space-y-2">
                              {cancelledTasks.map((task) => (
                                <CancelledTaskCard key={task.id} task={task} />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Completed Tasks */}
                        {completedTasks.length > 0 && (
                          <div className={activeTasks.length > 0 || cancelledTasks.length > 0 ? "mt-3" : ""}>
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
