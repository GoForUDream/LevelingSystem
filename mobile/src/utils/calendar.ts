export interface MonthKey {
  year: number
  month: number
}

export function monthKeyStr(mk: MonthKey): string {
  return `${mk.year}-${mk.month}`
}

export function getMonthDateRange(mk: MonthKey): { start: string; end: string } {
  const start = new Date(mk.year, mk.month, 1)
  const end = new Date(mk.year, mk.month + 1, 0, 23, 59, 59, 999)
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

export function getDaysForMonth(mk: MonthKey): Date[] {
  const daysInMonth = new Date(mk.year, mk.month + 1, 0).getDate()
  const days: Date[] = []
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(mk.year, mk.month, day))
  }
  return days
}

export function addMonths(mk: MonthKey, offset: number): MonthKey {
  const d = new Date(mk.year, mk.month + offset, 1)
  return { year: d.getFullYear(), month: d.getMonth() }
}

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const
