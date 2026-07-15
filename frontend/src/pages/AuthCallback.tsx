import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { refreshUser } = useAuth()

  useEffect(() => {
    let active = true

    async function finishLogin() {
      if (searchParams.get('error')) {
        navigate('/login', { replace: true })
        return
      }
      const authenticated = await refreshUser()
      if (active) {
        navigate(authenticated ? '/' : '/login', { replace: true })
      }
    }

    void finishLogin()
    return () => {
      active = false
    }
  }, [searchParams, navigate, refreshUser])

  return (
    <div className="min-h-screen bg-sl-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-sl-gray-light border-t-sl-blue rounded-full animate-spin mx-auto mb-4 glow-blue-sm" />
        <p className="text-sl-silver-muted">Signing you in...</p>
      </div>
    </div>
  )
}
