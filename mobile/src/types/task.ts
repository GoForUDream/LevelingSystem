export interface Task {
  id: number
  title: string
  description: string | null
  status: string
  importance: string
  exp_value: number
  exp_earned: number | null
  due_date: string | null
  is_recurring: boolean
  recurrence_type: string | null
  recurrence_days: string | null
  recurrence_interval: number | null
  goal_id: number | null
}

export const TaskImportance = {
  TRIVIAL:  'TRIVIAL',
  LOW:      'LOW',
  MEDIUM:   'MEDIUM',
  HIGH:     'HIGH',
  CRITICAL: 'CRITICAL',
} as const

export type TaskImportance = (typeof TaskImportance)[keyof typeof TaskImportance]
