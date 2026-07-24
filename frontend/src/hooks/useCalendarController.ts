import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type WheelEvent,
} from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  cancelTaskRequest,
  completeTaskRequest,
  fetchMonthTasks as fetchMonthTasksRequest,
} from "@/api/tasks"
import type { Task } from "@/components/TaskCard"
import { getBadgeDisplayInfo } from "@/constants/achievements"
import { useAuth } from "@/contexts/AuthContext"
import {
  DAY_COLUMN_WIDTH,
  compareMonths,
  evictMonthCache,
  getCenteredColumnScrollLeft,
  getMonthWindow,
  getWindowDays,
  groupTasksByLocalDate,
  localDateKey,
} from "@/lib/calendarData"
import { addMonths, monthKeyStr, type MonthKey } from "@/lib/utils"
import { invalidateProgressQueries } from "@/lib/queryClient"

export function useCalendarController() {
  const { token, refreshUser, user } = useAuth()
  const { t } = useTranslation()
  const today = useMemo(() => new Date(), [])
  const initialMonth = useMemo<MonthKey>(
    () => ({ year: today.getFullYear(), month: today.getMonth() }),
    [today],
  )
  const earliestMonth = useMemo<MonthKey | null>(() => {
    if (!user?.created_at) return null
    const created = new Date(user.created_at)
    return { year: created.getFullYear(), month: created.getMonth() }
  }, [user?.created_at])

  const [visibleMonth, setVisibleMonth] = useState(initialMonth)
  const [loadedMonths, setLoadedMonths] = useState<MonthKey[]>(() =>
    getMonthWindow(initialMonth, null),
  )
  const [tasksByMonth, setTasksByMonth] = useState<Map<string, Task[]>>(new Map())
  const [failedMonths, setFailedMonths] = useState<Set<string>>(new Set())
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [completingTaskId, setCompletingTaskId] = useState<number | null>(null)
  const [cancellingTaskId, setCancellingTaskId] = useState<number | null>(null)
  const [cancelModalTask, setCancelModalTask] = useState<Task | null>(null)
  const [badgeQueue, setBadgeQueue] = useState<string[]>([])
  const [currentBadge, setCurrentBadge] =
    useState<ReturnType<typeof getBadgeDisplayInfo>>(null)

  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null)
  const loadedMonthsRef = useRef(loadedMonths)
  const fetchedMonthsRef = useRef<Set<string>>(new Set())
  const controllersRef = useRef<Map<string, AbortController>>(new Map())
  const pendingScrollAdjustmentRef = useRef(0)
  const pendingTargetRef = useRef<Date | null>(today)
  const shiftingRef = useRef(false)

  const allDays = useMemo(() => getWindowDays(loadedMonths), [loadedMonths])
  const tasks = useMemo(() => [...tasksByMonth.values()].flat(), [tasksByMonth])
  const tasksByDate = useMemo(() => groupTasksByLocalDate(tasksByMonth), [tasksByMonth])

  const dayVirtualizer = useVirtualizer({
    count: allDays.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => DAY_COLUMN_WIDTH,
    horizontal: true,
    overscan: 3,
  })

  useEffect(() => {
    loadedMonthsRef.current = loadedMonths
  }, [loadedMonths])

  useEffect(() => {
    if (!earliestMonth || compareMonths(loadedMonths[0], earliestMonth) >= 0) return
    setLoadedMonths(getMonthWindow(visibleMonth, earliestMonth))
  }, [earliestMonth, loadedMonths, visibleMonth])

  useEffect(() => {
    if (!currentBadge && badgeQueue.length > 0) {
      const [nextBadgeId, ...rest] = badgeQueue
      setCurrentBadge(getBadgeDisplayInfo(nextBadgeId))
      setBadgeQueue(rest)
    }
  }, [badgeQueue, currentBadge])

  const fetchMonth = useCallback(
    async (month: MonthKey, force = false) => {
      if (!token) return
      const key = monthKeyStr(month)
      if (!force && fetchedMonthsRef.current.has(key)) return
      controllersRef.current.get(key)?.abort()
      const controller = new AbortController()
      controllersRef.current.set(key, controller)

      try {
        const monthTasks = await fetchMonthTasksRequest(token, month, controller.signal)
        if (controller.signal.aborted) return
        if (!loadedMonthsRef.current.some((item) => monthKeyStr(item) === key)) return
        setTasksByMonth((previous) => new Map(previous).set(key, monthTasks))
        fetchedMonthsRef.current.add(key)
        setFailedMonths((previous) => {
          const next = new Set(previous)
          next.delete(key)
          return next
        })
      } catch (error) {
        if (controller.signal.aborted) return
        console.error("Failed to fetch calendar month", error)
        setFailedMonths((previous) => new Set(previous).add(key))
      } finally {
        if (controllersRef.current.get(key) === controller) {
          controllersRef.current.delete(key)
        }
      }
    },
    [token],
  )

  useEffect(() => {
    const retained = new Set(loadedMonths.map(monthKeyStr))
    controllersRef.current.forEach((controller, key) => {
      if (!retained.has(key)) {
        controller.abort()
        controllersRef.current.delete(key)
      }
    })
    fetchedMonthsRef.current = new Set(
      [...fetchedMonthsRef.current].filter((key) => retained.has(key)),
    )
    setTasksByMonth((previous) => evictMonthCache(previous, loadedMonths))
    setFailedMonths((previous) => new Set([...previous].filter((key) => retained.has(key))))
    setExpandedDays(new Set())

    const visibleKey = monthKeyStr(visibleMonth)
    const visible = loadedMonths.find((month) => monthKeyStr(month) === visibleKey)
    if (visible) {
      void fetchMonth(visible).then(() => {
        loadedMonths.forEach((month) => {
          if (monthKeyStr(month) !== visibleKey) void fetchMonth(month)
        })
      })
    } else {
      loadedMonths.forEach((month) => void fetchMonth(month))
    }
  }, [fetchMonth, loadedMonths, visibleMonth])

  useEffect(
    () => () => controllersRef.current.forEach((controller) => controller.abort()),
    [],
  )

  const scrollToDate = useCallback(
    (date: Date, behavior: ScrollBehavior = "smooth") => {
      if (!scrollElement) return
      const targetKey = localDateKey(date)
      const targetIndex = allDays.findIndex((day) => localDateKey(day) === targetKey)
      if (targetIndex < 0) return
      scrollElement.scrollTo({
        left: getCenteredColumnScrollLeft(targetIndex, scrollElement.clientWidth),
        behavior,
      })
    },
    [allDays, scrollElement],
  )

  useLayoutEffect(() => {
    const container = scrollElement
    if (!container) return
    if (pendingScrollAdjustmentRef.current !== 0) {
      container.scrollLeft += pendingScrollAdjustmentRef.current
      pendingScrollAdjustmentRef.current = 0
    }
    if (pendingTargetRef.current) {
      const target = pendingTargetRef.current
      pendingTargetRef.current = null
      requestAnimationFrame(() => scrollToDate(target, "auto"))
    }
    shiftingRef.current = false
  }, [loadedMonths, scrollElement, scrollToDate])

  const shiftWindow = useCallback(
    (direction: -1 | 1) => {
      if (shiftingRef.current) return
      const current = loadedMonthsRef.current
      if (current.length === 0) return
      const target = direction > 0
        ? addMonths(current[current.length - 1], 1)
        : addMonths(current[0], -1)
      if (direction < 0 && earliestMonth && compareMonths(target, earliestMonth) < 0) return

      shiftingRef.current = true
      if (direction > 0) {
        pendingScrollAdjustmentRef.current =
          -getWindowDays([current[0]]).length * DAY_COLUMN_WIDTH
        setLoadedMonths([...current.slice(1), target])
      } else {
        pendingScrollAdjustmentRef.current =
          getWindowDays([target]).length * DAY_COLUMN_WIDTH
        setLoadedMonths([target, ...current.slice(0, -1)])
      }
    },
    [earliestMonth],
  )

  const handleScroll = useCallback(() => {
    const container = scrollElement
    if (!container || allDays.length === 0) return
    const centerIndex = Math.min(
      allDays.length - 1,
      Math.max(0, Math.floor((container.scrollLeft + container.clientWidth / 2) / DAY_COLUMN_WIDTH)),
    )
    const centerDay = allDays[centerIndex]
    const centerMonth = { year: centerDay.getFullYear(), month: centerDay.getMonth() }
    setVisibleMonth((previous) =>
      compareMonths(previous, centerMonth) === 0 ? previous : centerMonth,
    )

    const rightEdge = container.scrollWidth - container.scrollLeft - container.clientWidth
    if (rightEdge < DAY_COLUMN_WIDTH * 2) shiftWindow(1)
    else if (container.scrollLeft < DAY_COLUMN_WIDTH * 2) shiftWindow(-1)
  }, [allDays, scrollElement, shiftWindow])

  const handleWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return
      const verticalScroller = (event.target as HTMLElement).closest<HTMLElement>(
        "[data-calendar-vertical-scroll]",
      )
      if (verticalScroller) {
        const canScrollInDirection = event.deltaY < 0
          ? verticalScroller.scrollTop > 0
          : verticalScroller.scrollTop + verticalScroller.clientHeight
            < verticalScroller.scrollHeight
        if (canScrollInDirection) return
      }
      event.currentTarget.scrollLeft += event.deltaY
    },
    [],
  )

  const navigateMonth = useCallback(
    (offset: -1 | 1) => {
      const target = addMonths(visibleMonth, offset)
      if (earliestMonth && compareMonths(target, earliestMonth) < 0) return
      setVisibleMonth(target)
      pendingTargetRef.current = new Date(target.year, target.month, 15)
      setLoadedMonths(getMonthWindow(target, earliestMonth))
    },
    [earliestMonth, visibleMonth],
  )

  const goToToday = useCallback(() => {
    setVisibleMonth(initialMonth)
    pendingTargetRef.current = today
    setLoadedMonths(getMonthWindow(initialMonth, earliestMonth))
  }, [earliestMonth, initialMonth, today])

  const refreshTasks = useCallback(async () => {
    fetchedMonthsRef.current.clear()
    await Promise.all(loadedMonthsRef.current.map((month) => fetchMonth(month, true)))
  }, [fetchMonth])

  const completeTask = async (taskId: number, expValue: number) => {
    if (!token) return
    setCompletingTaskId(taskId)
    try {
      const data = await completeTaskRequest(token, taskId)
      await Promise.all([refreshTasks(), refreshUser(), invalidateProgressQueries()])
      toast.success(t("tasks.completed"), {
        description: t("tasks.completedDesc", { exp: expValue }),
      })
      if (data.new_badges?.length) {
        setBadgeQueue((previous) => [...previous, ...data.new_badges!])
      }
    } catch (error) {
      toast.error(t("tasks.completeFailed"), {
        description: error instanceof Error && error.message
          ? error.message
          : t("common.tryAgain"),
      })
    } finally {
      setCompletingTaskId(null)
    }
  }

  const cancelTask = async (taskId: number, skipOnly: boolean) => {
    if (!token) return
    const task = tasks.find((item) => item.id === taskId)
    if (!task) return
    setCancellingTaskId(taskId)
    try {
      await cancelTaskRequest(token, taskId, skipOnly)
      await Promise.all([refreshTasks(), refreshUser(), invalidateProgressQueries()])
      setCancelModalTask(null)
      const penalty = Math.floor(task.exp_value / 5)
      toast.error(skipOnly ? t("tasks.questSkipped") : t("tasks.questCancelled"), {
        description: skipOnly
          ? t("tasks.questSkippedDesc", { penalty })
          : t("tasks.questCancelledDesc", { penalty }),
      })
    } catch (error) {
      toast.error(t("tasks.cancelFailed"), {
        description: error instanceof Error && error.message
          ? error.message
          : t("common.tryAgain"),
      })
    } finally {
      setCancellingTaskId(null)
    }
  }

  return {
    allDays,
    cancelModalTask,
    cancellingTaskId,
    completingTaskId,
    currentBadge,
    earliestMonth,
    editTask,
    expandedDays,
    failedMonths,
    goToToday,
    handleScroll,
    handleWheel,
    isModalOpen,
    navigateMonth,
    refreshTasks,
    setScrollElement,
    selectedDate,
    setCancelModalTask,
    setCurrentBadge,
    setEditTask,
    setExpandedDays,
    setIsModalOpen,
    setSelectedDate,
    tasksByDate,
    visibleMonth,
    virtualDays: dayVirtualizer.getVirtualItems(),
    virtualTotalSize: dayVirtualizer.getTotalSize(),
    completeTask,
    cancelTask,
    handleCancelClick(taskId: number) {
      const task = tasks.find((item) => item.id === taskId)
      if (!task) return
      if (task.is_recurring) setCancelModalTask(task)
      else void cancelTask(taskId, false)
    },
    retryFailedMonths() {
      loadedMonthsRef.current.forEach((month) => {
        if (failedMonths.has(monthKeyStr(month))) void fetchMonth(month, true)
      })
    },
  }
}
