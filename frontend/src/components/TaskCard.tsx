import { Check, Pencil, Repeat, X } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

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

interface TaskCardProps {
  task: Task
  onComplete: (taskId: number, expValue: number) => void
  onCancel: (taskId: number, expValue: number) => void
  onEdit: (task: Task) => void
  isCompleting: boolean
  isCancelling: boolean
  isFuture?: boolean
}

const importanceColors: Record<string, string> = {
  TRIVIAL: 'bg-sl-silver-muted',
  LOW: 'bg-sl-blue',
  MEDIUM: 'bg-sl-purple',
  HIGH: 'bg-[#FF6B00]',
  CRITICAL: 'bg-sl-red',
}

const importanceGlow: Record<string, string> = {
  CRITICAL: 'border-sl-red/50 hover:border-sl-red hover:shadow-[0_0_15px_rgba(230,57,70,0.3)]',
  HIGH: 'border-[#FF6B00]/50 hover:border-[#FF6B00] hover:shadow-[0_0_15px_rgba(255,107,0,0.3)]',
  MEDIUM: 'border-sl-purple/30 hover:border-sl-purple hover:shadow-[0_0_15px_rgba(123,44,191,0.3)]',
  LOW: 'border-sl-blue/30 hover:border-sl-blue hover:shadow-[0_0_15px_rgba(0,163,255,0.3)]',
  TRIVIAL: 'border-sl-gray-muted/50 hover:border-sl-silver-muted',
}

export function TaskCard({ task, onComplete, onCancel, onEdit, isCompleting, isCancelling, isFuture = false }: TaskCardProps) {
  return (
    <div
      className={`group relative p-3 border transition-all duration-200 overflow-hidden bg-linear-to-r from-sl-gray-light/80 to-sl-gray/50 ${importanceGlow[task.importance]}`}
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${importanceColors[task.importance]}`} />

      <div className="flex items-start gap-3 pl-2 pr-16">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium tracking-wide text-sl-silver">
            {task.title}
          </div>
          {task.description && (
            <div className="text-xs mt-1 truncate text-sl-silver-muted">
              {task.description}
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-bold tracking-wider text-sl-blue text-glow-blue">
              {task.exp_value} EXP
            </span>
            {task.is_recurring && (
              <Repeat size={10} className="text-sl-silver-muted" />
            )}
          </div>
        </div>

        {/* Action buttons - show on hover */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          {/* Edit button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onEdit(task)}
                className="p-1 text-sl-silver-muted hover:text-sl-silver transition-all cursor-pointer"
              >
                <Pencil size={16} strokeWidth={2} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>

          {/* Cancel button - hidden for future tasks */}
          {!isFuture && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onCancel(task.id, task.exp_value)}
                  disabled={isCancelling}
                  className="p-1 text-sl-silver-muted hover:text-sl-red transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isCancelling ? (
                    <div className="w-4 h-4 border-2 border-sl-red border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <X size={16} strokeWidth={2.5} />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>Cancel</TooltipContent>
            </Tooltip>
          )}

          {/* Complete button - hidden for future tasks */}
          {!isFuture && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onComplete(task.id, task.exp_value)}
                  disabled={isCompleting}
                  className="p-1 text-sl-silver-muted hover:text-sl-blue transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isCompleting ? (
                    <div className="w-4 h-4 border-2 border-sl-blue border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check size={18} strokeWidth={2.5} />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>Complete</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  )
}

export function CancelledTaskCard({ task }: { task: Task }) {
  const penalty = Math.floor(task.exp_value / 5);
  return (
    <div className="relative p-3 bg-[#080808] border border-sl-red/10 overflow-hidden">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 4px,
            #1a1a1a 4px,
            #1a1a1a 5px
          )`
        }}
      />

      <div className="relative flex items-center gap-3">
        <div className="shrink-0 w-5 h-5 border border-sl-red/20 flex items-center justify-center">
          <X size={12} className="text-sl-red/40" strokeWidth={3} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="relative">
            <span className="text-sm font-medium text-[#3a3a3a]">
              {task.title}
            </span>
            <div className="absolute top-1/2 left-0 right-0 h-px bg-[#333]" />
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-bold tracking-wider text-sl-red/40">
              -{penalty} EXP
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CompletedTaskCard({ task }: { task: Task }) {
  return (
    <div className="relative p-3 bg-[#080808] border border-[#151515] overflow-hidden">
      {/* Diagonal lines pattern background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 4px,
            #1a1a1a 4px,
            #1a1a1a 5px
          )`
        }}
      />

      <div className="relative flex items-center gap-3">
        {/* Checkmark circle */}
        <div className="shrink-0 w-5 h-5 border border-[#333] flex items-center justify-center">
          <Check size={12} className="text-[#444]" strokeWidth={3} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title with strikethrough */}
          <div className="relative">
            <span className="text-sm font-medium text-[#3a3a3a]">
              {task.title}
            </span>
            <div className="absolute top-1/2 left-0 right-0 h-px bg-[#333]" />
          </div>

          {/* EXP earned */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-bold tracking-wider text-[#333]">
              +{task.exp_earned || task.exp_value} EXP
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
