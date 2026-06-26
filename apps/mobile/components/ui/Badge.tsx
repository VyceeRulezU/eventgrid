import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing, fontSize, fontWeight, radius } from '../../constants/tokens'

interface Props {
  count: number
  color?: string
}

export function Badge({ count, color = colors.statusRed }: Props) {
  if (count <= 0) return null
  return (
    <View style={[styles.badge, { backgroundColor: color + '20' }]}>
      <Text style={[styles.text, { color }]}>{count}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
})
