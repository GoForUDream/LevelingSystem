import { describe, expect, it } from "vitest"
import type { Task } from "@/components/TaskCard"
import {
  evictMonthCache,
  getCenteredColumnScrollLeft,
  getMonthWindow,
  groupTasksByLocalDate,
  localDateKey,
} from "@/lib/calendarData"
import { monthKeyStr } from "@/lib/utils"

function task(id: number, dueDate: string, status = "TODO", importance = "MEDIUM"): Task {
  return {
    id,
    title: `Task ${id}`,
    description: null,
    status,
    importance,
    exp_value: 10,
    exp_earned: null,
    due_date: dueDate,
    is_recurring: false,
    recurrence_type: null,
    recurrence_days: null,
    recurrence_interval: null,
    goal_id: null,
  }
}

describe("calendar month cache", () => {
  it("keeps previous, visible, and next months", () => {
    expect(getMonthWindow({ year: 2026, month: 0 }, null)).toEqual([
      { year: 2025, month: 11 },
      { year: 2026, month: 0 },
      { year: 2026, month: 1 },
    ])
  })

  it("does not include a month before account creation", () => {
    expect(
      getMonthWindow(
        { year: 2026, month: 0 },
        { year: 2026, month: 0 },
      ),
    ).toEqual([
      { year: 2026, month: 0 },
      { year: 2026, month: 1 },
    ])
  })

  it("evicts task data outside the active window", () => {
    const cache = new Map([
      ["2025-11", []],
      ["2026-0", []],
      ["2026-1", []],
      ["2026-2", []],
    ])
    const window = getMonthWindow({ year: 2026, month: 1 }, null)
    expect([...evictMonthCache(cache, window).keys()]).toEqual(
      window.map(monthKeyStr),
    )
  })
})

describe("calendar navigation", () => {
  it("centers a fixed-width day column in the viewport", () => {
    expect(getCenteredColumnScrollLeft(10, 1280)).toBe(3392)
  })

  it("does not request a negative scroll position near the start", () => {
    expect(getCenteredColumnScrollLeft(0, 1280)).toBe(0)
  })
})

describe("task grouping", () => {
  it("groups by local date and sorts active tasks before completed tasks", () => {
    const date = new Date(2026, 6, 24, 12)
    const dateKey = localDateKey(date)
    const cache = new Map([
      [
        "2026-6",
        [
          task(1, date.toISOString(), "COMPLETED", "CRITICAL"),
          task(2, date.toISOString(), "TODO", "LOW"),
          task(3, date.toISOString(), "TODO", "HIGH"),
        ],
      ],
    ])

    expect(groupTasksByLocalDate(cache).get(dateKey)?.map((item) => item.id)).toEqual([
      3,
      2,
      1,
    ])
  })
})
