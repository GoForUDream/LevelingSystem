import { useAuth } from '../contexts/AuthContext'

interface HeaderProps {
  currentDate: Date
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function Header({ currentDate, onPrevMonth, onNextMonth, onToday }: HeaderProps) {
  const { user, logout } = useAuth()

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="flex-shrink-0 px-8 py-4 border-b border-zinc-800/50 bg-zinc-950">
      <div className="flex items-center justify-between">
        {/* Left - Logo */}
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
              Leveling System
            </h1>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={onToday}
              className="text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 px-3 py-1.5 rounded-lg transition-all"
            >
              Today
            </button>

            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={onPrevMonth}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <span className="text-sm font-medium text-zinc-300 min-w-[140px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>

              <button
                onClick={onNextMonth}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Right - User */}
        {user && (
          <div className="flex items-center gap-4">
            {/* User Info */}
            <div className="flex items-center gap-3">
              {/* Avatar */}
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-9 h-9 rounded-full ring-2 ring-zinc-700"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-zinc-800 ring-2 ring-zinc-700 flex items-center justify-center text-sm font-medium text-zinc-300">
                  {getInitials(user.name)}
                </div>
              )}

              {/* Name & Level */}
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-zinc-200">{user.name}</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">Level {user.level}</span>
                  {/* Progress bar placeholder */}
                  <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${(user.total_exp % 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={logout}
              className="text-zinc-500 hover:text-zinc-300 p-2 hover:bg-zinc-800 rounded-lg transition-all"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
