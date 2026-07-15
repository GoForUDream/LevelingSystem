import { lazy, Suspense, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { Toaster } from '@/components/ui/sonner'

const LoginPage = lazy(() => import('@/pages/LoginPage'))
const AuthCallback = lazy(() => import('@/pages/AuthCallback'))
const CalendarPage = lazy(() => import('@/pages/CalendarPage'))
const AchievementsPage = lazy(() => import('@/pages/AchievementsPage'))
const GoalsPage = lazy(() => import('@/pages/GoalsPage'))
const StatsPage = lazy(() => import('@/pages/StatsPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-sl-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-sl-gray-light border-t-sl-blue rounded-full animate-spin mx-auto mb-4 glow-blue-sm" />
        <p className="text-sl-silver-muted">Loading...</p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function useDayChangeReload() {
  const loadedDate = useRef(new Date().toDateString())

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState !== 'visible') return
      const today = new Date().toDateString()
      if (today !== loadedDate.current) {
        window.location.reload()
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])
}

function AppRoutes() {
  useDayChangeReload()

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/achievements"
        element={
          <ProtectedRoute>
            <AchievementsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/goals"
        element={
          <ProtectedRoute>
            <GoalsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stats"
        element={
          <ProtectedRoute>
            <StatsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      </Routes>
    </Suspense>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--sl-gray)',
              border: '1px solid var(--sl-gray-muted)',
              color: 'var(--sl-silver)',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
