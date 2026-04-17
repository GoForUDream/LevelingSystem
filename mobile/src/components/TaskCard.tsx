import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { Task } from '../types/task'

const RANK_COLOR: Record<string, string> = {
  TRIVIAL:  '#6B7280',
  LOW:      '#4ADE80',
  MEDIUM:   '#00A3FF',
  HIGH:     '#A855F7',
  CRITICAL: '#EF4444',
}

interface TaskCardProps {
  task: Task
  onComplete: (taskId: number, expValue: number) => void
  onCancel: (taskId: number) => void
  onEdit: (task: Task) => void
  isCompleting: boolean
  isCancelling: boolean
  isFuture?: boolean
}

export function TaskCard({
  task,
  onComplete,
  onCancel,
  onEdit,
  isCompleting,
  isCancelling,
  isFuture = false,
}: TaskCardProps) {
  const color = RANK_COLOR[task.importance] ?? '#6B7280'

  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={styles.cardContent}>
        <View style={styles.flex1}>
          <Text style={styles.taskTitle} numberOfLines={2}>{task.title}</Text>
          {task.description ? (
            <Text style={styles.taskDesc} numberOfLines={1}>{task.description}</Text>
          ) : null}
          <View style={styles.taskMeta}>
            <Text style={[styles.expText, { color }]}>{task.exp_value} EXP</Text>
            {task.is_recurring ? <Ionicons name="repeat" size={10} color="#6B7280" /> : null}
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit(task)} hitSlop={8}>
            <Ionicons name="create-outline" size={17} color="#6B7280" />
          </TouchableOpacity>

          {!isFuture && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => onCancel(task.id)}
              disabled={isCancelling}
              hitSlop={8}
            >
              {isCancelling
                ? <ActivityIndicator size="small" color="#EF4444" />
                : <Ionicons name="close" size={17} color="#6B7280" />}
            </TouchableOpacity>
          )}

          {!isFuture && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.completeBtn]}
              onPress={() => onComplete(task.id, task.exp_value)}
              disabled={isCompleting}
              hitSlop={8}
            >
              {isCompleting
                ? <ActivityIndicator size="small" color="#00A3FF" />
                : <Ionicons name="checkmark" size={17} color="#00A3FF" />}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}

export function CompletedTaskCard({ task }: { task: Task }) {
  return (
    <View style={[styles.mutedCard, styles.completedBorder]}>
      <View style={styles.cardRow}>
        <View style={styles.iconBox}>
          <Ionicons name="checkmark" size={10} color="#444" />
        </View>
        <View style={styles.flex1}>
          <View>
            <Text style={styles.mutedTitle}>{task.title}</Text>
            <View style={styles.strikethrough} />
          </View>
          <Text style={styles.completedExp}>+{task.exp_earned ?? task.exp_value} EXP</Text>
        </View>
      </View>
    </View>
  )
}

export function CancelledTaskCard({ task }: { task: Task }) {
  const penalty = Math.floor(task.exp_value / 5)
  return (
    <View style={[styles.mutedCard, styles.cancelledBorder]}>
      <View style={styles.cardRow}>
        <View style={[styles.iconBox, { borderColor: 'rgba(239,68,68,0.2)' }]}>
          <Ionicons name="close" size={10} color="rgba(239,68,68,0.4)" />
        </View>
        <View style={styles.flex1}>
          <View>
            <Text style={styles.mutedTitle}>{task.title}</Text>
            <View style={styles.strikethrough} />
          </View>
          <Text style={styles.cancelledExp}>-{penalty} EXP</Text>
        </View>
      </View>
    </View>
  )
}

export function OverdueTaskCard({ task }: { task: Task }) {
  return (
    <View style={[styles.mutedCard, styles.overdueBorder]}>
      <View style={styles.cardRow}>
        <View style={[styles.iconBox, { borderColor: 'rgba(239,68,68,0.3)' }]}>
          <Ionicons name="warning" size={10} color="rgba(239,68,68,0.5)" />
        </View>
        <View style={styles.flex1}>
          <View>
            <Text style={styles.mutedTitle}>{task.title}</Text>
            <View style={styles.strikethrough} />
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Text style={styles.overdueExp}>-{task.exp_value} EXP</Text>
            <Text style={styles.overdueLabel}>OVERDUE</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderLeftWidth: 3,
    marginBottom: 6,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  flex1: { flex: 1 },
  taskTitle: { color: '#D1D5DB', fontSize: 13, fontWeight: '500', letterSpacing: 0.3 },
  taskDesc: { color: '#6B7280', fontSize: 11, marginTop: 2 },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  expText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  actionBtn: { padding: 5, borderRadius: 4 },
  completeBtn: { backgroundColor: 'rgba(0,163,255,0.1)' },
  // Muted card shared
  mutedCard: {
    backgroundColor: '#080808',
    borderWidth: 1,
    marginBottom: 6,
  },
  completedBorder: { borderColor: '#151515' },
  cancelledBorder: { borderColor: 'rgba(239,68,68,0.1)' },
  overdueBorder: { borderColor: 'rgba(239,68,68,0.2)' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 },
  iconBox: { width: 18, height: 18, borderWidth: 1, borderColor: '#333', alignItems: 'center', justifyContent: 'center' },
  mutedTitle: { color: '#3a3a3a', fontSize: 13, fontWeight: '500' },
  strikethrough: { position: 'absolute', top: 7, left: 0, right: 0, height: 1, backgroundColor: '#333' },
  completedExp: { color: '#333', fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  cancelledExp: { color: 'rgba(239,68,68,0.4)', fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  overdueExp: { color: 'rgba(239,68,68,0.5)', fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  overdueLabel: { color: 'rgba(239,68,68,0.4)', fontSize: 10, fontWeight: 'bold', marginTop: 2 },
})
