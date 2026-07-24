import type { Task } from "@/components/TaskCard"
import { addMonths, getDaysForMonth, monthKeyStr, type MonthKey } from "@/lib/utils"

export const CALENDAR_MONTH_CACHE_SIZE = 3
export const CALENDAR_TASK_PAGE_SIZE = 200
export const DAY_COLUMN_WIDTH = 384

const importanceOrder: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  TRIVIAL: 4,
}

export function getMonthWindow(center: MonthKey, earliest: MonthKey | null): MonthKey[] {
  const previous = addMonths(center, -1)
  const months = earliest && compareMonths(previous, earliest) < 0
    ? [center]
    : [previous, center]
  months.push(addMonths(center, 1))
  return months
}

export function compareMonths(left: MonthKey, right: MonthKey): number {
  return left.year * 12 + left.month - (right.year * 12 + right.month)
}

export function localDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function groupTasksByLocalDate(tasksByMonth: Map<string, Task[]>): Map<string, Task[]> {
  const grouped = new Map<string, Task[]>()
  tasksByMonth.forEach((tasks) => {
    tasks.forEach((task) => {
      if (!task.due_date) return
      const key = localDateKey(new Date(task.due_date))
      const tasksForDay = grouped.get(key) ?? []
      tasksForDay.push(task)
      grouped.set(key, tasksForDay)
    })
  })
  grouped.forEach((tasks) => {
    tasks.sort((left, right) => {
      if (left.status === "COMPLETED" && right.status !== "COMPLETED") return 1
      if (left.status !== "COMPLETED" && right.status === "COMPLETED") return -1
      const importance = importanceOrder[left.importance] - importanceOrder[right.importance]
      return importance || left.id - right.id
    })
  })
  return grouped
}

export function evictMonthCache(
  cache: Map<string, Task[]>,
  window: MonthKey[],
): Map<string, Task[]> {
  const retained = new Set(window.map(monthKeyStr))
  return new Map([...cache].filter(([key]) => retained.has(key)))
}

export function getWindowDays(window: MonthKey[]): Date[] {
  return window.flatMap(getDaysForMonth)
}

export function getCenteredColumnScrollLeft(
  columnIndex: number,
  viewportWidth: number,
): number {
  return Math.max(
    0,
    columnIndex * DAY_COLUMN_WIDTH - (viewportWidth - DAY_COLUMN_WIDTH) / 2,
  )
}
