import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors, spacing, fontSize, fontWeight, radius } from '../../constants/tokens'

export interface GuestItem {
  id: string
  first_name: string
  last_name: string | null
  phone: string | null
  table_id: string | null
  is_vip: boolean
  checked_in: boolean
}

interface Props {
  item: GuestItem
  onCheckIn: () => void
}

export function GuestRow({ item, onCheckIn }: Props) {
  return (
    <View style={[styles.card, item.checked_in && styles.checkedIn]}>
      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, item.checked_in && styles.nameChecked]}>
            {item.first_name} {item.last_name || ''}
          </Text>
          {item.is_vip ? <Text style={styles.vip}>★ VIP</Text> : null}
        </View>
        {item.phone ? <Text style={styles.phone}>{item.phone}</Text> : null}
      </View>

      {!item.checked_in ? (
        <TouchableOpacity style={styles.checkInBtn} onPress={onCheckIn}>
          <Text style={styles.checkInText}>Check In</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.checkedBadge}>
          <Text style={styles.checkedText}>✓</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
  },
  checkedIn: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  name: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  nameChecked: {
    textDecorationLine: 'line-through',
  },
  vip: {
    color: colors.accent,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  phone: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  checkInBtn: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.md,
    backgroundColor: colors.accent + '20',
  },
  checkInText: {
    color: colors.accent,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  checkedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.statusGreenBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedText: {
    color: colors.statusGreen,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.base,
  },
})
