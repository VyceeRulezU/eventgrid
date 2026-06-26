import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { colors, spacing, fontSize, fontWeight, radius } from '../../constants/tokens'

interface Props {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  loading?: boolean
  disabled?: boolean
}

export function Button({ title, onPress, variant = 'primary', loading, disabled }: Props) {
  const bgColor = variant === 'primary' ? colors.accent
    : variant === 'danger' ? colors.statusRed
    : colors.surface2

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: bgColor }, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? colors.textPrimary : colors.textInverse} />
      ) : (
        <Text style={[styles.text, variant === 'secondary' && { color: colors.textPrimary }]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.md,
    padding: spacing[4],
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: colors.textInverse,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
})
