import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// API Configuration
export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000"

export function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  return fetch(input, { ...init, credentials: init.credentials ?? "include" })
}

// Date Constants
export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const

// Month Key utilities
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
