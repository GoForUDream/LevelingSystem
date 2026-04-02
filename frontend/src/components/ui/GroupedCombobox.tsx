import {
  useState,
  useRef,
  useEffect,
  type ReactNode,
  type KeyboardEvent,
} from 'react'
import { ChevronRight, ChevronLeft } from 'lucide-react'

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
  /** Called when the user types */
  onInputChange: (value: string) => void
  /** Called when the user selects an option */
  onSelect: (option: ComboboxOption<T>) => void
  placeholder?: string
  autoFocus?: boolean
  inputClassName?: string
  /**
   * Render a single option row inside a category.
   * Receives the option and whether it is keyboard-highlighted.
   */
  renderOption: (option: ComboboxOption<T>, isHighlighted: boolean) => ReactNode
  /**
   * Optionally render the right-side content of a category row.
   * Defaults to showing the option count.
   */
  renderGroupMeta?: (group: ComboboxGroup<T>) => ReactNode
  /** Optional custom filter for search mode. Defaults to label substring match. */
  filterFn?: (option: ComboboxOption<T>, query: string) => boolean
  /** Max height of the dropdown panel */
  maxDropdownHeight?: string
  emptyMessage?: string
}

type Level = 'groups' | 'options'

export function GroupedCombobox<T>({
  groups,
  value,
  onInputChange,
  onSelect,
  placeholder,
  autoFocus,
  inputClassName,
  renderOption,
  renderGroupMeta,
  filterFn,
  maxDropdownHeight = '320px',
  emptyMessage = 'No matches — type your own name.',
}: GroupedComboboxProps<T>) {
  const [open, setOpen] = useState(false)
  const [level, setLevel] = useState<Level>('groups')
  const [activeGroup, setActiveGroup] = useState<ComboboxGroup<T> | null>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [animating, setAnimating] = useState(false)
  const [slideDirection, setSlideDirection] = useState<'in' | 'out'>('in')

  const containerRef = useRef<HTMLDivElement>(null)
  const highlightedRef = useRef<HTMLDivElement>(null)

  const isSearching = value.trim().length > 0

  // --- Filter logic (search mode) ---
  const defaultFilter = (option: ComboboxOption<T>, query: string) =>
    option.label.toLowerCase().includes(query.toLowerCase())
  const activeFilter = filterFn ?? defaultFilter

  const searchResults = isSearching
    ? groups.flatMap((g) =>
        g.options
          .filter((o) => activeFilter(o, value))
          .map((o) => ({ ...o, _groupId: g.id, _groupLabel: g.label, _groupEmoji: g.emoji })),
      )
    : []

  // --- Items navigable at current level ---
  const currentItems: { id: string }[] = isSearching
    ? searchResults
    : level === 'groups'
      ? groups
      : (activeGroup?.options ?? [])

  const highlightedIndex = highlightedId
    ? currentItems.findIndex((i) => i.id === highlightedId)
    : -1

  // Scroll highlighted item into view
  useEffect(() => {
    highlightedRef.current?.scrollIntoView({ block: 'nearest' })
  }, [highlightedId])

  const resetDrillState = () => {
    setLevel('groups')
    setActiveGroup(null)
    setHighlightedId(null)
  }

  const closeDropdown = () => {
    setOpen(false)
    resetDrillState()
  }

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeDropdown()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const drillInto = (group: ComboboxGroup<T>) => {
    setSlideDirection('in')
    setAnimating(true)
    setTimeout(() => {
      setActiveGroup(group)
      setLevel('options')
      setHighlightedId(null)
      setAnimating(false)
    }, 150)
  }

  const drillBack = () => {
    setSlideDirection('out')
    setAnimating(true)
    setTimeout(() => {
      setLevel('groups')
      setActiveGroup(null)
      setHighlightedId(null)
      setAnimating(false)
    }, 150)
  }

  const handleSelect = (opt: ComboboxOption<T>) => {
    onSelect(opt)
    closeDropdown()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setOpen(true)
        setHighlightedId(currentItems[0]?.id ?? null)
      }
      return
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        if (level === 'options') {
          drillBack()
        } else {
          closeDropdown()
        }
        break

      case 'ArrowDown': {
        e.preventDefault()
        const next =
          highlightedIndex < currentItems.length - 1 ? highlightedIndex + 1 : 0
        setHighlightedId(currentItems[next]?.id ?? null)
        break
      }

      case 'ArrowUp': {
        e.preventDefault()
        const prev =
          highlightedIndex > 0 ? highlightedIndex - 1 : currentItems.length - 1
        setHighlightedId(currentItems[prev]?.id ?? null)
        break
      }

      case 'ArrowRight':
      case 'Enter': {
        if (isSearching) {
          // In search mode Enter selects the highlighted result
          if (highlightedId) {
            e.preventDefault()
            const opt = searchResults.find((o) => o.id === highlightedId)
            if (opt) handleSelect(opt)
          }
          break
        }
        if (level === 'groups' && highlightedId) {
          e.preventDefault()
          const group = groups.find((g) => g.id === highlightedId)
          if (group) drillInto(group)
        } else if (level === 'options' && highlightedId) {
          e.preventDefault()
          const opt = activeGroup?.options.find((o) => o.id === highlightedId)
          if (opt) handleSelect(opt)
        }
        break
      }

      case 'ArrowLeft':
      case 'Backspace': {
        if (level === 'options' && !value) {
          e.preventDefault()
          drillBack()
        }
        break
      }
    }
  }

  // Slide animation class
  const slideClass = animating
    ? slideDirection === 'in'
      ? 'opacity-0 translate-x-4'
      : 'opacity-0 -translate-x-4'
    : 'opacity-100 translate-x-0'

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
          // Entering search mode — exit any active drill level
          if (e.target.value.trim() && level === 'options') {
            resetDrillState()
          }
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        spellCheck={false}
      />

      {open && (
        <div
          className="absolute z-50 left-0 right-0 top-full mt-1 bg-sl-gray border border-sl-blue/30 shadow-[0_8px_32px_rgba(0,163,255,0.15)] overflow-hidden"
          style={{ maxHeight: maxDropdownHeight }}
        >
          {/* ── Search mode: flat filtered results ── */}
          {isSearching && (
            <div className="overflow-y-auto" style={{ maxHeight: maxDropdownHeight }}>
              {searchResults.length === 0 ? (
                <p className="px-4 py-3 text-xs text-sl-silver-muted italic">{emptyMessage}</p>
              ) : (
                searchResults.map((opt) => {
                  const isHighlighted = opt.id === highlightedId
                  return (
                    <div
                      key={opt.id}
                      ref={isHighlighted ? highlightedRef : undefined}
                      onMouseEnter={() => setHighlightedId(opt.id)}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleSelect(opt)
                      }}
                    >
                      {renderOption(opt, isHighlighted)}
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* ── Drill-down mode ── */}
          {!isSearching && (
            <div
              className={`transition-all duration-150 ease-out ${slideClass}`}
              style={{ maxHeight: maxDropdownHeight, overflowY: 'auto' }}
            >
              {/* Level 0: Category list */}
              {level === 'groups' &&
                groups.map((group) => {
                  const isHighlighted = group.id === highlightedId
                  return (
                    <div
                      key={group.id}
                      ref={isHighlighted ? highlightedRef : undefined}
                      onMouseEnter={() => setHighlightedId(group.id)}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        drillInto(group)
                      }}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-100 border-b border-sl-gray-muted/50 last:border-b-0 ${
                        isHighlighted
                          ? 'bg-sl-blue/10 border-l-2 border-l-sl-blue'
                          : 'border-l-2 border-l-transparent hover:bg-sl-gray-light/20'
                      }`}
                    >
                      {group.emoji && (
                        <span className="text-lg leading-none w-6 text-center">
                          {group.emoji}
                        </span>
                      )}
                      <span className="flex-1 text-sm font-medium text-sl-silver">
                        {group.label}
                      </span>
                      <div className="flex items-center gap-2 text-sl-silver-muted">
                        {renderGroupMeta ? (
                          renderGroupMeta(group)
                        ) : (
                          <span className="text-[10px] uppercase tracking-wider">
                            {group.options.length} quests
                          </span>
                        )}
                        <ChevronRight size={14} />
                      </div>
                    </div>
                  )
                })}

              {/* Level 1: Options inside a category */}
              {level === 'options' && activeGroup && (
                <>
                  {/* Back header */}
                  <div
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer border-b border-sl-blue/20 bg-sl-black/40 sticky top-0 z-10 hover:bg-sl-blue/5 transition-colors"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      drillBack()
                    }}
                  >
                    <ChevronLeft size={14} className="text-sl-blue" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-sl-blue">
                      {activeGroup.emoji} {activeGroup.label}
                    </span>
                  </div>

                  {activeGroup.options.map((opt) => {
                    const isHighlighted = opt.id === highlightedId
                    return (
                      <div
                        key={opt.id}
                        ref={isHighlighted ? highlightedRef : undefined}
                        onMouseEnter={() => setHighlightedId(opt.id)}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          handleSelect(opt)
                        }}
                      >
                        {renderOption(opt, isHighlighted)}
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
