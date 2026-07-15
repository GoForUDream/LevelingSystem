import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { API_URL } from '@/lib/utils'
import i18n from '@/i18n'

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
  email: string | null
  name: string
  avatar_url: string | null
  is_guest: boolean
  language: string
  total_exp: number
  level: number
  level_progress: LevelProgress
  created_at: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isGuest: boolean
  login: () => void
  loginAsGuest: () => Promise<void>
  linkGoogleAccount: () => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

async function sessionFetch(path: string, init?: RequestInit) {
  return fetch(`${API_URL}${path}`, { ...init, credentials: 'include' })
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const clearSession = useCallback(() => {
    localStorage.removeItem('token')
    setUser(null)
  }, [])

  const syncTimezone = useCallback(async () => {
    const timezoneOffset = -new Date().getTimezoneOffset()
    try {
      await sessionFetch(`/api/auth/timezone?timezone_offset=${timezoneOffset}`, {
        method: 'PATCH',
      })
    } catch (error) {
      console.error('Failed to sync timezone:', error)
    }
  }, [])

  const fetchUser = useCallback(async (): Promise<boolean> => {
    try {
      const response = await sessionFetch('/api/auth/me')
      if (!response.ok) {
        clearSession()
        return false
      }

      const userData: User = await response.json()
      setUser(userData)
      if (userData.language && userData.language !== i18n.language) {
        await i18n.changeLanguage(userData.language)
        localStorage.setItem('sl_language', userData.language)
      }
      void syncTimezone()
      return true
    } catch (error) {
      console.error('Failed to fetch user:', error)
      clearSession()
      return false
    } finally {
      setIsLoading(false)
    }
  }, [clearSession, syncTimezone])

  useEffect(() => {
    // Session discovery is the external synchronization owned by this provider.
    void fetchUser()
  }, [fetchUser])

  const login = () => {
    window.location.href = `${API_URL}/api/auth/login`
  }

  const loginAsGuest = async () => {
    const response = await sessionFetch('/api/auth/guest', { method: 'POST' })
    if (!response.ok) throw new Error('Failed to create guest account')
    await fetchUser()
  }

  const linkGoogleAccount = async () => {
    const response = await sessionFetch('/api/auth/link-google')
    if (!response.ok) throw new Error('Failed to get link URL')
    const data = await response.json()
    window.location.href = data.url
  }

  const logout = async () => {
    try {
      await sessionFetch('/api/auth/logout', { method: 'POST' })
    } finally {
      clearSession()
    }
  }

  const isGuest = user?.is_guest ?? false
  const token = user ? 'cookie-session' : null

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, isGuest, login, loginAsGuest, linkGoogleAccount, logout, refreshUser: fetchUser }}
    >
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
