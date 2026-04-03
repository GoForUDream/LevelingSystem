import { useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { useTranslation } from 'react-i18next'
import * as WebBrowser from 'expo-web-browser'
import * as AuthSession from 'expo-auth-session'
import { useAuth } from '../../src/contexts/AuthContext'
import { API_URL, GOOGLE_CLIENT_ID } from '../../src/constants/api'

WebBrowser.maybeCompleteAuthSession()

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_DISCOVERY = {
  authorizationEndpoint: GOOGLE_AUTH_ENDPOINT,
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
}

export default function LoginScreen() {
  const { t } = useTranslation()
  const { setToken } = useAuth()
  const [isGuestLoading, setIsGuestLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'levelingsystem', path: 'auth' })

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['openid', 'email', 'profile'],
      redirectUri,
    },
    GOOGLE_DISCOVERY,
  )

  const handleGoogleResponse = useCallback(
    async (res: AuthSession.AuthSessionResult) => {
      if (res.type !== 'success') return
      setIsGoogleLoading(true)
      try {
        const { code } = res.params
        const apiRes = await fetch(`${API_URL}/api/auth/mobile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, redirect_uri: redirectUri }),
        })
        if (!apiRes.ok) {
          const err = await apiRes.json()
          Alert.alert('Error', err.detail ?? 'Google login failed')
          return
        }
        const { token } = await apiRes.json()
        await setToken(token)
      } catch {
        Alert.alert('Error', 'Could not connect to server')
      } finally {
        setIsGoogleLoading(false)
      }
    },
    [redirectUri, setToken],
  )

  const handleGoogleLogin = useCallback(async () => {
    if (!request) return
    setIsGoogleLoading(true)
    const res = await promptAsync()
    await handleGoogleResponse(res)
  }, [request, promptAsync, handleGoogleResponse])

  const handleGuestLogin = useCallback(async () => {
    setIsGuestLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/auth/guest`, { method: 'POST' })
      if (!res.ok) {
        Alert.alert('Error', 'Guest login failed')
        return
      }
      const { token } = await res.json()
      await setToken(token)
    } catch {
      Alert.alert('Error', 'Could not connect to server')
    } finally {
      setIsGuestLoading(false)
    }
  }, [setToken])

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo area */}
        <Text style={styles.logo}>⚔</Text>
        <Text style={styles.title}>LEVELING SYSTEM</Text>
        <Text style={styles.tagline}>{t('auth.tagline')}</Text>

        <View style={styles.divider} />

        <TouchableOpacity
          style={[styles.googleButton, (isGoogleLoading || !request) && styles.disabled]}
          activeOpacity={0.8}
          onPress={handleGoogleLogin}
          disabled={isGoogleLoading || !request}
        >
          {isGoogleLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.googleButtonText}>{t('auth.continueWithGoogle')}</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.or}>{t('auth.or')}</Text>

        <TouchableOpacity
          style={[styles.guestButton, isGuestLoading && styles.disabled]}
          activeOpacity={0.8}
          onPress={handleGuestLogin}
          disabled={isGuestLoading}
        >
          {isGuestLoading ? (
            <ActivityIndicator color="#9CA3AF" />
          ) : (
            <Text style={styles.guestButtonText}>{t('auth.continueAsGuest')}</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.terms}>{t('auth.terms')}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 360,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#00A3FF',
    letterSpacing: 6,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 12,
    color: '#6B7280',
    letterSpacing: 2,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#1F2937',
    marginVertical: 32,
  },
  googleButton: {
    width: '100%',
    backgroundColor: '#00A3FF',
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  googleButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  or: {
    color: '#4B5563',
    fontSize: 12,
    marginVertical: 16,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  guestButton: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#374151',
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  guestButtonText: {
    color: '#9CA3AF',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  terms: {
    color: '#374151',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 16,
  },
  disabled: {
    opacity: 0.5,
  },
})
