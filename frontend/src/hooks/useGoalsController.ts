import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  deleteGoalRequest,
  fetchGoalPage,
  toggleGoalRequest,
} from "@/api/goals"
import { badgeIdToName } from "@/constants/achievements"
import { useAuth } from "@/contexts/AuthContext"
import type { GoalSummary } from "@/types/goal"
import { invalidateProgressQueries } from "@/lib/queryClient"

export function useGoalsController() {
  const { token } = useAuth()
  const { t } = useTranslation()
  const [goals, setGoals] = useState<GoalSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const fetchGoals = useCallback(
    async (cursor: string | null = null) => {
      if (!token) return
      if (cursor) setIsLoadingMore(true)
      else setIsLoading(true)
      try {
        const page = await fetchGoalPage(token, cursor)
        setGoals((previous) => cursor ? [...previous, ...page.items] : page.items)
        setNextCursor(page.next_cursor)
        setHasMore(page.has_more)
      } catch {
        toast.error(t("goals.loadFailed"))
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [t, token],
  )

  useEffect(() => {
    void fetchGoals()
  }, [fetchGoals])

  const toggleGoal = async (goalId: number) => {
    if (!token) return
    const goal = goals.find((item) => item.id === goalId)
    if (goal && !goal.is_done && goal.incomplete_task_count > 0) {
      const count = goal.incomplete_task_count
      toast.error(t("goals.completeTasksFirst"), {
        description: count === 1
          ? t("goals.tasksIncomplete_one", { count })
          : t("goals.tasksIncomplete_other", { count }),
      })
      return
    }
    try {
      const result = await toggleGoalRequest(token, goalId)
      await Promise.all([fetchGoals(), invalidateProgressQueries()])
      result.new_badges?.forEach((badgeId) => {
        toast.success(t("goals.badgeUnlocked", {
          name: badgeIdToName[badgeId] || badgeId,
        }))
      })
    } catch {
      toast.error(t("goals.toggleFailed"))
    }
  }

  const deleteGoal = async (goalId: number) => {
    if (!token) return
    try {
      await deleteGoalRequest(token, goalId)
      await fetchGoals()
      toast.success(t("goals.deleted"))
    } catch {
      toast.error(t("goals.deleteFailed"))
    }
  }

  return {
    deleteGoal,
    fetchGoals,
    goals,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore: () => fetchGoals(nextCursor),
    token,
    toggleGoal,
  }
}
