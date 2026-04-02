import { useState, useRef, useEffect, useCallback, type ReactNode, type KeyboardEvent } from 'react'

export interface ComboboxOption<T = unknown> {
  id: string
  label: string
  data: T
}

export interface ComboboxGroup<T = unknown> {
  id: string
  label: string
  emoji?: string
  options: ComboboxOption<T>[]
}

interface GroupedComboboxProps<T> {
  groups: ComboboxGroup<T>[]
  /** Controlled text value shown in the input */
  value: string
  /** Called when the user types — update your state to change `value` */
  onInputChange: (value: string) => void
  /** Called when the user selects an option from the dropdown */
  onSelect: (option: ComboboxOption<T>) => void
  placeholder?: string
  autoFocus?: boolean
  inputClassName?: string
  /** Render a single option row. Receives the option and whether it is keyboard-highlighted. */
  renderOption: (option: ComboboxOption<T>, isHighlighted: boolean) => ReactNode
  /** Optional custom filter. Defaults to case-insensitive label substring match. */
  filterFn?: (option: ComboboxOption<T>, query: string) => boolean
  maxDropdownHeight?: string
  emptyMessage?: string
}

export function GroupedCombobox<T>({
  groups,
  value,
  onInputChange,
  onSelect,
  placeholder,
  autoFocus,
  inputClassName,
  renderOption,
  filterFn,
  maxDropdownHeight = '320px',
  emptyMessage = 'No presets match — type your own name below.',
}: GroupedComboboxProps<T>) {
  const [open, setOpen] = useState(false)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const highlightedRef = useRef<HTMLDivElement>(null)

  const defaultFilter = useCallback(
    (option: ComboboxOption<T>, query: string) =>
      option.label.toLowerCase().includes(query.toLowerCase()),
    [],
  )

  const activeFilter = filterFn ?? defaultFilter

  const filteredGroups = value.trim()
    ? groups
        .map((g) => ({ ...g, options: g.options.filter((o) => activeFilter(o, value)) }))
        .filter((g) => g.options.length > 0)
    : groups

  const flatOptions = filteredGroups.flatMap((g) => g.options)

  const highlightedIndex = highlightedId
    ? flatOptions.findIndex((o) => o.id === highlightedId)
    : -1

  // Scroll highlighted item into view
  useEffect(() => {
    highlightedRef.current?.scrollIntoView({ block: 'nearest' })
  }, [highlightedId])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setHighlightedId(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setOpen(true)
        setHighlightedId(flatOptions[0]?.id ?? null)
      }
      return
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        setHighlightedId(null)
        break

      case 'ArrowDown': {
        e.preventDefault()
        const next =
          highlightedIndex < flatOptions.length - 1 ? highlightedIndex + 1 : 0
        setHighlightedId(flatOptions[next]?.id ?? null)
        break
      }

      case 'ArrowUp': {
        e.preventDefault()
        const prev =
          highlightedIndex > 0 ? highlightedIndex - 1 : flatOptions.length - 1
        setHighlightedId(flatOptions[prev]?.id ?? null)
        break
      }

      case 'Enter': {
        if (highlightedId) {
          e.preventDefault()
          const opt = flatOptions.find((o) => o.id === highlightedId)
          if (opt) {
            onSelect(opt)
            setOpen(false)
            setHighlightedId(null)
          }
        }
        break
      }
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className={inputClassName}
        onChange={(e) => {
          onInputChange(e.target.value)
          setOpen(true)
          setHighlightedId(null)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        spellCheck={false}
      />

      {open && (
        <div
          ref={listRef}
          role="listbox"
          className="absolute z-50 left-0 right-0 top-full mt-1 bg-sl-gray border border-sl-blue/30 shadow-[0_8px_32px_rgba(0,163,255,0.15)] overflow-y-auto scrollbar-hide"
          style={{ maxHeight: maxDropdownHeight }}
        >
          {filteredGroups.length === 0 ? (
            <div className="px-4 py-3 text-xs text-sl-silver-muted italic">
              {emptyMessage}
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.id}>
                {/* Group header */}
                <div className="sticky top-0 z-10 px-3 py-1.5 flex items-center gap-1.5 bg-sl-black/80 backdrop-blur-sm border-b border-sl-gray-muted">
                  {group.emoji && (
                    <span className="text-sm leading-none">{group.emoji}</span>
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-sl-silver-muted">
                    {group.label}
                  </span>
                </div>

                {/* Options */}
                {group.options.map((opt) => {
                  const isHighlighted = opt.id === highlightedId
                  return (
                    <div
                      key={opt.id}
                      ref={isHighlighted ? highlightedRef : undefined}
                      role="option"
                      aria-selected={isHighlighted}
                      onMouseEnter={() => setHighlightedId(opt.id)}
                      onMouseDown={(e) => {
                        // Prevent input blur before the select fires
                        e.preventDefault()
                        onSelect(opt)
                        setOpen(false)
                        setHighlightedId(null)
                      }}
                    >
                      {renderOption(opt, isHighlighted)}
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
