import { useMemo } from 'react'
import { GroupedCombobox, type ComboboxOption } from '@/components/ui/GroupedCombobox'
import { TASK_PRESET_CATEGORIES, type TaskPreset } from '@/constants/taskPresets'
import { TaskImportance } from '@/types/task'

const RANK_BADGE: Record<TaskImportance, { label: string; textColor: string; bgColor: string }> = {
  [TaskImportance.TRIVIAL]: { label: 'D', textColor: 'text-sl-silver-muted', bgColor: 'bg-sl-black/60 border border-sl-gray-muted' },
  [TaskImportance.LOW]:     { label: 'C', textColor: 'text-sl-blue',         bgColor: 'bg-sl-blue/10 border border-sl-blue/30' },
  [TaskImportance.MEDIUM]:  { label: 'B', textColor: 'text-sl-purple',       bgColor: 'bg-sl-purple/10 border border-sl-purple/30' },
  [TaskImportance.HIGH]:    { label: 'A', textColor: 'text-[#FF6B00]',       bgColor: 'bg-[#FF6B00]/10 border border-[#FF6B00]/30' },
  [TaskImportance.CRITICAL]:{ label: 'S', textColor: 'text-sl-red',          bgColor: 'bg-sl-red/10 border border-sl-red/30' },
}

interface TaskPresetComboboxProps {
  value: string
  /** Called when a preset is selected — provides both title and importance */
  onPresetSelect: (title: string, importance: TaskImportance) => void
  /** Called when the user simply types in the input */
  onTitleChange: (title: string) => void
}

function renderOption(option: ComboboxOption<TaskPreset>, isHighlighted: boolean) {
  const badge = RANK_BADGE[option.data.importance] ?? RANK_BADGE.TRIVIAL
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors duration-100 ${
        isHighlighted
          ? 'bg-sl-blue/10 border-l-2 border-sl-blue'
          : 'border-l-2 border-transparent hover:bg-sl-gray-light/20'
      }`}
    >
      {/* Rank badge */}
      <span
        className={`shrink-0 w-6 h-6 flex items-center justify-center text-[10px] font-bold rounded ${badge.textColor} ${badge.bgColor}`}
      >
        {badge.label}
      </span>

      {/* Title + description */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-sl-silver font-medium leading-tight truncate">
          {option.label}
        </p>
        <p className="text-[11px] text-sl-silver-muted leading-snug truncate mt-0.5">
          {option.data.description}
        </p>
      </div>
    </div>
  )
}

export function TaskPresetCombobox({
  value,
  onPresetSelect,
  onTitleChange,
}: TaskPresetComboboxProps) {
  const groups = useMemo(
    () =>
      TASK_PRESET_CATEGORIES.map((cat) => ({
        id: cat.id,
        label: cat.label,
        emoji: cat.emoji,
        options: cat.presets.map((preset, i) => ({
          id: `${cat.id}-${i}`,
          label: preset.title,
          data: preset,
        })),
      })),
    [],
  )

  // Match on title or description
  const filterFn = (option: ComboboxOption<TaskPreset>, query: string) => {
    const q = query.toLowerCase()
    return (
      option.data.title.toLowerCase().includes(q) ||
      option.data.description.toLowerCase().includes(q)
    )
  }

  return (
    <GroupedCombobox
      groups={groups}
      value={value}
      onInputChange={onTitleChange}
      onSelect={(opt) => onPresetSelect(opt.data.title, opt.data.importance)}
      placeholder="Search presets or type a custom quest name..."
      autoFocus
      inputClassName="w-full bg-sl-gray border border-sl-gray-muted px-4 py-3 text-sl-silver placeholder-sl-silver-dark focus:outline-none focus:border-sl-blue focus:shadow-[0_0_10px_rgba(0,163,255,0.3)] transition-all"
      renderOption={renderOption}
      filterFn={filterFn}
      maxDropdownHeight="300px"
      emptyMessage="No presets match — type your custom quest name and press Enter."
    />
  )
}
