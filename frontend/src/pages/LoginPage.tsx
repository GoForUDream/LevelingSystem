import { useState } from 'react'
import { Ghost } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import AppTitle from '@/components/AppTitle'
import GuestWarningModal from '@/components/GuestWarningModal'

export default function LoginPage() {
  const { login, loginAsGuest } = useAuth()
  const [showGuestWarning, setShowGuestWarning] = useState(false)

  const handleGuestConfirm = async () => {
    setShowGuestWarning(false)
    await loginAsGuest()
  }

  return (
    <div className="min-h-screen bg-sl-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12 flex flex-col items-center">
          <AppTitle className="h-16 mb-4" />
          <p className="text-sl-silver-muted">Level up your productivity</p>
        </div>

        <div className="bg-sl-gray border border-sl-gray-light rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-sl-silver text-center mb-2">
            Welcome back
          </h2>
          <p className="text-sl-silver-muted text-center text-sm mb-8">
            Sign in to continue to your dashboard
          </p>

          <button
            onClick={login}
            className="w-full flex items-center justify-center gap-3 bg-sl-blue hover:bg-sl-blue-dark border border-sl-blue text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 glow-blue"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="relative flex items-center my-6">
            <div className="flex-1 border-t border-sl-gray-light" />
            <span className="px-3 text-xs text-sl-silver-dark">or</span>
            <div className="flex-1 border-t border-sl-gray-light" />
          </div>

          <button
            onClick={() => setShowGuestWarning(true)}
            className="w-full flex items-center justify-center gap-3 border border-sl-gray-light text-sl-silver-muted hover:text-sl-silver hover:border-sl-silver/50 font-medium py-3 px-4 rounded-xl transition-all duration-200"
          >
            <Ghost size={18} />
            Continue as Guest
          </button>

          <p className="text-sl-silver-dark text-xs text-center mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

        <p className="text-sl-silver-dark text-sm text-center mt-8">
          New here? Sign in to create your account automatically.
        </p>
      </div>

      <GuestWarningModal
        open={showGuestWarning}
        onConfirm={handleGuestConfirm}
        onCancel={() => setShowGuestWarning(false)}
      />
    </div>
  )
}
