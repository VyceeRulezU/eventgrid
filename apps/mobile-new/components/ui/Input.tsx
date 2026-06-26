import { TextInput, StyleSheet } from 'react-native'
import { colors, spacing, fontSize, radius } from '../../constants/tokens'

interface Props {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  secureTextEntry?: boolean
  multiline?: boolean
}

export function Input({ value, onChangeText, placeholder, secureTextEntry, multiline }: Props) {
  return (
    <TextInput
      style={[styles.input, multiline && styles.multiline]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      secureTextEntry={secureTextEntry}
      multiline={multiline}
      autoCapitalize="none"
    />
  )
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface2,
    color: colors.textPrimary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    fontSize: fontSize.base,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
})
