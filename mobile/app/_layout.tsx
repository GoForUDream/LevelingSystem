import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider, useAuth } from '../src/contexts/AuthContext'
import '../src/i18n'

function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  )
}

export default RootLayout
