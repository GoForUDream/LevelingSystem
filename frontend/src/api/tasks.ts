import type { Task } from "@/components/TaskCard"
import { CALENDAR_TASK_PAGE_SIZE } from "@/lib/calendarData"
import {
  API_URL,
  apiFetch,
  getMonthDateRange,
  type MonthKey,
} from "@/lib/utils"

interface TaskPage {
  items: Task[]
  next_cursor: string | null
  has_more: boolean
}

export async function fetchMonthTasks(
  token: string,
  month: MonthKey,
  signal: AbortSignal,
): Promise<Task[]> {
  const { start, end } = getMonthDateRange(month)
  const tasks: Task[] = []
  let cursor: string | null = null

  do {
    const params = new URLSearchParams({
      start_date: start,
      end_date: end,
      limit: String(CALENDAR_TASK_PAGE_SIZE),
    })
    if (cursor) params.set("cursor", cursor)
    const response = await apiFetch(`${API_URL}/api/tasks/range/page?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    })
    if (!response.ok) throw new Error(`Task request failed with ${response.status}`)
    const page: TaskPage = await response.json()
    tasks.push(...page.items)
    cursor = page.has_more ? page.next_cursor : null
    if (page.has_more && !cursor) throw new Error("Task page is missing its cursor")
  } while (cursor)

  return tasks
}

export async function completeTaskRequest(
  token: string,
  taskId: number,
): Promise<{ new_badges?: string[] }> {
  const now = new Date()
  const response = await apiFetch(
    `${API_URL}/api/tasks/${taskId}/complete?local_hour=${now.getHours()}&local_date=${now.toISOString().split("T")[0]}`,
    { method: "POST", headers: { Authorization: `Bearer ${token}` } },
  )
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail)
  }
  return response.json()
}

export async function cancelTaskRequest(
  token: string,
  taskId: number,
  skipOnly: boolean,
): Promise<void> {
  const response = await apiFetch(
    `${API_URL}/api/tasks/${taskId}/cancel?skip_only=${skipOnly}`,
    { method: "POST", headers: { Authorization: `Bearer ${token}` } },
  )
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail)
  }
}
