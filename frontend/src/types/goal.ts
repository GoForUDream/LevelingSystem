export interface GoalSummary {
  id: number
  title: string
  description: string | null
  rank: "S" | "A" | "B" | "C" | "D"
  start_date: string
  end_date: string
  is_done: boolean
  created_at: string
  updated_at: string
  total_task_count: number
  completed_task_count: number
  incomplete_task_count: number
}

export interface GoalPage {
  items: GoalSummary[]
  next_cursor: string | null
  has_more: boolean
}
