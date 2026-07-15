import { useState, useEffect } from 'react'
import { API_URL, apiFetch } from '@/lib/utils'

interface StreakData {
  currentStreak: number
  longestStreak: number
  isAtRisk: boolean
}

// Refetches whenever userExp changes (i.e. after completing a task)
export function useStreak(token: string | null, userExp: number | undefined): StreakData {
  const [streak, setStreak] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    isAtRisk: false,
  })

  useEffect(() => {
    if (!token) return
    let cancelled = false

    async function fetchStreak() {
      try {
        const res = await apiFetch(`${API_URL}/api/achievements`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok || cancelled) return
        const data = await res.json()
        const stats = data.stats

        let isAtRisk = false
        if (stats.current_streak > 0 && stats.last_active_date) {
          const todayStr = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD
          isAtRisk = stats.last_active_date !== todayStr
        }

        if (!cancelled) {
          setStreak({
            currentStreak: stats.current_streak,
            longestStreak: stats.longest_streak,
            isAtRisk,
          })
        }
      } catch {
        // silently fail — streak is non-critical
      }
    }

    fetchStreak()
    return () => { cancelled = true }
  }, [token, userExp]) // re-fetch whenever EXP changes (task completed)

  return streak
}
