import { useEffect, useRef } from 'react'
import { Modal, View, Text, TouchableOpacity, Animated, StyleSheet, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { BadgeInfo } from '../constants/achievements'

interface Props {
  isOpen: boolean
  onClose: () => void
  badge: BadgeInfo | null
}

function getAccentColor(rankName: string): string {
  if (rankName.includes('S')) return '#E63946'
  if (rankName.includes('A')) return '#FF6B00'
  if (rankName.includes('B')) return '#7B2CBF'
  if (rankName.includes('C')) return '#00A3FF'
  if (rankName.includes('D')) return '#4ADE80'
  return '#808080'
}

export default function BadgeUnlockModal({ isOpen, badge, onClose }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.5)).current
  const glowAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: false }),
            Animated.timing(glowAnim, { toValue: 0.4, duration: 1500, useNativeDriver: false }),
          ])
        ),
      ]).start()
    } else {
      fadeAnim.setValue(0)
      scaleAnim.setValue(0.5)
      glowAnim.stopAnimation()
    }
  }, [isOpen])

  if (!badge) return null

  const accentColor = getAccentColor(badge.rankName)

  return (
    <Modal visible={isOpen} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Glow behind badge */}
          <Animated.View
            style={[
              styles.glow,
              {
                backgroundColor: accentColor,
                opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.3] }),
              },
            ]}
          />

          {/* Header */}
          <View style={styles.headerRow}>
            <Ionicons name="trophy" size={20} color="#FBBF24" />
            <Text style={styles.unlockText}>ACHIEVEMENT UNLOCKED</Text>
            <Ionicons name="trophy" size={20} color="#FBBF24" />
          </View>

          {/* Badge */}
          <Animated.View style={[styles.badgeContainer, { transform: [{ scale: scaleAnim }] }]}>
            <View style={[styles.badgeFrame, { borderColor: accentColor, shadowColor: accentColor }]}>
              {/* Corner accents */}
              {[
                { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 },
                { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 },
                { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 },
                { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 },
              ].map((corner, i) => (
                <View
                  key={i}
                  style={[styles.corner, corner, { borderColor: accentColor }]}
                />
              ))}
              <Ionicons name="trophy" size={80} color={accentColor} />
            </View>
          </Animated.View>

          {/* Rank tag */}
          <View style={[styles.rankTag, { borderColor: accentColor }]}>
            <Text style={[styles.rankTagText, { color: accentColor }]}>{badge.rankName}</Text>
          </View>

          {/* Badge name */}
          <Text style={[styles.badgeName, { color: accentColor }]}>{badge.name}</Text>
          <Text style={styles.category}>{badge.category}</Text>
          <Text style={styles.tagline}>"{badge.tagline}"</Text>

          {/* Continue button */}
          <TouchableOpacity
            style={[styles.continueBtn, { borderColor: accentColor }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={[styles.continueBtnText, { color: accentColor }]}>CONTINUE</Text>
          </TouchableOpacity>
        </Animated.View>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: 12,
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    top: '20%',
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  unlockText: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  badgeContainer: { marginVertical: 12 },
  badgeFrame: {
    padding: 32,
    borderWidth: 2,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 12,
  },
  corner: {
    position: 'absolute',
    width: 16,
    height: 16,
  },
  rankTag: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 4,
  },
  rankTagText: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  badgeName: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },
  category: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  tagline: {
    color: '#D1D5DB',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  continueBtn: {
    borderWidth: 2,
    paddingHorizontal: 40,
    paddingVertical: 14,
    marginTop: 8,
  },
  continueBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
})
