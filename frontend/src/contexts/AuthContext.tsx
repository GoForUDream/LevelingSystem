import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { API_URL } from '@/lib/utils'

interface LevelProgress {
  level: number
  total_exp: number
  current_level_exp: number
  exp_to_next_level: number
  progress_percent: number
  rank_title: string
  rank_theme: string
}

interface User {
  id: number
  email: string
  name: string
  avatar_url: string | null
  total_exp: number
  level: number
  level_progress: LevelProgress
  created_at: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: () => void
  logout: () => void
  setToken: (token: string) => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setTokenState] = useState<string | null>(() =>
    localStorage.getItem('token')
  )
  const [isLoading, setIsLoading] = useState(true)

  const setToken = (newToken: string) => {
    localStorage.setItem('token', newToken)
    setTokenState(newToken)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setTokenState(null)
    setUser(null)
  }

  const login = () => {
    window.location.href = `${API_URL}/api/auth/login`
  }

  const syncTimezone = useCallback(async () => {
    if (!token) return

    // Get timezone offset in minutes (negative for ahead of UTC)
    // JavaScript returns negative for ahead of UTC, but we want positive for ahead
    const timezoneOffset = -new Date().getTimezoneOffset()

    try {
      await fetch(`${API_URL}/api/auth/timezone?timezone_offset=${timezoneOffset}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    } catch (error) {
      console.error('Failed to sync timezone:', error)
    }
  }, [token])

  const fetchUser = useCallback(async () => {
    if (!token) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        // Sync timezone after successful auth
        syncTimezone()
      } else {
        logout()
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      logout()
    } finally {
      setIsLoading(false)
    }
  }, [token, syncTimezone])

  const refreshUser = useCallback(async () => {
    await fetchUser()
  }, [fetchUser])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, setToken, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
