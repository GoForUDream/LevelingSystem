import { useCallback, useEffect, useRef, useState } from "react"
import { TrendingUp } from "lucide-react"
import { useTranslation } from "react-i18next"
import { API_URL, apiFetch } from "@/lib/utils"

interface Milestone {
  title: string
  total_count: number
  completed_count: number
}

interface MilestonePage {
  items: Milestone[]
  next_cursor: string | null
  has_more: boolean
}

interface GoalMilestonesProps {
  goalId: number
  token: string | null
  totalCount: number
  completedCount: number
  accentColor: string
  progressColor: string
}

export default function GoalMilestones({
  goalId,
  token,
  totalCount,
  completedCount,
  accentColor,
  progressColor,
}: GoalMilestonesProps) {
  const { t } = useTranslation()
  const rootRef = useRef<HTMLDivElement>(null)
  const [items, setItems] = useState<Milestone[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)

  const fetchPage = useCallback(
    async (cursor: string | null, append: boolean) => {
      if (!token || isLoading) return
      setIsLoading(true)
      setHasError(false)
      try {
        const params = new URLSearchParams({ limit: "50" })
        if (cursor) params.set("cursor", cursor)
        const response = await apiFetch(
          `${API_URL}/api/goals/${goalId}/milestones/page?${params}`,
          { headers: { Authorization: `Bearer ${token}` } },
        )
        if (!response.ok) throw new Error(`Milestone request failed with ${response.status}`)
        const page: MilestonePage = await response.json()
        setItems((previous) => append ? [...previous, ...page.items] : page.items)
        setNextCursor(page.next_cursor)
        setHasMore(page.has_more)
        setHasStarted(true)
      } catch {
        setHasError(true)
      } finally {
        setIsLoading(false)
      }
    },
    [goalId, isLoading, token],
  )

  useEffect(() => {
    const element = rootRef.current
    if (!element || hasStarted) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void fetchPage(null, false)
          observer.disconnect()
        }
      },
      { root: element.closest("[data-goal-scroll]"), rootMargin: "384px" },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [fetchPage, hasStarted])

  return (
    <div ref={rootRef} className="flex-1 min-h-0 px-5 py-4 overflow-y-auto">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={12} className="text-sl-silver-muted" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-sl-silver-muted">
          {t("goals.milestones")} ({completedCount}/{totalCount})
        </span>
      </div>

      {totalCount === 0 ? (
        <p className="text-xs text-sl-silver-dark italic">{t("goals.noTasks")}</p>
      ) : (
        <div className="space-y-2">
          {items.map((milestone) => {
            const allDone = milestone.completed_count === milestone.total_count
            const noneDone = milestone.completed_count === 0
            return (
              <div
                key={milestone.title}
                className={`flex items-start gap-3 p-3 border ${
                  allDone ? "border-[#1a1a1a] bg-[#0a0a0a]" : "border-sl-gray-light/50 bg-sl-gray/20"
                }`}
              >
                <div
                  className={`shrink-0 w-4 h-4 mt-0.5 border flex items-center justify-center ${
                    allDone ? "border-[#333] bg-[#1a1a1a]" : "border-sl-gray-muted"
                  }`}
                >
                  {allDone && <span className="text-[10px] text-[#555]">✓</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-xs font-medium ${allDone ? "text-[#333] line-through" : "text-sl-silver"}`}>
                    {milestone.title}
                  </span>
                  {milestone.total_count > 1 && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold ${allDone ? "text-[#333]" : noneDone ? "text-sl-silver-muted" : accentColor}`}>
                        {milestone.completed_count}/{milestone.total_count}
                      </span>
                      <div className="flex-1 h-1 bg-sl-gray-muted/50 overflow-hidden max-w-20">
                        <div
                          className="h-full"
                          style={{
                            width: `${(milestone.completed_count / milestone.total_count) * 100}%`,
                            background: allDone ? "#333" : progressColor,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          {(hasMore || hasError) && (
            <button
              onClick={() => void fetchPage(nextCursor, items.length > 0)}
              disabled={isLoading}
              className="w-full py-2 border border-sl-gray-light text-xs font-bold uppercase text-sl-silver-muted hover:text-sl-blue disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? t("common.loading") : hasError ? t("common.retry") : t("common.loadMore")}
            </button>
          )}
          {!hasStarted && isLoading && (
            <p className="text-xs text-sl-silver-muted">{t("common.loading")}</p>
          )}
        </div>
      )}
    </div>
  )
}
