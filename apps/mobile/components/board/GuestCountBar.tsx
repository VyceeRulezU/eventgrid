import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, fontSize, fontWeight, radius } from '../../constants/tokens'

interface Props {
  checked: number
  total: number
}

export function GuestCountBar({ checked, total }: Props) {
  const pct = total > 0 ? (checked / total) * 100 : 0
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{checked} / {total} guests arrived</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(pct, 100)}%` }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginBottom: spacing[1],
    fontWeight: fontWeight.medium,
  },
  track: {
    height: 4,
    backgroundColor: colors.surface3,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: radius.full,
  },
})
