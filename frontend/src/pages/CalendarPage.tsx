import { useState, useRef, useEffect, useCallback, useMemo, useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import TaskModal from "@/components/CreateTaskModal";
import BadgeUnlockModal from "@/components/BadgeUnlockModal";
import CancelRecurringModal from "@/components/CancelRecurringModal";
import { getBadgeDisplayInfo } from "@/constants/achievements";
import { TaskCard, CompletedTaskCard, CancelledTaskCard, OverdueTaskCard, type Task } from "@/components/TaskCard";
import { AddButton, DisabledButton } from "@/components/ui/buttons";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  API_URL,
  DAY_NAMES,
  type MonthKey,
  monthKeyStr,
  getMonthDateRange,
  getDaysForMonth,
  addMonths,
} from "@/lib/utils";

const MAX_LOADED_MONTHS = 12;

export default function CalendarPage() {
  const { token, refreshUser, user } = useAuth();
  const { t } = useTranslation();

  // Calculate earliest allowed month based on account creation date
  const earliestMonth: MonthKey | null = useMemo(() => {
    if (!user?.created_at) return null;
    const createdDate = new Date(user.created_at);
    return { year: createdDate.getFullYear(), month: createdDate.getMonth() };
  }, [user?.created_at]);

  // Check if a month is before the earliest allowed
  const isBeforeEarliestMonth = useCallback((mk: MonthKey): boolean => {
    if (!earliestMonth) return false;
    if (mk.year < earliestMonth.year) return true;
    if (mk.year === earliestMonth.year && mk.month < earliestMonth.month) return true;
    return false;
  }, [earliestMonth]);
  const [tasksByMonth, setTasksByMonth] = useState<Map<string, Task[]>>(new Map());
  const fetchedMonthsRef = useRef<Set<string>>(new Set());
  const fetchingMonthsRef = useRef<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [completingTaskId, setCompletingTaskId] = useState<number | null>(null);
  const [cancellingTaskId, setCancellingTaskId] = useState<number | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [badgeQueue, setBadgeQueue] = useState<string[]>([]);
  const [currentBadge, setCurrentBadge] = useState<ReturnType<typeof getBadgeDisplayInfo>>(null);
  const [cancelModalTask, setCancelModalTask] = useState<Task | null>(null);

  // Combine all tasks from fetched months
  const tasks = useMemo(() => {
    const allTasks: Task[] = [];
    tasksByMonth.forEach((monthTasks) => {
      allTasks.push(...monthTasks);
    });
    return allTasks;
  }, [tasksByMonth]);

  // Process badge queue - show one at a time
  useEffect(() => {
    if (!currentBadge && badgeQueue.length > 0) {
      const [nextBadgeId, ...rest] = badgeQueue;
      const badgeInfo = getBadgeDisplayInfo(nextBadgeId);
      if (badgeInfo) {
        setCurrentBadge(badgeInfo);
      }
      setBadgeQueue(rest);
    }
  }, [currentBadge, badgeQueue]);
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

  // Check if we're at the earliest allowed month (can't go further back)
  const isAtEarliestMonth = useMemo(() => {
    if (!earliestMonth) return false;
    return visibleMonth.year === earliestMonth.year && visibleMonth.month === earliestMonth.month;
  }, [visibleMonth, earliestMonth]);

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

  // Fetch tasks for a specific month
  const fetchMonthTasks = useCallback(async (mk: MonthKey, isBackground = false) => {
    if (!token) return;

    const key = monthKeyStr(mk);

    // Skip if already fetched or currently fetching
    if (fetchedMonthsRef.current.has(key) || fetchingMonthsRef.current.has(key)) return;

    fetchingMonthsRef.current.add(key);

    try {
      const { start, end } = getMonthDateRange(mk);
      const response = await fetch(
        `${API_URL}/api/tasks/range?start_date=${encodeURIComponent(start)}&end_date=${encodeURIComponent(end)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data: Task[] = await response.json();
        setTasksByMonth((prev) => {
          const newMap = new Map(prev);
          newMap.set(key, data);
          return newMap;
        });
        fetchedMonthsRef.current.add(key);
      }
    } catch (error) {
      if (!isBackground) {
        console.error("Failed to fetch tasks:", error);
      }
    } finally {
      fetchingMonthsRef.current.delete(key);
    }
  }, [token]);

  // Refetch a specific month (for after task updates)
  const refetchMonth = useCallback(async (mk: MonthKey) => {
    if (!token) return;

    const key = monthKeyStr(mk);
    const { start, end } = getMonthDateRange(mk);

    try {
      const response = await fetch(
        `${API_URL}/api/tasks/range?start_date=${encodeURIComponent(start)}&end_date=${encodeURIComponent(end)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data: Task[] = await response.json();
        setTasksByMonth((prev) => {
          const newMap = new Map(prev);
          newMap.set(key, data);
          return newMap;
        });
      }
    } catch (error) {
      console.error("Failed to refetch tasks:", error);
    }
  }, [token]);

  // Refetch current visible month (used after task operations)
  const refreshTasks = useCallback(async () => {
    await refetchMonth(visibleMonth);
    // Also refetch adjacent months in case task moved
    await Promise.all([
      refetchMonth(addMonths(visibleMonth, -1)),
      refetchMonth(addMonths(visibleMonth, 1)),
    ]);
  }, [refetchMonth, visibleMonth]);

  // Initial fetch: current month first, then adjacent months in background
  useEffect(() => {
    if (!token) return;

    const currentMonth: MonthKey = { year: todayDate.getFullYear(), month: todayDate.getMonth() };

    // Fetch current month first (blocking)
    fetchMonthTasks(currentMonth, false).then(() => {
      // Then fetch adjacent months in background
      fetchMonthTasks(addMonths(currentMonth, -1), true);
      fetchMonthTasks(addMonths(currentMonth, 1), true);
    });
  }, [token, todayDate, fetchMonthTasks]);

  // Fetch newly loaded months as user scrolls
  useEffect(() => {
    loadedMonths.forEach((mk) => {
      fetchMonthTasks(mk, true);
    });
  }, [loadedMonths, fetchMonthTasks]);

  const completeTask = async (taskId: number, expValue: number) => {
    if (!token) return;

    setCompletingTaskId(taskId);
    try {
      // Send local time info for achievement tracking
      const now = new Date();
      const localHour = now.getHours();
      const localDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format
      const response = await fetch(`${API_URL}/api/tasks/${taskId}/complete?local_hour=${localHour}&local_date=${localDate}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        await refreshTasks();
        await refreshUser();
        toast.success(t('tasks.completed'), {
          description: t('tasks.completedDesc', { exp: expValue }),
        });
        if (data.new_badges && data.new_badges.length > 0) {
          setBadgeQueue((prev) => [...prev, ...data.new_badges]);
        }
      } else {
        const error = await response.json();
        toast.error(t('tasks.completeFailed'), {
          description: error.detail || t('common.tryAgain'),
        });
      }
    } catch {
      toast.error(t('tasks.completeFailed'), {
        description: t('common.tryAgain'),
      });
    } finally {
      setCompletingTaskId(null);
    }
  };

  const handleCancelClick = (taskId: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (task.is_recurring) {
      // Show modal for recurring tasks
      setCancelModalTask(task);
    } else {
      // Cancel directly for non-recurring tasks
      cancelTask(taskId, false);
    }
  };

  const cancelTask = async (taskId: number, skipOnly: boolean) => {
    if (!token) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    setCancellingTaskId(taskId);
    try {
      const response = await fetch(
        `${API_URL}/api/tasks/${taskId}/cancel?skip_only=${skipOnly}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const penalty = Math.floor(task.exp_value / 5);
        await refreshTasks();
        await refreshUser();
        setCancelModalTask(null);

        if (skipOnly) {
          toast.error(t('tasks.questSkipped'), {
            description: t('tasks.questSkippedDesc', { penalty }),
          });
        } else {
          toast.error(t('tasks.questCancelled'), {
            description: t('tasks.questCancelledDesc', { penalty }),
          });
        }
      } else {
        const error = await response.json();
        toast.error(t('tasks.cancelFailed'), {
          description: error.detail || t('common.tryAgain'),
        });
      }
    } catch {
      toast.error(t('tasks.cancelFailed'), {
        description: t('common.tryAgain'),
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
        // Don't load months before account creation
        if (isBeforeEarliestMonth(prevMo)) return prev;
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
  }, [isBeforeEarliestMonth]);

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

  // Convert vertical mouse wheel to horizontal scroll,
  // unless the cursor is over a scrollable task list area.
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Let trackpad horizontal swipe pass through naturally
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      // Let native vertical scroll work inside day task areas
      const target = e.target as HTMLElement;
      const taskArea = target.closest<HTMLElement>(".overflow-y-auto");
      if (taskArea && taskArea !== container && taskArea.scrollHeight > taskArea.clientHeight) return;

      e.preventDefault();
      container.scrollLeft += e.deltaY;
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);


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
    // Don't navigate before account creation month
    if (isBeforeEarliestMonth(target)) return;
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
  }, [visibleMonth, scrollToMonth, isBeforeEarliestMonth]);

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

  const handleQuickAdd = useCallback(() => {
    setEditTask(null);
    setSelectedDate(new Date());
    setIsModalOpen(true);
  }, []);

  // "N" keyboard shortcut to quick-add for today
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isModalOpen) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        handleQuickAdd();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, handleQuickAdd]);

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
        disablePrevMonth={isAtEarliestMonth}
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
                    {DAY_NAMES[day.getDay()]}
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
                    <DisabledButton className="mb-3">{t('calendar.newQuest')}</DisabledButton>
                  ) : (
                    <AddButton
                      onClick={() => handleAddTask(day)}
                      className="mb-3"
                    >
                      {t('calendar.newQuest')}
                    </AddButton>
                  )}

                  {(() => {
                    const activeTasks = dayTasks.filter(
                      (t) => t.status !== "COMPLETED" && t.status !== "CANCELLED" && t.status !== "OVERDUE",
                    );
                    const completedTasks = dayTasks.filter(
                      (t) => t.status === "COMPLETED",
                    );
                    const cancelledTasks = dayTasks.filter(
                      (t) => t.status === "CANCELLED",
                    );
                    const overdueTasks = dayTasks.filter(
                      (t) => t.status === "OVERDUE",
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
                              onCancel={handleCancelClick}
                              onEdit={handleEditTask}
                              isCompleting={completingTaskId === task.id}
                              isCancelling={cancellingTaskId === task.id}
                              isFuture={isFuture(day)}
                            />
                          ))}
                        </div>

                        {/* Overdue Tasks */}
                        {overdueTasks.length > 0 && (
                          <div className={activeTasks.length > 0 ? "mt-3" : ""}>
                            <div className="space-y-2">
                              {overdueTasks.map((task) => (
                                <OverdueTaskCard key={task.id} task={task} />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Cancelled Tasks */}
                        {cancelledTasks.length > 0 && (
                          <div className={activeTasks.length > 0 || overdueTasks.length > 0 ? "mt-3" : ""}>
                            <div className="space-y-2">
                              {cancelledTasks.map((task) => (
                                <CancelledTaskCard key={task.id} task={task} />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Completed Tasks */}
                        {completedTasks.length > 0 && (
                          <div className={activeTasks.length > 0 || overdueTasks.length > 0 || cancelledTasks.length > 0 ? "mt-3" : ""}>
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
        onTaskSaved={refreshTasks}
        editTask={editTask}
      />

      {/* Badge Unlock Modal */}
      <BadgeUnlockModal
        isOpen={!!currentBadge}
        onClose={() => setCurrentBadge(null)}
        badge={currentBadge}
      />

      {/* Cancel Recurring Modal */}
      <CancelRecurringModal
        isOpen={!!cancelModalTask}
        onClose={() => setCancelModalTask(null)}
        onSkipOnce={() => cancelModalTask && cancelTask(cancelModalTask.id, true)}
        onCancelAll={() => cancelModalTask && cancelTask(cancelModalTask.id, false)}
        taskTitle={cancelModalTask?.title || ""}
        expPenalty={cancelModalTask ? Math.floor(cancelModalTask.exp_value / 5) : 0}
        isLoading={cancellingTaskId === cancelModalTask?.id}
      />

      {/* Floating Quick-Add Button */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-center gap-2">
        {/* Keyboard hint */}
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] text-sl-silver-muted uppercase tracking-widest">press</span>
          <kbd className="text-[10px] font-bold text-sl-blue bg-sl-gray border border-sl-blue/30 px-1.5 py-0.5 rounded">N</kbd>
        </div>
        <div className="group relative">
          {/* Ping ring */}
          <span className="absolute inset-0 rounded-full bg-sl-blue opacity-20 animate-ping" />
          {/* Glow ring */}
          <span className="absolute -inset-1 rounded-full bg-sl-blue/10 blur-md" />
          <button
            onClick={handleQuickAdd}
            title="New Quest (N)"
            className="relative w-14 h-14 rounded-full bg-sl-blue text-white text-2xl font-bold flex items-center justify-center shadow-lg shadow-sl-blue/40 hover:bg-sl-blue/80 hover:shadow-sl-blue/60 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
            style={{ boxShadow: "0 0 24px rgba(0, 112, 243, 0.5), 0 0 48px rgba(0, 112, 243, 0.2)" }}
          >
            +
          </button>
          {/* Tooltip on hover */}
          <div className="absolute bottom-full right-0 mb-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            <div className="bg-sl-gray border border-sl-blue/30 text-sl-silver text-xs px-3 py-1.5 rounded flex items-center gap-2">
              <span>New Quest for Today</span>
              <kbd className="text-sl-blue font-bold bg-sl-black border border-sl-blue/30 px-1.5 py-0.5 rounded text-[10px]">N</kbd>
            </div>
            <div className="w-2 h-2 bg-sl-gray border-r border-b border-sl-blue/30 rotate-45 ml-auto mr-5 -mt-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
