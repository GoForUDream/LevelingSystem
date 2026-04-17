import { useState, useEffect, useCallback } from 'react'
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator,
  Pressable, FlatList,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { API_URL } from '../constants/api'
import { TaskImportance } from '../types/task'
import { TASK_PRESET_CATEGORIES as taskPresets, type TaskPresetCategory } from '../constants/taskPresets'
import type { Task } from '../types/task'

const RANK_COLORS: Record<string, { text: string; bg: string; border: string; exp: number; subtitle: string; description: string; examples: string }> = {
  TRIVIAL:  { text: '#6B7280', bg: 'rgba(107,114,128,0.15)', border: '#6B7280', exp: 10,  subtitle: 'Quick wins',        description: 'Tasks that take less than 5 minutes.',           examples: 'Drink water, make bed' },
  LOW:      { text: '#4ADE80', bg: 'rgba(74,222,128,0.15)',  border: '#4ADE80', exp: 25,  subtitle: 'Low effort',        description: 'Simple tasks with minimal mental energy.',        examples: 'Reply to message, short walk' },
  MEDIUM:   { text: '#00A3FF', bg: 'rgba(0,163,255,0.15)',   border: '#00A3FF', exp: 50,  subtitle: 'Moderate effort',   description: 'Tasks requiring focused effort, 15–60 minutes.',  examples: 'Meeting prep, cook dinner' },
  HIGH:     { text: '#A855F7', bg: 'rgba(168,85,247,0.15)',  border: '#A855F7', exp: 100, subtitle: 'High impact',       description: 'Significant tasks requiring deep focus.',          examples: 'Complex report, exercise' },
  CRITICAL: { text: '#EF4444', bg: 'rgba(239,68,68,0.15)',   border: '#EF4444', exp: 200, subtitle: 'Critical mission',  description: 'High-stakes, time-sensitive tasks.',               examples: 'Deadline deliverable, major decision' },
}

const IMPORTANCE_LABELS: Record<string, string> = {
  TRIVIAL: 'D', LOW: 'C', MEDIUM: 'B', HIGH: 'A', CRITICAL: 'S',
}

interface GoalOption {
  id: number
  title: string
  rank: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date
  onTaskSaved: () => void
  editTask?: Task | null
}

