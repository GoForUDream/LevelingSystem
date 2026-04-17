import { Modal, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSkipOnce: () => void
  onCancelAll: () => void
  taskTitle: string
  expPenalty: number
  isLoading: boolean
}

export default function CancelRecurringModal({
  isOpen,
  onClose,
  onSkipOnce,
  onCancelAll,
  taskTitle,
  expPenalty,
  isLoading,
}: Props) {
  const { t } = useTranslation()

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('cancelRecurring.title')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.body}>
            <Text style={styles.taskTitle}>"{taskTitle}"</Text>
            <Text style={styles.description}>{t('cancelRecurring.description')}</Text>

            {/* Skip once */}
            <TouchableOpacity
              style={[styles.option, styles.skipOption]}
              onPress={onSkipOnce}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Ionicons name="play-skip-forward" size={20} color="#00A3FF" style={{ marginTop: 2 }} />
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>{t('cancelRecurring.skipOnce')}</Text>
                <Text style={styles.optionDesc}>{t('cancelRecurring.skipDesc')}</Text>
                <Text style={styles.penaltyText}>{t('cancelRecurring.penalty', { penalty: expPenalty })}</Text>
              </View>
            </TouchableOpacity>

            {/* Cancel all */}
            <TouchableOpacity
              style={[styles.option, styles.cancelOption]}
              onPress={onCancelAll}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Ionicons name="ban" size={20} color="#EF4444" style={{ marginTop: 2 }} />
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>{t('cancelRecurring.cancelAll')}</Text>
                <Text style={styles.optionDesc}>{t('cancelRecurring.cancelAllDesc')}</Text>
                <Text style={styles.penaltyText}>{t('cancelRecurring.penalty', { penalty: expPenalty })}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Loading overlay */}
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color="#00A3FF" />
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modal: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(0,163,255,0.3)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,163,255,0.2)',
  },
  headerTitle: {
    color: '#00A3FF',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  body: { padding: 20, gap: 12 },
  taskTitle: { color: '#D1D5DB', fontSize: 14, marginBottom: 4 },
  description: { color: '#6B7280', fontSize: 12, marginBottom: 8 },
  option: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderWidth: 1,
  },
  skipOption: { borderColor: 'rgba(0,163,255,0.3)', backgroundColor: 'rgba(0,163,255,0.05)' },
  cancelOption: { borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.05)' },
  optionText: { flex: 1, gap: 2 },
  optionTitle: { color: '#D1D5DB', fontSize: 14, fontWeight: 'bold' },
  optionDesc: { color: '#6B7280', fontSize: 12 },
  penaltyText: { color: '#EF4444', fontSize: 11, marginTop: 4 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
