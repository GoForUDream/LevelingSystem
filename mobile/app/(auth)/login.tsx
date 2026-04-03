import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'

export default function LoginScreen() {
  const { t } = useTranslation()

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo area */}
        <Text style={styles.logo}>⚔</Text>
        <Text style={styles.title}>LEVELING SYSTEM</Text>
        <Text style={styles.tagline}>{t('auth.tagline')}</Text>

        <View style={styles.divider} />

        {/* Google login — will integrate OAuth via expo-web-browser */}
        <TouchableOpacity style={styles.googleButton} activeOpacity={0.8}>
          <Text style={styles.googleButtonText}>{t('auth.continueWithGoogle')}</Text>
        </TouchableOpacity>

        <Text style={styles.or}>{t('auth.or')}</Text>

        <TouchableOpacity style={styles.guestButton} activeOpacity={0.8}>
          <Text style={styles.guestButtonText}>{t('auth.continueAsGuest')}</Text>
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
})
