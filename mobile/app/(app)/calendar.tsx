import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../src/contexts/AuthContext'
import { useTranslation } from 'react-i18next'

export default function CalendarScreen() {
  const { user } = useAuth()
  const { t } = useTranslation()

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>LEVELING SYSTEM</Text>
        {user && (
          <Text style={styles.level}>Lv.{user.level_progress.level} · {user.level_progress.rank_title}</Text>
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.placeholder}>📅 Calendar coming soon</Text>
        <Text style={styles.sub}>{t('calendar.newQuest')}</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { color: '#00A3FF', fontWeight: 'bold', fontSize: 14, letterSpacing: 3 },
  level: { color: '#6B7280', fontSize: 11, letterSpacing: 1 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  placeholder: { color: '#4B5563', fontSize: 18 },
  sub: { color: '#374151', fontSize: 12, letterSpacing: 1 },
})
