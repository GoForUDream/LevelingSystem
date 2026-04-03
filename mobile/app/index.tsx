import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../src/contexts/AuthContext'

export default function Index() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (user) {
      router.replace('/(app)/calendar')
    } else {
      router.replace('/(auth)/login')
    }
  }, [user, isLoading])

  return (
    <View style={{ flex: 1, backgroundColor: '#0D0D0D', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color="#00A3FF" />
    </View>
  )
}
