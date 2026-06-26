import { TouchableOpacity, View, StyleSheet } from 'react-native'
import { colors, spacing, radius } from '../../constants/tokens'

interface Props {
  children: React.ReactNode
  onPress?: () => void
  borderColor?: string
}

export function Card({ children, onPress, borderColor }: Props) {
  if (onPress) {
    return (
      <TouchableOpacity style={[styles.card, borderColor ? { borderColor } : undefined]} onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    )
  }
  return <View style={[styles.card, borderColor ? { borderColor } : undefined]}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
  },
})