export default function CreateTaskModal({ isOpen, onClose, selectedDate, onTaskSaved, editTask }: Props) {
  const { token } = useAuth()
  const { t } = useTranslation()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [importance, setImportance] = useState('MEDIUM')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceType, setRecurrenceType] = useState('DAILY')
  const [weeklyDays, setWeeklyDays] = useState<number[]>([])
  const [monthlyDays, setMonthlyDays] = useState<number[]>([])
  const [customInterval, setCustomInterval] = useState(2)
  const [goalId, setGoalId] = useState<number | null>(null)
  const [goals, setGoals] = useState<GoalOption[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Preset picker state
  const [showPresets, setShowPresets] = useState(false)
  const [presetCategory, setPresetCategory] = useState<TaskPresetCategory | null>(null)

  // Goal picker state
  const [showGoalPicker, setShowGoalPicker] = useState(false)

  const isEditMode = !!editTask

  useEffect(() => {
    if (isOpen && token) {
      fetch(`${API_URL}/api/goals`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(setGoals).catch(() => setGoals([]))
    }
  }, [isOpen, token])

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title)
      setDescription(editTask.description ?? '')
      setImportance(editTask.importance)
      setIsRecurring(editTask.is_recurring ?? false)
      setRecurrenceType(editTask.recurrence_type ?? 'DAILY')
      setGoalId(editTask.goal_id ?? null)
      const days: number[] = editTask.recurrence_days ? JSON.parse(editTask.recurrence_days) : []
      if (editTask.recurrence_type === 'WEEKLY') { setWeeklyDays(days); setMonthlyDays([]) }
      else if (editTask.recurrence_type === 'MONTHLY') { setMonthlyDays(days); setWeeklyDays([]) }
      else { setWeeklyDays([]); setMonthlyDays([]) }
      setCustomInterval(editTask.recurrence_interval ?? 2)
    } else {
      setTitle(''); setDescription(''); setImportance('MEDIUM')
      setIsRecurring(false); setRecurrenceType('DAILY')
      setWeeklyDays([]); setMonthlyDays([]); setCustomInterval(2); setGoalId(null)
    }
  }, [editTask, isOpen])

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) { return }
    setIsSubmitting(true)
    try {
      if (isEditMode) {
        const res = await fetch(`${API_URL}/api/tasks/${editTask!.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            title: title.trim(), description: description.trim() || null, importance, goal_id: goalId,
            is_recurring: isRecurring,
            ...(isRecurring ? {
              recurrence_type: recurrenceType,
              recurrence_days: recurrenceType === 'WEEKLY' ? weeklyDays : recurrenceType === 'MONTHLY' ? monthlyDays : null,
              recurrence_interval: recurrenceType === 'CUSTOM' ? customInterval : null,
            } : { recurrence_type: null, recurrence_days: null, recurrence_interval: null }),
          }),
        })
        if (!res.ok) throw new Error()
      } else {
        const dueDate = new Date(selectedDate)
        dueDate.setHours(23, 59, 59, 999)
        const payload: Record<string, unknown> = {
          title: title.trim(), description: description.trim() || null, importance,
          due_date: dueDate.toISOString(), goal_id: goalId,
        }
        if (isRecurring) {
          payload.is_recurring = true
          payload.recurrence_type = recurrenceType
          if (recurrenceType === 'WEEKLY') payload.recurrence_days = weeklyDays
          else if (recurrenceType === 'MONTHLY') payload.recurrence_days = monthlyDays
          if (recurrenceType === 'CUSTOM') payload.recurrence_interval = customInterval
        }
        const res = await fetch(`${API_URL}/api/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error()
      }
      onTaskSaved()
      onClose()
    } catch {
      // TODO: show inline error
    } finally {
      setIsSubmitting(false)
    }
  }, [title, description, importance, isRecurring, recurrenceType, weeklyDays, monthlyDays, customInterval, goalId, isEditMode, editTask, selectedDate, token, onTaskSaved, onClose])

  const selectedRank = RANK_COLORS[importance]
  const displayDate = editTask?.due_date ? new Date(editTask.due_date) : selectedDate

  const DAY_LABELS = [t('tasks.days.mon'), t('tasks.days.tue'), t('tasks.days.wed'), t('tasks.days.thu'), t('tasks.days.fri'), t('tasks.days.sat'), t('tasks.days.sun')]

  return (
    <>
      <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
        <KeyboardAvoidingView
          style={styles.flex1}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={styles.backdrop} onPress={onClose}>
            <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
              {/* Header */}
              <View style={styles.header}>
                <View>
                  <Text style={styles.headerTitle}>
                    {isEditMode ? t('tasks.editQuest') : t('tasks.newQuest')}
                  </Text>
                  <Text style={styles.headerDate}>
                    {displayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} hitSlop={8}>
                  <Ionicons name="close" size={22} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {/* Title + Presets */}
                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>{t('tasks.questName')}</Text>
                    {!isEditMode && (
                      <TouchableOpacity
                        style={styles.presetBtn}
                        onPress={() => { setPresetCategory(null); setShowPresets(true) }}
                      >
                        <Ionicons name="list" size={12} color="#00A3FF" />
                        <Text style={styles.presetBtnText}>PRESETS</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder={t('tasks.questName')}
                    placeholderTextColor="#374151"
                    autoFocus={!isEditMode}
                  />
                </View>

                {/* Description */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>
                    {t('tasks.details')} <Text style={styles.optional}>({t('common.optional')})</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, styles.textarea]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder={t('tasks.detailsPlaceholder')}
                    placeholderTextColor="#374151"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                {/* Importance */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>{t('tasks.rank')}</Text>
                  <View style={styles.rankRow}>
                    {Object.values(TaskImportance).map(val => {
                      const r = RANK_COLORS[val]
                      const active = importance === val
                      return (
                        <TouchableOpacity
                          key={val}
                          style={[
                            styles.rankBtn,
                            active ? { backgroundColor: r.bg, borderColor: r.border } : styles.rankBtnInactive,
                          ]}
                          onPress={() => setImportance(val)}
                        >
                          <Text style={[styles.rankBtnLabel, { color: active ? r.text : '#6B7280' }]}>
                            {IMPORTANCE_LABELS[val]}
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                  {selectedRank && (
                    <View style={[styles.rankDesc, { borderLeftColor: selectedRank.border }]}>
                      <View style={styles.rankDescHeader}>
                        <Text style={styles.rankDescTitle}>{selectedRank.subtitle}</Text>
                        <Text style={[styles.rankDescExp, { color: selectedRank.text }]}>+{selectedRank.exp} EXP</Text>
                      </View>
                      <Text style={styles.rankDescBody}>{selectedRank.description}</Text>
                      <Text style={styles.rankDescExamples}>e.g. {selectedRank.examples}</Text>
                    </View>
                  )}
                </View>

                {/* Recurrence */}
                <View style={styles.fieldGroup}>
                  <TouchableOpacity
                    style={styles.checkRow}
                    onPress={() => setIsRecurring(r => !r)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, isRecurring && styles.checkboxActive]}>
                      {isRecurring && <Ionicons name="checkmark" size={12} color="#fff" />}
                    </View>
                    <Text style={styles.label}>{t('tasks.repeatQuest')}</Text>
                  </TouchableOpacity>

                  {isRecurring && (
                    <View style={styles.recurrenceBox}>
                      {/* Frequency buttons */}
                      <View style={styles.freqRow}>
                        {(['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM'] as const).map(type => (
                          <TouchableOpacity
                            key={type}
                            style={[styles.freqBtn, recurrenceType === type && styles.freqBtnActive]}
                            onPress={() => setRecurrenceType(type)}
                          >
                            <Text style={[styles.freqBtnText, recurrenceType === type && styles.freqBtnTextActive]}>
                              {t(`tasks.recurrence.${type.toLowerCase()}`)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      {/* Weekly day toggles */}
                      {recurrenceType === 'WEEKLY' && (
                        <View>
                          <Text style={styles.subLabel}>{t('tasks.recurrence.repeatOn')}</Text>
                          <View style={styles.dayRow}>
                            {DAY_LABELS.map((label, idx) => (
                              <TouchableOpacity
                                key={idx}
                                style={[styles.dayBtn, weeklyDays.includes(idx) && styles.dayBtnActive]}
                                onPress={() => setWeeklyDays(prev =>
                                  prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx].sort()
                                )}
                              >
                                <Text style={[styles.dayBtnText, weeklyDays.includes(idx) && styles.dayBtnTextActive]}>
                                  {label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      )}

                      {/* Monthly day grid */}
                      {recurrenceType === 'MONTHLY' && (
                        <View>
                          <Text style={styles.subLabel}>{t('tasks.recurrence.repeatOnDays')}</Text>
                          <View style={styles.monthGrid}>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                              <TouchableOpacity
                                key={d}
                                style={[styles.monthDayBtn, monthlyDays.includes(d) && styles.dayBtnActive]}
                                onPress={() => setMonthlyDays(prev =>
                                  prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort((a, b) => a - b)
                                )}
                              >
                                <Text style={[styles.dayBtnText, monthlyDays.includes(d) && styles.dayBtnTextActive]}>
                                  {d}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                          <TouchableOpacity
                            style={[styles.lastDayBtn, monthlyDays.includes(-1) && styles.dayBtnActive]}
                            onPress={() => setMonthlyDays(prev =>
                              prev.includes(-1) ? prev.filter(x => x !== -1) : [...prev, -1].sort((a, b) => a - b)
                            )}
                          >
                            <Text style={[styles.dayBtnText, monthlyDays.includes(-1) && styles.dayBtnTextActive]}>
                              {t('tasks.recurrence.lastDayOfMonth')}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* Custom interval */}
                      {recurrenceType === 'CUSTOM' && (
                        <View style={styles.customRow}>
                          <Text style={styles.subLabel}>{t('tasks.recurrence.every')}</Text>
                          <TextInput
                            style={styles.intervalInput}
                            value={String(customInterval)}
                            onChangeText={v => setCustomInterval(Math.max(1, Math.min(365, Number(v) || 1)))}
                            keyboardType="number-pad"
                          />
                          <Text style={styles.subLabel}>{t('tasks.recurrence.days')}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {/* Link to Goal */}
                {goals.length > 0 && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>
                      {t('tasks.linkToGoal')} <Text style={styles.optional}>({t('common.optional')})</Text>
                    </Text>
                    <TouchableOpacity
                      style={styles.input}
                      onPress={() => setShowGoalPicker(true)}
                    >
                      <Text style={goalId ? styles.inputText : styles.inputPlaceholder}>
                        {goalId
                          ? `[${goals.find(g => g.id === goalId)?.rank}] ${goals.find(g => g.id === goalId)?.title}`
                          : t('tasks.noGoal')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Actions */}
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                    <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.submitBtn, (!title.trim() || isSubmitting) && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={!title.trim() || isSubmitting}
                  >
                    {isSubmitting
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={styles.submitBtnText}>
                          {isEditMode ? t('tasks.saveChanges') : t('tasks.acceptQuest')}
                        </Text>}
                  </TouchableOpacity>
                </View>

                <View style={{ height: 20 }} />
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Preset Picker Modal */}
      <Modal visible={showPresets} transparent animationType="slide" onRequestClose={() => setShowPresets(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShowPresets(false)}>
          <Pressable style={[styles.sheet, { maxHeight: '70%' }]} onPress={e => e.stopPropagation()}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => setPresetCategory(null)}
                disabled={!presetCategory}
                hitSlop={8}
              >
                <Ionicons name="chevron-back" size={22} color={presetCategory ? '#00A3FF' : '#1F2937'} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>
                {presetCategory ? presetCategory.label : 'PRESETS'}
              </Text>
              <TouchableOpacity onPress={() => setShowPresets(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {!presetCategory ? (
              <FlatList
                data={taskPresets}
                keyExtractor={item => item.category}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.presetRow}
                    onPress={() => setPresetCategory(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.presetRowText}>{item.emoji} {item.label}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                  </TouchableOpacity>
                )}
              />
            ) : (
              <FlatList
                data={presetCategory.presets}
                keyExtractor={item => item.title}
                renderItem={({ item }) => {
                  const r = RANK_COLORS[item.importance]
                  return (
                    <TouchableOpacity
                      style={styles.presetRow}
                      onPress={() => {
                        setTitle(item.title)
                        setImportance(item.importance)
                        setShowPresets(false)
                        setPresetCategory(null)
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.flex1}>
                        <View style={styles.presetItemHeader}>
                          <View style={[styles.rankBadge, { borderColor: r.border }]}>
                            <Text style={[styles.rankBadgeText, { color: r.text }]}>{IMPORTANCE_LABELS[item.importance]}</Text>
                          </View>
                          <Text style={styles.presetItemTitle}>{item.title}</Text>
                        </View>
                        {item.description ? (
                          <Text style={styles.presetItemDesc}>{item.description}</Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  )
                }}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Goal Picker Modal */}
      <Modal visible={showGoalPicker} transparent animationType="slide" onRequestClose={() => setShowGoalPicker(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShowGoalPicker(false)}>
          <Pressable style={[styles.sheet, { maxHeight: '60%' }]} onPress={e => e.stopPropagation()}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{t('tasks.linkToGoal')}</Text>
              <TouchableOpacity onPress={() => setShowGoalPicker(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={[{ id: -1, title: t('tasks.noGoal'), rank: '' }, ...goals]}
              keyExtractor={item => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.presetRow, goalId === item.id && { backgroundColor: 'rgba(0,163,255,0.05)' }]}
                  onPress={() => { setGoalId(item.id === -1 ? null : item.id); setShowGoalPicker(false) }}
                  activeOpacity={0.7}
                >
                  {item.rank ? (
                    <Text style={[styles.presetRowText, { color: '#9CA3AF' }]}>
                      [{item.rank}] {item.title}
                    </Text>
                  ) : (
                    <Text style={styles.presetRowText}>{item.title}</Text>
                  )}
                  {(item.id === -1 ? goalId === null : goalId === item.id) && (
                    <Ionicons name="checkmark" size={16} color="#00A3FF" />
                  )}
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0D0D0D',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,163,255,0.3)',
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  headerTitle: { color: '#00A3FF', fontSize: 13, fontWeight: 'bold', letterSpacing: 2, textTransform: 'uppercase' },
  headerDate: { color: '#6B7280', fontSize: 11, marginTop: 2 },
  body: { padding: 20 },
  fieldGroup: { marginBottom: 20 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  label: { color: '#6B7280', fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },
  optional: { color: '#374151', fontWeight: 'normal' },
  input: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#D1D5DB',
    fontSize: 14,
    justifyContent: 'center',
  },
  inputText: { color: '#D1D5DB', fontSize: 14 },
  inputPlaceholder: { color: '#374151', fontSize: 14 },
  textarea: { minHeight: 80, paddingTop: 12 },
  // Rank
  rankRow: { flexDirection: 'row', gap: 4 },
  rankBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  rankBtnInactive: { backgroundColor: '#111827', borderColor: '#1F2937' },
  rankBtnLabel: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  rankDesc: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#111827',
    borderLeftWidth: 2,
    gap: 4,
  },
  rankDescHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rankDescTitle: { color: '#D1D5DB', fontSize: 12, fontWeight: 'bold' },
  rankDescExp: { fontSize: 12, fontWeight: 'bold' },
  rankDescBody: { color: '#6B7280', fontSize: 11 },
  rankDescExamples: { color: '#374151', fontSize: 10 },
  // Recurrence
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 0 },
  checkbox: {
    width: 18, height: 18, borderWidth: 2, borderColor: '#374151',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: '#00A3FF', borderColor: '#00A3FF' },
  recurrenceBox: { marginTop: 12, padding: 12, backgroundColor: '#111827', borderWidth: 1, borderColor: '#1F2937', gap: 12 },
  freqRow: { flexDirection: 'row', gap: 4 },
  freqBtn: {
    flex: 1, paddingVertical: 6, alignItems: 'center',
    backgroundColor: '#1F2937', borderWidth: 1, borderColor: '#374151',
  },
  freqBtnActive: { backgroundColor: '#00A3FF', borderColor: '#00A3FF' },
  freqBtnText: { color: '#6B7280', fontSize: 9, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' },
  freqBtnTextActive: { color: '#fff' },
  subLabel: { color: '#6B7280', fontSize: 10, marginBottom: 8 },
  dayRow: { flexDirection: 'row', gap: 4 },
  dayBtn: {
    flex: 1, height: 34, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1F2937', borderWidth: 1, borderColor: '#374151',
  },
  dayBtnActive: { backgroundColor: '#00A3FF', borderColor: '#00A3FF' },
  dayBtnText: { color: '#6B7280', fontSize: 9, fontWeight: 'bold' },
  dayBtnTextActive: { color: '#fff' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  monthDayBtn: {
    width: '12%', height: 34, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1F2937', borderWidth: 1, borderColor: '#374151',
  },
  lastDayBtn: {
    marginTop: 4, height: 34, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1F2937', borderWidth: 1, borderColor: '#374151',
  },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  intervalInput: {
    width: 60, backgroundColor: '#1F2937', borderWidth: 1, borderColor: '#374151',
    color: '#D1D5DB', fontSize: 14, paddingHorizontal: 8, paddingVertical: 6, textAlign: 'center',
  },
  // Preset button
  presetBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: 'rgba(0,163,255,0.3)',
    paddingHorizontal: 8, paddingVertical: 4,
  },
  presetBtnText: { color: '#00A3FF', fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
  // Preset list rows
  presetRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#111827',
  },
  presetRowText: { color: '#D1D5DB', fontSize: 14 },
  presetItemHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  presetItemTitle: { color: '#D1D5DB', fontSize: 13, fontWeight: '500' },
  presetItemDesc: { color: '#6B7280', fontSize: 11, marginLeft: 28 },
  rankBadge: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2 },
  rankBadgeText: { fontSize: 9, fontWeight: 'bold', letterSpacing: 1 },
  // Actions
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1, borderColor: '#374151',
  },
  cancelBtnText: { color: '#6B7280', fontSize: 13, fontWeight: 'bold', letterSpacing: 1 },
  submitBtn: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    backgroundColor: '#00A3FF',
  },
  submitBtnDisabled: { backgroundColor: 'rgba(0,163,255,0.3)' },
  submitBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold', letterSpacing: 1 },
})
