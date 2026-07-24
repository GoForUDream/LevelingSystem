export interface GoalDeadline {
  key: "overdue" | "dueToday" | "daysRemaining"
  diff?: number
}

export function getGoalDeadline(deadline: string | null): GoalDeadline | null {
  if (!deadline) return null
  const now = new Date()
  const target = new Date(deadline)
  const diff = Math.ceil(
    (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  )
  if (diff < 0) return { key: "overdue" }
  if (diff === 0) return { key: "dueToday" }
  return { key: "daysRemaining", diff }
}
