import { useMemo, useRef } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { ChevronDown } from "lucide-react"
import { useTranslation } from "react-i18next"
import {
  CancelledTaskCard,
  CompletedTaskCard,
  OverdueTaskCard,
  TaskCard,
  type Task,
} from "@/components/TaskCard"
import { AddButton, DisabledButton } from "@/components/ui/buttons"
import { DAY_NAMES } from "@/lib/utils"
import { localDateKey } from "@/lib/calendarData"

type TaskKind = "active" | "overdue" | "cancelled" | "completed"
interface TaskRow {
  kind: TaskKind
  task: Task
}

interface DayColumnProps {
  day: Date
  tasks: Task[]
  isExpanded: boolean
  completingTaskId: number | null
  cancellingTaskId: number | null
  onToggleExpanded: (dateKey: string) => void
  onAddTask: (date: Date) => void
  onComplete: (taskId: number, expValue: number) => void
  onCancel: (taskId: number) => void
  onEdit: (task: Task) => void
}

function VirtualTaskRows({
  rows,
  renderRow,
}: {
  rows: TaskRow[]
  renderRow: (row: TaskRow) => React.ReactNode
}) {
  const parentRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 92,
    overscan: 5,
  })

  return (
    <div ref={parentRef} className="h-full overflow-y-auto">
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((item) => (
          <div
            key={rows[item.index].task.id}
            ref={virtualizer.measureElement}
            data-index={item.index}
            className="absolute left-0 top-0 w-full pb-2"
            style={{ transform: `translateY(${item.start}px)` }}
          >
            {renderRow(rows[item.index])}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DayColumn({
  day,
  tasks,
  isExpanded,
  completingTaskId,
  cancellingTaskId,
  onToggleExpanded,
  onAddTask,
  onComplete,
  onCancel,
  onEdit,
}: DayColumnProps) {
  const { t } = useTranslation()
  const today = new Date()
  const dateOnly = new Date(day.getFullYear(), day.getMonth(), day.getDate())
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const isToday = dateOnly.getTime() === todayOnly.getTime()
  const isPast = dateOnly < todayOnly
  const isFuture = dateOnly > todayOnly
  const dateKey = localDateKey(day)

  const { rows, completedCount, shouldCollapse } = useMemo(() => {
    const active: TaskRow[] = []
    const overdue: TaskRow[] = []
    const cancelled: TaskRow[] = []
    const completed: TaskRow[] = []
    tasks.forEach((task) => {
      if (task.status === "COMPLETED") completed.push({ kind: "completed", task })
      else if (task.status === "OVERDUE") overdue.push({ kind: "overdue", task })
      else if (task.status === "CANCELLED") cancelled.push({ kind: "cancelled", task })
      else active.push({ kind: "active", task })
    })
    const collapse = completed.length >= 5
    return {
      rows: [...active, ...overdue, ...cancelled, ...(collapse && !isExpanded ? [] : completed)],
      completedCount: completed.length,
      shouldCollapse: collapse,
    }
  }, [isExpanded, tasks])

  const renderRow = (row: TaskRow) => {
    if (row.kind === "completed") return <CompletedTaskCard task={row.task} />
    if (row.kind === "cancelled") return <CancelledTaskCard task={row.task} />
    if (row.kind === "overdue") return <OverdueTaskCard task={row.task} />
    return (
      <TaskCard
        task={row.task}
        onComplete={onComplete}
        onCancel={onCancel}
        onEdit={onEdit}
        isCompleting={completingTaskId === row.task.id}
        isCancelling={cancellingTaskId === row.task.id}
        isFuture={isFuture}
      />
    )
  }

  return (
    <div
      className={`h-full flex flex-col relative overflow-hidden ${
        isToday
          ? "bg-linear-to-b from-sl-gray to-sl-black border-l border-r border-sl-blue/30"
          : isPast
            ? "bg-[#0a0a0a] border-r border-[#1a1a1a]"
            : "bg-sl-black border-r border-sl-gray-light/50 hover:bg-sl-gray/30"
      }`}
    >
      {isPast && (
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-45deg, transparent, transparent 8px, #1a1a1a 8px, #1a1a1a 9px)",
          }}
        />
      )}
      <div
        className={`relative z-10 shrink-0 h-24 px-5 py-4 border-b ${
          isToday
            ? "border-sl-blue/30 bg-sl-blue/5"
            : isPast
              ? "border-[#1a1a1a]"
              : "border-sl-gray-light/50"
        }`}
      >
        <div
          className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-2 ${
            isToday
              ? "text-sl-blue text-glow-blue"
              : isPast
                ? "text-[#2a2a2a]"
                : "text-sl-silver-muted"
          }`}
        >
          {DAY_NAMES[day.getDay()]}
        </div>
        <div className="flex items-center justify-between">
          <span
            className={`text-4xl font-bold tracking-tight ${
              isToday
                ? "text-sl-blue text-glow-blue-intense"
                : isPast
                  ? "text-[#2a2a2a]"
                  : "text-sl-silver"
            }`}
          >
            {day.getDate()}
          </span>
          {tasks.length > 0 && (
            <div className="text-right">
              <div className={`text-xs ${isPast ? "text-[#2a2a2a]" : "text-sl-silver-muted"}`}>
                {completedCount}/{tasks.length}
              </div>
              <div className={`w-12 h-1 mt-1 overflow-hidden ${isPast ? "bg-[#151515]" : "bg-sl-gray-muted"}`}>
                <div
                  className={`h-full ${isPast ? "bg-[#333]" : "bg-sl-blue"}`}
                  style={{ width: `${(completedCount / tasks.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 flex-1 min-h-0 p-4 flex flex-col">
        {isPast ? (
          <DisabledButton className="mb-3">{t("calendar.newQuest")}</DisabledButton>
        ) : (
          <AddButton onClick={() => onAddTask(day)} className="mb-3">
            {t("calendar.newQuest")}
          </AddButton>
        )}
        {shouldCollapse && (
          <button
            onClick={() => onToggleExpanded(dateKey)}
            className="w-full py-2 px-3 mb-2 flex items-center justify-between bg-[#0a0a0a] border border-[#1a1a1a] text-[#444] hover:text-[#666] hover:border-[#333] cursor-pointer"
          >
            <span className="text-xs font-bold uppercase tracking-wider">
              Completed ({completedCount})
            </span>
            <ChevronDown size={16} className={isExpanded ? "rotate-180" : ""} />
          </button>
        )}
        <div className="flex-1 min-h-0">
          {rows.length > 50 ? (
            <VirtualTaskRows rows={rows} renderRow={renderRow} />
          ) : (
            <div className="h-full overflow-y-auto space-y-2">
              {rows.map((row) => <div key={row.task.id}>{renderRow(row)}</div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
