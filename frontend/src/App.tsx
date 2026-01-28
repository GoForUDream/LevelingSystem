import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { Toaster } from '@/components/ui/sonner'
import LoginPage from '@/pages/LoginPage'
import AuthCallback from '@/pages/AuthCallback'
import CalendarPage from '@/pages/CalendarPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sl-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-sl-gray-light border-t-sl-blue rounded-full animate-spin mx-auto mb-4 glow-blue-sm"></div>
          <p className="text-sl-silver-muted">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sl-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-sl-gray-light border-t-sl-blue rounded-full animate-spin mx-auto mb-4 glow-blue-sm"></div>
          <p className="text-sl-silver-muted">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  return (
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
    </Routes>
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
