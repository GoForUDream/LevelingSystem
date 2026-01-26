import { useState, useRef, useEffect } from 'react'
import Header from '../components/Header'

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const scrollRef = useRef<HTMLDivElement>(null)
  const todayRef = useRef<HTMLDivElement>(null)

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = []

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    return days
  }

  const days = getDaysInMonth(currentDate)
  const today = new Date()

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString()
  }

  const isPast = (date: Date) => {
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return dateOnly < todayOnly
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  useEffect(() => {
    if (todayRef.current && scrollRef.current) {
      const container = scrollRef.current
      const todayElement = todayRef.current
      const scrollPosition = todayElement.offsetLeft - container.offsetWidth / 2 + todayElement.offsetWidth / 2
      container.scrollTo({ left: scrollPosition, behavior: 'smooth' })
    }
  }, [currentDate])

  return (
    <div className="h-screen w-screen bg-zinc-950 flex flex-col overflow-hidden">
      <Header
        currentDate={currentDate}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
        onToday={goToToday}
      />

      {/* Calendar */}
      <div
        ref={scrollRef}
        className="flex-1 flex overflow-x-auto overflow-y-hidden scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {days.map((day) => (
          <div
            key={day.toISOString()}
            ref={isToday(day) ? todayRef : null}
            className={`flex-shrink-0 w-96 h-full border-r border-zinc-800/50 flex flex-col transition-colors ${
              isToday(day)
                ? 'bg-zinc-900/80'
                : isPast(day)
                  ? 'bg-zinc-950/50'
                  : 'bg-zinc-950 hover:bg-zinc-900/30'
            }`}
          >
            {/* Day Header */}
            <div className={`flex-shrink-0 px-5 py-4 border-b border-zinc-800/50 ${
              isToday(day) ? 'bg-zinc-800/50' : ''
            }`}>
              <div className={`text-xs font-medium uppercase tracking-wider mb-1 ${
                isToday(day) ? 'text-emerald-400' : isPast(day) ? 'text-zinc-600' : 'text-zinc-500'
              }`}>
                {dayNames[day.getDay()]}
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-light ${
                  isToday(day) ? 'text-zinc-100' : isPast(day) ? 'text-zinc-600' : 'text-zinc-300'
                }`}>
                  {day.getDate()}
                </span>
                {isToday(day) && (
                  <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                    Today
                  </span>
                )}
              </div>
            </div>

            {/* Tasks Area */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-2">
                {/* Placeholder for tasks */}
              </div>

              {/* Add Task Button */}
              <button className={`w-full mt-3 py-3 border border-dashed rounded-lg text-sm transition-all ${
                isPast(day)
                  ? 'border-zinc-800 text-zinc-700 cursor-not-allowed'
                  : 'border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'
              }`}
                disabled={isPast(day)}
              >
                + Add Task
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
