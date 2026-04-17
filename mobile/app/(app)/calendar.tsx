import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Alert, Animated, Pressable,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../src/contexts/AuthContext'
import { API_URL } from '../../src/constants/api'
import {
  type MonthKey, monthKeyStr, getMonthDateRange, getDaysForMonth,
  addMonths, DAY_NAMES, MONTH_NAMES,
} from '../../src/utils/calendar'
import { getBadgeDisplayInfo } from '../../src/constants/achievements'
import type { Task } from '../../src/types/task'
import { TaskCard, CompletedTaskCard, CancelledTaskCard, OverdueTaskCard } from '../../src/components/TaskCard'
import CreateTaskModal from '../../src/components/CreateTaskModal'
import CancelRecurringModal from '../../src/components/CancelRecurringModal'
import BadgeUnlockModal from '../../src/components/BadgeUnlockModal'

const MAX_LOADED_MONTHS = 12

const IMPORTANCE_ORDER: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, TRIVIAL: 4 }

export default function CalendarScreen() {
  const { token, refreshUser, user } = useAuth()
  const { t, i18n } = useTranslation()

  const today = useMemo(() => new Date(), [])
  const initialMonth: MonthKey = { year: today.getFullYear(), month: today.getMonth() }

  const earliestMonth: MonthKey | null = useMemo(() => {
    if (!user?.created_at) return null
    const d = new Date(user.created_at)
    return { year: d.getFullYear(), month: d.getMonth() }
  }, [user?.created_at])

  const isBeforeEarliestMonth = useCallback((mk: MonthKey): boolean => {
    if (!earliestMonth) return false
    if (mk.year < earliestMonth.year) return true
    if (mk.year === earliestMonth.year && mk.month < earliestMonth.month) return true
    return false
  }, [earliestMonth])

  const [loadedMonths, setLoadedMonths] = useState<MonthKey[]>([
    addMonths(initialMonth, -1),
    initialMonth,
    addMonths(initialMonth, 1),
  ])
  const [visibleMonth, setVisibleMonth] = useState<MonthKey>(initialMonth)
  const [tasksByMonth, setTasksByMonth] = useState<Map<string, Task[]>>(new Map())
  const fetchedMonthsRef = useRef<Set<string>>(new Set())
  const fetchingMonthsRef = useRef<Set<string>>(new Set())

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [completingTaskId, setCompletingTaskId] = useState<number | null>(null)
  const [cancellingTaskId, setCancellingTaskId] = useState<number | null>(null)
  const [cancelModalTask, setCancelModalTask] = useState<Task | null>(null)
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())

  // Badge queue
  const [badgeQueue, setBadgeQueue] = useState<string[]>([])
  const [currentBadge, setCurrentBadge] = useState<ReturnType<typeof getBadgeDisplayInfo>>(null)

  // Scroll references
  const scrollRef = useRef<ScrollView>(null)
  const dayPositionsRef = useRef<Map<string, number>>(new Map())

  // FAB pulse animation
  const fabPulse = useRef(new Animated.Value(1)).current
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(fabPulse, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
        Animated.timing(fabPulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [fabPulse])

  // Badge queue processor
  useEffect(() => {
    if (!currentBadge && badgeQueue.length > 0) {
      const [next, ...rest] = badgeQueue
      setCurrentBadge(getBadgeDisplayInfo(next))
      setBadgeQueue(rest)
    }
  }, [currentBadge, badgeQueue])

  const allTasks = useMemo(() => {
    const all: Task[] = []
    tasksByMonth.forEach(mt => all.push(...mt))
    return all
  }, [tasksByMonth])

  const allDays = useMemo(() => loadedMonths.flatMap(getDaysForMonth), [loadedMonths])

  const isToday = (date: Date) => date.toDateString() === today.toDateString()
  const isPast = (date: Date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    return d < new Date(today.getFullYear(), today.getMonth(), today.getDate())
  }
  const isFuture = (date: Date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    return d > new Date(today.getFullYear(), today.getMonth(), today.getDate())
  }

  const getTasksForDay = (date: Date) => {
    return allTasks
      .filter(task => {
        if (!task.due_date) return false
        return new Date(task.due_date).toDateString() === date.toDateString()
      })
      .sort((a, b) => {
        if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return 1
        if (a.status !== 'COMPLETED' && b.status === 'COMPLETED') return -1
        return IMPORTANCE_ORDER[a.importance] - IMPORTANCE_ORDER[b.importance]
      })
  }

  // Fetch tasks for a month
  const fetchMonthTasks = useCallback(async (mk: MonthKey) => {
    if (!token) return
    const key = monthKeyStr(mk)
    if (fetchedMonthsRef.current.has(key) || fetchingMonthsRef.current.has(key)) return
    fetchingMonthsRef.current.add(key)
    try {
      const { start, end } = getMonthDateRange(mk)
      const res = await fetch(
        `${API_URL}/api/tasks/range?start_date=${encodeURIComponent(start)}&end_date=${encodeURIComponent(end)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.ok) {
        const data: Task[] = await res.json()
        setTasksByMonth(prev => { const m = new Map(prev); m.set(key, data); return m })
        fetchedMonthsRef.current.add(key)
      }
    } finally {
      fetchingMonthsRef.current.delete(key)
    }
  }, [token])

  const refetchMonth = useCallback(async (mk: MonthKey) => {
    if (!token) return
    const key = monthKeyStr(mk)
    const { start, end } = getMonthDateRange(mk)
    const res = await fetch(
      `${API_URL}/api/tasks/range?start_date=${encodeURIComponent(start)}&end_date=${encodeURIComponent(end)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (res.ok) {
      const data: Task[] = await res.json()
      setTasksByMonth(prev => { const m = new Map(prev); m.set(key, data); return m })
    }
  }, [token])

  const refreshTasks = useCallback(async () => {
    await refetchMonth(visibleMonth)
    await Promise.all([
      refetchMonth(addMonths(visibleMonth, -1)),
      refetchMonth(addMonths(visibleMonth, 1)),
    ])
  }, [refetchMonth, visibleMonth])

  // Initial fetch
  useEffect(() => {
    if (!token) return
    const cur = { year: today.getFullYear(), month: today.getMonth() }
    fetchMonthTasks(cur).then(() => {
      fetchMonthTasks(addMonths(cur, -1))
      fetchMonthTasks(addMonths(cur, 1))
    })
  }, [token, today, fetchMonthTasks])

  useEffect(() => {
    loadedMonths.forEach(mk => fetchMonthTasks(mk))
  }, [loadedMonths, fetchMonthTasks])

  // Scroll to today on mount (after positions populated)
  const hasScrolledToToday = useRef(false)
  const scrollToDate = useCallback((date: Date, animated = true) => {
    const key = date.toISOString().split('T')[0]
    const y = dayPositionsRef.current.get(key)
    if (y !== undefined && scrollRef.current) {
      scrollRef.current.scrollTo({ y, animated })
    }
  }, [])

  useEffect(() => {
    if (hasScrolledToToday.current) return
    if (dayPositionsRef.current.size > 0) {
      const key = today.toISOString().split('T')[0]
      if (dayPositionsRef.current.has(key)) {
        scrollToDate(today, false)
        hasScrolledToToday.current = true
      }
    }
  }, [allDays, scrollToDate, today])

  // Handle scroll to detect visible month + infinite loading
  const handleScroll = useCallback((event: { nativeEvent: { contentOffset: { y: number }, contentSize: { height: number }, layoutMeasurement: { height: number } } }) => {
    const { contentOffset: { y }, contentSize: { height: contentHeight }, layoutMeasurement: { height: viewHeight } } = event.nativeEvent

    // Load next month when near bottom
    if (y + viewHeight > contentHeight - 400) {
      setLoadedMonths(prev => {
        if (prev.length >= MAX_LOADED_MONTHS) return prev
        const last = prev[prev.length - 1]
        const next = addMonths(last, 1)
        const exists = prev.some(m => m.year === next.year && m.month === next.month)
        return exists ? prev : [...prev, next]
      })
    }

    // Load previous month when near top
    if (y < 400) {
      setLoadedMonths(prev => {
        if (prev.length >= MAX_LOADED_MONTHS) return prev
        const first = prev[0]
        const prevMo = addMonths(first, -1)
        if (isBeforeEarliestMonth(prevMo)) return prev
        const exists = prev.some(m => m.year === prevMo.year && m.month === prevMo.month)
        return exists ? prev : [prevMo, ...prev]
      })
    }

    // Update visible month based on scroll position
    let closestKey: string | null = null
    let closestDist = Infinity
    dayPositionsRef.current.forEach((pos, key) => {
      if (pos <= y + 100) {
        const dist = y - pos
        if (dist < closestDist) { closestDist = dist; closestKey = key }
      }
    })
    if (closestKey) {
      const date = new Date(closestKey as string)
      const mk = { year: date.getFullYear(), month: date.getMonth() }
      setVisibleMonth(prev => (prev.year === mk.year && prev.month === mk.month) ? prev : mk)
    }
  }, [isBeforeEarliestMonth])

  const prevMonth = useCallback(() => {
    const target = addMonths(visibleMonth, -1)
    if (isBeforeEarliestMonth(target)) return
    setLoadedMonths(prev => {
      const exists = prev.some(m => m.year === target.year && m.month === target.month)
      if (exists) return prev
      if (prev.length >= MAX_LOADED_MONTHS) return prev
      return [target, ...prev]
    })
    // Scroll to first day of that month
    requestAnimationFrame(() => {
      const firstDay = new Date(target.year, target.month, 1)
      scrollToDate(firstDay)
    })
  }, [visibleMonth, isBeforeEarliestMonth, scrollToDate])

  const nextMonth = useCallback(() => {
    const target = addMonths(visibleMonth, 1)
    setLoadedMonths(prev => {
      const exists = prev.some(m => m.year === target.year && m.month === target.month)
      if (exists) return prev
      if (prev.length >= MAX_LOADED_MONTHS) return prev
      return [...prev, target]
    })
    requestAnimationFrame(() => {
      const firstDay = new Date(target.year, target.month, 1)
      scrollToDate(firstDay)
    })
  }, [visibleMonth, scrollToDate])

  const goToToday = useCallback(() => {
    const todayMonth: MonthKey = { year: today.getFullYear(), month: today.getMonth() }
    setLoadedMonths([addMonths(todayMonth, -1), todayMonth, addMonths(todayMonth, 1)])
    requestAnimationFrame(() => scrollToDate(today))
  }, [today, scrollToDate])

  // Task actions
  const completeTask = async (taskId: number, expValue: number) => {
    if (!token) return
    setCompletingTaskId(taskId)
    try {
      const now = new Date()
      const localHour = now.getHours()
      const localDate = now.toISOString().split('T')[0]
      const res = await fetch(
        `${API_URL}/api/tasks/${taskId}/complete?local_hour=${localHour}&local_date=${localDate}`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.ok) {
        const data = await res.json()
        await refreshTasks()
        await refreshUser()
        if (data.new_badges?.length > 0) {
          setBadgeQueue(prev => [...prev, ...data.new_badges])
        }
      } else {
        Alert.alert(t('tasks.completeFailed'), t('common.tryAgain'))
      }
    } catch {
      Alert.alert(t('tasks.completeFailed'), t('common.tryAgain'))
    } finally {
      setCompletingTaskId(null)
    }
  }

  const handleCancelClick = (taskId: number) => {
    const task = allTasks.find(t => t.id === taskId)
    if (!task) return
    if (task.is_recurring) {
      setCancelModalTask(task)
    } else {
      cancelTask(taskId, false)
    }
  }

  const cancelTask = async (taskId: number, skipOnly: boolean) => {
    if (!token) return
    setCancellingTaskId(taskId)
    try {
      const res = await fetch(
        `${API_URL}/api/tasks/${taskId}/cancel?skip_only=${skipOnly}`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.ok) {
        await refreshTasks()
        await refreshUser()
        setCancelModalTask(null)
      } else {
        Alert.alert(t('tasks.cancelFailed'), t('common.tryAgain'))
      }
    } catch {
      Alert.alert(t('tasks.cancelFailed'), t('common.tryAgain'))
    } finally {
      setCancellingTaskId(null)
    }
  }

  const handleAddTask = (date: Date) => {
    setEditTask(null)
    setSelectedDate(date)
    setIsModalOpen(true)
  }

  const handleQuickAdd = () => {
    setEditTask(null)
    setSelectedDate(new Date())
    setIsModalOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setEditTask(task)
    setIsModalOpen(true)
  }

  const isAtEarliestMonth = useMemo(() => {
    if (!earliestMonth) return false
    return visibleMonth.year === earliestMonth.year && visibleMonth.month === earliestMonth.month
  }, [visibleMonth, earliestMonth])

  const locale = i18n.language.startsWith('vi') ? 'vi-VN' : 'en-US'

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.appTitle}>LEVELING SYSTEM</Text>
          {user && (
            <Text style={styles.rankText}>
              Lv.{user.level_progress.level} · {user.level_progress.rank_title}
            </Text>
          )}
        </View>
        <View style={styles.headerRight}>
          {/* Month navigation */}
          <TouchableOpacity
            onPress={prevMonth}
            disabled={isAtEarliestMonth}
            hitSlop={8}
            style={[styles.navBtn, isAtEarliestMonth && styles.navBtnDisabled]}
          >
            <Ionicons name="chevron-back" size={18} color={isAtEarliestMonth ? '#374151' : '#9CA3AF'} />
          </TouchableOpacity>

          <Text style={styles.monthLabel}>
            {new Date(visibleMonth.year, visibleMonth.month, 1)
              .toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
          </Text>

          <TouchableOpacity onPress={nextMonth} hitSlop={8} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity onPress={goToToday} style={styles.todayBtn} hitSlop={8}>
            <Text style={styles.todayBtnText}>TODAY</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Day list */}
      <ScrollView
        ref={scrollRef}
        style={styles.flex1}
        onScroll={handleScroll}
        scrollEventThrottle={100}
        showsVerticalScrollIndicator={false}
      >
        {allDays.map((day, index) => {
          const dayTasks = getTasksForDay(day)
          const activeTasks = dayTasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && t.status !== 'OVERDUE')
          const completedTasks = dayTasks.filter(t => t.status === 'COMPLETED')
          const cancelledTasks = dayTasks.filter(t => t.status === 'CANCELLED')
          const overdueTasks = dayTasks.filter(t => t.status === 'OVERDUE')
          const past = isPast(day)
          const future = isFuture(day)
          const tod = isToday(day)
          const dateKey = day.toISOString().split('T')[0]
          const isFirstOfMonth = day.getDate() === 1
          const isExpanded = expandedDays.has(dateKey)
          const shouldCollapse = completedTasks.length >= 5

          return (
            <View
              key={dateKey}
              onLayout={e => {
                dayPositionsRef.current.set(dateKey, e.nativeEvent.layout.y)
                // Trigger first scroll to today after positions are measured
                if (!hasScrolledToToday.current && tod) {
                  scrollRef.current?.scrollTo({ y: e.nativeEvent.layout.y, animated: false })
                  hasScrolledToToday.current = true
                }
              }}
            >
              {/* Month separator */}
              {isFirstOfMonth && index > 0 && (
                <View style={styles.monthSeparator}>
                  <View style={styles.monthSeparatorLine} />
                  <Text style={styles.monthSeparatorText}>
                    {new Date(day.getFullYear(), day.getMonth(), 1)
                      .toLocaleDateString(locale, { month: 'long', year: 'numeric' }).toUpperCase()}
                  </Text>
                  <View style={styles.monthSeparatorLine} />
                </View>
              )}

              {/* Day container */}
              <View style={[
                styles.dayContainer,
                tod && styles.dayContainerToday,
                past && styles.dayContainerPast,
              ]}>
                {/* Day header */}
                <View style={[styles.dayHeader, tod && styles.dayHeaderToday, past && styles.dayHeaderPast]}>
                  <View>
                    <Text style={[styles.dayName, tod && styles.dayNameToday, past && styles.dayNamePast]}>
                      {DAY_NAMES[day.getDay()].toUpperCase()}
                    </Text>
                    <Text style={[styles.dayNumber, tod && styles.dayNumberToday, past && styles.dayNumberPast]}>
                      {day.getDate()}
                    </Text>
                  </View>

                  <View style={styles.dayHeaderRight}>
                    {dayTasks.length > 0 && (
                      <View style={styles.progressContainer}>
                        <Text style={[styles.progressText, past && styles.progressTextPast]}>
                          {completedTasks.length}/{dayTasks.length}
                        </Text>
                        <View style={[styles.progressBar, past && styles.progressBarPast]}>
                          <View
                            style={[
                              styles.progressFill,
                              past && styles.progressFillPast,
                              { width: `${(completedTasks.length / dayTasks.length) * 100}%` as any },
                            ]}
                          />
                        </View>
                      </View>
                    )}

                    {!past && (
                      <TouchableOpacity
                        style={[styles.addBtn, tod && styles.addBtnToday]}
                        onPress={() => handleAddTask(day)}
                      >
                        <Ionicons name="add" size={16} color={tod ? '#00A3FF' : '#6B7280'} />
                        <Text style={[styles.addBtnText, tod && styles.addBtnTextToday]}>
                          {t('calendar.newQuest')}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Tasks */}
                {dayTasks.length > 0 && (
                  <View style={styles.tasksContainer}>
                    {activeTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={completeTask}
                        onCancel={handleCancelClick}
                        onEdit={handleEditTask}
                        isCompleting={completingTaskId === task.id}
                        isCancelling={cancellingTaskId === task.id}
                        isFuture={future}
                      />
                    ))}

                    {overdueTasks.map(task => (
                      <OverdueTaskCard key={task.id} task={task} />
                    ))}

                    {cancelledTasks.map(task => (
                      <CancelledTaskCard key={task.id} task={task} />
                    ))}

                    {completedTasks.length > 0 && (
                      shouldCollapse ? (
                        <>
                          <TouchableOpacity
                            style={styles.collapseBtn}
                            onPress={() => setExpandedDays(prev => {
                              const s = new Set(prev)
                              s.has(dateKey) ? s.delete(dateKey) : s.add(dateKey)
                              return s
                            })}
                          >
                            <Text style={styles.collapseBtnText}>
                              Completed ({completedTasks.length})
                            </Text>
                            <Ionicons
                              name={isExpanded ? 'chevron-up' : 'chevron-down'}
                              size={14}
                              color="#4B5563"
                            />
                          </TouchableOpacity>
                          {isExpanded && completedTasks.map(task => (
                            <CompletedTaskCard key={task.id} task={task} />
                          ))}
                        </>
                      ) : (
                        completedTasks.map(task => (
                          <CompletedTaskCard key={task.id} task={task} />
                        ))
                      )
                    )}
                  </View>
                )}
              </View>
            </View>
          )
        })}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB */}
      <View style={styles.fabContainer} pointerEvents="box-none">
        <Animated.View style={[styles.fabPing, { transform: [{ scale: fabPulse }] }]} />
        <TouchableOpacity style={styles.fab} onPress={handleQuickAdd} activeOpacity={0.85}>
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditTask(null) }}
        selectedDate={selectedDate}
        onTaskSaved={refreshTasks}
        editTask={editTask}
      />

      <CancelRecurringModal
        isOpen={!!cancelModalTask}
        onClose={() => setCancelModalTask(null)}
        onSkipOnce={() => cancelModalTask && cancelTask(cancelModalTask.id, true)}
        onCancelAll={() => cancelModalTask && cancelTask(cancelModalTask.id, false)}
        taskTitle={cancelModalTask?.title ?? ''}
        expPenalty={cancelModalTask ? Math.floor(cancelModalTask.exp_value / 5) : 0}
        isLoading={cancellingTaskId === cancelModalTask?.id}
      />

      <BadgeUnlockModal
        isOpen={!!currentBadge}
        onClose={() => setCurrentBadge(null)}
        badge={currentBadge}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  flex1: { flex: 1 },
  // Header
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerLeft: { gap: 2 },
  appTitle: { color: '#00A3FF', fontWeight: 'bold', fontSize: 12, letterSpacing: 4 },
  rankText: { color: '#4B5563', fontSize: 10, letterSpacing: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  navBtn: { padding: 4 },
  navBtnDisabled: { opacity: 0.4 },
  monthLabel: { color: '#9CA3AF', fontSize: 12, fontWeight: '600', minWidth: 120, textAlign: 'center' },
  todayBtn: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: '#374151',
  },
  todayBtnText: { color: '#6B7280', fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
  // Month separator
  monthSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  monthSeparatorLine: { flex: 1, height: 1, backgroundColor: 'rgba(0,163,255,0.2)' },
  monthSeparatorText: { color: 'rgba(0,163,255,0.5)', fontSize: 10, fontWeight: 'bold', letterSpacing: 3 },
  // Day container
  dayContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
  },
  dayContainerToday: { backgroundColor: 'rgba(0,163,255,0.03)', borderBottomColor: 'rgba(0,163,255,0.15)' },
  dayContainerPast: { backgroundColor: '#080808' },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
  },
  dayHeaderToday: { borderBottomColor: 'rgba(0,163,255,0.2)' },
  dayHeaderPast: { borderBottomColor: '#0f0f0f' },
  dayName: { color: '#4B5563', fontSize: 9, fontWeight: 'bold', letterSpacing: 2, marginBottom: 2 },
  dayNameToday: { color: '#00A3FF' },
  dayNamePast: { color: '#1F2937' },
  dayNumber: { color: '#9CA3AF', fontSize: 28, fontWeight: 'bold', lineHeight: 32 },
  dayNumberToday: { color: '#00A3FF' },
  dayNumberPast: { color: '#1F2937' },
  dayHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressContainer: { alignItems: 'flex-end', gap: 4 },
  progressText: { color: '#6B7280', fontSize: 10 },
  progressTextPast: { color: '#1F2937' },
  progressBar: { width: 48, height: 3, backgroundColor: '#1F2937', overflow: 'hidden' },
  progressBarPast: { backgroundColor: '#111' },
  progressFill: { height: '100%', backgroundColor: '#00A3FF' },
  progressFillPast: { backgroundColor: '#2a2a2a' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: '#1F2937',
    backgroundColor: '#111827',
  },
  addBtnToday: { borderColor: 'rgba(0,163,255,0.3)', backgroundColor: 'rgba(0,163,255,0.05)' },
  addBtnText: { color: '#4B5563', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  addBtnTextToday: { color: '#00A3FF' },
  // Tasks
  tasksContainer: { padding: 12, gap: 0 },
  // Collapse button
  collapseBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: '#0a0a0a',
    borderWidth: 1, borderColor: '#1a1a1a',
    marginBottom: 6,
  },
  collapseBtnText: { color: '#444', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  // FAB
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabPing: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00A3FF',
    opacity: 0.2,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00A3FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00A3FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  fabIcon: { color: '#fff', fontSize: 28, fontWeight: 'bold', lineHeight: 30 },
})
