export const TaskImportance = {
  TRIVIAL:  'TRIVIAL',
  LOW:      'LOW',
  MEDIUM:   'MEDIUM',
  HIGH:     'HIGH',
  CRITICAL: 'CRITICAL',
} as const

export type TaskImportance = (typeof TaskImportance)[keyof typeof TaskImportance]
