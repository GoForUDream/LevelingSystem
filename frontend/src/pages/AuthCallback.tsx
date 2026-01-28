import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setToken } = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')
    const error = searchParams.get('error')

    if (error) {
      console.error('Auth error:', error)
      navigate('/login')
      return
    }

    if (token) {
      setToken(token)
      navigate('/')
    } else {
      navigate('/login')
    }
  }, [searchParams, navigate, setToken])

  return (
    <div className="min-h-screen bg-sl-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-sl-gray-light border-t-sl-blue rounded-full animate-spin mx-auto mb-4 glow-blue-sm"></div>
        <p className="text-sl-silver-muted">Signing you in...</p>
      </div>
    </div>
  )
}
