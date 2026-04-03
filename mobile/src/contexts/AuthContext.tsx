import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_URL } from '../constants/api'
import i18n from '../i18n'

interface LevelProgress {
  level: number
  total_exp: number
  current_level_exp: number
  exp_to_next_level: number
  progress_percent: number
  rank_title: string
  rank_theme: string
}

export interface User {
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
  setToken: (token: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setTokenState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const setToken = async (newToken: string) => {
    await AsyncStorage.setItem('token', newToken)
    setTokenState(newToken)
  }

  const logout = async () => {
    await AsyncStorage.removeItem('token')
    setTokenState(null)
    setUser(null)
  }

  const fetchUser = useCallback(async (t: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${t}` },
      })
      if (res.ok) {
        const data: User = await res.json()
        setUser(data)
        if (data.language && data.language !== i18n.language) {
          await i18n.changeLanguage(data.language)
          await AsyncStorage.setItem('sl_language', data.language)
        }
      } else {
        await logout()
      }
    } catch {
      await logout()
    }
  }, [])

  const refreshUser = useCallback(async () => {
    if (token) await fetchUser(token)
  }, [token, fetchUser])

  useEffect(() => {
    async function init() {
      const storedToken = await AsyncStorage.getItem('token')
      const storedLang = await AsyncStorage.getItem('sl_language')
      if (storedLang) await i18n.changeLanguage(storedLang)

      if (storedToken) {
        setTokenState(storedToken)
        await fetchUser(storedToken)
      }
      setIsLoading(false)
    }
    init()
  }, [fetchUser])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isGuest: user?.is_guest ?? false,
        setToken,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
