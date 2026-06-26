import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/Button'
import { StatusDot } from '../ui/StatusDot'
import { colors, spacing, fontSize, fontWeight, radius } from '../../constants/tokens'
import type { StatusLevel } from '@naligrid/shared'

interface Props {
  visible: boolean
  stationName: string
  currentStatus: string
  onUpdate: (status: string, note: string) => void
  onClose: () => void
}

const statusOptions: { label: string; value: StatusLevel }[] = [
  { label: 'Ready', value: 'green' },
  { label: 'In Progress', value: 'yellow' },
  { label: 'Delayed', value: 'red' },
  { label: 'Not Started', value: 'grey' },
]

export function StatusUpdateSheet({ visible, stationName, currentStatus, onUpdate, onClose }: Props) {
  const [selected, setSelected] = useState<string>(currentStatus)
  const [note, setNote] = useState('')

  const handleSubmit = () => {
    onUpdate(selected, note)
    setNote('')
    onClose()
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.stationName}>{stationName}</Text>
      <Text style={styles.label}>Status</Text>
      <View style={styles.statusRow}>
        {statusOptions.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.statusChip, selected === opt.value && styles.statusChipSelected]}
            onPress={() => setSelected(opt.value)}
          >
            <StatusDot status={opt.value} size={8} />
            <Text style={[styles.statusChipText, selected === opt.value && styles.statusChipTextSelected]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Status Note</Text>
      <TextInput
        style={styles.input}
        value={note}
        onChangeText={setNote}
        placeholder="e.g. 80% complete, ETA 20m"
        placeholderTextColor={colors.textMuted}
      />

      <Button title="Update Status" onPress={handleSubmit} />
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  stationName: {
    color: colors.textPrimary,
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    marginBottom: spacing[4],
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing[2],
    marginTop: spacing[2],
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing[2],
    flexWrap: 'wrap',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    backgroundColor: colors.surface3,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusChipSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  statusChipText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  statusChipTextSelected: {
    color: colors.accent,
  },
  input: {
    backgroundColor: colors.surface2,
    color: colors.textPrimary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[3],
    fontSize: fontSize.sm,
    marginBottom: spacing[4],
  },
})
