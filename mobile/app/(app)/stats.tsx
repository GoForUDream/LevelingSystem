import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
export default function StatsScreen() {
  const { t } = useTranslation()
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}><Text style={styles.text}>📊 {t('stats.title')} coming soon</Text></View>
    </SafeAreaView>
  )
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { color: '#4B5563', fontSize: 16 },
})
